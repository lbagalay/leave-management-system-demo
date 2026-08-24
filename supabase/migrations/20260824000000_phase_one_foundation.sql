create extension if not exists pgcrypto;
create extension if not exists citext;

do $$ begin
  create type public.user_role as enum ('EMPLOYEE', 'SUPERVISOR', 'ADMIN');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.employment_status as enum ('ACTIVE', 'INACTIVE');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.leave_request_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.support_priority as enum ('LOW', 'MEDIUM', 'HIGH');
exception when duplicate_object then null;
end $$;

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) > 1),
  created_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email citext not null unique,
  name text not null check (char_length(trim(name)) > 1),
  role public.user_role not null default 'EMPLOYEE',
  department_id uuid references public.departments(id) on delete set null,
  employee_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.app_users(id) on delete cascade,
  employee_number text not null unique,
  first_name text not null,
  last_name text not null,
  department_id uuid not null references public.departments(id) on delete restrict,
  position text not null,
  employment_status public.employment_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_users
  drop constraint if exists app_users_employee_id_fkey;
alter table public.app_users
  add constraint app_users_employee_id_fkey
  foreign key (employee_id) references public.employees(id) on delete set null;

create table if not exists public.leave_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  description text not null default '',
  default_days numeric(5,2) not null default 0 check (default_days >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete restrict,
  year integer not null check (year between 2000 and 2100),
  allocated_days numeric(5,2) not null check (allocated_days >= 0),
  used_days numeric(5,2) not null default 0 check (used_days >= 0),
  remaining_days numeric(5,2) generated always as (allocated_days - used_days) stored,
  updated_at timestamptz not null default now(),
  unique (employee_id, leave_type_id, year),
  check (used_days <= allocated_days)
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  leave_type_id uuid not null references public.leave_types(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  number_of_days numeric(5,2) not null check (number_of_days > 0),
  reason text not null check (char_length(trim(reason)) >= 5),
  status public.leave_request_status not null default 'PENDING',
  reviewed_by uuid references public.app_users(id) on delete set null,
  reviewed_at timestamptz,
  reviewer_remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (
    (status in ('APPROVED', 'REJECTED') and reviewed_by is not null and reviewed_at is not null)
    or status in ('PENDING', 'CANCELLED')
  )
);

create unique index if not exists leave_requests_no_exact_active_duplicate
  on public.leave_requests (employee_id, leave_type_id, start_date, end_date)
  where status in ('PENDING', 'APPROVED');
create index if not exists leave_requests_status_created_idx
  on public.leave_requests (status, created_at desc);
create index if not exists employees_department_idx
  on public.employees (department_id);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references public.app_users(id) on delete restrict,
  title text not null check (char_length(trim(title)) >= 3),
  category text not null,
  description text not null check (char_length(trim(description)) >= 10),
  priority public.support_priority not null default 'MEDIUM',
  status text not null default 'OPEN',
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_users_set_updated_at on public.app_users;
create trigger app_users_set_updated_at before update on public.app_users
for each row execute function public.set_updated_at();
drop trigger if exists employees_set_updated_at on public.employees;
create trigger employees_set_updated_at before update on public.employees
for each row execute function public.set_updated_at();
drop trigger if exists leave_balances_set_updated_at on public.leave_balances;
create trigger leave_balances_set_updated_at before update on public.leave_balances
for each row execute function public.set_updated_at();
drop trigger if exists leave_requests_set_updated_at on public.leave_requests;
create trigger leave_requests_set_updated_at before update on public.leave_requests
for each row execute function public.set_updated_at();

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.app_users where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.current_app_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.app_users where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select employee_id from public.app_users where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.can_manage_department(target_department_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_users manager
    where manager.auth_user_id = auth.uid()
      and (
        manager.role = 'ADMIN'
        or (manager.role = 'SUPERVISOR' and manager.department_id = target_department_id)
      )
  );
$$;

create or replace function public.can_manage_employee(target_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_users manager
    join public.employees target on target.id = target_employee_id
    where manager.auth_user_id = auth.uid()
      and (
        manager.role = 'ADMIN'
        or (manager.role = 'SUPERVISOR' and manager.department_id = target.department_id)
      )
  );
$$;

alter table public.departments enable row level security;
alter table public.app_users enable row level security;
alter table public.employees enable row level security;
alter table public.leave_types enable row level security;
alter table public.leave_balances enable row level security;
alter table public.leave_requests enable row level security;
alter table public.support_tickets enable row level security;

create policy "authenticated users view departments" on public.departments
for select to authenticated using (true);
create policy "authenticated users view active leave types" on public.leave_types
for select to authenticated using (is_active or public.current_app_role() = 'ADMIN');
create policy "users view own profile or managers view profiles" on public.app_users
for select to authenticated using (
  id = public.current_app_user_id() or public.can_manage_department(department_id)
);
create policy "users view own employee record or managers view employees" on public.employees
for select to authenticated using (
  id = public.current_employee_id() or public.can_manage_employee(id)
);
create policy "employees view own balances or managers view balances" on public.leave_balances
for select to authenticated using (
  employee_id = public.current_employee_id() or public.can_manage_employee(employee_id)
);
create policy "employees view own requests or managers view requests" on public.leave_requests
for select to authenticated using (
  employee_id = public.current_employee_id() or public.can_manage_employee(employee_id)
);
create policy "employees create their own pending requests" on public.leave_requests
for insert to authenticated with check (
  employee_id = public.current_employee_id()
  and status = 'PENDING'
  and reviewed_by is null
  and reviewed_at is null
);
create policy "employees cancel their own pending requests" on public.leave_requests
for update to authenticated
using (employee_id = public.current_employee_id() and status = 'PENDING')
with check (
  employee_id = public.current_employee_id()
  and status = 'CANCELLED'
  and reviewed_by is null
  and reviewed_at is null
);
create policy "authorized managers review requests" on public.leave_requests
for update to authenticated
using (public.can_manage_employee(employee_id))
with check (public.can_manage_employee(employee_id));
create policy "users view own support tickets or admins view all" on public.support_tickets
for select to authenticated using (
  submitted_by = public.current_app_user_id() or public.current_app_role() = 'ADMIN'
);
create policy "users submit their own support tickets" on public.support_tickets
for insert to authenticated with check (submitted_by = public.current_app_user_id());
