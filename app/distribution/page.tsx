'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Calendar,
  Search,
  Printer,
  Boxes,
  Users2,
  Receipt,
  Download,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

export default function DistributionPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [data, setData] = useState<{
    date: string;
    summary: {
      totalShopsVisited: number;
      totalSales: number;
      totalCollected: number;
      totalCreditAdded: number;
      totalItemsDispatched: number;
    };
    customerDeliveries: any[];
    productSummaries: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState<'customers' | 'products'>('customers');

  const fetchDistribution = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/distribution?date=${selectedDate}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error fetching distribution:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistribution();
  }, [selectedDate]);

  const handlePrintSheet = () => {
    window.print();
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Daily Distribution Register</span>
            <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
              Dispatch Sheet
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Daily shop-by-shop deliveries, supplied quantities, and product aggregates.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <button
            onClick={handlePrintSheet}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center space-x-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Register</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Shops Supplied Today</p>
          <p className="text-lg font-black text-slate-900 mt-0.5">
            {data?.summary?.totalShopsVisited || 0} Bakeries
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Total Billed Today</p>
          <p className="text-lg font-black text-emerald-800 mt-0.5">
            ₹{(data?.summary?.totalSales || 0).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Collected Cash / UPI</p>
          <p className="text-lg font-black text-blue-700 mt-0.5">
            ₹{(data?.summary?.totalCollected || 0).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">New Credit Added</p>
          <p className="text-lg font-black text-amber-700 mt-0.5">
            ₹{(data?.summary?.totalCreditAdded || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Toggle View Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 text-xs font-bold no-print">
        <button
          onClick={() => setViewTab('customers')}
          className={`px-3.5 py-1.5 rounded-lg transition ${
            viewTab === 'customers'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Customer-wise Deliveries ({data?.customerDeliveries?.length || 0})
        </button>

        <button
          onClick={() => setViewTab('products')}
          className={`px-3.5 py-1.5 rounded-lg transition ${
            viewTab === 'products'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Product-wise Dispatch Totals ({data?.productSummaries?.length || 0})
        </button>
      </div>

      {/* TAB 1: Customer-wise Deliveries */}
      {viewTab === 'customers' && (
        <div className="space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border">
              Loading distribution data...
            </div>
          ) : (data?.customerDeliveries || []).length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400 bg-white rounded-2xl border space-y-2">
              <Truck className="w-8 h-8 mx-auto text-slate-300" />
              <p>No bakery deliveries recorded for {selectedDate}.</p>
              <Link href="/billing" className="text-xs font-bold text-emerald-700 hover:underline">
                + Create Bill for Delivery
              </Link>
            </div>
          ) : (
            (data?.customerDeliveries || []).map((delivery, i) => (
              <div
                key={delivery.invoiceId}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <h3 className="font-extrabold text-sm text-slate-900">
                        {delivery.customer.shopName}
                      </h3>
                      <span className="text-xs text-slate-500">
                        ({delivery.customer.ownerName} - {delivery.customer.mobileNumber})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 ml-7">
                      Bill #{delivery.invoiceNumber} • {delivery.customer.address}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 text-xs ml-7 sm:ml-0">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Total Bill
                      </span>
                      <span className="font-black text-slate-900 text-sm">
                        ₹{delivery.grandTotal.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Collected
                      </span>
                      <span className="font-bold text-emerald-700">
                        ₹{delivery.paidAmount.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Credit Added
                      </span>
                      <span className="font-bold text-amber-800">
                        ₹{delivery.creditAdded.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items Supplied Chips / Grid */}
                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Supplied Products:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {delivery.items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-slate-800">{item.productName}</span>
                        <div className="text-right">
                          <span className="font-black text-emerald-800">
                            {item.quantity} {item.unit}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            (₹{item.totalPrice.toFixed(0)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Product-wise Aggregates */}
      {viewTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Total Dispatch Quantities on {selectedDate}
            </h3>
            <span className="text-xs text-slate-500">
              Aggregated across all delivery vans & routes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4 text-right">Total Quantity Supplied</th>
                  <th className="py-3 px-4 text-right">Total Revenue (₹)</th>
                  <th className="py-3 px-4 text-center">Shops Supplied</th>
                  <th className="py-3 px-4">Destination Bakeries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.productSummaries || []).map((p) => (
                  <tr key={p.productId} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.productName}</td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-800 text-sm">
                      {p.totalQuantity} {p.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ₹{p.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {p.shopsCount} shops
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {p.shopNames.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

