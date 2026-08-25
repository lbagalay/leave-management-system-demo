# Leave Management System Demo

Phase 5 (Polish, Reliability & Support) of the management-ready Leave Management System prototype.

## Included through Phase 5

- Next.js App Router, React, TypeScript, and Tailwind CSS foundation
- Responsive shared dashboard shell and role-aware navigation
- Signed, HTTP-only demo sessions with server-side role enforcement
- Employee, Supervisor, and Admin dashboards backed by live demo data
- Employee leave submission, request history, cancellation, and profile views
- Supervisor/Admin approval and rejection with atomic balance updates
- Employee directory, employee details, filters, and management reports
- Admin-created employee records with hire dates, tenure, and initial balances (no login provisioning)
- Individual entitlement/availability editing with basic adjustment history
- Resigned employee handling with preserved profiles and leave history
- System status, support coverage, and issue reporting
- Supabase browser/server client configuration
- Supabase-backed workflows with safe loading, empty, and unavailable states
- PostgreSQL schema, indexes, validation constraints, triggers, and row-level security policies
- Deterministic fictional seed data for departments, users, employees, leave types, balances, and leave requests

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Configure Supabase to exercise the complete leave workflow. Signed demo authentication remains available if Supabase is temporarily unavailable, while live-data pages show safe unavailable or fallback states. Set a unique `DEMO_SESSION_SECRET` containing at least 32 characters before running a production build.

## Application routes

Employee routes:

- `/employee/dashboard`
- `/employee/leave/new`
- `/employee/leave/requests`
- `/employee/profile`

Management routes for Supervisor and Admin:

- `/admin/dashboard`
- `/admin/requests`
- `/admin/employees`
- `/admin/reports`
- `/admin/support`

All listed routes are protected on the server and include responsive desktop, tablet, and mobile layouts.

## Demo accounts

All demo accounts use the password `Demo123!`.

| Role | Email |
| --- | --- |
| Employee | `employee@demo.com` |
| Supervisor | `supervisor@demo.com` |
| Admin | `admin@demo.com` |

## Supabase setup

The Supabase schema and workflow migrations live in:

- `supabase/migrations/20260824000000_phase_one_foundation.sql`
- `supabase/migrations/20260824010000_phase_three_review_workflow.sql`
- `supabase/migrations/20260825000000_leave_balance_employee_management.sql`
- `supabase/tests/leave_balance_employee_management.test.sql`
- `supabase/seed.sql`
- `supabase/config.toml`

With the Supabase CLI installed, initialize the local database from the project root:

```bash
supabase start
supabase db reset
```

Then copy the local API URL and anonymous key into `.env.local`. For an existing hosted project, back up and verify the target first, then apply only unapplied migrations through the standard Supabase CLI workflow. Do not rerun the demo seed against a database that contains historical data. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the deployment environment.

To let protected server actions and pages use the hosted demo database, also configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The service-role key is server-only and must never use a `NEXT_PUBLIC_` prefix. If these values are omitted or the configured database becomes unavailable, the UI shows safe fallback or unavailable states without exposing the underlying error.

The fixed IDs in the application demo identities match the seeded `public.app_users` records. The optional `auth_user_id` column is ready to link those profiles to Supabase Auth when hosted authentication replaces demo-auth mode.

## Verification

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm start
```
