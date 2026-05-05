**Implementation Plan**

- [ ] 1. Create the database migration and InvoiceTemplate model
  - Create migration file `create_invoice_templates_table` with `id`, `customer_id` (unique, foreign key with cascade delete), `components` (JSON), and `timestamps`.
  - Run the migration to create the `invoice_templates` table.
  - Create `app/Models/InvoiceTemplate.php` with `$fillable = ['customer_id', 'components']`, `$casts = ['components' => 'array']`, and `customer()` BelongsTo relationship.
  - Add `invoiceTemplate()` HasOne relationship to `app/Models/Customer.php`.
  - _Requirements: 1.5, 3.1_

- [ ] 2. Create the invoice config file with default components, locale mappings, and labels
  - Create `config/invoice.php` with the `default_components` array (9 components: `company_header`, `invoice_meta`, `customer_details`, `sender_details`, `total_summary_box`, `line_items`, `grand_total`, `bank_transfer`, `transfer_fee_note`) including `key`, `label`, `enabled`, and `required` fields.
  - Add the `currency_locale_map` mapping (IDR → en/id-ID, USD → en/en-US, JPY → ja/ja-JP, AUD → en/en-AU, SGD → en/en-SG).
  - Add the `labels` dictionary with full English (`en`) and Japanese (`ja`) label sets.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1_

- [ ] 3. Implement InvoiceTemplateService with business logic
  - Create `app/Services/InvoiceTemplateService.php`.
  - Implement `getDefaultComponents()` to return the default component list from `config('invoice.default_components')`.
  - Implement `resolveLocale(string $currency)` to look up `currency_locale_map` and return `['language', 'locale', 'labels']`.
  - Implement `getTemplateForCustomer(Customer $customer)` that returns the customer's saved template or falls back to the default, always merging with resolved locale data.
  - Implement `saveTemplate(Customer $customer, array $components)` that upserts the `invoice_templates` record, validating that required components remain enabled.
  - Implement `getPreviewData(Customer $customer)` that returns the full preview payload with localized labels, sample invoice data, and the current template config.
  - _Requirements: 1.1, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 4.2_

- [ ] 4. Create the Form Request validation and InvoiceTemplateController
  - Create `app/Http/Requests/UpdateInvoiceTemplateRequest.php` with validation rules: `components` is required array, each item must have `key` (in whitelist) and `enabled` (boolean), and required components (`company_header`, `line_items`) cannot be disabled.
  - Create `app/Http/Controllers/InvoiceTemplateController.php` with three actions:
    - `show(Customer $customer)` → GET endpoint returning template config with resolved locale.
    - `update(UpdateInvoiceTemplateRequest $request, Customer $customer)` → PUT endpoint for upsert.
    - `preview(Customer $customer)` → GET endpoint returning localized preview payload.
  - Register routes in `routes/api.php`:
    - `GET /api/v1/customers/{customer}/invoice-template`
    - `PUT /api/v1/customers/{customer}/invoice-template`
    - `GET /api/v1/customers/{customer}/invoice-template/preview`
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 3.3, 4.1_

- [ ] 5. Write backend unit and feature tests
  - Create `tests/Feature/InvoiceTemplateTest.php` (or similar) with the following test cases:
    - `GET /customers/{id}/invoice-template` returns default when no custom template exists.
    - `PUT /customers/{id}/invoice-template` creates a new template.
    - `PUT /customers/{id}/invoice-template` updates an existing template.
    - `PUT` rejects disabling a required component (422 response).
    - `PUT` rejects invalid component keys (422 response).
    - `GET /customers/{id}/invoice-template/preview` returns localized data for a JPY customer.
    - `GET preview` for a USD customer returns English labels.
    - Deleting a customer cascades to delete the template.
  - Create `tests/Unit/InvoiceTemplateServiceTest.php` with:
    - `test_returns_default_when_no_template_exists`
    - `test_resolves_jpy_to_japanese_labels`
    - `test_resolves_usd_to_english_labels`
    - `test_resolves_idr_to_english_labels`
    - `test_required_components_cannot_be_disabled`
  - Run tests with `cd backend && php artisan test --filter=InvoiceTemplate`.
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.3, 2.4, 3.3_

- [ ] 6. Create frontend TypeScript types and API client
  - Create `types/invoice-template.ts` with `InvoiceComponentKey`, `InvoiceComponentConfig`, `InvoiceTemplate`, `ResolvedLocale`, `InvoiceTemplateFormData`, and `InvoicePreviewData` interfaces/types.
  - Create `lib/api/invoice-templates.ts` with API client functions: `getInvoiceTemplate(customerId)`, `updateInvoiceTemplate(customerId, data)`, `getInvoicePreview(customerId)`.
  - Create `lib/hooks/useInvoiceTemplates.ts` with TanStack Query hooks: `useInvoiceTemplate(customerId)`, `useUpdateInvoiceTemplate()`, `useInvoicePreview(customerId, enabled)`.
  - _Requirements: 1.2, 1.5, 4.1_

- [ ] 7. Build the InvoiceTemplateBuilder component
  - Create `components/invoices/InvoiceTemplateBuilder.tsx` with:
    - Toggle switches for each of the 9 components, rendered in the fixed default order.
    - Required components (`company_header`, `line_items`) shown with disabled/locked toggles.
    - A "Save" button that calls `useUpdateInvoiceTemplate` and shows a success toast on save.
    - A "Preview" button that opens the `InvoicePreviewModal`.
    - Loading and error states using TanStack Query.
  - Use shadcn/ui `Switch`, `Card`, `Button`, and `Label` components with Tailwind CSS styling.
  - _Requirements: 1.2, 1.3, 1.4, 3.2, 3.3, 4.1_

- [ ] 8. Build the InvoicePreviewModal component
  - Create `components/invoices/InvoicePreviewModal.tsx` using shadcn/ui `Dialog` component.
  - Render the invoice preview styled to visually match the Timedoor Invoice PDF format:
    - Company Header with "INVOICE" title and accent bar.
    - Invoice Meta (date, number) with localized labels.
    - Customer Details ("To:" / "御中" block).
    - Sender Details (company name, address, phone, email).
    - Total Summary Box (boxed grand total with tax).
    - Line Items Table (Item + Amount columns with currency-labeled header).
    - Grand Total row at bottom.
    - Bank Transfer Information section.
    - Transfer Fee Note.
  - Apply proper currency formatting: JPY with `¥` + period separator (e.g., `¥150.000`), USD with `$` + comma separator (e.g., `$1,500.00`), IDR with `Rp` + period separator (e.g., `Rp 1.500.000`).
  - Only render components that are `enabled` in the current template config.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.2, 4.3_

- [ ] 9. Integrate InvoiceTemplateBuilder into the Customer Detail page
  - Modify `app/customers/[id]/page.tsx` to add a new "Invoice Template" section below the existing "Profile Information" section.
  - Embed the `InvoiceTemplateBuilder` component, passing the `customerId` as a prop.
  - _Requirements: 1.2_

- [ ] 10. Manual end-to-end verification
  - Open a customer detail page and verify the "Invoice Template" section appears with toggle switches for all 9 components.
  - Toggle off "Bank Transfer Information", save, refresh, and verify it remains off.
  - Verify that "Company Header" and "Line Items Table" toggles are disabled/locked.
  - Click "Preview" on a **JPY customer** and verify Japanese labels and `¥` currency with period separator.
  - Click "Preview" on a **USD customer** and verify English labels and `$` formatting.
  - Click "Preview" on an **IDR customer** and verify English labels and `Rp` formatting.
  - Preview with a disabled component and verify it does not appear in the preview.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_
