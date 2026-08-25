# Leave Balance and Employee Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hire dates and tenure, editable yearly employee balances with adjustment history, admin-created employee records, and resigned employee handling without changing demo authentication or the current leave approval workflow.

**Architecture:** Extend `employees` and `leave_balances` through one forward-only Supabase migration, add a focused adjustment-history table, and use two transactional PostgreSQL functions for multi-row employee creation and balance adjustment. Keep authorization in the current server actions and fixed demo sessions, extend the existing employee data-access module and pages, and verify the required flow against a reset local Supabase database.

**Tech Stack:** Next.js 16.3 App Router, React 19 Server Actions, TypeScript 5.7, Zod 3, Supabase/PostgreSQL 17, Tailwind CSS 4, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-25-leave-balance-employee-management-design.md`

## Global Constraints

- Preserve the fixed demo authentication identities and do not provision credentials for newly created employees.
- Preserve the existing `review_leave_request` approval workflow and its exactly-once `used_days` update.
- Use `allocated_days` for editable entitlement and `adjustment_days` for manual availability adjustments.
- Preserve all existing employee, balance, and leave-request records during migration.
- Keep supervisors read-only for the new employee mutations.
- Reuse existing UI components, server-action conventions, and styling.
- Do not add entitlement rules, optional profile fields, generic audit infrastructure, permanent deletion, or unrelated refactoring.
- Authenticate and authorize inside every Server Action, validate all `FormData`, call `revalidatePath` before `redirect`, and keep Next.js page `params` and `searchParams` asynchronous.

---

## File Structure

- Create `supabase/migrations/20260825000000_leave_balance_employee_management.sql`: safe schema extension, adjustment history, and transactional RPCs.
- Create `supabase/tests/leave_balance_employee_management.test.sql`: focused database regression coverage.
- Modify `supabase/seed.sql`: explicit hire dates only; preserve deterministic identities and history.
- Create `lib/leave/tenure.ts`: date-only tenure calculation and formatting.
- Create `lib/leave/balances.ts`: manual-adjustment arithmetic.
- Create `lib/leave/tenure.test.ts` and `lib/leave/balances.test.ts`: focused pure-logic tests.
- Modify `package.json` and `package-lock.json`: Vitest test runner and `test` script.
- Modify `types/database.ts`, `types/management.ts`, and `types/leave.ts`: scoped status, employee, balance, form, and action types.
- Modify `lib/db/management-employees.ts`: employee setup, directory/detail fields, missing leave types, and adjustment history.
- Modify `lib/db/employee-leave.ts`: status lookup for submission eligibility.
- Create `app/admin/employees/actions.ts`: admin-only employee creation, hire-date, balance, resignation, and reactivation actions.
- Create `components/employees/employee-create-form.tsx`: initial employee and balance form.
- Create `components/employees/balance-editor.tsx`: add/edit balance dialog.
- Create `components/employees/employee-record-actions.tsx`: hire-date and status dialogs.
- Create `app/admin/employees/new/page.tsx`: protected employee creation route.
- Modify `app/admin/employees/page.tsx`: active default, status choices, hire date, tenure, and add action.
- Modify `app/admin/employees/[id]/page.tsx`: hire date, tenure, admin controls, full leave history, and adjustment history.
- Modify `app/employee/leave/new/page.tsx`: explicit inactive/resigned submission-blocked state.
- Modify `app/globals.css`: responsive styles extending existing employee and dialog rules.
- Modify `README.md`: describe the scoped update and verification command.

---

### Task 1: Focused Balance and Tenure Logic

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `lib/leave/tenure.test.ts`
- Create: `lib/leave/balances.test.ts`
- Create: `lib/leave/tenure.ts`
- Create: `lib/leave/balances.ts`

**Interfaces:**
- Produces: `calculateTenure(hireDateIso: string, asOfIso: string): { years: number; months: number }`
- Produces: `formatTenure(hireDateIso: string, asOfIso: string): string`
- Produces: `calculateAdjustmentDays(entitlement: number, used: number, available: number): number`

- [ ] **Step 1: Install the focused test runner and add the test script**

Run:

```bash
npm install --save-dev vitest
```

Set the package script to:

```json
"test": "vitest run"
```

- [ ] **Step 2: Write tenure tests before the implementation**

```ts
import { describe, expect, it } from "vitest";
import { calculateTenure, formatTenure } from "./tenure";

