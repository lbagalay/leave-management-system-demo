begin;

select plan(14);

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employees'
      and column_name = 'hire_date'
  ) then
    raise exception 'employees.hire_date is missing';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leave_balances'
      and column_name = 'adjustment_days'
  ) then
    raise exception 'leave_balances.adjustment_days is missing';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leave_balances'
      and column_name = 'available_days'
  ) then
    raise exception 'leave_balances.available_days is missing';
  end if;

  if to_regclass('public.leave_balance_adjustments') is null then
    raise exception 'leave_balance_adjustments is missing';
  end if;

  if not exists (
    select 1
    from pg_enum
    join pg_type on pg_type.oid = pg_enum.enumtypid
    join pg_namespace on pg_namespace.oid = pg_type.typnamespace
    where pg_namespace.nspname = 'public'
      and pg_type.typname = 'employment_status'
      and pg_enum.enumlabel = 'RESIGNED'
  ) then
    raise exception 'RESIGNED employment status is missing';
  end if;
end;
$$;

select is(
  has_function_privilege(
    'anon',
    'public.adjust_employee_leave_balance(uuid,uuid,uuid,integer,numeric,numeric,text)',
    'EXECUTE'
  ),
  false,
  'anon cannot execute balance adjustment RPC'
);
select is(
  has_function_privilege(
    'authenticated',
    'public.adjust_employee_leave_balance(uuid,uuid,uuid,integer,numeric,numeric,text)',
    'EXECUTE'
  ),
  false,
  'authenticated cannot execute balance adjustment RPC'
);
select is(
  has_function_privilege(
    'anon',
    'public.create_employee_record(uuid,text,text,text,text,uuid,text,date,text,integer,jsonb)',
    'EXECUTE'
  ),
  false,
  'anon cannot execute employee creation RPC'
);
select is(
  has_function_privilege(
    'authenticated',
    'public.create_employee_record(uuid,text,text,text,text,uuid,text,date,text,integer,jsonb)',
    'EXECUTE'
  ),
  false,
  'authenticated cannot execute employee creation RPC'
);
select is(
  has_function_privilege(
    'anon',
    'public.review_leave_request(uuid,uuid,text,text)',
    'EXECUTE'
  ),
  false,
  'anon cannot execute leave review RPC'
);
select is(
  has_function_privilege(
    'authenticated',
    'public.review_leave_request(uuid,uuid,text,text)',
    'EXECUTE'
  ),
  false,
  'authenticated cannot execute leave review RPC'
);
select is(
  has_function_privilege(
    'service_role',
    'public.adjust_employee_leave_balance(uuid,uuid,uuid,integer,numeric,numeric,text)',
    'EXECUTE'
  ),
  true,
  'service role can execute balance adjustment RPC'
);
select is(
  has_function_privilege(
    'service_role',
    'public.create_employee_record(uuid,text,text,text,text,uuid,text,date,text,integer,jsonb)',
    'EXECUTE'
  ),
  true,
  'service role can execute employee creation RPC'
);
select is(
  has_function_privilege(
    'service_role',
    'public.review_leave_request(uuid,uuid,text,text)',
    'EXECUTE'
  ),
  true,
  'service role can execute leave review RPC'
);
select is(
  has_table_privilege('service_role', 'public.leave_balance_adjustments', 'INSERT'),
  false,
  'service role cannot insert adjustment history directly'
);
select is(
  has_table_privilege('service_role', 'public.leave_balance_adjustments', 'UPDATE'),
  false,
  'service role cannot update adjustment history'
);
select is(
  has_table_privilege('service_role', 'public.leave_balance_adjustments', 'DELETE'),
  false,
  'service role cannot delete adjustment history'
);
select is(
  has_table_privilege('service_role', 'public.leave_balance_adjustments', 'TRUNCATE'),
  false,
  'service role cannot truncate adjustment history'
);

do $$
declare
  v_outcome text;
  v_balance record;
  v_history record;
