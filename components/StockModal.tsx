'use client';

import React, { useState, useEffect } from 'react';
import { X, Boxes, Plus, CheckCircle2, Store, Factory } from 'lucide-react';
import { Product } from '@/lib/types';

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStockUpdated: () => void;
  preselectedProduct?: Product | null;
}

export default function StockModal({
  isOpen,
  onClose,
  onStockUpdated,
  preselectedProduct,
}: StockModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [sourceCategory, setSourceCategory] = useState<'IN_HOUSE' | 'OUTSIDE_SHOP'>('IN_HOUSE');
  const [vendorShopName, setVendorShopName] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/products?activeOnly=true')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setProducts(data);
        })
        .catch(console.error);

      if (preselectedProduct) {
        setProductId(preselectedProduct.id);
        if (preselectedProduct.sourceType === 'OUTSIDE_PURCHASE') {
          setSourceCategory('OUTSIDE_SHOP');
          setVendorShopName(preselectedProduct.vendorShopName || '');
        } else {
          setSourceCategory('IN_HOUSE');
          setVendorShopName('');
        }
      }
    }
  }, [isOpen, preselectedProduct]);

  if (!isOpen) return null;

  const selectedProd = products.find((p) => p.id === productId) || preselectedProduct;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const qty = parseFloat(quantity);
    if (!productId || isNaN(qty) || qty === 0) {
      setError('Please select a product and enter quantity.');
      return;
    }

    setIsSubmitting(true);
    try {
      const type = sourceCategory === 'OUTSIDE_SHOP' ? 'PURCHASE_IN' : 'OPENING';
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity: qty,
          type: 'PURCHASE_IN',
          vendorShopName: sourceCategory === 'OUTSIDE_SHOP' ? vendorShopName : null,
          unitCost: unitCost ? parseFloat(unitCost) : null,
          notes: notes || (sourceCategory === 'OUTSIDE_SHOP' 
            ? `Purchased from ${vendorShopName || 'Outside Shop'}` 
            : 'Bakery fresh batch production'),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Stock updated successfully!');
        onStockUpdated();
        onClose();
      } else {
        setError(data.error || 'Failed to update stock');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Add Stock (സ്റ്റോക്ക് ചേർക്കുക)</h3>
              <p className="text-[11px] text-slate-500">Own production or purchased from other shop</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Stock Source Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Stock Source (സ്റ്റോക്ക് എവിടെ നിന്നാണ്?):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSourceCategory('IN_HOUSE')}
                className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center space-x-1.5 transition ${
                  sourceCategory === 'IN_HOUSE'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Factory className="w-3.5 h-3.5" />
                <span>Own Bake (നിർമ്മാണം)</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceCategory('OUTSIDE_SHOP')}
                className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center space-x-1.5 transition ${
                  sourceCategory === 'OUTSIDE_SHOP'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Other Shop (മറ്റ് കട)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Product *</label>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                const p = products.find((prod) => prod.id === e.target.value);
                if (p?.sourceType === 'OUTSIDE_PURCHASE') {
                  setSourceCategory('OUTSIDE_SHOP');
                  setVendorShopName(p.vendorShopName || '');
                }
              }}
              disabled={!!preselectedProduct}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              required
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.sourceType === 'OUTSIDE_PURCHASE' ? '(From Other Shop)' : ''} - Current: {p.currentStock} {p.unit}
                </option>
              ))}
            </select>
          </div>

          {sourceCategory === 'OUTSIDE_SHOP' && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2 animate-in fade-in">
              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  Shop / Supplier Name (വാങ്ങിയ കടയുടെ പേര്) *
                </label>
                <input
                  type="text"
                  value={vendorShopName}
                  onChange={(e) => setVendorShopName(e.target.value)}
                  placeholder="e.g. Royal Sweets, Central Market..."
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  Purchase Rate per Unit (നമുക്ക് വാങ്ങിയ വില ₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Quantity to Add {selectedProd ? `(${selectedProd.unit})` : ''} *
            </label>
            <input
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 50"
              required
              className="w-full text-base font-black px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Morning van replenishment"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Updating...' : 'Confirm Stock Addition (ചേർക്കുക)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
