# Leave Management System — Demo Plan

## 1. Project Purpose

Build a polished, working **Leave Management System demo** that can be presented to management before full development begins.

The demo should prove the most important workflow:

> **Employee submits leave → Supervisor/Admin reviews it → Request is approved/rejected → Employee sees the updated status → Leave balance updates**

This is a **demo/prototype**, not the final production system. The goal is to show how the system will look, feel, and operate without spending time on every production feature.

---

## 2. Demo Goals

The demo must:

- Look professional enough for a management presentation
- Be responsive on desktop, tablet, and mobile
- Show separate Employee and Admin/Supervisor experiences
- Allow an employee to submit a leave request
- Allow an Admin/Supervisor to approve or reject that request
- Automatically update leave balances after approval
- Show request history and status
- Include realistic seeded demo data
- Include basic employee management
- Include a basic reports page
- Include clear loading, success, empty, and error states
- Be deployed to a live URL
- Be easy to demonstrate in a 2–4 minute walkthrough video

---

# 3. Recommended Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

## Backend / Database

- Supabase
- PostgreSQL

## Authentication

For the demo:

- Supabase Auth, or
- Simple seeded demo authentication if faster

Recommended demo roles:

- `EMPLOYEE`
- `SUPERVISOR`
- `ADMIN`

## Deployment

- Vercel
- Supabase hosted PostgreSQL

---

# 4. Important Demo Rule

## Do Not Overbuild

This demo is not the full production system.

Do **not** spend time yet on:

- Payroll integration
- Biometric integration
- Advanced leave accrual engines
- SMS integration
- Production email infrastructure
- Complex organization settings
- SSO
- Advanced audit/compliance systems
- Full HRIS integration
- Advanced analytics
- Complex PDF generation
- Multi-company tenancy
- Production-grade backup infrastructure
- Advanced notification preferences

These can be discussed after management approves the project.

---

# 5. User Roles

## 5.1 Employee

Employees should be able to:

- Log in
- View their dashboard
- See remaining leave balances
- File a leave request
- View submitted leave requests
- See request status
- View supervisor remarks
- Cancel a pending request if desired
- View recent leave history

---

## 5.2 Supervisor

Supervisors should be able to:

- Log in
- View pending requests
- Review leave details
- See employee leave balances
- Approve requests
- Reject requests
- Add remarks
- View employees under their department/team
- View basic leave activity

---

## 5.3 Admin

Admins should be able to:

- Access all supervisor functionality
- View all employees
- Manage employees
- View and adjust demo leave balances
- View requests across departments
- Access reports
- See basic system/support information

For the demo, Supervisor and Admin functionality may share most of the same UI.

---

# 6. Core Demo Workflow

This is the most important feature.

## Step 1 — Employee Logs In

Employee lands on dashboard.

Dashboard displays:

- Vacation Leave remaining
- Sick Leave remaining
- Other Leave remaining
- Pending requests
- Approved requests
- Recent activity

---

## Step 2 — Employee Files Leave

Employee opens **File Leave**.

Fields:

- Leave type
- Start date
- End date
- Number of days
- Reason
- Optional remarks
- Current available balance
- Estimated remaining balance after approval

User clicks:

`Submit Leave Request`

System validates the request.

---

## Step 3 — Request Becomes Pending

The request appears in:

- Employee request history
- Supervisor/Admin pending requests

Status:

`PENDING`

---

## Step 4 — Supervisor Reviews Request

Supervisor sees:

- Employee name
- Department
- Position
- Leave type
- Requested dates
- Number of leave days
- Reason
- Current leave balance
- Previous leave history
- Date submitted

Available actions:

- Approve
- Reject

Optional:

- Add remarks

---

## Step 5 — Approval

If approved:

- Request status changes to `APPROVED`
- Employee leave balance is reduced
- Request appears in approved leave history
- Employee dashboard updates

---

## Step 6 — Rejection

If rejected:

- Request status changes to `REJECTED`
- Leave balance remains unchanged
- Supervisor remarks are shown to the employee

---

# 7. Pages / Routes

Suggested route structure:

