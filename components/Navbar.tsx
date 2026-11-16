'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Store,
  PlusCircle,
  Menu,
  X,
  UserCheck,
  ShieldAlert,
  ChevronDown,
  Printer,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '@/lib/types';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export default function Navbar({ onToggleMobileMenu, isMobileMenuOpen }: NavbarProps) {
  const pathname = usePathname();
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMIN');
  const [userName, setUserName] = useState<string>('Faizan Ahmed (Admin)');
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Read cached role or set default
    const savedRole = localStorage.getItem('faizan_user_role') as UserRole;
    if (savedRole) {
      setCurrentRole(savedRole);
      setUserName(savedRole === 'ADMIN' ? 'Faizan Ahmed (Admin)' : 'Bilal (Delivery Staff)');
    }

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    setUserName(role === 'ADMIN' ? 'Faizan Ahmed (Admin)' : 'Bilal (Delivery Staff)');
    localStorage.setItem('faizan_user_role', role);
    setIsRoleMenuOpen(false);
    window.dispatchEvent(new Event('roleChanged'));
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Brand Identity */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-slate-900">
                    FAIZAN BAKERY
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded">
                    Wholesale POS
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Digital Billing & Distribution System
                </p>
              </div>
            </Link>
          </div>

          {/* Right: Quick Actions & Role Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Live Clock (Hidden on small mobile) */}
            <div className="hidden md:flex flex-col text-right pr-2">
              <span className="text-xs font-semibold text-slate-700">{currentTime || 'Live System'}</span>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected
              </span>
            </div>

            {/* Fast "New Bill" Button */}
            <Link
              href="/billing"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="font-semibold">New Bill</span>
            </Link>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
              >
                <div className={`w-2.5 h-2.5 rounded-full ${currentRole === 'ADMIN' ? 'bg-purple-600' : 'bg-blue-600'}`} />
                <span className="font-semibold hidden sm:inline">{currentRole}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isRoleMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Signed in as</p>
                    <p className="text-xs font-bold text-slate-800">{userName}</p>
                  </div>

                  <button
                    onClick={() => switchRole('ADMIN')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                      currentRole === 'ADMIN' ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-purple-600" />
                      <span>Admin (Faizan Ahmed)</span>
                    </div>
                    {currentRole === 'ADMIN' && <span className="text-[10px] text-emerald-600 font-bold">Active</span>}
                  </button>

                  <button
                    onClick={() => switchRole('STAFF')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                      currentRole === 'STAFF' ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span>Staff (Bilal - Delivery)</span>
                    </div>
                    {currentRole === 'STAFF' && <span className="text-[10px] text-emerald-600 font-bold">Active</span>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

