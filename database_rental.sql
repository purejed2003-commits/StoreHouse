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
  current_reading numeric not null,
  previous_reading numeric not null,
  units_used numeric,                    -- current - previous
  electricity_rate numeric not null,
  electricity_cost numeric,              -- units_used × rate
  rent_amount numeric default 0,
  total_amount numeric,                  -- electricity_cost + rent_amount
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
insert into units (name, type, rent_price, electricity_rate, is_occupied, sort_order) values
  ('ห้อง 101', 'room', 3000, 8, true, 1),
  ('ห้อง 102', 'room', 3000, 8, true, 2),
  ('ห้อง 103', 'room', 3000, 8, false, 3),
  ('ห้อง 104', 'room', 3000, 8, true, 4),
  ('ห้อง 105', 'room', 3000, 8, true, 5),
  ('ห้อง 106', 'room', 3000, 8, false, 6),
  ('ห้อง 107', 'room', 3000, 8, true, 7),
  ('ห้อง 108', 'room', 3000, 8, true, 8),
  ('ห้อง 109', 'room', 3000, 8, false, 9),
  ('ห้อง 110', 'room', 3000, 8, true, 10),
  ('บ้านเช่า',  'house',  6000, 16, true, 11),
  ('ที่จอดรถ A1', 'parking', 500, 0, true, 12),
  ('ที่จอดรถ A2', 'parking', 500, 0, false, 13)
on conflict do nothing;
