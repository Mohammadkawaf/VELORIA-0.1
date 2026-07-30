-- Migration to add is_active column to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;
