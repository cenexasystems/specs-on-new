-- Store optional structured eye prescription details captured in POS billing.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS eye_prescription JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Recreate the public invoice RPC after the orders row type changes so the
-- returned record includes eye_prescription on hosted projects.
CREATE OR REPLACE FUNCTION public.get_public_invoice_by_number(p_invoice_no TEXT)
RETURNS SETOF public.orders
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT * FROM public.orders WHERE invoice_no = NULLIF(BTRIM(p_invoice_no), '') LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_invoice_by_number(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_invoice_by_number(TEXT) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
