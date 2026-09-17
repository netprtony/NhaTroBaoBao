-- Migration: 20260402000000_phase2b_tenant_portal.sql

-- 1. Thêm cột auth_user_id và portal_enabled vào bảng tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_auth_user_id ON public.tenants(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- 2. Helper function get_auth_tenant_id()
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.tenants WHERE auth_user_id = (SELECT auth.uid()) AND deleted_at IS NULL LIMIT 1;
$$;

-- 3. RLS Policies cho Tenant Portal Access
-- Tenants
DROP POLICY IF EXISTS "Tenants can view own tenant record" ON public.tenants;
CREATE POLICY "Tenants can view own tenant record" ON public.tenants
  FOR SELECT TO authenticated
  USING (auth_user_id = (SELECT auth.uid()) AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Tenants can update own tenant record" ON public.tenants;
CREATE POLICY "Tenants can update own tenant record" ON public.tenants
  FOR UPDATE TO authenticated
  USING (auth_user_id = (SELECT auth.uid()))
  WITH CHECK (auth_user_id = (SELECT auth.uid()));

-- Leases
DROP POLICY IF EXISTS "Tenants can view own leases" ON public.leases;
CREATE POLICY "Tenants can view own leases" ON public.leases
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()));

-- Invoices
DROP POLICY IF EXISTS "Tenants can view own invoices" ON public.invoices;
CREATE POLICY "Tenants can view own invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (lease_id IN (
    SELECT id FROM public.leases WHERE tenant_id = (SELECT public.get_auth_tenant_id())
  ));

-- Invoice Items
DROP POLICY IF EXISTS "Tenants can view own invoice items" ON public.invoice_items;
CREATE POLICY "Tenants can view own invoice items" ON public.invoice_items
  FOR SELECT TO authenticated
  USING (invoice_id IN (
    SELECT i.id FROM public.invoices i
    JOIN public.leases l ON i.lease_id = l.id
    WHERE l.tenant_id = (SELECT public.get_auth_tenant_id())
  ));

-- Utility Readings
DROP POLICY IF EXISTS "Tenants can view own utility readings" ON public.utility_readings;
CREATE POLICY "Tenants can view own utility readings" ON public.utility_readings
  FOR SELECT TO authenticated
  USING (room_id IN (
    SELECT room_id FROM public.leases WHERE tenant_id = (SELECT public.get_auth_tenant_id())
  ));

-- Rooms
DROP POLICY IF EXISTS "Tenants can view own rented rooms" ON public.rooms;
CREATE POLICY "Tenants can view own rented rooms" ON public.rooms
  FOR SELECT TO authenticated
  USING (id IN (
    SELECT room_id FROM public.leases WHERE tenant_id = (SELECT public.get_auth_tenant_id())
  ));

-- Properties
DROP POLICY IF EXISTS "Tenants can view own property details" ON public.properties;
CREATE POLICY "Tenants can view own property details" ON public.properties
  FOR SELECT TO authenticated
  USING (id IN (
    SELECT property_id FROM public.rooms WHERE id IN (
      SELECT room_id FROM public.leases WHERE tenant_id = (SELECT public.get_auth_tenant_id())
    )
  ));

-- Organizations
DROP POLICY IF EXISTS "Tenants can view own organization details" ON public.organizations;
CREATE POLICY "Tenants can view own organization details" ON public.organizations
  FOR SELECT TO authenticated
  USING (id IN (
    SELECT org_id FROM public.tenants WHERE auth_user_id = (SELECT auth.uid())
  ));

-- 4. Cập nhật trigger handle_new_user bỏ qua vai trò tenant
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_org_id uuid;
  user_full_name text;
BEGIN
  IF (new.raw_user_meta_data->>'role') = 'tenant' THEN
    RETURN new;
  END IF;

  user_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  INSERT INTO public.organizations (name)
  VALUES ('Nhà Trọ của ' || user_full_name)
  RETURNING id INTO new_org_id;

  INSERT INTO public.profiles (id, org_id, full_name, role)
  VALUES (new.id, new_org_id, user_full_name, 'owner');

  RETURN new;
END;
$$;

