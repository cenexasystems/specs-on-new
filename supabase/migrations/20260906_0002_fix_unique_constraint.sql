-- Fix 1: Drop the old unique constraint that doesn't include lens_type
DROP INDEX IF EXISTS products_category_name_unique;

-- Fix 2: Recreate it to include lens_type so Pro(SV) != Pro(Progressive) != Pro(Bifocal)
CREATE UNIQUE INDEX IF NOT EXISTS products_category_name_lenstype_unique
  ON public.products (category_id, LOWER(BTRIM(name)), COALESCE(lens_type, ''));