```text
/
├── login
│
├── employee
│   ├── dashboard
│   ├── leave
│   │   ├── new
│   │   └── requests
│   └── profile
│
├── admin
│   ├── dashboard
│   ├── requests
│   ├── employees
│   ├── employees/[id]
│   ├── reports
│   └── support
│
└── demo-info
```

---

# 8. Login Page

## Requirements

Create a clean corporate login page.

Include:

- Company/system placeholder logo
- System title:
  - `Leave Management System`
- Email field
- Password field
- Sign in button
- Demo account shortcuts

Suggested demo account section:

### Employee Demo

```text
employee@demo.com
Demo123!
```

### Admin Demo

```text
admin@demo.com
Demo123!
```

Optional supervisor account:

```text
supervisor@demo.com
Demo123!
```

## Important

These are demo-only credentials.

Do not use real company employee information.

---

# 9. Employee Dashboard

## Header

Show:

- Welcome message
- Employee name
- Department
- Current date

Example:

```text
Good morning, Juan.
Here is your leave overview.
```

---

## Leave Balance Cards

### Vacation Leave

Example:

```text
10 / 15 days remaining
```

### Sick Leave

Example:

```text
8 / 10 days remaining
```

### Other Leave

Example:

```text
3 / 5 days remaining
```

---

## Dashboard Summary

Cards:

- Pending Requests
- Approved This Year
- Remaining Leave
- Upcoming Leave

---

## Recent Requests

Table:

| Leave Type | Dates | Days | Status | Submitted |
|---|---|---:|---|---|
| Vacation | Aug 27–28 | 2 | Pending | Aug 24 |
| Sick | Jul 10 | 1 | Approved | Jul 9 |
| Vacation | Jun 2–3 | 2 | Approved | May 28 |

---

# 10. File Leave Page

## Form Fields

### Leave Type

Options:

- Vacation Leave
- Sick Leave
- Emergency Leave
- Bereavement Leave
- Other

For the demo, Vacation and Sick Leave balances are enough to implement fully.

---

### Start Date

Date picker.

---

### End Date

Date picker.

---

### Number of Days

Automatically calculate from dates.

For demo simplicity:

- Count weekdays
- Optionally ignore weekends

No holiday calendar needed yet.

---

### Reason

Textarea.

Minimum suggested length:

`5 characters`

---

### Balance Preview

Example:

```text
Current Vacation Leave: 10 days
Requested: 2 days
Balance after approval: 8 days
```

---

## Validation

Do not allow:

- End date before start date
- Zero-day request
- Request exceeding available balance
- Missing leave type
- Missing reason
- Duplicate exact request
- Invalid dates

---

# 11. My Leave Requests Page

Include filters:

- All
- Pending
- Approved
- Rejected

Table columns:

- Leave type
- Start date
- End date
- Number of days
- Status
- Submitted date
- Supervisor remarks
- Action

For pending requests:

- View
- Cancel

---

# 12. Admin / Supervisor Dashboard

## KPI Cards

Show:

- Pending Approvals
- Employees on Leave
- Total Employees
- Requests This Month

Example:

```text
Pending Approvals: 5
Employees on Leave Today: 2
Total Employees: 24
Requests This Month: 18
```

---

## Pending Requests

Show the latest requests.

Each request should show:

- Employee
- Department
- Leave type
- Dates
- Number of days
- Status
- View button

---

## Employees on Leave

Small list:

```text
Maria Santos
Accounting
Vacation Leave
Aug 24–25
```

---

## Leave Activity

A simple chart can be included if quick to implement.

Suggested:

- Requests by month
- Approved vs rejected

Do not spend significant development time on charts.

---

# 13. Leave Request Review Page

This is one of the main presentation screens.

## Employee Information

Show:

- Employee name
- Employee ID
- Department
- Position

---

## Request Information

Show:

- Leave type
- Start date
- End date
- Number of days
- Reason
- Submitted date

---

## Leave Balance

Example:

```text
Vacation Leave
Current balance: 10 days
Requested: 2 days
Balance after approval: 8 days
```

---

## Previous Leave Activity

Show the employee's last few leave requests.

---

## Actions

Buttons:

- `Approve Request`
- `Reject Request`

