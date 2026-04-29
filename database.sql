-- StoreHouse Database Schema
-- รันใน Supabase SQL Editor

-- ตาราง items (สินค้า)
create table if not exists items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  barcode text,
  current_stock numeric default 0 not null,
  unit text default 'ชิ้น' not null,
  category text,
  low_stock_threshold numeric default 5,
  created_at timestamptz default now() not null
);

-- ตาราง transactions (รายการรับ-เบิก)
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references items(id) on delete set null,
  item_name text not null,
  type text check (type in ('receive', 'withdraw')) not null,
  quantity numeric not null check (quantity > 0),
  notes text,
  line_user_id text,
  line_display_name text,
  line_picture_url text,
  created_at timestamptz default now() not null
);

-- Function สำหรับเพิ่ม stock
create or replace function increment_stock(p_item_id uuid, p_quantity numeric)
returns void language plpgsql as $$
begin
  update items
  set current_stock = current_stock + p_quantity
  where id = p_item_id;
end;
$$;

-- Function สำหรับลด stock
create or replace function decrement_stock(p_item_id uuid, p_quantity numeric)
returns void language plpgsql as $$
begin
  update items
  set current_stock = greatest(0, current_stock - p_quantity)
  where id = p_item_id;
end;
$$;

-- RLS (Row Level Security) - เปิดใช้งาน
alter table items enable row level security;
alter table transactions enable row level security;

-- Policy: ทุกคนอ่าน-เขียนได้ (สำหรับแอปภายในครอบครัว)
create policy "Allow all" on items for all using (true) with check (true);
create policy "Allow all" on transactions for all using (true) with check (true);

-- สินค้าตัวอย่าง
insert into items (name, unit, current_stock, category, low_stock_threshold) values
  ('น้ำตาลทราย', 'กก.', 10, 'เครื่องปรุง', 3),
  ('แป้งสาลี', 'กก.', 5, 'เครื่องปรุง', 2),
  ('น้ำมันพืช', 'ลิตร', 8, 'เครื่องปรุง', 2),
  ('ข้าวสาร', 'กก.', 20, 'ธัญพืช', 5),
  ('ซีอิ๊วขาว', 'ขวด', 6, 'เครื่องปรุง', 2)
on conflict do nothing;
