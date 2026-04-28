# Admin authentication, RBAC, and audit log — design

**Date:** 2026-04-19
**Target branch:** `claude/intelligent-ride-81181b` → `main`
**Scope:** Backend (Laravel 12 + Sanctum) + Frontend (Next.js) + E2E (Playwright)

## Goal

Gate the internal accounting app behind admin authentication, add a two-tier role
system (`super_admin` / `admin`), and log every business-level admin action to a
tamper-evident audit trail. Ship the whole thing to `main` as a single coherent
release.

This spec also folds in the FX-receivables work already committed on this branch
(`f4517a0` structured `total_receivables`, `459b0db` currency-rates endpoints,
etc.). Those endpoints are unauthenticated today; this spec closes that gap.

## Non-goals

- Multi-tenancy. One database, one organization, many admins.
- Email verification, password reset flows, 2FA, SSO. Can be added later.
- Fine-grained permission system (per-resource permissions). Two roles is enough.
- Viewer/read-only role. All authed users can read; the split is only on admin
  management.
- A full monitoring/observability rework. Scope is the audit log, nothing more.

## Architectural decisions

### Authentication: Sanctum SPA (cookie-based)

- Laravel issues an httpOnly session cookie on login; Next.js makes credentialed
  requests (`fetch(..., { credentials: 'include' })` — already in place).
- CSRF handled via Sanctum's `GET /sanctum/csrf-cookie` + `X-XSRF-TOKEN` header.
- Requires frontend and backend on the same root domain in production
  (e.g., `api.example.com` + `app.example.com` with `SESSION_DOMAIN=.example.com`).

### Authorization: role enum on `users`

- `role` column on `users`, values `super_admin` or `admin`.
- A single `CanManageAdmins` policy / `role:super_admin` middleware — used only
  on the admin-management controller. Every other endpoint requires only
  authentication.
- `super_admin` last-resort protections: cannot be demoted if last, cannot be
  deleted if last, cannot delete or demote self (prevents lockout).

### Audit log: two tables

1. `activity_logs` — existing polymorphic table, extended:
   - `loggable_type` / `loggable_id` made nullable (auth events have no target).
   - New columns: `ip_address`, `user_agent`.
2. `login_attempts` — new lightweight table for login security (success + failure,
   known or unknown email, ip, ua).

### Capture strategy: hybrid

- **Explicit `AuditLogger` calls** in controllers/services for rich business
  events (login, logout, admin CRUD, invoice.sent, invoice.marked_as_paid, etc.).
- **Global `AuditsChanges` trait** on `User`, `Customer`, `Invoice`,
  `RecurringInvoice`, `CurrencyRate` — Eloquent observers write a row on every
  `created` / `updated` / `deleted` with a before/after diff of changed attributes
  (sensitive fields redacted).

A single business mutation may write two rows (semantic action + raw diff). This
is intentional and searchable — filter by `action` to get the narrative, inspect
`properties` to get the diff.

## Data model

### Migration: `add_role_to_users`

```
users:
  + role  enum('super_admin', 'admin')  default 'admin'  not null
  + index on role
```

### Migration: `extend_activity_logs_for_auth`

```
activity_logs:
  ~ loggable_type  nullable
  ~ loggable_id    nullable
  + ip_address     varchar(45)  nullable
  + user_agent     varchar(500) nullable
  - drop existing (loggable_type, loggable_id) index
  + re-add index on (loggable_type, loggable_id) allowing nulls
```

### Migration: `create_login_attempts`

```
login_attempts:
  id
  email         varchar(255)  indexed    # may not match any user
  user_id       nullable FK -> users.id  nullOnDelete
  ip_address    varchar(45)
  user_agent    varchar(500)  nullable
  successful    boolean
  attempted_at  timestamp     indexed
```

### Action taxonomy

Namespaced, stable, filterable:

```
auth.login                 auth.logout            auth.login_failed
admin.created              admin.updated          admin.deleted           admin.role_changed
customer.created           customer.updated       customer.deleted
invoice.created            invoice.updated        invoice.deleted
invoice.sent               invoice.marked_as_paid invoice.cancelled       invoice.reminder_sent
recurring.created          recurring.updated      recurring.deleted       recurring.generated
rate.created               rate.updated
```

### Redacted fields

Never stored in `properties.before` or `properties.after`:
`password`, `remember_token`, `api_token`.

## API endpoints

All under `/api/v1` unless noted. All require `auth:sanctum` unless marked
`[public]`.