describe("employee tenure", () => {
  it("calculates completed years and months", () => {
    expect(calculateTenure("2024-01-10", "2026-08-25")).toEqual({
      years: 2,
      months: 7,
    });
  });

  it("does not count an incomplete month", () => {
    expect(calculateTenure("2026-01-31", "2026-02-28")).toEqual({
      years: 0,
      months: 0,
    });
  });

  it("formats singular and sub-month tenure", () => {
    expect(formatTenure("2025-08-25", "2026-08-25")).toBe("1 year");
    expect(formatTenure("2026-08-20", "2026-08-25")).toBe("Less than 1 month");
  });
});
```

- [ ] **Step 3: Run the tenure tests and verify the missing module fails**

Run: `npm test -- lib/leave/tenure.test.ts`

Expected: FAIL because `lib/leave/tenure.ts` does not exist.

- [ ] **Step 4: Implement date-only tenure arithmetic**

```ts
function dateParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error("Invalid ISO date");
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

export function calculateTenure(hireDateIso: string, asOfIso: string) {
  const hire = dateParts(hireDateIso);
  const asOf = dateParts(asOfIso);
  let months = (asOf.year - hire.year) * 12 + asOf.month - hire.month;
  if (asOf.day < hire.day) months -= 1;
  if (months < 0) throw new Error("Hire date cannot be in the future");
  return { years: Math.floor(months / 12), months: months % 12 };
}
```

`formatTenure` returns `Less than 1 month` for zero months and joins only non-zero, correctly pluralized year/month parts.

- [ ] **Step 5: Run tenure tests and verify they pass**

Run: `npm test -- lib/leave/tenure.test.ts`

Expected: 3 tests PASS.

- [ ] **Step 6: Write adjustment arithmetic tests before implementation**

```ts
import { describe, expect, it } from "vitest";
import { calculateAdjustmentDays } from "./balances";

describe("manual balance adjustment", () => {
  it("derives adjustment days from desired availability", () => {
    expect(calculateAdjustmentDays(10, 3, 9)).toBe(2);
  });

  it("supports availability above entitlement", () => {
    expect(calculateAdjustmentDays(10, 0, 12)).toBe(2);
  });
});
```

- [ ] **Step 7: Run the adjustment tests and verify the missing module fails**

Run: `npm test -- lib/leave/balances.test.ts`

Expected: FAIL because `lib/leave/balances.ts` does not exist.

- [ ] **Step 8: Implement the adjustment formula and rerun both files**

```ts
export function calculateAdjustmentDays(
  entitlement: number,
  used: number,
  available: number,
) {
  return available - entitlement + used;
}
```

Run: `npm test -- lib/leave/tenure.test.ts lib/leave/balances.test.ts`

Expected: 5 tests PASS.

- [ ] **Step 9: Commit the focused logic**

```bash
git add package.json package-lock.json lib/leave/tenure.ts lib/leave/tenure.test.ts lib/leave/balances.ts lib/leave/balances.test.ts
git commit -m "test: cover tenure and balance adjustments"
```

---

### Task 2: Safe Database Extension and Transactional Mutations

**Files:**
- Create: `supabase/tests/leave_balance_employee_management.test.sql`
- Create: `supabase/migrations/20260825000000_leave_balance_employee_management.sql`
- Modify: `supabase/seed.sql`

**Interfaces:**
- Produces: `public.adjust_employee_leave_balance(uuid, uuid, uuid, integer, numeric, numeric, text)` returning `(outcome text, balance_id uuid)`.
- Produces: `public.create_employee_record(uuid, text, text, text, citext, uuid, text, date, text, integer, jsonb)` returning `(outcome text, employee_id uuid)`.
- Preserves: `public.review_leave_request(uuid, uuid, text, text)` unchanged.

- [ ] **Step 1: Start the local database at the existing schema**

Run:

```bash
npx supabase start
npx supabase db reset
```

Expected: the two existing migrations and seed apply successfully.

- [ ] **Step 2: Write schema assertions before the migration**

Create a pgTAP transaction that asserts:

```sql
begin;
create extension if not exists pgtap with schema extensions;
set search_path = extensions, public;
select plan(8);
select has_column('public', 'employees', 'hire_date');
select has_column('public', 'leave_balances', 'adjustment_days');
select has_table('public', 'leave_balance_adjustments');
select has_function('public', 'adjust_employee_leave_balance', array['uuid','uuid','uuid','integer','numeric','numeric','text']);
select has_function('public', 'create_employee_record', array['uuid','text','text','text','citext','uuid','text','date','text','integer','jsonb']);
select results_eq(
  $$select count(*)::bigint from public.employees$$,
  array[4::bigint],
  'existing employees are preserved'
);
select results_eq(
  $$select count(*)::bigint from public.leave_balances$$,
  array[7::bigint],
  'existing balances are preserved'
);
select results_eq(
  $$select count(*)::bigint from public.leave_requests$$,
  array[9::bigint],
  'existing requests are preserved'
);
select * from finish();
rollback;
```

- [ ] **Step 3: Run the database test and verify the new schema assertions fail**

Run: `npx supabase test db supabase/tests/leave_balance_employee_management.test.sql`

Expected: FAIL for missing columns, table, and functions while preservation counts pass.

- [ ] **Step 4: Add the schema portion of the migration**

The migration performs these operations in order:

```sql
alter type public.employment_status add value if not exists 'RESIGNED';

