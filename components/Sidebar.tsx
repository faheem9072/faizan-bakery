'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FilePlus2,
  Receipt,
  Users2,
  Package2,
  WalletCards,
  CreditCard,
  Truck,
  Boxes,
  BarChart3,
  Settings,
  ChevronRight,
  Printer,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/billing', label: 'New Bill (POS)', icon: FilePlus2, highlight: true },
  { href: '/bills', label: 'Bills & Invoices', icon: Receipt },
  { href: '/customers', label: 'Customers', icon: Users2 },
  { href: '/products', label: 'Products', icon: Package2 },
  { href: '/payments', label: 'Payments', icon: WalletCards },
  { href: '/credit', label: 'Credit Management', icon: CreditCard },
  { href: '/distribution', label: 'Daily Distribution', icon: Truck },
  { href: '/stock', label: 'Stock & Inventory', icon: Boxes },
  { href: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 no-print select-none">
      {/* Navigation Links */}
      <div className="flex-1 space-y-1">
        <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Management
        </p>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                item.highlight
                  ? isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 font-bold border border-emerald-200/60'
                  : isActive
                  ? 'bg-slate-900 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 ${
                    item.highlight
                      ? isActive
                        ? 'text-white'
                        : 'text-emerald-700'
                      : isActive
                      ? 'text-white'
                      : 'text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </Link>
          );
        })}
      </div>

      {/* Printer Support Card Snapshot */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-2 text-slate-700 font-semibold text-xs mb-1">
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>Thermal Ready</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Bluetooth 58mm / 80mm & RawBT direct print enabled.
          </p>
        </div>
      </div>
    </aside>
  );
}

