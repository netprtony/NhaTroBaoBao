-- Migration: 20260401000000_phase2_constraints.sql

-- 1. Đổi FK rooms.property_id: on delete cascade -> on delete restrict
ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_property_id_fkey;
ALTER TABLE public.rooms ADD CONSTRAINT rooms_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE RESTRICT;

-- 2. Thêm cột deleted_at (soft-delete)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 3. Cập nhật RLS SELECT policies để thêm điều kiện deleted_at is null
-- Properties
DROP POLICY IF EXISTS "Users can view properties of their org" ON public.properties;
CREATE POLICY "Users can view properties of their org" ON public.properties FOR SELECT TO authenticated
USING (org_id = (SELECT public.get_auth_org_id()) AND deleted_at IS NULL);

-- Rooms
DROP POLICY IF EXISTS "Users can view rooms of their org" ON public.rooms;
CREATE POLICY "Users can view rooms of their org" ON public.rooms FOR SELECT TO authenticated
USING (org_id = (SELECT public.get_auth_org_id()) AND deleted_at IS NULL);

-- Tenants
DROP POLICY IF EXISTS "Users can view tenants of their org" ON public.tenants;
CREATE POLICY "Users can view tenants of their org" ON public.tenants FOR SELECT TO authenticated
USING (org_id = (SELECT public.get_auth_org_id()) AND deleted_at IS NULL);

-- 4. Viết Postgres function can_delete_room, can_delete_tenant, can_delete_property
CREATE OR REPLACE FUNCTION public.can_delete_room(p_room_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_active_leases int;
  v_history_leases int;
  v_org_id uuid;
BEGIN
  SELECT org_id INTO v_org_id FROM rooms WHERE id = p_room_id;
  IF v_org_id IS NULL OR v_org_id != get_auth_org_id() THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Không tìm thấy phòng hoặc không có quyền.');
  END IF;

  SELECT count(*) INTO v_active_leases FROM leases WHERE room_id = p_room_id AND status = 'active';
  IF v_active_leases > 0 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Phòng đang có hợp đồng hoạt động.');
  END IF;

  SELECT count(*) INTO v_history_leases FROM leases WHERE room_id = p_room_id AND status != 'active';
  
  RETURN jsonb_build_object(
    'allowed', true,
    'reason', 'OK',
    'blocking_count', jsonb_build_object('active_leases', v_active_leases, 'history_leases', v_history_leases)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.can_delete_tenant(p_tenant_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_leases int;
  v_org_id uuid;
BEGIN
  SELECT org_id INTO v_org_id FROM tenants WHERE id = p_tenant_id;
  IF v_org_id IS NULL OR v_org_id != get_auth_org_id() THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Không tìm thấy khách thuê hoặc không có quyền.');
  END IF;

  SELECT count(*) INTO v_leases FROM leases WHERE tenant_id = p_tenant_id;
  IF v_leases > 0 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Khách thuê đã có hợp đồng, chỉ có thể vô hiệu hóa.');
  END IF;

  RETURN jsonb_build_object('allowed', true, 'reason', 'OK');
END;
$$;

CREATE OR REPLACE FUNCTION public.can_delete_property(p_property_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_rooms int;
  v_org_id uuid;
BEGIN
  SELECT org_id INTO v_org_id FROM properties WHERE id = p_property_id;
  IF v_org_id IS NULL OR v_org_id != get_auth_org_id() THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Không tìm thấy khu trọ hoặc không có quyền.');
  END IF;

  SELECT count(*) INTO v_rooms FROM rooms WHERE property_id = p_property_id AND deleted_at IS NULL;
  IF v_rooms > 0 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Khu trọ đang có phòng, vui lòng xóa hết phòng trước.');
  END IF;

  RETURN jsonb_build_object('allowed', true, 'reason', 'OK', 'blocking_count', jsonb_build_object('rooms', v_rooms));
END;
$$;

-- 5. Thêm constraint check cho leases: end_date is null or end_date >= start_date
ALTER TABLE public.leases DROP CONSTRAINT IF EXISTS leases_date_check;
ALTER TABLE public.leases ADD CONSTRAINT leases_date_check CHECK (end_date IS NULL OR end_date >= start_date);

-- 6. Thêm unique partial index: one_active_lease_per_room
DROP INDEX IF EXISTS one_active_lease_per_room;
CREATE UNIQUE INDEX one_active_lease_per_room ON public.leases(room_id) WHERE status = 'active';

-- 7. Trigger sync_room_status()
CREATE OR REPLACE FUNCTION public.sync_room_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Khi thêm mới hoặc cập nhật lease thành active
  IF (TG_OP = 'INSERT' AND NEW.status = 'active') OR (TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status != 'active') THEN
    UPDATE public.rooms SET status = 'occupied' WHERE id = NEW.room_id;
  END IF;
  
  -- Khi lease từ active chuyển sang expired/terminated
  IF (TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active') THEN
    IF NOT EXISTS (SELECT 1 FROM public.leases WHERE room_id = NEW.room_id AND status = 'active' AND id != NEW.id) THEN
      UPDATE public.rooms SET status = 'available' WHERE id = NEW.room_id;
    END IF;
  END IF;

  -- Khi xóa lease active
  IF (TG_OP = 'DELETE' AND OLD.status = 'active') THEN
    IF NOT EXISTS (SELECT 1 FROM public.leases WHERE room_id = OLD.room_id AND status = 'active' AND id != OLD.id) THEN
      UPDATE public.rooms SET status = 'available' WHERE id = OLD.room_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_lease_status_change ON public.leases;
CREATE TRIGGER on_lease_status_change
  AFTER INSERT OR UPDATE OR DELETE ON public.leases
  FOR EACH ROW EXECUTE FUNCTION public.sync_room_status();