Before final action, display a confirmation modal.

### Approve Modal

```text
Approve Leave Request?

Juan Dela Cruz
Vacation Leave
August 27–28, 2026
2 days

This will reduce the employee's Vacation Leave
balance from 10 days to 8 days.

[Cancel] [Approve]
```

---

### Reject Modal

Allow remarks:

```text
Reason / Remarks
```

Example:

```text
Unable to approve due to scheduled department coverage.
```

---

# 14. Employee Management

## Employee List

Columns:

- Employee ID
- Name
- Department
- Position
- Vacation balance
- Sick balance
- Status
- Action

Filters:

- Search
- Department
- Status

---

## Employee Detail Page

Show:

- Basic information
- Leave balances
- Recent requests
- Current leave status

Admin can optionally adjust balances in the demo.

If balance editing becomes time-consuming, display the UI without advanced adjustment logic.

---

# 15. Reports Page

Keep this simple.

## Report Cards

Show:

- Leave Requests This Month
- Approved Requests
- Rejected Requests
- Total Leave Days Used

---

## Tables

### Leave Usage By Employee

| Employee | Vacation Used | Sick Used | Total |
|---|---:|---:|---:|

### Leave Usage By Department

| Department | Requests | Days Used |
|---|---:|---:|

---

## Date Filter

Options:

- This Month
- Last Month
- This Year
- Custom Range

For the demo, predefined ranges are enough.

---

## Export Button

Show:

`Export Report`

It may either:

1. Export CSV if easy to implement, or
2. Display a demo notification:

```text
Report export will be available in the production version.
```

Prefer real CSV export if it only takes a short amount of time.

---

# 16. Support / Maintenance Page

Margie specifically asked about errors, warranty, and maintenance.

Add a small page that demonstrates this was considered.

## System Status

Example:

```text
System Status
Operational
```

---

## Support Information

Cards:

### Technical Support

```text
Report system errors or unexpected behavior.
```

### Warranty Support

```text
System-related bugs discovered during the agreed
warranty period will be reviewed and corrected.
```

### Maintenance

```text
Post-warranty maintenance can be arranged through
a retainer or per-request support agreement.
```

---

## Report Issue Form

Fields:

- Issue title
- Category
- Description
- Priority

Categories:

- Login
- Leave Request
- Approval
- Employee Records
- Reports
- Other

For the demo, submitting can save a sample issue or show a success state.

---

# 17. Database Design

Suggested tables.

---

## users

```text
id
email
name
role
department_id
employee_id
created_at
updated_at
```

Roles:

```text
EMPLOYEE
SUPERVISOR
ADMIN
```

---

## departments

```text
id
name
created_at
```

Example departments:

- Operations
- Accounting
- Sales
- Human Resources
- Administration

---

## employees

```text
id
user_id
employee_number
first_name
last_name
department_id
position
employment_status
created_at
updated_at
```

Employment statuses:

```text
ACTIVE
INACTIVE
```

---

## leave_types

```text
id
name
code
description
default_days
is_active
```

Example:

```text
VACATION
SICK
EMERGENCY
OTHER
```

---

## leave_balances

```text
id
employee_id
leave_type_id
year
allocated_days
used_days
remaining_days
updated_at
```

---

## leave_requests

```text
id
employee_id
leave_type_id
start_date
end_date
number_of_days
reason
status
reviewed_by
reviewed_at
reviewer_remarks
created_at
updated_at
```

Statuses:

```text
PENDING
APPROVED
REJECTED
CANCELLED
```

---

## support_tickets

Optional for demo.

```text
id
submitted_by
title
category
description
priority
status
created_at
```

---

# 18. Leave Balance Logic

## On Submission

Do **not** deduct leave balance.

Request becomes:

```text
PENDING
```

---

## On Approval

Validate again:

```text
remaining balance >= requested days
```

Then:

```text
used_days += requested_days
remaining_days -= requested_days
```

Set:

```text
status = APPROVED
```

---

## On Rejection

Do not modify balance.

Set:

```text
status = REJECTED
```

---

## On Cancellation

If request is still pending:

```text
status = CANCELLED
```

