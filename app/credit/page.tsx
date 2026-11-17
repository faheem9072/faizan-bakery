'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  Filter,
  Share2,
  Wallet,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Receipt,
} from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';

export default function CreditManagementPage() {
  const [data, setData] = useState<{
    totalOutstanding: number;
    customerCount: number;
    customersWithBalanceCount: number;
    customers: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('all');
  const [search, setSearch] = useState('');
  const [paymentCustomer, setPaymentCustomer] = useState<any>(null);

  const fetchCreditData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/credit?range=${range}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error fetching credit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditData();
  }, [range]);

  const filteredCustomers = (data?.customers || []).filter(
    (c) =>
      c.shopName.toLowerCase().includes(search.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      c.mobileNumber.includes(search)
  );

  const sendWhatsAppReminder = (c: any) => {
    const text = `*🍞 FAIZAN BAKERY - PAYMENT REMINDER*\n\nDear *${c.shopName}* (${c.ownerName}),\n\nThis is a friendly reminder that your current outstanding balance with Faizan Bakery is *₹${c.currentOutstandingBalance.toFixed(2)}*.\n\nPlease arrange to clear the pending balance during today's delivery or pay via UPI.\n\nThank you for your continued partnership!`;
    const phone = c.mobileNumber.replace(/[^0-9]/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Credit & Outstanding Management</span>
            <span className="text-xs px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-bold">
              Ledger Balances
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Real-time bakery customer debts, pending invoices, and automated WhatsApp reminders.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-rose-50 to-white p-4 rounded-2xl border border-rose-200 shadow-sm">
          <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">
            Total Outstanding Balance
          </p>
          <p className="text-2xl font-bold text-rose-700 mt-1">
            ₹{(data?.totalOutstanding || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-rose-600 font-medium mt-1">
            Debt across {data?.customersWithBalanceCount || 0} customer bakeries
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Bakeries With Zero Balance
          </p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {(data?.customerCount || 0) - (data?.customersWithBalanceCount || 0)} Bakeries
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Fully settled accounts
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Registered Shops
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {data?.customerCount || 0} Accounts
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Active retail wholesale route
          </p>
        </div>
      </div>

      {/* Search & Period Filter Chips */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search Shahi Bakery, Cookies Bakery, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Range Filter */}
        <div className="flex items-center space-x-1.5 text-xs font-bold">
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 rounded-lg transition ${
                range === r.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Credit List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading credit ledger...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400 space-y-2">
            <CreditCard className="w-8 h-8 mx-auto text-slate-300" />
            <p>No customers match the search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Customer Shop</th>
                  <th className="py-3 px-4">Owner & Mobile</th>
                  <th className="py-3 px-4 text-right">Opening Bal</th>
                  <th className="py-3 px-4 text-right">Period Sales</th>
                  <th className="py-3 px-4 text-right">Period Paid</th>
                  <th className="py-3 px-4 text-right">Total Outstanding</th>
                  <th className="py-3 px-4 text-center">Unpaid Bills</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <Link
                        href={`/customers/${c.id}`}
                        className="hover:text-emerald-700 flex items-center gap-1 group"
                      >
                        <span>{c.shopName}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700" />
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{c.ownerName}</div>
                      <div className="text-[11px] text-slate-400">{c.mobileNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 font-medium">
                      ₹{c.openingBalance.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                      ₹{c.periodNewCredit.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-700">
                      ₹{c.periodPaymentsReceived.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-sm">
                      <span
                        className={
                          c.currentOutstandingBalance > 0
                            ? 'text-rose-700'
                            : 'text-emerald-700'
                        }
                      >
                        ₹{c.currentOutstandingBalance.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-slate-700">
                        {c.pendingInvoicesCount} pending
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* WhatsApp Reminder */}
                        {c.currentOutstandingBalance > 0 && (
                          <button
                            onClick={() => sendWhatsAppReminder(c)}
                            className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition"
                            title="Send WhatsApp Reminder"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Collect Payment */}
                        <button
                          onClick={() => setPaymentCustomer(c)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm flex items-center space-x-1"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Pay</span>
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

      {/* Collect Payment Modal */}
      <PaymentModal
        isOpen={!!paymentCustomer}
        preselectedCustomer={paymentCustomer}
        onClose={() => setPaymentCustomer(null)}
        onPaymentSuccess={fetchCreditData}
      />
    </div>
  );
}