### Auth

```
GET  /sanctum/csrf-cookie      [public]  sets XSRF-TOKEN cookie (Sanctum built-in, outside v1)
POST /login                    [public]  {email, password} → 204 + session cookie
                                         writes login_attempts row (success or fail)
                                         rate-limit: 5 attempts / 15 min per (ip + email)
                                         on limit → 429 with Retry-After
POST /logout                              → 204, invalidates current session
                                         body {all: true} → invalidates every session for the current user
                                         (used by the "Sign out of all sessions" button)
GET  /me                                  → {id, name, email, role}
```

### Admin management — all `role:super_admin`

```
GET    /admins                 paginated list
                               response: {data: [{id, name, email, role, created_at, last_login_at}], ...}
POST   /admins                 {name, email, password, role} → created admin resource
GET    /admins/{id}            detail
PUT    /admins/{id}            {name?, email?, password?, role?}
DELETE /admins/{id}            → 204, or 422 if self or last super_admin
```

### Audit log — any authed admin

```
GET /audit/activity            paginated activity_logs
  ?user_id          filter by performer
  ?action           exact action match
  ?loggable_type    filter by target type (e.g., "App\Models\Invoice")
  ?date_from        ISO8601
  ?date_to          ISO8601
  ?search           free-text match against properties JSON

GET /audit/login-attempts      paginated login_attempts
  ?email
  ?ip
  ?successful       true|false
  ?date_from
  ?date_to
```

### Existing routes — all gated

Every existing v1 route (customers, invoices, invoice templates, recurring,
currency-rates, dashboard) gets `auth:sanctum`. No other middleware change
needed; regular admins can use the whole app.

### Pagination

All list endpoints (`/admins`, `/audit/activity`, `/audit/login-attempts`) use
Laravel's `paginate(25)` with `?page=N` and `?per_page=N` (max 100). Response
shape matches the existing `CustomerService::paginate` pattern used elsewhere in
the app: `{data: [...], meta: {current_page, last_page, total, per_page}, links}`.

### Request validation

- `FormRequest` class per write endpoint.
- `LoginRequest`: email + password required.
- `CreateAdminRequest`: email unique, password min 12 chars with letter + digit,
  role in enum.
- `UpdateAdminRequest`: same but email unique ignoring self, password optional.

## Audit logging implementation

### `AuditLogger` service

```php
namespace App\Services\Audit;

class AuditLogger
{
    public function log(
        string $action,
        ?Model $target = null,
        array $properties = [],
        ?int $userId = null,
    ): ActivityLog;
}
```

Resolves `user_id` from `auth()->id()` when not provided; resolves
`ip_address` / `user_agent` from the current Request. For CLI callers (artisan
commands), `user_id` is `null` and `properties['via'] = 'cli'` is set.

### `AuditsChanges` trait

Applied to `User`, `Customer`, `Invoice`, `RecurringInvoice`, `CurrencyRate`.

- `created` event → action `<model>.created`, `properties.after` = created
  attributes.
- `updated` event → action `<model>.updated`, `properties.before` = original
  values of changed attributes, `properties.after` = new values.
- `deleted` event → action `<model>.deleted`, `properties.before` = final
  attributes.
- `$hidden` fields and redacted-field list are stripped from both sides.

### Auth events

- Successful login: write `auth.login` to activity_logs and a row to
  `login_attempts`.
- Failed login: write `auth.login_failed` to activity_logs (with `user_id=null`
  for unknown emails) and a row to `login_attempts`.
- Logout: write `auth.logout`.

### Rate limiting

Laravel built-in rate limiter. Key: `login:{ip}:{email_hash}`. 5 per 15 min.
Writes `login_attempts` row before the rate-limit check fires (so attempts
during lockout are still recorded, for monitoring).

## Frontend structure (Next.js)

### New routes

```
app/login/page.tsx                    [public] login form
app/admins/page.tsx                   [super_admin] list + create/edit/delete
app/admins/[id]/page.tsx              [super_admin] detail / edit
app/audit/page.tsx                    [any admin] activity log viewer
app/audit/login-attempts/page.tsx     [any admin] login-attempt viewer
```

### `middleware.ts` (project root)

- Reads Laravel session cookie from request.
- No cookie → redirect to `/login?next=<original>` (except `/login` and static
  assets).
- Does NOT attempt to decode role — that's a backend concern. Role-gating on
  super-admin pages happens client-side via `useAuth()` for UX; backend enforces
  for security.

