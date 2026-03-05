-- ============================================================
-- STORAGE BUCKETS INITIALIZATION (REFINED)
-- ============================================================

-- 1. Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Cleanup existing policies
DROP POLICY IF EXISTS "Public profiles view" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own profiles" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profiles" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all receipts" ON storage.objects;

-- 3. PROFILES BUCKET POLICIES (Publicly readable, User-specific write)
CREATE POLICY "Public profiles view"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

CREATE POLICY "Users can upload own profiles"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profiles' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own profiles"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profiles' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. RECEIPTS BUCKET POLICIES (Private, User-specific write, Admin readable)
CREATE POLICY "Users can upload own receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'receipts' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'receipts' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can view all receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'receipts' 
    AND (
        SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
    ) = 'admin'
);
