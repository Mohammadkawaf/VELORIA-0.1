-- =========================================================================
-- VELORIA - SQL MIGRATION: UPDATE ORDER_STATUS ENUM SAFELY
-- This script upgrades the live Supabase order_status ENUM to include
-- the new statuses for the updated order cycle ('accepted', 'rejected', 'delivered')
-- while keeping the old statuses ('contacted', 'processing', 'ready')
-- to ensure 100% backward compatibility with no data loss!
-- =========================================================================

-- Note: ALTER TYPE ... ADD VALUE cannot run inside a transaction/do-block in PostgreSQL,
-- so these are executed as top-level individual queries.

-- Safely add 'accepted' status if missing
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'accepted';

-- Safely add 'rejected' status if missing
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'rejected';

-- Safely add 'delivered' status if missing
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'delivered';

-- Output success message
select 'Order status ENUM updated successfully! All legacy and new statuses are fully supported.' as migration_result;
