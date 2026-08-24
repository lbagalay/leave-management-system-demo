-- Deterministic fictional data for the Leave Management System demo.
-- Login credentials are handled by the app's signed demo-auth layer:
-- employee@demo.com / Demo123!
-- supervisor@demo.com / Demo123!
-- admin@demo.com / Demo123!

insert into public.departments (id, name) values
  ('20000000-0000-0000-0000-000000000001', 'Operations'),
  ('20000000-0000-0000-0000-000000000002', 'Accounting'),
  ('20000000-0000-0000-0000-000000000003', 'Sales'),
  ('20000000-0000-0000-0000-000000000004', 'Human Resources'),
  ('20000000-0000-0000-0000-000000000005', 'Administration')
on conflict (id) do update set name = excluded.name;

insert into public.app_users (id, email, name, role, department_id) values
  ('10000000-0000-0000-0000-000000000001', 'employee@demo.com', 'Juan Dela Cruz', 'EMPLOYEE', '20000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'maria.santos@demo.com', 'Maria Santos', 'EMPLOYEE', '20000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000003', 'carlo.reyes@demo.com', 'Carlo Reyes', 'EMPLOYEE', '20000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000004', 'supervisor@demo.com', 'Andrea Lim', 'SUPERVISOR', '20000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000005', 'admin@demo.com', 'Admin User', 'ADMIN', '20000000-0000-0000-0000-000000000005')
on conflict (id) do update set
  email = excluded.email,
  name = excluded.name,
  role = excluded.role,
  department_id = excluded.department_id;

insert into public.employees (id, user_id, employee_number, first_name, last_name, department_id, position) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'EMP-001', 'Juan', 'Dela Cruz', '20000000-0000-0000-0000-000000000001', 'Operations Associate'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'EMP-002', 'Maria', 'Santos', '20000000-0000-0000-0000-000000000002', 'Accounting Assistant'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'EMP-003', 'Carlo', 'Reyes', '20000000-0000-0000-0000-000000000003', 'Sales Associate'),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'EMP-004', 'Andrea', 'Lim', '20000000-0000-0000-0000-000000000001', 'Operations Supervisor')
on conflict (id) do update set
  employee_number = excluded.employee_number,
  position = excluded.position,
  department_id = excluded.department_id;

update public.app_users set employee_id = case id
  when '10000000-0000-0000-0000-000000000001' then '30000000-0000-0000-0000-000000000001'::uuid
  when '10000000-0000-0000-0000-000000000002' then '30000000-0000-0000-0000-000000000002'::uuid
  when '10000000-0000-0000-0000-000000000003' then '30000000-0000-0000-0000-000000000003'::uuid
  when '10000000-0000-0000-0000-000000000004' then '30000000-0000-0000-0000-000000000004'::uuid
  else employee_id
end;

insert into public.leave_types (id, name, code, description, default_days) values
  ('40000000-0000-0000-0000-000000000001', 'Vacation Leave', 'VACATION', 'Planned personal leave and rest days.', 15),
  ('40000000-0000-0000-0000-000000000002', 'Sick Leave', 'SICK', 'Leave for illness, treatment, or recovery.', 10),
  ('40000000-0000-0000-0000-000000000003', 'Emergency Leave', 'EMERGENCY', 'Urgent and unforeseen personal matters.', 5),
  ('40000000-0000-0000-0000-000000000004', 'Bereavement Leave', 'BEREAVEMENT', 'Leave following the loss of an immediate family member.', 5),
  ('40000000-0000-0000-0000-000000000005', 'Other Leave', 'OTHER', 'Other approved leave categories.', 5)
on conflict (id) do update set
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  default_days = excluded.default_days;

insert into public.leave_balances (employee_id, leave_type_id, year, allocated_days, used_days) values
  ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 2026, 15, 5),
  ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 2026, 10, 2),
  ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 2026, 5, 2),
  ('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 2026, 15, 7),
  ('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 2026, 10, 1),
  ('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 2026, 15, 4),
  ('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 2026, 10, 3)
on conflict (employee_id, leave_type_id, year) do update set
  allocated_days = excluded.allocated_days,
  used_days = excluded.used_days;

insert into public.leave_requests
  (id, employee_id, leave_type_id, start_date, end_date, number_of_days, reason, status, reviewed_by, reviewed_at, reviewer_remarks, created_at)
values
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '2026-08-27', '2026-08-28', 2, 'Family matter', 'PENDING', null, null, null, '2026-08-24 08:30:00+08'),
  ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '2026-09-01', '2026-09-01', 1, 'Medical checkup', 'PENDING', null, null, null, '2026-08-23 10:15:00+08'),
  ('50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', '2026-09-07', '2026-09-08', 2, 'Family commitment', 'PENDING', null, null, null, '2026-08-22 15:00:00+08'),
  ('50000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', '2026-08-18', '2026-08-19', 2, 'Personal appointment', 'APPROVED', '10000000-0000-0000-0000-000000000004', '2026-08-14 09:30:00+08', 'Approved. Please complete the handover before leave.', '2026-08-13 14:20:00+08'),
  ('50000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '2026-07-10', '2026-07-10', 1, 'Not feeling well', 'APPROVED', '10000000-0000-0000-0000-000000000004', '2026-07-09 08:15:00+08', null, '2026-07-09 07:40:00+08'),
  ('50000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '2026-06-02', '2026-06-03', 2, 'Scheduled personal leave', 'APPROVED', '10000000-0000-0000-0000-000000000004', '2026-05-29 11:00:00+08', null, '2026-05-28 16:10:00+08'),
  ('50000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', '2026-05-12', '2026-05-13', 2, 'Rest and recovery', 'APPROVED', '10000000-0000-0000-0000-000000000005', '2026-05-11 13:00:00+08', null, '2026-05-11 09:10:00+08'),
  ('50000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', '2026-08-25', '2026-08-27', 3, 'Personal leave', 'REJECTED', '10000000-0000-0000-0000-000000000004', '2026-08-21 16:00:00+08', 'Department coverage unavailable during requested dates.', '2026-08-20 10:00:00+08'),
  ('50000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', '2026-04-06', '2026-04-08', 3, 'Extended weekend trip', 'REJECTED', '10000000-0000-0000-0000-000000000005', '2026-03-30 14:30:00+08', 'Month-end reporting coverage is required.', '2026-03-29 09:25:00+08')
on conflict (id) do nothing;