begin
  select outcome
  into v_outcome
  from public.adjust_employee_leave_balance(
    '10000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    2026,
    16,
    12,
    'Supervisor attempt'
  );

  if v_outcome is distinct from 'UNAUTHORIZED' then
    raise exception 'supervisor balance adjustment was not rejected: %', v_outcome;
  end if;

  select outcome
  into v_outcome
  from public.adjust_employee_leave_balance(
    '10000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    2026,
    16,
    12,
    'Carried-over leave'
  );

  if v_outcome is distinct from 'UPDATED' then
    raise exception 'admin balance adjustment failed: %', v_outcome;
  end if;

  select allocated_days, used_days, adjustment_days, available_days
  into v_balance
  from public.leave_balances
  where employee_id = '30000000-0000-0000-0000-000000000001'
    and leave_type_id = '40000000-0000-0000-0000-000000000001'
    and year = 2026;

  if v_balance.allocated_days is distinct from 16
    or v_balance.used_days is distinct from 5
    or v_balance.adjustment_days is distinct from 1
    or v_balance.available_days is distinct from 12
  then
    raise exception 'adjusted balance arithmetic is incorrect: %', row_to_json(v_balance);
  end if;

  select previous_entitlement, new_entitlement, previous_available,
    new_available, adjustment, reason
  into v_history
  from public.leave_balance_adjustments
  where employee_id = '30000000-0000-0000-0000-000000000001'
    and leave_type_id = '40000000-0000-0000-0000-000000000001'
  order by created_at desc
  limit 1;

  if v_history.previous_entitlement is distinct from 15
    or v_history.new_entitlement is distinct from 16
    or v_history.previous_available is distinct from 10
    or v_history.new_available is distinct from 12
    or v_history.adjustment is distinct from 2
    or v_history.reason is distinct from 'Carried-over leave'
  then
    raise exception 'balance adjustment history is incorrect: %', row_to_json(v_history);
  end if;
end;
$$;

do $$
declare
  v_request_count integer;
  v_balance_count integer;
  v_adjustment_count integer;
  v_status public.employment_status;
  v_submission_blocked boolean := false;
begin
  select count(*) into v_request_count
  from public.leave_requests
  where employee_id = '30000000-0000-0000-0000-000000000001';

  select count(*) into v_balance_count
  from public.leave_balances
  where employee_id = '30000000-0000-0000-0000-000000000001';

  select count(*) into v_adjustment_count
  from public.leave_balance_adjustments
  where employee_id = '30000000-0000-0000-0000-000000000001';

  update public.employees
  set employment_status = 'RESIGNED'
  where id = '30000000-0000-0000-0000-000000000001';

  select employment_status into v_status
  from public.employees
  where id = '30000000-0000-0000-0000-000000000001';

  begin
    insert into public.leave_requests (
      employee_id,
      leave_type_id,
      start_date,
      end_date,
      number_of_days,
      reason,
      status
    ) values (
      '30000000-0000-0000-0000-000000000001',
      '40000000-0000-0000-0000-000000000003',
      '2026-12-30',
      '2026-12-30',
      1,
      'Resigned submission attempt',
      'PENDING'
    );
  exception when check_violation then
    v_submission_blocked := true;
  end;

  if not v_submission_blocked
    or v_status is distinct from 'RESIGNED'
    or v_request_count is distinct from (
      select count(*) from public.leave_requests
      where employee_id = '30000000-0000-0000-0000-000000000001'
    )
    or v_balance_count is distinct from (
      select count(*) from public.leave_balances
      where employee_id = '30000000-0000-0000-0000-000000000001'
    )
    or v_adjustment_count is distinct from (
      select count(*) from public.leave_balance_adjustments
      where employee_id = '30000000-0000-0000-0000-000000000001'
    )
  then
    raise exception 'resignation did not preserve employee history';
  end if;

  update public.employees
  set employment_status = 'ACTIVE'
  where id = '30000000-0000-0000-0000-000000000001';
end;
$$;

do $$
declare
  v_outcome text;
  v_employee_id uuid;
  v_created record;
  v_balance_count integer;
