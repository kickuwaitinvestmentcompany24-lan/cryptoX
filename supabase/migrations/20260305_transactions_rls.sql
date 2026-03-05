-- ============================================================
-- TRANSACTIONS RLS REFINEMENT
-- ============================================================

-- 1. Cleanup existing policies
DROP POLICY IF EXISTS "transactions_owner" ON public.transactions;
DROP POLICY IF EXISTS "transactions_admin" ON public.transactions;
DROP POLICY IF EXISTS "transactions_owner_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_owner_insert" ON public.transactions;
DROP POLICY IF EXISTS "transactions_admin_all" ON public.transactions;

-- 2. Owner Select: Users can view their own transactions
CREATE POLICY "transactions_owner_select" 
ON public.transactions
FOR SELECT TO authenticated
USING (
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- 3. Owner Insert: Users can create their own transactions
CREATE POLICY "transactions_owner_insert" 
ON public.transactions
FOR INSERT TO authenticated
WITH CHECK (
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- 4. Admin All: Admins can manage all transactions
CREATE POLICY "transactions_admin_all" 
ON public.transactions
FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin')
);