### `lib/auth/AuthProvider.tsx`

- Wraps the app below `QueryProvider`.
- On mount: `GET /me`. On success: stores user in context.
- On any 401 from `apiClient`: clears user, redirects to `/login`.
- Exposes `useAuth() → { user, isLoading, logout(): Promise<void> }`.

### `lib/api/client.ts` changes

- Keep `credentials: 'include'`.
- Remove unused `setToken` / Bearer path.
- Add `ensureCsrf()`: called before first non-GET; fetches
  `/sanctum/csrf-cookie`, reads `XSRF-TOKEN` cookie, sets `X-XSRF-TOKEN` header
  on all subsequent requests.

### New API modules

```
lib/api/auth.ts        login(), logout(), getMe()
lib/api/admins.ts      listAdmins(), getAdmin(), createAdmin(), updateAdmin(), deleteAdmin()
lib/api/audit.ts       getActivity(filters), getLoginAttempts(filters)
```

### Components

```
components/auth/
  LoginForm.tsx              email + password, error state, rate-limit message with retry countdown

components/admins/
  AdminsTable.tsx            list with role badge, created_at, last_login_at, row actions
  AdminFormDialog.tsx        create + edit in one dialog; password optional in edit
  DeleteAdminDialog.tsx      confirmation; disables for self / last super_admin with explanation

components/audit/
  ActivityTable.tsx          columns: when, who, action, target, ip
                             row click opens drawer with pretty-printed properties
  ActivityFilters.tsx        date range, action dropdown, user search, free-text
  LoginAttemptsTable.tsx     columns: when, email, ip, ua, result; failed rows highlighted
  LoginAttemptsFilters.tsx   email, ip, successful, date range

components/Layout.tsx        extend existing: hide nav on /login
                             show user menu + logout in header
                             show "Admins" + "Audit Log" nav links (gated by role)
```

### Polish (from option C scope)

- Rate-limited login: friendly "Too many attempts, try again in X min".
- "Sign out of all sessions" button on settings page (calls `/logout` with
  `all=true`).
- Edit admin: blank password field = no change (visible helper text).
- Audit log detail drawer: pretty-printed JSON diff with `before` / `after`
  side-by-side.
- Login attempts: failed rows red, burst detection (same IP + 3 failures in 5 min
  → badge).
- Role changes: activity row shows "admin → super_admin" explicitly by reading
  `properties.before.role` / `properties.after.role`.

## Bootstrap

### `php artisan admin:create`

```
Usage:
  php artisan admin:create [--super] [--name=...] [--email=...] [--password=...]

Behavior:
  - Prompts for any flags not supplied (password prompted hidden with confirmation).
  - --super requires interactive confirmation unless --no-interaction.
  - Validates email uniqueness + password strength.
  - Writes user row and activity_log row (via: cli, super: bool, user_id: null).
  - Exit codes: 0 success, 1 validation error, 2 duplicate email.
```

### Middleware registration (`bootstrap/app.php`)

```
api group:
  + Sanctum's EnsureFrontendRequestsAreStateful::class  (at the top)

aliases:
  + 'role' => EnsureRole::class

v1 prefix group:
  + auth:sanctum on everything except POST /login and sanctum/csrf-cookie
```

### Config

- `config/cors.php`
  - `paths`: `api/*`, `sanctum/csrf-cookie`, `login`, `logout`
  - `allowed_origins`: from `FRONTEND_URL` env (comma-separated)
  - `supports_credentials`: `true`
- `config/sanctum.php`
  - `stateful`: from `SANCTUM_STATEFUL_DOMAINS` env
- `config/session.php`
  - `same_site`: `lax`
  - `secure`: from `SESSION_SECURE_COOKIE` env (true in prod)

### `.env.example` additions

Backend:
```
FRONTEND_URL=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
```

Frontend:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SANCTUM_URL=http://localhost:8000
```

## Release path

1. All work continues on `claude/intelligent-ride-81181b`.
2. PR this branch → `main`. Commit messages follow `feat(scope): ...` convention.
3. **Open question for the user:** the main checkout is on `invoice-layout`.
   Before opening the PR we need to decide whether that branch should be merged
   to main first, included here, or discarded. Flag this in the PR description
   for explicit human decision.
4. Deploy recipe:
   - `php artisan migrate`
   - `php artisan admin:create --super`  (once, to seed the first super_admin)
   - Deploy frontend
   - Restart PHP-FPM

## Testing strategy

### Backend — PHPUnit (feature tests with `RefreshDatabase`)

```
Tests\Feature\Auth\
  LoginTest
    - valid login → 204 + session cookie + activity_log + login_attempt
    - wrong password → 401 + failed login_attempt
    - unknown email → 401 + login_attempt with user_id=null
    - rate-limit after 5 failures in 15 min → 429 with Retry-After
  LogoutTest
    - requires auth
    - invalidates session + writes activity_log
  MeTest
    - returns current user fields
    - 401 unauthed
  CsrfTest
    - /sanctum/csrf-cookie sets XSRF-TOKEN

