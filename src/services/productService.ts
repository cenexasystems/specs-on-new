import { supabase } from '../lib/supabase'

/**
 * Explicit column list — avoids transferring large unused columns (description,
 * benefits, images) on every fetch while keeping all fields the app actually reads.
 */
const PRODUCT_COLUMNS = ['id', 'name', 'category', 'category_id', 'price', 'is_price_editable', 'lens_type', 'is_active'].join(', ')

export function fetchAllCategories() {
  return supabase
    .from('categories')
    .select('id, name_en, name_ta, is_manual_entry, is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order')
}

export function fetchAllProducts() {
  return supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .order('name', { ascending: true })
}

export function fetchLensAddons() {
  return supabase.from('lens_addons').select('*').order('name')
}
