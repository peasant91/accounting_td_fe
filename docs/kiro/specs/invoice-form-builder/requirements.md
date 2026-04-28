**Requirements: Invoice Form Builder**

**Introduction**
The Invoice Form Builder allows per-customer customization of invoice layouts. The system ships with a default template (based on the attached Timedoor Invoice format) that includes a company header, invoice metadata, customer/sender details, a total summary, line items, a grand total, and bank transfer information. Admins can toggle components on/off for each customer. The invoice language (field labels) automatically adapts based on the customer's currency setting (e.g., JPY → Japanese labels, USD/IDR → English labels).

**Requirements**

---

**Requirement 1: Per-Customer Template Customization**
**User Story:** As an Admin, I want to customize the invoice layout for a specific customer by toggling components from the default template, so that the invoice meets their specific billing requirements.

**Acceptance Criteria**
1. IF a custom template is NOT defined for a customer, THEN the system SHALL use the default invoice template with all components enabled.
2. WHEN the Admin accesses the "Invoice Template" settings for a customer, THEN the system SHALL display a form builder initialized with the default template components, each shown with an on/off toggle.
3. WHEN the Admin disables a component (e.g., "Bank Transfer Information", "Total Summary Box"), THEN that component SHALL NOT appear on invoices generated for that customer.
4. WHEN the Admin re-enables a previously disabled component, THEN it SHALL reappear on invoices generated for that customer.
5. WHEN the Admin saves the configuration, THEN the system SHALL persist the custom template association with that customer.

---

**Requirement 2: Language Localization Based on Currency**
**User Story:** As an Admin, I want the invoice language and currency formatting to automatically follow the customer's currency setting, so that the invoice is understandable for the recipient.

**Acceptance Criteria**
1. IF the customer's currency is set to "JPY" (Japanese Yen), THEN the system SHALL display all field labels in Japanese (e.g., 項目, 料金日本円, 合計, 合計金額(税込), お振込先).
2. IF the customer's currency is set to "JPY", THEN the system SHALL format monetary amounts using the ¥ symbol with no decimal places and use period as thousands separator (e.g., ¥150.000).
3. IF the customer's currency is set to "USD", THEN the system SHALL display field labels in English (e.g., Item, Amount, Total) and format as $1,500.00.
4. IF the customer's currency is set to "IDR", THEN the system SHALL display field labels in English and format as Rp 1.500.000.
5. WHEN an invoice is generated or previewed, THEN the system SHALL look up the customer's currency to determine the localization resource (labels + formatting) to use.

---

**Requirement 3: Default Template Component Registry**
**User Story:** As an Admin, I want to know which components make up the default invoice, so that I can decide which to keep or remove for each customer.

**Acceptance Criteria**
1. The default invoice template SHALL consist of the following components, derived from the attached Timedoor Invoice format:
    - **Company Header** — Company logo + "INVOICE" title + accent bar
    - **Invoice Meta** — Invoice Date and Invoice Number
    - **Customer Details** — "To:" block with customer name / company name (e.g., 株式会社 ファイブ・タッグ 御中)
    - **Sender Details** — Company name, address, phone, and email (e.g., PT. Timedoor Indonesia, Jl. Tukad Yeh Aya IX No.46 Renon...)
    - **Total Summary Box** — Boxed grand total including tax at the top of the invoice (e.g., 合計金額(税込) ¥150.000)
    - **Line Items Table** — Table with columns: Item description and Amount (currency-labeled, e.g., 料金日本円)
    - **Grand Total** — Bottom total row (e.g., 合計 ¥150.000)
    - **Bank Transfer Information** — Bank name, SWIFT code, account name, account number
    - **Transfer Fee Note** — Note about transfer fee responsibility (e.g., お振込手数料は御社負担にてお願い致します)
2. Each component SHALL be individually toggleable (enable/disable) in the builder interface.
3. The "Company Header" and "Line Items Table" components SHALL be mandatory and cannot be disabled.

---

**Requirement 4: Invoice Preview**
**User Story:** As an Admin, I want to preview the customized invoice for a customer, so that I can verify it looks correct before sending.

**Acceptance Criteria**
1. WHEN the Admin is editing a customer's invoice template, THEN the system SHALL provide a "Preview" button.
2. The Preview SHALL render the invoice using sample data, respecting the customer's enabled/disabled components and language/currency settings.
3. The Preview SHALL visually match the final PDF/print output as closely as possible.
