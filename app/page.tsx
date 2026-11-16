'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Receipt,
  Boxes,
  WalletCards,
  CreditCard,
  Users2,
  Calendar,
  ArrowUpRight,
  PlusCircle,
  Clock,
  Printer,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { DashboardStats, Invoice, BusinessSetting } from '@/lib/types';
import InvoiceViewModal from '@/components/InvoiceViewModal';
import PaymentModal from '@/components/PaymentModal';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<BusinessSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, setRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/settings'),
      ]);
      const dashData = await dashRes.json();
      const setData = await setRes.json();

      setStats(dashData);
      setSettings(setData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600">Loading Faizan Bakery Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-5 sm:p-6 rounded-2xl shadow-lg shadow-emerald-900/10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-700/80 uppercase tracking-wide">
              Bakery POS & Distribution
            </span>
            <span className="text-xs text-emerald-300">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold mt-1 tracking-tight">
            {settings?.businessName || 'Faizan Bakery'} Overview
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200 mt-0.5">
            Real-time daily sales, customer credit tracking, and distribution metrics.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10 transition"
          >
            Collect Payment
          </button>
          <Link
            href="/billing"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition flex items-center space-x-1.5 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Bill</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Today's Sales</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            ₹{(stats?.todaySales || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
            <span className="font-bold text-emerald-700">{stats?.todayOrders || 0} orders</span>
            <span>billed today</span>
          </div>
        </div>

        {/* Today's Payments Collected */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Payments Collected</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <WalletCards className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            ₹{(stats?.todayPaymentsReceived || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Cash & UPI collected today
          </div>
        </div>

        {/* Total Outstanding Credit */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/90 shadow-sm hover:shadow-md transition bg-gradient-to-b from-amber-50/30 to-white">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold mb-1">
            <span>Total Credit Due</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 tracking-tight">
            ₹{(stats?.totalOutstandingCredit || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            Across {stats?.customerOutstandingList?.length || 0} customer accounts
          </div>
        </div>

        {/* Products Supplied Today */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Products Supplied</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {(stats?.todayProductsSupplied || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Items dispatched to shops
          </div>
        </div>
      </div>

      {/* Secondary Row: Monthly Stats & Mini Quick Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Monthly Sales (MTD)</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              ₹{(stats?.monthlySales || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
            Active Month
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Monthly Collection</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              ₹{(stats?.monthlyCollection || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
            Collected
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Total Customer Shops</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              {stats?.totalCustomers || 0} Bakeries
            </p>
          </div>
          <Link href="/customers" className="text-xs font-bold text-slate-700 hover:text-emerald-700">
            View All →
          </Link>
        </div>
      </div>

      {/* Sales Trend Chart (7 Days) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Sales & Collection Trend (Last 7 Days)</h3>
            <p className="text-xs text-slate-500">Daily breakdown of billing vs payment collections</p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-semibold">
            <span className="flex items-center space-x-1 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block"></span>
              <span>Sales</span>
            </span>
            <span className="flex items-center space-x-1 text-blue-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block"></span>
              <span>Collection</span>
            </span>
          </div>
        </div>

        {/* Visual Bar representation */}
        <div className="pt-2 pb-1">
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-36 border-b border-slate-200">
            {(stats?.salesChart || []).map((day, idx) => {
              const maxVal = Math.max(
                ...((stats?.salesChart || []).map((d) => Math.max(d.sales, d.payments))),
                5000
              );
              const salesHeight = Math.max(8, (day.sales / maxVal) * 100);
              const payHeight = Math.max(8, (day.payments / maxVal) * 100);

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end group">
                  <div className="flex items-end justify-center space-x-1 w-full h-full pb-1">
                    {/* Sales Bar */}
                    <div
                      style={{ height: `${salesHeight}%` }}
                      className="w-1/2 max-w-[20px] bg-emerald-600 rounded-t-sm transition-all group-hover:bg-emerald-500 relative"
                      title={`Sales: ₹${day.sales.toLocaleString('en-IN')}`}
                    />
                    {/* Payment Bar */}
                    <div
                      style={{ height: `${payHeight}%` }}
                      className="w-1/2 max-w-[20px] bg-blue-500 rounded-t-sm transition-all group-hover:bg-blue-400 relative"
                      title={`Collection: ₹${day.payments.toLocaleString('en-IN')}`}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 truncate mt-1">
                    {day.date.split(',')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Top Customers & Most Sold Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most Sold Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm">Most Sold Bakery Products</h3>
            <Link href="/products" className="text-xs font-bold text-emerald-700 hover:underline">
              Inventory →
            </Link>
          </div>

          {(stats?.mostSoldProducts || []).length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No product sales recorded yet. Create your first bill!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {(stats?.mostSoldProducts || []).map((prod, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{prod.name}</p>
                      <p className="text-[11px] text-slate-500">{prod.quantity} {prod.unit} supplied</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-900">
                    ₹{prod.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Customers By Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm">Top Bakery Customers</h3>
            <Link href="/customers" className="text-xs font-bold text-emerald-700 hover:underline">
              All Shops →
            </Link>
          </div>

          {(stats?.topCustomers || []).length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No customer orders yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {(stats?.topCustomers || []).map((cust, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{cust.shopName}</p>
                      <p className="text-[11px] text-slate-500">{cust.ordersCount} orders • Outstanding: ₹{cust.balance.toFixed(0)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-800">
                    ₹{cust.totalSales.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer-wise Outstanding Balance & Recent Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer Outstanding Balances */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Customer Outstanding Balances</h3>
              <p className="text-[11px] text-slate-500">Unsettled credit from paper ledger & digital bills</p>
            </div>
            <Link href="/credit" className="text-xs font-bold text-amber-800 hover:underline">
              Manage Credit →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {(stats?.customerOutstandingList || []).map((cust) => (
              <div key={cust.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">{cust.shopName}</p>
                  <p className="text-[11px] text-slate-500">{cust.ownerName} • {cust.mobileNumber}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-rose-700">
                    ₹{cust.balance.toLocaleString('en-IN')}
                  </span>
                  <p className="text-[10px] text-slate-400">Due Balance</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bills */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm">Recent Bills & Invoices</h3>
            <Link href="/bills" className="text-xs font-bold text-emerald-700 hover:underline">
              View All Bills →
            </Link>
          </div>

          {(stats?.recentBills || []).length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No bills created yet. Click "Create Bill" to make one!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {(stats?.recentBills || []).slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 px-2 rounded-lg transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{inv.customer?.shopName}</p>
                      <p className="text-[11px] text-slate-500">
                        {inv.invoiceNumber} • {new Date(inv.invoiceDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900">₹{inv.grandTotal.toFixed(0)}</p>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'PARTIAL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invoice View / Print Modal */}
      {selectedInvoice && settings && (
        <InvoiceViewModal
          invoice={selectedInvoice}
          settings={settings}
          onClose={() => setSelectedInvoice(null)}
          onInvoiceCancelled={fetchData}
        />
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={fetchData}
      />
    </div>
  );
}

