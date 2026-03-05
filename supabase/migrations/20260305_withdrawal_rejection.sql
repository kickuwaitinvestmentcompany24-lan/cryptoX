-- ============================================================
-- ADD REJECTION REASON TO TRANSACTIONS TABLE
-- ============================================================

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN public.transactions.rejection_reason IS 'The reason provided by the admin when rejecting a transaction.';
