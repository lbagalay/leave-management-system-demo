-- The employee-creation function uses an empty search path for safety. Qualify
-- citext explicitly so record-only employee creation works in that context.
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
    where email = trim(p_email)::public.citext
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
      trim(p_email)::public.citext,
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
