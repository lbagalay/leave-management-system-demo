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

  if v_balance.remaining_days < v_request.number_of_days then
    return query select
      'INSUFFICIENT_BALANCE'::text,
      v_balance.remaining_days,
      v_balance.remaining_days;
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
    v_balance.remaining_days,
    v_balance.remaining_days - v_request.number_of_days;
end;
$$;

revoke all on function public.review_leave_request(uuid, uuid, text, text) from public;
grant execute on function public.review_leave_request(uuid, uuid, text, text) to service_role;

comment on function public.review_leave_request(uuid, uuid, text, text) is
  'Atomically reviews a pending leave request and deducts the balance exactly once on approval.';
