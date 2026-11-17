'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  PlusCircle,
  AlertTriangle,
  History,
  TrendingDown,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { Product, StockMovement } from '@/lib/types';
import StockModal from '@/components/StockModal';

export default function StockPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [viewHistoryProduct, setViewHistoryProduct] = useState<any | null>(null);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/stock?lowStockOnly=${lowStockOnly}`);
      const data = await res.json();
      if (Array.isArray(data.inventory)) setInventory(data.inventory);
    } catch (err) {
      console.error('Error fetching stock:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [lowStockOnly]);

  const filtered = inventory.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalStockSellingValue = inventory.reduce((s, p) => s + (p.stockValueSelling || 0), 0);
  const lowStockCount = inventory.filter((p) => p.isLowStock).length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Stock & Inventory Management</span>
            <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
              Bakery Goods
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Real-time bakery stock tracking, production replenishment, and supply deductions.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedProduct(null);
            setIsStockModalOpen(true);
          }}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add / Replenish Stock</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Total Stock Value (Retail)</p>
          <p className="text-xl font-bold text-emerald-800 mt-0.5">
            ₹{totalStockSellingValue.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Low Stock Warnings</p>
          <p
            className={`text-xl font-bold mt-0.5 ${
              lowStockCount > 0 ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            {lowStockCount} Products
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Tracked Bakery Items</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">
            {inventory.length} Items
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search Laddu, Halwa, Cake, Mixture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
          />
          <span>Show Low Stock Alert Items Only</span>
        </label>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading stock data...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400 space-y-2">
            <Boxes className="w-8 h-8 mx-auto text-slate-300" />
            <p>No inventory items found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Selling Rate</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                  <th className="py-3 px-4 text-right">Low Stock Alert</th>
                  <th className="py-3 px-4 text-right">Stock Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{p.category}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                      ₹{p.sellingPrice} /{p.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-sm">
                      <span className={p.isLowStock ? 'text-rose-700' : 'text-slate-900'}>
                        {p.currentStock} {p.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500">
                      {p.lowStockThreshold} {p.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-800">
                      ₹{p.stockValueSelling.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {p.isLowStock ? (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px] inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setIsStockModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition"
                        >
                          + Replenish
                        </button>
                        <button
                          onClick={() => setViewHistoryProduct(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition"
                          title="View Stock Movement Ledger"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Movement History Slide-over Modal */}
      {viewHistoryProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b mb-3">
              <div>
                <h3 className="font-semibold text-sm text-slate-900">
                  Stock Movements: {viewHistoryProduct.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Audit log of batches produced, added, and supplied in bills.
                </p>
              </div>
              <button
                onClick={() => setViewHistoryProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto text-xs">
              {(viewHistoryProduct.recentMovements || []).length === 0 ? (
                <p className="text-slate-400 text-center py-4">No recent stock movements.</p>
              ) : (
                viewHistoryProduct.recentMovements.map((m: any) => (
                  <div
                    key={m.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                            m.quantity > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {m.type}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(m.date).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-slate-700 text-[11px] mt-1">{m.notes}</p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-bold text-xs ${
                          m.quantity > 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {viewHistoryProduct.unit}
                      </span>
                      <p className="text-[10px] text-slate-400">Bal: {m.balanceAfter}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stock Replenish Modal */}
      <StockModal
        isOpen={isStockModalOpen}
        preselectedProduct={selectedProduct}
        onClose={() => setIsStockModalOpen(false)}
        onStockUpdated={fetchStock}
      />
    </div>
  );
}

