-- =====================================================================
--  DealFinder LK — database setup
--  Run this once in a NEW Supabase project:
--  Dashboard → SQL Editor → New query → paste this file → Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------
create type public.app_role as enum ('admin', 'user');
create type public.deal_status as enum ('pending', 'approved', 'rejected');

-- ---------------------------------------------------------------------
-- Profiles (one per signed-up user)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Runs with owner rights so policies can call it without recursion.
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(auth.uid(), 'admin')
$$;

-- Profiles: users see/edit their own; admins see everyone.
create policy "Users read own profile" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "Users update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Roles: users can read their own roles; only admins can change roles.
create policy "Users read own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "Admins add roles" on public.user_roles
  for insert to authenticated with check (public.is_admin());
create policy "Admins remove roles" on public.user_roles
  for delete to authenticated using (public.is_admin());

-- New sign-up → profile + 'user' role
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email);
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Deals
-- ---------------------------------------------------------------------
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 140),
  business_name text not null check (char_length(business_name) between 1 and 100),
  description text check (char_length(description) <= 3000),
  terms text check (char_length(terms) <= 3000),
  category text not null,
  city text not null default 'Islandwide',
  location text,
  bank text,
  discount_percentage integer not null default 0 check (discount_percentage between 0 and 100),
  original_price numeric(12, 2) check (original_price >= 0),
  deal_price numeric(12, 2) check (deal_price >= 0),
  promo_code text check (char_length(promo_code) <= 40),
  image_url text,
  original_url text,
  start_date date,
  expiry_date date not null,
  status public.deal_status not null default 'pending',
  rejection_reason text,
  is_featured boolean not null default false,
  is_archived boolean not null default false,
  view_count integer not null default 0,
  click_count integer not null default 0,
  submitted_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deals_public_idx on public.deals (status, is_archived, expiry_date);
create index deals_category_idx on public.deals (category);
create index deals_created_idx on public.deals (created_at desc);
create index deals_submitted_by_idx on public.deals (submitted_by);

alter table public.deals enable row level security;

-- FIX: the public can only read approved, non-archived deals.
-- (Before, anyone could read every row, including submitters' emails and phone numbers.)
create policy "Public reads approved deals" on public.deals
  for select using (status = 'approved' and is_archived = false);
create policy "Submitters read own deals" on public.deals
  for select to authenticated using (submitted_by = auth.uid());
create policy "Admins read all deals" on public.deals
  for select to authenticated using (public.is_admin());

-- FIX: any signed-in user can submit (before, signed-in non-admins were blocked).
-- The trigger below forces safe values for non-admins.
create policy "Signed-in users submit deals" on public.deals
  for insert to authenticated with check (submitted_by = auth.uid() or public.is_admin());

create policy "Admins update deals" on public.deals
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete deals" on public.deals
  for delete to authenticated using (public.is_admin());

-- Non-admin submissions: force pending status, no featuring, zero counters,
-- and limit each user to 10 submissions per 24 hours.
-- (Not security definer on purpose: current_user tells us who is inserting.
--  The service role and the SQL editor skip these rules, e.g. for data imports.)
create or replace function public.prepare_new_deal()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  recent_count integer;
begin
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    if new.status = 'approved' and new.approved_at is null then
      new.approved_at := now();
    end if;
    return new;
  end if;

  select count(*) into recent_count
  from public.deals
  where submitted_by = auth.uid() and created_at > now() - interval '24 hours';

  if recent_count >= 10 then
    raise exception 'You can submit up to 10 deals per day. Please try again tomorrow.';
  end if;

  new.submitted_by := auth.uid();
  new.status := 'pending';
  new.rejection_reason := null;
  new.is_featured := false;
  new.is_archived := false;
  new.view_count := 0;
  new.click_count := 0;
  new.approved_at := null;
  return new;
end;
$$;

create trigger deals_before_insert
  before insert on public.deals
  for each row execute function public.prepare_new_deal();

create or replace function public.touch_deal()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.approved_at := now();
    new.rejection_reason := null;
  end if;
  return new;
end;
$$;

create trigger deals_before_update
  before update on public.deals
  for each row execute function public.touch_deal();

-- View / click counters (callable by anyone, only touches approved deals)
create or replace function public.increment_deal_view(deal_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.deals set view_count = view_count + 1
  where id = deal_id and status = 'approved';
$$;

create or replace function public.increment_deal_click(deal_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.deals set click_count = click_count + 1
  where id = deal_id and status = 'approved';
$$;

grant execute on function public.increment_deal_view(uuid) to anon, authenticated;
grant execute on function public.increment_deal_click(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Saved deals
-- ---------------------------------------------------------------------
create table public.saved_deals (
  user_id uuid not null references public.profiles (id) on delete cascade,
  deal_id uuid not null references public.deals (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, deal_id)
);

alter table public.saved_deals enable row level security;

create policy "Users read own saved deals" on public.saved_deals
  for select to authenticated using (user_id = auth.uid());
create policy "Users save deals" on public.saved_deals
  for insert to authenticated with check (user_id = auth.uid());
create policy "Users unsave deals" on public.saved_deals
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Reports ("this deal has expired / is wrong")
-- ---------------------------------------------------------------------
create table public.deal_reports (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null default auth.uid(),
  reason text not null check (reason in ('expired', 'wrong_info', 'spam', 'other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create index deal_reports_status_idx on public.deal_reports (status, created_at desc);

alter table public.deal_reports enable row level security;

create policy "Anyone can report a deal" on public.deal_reports
  for insert with check (status = 'open' and (user_id is null or user_id = auth.uid()));
create policy "Admins read reports" on public.deal_reports
  for select to authenticated using (public.is_admin());
create policy "Admins update reports" on public.deal_reports
  for update to authenticated using (public.is_admin());
create policy "Admins delete reports" on public.deal_reports
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- Image storage
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('deal-images', 'deal-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

-- Public URLs work without a policy because the bucket is public.
-- FIX: users may only upload into their own folder (<user id>/...),
-- and only the owner or an admin can replace or delete an image.
create policy "Users upload to own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'deal-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
create policy "Owners or admins update images" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'deal-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
create policy "Owners or admins delete images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'deal-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- =====================================================================
--  After you sign up on the site, make yourself an admin by running:
--
--  insert into public.user_roles (user_id, role)
--  select id, 'admin' from auth.users where email = 'YOUR-EMAIL@example.com';
-- =====================================================================
