# Admin Authentication, RBAC, and Audit Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate the internal accounting app behind admin authentication, add `super_admin` / `admin` roles, log every business-level admin action, and ship to `main` as a single coherent release — including the `invoice-layout` branch so nothing is left behind.

**Architecture:** Sanctum SPA cookie authentication with a `role` enum on `users`. A single `AuditLogger` service is used explicitly from controllers for business events, and an `AuditsChanges` trait hooks Eloquent model events on `User`, `Customer`, `Invoice`, `RecurringInvoice`, `CurrencyRate` to auto-log create/update/delete with redacted before/after diffs. Two log tables: existing `activity_logs` (extended with nullable loggable + ip + ua) for business events, and a new `login_attempts` for security-focused auth attempts. Frontend uses a Next.js edge `middleware.ts` for cookie-presence gating plus an `AuthProvider` context for role-aware UI. Playwright covers full end-to-end.

**Tech Stack:** Laravel 12 (PHP 8.2, PHPUnit, Sanctum 4), Next.js 16 (App Router, TanStack Query, TypeScript, Tailwind v4, shadcn/ui), Playwright, Vitest.

Spec: `docs/superpowers/specs/2026-04-19-admin-auth-and-audit-log-design.md`.

**Conventions:**
- Backend paths are relative to `backend/`; frontend paths relative to `frontend/`. Run commands from the worktree root.
- Every backend task is TDD: write failing test, run it failing, implement, run passing, commit.
- Tests use SQLite in-memory via `phpunit.xml` with `RefreshDatabase`. Existing pattern.
- Each task ends with `git add <specific files>` + commit. **Never** use `git add -A` / `git add .` — there is uncommitted pre-existing state on the parent `invoice-layout` branch that must NOT sweep in.
- Run backend tests: `cd backend && php artisan test`. Run specific test: `cd backend && php artisan test --filter=TestName`.
- Run frontend build: `cd frontend && npm run build`. Run frontend tests: `cd frontend && npm test` (Vitest, after Task 16.1).
- Run E2E: `cd frontend && npm run e2e` (after Task 17.1).
- After each commit, check `git status` is clean before moving on.

**Phase ordering:** Phases 0–9 are backend (in order). Phases 10–16 are frontend. Phase 17+ are E2E. Phases 1–2 MUST precede 3–9; Phase 10 MUST precede 11–16; Phase 17 MUST precede 18.

---

## PHASE 0 — Fold in `invoice-layout` branch

### Task 0.1: Merge `invoice-layout` into this branch

**Purpose:** The main checkout is on branch `invoice-layout` with uncommitted changes. User decided to fold everything into this release. We commit outstanding work on that branch, then merge it into our working branch.

**Files:**
- Working copy at `/Users/kevin/Documents/Projects/internal/accounting_timedoor/` (the main checkout — NOT the worktree)

- [ ] **Step 1: Inspect the main checkout state**

```bash
cd /Users/kevin/Documents/Projects/internal/accounting_timedoor
git status -s
git branch --show-current  # should show invoice-layout
```

Record every `M`/`??` line. If there are uncommitted files, review each with `git diff <file>` or `git diff --cached <file>` before proceeding.

- [ ] **Step 2: Commit outstanding work on `invoice-layout`**

```bash
cd /Users/kevin/Documents/Projects/internal/accounting_timedoor
# Skip .DS_Store — it's OS noise
git add backend/routes/console.php frontend
git commit -m "chore(invoice-layout): snapshot in-progress work before merge"
```

If `frontend` is a submodule/subtree pointer change, inspect what changed with `git diff --cached frontend` and commit only if it reflects intentional work.

- [ ] **Step 3: Push `invoice-layout` to remote (optional safety net)**

```bash
cd /Users/kevin/Documents/Projects/internal/accounting_timedoor
git push origin invoice-layout
```

- [ ] **Step 4: Merge `invoice-layout` into our worktree branch**

```bash
cd /Users/kevin/Documents/Projects/internal/accounting_timedoor/.claude/worktrees/intelligent-ride-81181b
git merge origin/invoice-layout --no-ff -m "Merge invoice-layout into release branch"
```

If conflicts arise, resolve them carefully:
- For `backend/*` files where our branch has the FX refactor, prefer our changes.
- For `frontend/*` files, take whichever is newer / more complete.
- Never discard uncommitted user work — inspect and merge intent.

- [ ] **Step 5: Run backend tests to verify nothing broke**

```bash
cd backend && php artisan test
```

Expected: All existing tests pass (65+ previously).

- [ ] **Step 6: Run frontend build**

```bash
cd frontend && npm install && npm run build
```

Expected: clean build. Fix any type errors caused by the merge before moving on.

- [ ] **Step 7: Commit resolution (if merge wasn't already clean)**

Only needed if conflicts required resolution or fixups.

```bash
git status
git add <resolved files>
git commit -m "chore: resolve invoice-layout merge"
```

---

## PHASE 1 — Backend foundation: data model

### Task 1.1: Migration — add `role` to `users`

**Files:**
- Create: `backend/database/migrations/2026_04_19_000002_add_role_to_users.php`

- [ ] **Step 1: Write the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['super_admin', 'admin'])->default('admin')->after('password');
            $table->index('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropColumn('role');
        });
    }
};
```

- [ ] **Step 2: Run migration fresh in test env**

```bash
cd backend && php artisan migrate:fresh --env=testing
```

Expected: completes without error.

- [ ] **Step 3: Run existing tests — should still pass**

```bash
cd backend && php artisan test
```

- [ ] **Step 4: Commit**

```bash
git add backend/database/migrations/2026_04_19_000002_add_role_to_users.php
git commit -m "feat(auth): add role column to users"
```

### Task 1.2: Migration — extend `activity_logs`

**Files:**
- Create: `backend/database/migrations/2026_04_19_000003_extend_activity_logs_for_auth.php`

- [ ] **Step 1: Write the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex(['loggable_type', 'loggable_id']);
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->string('loggable_type')->nullable()->change();
            $table->unsignedBigInteger('loggable_id')->nullable()->change();
            $table->string('ip_address', 45)->nullable()->after('action');
            $table->string('user_agent', 500)->nullable()->after('ip_address');
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index(['loggable_type', 'loggable_id']);
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex(['loggable_type', 'loggable_id']);
            $table->dropIndex(['action']);
            $table->dropColumn(['ip_address', 'user_agent']);
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->string('loggable_type')->nullable(false)->change();
            $table->unsignedBigInteger('loggable_id')->nullable(false)->change();
            $table->index(['loggable_type', 'loggable_id']);
        });
    }
};
```

- [ ] **Step 2: Run migration**

```bash
cd backend && php artisan migrate:fresh --env=testing
```

Expected: clean.

- [ ] **Step 3: Verify existing tests pass**

```bash
cd backend && php artisan test
```

- [ ] **Step 4: Commit**

```bash
git add backend/database/migrations/2026_04_19_000003_extend_activity_logs_for_auth.php
git commit -m "feat(audit): extend activity_logs with ip/ua and nullable loggable"
```

### Task 1.3: Migration — create `login_attempts`

**Files:**
- Create: `backend/database/migrations/2026_04_19_000004_create_login_attempts_table.php`

- [ ] **Step 1: Write the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('login_attempts', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('ip_address', 45);
            $table->string('user_agent', 500)->nullable();
            $table->boolean('successful');
            $table->timestamp('attempted_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('login_attempts');
    }
};
```

- [ ] **Step 2: Run migration**

```bash
cd backend && php artisan migrate:fresh --env=testing
```

- [ ] **Step 3: Verify existing tests still pass**

```bash
cd backend && php artisan test
```

- [ ] **Step 4: Commit**

```bash
git add backend/database/migrations/2026_04_19_000004_create_login_attempts_table.php
git commit -m "feat(auth): create login_attempts table"
```

### Task 1.4: User model — role enum + helpers

**Files:**
- Create: `backend/app/Enums/UserRole.php`
- Modify: `backend/app/Models/User.php`
- Create: `backend/database/factories/UserFactory.php` (if absent; Laravel default)
- Test: `backend/tests/Unit/Models/UserTest.php`

- [ ] **Step 1: Create UserRole enum**

```php
<?php

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case Admin = 'admin';
}
```

- [ ] **Step 2: Write failing test for user role helpers**

Create `backend/tests/Unit/Models/UserTest.php`:

```php
<?php

namespace Tests\Unit\Models;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_role_is_admin(): void
    {
        $user = User::factory()->create();
        $this->assertSame(UserRole::Admin, $user->role);
    }

    public function test_is_super_admin_true_when_role_super(): void
    {
        $user = User::factory()->create(['role' => UserRole::SuperAdmin]);
        $this->assertTrue($user->isSuperAdmin());
    }

    public function test_is_super_admin_false_for_admin(): void
    {
        $user = User::factory()->create(['role' => UserRole::Admin]);
        $this->assertFalse($user->isSuperAdmin());
    }
}
```

- [ ] **Step 3: Run test — expect failure**

```bash
cd backend && php artisan test --filter=UserTest
```

Expected: FAIL (no `isSuperAdmin` method, role cast not set).

- [ ] **Step 4: Update User model**

Replace `backend/app/Models/User.php`:

```php
<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Services\Audit\AuditsChanges;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === UserRole::SuperAdmin;
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }
}
```

Note: The `AuditsChanges` trait import is in preparation — the trait file comes in Phase 2. For now, remove the `use App\Services\Audit\AuditsChanges;` line. We'll re-add the `use AuditsChanges;` statement inside the class body in Task 2.2.

```php
// Remove this line for now:
// use App\Services\Audit\AuditsChanges;
```

- [ ] **Step 5: Ensure UserFactory exists and supports `role`**

Check `backend/database/factories/UserFactory.php`. If missing, create:

```php
<?php

namespace Database\Factories;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'role' => UserRole::Admin,
        ];
    }

    public function superAdmin(): static
    {
        return $this->state(fn () => ['role' => UserRole::SuperAdmin]);
    }
}
```

- [ ] **Step 6: Run test — expect pass**

```bash
cd backend && php artisan test --filter=UserTest
```

Expected: 3 assertions pass.

- [ ] **Step 7: Run full test suite**

```bash
cd backend && php artisan test
```

Expected: all previous tests still pass.

- [ ] **Step 8: Commit**

```bash
git add backend/app/Enums/UserRole.php backend/app/Models/User.php backend/database/factories/UserFactory.php backend/tests/Unit/Models/UserTest.php
git commit -m "feat(auth): UserRole enum, role cast, role helpers"
```

### Task 1.5: LoginAttempt model

**Files:**
- Create: `backend/app/Models/LoginAttempt.php`
- Test: `backend/tests/Unit/Models/LoginAttemptTest.php`

- [ ] **Step 1: Write failing test**

```php
<?php

namespace Tests\Unit\Models;

use App\Models\LoginAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginAttemptTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_persist_successful_attempt(): void
    {
        $user = User::factory()->create();

        $attempt = LoginAttempt::create([
            'email' => $user->email,
            'user_id' => $user->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
            'successful' => true,
            'attempted_at' => now(),
        ]);

        $this->assertTrue($attempt->successful);
        $this->assertSame($user->id, $attempt->user->id);
    }

    public function test_can_persist_unknown_email_attempt(): void
    {
        $attempt = LoginAttempt::create([
            'email' => 'nobody@example.com',
            'user_id' => null,
            'ip_address' => '127.0.0.1',
            'user_agent' => null,
            'successful' => false,
            'attempted_at' => now(),
        ]);

        $this->assertNull($attempt->user_id);
        $this->assertFalse($attempt->successful);
    }
}
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd backend && php artisan test --filter=LoginAttemptTest
```

Expected: FAIL (model missing).

- [ ] **Step 3: Create LoginAttempt model**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginAttempt extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'email',
        'user_id',
        'ip_address',
        'user_agent',
        'successful',
        'attempted_at',
    ];

    protected $casts = [
        'successful' => 'boolean',
        'attempted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
cd backend && php artisan test --filter=LoginAttemptTest
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/Models/LoginAttempt.php backend/tests/Unit/Models/LoginAttemptTest.php
git commit -m "feat(auth): LoginAttempt model"
```

---

## PHASE 2 — AuditLogger service + AuditsChanges trait

### Task 2.1: `AuditLogger` service

**Files:**
- Create: `backend/app/Services/Audit/AuditLogger.php`
- Test: `backend/tests/Feature/Services/AuditLoggerTest.php`

- [ ] **Step 1: Write failing test**

