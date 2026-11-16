'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  Bluetooth,
  Share2,
  Download,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import { Invoice, BusinessSetting } from '@/lib/types';
import ThermalReceipt from './ThermalReceipt';
import {
  printViaWebBluetooth,
  openWhatsAppShare,
  getAndroidRawBtUrl,
  generateReceiptText,
} from '@/lib/thermalPrinter';
import { downloadInvoicePdf } from '@/lib/pdfGenerator';

interface InvoiceViewModalProps {
  invoice: Invoice | null;
  settings: BusinessSetting;
  onClose: () => void;
  onInvoiceCancelled?: () => void;
}

export default function InvoiceViewModal({
  invoice,
  settings,
  onClose,
  onInvoiceCancelled,
}: InvoiceViewModalProps) {
  const [viewMode, setViewMode] = useState<'thermal' | 'full'>('thermal');
  const [widthMode, setWidthMode] = useState<'58mm' | '80mm'>(
    (settings?.thermalPrinterWidth as '58mm' | '80mm') || '58mm'
  );
  const [btStatus, setBtStatus] = useState<string>('');
  const [isPrintingBt, setIsPrintingBt] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  if (!invoice) return null;

  const handleBluetoothPrint = async () => {
    setIsPrintingBt(true);
    setBtStatus('Initializing Bluetooth...');
    const result = await printViaWebBluetooth(
      invoice,
      settings,
      widthMode,
      (status) => setBtStatus(status)
    );
    setIsPrintingBt(false);
    if (!result.success) {
      alert(result.message);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleCancelInvoice = async () => {
    if (!cancelReason.trim()) {
      alert('Please enter a cancellation reason.');
      return;
    }
    if (!confirm('Are you sure you want to cancel this bill? Stock and customer balance will be reversed.')) {
      return;
    }

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: cancelReason }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Invoice cancelled successfully. Balances and stocks have been reversed.');
        onInvoiceCancelled?.();
        onClose();
      } else {
        alert(data.error || 'Failed to cancel invoice.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCopyText = () => {
    const text = generateReceiptText(invoice, settings, widthMode);
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-900 text-base">
                Invoice {invoice.invoiceNumber}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  invoice.status === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : invoice.status === 'PARTIAL'
                    ? 'bg-amber-100 text-amber-800'
                    : invoice.status === 'CANCELLED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {invoice.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {new Date(invoice.invoiceDate).toLocaleString('en-IN')}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View & Printer Controls Bar */}
        <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs no-print">
          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('thermal')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                viewMode === 'thermal'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Thermal Slip
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                viewMode === 'full'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Modern Bill
            </button>
          </div>

          {viewMode === 'thermal' && (
            <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setWidthMode('58mm')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  widthMode === '58mm'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                58mm (2")
              </button>
              <button
                onClick={() => setWidthMode('80mm')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  widthMode === '80mm'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                80mm (3")
              </button>
            </div>
          )}
        </div>

        {/* Printable/Preview Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex justify-center">
          {viewMode === 'thermal' ? (
            <div className="w-full flex justify-center">
              <ThermalReceipt
                invoice={invoice}
                settings={settings}
                widthMode={widthMode}
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 max-w-lg w-full text-sm">
              <div className="border-b pb-3 mb-3">
                <h3 className="font-extrabold text-base text-slate-900">{settings.businessName}</h3>
                <p className="text-xs text-slate-500">{settings.address} | Ph: {settings.mobileNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div>
                  <p className="text-slate-400 font-semibold uppercase">Customer</p>
                  <p className="font-bold text-slate-800">{invoice.customer?.shopName}</p>
                  <p className="text-slate-600">{invoice.customer?.ownerName} - {invoice.customer?.mobileNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-semibold uppercase">Invoice #</p>
                  <p className="font-bold text-slate-800">{invoice.invoiceNumber}</p>
                  <p className="text-slate-600">{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              <table className="w-full text-xs mb-4">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold text-left">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-right">Qty</th>
                    <th className="py-1 text-right">Rate</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(invoice.items || []).map((item, i) => (
                    <tr key={i}>
                      <td className="py-1.5 font-medium text-slate-800">{item.productName}</td>
                      <td className="py-1.5 text-right text-slate-600">{item.quantity} {item.unit}</td>
                      <td className="py-1.5 text-right text-slate-600">₹{item.unitPrice.toFixed(0)}</td>
                      <td className="py-1.5 text-right font-semibold text-slate-900">₹{item.totalPrice.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t pt-2 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount:</span>
                    <span>-₹{invoice.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 font-extrabold text-sm border-t pt-1">
                  <span>Grand Total:</span>
                  <span>₹{invoice.grandTotal.toFixed(2)}</span>
                </div>
                <div className="border-t pt-1 space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Previous Balance:</span>
                    <span>₹{invoice.previousBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-emerald-700">
                    <span>Amount Paid:</span>
                    <span>₹{invoice.paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-slate-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <span>Total Outstanding Balance:</span>
                    <span className="text-amber-800">₹{invoice.totalOutstandingAfter.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2.5 no-print">
          {btStatus && (
            <div className="text-xs text-center py-1 px-2 rounded-lg bg-blue-50 text-blue-800 font-medium animate-pulse">
              {btStatus}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. Bluetooth Thermal Print */}
            <button
              onClick={handleBluetoothPrint}
              disabled={isPrintingBt}
              className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition"
            >
              <Bluetooth className="w-4 h-4" />
              <span>{isPrintingBt ? 'Printing...' : 'BT Thermal'}</span>
            </button>

            {/* 2. Browser Print */}
            <button
              onClick={handleBrowserPrint}
              className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm active:scale-95 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip</span>
            </button>

            {/* 3. WhatsApp Share */}
            <button
              onClick={() => openWhatsAppShare(invoice, settings)}
              className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            {/* 4. Download PDF */}
            <button
              onClick={() => downloadInvoicePdf(invoice, settings)}
              className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 active:scale-95 transition"
            >
              <Download className="w-4 h-4" />
              <span>PDF Bill</span>
            </button>
          </div>

          {/* Secondary Mobile Options (RawBT app link + text copy + Cancel invoice) */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center space-x-2">
              <a
                href={getAndroidRawBtUrl(invoice, settings, widthMode)}
                className="inline-flex items-center space-x-1 text-slate-600 hover:text-emerald-700 font-semibold"
                title="Print directly using Android RawBT app"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android RawBT</span>
              </a>

              <span className="text-slate-300">|</span>

              <button
                onClick={handleCopyText}
                className="inline-flex items-center space-x-1 text-slate-600 hover:text-slate-900 font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copySuccess ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            {invoice.status !== 'CANCELLED' && (
              <button
                onClick={() => setShowCancelPrompt(true)}
                className="text-rose-600 hover:text-rose-700 font-semibold text-xs flex items-center space-x-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Cancel Bill</span>
              </button>
            )}
          </div>

          {/* Cancel Invoice Modal Accordion */}
          {showCancelPrompt && (
            <div className="mt-2 p-3 bg-rose-50 rounded-xl border border-rose-200">
              <p className="text-xs font-bold text-rose-800 mb-1">
                Cancel Bill & Reverse Balances/Stock
              </p>
              <p className="text-[11px] text-rose-600 mb-2">
                This will restore inventory, reduce customer debt, and log an audit reversal transaction.
              </p>
              <input
                type="text"
                placeholder="Reason (e.g. customer returned order, entered wrong quantity)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-rose-300 bg-white mb-2"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowCancelPrompt(false)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleCancelInvoice}
                  disabled={isCancelling}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
                >
                  {isCancelling ? 'Processing...' : 'Confirm Reversal'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

