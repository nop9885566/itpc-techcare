-- =============================================================================
-- 03_functions.sql
-- SQL Functions (RPC) สำหรับ ITPC Techcare
-- รันได้ซ้ำปลอดภัย (create or replace)
-- =============================================================================

-- =============================================================================
-- ฟังก์ชัน login_caretaker
-- ตรวจสอบ PIN และคืนค่า id + name ของผู้ดูแล
-- ห้ามส่ง pin_hash กลับ client เด็ดขาด
-- =============================================================================
create or replace function public.login_caretaker(
  p_name text,
  p_pin  text
)
returns json
language plpgsql
security definer
as $$
declare
  v_caretaker public.caretakers;
begin
  -- ค้นหาผู้ดูแลด้วยชื่อ
  select * into v_caretaker
  from public.caretakers
  where name = p_name;

  -- ตรวจสอบว่าพบข้อมูลและ PIN ถูกต้อง
  if v_caretaker.id is null then
    return json_build_object('success', false, 'error', 'ไม่พบชื่อผู้ดูแลนี้ในระบบ');
  end if;

  if v_caretaker.pin_hash != crypt(p_pin, v_caretaker.pin_hash) then
    return json_build_object('success', false, 'error', 'PIN ไม่ถูกต้อง');
  end if;

  -- คืนค่าเฉพาะ id และ name (ไม่คืน pin_hash)
  return json_build_object(
    'success', true,
    'caretaker', json_build_object(
      'id',   v_caretaker.id,
      'name', v_caretaker.name
    )
  );
end;
$$;

-- ให้ anon เรียกฟังก์ชันนี้ได้
grant execute on function public.login_caretaker(text, text) to anon;

-- =============================================================================
-- ฟังก์ชัน create_case_full
-- สร้างเคสพร้อมนักเรียนและผู้ดูแลในครั้งเดียว (atomic transaction)
-- =============================================================================
create or replace function public.create_case_full(
  p_case_type    text,
  p_other_text   text,
  p_details      text,
  p_scheduled_at timestamp with time zone,
  p_created_by   uuid,
  p_student_ids  uuid[],
  p_caretaker_ids uuid[]
)
returns json
language plpgsql
security definer
as $$
declare
  v_case_id   uuid;
  v_sid       uuid;
  v_cid       uuid;
  v_all_cids  uuid[];
begin
  -- Validate case_type
  if p_case_type not in ('low_confidence', 'feel_not_smart', 'other') then
    return json_build_object('success', false, 'error', 'ประเภทเคสไม่ถูกต้อง');
  end if;

  if p_case_type = 'other' and (p_other_text is null or trim(p_other_text) = '') then
    return json_build_object('success', false, 'error', 'กรุณาระบุรายละเอียดสำหรับประเภท "อื่นๆ"');
  end if;

  if p_student_ids is null or array_length(p_student_ids, 1) = 0 then
    return json_build_object('success', false, 'error', 'ต้องเลือกนักเรียนอย่างน้อย 1 คน');
  end if;

  -- สร้างเคส
  insert into public.cases (
    case_type, other_text, details, scheduled_at, created_by
  ) values (
    p_case_type, p_other_text, p_details, p_scheduled_at, p_created_by
  ) returning id into v_case_id;

  -- เพิ่มนักเรียน
  foreach v_sid in array p_student_ids loop
    insert into public.case_students (case_id, student_id)
    values (v_case_id, v_sid)
    on conflict do nothing;
  end loop;

  -- รวม created_by เข้ากับ caretaker list (เพื่อกันซ้ำ)
  v_all_cids := array(
    select distinct unnest(
      coalesce(p_caretaker_ids, array[]::uuid[]) || array[p_created_by]
    )
  );

  -- เพิ่มผู้ดูแล
  foreach v_cid in array v_all_cids loop
    insert into public.case_caretakers (case_id, caretaker_id)
    values (v_case_id, v_cid)
    on conflict do nothing;
  end loop;

  return json_build_object(
    'success', true,
    'case_id', v_case_id
  );

exception when others then
  return json_build_object('success', false, 'error', sqlerrm);
end;
$$;

grant execute on function public.create_case_full(text, text, text, timestamp with time zone, uuid, uuid[], uuid[]) to anon;

-- =============================================================================
-- ฟังก์ชัน update_case_full
-- อัปเดตข้อมูลเคส พร้อมปรับ student/caretaker list
-- =============================================================================
create or replace function public.update_case_full(
  p_case_id       uuid,
  p_case_type     text,
  p_other_text    text,
  p_details       text,
  p_scheduled_at  timestamp with time zone,
  p_status        text,
  p_student_ids   uuid[],
  p_caretaker_ids uuid[]
)
returns json
language plpgsql
security definer
as $$
declare
  v_sid  uuid;
  v_cid  uuid;
begin
  -- อัปเดตข้อมูลหลักของเคส
  update public.cases set
    case_type    = p_case_type,
    other_text   = p_other_text,
    details      = p_details,
    scheduled_at = p_scheduled_at,
    status       = p_status
  where id = p_case_id;

  if not found then
    return json_build_object('success', false, 'error', 'ไม่พบเคสนี้');
  end if;

  -- อัปเดตนักเรียน: ลบทั้งหมดแล้วเพิ่มใหม่
  delete from public.case_students where case_id = p_case_id;
  foreach v_sid in array p_student_ids loop
    insert into public.case_students (case_id, student_id) values (p_case_id, v_sid);
  end loop;

  -- อัปเดตผู้ดูแล: ลบทั้งหมดแล้วเพิ่มใหม่
  delete from public.case_caretakers where case_id = p_case_id;
  foreach v_cid in array p_caretaker_ids loop
    insert into public.case_caretakers (case_id, caretaker_id) values (p_case_id, v_cid)
    on conflict do nothing;
  end loop;

  return json_build_object('success', true);

exception when others then
  return json_build_object('success', false, 'error', sqlerrm);
end;
$$;

grant execute on function public.update_case_full(uuid, text, text, text, timestamp with time zone, text, uuid[], uuid[]) to anon;

-- =============================================================================
-- ฟังก์ชัน get_student_case_count
-- นับจำนวนเคสของนักเรียนแต่ละคน (ใช้ใน student list view)
-- =============================================================================
create or replace function public.get_student_case_count(p_student_id uuid)
returns integer
language sql
security definer
as $$
  select count(*)::integer
  from public.case_students
  where student_id = p_student_id;
$$;

grant execute on function public.get_student_case_count(uuid) to anon;