Do not modify leave balance.

---

# 19. Seed / Demo Data

The system must not look empty.

Create realistic fictional users.

---

## Employee 1

```text
Name: Juan Dela Cruz
Employee ID: EMP-001
Department: Operations
Position: Operations Associate

Vacation Leave:
Allocated: 15
Used: 5
Remaining: 10

Sick Leave:
Allocated: 10
Used: 2
Remaining: 8
```

---

## Employee 2

```text
Name: Maria Santos
Employee ID: EMP-002
Department: Accounting
Position: Accounting Assistant

Vacation Leave:
Allocated: 15
Used: 7
Remaining: 8

Sick Leave:
Allocated: 10
Used: 1
Remaining: 9
```

---

## Employee 3

```text
Name: Carlo Reyes
Employee ID: EMP-003
Department: Sales
Position: Sales Associate

Vacation Leave:
Allocated: 15
Used: 4
Remaining: 11

Sick Leave:
Allocated: 10
Used: 3
Remaining: 7
```

---

## Admin

```text
Name: Admin User
Email: admin@demo.com
Role: ADMIN
```

---

## Supervisor

```text
Name: Andrea Lim
Email: supervisor@demo.com
Department: Operations
Role: SUPERVISOR
```

---

# 20. Seed Leave Requests

Create at least:

- 3 pending
- 4 approved
- 2 rejected

Example pending request:

```text
Employee: Juan Dela Cruz
Leave Type: Vacation Leave
Dates: August 27–28, 2026
Days: 2
Reason: Family matter
Status: Pending
```

Example approved request:

```text
Employee: Maria Santos
Leave Type: Vacation Leave
Dates: August 18–19, 2026
Days: 2
Reason: Personal appointment
Status: Approved
```

Example rejected request:

```text
Employee: Carlo Reyes
Leave Type: Vacation Leave
Dates: August 25–27, 2026
Days: 3
Reason: Personal leave
Status: Rejected

Remarks:
Department coverage unavailable during requested dates.
```

---

# 21. UI / UX Direction

The interface should look like a real internal company system.

## Style

Aim for:

- Professional
- Clean
- Modern
- Easy to understand
- Minimal visual clutter
- Strong information hierarchy

Avoid:

- Excessive gradients
- Huge hero sections
- Decorative animations everywhere
- Glassmorphism overload
- Over-designed cards
- Landing-page style layouts inside the application
- Obvious AI-generated filler

This is an internal business system, not a marketing website.

---

# 22. Navigation

## Employee Sidebar

```text
Dashboard
File Leave
My Requests
Profile
```

---

## Admin Sidebar

```text
Dashboard
Leave Requests
Employees
Reports
Support
```

---

# 23. Responsive Design

## Desktop

Use:

- Sidebar navigation
- Multi-column dashboard cards
- Tables

---

## Tablet

- Collapsible sidebar
- Responsive cards
- Horizontal table scrolling if needed

---

## Mobile

Use:

- Drawer navigation
- Single-column cards
- Mobile-friendly forms
- Convert complex tables into stacked cards where practical

---

# 24. Required States

Every important action should have proper states.

## Loading

Examples:

```text
Loading requests...
```

Use skeletons where appropriate.

---

## Empty

Example:

```text
No pending leave requests.
```

---

## Error

Example:

```text
Unable to load leave requests.
Please try again.
```

---

## Success

Example:

```text
Leave request submitted successfully.
```

---

# 25. Error Handling

Handle at least:

- Failed authentication
- Failed request submission
- Invalid leave dates
- Insufficient leave balance
- Failed approval
- Failed rejection
- Database/API error
- Unauthorized route access

Do not expose raw database errors to users.

---

# 26. Route Protection

Employees must not access admin routes.

Example:

```text
/employee/*
```

Employee role only.

Admin/Supervisor routes:

```text
/admin/*
```

Admin and Supervisor only.

---

# 27. Demo Security Basics

Even though this is a prototype:

- Do not expose Supabase service role keys
- Keep environment variables server-side
- Validate permissions server-side
- Validate request ownership
- Validate admin approval permissions
- Sanitize user-entered text
- Do not trust client-submitted leave-day calculations

