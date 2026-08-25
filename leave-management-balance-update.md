# Leave Management System — Employee Leave Balance & Employee Management Update

## Objective

Update the existing Leave Management System so leave balances are not fixed for every employee.

The system must support individual leave balances based on each employee's hire date, tenure, and company policy, while still allowing an admin to manually edit or override balances when needed.

---

## 1. Employee Leave Balance

### Requirements

Each employee must have their own leave balance.

Do not use one global fixed leave balance for all employees.

For every employee, store:

- Employee name
- Employee ID
- Hire date
- Employment status
- Leave type
- Total entitled leave
- Used leave
- Remaining / available leave
- Last balance update date

Example:

| Employee | Hire Date | Leave Type | Entitled | Used | Available |
|---|---|---|---:|---:|---:|
| Employee A | Jan 10, 2024 | Vacation Leave | 10 | 3 | 7 |
| Employee B | Jun 15, 2026 | Vacation Leave | 5 | 1 | 4 |

---

## 2. Editable Leave Balance

Admin users must be able to manually change an employee's leave balance.

Add an **Edit Leave Balance** action on the employee profile or employee management page.

Admin should be able to edit:

- Total entitled leave
- Available leave
- Leave type
- Optional adjustment reason

Example reasons:

- Annual leave allocation
- Tenure adjustment
- Manual correction
- Carried-over leave
- HR adjustment

### Important

Manual edits must not silently overwrite historical data.

Create a leave balance adjustment record containing:

- Employee ID
- Leave type
- Previous balance
- New balance
- Difference
- Reason
- Updated by
- Updated at

---

## 3. Hire Date and Tenure

Each employee must have a **Hire Date** field.

Calculate employee tenure from the hire date.

Example:

```text
Hire Date: January 10, 2024
Current Date: August 25, 2026
Tenure: 2 years, 7 months
```

The system should be prepared for company rules where leave entitlement changes depending on tenure.

Example rule structure:

```text
Less than 1 year = 5 days
1–2 years = 10 days
3+ years = 15 days
```

Do not hard-code these example values as permanent company rules unless configured by the admin.

---

## 4. Leave Entitlement Rules

Create a configurable leave entitlement structure.

Admin should be able to define rules such as:

- Minimum tenure
- Maximum tenure
- Leave type
- Number of entitled days

Example:

| Tenure | Leave Type | Entitlement |
|---|---|---:|
| 0–11 months | Vacation Leave | 5 |
| 1–2 years | Vacation Leave | 10 |
| 3+ years | Vacation Leave | 15 |

The system may calculate a **suggested leave entitlement** based on the employee's hire date and tenure.

The admin must still be able to manually override the calculated value.

---

## 5. Leave Balance Calculation

For each leave type:

```text
Available Leave = Current Entitlement - Approved/Used Leave + Manual Adjustments
```

Only approved leave requests should reduce the available balance.

Pending requests should not permanently deduct leave.

Rejected or cancelled leave requests must not reduce the final available balance.

---

## 6. Add Employee

Admin must be able to add new employees.

Required fields:

- Full name
- Employee ID
- Email
- Hire date
- Department
- Position
- Employment status
- Initial leave balances

Optional:

- Phone number
- Notes

After creating an employee, the admin should be able to assign or edit their leave entitlement.

---

## 7. Resigned Employees

Do not permanently delete resigned employees by default.

Add an employment status such as:

```text
ACTIVE
RESIGNED
INACTIVE
```

When an employee resigns, admin should be able to choose **Mark as Resigned / Deactivate**.

Once resigned:

- Employee should no longer be able to submit new leave requests
- Employee should not appear in the default active employee list
- Historical leave requests must remain available
- Leave balance history must remain available
- Admin can still view their employee record

Add a filter:

```text
All Employees
Active
Resigned
Inactive
```

If permanent deletion is included, restrict it to admins and show a clear confirmation warning.

---

## 8. Employee Management Page

Create or update the admin employee table.

Suggested columns:

