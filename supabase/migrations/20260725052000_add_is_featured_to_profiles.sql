-- ====================================================================
-- MIGRATION: ADD IS_FEATURED TO PROFILES TABLE FOR SUGGESTED STORES
-- TIMESTAMP: 20260725052000
-- ====================================================================

-- 1. Add is_featured column to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
