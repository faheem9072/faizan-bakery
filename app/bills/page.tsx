'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Printer,
  Share2,
  Download,
  Filter,
  PlusCircle,
  Calendar,
  AlertCircle,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { Invoice, BusinessSetting } from '@/lib/types';
import InvoiceViewModal from '@/components/InvoiceViewModal';
import { openWhatsAppShare } from '@/lib/thermalPrinter';
import { downloadInvoicePdf } from '@/lib/pdfGenerator';

export default function BillsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<BusinessSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const [invRes, setRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/settings'),
      ]);
      const invData = await invRes.json();
      const setData = await setRes.json();

      if (Array.isArray(invData)) setInvoices(invData);
      setSettings(setData);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer?.shopName.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer?.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer?.mobileNumber.includes(search);
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalFilteredSales = filteredInvoices
    .filter((i) => i.status !== 'CANCELLED')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const totalFilteredDue = filteredInvoices
    .filter((i) => i.status !== 'CANCELLED')
    .reduce((sum, i) => sum + i.remainingAmount, 0);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Bills & Invoices Register</span>
            <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-200 text-slate-700 font-bold">
              {invoices.length} Bills
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            View, reprint, share on WhatsApp, or download official bakery invoices.
          </p>
        </div>

        <Link
          href="/billing"
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Bill</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Filtered Sales Total</p>
          <p className="text-lg font-black text-slate-900 mt-0.5">
            ₹{totalFilteredSales.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Pending Credit Due</p>
          <p className="text-lg font-black text-amber-700 mt-0.5">
            ₹{totalFilteredDue.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold text-slate-500">Total Bills Shown</p>
          <p className="text-lg font-black text-emerald-800 mt-0.5">
            {filteredInvoices.length} invoices
          </p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice #, shop name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto text-xs font-bold">
          {['All', 'PAID', 'PARTIAL', 'UNPAID', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading bills...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400 space-y-2">
            <Receipt className="w-8 h-8 mx-auto text-slate-300" />
            <p>No invoices match the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer / Shop</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Due Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      <div>
                        {new Date(inv.invoiceDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(inv.invoiceDate).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{inv.customer?.shopName}</div>
                      <div className="text-[11px] text-slate-500">
                        {inv.customer?.ownerName} • {inv.customer?.mobileNumber}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      ₹{inv.grandTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                      ₹{inv.paidAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-700">
                      ₹{inv.remainingAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800'
                            : inv.status === 'CANCELLED'
                            ? 'bg-slate-200 text-slate-700 line-through'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* Thermal Print / View */}
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                          title="View & Thermal Print"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* WhatsApp Share */}
                        {settings && (
                          <button
                            onClick={() => openWhatsAppShare(inv, settings)}
                            className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition"
                            title="Share on WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Download PDF */}
                        {settings && (
                          <button
                            onClick={() => downloadInvoicePdf(inv, settings)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && settings && (
        <InvoiceViewModal
          invoice={selectedInvoice}
          settings={settings}
          onClose={() => setSelectedInvoice(null)}
          onInvoiceCancelled={fetchInvoices}
        />
      )}
    </div>
  );
}

