import React, { useState, useMemo } from 'react'
import { Plus, CheckSquare, Square } from 'lucide-react'
import { useProductStore } from '../store/store'

interface PosItemAdderProps {
  onAdd: (item: any) => void
}

export default function PosItemAdder({ onAdd }: PosItemAdderProps) {
  const { categories, products, lensAddons } = useProductStore()
  const [activeCategory, setActiveCategory] = useState<string>('')

  // State for Catalog Flow
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [lensType, setLensType] = useState<string>('')
  const [customPrice, setCustomPrice] = useState<string>('')
  const [selectedAddons, setSelectedAddons] = useState<Set<number>>(new window.Set())

  // State for Manual Flow
  const [manualName, setManualName] = useState('')
  const [manualPrice, setManualPrice] = useState('')

  const activeCatObj = categories.find(c => c.name === activeCategory)
  
  // Filter products for active category
  const categoryProducts = useMemo(() => {
    let p = products.filter(p => p.category === activeCategory)
    if (activeCategory === 'Lenses -> Non-Branded' && lensType) {
      p = p.filter(x => x.lensType === lensType)
    }
    return p
  }, [products, activeCategory, lensType])

  const selectedProduct = useMemo(() => categoryProducts.find(p => String(p.id) === selectedProductId), [categoryProducts, selectedProductId])

  const handleAdd = () => {
    if (!activeCatObj) return

    if (activeCatObj.isManualEntry) {
      if (!manualName.trim() || !manualPrice) return
      onAdd({
        id: `manual-${Date.now()}`,
        name: manualName.trim(),
        category: activeCategory,
        price: parseFloat(manualPrice),
        offerPrice: null,
        isManual: true,
        unitType: 'unit',
        baseQuantity: 1,
        unitLabel: 'piece',
        predefinedOptions: [],
        hasVariants: false,
        isActive: true
      })
      setManualName('')
      setManualPrice('')
    } else {
      if (!selectedProduct) return
      
      const priceToUse = selectedProduct.isPriceEditable && customPrice 
        ? parseFloat(customPrice) 
        : selectedProduct.price

      const addons = Array.from(selectedAddons).map(id => lensAddons.find(a => a.id === id)).filter(Boolean) as any[]
      const addonsPrice = addons.reduce((sum, a) => sum + Number(a.price), 0)

      onAdd({
        ...selectedProduct,
        price: priceToUse + addonsPrice, // Combine price for the line item
        offerPrice: null,
        selectedAddons: addons
      })
      
      // Reset selections
      setSelectedProductId('')
      setCustomPrice('')
      setSelectedAddons(new window.Set())
    }
  }

  const toggleAddon = (id: number) => {
    const next = new window.Set(selectedAddons)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedAddons(next)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-warm-beige/60 p-4 mb-4 shrink-0 z-10">
      <h3 className="text-sm font-black text-near-black mb-3">Add Item to Bill</h3>
      
      <div className="mb-4">
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Category</label>
        <select 
          value={activeCategory} 
          onChange={e => {
            setActiveCategory(e.target.value)
            setSelectedProductId('')
            setLensType('')
            setSelectedAddons(new window.Set())
          }}
          className="w-full bg-[#FBFAF6] border border-[#D8D0C5] rounded-xl px-3 py-2.5 text-sm font-bold text-near-black outline-none"
        >
          <option value="">-- Select Category --</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {activeCatObj && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
          {activeCatObj.isManualEntry ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Item Name</label>
                <input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="e.g. Crizal UV" className="w-full bg-[#FBFAF6] border border-[#D8D0C5] rounded-xl px-3 py-2.5 text-sm font-bold text-near-black outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Price (₹)</label>
                <input type="number" value={manualPrice} onChange={e => setManualPrice(e.target.value)} placeholder="0.00" className="w-full bg-[#FBFAF6] border border-[#D8D0C5] rounded-xl px-3 py-2.5 text-sm font-bold text-near-black outline-none" />
              </div>
            </div>
          ) : (
            <>
              {activeCategory === 'Lenses -> Non-Branded' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Lens Type</label>
                  <select value={lensType} onChange={e => {setLensType(e.target.value); setSelectedProductId('')}} className="w-full bg-[#FBFAF6] border border-[#D8D0C5] rounded-xl px-3 py-2.5 text-sm font-bold text-near-black outline-none">
                    <option value="">-- Select Type --</option>
                    <option value="Single Vision">Single Vision</option>
                    <option value="Progressive">Progressive</option>
                    <option value="Bifocal">Bifocal</option>
                  </select>
                </div>
              )}

              {(!activeCategory.includes('Non-Branded') || lensType) && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Select Item</label>
                  <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="w-full bg-[#FBFAF6] border border-[#D8D0C5] rounded-xl px-3 py-2.5 text-sm font-bold text-near-black outline-none">
                    <option value="">-- Select --</option>
                    {categoryProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.isPriceEditable ? '(Custom Price)' : `(₹${p.price})`}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedProduct?.isPriceEditable && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Custom Price (₹)</label>
                  <input type="number" value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder="Enter price" className="w-full bg-[#FBFAF6] border border-[#D8D0C5] rounded-xl px-3 py-2.5 text-sm font-bold text-near-black outline-none" />
                </div>
              )}

              {activeCategory === 'Lenses -> Non-Branded' && selectedProduct && lensAddons.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Add-ons</label>
                  <div className="grid grid-cols-2 gap-2">
                    {lensAddons.map(a => (
                      <button key={a.id} type="button" onClick={() => toggleAddon(a.id)} className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-colors ${selectedAddons.has(a.id) ? 'bg-warm-beige/30 border-choc-brown text-choc-brown' : 'bg-[#FBFAF6] border-[#D8D0C5] text-gray-500 hover:bg-white'}`}>
                        {selectedAddons.has(a.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                        <span className="text-xs font-bold flex-1">{a.name}</span>
                        <span className="text-xs font-black">+₹{a.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <button 
            type="button" 
            onClick={handleAdd}
            disabled={activeCatObj.isManualEntry ? (!manualName || !manualPrice) : !selectedProduct}
            className="w-full py-3 bg-choc-brown text-white font-black rounded-xl shadow-lg shadow-choc-brown/20 flex items-center justify-center gap-2 hover:bg-near-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} /> ADD TO BILL
          </button>
        </div>
      )}
    </div>
  )
}
