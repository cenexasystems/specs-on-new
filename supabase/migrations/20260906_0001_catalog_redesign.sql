-- 1. Drop inventory logs and triggers
DROP TRIGGER IF EXISTS trigger_order_inventory_deduction ON public.orders;
DROP TRIGGER IF EXISTS trigger_advance_order_inventory_deduction ON public.advance_orders;
DROP FUNCTION IF EXISTS public.handle_order_inventory_deduction();
DROP FUNCTION IF EXISTS public.handle_advance_order_inventory_deduction();
DROP TABLE IF EXISTS public.inventory_logs;

-- 2. Modify Categories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS is_manual_entry BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Modify Products
-- Remove stock-related columns
ALTER TABLE public.products 
DROP COLUMN IF EXISTS stock_quantity,
DROP COLUMN IF EXISTS opening_stock,
DROP COLUMN IF EXISTS stock,
DROP COLUMN IF EXISTS stock_unit,
DROP COLUMN IF EXISTS low_stock_alert;

-- Add catalog pricing flexibility
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_price_editable BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lens_type TEXT;

-- Also remove stock from variants if it exists
ALTER TABLE public.product_variants
DROP COLUMN IF EXISTS stock;

-- 4. Create lens_addons table
CREATE TABLE IF NOT EXISTS public.lens_addons (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lens_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for all authenticated users" ON public.lens_addons FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable read access for all anon users" ON public.lens_addons FOR SELECT TO anon USING (true);

-- 5. Seed the new categories
DELETE FROM public.products;
DELETE FROM public.categories;

INSERT INTO public.categories (id, name_en, name_ta, is_manual_entry, sort_order) VALUES
(1, 'Frames', 'பிரேம்கள்', FALSE, 1),
(2, 'Sunglasses', 'குளிர்கண்ணாடிகள்', FALSE, 2),
(3, 'Lenses -> Non-Branded', 'லென்ஸ்கள்', FALSE, 3),
(4, 'Lenses -> Branded', 'பிராண்டட் லென்ஸ்கள்', TRUE, 4),
(5, 'Contact Lenses', 'காண்டாக்ட் லென்ஸ்கள்', TRUE, 5),
(6, 'Reading Glasses', 'படிக்க பயன்படுத்தும் கண்ணாடிகள்', TRUE, 6),
(7, 'Solution', 'திரவங்கள்', TRUE, 7)
ON CONFLICT (name_en) DO UPDATE SET is_manual_entry = EXCLUDED.is_manual_entry, sort_order = EXCLUDED.sort_order;

SELECT setval('public.categories_id_seq', 7, true);

-- 6. Seed the predefined catalog items
-- Frames
INSERT INTO public.products (name, category_id, price, is_price_editable, is_active) VALUES
('Lite', 1, 900.00, FALSE, TRUE),
('Pro', 1, 1800.00, FALSE, TRUE),
('Pro Max', 1, 2700.00, FALSE, TRUE),
('Trendz', 1, 2300.00, FALSE, TRUE),
('Junior', 1, 900.00, FALSE, TRUE),
('Premium', 1, 0.00, TRUE, TRUE);

-- Lenses -> Non-Branded (Type: Single Vision)
INSERT INTO public.products (name, category_id, lens_type, price, is_price_editable) VALUES
('Lite (Free)', 3, 'Single Vision', 0.00, FALSE),
('Pro', 3, 'Single Vision', 500.00, FALSE),
('Pro Plus', 3, 'Single Vision', 1100.00, FALSE),
('Pro Max', 3, 'Single Vision', 2100.00, FALSE),
('Pro Thin', 3, 'Single Vision', 3200.00, FALSE),
('Pro Ultra Thin', 3, 'Single Vision', 4300.00, FALSE);

-- Lenses -> Non-Branded (Type: Progressive)
INSERT INTO public.products (name, category_id, lens_type, price, is_price_editable) VALUES
('Lite', 3, 'Progressive', 1000.00, FALSE),
('Pro', 3, 'Progressive', 1800.00, FALSE),
('Pro Blu', 3, 'Progressive', 2800.00, FALSE),
('Pro Max', 3, 'Progressive', 5800.00, FALSE),
('Pro Thin', 3, 'Progressive', 8000.00, FALSE),
('Pro Ultra Thin', 3, 'Progressive', 12000.00, FALSE);

-- Lenses -> Non-Branded (Type: Bifocal)
INSERT INTO public.products (name, category_id, lens_type, price, is_price_editable) VALUES
('Lite', 3, 'Bifocal', 500.00, FALSE),
('Lite+', 3, 'Bifocal', 1200.00, FALSE),
('Pro', 3, 'Bifocal', 2100.00, FALSE),
('Pro Max', 3, 'Bifocal', 3600.00, FALSE),
('Pro Thin', 3, 'Bifocal', 5500.00, FALSE),
('Pro Ultra Thin', 3, 'Bifocal', 7200.00, FALSE);
