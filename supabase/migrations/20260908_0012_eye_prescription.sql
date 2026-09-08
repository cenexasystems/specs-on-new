-- Store optional structured eye prescription details captured in POS billing.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS eye_prescription JSONB NOT NULL DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';