Tests\Feature\Admins\
  IndexTest         super sees all; regular admin 403; unauth 401
  CreateTest        happy path + activity_log; duplicate email 422; weak password 422; regular 403
  UpdateTest        name/email/password updates log; role change writes role_changed; self-demote blocked; blank password = no change
  DeleteTest        delete other admin OK; delete self 422; delete last super 422

Tests\Feature\Audit\
  ActivityIndexTest         filters + pagination, any authed admin can view
  LoginAttemptsIndexTest    filters + pagination
  PasswordRedactionTest     password never appears in properties

Tests\Feature\AuditLoggerTest
  - action + properties + ip/ua captured
  - anonymous (CLI) caller → user_id null, via=cli
  - diff computation for Eloquent update

Tests\Feature\Middleware\
  AuthGuardAllRoutesTest    iterate every registered API route; assert 401 without session
                            (future-proof: catches forgotten middleware)
  RoleGuardTest             role:super_admin rejects admin, allows super

Tests\Feature\Console\
  AdminCreateCommandTest    creates user + log row; --super sets role; duplicate fails; validation fails
```

**Existing tests** must still pass: `DashboardReceivablesTest`,
`DashboardRecurringHealthTest`, `CurrencyRateControllerTest`,
`InvoiceControllerTest`, etc. They'll need `actingAs($admin)` in `setUp()`.

### Frontend — Playwright E2E (runs against real backend with a reset-db seed step)

Setup: add Playwright (`@playwright/test`). Script `npm run e2e` that:
1. Resets DB and creates a known super_admin + regular admin via artisan.
2. Boots Laravel dev server + Next.js dev server.
3. Runs specs.

```
e2e/auth.spec.ts
  - unauth visit / → redirected to /login
  - login with valid credentials → lands on dashboard
  - wrong password shows error, does NOT navigate
  - 6 wrong attempts → rate-limit message with countdown
  - logout → redirected /login, back button doesn't restore session
  - 401 mid-session (forced via DB) → auto-redirects to /login

e2e/admins.spec.ts
  - super_admin sees "Admins" nav link; regular admin does not
  - regular admin direct-navigating /admins → friendly 403 screen
  - create admin: form → list shows new row
  - edit admin: change role admin → super_admin
  - delete admin with confirmation
  - attempting to delete the last super_admin → error message shown, not deleted

e2e/audit.spec.ts
  - after creating a customer, activity table shows the row
  - filter by action
  - date-range filter narrows rows
  - login attempts page: failed + successful rows present after the auth suite ran
```

### Frontend — Vitest (component tests)

```
components/auth/LoginForm.test.tsx
  - renders, validates required fields, submits
  - shows error message on rejected promise
  - shows rate-limit countdown on 429

components/admins/AdminFormDialog.test.tsx
  - create mode: password required
  - edit mode: password optional with helper text

components/audit/ActivityTable.test.tsx
  - renders rows with correct columns
  - row click opens drawer showing properties JSON
```

### Out of scope for tests

- Framework internals (Sanctum session, Laravel hashing).
- CSS / visual regression.
- Load / stress testing.

## Security notes

- All rate-limited endpoints write attempts before limiting, for observability.
- Password storage uses Laravel's existing `hashed` cast (bcrypt).
- CSRF: cookies are httpOnly + `SameSite=lax`; `X-XSRF-TOKEN` header required on
  state-changing requests.
- Session fixation: on login, Laravel regenerates the session id by default —
  we verify in the login test.
- No password reset flow in scope → operational fallback is
  `php artisan admin:create --super` on the server.

## Resolved decisions

1. **`invoice-layout` branch:** fold into this PR — nothing should be left
   behind. The plan includes a step to merge `invoice-layout` into this branch
   (committing any outstanding uncommitted work in the main checkout first)
   before starting the auth/audit implementation, so the final PR carries the
   full release.