alter table public.employees add column if not exists hire_date date;
update public.employees
set hire_date = (created_at at time zone 'Asia/Manila')::date
where hire_date is null;
alter table public.employees alter column hire_date set not null;

alter table public.leave_balances
  add column if not exists adjustment_days numeric(7,2) not null default 0;
alter table public.leave_balances drop constraint if exists leave_balances_check;
alter table public.leave_balances drop column remaining_days;
alter table public.leave_balances
  add column remaining_days numeric generated always as
    (allocated_days - used_days + adjustment_days) stored,
  add constraint leave_balances_available_nonnegative
    check (allocated_days - used_days + adjustment_days >= 0);
```

Create `leave_balance_adjustments` with the fields from the design, foreign keys using `on delete restrict`, numeric checks, indexes on `(employee_id, created_at desc)` and `(leave_balance_id, created_at desc)`, RLS, and one select policy using own-employee or `can_manage_employee` access.

Add updated-at behavior only to `leave_balances`; adjustment history remains append-only and timestamped by `created_at`.

- [ ] **Step 5: Add RPC existence stubs, reset, and make schema assertions pass**

Add temporary function bodies that validate no behavior and return `NOT_IMPLEMENTED` plus `null`; grant execution only to `service_role`. Reset and run the schema test.

Expected: all 8 initial assertions PASS.

- [ ] **Step 6: Add failing behavior assertions**

Append pgTAP assertions that call the stubs and expect:

```sql
select results_eq(
  $$select outcome from public.adjust_employee_leave_balance(
    '10000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    2026, 16, 12, 'Carried-over leave'
  )$$,
  array['UPDATED'::text],
  'admin can adjust a balance'
);
```

Also assert the updated balance is entitlement `16`, adjustment `1`, used `5`, available `12`; one adjustment-history row has previous available `10`, new available `12`, difference `2`; a supervisor actor returns `UNAUTHORIZED`; and `create_employee_record` returns `CREATED` with one linked `app_users` row, an `employees.hire_date`, and submitted initial balances.

Add approval regression assertions by approving seeded pending request `50000000-0000-0000-0000-000000000001` and confirming Vacation availability changes from `12` to `10` exactly once. Assert seeded rejected and cancelled/non-approved requests do not alter their balances. Keep the test inside `begin`/`rollback`.

- [ ] **Step 7: Run database tests and verify stub outcomes fail**

Run: `npx supabase db reset && npx supabase test db supabase/tests/leave_balance_employee_management.test.sql`

Expected: FAIL because the stubs return `NOT_IMPLEMENTED`.

- [ ] **Step 8: Implement `adjust_employee_leave_balance`**

The function must:

```sql
-- validate actor role = ADMIN
-- validate non-negative entitlement/available and a 3..500 character reason
-- validate the employee and active leave type
-- select the current employee/type/year balance for update
-- insert a zero-used balance when missing
-- calculate adjustment_days = p_available - p_entitlement + used_days
-- update allocated_days and adjustment_days
-- insert the immutable history row using the locked previous values
-- return UPDATED and the balance id
```

Return `UNAUTHORIZED`, `INVALID_INPUT`, `EMPLOYEE_NOT_FOUND`, or `LEAVE_TYPE_NOT_FOUND` without mutations for the corresponding conditions.

- [ ] **Step 9: Implement `create_employee_record`**

The function must validate the admin actor, department, non-future hire date, allowed status, at least one JSON balance, unique email/employee number, active leave type IDs, and non-negative entitlement/availability. Within one function transaction it inserts `app_users`, `employees`, the back-link, and current-year balances using:

```sql
adjustment_days = available - entitlement
used_days = 0
```

Return `CREATED`, `UNAUTHORIZED`, `INVALID_INPUT`, `DEPARTMENT_NOT_FOUND`, `DUPLICATE_EMAIL`, `DUPLICATE_EMPLOYEE_NUMBER`, or `LEAVE_TYPE_NOT_FOUND` as focused outcomes.

- [ ] **Step 10: Update seed hire dates without changing identities or history**

Add `hire_date` to the existing employee upsert with deterministic values:

```text
Juan Dela Cruz: 2024-01-10
Maria Santos: 2025-06-15
Carlo Reyes: 2023-03-01
Andrea Lim: 2021-11-08
```

Include `hire_date = excluded.hire_date` in the conflict update and leave all existing request and balance values unchanged.

- [ ] **Step 11: Reset and verify database behavior**

Run:

```bash
npx supabase db reset
npx supabase test db supabase/tests/leave_balance_employee_management.test.sql
```

Expected: all pgTAP assertions PASS, and reset reports all three migrations plus seed applied.

- [ ] **Step 12: Commit the database extension**

```bash
git add supabase/migrations/20260825000000_leave_balance_employee_management.sql supabase/tests/leave_balance_employee_management.test.sql supabase/seed.sql
git commit -m "feat: extend employee balances and status data"
```

---

### Task 3: Typed Data Access and Admin Server Actions

**Files:**
- Modify: `types/database.ts`
- Modify: `types/management.ts`
- Modify: `types/leave.ts`
- Modify: `lib/db/management-employees.ts`
- Modify: `lib/db/employee-leave.ts`
- Create: `app/admin/employees/actions.ts`

**Interfaces:**
- Produces: `getEmployeeManagementSetup(): Promise<EmployeeManagementSetup | null>`.
- Produces: expanded `getManagementEmployeeDirectory` and `getManagementEmployeeDetail` results.
- Produces: `getEmployeeEmploymentStatus(userId: string): Promise<EmploymentStatus | null>`.
- Produces Server Actions: `createEmployeeAction`, `updateHireDateAction`, `adjustLeaveBalanceAction`, `updateEmploymentStatusAction`.

- [ ] **Step 1: Extend scoped TypeScript records**

Update the status union:

```ts
export type EmploymentStatus = "ACTIVE" | "INACTIVE" | "RESIGNED";
```

Add `hire_date` to `EmployeeRecord`. Extend management balances with `adjustmentDays` and `updatedAt`; summaries with `email`, `hireDate`, and `tenure`; details with `availableLeaveTypes` and `adjustments`.

Add these focused types:

```ts
export type LeaveBalanceAdjustment = {
  id: string;
  leaveTypeName: string;
  year: number;
  previousEntitlement: number;
  newEntitlement: number;
  previousAvailable: number;
  newAvailable: number;
  difference: number;
  reason: string;
  updatedByName: string;
  createdAt: string;
};

