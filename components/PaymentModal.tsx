'use client';

import React, { useState, useEffect } from 'react';
import { X, Wallet, CheckCircle2, UserCheck } from 'lucide-react';
import { Customer, Invoice } from '@/lib/types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  preselectedCustomer?: Customer | null;
  preselectedInvoice?: Invoice | null;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  preselectedCustomer,
  preselectedInvoice,
}: PaymentModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/customers?status=ACTIVE')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setCustomers(data);
        })
        .catch(console.error);

      if (preselectedCustomer) {
        setCustomerId(preselectedCustomer.id);
        if (preselectedCustomer.currentOutstandingBalance > 0) {
          setAmount(preselectedCustomer.currentOutstandingBalance.toString());
        }
      } else if (preselectedInvoice) {
        setCustomerId(preselectedInvoice.customerId);
        setAmount(preselectedInvoice.remainingAmount.toString());
      }
    }
  }, [isOpen, preselectedCustomer, preselectedInvoice]);

  if (!isOpen) return null;

  const selectedCust = customers.find((c) => c.id === customerId) || preselectedCustomer;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          invoiceId: preselectedInvoice?.id || null,
          amount: numAmount,
          paymentMethod,
          transactionReference,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Payment of ₹${numAmount} recorded successfully! Receipt #${data.receiptNumber}`);
        onPaymentSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to record payment.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Record Payment</h3>
              <p className="text-[11px] text-slate-500">Collect cash, UPI, or bank transfer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Customer / Bakery *
            </label>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                const c = customers.find((cust) => cust.id === e.target.value);
                if (c && c.currentOutstandingBalance > 0 && !amount) {
                  setAmount(c.currentOutstandingBalance.toString());
                }
              }}
              disabled={!!preselectedCustomer || !!preselectedInvoice}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.shopName} ({c.ownerName}) - Due: ₹{c.currentOutstandingBalance.toFixed(0)}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Balance Notice */}
          {selectedCust && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-xs">
              <span className="text-emerald-900 font-semibold">Current Outstanding Balance:</span>
              <span className="font-semibold text-emerald-800 text-sm">
                ₹{selectedCust.currentOutstandingBalance.toFixed(2)}
              </span>
            </div>
          )}

          {/* Payment Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Amount Received (₹) *
            </label>
            <input
              type="number"
              step="any"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              required
              className="w-full text-sm font-bold px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {['CASH', 'UPI', 'BANK_TRANSFER'].map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                    paymentMethod === method
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {method === 'BANK_TRANSFER' ? 'Bank' : method}
                </button>
              ))}
            </div>
          </div>

          {/* Reference / UTR */}
          {paymentMethod !== 'CASH' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                UPI Reference / UTR Number
              </label>
              <input
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="e.g. UPI-92817291829"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Morning delivery collection"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Save Payment & Update Balance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

