# Leave Management System Demo — Phase-by-Phase Codex Instructions

Use this file together with:

`Leave_Management_System_Demo_Plan.md`

Codex should read the full demo plan first, then execute only the requested phase from this file.

---

# Global Rules for Every Phase

Before starting any phase:

1. Read `Leave_Management_System_Demo_Plan.md`.
2. Read the requested phase in this file.
3. Inspect the current codebase before changing anything.
4. Reuse existing working code instead of rebuilding unnecessarily.
5. Do not implement future phases early.
6. Do not add features outside the approved demo scope.
7. Keep the application professional, clean, responsive, and suitable for a management presentation.
8. Fix TypeScript, build, runtime, and obvious console errors before declaring a phase complete.
9. Do not commit secrets or real credentials.
10. Stop after completing the requested phase and report what was changed.

At the end of every phase, Codex must return:

```text
PHASE X COMPLETED

Files created:
- ...

Files modified:
- ...

What was implemented:
- ...

Testing performed:
- ...

Issues found/fixed:
- ...

Manual setup still required:
- ...

Ready for next phase:
YES / NO
```

---

# PHASE 1 — Foundation

## Goal

Create a stable project foundation for the Leave Management System demo.

## Tasks

### 1. Inspect Existing Project

Review:

- folder structure
- `package.json`
- dependencies
- Next.js setup
- TypeScript setup
- Tailwind setup
- Supabase setup
- authentication setup
- existing routes/components

Do not rebuild the project from scratch unless absolutely necessary.

### 2. Technology Foundation

Use:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase/PostgreSQL

Ensure the project starts and builds correctly.

### 3. Create Route Structure

Prepare:

```text
/login

/employee/dashboard
/employee/leave/new
/employee/leave/requests
/employee/profile

/admin/dashboard
/admin/requests
/admin/employees
/admin/reports
/admin/support
```

Only create the foundation/placeholder experience needed for Phase 1.

Do not implement complete leave workflows yet.

### 4. Authentication

Create three roles:

```text
EMPLOYEE
SUPERVISOR
ADMIN
```

Demo accounts:

```text
Employee
employee@demo.com
Demo123!

Supervisor
supervisor@demo.com
Demo123!

Admin
admin@demo.com
Demo123!
```

Login page must clearly show demo credentials.

Redirect after login:

```text
EMPLOYEE -> /employee/dashboard

SUPERVISOR -> /admin/dashboard

ADMIN -> /admin/dashboard
```

### 5. Route Protection

Employees must not access management routes.

Admin/Supervisor routes must be protected server-side where practical.

Do not rely only on hidden navigation items.

Unauthorized users should be redirected safely.

### 6. Shared Layout

Employee navigation:

```text
Dashboard
File Leave
My Requests
Profile
```

Admin navigation:

```text
Dashboard
Leave Requests
Employees
Reports
Support
```

Include:

- desktop sidebar
- mobile navigation
- logged-in user
- role
- logout action

### 7. UI Direction

Use a professional internal business-system style.

Prioritize:

- clear hierarchy
- readable typography
- consistent spacing
- useful dashboard cards
- simple navigation
- responsive layouts

Avoid:

- excessive gradients
- glassmorphism
- oversized hero sections
- decorative animations
- AI-looking placeholder dashboards

### 8. Database Foundation

Create the initial schema for:

```text
departments
employees
leave_types
leave_balances
leave_requests
```

Roles:

```text
EMPLOYEE
SUPERVISOR
ADMIN
```

Request statuses:

```text
PENDING
APPROVED
REJECTED
CANCELLED
```

Use proper relations and indexes where appropriate.

### 9. Seed Demo Data

Departments:

```text
Operations
Accounting
Sales
Human Resources
Administration
```

Employees:

```text
Juan Dela Cruz
EMP-001
Operations
Operations Associate

Maria Santos
EMP-002
Accounting
Accounting Assistant

Carlo Reyes
EMP-003
Sales
Sales Associate

Andrea Lim
EMP-004
Operations
Operations Supervisor
```

Create realistic Vacation and Sick Leave balances.

Also create the Admin demo account.

### 10. Dashboard Foundation

Employee dashboard should display:

