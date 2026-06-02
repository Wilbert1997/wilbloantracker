import React from 'react';
import {
  LayoutDashboard, CreditCard, Users, Wallet,
  Calendar, BarChart3, FileText, Settings, TrendingUp
} from 'lucide-react';
import type { ActiveTab } from '../../types';

interface SidebarProps {
  active: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
}

const navItems: { tab: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { tab: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { tab: 'loans', label: 'Loans', icon: <CreditCard size={18} /> },
  { tab: 'borrowers', label: 'Borrowers', icon: <Users size={18} /> },
  { tab: 'payments', label: 'Payments', icon: <Wallet size={18} /> },
  { tab: 'installments', label: 'Installments', icon: <Calendar size={18} /> },
  { tab: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
  { tab: 'reports', label: 'Reports', icon: <FileText size={18} /> },
  { tab: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

const Sidebar: React.FC<SidebarProps> = ({ active, onNavigate }) => {
  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-[#0D0D0D] border-r border-white/5 fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
          <TrendingUp size={16} className="text-green-400" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-none wilb-glow">WilbLoan</h1>
          <p className="text-gray-500 text-[10px] mt-0.5">Smart Loan Tracker</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ tab, label, icon }) => (
          <button
            key={tab}
            onClick={() => onNavigate(tab)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              active === tab
                ? 'bg-green-500/15 text-green-400 shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className={active === tab ? 'text-green-400' : 'text-gray-500'}>{icon}</span>
            {label}
            {active === tab && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400" />}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5">
        <p className="text-gray-600 text-[10px] text-center">© 2026 WilbLoan · v1.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
