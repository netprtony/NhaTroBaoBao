-- ==============================================================================
-- Migration: 20260315000000_phase1_schema.sql
-- Description: Core schema for SaaS Quản Lý Nhà Trọ (BaoBao Stay)
-- Multi-tenant isolation with Row Level Security (RLS) & Performance Best Practices
-- ==============================================================================

-- 1. Helper function for updated_at timestamps
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.update_updated_at_column() from public, anon, authenticated;

-- 2. Organizations Table (Tenant Boundary)
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists update_organizations_updated_at on public.organizations;
create trigger update_organizations_updated_at
  before update on public.organizations
  for each row execute function public.update_updated_at_column();

-- 3. Profiles Table (Linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_org_id on public.profiles(org_id);

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

-- Helper function to get current authenticated user's organization ID
create or replace function public.get_auth_org_id()
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select org_id from public.profiles where id = (select auth.uid());
$$;

revoke execute on function public.get_auth_org_id() from anon;

-- 4. Properties Table (Tòa nhà / Dãy nhà trọ)
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_properties_org_id on public.properties(org_id);

drop trigger if exists update_properties_updated_at on public.properties;
create trigger update_properties_updated_at
  before update on public.properties
  for each row execute function public.update_updated_at_column();

-- 5. Rooms Table (Phòng trọ)
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  room_code text not null,
  area numeric(6, 2),
  base_price numeric(12, 0) not null default 0,
  status text not null default 'available' check (status in ('available', 'occupied', 'maintenance')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_property_room_code_key unique (property_id, room_code)
);

create index if not exists idx_rooms_org_id on public.rooms(org_id);
create index if not exists idx_rooms_property_id on public.rooms(property_id);

drop trigger if exists update_rooms_updated_at on public.rooms;
create trigger update_rooms_updated_at
  before update on public.rooms
  for each row execute function public.update_updated_at_column();

-- 6. Tenants Table (Khách thuê)
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  phone text not null,
  id_card_number text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tenants_org_id on public.tenants(org_id);

drop trigger if exists update_tenants_updated_at on public.tenants;
create trigger update_tenants_updated_at
  before update on public.tenants
  for each row execute function public.update_updated_at_column();

-- 7. Leases Table (Hợp đồng thuê)
create table if not exists public.leases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete restrict,
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  start_date date not null,
  end_date date,
  deposit numeric(12, 0) not null default 0,
  monthly_rent numeric(12, 0) not null default 0,
  contract_file_url text,
  status text not null default 'active' check (status in ('active', 'expired', 'terminated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leases_org_id on public.leases(org_id);
create index if not exists idx_leases_room_id on public.leases(room_id);
create index if not exists idx_leases_tenant_id on public.leases(tenant_id);

drop trigger if exists update_leases_updated_at on public.leases;
create trigger update_leases_updated_at
  before update on public.leases
  for each row execute function public.update_updated_at_column();

-- 8. Utility Readings Table (Chỉ số điện nước)
create table if not exists public.utility_readings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  period text not null, -- format: YYYY-MM
  electricity_old numeric(10, 2) not null default 0,
  electricity_new numeric(10, 2) not null default 0,
  water_old numeric(10, 2) not null default 0,
  water_new numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint utility_readings_room_period_key unique (room_id, period)
);

create index if not exists idx_utility_readings_org_id on public.utility_readings(org_id);
create index if not exists idx_utility_readings_room_id on public.utility_readings(room_id);

drop trigger if exists update_utility_readings_updated_at on public.utility_readings;
create trigger update_utility_readings_updated_at
  before update on public.utility_readings
  for each row execute function public.update_updated_at_column();

-- 9. Invoices Table (Hóa đơn)
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  lease_id uuid not null references public.leases(id) on delete restrict,
  period text not null, -- format: YYYY-MM
  rent_amount numeric(12, 0) not null default 0,
  electricity_amount numeric(12, 0) not null default 0,
  water_amount numeric(12, 0) not null default 0,
  other_fees numeric(12, 0) not null default 0,
  total_amount numeric(12, 0) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'paid', 'overdue', 'cancelled')),
  due_date date not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoices_org_id on public.invoices(org_id);
create index if not exists idx_invoices_lease_id on public.invoices(lease_id);

