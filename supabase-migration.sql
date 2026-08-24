create table if not exists public.service_packages (
  id uuid primary key default gen_random_uuid(),
  service_type text not null,
  label text not null,
  quantity integer not null check (quantity > 0),
  price numeric not null check (price >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.dynamic_buttons (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  icon text,
  action_type text not null default 'url' check (action_type in ('url','service','product','section')),
  action_value text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.service_packages enable row level security;
alter table public.dynamic_buttons enable row level security;
drop policy if exists "public read active service packages" on public.service_packages;
create policy "public read active service packages" on public.service_packages for select using (is_active = true);
drop policy if exists "admins manage service packages" on public.service_packages;
create policy "admins manage service packages" on public.service_packages for all to authenticated using (exists (select 1 from public.admins a where a.user_id = auth.uid())) with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));
drop policy if exists "public read active dynamic buttons" on public.dynamic_buttons;
create policy "public read active dynamic buttons" on public.dynamic_buttons for select using (is_active = true);
drop policy if exists "admins manage dynamic buttons" on public.dynamic_buttons;
create policy "admins manage dynamic buttons" on public.dynamic_buttons for all to authenticated using (exists (select 1 from public.admins a where a.user_id = auth.uid())) with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

insert into public.service_packages (service_type,label,quantity,price,sort_order,is_active) values
('TikTok Likes','100 Likes',100,20,10,true),('TikTok Likes','200 Likes',200,40,20,true),('TikTok Likes','500 Likes',500,90,30,true),('TikTok Likes','1,000 Likes',1000,160,40,true),('TikTok Likes','2,000 Likes',2000,300,50,true),('TikTok Likes','5,000 Likes',5000,750,60,true),('TikTok Likes','10,000 Likes',10000,1400,70,true),('TikTok Likes','20,000 Likes',20000,2800,80,true),('TikTok Likes','50,000 Likes',50000,7000,90,true),('TikTok Likes','100,000 Likes',100000,14000,100,true),('TikTok Likes','200,000 Likes',200000,28000,110,true),('TikTok Likes','500,000 Likes',500000,70000,120,true),('TikTok Likes','1,000,000 Likes',1000000,140000,130,true),('TikTok Likes','2,000,000 Likes',2000000,280000,140,true),('TikTok Likes','5,000,000 Likes',5000000,700000,150,true),('TikTok Likes','10,000,000 Likes',10000000,1400000,160,true)
on conflict do nothing;


-- Product variants: sizes/colors and order selections
alter table public.products add column if not exists available_sizes text[] not null default '{}';
alter table public.products add column if not exists available_colors text[] not null default '{}';
alter table public.order_items add column if not exists selected_size text;
alter table public.order_items add column if not exists selected_color text;
