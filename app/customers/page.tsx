'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users2,
  Search,
  PlusCircle,
  Phone,
  MapPin,
  Wallet,
  Receipt,
  Share2,
  Edit,
  ExternalLink,
  CreditCard,
} from 'lucide-react';
import { Customer } from '@/lib/types';
import CustomerModal from '@/components/CustomerModal';
import PaymentModal from '@/components/PaymentModal';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hasBalanceOnly, setHasBalanceOnly] = useState(false);

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (Array.isArray(data)) setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.shopName.toLowerCase().includes(search.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      c.mobileNumber.includes(search) ||
      (c.address && c.address.toLowerCase().includes(search.toLowerCase()));
    const matchesBal = !hasBalanceOnly || c.currentOutstandingBalance > 0;
    return matchesSearch && matchesBal;
  });

  const totalOutstandingAll = customers.reduce(
    (sum, c) => sum + c.currentOutstandingBalance,
    0
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Customer & Bakery Shops</span>
            <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
              {customers.length} Shops
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Wholesale bakery accounts, delivery routes, and credit tracking.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setIsCustomerModalOpen(true);
          }}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Total Customer Credit</p>
          <p className="text-lg font-black text-rose-700 mt-0.5">
            ₹{totalOutstandingAll.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Bakeries With Pending Dues</p>
          <p className="text-lg font-black text-amber-700 mt-0.5">
            {customers.filter((c) => c.currentOutstandingBalance > 0).length} of {customers.length}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold text-slate-500">Active Distribution Accounts</p>
          <p className="text-lg font-black text-emerald-800 mt-0.5">
            {customers.filter((c) => c.status === 'ACTIVE').length} shops
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search Shahi Bakery, Cookies Bakery, owner, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={hasBalanceOnly}
              onChange={(e) => setHasBalanceOnly(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <span>Show Outstanding Dues Only</span>
          </label>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {loading ? (
          <div className="col-span-full p-8 text-center text-xs text-slate-400">
            Loading customer bakeries...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-full p-10 text-center text-xs text-slate-400 space-y-2">
            <Users2 className="w-8 h-8 mx-auto text-slate-300" />
            <p>No customers match the criteria.</p>
          </div>
        ) : (
          filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/customers/${cust.id}`}
                      className="font-extrabold text-sm text-slate-900 hover:text-emerald-700 flex items-center gap-1 group"
                    >
                      <span>{cust.shopName}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
                    </Link>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Proprietor: {cust.ownerName}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingCustomer(cust);
                      setIsCustomerModalOpen(true);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    title="Edit Customer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Details */}
                <div className="mt-2.5 space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cust.mobileNumber}</span>
                  </div>
                  {cust.address && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{cust.address}</span>
                    </div>
                  )}
                  {cust.creditLimit && (
                    <div className="text-[11px] text-slate-400">
                      Credit Limit: ₹{cust.creditLimit.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Box & Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/70">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Outstanding Due
                    </span>
                    <span className="text-sm font-black text-rose-700">
                      ₹{cust.currentOutstandingBalance.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Bills Created
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {cust._count?.invoices || 0} orders
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setPaymentCustomer(cust)}
                    className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Collect Pay</span>
                  </button>

                  <Link
                    href={`/customers/${cust.id}`}
                    className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center space-x-1 transition text-center"
                  >
                    <span>View Ledger</span>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Add / Edit Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        customer={editingCustomer}
        onClose={() => setIsCustomerModalOpen(false)}
        onSaved={fetchCustomers}
      />

      {/* Collect Payment Modal */}
      <PaymentModal
        isOpen={!!paymentCustomer}
        preselectedCustomer={paymentCustomer}
        onClose={() => setPaymentCustomer(null)}
        onPaymentSuccess={fetchCustomers}
      />
    </div>
  );
}