The server should recalculate and verify sensitive values.

---

# 28. Suggested Project Structure

```text
app/
├── login/
├── employee/
│   ├── dashboard/
│   ├── leave/
│   │   ├── new/
│   │   └── requests/
│   └── profile/
├── admin/
│   ├── dashboard/
│   ├── requests/
│   ├── employees/
│   ├── reports/
│   └── support/
└── api/

components/
├── ui/
├── layout/
├── dashboard/
├── leave/
├── employees/
└── reports/

lib/
├── auth/
├── db/
├── leave/
├── validations/
└── utils/

types/
├── auth.ts
├── employee.ts
└── leave.ts
```

Adjust depending on the existing codebase.

---

# 29. Development Phases

## Phase 1 — Foundation

Estimated target:

`45–90 minutes`

Tasks:

- Initialize project
- Configure Tailwind
- Configure Supabase
- Create database schema
- Seed demo data
- Create shared layout
- Create navigation
- Add demo authentication

### Done When

- Employee can log in
- Admin can log in
- Role-based dashboards load

---

# 30. Phase 2 — Employee Experience

Estimated target:

`1.5–2 hours`

Tasks:

- Employee dashboard
- Leave balance cards
- File Leave form
- Leave history
- Validation
- Pending request creation

### Done When

Employee can:

1. Log in
2. View balance
3. Submit leave
4. See submitted request as pending

---

# 31. Phase 3 — Admin Approval Flow

Estimated target:

`1–2 hours`

Tasks:

- Admin dashboard
- Pending request list
- Request detail
- Approve action
- Reject action
- Reviewer remarks
- Balance deduction

### Done When

Admin can:

1. See employee request
2. Open request
3. Approve it
4. See employee balance decrease

And employee sees:

```text
APPROVED
```

---

# 32. Phase 4 — Employee Management & Reports

Estimated target:

`1–1.5 hours`

Tasks:

- Employee list
- Employee detail
- Basic reporting
- Date/status filters

Keep this section lightweight.

---

# 33. Phase 5 — Polish

Estimated target:

`1–2 hours`

Tasks:

- Mobile responsiveness
- Empty states
- Loading states
- Error states
- Confirmation dialogs
- Better spacing
- Typography cleanup
- Seed data cleanup
- Remove dead buttons
- Test all routes

---

# 34. Phase 6 — Deployment

Tasks:

- Configure production environment variables
- Deploy on Vercel
- Connect production Supabase project
- Verify seeded demo accounts
- Test live deployment

---

# 35. Phase 7 — Video Walkthrough

Target length:

`2–4 minutes`

Do not make a 10–15 minute video.

Management should understand the system quickly.

---

# 36. Demo Video Script

## Opening

Suggested narration:

> Good day. This is a sample demonstration of the proposed Leave Management System. The purpose of this demo is to show the main employee and management workflow before proceeding with the complete system.

---

## Part 1 — Employee Dashboard

Show:

- Employee login
- Leave balance cards
- Recent requests

Narration:

> After logging in, the employee can immediately see their available leave balances and the current status of their leave requests.

---

## Part 2 — File Leave

Show employee submitting:

```text
Vacation Leave
August 27–28
2 days
Family matter
```

Narration:

> The employee can file a leave request by selecting the leave type, dates, and reason. The system also shows the available balance before the request is submitted.

Submit.

Show status:

```text
Pending
```

---

## Part 3 — Admin / Supervisor

Log out or switch user.

Login as Admin.

Show pending request.

Narration:

> The submitted request is then available to the authorized supervisor or administrator for review.

Open Juan's request.

Show:

- employee
- leave balance
- dates
- reason

Approve it.

---

## Part 4 — Employee Update

Switch back to employee.

Show:

```text
Approved
```

and reduced balance.

Narration:

> Once approved, the employee can see the updated status, and the appropriate leave balance is automatically updated.

---

## Part 5 — Other Management Features

Briefly show:

- Employee list
- Reports
- Support page

Narration:

> Management can also review employee leave information, basic reports, and system support information from the administrative dashboard.

---

## Closing

Suggested:

