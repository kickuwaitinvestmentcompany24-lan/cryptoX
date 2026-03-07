-- ============================================================
-- ADMIN ENHANCEMENTS: DYNAMIC CURRENCIES & IMPERSONATION LOGS
-- ============================================================

-- 1. CURRENCIES TABLE
CREATE TABLE IF NOT EXISTS public.currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  symbol TEXT NOT NULL,
  exchange_rate NUMERIC(15, 6) NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. IMPERSONATION LOGS TABLE
CREATE TABLE IF NOT EXISTS public.impersonation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- 3. RLS ENABLING
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impersonation_logs ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES
DROP POLICY IF EXISTS "currencies_select" ON public.currencies;
CREATE POLICY "currencies_select" ON public.currencies FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "currencies_admin_all" ON public.currencies;
CREATE POLICY "currencies_admin_all" ON public.currencies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "impersonation_logs_admin_all" ON public.impersonation_logs;
CREATE POLICY "impersonation_logs_admin_all" ON public.impersonation_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. INITIAL DATA
INSERT INTO public.currencies (name, code, symbol, exchange_rate)
VALUES 
  ('US Dollar', 'USD', '$', 1.0),
  ('Euro', 'EUR', '€', 0.92),
  ('British Pound', 'GBP', '£', 0.79),
  ('Bitcoin', 'BTC', '₿', 0.000015)
ON CONFLICT (code) DO NOTHING;
