-- ============================================================
-- THE EMERALD TRADE HUB: SEPARATED PROFILES & ROLES SCHEMA
-- ============================================================

-- 1. CLEANUP: DROP EVERYTHING
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

DROP TABLE IF EXISTS public.complaint_messages CASCADE;
DROP TABLE IF EXISTS public.complaints CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.investment_plans CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE; -- Old enum
DROP TYPE IF EXISTS public.kyc_status CASCADE;
DROP TYPE IF EXISTS public.transaction_type CASCADE;
DROP TYPE IF EXISTS public.transaction_status CASCADE;
DROP TYPE IF EXISTS public.complaint_status CASCADE;

-- 2. ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.kyc_status AS ENUM ('none', 'pending', 'approved', 'rejected');
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.complaint_status AS ENUM ('open', 'resolved');

-- 3. TABLES

-- PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  balance NUMERIC(15, 2) DEFAULT 0,
  investment NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  kyc_status kyc_status DEFAULT 'none',
  is_suspended BOOLEAN DEFAULT false,
  home_address TEXT,
  country TEXT,
  phone_number TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  kyc_document_url TEXT,
  kyc_rejection_reason TEXT,
  show_kyc_notification BOOLEAN DEFAULT true,
  profit NUMERIC(15, 2) DEFAULT 0,
  withdrawal_step INTEGER DEFAULT 1,
  withdrawal_card_status TEXT DEFAULT 'none',
  withdrawal_activation_status TEXT DEFAULT 'none',
  withdrawal_code_status TEXT DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  status transaction_status DEFAULT 'pending',
  receipt_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMPLAINTS
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status complaint_status DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMPLAINT MESSAGES
CREATE TABLE public.complaint_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  sender_id UUID,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVESTMENT PLANS
CREATE TABLE public.investment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_amount NUMERIC(15, 2) NOT NULL,
  max_amount NUMERIC(15, 2) NOT NULL,
  daily_profit NUMERIC(5, 2) NOT NULL,
  duration INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PLATFORM SETTINGS
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.platform_settings (key, value)
VALUES 
  ('withdrawal_methods', '["Bank Transfer", "Crypto (USDT)", "PayPal"]'::jsonb),
  ('withdrawal_card_payment', '{"amount": 50, "account_details": "Admin Bank: Chase, Account: 12345678"}'::jsonb),
  ('withdrawal_activation_payment', '{"amount": 30, "account_details": "Activation Key Dept: 87654321"}'::jsonb),
  ('withdrawal_card_code_payment', '{"amount": 20, "account_details": "Card Code Dept: 11223344"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. RLS ENABLING
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;

-- 5. RLS HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 6. POLICIES

-- PROFILES
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- USER_ROLES
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- TRANSACTIONS
CREATE POLICY "transactions_owner" ON public.transactions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.transactions.user_id AND p.user_id = auth.uid()));
CREATE POLICY "transactions_admin" ON public.transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- COMPLAINTS
CREATE POLICY "complaints_owner" ON public.complaints FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.complaints.user_id AND p.user_id = auth.uid()));
CREATE POLICY "complaints_admin" ON public.complaints FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PLATFORM SETTINGS
CREATE POLICY "platform_settings_select" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "platform_settings_admin_all" ON public.platform_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- COMPLAINT_MESSAGES
CREATE POLICY "messages_select" ON public.complaint_messages FOR SELECT TO authenticated 
USING (
  public.has_role(auth.uid(), 'admin')
  OR auth.uid() = sender_id
  OR EXISTS (
    SELECT 1 FROM public.complaints c
    JOIN public.profiles p ON p.id = c.user_id
    WHERE c.id = public.complaint_messages.complaint_id
      AND p.user_id = auth.uid()
  )
);
CREATE POLICY "messages_insert" ON public.complaint_messages FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = sender_id OR public.has_role(auth.uid(), 'admin'));

-- INVESTMENT_PLANS
CREATE POLICY "plans_select" ON public.investment_plans FOR SELECT USING (true);
CREATE POLICY "plans_admin" ON public.investment_plans FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 7. FUNCTIONS & TRIGGERS

-- Auto-create profile & default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture')
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