| Name | Employee ID | Hire Date | Tenure | Status | Leave Balance | Actions |
|---|---|---|---|---|---|---|

Actions:

- View
- Edit
- Edit Leave Balance
- Mark as Resigned
- Reactivate

Add:

- Search
- Status filter
- Department filter

---

## 9. Employee Detail Page

The employee detail page should show:

### Employee Information

- Name
- Employee ID
- Department
- Position
- Hire date
- Tenure
- Employment status

### Leave Balances

For each leave type:

```text
Vacation Leave
Entitled: 10
Used: 3
Available: 7

Sick Leave
Entitled: 10
Used: 2
Available: 8
```

Admin should have an **Edit Balance** button beside each leave type.

### Leave History

Show:

- Leave type
- Start date
- End date
- Number of days
- Status
- Date submitted

### Balance Adjustment History

Show:

- Date
- Leave type
- Previous balance
- New balance
- Adjustment
- Reason
- Updated by

---

## 10. Suggested Database Changes

Adapt these models to the current database architecture instead of replacing existing working models.

### Employee

```text
Employee
- id
- userId
- employeeId
- fullName
- email
- department
- position
- hireDate
- employmentStatus
- createdAt
- updatedAt
```

### EmployeeLeaveBalance

```text
EmployeeLeaveBalance
- id
- employeeId
- leaveTypeId
- entitlement
- used
- available
- updatedAt
```

### LeaveBalanceAdjustment

```text
LeaveBalanceAdjustment
- id
- employeeId
- leaveTypeId
- previousBalance
- newBalance
- adjustment
- reason
- updatedBy
- createdAt
```

### LeaveEntitlementRule

```text
LeaveEntitlementRule
- id
- leaveTypeId
- minimumTenureMonths
- maximumTenureMonths
- entitledDays
- isActive
- createdAt
- updatedAt
```

---

## 11. Permissions

### Admin / HR

Can:

- Add employees
- Edit employee information
- Change hire date
- Edit leave balances
- Configure entitlement rules
- Mark employees as resigned/inactive
- View all leave history
- View balance adjustment history

### Employee

Can:

- View own leave balance
- View own leave history
- Submit leave requests

Cannot:

- Edit own leave balance
- Change hire date
- Change employment status
- Edit entitlement rules

---

## 12. Audit Trail

Important HR-related changes should be traceable.

Log:

- Leave balance changes
- Hire date changes
- Employment status changes
- Employee creation
- Employee reactivation
- Leave entitlement rule changes

Store:

- Action
- Old value
- New value
- Performed by
- Date/time

---

## 13. Demo Requirements

The final demo should clearly show the following flow:

1. Login as Admin / HR.
2. Open Employee Management.
3. Add a new employee.
4. Set the employee's hire date.
5. Show calculated tenure.
6. Show the employee's individual leave balance.
7. Edit the available leave balance manually.
8. Show the saved balance adjustment.
9. Submit or approve a leave request.
10. Show the leave balance decreasing after approval.
11. Mark an employee as resigned.
12. Show that the resigned employee is removed from the active employee list but their historical records remain accessible.

---

## 14. UI Notes

Keep the existing system design and styling.

Do not redesign the entire application unless necessary.

Prioritize:

- Clear admin controls
- Simple employee management
- Easy-to-understand leave balances
- Mobile responsiveness
- Confirmation dialogs for destructive actions
- Proper loading/error states
- Form validation

Avoid cluttered dashboards and unnecessary animations.

---

## 15. Implementation Instruction for Codex

Inspect the current Leave Management System before making changes.

Reuse the existing:

- Authentication
- Database
- Employee/user models
- Leave request workflow
- Leave types
- Approval logic
- UI components

Do not rebuild features that already exist.

Extend the current implementation to support:

1. Individual editable leave balances
2. Hire date and tenure
3. Configurable leave entitlement rules
4. Manual balance adjustments with history
5. Add employee
6. Resigned/inactive employee management
7. Audit trail
8. Demo-ready admin workflow

Preserve existing working functionality and avoid breaking current leave request and approval features.
