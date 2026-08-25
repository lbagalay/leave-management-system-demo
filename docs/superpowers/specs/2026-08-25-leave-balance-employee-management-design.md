# Leave Balance and Employee Management Update Design

## Objective

Extend the existing leave management demo with hire dates and tenure, editable individual leave balances with adjustment history, admin-created employee records, and resigned employee handling. Preserve the fixed demo authentication identities, the existing yearly balance records, the atomic leave approval workflow, historical data, UI components, and visual styling.

## Scope

This update includes only:

- Employee hire dates and calculated tenure.
- Individual current-year leave entitlement and manual availability adjustments.
- Basic immutable balance-adjustment history.
- Admin-only employee record creation with initial balances.
- Admin-only hire-date editing.
- Admin-only resignation and reactivation.
- Active-by-default employee filtering with access to resigned and inactive records.
- Submission blocking for employees whose status is not `ACTIVE`.

This update does not include:

- New login credentials or authentication flows for created employees.
- Configurable entitlement-rule management.
- Additional optional profile fields.
- A generic audit-log subsystem.
- Permanent employee deletion.
- An approval-workflow rewrite.
- Unrelated UI redesign or codebase refactoring.

## Existing Architecture to Preserve

The application uses fixed, signed demo sessions for one employee, one supervisor, and one administrator. Database records use matching fixed `app_users` identifiers, while leave balances are already scoped by employee, leave type, and calendar year. Leave approval runs through `review_leave_request`, which locks a pending request and its balance, increments `used_days` once, and then approves the request.

Newly created employees will have `app_users`, `employees`, and `leave_balances` records but will not be added to the fixed demo identities and cannot log in. Supervisors retain their existing read-only employee access; only administrators can perform the new mutations.

## Data Model

### Employee hire date and status

Add a required `hire_date date` column to `employees`. The migration will add it as nullable, backfill existing rows from each employee's existing `created_at` date, and then apply the not-null constraint. Seed data will assign explicit historical hire dates so tenure is meaningful in the demo.

Extend the existing `employment_status` enum with `RESIGNED`. Keep `ACTIVE` and `INACTIVE` unchanged.

### Leave balances

Keep the existing yearly `leave_balances` table and its meanings:

- `allocated_days` is the editable entitlement.
- `used_days` is leave consumed by approved requests and is not directly editable.
- Add `adjustment_days`, defaulting to zero, for manual availability adjustments.
- Preserve the existing generated `remaining_days` compatibility column and add generated `available_days` as `allocated_days - used_days + adjustment_days`.

Existing balances retain the same entitlement, usage, and availability because their new adjustment is zero. Validation requires non-negative entitlement, usage, and resulting availability. An administrator may set availability above entitlement when the adjustment represents carryover or another manual increase.

When an administrator enters a desired entitlement and desired available balance, the stored adjustment is calculated as:

```text
adjustment_days = desired_available - desired_entitlement + used_days
```

The approval function remains otherwise unchanged: it compares the request with generated `available_days` and increments only `used_days` after approval. Pending, rejected, and cancelled requests do not change balances.

### Balance adjustment history

Add `leave_balance_adjustments` with:

- Employee, leave balance, leave type, and balance year identifiers.
- Previous and new entitlement.
- Previous and new available balance.
- Availability difference.
- Required adjustment reason.
- Administrator `app_users` identifier.
- Creation timestamp.

Rows are append-only in application behavior. A focused database function will lock the balance, validate the administrator and requested values, update entitlement and adjustment atomically, and insert the history row in the same transaction. It can also create a missing current-year balance with zero prior values so existing employees can receive another active leave type without a separate workflow.

### Employee creation

A focused database function will atomically create:

1. An `app_users` row with the submitted name, email, department, and `EMPLOYEE` role.
2. An `employees` row with employee number, name components, department, position, hire date, and employment status.
3. The `app_users.employee_id` link.
4. Submitted current-year initial balance rows for active leave types.

