'use client';

import React, { useState } from 'react';
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
  MoreHorizontal,
  X,
} from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);

  const moreItems = [
    { href: '/products', label: 'Products', icon: Package2 },
    { href: '/payments', label: 'Payments', icon: WalletCards },
    { href: '/credit', label: 'Credit Management', icon: CreditCard },
    { href: '/distribution', label: 'Daily Distribution', icon: Truck },
    { href: '/stock', label: 'Stock & Inventory', icon: Boxes },
    { href: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Drawer Slide-over when hamburger is tapped in Navbar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden no-print">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col p-4 z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="font-semibold text-base text-slate-900">FAIZAN BAKERY</span>
              <button onClick={onClose} className="p-1 rounded-lg text-slate-500 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-1">
              <Link
                href="/billing"
                onClick={onClose}
                className="flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-bold bg-emerald-600 text-white shadow-md mb-3"
              >
                <FilePlus2 className="w-5 h-5" />
                <span>+ Create New Bill</span>
              </Link>

              {[
                { href: '/', label: 'Dashboard', icon: LayoutDashboard },
                { href: '/bills', label: 'Bills & Invoices', icon: Receipt },
                { href: '/customers', label: 'Customers', icon: Users2 },
                ...moreItems,
              ].map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? 'bg-slate-900 text-white font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Fixed at bottom on phones) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg no-print">
        <div className="flex items-center justify-around h-14">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center w-14 h-full ${
              pathname === '/' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Home</span>
          </Link>

          <Link
            href="/bills"
            className={`flex flex-col items-center justify-center w-14 h-full ${
              pathname === '/bills' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Bills</span>
          </Link>

          {/* Big Center Action: NEW BILL */}
          <Link
            href="/billing"
            className="flex flex-col items-center justify-center -mt-5"
          >
            <div className="w-13 h-13 p-3.5 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 border-4 border-white active:scale-95 transition-all">
              <FilePlus2 className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-emerald-800 mt-0.5">New Bill</span>
          </Link>

          <Link
            href="/customers"
            className={`flex flex-col items-center justify-center w-14 h-full ${
              pathname === '/customers' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <Users2 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Shops</span>
          </Link>

          <button
            onClick={() => setShowMoreDrawer(!showMoreDrawer)}
            className={`flex flex-col items-center justify-center w-14 h-full ${
              showMoreDrawer ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">More</span>
          </button>
        </div>
      </nav>

      {/* "More" Bottom Sheet Modal */}
      {showMoreDrawer && (
        <div className="fixed inset-0 z-50 lg:hidden no-print">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowMoreDrawer(false)} />
          <div className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">More Management Features</h3>
              <button onClick={() => setShowMoreDrawer(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pb-4">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMoreDrawer(false)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition ${
                      isActive
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                        : 'border-slate-100 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1.5 text-emerald-700" />
                    <span className="text-xs font-semibold leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

