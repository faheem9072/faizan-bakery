'use client';

import React, { useState, useEffect } from 'react';
import {
  Package2,
  Search,
  PlusCircle,
  Edit,
  Trash2,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Store,
  Factory,
} from 'lucide-react';
import { Product } from '@/lib/types';
import ProductModal from '@/components/ProductModal';
import StockModal from '@/components/StockModal';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'IN_HOUSE' | 'OUTSIDE_PURCHASE'>('ALL');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products?activeOnly=true');
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = ['All', 'Sweets', 'Cakes', 'Halwa', 'Snacks'];

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      categoryFilter === 'All' || p.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSource =
      sourceFilter === 'ALL' || (p.sourceType || 'IN_HOUSE') === sourceFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.vendorShopName && p.vendorShopName.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSource && matchesSearch;
  });

  const lowStockCount = products.filter(
    (p) => p.stockTracking && p.currentStock <= p.lowStockThreshold
  ).length;

  const outsideProductsCount = products.filter(
    (p) => p.sourceType === 'OUTSIDE_PURCHASE'
  ).length;

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate ${name}?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Product Catalog (സാധനങ്ങൾ)</span>
            <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
              {products.length} Products
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Manage sweets, cakes, halwa, and products purchased from outside shops.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsProductModalOpen(true);
          }}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add Product (സാധനം ചേർക്കുക)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">All Bakery Items</p>
          <p className="text-lg font-black text-slate-900 mt-0.5">{products.length} Items</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Own Bakery Bake</p>
          <p className="text-lg font-black text-emerald-700 mt-0.5">
            {products.length - outsideProductsCount} Items
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm">
          <p className="text-[11px] font-semibold text-amber-800">From Other Shops</p>
          <p className="text-lg font-black text-amber-900 mt-0.5">
            {outsideProductsCount} Items
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Low Stock Warnings</p>
          <p
            className={`text-lg font-black mt-0.5 ${
              lowStockCount > 0 ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            {lowStockCount} items
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search Laddu, Halwa, Cake, or outside shop name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Simple Source Filter: All / Own Production / Other Shops */}
          <div className="flex items-center space-x-1.5 w-full sm:w-auto text-xs font-bold">
            <button
              onClick={() => setSourceFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                sourceFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setSourceFilter('IN_HOUSE')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition ${
                sourceFilter === 'IN_HOUSE'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <Factory className="w-3.5 h-3.5" />
              <span>Own Bake</span>
            </button>
            <button
              onClick={() => setSourceFilter('OUTSIDE_PURCHASE')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition ${
                sourceFilter === 'OUTSIDE_PURCHASE'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Other Shops (മറ്റ് കട)</span>
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs font-semibold pt-1 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 font-bold uppercase mr-1">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {loading ? (
          <div className="col-span-full p-8 text-center text-xs text-slate-400">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full p-10 text-center text-xs text-slate-400 space-y-2">
            <Package2 className="w-8 h-8 mx-auto text-slate-300" />
            <p>No products match your criteria.</p>
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const isLow = prod.stockTracking && prod.currentStock <= prod.lowStockThreshold;
            const isOutside = prod.sourceType === 'OUTSIDE_PURCHASE';

            return (
              <div
                key={prod.id}
                className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between ${
                  isOutside ? 'border-amber-200/90' : 'border-slate-200/90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5 gap-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                      {prod.category}
                    </span>

                    {/* SOURCE BADGE */}
                    {isOutside ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                        <Store className="w-3 h-3 text-amber-700" />
                        <span>{prod.vendorShopName || 'Other Shop'}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center gap-1">
                        <Factory className="w-3 h-3 text-emerald-600" />
                        <span>Own Bake</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base">{prod.name}</h3>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-black text-emerald-800">
                        ₹{prod.sellingPrice}
                      </span>
                      <span className="text-xs text-slate-500 font-medium ml-1">
                        /{prod.unit}
                      </span>
                    </div>

                    {prod.costPrice > 0 && (
                      <span className="text-xs text-slate-400 font-semibold">
                        Buy Price: ₹{prod.costPrice}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Available Stock:</span>
                    <span
                      className={`font-black ${
                        isLow ? 'text-rose-700 font-black' : 'text-slate-900'
                      }`}
                    >
                      {prod.currentStock} {prod.unit}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => setStockProduct(prod)}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center space-x-1 transition"
                  >
                    <Boxes className="w-3.5 h-3.5 text-emerald-700" />
                    <span>+ Stock</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingProduct(prod);
                      setIsProductModalOpen(true);
                    }}
                    className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                    title="Edit Product"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeactivate(prod.id, prod.name)}
                    className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                    title="Deactivate Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Product Add / Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        product={editingProduct}
        onClose={() => setIsProductModalOpen(false)}
        onSaved={fetchProducts}
      />

      {/* Stock Modal */}
      <StockModal
        isOpen={!!stockProduct}
        preselectedProduct={stockProduct}
        onClose={() => setStockProduct(null)}
        onStockUpdated={fetchProducts}
      />
    </div>
  );
}
