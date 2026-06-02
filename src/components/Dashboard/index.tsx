import React, { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, CreditCard, Users,
  CheckCircle, AlertCircle, Clock, DollarSign, Activity, Bell
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatPeso, formatDate, daysRemaining } from '../../utils/formatters';

const StatCard: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}> = ({ label, value, icon, color, sub }) => (
  <div className="glass-card p-5 flex flex-col gap-3 hover-lift">
    <div className="flex items-center justify-between">
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{label}</p>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
    <div>
      <p className="text-white text-2xl font-bold">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  </div>
);

const ProgressRing: React.FC<{ percent: number; size?: number }> = ({ percent, size = 48 }) => {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2937" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={percent >= 100 ? '#22c55e' : percent > 50 ? '#3b82f6' : '#f59e0b'}
        strokeWidth={4} strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
};

const Dashboard: React.FC = () => {
  const { loans, payments, borrowers } = useApp();

  const stats = useMemo(() => {
    const totalBorrowed = loans.reduce((s, l) => s + l.amountBorrowed, 0);
    const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
    const outstanding = loans.reduce((s, l) => s + l.remainingBalance, 0);
    const active = loans.filter(l => l.status === 'active').length;
    const completed = loans.filter(l => l.status === 'completed').length;
    const overdue = loans.filter(l => l.status === 'overdue').length;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const monthlyCollected = payments
      .filter(p => p.date >= monthStart && p.date <= monthEnd)
      .reduce((s, p) => s + p.amount, 0);
    const monthlyExpected = loans
      .filter(l => l.status === 'active' || l.status === 'overdue')
      .reduce((s, l) => s + l.monthlyPayment, 0);

    return { totalBorrowed, totalCollected, outstanding, active, completed, overdue, monthlyCollected, monthlyExpected };
  }, [loans, payments]);

  const upcomingDue = useMemo(() => {
    const today = new Date();
    const in7 = new Date(today);
    in7.setDate(in7.getDate() + 7);
    const todayStr = today.toISOString().split('T')[0];
    const in7Str = in7.toISOString().split('T')[0];
    return loans.filter(l => l.status === 'active' && l.dueDate >= todayStr && l.dueDate <= in7Str);
  }, [loans]);

  const overdueLoans = useMemo(() => loans.filter(l => l.status === 'overdue'), [loans]);
  const recentPayments = useMemo(() => [...payments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5), [payments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-2xl font-bold">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Overview of your loan portfolio</p>
        </div>
        {(upcomingDue.length > 0 || overdueLoans.length > 0) && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-lg text-sm">
            <Bell size={14} />
            <span>{overdueLoans.length > 0 ? `${overdueLoans.length} overdue` : `${upcomingDue.length} due soon`}</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Borrowed" value={formatPeso(stats.totalBorrowed)} icon={<TrendingUp size={16} className="text-blue-400" />} color="bg-blue-500/15" sub={`${loans.length} loan${loans.length !== 1 ? 's' : ''}`} />
        <StatCard label="Total Collected" value={formatPeso(stats.totalCollected)} icon={<DollarSign size={16} className="text-green-400" />} color="bg-green-500/15" sub={`${payments.length} payment${payments.length !== 1 ? 's' : ''}`} />
        <StatCard label="Outstanding" value={formatPeso(stats.outstanding)} icon={<TrendingDown size={16} className="text-amber-400" />} color="bg-amber-500/15" sub="remaining balance" />
        <StatCard label="Active Loans" value={String(stats.active)} icon={<CreditCard size={16} className="text-blue-400" />} color="bg-blue-500/15" sub={`${borrowers.length} borrower${borrowers.length !== 1 ? 's' : ''}`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Completed" value={String(stats.completed)} icon={<CheckCircle size={16} className="text-green-400" />} color="bg-green-500/15" />
        <StatCard label="Overdue" value={String(stats.overdue)} icon={<AlertCircle size={16} className="text-red-400" />} color="bg-red-500/15" />
        <StatCard label="Monthly Expected" value={formatPeso(stats.monthlyExpected)} icon={<Activity size={16} className="text-blue-400" />} color="bg-blue-500/15" />
        <StatCard label="Monthly Collected" value={formatPeso(stats.monthlyCollected)} icon={<Users size={16} className="text-green-400" />} color="bg-green-500/15" />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loan Progress */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <CreditCard size={16} className="text-green-400" />
            Loan Progress
          </h3>
          {loans.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No loans yet. Add your first loan.</p>
          ) : (
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {loans.map(loan => {
                const paid = loan.totalDue - loan.remainingBalance;
                const percent = loan.totalDue > 0 ? (paid / loan.totalDue) * 100 : 0;
                const dr = daysRemaining(loan.dueDate);
                return (
                  <div key={loan.id} className="flex items-center gap-4 p-3 bg-white/3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="relative flex-shrink-0">
                      <ProgressRing percent={percent} size={52} />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                        {Math.round(percent)}%
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{loan.borrowerName}</p>
                      <p className="text-gray-500 text-xs">{loan.id}</p>
                      <div className="mt-1 w-full bg-gray-800 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(percent, 100)}%`,
                            background: percent >= 100 ? '#22c55e' : percent > 50 ? '#3b82f6' : '#f59e0b'
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white text-xs font-semibold">{formatPeso(loan.remainingBalance)}</p>
                      <p className={`text-xs mt-0.5 ${dr.overdue ? 'text-red-400' : 'text-gray-500'}`}>{dr.label}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        loan.status === 'completed' ? 'bg-green-500/15 text-green-400' :
                        loan.status === 'overdue' ? 'bg-red-500/15 text-red-400' :
                        'bg-blue-500/15 text-blue-400'
                      }`}>{loan.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Recent Payments */}
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Clock size={16} className="text-blue-400" />
              Recent Payments
            </h3>
            {recentPayments.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-4">No payments recorded.</p>
            ) : (
              <div className="space-y-2">
                {recentPayments.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-white text-xs font-medium">{p.borrowerName}</p>
                      <p className="text-gray-600 text-[10px]">{formatDate(p.date)}</p>
                    </div>
                    <span className="text-green-400 text-xs font-semibold">+{formatPeso(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overdue Alerts */}
          {overdueLoans.length > 0 && (
            <div className="glass-card p-5 border border-red-500/20">
              <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                <AlertCircle size={16} />
                Overdue ({overdueLoans.length})
              </h3>
              <div className="space-y-2">
                {overdueLoans.slice(0, 3).map(l => (
                  <div key={l.id} className="flex items-center justify-between py-1.5">
                    <p className="text-white text-xs">{l.borrowerName}</p>
                    <p className="text-red-400 text-xs font-semibold">{formatPeso(l.remainingBalance)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingDue.length > 0 && (
            <div className="glass-card p-5 border border-amber-500/20">
              <h3 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
                <Bell size={16} />
                Due in 7 Days
              </h3>
              <div className="space-y-2">
                {upcomingDue.map(l => (
                  <div key={l.id} className="flex items-center justify-between py-1.5">
                    <p className="text-white text-xs">{l.borrowerName}</p>
                    <p className="text-amber-400 text-xs font-semibold">{formatDate(l.dueDate)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
