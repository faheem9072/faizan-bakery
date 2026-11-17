'use client';

import React, { useState, useEffect } from 'react';
import {
  WalletCards,
  Search,
  PlusCircle,
  Calendar,
  CheckCircle2,
  Printer,
  Download,
  Receipt,
  User,
  ArrowDownLeft,
} from 'lucide-react';
import { Payment } from '@/lib/types';
import PaymentModal from '@/components/PaymentModal';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payments');
      const data = await res.json();
      if (Array.isArray(data)) setPayments(data);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.customer?.shopName.toLowerCase().includes(search.toLowerCase()) ||
      p.customer?.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      (p.transactionReference && p.transactionReference.toLowerCase().includes(search.toLowerCase()));
    const matchesMethod = methodFilter === 'All' || p.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const printReceipt = (p: Payment) => {
    const receiptContent = `
========================================
             FAIZAN BAKERY
       OFFICIAL PAYMENT RECEIPT
========================================
Receipt No: ${p.receiptNumber}
Date & Time: ${new Date(p.paymentDate).toLocaleString('en-IN')}
----------------------------------------
Received From: ${p.customer?.shopName}
Owner: ${p.customer?.ownerName}
Mobile: ${p.customer?.mobileNumber}
----------------------------------------
Amount Received: ₹${p.amount.toFixed(2)}
Payment Method : ${p.paymentMethod}
Reference/UTR  : ${p.transactionReference || 'N/A'}
Notes          : ${p.notes || '-'}
----------------------------------------
Current Outstanding Balance: ₹${p.customer?.currentOutstandingBalance.toFixed(2)}
========================================
       Thank you for your payment!
========================================
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt ${p.receiptNumber}</title>
            <style>
              body { font-family: monospace; font-size: 13px; padding: 20px; white-space: pre-wrap; }
            </style>
          </head>
          <body>${receiptContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 300);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Payment Collections</span>
            <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
              {payments.length} Receipts
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Record customer collections, cash, UPI, bank transfers, and print receipts.
          </p>
        </div>

        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Total Filtered Collection</p>
          <p className="text-xl font-bold text-emerald-800 mt-0.5">
            ₹{totalCollected.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Cash Collections</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">
            ₹
            {filteredPayments
              .filter((p) => p.paymentMethod === 'CASH')
              .reduce((s, p) => s + p.amount, 0)
              .toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">UPI / Bank Collections</p>
          <p className="text-xl font-bold text-blue-700 mt-0.5">
            ₹
            {filteredPayments
              .filter((p) => p.paymentMethod !== 'CASH')
              .reduce((s, p) => s + p.amount, 0)
              .toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by receipt #, customer, UTR reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Method Filter */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto text-xs font-bold">
          {['All', 'CASH', 'UPI', 'BANK_TRANSFER'].map((method) => (
            <button
              key={method}
              onClick={() => setMethodFilter(method)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                methodFilter === method
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {method === 'BANK_TRANSFER' ? 'Bank' : method}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading payments...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400 space-y-2">
            <WalletCards className="w-8 h-8 mx-auto text-slate-300" />
            <p>No payment collections recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer / Bakery</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4 text-right">Amount Received</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(p.paymentDate).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{p.customer?.shopName}</div>
                      <div className="text-[11px] text-slate-500">{p.customer?.ownerName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.paymentMethod === 'CASH'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.paymentMethod === 'UPI'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {p.transactionReference || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700 text-sm">
                      ₹{p.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => printReceipt(p)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                        title="Print Payment Slip"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={fetchPayments}
      />
    </div>
  );
}

