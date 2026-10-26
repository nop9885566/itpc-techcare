-- =============================================================================
-- 02_rls_policies.sql
-- Row Level Security สำหรับ role anon
-- รันได้ซ้ำปลอดภัย
-- =============================================================================

-- -----------------------------------------------------------------------------
-- students
-- -----------------------------------------------------------------------------
alter table public.students enable row level security;

drop policy if exists "anon_students_select" on public.students;
create policy "anon_students_select"
  on public.students for select to anon using (true);

drop policy if exists "anon_students_insert" on public.students;
create policy "anon_students_insert"
  on public.students for insert to anon with check (true);

drop policy if exists "anon_students_update" on public.students;
create policy "anon_students_update"
  on public.students for update to anon using (true) with check (true);

drop policy if exists "anon_students_delete" on public.students;
create policy "anon_students_delete"
  on public.students for delete to anon using (true);

-- -----------------------------------------------------------------------------
-- caretakers (anon อ่านได้เฉพาะ id กับ name เพื่อแสดงในหน้า login)
-- การ insert/update/delete ทำผ่าน service_role เท่านั้น (ตั้งค่า seed)
-- -----------------------------------------------------------------------------
alter table public.caretakers enable row level security;

drop policy if exists "anon_caretakers_select" on public.caretakers;
create policy "anon_caretakers_select"
  on public.caretakers for select to anon using (true);

-- หมายเหตุ: pin_hash ไม่ถูกส่งกลับเพราะฟังก์ชัน login ทำงานใน server-side (RPC)
-- anon ไม่มีสิทธิ์ insert/update/delete caretakers โดยตรง

-- -----------------------------------------------------------------------------
-- cases
-- -----------------------------------------------------------------------------
alter table public.cases enable row level security;

drop policy if exists "anon_cases_select" on public.cases;
create policy "anon_cases_select"
  on public.cases for select to anon using (true);

drop policy if exists "anon_cases_insert" on public.cases;
create policy "anon_cases_insert"
  on public.cases for insert to anon with check (true);

drop policy if exists "anon_cases_update" on public.cases;
create policy "anon_cases_update"
  on public.cases for update to anon using (true) with check (true);

drop policy if exists "anon_cases_delete" on public.cases;
create policy "anon_cases_delete"
  on public.cases for delete to anon using (true);

-- -----------------------------------------------------------------------------
-- case_students
-- -----------------------------------------------------------------------------
alter table public.case_students enable row level security;

drop policy if exists "anon_case_students_select" on public.case_students;
create policy "anon_case_students_select"
  on public.case_students for select to anon using (true);

drop policy if exists "anon_case_students_insert" on public.case_students;
create policy "anon_case_students_insert"
  on public.case_students for insert to anon with check (true);

drop policy if exists "anon_case_students_delete" on public.case_students;
create policy "anon_case_students_delete"
  on public.case_students for delete to anon using (true);

-- -----------------------------------------------------------------------------
-- case_caretakers
-- -----------------------------------------------------------------------------
alter table public.case_caretakers enable row level security;

drop policy if exists "anon_case_caretakers_select" on public.case_caretakers;
create policy "anon_case_caretakers_select"
  on public.case_caretakers for select to anon using (true);

drop policy if exists "anon_case_caretakers_insert" on public.case_caretakers;
create policy "anon_case_caretakers_insert"
  on public.case_caretakers for insert to anon with check (true);

drop policy if exists "anon_case_caretakers_delete" on public.case_caretakers;
create policy "anon_case_caretakers_delete"
  on public.case_caretakers for delete to anon using (true);

-- -----------------------------------------------------------------------------
-- case_updates
-- -----------------------------------------------------------------------------
alter table public.case_updates enable row level security;

drop policy if exists "anon_case_updates_select" on public.case_updates;
create policy "anon_case_updates_select"
  on public.case_updates for select to anon using (true);

drop policy if exists "anon_case_updates_insert" on public.case_updates;
create policy "anon_case_updates_insert"
  on public.case_updates for insert to anon with check (true);

drop policy if exists "anon_case_updates_update" on public.case_updates;
create policy "anon_case_updates_update"
  on public.case_updates for update to anon using (true) with check (true);

drop policy if exists "anon_case_updates_delete" on public.case_updates;
create policy "anon_case_updates_delete"
  on public.case_updates for delete to anon using (true);

-- -----------------------------------------------------------------------------
-- case_signatures
-- -----------------------------------------------------------------------------
alter table public.case_signatures enable row level security;

drop policy if exists "anon_case_signatures_select" on public.case_signatures;
create policy "anon_case_signatures_select"
  on public.case_signatures for select to anon using (true);

drop policy if exists "anon_case_signatures_insert" on public.case_signatures;
create policy "anon_case_signatures_insert"
  on public.case_signatures for insert to anon with check (true);

drop policy if exists "anon_case_signatures_delete" on public.case_signatures;
create policy "anon_case_signatures_delete"
  on public.case_signatures for delete to anon using (true);
