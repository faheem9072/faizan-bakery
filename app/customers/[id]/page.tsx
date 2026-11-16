'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Wallet,
  Receipt,
  Printer,
  Calendar,
  Share2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Customer, Invoice, Payment, CustomerTransaction, BusinessSetting } from '@/lib/types';
import InvoiceViewModal from '@/components/InvoiceViewModal';
import PaymentModal from '@/components/PaymentModal';

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<(Customer & {
    invoices: Invoice[];
    payments: Payment[];
    transactions: CustomerTransaction[];
  }) | null>(null);
  const [settings, setSettings] = useState<BusinessSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ledger' | 'bills' | 'payments'>('ledger');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const [custRes, setRes] = await Promise.all([
        fetch(`/api/customers/${customerId}`),
        fetch('/api/settings'),
      ]);
      const custData = await custRes.json();
      const setData = await setRes.json();

      setCustomer(custData);
      setSettings(setData);
    } catch (err) {
      console.error('Error fetching customer details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) fetchCustomerData();
  }, [customerId]);

  if (loading || !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-2">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500">Loading Bakery Account...</p>
      </div>
    );
  }

  // Calculate totals
  const totalPurchases = (customer.invoices || [])
    .filter((i) => i.status !== 'CANCELLED')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const totalPaymentsMade = (customer.payments || []).reduce(
    (sum, p) => sum + p.amount,
    0
  );

  const handleShareStatement = () => {
    const text = `*🍞 FAIZAN BAKERY - CUSTOMER STATEMENT*\n\n*Customer:* ${customer.shopName} (${customer.ownerName})\n*Total Purchases:* ₹${totalPurchases.toFixed(2)}\n*Total Payments:* ₹${totalPaymentsMade.toFixed(2)}\n*Current Outstanding Balance:* *₹${customer.currentOutstandingBalance.toFixed(2)}*\n\nThank you for doing business with us!`;
    const phone = customer.mobileNumber.replace(/[^0-9]/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>
      </div>

      {/* Customer Profile Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                Bakery Account
              </span>
              <span className="text-xs text-slate-400">ID: {customer.id.slice(0, 8)}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {customer.shopName}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
              Owner: {customer.ownerName}
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {customer.mobileNumber}
              </span>
              {customer.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {customer.address}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleShareStatement}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 transition flex items-center space-x-1"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp Ledger</span>
            </button>

            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition flex items-center space-x-1.5"
            >
              <Wallet className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Opening Balance</span>
            <p className="text-base font-black text-slate-800 mt-0.5">
              ₹{customer.openingBalance.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Sales Billed</span>
            <p className="text-base font-black text-slate-800 mt-0.5">
              ₹{totalPurchases.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Payments</span>
            <p className="text-base font-black text-emerald-700 mt-0.5">
              ₹{totalPaymentsMade.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
            <span className="text-[11px] font-bold text-rose-600 uppercase">Net Outstanding Due</span>
            <p className="text-base font-black text-rose-700 mt-0.5">
              ₹{customer.currentOutstandingBalance.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-3.5 py-1.5 rounded-lg transition ${
            activeTab === 'ledger'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Transaction Ledger ({customer.transactions?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`px-3.5 py-1.5 rounded-lg transition ${
            activeTab === 'bills'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Bills & Invoices ({customer.invoices?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3.5 py-1.5 rounded-lg transition ${
            activeTab === 'payments'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Payment History ({customer.payments?.length || 0})
        </button>
      </div>

      {/* Tab 1: Complete Transaction Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
              Complete Account Statement (Running Balance)
            </h3>
            <span className="text-xs text-slate-500">
              Debits increase customer debt • Credits reduce customer debt
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Ref #</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Debit (+)</th>
                  <th className="py-2.5 px-4 text-right">Credit (-)</th>
                  <th className="py-2.5 px-4 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(customer.transactions || []).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.type === 'INVOICE'
                            ? 'bg-blue-100 text-blue-800'
                            : t.type === 'PAYMENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.type === 'INVOICE_CANCELLED'
                            ? 'bg-rose-100 text-rose-800 line-through'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {t.referenceNumber || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs">{t.description}</td>
                    <td className="py-3 px-4 text-right font-black text-rose-700">
                      {t.debit > 0 ? `₹${t.debit.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700">
                      {t.credit > 0 ? `₹${t.credit.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      ₹{t.balanceAfter.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Invoices List */}
      {activeTab === 'bills' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Items Count</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(customer.invoices || []).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {inv.items?.length || 0} products
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      ₹{inv.grandTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      ₹{inv.paidAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-700">
                      ₹{inv.remainingAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        title="Print / View"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Payments History */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(customer.payments || []).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(p.paymentDate).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {p.transactionReference || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700">
                      ₹{p.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{p.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice View Modal */}
      {selectedInvoice && settings && (
        <InvoiceViewModal
          invoice={selectedInvoice}
          settings={settings}
          onClose={() => setSelectedInvoice(null)}
          onInvoiceCancelled={fetchCustomerData}
        />
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        preselectedCustomer={customer}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={fetchCustomerData}
      />
    </div>
  );
}