- employee name
- department
- Vacation Leave balance
- Sick Leave balance
- Pending Requests placeholder/count
- Approved Requests placeholder/count

Admin dashboard should display:

- Pending Approvals placeholder/count
- Employees on Leave placeholder/count
- Total Employees
- Requests This Month placeholder/count

### 11. Basic States

Implement:

- authentication loading
- login failure message
- unauthorized access handling
- database failure handling

Never expose raw database errors.

### 12. Environment Configuration

Create or update:

```text
.env.example
```

Document required environment variables.

Do not commit real values.

## Phase 1 Acceptance Criteria

- [ ] Employee demo login works
- [ ] Supervisor demo login works
- [ ] Admin demo login works
- [ ] Role redirects work
- [ ] Employee cannot access admin pages
- [ ] Navigation works
- [ ] Seeded employee data loads
- [ ] Employee dashboard loads
- [ ] Admin dashboard loads
- [ ] Desktop layout works
- [ ] Mobile layout works
- [ ] TypeScript/build passes
- [ ] No major runtime errors

## Do NOT Implement in Phase 1

Do not implement:

- leave submission
- leave approval
- leave rejection
- balance deduction
- reports logic
- advanced employee management
- notifications

Stop after Phase 1.

---

# PHASE 2 — Employee Experience

## Goal

Make the Employee side fully usable for filing and tracking leave requests.

The employee should be able to:

```text
Login
-> View leave balances
-> File leave
-> Submit request
-> See request as Pending
-> View request history
```

## Tasks

### 1. Employee Dashboard

Upgrade the dashboard to show real data.

Cards:

- Vacation Leave remaining
- Sick Leave remaining
- Pending Requests
- Approved Requests
- Upcoming Leave

Add a recent requests section.

### 2. File Leave Page

Implement:

```text
/employee/leave/new
```

Fields:

- Leave Type
- Start Date
- End Date
- Number of Days
- Reason
- Current Balance
- Estimated Balance After Approval

Leave types:

- Vacation Leave
- Sick Leave
- Emergency Leave
- Bereavement Leave
- Other

Vacation and Sick Leave must be fully functional.

### 3. Leave Day Calculation

Automatically calculate number of days.

For the demo:

- count weekdays
- ignore weekends

Do not add a holiday calendar yet.

The server/backend must verify the calculation before storing the request.

### 4. Validation

Prevent:

- end date before start date
- zero-day request
- missing leave type
- missing dates
- missing/very short reason
- leave request exceeding balance
- duplicate exact requests if practical

Display useful human-readable validation messages.

### 5. Balance Preview

Example:

```text
Current Vacation Leave: 10 days
Requested: 2 days
Balance after approval: 8 days
```

Do not deduct the leave balance on submission.

Balance is deducted only after approval in Phase 3.

### 6. Request Submission

When submitted:

```text
status = PENDING
```

Store:

- employee
- leave type
- start date
- end date
- calculated days
- reason
- submitted time
- status

Show success confirmation.

### 7. My Requests

Implement:

```text
/employee/leave/requests
```

Filters:

- All
- Pending
- Approved
- Rejected
- Cancelled

Display:

- Leave Type
- Dates
- Number of Days
- Status
- Submitted Date
- Reviewer Remarks
- Action

### 8. Cancel Pending Request

Employees may cancel only their own `PENDING` requests.

Cancelled requests should become:

```text
CANCELLED
```

No balance adjustment should occur.

### 9. Request Detail / Status

Employees should clearly see:

```text
PENDING
APPROVED
REJECTED
CANCELLED
```

Use consistent status badges.

If rejected, display reviewer remarks.

### 10. Loading / Empty / Error States

Include:

- loading requests
- no requests yet
- no requests for selected filter
- failed request submission
- failed data loading

## Phase 2 Acceptance Criteria

Test this full sequence:

```text
Employee logs in
-> Dashboard displays balances
-> Opens File Leave
-> Selects Vacation Leave
-> Chooses valid dates
-> Sees correct requested day count
-> Sees balance preview
-> Adds reason
-> Submits
-> Request becomes Pending
-> Request appears under My Requests
-> Leave balance remains unchanged
```

