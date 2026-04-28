# Invoice Template System

## Overview

The invoice system supports **per-customer template configuration** with **locale-based single-language output**. Each invoice is rendered in one language determined by the customer's currency.

## Language Mapping

| Currency | Language | Locale |
|----------|----------|--------|
| IDR | Indonesian (`id`) | `id-ID` |
| USD | English (`en`) | `en-US` |
| JPY | Japanese (`ja`) | `ja-JP` |
| AUD | English (`en`) | `en-AU` |
| SGD | English (`en`) | `en-SG` |

> [!IMPORTANT]
> Invoices must display in a **single language only** — no bilingual or mixed-language text. The language is determined by the customer's currency via `config/invoice.php` → `currency_locale_map`.

## Component Registry

Each invoice section is a toggleable component. Components can be enabled/disabled per customer via the Template Builder.

| Key | Label | Required | Description |
|-----|-------|----------|-------------|
| `company_header` | Company Header | ✅ | Logo, "INVOICE" title |
| `invoice_meta` | Invoice Meta | ❌ | Date + invoice number green bar |
| `customer_details` | Customer Details | ❌ | "To:" + customer name |
| `sender_details` | Sender Details | ❌ | Company address, phone, email, NPWP |
| `total_summary_box` | Total Summary Box | ❌ | Yellow payment amount box |
| `line_items` | Line Items Table | ✅ | Item description/qty/price table |
| `grand_total` | Grand Total | ❌ | Total sum box at bottom-right |
| `bank_transfer` | Bank Transfer Info | ❌ | Bank name, account name/number |
| `transfer_fee_note` | Transfer Fee Note | ❌ | "Biaya jasa transfer bank ditanggung konsumen" |
| `invoice_digits_note` | Invoice Digits Note | ❌ | "Mohon sertakan 5 digit terakhir nomor invoice..." |
| `unique_number` | Unique Number Indicator | ❌ | All unique code warnings (yellow banner, green label, red text) |

## Key Files

### Backend
- **`config/invoice.php`** — Central config: default components, currency-locale map, all labels (en/id/ja)
- **`app/Models/InvoiceTemplate.php`** — Per-customer template model (stores component overrides)
- **`app/Services/InvoiceTemplateService.php`** — Resolves template + locale for a customer, generates preview data
- **`app/Http/Controllers/InvoiceTemplateController.php`** — CRUD + preview endpoints

### Frontend
- **`types/invoice-template.ts`** — TypeScript types: `InvoiceComponentKey`, `InvoiceTemplate`, `ResolvedLocale`, `InvoicePreviewData`
- **`components/invoices/InvoicePrintView.tsx`** — The invoice layout, driven entirely by `template.components` and `locale.labels`
- **`components/invoices/InvoiceTemplateBuilder.tsx`** — Toggle UI for enabling/disabling components per customer
- **`components/invoices/InvoicePreviewModal.tsx`** — Live preview modal using the preview API
- **`components/invoices/InvoiceDetail.tsx`** — Invoice detail page; uses preview API for printing

## Conventions

### Adding a New Component
1. Add the key to `default_components` in `config/invoice.php`
2. Add the key to `InvoiceComponentKey` type in `types/invoice-template.ts`
3. Wrap the section in `InvoicePrintView.tsx` with `isEnabled('your_key')`
4. The Template Builder will automatically pick it up

### Adding a New Language
1. Add the currency mapping in `currency_locale_map` in `config/invoice.php`
2. Add a full label set under `labels` → `'xx'` in `config/invoice.php`
3. Add sample descriptions in `InvoiceTemplateService.php` → `getPreviewData()`

### Print vs Preview Consistency
- Both **InvoiceDetail** (print) and **InvoicePreviewModal** (preview) use the same `useInvoicePreview` hook → same API endpoint → same data structure
- The print view overrides sample data with real invoice data (number, date, items, total)
- Never hardcode text in `InvoicePrintView.tsx` — always use `labels.*`

### Font Requirements
The font stack must include CJK fonts for Japanese support:
```
'Segoe UI', Tahoma, Geneva, Verdana, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic', 'Meiryo', sans-serif
```

### Print Styles
- `Layout.tsx` uses `print:hidden` on sidebar and mobile menu
- `InvoiceDetail.tsx` wraps screen content with `print:hidden`, print view with `hidden print:block`
- `globals.css` has `@media print` rules for clean output and forced background colors
