import React, { useState, useMemo } from 'react';
import { Calendar, CheckCircle, AlertCircle, Clock, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatPeso, formatDate, daysRemaining } from '../../utils/formatters';
import AddPaymentModal from '../Payments/AddPaymentModal';
import type { Loan } from '../../types';

const STATUS_COLORS = {
  paid: 'bg-green-500/15 text-green-400',
  partial: 'bg-blue-500/15 text-blue-400',
  unpaid: 'bg-gray-500/15 text-gray-400',
  overdue: 'bg-red-500/15 text-red-400',
};

const STATUS_ICONS = {
  paid: <CheckCircle size={13} />,
  partial: <Clock size={13} />,
  unpaid: <Clock size={13} />,
  overdue: <AlertCircle size={13} />,
};

const Installments: React.FC = () => {
  const { installments, loans } = useApp();
  const [loanFilter, setLoanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payModalLoan, setPayModalLoan] = useState<Loan | null>(null);
  const [payModalInstNum, setPayModalInstNum] = useState<number | undefined>();

  const filtered = useMemo(() => {
    let result = [...installments];
    if (loanFilter) result = result.filter(i => i.loanId === loanFilter);
    if (statusFilter !== 'all') result = result.filter(i => i.status === statusFilter);
    return result.sort((a, b) => {
      if (a.loanId !== b.loanId) return a.loanId.localeCompare(b.loanId);
      return a.installmentNumber - b.installmentNumber;
    });
  }, [installments, loanFilter, statusFilter]);

  const getLoanForInstallment = (loanId: string) => loans.find(l => l.id === loanId);

  const counts = useMemo(() => ({
    paid: installments.filter(i => i.status === 'paid').length,
    partial: installments.filter(i => i.status === 'partial').length,
    unpaid: installments.filter(i => i.status === 'unpaid').length,
    overdue: installments.filter(i => i.status === 'overdue').length,
  }), [installments]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-white text-2xl font-bold">Installments</h2>
        <p className="text-gray-500 text-sm mt-1">Payment schedule for all loans</p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Paid', count: counts.paid, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Partial', count: counts.partial, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Unpaid', count: counts.unpaid, color: 'text-gray-400', bg: 'bg-gray-500/10' },
          { label: 'Overdue', count: counts.overdue, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`glass-card p-4 text-center ${bg} border border-white/5`}>
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-gray-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-500" />
          <select
            value={loanFilter} onChange={e => setLoanFilter(e.target.value)}
            className="bg-white/5 border border-white/10 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="" className="bg-[#111]">All Loans</option>
            {loans.map(l => (
              <option key={l.id} value={l.id} className="bg-[#111]">{l.id} – {l.borrowerName}</option>
            ))}
          </select>
          <select
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="all" className="bg-[#111]">All Status</option>
            <option value="paid" className="bg-[#111]">Paid</option>
            <option value="partial" className="bg-[#111]">Partial</option>
            <option value="unpaid" className="bg-[#111]">Unpaid</option>
            <option value="overdue" className="bg-[#111]">Overdue</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr>
                {['Loan ID', 'Borrower', 'Inst. #', 'Due Date', 'Monthly Amount', 'Paid', 'Remaining', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/3">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-500">
                    {installments.length === 0 ? 'No installments yet. Create a loan first.' : 'No installments match your filters.'}
                  </td>
                </tr>
              ) : filtered.map(inst => {
                const loan = getLoanForInstallment(inst.loanId);
                const dr = daysRemaining(inst.dueDate);
                return (
                  <tr key={inst.id} className={`hover:bg-white/2 transition-colors ${inst.status === 'overdue' ? 'bg-red-500/3' : ''}`}>
                    <td className="px-4 py-3 text-green-400 font-mono text-xs whitespace-nowrap">{inst.loanId}</td>
                    <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{loan?.borrowerName ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-white/5 text-gray-300 px-2 py-0.5 rounded text-xs font-mono">#{inst.installmentNumber}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-gray-300">{formatDate(inst.dueDate)}</p>
                      <p className={`text-[10px] ${dr.overdue ? 'text-red-400' : 'text-gray-600'}`}>{dr.label}</p>
                    </td>
                    <td className="px-4 py-3 text-white whitespace-nowrap">{formatPeso(inst.monthlyAmount)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-green-400 font-medium">{formatPeso(inst.amountPaid)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={inst.remainingAmount > 0 ? 'text-amber-400' : 'text-green-400'}>
                        {formatPeso(inst.remainingAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`flex items-center gap-1 w-fit px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[inst.status]}`}>
                        {STATUS_ICONS[inst.status]}
                        {inst.status.charAt(0).toUpperCase() + inst.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {inst.status !== 'paid' && loan && loan.status !== 'completed' && (
                        <button
                          onClick={() => { setPayModalLoan(loan); setPayModalInstNum(inst.installmentNumber); }}
                          className="text-xs px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-all font-medium"
                        >
                          Pay
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {payModalLoan && <AddPaymentModal onClose={() => { setPayModalLoan(null); setPayModalInstNum(undefined); }} preselectedLoan={payModalLoan} preselectedInstallment={payModalInstNum} />}
    </div>
  );
};

export default Installments;
