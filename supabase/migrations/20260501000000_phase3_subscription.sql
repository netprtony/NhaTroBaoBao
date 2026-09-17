-- Migration: 20260501000000_phase3_subscription.sql

-- 1. Chuẩn hóa & nâng cấp bảng public.organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_started_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS plan_status text NOT NULL DEFAULT 'active';

-- Xóa constraint cũ của plan (nếu có) và thêm constraint mới
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;
ALTER TABLE public.organizations ADD CONSTRAINT organizations_plan_check CHECK (plan IN ('free', 'basic', 'vip'));

ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_plan_status_check;
ALTER TABLE public.organizations ADD CONSTRAINT organizations_plan_status_check CHECK (plan_status IN ('active', 'past_due', 'canceled', 'trialing'));

-- 2. Tạo bảng subscription_payments
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('basic', 'vip')),
  amount integer NOT NULL,
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  payment_method text NOT NULL CHECK (payment_method IN ('vnpay', 'momo', 'bank_transfer', 'stripe')),
  payment_gateway_txn_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Tạo bảng plan_limits
CREATE TABLE IF NOT EXISTS public.plan_limits (
  plan text PRIMARY KEY CHECK (plan IN ('free', 'basic', 'vip')),
  max_properties integer, -- null = không giới hạn
  max_rooms integer, -- null = không giới hạn
  max_staff integer, -- null = không giới hạn
  tenant_portal_enabled boolean NOT NULL DEFAULT false,
  sms_notification_enabled boolean NOT NULL DEFAULT false
);

-- Thêm dữ liệu mặc định cho các gói
INSERT INTO public.plan_limits (plan, max_properties, max_rooms, max_staff, tenant_portal_enabled, sms_notification_enabled)
VALUES
  ('free', 1, 5, 0, false, false),
  ('basic', 3, 30, 1, true, false),
  ('vip', null, null, null, true, true)
ON CONFLICT (plan) DO UPDATE SET
  max_properties = EXCLUDED.max_properties,
  max_rooms = EXCLUDED.max_rooms,
  max_staff = EXCLUDED.max_staff,
  tenant_portal_enabled = EXCLUDED.tenant_portal_enabled,
  sms_notification_enabled = EXCLUDED.sms_notification_enabled;

-- 4. Phân quyền RLS
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Policy cho plan_limits: Mọi authenticated user đều có thể xem
DROP POLICY IF EXISTS "Anyone authenticated can view plan_limits" ON public.plan_limits;
CREATE POLICY "Anyone authenticated can view plan_limits"
  ON public.plan_limits FOR SELECT
  TO authenticated
  USING (true);

-- Policy cho subscription_payments: Owner org & platform admins có thể xem
DROP POLICY IF EXISTS "Users can view own org subscription payments" ON public.subscription_payments;
CREATE POLICY "Users can view own org subscription payments"
  ON public.subscription_payments FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
    OR public.is_platform_admin()
  );