```php
<?php

namespace Tests\Feature\Services;

use App\Models\ActivityLog;
use App\Models\Customer;
use App\Models\User;
use App\Services\Audit\AuditLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLoggerTest extends TestCase
{
    use RefreshDatabase;

    public function test_logs_business_event_with_target_and_user_from_auth(): void
    {
        $actor = User::factory()->create();
        $customer = Customer::factory()->create();
        $this->actingAs($actor);

        app(AuditLogger::class)->log(
            action: 'customer.updated',
            target: $customer,
            properties: ['before' => ['name' => 'A'], 'after' => ['name' => 'B']],
        );

        $log = ActivityLog::latest('id')->first();
        $this->assertSame('customer.updated', $log->action);
        $this->assertSame($actor->id, $log->user_id);
        $this->assertSame($customer->id, $log->loggable_id);
        $this->assertSame(Customer::class, $log->loggable_type);
        $this->assertSame(['before' => ['name' => 'A'], 'after' => ['name' => 'B']], $log->properties);
    }

    public function test_logs_auth_event_without_target(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        app(AuditLogger::class)->log(action: 'auth.logout');

        $log = ActivityLog::latest('id')->first();
        $this->assertSame('auth.logout', $log->action);
        $this->assertSame($user->id, $log->user_id);
        $this->assertNull($log->loggable_id);
        $this->assertNull($log->loggable_type);
    }

    public function test_captures_ip_and_user_agent_from_request(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        // Simulate request context via the current request
        request()->server->set('REMOTE_ADDR', '10.0.0.5');
        request()->headers->set('User-Agent', 'TestBrowser/1.0');

        app(AuditLogger::class)->log(action: 'auth.login');

        $log = ActivityLog::latest('id')->first();
        $this->assertSame('10.0.0.5', $log->ip_address);
        $this->assertSame('TestBrowser/1.0', $log->user_agent);
    }

    public function test_cli_caller_has_null_user_id_and_via_cli(): void
    {
        app(AuditLogger::class)->log(
            action: 'admin.created',
            properties: ['via' => 'cli', 'super' => true],
        );

        $log = ActivityLog::latest('id')->first();
        $this->assertNull($log->user_id);
        $this->assertSame('cli', $log->properties['via']);
    }

    public function test_allows_explicit_user_id(): void
    {
        $actor = User::factory()->create();

        app(AuditLogger::class)->log(
            action: 'auth.login',
            userId: $actor->id,
        );

        $log = ActivityLog::latest('id')->first();
        $this->assertSame($actor->id, $log->user_id);
    }
}
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd backend && php artisan test --filter=AuditLoggerTest
```

Expected: FAIL (class missing).

- [ ] **Step 3: Implement AuditLogger**

```php
<?php

namespace App\Services\Audit;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;

class AuditLogger
{
    public function log(
        string $action,
        ?Model $target = null,
        array $properties = [],
        ?int $userId = null,
    ): ActivityLog {
        $request = request();
        $userId ??= auth()->id();

        return ActivityLog::create([
            'action' => $action,
            'loggable_type' => $target ? $target::class : null,
            'loggable_id' => $target?->getKey(),
            'user_id' => $userId,
            'properties' => $properties,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent() ? substr($request->userAgent(), 0, 500) : null,
        ]);
    }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
cd backend && php artisan test --filter=AuditLoggerTest
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/app/Services/Audit/AuditLogger.php backend/tests/Feature/Services/AuditLoggerTest.php
git commit -m "feat(audit): AuditLogger service"
```

### Task 2.2: `AuditsChanges` trait with redaction

**Files:**
- Create: `backend/app/Services/Audit/AuditsChanges.php`
- Modify: `backend/app/Models/User.php`, `Customer.php`, `Invoice.php`, `RecurringInvoice.php`, `CurrencyRate.php`
- Test: `backend/tests/Feature/Services/AuditsChangesTest.php`

- [ ] **Step 1: Write failing test**

```php
<?php

namespace Tests\Feature\Services;

use App\Models\ActivityLog;
use App\Models\CurrencyRate;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditsChangesTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_create_logs_created_with_after(): void
    {
        $actor = User::factory()->create();
        $this->actingAs($actor);

        $customer = Customer::factory()->create(['name' => 'Acme Ltd']);

        $log = ActivityLog::where('action', 'customer.created')->latest('id')->first();
        $this->assertNotNull($log);
        $this->assertSame($actor->id, $log->user_id);
        $this->assertSame($customer->id, $log->loggable_id);
        $this->assertSame('Acme Ltd', $log->properties['after']['name']);
    }

    public function test_customer_update_logs_before_and_after_changed_fields_only(): void
    {
        $actor = User::factory()->create();
        $this->actingAs($actor);

        $customer = Customer::factory()->create(['name' => 'A', 'email' => 'a@x.com']);
        ActivityLog::truncate();

        $customer->update(['name' => 'B']);

        $log = ActivityLog::where('action', 'customer.updated')->latest('id')->first();
        $this->assertSame('A', $log->properties['before']['name']);
        $this->assertSame('B', $log->properties['after']['name']);
        $this->assertArrayNotHasKey('email', $log->properties['before']);
    }

    public function test_customer_delete_logs_deleted_with_before(): void
    {
        $actor = User::factory()->create();
        $this->actingAs($actor);

        $customer = Customer::factory()->create(['name' => 'DeleteMe']);
        $customer->delete();

        $log = ActivityLog::where('action', 'customer.deleted')->latest('id')->first();
        $this->assertSame('DeleteMe', $log->properties['before']['name']);
    }

    public function test_user_password_is_redacted_in_diffs(): void
    {
        $actor = User::factory()->superAdmin()->create();
        $this->actingAs($actor);

        $user = User::factory()->create();
        $user->update(['password' => 'new-secret-123']);

        $log = ActivityLog::where('action', 'user.updated')->latest('id')->first();
        $this->assertArrayHasKey('password', $log->properties['after']);
        $this->assertSame('***', $log->properties['after']['password']);
        if (array_key_exists('password', $log->properties['before'] ?? [])) {
            $this->assertSame('***', $log->properties['before']['password']);
        }
    }

    public function test_rate_update_logs_before_after(): void
    {
        $actor = User::factory()->create();
        $this->actingAs($actor);

        $rate = CurrencyRate::create(['currency' => 'USD', 'rate_to_base' => 16000]);
        ActivityLog::truncate();

        $rate->update(['rate_to_base' => 16250]);

        $log = ActivityLog::where('action', 'currencyrate.updated')->latest('id')->first();
        $this->assertNotNull($log);
        $this->assertNotEquals($log->properties['before']['rate_to_base'], $log->properties['after']['rate_to_base']);
    }
}
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd backend && php artisan test --filter=AuditsChangesTest
```

Expected: FAIL (trait + model boot missing).

- [ ] **Step 3: Implement the trait**

Create `backend/app/Services/Audit/AuditsChanges.php`:

```php
<?php

namespace App\Services\Audit;

use App\Services\Audit\AuditLogger;

trait AuditsChanges
{
    /**
     * Fields that must be redacted ('***') if they appear in before/after diffs.
     */
    protected array $auditRedacted = ['password', 'remember_token', 'api_token'];

    /**
     * Fields that must never appear in diffs at all (noise).
     */
    protected array $auditIgnored = ['updated_at', 'created_at'];

    public static function bootAuditsChanges(): void
    {
        static::created(function ($model) {
            app(AuditLogger::class)->log(
                action: $model->auditActionName('created'),
                target: $model,
                properties: ['after' => $model->auditRedactAttributes($model->getAttributes())],
            );
        });

        static::updated(function ($model) {
            $changes = $model->getChanges();
            foreach ($model->auditIgnored as $ignored) {
                unset($changes[$ignored]);
            }
            if (empty($changes)) {
                return;
            }
            $before = [];
            foreach ($changes as $key => $_) {
                $before[$key] = $model->getOriginal($key);
            }

            app(AuditLogger::class)->log(
                action: $model->auditActionName('updated'),
                target: $model,
                properties: [
                    'before' => $model->auditRedactAttributes($before),
                    'after' => $model->auditRedactAttributes($changes),
                ],
            );
        });

        static::deleted(function ($model) {
            app(AuditLogger::class)->log(
                action: $model->auditActionName('deleted'),
                target: $model,
                properties: ['before' => $model->auditRedactAttributes($model->getAttributes())],
            );
        });
    }

    protected function auditActionName(string $verb): string
    {
        $class = strtolower(class_basename(static::class));
        return "{$class}.{$verb}";
    }

    protected function auditRedactAttributes(array $attrs): array
    {
        foreach ($this->auditRedacted as $key) {
            if (array_key_exists($key, $attrs)) {
                $attrs[$key] = '***';
            }
        }
        foreach ($this->auditIgnored as $key) {
            unset($attrs[$key]);
        }
        return $attrs;
    }
}
```

- [ ] **Step 4: Apply trait to models**

Edit each model file to add `use AuditsChanges;` inside the class body.

`backend/app/Models/User.php` — add at top `use App\Services\Audit\AuditsChanges;` and inside class `use HasFactory, HasApiTokens, Notifiable, AuditsChanges;`.

`backend/app/Models/Customer.php` — add `use App\Services\Audit\AuditsChanges;` at top and `use AuditsChanges;` inside class.

`backend/app/Models/Invoice.php` — same.

`backend/app/Models/RecurringInvoice.php` — same.

`backend/app/Models/CurrencyRate.php` — same. Confirm factory + fillable remain.

- [ ] **Step 5: Run test — expect pass**

```bash
cd backend && php artisan test --filter=AuditsChangesTest
```

- [ ] **Step 6: Run full suite — existing tests that mutate models may now write extra activity_log rows. Verify they still pass**

```bash
cd backend && php artisan test
```

If any existing test asserted an exact count of `activity_logs`, update it to account for trait-generated rows (prefer filtering by `action`).

- [ ] **Step 7: Commit**

```bash
git add backend/app/Services/Audit/AuditsChanges.php \
        backend/app/Models/User.php backend/app/Models/Customer.php \
        backend/app/Models/Invoice.php backend/app/Models/RecurringInvoice.php \
        backend/app/Models/CurrencyRate.php \
        backend/tests/Feature/Services/AuditsChangesTest.php
# Also any existing test files updated in step 6
git commit -m "feat(audit): AuditsChanges trait on core models with redaction"
```

---

## PHASE 3 — Authentication (login, logout, me)

### Task 3.1: `LoginRequest`

**Files:**
- Create: `backend/app/Http/Requests/Auth/LoginRequest.php`

- [ ] **Step 1: Create the request class**

```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ];
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/Http/Requests/Auth/LoginRequest.php
git commit -m "feat(auth): LoginRequest"
```

### Task 3.2: `AuthController` — login, logout, me

**Files:**
- Create: `backend/app/Http/Controllers/AuthController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/Auth/LoginTest.php`, `LogoutTest.php`, `MeTest.php`

- [ ] **Step 1: Write failing LoginTest**

`backend/tests/Feature/Auth/LoginTest.php`:

```php
<?php

namespace Tests\Feature\Auth;

use App\Models\LoginAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_with_valid_credentials_returns_204(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@example.com',
            'password' => Hash::make('secret-password-12'),
        ]);

        $res = $this->postJson('/api/v1/login', [
            'email' => 'admin@example.com',
            'password' => 'secret-password-12',
        ]);

        $res->assertNoContent();
        $this->assertAuthenticatedAs($user);
        $this->assertDatabaseHas('login_attempts', [
            'email' => 'admin@example.com',
            'successful' => true,
            'user_id' => $user->id,
        ]);
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'auth.login',
            'user_id' => $user->id,
        ]);
    }

    public function test_login_with_wrong_password_returns_401_and_records_failure(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@example.com',
            'password' => Hash::make('correct-password-12'),
        ]);

        $res = $this->postJson('/api/v1/login', [
            'email' => 'admin@example.com',
            'password' => 'wrong-password',
        ]);

        $res->assertUnauthorized();
        $this->assertDatabaseHas('login_attempts', [
            'email' => 'admin@example.com',
            'successful' => false,
            'user_id' => $user->id,
        ]);
    }

    public function test_login_with_unknown_email_returns_401_and_records_null_user(): void
    {
        $res = $this->postJson('/api/v1/login', [
            'email' => 'nobody@example.com',
            'password' => 'anything',
        ]);

        $res->assertUnauthorized();
        $this->assertDatabaseHas('login_attempts', [
            'email' => 'nobody@example.com',
            'successful' => false,
            'user_id' => null,
        ]);
    }

    public function test_login_is_rate_limited_after_5_failures(): void
    {
        User::factory()->create([
            'email' => 'target@example.com',
            'password' => Hash::make('correct-password-12'),
        ]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/login', [
                'email' => 'target@example.com',
                'password' => 'wrong',
            ])->assertUnauthorized();
        }

        $res = $this->postJson('/api/v1/login', [
            'email' => 'target@example.com',
            'password' => 'wrong',
        ]);

        $res->assertStatus(429);
        $this->assertNotNull($res->headers->get('Retry-After'));
    }
}
```

- [ ] **Step 2: Write failing LogoutTest**

`backend/tests/Feature/Auth/LogoutTest.php`:

```php
<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LogoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_logout_requires_auth(): void
    {
        $this->postJson('/api/v1/logout')->assertUnauthorized();
    }

    public function test_authenticated_logout_invalidates_session_and_logs(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->postJson('/api/v1/logout')->assertNoContent();

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'auth.logout',
            'user_id' => $user->id,
        ]);
    }
}
```

- [ ] **Step 3: Write failing MeTest**

`backend/tests/Feature/Auth/MeTest.php`:

```php
<?php

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MeTest extends TestCase
{
    use RefreshDatabase;

    public function test_me_returns_401_when_unauthenticated(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_me_returns_user_fields(): void
    {
        $user = User::factory()->superAdmin()->create([
            'name' => 'Super',
            'email' => 'super@example.com',
        ]);
        $this->actingAs($user);

        $res = $this->getJson('/api/v1/me')->assertOk()->json();

        $this->assertSame('Super', $res['data']['name']);
        $this->assertSame('super@example.com', $res['data']['email']);
        $this->assertSame(UserRole::SuperAdmin->value, $res['data']['role']);
    }
}
```

- [ ] **Step 4: Run — expect all three to fail**

```bash
cd backend && php artisan test --filter="LoginTest|LogoutTest|MeTest"
```

Expected: FAIL (routes/controller missing).

