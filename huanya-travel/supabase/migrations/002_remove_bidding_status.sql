-- Migration: remove 'bidding' status, merge into 'pending'
-- Rationale: from the tourist's perspective pending/bidding are identical — both mean
-- "waiting to select a driver". The distinction only added backend complexity.

-- 1. Backfill any existing bidding rows
update public.demands set status = 'pending' where status = 'bidding';

-- 2. Drop and recreate the CHECK constraint without 'bidding'
alter table public.demands drop constraint demands_status_check;
alter table public.demands add constraint demands_status_check
  check (status in ('pending','confirmed','in_progress','completed','cancelled'));

-- 3. Update RLS: open demands are now status = 'pending' only
drop policy "demands_select_open" on public.demands;
create policy "demands_select_open" on public.demands for select using (
  status = 'pending' or tourist_id = auth.uid()
);

drop policy "bids_select" on public.bids;
create policy "bids_select" on public.bids for select using (
  driver_id = auth.uid() or
  demand_id in (select id from public.demands where tourist_id = auth.uid()) or
  exists (select 1 from public.demands d where d.id = demand_id and d.status = 'pending')
);
