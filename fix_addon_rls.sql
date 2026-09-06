ALTER TABLE public.lens_addons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated" ON public.lens_addons;
DROP POLICY IF EXISTS "Enable read for anon" ON public.lens_addons;
DROP POLICY IF EXISTS "Enable all access for anon" ON public.lens_addons;
CREATE POLICY "Enable all access for anon" ON public.lens_addons FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for public" ON public.lens_addons FOR ALL TO public USING (true) WITH CHECK (true);