drop trigger if exists update_invoices_updated_at on public.invoices;
create trigger update_invoices_updated_at
  before update on public.invoices
  for each row execute function public.update_updated_at_column();

-- 10. Invoice Items Table (Chi tiết phụ phí)
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  label text not null,
  amount numeric(12, 0) not null default 0
);

create index if not exists idx_invoice_items_invoice_id on public.invoice_items(invoice_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.rooms enable row level security;
alter table public.tenants enable row level security;
alter table public.leases enable row level security;
alter table public.utility_readings enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

-- Organizations Policies
drop policy if exists "Users can view their organization" on public.organizations;
create policy "Users can view their organization"
  on public.organizations for select
  to authenticated
  using (id = (select public.get_auth_org_id()));

drop policy if exists "Users can update their organization" on public.organizations;
create policy "Users can update their organization"
  on public.organizations for update
  to authenticated
  using (id = (select public.get_auth_org_id()))
  with check (id = (select public.get_auth_org_id()));

-- Profiles Policies
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Properties Policies
drop policy if exists "Users can view properties of their org" on public.properties;
create policy "Users can view properties of their org"
  on public.properties for select
  to authenticated
  using (org_id = (select public.get_auth_org_id()));

drop policy if exists "Users can insert properties into their org" on public.properties;
create policy "Users can insert properties into their org"
  on public.properties for insert
  to authenticated
  with check (org_id = (select public.get_auth_org_id()));

drop policy if exists "Users can update properties in their org" on public.properties;
create policy "Users can update properties in their org"
  on public.properties for update
  to authenticated
  using (org_id = (select public.get_auth_org_id()))
  with check (org_id = (select public.get_auth_org_id()));

drop policy if exists "Users can delete properties in their org" on public.properties;
create policy "Users can delete properties in their org"
  on public.properties for delete
  to authenticated
  using (org_id = (select public.get_auth_org_id()));

-- Rooms Policies
drop policy if exists "Users can view rooms of their org" on public.rooms;
create policy "Users can view rooms of their org"
  on public.rooms for select
  to authenticated
  using (org_id = (select public.get_auth_org_id()));

drop policy if exists "Users can insert rooms into their org" on public.rooms;
create policy "Users can insert rooms into their org"
  on public.rooms for insert
  to authenticated
  with check (org_id = (select public.get_auth_org_id()));

drop policy if exists "Users can update rooms in their org" on public.rooms;
create policy "Users can update rooms in their org"
  on public.rooms for update
  to authenticated
  using (org_id = (select public.get_auth_org_id()))
  with check (org_id = (select public.get_auth_org_id()));

drop policy if exists "Users can delete rooms in their org" on public.rooms;
create policy "Users can delete rooms in their org"
  on public.rooms for delete
  to authenticated
  using (org_id = (select public.get_auth_org_id()));

-- Tenants Policies
drop policy if exists "Users can view tenants of their org" on public.tenants;
create policy "Users can view tenants of their org"
  on public.tenants for select
  to authenticated
  using (org_id = (select public.get_auth_org_id()));

drop policy if exists "Users can insert tenants into their org" on public.tenants;
create policy "Users can insert tenants into their org"
  on public.tenants for insert
  to authenticated
  with check (org_id = (select public.get_auth_org_id()));

drop policy if exists "Users can update tenants in their org" on public.tenants;
create policy "Users can update tenants in their org"
  on public.tenants for update
  to authenticated
  using (org_id = (select public.get_auth_org_id()))
  with check (org_id = (select public.get_auth_org_id()));

drop policy if exists "Users can delete tenants in their org" on public.tenants;
create policy "Users can delete tenants in their org"
  on public.tenants for delete
  to authenticated
  using (org_id = (select public.get_auth_org_id()));

-- Leases Policies
drop policy if exists "Users can view leases of their org" on public.leases;
create policy "Users can view leases of their org"
  on public.leases for select
  to authenticated
  using (org_id = (select public.get_auth_org_id()));

drop policy if exists "Users can insert leases into their org" on public.leases;
create policy "Users can insert leases into their org"
  on public.leases for insert
  to authenticated
  with check (org_id = (select public.get_auth_org_id()));

drop policy if exists "Users can update leases in their org" on public.leases;
create policy "Users can update leases in their org"
  on public.leases for update
  to authenticated
  using (org_id = (select public.get_auth_org_id()))
  with check (org_id = (select public.get_auth_org_id()));

drop policy if exists "Users can delete leases in their org" on public.leases;
create policy "Users can delete leases in their org"
  on public.leases for delete
  to authenticated
  using (org_id = (select public.get_auth_org_id()));

-- Utility Readings Policies
drop policy if exists "Users can view utility readings of their org" on public.utility_readings;
create policy "Users can view utility readings of their org"
  on public.utility_readings for select
  to authenticated
  using (org_id = (select public.get_auth_org_id()));

drop policy if exists "Users can insert utility readings into their org" on public.utility_readings;
create policy "Users can insert utility readings into their org"
  on public.utility_readings for insert
  to authenticated
  with check (org_id = (select public.get_auth_org_id()));

drop policy if exists "Users can update utility readings in their org" on public.utility_readings;
create policy "Users can update utility readings in their org"
  on public.utility_readings for update
  to authenticated
  using (org_id = (select public.get_auth_org_id()))
  with check (org_id = (select public.get_auth_org_id()));

drop policy if exists "Users can delete utility readings in their org" on public.utility_readings;
create policy "Users can delete utility readings in their org"
  on public.utility_readings for delete
  to authenticated
  using (org_id = (select public.get_auth_org_id()));

-- Invoices Policies
drop policy if exists "Users can view invoices of their org" on public.invoices;
create policy "Users can view invoices of their org"
  on public.invoices for select
  to authenticated
  using (org_id = (select public.get_auth_org_id()));

drop policy if exists "Users can insert invoices into their org" on public.invoices;
create policy "Users can insert invoices into their org"
  on public.invoices for insert
  to authenticated
  with check (org_id = (select public.get_auth_org_id()));

drop policy if exists "Users can update invoices in their org" on public.invoices;
create policy "Users can update invoices in their org"
  on public.invoices for update
  to authenticated
  using (org_id = (select public.get_auth_org_id()))
  with check (org_id = (select public.get_auth_org_id()));

drop policy if exists "Users can delete invoices in their org" on public.invoices;
create policy "Users can delete invoices in their org"
  on public.invoices for delete
  to authenticated
  using (org_id = (select public.get_auth_org_id()));

-- Invoice Items Policies
drop policy if exists "Users can view invoice items of their org" on public.invoice_items;
create policy "Users can view invoice items of their org"
  on public.invoice_items for select
  to authenticated
  using (
    exists (
      select 1 from public.invoices
      where invoices.id = invoice_items.invoice_id
        and invoices.org_id = (select public.get_auth_org_id())
    )
  );

drop policy if exists "Users can insert invoice items into their org" on public.invoice_items;
create policy "Users can insert invoice items into their org"
  on public.invoice_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.invoices
      where invoices.id = invoice_items.invoice_id
        and invoices.org_id = (select public.get_auth_org_id())
    )
  );