export type EmployeeManagementSetup = {
  departments: { id: string; name: string }[];
  leaveTypes: { id: string; code: string; name: string; defaultDays: number }[];
  balanceYear: number;
};
```

Define action-state types containing `status`, `message`, exact field-error keys, and submitted values so failed forms retain input.

- [ ] **Step 2: Extend data access without changing management scope**

In `getManagementEmployeeDirectory`, select `hire_date`, the employee's related `app_users.email`, balance `adjustment_days`/`updated_at`, and query all departments independently. Map `tenure` with `formatTenure(hireDate, today)` and keep current supervisor department scoping.

In `getManagementEmployeeDetail`, remove the six-request limit, query adjustment rows ordered newest first, and query active leave types so the UI can offer unassigned current-year types. Map updater names through the explicit adjustment `updated_by` relationship.

Add `getEmployeeManagementSetup` to load all departments and active leave types with `default_days`, returning the Manila current year.

- [ ] **Step 3: Add status-aware employee lookup**

Keep `getEmployeeIdentity` restricted to `ACTIVE`. Add:

```ts
export async function getEmployeeEmploymentStatus(userId: string) {
  const result = await supabase
    .from("employees")
    .select("employment_status")
    .eq("user_id", userId)
    .maybeSingle();
  return result.data?.employment_status ?? null;
}
```

- [ ] **Step 4: Implement validated admin actions**

Each action starts with `await requireUser(["ADMIN"])`, validates bound UUIDs and `FormData` using Zod, and returns only the UI action state.

`createEmployeeAction` validates first/last name, employee number, email, hire date not after `currentManilaDate()`, department, position, `ACTIVE|INACTIVE|RESIGNED`, and every current active leave type's entitlement/availability. It calls `create_employee_record`, maps RPC outcomes to field errors, revalidates `/admin/employees`, and redirects to `/admin/employees/{id}?created=1` outside `try/catch`.

`adjustLeaveBalanceAction` validates non-negative entitlement/availability and a 3..500 character reason, calls `adjust_employee_leave_balance`, revalidates the employee detail, employee directory, employee dashboard, and leave form paths, then returns `{ status: "success", message: "Leave balance updated." }` so the open page re-renders.

`updateHireDateAction` validates a non-future ISO date, updates only `hire_date` on the selected employee, revalidates list/detail, and returns success.

`updateEmploymentStatusAction` accepts only `RESIGNED` or `ACTIVE`, updates only an existing employee whose current status differs, revalidates list/detail plus employee dashboard/leave routes, and returns the status-specific success message.

- [ ] **Step 5: Run focused code verification**

Run:

```bash
npm test
npm run typecheck
npm run lint
```

Expected: focused tests pass and TypeScript/ESLint report zero errors.

- [ ] **Step 6: Commit typed backend behavior**

```bash
git add types/database.ts types/management.ts types/leave.ts lib/db/management-employees.ts lib/db/employee-leave.ts app/admin/employees/actions.ts
git commit -m "feat: add employee balance management actions"
```

---

### Task 4: Existing-Style Admin and Resigned Employee UI

**Files:**
- Create: `components/employees/employee-create-form.tsx`
- Create: `components/employees/balance-editor.tsx`
- Create: `components/employees/employee-record-actions.tsx`
- Create: `app/admin/employees/new/page.tsx`
- Modify: `app/admin/employees/page.tsx`
- Modify: `app/admin/employees/[id]/page.tsx`
- Modify: `app/employee/leave/new/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: Task 3 setup/detail types and four Server Actions.
- Produces: admin create/edit/resign/reactivate controls and explicit resigned/inactive submission messaging.

