# Invoice Line Item Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional, free-text `notes` field to each invoice line item; render under the description in detail and print views.

**Architecture:** Backend gets a new nullable `notes` text column on `invoice_items`, with model/resource/validation/service plumbing. Recurring invoice `line_items` JSON gains the same optional key, validated and propagated. Frontend mirrors the field through types, the `useLineItems` hook, both invoice forms, the detail view, and the print view. Backend ships first; both directions are backward-compatible.

**Tech Stack:** Laravel 12 (PHP), Eloquent, PHPUnit; Next.js 16, React 19, TypeScript, Tailwind, vitest.

**Spec:** `docs/superpowers/specs/2026-05-07-invoice-line-item-notes-design.md` (in the frontend repo).

**Repos:**
- Backend: `/Users/kevin/Documents/Projects/internal/accounting-backend`
- Frontend: `/Users/kevin/Documents/Projects/internal/accounting-frontend`

> **Working directory note:** All relative paths in backend tasks (Tasks 1–5) are relative to the backend repo. Frontend tasks (6–12) are relative to the frontend repo. `cd` into the appropriate repo before running commands.

---

## Phase 1 — Backend (Laravel)

### Task 1: Migration — add `notes` column to `invoice_items`

**Files:**
- Create: `database/migrations/2026_05_07_000000_add_notes_to_invoice_items_table.php`

- [ ] **Step 1: Create the migration file**

Create `database/migrations/2026_05_07_000000_add_notes_to_invoice_items_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropColumn('notes');
        });
    }
};
```

- [ ] **Step 2: Run the migration**

Run: `php artisan migrate`
Expected output: `INFO  Running migrations.` followed by `2026_05_07_000000_add_notes_to_invoice_items_table ...... DONE`

- [ ] **Step 3: Verify column exists**

Run: `php artisan tinker --execute="echo \Schema::hasColumn('invoice_items', 'notes') ? 'YES' : 'NO';"`
Expected output: `YES`

- [ ] **Step 4: Commit**

```bash
git add database/migrations/2026_05_07_000000_add_notes_to_invoice_items_table.php
git commit -m "feat(invoices): add notes column to invoice_items table"
```

---

### Task 2: Plumb `notes` through model, resource, and service

This task uses TDD: write the round-trip test first, watch it fail, then make it pass with model/resource/service changes.

**Files:**
- Modify: `app/Models/InvoiceItem.php`
- Modify: `app/Http/Resources/InvoiceItemResource.php`
- Modify: `app/Services/InvoiceService.php`
- Modify: `app/Http/Requests/Invoice/StoreInvoiceRequest.php`
- Modify: `app/Http/Requests/Invoice/UpdateInvoiceRequest.php`
- Test: `tests/Feature/Http/Controllers/InvoiceControllerTest.php`

- [ ] **Step 1: Write the failing test**

Append the following test method to `tests/Feature/Http/Controllers/InvoiceControllerTest.php` (inside the existing class, before the closing `}`):

```php
    public function test_store_persists_and_returns_item_notes(): void
    {
        $customer = Customer::factory()->create();

        $response = $this->postJson('/api/v1/invoices', [
            'customer_id' => $customer->id,
            'invoice_date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(7)->format('Y-m-d'),
            'tax_rate' => 0,
            'items' => [
                [
                    'description' => 'Web hosting',
                    'notes' => 'Includes 100GB storage and SSL cert',
                    'quantity' => 1,
                    'unit_price' => 50,
                ],
                [
                    'description' => 'Domain renewal',
                    'quantity' => 1,
                    'unit_price' => 12,
                ],
            ],
        ]);

        $response->assertStatus(201);
        $items = $response->json('data.items');
        $this->assertCount(2, $items);
        $this->assertSame('Includes 100GB storage and SSL cert', $items[0]['notes']);
        $this->assertNull($items[1]['notes']);
    }
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `php artisan test --filter=test_store_persists_and_returns_item_notes`
Expected: FAIL — either the response does not include a `notes` key, or notes is null when it shouldn't be.

- [ ] **Step 3: Add `notes` to model `$fillable`**

Edit `app/Models/InvoiceItem.php` — change the `$fillable` array from:

```php
    protected $fillable = [
        'invoice_id',
        'description',
        'quantity',
        'unit_price',
        'amount',
        'sort_order',
    ];
