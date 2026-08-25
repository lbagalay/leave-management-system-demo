alter type public.employment_status add value if not exists 'RESIGNED';

alter table public.employees
  add column if not exists hire_date date;

update public.employees
set hire_date = (created_at at time zone 'Asia/Manila')::date
where hire_date is null;

alter table public.employees
  alter column hire_date set not null;

alter table public.leave_balances
  add column if not exists adjustment_days numeric(7,2) not null default 0;

alter table public.leave_balances
  add column if not exists available_days numeric(7,2)
  generated always as (allocated_days - used_days + adjustment_days) stored;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.leave_balances'::regclass
      and conname = 'leave_balances_available_days_nonnegative'
  ) then
    alter table public.leave_balances
      add constraint leave_balances_available_days_nonnegative
      check (allocated_days - used_days + adjustment_days >= 0);
  end if;
end;
$$;

create table if not exists public.leave_balance_adjustments (
  id uuid primary key default gen_random_uuid(),
  leave_balance_id uuid not null references public.leave_balances(id) on delete restrict,
  employee_id uuid not null references public.employees(id) on delete restrict,
  leave_type_id uuid not null references public.leave_types(id) on delete restrict,
  year integer not null check (year between 2000 and 2100),
  previous_entitlement numeric(7,2) not null check (previous_entitlement >= 0),
  new_entitlement numeric(7,2) not null check (new_entitlement >= 0),
  previous_available numeric(7,2) not null check (previous_available >= 0),
  new_available numeric(7,2) not null check (new_available >= 0),
  adjustment numeric(7,2) not null,
  reason text not null check (char_length(trim(reason)) between 3 and 500),
  updated_by uuid not null references public.app_users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists leave_balance_adjustments_employee_created_idx
  on public.leave_balance_adjustments (employee_id, created_at desc);

create index if not exists leave_balance_adjustments_balance_created_idx
  on public.leave_balance_adjustments (leave_balance_id, created_at desc);

alter table public.leave_balance_adjustments enable row level security;

revoke insert, update, delete, truncate
  on table public.leave_balance_adjustments
  from anon, authenticated, service_role;
grant select on table public.leave_balance_adjustments
  to authenticated, service_role;

drop policy if exists "employees view own adjustments or managers view adjustments"
  on public.leave_balance_adjustments;
create policy "employees view own adjustments or managers view adjustments"
on public.leave_balance_adjustments
for select to authenticated
using (
  employee_id = public.current_employee_id()
  or public.can_manage_employee(employee_id)
);

create or replace function public.adjust_employee_leave_balance(
  p_actor_id uuid,
  p_employee_id uuid,
  p_leave_type_id uuid,
  p_year integer,
  p_entitlement numeric,
  p_available numeric,
  p_reason text
)
returns table (
  outcome text,
  updated_balance_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance public.leave_balances%rowtype;
  v_balance_id uuid;
  v_previous_entitlement numeric := 0;
  v_previous_available numeric := 0;
  v_used_days numeric := 0;
  v_reason text := trim(coalesce(p_reason, ''));
begin
  if not exists (
    select 1
    from public.app_users
    where id = p_actor_id
      and role = 'ADMIN'
  ) then
    return query select 'UNAUTHORIZED'::text, null::uuid;
    return;
  end if;

  if p_year not between 2000 and 2100
    or p_year is null
    or p_entitlement is null
    or p_entitlement < 0
    or p_available is null
    or p_available < 0
    or char_length(v_reason) not between 3 and 500
  then
    return query select 'INVALID_INPUT'::text, null::uuid;
    return;
  end if;

  if not exists (select 1 from public.employees where id = p_employee_id) then
    return query select 'EMPLOYEE_NOT_FOUND'::text, null::uuid;
    return;
  end if;

  if not exists (
    select 1
    from public.leave_types
    where id = p_leave_type_id
      and is_active
  ) then
    return query select 'LEAVE_TYPE_NOT_FOUND'::text, null::uuid;
    return;
  end if;

  select balance.*
  into v_balance
  from public.leave_balances as balance
  where balance.employee_id = p_employee_id
    and balance.leave_type_id = p_leave_type_id
    and balance.year = p_year
  for update;

  if found then
    if p_entitlement < v_balance.used_days then
      return query select 'INVALID_INPUT'::text, null::uuid;
      return;
    end if;

    v_balance_id := v_balance.id;
    v_previous_entitlement := v_balance.allocated_days;
    v_previous_available := v_balance.available_days;
    v_used_days := v_balance.used_days;

    update public.leave_balances
    set
      allocated_days = p_entitlement,
      adjustment_days = p_available - p_entitlement + v_used_days
    where id = v_balance_id;
  else
    insert into public.leave_balances (
      employee_id,
      leave_type_id,
      year,
      allocated_days,
      used_days,
      adjustment_days
    ) values (
      p_employee_id,
      p_leave_type_id,
      p_year,
      p_entitlement,
      0,
      p_available - p_entitlement
    )
    returning id into v_balance_id;
  end if;

  insert into public.leave_balance_adjustments (
    leave_balance_id,
    employee_id,
    leave_type_id,
    year,
    previous_entitlement,
    new_entitlement,
    previous_available,
    new_available,
    adjustment,
    reason,
    updated_by
  ) values (
    v_balance_id,
    p_employee_id,
    p_leave_type_id,
    p_year,
    v_previous_entitlement,
    p_entitlement,
    v_previous_available,
    p_available,
    p_available - v_previous_available,
    v_reason,
    p_actor_id
  );

  return query select 'UPDATED'::text, v_balance_id;
end;
$$;

revoke all on function public.adjust_employee_leave_balance(
  uuid,
  uuid,
  uuid,
  integer,
  numeric,
  numeric,
  text
) from public, anon, authenticated;

grant execute on function public.adjust_employee_leave_balance(
  uuid,
  uuid,
  uuid,
  integer,
  numeric,
  numeric,
  text
) to service_role;

create or replace function public.create_employee_record(
  p_actor_id uuid,
  p_employee_number text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_department_id uuid,
  p_position text,
  p_hire_date date,
  p_employment_status text,
  p_balance_year integer,
  p_balances jsonb
)
returns table (
  outcome text,
  created_employee_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app_user_id uuid;
  v_employee_id uuid;
  v_balance_item jsonb;
  v_leave_type_id uuid;
  v_entitlement numeric;
  v_available numeric;
  v_status text := upper(trim(coalesce(p_employment_status, '')));
begin
  if not exists (
    select 1
    from public.app_users
    where id = p_actor_id
      and role = 'ADMIN'
  ) then
    return query select 'UNAUTHORIZED'::text, null::uuid;
    return;
  end if;

  if char_length(trim(coalesce(p_employee_number, ''))) not between 2 and 40
    or char_length(trim(coalesce(p_first_name, ''))) not between 1 and 80
    or char_length(trim(coalesce(p_last_name, ''))) not between 1 and 80
    or char_length(trim(coalesce(p_email, ''))) not between 3 and 254
    or position('@' in trim(coalesce(p_email, ''))) < 2
    or char_length(trim(coalesce(p_position, ''))) not between 2 and 120
    or p_hire_date is null
    or p_hire_date > (now() at time zone 'Asia/Manila')::date
    or v_status not in ('ACTIVE', 'INACTIVE', 'RESIGNED')
    or p_balance_year is null
    or p_balance_year not between 2000 and 2100
    or p_balances is null
    or jsonb_typeof(p_balances) <> 'array'
    or jsonb_array_length(p_balances) < 1
  then
    return query select 'INVALID_INPUT'::text, null::uuid;
    return;
  end if;

  if not exists (
    select 1 from public.departments where id = p_department_id
  ) then
    return query select 'DEPARTMENT_NOT_FOUND'::text, null::uuid;
    return;
  end if;

  if exists (
    select 1
    from public.app_users
    where email = trim(p_email)::citext
  ) then
    return query select 'DUPLICATE_EMAIL'::text, null::uuid;
    return;
  end if;

  if exists (
    select 1
    from public.employees
    where employee_number = trim(p_employee_number)
  ) then
    return query select 'DUPLICATE_EMPLOYEE_NUMBER'::text, null::uuid;
    return;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_balances) as balance(value)
    group by balance.value ->> 'leave_type_id'
    having count(*) > 1
  ) then
    return query select 'INVALID_INPUT'::text, null::uuid;
    return;
  end if;

  for v_balance_item in
    select value from jsonb_array_elements(p_balances)
  loop
    begin
      v_leave_type_id := nullif(v_balance_item ->> 'leave_type_id', '')::uuid;
      v_entitlement := nullif(v_balance_item ->> 'entitlement', '')::numeric;
      v_available := nullif(v_balance_item ->> 'available', '')::numeric;
    exception when invalid_text_representation then
      return query select 'INVALID_INPUT'::text, null::uuid;
      return;
    end;

    if v_leave_type_id is null
      or v_entitlement is null
      or v_entitlement < 0
      or v_available is null
      or v_available < 0
    then
      return query select 'INVALID_INPUT'::text, null::uuid;
      return;
    end if;

    if not exists (
      select 1
      from public.leave_types
      where id = v_leave_type_id
        and is_active
    ) then
      return query select 'LEAVE_TYPE_NOT_FOUND'::text, null::uuid;
      return;
    end if;
  end loop;

  begin
    insert into public.app_users (
      email,
      name,
      role,
      department_id
    ) values (
      trim(p_email)::citext,
      trim(p_first_name) || ' ' || trim(p_last_name),
      'EMPLOYEE',
      p_department_id
    )
    returning id into v_app_user_id;

    insert into public.employees (
      user_id,
      employee_number,
      first_name,
      last_name,
      department_id,
      position,
      hire_date,
      employment_status
    ) values (
      v_app_user_id,
      trim(p_employee_number),
      trim(p_first_name),
      trim(p_last_name),
      p_department_id,
      trim(p_position),
      p_hire_date,
      v_status::public.employment_status
    )
    returning id into v_employee_id;

    update public.app_users
    set employee_id = v_employee_id
    where id = v_app_user_id;

    for v_balance_item in
      select value from jsonb_array_elements(p_balances)
    loop
      v_leave_type_id := (v_balance_item ->> 'leave_type_id')::uuid;
      v_entitlement := (v_balance_item ->> 'entitlement')::numeric;
      v_available := (v_balance_item ->> 'available')::numeric;

      insert into public.leave_balances (
        employee_id,
        leave_type_id,
        year,
        allocated_days,
        used_days,
        adjustment_days
      ) values (
        v_employee_id,
        v_leave_type_id,
        p_balance_year,
        v_entitlement,
        0,
        v_available - v_entitlement
      );
    end loop;
  exception when unique_violation then
    return query select 'DUPLICATE_IDENTITY'::text, null::uuid;
    return;
  end;

  return query select 'CREATED'::text, v_employee_id;
end;
$$;

revoke all on function public.create_employee_record(
  uuid,
  text,
  text,
  text,
  text,
  uuid,
  text,
  date,
  text,
  integer,
  jsonb
) from public, anon, authenticated;

grant execute on function public.create_employee_record(
  uuid,
  text,
  text,
  text,
  text,
  uuid,
  text,
  date,
  text,
  integer,
  jsonb
) to service_role;

create or replace function public.require_active_employee_for_leave_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_employment_status public.employment_status;
begin
  select employment_status
  into v_employment_status
  from public.employees
  where id = new.employee_id
  for share;

  if not found or v_employment_status <> 'ACTIVE' then
    raise exception 'Only active employees can submit leave requests.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.require_active_employee_for_leave_request()
  from public, anon, authenticated, service_role;

drop trigger if exists leave_requests_require_active_employee
  on public.leave_requests;
create trigger leave_requests_require_active_employee
before insert on public.leave_requests
for each row execute function public.require_active_employee_for_leave_request();

create or replace function public.review_leave_request(
  p_request_id uuid,
  p_reviewer_id uuid,
  p_decision text,
  p_remarks text default null
)
returns table (
  outcome text,
  previous_balance numeric,
  new_balance numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request record;
  v_reviewer record;
  v_balance public.leave_balances%rowtype;
  v_decision text := upper(trim(coalesce(p_decision, '')));
  v_remarks text := nullif(trim(coalesce(p_remarks, '')), '');
  v_calculated_days numeric;
begin
  select
    request.id,
    request.employee_id,
    request.leave_type_id,
    request.start_date,
    request.end_date,
    request.number_of_days,
    request.status,
    employee.department_id
  into v_request
  from public.leave_requests as request
  join public.employees as employee on employee.id = request.employee_id
  where request.id = p_request_id
  for update of request;

  if not found then
    return query select 'NOT_FOUND'::text, null::numeric, null::numeric;
    return;
  end if;

  select reviewer.id, reviewer.role, reviewer.department_id
  into v_reviewer
  from public.app_users as reviewer
  where reviewer.id = p_reviewer_id
    and reviewer.role in ('ADMIN', 'SUPERVISOR');

  if not found or (
    v_reviewer.role = 'SUPERVISOR'
    and v_reviewer.department_id is distinct from v_request.department_id
  ) then
    return query select 'UNAUTHORIZED'::text, null::numeric, null::numeric;
    return;
  end if;

  if v_request.status <> 'PENDING' then
    return query select 'STALE_REQUEST'::text, null::numeric, null::numeric;
    return;
  end if;

  if v_decision not in ('APPROVED', 'REJECTED') then
    return query select 'INVALID_DECISION'::text, null::numeric, null::numeric;
    return;
  end if;

  if v_decision = 'REJECTED' then
    if v_remarks is null or char_length(v_remarks) < 5 then
      return query select 'INVALID_REMARKS'::text, null::numeric, null::numeric;
      return;
    end if;

    update public.leave_requests
    set
      status = 'REJECTED',
      reviewed_by = p_reviewer_id,
      reviewed_at = now(),
      reviewer_remarks = v_remarks
    where id = p_request_id;

    return query select 'REJECTED'::text, null::numeric, null::numeric;
    return;
  end if;

  if
    v_request.end_date < v_request.start_date
    or extract(year from v_request.start_date) <> extract(year from v_request.end_date)
    or v_request.number_of_days <= 0
  then
    return query select 'INVALID_REQUEST'::text, null::numeric, null::numeric;
    return;
  end if;

  select count(*)::numeric
  into v_calculated_days
  from generate_series(
    v_request.start_date::timestamp,
    v_request.end_date::timestamp,
    interval '1 day'
  ) as days(workday)
  where extract(isodow from days.workday) between 1 and 5;

  if v_calculated_days <> v_request.number_of_days then
    return query select 'INVALID_REQUEST'::text, null::numeric, null::numeric;
    return;
  end if;

  select balance.*
  into v_balance
  from public.leave_balances as balance
  where balance.employee_id = v_request.employee_id
    and balance.leave_type_id = v_request.leave_type_id
    and balance.year = extract(year from v_request.start_date)::integer
  for update;

  if not found then
    return query select 'BALANCE_NOT_FOUND'::text, null::numeric, null::numeric;
    return;
  end if;

  if v_balance.available_days < v_request.number_of_days then
    return query select
      'INSUFFICIENT_BALANCE'::text,
      v_balance.available_days,
      v_balance.available_days;
    return;
  end if;

  update public.leave_balances
  set used_days = used_days + v_request.number_of_days
  where id = v_balance.id;

  update public.leave_requests
  set
    status = 'APPROVED',
    reviewed_by = p_reviewer_id,
    reviewed_at = now(),
    reviewer_remarks = v_remarks
  where id = p_request_id;

  return query select
    'APPROVED'::text,
    v_balance.available_days,
    v_balance.available_days - v_request.number_of_days;
end;
$$;

revoke all on function public.review_leave_request(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.review_leave_request(uuid, uuid, text, text) to service_role;

comment on function public.review_leave_request(uuid, uuid, text, text) is
  'Atomically reviews a pending leave request and deducts the adjusted available balance exactly once on approval.';
