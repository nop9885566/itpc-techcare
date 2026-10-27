-- =============================================================================
-- 05_crud_examples.sql
-- ตัวอย่างคำสั่ง CRUD สำหรับทุกตาราง
-- ใช้รันเองใน Supabase SQL Editor เพื่อทดสอบหรือจัดการข้อมูล
-- =============================================================================

-- =============================================================================
-- STUDENTS — นักเรียน
-- =============================================================================

-- เพิ่มนักเรียนใหม่
insert into public.students (student_id, first_name_th, last_name_th, nickname_th, grade, room, gender)
values ('67001', 'มานะ', 'พยายาม', 'นะ', 'ม.5', 1, 'ชาย');

-- แก้ไขข้อมูลนักเรียน (เปลี่ยนห้อง)
update public.students
set room = 2, grade = 'ม.5'
where student_id = '67001';

-- ปิดข้อมูลนักเรียน (เก็บประวัติเดิมและไม่แสดงในแอป)
update public.students
set disabled_at = now()
where student_id = '67001';

-- ดูนักเรียนทั้งหมดพร้อมจำนวนเคส
select
  s.id,
  s.student_id,
  s.first_name_th || ' ' || s.last_name_th as full_name,
  s.nickname_th,
  s.grade,
  s.room,
  count(cs.case_id) as case_count
from public.students s
left join public.case_students cs on cs.student_id = s.id
where s.disabled_at is null
group by s.id
order by s.grade, s.room, s.first_name_th;

-- =============================================================================
-- CARETAKERS — ผู้ดูแล
-- =============================================================================

-- เพิ่มผู้ดูแลใหม่ (PIN: 5678)
insert into public.caretakers (name, pin_hash)
values ('ครูใหม่', crypt('5678', gen_salt('bf')));

-- เปลี่ยน PIN ผู้ดูแล (PIN ใหม่: 9999)
update public.caretakers
set pin_hash = crypt('9999', gen_salt('bf'))
where name = 'ครูใหม่';

-- ปิดบัญชีผู้ดูแล (เก็บประวัติและไม่อนุญาตให้เข้าสู่ระบบ)
update public.caretakers
set disabled_at = now()
where name = 'ครูใหม่';

-- ดูผู้ดูแลทั้งหมด (ไม่แสดง pin_hash)
select id, name, role, disabled_at, created_at
from public.caretakers
order by created_at;

-- =============================================================================
-- CASES — เคส
-- =============================================================================

-- เพิ่มเคสใหม่ (ใช้ฟังก์ชัน create_case_full แนะนำมากกว่า)
-- แต่ถ้าจะ insert ตรงให้ใส่ case_students และ case_caretakers ด้วยตนเอง
insert into public.cases (case_type, details, scheduled_at, created_by)
values (
  'low_confidence',
  'นักเรียนขาดความมั่นใจในการพูดหน้าชั้น',
  now() + interval '2 days',
  (select id from public.caretakers where name = 'ครูอ้อย')
)
returning id;

-- แก้ไขสถานะเคสเป็น done
update public.cases
set status = 'done'
where id = 'c1000000-0000-0000-0000-000000000001';

-- แก้ไขรายละเอียดเคส
update public.cases
set details = 'อัปเดต: นักเรียนมีพัฒนาการที่ดีขึ้น',
    scheduled_at = now() + interval '7 days'
where id = 'c1000000-0000-0000-0000-000000000001';

-- ลบเคส (cascade ลบ case_students, case_caretakers, case_updates, case_signatures)
delete from public.cases
where id = 'c1000000-0000-0000-0000-000000000001';

-- ดูเคสทั้งหมดพร้อมข้อมูลที่เกี่ยวข้อง
select
  c.id,
  c.case_type,
  c.other_text,
  c.details,
  c.scheduled_at,
  c.status,
  ct.name as created_by_name,
  count(distinct cs.student_id) as student_count,
  count(distinct cc.caretaker_id) as caretaker_count
from public.cases c
join public.caretakers ct on ct.id = c.created_by
left join public.case_students cs on cs.case_id = c.id
left join public.case_caretakers cc on cc.case_id = c.id
group by c.id, ct.name
order by c.scheduled_at desc;

-- =============================================================================
-- CASE_STUDENTS — นักเรียนในเคส
-- =============================================================================

-- เพิ่มนักเรียนเข้าเคส
insert into public.case_students (case_id, student_id)
values (
  'c1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000010'
)
on conflict do nothing;

