-- Migration: 20260403000000_phase2c_utility_readings.sql

-- Unique index trên (room_id, period) để hỗ trợ UPSERT chỉ số điện nước theo phòng và kỳ
CREATE UNIQUE INDEX IF NOT EXISTS idx_utility_readings_room_period ON public.utility_readings(room_id, period);
