-- =============================================================================
-- 01_schema.sql
-- โครงสร้างฐานข้อมูล ITPC Techcare
-- รันได้ซ้ำปลอดภัย (idempotent)
-- =============================================================================

-- เปิดใช้งาน pgcrypto สำหรับ hash PIN
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- ตาราง students (กำหนดไว้แล้ว ไม่เปลี่ยนโครงสร้าง)
-- -----------------------------------------------------------------------------
create table if not exists public.students (
  id            uuid                     not null default gen_random_uuid(),
  student_id    text                     null,
  first_name_th text                     null,
  last_name_th  text                     null,
  nickname_th   text                     null,
  grade         text                     null,
  room          integer                  null,
  gender        text                     null,
  created_at    timestamp with time zone null default now(),
  updated_at    timestamp with time zone null default now(),
  primary key (id)
);

-- -----------------------------------------------------------------------------
-- ตาราง caretakers (ผู้ดูแล/ครูที่ปรึกษา)
-- -----------------------------------------------------------------------------
create table if not exists public.caretakers (
  id         uuid                     not null default gen_random_uuid(),
  name       text                     not null,
  pin_hash   text                     not null,
  created_at timestamp with time zone not null default now(),
  primary key (id),
  constraint caretakers_name_unique unique (name)
);

-- -----------------------------------------------------------------------------
-- ตาราง cases (เคสการดูแลนักเรียน)
-- -----------------------------------------------------------------------------
create table if not exists public.cases (
  id           uuid                     not null default gen_random_uuid(),
  case_type    text                     not null,
  other_text   text                     null,
  details      text                     null,
  scheduled_at timestamp with time zone null,
  status       text                     not null default 'planned',
  created_by   uuid                     not null references public.caretakers (id) on delete restrict,
  created_at   timestamp with time zone not null default now(),
  updated_at   timestamp with time zone not null default now(),
  primary key (id),
  constraint cases_type_check check (
    case_type in ('low_confidence', 'feel_not_smart', 'other')
  ),
  constraint cases_status_check check (
    status in ('planned', 'done')
  ),
  constraint cases_other_text_required check (
    case_type != 'other' or (other_text is not null and trim(other_text) != '')
  )
);

-- -----------------------------------------------------------------------------
-- ตาราง case_students (many-to-many: เคส <-> นักเรียน)
-- -----------------------------------------------------------------------------
create table if not exists public.case_students (
  case_id    uuid not null references public.cases (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  primary key (case_id, student_id)
);

-- -----------------------------------------------------------------------------
-- ตาราง case_caretakers (many-to-many: เคส <-> ผู้ดูแล)
-- -----------------------------------------------------------------------------
create table if not exists public.case_caretakers (
  case_id      uuid not null references public.cases (id) on delete cascade,
  caretaker_id uuid not null references public.caretakers (id) on delete cascade,
  primary key (case_id, caretaker_id)
);

-- -----------------------------------------------------------------------------
-- ตาราง case_updates (ประวัติการอัปเดตเคส)
-- -----------------------------------------------------------------------------
create table if not exists public.case_updates (
  id             uuid                     not null default gen_random_uuid(),
  case_id        uuid                     not null references public.cases (id) on delete cascade,
  caretaker_id   uuid                     not null references public.caretakers (id) on delete restrict,
  activity_note  text                     null,
  result_note    text                     null,
  next_step      text                     null,
  created_at     timestamp with time zone not null default now(),
  primary key (id)
);

-- -----------------------------------------------------------------------------
-- ตาราง case_signatures (ลายเซ็นดิจิทัล)
-- -----------------------------------------------------------------------------
create table if not exists public.case_signatures (
  id             uuid                     not null default gen_random_uuid(),
  case_id        uuid                     not null references public.cases (id) on delete cascade,
  signer_name    text                     not null,
  signer_role    text                     not null,
  signature_data text                     not null,
  signed_at      timestamp with time zone not null default now(),
  primary key (id)
);

-- =============================================================================
-- Index สำหรับประสิทธิภาพการค้นหา
-- =============================================================================
create index if not exists idx_students_grade_room
  on public.students (grade, room);

create index if not exists idx_students_student_id
  on public.students (student_id);

create index if not exists idx_cases_scheduled_at
  on public.cases (scheduled_at);

create index if not exists idx_cases_status
  on public.cases (status);

create index if not exists idx_cases_created_by
  on public.cases (created_by);

create index if not exists idx_case_students_student_id
  on public.case_students (student_id);

create index if not exists idx_case_caretakers_caretaker_id
  on public.case_caretakers (caretaker_id);

create index if not exists idx_case_updates_case_id
  on public.case_updates (case_id);

create index if not exists idx_case_signatures_case_id
  on public.case_signatures (case_id);

-- =============================================================================
-- Trigger อัปเดต updated_at อัตโนมัติ
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_students_updated_at on public.students;
create trigger trg_students_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

drop trigger if exists trg_cases_updated_at on public.cases;
create trigger trg_cases_updated_at
  before update on public.cases
  for each row execute function public.set_updated_at();