Initial balances have `used_days = 0`; each `adjustment_days` value is derived from the submitted entitlement and availability. The employee-creation form will prefill entitlements from the existing leave type `default_days`, but the administrator can edit entitlement and availability before submission. No authentication identity or password is provisioned.

## Application Behavior

### Tenure

A small date utility will calculate completed years and months between `hire_date` and the current date. It will format values such as `2 years, 7 months` and handle singular values and employment shorter than one month. Future hire dates are rejected by server validation.

### Employee directory

Update the existing employee directory rather than replacing it:

- Default the status filter to `ACTIVE`.
- Offer `All Employees`, `Active`, `Resigned`, and `Inactive` choices.
- Continue supporting search and department filtering.
- Show employee ID, name, hire date, tenure, status, current balance summary, and existing view action.
- Show an admin-only `Add employee` action.
- Load department choices from the departments table so empty departments remain available during employee creation.

### Employee creation UI

Add an admin-only page using the existing server-action and form-component patterns. Required fields are full name, employee ID, email, hire date, department, position, employment status, and current-year initial balances. The server action repeats all validation and calls the atomic creation function. Duplicate employee IDs and emails receive field-level, user-readable errors.

### Employee detail UI

Extend the existing detail page to show hire date and calculated tenure. Retain complete leave history for active, inactive, and resigned employees.

For administrators:

- Provide a small hire-date edit control.
- Provide an `Edit balance` action beside each current-year balance.
- Provide a way to add a current-year balance for an active leave type that is not assigned.
- Show balance-edit fields for entitlement, desired availability, and required reason. Used leave remains read-only.
- Show adjustment history with date, leave type, old/new entitlement, old/new availability, difference, reason, and administrator name.
- Show a confirmation dialog for `Mark as resigned`.
- Show `Reactivate` for resigned or inactive employees.

Supervisors see the same employee details and history within their existing department scope but do not see mutation controls.

### Resigned employees

Changing status to `RESIGNED` does not delete or modify leave requests, balances, or adjustment records. The employee disappears from the default active directory but remains available through the `All Employees` and `Resigned` filters and retains a working detail page.

The current employee lookup already requires `ACTIVE` status before inserting a leave request. Keep that server-side enforcement, add a database insert guard that locks and verifies the employee row to close resignation races, and add status-aware UI messaging so a resigned or inactive fixed demo employee is not shown an actionable new-request form. Reactivation changes the status back to `ACTIVE` without altering historical records or balances.

## Authorization and Error Handling

All new mutation actions call the existing `requireUser(["ADMIN"])` guard. Read access keeps the current administrator/supervisor scope. Database functions also verify that the supplied actor is an administrator before mutating records because the server client uses a service-role connection.

Forms use Zod validation, `useActionState`, pending states, inline errors, and the current redirect/revalidation conventions. Database functions return focused outcomes for invalid actor, stale or missing records, duplicate identity fields, invalid balances, and invalid status transitions. Error messages do not expose database details.

## Testing and Verification

Implementation follows test-first development. Automated coverage will include:

- Tenure calculations at year/month boundaries.
- Balance arithmetic and desired-availability adjustment calculation.
- Migration preservation for existing balances and requests.
- Atomic adjustment history creation.
- Approval deducting from the adjusted available balance exactly once.
- Rejected and cancelled requests leaving balances unchanged.
- Employee creation with profile and initial balance records but no login identity.
- Resignation preserving history and blocking new submissions.
- Reactivation restoring active status.
- Admin-only mutations and supervisor read-only behavior.

Final local verification will run focused tests, lint, TypeScript checking, and a production build. The hosted migration and browser walkthrough require database migration access; when available, the walkthrough covers creating an employee, confirming hire date and tenure, editing a balance and viewing its history, approving leave and observing the deduction, resigning the employee, confirming active-list removal, and reopening the historical record through the resigned filter.
