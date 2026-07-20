-- Migration to add multi-currency, location (province, city), sale type, and price fields to the products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS currency text DEFAULT 'ل.س';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS province text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_type text DEFAULT 'retail' CHECK (sale_type IN ('retail', 'wholesale', 'both'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS retail_price numeric(12,2) CHECK (retail_price >= 0);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS wholesale_price numeric(12,2) CHECK (wholesale_price >= 0);
