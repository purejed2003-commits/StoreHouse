-- ===================================================
-- StoreHouse - Rental Management Schema
-- รันใน Supabase SQL Editor
-- ===================================================

-- ตาราง units (ห้อง/บ้าน/ที่จอดรถ)
create table if not exists units (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text check (type in ('room', 'house', 'parking')) not null default 'room',
  rent_price numeric default 0,
  electricity_rate numeric default 8,   -- 8 บาท/หน่วย (ห้อง), 16 (บ้าน), 0 (ที่จอดรถ)
  water_rate numeric default 16,        -- 16 บาท/หน่วย (ห้อง/บ้าน), 0 (ที่จอดรถ)
  tenant_name text,
  tenant_phone text,
  is_occupied boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ตาราง meter_readings (บันทึกมิตเตอร์รายเดือน)
create table if not exists meter_readings (
  id uuid default gen_random_uuid() primary key,
  unit_id uuid references units(id) on delete cascade not null,
  unit_name text not null,
  reading_month text not null,           -- format: "2026-04"
  -- ไฟ
  current_reading numeric not null default 0,
  previous_reading numeric not null default 0,
  units_used numeric default 0,
  electricity_rate numeric not null default 0,
  electricity_cost numeric default 0,
  -- น้ำ
  water_current_reading numeric default 0,
  water_previous_reading numeric default 0,
  water_units_used numeric default 0,
  water_rate numeric default 0,
  water_cost numeric default 0,
  -- ค่าเช่าและรวม
  rent_amount numeric default 0,
  total_amount numeric default 0,        -- electricity_cost + water_cost + rent_amount
  -- สถานะ
  is_paid boolean default false,
  paid_date timestamptz,
  notes text,
  recorded_by text,
  created_at timestamptz default now(),
  unique(unit_id, reading_month)
);

-- RLS
alter table units enable row level security;
alter table meter_readings enable row level security;
create policy "Allow all" on units for all using (true) with check (true);
create policy "Allow all" on meter_readings for all using (true) with check (true);

-- ข้อมูลตัวอย่าง (แก้ชื่อ/ราคาให้ตรงกับจริง)
insert into units (name, type, rent_price, electricity_rate, water_rate, is_occupied, sort_order) values
  ('ห้อง 1',       'room',    3000, 8,  16, true,  1),
  ('ห้อง 2',       'room',    3000, 8,  16, true,  2),
  ('ห้อง 3',       'room',    3000, 8,  16, false, 3),
  ('ห้อง 4',       'room',    3000, 8,  16, true,  4),
  ('ห้อง 5',       'room',    3000, 8,  16, true,  5),
  ('ห้อง 6',       'room',    3000, 8,  16, false, 6),
  ('ห้อง 7',       'room',    3000, 8,  16, true,  7),
  ('ห้อง 8',       'room',    3000, 8,  16, true,  8),
  ('ห้อง 9',       'room',    3000, 8,  16, false, 9),
  ('ห้อง 10',      'room',    3000, 8,  16, true,  10),
  ('บ้านเช่า',     'house',   6000, 16, 16, true,  11),
  ('ที่จอดรถ A1',  'parking',  500,  0,  0, true,  12),
  ('ที่จอดรถ A2',  'parking',  500,  0,  0, false, 13),
  ('ที่จอดรถ A3',  'parking',  500,  0,  0, true,  14),
  ('ที่จอดรถ A4',  'parking',  500,  0,  0, false, 15),
  ('ที่จอดรถ A5',  'parking',  500,  0,  0, true,  16),
  ('ที่จอดรถ A6',  'parking',  500,  0,  0, false, 17),
  ('ที่จอดรถ A7',  'parking',  500,  0,  0, true,  18),
  ('ที่จอดรถ A8',  'parking',  500,  0,  0, false, 19),
  ('ที่จอดรถ A9',  'parking',  500,  0,  0, true,  20),
  ('ที่จอดรถ A10', 'parking',  500,  0,  0, false, 21)
on conflict do nothing;

-- =============================================
-- ถ้ารัน SQL เดิมไปแล้ว ให้ uncomment แล้วรันคำสั่งด้านล่างเพิ่ม (Migration)
-- =============================================
-- alter table units add column if not exists water_rate numeric default 16;
-- update units set water_rate = 0 where type = 'parking';
-- alter table meter_readings
--   add column if not exists water_current_reading numeric default 0,
--   add column if not exists water_previous_reading numeric default 0,
--   add column if not exists water_units_used numeric default 0,
--   add column if not exists water_rate numeric default 0,
--   add column if not exists water_cost numeric default 0;
