import React, { useMemo } from 'react';
import { Users, CreditCard, AlertCircle, CheckCircle, Phone, MapPin, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatPeso, formatDate } from '../../utils/formatters';

const Borrowers: React.FC = () => {
  const { borrowers, loans, payments } = useApp();

  const borrowerStats = useMemo(() => {
    return borrowers.map(b => {
      const bLoans = loans.filter(l => l.borrowerId === b.id || l.borrowerName.toLowerCase() === b.name.toLowerCase());
      const totalBorrowed = bLoans.reduce((s, l) => s + l.amountBorrowed, 0);
      const totalDue = bLoans.reduce((s, l) => s + l.totalDue, 0);
      const outstanding = bLoans.reduce((s, l) => s + l.remainingBalance, 0);
      const activeLoans = bLoans.filter(l => l.status === 'active').length;
      const overdueLoans = bLoans.filter(l => l.status === 'overdue').length;
      const completedLoans = bLoans.filter(l => l.status === 'completed').length;
      const bPayments = payments.filter(p => bLoans.some(l => l.id === p.loanId));
      const totalPaid = bPayments.reduce((s, p) => s + p.amount, 0);
      const collectionRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
      const status = overdueLoans > 0 ? 'overdue' : activeLoans > 0 ? 'active' : 'clear';
      return { borrower: b, bLoans, totalBorrowed, outstanding, activeLoans, overdueLoans, completedLoans, totalPaid, collectionRate, status, bPayments };
    });
  }, [borrowers, loans, payments]);

  if (borrowers.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-white text-2xl font-bold">Borrowers</h2>
          <p className="text-gray-500 text-sm mt-1">Borrowers are added automatically when you create a loan.</p>
        </div>
        <div className="glass-card p-12 text-center">
          <Users size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">No borrowers yet</p>
          <p className="text-gray-600 text-sm mt-1">Create a loan to add your first borrower.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white text-2xl font-bold">Borrowers</h2>
        <p className="text-gray-500 text-sm mt-1">{borrowers.length} borrower{borrowers.length !== 1 ? 's' : ''} in your network</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {borrowerStats.map(({ borrower, bLoans, totalBorrowed, outstanding, activeLoans, overdueLoans, completedLoans, totalPaid, collectionRate, status, bPayments }) => (
          <div
            key={borrower.id}
            className={`glass-card p-5 hover-lift border ${
              status === 'overdue' ? 'border-red-500/20' :
              status === 'active' ? 'border-blue-500/10' :
              'border-green-500/10'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold ${
                  status === 'overdue' ? 'bg-red-500/15 text-red-400' :
                  status === 'active' ? 'bg-blue-500/15 text-blue-400' :
                  'bg-green-500/15 text-green-400'
                }`}>
                  {borrower.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{borrower.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      status === 'overdue' ? 'bg-red-500/15 text-red-400' :
                      status === 'active' ? 'bg-blue-500/15 text-blue-400' :
                      'bg-green-500/15 text-green-400'
                    }`}>
                      {status === 'overdue' ? 'Overdue' : status === 'active' ? 'Active' : 'All Clear'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            {(borrower.contact || borrower.address) && (
              <div className="space-y-1 mb-4">
                {borrower.contact && (
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Phone size={11} />
                    <span>{borrower.contact}</span>
                  </div>
                )}
                {borrower.address && (
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <MapPin size={11} />
                    <span>{borrower.address}</span>
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/3 rounded-lg p-3">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider">Total Borrowed</p>
                <p className="text-white text-sm font-bold mt-1">{formatPeso(totalBorrowed)}</p>
              </div>
              <div className="bg-white/3 rounded-lg p-3">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider">Outstanding</p>
                <p className={`text-sm font-bold mt-1 ${outstanding > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                  {formatPeso(outstanding)}
                </p>
              </div>
              <div className="bg-white/3 rounded-lg p-3">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider">Total Paid</p>
                <p className="text-green-400 text-sm font-bold mt-1">{formatPeso(totalPaid)}</p>
              </div>
              <div className="bg-white/3 rounded-lg p-3">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider">Collection</p>
                <p className="text-blue-400 text-sm font-bold mt-1">{collectionRate.toFixed(1)}%</p>
              </div>
            </div>

            {/* Collection Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Collection Progress</span>
                <span className="text-gray-400">{collectionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(collectionRate, 100)}%`,
                    background: collectionRate >= 100 ? '#22c55e' : collectionRate > 50 ? '#3b82f6' : '#f59e0b'
                  }}
                />
              </div>
            </div>

            {/* Loan badges */}
            <div className="flex gap-2 text-xs">
              <div className="flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-1 rounded-lg">
                <CreditCard size={10} />
                <span>{activeLoans} active</span>
              </div>
              {overdueLoans > 0 && (
                <div className="flex items-center gap-1 bg-red-500/10 text-red-400 px-2 py-1 rounded-lg">
                  <AlertCircle size={10} />
                  <span>{overdueLoans} overdue</span>
                </div>
              )}
              {completedLoans > 0 && (
                <div className="flex items-center gap-1 bg-green-500/10 text-green-400 px-2 py-1 rounded-lg">
                  <CheckCircle size={10} />
                  <span>{completedLoans} done</span>
                </div>
              )}
            </div>

            {/* Recent payments */}
            {bPayments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <FileText size={10} />
                  Recent Payments
                </p>
                <div className="space-y-1">
                  {[...bPayments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{formatDate(p.date)}</span>
                      <span className="text-green-400 font-medium">+{formatPeso(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {borrower.notes && (
              <div className="mt-3 text-gray-600 text-xs italic">{borrower.notes}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Borrowers;