- [ ] **Step 5: Implement AuthController**

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Models\LoginAttempt;
use App\Models\User;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    public function __construct(
        private AuditLogger $auditLogger,
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $email = strtolower($request->string('email'));
        $password = $request->string('password');
        $key = 'login:' . sha1($request->ip() . '|' . $email);

        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json([
                'message' => 'Too many login attempts. Try again in a few minutes.',
            ], 429)->header('Retry-After', RateLimiter::availableIn($key));
        }

        $user = User::where('email', $email)->first();
        $successful = $user && Hash::check($password, $user->password);

        LoginAttempt::create([
            'email' => $email,
            'user_id' => $user?->id,
            'ip_address' => $request->ip(),
            'user_agent' => substr($request->userAgent() ?? '', 0, 500) ?: null,
            'successful' => $successful,
            'attempted_at' => now(),
        ]);

        if (!$successful) {
            RateLimiter::hit($key, 60 * 15);
            $this->auditLogger->log(
                action: 'auth.login_failed',
                properties: ['email' => $email],
                userId: $user?->id,
            );
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        RateLimiter::clear($key);

        Auth::login($user);
        $request->session()->regenerate();

        $this->auditLogger->log(action: 'auth.login', userId: $user->id);

        return response()->json(null, 204);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $all = (bool) $request->boolean('all');

        if ($all) {
            foreach (\DB::table('sessions')->where('user_id', $user->id)->get() as $session) {
                \DB::table('sessions')->where('id', $session->id)->delete();
            }
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $this->auditLogger->log(action: 'auth.logout', userId: $user->id);

        return response()->json(null, 204);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
            ],
        ]);
    }
}
```

- [ ] **Step 6: Register routes in `backend/routes/api.php`**

Add at top of the `v1` group:

```php
Route::prefix('v1')->group(function () {
    // Auth (public)
    Route::post('/login', [\App\Http\Controllers\AuthController::class, 'login']);

    // Auth (requires session)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [\App\Http\Controllers\AuthController::class, 'logout']);
        Route::get('/me', [\App\Http\Controllers\AuthController::class, 'me']);

        // ... existing routes stay here, moved inside the middleware group in Task 7.1
    });
});
```

For NOW, only move the auth routes; the other routes stay as-is until Phase 7.

- [ ] **Step 7: Run tests — expect pass**

```bash
cd backend && php artisan test --filter="LoginTest|LogoutTest|MeTest"
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add backend/app/Http/Controllers/AuthController.php backend/routes/api.php \
        backend/tests/Feature/Auth/LoginTest.php backend/tests/Feature/Auth/LogoutTest.php \
        backend/tests/Feature/Auth/MeTest.php
git commit -m "feat(auth): login, logout, me with rate limiting and audit"
```

---

## PHASE 4 — Authorization middleware

### Task 4.1: `EnsureRole` middleware

**Files:**
- Create: `backend/app/Http/Middleware/EnsureRole.php`
- Modify: `backend/bootstrap/app.php`
- Test: `backend/tests/Feature/Middleware/RoleGuardTest.php`

- [ ] **Step 1: Write failing test**

```php
<?php

namespace Tests\Feature\Middleware;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class RoleGuardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware(['auth:sanctum', 'role:super_admin'])
            ->get('/test-super-only', fn () => response()->json(['ok' => true]));
    }

    public function test_super_admin_can_access(): void
    {
        $user = User::factory()->superAdmin()->create();
        $this->actingAs($user)->getJson('/test-super-only')->assertOk();
    }

    public function test_regular_admin_forbidden(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->getJson('/test-super-only')->assertForbidden();
    }

    public function test_unauthenticated_unauthorized(): void
    {
        $this->getJson('/test-super-only')->assertUnauthorized();
    }
}
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd backend && php artisan test --filter=RoleGuardTest
```

- [ ] **Step 3: Create middleware**

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }
        if (!in_array($user->role->value, $roles, true)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        return $next($request);
    }
}
```

- [ ] **Step 4: Register alias in `backend/bootstrap/app.php`**

Locate `->withMiddleware(function (Middleware $middleware) {...})` and add:

```php
$middleware->alias([
    'role' => \App\Http\Middleware\EnsureRole::class,
]);
```

If a `$middleware->alias` block already exists, add the `role` key to it.

- [ ] **Step 5: Run test — expect pass**

```bash
cd backend && php artisan test --filter=RoleGuardTest
```

- [ ] **Step 6: Commit**

```bash
git add backend/app/Http/Middleware/EnsureRole.php backend/bootstrap/app.php \
        backend/tests/Feature/Middleware/RoleGuardTest.php
git commit -m "feat(auth): EnsureRole middleware"
```

---

## PHASE 5 — Admin management endpoints

### Task 5.1: FormRequests

**Files:**
- Create: `backend/app/Http/Requests/Admin/CreateAdminRequest.php`
- Create: `backend/app/Http/Requests/Admin/UpdateAdminRequest.php`

- [ ] **Step 1: Create CreateAdminRequest**

```php
<?php

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Rules\Password;

class CreateAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;  // gated by route middleware role:super_admin
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::min(12)->letters()->numbers()],
            'role' => ['required', new Enum(UserRole::class)],
        ];
    }
}
```

- [ ] **Step 2: Create UpdateAdminRequest**

```php
<?php

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Rules\Password;

class UpdateAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;  // gated by route middleware role:super_admin
    }

    public function rules(): array
    {
        $id = $this->route('admin')?->id ?? $this->route('admin');
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($id)],
            'password' => ['sometimes', 'nullable', Password::min(12)->letters()->numbers()],
            'role' => ['sometimes', new Enum(UserRole::class)],
        ];
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/Http/Requests/Admin/
git commit -m "feat(admin): admin CRUD form requests"
```

### Task 5.2: `AdminResource`

**Files:**
- Create: `backend/app/Http/Resources/AdminResource.php`

- [ ] **Step 1: Create resource**

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role->value,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'last_login_at' => $this->whenLoaded('lastLoginAt', fn () => $this->last_login_at?->toIso8601String()),
        ];
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/Http/Resources/AdminResource.php
git commit -m "feat(admin): AdminResource"
```

### Task 5.3: `AdminController` with tests

**Files:**
- Create: `backend/app/Http/Controllers/AdminController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/Admins/IndexTest.php`, `CreateTest.php`, `UpdateTest.php`, `DeleteTest.php`

- [ ] **Step 1: Write failing IndexTest**

```php
<?php

namespace Tests\Feature\Admins;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauth_returns_401(): void
    {
        $this->getJson('/api/v1/admins')->assertUnauthorized();
    }

    public function test_regular_admin_forbidden(): void
    {
        $u = User::factory()->create();
        $this->actingAs($u)->getJson('/api/v1/admins')->assertForbidden();
    }

    public function test_super_admin_sees_all(): void
    {
        $super = User::factory()->superAdmin()->create();
        User::factory()->count(3)->create();

        $res = $this->actingAs($super)->getJson('/api/v1/admins')->assertOk();
        $this->assertGreaterThanOrEqual(4, count($res->json('data')));
    }
}
```

- [ ] **Step 2: Write failing CreateTest**

```php
<?php

namespace Tests\Feature\Admins;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateTest extends TestCase
{
    use RefreshDatabase;

    public function test_regular_admin_forbidden(): void
    {
        $u = User::factory()->create();
        $this->actingAs($u)->postJson('/api/v1/admins', [
            'name' => 'X', 'email' => 'x@y.com', 'password' => 'aBcDefGh1234', 'role' => 'admin',
        ])->assertForbidden();
    }

    public function test_super_creates_admin(): void
    {
        $super = User::factory()->superAdmin()->create();

        $res = $this->actingAs($super)->postJson('/api/v1/admins', [
            'name' => 'New Admin',
            'email' => 'new@admin.com',
            'password' => 'aBcDefGh1234',
            'role' => 'admin',
        ])->assertCreated();

        $this->assertSame('new@admin.com', $res->json('data.email'));
        $this->assertDatabaseHas('users', ['email' => 'new@admin.com', 'role' => UserRole::Admin->value]);
        $this->assertDatabaseHas('activity_logs', ['action' => 'admin.created', 'user_id' => $super->id]);
    }

    public function test_duplicate_email_422(): void
    {
        $super = User::factory()->superAdmin()->create();
        User::factory()->create(['email' => 'taken@x.com']);

        $this->actingAs($super)->postJson('/api/v1/admins', [
            'name' => 'X', 'email' => 'taken@x.com', 'password' => 'aBcDefGh1234', 'role' => 'admin',
        ])->assertUnprocessable();
    }

    public function test_weak_password_422(): void
    {
        $super = User::factory()->superAdmin()->create();

        $this->actingAs($super)->postJson('/api/v1/admins', [
            'name' => 'X', 'email' => 'x@y.com', 'password' => 'short', 'role' => 'admin',
        ])->assertUnprocessable();
    }
}
```

- [ ] **Step 3: Write failing UpdateTest**

```php
<?php

namespace Tests\Feature\Admins;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_updates_admin_name(): void
    {
        $super = User::factory()->superAdmin()->create();
        $target = User::factory()->create(['name' => 'Old']);

        $this->actingAs($super)->putJson("/api/v1/admins/{$target->id}", ['name' => 'New'])
            ->assertOk();

        $this->assertSame('New', $target->fresh()->name);
    }

    public function test_role_change_logs_role_changed(): void
    {
        $super = User::factory()->superAdmin()->create();
        $target = User::factory()->create();

        $this->actingAs($super)->putJson("/api/v1/admins/{$target->id}", ['role' => 'super_admin'])
            ->assertOk();

        $this->assertSame(UserRole::SuperAdmin, $target->fresh()->role);
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'admin.role_changed',
            'user_id' => $super->id,
            'loggable_id' => $target->id,
        ]);
    }

    public function test_blank_password_does_not_change(): void
    {
        $super = User::factory()->superAdmin()->create();
        $target = User::factory()->create(['password' => Hash::make('original-pw-1234')]);

        $this->actingAs($super)->putJson("/api/v1/admins/{$target->id}", ['name' => 'X'])
            ->assertOk();

        $this->assertTrue(Hash::check('original-pw-1234', $target->fresh()->password));
    }

    public function test_self_demote_blocked(): void
    {
        $super = User::factory()->superAdmin()->create();

        $this->actingAs($super)->putJson("/api/v1/admins/{$super->id}", ['role' => 'admin'])
            ->assertUnprocessable();
    }

    public function test_demoting_a_super_is_allowed_when_another_super_exists(): void
    {
        $actor = User::factory()->superAdmin()->create();
        $target = User::factory()->superAdmin()->create();

        $this->actingAs($actor)->putJson("/api/v1/admins/{$target->id}", ['role' => 'admin'])
            ->assertOk();

        $this->assertSame(UserRole::Admin, $target->fresh()->role);
    }
}
```

**Design note on "last super admin" invariant:** The spec promises that "a super_admin cannot be demoted if they are the last super_admin". In practice this rule is only reachable through self-demotion (the only super is also the only authenticated caller who could invoke the endpoint), so `test_self_demote_blocked` covers the reachable case. The controller guard at `assertNotLastSuperAdmin` serves as defense-in-depth for any future path that bypasses self (e.g., an API token issued to the last super). No additional test is required.

- [ ] **Step 4: Write failing DeleteTest**

```php
<?php

namespace Tests\Feature\Admins;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_deletes_another_admin(): void
    {
        $super = User::factory()->superAdmin()->create();
        $target = User::factory()->create();

        $this->actingAs($super)->deleteJson("/api/v1/admins/{$target->id}")->assertNoContent();

        $this->assertDatabaseMissing('users', ['id' => $target->id]);
        $this->assertDatabaseHas('activity_logs', ['action' => 'admin.deleted', 'user_id' => $super->id]);
    }

    public function test_cannot_delete_self(): void
    {
        $super = User::factory()->superAdmin()->create();
        $this->actingAs($super)->deleteJson("/api/v1/admins/{$super->id}")
            ->assertUnprocessable();
    }

    public function test_delete_another_super_allowed_when_more_than_one_exists(): void
    {
        $actor = User::factory()->superAdmin()->create();
        $target = User::factory()->superAdmin()->create();

        $this->actingAs($actor)->deleteJson("/api/v1/admins/{$target->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('users', ['id' => $target->id]);
    }
}
```

- [ ] **Step 5: Run tests — expect all fail**

```bash
cd backend && php artisan test --filter="Admins\\"
```

- [ ] **Step 6: Implement AdminController**

```php
<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\Admin\CreateAdminRequest;
use App\Http\Requests\Admin\UpdateAdminRequest;
use App\Http\Resources\AdminResource;
use App\Models\User;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class AdminController extends Controller
{
    public function __construct(
        private AuditLogger $auditLogger,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min((int) $request->integer('per_page', 25), 100);
        return AdminResource::collection(User::orderBy('id')->paginate($perPage));
    }

    public function store(CreateAdminRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::create([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'password' => $data['password'],
            'role' => $data['role'],
        ]);

        // Explicit business-level action on top of the trait-generated user.created row.
        $this->auditLogger->log(
            action: 'admin.created',
            target: $user,
            properties: ['role' => $user->role->value],
        );

        return (new AdminResource($user))->response()->setStatusCode(201);
    }

    public function show(User $admin): AdminResource
    {
        return new AdminResource($admin);
    }

    public function update(UpdateAdminRequest $request, User $admin): AdminResource
    {
        $data = $request->validated();

        // Self-lock: cannot demote self
        if ($admin->id === $request->user()->id && isset($data['role']) && $data['role'] !== $admin->role->value) {
            throw ValidationException::withMessages(['role' => 'You cannot change your own role.']);
        }

        // Last-super lock on demotion
        if (isset($data['role']) && $admin->isSuperAdmin() && $data['role'] !== UserRole::SuperAdmin->value) {
            $this->assertNotLastSuperAdmin($admin);
        }

        $previousRole = $admin->role;
        if (isset($data['email'])) {
            $data['email'] = strtolower($data['email']);
        }
        // Password: only touch if non-empty
        if (array_key_exists('password', $data) && ($data['password'] ?? '') === '') {
            unset($data['password']);
        }

        $admin->update($data);

        if (isset($data['role']) && $previousRole !== $admin->role) {
            $this->auditLogger->log(
                action: 'admin.role_changed',
                target: $admin,
                properties: ['before' => ['role' => $previousRole->value], 'after' => ['role' => $admin->role->value]],
            );
        } else {
            $this->auditLogger->log(action: 'admin.updated', target: $admin);
        }

        return new AdminResource($admin);
    }

    public function destroy(Request $request, User $admin): JsonResponse
    {
        if ($admin->id === $request->user()->id) {
            throw ValidationException::withMessages(['admin' => 'You cannot delete your own account.']);
        }
        if ($admin->isSuperAdmin()) {
            $this->assertNotLastSuperAdmin($admin);
        }

        $admin->delete();

        $this->auditLogger->log(
            action: 'admin.deleted',
            properties: ['deleted_admin_id' => $admin->id, 'email' => $admin->email],
        );

        return response()->json(null, 204);
    }

    private function assertNotLastSuperAdmin(User $admin): void
    {
        $superCount = User::where('role', UserRole::SuperAdmin->value)->count();
        if ($superCount <= 1) {
            throw ValidationException::withMessages([
                'role' => 'Cannot remove the last super admin. Promote another admin first.',
            ]);
        }
    }
}
```

- [ ] **Step 7: Register routes in `backend/routes/api.php`**

Inside the existing `auth:sanctum` group, add:

```php
Route::middleware(['role:super_admin'])->group(function () {
    Route::apiResource('admins', \App\Http\Controllers\AdminController::class)
        ->parameters(['admins' => 'admin'])
        ->missing(fn () => response()->json(['message' => 'Admin not found.'], 404));
});
```

Also ensure route-model binding uses `User` for `{admin}`. Since `User` is the default Eloquent binding for the name `admin`, we need to tell it explicitly. In `AdminController::show/update/destroy` we type-hint `User $admin`. Laravel will resolve by primary key when the route param is `{admin}` and the type is `User`.

- [ ] **Step 8: Run tests — expect pass**

```bash
cd backend && php artisan test --filter="Admins\\"
```

- [ ] **Step 9: Commit**

```bash
git add backend/app/Http/Controllers/AdminController.php backend/routes/api.php \
        backend/tests/Feature/Admins/
