import React from 'react';
import { LayoutDashboard, CreditCard, Users, Wallet, Calendar, BarChart3, FileText, Settings } from 'lucide-react';
import type { ActiveTab } from '../../types';

interface BottomNavProps {
  active: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
}

const navItems: { tab: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { tab: 'dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
  { tab: 'loans', label: 'Loans', icon: <CreditCard size={20} /> },
  { tab: 'borrowers', label: 'People', icon: <Users size={20} /> },
  { tab: 'payments', label: 'Pay', icon: <Wallet size={20} /> },
  { tab: 'installments', label: 'Schedule', icon: <Calendar size={20} /> },
  { tab: 'analytics', label: 'Charts', icon: <BarChart3 size={20} /> },
  { tab: 'reports', label: 'Reports', icon: <FileText size={20} /> },
  { tab: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

const BottomNav: React.FC<BottomNavProps> = ({ active, onNavigate }) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0D0D0D] border-t border-white/5 px-2 py-1">
      <div className="flex justify-around">
        {navItems.map(({ tab, label, icon }) => (
          <button
            key={tab}
            onClick={() => onNavigate(tab)}
            className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg transition-all duration-200 ${
              active === tab ? 'text-green-400' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {icon}
            <span className="text-[9px] font-medium">{label}</span>
            {active === tab && <div className="w-1 h-1 rounded-full bg-green-400" />}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
