import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Layout/Sidebar';
import BottomNav from './components/Layout/BottomNav';
import Dashboard from './components/Dashboard';
import Loans from './components/Loans';
import Borrowers from './components/Borrowers';
import Payments from './components/Payments';
import Installments from './components/Installments';
import Analytics from './components/Analytics';
import Reports from './components/Reports';
import Settings from './components/Settings';
import type { ActiveTab } from './types';
import { Plus, TrendingUp } from 'lucide-react';
import AddLoanModal from './components/Loans/AddLoanModal';
import LoginModal from './components/Auth/LoginModal';

const FAB: React.FC = () => {
  const { isAdmin } = useAuth();
  const [show, setShow] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  if (!isAdmin) return null;

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-20 w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 text-black shadow-lg shadow-green-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        title="Add New Loan"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>
      {show && <AddLoanModal onClose={() => setShow(false)} editLoan={null} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
};

const renderTab = (tab: ActiveTab) => {
  switch (tab) {
    case 'dashboard': return <Dashboard />;
    case 'loans': return <Loans />;
    case 'borrowers': return <Borrowers />;
    case 'payments': return <Payments />;
    case 'installments': return <Installments />;
    case 'analytics': return <Analytics />;
    case 'reports': return <Reports />;
    case 'settings': return <Settings />;
  }
};

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const { isAdmin, signOut } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Sidebar active={activeTab} onNavigate={setActiveTab} />

      <main className="lg:ml-60 pb-24 lg:pb-8">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center">
            <TrendingUp size={14} className="text-green-400" />
          </div>
          <span className="text-white font-bold wilb-glow">WilbLoan</span>
          <span className="text-gray-600 text-xs">
            / {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </span>
          <div className="ml-auto">
            {isAdmin ? (
              <button
                onClick={signOut}
                className="text-xs px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all font-medium"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="text-xs px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-all font-medium"
              >
                Admin
              </button>
            )}
          </div>
        </div>

        <div className="px-4 py-6 lg:px-8">
          <div key={activeTab} className="tab-content">
            {renderTab(activeTab)}
          </div>
        </div>
      </main>

      <BottomNav active={activeTab} onNavigate={setActiveTab} />
      <FAB />
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
