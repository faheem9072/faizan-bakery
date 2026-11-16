'use client';

import React, { useState, useEffect } from 'react';
import { X, PackagePlus, CheckCircle2, Store, Factory } from 'lucide-react';
import { Product } from '@/lib/types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  product?: Product | null;
}

export default function ProductModal({
  isOpen,
  onClose,
  onSaved,
  product,
}: ProductModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Sweets');
  const [unit, setUnit] = useState('kg');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [defaultQuantity, setDefaultQuantity] = useState('5');
  const [currentStock, setCurrentStock] = useState('50');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [stockTracking, setStockTracking] = useState(true);

  // External / Outside Shop Product Feature
  const [sourceType, setSourceType] = useState<'IN_HOUSE' | 'OUTSIDE_PURCHASE'>('IN_HOUSE');
  const [vendorShopName, setVendorShopName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category);
      setUnit(product.unit);
      setSellingPrice(product.sellingPrice.toString());
      setCostPrice(product.costPrice ? product.costPrice.toString() : '');
      setDefaultQuantity(product.defaultQuantity.toString());
      setCurrentStock(product.currentStock.toString());
      setLowStockThreshold(product.lowStockThreshold.toString());
      setStockTracking(product.stockTracking);
      setSourceType(product.sourceType || 'IN_HOUSE');
      setVendorShopName(product.vendorShopName || '');
    } else {
      setName('');
      setCategory('Sweets');
      setUnit('kg');
      setSellingPrice('');
      setCostPrice('');
      setDefaultQuantity('5');
      setCurrentStock('50');
      setLowStockThreshold('10');
      setStockTracking(true);
      setSourceType('IN_HOUSE');
      setVendorShopName('');
    }
    setError('');
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const sp = parseFloat(sellingPrice);
    if (!name.trim() || isNaN(sp) || sp <= 0) {
      setError('Product name and a valid selling price are required.');
      return;
    }

    if (sourceType === 'OUTSIDE_PURCHASE' && !vendorShopName.trim()) {
      setError('Please enter the name of the shop / vendor where this item is bought from.');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          unit,
          sellingPrice: sp,
          costPrice: parseFloat(costPrice || '0'),
          defaultQuantity: parseFloat(defaultQuantity || '1'),
          currentStock: parseFloat(currentStock || '0'),
          lowStockThreshold: parseFloat(lowStockThreshold || '10'),
          stockTracking,
          sourceType,
          vendorShopName: sourceType === 'OUTSIDE_PURCHASE' ? vendorShopName : null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        setError(data.error || 'Failed to save product');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <PackagePlus className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {product ? 'Edit Product' : 'Add Product (സാധനം ചേർക്കുക)'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Own bakery production or purchased from outside shop
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* ITEM SOURCE SELECTION (Own Bake vs Outside Shop) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="block text-xs font-black text-slate-800 mb-2">
              Product Source (ഈ സാധനം എവിടെ നിന്നാണ്?):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSourceType('IN_HOUSE')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center space-x-2 transition ${
                  sourceType === 'IN_HOUSE'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Factory className="w-4 h-4" />
                <span>Own Bake (സ്വന്തം ബേക്കറി)</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('OUTSIDE_PURCHASE')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center space-x-2 transition ${
                  sourceType === 'OUTSIDE_PURCHASE'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Other Shop (മറ്റ് കടയിൽ നിന്ന്)</span>
              </button>
            </div>

            {/* Vendor / Other Shop Name Field */}
            {sourceType === 'OUTSIDE_PURCHASE' && (
              <div className="mt-3 pt-3 border-t border-amber-200/80 animate-in fade-in">
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  Purchased From Which Shop / Supplier? (ഏത് ഷോപ്പിൽ നിന്നാണ് വാങ്ങുന്നത്?)*
                </label>
                <input
                  type="text"
                  value={vendorShopName}
                  onChange={(e) => setVendorShopName(e.target.value)}
                  placeholder="e.g. Royal Sweets Wholesale, Calicut Chips, Shafi Distributor"
                  required={sourceType === 'OUTSIDE_PURCHASE'}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-amber-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[10px] text-amber-700 mt-1">
                  This will help you track external purchases separately in daily reports & billing.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Product Name (സാധനത്തിന്റെ പേര്) *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Laddu, Halwa, Special Mixture, Milk Rusk..."
              required
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category (വിഭാഗം)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Sweets">Sweets (മധുരപലഹാരം)</option>
                <option value="Cakes">Cakes (കേക്ക്)</option>
                <option value="Halwa">Halwa (ഹൽവ)</option>
                <option value="Snacks">Snacks (സ്നാക്സ്)</option>
                <option value="Breads">Breads (ബ്രെഡ് / ബൺ)</option>
                <option value="Biscuits">Biscuits (ബിസ്ക്കറ്റ്)</option>
                <option value="Outside Products">Outside Shop Goods (പുറത്തുനിന്ന് വാങ്ങിയവ)</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit (അളവ്) *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              >
                <option value="kg">kg (കിലോഗ്രാം)</option>
                <option value="packet">packet (പാക്കറ്റ്)</option>
                <option value="piece">piece (പീസ്)</option>
                <option value="box">box (ബോക്സ്)</option>
                <option value="gram">gram (ഗ്രാം)</option>
                <option value="litre">litre (ലിറ്റർ)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Selling Price (വിൽക്കുന്ന വില ₹) *
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="e.g. 240"
                required
                className="w-full text-sm font-black px-3 py-2 rounded-xl border border-slate-300 text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Purchase / Cost Price (നമുക്ക് കിട്ടിയ വില ₹)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="e.g. 180"
                className="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Current Stock (കയ്യിലുള്ള സ്റ്റോക്ക്)
              </label>
              <input
                type="number"
                step="any"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Low Stock Alert (അലേർട്ട് അളവ്)
              </label>
              <input
                type="number"
                step="any"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2 transition"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isSubmitting ? 'Saving...' : product ? 'Update Product' : 'Save Product (ചേർക്കുക)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