> This demo focuses on the core leave workflow. Additional company-specific policies, reports, notifications, and other requirements can be finalized after management reviews and approves the proposed system.

---

# 37. Testing Checklist

Before sending the demo:

## Authentication

- [ ] Employee login works
- [ ] Admin login works
- [ ] Invalid credentials display an error
- [ ] Employee cannot access admin pages
- [ ] Admin can access admin pages

## Employee

- [ ] Dashboard loads
- [ ] Leave balances display
- [ ] Leave form works
- [ ] Date validation works
- [ ] Insufficient balance is blocked
- [ ] Request can be submitted
- [ ] Pending request appears in history
- [ ] Approved request appears correctly
- [ ] Rejected request displays remarks

## Admin

- [ ] Pending requests load
- [ ] Request detail works
- [ ] Approval works
- [ ] Balance updates after approval
- [ ] Rejection works
- [ ] Rejection does not deduct balance
- [ ] Employees page loads
- [ ] Reports page loads

## UI

- [ ] Desktop looks correct
- [ ] Tablet layout works
- [ ] Mobile layout works
- [ ] No horizontal overflow
- [ ] Loading states exist
- [ ] Error states exist
- [ ] Empty states exist
- [ ] No broken buttons
- [ ] No placeholder lorem ipsum
- [ ] No developer/debug text is visible

## Deployment

- [ ] Live URL works
- [ ] Demo credentials work
- [ ] Environment variables are configured
- [ ] No secrets are exposed
- [ ] Database data persists

---

# 38. Definition of Done

The demo is ready to send when management can successfully perform this scenario:

1. Open live demo URL
2. Log in as Employee
3. View leave balances
4. Submit a Vacation Leave request
5. See request marked Pending
6. Log in as Admin
7. Open the pending request
8. Approve it
9. Log back in as Employee
10. See request marked Approved
11. See reduced Vacation Leave balance
12. View employee management/report screens

If that entire sequence works cleanly, the core demo is complete.

---

# 39. What Comes After Approval

If management approves the demo, the full system planning stage can include:

- Exact leave types
- Leave policy rules
- Annual leave allocation
- Carry-over rules
- Holiday handling
- Half-day leave
- Multiple approval levels
- HR approval
- Department supervisors
- Email notifications
- Employee onboarding
- Importing employee records
- Audit trail
- More detailed reporting
- PDF/CSV exports
- Company branding
- Role/permission customization
- Production security review
- Database backup strategy
- Deployment ownership
- Warranty period
- Maintenance agreement
- Retainer terms
- User documentation
- Admin training

These should be agreed upon before full production development.

---

# 40. Instructions for the Coding Agent

You are building a **management-ready prototype**, not a generic dashboard template.

Prioritize:

1. Working leave workflow
2. Correct data
3. Clear UI
4. Role separation
5. Responsive design
6. Error handling
7. Demo reliability

Do not prioritize:

1. Decorative animations
2. Excessive abstraction
3. Complex architecture not needed for the demo
4. Features outside this document
5. Large amounts of generated placeholder content

Before declaring the demo complete:

- Run the app
- Test both demo accounts
- Perform the full submit → approve → updated balance workflow
- Fix console/runtime errors
- Check mobile layout
- Remove dead UI
- Ensure the live deployment works

If implementation details conflict with demo reliability, choose the simpler solution that produces the most stable management presentation.

---

# 41. Delivery Package

When complete, prepare:

## 1. Live Demo

Example:

```text
https://leave-demo.vercel.app
```

## 2. Demo Credentials

```text
Employee
employee@demo.com
Demo123!

Admin
admin@demo.com
Demo123!
```

## 3. Walkthrough Video

Target:

`2–4 minutes`

## 4. Short Message to Client

Explain:

- Demo is ready
- Core workflow is functional
- Management can test the live system
- The current version is a prototype
- Final features will be based on approved requirements

---

# 42. Expected Demo Development Time

Target focused development time:

`6–9 hours`

Recommended client delivery window:

`1–2 days`

This allows enough time for:

- Development
- Testing
- Deployment
- Video recording
- Minor fixes

Do not rush a broken demo just to deliver it a few hours earlier.