-- ลบนักเรียนออกจากเคส
delete from public.case_students
where case_id = 'c1000000-0000-0000-0000-000000000004'
  and student_id = 'a1000000-0000-0000-0000-000000000010';

-- ดูนักเรียนทั้งหมดในเคสหนึ่ง
select s.student_id, s.first_name_th, s.last_name_th, s.grade, s.room
from public.case_students cs
join public.students s on s.id = cs.student_id
where cs.case_id = 'c1000000-0000-0000-0000-000000000001';

-- =============================================================================
-- CASE_CARETAKERS — ผู้ดูแลในเคส
-- =============================================================================

-- เพิ่มผู้ดูแลเข้าเคส
insert into public.case_caretakers (case_id, caretaker_id)
values (
  'c1000000-0000-0000-0000-000000000004',
  'b1000000-0000-0000-0000-000000000002'
)
on conflict do nothing;

-- ลบผู้ดูแลออกจากเคส
delete from public.case_caretakers
where case_id = 'c1000000-0000-0000-0000-000000000004'
  and caretaker_id = 'b1000000-0000-0000-0000-000000000002';

-- =============================================================================
-- CASE_UPDATES — การอัปเดตเคส
-- =============================================================================

-- เพิ่มการอัปเดตเคส
insert into public.case_updates (case_id, caretaker_id, activity_note, result_note, next_step)
values (
  'c1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000001',
  'พูดคุยให้กำลังใจนักเรียน สอนเทคนิคการลดความวิตกกังวล',
  'นักเรียนดูผ่อนคลายขึ้น ยอมฝึกพูดหน้ากระจก',
  'ติดตามหลังการนำเสนองานครั้งต่อไป'
);

-- แก้ไขการอัปเดต
update public.case_updates
set result_note = 'นักเรียนนำเสนองานได้ดี ได้รับคำชมจากเพื่อน'
where id = 'd1000000-0000-0000-0000-000000000001';

-- ลบการอัปเดต
delete from public.case_updates
where id = 'd1000000-0000-0000-0000-000000000001';

-- ดูประวัติการอัปเดตทั้งหมดของเคส
select
  cu.id,
  ct.name as caretaker_name,
  cu.activity_note,
  cu.result_note,
  cu.next_step,
  cu.created_at
from public.case_updates cu
join public.caretakers ct on ct.id = cu.caretaker_id
where cu.case_id = 'c1000000-0000-0000-0000-000000000002'
order by cu.created_at asc;

-- =============================================================================
-- CASE_SIGNATURES — ลายเซ็น
-- =============================================================================

-- เพิ่มลายเซ็น (signature_data เป็น base64 PNG)
insert into public.case_signatures (case_id, signer_name, signer_role, signature_data)
values (
  'c1000000-0000-0000-0000-000000000002',
  'สมหญิง มีสุข',
  'นักเรียน',
  'data:image/png;base64,iVBORw0KGgo='  -- ตัวอย่าง base64 (ของจริงจะยาวกว่านี้)
);

-- ลบลายเซ็น
delete from public.case_signatures
where case_id = 'c1000000-0000-0000-0000-000000000002'
  and signer_name = 'สมหญิง มีสุข';

-- ดูลายเซ็นทั้งหมดของเคส
select id, signer_name, signer_role, signed_at
from public.case_signatures
where case_id = 'c1000000-0000-0000-0000-000000000002'
order by signed_at;

-- =============================================================================
-- ตัวอย่าง RPC — login_caretaker
-- =============================================================================

-- ทดสอบ login (PIN ถูก)
select public.login_caretaker('ครูอ้อย', '1234');

-- ทดสอบ login (PIN ผิด)
select public.login_caretaker('ครูอ้อย', '0000');

-- =============================================================================
-- ตัวอย่าง RPC — create_case_full
-- =============================================================================
select public.create_case_full(
  'low_confidence',
  null,
  'ทดสอบสร้างเคสผ่านฟังก์ชัน',
  now() + interval '3 days',
  'b1000000-0000-0000-0000-000000000001',  -- created_by = ครูอ้อย
  array[
    'a1000000-0000-0000-0000-000000000001'::uuid,
    'a1000000-0000-0000-0000-000000000002'::uuid
  ],
  array[
    'b1000000-0000-0000-0000-000000000001'::uuid,
    'b1000000-0000-0000-0000-000000000002'::uuid
  ]
);
