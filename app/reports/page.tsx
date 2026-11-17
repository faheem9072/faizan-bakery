'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Filter,
  Download,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  CreditCard,
  Truck,
  DollarSign,
  PieChart,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { downloadReportPdf } from '@/lib/pdfGenerator';
import { Customer, Product } from '@/lib/types';

const REPORT_TABS = [
  { id: 'daily_sales', label: '1. Daily Sales' },
  { id: 'weekly_sales', label: '2. Weekly Sales' },
  { id: 'monthly_sales', label: '3. Monthly Sales' },
  { id: 'customer_wise', label: '4. Customer Sales' },
  { id: 'product_wise', label: '5. Product Sales' },
  { id: 'payments_collection', label: '6. Payment Collection' },
  { id: 'outstanding_credit', label: '7. Outstanding Credit' },
  { id: 'invoice_history', label: '8. Invoice History' },
  { id: 'profit_report', label: '9. Gross Profit' },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('daily_sales');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  // Date range
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load customers and products for filter dropdowns
  useEffect(() => {
    fetch('/api/customers?status=ACTIVE')
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setCustomers(data))
      .catch(console.error);

    fetch('/api/products?activeOnly=true')
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setProducts(data))
      .catch(console.error);
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: activeReport,
        startDate,
        endDate,
      });
      if (selectedCustomerId) params.append('customerId', selectedCustomerId);
      if (selectedProductId) params.append('productId', selectedProductId);

      const res = await fetch(`/api/reports?${params.toString()}`);
      const json = await res.json();
      setReportData(json);
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, startDate, endDate, selectedCustomerId, selectedProductId]);

  // Export to Excel
  const handleExportExcel = () => {
    if (!reportData || !reportData.rows || reportData.rows.length === 0) {
      alert('No data to export.');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(reportData.rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeReport);
    XLSX.writeFile(wb, `FaizanBakery_${activeReport}_${startDate}_to_${endDate}.xlsx`);
  };

  // Export to PDF
  const handleExportPdf = () => {
    if (!reportData || !reportData.rows || reportData.rows.length === 0) {
      alert('No data to export.');
      return;
    }

    const rows = reportData.rows;
    const firstRow = rows[0];
    const columns = Object.keys(firstRow).map((k) =>
      k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
    );
    const data = rows.map((r: any) =>
      Object.values(r).map((v: any) => (typeof v === 'number' ? v.toFixed(2) : String(v)))
    );

    const title = REPORT_TABS.find((t) => t.id === activeReport)?.label || 'Report';
    downloadReportPdf(title, columns, data, `Period: ${startDate} to ${endDate}`);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Reports & Financial Analytics</span>
            <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
              Business Intelligence
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Generate detailed sales, distribution, collections, credit, and profit reports.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center space-x-1.5 transition active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel Export</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center space-x-1.5 transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>PDF Export</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
            title="Print"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
            />
          </div>

          {/* Customer Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer Filter</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">All Bakeries</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.shopName}
                </option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Product Filter</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs font-bold no-print">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className={`px-3 py-2 rounded-xl transition whitespace-nowrap ${
              activeReport === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profit Highlights Card (If Profit Report is Selected) */}
      {activeReport === 'profit_report' && reportData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500">Total Billed Revenue</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              ₹{(reportData.totalRevenue || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500">Estimated Production Cost</p>
            <p className="text-lg font-bold text-slate-600 mt-0.5">
              ₹{(reportData.totalCost || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
            <p className="text-[11px] font-semibold text-emerald-800">Gross Margin Profit</p>
            <p className="text-lg font-bold text-emerald-800 mt-0.5">
              ₹{(reportData.totalProfit || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500">Gross Margin %</p>
            <p className="text-lg font-bold text-purple-700 mt-0.5">
              {(reportData.overallMargin || 0).toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Report Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Generating report...</div>
        ) : !reportData || !reportData.rows || reportData.rows.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400 space-y-2">
            <BarChart3 className="w-8 h-8 mx-auto text-slate-300" />
            <p>No transactions found for the selected period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  {Object.keys(reportData.rows[0]).map((col) => (
                    <th key={col} className="py-3 px-4 whitespace-nowrap">
                      {col.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.rows.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition">
                    {Object.values(row).map((val: any, j: number) => (
                      <td key={j} className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {typeof val === 'number'
                          ? val % 1 !== 0
                            ? val.toFixed(2)
                            : val.toLocaleString('en-IN')
                          : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