Checklist:

- [ ] Employee dashboard uses real seeded/database data
- [ ] Leave form works
- [ ] Weekday calculation works
- [ ] Validation works
- [ ] Balance preview works
- [ ] Submission creates PENDING request
- [ ] Balance is NOT deducted
- [ ] My Requests works
- [ ] Filters work
- [ ] Pending cancellation works
- [ ] Employee cannot view another employee's requests
- [ ] Build passes
- [ ] No major runtime errors

## Do NOT Implement in Phase 2

Do not implement:

- admin approval logic
- admin rejection logic
- balance deductions
- reports
- advanced employee management

Stop after Phase 2.

---

# PHASE 3 — Admin Approval Workflow

## Goal

Complete the core demo workflow.

This phase must make this scenario work:

```text
Employee submits leave
-> Admin/Supervisor sees request
-> Admin reviews request
-> Admin approves or rejects
-> Employee sees updated status
-> Approved request updates leave balance
```

This is the most important phase of the demo.

## Tasks

### 1. Admin Dashboard

Show real data for:

- Pending Approvals
- Employees on Leave
- Total Employees
- Requests This Month

Add a Pending Requests section.

### 2. Leave Request Management

Implement:

```text
/admin/requests
```

Display:

- Employee
- Department
- Leave Type
- Start Date
- End Date
- Number of Days
- Status
- Submitted Date
- Action

Filters:

- All
- Pending
- Approved
- Rejected

### 3. Review Request

Create a detailed review view.

Show employee info, request details, current balance, requested days, and balance after approval.

### 4. Approve Request

Before approval, verify:

- request is still Pending
- reviewer is authorized
- employee has sufficient balance
- request data is valid

On approval:

```text
status = APPROVED
reviewed_by = reviewer
reviewed_at = current time
```

Then deduct:

```text
remaining balance -= requested days
used balance += requested days
```

Use a transaction where possible.

Do not allow double approval/double deduction.

### 5. Reject Request

On rejection:

```text
status = REJECTED
reviewed_by = reviewer
reviewed_at = current time
reviewer_remarks = ...
```

Do not change leave balance.

### 6. Confirmation Dialogs

Add approval and rejection confirmation flows.

Rejection should include reviewer remarks.

### 7. Employee Updates

After Admin approves/rejects:

- Employee dashboard updates
- My Requests updates
- Approved request reduces balance
- Rejected request keeps balance unchanged
- Rejection remarks display

### 8. Authorization

Only:

```text
SUPERVISOR
ADMIN
```

may approve/reject.

Validate permissions server-side.

### 9. Prevent Data Errors

Prevent:

- double approval
- approving rejected request
- rejecting approved request
- negative leave balance
- unauthorized action
- action after cancellation

## Phase 3 Acceptance Criteria

Perform the full management demonstration:

```text
1. Login as employee
2. File 2-day Vacation Leave
3. Confirm it shows Pending
4. Note current Vacation balance
5. Logout
6. Login as Admin
7. See the pending request
8. Open it
9. Approve it
10. Confirm status becomes Approved
11. Logout
12. Login as employee
13. Confirm request says Approved
14. Confirm Vacation balance decreased by 2
```

Then test rejection.

Checklist:

- [ ] Admin dashboard uses live data
- [ ] Pending requests display
- [ ] Review view works
- [ ] Approval works
- [ ] Approval deducts balance once
- [ ] Rejection works
- [ ] Rejection keeps balance unchanged
- [ ] Reviewer remarks work
- [ ] Employee sees result
- [ ] Unauthorized approval fails
- [ ] No double deductions
- [ ] Build passes
- [ ] No major runtime errors

## Demo Milestone

After Phase 3, the core functional demo is complete.

---

# PHASE 4 — Employee Management & Reports

## Goal

Add enough management functionality to make the system look complete during the presentation without turning the demo into a full HRIS.

## Tasks

### 1. Employee List

Implement:

```text
/admin/employees
```

Columns:

- Employee ID
- Name
- Department
- Position
- Vacation Balance
- Sick Balance
- Status
- Action

Filters:

- Search
- Department
- Status

### 2. Employee Detail

Show:

