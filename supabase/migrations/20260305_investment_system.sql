-- Add investment type to transaction_type enum
-- Using DO block because ADD VALUE cannot be executed in a transaction block alongside other commands easily in some versions, but here it's fine.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'transaction_type' AND e.enumlabel = 'investment') THEN
        ALTER TYPE public.transaction_type ADD VALUE 'investment';
    END IF;
END $$;

-- Update investment_plans to support package-level start/end times
ALTER TABLE public.investment_plans ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE public.investment_plans ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- Table for active user investments
CREATE TABLE IF NOT EXISTS public.active_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.investment_plans(id) ON DELETE SET NULL,
    plan_name TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    daily_profit NUMERIC(5, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    expected_total_profit NUMERIC(15, 2) NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for active_investments
ALTER TABLE public.active_investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "active_investments_owner_select" ON public.active_investments;
CREATE POLICY "active_investments_owner_select" ON public.active_investments 
FOR SELECT TO authenticated 
USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "active_investments_owner_insert" ON public.active_investments;
CREATE POLICY "active_investments_owner_insert" ON public.active_investments 
FOR INSERT TO authenticated 
WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "active_investments_admin_all" ON public.active_investments;
CREATE POLICY "active_investments_admin_all" ON public.active_investments 
FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_active_investments_updated_at ON public.active_investments;
CREATE TRIGGER update_active_investments_updated_at
    BEFORE UPDATE ON public.active_investments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