git commit -m "feat(admin): admin CRUD with self-lock and last-super protection"
```

---

## PHASE 6 — Audit log endpoints

### Task 6.1: `AuditController`

**Files:**
- Create: `backend/app/Http/Controllers/AuditController.php`
- Create: `backend/app/Http/Resources/ActivityLogResource.php`
- Create: `backend/app/Http/Resources/LoginAttemptResource.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/Audit/ActivityIndexTest.php`, `LoginAttemptsIndexTest.php`

- [ ] **Step 1: Write failing ActivityIndexTest**

```php
<?php

namespace Tests\Feature\Audit;

use App\Models\ActivityLog;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivityIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_regular_admin_can_view(): void
    {
        $u = User::factory()->create();
        $this->actingAs($u)->getJson('/api/v1/audit/activity')->assertOk();
    }

    public function test_unauth_denied(): void
    {
        $this->getJson('/api/v1/audit/activity')->assertUnauthorized();
    }

    public function test_filter_by_action(): void
    {
        $u = User::factory()->create();
        $this->actingAs($u);

        ActivityLog::create(['action' => 'customer.created', 'user_id' => $u->id, 'properties' => []]);
        ActivityLog::create(['action' => 'invoice.created', 'user_id' => $u->id, 'properties' => []]);

        $res = $this->getJson('/api/v1/audit/activity?action=customer.created')->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertSame('customer.created', $res->json('data.0.action'));
    }

    public function test_filter_by_user_id(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        ActivityLog::create(['action' => 'x', 'user_id' => $alice->id, 'properties' => []]);
        ActivityLog::create(['action' => 'x', 'user_id' => $bob->id, 'properties' => []]);

        $res = $this->actingAs($alice)->getJson("/api/v1/audit/activity?user_id={$alice->id}")->assertOk();
        foreach ($res->json('data') as $row) {
            $this->assertSame($alice->id, $row['user']['id']);
        }
    }
}
```

- [ ] **Step 2: Write failing LoginAttemptsIndexTest**

```php
<?php

namespace Tests\Feature\Audit;

use App\Models\LoginAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginAttemptsIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauth_denied(): void
    {
        $this->getJson('/api/v1/audit/login-attempts')->assertUnauthorized();
    }

    public function test_filter_by_email(): void
    {
        $u = User::factory()->create();
        LoginAttempt::create(['email' => 'a@x.com', 'ip_address' => '1.1.1.1', 'successful' => true, 'attempted_at' => now()]);
        LoginAttempt::create(['email' => 'b@x.com', 'ip_address' => '1.1.1.1', 'successful' => false, 'attempted_at' => now()]);

        $res = $this->actingAs($u)->getJson('/api/v1/audit/login-attempts?email=a@x.com')->assertOk();
        $this->assertCount(1, $res->json('data'));
    }

    public function test_filter_by_successful(): void
    {
        $u = User::factory()->create();
        LoginAttempt::create(['email' => 'a@x.com', 'ip_address' => '1.1.1.1', 'successful' => true, 'attempted_at' => now()]);
        LoginAttempt::create(['email' => 'b@x.com', 'ip_address' => '1.1.1.1', 'successful' => false, 'attempted_at' => now()]);

        $res = $this->actingAs($u)->getJson('/api/v1/audit/login-attempts?successful=false')->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertFalse($res->json('data.0.successful'));
    }
}
```

- [ ] **Step 3: Run — expect fail**

```bash
cd backend && php artisan test --filter="Audit\\"
```

- [ ] **Step 4: Implement resources**

`backend/app/Http/Resources/ActivityLogResource.php`:

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => $this->action,
            'user' => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ] : null,
            'loggable_type' => $this->loggable_type,
            'loggable_id' => $this->loggable_id,
            'properties' => $this->properties,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
```

`backend/app/Http/Resources/LoginAttemptResource.php`:

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoginAttemptResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'user_id' => $this->user_id,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'successful' => $this->successful,
            'attempted_at' => $this->attempted_at?->toIso8601String(),
        ];
    }
}
```

- [ ] **Step 5: Implement AuditController**

```php
<?php

namespace App\Http\Controllers;

use App\Http\Resources\ActivityLogResource;
use App\Http\Resources\LoginAttemptResource;
use App\Models\ActivityLog;
use App\Models\LoginAttempt;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AuditController extends Controller
{
    public function activity(Request $request): AnonymousResourceCollection
    {
        $perPage = min((int) $request->integer('per_page', 25), 100);

        $q = ActivityLog::query()->with('user')->orderByDesc('id');

        if ($userId = $request->integer('user_id')) {
            $q->where('user_id', $userId);
        }
        if ($action = $request->string('action')->toString()) {
            $q->where('action', $action);
        }
        if ($type = $request->string('loggable_type')->toString()) {
            $q->where('loggable_type', $type);
        }
        if ($from = $request->date('date_from')) {
            $q->where('created_at', '>=', $from);
        }
        if ($to = $request->date('date_to')) {
            $q->where('created_at', '<=', $to);
        }
        if ($search = $request->string('search')->toString()) {
            $like = '%' . $search . '%';
            $q->where(fn ($sub) => $sub
                ->where('action', 'like', $like)
                ->orWhere('properties', 'like', $like)
                ->orWhere('ip_address', 'like', $like));
        }

        return ActivityLogResource::collection($q->paginate($perPage));
    }

    public function loginAttempts(Request $request): AnonymousResourceCollection
    {
        $perPage = min((int) $request->integer('per_page', 25), 100);

        $q = LoginAttempt::query()->orderByDesc('id');

        if ($email = $request->string('email')->toString()) {
            $q->where('email', $email);
        }
        if ($ip = $request->string('ip')->toString()) {
            $q->where('ip_address', $ip);
        }
        if ($request->has('successful')) {
            $q->where('successful', $request->boolean('successful'));
        }
        if ($from = $request->date('date_from')) {
            $q->where('attempted_at', '>=', $from);
        }
        if ($to = $request->date('date_to')) {
            $q->where('attempted_at', '<=', $to);
        }

        return LoginAttemptResource::collection($q->paginate($perPage));
    }
}
```

- [ ] **Step 6: Register routes**

Inside the `auth:sanctum` group in `backend/routes/api.php`:

```php
Route::prefix('audit')->group(function () {
    Route::get('/activity', [\App\Http\Controllers\AuditController::class, 'activity']);
    Route::get('/login-attempts', [\App\Http\Controllers\AuditController::class, 'loginAttempts']);
});
```

- [ ] **Step 7: Run tests**

```bash
cd backend && php artisan test --filter="Audit\\"
```

- [ ] **Step 8: Commit**

```bash
git add backend/app/Http/Controllers/AuditController.php \
        backend/app/Http/Resources/ActivityLogResource.php \
        backend/app/Http/Resources/LoginAttemptResource.php \
        backend/routes/api.php \
        backend/tests/Feature/Audit/
