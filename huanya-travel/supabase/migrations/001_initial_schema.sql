-- HuanYa Travel - Initial Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- PROFILES: extends Supabase auth.users
-- =============================================
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  role        text not null check (role in ('tourist', 'driver')),
  full_name   text,
  phone       text,
  avatar_url  text,
  bio         text,
  -- driver-only fields
  license_no  text,
  vehicle_type text,     -- e.g. '7座MPV', '商务舱'
  vehicle_plate text,
  vehicle_photo_url text,
  is_verified boolean default false,
  rating      numeric(3,2) default 5.00,
  total_trips integer default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- =============================================
-- DEMANDS: tourist trip requests
-- =============================================
create table public.demands (
  id            uuid default uuid_generate_v4() primary key,
  tourist_id    uuid references public.profiles(id) on delete cascade not null,
  -- location
  pickup_loc    text not null,
  dropoff_loc   text not null,
  pickup_detail text,       -- additional pickup notes
  -- trip info
  travel_date   date not null,
  travel_time   time,
  pax_count     integer not null check (pax_count >= 1 and pax_count <= 20),
  luggage_count integer not null default 0,
  note          text,       -- special requests
  -- budget
  budget_min    integer,    -- AUD cents
  budget_max    integer,    -- AUD cents
  -- status flow: pending -> bidding -> confirmed -> in_progress -> completed | cancelled
  status        text not null default 'pending'
                check (status in ('pending','bidding','confirmed','in_progress','completed','cancelled')),
  -- accepted bid (set when tourist confirms)
  accepted_bid_id uuid,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- =============================================
-- BIDS: driver quotes on demands
-- =============================================
create table public.bids (
  id            uuid default uuid_generate_v4() primary key,
  demand_id     uuid references public.demands(id) on delete cascade not null,
  driver_id     uuid references public.profiles(id) on delete cascade not null,
  -- quote
  price         integer not null check (price > 0),  -- AUD cents
  vehicle_info  text not null,   -- e.g. 'Toyota Alphard 7座, 2023'
  message       text,            -- driver's pitch to tourist
  -- status: active -> accepted | rejected | withdrawn
  status        text not null default 'active'
                check (status in ('active','accepted','rejected','withdrawn')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  -- one driver can only bid once per demand
  unique(demand_id, driver_id)
);

-- forward reference: link accepted_bid_id
alter table public.demands
  add constraint demands_accepted_bid_fk
  foreign key (accepted_bid_id) references public.bids(id) on delete set null;

-- =============================================
-- ORDERS: created when tourist accepts a bid
-- =============================================
create table public.orders (
  id              uuid default uuid_generate_v4() primary key,
  demand_id       uuid references public.demands(id) on delete restrict not null,
  bid_id          uuid references public.bids(id) on delete restrict not null,
  tourist_id      uuid references public.profiles(id) on delete restrict not null,
  driver_id       uuid references public.profiles(id) on delete restrict not null,
  amount          integer not null,  -- AUD cents, from bid.price
  -- payment: unpaid -> deposited -> paid_in_full | refunded
  payment_status  text not null default 'unpaid'
                  check (payment_status in ('unpaid','deposited','paid_in_full','refunded')),
  -- trip status mirrors demand
  trip_status     text not null default 'confirmed'
                  check (trip_status in ('confirmed','in_progress','completed','disputed','cancelled')),
  tourist_confirmed_at timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- =============================================
-- REVIEWS
-- =============================================
create table public.reviews (
  id          uuid default uuid_generate_v4() primary key,
  order_id    uuid references public.orders(id) on delete cascade not null unique,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  reviewee_id uuid references public.profiles(id) on delete cascade not null,
  rating      integer not null check (rating >= 1 and rating <= 5),
  comment     text,
  created_at  timestamptz default now()
);

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at  before update on public.profiles  for each row execute procedure public.handle_updated_at();
create trigger demands_updated_at   before update on public.demands   for each row execute procedure public.handle_updated_at();
create trigger bids_updated_at      before update on public.bids      for each row execute procedure public.handle_updated_at();
create trigger orders_updated_at    before update on public.orders    for each row execute procedure public.handle_updated_at();

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'tourist'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
alter table public.profiles enable row level security;
alter table public.demands  enable row level security;
alter table public.bids     enable row level security;
alter table public.orders   enable row level security;
alter table public.reviews  enable row level security;

-- profiles: anyone can read, only self can write
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- demands: anyone can read open demands; tourist owns their own
create policy "demands_select_open" on public.demands for select using (
  status in ('pending','bidding') or tourist_id = auth.uid()
);
create policy "demands_insert_tourist" on public.demands for insert with check (
  tourist_id = auth.uid()
);
create policy "demands_update_own"  on public.demands for update using (tourist_id = auth.uid());

-- bids: drivers see all bids on public demands; tourists see bids on their demands
create policy "bids_select" on public.bids for select using (
  driver_id = auth.uid() or
  demand_id in (select id from public.demands where tourist_id = auth.uid()) or
  exists (select 1 from public.demands d where d.id = demand_id and d.status in ('pending','bidding'))
);
create policy "bids_insert_driver" on public.bids for insert with check (driver_id = auth.uid());
create policy "bids_update_own"    on public.bids for update using (driver_id = auth.uid());

-- orders: only parties involved
create policy "orders_select_own" on public.orders for select using (
  tourist_id = auth.uid() or driver_id = auth.uid()
);
create policy "orders_insert" on public.orders for insert with check (tourist_id = auth.uid());
create policy "orders_update_own" on public.orders for update using (
  tourist_id = auth.uid() or driver_id = auth.uid()
);

-- reviews: anyone can read; only reviewer can write
create policy "reviews_select_all" on public.reviews for select using (true);
create policy "reviews_insert_own" on public.reviews for insert with check (reviewer_id = auth.uid());

-- =============================================
-- INDEXES for performance
-- =============================================
create index demands_tourist_id_idx  on public.demands(tourist_id);
create index demands_status_date_idx on public.demands(status, travel_date);
create index bids_demand_id_idx      on public.bids(demand_id);
create index bids_driver_id_idx      on public.bids(driver_id);
create index orders_tourist_id_idx   on public.orders(tourist_id);
create index orders_driver_id_idx    on public.orders(driver_id);