```

to:

```php
    protected $fillable = [
        'invoice_id',
        'description',
        'notes',
        'quantity',
        'unit_price',
        'amount',
        'sort_order',
    ];
```

- [ ] **Step 4: Expose `notes` in `InvoiceItemResource`**

Edit `app/Http/Resources/InvoiceItemResource.php` — change the array returned from `toArray` from:

```php
        return [
            'id' => $this->id,
            'description' => $this->description,
            'quantity' => (float) $this->quantity,
            'unit_price' => (float) $this->unit_price,
            'amount' => (float) $this->amount,
        ];
```

to:

```php
        return [
            'id' => $this->id,
            'description' => $this->description,
            'notes' => $this->notes,
            'quantity' => (float) $this->quantity,
            'unit_price' => (float) $this->unit_price,
            'amount' => (float) $this->amount,
        ];
```

- [ ] **Step 5: Pass `notes` through `InvoiceService::syncItems`**

Edit `app/Services/InvoiceService.php` — in the `syncItems` method (around line 244), change the row builder from:

```php
        $rows = [];
        foreach ($items as $index => $itemData) {
            $rows[] = [
                'description' => $itemData['description'],
                'quantity' => $itemData['quantity'],
                'unit_price' => $itemData['unit_price'],
                'sort_order' => $index,
            ];
        }
```

to:

```php
        $rows = [];
        foreach ($items as $index => $itemData) {
            $notes = $itemData['notes'] ?? null;
            if (is_string($notes) && trim($notes) === '') {
                $notes = null;
            }

            $rows[] = [
                'description' => $itemData['description'],
                'notes' => $notes,
                'quantity' => $itemData['quantity'],
                'unit_price' => $itemData['unit_price'],
                'sort_order' => $index,
            ];
        }