- [ ] **Step 1: Build the employee creation form with existing conventions**

Use a client component with `useActionState(createEmployeeAction, initialState)`. Render required first name, last name, employee ID, email, hire date, department, position, and status inputs. Render one current-year balance row per active leave type using input names `entitlement:{leaveTypeId}` and `available:{leaveTypeId}`, both prefilled from `defaultDays` unless returned state values exist. Use `required`, numeric `min="0"`, `step="0.5"`, `aria-invalid`, inline errors, and a pending-disabled submit button.

- [ ] **Step 2: Add the protected new-employee page**

The Server Component calls `requireUser(["ADMIN"])`, loads `getEmployeeManagementSetup`, renders the existing heading/back-link/card patterns and `EmployeeCreateForm`, and shows the existing safe unavailable state if setup fails.

- [ ] **Step 3: Update the directory in place**

Change status parsing to `ALL|ACTIVE|RESIGNED|INACTIVE` with default `ACTIVE`. Update labels to `All Employees`, `Active`, `Resigned`, and `Inactive`. Add an admin-only `Add employee` link. Replace separate Vacation/Sick columns with hire date, tenure, and a compact balance summary while retaining employee ID, name, status, and view action. Render `Resigned` distinctly and preserve responsive table `data-label` attributes.

- [ ] **Step 4: Build balance editing dialogs**

`BalanceEditor` binds employee, leave type, and year to `adjustLeaveBalanceAction`. Existing balances prefill entitlement and availability and show used leave read-only; missing balances prefill zero. Require the reason. Use the current `<dialog>`, close button, error alert, pending spinner, cancel, and confirmation styles. Close after success via an effect while the refreshed detail page displays the new adjustment row.

- [ ] **Step 5: Build hire-date and employment-status dialogs**

`EmployeeRecordActions` renders admin-only controls:

- Edit hire date with current value and a non-future `max`.
- Mark active/inactive employees as resigned with a clear history-preservation confirmation.
- Reactivate resigned/inactive employees to `ACTIVE`.

