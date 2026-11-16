'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  Printer,
  CreditCard,
  CheckCircle2,
  Save,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import { BusinessSetting } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<BusinessSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [businessName, setBusinessName] = useState('FAIZAN BAKERY');
  const [tagline, setTagline] = useState('Wholesale & Daily Distribution');
  const [address, setAddress] = useState('Main Road, Market Complex, Opp. Bus Stand');
  const [mobileNumber, setMobileNumber] = useState('+91 98765 43210');
  const [gstNumber, setGstNumber] = useState('32ABCDE1234F1Z5');
  const [invoicePrefix, setInvoicePrefix] = useState('FZ-');
  const [currency, setCurrency] = useState('₹');
  const [thermalPrinterWidth, setThermalPrinterWidth] = useState<'58mm' | '80mm'>('58mm');
  const [upiId, setUpiId] = useState('faizanbakery@upi');
  const [upiName, setUpiName] = useState('Faizan Bakery');
  const [allowNegativeStock, setAllowNegativeStock] = useState(true);
  const [invoiceFooterNote, setInvoiceFooterNote] = useState('Thank you for your business! Fresh & Sweet Daily.');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data && !data.error) {
        setSettings(data);
        setBusinessName(data.businessName || 'FAIZAN BAKERY');
        setTagline(data.tagline || '');
        setAddress(data.address || '');
        setMobileNumber(data.mobileNumber || '');
        setGstNumber(data.gstNumber || '');
        setInvoicePrefix(data.invoicePrefix || 'FZ-');
        setCurrency(data.currency || '₹');
        setThermalPrinterWidth(data.thermalPrinterWidth || '58mm');
        setUpiId(data.upiId || '');
        setUpiName(data.upiName || '');
        setAllowNegativeStock(data.allowNegativeStock ?? true);
        setInvoiceFooterNote(data.invoiceFooterNote || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          tagline,
          address,
          mobileNumber,
          gstNumber,
          invoicePrefix,
          currency,
          thermalPrinterWidth,
          upiId,
          upiName,
          allowNegativeStock,
          invoiceFooterNote,
        }),
      });

      if (res.ok) {
        setSuccessMsg('Settings updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert('Failed to update settings');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">Loading settings...</div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>Business & Printer Settings</span>
          <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
            Config
          </span>
        </h1>
        <p className="text-xs text-slate-500">
          Configure Faizan Bakery business profile, Bluetooth printer roll size, and UPI payment details.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Business Profile */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Store className="w-4 h-4 text-emerald-700" />
            <h3 className="font-extrabold text-sm text-slate-900">Bakery Business Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Business Name *</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tagline / Subheading</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Mobile Number *</label>
              <input
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">GSTIN (Optional)</label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Business Address *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Thermal Printer & Invoice Configuration */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Printer className="w-4 h-4 text-emerald-700" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Thermal Printer & Billing Configuration
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Default Thermal Printer Paper Width *
              </label>
              <select
                value={thermalPrinterWidth}
                onChange={(e) => setThermalPrinterWidth(e.target.value as '58mm' | '80mm')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
              >
                <option value="58mm">58mm (2-inch compact delivery slip - 32 characters)</option>
                <option value="80mm">80mm (3-inch wide receipt - 48 characters)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Most portable Bluetooth printers used on delivery vans use 58mm roll paper.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Invoice Number Prefix</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Example: FZ- will generate FZ-2026-0001
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Receipt Footer Greeting Note
              </label>
              <input
                type="text"
                value={invoiceFooterNote}
                onChange={(e) => setInvoiceFooterNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Digital Payments & UPI QR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <CreditCard className="w-4 h-4 text-emerald-700" />
            <h3 className="font-extrabold text-sm text-slate-900">
              UPI & Digital Payment Credentials
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Bakery UPI ID *</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. faizanbakery@upi"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Printed on bills so shops can scan or pay instantly via GPay, PhonePe, Paytm.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">UPI Payee Display Name</label>
              <input
                type="text"
                value={upiName}
                onChange={(e) => setUpiName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Inventory Policies */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Boxes className="w-4 h-4 text-emerald-700" />
            <h3 className="font-extrabold text-sm text-slate-900">Inventory Rules</h3>
          </div>

          <div className="flex items-start space-x-2.5 pt-1 text-xs">
            <input
              type="checkbox"
              id="allowNegativeStock"
              checked={allowNegativeStock}
              onChange={(e) => setAllowNegativeStock(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
            />
            <div>
              <label htmlFor="allowNegativeStock" className="font-bold text-slate-800 cursor-pointer">
                Allow Negative Stock During Fast Wholesale Dispatch
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Recommended for bakeries when fresh morning batches are dispatched before stock is
                manually keyed into the system.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm shadow-md shadow-emerald-600/30 flex items-center space-x-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

