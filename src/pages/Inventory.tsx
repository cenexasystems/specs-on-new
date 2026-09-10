import React, { useState, useEffect, useCallback } from 'react'
import { Package, Search, Edit2, Plus, Trash2, Tag, Activity, Power } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/retail'
import { useSound } from '../context/SoundContext'

interface CatalogProduct {
  id: string | number
  name: string
  category: string
  price: number
  is_price_editable: boolean
  lens_type?: string
  is_active: boolean
}

interface Category {
  id: string | number
  name_en: string
  is_manual_entry: boolean
  is_active: boolean
}

interface LensAddon {
  id: string | number
  name: string
  price: number
}

interface ProductForm {
  name: string
  category: string
  price: string
  is_price_editable: boolean
  lens_type: string
  is_active: boolean
}

const EMPTY_FORM: ProductForm = {
  name: '',
  category: '',
  price: '',
  is_price_editable: false,
  lens_type: '',
  is_active: true,
}

// Analytics driven by order_items instead of inventory_logs
function InventoryAnalytics() {
  const [itemsSold, setItemsSold] = useState<any[]>([])
  
  useEffect(() => {
    supabase.from('order_items').select('product_name, quantity, line_total, created_at')
      .order('created_at', { ascending: false }).limit(100)
      .then(({data}) => setItemsSold(data || []))
  }, [])

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-black text-near-black">Recent Items Sold</h3>
      <div className="bg-white rounded-3xl shadow-sm border border-warm-beige/60 overflow-hidden">
        {/* Mobile card view */}
        <div className="sm:hidden divide-y divide-[#F3F4F6]">
          {itemsSold.map((item, i) => (
            <div key={i} className="px-4 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-near-black text-sm truncate">{item.product_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{new Date(item.created_at).toLocaleDateString('en-IN')}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm text-near-black">{formatCurrency(item.line_total)}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
            </div>
          ))}
          {itemsSold.length === 0 && <p className="p-6 text-center text-gray-400 text-sm">No sales data yet.</p>}
        </div>
        {/* Desktop table view */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm text-[#374151]">
            <thead className="bg-[#FBFAF6] text-[11px] uppercase tracking-wider text-[#9CA3AF] border-b border-[#F3F4F6]">
              <tr>
                <th className="p-4 font-black">Item</th>
                <th className="p-4 font-black">Qty</th>
                <th className="p-4 font-black">Total</th>
                <th className="p-4 font-black">Date</th>
              </tr>
            </thead>
            <tbody>
              {itemsSold.map((item, i) => (
                <tr key={i} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors">
                  <td className="p-4 font-bold text-near-black">{item.product_name}</td>
                  <td className="p-4">{item.quantity}</td>
                  <td className="p-4 font-bold text-near-black">{formatCurrency(item.line_total)}</td>
                  <td className="p-4 text-xs text-gray-500">{new Date(item.created_at).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


export default function Inventory() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'products' | 'categories' | 'analytics' | 'addons'>('catalog')
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [addons, setAddons] = useState<LensAddon[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  

  // Form states
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState({ name_en: '', is_manual_entry: false })
  const [categoryError, setCategoryError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [pRes, cRes, aRes] = await Promise.all([
      supabase.from('products').select('id, name, category, price, is_price_editable, lens_type, is_active').order('name'),
      supabase.from('categories').select('id, name_en, is_manual_entry, is_active').order('sort_order'),
      supabase.from('lens_addons').select('id, name, price').order('name')
    ])
    if (pRes.data) setProducts(pRes.data)
    if (cRes.data) setCategories(cRes.data)
    if (aRes.data) setAddons(aRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    const savedCategory = form.category
    const cat = categories.find(c => c.name_en === form.category)

    const payload = {
      name: form.name,
      category: form.category,
      category_id: cat?.id || null,
      price: parseFloat(form.price) || 0,
      is_price_editable: form.is_price_editable,
      lens_type: form.lens_type || null,
      is_active: form.is_active,
    }

    if (editingProduct) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id)
      if (error) alert("Save failed: " + error.message)
      else {
        await fetchData()
        setEditingProduct(null)
        setForm({...EMPTY_FORM, category: savedCategory})
      }
    } else {
      const { error } = await supabase.from('products').insert([payload])
      if (error) alert("Save failed: " + error.message)
      else {
        await fetchData()
        setForm({...EMPTY_FORM, category: savedCategory})
      }
    }
  }

  const handleDelete = async (id: string | number) => {
    if (!window.confirm('Delete this product?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) alert("An error occurred")
    else { ; fetchData() }
  }

  const handleAddonSave = async (e: React.FormEvent, addonForm: any, isEdit: boolean, id?: string|number) => {
    e.preventDefault()
    if (isEdit) {
      await supabase.from('lens_addons').update({name: addonForm.name, price: parseFloat(addonForm.price)}).eq('id', id)
    } else {
      await supabase.from('lens_addons').insert([{name: addonForm.name, price: parseFloat(addonForm.price)}])
    }
    fetchData()
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = categoryForm.name_en.trim()
    if (!name) {
      setCategoryError('Category name is required')
      return
    }

    setCategoryError('')
    const previousName = editingCategory?.name_en
    const payload = { name_en: name, name_ta: '', is_manual_entry: categoryForm.is_manual_entry }
    const { error } = editingCategory
      ? await supabase.from('categories').update(payload).eq('id', editingCategory.id)
      : await supabase.from('categories').insert({ ...payload, is_active: true })

    if (error) {
      setCategoryError(error.message)
      return
    }

    if (editingCategory && previousName !== name) {
      const { error: productUpdateError } = await supabase
        .from('products')
        .update({ category: name })
        .eq('category_id', editingCategory.id)
      if (productUpdateError) {
        setCategoryError(productUpdateError.message)
        return
      }
    }

    setEditingCategory(null)
    setCategoryForm({ name_en: '', is_manual_entry: false })
    await fetchData()
  }

  const handleToggleCategory = async (category: Category) => {
    const { error } = await supabase
      .from('categories')
      .update({ is_active: !category.is_active })
      .eq('id', category.id)
    if (error) {
      setCategoryError(error.message)
      return
    }
    await fetchData()
  }

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`Delete "${category.name_en}"? Products in this category will become Uncategorized.`)) return

    const { error: productError } = await supabase
      .from('products')
      .update({ category: 'Uncategorized', category_id: null })
      .eq('category_id', category.id)
    if (productError) {
      setCategoryError(productError.message)
      return
    }

    const { error: legacyProductError } = await supabase
      .from('products')
      .update({ category: 'Uncategorized', category_id: null })
      .eq('category', category.name_en)
    if (legacyProductError) {
      setCategoryError(legacyProductError.message)
      return
    }

    const { error } = await supabase.from('categories').delete().eq('id', category.id)
    if (error) {
      setCategoryError(error.message)
      return
    }

    if (editingCategory?.id === category.id) {
      setEditingCategory(null)
      setCategoryForm({ name_en: '', is_manual_entry: false })
    }
    setCategoryError('')
    await fetchData()
  }

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4 min-h-screen pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-near-black">Catalog & Inventory</h1>
          <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1">Manage pricing tiers and manual categories</p>
        </div>
      </div>

      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {[
          { id: 'catalog', label: 'Catalog Overview', icon: Package },
          { id: 'products', label: 'Add / Edit Products', icon: Edit2 },
          { id: 'addons', label: 'Lens Add-ons', icon: Plus },
          { id: 'categories', label: 'Categories', icon: Tag },
          { id: 'analytics', label: 'Analytics', icon: Activity },
        ].map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === t.id ? 'bg-choc-brown text-white shadow-md' : 'bg-white text-gray-600 hover:bg-warm-beige/30 hover:text-choc-brown'}`}>
              <Icon size={14} className="sm:h-4 sm:w-4" /> {t.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-warm-beige/60">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Catalog Items</p>
              <p className="mt-2 text-2xl font-black text-near-black">{products.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-warm-beige/60">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Categories</p>
              <p className="mt-2 text-2xl font-black text-near-black">{categories.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-warm-beige/60">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Manual-Entry Types</p>
              <p className="mt-2 text-2xl font-black text-near-black">{categories.filter(c => c.is_manual_entry).length}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-warm-beige/60 overflow-hidden">
            <div className="p-4 border-b border-warm-beige/30 flex items-center gap-4">
              <Search className="text-gray-400 shrink-0" size={18} />
              <input type="text" placeholder="Search catalog..." value={search} onChange={e => setSearch(e.target.value)} className="w-full text-sm font-semibold bg-transparent outline-none" />
            </div>
            {/* Desktop header */}
            <div className="hidden sm:grid grid-cols-[1.2fr_1.2fr_1fr_1fr_auto] gap-4 px-4 py-3 bg-[#FBFAF6] text-[11px] uppercase tracking-wider text-[#9CA3AF] font-black">
              <span>Product</span>
              <span>Category</span>
              <span>Type / Tier</span>
              <span>Price</span>
              <span className="text-right">Actions</span>
            </div>
            {filteredProducts.map(p => (
              <div key={p.id} className="border-t border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors">
                {/* Mobile card row */}
                <div className="flex items-center justify-between gap-2 px-4 py-3 sm:hidden">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-near-black text-sm truncate">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.is_price_editable ? <span className="italic text-gray-400">Editable at billing</span> : <span className="font-semibold text-choc-brown">{formatCurrency(p.price)}</span>}
                      {p.lens_type ? <span className="ml-2 text-gray-400">· {p.lens_type}</span> : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setEditingProduct(p); setForm({name: p.name, category: p.category, price: String(p.price), is_price_editable: p.is_price_editable, lens_type: p.lens_type || '', is_active: p.is_active}); setActiveTab('products') }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
                {/* Desktop row */}
                <div className="hidden sm:grid grid-cols-[1.2fr_1.2fr_1fr_1fr_auto] gap-4 items-center px-4 py-3 text-sm">
                  <span className="font-bold text-near-black truncate">{p.name}</span>
                  <span><span className="inline-block px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-warm-beige/40 text-choc-brown">{p.category}</span></span>
                  <span className="text-gray-500 font-semibold">{p.lens_type || '-'}</span>
                  <span className="font-bold text-near-black">{p.is_price_editable ? <span className="text-gray-400 italic">Editable at billing</span> : formatCurrency(p.price)}</span>
                  <span className="flex items-center gap-1">
                    <button onClick={() => { setEditingProduct(p); setForm({name: p.name, category: p.category, price: String(p.price), is_price_editable: p.is_price_editable, lens_type: p.lens_type || '', is_active: p.is_active}); setActiveTab('products') }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm border border-warm-beige/60 h-fit">
          <h3 className="text-lg sm:text-xl font-black text-near-black mb-5 sm:mb-6">{editingProduct ? 'Edit Catalog Item' : 'Add Catalog Item'}</h3>
          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Item Name</label><input required className="w-full px-4 py-3 bg-[#FBFAF6] border border-[#D8D0C5] rounded-xl text-sm font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category</label>
              <select required className="w-full px-4 py-3 bg-[#FBFAF6] border border-[#D8D0C5] rounded-xl text-sm font-bold" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.name_en}>{c.name_en}</option>)}
              </select>
            </div>
            {form.category === 'Lenses -> Non-Branded' && (
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Lens Type</label>
                <select className="w-full px-4 py-3 bg-[#FBFAF6] border border-[#D8D0C5] rounded-xl text-sm font-bold" value={form.lens_type} onChange={e => setForm({...form, lens_type: e.target.value})}>
                  <option value="">None</option>
                  <option value="Single Vision">Single Vision</option>
                  <option value="Progressive">Progressive</option>
                  <option value="Bifocal">Bifocal</option>
                </select>
              </div>
            )}
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_price_editable} onChange={e => setForm({...form, is_price_editable: e.target.checked})} className="w-5 h-5 accent-choc-brown" />
                <span className="text-sm font-bold text-near-black">Price is editable at billing (e.g. Premium)</span>
              </label>
            </div>
            {!form.is_price_editable && (
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Base Price (₹)</label><input type="number" required className="w-full px-4 py-3 bg-[#FBFAF6] border border-[#D8D0C5] rounded-xl text-sm font-bold" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
            )}
            <div className="pt-4 flex gap-4">
              <button type="submit" className="flex-1 bg-choc-brown text-white py-3 rounded-xl font-black hover:bg-near-black">Save Item</button>
              {editingProduct && <button type="button" onClick={() => {setEditingProduct(null); setForm(EMPTY_FORM)}} className="px-6 border border-[#D8D0C5] text-near-black rounded-xl font-black">Cancel</button>}
            </div>
          </form>
          </div>
          <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-warm-beige/60 overflow-hidden flex flex-col h-fit max-h-[800px]">
            <div className="p-4 sm:p-6 border-b border-[#F3F4F6] flex justify-between items-center gap-3 bg-[#FBFAF6]">
              <h3 className="text-sm sm:text-base font-black text-near-black truncate">Items in {form.category || 'Selected Category'}</h3>
              <span className="text-xs font-bold text-gray-500">{products.filter(p => form.category ? p.category === form.category : true).length} items</span>
            </div>
            <div className="overflow-x-auto sm:overflow-x-visible overflow-y-auto flex-1 p-0">
              {form.category ? (
                <table className="w-full min-w-[500px] sm:min-w-0 table-fixed text-left text-xs sm:text-sm text-[#374151]">
                  <thead className="bg-[#FBFAF6] text-[11px] uppercase tracking-wider text-[#9CA3AF] sticky top-0 shadow-sm">
                    <tr>
                      <th className="p-4 font-black">Name</th>
                      <th className="p-4 font-black">Type</th>
                      <th className="p-4 font-black">Price</th>
                      <th className="p-4 font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {products.filter(p => p.category === form.category).map(p => (
                      <tr key={p.id} className="hover:bg-[#F9FAFB]">
                        <td className="p-3 sm:p-4 font-bold text-near-black">{p.name}</td>
                        <td className="p-3 sm:p-4 text-[11px] sm:text-xs font-semibold text-gray-500">{p.lens_type || '-'}</td>
                        <td className="p-3 sm:p-4 font-bold">{p.is_price_editable ? <span className="text-gray-400 italic">Editable</span> : formatCurrency(p.price)}</td>
                        <td className="p-3 sm:p-4 text-right">
                          <button onClick={() => { setEditingProduct(p); setForm({name: p.name, category: p.category, price: String(p.price), is_price_editable: p.is_price_editable, lens_type: p.lens_type || '', is_active: p.is_active}) }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                    {products.filter(p => p.category === form.category).length === 0 && (
                      <tr><td colSpan={4} className="p-8 text-center text-gray-400 italic font-medium">No items found in this category.</td></tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-gray-400 italic font-medium">Select a category on the left to see its items.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'addons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm border border-warm-beige/60 h-fit">
            <h3 className="text-lg sm:text-xl font-black text-near-black mb-2">New Lens Add-on</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6 font-medium">Add-ons appear as checkboxes when billing Non-Branded lenses.</p>
            <form onSubmit={e => {
              e.preventDefault()
              const fd = new FormData(e.target as HTMLFormElement)
              handleAddonSave(e, {name: fd.get('name'), price: fd.get('price')}, false).then(() => (e.target as HTMLFormElement).reset())
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Add-on Name</label>
                <input name="name" required placeholder="e.g. Anti-Reflective Coating" className="w-full px-4 py-3 bg-[#FBFAF6] border border-[#D8D0C5] rounded-xl text-sm font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Price (?)</label>
                <input name="price" type="number" required placeholder="0.00" className="w-full px-4 py-3 bg-[#FBFAF6] border border-[#D8D0C5] rounded-xl text-sm font-bold" />
              </div>
              <button className="w-full bg-choc-brown text-white py-3 rounded-xl font-black hover:bg-near-black flex items-center justify-center gap-2 mt-4"><Plus size={18} /> Save Add-on</button>
            </form>
          </div>
           <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-warm-beige/60 overflow-hidden flex flex-col h-fit max-h-[800px]">
             <div className="p-4 sm:p-6 border-b border-[#F3F4F6] flex justify-between items-center bg-[#FBFAF6]">
              <h3 className="text-sm sm:text-base font-black text-near-black">Existing Add-ons</h3>
              <span className="text-xs font-bold text-gray-500">{addons.length} items</span>
            </div>
            <div className="overflow-x-auto sm:overflow-x-visible overflow-y-auto flex-1 p-0">
              <table className="w-full min-w-[420px] sm:min-w-0 table-fixed text-left text-xs sm:text-sm text-[#374151]">
                <thead className="bg-[#FBFAF6] text-[11px] uppercase tracking-wider text-[#9CA3AF] sticky top-0 shadow-sm">
                  <tr>
                    <th className="p-4 font-black">Name</th>
                    <th className="p-4 font-black">Price</th>
                    <th className="p-4 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {addons.map(a => (
                    <tr key={a.id} className="hover:bg-[#F9FAFB]">
                      <td className="p-3 sm:p-4 font-bold text-near-black">{a.name}</td>
                      <td className="p-3 sm:p-4 font-bold">{formatCurrency(a.price)}</td>
                      <td className="p-3 sm:p-4 text-right">
                        <button onClick={() => supabase.from('lens_addons').delete().eq('id', a.id).then(fetchData)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {addons.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-gray-400 italic font-medium">No add-ons yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm border border-warm-beige/60">
            <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-near-black">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">Choose whether billing uses a catalog item or free text.</p>
              </div>
              {editingCategory && (
                <button
                  type="button"
                  onClick={() => { setEditingCategory(null); setCategoryForm({ name_en: '', is_manual_entry: false }); setCategoryError('') }}
                  className="px-4 py-2 border border-[#D8D0C5] text-near-black rounded-xl font-black"
                >Cancel</button>
              )}
            </div>
            <form onSubmit={handleSaveCategory} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 sm:gap-4 items-stretch md:items-end">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category Name</label>
                <input
                  required
                  value={categoryForm.name_en}
                  onChange={e => setCategoryForm({...categoryForm, name_en: e.target.value})}
                  placeholder="e.g. Contact Lenses"
                  className="w-full px-4 py-3 bg-[#FBFAF6] border border-[#D8D0C5] rounded-xl text-sm font-bold"
                />
              </div>
              <label className="flex items-center gap-2 min-h-12 px-4 border border-[#D8D0C5] rounded-xl cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={categoryForm.is_manual_entry}
                  onChange={e => setCategoryForm({...categoryForm, is_manual_entry: e.target.checked})}
                  className="w-5 h-5 accent-choc-brown"
                />
                <span className="text-sm font-bold text-near-black">Manual entry</span>
              </label>
              <button type="submit" className="min-h-12 px-5 sm:px-6 bg-choc-brown text-white rounded-xl font-black hover:bg-near-black flex items-center justify-center gap-2 text-sm">
                <Plus size={18} /> {editingCategory ? 'Update Category' : 'Add Category'}
              </button>
            </form>
            {categoryError && <p className="mt-3 text-sm font-bold text-red-600">{categoryError}</p>}
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-warm-beige/60 overflow-hidden">
            {/* Mobile card view */}
            <div className="sm:hidden divide-y divide-[#F3F4F6]">
              {categories.map(c => (
                <div key={c.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-near-black text-sm truncate">{c.name_en}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {c.is_manual_entry
                        ? <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-100 text-blue-800">Manual Entry</span>
                        : <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-green-100 text-green-800">Catalog</span>}
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${c.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                        {c.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button type="button" title="Edit" onClick={() => { setEditingCategory(c); setCategoryForm({ name_en: c.name_en, is_manual_entry: c.is_manual_entry }); setCategoryError('') }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={15} /></button>
                    <button type="button" title={c.is_active ? 'Disable' : 'Enable'} onClick={() => handleToggleCategory(c)} className={`p-2 rounded-lg ${c.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}><Power size={15} /></button>
                    <button type="button" title="Delete" onClick={() => handleDeleteCategory(c)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && <p className="p-6 text-center text-gray-400 text-sm italic">No categories yet.</p>}
            </div>
            {/* Desktop table view */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full table-fixed text-left text-sm text-[#374151]">
                <thead className="bg-[#FBFAF6] text-[11px] uppercase tracking-wider text-[#9CA3AF]">
                  <tr>
                    <th className="p-4 font-black">Category</th>
                    <th className="p-4 font-black">Entry Type</th>
                    <th className="p-4 font-black">Status</th>
                    <th className="p-4 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id} className="border-b border-[#F3F4F6]">
                      <td className="p-4 font-bold text-near-black">{c.name_en}</td>
                      <td className="p-4">
                        {c.is_manual_entry
                          ? <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-100 text-blue-800">Manual Entry (Free Text)</span>
                          : <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-green-100 text-green-800">Catalog Selection</span>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${c.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {c.is_active ? 'Active in POS' : 'Disabled in POS'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button type="button" title="Edit category" onClick={() => { setEditingCategory(c); setCategoryForm({ name_en: c.name_en, is_manual_entry: c.is_manual_entry }); setCategoryError('') }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                        <button type="button" title={c.is_active ? 'Disable category in POS' : 'Enable category in POS'} onClick={() => handleToggleCategory(c)} className={`p-2 rounded-lg ${c.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}><Power size={16} /></button>
                        <button type="button" title="Delete category" onClick={() => handleDeleteCategory(c)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && <InventoryAnalytics />}
    </div>
  )
}