Bind the employee ID to the actions, keep action errors inside the relevant dialog, disable pending buttons, and use the current destructive-confirmation visual language without deleting any record.

- [ ] **Step 6: Extend employee detail content**

Add hire date, tenure, and email to employment details. Render `EmployeeRecordActions` only for admins. Each balance card shows entitled, used, adjusted, available, last updated, and an admin-only `Edit balance`. Add an admin-only `Add leave balance` control for each unassigned active leave type.

Keep all leave requests visible and add an adjustment-history table with date, type, old/new entitlement, old/new availability, difference, reason, and updated-by name. Supervisors receive the same read content without mutation controls.

- [ ] **Step 7: Add explicit submission blocking UI**

In `app/employee/leave/new/page.tsx`, load `getEmployeeEmploymentStatus` before form data. For `RESIGNED` or `INACTIVE`, render the existing empty-state card with a status-specific heading and the message that only active employees can submit new requests. Do not render `LeaveRequestForm`. Keep `submitLeaveRequestAction` unchanged so its active employee lookup remains the authoritative server-side block.

- [ ] **Step 8: Add only the required styles**

Extend existing employee card, table, form, status badge, and dialog selectors. Add `.employment-status-resigned`, creation form grid, balance edit affordances, action panel, adjustment table, and mobile stacking rules under the current breakpoints. Reuse the existing color variables, spacing scale, border radii, button patterns, and `spin` animation.

- [ ] **Step 9: Verify UI compilation and focused tests**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 10: Commit the scoped UI**

```bash
git add components/employees app/admin/employees app/employee/leave/new/page.tsx app/globals.css
git commit -m "feat: add scoped employee balance administration"
```

---

### Task 5: Demo Flow and Final Verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Verifies all interfaces produced by Tasks 1–4 together.

- [ ] **Step 1: Reset the local database and rerun database tests**

Run:

```bash
npx supabase db reset
npx supabase test db supabase/tests/leave_balance_employee_management.test.sql
```

Expected: migrations, seed, and all pgTAP assertions pass.

- [ ] **Step 2: Start the app against local Supabase**

Use values from `npx supabase status -o env` to start `npm run dev` with server URL/service-role and public URL/anon-key environment variables. Do not commit local credentials.

- [ ] **Step 3: Browser-verify employee creation**

Log in as `admin@demo.com` / `Demo123!`, open Employees, and confirm only active employees appear initially. Create `Demo Balance Employee` with employee ID `EMP-BAL-2026`, email `balance.employee@demo.com`, hire date `2024-01-10`, an active status, and initial balances. Confirm the detail page shows `2 years, 7 months`, the selected balances, and no login was added to the fixed account chooser.

- [ ] **Step 4: Browser-verify adjustment and approval deduction**

Open Juan Dela Cruz through the active directory. Edit the current Vacation balance to entitlement `16`, available `12`, reason `Carried-over leave`, and confirm the adjustment history records old/new values and `+2` availability difference. Approve Juan's seeded pending two-day Vacation request and confirm availability decreases from `12` to `10`; refresh and confirm it does not deduct again.

- [ ] **Step 5: Browser-verify resignation and retained history**

Mark Juan as resigned through the confirmation dialog. Confirm he disappears from the default active list, appears under `Resigned`, and his detail still shows balances, adjustment history, and leave requests. Sign in as the fixed employee identity and confirm `/employee/leave/new` shows the resigned submission-blocked state with no form. Sign back in as admin and reactivate Juan so the demo seed identity is left usable.

- [ ] **Step 6: Update concise project documentation**

Add the scoped capabilities to README's included-feature list, add the third migration and database test path, and include `npm test` in verification commands. Do not describe features outside this implementation.

- [ ] **Step 7: Run the complete fresh verification gate**

Run:

```bash
npm test
npm run lint
npm run typecheck
npm run build
npx supabase test db supabase/tests/leave_balance_employee_management.test.sql
git diff --check
git status --short
```

Expected: all code/database commands exit 0, no whitespace errors, and only the user-provided `leave-management-balance-update.md` remains untracked.

- [ ] **Step 8: Commit documentation and final fixes**

```bash
git add README.md
git commit -m "docs: document leave balance management flow"
```

If final verification required scoped fixes, include only their exact files in this commit and repeat Step 7 after committing.
