-- ====================================================================
-- MIGRATION: FIX PERMISSIONS & RLS POLICIES FOR FOLLOWERS TABLE
-- TIMESTAMP: 20260724081000
-- ====================================================================

-- 1. Ensure table followers exists
CREATE TABLE IF NOT EXISTS public.followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id <> following_id)
);

-- Enable Row Level Security (RLS) on followers table
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- 2. Grant full permissions (SELECT, INSERT, UPDATE, DELETE) to authenticated and service_role roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.followers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.followers TO service_role;
GRANT SELECT ON public.followers TO anon;

-- 3. Drop existing RLS policies on followers table to prevent conflicts
DROP POLICY IF EXISTS "Allow public read access to follows" ON public.followers;
DROP POLICY IF EXISTS "Allow followers to manage follows" ON public.followers;
DROP POLICY IF EXISTS "Allow public read access on followers" ON public.followers;
DROP POLICY IF EXISTS "Allow users to view followers" ON public.followers;
DROP POLICY IF EXISTS "Allow users to insert followers" ON public.followers;
DROP POLICY IF EXISTS "Allow users to delete followers" ON public.followers;
DROP POLICY IF EXISTS "Allow users to update followers" ON public.followers;
DROP POLICY IF EXISTS "Admin all actions on followers" ON public.followers;

-- 4. Create RLS Policies for followers table

-- A. SELECT: Allow public and authenticated users to read follow relationships
CREATE POLICY "Allow public read access on followers" 
  ON public.followers FOR SELECT 
  USING (true);

-- B. INSERT: Allow authenticated user to follow (insert where follower_id matches auth.uid() or admin)
CREATE POLICY "Allow users to insert followers" 
  ON public.followers FOR INSERT 
  WITH CHECK (
    auth.uid() = follower_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- C. DELETE: Allow authenticated user to unfollow (delete where follower_id matches auth.uid() or admin)
CREATE POLICY "Allow users to delete followers" 
  ON public.followers FOR DELETE 
  USING (
    auth.uid() = follower_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- D. UPDATE: Allow user to update their own follow record or admin
CREATE POLICY "Allow users to update followers" 
  ON public.followers FOR UPDATE 
  USING (
    auth.uid() = follower_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- E. ADMIN OVERRIDE: Full control for admin users
CREATE POLICY "Admin all actions on followers" 
  ON public.followers FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