- Employee ID
- Name
- Department
- Position
- Employment Status
- Leave Balances
- Recent Requests
- Current Leave Status

### 3. Reports Page

Implement:

```text
/admin/reports
```

Cards:

- Leave Requests This Month
- Approved Requests
- Rejected Requests
- Approved Leave Days Used

### 4. Leave Usage By Employee

Show Vacation Used, Sick Used, and Total Days Used.

### 5. Leave Usage By Department

Show total requests and approved days used.

### 6. Filters

Support:

- This Month
- Last Month
- This Year

### 7. Export

Implement CSV export if straightforward.

Otherwise show a clear production-only message.

## Phase 4 Acceptance Criteria

- [ ] Employee list loads
- [ ] Search works
- [ ] Department filter works
- [ ] Leave balances display
- [ ] Employee detail loads
- [ ] Recent leave history displays
- [ ] Reports use actual demo data
- [ ] Report counts are correct
- [ ] Reports update after approvals
- [ ] Desktop layout works
- [ ] Mobile layout remains usable
- [ ] Build passes

Stop after Phase 4.

---

# PHASE 5 — Polish, Reliability & Support

## Goal

Turn the functional prototype into a management-ready demo.

Do not add major new features.

## Tasks

### 1. Full UI Review

Inspect every page for:

- spacing
- alignment
- typography
- hierarchy
- inconsistent buttons/cards/badges
- overflow
- broken mobile layouts

### 2. Responsive Design

Test:

- desktop
- tablet
- mobile

### 3. Required UI States

Ensure important pages/actions have:

- loading
- empty
- success
- error

### 4. Error Handling

Test and handle:

- invalid login
- database/network failure
- failed submission
- failed approval
- failed rejection
- invalid dates
- insufficient balance
- unauthorized access
- stale approval action

### 5. Support Page

Implement:

```text
/admin/support
```

Include:

- System Status
- Warranty Support
- Maintenance
- Report Issue form

### 6. Confirmation / Feedback

Use clear feedback for:

- Leave submitted
- Request approved
- Request rejected
- Request cancelled
- Issue submitted

### 7. Demo Data Review

Ensure realistic fictional data exists.

Remove:

- lorem ipsum
- debug text
- broken placeholder records

### 8. Remove Dead UI

Every primary action should work or be clearly labeled as production-only.

### 9. Final Code Quality Pass

Review:

- TypeScript errors
- obvious unused code
- console errors
- security mistakes
- secrets
- broken routes

## Phase 5 Acceptance Criteria

- [ ] All pages look consistent
- [ ] Mobile works
- [ ] Tablet works
- [ ] Loading states work
- [ ] Empty states work
- [ ] Errors are human-readable
- [ ] Support page works
- [ ] No obvious dead buttons
- [ ] Demo data looks realistic
- [ ] No lorem ipsum/debug text
- [ ] No exposed secrets
- [ ] No major console errors
- [ ] Production build passes

Stop after Phase 5.

---

# PHASE 6 — Deployment & Demo Delivery

## Goal

Deploy and verify the final demo, then prepare it for presentation to management.

## Tasks

### 1. Pre-Deployment Audit

Before deploying:

- run type checks
- run lint if configured
- run production build
- fix blocking errors
- confirm secrets are not committed
- confirm demo users/seed data exist

### 2. Deploy

Deploy to Vercel.

### 3. Live Verification

Test the actual deployed URL.

### 4. Test Demo Accounts

```text
employee@demo.com
Demo123!

supervisor@demo.com
Demo123!

admin@demo.com
Demo123!
```

### 5. Test Full Live Workflow

```text
Employee login
-> File leave
-> Request Pending
-> Admin login
-> Review request
-> Approve
-> Employee login
-> Approved status
-> Balance reduced
```

Also test rejection.

### 6. Verify Other Pages

Test:

- Employee Dashboard
- File Leave
- My Requests
- Admin Dashboard
- Leave Requests
- Employees
- Reports
- Support

### 7. Mobile Test

Verify deployed mobile layout.

### 8. Prepare Demo Credentials

Prepare final credentials clearly for the client.

### 9. Record Walkthrough Video

Target:

```text
2–4 minutes
```

