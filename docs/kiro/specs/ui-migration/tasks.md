# Implementation Plan: UI Migration to Tailwind CSS + shadcn/ui

This plan decomposes the technical design into actionable implementation tasks for migrating the frontend UI from CSS Modules to Tailwind CSS v4 with shadcn/ui components.

---

- [ ] 1. Install and configure Tailwind CSS v4 and dependencies
  - Install Tailwind CSS v4, @tailwindcss/postcss, and postcss packages.
  - Install shadcn/ui dependencies: class-variance-authority, clsx, tailwind-merge.
  - Install Radix UI packages: @radix-ui/react-dialog, @radix-ui/react-label, @radix-ui/react-slot, @radix-ui/react-alert-dialog.
  - Install lucide-react for icons.
  - Install tailwindcss-animate plugin.
  - Create `tailwind.config.ts` with custom theme colors matching the design system.
  - Configure PostCSS to use Tailwind CSS v4.
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Set up shadcn/ui and global styles
  - Create `components.json` configuration file for shadcn/ui.
  - Create `lib/utils.ts` with the `cn()` utility function.
  - Update `app/globals.css` with Tailwind imports and CSS variable definitions for light theme.
  - Configure primary color as green (#10AF13) in CSS variables.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Migrate Button component to shadcn/ui
  - Replace `components/ui/Button.tsx` with shadcn/ui Button implementation.
  - Implement variants: default (green), secondary, destructive, outline, ghost.
  - Implement sizes: sm, default, lg, icon.
  - Add loading state with spinner support.
  - Remove `Button.module.css` after migration.
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 4. Migrate Input component with Label support
  - Create `components/ui/label.tsx` using Radix UI Label primitive.
  - Replace `components/ui/Input.tsx` with Tailwind-styled implementation.
  - Add support for label, error message, hint text, and required field indicator.
  - Implement green focus ring styling.
  - Remove `Input.module.css` after migration.
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 5. Migrate Modal to shadcn/ui Dialog
  - Create `components/ui/dialog.tsx` with shadcn/ui Dialog implementation.
  - Create `components/ui/alert-dialog.tsx` for confirmation dialogs.
  - Create `components/ui/confirm-dialog.tsx` wrapper component.
  - Implement overlay, Escape key close, overlay click close, and focus trapping.
  - Remove `Modal.module.css` after migration.
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6. Update StatusBadge component with Tailwind classes
  - Rewrite `components/ui/StatusBadge.tsx` using Tailwind utility classes.
  - Apply correct status colors: Draft (gray), Sent (blue), Paid (green), Overdue (red), Cancelled (gray).
  - Remove `StatusBadge.module.css` after migration.
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 7. Update EmptyState component with Tailwind classes
  - Rewrite `components/ui/EmptyState.tsx` using Tailwind utility classes.
  - Update to use Lucide React icons.
  - Ensure centered layout with icon, title, description, and optional action button.
  - Remove `EmptyState.module.css` after migration.
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 8. Update Layout and Navigation components
  - Rewrite Layout component using Tailwind classes.
  - Apply white background with subtle border to sidebar navigation.
  - Highlight active navigation items with green (#10AF13).
  - Implement responsive mobile navigation (hamburger menu).
  - Remove `Layout.module.css` after migration.
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 9. Update Dashboard components
  - Rewrite Dashboard components using Tailwind classes.
  - Style summary cards with white backgrounds and subtle shadows.
  - Add hover transitions to quick action buttons.
  - Style recent activity with clear visual separation.
  - Remove `Dashboard.module.css` after migration.
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 10. Update Customer components
  - Rewrite CustomerList and CustomerForm components using Tailwind classes.
  - Add hover states to table rows.
  - Update CustomerModal to use shadcn/ui Dialog.
  - Remove `CustomerList.module.css` and `CustomerModal.module.css` after migration.
  - _Requirements: 11.1, 11.2, 11.3_

- [ ] 11. Update Invoice components
  - Rewrite InvoiceList, InvoiceDetail, and InvoiceForm using Tailwind classes.
  - Ensure status badges use correct colors.
  - Style line items table and right-align totals.
  - Update invoice modals (Send, Cancel, Mark as Paid) to use shadcn/ui Dialog.
  - Remove `InvoiceList.module.css`, `InvoiceDetail.module.css`, `InvoiceForm.module.css`, and `InvoiceModals.module.css` after migration.
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 12. Remove remaining CSS Modules and cleanup
  - Delete all remaining `.module.css` files.
  - Remove any unused CSS imports from components.
  - Ensure `globals.css` contains only Tailwind imports and CSS variable definitions.
  - Remove `app/page.module.css` if still present.
  - _Requirements: 13.1, 13.2, 13.3_

- [ ] 13. Verify and test the migration
  - Run `npm run build` to ensure no TypeScript or build errors.
  - Verify light theme with white background is applied across all pages.
  - Test Button component variants and loading state.
  - Test Input component with label, error, hint, and required states.
  - Test Dialog open/close via button, Escape key, and overlay click.
  - Test keyboard navigation and focus indicators for accessibility.
  - Verify browser compatibility in Chrome, Firefox, Safari, and Edge.
  - _Requirements: NFR-1, NFR-2, NFR-3_
