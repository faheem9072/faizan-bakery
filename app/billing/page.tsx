'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Receipt,
  User,
  ShoppingBag,
  Sparkles,
  Printer,
  ChevronDown,
  ArrowRight,
  Layers,
  Phone,
  MapPin,
  AlertCircle,
  Store,
  Factory,
} from 'lucide-react';
import { Customer, Product, Invoice, BusinessSetting } from '@/lib/types';
import InvoiceViewModal from '@/components/InvoiceViewModal';
import CustomerModal from '@/components/CustomerModal';
import ProductModal from '@/components/ProductModal';

interface BillItem {
  productId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  currentStock: number;
  sourceType?: string;
  vendorShopName?: string | null;
}

export default function BillingPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<BusinessSetting | null>(null);

  // Billing state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // Product selection & filtering
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'IN_HOUSE' | 'OUTSIDE_PURCHASE'>('ALL');
  const [productCategory, setProductCategory] = useState<string>('All');
  const [productSearch, setProductSearch] = useState<string>('');
  const [items, setItems] = useState<BillItem[]>([]);

  // Financial calculations
  const [discount, setDiscount] = useState<string>('0');
  const [paidAmount, setPaidAmount] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [notes, setNotes] = useState<string>('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const [custRes, prodRes, setRes] = await Promise.all([
        fetch('/api/customers?status=ACTIVE'),
        fetch('/api/products?activeOnly=true'),
        fetch('/api/settings'),
      ]);
      const custData = await custRes.json();
      const prodData = await prodRes.json();
      const setData = await setRes.json();

      if (Array.isArray(custData)) setCustomers(custData);
      if (Array.isArray(prodData)) setProducts(prodData);
      setSettings(setData);
    } catch (err) {
      console.error('Error loading billing data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Filtered customer list for search
  const filteredCustomers = customers.filter(
    (c) =>
      c.shopName.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.mobileNumber.includes(customerSearch)
  );

  // Filtered products
  const categories = ['All', 'Sweets', 'Cakes', 'Halwa', 'Snacks'];
  const filteredProducts = products.filter((p) => {
    const matchesSource =
      sourceFilter === 'ALL' || (p.sourceType || 'IN_HOUSE') === sourceFilter;
    const matchesCat =
      productCategory === 'All' || p.category.toLowerCase() === productCategory.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.vendorShopName && p.vendorShopName.toLowerCase().includes(productSearch.toLowerCase()));
    return matchesSource && matchesCat && matchesSearch;
  });

  // Add product to bill or increment quantity
  const handleAddProduct = (prod: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === prod.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === prod.id
            ? { ...item, quantity: item.quantity + (prod.defaultQuantity || 1) }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: prod.id,
          name: prod.name,
          unit: prod.unit,
          unitPrice: prod.sellingPrice,
          quantity: prod.defaultQuantity || 1,
          currentStock: prod.currentStock,
          sourceType: prod.sourceType,
          vendorShopName: prod.vendorShopName,
        },
      ];
    });
  };

  const updateItemQty = (productId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = Math.max(0.1, item.quantity + delta);
            return { ...item, quantity: parseFloat(newQty.toFixed(2)) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const updateItemPrice = (productId: string, newPrice: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, unitPrice: newPrice } : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountNum = Math.max(0, parseFloat(discount || '0'));
  const grandTotal = Math.max(0, subtotal - discountNum);
  const paidNum = Math.max(0, parseFloat(paidAmount || '0'));
  const currentBillDue = Math.max(0, grandTotal - paidNum);
  const previousBalance = selectedCustomer?.currentOutstandingBalance || 0;
  const netTotalOutstanding = previousBalance + currentBillDue;

  // Save Bill
  const handleSaveBill = async () => {
    if (!selectedCustomerId) {
      alert('Please select a Customer / Bakery first (കട തിരഞ്ഞെടുക്കുക).');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one bakery product to the bill.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          discount: discountNum,
          paidAmount: paidNum,
          paymentMethod,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCreatedInvoice(data);
        loadData();
      } else {
        alert(data.error || 'Failed to save bill.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred while saving bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset bill form for next order
  const handleResetForNewBill = () => {
    setCreatedInvoice(null);
    setItems([]);
    setDiscount('0');
    setPaidAmount('0');
    setNotes('');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Digital Billing POS (ബില്ലിംഗ്)</span>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 rounded-lg">
              Faizan Wholesale
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Simple 1-tap mobile wholesale billing with Bluetooth thermal print support.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={() => setItems([])}
            className="text-xs text-rose-600 font-bold hover:underline"
          >
            Clear Items
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Customer Selection & Product Catalog (7 Cols on Desktop) */}
        <div className="lg:col-span-7 space-y-4">
          {/* STEP 1: Customer Selection */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>1. Select Customer Shop (കട തിരഞ്ഞെടുക്കുക) *</span>
              </label>
              <button
                onClick={() => setIsNewCustomerModalOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Shop</span>
              </button>
            </div>

            {/* Selected Customer View or Search Box */}
            {selectedCustomer ? (
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base text-slate-900">
                      {selectedCustomer.shopName}
                    </span>
                    <span className="text-xs text-emerald-800 font-bold">
                      ({selectedCustomer.ownerName})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedCustomer.mobileNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {selectedCustomer.address}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Previous Due (പഴയ ബാക്കി)
                    </span>
                    <span className="text-sm font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      ₹{selectedCustomer.currentOutstandingBalance.toFixed(0)}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedCustomerId('')}
                    className="text-xs font-bold text-slate-500 hover:text-rose-600 px-2.5 py-1.5 bg-white rounded-lg border border-slate-200"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Shahi Bakery, Cookies Bakery, or phone..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Dropdown Results */}
                {isCustomerDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto z-20 divide-y divide-slate-100">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center">
                        No customer found. Click "+ New Shop" to add one.
                      </div>
                    ) : (
                      filteredCustomers.map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => {
                            setSelectedCustomerId(cust.id);
                            setIsCustomerDropdownOpen(false);
                            setCustomerSearch('');
                          }}
                          className="p-3 hover:bg-emerald-50 cursor-pointer flex items-center justify-between transition"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">{cust.shopName}</p>
                            <p className="text-[11px] text-slate-500">
                              {cust.ownerName} • {cust.mobileNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">
                              Due
                            </span>
                            <p className="text-xs font-bold text-rose-700">
                              ₹{cust.currentOutstandingBalance.toFixed(0)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: Product Catalog & Quick Selection Grid */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                <span>2. Select Products (സാധനങ്ങൾ ചേർക്കുക)</span>
              </label>

              {/* Add Product Shortcut */}
              <button
                onClick={() => setIsNewProductModalOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Outside/New Product</span>
              </button>
            </div>

            {/* SOURCE FILTER & SEARCH ROW */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              {/* Quick Source Filter: All / Own Bake / Other Shops */}
              <div className="flex items-center space-x-1.5 w-full sm:w-auto text-xs font-bold overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSourceFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    sourceFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Items
                </button>
                <button
                  type="button"
                  onClick={() => setSourceFilter('IN_HOUSE')}
                  className={`px-3 py-1.5 rounded-xl flex items-center space-x-1 transition ${
                    sourceFilter === 'IN_HOUSE'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <Factory className="w-3.5 h-3.5" />
                  <span>Own Bake</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceFilter('OUTSIDE_PURCHASE')}
                  className={`px-3 py-1.5 rounded-xl flex items-center space-x-1 transition ${
                    sourceFilter === 'OUTSIDE_PURCHASE'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Other Shops (മറ്റ് കടകൾ)</span>
                </button>
              </div>

              {/* Product Search */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item or shop name..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Product Cards Grid (Touch-friendly for delivery staff) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto p-1">
              {filteredProducts.map((prod) => {
                const inCart = items.find((i) => i.productId === prod.id);
                const isOutside = prod.sourceType === 'OUTSIDE_PURCHASE';

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleAddProduct(prod)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all active:scale-95 flex flex-col justify-between ${
                      inCart
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500'
                        : isOutside
                        ? 'border-amber-200 bg-amber-50/40 hover:bg-white'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        {isOutside ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 truncate max-w-[100px]">
                            🛒 {prod.vendorShopName || 'Other Shop'}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            {prod.category}
                          </span>
                        )}

                        {inCart && (
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-semibold flex items-center justify-center shadow-sm">
                            {inCart.quantity}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-xs text-slate-900 mt-0.5 line-clamp-1">
                        {prod.name}
                      </h4>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-emerald-800">
                          ₹{prod.sellingPrice}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium ml-1">
                          /{prod.unit}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {prod.currentStock} in stock
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Bill Cart, Calculations & Save (5 Cols on Desktop) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-emerald-700" />
                <h3 className="font-semibold text-sm text-slate-900">Current Bill (ബിൽ)</h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Items List */}
            <div className="p-4 flex-1 max-h-[300px] overflow-y-auto divide-y divide-slate-100">
              {items.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 space-y-2">
                  <ShoppingBag className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">ബില്ലിൽ സാധനങ്ങൾ ചേർക്കുക</p>
                  <p className="text-[11px] text-slate-400">
                    Tap any item from the left to add to bill.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.productId} className="py-2.5 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-900">
                          {item.name}
                        </span>
                        {item.sourceType === 'OUTSIDE_PURCHASE' && (
                          <span className="text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-800">
                            🛒 {item.vendorShopName || 'Outside'}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-slate-300 hover:text-rose-600 p-0.5 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Qty Stepper */}
                      <div className="flex items-center space-x-1.5 bg-slate-100 px-2 py-1 rounded-lg">
                        <button
                          onClick={() => updateItemQty(item.productId, -1)}
                          className="w-5 h-5 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs px-1 text-slate-800">
                          {item.quantity} {item.unit}
                        </span>
                        <button
                          onClick={() => updateItemQty(item.productId, 1)}
                          className="w-5 h-5 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Editable Wholesale Rate */}
                      <div className="flex items-center space-x-1 text-xs">
                        <span className="text-slate-400">@ ₹</span>
                        <input
                          type="number"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItemPrice(item.productId, parseFloat(e.target.value) || 0)
                          }
                          className="w-14 text-center font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-1 py-0.5"
                          title="Custom wholesale rate"
                        />
                      </div>

                      {/* Line Total */}
                      <span className="font-bold text-xs text-slate-900">
                        ₹{(item.quantity * item.unitPrice).toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Payment Breakdown */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-200 space-y-2.5 text-xs">
              {/* Subtotal */}
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal (ആകെ):</span>
                <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Discount (കിഴിവ് ₹):</span>
                <input
                  type="number"
                  step="any"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  className="w-24 text-right px-2 py-1 rounded-lg border border-slate-300 font-bold text-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center text-sm font-bold text-slate-900 border-t pt-2">
                <span>Grand Total (ബിൽ തുക):</span>
                <span className="text-lg text-emerald-800">₹{grandTotal.toFixed(2)}</span>
              </div>

              {/* Payment Entry */}
              <div className="pt-2 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Amount Paid (ലഭിച്ച പണം ₹):</span>
                  <input
                    type="number"
                    step="any"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0"
                    className="w-28 text-right font-bold text-base px-2.5 py-1.5 rounded-xl border-2 border-emerald-500 bg-white focus:outline-none"
                  />
                </div>

                {/* Quick Payment Preset Chips */}
                <div className="flex items-center space-x-1.5 overflow-x-auto text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPaidAmount(grandTotal.toString())}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
                  >
                    Full Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaidAmount('500')}
                    className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                  >
                    ₹500
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaidAmount('1000')}
                    className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                  >
                    ₹1,000
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaidAmount('0')}
                    className="px-2 py-1 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 transition"
                  >
                    Credit (₹0)
                  </button>
                </div>

                {/* Payment Method */}
                {paidNum > 0 && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-600 font-medium">Method:</span>
                    <div className="flex space-x-1">
                      {['CASH', 'UPI', 'BANK_TRANSFER'].map((m) => (
                        <button
                          type="button"
                          key={m}
                          onClick={() => setPaymentMethod(m)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            paymentMethod === m
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {m === 'BANK_TRANSFER' ? 'Bank' : m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Real-time Ledger Balance Summary */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1 text-slate-700">
                <div className="flex justify-between text-[11px]">
                  <span>Previous Balance (പഴയ ബാക്കി):</span>
                  <span className="font-bold">₹{previousBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Current Bill Balance Due (ഈ ബില്ലിലെ ബാക്കി):</span>
                  <span className="font-bold text-amber-800">₹{currentBillDue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-amber-950 border-t border-amber-200 pt-1">
                  <span>Net Outstanding Balance (ആകെ കുടിശ്ശിക):</span>
                  <span className="text-rose-700 text-sm">₹{netTotalOutstanding.toFixed(2)}</span>
                </div>
              </div>

              {/* SAVE BILL BUTTON */}
              <button
                onClick={handleSaveBill}
                disabled={isSubmitting || items.length === 0 || !selectedCustomerId}
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{isSubmitting ? 'Saving...' : 'Save & Print Bill (ബിൽ അടിക്കുക)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice View / Print Modal */}
      {createdInvoice && settings && (
        <InvoiceViewModal
          invoice={createdInvoice}
          settings={settings}
          onClose={handleResetForNewBill}
          onInvoiceCancelled={loadData}
        />
      )}

      {/* Add New Customer Modal */}
      <CustomerModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        onSaved={loadData}
      />

      {/* Add New / Outside Product Modal */}
      <ProductModal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        onSaved={loadData}
      />
    </div>
  );
}