begin
  select outcome, created_employee_id
  into v_outcome, v_employee_id
  from public.create_employee_record(
    '10000000-0000-0000-0000-000000000005',
    'EMP-TEST-2026',
    'Demo',
    'Balance Employee',
    'balance.employee.test@demo.com',
    '20000000-0000-0000-0000-000000000004',
    'HR Assistant',
    '2024-01-10',
    'ACTIVE',
    2026,
    '[
      {
        "leave_type_id": "40000000-0000-0000-0000-000000000001",
        "entitlement": 10,
        "available": 12
      },
      {
        "leave_type_id": "40000000-0000-0000-0000-000000000002",
        "entitlement": 8,
        "available": 8
      }
    ]'::jsonb
  );

  if v_outcome is distinct from 'CREATED' or v_employee_id is null then
    raise exception 'employee creation failed: %, %', v_outcome, v_employee_id;
  end if;

  select employee.employee_number, employee.hire_date, employee.employment_status,
    app_user.email, app_user.auth_user_id, app_user.employee_id
  into v_created
  from public.employees as employee
  join public.app_users as app_user on app_user.id = employee.user_id
  where employee.id = v_employee_id;

  if v_created.employee_number is distinct from 'EMP-TEST-2026'
    or v_created.hire_date is distinct from '2024-01-10'::date
    or v_created.employment_status is distinct from 'ACTIVE'
    or v_created.email is distinct from 'balance.employee.test@demo.com'
    or v_created.auth_user_id is not null
    or v_created.employee_id is distinct from v_employee_id
  then
    raise exception 'created employee data is incorrect: %', row_to_json(v_created);
  end if;

  select count(*) into v_balance_count
  from public.leave_balances
  where employee_id = v_employee_id
    and year = 2026
    and used_days = 0;

  if v_balance_count is distinct from 2 then
    raise exception 'created employee balance count is incorrect: %', v_balance_count;
  end if;
end;
$$;

do $$
declare
  v_outcome text;
  v_available numeric;
  v_used_before numeric;
  v_used_after numeric;
begin
  select outcome
  into v_outcome
  from public.review_leave_request(
    '50000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000005',
    'APPROVED',
    null
  );

  if v_outcome is distinct from 'APPROVED' then
    raise exception 'approval regression failed: %', v_outcome;
  end if;

  select available_days into v_available
  from public.leave_balances
  where employee_id = '30000000-0000-0000-0000-000000000001'
    and leave_type_id = '40000000-0000-0000-0000-000000000001'
    and year = 2026;

  if v_available is distinct from 10 then
    raise exception 'approved leave did not reduce adjusted availability: %', v_available;
  end if;

  select used_days into v_used_before
  from public.leave_balances
  where employee_id = '30000000-0000-0000-0000-000000000003'
    and leave_type_id = '40000000-0000-0000-0000-000000000001'
    and year = 2026;

  select outcome
  into v_outcome
  from public.review_leave_request(
    '50000000-0000-0000-0000-000000000008',
    '10000000-0000-0000-0000-000000000005',
    'APPROVED',
    null
  );

  select used_days into v_used_after
  from public.leave_balances
  where employee_id = '30000000-0000-0000-0000-000000000003'
    and leave_type_id = '40000000-0000-0000-0000-000000000001'
    and year = 2026;

  if v_outcome is distinct from 'STALE_REQUEST'
    or v_used_after is distinct from v_used_before
  then
    raise exception 'rejected request changed the balance';
  end if;

  insert into public.leave_requests (
    employee_id,
    leave_type_id,
    start_date,
    end_date,
    number_of_days,
    reason,
    status
  ) values (
    '30000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '2026-12-24',
    '2026-12-24',
    1,
    'Cancelled test request',
    'PENDING'
  );

  update public.leave_requests
  set status = 'CANCELLED'
  where employee_id = '30000000-0000-0000-0000-000000000001'
    and start_date = '2026-12-24';

  select available_days into v_available
  from public.leave_balances
  where employee_id = '30000000-0000-0000-0000-000000000001'
    and leave_type_id = '40000000-0000-0000-0000-000000000001'
    and year = 2026;

  if v_available is distinct from 10 then
    raise exception 'cancelled request changed the balance: %', v_available;
  end if;
end;
$$;

select pass('employee balance management workflow preserves existing leave behavior');
select * from finish();
rollback;
