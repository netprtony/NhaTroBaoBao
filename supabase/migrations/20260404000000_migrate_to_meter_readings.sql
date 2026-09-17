-- Migration: 20260404000000_migrate_to_meter_readings.sql

-- 1. Index unique trên (room_id, period, type) cho bảng meter_readings
CREATE UNIQUE INDEX IF NOT EXISTS idx_meter_readings_room_period_type ON public.meter_readings(room_id, period, type);

-- 2. RLS Policy cho Tenant xem chỉ số điện nước của chính mình trên meter_readings
DROP POLICY IF EXISTS "Tenants can view own meter readings" ON public.meter_readings;
CREATE POLICY "Tenants can view own meter readings" ON public.meter_readings
  FOR SELECT TO authenticated
  USING (room_id IN (
    SELECT room_id FROM public.leases WHERE tenant_id = (SELECT public.get_auth_tenant_id())
  ));

-- 3. Loại bỏ bảng utility_readings không dùng nữa
DROP TABLE IF EXISTS public.utility_readings CASCADE;
