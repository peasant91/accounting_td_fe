# Requirements: UI Migration to Tailwind CSS + shadcn/ui

## Introduction

This document defines the requirements for migrating the existing frontend UI from vanilla CSS (CSS Modules) to **Tailwind CSS** with **shadcn/ui** components. The migration will also update the visual theme from the current dark mode with purple/indigo branding to a **light theme with white background** and **green (#10AF13)** as the primary brand color.

### Objectives

- Replace CSS Modules with Tailwind CSS utility classes
- Adopt shadcn/ui as the component library foundation
- Implement a light-mode design system with green (#10AF13) as the primary color
- Maintain all existing functionality while updating the visual appearance
- Ensure consistent styling across all pages and components

### Scope

This migration affects the entire frontend application, including:
- Global styles and design tokens
- Base UI components (Button, Input, Modal, EmptyState, StatusBadge)
- Feature components (Dashboard, Customers, Invoices)
- Layout components and navigation

---

## Requirements

---

### Requirement 1: Tailwind CSS Integration

**As a** developer, **I want** to integrate Tailwind CSS into the Next.js project, **so that** I can use utility classes for styling instead of CSS Modules.

**Acceptance Criteria:**

1. WHEN the project is set up, THEN Tailwind CSS v4.x SHALL be installed and configured.
2. WHEN Tailwind is configured, THEN the `globals.css` file SHALL import Tailwind's base, components, and utilities layers.
3. WHEN the project builds, THEN unused CSS SHALL be purged for optimal bundle size.
4. WHEN using Tailwind, THEN custom theme colors SHALL be defined in the Tailwind config matching the design system.

---

### Requirement 2: shadcn/ui Component Library Setup

**As a** developer, **I want** to set up shadcn/ui as the component library, **so that** I have access to pre-built, accessible, and customizable components.

**Acceptance Criteria:**

1. WHEN shadcn/ui is initialized, THEN the project SHALL have a `components.json` configuration file.
2. WHEN components are added, THEN they SHALL be placed in `components/ui/` directory.
3. WHEN shadcn/ui is set up, THEN the utility function `cn()` SHALL be available in `lib/utils.ts`.
4. WHEN the theme is configured, THEN CSS variables SHALL use the light theme with green (#10AF13) as primary color.

---

### Requirement 3: Light Theme with Green Primary Color

**As a** user, **I want** the application to have a clean light theme with green accents, **so that** the interface is visually fresh and aligned with the brand identity.

**Acceptance Criteria:**

1. WHEN viewing any page, THEN the background SHALL be white (#FFFFFF).
2. WHEN viewing primary actions (buttons, links, active states), THEN they SHALL use green (#10AF13).
3. WHEN viewing text content, THEN primary text SHALL be dark (#0a0a0a) for readability.
4. WHEN viewing interactive elements on hover, THEN they SHALL use a slightly darker green accent (#0d8f10).
5. WHEN viewing focus states, THEN focus rings SHALL use the primary green color.

---

### Requirement 4: Button Component Migration

**As a** developer, **I want** to replace the custom Button component with shadcn/ui Button, **so that** I have a consistent, accessible button implementation.

**Acceptance Criteria:**

1. WHEN using the Button component, THEN it SHALL support variants: `default` (green), `secondary`, `destructive`, `outline`, `ghost`.
2. WHEN using the Button component, THEN it SHALL support sizes: `sm`, `default`, `lg`.
3. WHEN the button is in loading state, THEN it SHALL display a spinner and be disabled.
4. WHEN the button is disabled, THEN it SHALL have reduced opacity and not respond to interactions.
5. WHEN the primary button is rendered, THEN it SHALL have green (#10AF13) background with white text.

---

### Requirement 5: Input Component Migration

**As a** developer, **I want** to replace the custom Input component with shadcn/ui Input, **so that** I have consistent form styling.

**Acceptance Criteria:**

1. WHEN using the Input component, THEN it SHALL support a label, error message, and hint text.
2. WHEN the input has an error, THEN the border SHALL be red and error message SHALL be displayed below.
3. WHEN the input is focused, THEN it SHALL have a green (#10AF13) focus ring.
4. WHEN the input is required, THEN an asterisk (*) SHALL be displayed next to the label.

---

### Requirement 6: Modal/Dialog Component Migration

**As a** developer, **I want** to replace the custom Modal component with shadcn/ui Dialog, **so that** I have an accessible modal implementation.

**Acceptance Criteria:**

1. WHEN the modal is open, THEN it SHALL display a semi-transparent overlay.
2. WHEN the modal is open, THEN pressing Escape SHALL close the modal.
3. WHEN the modal is open, THEN clicking the overlay SHALL close the modal.
4. WHEN the modal is open, THEN focus SHALL be trapped within the modal.
5. WHEN using ConfirmModal, THEN it SHALL display title, message, and action buttons (Cancel/Confirm).

---

### Requirement 7: StatusBadge Component Update

**As a** developer, **I want** to update the StatusBadge component to use Tailwind classes, **so that** invoice statuses are visually consistent with the new design system.

**Acceptance Criteria:**

1. WHEN displaying "Draft" status, THEN the badge SHALL be gray (#71717a).
2. WHEN displaying "Sent" status, THEN the badge SHALL be blue (#3b82f6).
3. WHEN displaying "Paid" status, THEN the badge SHALL be green (#10b981).
4. WHEN displaying "Overdue" status, THEN the badge SHALL be red (#ef4444).
5. WHEN displaying "Cancelled" status, THEN the badge SHALL be gray (#6b7280).

---

### Requirement 8: EmptyState Component Update

**As a** developer, **I want** to update the EmptyState component to use Tailwind classes, **so that** empty lists have consistent styling.

**Acceptance Criteria:**

1. WHEN a list is empty, THEN the EmptyState SHALL display centered in the container.
2. WHEN displaying EmptyState, THEN it SHALL show an icon, title, description, and optional action button.
3. WHEN the action button is present, THEN it SHALL use the primary green color.

---

### Requirement 9: Layout and Navigation Update

**As a** developer, **I want** to update the Layout component to use Tailwind classes, **so that** the navigation and page structure are consistent with the new theme.

**Acceptance Criteria:**

1. WHEN viewing the sidebar navigation, THEN it SHALL have a white background with subtle border.
2. WHEN viewing active navigation items, THEN they SHALL be highlighted with green (#10AF13).
3. WHEN viewing the main content area, THEN it SHALL have appropriate spacing and max-width constraints.
4. WHEN on mobile devices, THEN the navigation SHALL collapse into a hamburger menu.

---

### Requirement 10: Dashboard Component Update

**As a** developer, **I want** to update Dashboard components to use Tailwind classes, **so that** summary cards and quick actions use the new design system.

**Acceptance Criteria:**

1. WHEN viewing summary cards, THEN they SHALL have white backgrounds with subtle shadows.
2. WHEN viewing summary card values, THEN monetary amounts SHALL be prominently displayed.
3. WHEN hovering over quick action buttons, THEN they SHALL have smooth hover transitions.
4. WHEN viewing recent activity, THEN each item SHALL have clear visual separation.

---

### Requirement 11: Customer Components Update

**As a** developer, **I want** to update Customer components to use Tailwind classes, **so that** the customer list and forms are styled consistently.

**Acceptance Criteria:**

1. WHEN viewing the customer list, THEN table rows SHALL have hover states.
2. WHEN viewing the customer form, THEN form fields SHALL be properly spaced and labeled.
3. WHEN submitting a form with errors, THEN error messages SHALL be displayed in red below the fields.

---

### Requirement 12: Invoice Components Update

**As a** developer, **I want** to update Invoice components to use Tailwind classes, **so that** invoice management has consistent styling.

**Acceptance Criteria:**

1. WHEN viewing the invoice list, THEN status badges SHALL use the correct status colors.
2. WHEN viewing invoice details, THEN line items SHALL be displayed in a clean table format.
3. WHEN viewing invoice totals, THEN subtotal, tax, and total SHALL be right-aligned and properly formatted.
4. WHEN using invoice modals (Send, Cancel, Mark as Paid), THEN they SHALL use the shadcn/ui Dialog component.

---

### Requirement 13: Remove CSS Modules

**As a** developer, **I want** to remove all CSS Module files after migration, **so that** the codebase is clean and only uses Tailwind CSS.

**Acceptance Criteria:**

1. WHEN the migration is complete, THEN all `.module.css` files SHALL be deleted.
2. WHEN the migration is complete, THEN no component SHALL import CSS Module files.
3. WHEN the migration is complete, THEN `globals.css` SHALL contain only Tailwind imports and CSS variable definitions.

---

## Non-Functional Requirements

### NFR-1: Bundle Size

- The production CSS bundle SHALL be optimized through Tailwind's purge feature.
- The total CSS size SHOULD be smaller than the current CSS Modules implementation.

### NFR-2: Accessibility

- All components SHALL maintain WCAG 2.1 AA compliance.
- All interactive elements SHALL have visible focus indicators.
- All form inputs SHALL have associated labels.

### NFR-3: Browser Compatibility

- The UI SHALL work correctly in Chrome, Firefox, Safari, and Edge (latest 2 versions).

---

## Files to Migrate

### CSS Module Files to Remove

| File | Replacement |
|------|-------------|
| `components/ui/Button.module.css` | shadcn/ui Button |
| `components/ui/Input.module.css` | shadcn/ui Input |
| `components/ui/Modal.module.css` | shadcn/ui Dialog |
| `components/ui/EmptyState.module.css` | Tailwind classes |
| `components/ui/StatusBadge.module.css` | Tailwind classes |
| `components/Layout.module.css` | Tailwind classes |
| `components/dashboard/Dashboard.module.css` | Tailwind classes |
| `components/customers/CustomerList.module.css` | Tailwind classes |
| `components/customers/CustomerModal.module.css` | shadcn/ui Dialog |
| `components/invoices/InvoiceList.module.css` | Tailwind classes |
| `components/invoices/InvoiceDetail.module.css` | Tailwind classes |
| `components/invoices/InvoiceForm.module.css` | Tailwind classes |
| `components/invoices/InvoiceModals.module.css` | shadcn/ui Dialog |
| `app/page.module.css` | Tailwind classes |

### Components to Replace with shadcn/ui

| Current | shadcn/ui |
|---------|-----------|
| Button | button |
| Input | input, label |
| Modal, ConfirmModal | dialog, alert-dialog |
| - | card (for summary cards) |
| - | table (for lists) |
| - | dropdown-menu (for actions) |
| - | badge (for status) |