git commit -m "feat(audit): audit log endpoints with filters"
```

---

## PHASE 7 — Gate existing routes with `auth:sanctum`

### Task 7.1: Move all existing v1 routes inside `auth:sanctum`

**Files:**
- Modify: `backend/routes/api.php`

- [ ] **Step 1: Restructure routes**

Goal shape:

```php
Route::prefix('v1')->group(function () {
    // Public
    Route::post('/login', [\App\Http\Controllers\AuthController::class, 'login']);

    // Everything else requires a session
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [\App\Http\Controllers\AuthController::class, 'logout']);
        Route::get('/me', [\App\Http\Controllers\AuthController::class, 'me']);

        // Dashboard
        Route::get('/dashboard/summary', [\App\Http\Controllers\DashboardController::class, 'summary']);

        // Customers
        Route::apiResource('customers', \App\Http\Controllers\CustomerController::class);

        // Invoice templates, Invoices, Recurring, Currency rates ...
        // (all existing routes moved inside here, unchanged)

        // Admin management (super_admin only)
        Route::middleware('role:super_admin')->group(function () {
            Route::apiResource('admins', \App\Http\Controllers\AdminController::class)
                ->parameters(['admins' => 'admin']);
        });

        // Audit
        Route::prefix('audit')->group(function () {
            Route::get('/activity', [\App\Http\Controllers\AuditController::class, 'activity']);
            Route::get('/login-attempts', [\App\Http\Controllers\AuditController::class, 'loginAttempts']);
        });
    });
});
```

Preserve all existing route definitions exactly; only wrap them in the middleware group.

- [ ] **Step 2: Run full test suite — expect many failures**

```bash
cd backend && php artisan test
```

Expected: existing feature tests (`DashboardReceivablesTest`, `CurrencyRateControllerTest`, `InvoiceControllerTest`, etc.) now fail with 401 because they don't authenticate.

- [ ] **Step 3: Commit the route restructure first (broken state is fine because next task fixes tests)**

```bash
git add backend/routes/api.php
git commit -m "feat(auth): gate all v1 routes behind auth:sanctum"
```

### Task 7.2: Update existing tests to authenticate

**Files:**
- Modify: every feature test that hits `/api/v1/*` without `actingAs`

- [ ] **Step 1: Identify failing tests**

```bash
cd backend && php artisan test 2>&1 | grep -E "FAIL|Tests:"
```

- [ ] **Step 2: Add `actingAs($admin)` to each failing test's `setUp`**

Pattern to apply in EACH test file that makes API calls:

```php
use App\Models\User;

class SomeTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
        $this->actingAs($this->admin);
    }

    // tests...
}
```

Apply this to:
- `backend/tests/Feature/DashboardReceivablesTest.php`
- `backend/tests/Feature/DashboardRecurringHealthTest.php`
- `backend/tests/Feature/Http/Controllers/CurrencyRateControllerTest.php`
- `backend/tests/Feature/Http/Controllers/InvoiceControllerTest.php`
- `backend/tests/Feature/InvoiceTemplateTest.php`
- Any other test that directly calls `getJson`/`postJson`/`putJson`/`deleteJson` on `/api/*`.

Use Grep to find them:

```bash
grep -rL "actingAs" backend/tests/Feature --include="*Test.php" | xargs grep -l "getJson\|postJson\|putJson\|deleteJson"
```

For tests that must be **unauthenticated** (e.g., testing auth flow itself), do NOT add `actingAs` — login/logout/me tests are correct as-is.

- [ ] **Step 3: Run full suite**

```bash
cd backend && php artisan test
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add backend/tests
git commit -m "test: add actingAs(\$admin) to existing feature tests"
```

### Task 7.3: AuthGuardAllRoutesTest — future-proof guard

**Files:**
- Create: `backend/tests/Feature/Middleware/AuthGuardAllRoutesTest.php`

- [ ] **Step 1: Write the test**

```php
<?php

namespace Tests\Feature\Middleware;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AuthGuardAllRoutesTest extends TestCase
{
    public function test_every_api_v1_route_requires_auth_except_allowlist(): void
    {
        $allow = [
            'POST api/v1/login',
            // add here only if a new public endpoint is intentional
        ];

        $unguarded = [];
        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();
            if (!str_starts_with($uri, 'api/v1/')) {
                continue;
            }
            $methods = array_diff($route->methods(), ['HEAD', 'OPTIONS']);
            foreach ($methods as $method) {
                $key = $method . ' ' . $uri;
                if (in_array($key, $allow, true)) {
                    continue;
                }
                $middleware = $route->gatherMiddleware();
                if (!in_array('auth:sanctum', $middleware, true)) {
                    $unguarded[] = $key;
                }
            }
        }

        $this->assertSame([], $unguarded, 'Unguarded v1 routes: ' . implode(', ', $unguarded));
    }
}
```

- [ ] **Step 2: Run — expect pass**

```bash
cd backend && php artisan test --filter=AuthGuardAllRoutesTest
```

If it fails, you've forgotten to wrap a route. Fix and re-run.

- [ ] **Step 3: Commit**

```bash
git add backend/tests/Feature/Middleware/AuthGuardAllRoutesTest.php
git commit -m "test: guard against forgetting auth:sanctum on v1 routes"
```

---

## PHASE 8 — `admin:create` artisan command

### Task 8.1: `admin:create` command

**Files:**
- Create: `backend/app/Console/Commands/AdminCreate.php`
- Test: `backend/tests/Feature/Console/AdminCreateCommandTest.php`

- [ ] **Step 1: Write failing test**

```php
<?php

namespace Tests\Feature\Console;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCreateCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_creates_admin_with_flags(): void
    {
        $this->artisan('admin:create', [
            '--name' => 'Alice',
            '--email' => 'alice@x.com',
            '--password' => 'aBcDefGh1234',
            '--no-interaction' => true,
        ])->assertExitCode(0);

        $this->assertDatabaseHas('users', [
            'email' => 'alice@x.com',
            'role' => UserRole::Admin->value,
        ]);
    }

    public function test_super_flag_creates_super_admin(): void
    {
        $this->artisan('admin:create', [
            '--name' => 'Sue',
            '--email' => 'sue@x.com',
            '--password' => 'aBcDefGh1234',
            '--super' => true,
            '--no-interaction' => true,
        ])->assertExitCode(0);

        $this->assertDatabaseHas('users', [
            'email' => 'sue@x.com',
            'role' => UserRole::SuperAdmin->value,
        ]);
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'admin.created',
            'user_id' => null,
        ]);
    }

    public function test_duplicate_email_exits_nonzero(): void
    {
        User::factory()->create(['email' => 'dup@x.com']);

        $this->artisan('admin:create', [
            '--name' => 'X',
            '--email' => 'dup@x.com',
            '--password' => 'aBcDefGh1234',
            '--no-interaction' => true,
        ])->assertExitCode(2);
    }

    public function test_weak_password_exits_nonzero(): void
    {
        $this->artisan('admin:create', [
            '--name' => 'X',
            '--email' => 'x@x.com',
            '--password' => 'short',
            '--no-interaction' => true,
        ])->assertExitCode(1);
    }
}
```

- [ ] **Step 2: Run — expect fail**

```bash
cd backend && php artisan test --filter=AdminCreateCommandTest
```

- [ ] **Step 3: Implement command**

```php
<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use App\Services\Audit\AuditLogger;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class AdminCreate extends Command
{
    protected $signature = 'admin:create
        {--name= : Name}
        {--email= : Email}
        {--password= : Password (omit to be prompted)}
        {--super : Create as super_admin}';

    protected $description = 'Create a new admin user';

    public function handle(AuditLogger $auditLogger): int
    {
        $name = $this->option('name') ?: $this->ask('Name');
        $email = strtolower($this->option('email') ?: $this->ask('Email'));
        $password = $this->option('password') ?: $this->secret('Password');
        $isSuper = (bool) $this->option('super');

        if ($isSuper && !$this->option('no-interaction')) {
            if (!$this->confirm('This will create a SUPER ADMIN with full system access. Continue?', false)) {
                $this->warn('Aborted.');
                return 1;
            }
        }

        $validator = Validator::make(
            ['name' => $name, 'email' => $email, 'password' => $password],
            [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:255'],
                'password' => ['required', \Illuminate\Validation\Rules\Password::min(12)->letters()->numbers()],
            ]
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $msg) {
                $this->error($msg);
            }
            return 1;
        }

        if (User::where('email', $email)->exists()) {
            $this->error("An account with email {$email} already exists.");
            return 2;
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'role' => $isSuper ? UserRole::SuperAdmin : UserRole::Admin,
        ]);

        $auditLogger->log(
            action: 'admin.created',
            target: $user,
            properties: ['via' => 'cli', 'super' => $isSuper],
            userId: null,
        );

        $this->info("Created {$user->role->value} #{$user->id} <{$user->email}>");
        return 0;
    }
}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd backend && php artisan test --filter=AdminCreateCommandTest
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/Console/Commands/AdminCreate.php \
        backend/tests/Feature/Console/AdminCreateCommandTest.php
git commit -m "feat(auth): admin:create artisan command"
```

---

## PHASE 9 — Backend config and env

### Task 9.1: CORS + Sanctum config

**Files:**
- Modify: `backend/config/cors.php` (create if missing)
- Modify: `backend/config/sanctum.php` (create if missing via `php artisan config:publish sanctum`)
- Modify: `backend/bootstrap/app.php`

- [ ] **Step 1: Ensure CORS config exists**

```bash
cd backend && ls config/cors.php 2>/dev/null || php artisan config:publish cors
```

Edit `backend/config/cors.php`:

```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_filter(explode(',', env('FRONTEND_URL', 'http://localhost:3000'))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

- [ ] **Step 2: Ensure Sanctum config exists**

```bash
cd backend && ls config/sanctum.php 2>/dev/null || php artisan config:publish sanctum
```

Verify the `stateful` key reads from `SANCTUM_STATEFUL_DOMAINS` env (this is the Laravel default — no change usually needed).

- [ ] **Step 3: Register Sanctum middleware in `bootstrap/app.php`**

Inside `->withMiddleware(function (Middleware $middleware) { ... })`:

```php
$middleware->statefulApi();  // Enables Sanctum SPA stateful auth for the /api/* group
```

This is Laravel 11/12's one-liner that enables `EnsureFrontendRequestsAreStateful` on the `api` group.

- [ ] **Step 4: Run tests**

```bash
cd backend && php artisan test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add backend/config/cors.php backend/config/sanctum.php backend/bootstrap/app.php
git commit -m "feat(auth): configure CORS and Sanctum stateful API"
```

### Task 9.2: `.env.example` updates

**Files:**
- Modify: `backend/.env.example`

- [ ] **Step 1: Append**

Add these lines if not already present:

```
FRONTEND_URL=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
BILLING_BASE_CURRENCY=IDR
```

- [ ] **Step 2: Commit**

```bash
git add backend/.env.example
git commit -m "chore: document auth-related env vars"
```

---

## PHASE 10 — Frontend API client + auth foundation

### Task 10.1: Rewrite `lib/api/client.ts` for Sanctum SPA

**Files:**
- Modify: `frontend/lib/api/client.ts`
- Create: `frontend/lib/api/csrf.ts`

- [ ] **Step 1: Create CSRF helper**

`frontend/lib/api/csrf.ts`:

```ts
const SANCTUM_URL = process.env.NEXT_PUBLIC_SANCTUM_URL || 'http://localhost:8000';

let csrfFetched = false;

export async function ensureCsrf(): Promise<void> {
    if (csrfFetched) return;
    const res = await fetch(`${SANCTUM_URL}/sanctum/csrf-cookie`, {
        credentials: 'include',
    });
    if (!res.ok) {
        throw new Error(`CSRF fetch failed: ${res.status}`);
    }
    csrfFetched = true;
}

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
}

export function xsrfHeader(): Record<string, string> {
    const token = getCookie('XSRF-TOKEN');
    return token ? { 'X-XSRF-TOKEN': token } : {};
}

export function resetCsrf(): void {
    csrfFetched = false;
}
```

- [ ] **Step 2: Rewrite `frontend/lib/api/client.ts`**

```ts
import { ensureCsrf, xsrfHeader, resetCsrf } from './csrf';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    headers?: Record<string, string>;
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
    onUnauthorized = handler;
}

class ApiClient {
    constructor(private baseUrl: string) {}

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { method = 'GET', body, headers = {} } = options;
        const isFormData = body instanceof FormData;

        const requestHeaders: Record<string, string> = {
            Accept: 'application/json',
            ...headers,
        };
        if (!isFormData) requestHeaders['Content-Type'] = 'application/json';

        if (method !== 'GET') {
            await ensureCsrf();
            Object.assign(requestHeaders, xsrfHeader());
        }

        const config: RequestInit = {
            method,
            headers: requestHeaders,
            credentials: 'include',
        };
        if (body && method !== 'GET') {
            config.body = isFormData ? (body as FormData) : JSON.stringify(body);
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, config);

        if (response.status === 401 && onUnauthorized) {
            onUnauthorized();
        }
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'An error occurred' }));
            throw { status: response.status, ...error };
        }
        if (response.status === 204) return {} as T;
        return response.json();
    }

    get<T>(endpoint: string) { return this.request<T>(endpoint, { method: 'GET' }); }
    post<T>(endpoint: string, body?: unknown) { return this.request<T>(endpoint, { method: 'POST', body }); }
    put<T>(endpoint: string, body?: unknown) { return this.request<T>(endpoint, { method: 'PUT', body }); }
    delete<T>(endpoint: string) { return this.request<T>(endpoint, { method: 'DELETE' }); }

    async download(endpoint: string, filename: string) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            credentials: 'include',
        });
        if (response.status === 401 && onUnauthorized) onUnauthorized();
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Download failed' }));
            throw { status: response.status, ...error };
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
export { resetCsrf };
```

- [ ] **Step 3: Verify build**

```bash
cd frontend && npm run build
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add frontend/lib/api/client.ts frontend/lib/api/csrf.ts
git commit -m "feat(auth): Sanctum SPA-ready API client with CSRF + 401 hook"
```

### Task 10.2: API modules for auth, admins, audit

**Files:**
- Create: `frontend/lib/api/auth.ts`
- Create: `frontend/lib/api/admins.ts`
- Create: `frontend/lib/api/audit.ts`
- Modify: `frontend/lib/api/index.ts`

- [ ] **Step 1: Create auth.ts**

```ts
import { apiClient } from './client';
import { User } from '@/types';

export async function login(email: string, password: string): Promise<void> {
    await apiClient.post('/login', { email, password });
}

export async function logout(all = false): Promise<void> {
    await apiClient.post('/logout', all ? { all: true } : undefined);
}

export async function getMe(): Promise<{ data: User }> {
    return apiClient.get<{ data: User }>('/me');
}
```

- [ ] **Step 2: Create admins.ts**

```ts
import { apiClient } from './client';
import { Admin, PaginatedResponse, SingleResponse } from '@/types';

export async function listAdmins(page = 1): Promise<PaginatedResponse<Admin>> {
    return apiClient.get<PaginatedResponse<Admin>>(`/admins?page=${page}`);
}

export async function getAdmin(id: number): Promise<SingleResponse<Admin>> {
    return apiClient.get<SingleResponse<Admin>>(`/admins/${id}`);
}

export async function createAdmin(data: {
    name: string; email: string; password: string; role: 'super_admin' | 'admin';
}): Promise<SingleResponse<Admin>> {
    return apiClient.post<SingleResponse<Admin>>('/admins', data);
}

export async function updateAdmin(id: number, data: Partial<{
    name: string; email: string; password: string; role: 'super_admin' | 'admin';
}>): Promise<SingleResponse<Admin>> {
    return apiClient.put<SingleResponse<Admin>>(`/admins/${id}`, data);
}

export async function deleteAdmin(id: number): Promise<void> {
    await apiClient.delete(`/admins/${id}`);
}
```

- [ ] **Step 3: Create audit.ts**

```ts
import { apiClient } from './client';
import { ActivityLogEntry, LoginAttempt, PaginatedResponse } from '@/types';

export type ActivityFilters = {
    user_id?: number;
    action?: string;
    loggable_type?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
};

export type LoginAttemptFilters = {
    email?: string;
    ip?: string;
    successful?: boolean;
    date_from?: string;
    date_to?: string;
    page?: number;
};

function toQuery(params: Record<string, unknown>): string {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    }
    const s = q.toString();
    return s ? `?${s}` : '';
}

export async function getActivity(filters: ActivityFilters = {}): Promise<PaginatedResponse<ActivityLogEntry>> {
    return apiClient.get<PaginatedResponse<ActivityLogEntry>>(`/audit/activity${toQuery(filters)}`);
}

export async function getLoginAttempts(filters: LoginAttemptFilters = {}): Promise<PaginatedResponse<LoginAttempt>> {
    return apiClient.get<PaginatedResponse<LoginAttempt>>(`/audit/login-attempts${toQuery(filters)}`);
}
```

- [ ] **Step 4: Re-export from index.ts**

Append to `frontend/lib/api/index.ts`:

```ts
export * as auth from './auth';
export * as admins from './admins';
export * as audit from './audit';
```

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/api/auth.ts frontend/lib/api/admins.ts frontend/lib/api/audit.ts frontend/lib/api/index.ts
git commit -m "feat(auth): frontend api modules for auth, admins, audit"
```

### Task 10.3: Types

**Files:**
- Modify: `frontend/types/api.ts`
- Modify: `frontend/types/index.ts`

- [ ] **Step 1: Add types**

Append to `frontend/types/api.ts`:

```ts
export type UserRole = 'super_admin' | 'admin';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
}

export interface Admin extends User {
    created_at: string;
    updated_at: string;
    last_login_at?: string | null;
}

export interface ActivityLogEntry {
    id: number;
    action: string;
    user: { id: number; name: string; email: string } | null;
    loggable_type: string | null;
    loggable_id: number | null;
    properties: Record<string, unknown>;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

export interface LoginAttempt {
    id: number;
    email: string;
    user_id: number | null;
    ip_address: string;
    user_agent: string | null;
    successful: boolean;
    attempted_at: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
    links: { first: string; last: string; prev: string | null; next: string | null };
}
```

Ensure `SingleResponse<T>` exists. If already defined, skip. Otherwise append:

```ts
export interface SingleResponse<T> { data: T; }
```

- [ ] **Step 2: Build**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/types
git commit -m "feat(auth): frontend types for user, admin, audit"
```

### Task 10.4: `AuthProvider` + `useAuth`

**Files:**
- Create: `frontend/lib/auth/AuthProvider.tsx`
- Create: `frontend/lib/auth/useAuth.ts`
- Create: `frontend/lib/auth/index.ts`
- Modify: `frontend/app/layout.tsx`

- [ ] **Step 1: Create AuthProvider**

```tsx
'use client';

import { createContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as authApi from '@/lib/api/auth';
import { setUnauthorizedHandler } from '@/lib/api/client';
import { User } from '@/types';

interface AuthContextValue {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: (all?: boolean) => Promise<void>;
    refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const refresh = useCallback(async () => {
        try {
            const res = await authApi.getMe();
            setUser(res.data);
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setUnauthorizedHandler(() => {
            setUser(null);
            if (pathname !== '/login') {
                router.replace(`/login?next=${encodeURIComponent(pathname)}`);
            }
        });
        refresh();
        return () => setUnauthorizedHandler(null);
    }, [refresh, router, pathname]);

    const login = useCallback(async (email: string, password: string) => {
        await authApi.login(email, password);
        await refresh();
    }, [refresh]);

    const logout = useCallback(async (all = false) => {
        try { await authApi.logout(all); } finally {
            setUser(null);
            router.replace('/login');
        }
    }, [router]);

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, refresh }}>
            {children}
        </AuthContext.Provider>
    );
}
```

- [ ] **Step 2: Create useAuth hook**

```ts
'use client';

import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
```

- [ ] **Step 3: Create index**

```ts
export { AuthProvider } from './AuthProvider';
export { useAuth } from './useAuth';
```

- [ ] **Step 4: Wrap app in `frontend/app/layout.tsx`**

Wrap inside `QueryProvider`:

```tsx
import { AuthProvider } from '@/lib/auth';

// ...
<QueryProvider>
    <AuthProvider>
        <Layout>{children}</Layout>
        <Toaster />
    </AuthProvider>
</QueryProvider>
```

- [ ] **Step 5: Build**

```bash
cd frontend && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add frontend/lib/auth frontend/app/layout.tsx
git commit -m "feat(auth): AuthProvider + useAuth with 401 redirect"
```

### Task 10.5: `middleware.ts` (edge)

**Files:**
- Create: `frontend/middleware.ts`

- [ ] **Step 1: Create middleware**

```ts
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login'];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Allow public paths and static assets through
    if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
        return NextResponse.next();
    }

    // Cookie presence check — Laravel session cookie is named after the app, default 'laravel_session'
    // Sanctum SPA also sets XSRF-TOKEN. Either one is a reasonable presence signal.
    const sessionCookie = req.cookies.get('laravel_session') || req.cookies.get('XSRF-TOKEN');
    if (!sessionCookie) {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Run on everything except Next internals + static
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)',
    ],
};
```

- [ ] **Step 2: Build**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/middleware.ts
git commit -m "feat(auth): Next.js edge middleware for cookie-presence gating"
```

---

## PHASE 11 — Login page

### Task 11.1: `LoginForm` component + login page

**Files:**
- Create: `frontend/components/auth/LoginForm.tsx`
- Create: `frontend/app/login/page.tsx`

- [ ] **Step 1: Create LoginForm**

```tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export function LoginForm() {
    const router = useRouter();
    const params = useSearchParams();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [retryAfter, setRetryAfter] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setRetryAfter(null);
        setLoading(true);
        try {
            await login(email, password);
            const next = params.get('next') || '/';
            router.replace(next);
        } catch (err: unknown) {
            const e = err as { status?: number; message?: string };
            if (e.status === 429) {
                setRetryAfter(60);
                setError('Too many login attempts. Please wait and try again.');
            } else if (e.status === 401) {
                setError('Invalid email or password.');
            } else {
                setError(e.message || 'Unable to sign in.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4 max-w-sm mx-auto">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required autoComplete="email" value={email}
                       onChange={e => setEmail(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required autoComplete="current-password" value={password}
                       onChange={e => setPassword(e.target.value)} disabled={loading} />
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            {retryAfter && <p className="text-xs text-muted-foreground">Retry in ~{retryAfter}s</p>}
            <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Sign in
            </Button>
        </form>
    );
}
```

- [ ] **Step 2: Create login page**

`frontend/app/login/page.tsx`:

```tsx
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-6">
                <header className="text-center space-y-1">
                    <h1 className="text-2xl font-semibold">Sign in</h1>
                    <p className="text-sm text-muted-foreground">Internal accounting dashboard</p>
                </header>
                <LoginForm />
            </div>
        </main>
    );
}
```

- [ ] **Step 3: Ensure Layout hides nav on `/login`**

Expect Layout to already branch on pathname. If it doesn't, modify `frontend/components/Layout.tsx` to render children directly when `usePathname() === '/login'`.

```tsx
'use client';
import { usePathname } from 'next/navigation';

export function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    if (pathname === '/login') return <>{children}</>;
    // ... existing navbar + layout
}
```

- [ ] **Step 4: Build**

```bash
cd frontend && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add frontend/components/auth frontend/app/login frontend/components/Layout.tsx
git commit -m "feat(auth): login page with rate-limit handling"
```

---

## PHASE 12 — Layout integration (user menu, logout, role-gated nav)

### Task 12.1: Add user menu + role-aware nav links

**Files:**
- Modify: `frontend/components/Layout.tsx` (or wherever the header is rendered)

- [ ] **Step 1: Add user menu to header**

Inside the header render, add:

```tsx
'use client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

// inside header JSX:
{user && (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost">{user.name}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem asChild><Link href="/settings">Settings</Link></DropdownMenuItem>
            <DropdownMenuItem onClick={() => logout()}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
)}
```

In the nav list, add role-gated links:

```tsx
<Link href="/audit">Audit Log</Link>
{user?.role === 'super_admin' && <Link href="/admins">Admins</Link>}
```

- [ ] **Step 2: Build + manual smoke test**

```bash
cd frontend && npm run build
```

Start `php artisan serve` + `npm run dev` briefly and visit `/` after login — verify menu shows user name, logout works, "Admins" link is hidden for regular admins.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/Layout.tsx
git commit -m "feat(auth): user menu, logout, role-aware nav"
```

---

## PHASE 13 — Admin management pages

### Task 13.1: `AdminsTable` component

**Files:**
- Create: `frontend/components/admins/AdminsTable.tsx`

- [ ] **Step 1: Create component**

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import * as adminsApi from '@/lib/api/admins';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function AdminsTable({ onDelete }: { onDelete: (id: number) => void }) {
    const { data, isLoading } = useQuery({
        queryKey: ['admins'],
        queryFn: () => adminsApi.listAdmins(),
    });

    if (isLoading) return <p>Loading...</p>;
    const rows = data?.data || [];

    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2">Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Last login</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {rows.map(a => (
                    <tr key={a.id} className="border-b">
                        <td className="py-2">{a.name}</td>
                        <td>{a.email}</td>
                        <td><Badge variant={a.role === 'super_admin' ? 'default' : 'secondary'}>{a.role}</Badge></td>
                        <td>{new Date(a.created_at).toLocaleDateString()}</td>
                        <td>{a.last_login_at ? new Date(a.last_login_at).toLocaleString() : '—'}</td>
                        <td className="text-right space-x-2">
                            <Button asChild variant="ghost" size="sm"><Link href={`/admins/${a.id}`}>Edit</Link></Button>
                            <Button variant="destructive" size="sm" onClick={() => onDelete(a.id)}>Delete</Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/admins/AdminsTable.tsx
git commit -m "feat(admin): AdminsTable component"
```

### Task 13.2: `AdminFormDialog` — create + edit in one

**Files:**
- Create: `frontend/components/admins/AdminFormDialog.tsx`

- [ ] **Step 1: Create component**

```tsx
'use client';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminsApi from '@/lib/api/admins';
import { Admin } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Mode = { kind: 'create' } | { kind: 'edit'; admin: Admin };

export function AdminFormDialog({
    mode, open, onOpenChange,
}: {
    mode: Mode; open: boolean; onOpenChange: (o: boolean) => void;
}) {
    const qc = useQueryClient();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'super_admin' | 'admin'>('admin');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (mode.kind === 'edit') {
            setName(mode.admin.name);
            setEmail(mode.admin.email);
            setRole(mode.admin.role);
            setPassword('');
        } else {
            setName(''); setEmail(''); setPassword(''); setRole('admin');
        }
        setError(null);
    }, [mode, open]);

    const mutation = useMutation({
        mutationFn: async () => {
            if (mode.kind === 'create') {
                return adminsApi.createAdmin({ name, email, password, role });
            } else {
                const payload: Record<string, unknown> = { name, email, role };
                if (password) payload.password = password;
                return adminsApi.updateAdmin(mode.admin.id, payload);
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admins'] });
            onOpenChange(false);
        },
        onError: (e: { message?: string; errors?: Record<string, string[]> }) => {
            if (e.errors) {
                const first = Object.values(e.errors)[0]?.[0];
                setError(first || 'Validation error');
            } else {
                setError(e.message || 'Error');
            }
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode.kind === 'create' ? 'Create admin' : 'Edit admin'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-3">
                    <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
                    <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                    <div>
                        <Label>Password {mode.kind === 'edit' && <span className="text-xs text-muted-foreground">(leave blank to keep current)</span>}</Label>
                        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required={mode.kind === 'create'} minLength={12} />
                    </div>
                    <div>
                        <Label>Role</Label>
                        <select value={role} onChange={e => setRole(e.target.value as 'super_admin' | 'admin')}
                                className="border rounded px-3 py-2 w-full">
                            <option value="admin">admin</option>
                            <option value="super_admin">super_admin</option>
                        </select>
                    </div>
                    {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mode.kind === 'create' ? 'Create' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/admins/AdminFormDialog.tsx
git commit -m "feat(admin): AdminFormDialog"
```

### Task 13.3: `DeleteAdminDialog`

**Files:**
- Create: `frontend/components/admins/DeleteAdminDialog.tsx`

- [ ] **Step 1: Create component**

```tsx
'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminsApi from '@/lib/api/admins';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function DeleteAdminDialog({
    adminId, open, onOpenChange,
}: {
    adminId: number | null; open: boolean; onOpenChange: (o: boolean) => void;
}) {
    const qc = useQueryClient();
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: () => adminsApi.deleteAdmin(adminId!),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admins'] });
            onOpenChange(false);
        },
        onError: (e: { message?: string; errors?: Record<string, string[]> }) => {
            const msg = e.errors ? Object.values(e.errors)[0]?.[0] : e.message;
            setError(msg || 'Unable to delete.');
        },
    });

    return (
        <Dialog open={open} onOpenChange={o => { if (!o) setError(null); onOpenChange(o); }}>
            <DialogContent>
                <DialogHeader><DialogTitle>Delete admin?</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">
                    This cannot be undone. The admin will lose access immediately.
                </p>
                {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button variant="destructive" disabled={mutation.isPending} onClick={() => mutation.mutate()}>Delete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/admins/DeleteAdminDialog.tsx
git commit -m "feat(admin): DeleteAdminDialog"
```

### Task 13.4: Admins list page

**Files:**
- Create: `frontend/app/admins/page.tsx`

- [ ] **Step 1: Create page**

```tsx
'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { AdminsTable } from '@/components/admins/AdminsTable';
import { AdminFormDialog } from '@/components/admins/AdminFormDialog';
import { DeleteAdminDialog } from '@/components/admins/DeleteAdminDialog';
import { Button } from '@/components/ui/button';

export default function AdminsPage() {
    const { user } = useAuth();
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    if (!user) return null;
    if (user.role !== 'super_admin') {
        return <div className="p-6 text-sm text-destructive">You don't have permission to view this page.</div>;
    }

    return (
        <div className="space-y-4 p-6">
            <header className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Admins</h1>
                <Button onClick={() => setCreateOpen(true)}>Create admin</Button>
            </header>
            <AdminsTable onDelete={setDeleteId} />
            <AdminFormDialog mode={{ kind: 'create' }} open={createOpen} onOpenChange={setCreateOpen} />
            <DeleteAdminDialog adminId={deleteId} open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)} />
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/admins/page.tsx
git commit -m "feat(admin): admins list page"
```

### Task 13.5: Admin detail/edit page

**Files:**
- Create: `frontend/app/admins/[id]/page.tsx`

- [ ] **Step 1: Create page**

```tsx
'use client';
import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import * as adminsApi from '@/lib/api/admins';
import { useAuth } from '@/lib/auth';
import { AdminFormDialog } from '@/components/admins/AdminFormDialog';

export default function AdminEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const [open, setOpen] = useState(true);

    const { data } = useQuery({
        queryKey: ['admin', id],
        queryFn: () => adminsApi.getAdmin(Number(id)),
    });

    if (!user) return null;
    if (user.role !== 'super_admin') {
        return <div className="p-6 text-sm text-destructive">Forbidden.</div>;
    }
    if (!data) return <div className="p-6">Loading...</div>;

    return (
        <AdminFormDialog
            mode={{ kind: 'edit', admin: data.data }}
            open={open}
            onOpenChange={o => { setOpen(o); if (!o) router.push('/admins'); }}
        />
    );
}
```

- [ ] **Step 2: Build**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/admins/[id]/page.tsx
git commit -m "feat(admin): admin edit page"
```

---

## PHASE 14 — Audit log pages

### Task 14.1: `ActivityTable` + filters + drawer

**Files:**
- Create: `frontend/components/audit/ActivityTable.tsx`
- Create: `frontend/components/audit/ActivityFilters.tsx`

- [ ] **Step 1: Create ActivityFilters**

```tsx
'use client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActivityFilters as Filters } from '@/lib/api/audit';

export function ActivityFilters({ value, onChange }: {
    value: Filters; onChange: (f: Filters) => void;
}) {
    const update = (patch: Partial<Filters>) => onChange({ ...value, ...patch });
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <div><Label>Action</Label><Input value={value.action ?? ''} onChange={e => update({ action: e.target.value })} placeholder="e.g. invoice.created" /></div>
            <div><Label>User ID</Label><Input type="number" value={value.user_id ?? ''} onChange={e => update({ user_id: e.target.value ? Number(e.target.value) : undefined })} /></div>
            <div><Label>Date from</Label><Input type="date" value={value.date_from ?? ''} onChange={e => update({ date_from: e.target.value })} /></div>
            <div><Label>Date to</Label><Input type="date" value={value.date_to ?? ''} onChange={e => update({ date_to: e.target.value })} /></div>
            <div className="col-span-full"><Label>Search</Label><Input value={value.search ?? ''} onChange={e => update({ search: e.target.value })} placeholder="Search properties, ip..." /></div>
        </div>
    );
}
```

- [ ] **Step 2: Create ActivityTable with drawer**

```tsx
'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as auditApi from '@/lib/api/audit';
import { ActivityLogEntry } from '@/types';
import { ActivityFilters as FiltersUI } from './ActivityFilters';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export function ActivityTable() {
    const [filters, setFilters] = useState<auditApi.ActivityFilters>({});
    const [selected, setSelected] = useState<ActivityLogEntry | null>(null);
    const { data, isLoading } = useQuery({
        queryKey: ['audit-activity', filters],
        queryFn: () => auditApi.getActivity(filters),
    });

    return (
        <div>
            <FiltersUI value={filters} onChange={setFilters} />
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-muted-foreground border-b">
                        <th className="py-2">When</th>
                        <th>Who</th>
                        <th>Action</th>
                        <th>Target</th>
                        <th>IP</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading && <tr><td colSpan={5} className="py-4">Loading...</td></tr>}
                    {(data?.data || []).map(row => (
                        <tr key={row.id} className="border-b cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelected(row)}>
                            <td className="py-2">{new Date(row.created_at).toLocaleString()}</td>
                            <td>{row.user?.name ?? '—'}</td>
                            <td><code className="text-xs">{row.action}</code></td>
                            <td>{row.loggable_type ? `${row.loggable_type.split('\\').pop()}#${row.loggable_id}` : '—'}</td>
                            <td className="text-xs">{row.ip_address ?? '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Sheet open={selected !== null} onOpenChange={o => !o && setSelected(null)}>
                <SheetContent className="w-[540px] sm:max-w-none">
                    <SheetHeader><SheetTitle>{selected?.action}</SheetTitle></SheetHeader>
                    <div className="space-y-3 mt-4 text-sm">
                        <div><strong>User:</strong> {selected?.user?.email ?? '—'}</div>
                        <div><strong>When:</strong> {selected && new Date(selected.created_at).toLocaleString()}</div>
                        <div><strong>IP / UA:</strong> {selected?.ip_address} · <span className="text-xs">{selected?.user_agent}</span></div>
                        <div>
                            <strong>Properties:</strong>
                            <pre className="text-xs bg-muted p-2 rounded overflow-auto">{JSON.stringify(selected?.properties, null, 2)}</pre>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/components/audit/ActivityTable.tsx frontend/components/audit/ActivityFilters.tsx
git commit -m "feat(audit): ActivityTable with filters and detail drawer"
```

### Task 14.2: Audit activity page

**Files:**
- Create: `frontend/app/audit/page.tsx`

- [ ] **Step 1: Create page**

```tsx
'use client';
import Link from 'next/link';
import { ActivityTable } from '@/components/audit/ActivityTable';

export default function AuditActivityPage() {
    return (
        <div className="space-y-4 p-6">
            <header className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Audit log — Activity</h1>
                <Link href="/audit/login-attempts" className="text-sm underline">Login attempts →</Link>
            </header>
            <ActivityTable />
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/audit/page.tsx
git commit -m "feat(audit): activity log page"
```

### Task 14.3: `LoginAttemptsTable` + filters + burst detection

**Files:**
- Create: `frontend/components/audit/LoginAttemptsTable.tsx`
- Create: `frontend/components/audit/LoginAttemptsFilters.tsx`

- [ ] **Step 1: Create filters component**

```tsx
'use client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoginAttemptFilters as Filters } from '@/lib/api/audit';

export function LoginAttemptsFilters({ value, onChange }: {
    value: Filters; onChange: (f: Filters) => void;
}) {
    const update = (p: Partial<Filters>) => onChange({ ...value, ...p });
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <div><Label>Email</Label><Input value={value.email ?? ''} onChange={e => update({ email: e.target.value })} /></div>
            <div><Label>IP</Label><Input value={value.ip ?? ''} onChange={e => update({ ip: e.target.value })} /></div>
            <div>
                <Label>Result</Label>
                <select value={value.successful === undefined ? '' : String(value.successful)}
                        onChange={e => update({ successful: e.target.value === '' ? undefined : e.target.value === 'true' })}
                        className="border rounded px-3 py-2 w-full">
                    <option value="">All</option>
                    <option value="true">Success</option>
                    <option value="false">Failed</option>
                </select>
            </div>
            <div><Label>Date from</Label><Input type="date" value={value.date_from ?? ''} onChange={e => update({ date_from: e.target.value })} /></div>
        </div>
    );
}
```

- [ ] **Step 2: Create table with burst detection**

```tsx
'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as auditApi from '@/lib/api/audit';
import { LoginAttempt } from '@/types';
import { LoginAttemptsFilters } from './LoginAttemptsFilters';
import { Badge } from '@/components/ui/badge';

function detectBursts(rows: LoginAttempt[]): Set<number> {
    // Burst = 3+ failed attempts from same IP within 5 minutes. Flag every row in such a burst.
    const burstIds = new Set<number>();
    const byIp = new Map<string, LoginAttempt[]>();
    rows.filter(r => !r.successful).forEach(r => {
        const list = byIp.get(r.ip_address) ?? [];
        list.push(r);
        byIp.set(r.ip_address, list);
    });
    byIp.forEach(list => {
        list.sort((a, b) => +new Date(a.attempted_at) - +new Date(b.attempted_at));
        for (let i = 0; i < list.length; i++) {
            const windowStart = +new Date(list[i].attempted_at);
            const inWindow = list.filter(r => {
                const t = +new Date(r.attempted_at);
                return t >= windowStart && t <= windowStart + 5 * 60 * 1000;
            });
            if (inWindow.length >= 3) inWindow.forEach(r => burstIds.add(r.id));
        }
    });
    return burstIds;
}

export function LoginAttemptsTable() {
    const [filters, setFilters] = useState<auditApi.LoginAttemptFilters>({});
    const { data, isLoading } = useQuery({
        queryKey: ['login-attempts', filters],
        queryFn: () => auditApi.getLoginAttempts(filters),
    });
    const bursts = useMemo(() => detectBursts(data?.data ?? []), [data]);

    return (
        <div>
            <LoginAttemptsFilters value={filters} onChange={setFilters} />
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-muted-foreground border-b">
                        <th className="py-2">When</th>
                        <th>Email</th>
                        <th>IP</th>
                        <th>Result</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading && <tr><td colSpan={5} className="py-4">Loading...</td></tr>}
                    {(data?.data ?? []).map(row => (
                        <tr key={row.id} className={`border-b ${row.successful ? '' : 'bg-destructive/5'}`}>
                            <td className="py-2">{new Date(row.attempted_at).toLocaleString()}</td>
                            <td>{row.email}</td>
                            <td className="font-mono text-xs">{row.ip_address}</td>
                            <td>{row.successful ? <Badge variant="default">OK</Badge> : <Badge variant="destructive">FAIL</Badge>}</td>
                            <td>{bursts.has(row.id) && <Badge variant="destructive">burst</Badge>}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/components/audit/LoginAttemptsTable.tsx frontend/components/audit/LoginAttemptsFilters.tsx
git commit -m "feat(audit): LoginAttemptsTable with burst detection"
```

### Task 14.4: Login attempts page

**Files:**
- Create: `frontend/app/audit/login-attempts/page.tsx`

- [ ] **Step 1: Create page**

```tsx
'use client';
import Link from 'next/link';
import { LoginAttemptsTable } from '@/components/audit/LoginAttemptsTable';

export default function LoginAttemptsPage() {
    return (
        <div className="space-y-4 p-6">
            <header className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Audit log — Login attempts</h1>
                <Link href="/audit" className="text-sm underline">← Activity</Link>
            </header>
            <LoginAttemptsTable />
        </div>
    );
}
```

- [ ] **Step 2: Build**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/audit/login-attempts/page.tsx
git commit -m "feat(audit): login attempts page"
```

---

## PHASE 15 — Settings polish

### Task 15.1: Sign-out-everywhere button

**Files:**
- Modify: `frontend/app/settings/page.tsx` (check it exists; if not, create minimal)

- [ ] **Step 1: Add sign-out-everywhere section**

Append to settings page:

```tsx
'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

function SessionSection() {
    const { logout } = useAuth();
    const [loading, setLoading] = useState(false);
    return (
        <section className="space-y-2">
            <h2 className="text-lg font-medium">Sessions</h2>
            <p className="text-sm text-muted-foreground">Sign out of this browser and every other active session for your account.</p>
            <Button variant="destructive" disabled={loading} onClick={async () => {
                setLoading(true);
                try { await logout(true); } finally { setLoading(false); }
            }}>Sign out everywhere</Button>
        </section>
    );
}
```

Include `<SessionSection />` in the settings layout.

- [ ] **Step 2: Commit**

```bash
git add frontend/app/settings/page.tsx
git commit -m "feat(auth): sign out of all sessions"
```

---

## PHASE 16 — Frontend component tests (Vitest)

### Task 16.1: Install Vitest + RTL

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/vitest.setup.ts`

- [ ] **Step 1: Install**

```bash
cd frontend && npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        globals: true,
    },
    resolve: {
        alias: { '@': path.resolve(__dirname, '.') },
    },
});
```

Install `@vitejs/plugin-react`:

```bash
cd frontend && npm install -D @vitejs/plugin-react
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Add npm scripts**

Edit `frontend/package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 5: Sanity check**

```bash
cd frontend && npm run test:run
```

Expected: "No tests found" — fine.

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts frontend/vitest.setup.ts
git commit -m "chore: install vitest + testing-library"
```

### Task 16.2: `LoginForm` test

**Files:**
- Create: `frontend/components/auth/LoginForm.test.tsx`

- [ ] **Step 1: Write test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { AuthContext } from '@/lib/auth/AuthProvider';

function renderWithAuth(login: (e: string, p: string) => Promise<void>) {
    return render(
        <AuthContext.Provider value={{ user: null, isLoading: false, login, logout: async () => {}, refresh: async () => {} }}>
            <LoginForm />
        </AuthContext.Provider>
    );
}

describe('LoginForm', () => {
    it('submits credentials', async () => {
        const login = vi.fn().mockResolvedValue(undefined);
        renderWithAuth(login);
        await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'secret-password-12');
        await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
        expect(login).toHaveBeenCalledWith('a@b.com', 'secret-password-12');
    });

    it('shows 401 error', async () => {
        const login = vi.fn().mockRejectedValue({ status: 401 });
        renderWithAuth(login);
        await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
        await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
        expect(await screen.findByRole('alert')).toHaveTextContent(/invalid/i);
    });

    it('shows 429 retry message', async () => {
        const login = vi.fn().mockRejectedValue({ status: 429 });
        renderWithAuth(login);
        await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'whatever');
        await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
        expect(await screen.findByRole('alert')).toHaveTextContent(/too many/i);
    });
});
```

NOTE: `LoginForm` uses `useRouter` and `useSearchParams` from `next/navigation`. Mock them in the test file:

```tsx
vi.mock('next/navigation', () => ({
    useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));
```

Place this mock at the top of the test file, above `describe`.

- [ ] **Step 2: Run**

```bash
cd frontend && npm run test:run
```

- [ ] **Step 3: Commit**

```bash
git add frontend/components/auth/LoginForm.test.tsx
git commit -m "test: LoginForm component tests"
```

### Task 16.3: `AdminFormDialog` test

**Files:**
- Create: `frontend/components/admins/AdminFormDialog.test.tsx`

- [ ] **Step 1: Write test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminFormDialog } from './AdminFormDialog';

function wrap(ui: React.ReactElement) {
    const client = new QueryClient();
    return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('AdminFormDialog', () => {
    it('create mode requires password', () => {
        wrap(<AdminFormDialog mode={{ kind: 'create' }} open={true} onOpenChange={() => {}} />);
        const pwd = screen.getByLabelText(/password/i) as HTMLInputElement;
        expect(pwd.required).toBe(true);
    });

    it('edit mode password optional with helper', () => {
        wrap(<AdminFormDialog mode={{ kind: 'edit', admin: { id: 1, name: 'A', email: 'a@b.com', role: 'admin', created_at: '', updated_at: '' } }} open={true} onOpenChange={() => {}} />);
        const pwd = screen.getByLabelText(/password/i) as HTMLInputElement;
        expect(pwd.required).toBe(false);
        expect(screen.getByText(/leave blank/i)).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run**

```bash
cd frontend && npm run test:run
```

- [ ] **Step 3: Commit**

```bash
git add frontend/components/admins/AdminFormDialog.test.tsx
git commit -m "test: AdminFormDialog component tests"
```

### Task 16.4: `ActivityTable` test

**Files:**
- Create: `frontend/components/audit/ActivityTable.test.tsx`

- [ ] **Step 1: Write test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActivityTable } from './ActivityTable';

vi.mock('@/lib/api/audit', () => ({
    getActivity: vi.fn().mockResolvedValue({
        data: [{
            id: 1,
            action: 'invoice.created',
            user: { id: 1, name: 'Alice', email: 'a@x.com' },
            loggable_type: 'App\\Models\\Invoice',
            loggable_id: 42,
            properties: { note: 'hello' },
            ip_address: '1.2.3.4',
            user_agent: 'test',
            created_at: new Date().toISOString(),
        }],
        meta: { current_page: 1, last_page: 1, per_page: 25, total: 1 },
        links: { first: '', last: '', prev: null, next: null },
    }),
}));

function wrap(ui: React.ReactElement) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('ActivityTable', () => {
    it('renders rows and opens drawer on click', async () => {
        wrap(<ActivityTable />);
        const row = await screen.findByText('invoice.created');
        await userEvent.click(row);
        expect(await screen.findByText(/"note": "hello"/)).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run**

```bash
cd frontend && npm run test:run
```

- [ ] **Step 3: Commit**

```bash
git add frontend/components/audit/ActivityTable.test.tsx
git commit -m "test: ActivityTable renders rows and drawer"
```

---

## PHASE 17 — Playwright E2E setup

### Task 17.1: Install Playwright + config

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/playwright.config.ts`
- Create: `frontend/e2e/.gitignore`

- [ ] **Step 1: Install**

```bash
cd frontend && npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Create config**

`frontend/playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    fullyParallel: false,  // DB state means serial
    workers: 1,
    retries: 0,
    use: {
        baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
        trace: 'on-first-retry',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
});
```

- [ ] **Step 3: Add scripts**

In `frontend/package.json`:

```json
{
  "scripts": {
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui"
  }
}
```

- [ ] **Step 4: Add `.gitignore` for Playwright artifacts**

`frontend/e2e/.gitignore`:

```
test-results/
playwright-report/
```

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/playwright.config.ts frontend/e2e/.gitignore
git commit -m "chore: install Playwright"
```

### Task 17.2: E2E helpers — DB reset + seeded admins

**Files:**
- Create: `frontend/e2e/helpers.ts`
- Create: `backend/app/Console/Commands/E2EReset.php`

- [ ] **Step 1: Create backend command that wipes + seeds known admins**

```php
<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class E2EReset extends Command
{
    protected $signature = 'e2e:reset';
    protected $description = 'Reset DB and seed known admins for E2E tests (NEVER run in production)';

    public function handle(): int
    {
        if (app()->environment('production')) {
            $this->error('Refusing to run in production.');
            return 1;
        }

        Artisan::call('migrate:fresh', ['--force' => true]);

        User::create([
            'name' => 'Super E2E',
            'email' => 'super@e2e.test',
            'password' => 'super-password-12',
            'role' => UserRole::SuperAdmin,
        ]);
        User::create([
            'name' => 'Admin E2E',
            'email' => 'admin@e2e.test',
            'password' => 'admin-password-12',
            'role' => UserRole::Admin,
        ]);

        $this->info('E2E reset complete.');
        return 0;
    }
}
```

- [ ] **Step 2: Create helpers for Playwright**

`frontend/e2e/helpers.ts`:

```ts
import { Page, expect } from '@playwright/test';
import { execSync } from 'child_process';

export function resetDb() {
    execSync('cd ../backend && php artisan e2e:reset', { stdio: 'inherit' });
}

export async function login(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.fill('input#email', email);
    await page.fill('input#password', password);
    await page.click('button[type="submit"]');
    await expect(page).not.toHaveURL(/\/login/);
}

export const SUPER = { email: 'super@e2e.test', password: 'super-password-12' };
export const ADMIN = { email: 'admin@e2e.test', password: 'admin-password-12' };
```

- [ ] **Step 3: Commit**

```bash
git add frontend/e2e/helpers.ts backend/app/Console/Commands/E2EReset.php
git commit -m "test(e2e): helpers and e2e:reset command"
```

---

## PHASE 18 — E2E tests

### Task 18.1: auth.spec.ts

**Files:**
- Create: `frontend/e2e/auth.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { test, expect } from '@playwright/test';
import { resetDb, login, SUPER } from './helpers';

test.beforeAll(() => resetDb());

test('unauth visit redirects to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
});

test('valid login lands on dashboard', async ({ page }) => {
    await login(page, SUPER.email, SUPER.password);
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
});

test('wrong password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#email', SUPER.email);
    await page.fill('input#password', 'wrong-password');
    await page.click('button[type="submit"]');
    await expect(page.getByRole('alert')).toContainText(/invalid/i);
    await expect(page).toHaveURL(/\/login/);
});

test('6 bad attempts yields rate limit', async ({ page }) => {
    for (let i = 0; i < 6; i++) {
        await page.goto('/login');
        await page.fill('input#email', 'lockme@e2e.test');
        await page.fill('input#password', 'nope');
        await page.click('button[type="submit"]');
    }
    await expect(page.getByRole('alert')).toContainText(/too many/i);
});

test('logout ends session', async ({ page }) => {
    await login(page, SUPER.email, SUPER.password);
    await page.getByRole('button', { name: SUPER.email.split('@')[0] }).click().catch(() => {});
    // Fall back to direct call through user menu label
    await page.click('text=Sign out');
    await expect(page).toHaveURL(/\/login/);
    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
});
```

- [ ] **Step 2: Commit**

```bash
git add frontend/e2e/auth.spec.ts
git commit -m "test(e2e): auth flow"
```

### Task 18.2: admins.spec.ts

**Files:**
- Create: `frontend/e2e/admins.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { test, expect } from '@playwright/test';
import { resetDb, login, SUPER, ADMIN } from './helpers';

test.beforeEach(() => resetDb());

test('super sees Admins link; regular does not', async ({ page, context }) => {
    await login(page, SUPER.email, SUPER.password);
    await expect(page.getByRole('link', { name: 'Admins' })).toBeVisible();

    await context.clearCookies();
    await login(page, ADMIN.email, ADMIN.password);
    await expect(page.getByRole('link', { name: 'Admins' })).not.toBeVisible();
});

test('regular admin direct navigating /admins sees forbidden', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto('/admins');
    await expect(page.getByText(/don't have permission/i)).toBeVisible();
});

test('super creates an admin', async ({ page }) => {
    await login(page, SUPER.email, SUPER.password);
    await page.goto('/admins');
    await page.click('text=Create admin');
    await page.fill('input[type="text"]', 'New User');
    await page.fill('input[type="email"]', 'newuser@e2e.test');
    await page.fill('input[type="password"]', 'aBcDefGh1234');
    await page.click('button:has-text("Create")');
    await expect(page.getByText('newuser@e2e.test')).toBeVisible();
});

test('delete last super admin blocked', async ({ page }) => {
    await login(page, SUPER.email, SUPER.password);
    await page.goto('/admins');
    // Super is the only super. Click delete on the super row:
    const superRow = page.locator('tr', { hasText: SUPER.email });
    await superRow.getByRole('button', { name: 'Delete' }).click();
    await page.click('button:has-text("Delete")');
    await expect(page.getByRole('alert')).toContainText(/cannot/i);
});
```

- [ ] **Step 2: Commit**

```bash
git add frontend/e2e/admins.spec.ts
git commit -m "test(e2e): admin management"
```

### Task 18.3: audit.spec.ts

**Files:**
- Create: `frontend/e2e/audit.spec.ts`

- [ ] **Step 1: Write test**

```ts
import { test, expect } from '@playwright/test';
import { resetDb, login, SUPER } from './helpers';

test.beforeAll(() => resetDb());

test('activity page shows auth.login row', async ({ page }) => {
    await login(page, SUPER.email, SUPER.password);
    await page.goto('/audit');
    await expect(page.locator('text=auth.login').first()).toBeVisible();
});

test('filter by action', async ({ page }) => {
    await login(page, SUPER.email, SUPER.password);
    await page.goto('/audit');
    await page.fill('input[placeholder*="invoice.created" i]', 'auth.login');
    await expect(page.locator('tbody tr').first()).toContainText('auth.login');
});

test('login attempts page shows failed row', async ({ page }) => {
    // Trigger a failed login to generate a row
    await page.goto('/login');
    await page.fill('input#email', 'nobody@e2e.test');
    await page.fill('input#password', 'bad');
    await page.click('button[type="submit"]');

    await login(page, SUPER.email, SUPER.password);
    await page.goto('/audit/login-attempts');
    await expect(page.locator('tr', { hasText: 'nobody@e2e.test' })).toBeVisible();
    await expect(page.locator('tr', { hasText: 'nobody@e2e.test' }).locator('text=FAIL')).toBeVisible();
});
```

- [ ] **Step 2: Commit**

```bash
git add frontend/e2e/audit.spec.ts
git commit -m "test(e2e): audit log pages"
```

### Task 18.4: Run full E2E and fix fallout

- [ ] **Step 1: Boot servers + run**

```bash
# Terminal 1
cd backend && php artisan serve

# Terminal 2
cd frontend && npm run dev

# Terminal 3 (when dev is ready on :3000)
cd frontend && npm run e2e
```

- [ ] **Step 2: Iterate until all specs pass**

Common fixes:
- Selector mismatches — adjust the selector in helpers/specs to match actual rendered output.
- Nav link text differs ("Audit Log" vs "Audit log") — match spec to code.
- Cookie domain in dev: make sure `SESSION_DOMAIN=` is empty and `SANCTUM_STATEFUL_DOMAINS=localhost:3000`.

- [ ] **Step 3: Commit any fixes**

```bash
git add <files>
git commit -m "test(e2e): fix selectors / timings"
```

---

## PHASE 19 — Final verification and PR

### Task 19.1: Full backend test run

- [ ] **Step 1: Run**

```bash
cd backend && php artisan test
```

Expected: 100% pass.

### Task 19.2: Full frontend build + unit tests

- [ ] **Step 1: Run**

```bash
cd frontend && npm run build && npm run test:run
```

Expected: clean build, all tests pass.

### Task 19.3: Final E2E

- [ ] **Step 1: Run**

```bash
cd frontend && npm run e2e
```

Expected: all specs pass.

### Task 19.4: Manual smoke test

- [ ] **Step 1: Boot servers**

```bash
# Terminal 1
cd backend && php artisan migrate:fresh && php artisan admin:create --super --name="Dev Admin" --email="dev@local.test" --password="dev-password-12" --no-interaction

# Terminal 2
cd backend && php artisan serve

# Terminal 3
cd frontend && npm run dev
```

- [ ] **Step 2: Test in browser**

Visit `http://localhost:3000/`, confirm redirect to `/login`. Log in. Verify:
- Dashboard renders (with `total_receivables` as structured object)
- User menu shows "Dev Admin" and sign-out works
- "Admins" link visible (super_admin)
- Create a new admin, verify row appears
- Audit log page shows `auth.login`, `admin.created`
- Login attempts page shows successful attempts
- Log out, log in as the new regular admin, verify no "Admins" link
- Navigate to `/admins` directly — see friendly forbidden message

- [ ] **Step 3: If anything is broken, fix and commit before opening the PR**

### Task 19.5: Open PR

- [ ] **Step 1: Push branch**

```bash
git push origin claude/intelligent-ride-81181b
```

- [ ] **Step 2: Open PR with detailed body**

```bash
gh pr create --base main --head claude/intelligent-ride-81181b \
    --title "feat: admin auth, RBAC, audit log, FX receivables, invoice-layout" \
    --body "$(cat <<'EOF'
## Summary

Ships the internal accounting app as an authenticated product:

- Admin authentication via Sanctum SPA cookies
- Two-tier roles: \`super_admin\` / \`admin\`
- Super admins can CRUD other admins (with self-lock and last-super-admin protection)
- Business-event audit log in extended \`activity_logs\` with redacted diffs
- Dedicated \`login_attempts\` table for security auditing (success + failure)
- Full frontend: login page, admin management, audit log viewer, login attempts viewer, sign-out-everywhere
- Playwright E2E covering auth, admin management, audit viewing
- All existing API routes gated behind \`auth:sanctum\`

This PR also folds in the prior \`invoice-layout\` branch and the FX receivables
refactor (structured \`total_receivables\` + currency-rates endpoints) so \`main\`
receives one cohesive release.

## Deploy recipe

1. Merge this PR
2. On the server:
   \`\`\`bash
   cd backend
   php artisan migrate
   php artisan admin:create --super
   \`\`\`
3. Set env vars (see \`.env.example\`): \`FRONTEND_URL\`, \`SANCTUM_STATEFUL_DOMAINS\`, \`SESSION_DOMAIN\`, \`SESSION_SECURE_COOKIE=true\`
4. Restart PHP-FPM and frontend

## Test plan

- [ ] \`cd backend && php artisan test\` — all green
- [ ] \`cd frontend && npm run build && npm run test:run\` — all green
- [ ] \`cd frontend && npm run e2e\` — all green
- [ ] Manual smoke: login, create admin, see audit log, sign out everywhere

## Spec

\`docs/superpowers/specs/2026-04-19-admin-auth-and-audit-log-design.md\`

## Plan

\`docs/superpowers/plans/2026-04-19-admin-auth-and-audit-log.md\`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Return the PR URL to the user**

---

## Notes for the implementing agent

- **Always** run the specific test for the task you're on first (`--filter=`) to tighten the feedback loop. Only run the full suite at milestone checkpoints (end of a phase).
- If an existing test breaks because of the trait-generated audit rows, prefer filtering by `action` rather than asserting total row counts.
- When adding middleware to routes, always verify with `php artisan route:list` that the middleware stack is what you expect.
- Never commit `.env` files, only `.env.example`.
- Never use `git add -A` or `git add .` — the repo carries uncommitted state that must not sweep in.
- After every commit: `git status` should be clean. If it isn't, investigate before moving on.
