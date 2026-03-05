-- ============================================================
-- PERSIST WITHDRAWAL STATE IN PROFILES
-- ============================================================

-- Add columns to store the current withdrawal attempt details
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_withdrawal_amount NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS last_withdrawal_method TEXT;

-- Update the comments for clarity
COMMENT ON COLUMN public.profiles.last_withdrawal_amount IS 'The amount the user intended to withdraw during their current session, persisted across modal opens.';
COMMENT ON COLUMN public.profiles.last_withdrawal_method IS 'The withdrawal method selected by the user, persisted across modal opens.';
