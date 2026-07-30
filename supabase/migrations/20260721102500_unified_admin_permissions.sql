-- ====================================================================
-- SYSTEM MIGRATION: UNIFIED ADMINISTRATIVE PERMISSIONS & POLICIES
-- TIMESTAMP: 20260721102500
-- ====================================================================

-- 1. Create a security-definer helper function to securely check if a user is an admin
-- Using SECURITY DEFINER avoids recursive loops when querying public.profiles in RLS policies.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- 2. Grant appropriate PostgreSQL DML privileges to 'authenticated' and 'service_role' roles
-- This ensures that table-level privileges do not block standard actions, and RLS acts as the single source of truth.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant USAGE and SELECT on all sequences to ensure ID auto-incrementing works perfectly
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 3. Configure Default Privileges for ALL future tables and sequences
-- This ensures any future features or tables automatically inherit correct PostgreSQL permissions.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO service_role;

-- 4. Re-usable utility function to secure purely administrative tables
-- Enables RLS, configures grants, and creates strict admin-only write policies.
CREATE OR REPLACE FUNCTION public.secure_admin_table(target_table text, allow_public_read boolean DEFAULT true)
RETURNS void SECURITY DEFINER AS $$
BEGIN
  -- Enable Row Level Security (RLS)
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', target_table);

  -- Ensure table privileges are granted
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', target_table);
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO service_role;', target_table);

  -- Drop existing policies to prevent conflicts
  EXECUTE format('DROP POLICY IF EXISTS "Admin Allow All on %1$s" ON public.%1$I;', target_table);
  EXECUTE format('DROP POLICY IF EXISTS "Public Read on %1$s" ON public.%1$I;', target_table);
  EXECUTE format('DROP POLICY IF EXISTS "Admin Insert on %1$s" ON public.%1$I;', target_table);
  EXECUTE format('DROP POLICY IF EXISTS "Admin Update on %1$s" ON public.%1$I;', target_table);
  EXECUTE format('DROP POLICY IF EXISTS "Admin Delete on %1$s" ON public.%1$I;', target_table);

  -- Create public or admin-only SELECT policy
  IF allow_public_read THEN
    EXECUTE format('
      CREATE POLICY "Public Read on %1$s" ON public.%1$I
      FOR SELECT USING (true);
    ', target_table);
  ELSE
    EXECUTE format('
      CREATE POLICY "Public Read on %1$s" ON public.%1$I
      FOR SELECT USING (public.is_admin());
    ', target_table);
  END IF;

  -- Create strict admin-only write policies (INSERT, UPDATE, DELETE)
  EXECUTE format('
    CREATE POLICY "Admin Insert on %1$s" ON public.%1$I
    FOR INSERT WITH CHECK (public.is_admin());
  ', target_table);

  EXECUTE format('
    CREATE POLICY "Admin Update on %1$s" ON public.%1$I
    FOR UPDATE USING (public.is_admin());
  ', target_table);

  EXECUTE format('
    CREATE POLICY "Admin Delete on %1$s" ON public.%1$I
    FOR DELETE USING (public.is_admin());
  ', target_table);

END;
$$ LANGUAGE plpgsql;

-- 5. Secure Existing Purely Administrative Tables
-- Apply the unified administrative table policy to 'categories'
SELECT public.secure_admin_table('categories', true);

-- 6. Add Administrative Override Policies to Core User-Interactive Tables
-- This guarantees admins have full access to view, update, or delete records on all existing tables
-- without modifying or breaking any of the current policies for standard users.

-- Table: profiles
DROP POLICY IF EXISTS "Admin all actions on profiles" ON public.profiles;
CREATE POLICY "Admin all actions on profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Table: products
DROP POLICY IF EXISTS "Admin all actions on products" ON public.products;
CREATE POLICY "Admin all actions on products" ON public.products FOR ALL USING (public.is_admin());

-- Table: product_images
DROP POLICY IF EXISTS "Admin all actions on product_images" ON public.product_images;
CREATE POLICY "Admin all actions on product_images" ON public.product_images FOR ALL USING (public.is_admin());

-- Table: favorites
DROP POLICY IF EXISTS "Admin all actions on favorites" ON public.favorites;
CREATE POLICY "Admin all actions on favorites" ON public.favorites FOR ALL USING (public.is_admin());

-- Table: notifications
DROP POLICY IF EXISTS "Admin all actions on notifications" ON public.notifications;
CREATE POLICY "Admin all actions on notifications" ON public.notifications FOR ALL USING (public.is_admin());

-- Table: orders
DROP POLICY IF EXISTS "Admin all actions on orders" ON public.orders;
CREATE POLICY "Admin all actions on orders" ON public.orders FOR ALL USING (public.is_admin());

-- Table: reports
DROP POLICY IF EXISTS "Admin all actions on reports" ON public.reports;
CREATE POLICY "Admin all actions on reports" ON public.reports FOR ALL USING (public.is_admin());

-- Table: product_ratings
DROP POLICY IF EXISTS "Admin all actions on product_ratings" ON public.product_ratings;
CREATE POLICY "Admin all actions on product_ratings" ON public.product_ratings FOR ALL USING (public.is_admin());

-- Table: user_agreements
DROP POLICY IF EXISTS "Admin all actions on user_agreements" ON public.user_agreements;
CREATE POLICY "Admin all actions on user_agreements" ON public.user_agreements FOR ALL USING (public.is_admin());

-- Table: contributions
DROP POLICY IF EXISTS "Admin all actions on contributions" ON public.contributions;
CREATE POLICY "Admin all actions on contributions" ON public.contributions FOR ALL USING (public.is_admin());
