# Leave Management System Demo

Phase 1 (Foundation) of the management-ready Leave Management System prototype.

## Included in Phase 1

- Next.js App Router, React, TypeScript, and Tailwind CSS foundation
- Responsive shared dashboard shell and role-aware navigation
- Signed, HTTP-only demo sessions with server-side role enforcement
- Employee, Supervisor, and Admin foundation dashboards
- Phase 1 placeholder routes for employee leave/profile and management areas
- Supabase browser/server client configuration
- Supabase-backed dashboard summaries with deterministic offline demo fallback
- PostgreSQL schema, indexes, validation constraints, triggers, and row-level security policies
- Deterministic fictional seed data for departments, users, employees, leave types, balances, and leave requests

Leave filing, request history, approvals, balance updates, employee management, reports, and support are intentionally reserved for later phases.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Supabase variables may remain blank for Phase 1. The signed demo-auth mode works without an external service so the prototype is immediately demonstrable. Set a long random `DEMO_SESSION_SECRET` before deploying.

## Phase 1 routes

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

Only dashboard summaries are populated in Phase 1. The remaining pages are protected, responsive placeholders for later approved phases.

## Demo accounts

All demo accounts use the password `Demo123!`.

| Role | Email |
| --- | --- |
| Employee | `employee@demo.com` |
| Supervisor | `supervisor@demo.com` |
| Admin | `admin@demo.com` |

## Supabase setup

The Supabase foundation lives in:

- `supabase/migrations/20260824000000_phase_one_foundation.sql`
- `supabase/seed.sql`
- `supabase/config.toml`

With the Supabase CLI installed, initialize the local database from the project root:

```bash
supabase start
supabase db reset
```

Then copy the local API URL and anonymous key into `.env.local`. For a hosted project, apply the migration and seed through the standard Supabase CLI workflow, then set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the deployment environment.

To let the server-side demo dashboard read the hosted seed while using the signed demo-auth mode, also configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The service-role key is server-only and must never use a `NEXT_PUBLIC_` prefix. If these values are omitted, the dashboards use deterministic in-app demo data matching `supabase/seed.sql`. If a configured database becomes unavailable, the UI displays a safe fallback notice without exposing the underlying error.

The fixed IDs in the application demo identities match the seeded `public.app_users` records. The optional `auth_user_id` column is ready to link those profiles to Supabase Auth when hosted authentication replaces demo-auth mode.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
npm start
```
