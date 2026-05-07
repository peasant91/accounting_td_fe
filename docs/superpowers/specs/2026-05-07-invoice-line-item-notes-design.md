# Optional notes per invoice line item — design

**Date:** 2026-05-07
**Scope:** Backend (Laravel) + Frontend (Next.js)
**Repos:**
- Backend: `/Users/kevin/Documents/Projects/internal/accounting-backend`
- Frontend: `/Users/kevin/Documents/Projects/internal/accounting-frontend`

## Goal

Allow an optional, free-text `notes` field on each invoice line item. The notes
print on the invoice underneath the item description so users can capture
detail (scope, period covered, asset specifics, etc.) without polluting the
short item description.

## Non-goals

- Rich text or formatting in notes. Plain text only.
- A new label entry in `InvoiceTemplate` for the notes line — it renders
  inline under each item with no header.
- Backfilling existing rows. New column is nullable; existing items stay
  `NULL` and behave exactly as today.
- Changing the existing `description` field semantics, length, or naming.

## Shape

```
Description                 Qty    Price    Amount
Web hosting                  1     50.00    50.00
  Includes 100GB storage and SSL cert
Domain renewal               1     12.00    12.00
```

The second line is `notes`. It only renders when non-empty.

## Backend changes (`accounting-backend`)

### Migration

New migration `2026_05_07_xxxxxx_add_notes_to_invoice_items_table.php`:

- `invoice_items` → add nullable `text` column `notes` after `description`.
- Reverse drops the column.

### Model

`app/Models/InvoiceItem.php`:

- Add `'notes'` to `$fillable`.
- No cast needed (TEXT → string).

### Resource

`app/Http/Resources/InvoiceItemResource.php`:

- Return `'notes' => $this->notes` (nullable string).

### Validation

`app/Http/Requests/Invoice/StoreInvoiceRequest.php` and
`UpdateInvoiceRequest.php`:

- Add rule `'items.*.notes' => ['nullable', 'string', 'max:2000']`.

`app/Http/Requests/RecurringInvoice/StoreRecurringInvoiceRequest.php` and
`UpdateRecurringInvoiceRequest.php`:

- Currently only enforces `'line_items' => ['required'|'sometimes', 'array']`
  with no nested rules. Add nested rules to keep parity with the invoice
  request:
  - `line_items.*.description` → required string max:200
  - `line_items.*.quantity` → required numeric gt:0
  - `line_items.*.unit_price` → required numeric min:0
  - `line_items.*.notes` → nullable string max:2000

### Service

`app/Services/InvoiceService.php` — `syncItems()`:

- Include `'notes' => $itemData['notes'] ?? null` in the row payload built for
  `createMany()`.

`app/Services/RecurringInvoiceService.php`:

- No code change. It already forwards `$locked->line_items` as `items` to
  `InvoiceService::create`. Once `syncItems` reads `notes`, recurring-generated
  invoices propagate notes automatically.

### Tests

Extend feature tests covering invoice and recurring invoice flows:

- Create invoice with `items[].notes` round-trips via API (request → DB → response).
- Update invoice replaces notes correctly (including clearing to null).
- Recurring invoice `line_items[].notes` is validated and propagates into
  generated invoices.
- Items with no notes still work (notes is null in response).

## Frontend changes (`accounting-frontend`)

### Types

`types/invoice.ts`:

- `InvoiceItem` → add `notes?: string | null`.
- `InvoiceItemFormData` → add `notes?: string`.

### Hook

`lib/hooks/useLineItems.ts`:

- Add `notes: ''` to `emptyItem`.
- Widen `updateItem`'s `field` type to include `'notes'`.
- Treat `'notes'` as a string field (no numeric coercion). The current branch
  is `field === 'description' ? value : Number(value)` — extend to also keep
  `'notes'` as a string.

### Forms

`components/invoices/InvoiceForm.tsx` and
`components/recurring/RecurringInvoiceForm.tsx`:

- Below the existing description/qty/price row for each line item, add a
  small `Textarea` (rows=2) bound to `item.notes`, with placeholder
  "Optional notes shown on the invoice".
- Empty notes do not block submit.

### Detail view

`components/invoices/InvoiceDetail.tsx`:

- In the items table row, under `item.description`, render `item.notes` on a
  second line in a smaller muted style when present (use design-system
  tokens, e.g. `text-sm text-muted-foreground`).
- Otherwise render nothing extra.

### Print view

`components/invoices/InvoicePrintView.tsx`:

- In the description cell, render `item.notes` on a second line beneath the
  description when present. Use the same explicit Tailwind color/size
  conventions already used in this file (e.g. `text-xs text-gray-600`) — do
  not use design-system tokens here, since the print view targets a static
  PDF/print context.
- No template label change — there is no header for this line.

## Edge cases

- **Empty notes** → no extra DOM/PDF line, `NULL` in DB.
- **Long notes** → wrap naturally; no truncation in print view.
- **Recurring** → notes copied verbatim through `RecurringInvoiceService::generateInvoice`.
- **Existing rows** → `NULL` notes by default; backward compatible.
- **Editing a draft** → setting notes to empty string clears the column to NULL
  via `syncItems` on next save (`?? null` handles both missing key and
  empty string would persist as ""; we'll normalize to null when empty in
  syncItems — see implementation note below).

### Implementation note: empty-string vs null

Frontend may send `""` for an empty notes field. `syncItems` should normalize
empty/whitespace-only strings to `null` so the DB stores a single canonical
representation. Add a small `trim() ?: null` step.

## Rollout order

1. Backend migration + model + resource + validation + service + tests.
2. Backend deploy.
3. Frontend types + hook + forms + detail + print view.
4. Frontend deploy.

Both directions are backward-compatible:

- Old frontend → new backend: omits `notes`, validation accepts (`nullable`),
  resource returns `null`. No regression.
- New frontend → old backend (during deploy window): backend ignores unknown
  `notes` key in the request, returns no `notes` key in the response. Frontend
  treats absent `notes` as undefined. No regression.

## Open questions

None — design is locked pending implementation plan.