Suggested sequence:

```text
1. Introduction
2. Employee login
3. Employee dashboard
4. File leave
5. Submit request
6. Admin login
7. Review request
8. Approve request
9. Employee login
10. Show Approved status
11. Show updated balance
12. Briefly show Employees
13. Briefly show Reports
14. Briefly show Support
15. Closing
```

## Phase 6 Acceptance Criteria

- [ ] Live URL works
- [ ] Employee credentials work
- [ ] Supervisor credentials work
- [ ] Admin credentials work
- [ ] Full submit/approve workflow works live
- [ ] Rejection workflow works live
- [ ] Leave balance updates correctly
- [ ] Reports load
- [ ] Employee records load
- [ ] Support page loads
- [ ] Mobile works
- [ ] No major console/runtime errors
- [ ] No secrets exposed
- [ ] Video walkthrough is recorded

---

# Final Demo Definition of Done

Management must be able to:

```text
1. Open the live URL
2. Login as Employee
3. View leave balances
4. Submit Vacation Leave
5. See request as Pending
6. Login as Admin
7. See pending request
8. Review request
9. Approve request
10. Login as Employee
11. See Approved status
12. See reduced Vacation Leave balance
13. View employee records
14. View basic reports
15. View support information
```

If this works reliably, the demo is ready.

---

# Quick Codex Commands

## Start Phase 1

```text
Read `Leave_Management_System_Demo_Plan.md` and `Leave_Management_System_Phases.md`.

Execute PHASE 1 only.

Follow all Global Rules and Phase 1 acceptance criteria.

Do not implement Phase 2.

When complete, test everything required by Phase 1, provide the required PHASE 1 COMPLETED report, then stop.
```

## Start Phase 2

```text
Read `Leave_Management_System_Demo_Plan.md` and `Leave_Management_System_Phases.md`.

Review the existing Phase 1 implementation first.

Execute PHASE 2 only.

Follow all Global Rules and Phase 2 acceptance criteria.

Do not implement Phase 3.

When complete, test the full Employee workflow, provide the required PHASE 2 COMPLETED report, then stop.
```

## Start Phase 3

```text
Read `Leave_Management_System_Demo_Plan.md` and `Leave_Management_System_Phases.md`.

Review the current implementation first.

Execute PHASE 3 only.

This phase must complete and test the core:
Employee submits leave -> Admin approves/rejects -> Employee sees result -> approved balance updates.

Follow all Global Rules and Phase 3 acceptance criteria.

Do not implement Phase 4.

When complete, provide the required PHASE 3 COMPLETED report, then stop.
```

## Start Phase 4

```text
Read `Leave_Management_System_Demo_Plan.md` and `Leave_Management_System_Phases.md`.

Review Phases 1–3 before making changes.

Execute PHASE 4 only.

Implement Employee Management and basic Reports according to the phase specification.

Do not add full HRIS or payroll features.

Test Phase 4 acceptance criteria, provide the required PHASE 4 COMPLETED report, then stop.
```

## Start Phase 5

```text
Read `Leave_Management_System_Demo_Plan.md` and `Leave_Management_System_Phases.md`.

Execute PHASE 5 only.

Do not add major features.

Focus on UI polish, responsiveness, error handling, loading/empty states, support, reliability, and removal of dead UI.

Run a production build and test the acceptance criteria.

Provide the required PHASE 5 COMPLETED report, then stop.
```

## Start Phase 6

```text
Read `Leave_Management_System_Demo_Plan.md` and `Leave_Management_System_Phases.md`.

Execute PHASE 6 only.

Prepare the project for deployment, verify the live production build, test all demo credentials and the complete leave workflow, then prepare the final demo delivery information.

Do not declare completion until the deployed workflow is tested.

Provide the required PHASE 6 COMPLETED report.
```

---

# Recommended Workflow

```text
Phase 1
↓
Review/test
↓
Phase 2
↓
Review/test
↓
Phase 3
↓
CORE DEMO WORKS
↓
Phase 4
↓
Phase 5
↓
Phase 6
↓
SEND TO CLIENT
```

Do not skip the review/test step between phases.

If a phase introduces regressions, fix them before proceeding.