```

- [ ] **Step 6: Add validation rules for `notes`**

Edit `app/Http/Requests/Invoice/StoreInvoiceRequest.php` — change the rules array from:

```php
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:200'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
```

to:

```php
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:200'],
            'items.*.notes' => ['nullable', 'string', 'max:2000'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
```

Apply the same change to `app/Http/Requests/Invoice/UpdateInvoiceRequest.php` (insert the same `'items.*.notes'` line in the same place).

- [ ] **Step 7: Run the test to verify it passes**

Run: `php artisan test --filter=test_store_persists_and_returns_item_notes`
Expected: PASS

- [ ] **Step 8: Run the full invoice controller test suite to confirm nothing else broke**

Run: `php artisan test --filter=InvoiceControllerTest`
Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add app/Models/InvoiceItem.php \
        app/Http/Resources/InvoiceItemResource.php \
        app/Services/InvoiceService.php \
        app/Http/Requests/Invoice/StoreInvoiceRequest.php \
        app/Http/Requests/Invoice/UpdateInvoiceRequest.php \
        tests/Feature/Http/Controllers/InvoiceControllerTest.php
git commit -m "feat(invoices): persist and expose notes per line item"
```

---

### Task 3: Empty-string notes normalize to null on update

**Files:**
- Test: `tests/Feature/Http/Controllers/InvoiceControllerTest.php`

The normalization is already implemented in Task 2 step 5. This task adds explicit test coverage so the behavior doesn't regress.

- [ ] **Step 1: Write the failing test**

Append to `tests/Feature/Http/Controllers/InvoiceControllerTest.php`:

```php
    public function test_update_clears_item_notes_when_empty_string_sent(): void
    {
        $customer = Customer::factory()->create();

        // Create draft invoice with a note
        $createResponse = $this->postJson('/api/v1/invoices', [
            'customer_id' => $customer->id,
            'invoice_date' => now()->format('Y-m-d'),
            'tax_rate' => 0,
            'items' => [
                ['description' => 'A', 'notes' => 'original note', 'quantity' => 1, 'unit_price' => 10],
            ],
        ]);

        $invoiceId = $createResponse->json('data.id');

        // Update sending an empty notes string
        $updateResponse = $this->putJson("/api/v1/invoices/{$invoiceId}", [
            'items' => [
                ['description' => 'A', 'notes' => '   ', 'quantity' => 1, 'unit_price' => 10],
            ],
        ]);

        $updateResponse->assertStatus(200);
        $this->assertNull($updateResponse->json('data.items.0.notes'));
    }
```

- [ ] **Step 2: Run the test**

Run: `php artisan test --filter=test_update_clears_item_notes_when_empty_string_sent`
Expected: PASS (the normalization from Task 2 step 5 already handles this).

If it fails, recheck Task 2 step 5 — the `trim($notes) === ''` branch should set `$notes = null`.

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Http/Controllers/InvoiceControllerTest.php
git commit -m "test(invoices): empty-string item notes normalize to null"
```

---

### Task 4: Validation rejects oversize item notes

**Files:**
- Test: `tests/Feature/Http/Controllers/InvoiceControllerTest.php`

The 2000-char `max` rule was added in Task 2 step 6. This task pins the behavior with an explicit test.

- [ ] **Step 1: Write the failing test**

Append to `tests/Feature/Http/Controllers/InvoiceControllerTest.php`:

```php
    public function test_store_rejects_item_notes_longer_than_2000_chars(): void
    {
        $customer = Customer::factory()->create();

        $response = $this->postJson('/api/v1/invoices', [
            'customer_id' => $customer->id,
            'invoice_date' => now()->format('Y-m-d'),
            'tax_rate' => 0,
            'items' => [
                [
                    'description' => 'X',
                    'notes' => str_repeat('a', 2001),
                    'quantity' => 1,
                    'unit_price' => 10,
                ],
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['items.0.notes']);
    }
```

- [ ] **Step 2: Run the test**

Run: `php artisan test --filter=test_store_rejects_item_notes_longer_than_2000_chars`
Expected: PASS (rule from Task 2 step 6 enforces this).

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Http/Controllers/InvoiceControllerTest.php
git commit -m "test(invoices): reject item notes over 2000 chars"
```

---

### Task 5: Recurring invoice line items propagate notes

**Files:**
- Modify: `app/Http/Requests/RecurringInvoice/StoreRecurringInvoiceRequest.php`
- Modify: `app/Http/Requests/RecurringInvoice/UpdateRecurringInvoiceRequest.php`
- Test: `tests/Feature/Services/RecurringInvoiceServiceTest.php`

`RecurringInvoiceService::generateInvoice` already forwards `line_items` as `items` into `InvoiceService::create`. The only work is tightening validation and adding test coverage.

- [ ] **Step 1: Write the failing test**

Append the following test method to `tests/Feature/Services/RecurringInvoiceServiceTest.php` (inside the class, before the closing `}`):

```php
    public function test_processScheduledInvoices_propagates_item_notes_to_generated_invoice(): void
    {
        $schedule = $this->activeSchedule([
            'line_items' => [
                ['description' => 'Svc', 'notes' => 'Recurring note', 'quantity' => 1, 'unit_price' => 100, 'amount' => 100],
                ['description' => 'Other', 'quantity' => 2, 'unit_price' => 50, 'amount' => 100],
            ],
        ]);

        app(RecurringInvoiceService::class)->processScheduledInvoices();

        $invoice = $schedule->fresh()->invoices()->with('items')->latest()->first();
        $this->assertNotNull($invoice);
        $items = $invoice->items->sortBy('sort_order')->values();
        $this->assertSame('Recurring note', $items[0]->notes);
        $this->assertNull($items[1]->notes);
    }
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `php artisan test --filter=test_processScheduledInvoices_propagates_item_notes_to_generated_invoice`
Expected: PASS — the change in Task 2 step 5 already forwards notes through `syncItems`.

If it fails because `notes` is missing from the JSON cast on the recurring side, double-check that `RecurringInvoice::$casts` has `'line_items' => 'array'` (it does, line 41 of `app/Models/RecurringInvoice.php`).

- [ ] **Step 3: Tighten validation in `StoreRecurringInvoiceRequest`**

Edit `app/Http/Requests/RecurringInvoice/StoreRecurringInvoiceRequest.php` — replace the rules array with:

```php
        return [
            'customer_id' => ['required', 'exists:customers,id'],
            'title' => ['required', 'string', 'max:255'],
            'recurrence_type' => ['required', Rule::enum(RecurrenceType::class)],
            'recurrence_interval' => ['required', 'integer', 'min:1'],
            'recurrence_unit' => ['nullable', Rule::enum(RecurrenceUnit::class)],
            'total_count' => ['nullable', 'integer', 'min:1'],
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'line_items' => ['required', 'array', 'min:1'],
            'line_items.*.description' => ['required', 'string', 'max:200'],
            'line_items.*.notes' => ['nullable', 'string', 'max:2000'],
            'line_items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'line_items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'tax_rate' => ['required', 'numeric'],
            'currency' => ['required', 'string', 'size:3'],
            'due_date_offset' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
```

- [ ] **Step 4: Tighten validation in `UpdateRecurringInvoiceRequest`**

Edit `app/Http/Requests/RecurringInvoice/UpdateRecurringInvoiceRequest.php` — replace the rules array with:

```php
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'recurrence_type' => ['sometimes', Rule::enum(RecurrenceType::class)],
            'recurrence_interval' => ['sometimes', 'integer', 'min:1'],
            'recurrence_unit' => ['nullable', Rule::enum(RecurrenceUnit::class)],
            'total_count' => ['nullable', 'integer', 'min:1'],
            'start_date' => ['sometimes', 'date'],
            'line_items' => ['sometimes', 'array', 'min:1'],
            'line_items.*.description' => ['required_with:line_items', 'string', 'max:200'],
            'line_items.*.notes' => ['nullable', 'string', 'max:2000'],
            'line_items.*.quantity' => ['required_with:line_items', 'numeric', 'gt:0'],
            'line_items.*.unit_price' => ['required_with:line_items', 'numeric', 'min:0'],
            'tax_rate' => ['sometimes', 'numeric'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'due_date_offset' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::enum(RecurringStatus::class)],
        ];
```

- [ ] **Step 5: Run the full backend test suite**

Run: `php artisan test`
Expected: all tests pass. Pay attention to anything in `RecurringInvoiceServiceTest`, `InvoiceControllerTest`, and `ProcessRecurringInvoicesTest`.

If a previously-passing recurring invoice test now fails because it sent `line_items` without per-item rules, update those test fixtures to include valid `description`, `quantity`, `unit_price`. Do not loosen the new validation rules — they are intentional.

- [ ] **Step 6: Commit**

```bash
git add app/Http/Requests/RecurringInvoice/StoreRecurringInvoiceRequest.php \
        app/Http/Requests/RecurringInvoice/UpdateRecurringInvoiceRequest.php \
        tests/Feature/Services/RecurringInvoiceServiceTest.php
git commit -m "feat(recurring): validate and propagate item notes"
```

---

## Phase 2 — Frontend (Next.js)

Switch to the frontend repo: `cd /Users/kevin/Documents/Projects/internal/accounting-frontend`.

### Task 6: Add `notes` to invoice types

**Files:**
- Modify: `types/invoice.ts`

- [ ] **Step 1: Update `InvoiceItem` and `InvoiceItemFormData`**

Edit `types/invoice.ts` — change the `InvoiceItem` interface from:

```ts
export interface InvoiceItem {
    id?: number;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
}
```

to:

```ts
export interface InvoiceItem {
    id?: number;
    description: string;
    notes?: string | null;
    quantity: number;
    unit_price: number;
    amount: number;
}
```

And change the `InvoiceItemFormData` interface from:

```ts
export interface InvoiceItemFormData {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
}
```

to:

```ts
export interface InvoiceItemFormData {
    description: string;
    notes?: string;
    quantity: number;
    unit_price: number;
    amount: number;
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `npx tsc --noEmit`
Expected: no errors. (TypeScript will also catch breakage in later tasks if anything depends on these types in ways we haven't updated yet.)

- [ ] **Step 3: Commit**

```bash
git add types/invoice.ts
git commit -m "feat(types): add optional notes to invoice line items"
```

---

### Task 7: Update `useLineItems` hook to handle `notes`

**Files:**
- Modify: `lib/hooks/useLineItems.ts`

- [ ] **Step 1: Update the hook**

Edit `lib/hooks/useLineItems.ts` — replace the entire file contents with:

```ts
'use client';

import { useCallback, useMemo, useState } from 'react';
import { InvoiceItemFormData } from '@/types';

const emptyItem: InvoiceItemFormData = {
    description: '',
    notes: '',
    quantity: 1,
    unit_price: 0,
    amount: 0,
};

export interface UseLineItemsOptions {
    initial?: InvoiceItemFormData[];
    taxRate?: number;
}

const STRING_FIELDS = new Set<keyof InvoiceItemFormData>(['description', 'notes']);

export function useLineItems({ initial, taxRate = 0 }: UseLineItemsOptions = {}) {
    const [items, setItems] = useState<InvoiceItemFormData[]>(
        initial && initial.length > 0 ? initial : [{ ...emptyItem }]
    );

    const replaceAll = useCallback((next: InvoiceItemFormData[]) => {
        setItems(next.length > 0 ? next : [{ ...emptyItem }]);
    }, []);

    const updateItem = useCallback(
        (index: number, field: keyof InvoiceItemFormData, value: string | number) => {
            setItems((prev) => {
                const next = [...prev];
                const updated: InvoiceItemFormData = {
                    ...next[index],
                    [field]: STRING_FIELDS.has(field) ? value : Number(value),
                };
                updated.amount = updated.quantity * updated.unit_price;
                next[index] = updated;
                return next;
            });
        },
        []
    );

    const addItem = useCallback(() => {
        setItems((prev) => [...prev, { ...emptyItem }]);
    }, []);

    const removeItem = useCallback((index: number) => {
        setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
    }, []);

    const subtotal = useMemo(
        () => items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
        [items]
    );
    const tax = useMemo(() => (subtotal * taxRate) / 100, [subtotal, taxRate]);
    const total = useMemo(() => subtotal + tax, [subtotal, tax]);

    return { items, setItems: replaceAll, updateItem, addItem, removeItem, subtotal, tax, total };
}
```

The change replaces the inline `field === 'description' ? value : Number(value)` branch with a `STRING_FIELDS` set so that `notes` and `description` both stay as strings while numeric fields are coerced.

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/hooks/useLineItems.ts
git commit -m "feat(useLineItems): support notes string field on line items"
```

---

### Task 8: Add notes input to `InvoiceForm`

**Files:**
- Modify: `components/invoices/InvoiceForm.tsx`

- [ ] **Step 1: Wire `notes` into the initial-items mapper**

Find the block that maps `invoice.items` to form initial state (around line 59):

```tsx
            invoice.items.map((item) => ({
                description: item.description,
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price),
                amount: Number(item.quantity) * Number(item.unit_price),
            }))
```

Change it to:

```tsx
            invoice.items.map((item) => ({
                description: item.description,
                notes: item.notes ?? '',
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price),
                amount: Number(item.quantity) * Number(item.unit_price),
            }))
```

- [ ] **Step 2: Add the notes Textarea below each line item row**

Find the `items.map((item, index) => ( ... ))` block (around line 228). The current `<div>` containing the row is `className="grid grid-cols-12 gap-4 items-center"`. Wrap it in a parent that holds both the row and a notes textarea.

Replace:

```tsx
                        {items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-5">
                                    <Input
                                        type="text"
                                        placeholder="Item description"
                                        value={item.description}
                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        type="number"
                                        min="1"
                                        className="text-right"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="text-right"
                                        value={item.unit_price}
                                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                    />
                                </div>
                                <span className="col-span-2 text-right font-medium">
                                    {formatCurrency(item.quantity * item.unit_price, currency)}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(index)}
                                    disabled={items.length === 1}
                                    className="col-span-1"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
```

with:

```tsx
                        {items.map((item, index) => (
                            <div key={index} className="space-y-2">
                                <div className="grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-5">
                                        <Input
                                            type="text"
                                            placeholder="Item description"
                                            value={item.description}
                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            type="number"
                                            min="1"
                                            className="text-right"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="text-right"
                                            value={item.unit_price}
                                            onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                        />
                                    </div>
                                    <span className="col-span-2 text-right font-medium">
                                        {formatCurrency(item.quantity * item.unit_price, currency)}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeItem(index)}
                                        disabled={items.length === 1}
                                        className="col-span-1"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-11">
                                        <Textarea
                                            rows={2}
                                            placeholder="Optional notes shown on the invoice"
                                            value={item.notes ?? ''}
                                            onChange={(e) => updateItem(index, 'notes', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
```

`Textarea` is already imported at the top of the file.

- [ ] **Step 3: Verify type-check and run dev server**

Run: `npx tsc --noEmit`
Expected: no errors.

Then start the dev server: `npm run dev` (in a separate terminal). Open the new-invoice page, add a line item, type into the notes field, confirm it edits independently per row, save the invoice, reload, confirm notes persisted and editable on edit.

- [ ] **Step 4: Commit**

```bash
git add components/invoices/InvoiceForm.tsx
git commit -m "feat(invoice-form): notes textarea per line item"
```

---

### Task 9: Add notes input to `RecurringInvoiceForm`

**Files:**
- Modify: `components/recurring/RecurringInvoiceForm.tsx`

- [ ] **Step 1: Wire `notes` into the initial-items mapper**

Find the block (around line 83) that maps existing `data.line_items`:

```tsx
            Array.isArray(data.line_items)
                ? data.line_items.map((item: InvoiceItemFormData) => ({
                      description: item.description || '',
                      quantity: Number(item.quantity) || 1,
                      unit_price: Number(item.unit_price) || 0,
                      amount: (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
                  }))
```

Change it to:

```tsx
            Array.isArray(data.line_items)
                ? data.line_items.map((item: InvoiceItemFormData) => ({
                      description: item.description || '',
                      notes: item.notes ?? '',
                      quantity: Number(item.quantity) || 1,
                      unit_price: Number(item.unit_price) || 0,
                      amount: (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
                  }))
```

- [ ] **Step 2: Add the notes Textarea below each line item row**

Find the `items.map((item, index) => ( ... ))` block (around line 282). Replace the existing item row with a wrapped version that adds a notes textarea below.

Replace:

```tsx
                    {items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-5">
                                <Input
                                    placeholder="Description"
                                    value={item.description}
                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                />
                            </div>
                            <div className="col-span-2">
                                <Input
                                    type="number"
                                    placeholder="Qty"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                />
                            </div>
                            <div className="col-span-2">
                                <Input
                                    type="number"
                                    placeholder="Price"
                                    value={item.unit_price}
                                    onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                />
                            </div>
                            <div className="col-span-2 text-right font-medium">
                                {formatCurrency(item.amount, currency)}
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
```

with:

```tsx
                    {items.map((item, index) => (
                        <div key={index} className="space-y-2">
                            <div className="grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-5">
                                    <Input
                                        placeholder="Description"
                                        value={item.description}
                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        type="number"
                                        placeholder="Qty"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        type="number"
                                        placeholder="Price"
                                        value={item.unit_price}
                                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2 text-right font-medium">
                                    {formatCurrency(item.amount, currency)}
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-11">
                                    <Textarea
                                        rows={2}
                                        placeholder="Optional notes shown on the invoice"
                                        value={item.notes ?? ''}
                                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
```

- [ ] **Step 3: Ensure `Textarea` is imported**

Check the import block at the top of the file. If `Textarea` is not in the `from '@/components/ui'` import, add it. The line should look like:

```tsx
import { Button, Input, Textarea } from '@/components/ui';
```

(Adjust to whatever is already imported — just add `Textarea`.)

- [ ] **Step 4: Verify type-check and dev server**

Run: `npx tsc --noEmit`
Expected: no errors.

Test in browser: navigate to a customer, create a recurring invoice with a notes-bearing line item, save, reload edit page, confirm notes persisted.

- [ ] **Step 5: Commit**

```bash
git add components/recurring/RecurringInvoiceForm.tsx
git commit -m "feat(recurring-form): notes textarea per line item"
```

---

### Task 10: Render notes under description in `InvoiceDetail`

**Files:**
- Modify: `components/invoices/InvoiceDetail.tsx`

- [ ] **Step 1: Update item row rendering**

Find the `invoice.items.map((item) => ( ... ))` block (around line 201). Change the description cell from:

```tsx
                                    <tr key={item.id}>
                                        <td className="py-3 text-foreground">{item.description}</td>
                                        <td className="py-3 text-right text-muted-foreground">{item.quantity}</td>
                                        <td className="py-3 text-right text-muted-foreground">{formatCurrency(item.unit_price, invoice.currency)}</td>
                                        <td className="py-3 text-right font-medium text-foreground">{formatCurrency(item.amount, invoice.currency)}</td>
                                    </tr>
```

to:

```tsx
                                    <tr key={item.id}>
                                        <td className="py-3 text-foreground">
                                            <div>{item.description}</div>
                                            {item.notes && (
                                                <div className="text-sm text-muted-foreground whitespace-pre-line mt-1">
                                                    {item.notes}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 text-right text-muted-foreground align-top">{item.quantity}</td>
                                        <td className="py-3 text-right text-muted-foreground align-top">{formatCurrency(item.unit_price, invoice.currency)}</td>
                                        <td className="py-3 text-right font-medium text-foreground align-top">{formatCurrency(item.amount, invoice.currency)}</td>
                                    </tr>
```

`align-top` keeps the numeric cells aligned to the top when the description cell grows due to notes. `whitespace-pre-line` preserves user-entered line breaks.

- [ ] **Step 2: Verify type-check and visual check**

Run: `npx tsc --noEmit`
Expected: no errors.

Visit a saved invoice with notes — confirm notes appear under the description in muted style, and that the amount column stays top-aligned.

- [ ] **Step 3: Commit**

```bash
git add components/invoices/InvoiceDetail.tsx
git commit -m "feat(invoice-detail): show notes under each line item"
```

---

### Task 11: Render notes under description in `InvoicePrintView`

**Files:**
- Modify: `components/invoices/InvoicePrintView.tsx`

- [ ] **Step 1: Update the description cell in the items table**

Find the items table body (around line 151). Change the description cell from:

```tsx
                            {invoice.items?.map((item, index) => (
                                <tr key={index}>
                                    <td className="py-2 px-2 text-red-500 border-b border-gray-200">{item.description}</td>
                                    <td className="py-2 px-2 text-center text-red-500 border-b border-gray-200">{item.quantity ?? 1}</td>
                                    <td className="py-2 px-2 text-right text-red-500 border-b border-gray-200">
                                        {formatCurrency(item.unit_price ?? item.amount, invoice.currency)}
                                    </td>
                                    <td className="py-2 px-2 text-right text-red-500 border-b border-gray-200">
                                        {formatCurrency(item.amount, invoice.currency)}
                                    </td>
                                </tr>
                            ))}
```

to:

```tsx
                            {invoice.items?.map((item, index) => (
                                <tr key={index}>
                                    <td className="py-2 px-2 text-red-500 border-b border-gray-200 align-top">
                                        <div>{item.description}</div>
                                        {item.notes && (
                                            <div className="text-[9px] text-gray-600 whitespace-pre-line mt-1">
                                                {item.notes}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-2 px-2 text-center text-red-500 border-b border-gray-200 align-top">{item.quantity ?? 1}</td>
                                    <td className="py-2 px-2 text-right text-red-500 border-b border-gray-200 align-top">
                                        {formatCurrency(item.unit_price ?? item.amount, invoice.currency)}
                                    </td>
                                    <td className="py-2 px-2 text-right text-red-500 border-b border-gray-200 align-top">
                                        {formatCurrency(item.amount, invoice.currency)}
                                    </td>
                                </tr>
                            ))}
```

The notes line uses `text-[9px] text-gray-600` to match the existing print-view convention of explicit small fonts and gray subtext. `align-top` ensures numeric cells stay top-aligned when notes wrap.

- [ ] **Step 2: Verify type-check and print preview**

Run: `npx tsc --noEmit`
Expected: no errors.

Open an invoice with notes, click the print/preview button, confirm notes render under the description in small gray text and the layout still looks right.

- [ ] **Step 3: Commit**

```bash
git add components/invoices/InvoicePrintView.tsx
git commit -m "feat(invoice-print): show notes under each line item"
```

---

### Task 12: Final verification

- [ ] **Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors related to changed files.

- [ ] **Step 3: Run unit tests**

Run: `npm run test:run`
Expected: existing tests still pass (no new frontend tests were added in this plan).

- [ ] **Step 4: End-to-end manual smoke**

With backend running locally:
1. Create a manual invoice with two line items, one with notes, one without. Save as draft. Confirm the draft shows the note in detail view.
2. Edit the draft, change the note, clear the second item's note (should remain absent), save. Confirm changes persisted.
3. Open the print preview — confirm notes render under their descriptions, and rows without notes look unchanged.
4. Create a recurring invoice schedule with a notes-bearing line item. Trigger manual generation (or wait for the cron). Confirm the generated invoice's items table shows the note.

- [ ] **Step 5: No final commit**

No code changed in this task — it is verification only.

---

## Self-Review Checklist (writer-only — do not include in execution)

The author of this plan ran the spec self-review:

1. **Spec coverage:** Migration, model, resource, validation (invoice + recurring), service notes pass-through, empty-string normalization, frontend types/hook/forms/detail/print — all mapped to tasks. ✓
2. **Placeholder scan:** No TBD, TODO, or "implement appropriate X" placeholders. All code is concrete. ✓
3. **Type consistency:** `notes?: string | null` on `InvoiceItem`, `notes?: string` on `InvoiceItemFormData`, used consistently in form mappers (`item.notes ?? ''`) and in renders (`item.notes && ...`). Backend rule consistently `nullable|string|max:2000` across both invoice request files and both recurring request files. ✓
4. **Ambiguity check:** Print view explicitly uses `text-[9px] text-gray-600` (matches existing file conventions); detail view explicitly uses design-system tokens (`text-sm text-muted-foreground`). ✓