drop policy if exists "Users can update invoice items in their org" on public.invoice_items;
create policy "Users can update invoice items in their org"
  on public.invoice_items for update
  to authenticated
  using (
    exists (
      select 1 from public.invoices
      where invoices.id = invoice_items.invoice_id
        and invoices.org_id = (select public.get_auth_org_id())
    )
  )
  with check (
    exists (
      select 1 from public.invoices
      where invoices.id = invoice_items.invoice_id
        and invoices.org_id = (select public.get_auth_org_id())
    )
  );

drop policy if exists "Users can delete invoice items in their org" on public.invoice_items;
create policy "Users can delete invoice items in their org"
  on public.invoice_items for delete
  to authenticated
  using (
    exists (
      select 1 from public.invoices
      where invoices.id = invoice_items.invoice_id
        and invoices.org_id = (select public.get_auth_org_id())
    )
  );

-- ==============================================================================
-- AUTOMATIC SIGNUP TRIGGER
-- ==============================================================================

create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  new_org_id uuid;
  user_full_name text;
begin
  user_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  insert into public.organizations (name)
  values ('Nhà Trọ của ' || user_full_name)
  returning id into new_org_id;

  insert into public.profiles (id, org_id, full_name, role)
  values (new.id, new_org_id, user_full_name, 'owner');

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
