import React, { useState, useMemo } from 'react';
import { Plus, Search, Hash, Filter, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatPeso, formatDate } from '../../utils/formatters';
import AddPaymentModal from './AddPaymentModal';
import LoginModal from '../Auth/LoginModal';

const Payments: React.FC = () => {
  const { payments, loans } = useApp();
  const { isAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [search, setSearch] = useState('');
  const [loanFilter, setLoanFilter] = useState('');

  const sorted = useMemo(() => {
    let result = [...payments];
    if (search) result = result.filter(p =>
      p.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
      p.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.loanId.toLowerCase().includes(search.toLowerCase())
    );
    if (loanFilter) result = result.filter(p => p.loanId === loanFilter);
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [payments, search, loanFilter]);

  const totalCollected = useMemo(() => payments.reduce((s, p) => s + p.amount, 0), [payments]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-white text-2xl font-bold">Payments</h2>
          <p className="text-gray-500 text-sm mt-1">{payments.length} payment{payments.length !== 1 ? 's' : ''} · Total: <span className="text-green-400 font-semibold">{formatPeso(totalCollected)}</span></p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
          >
            <Plus size={16} />
            Record Payment
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="glass-card p-4 flex items-center gap-3 bg-blue-500/10 border border-blue-500/20">
          <Lock size={16} className="text-blue-400 flex-shrink-0" />
          <p className="text-blue-400 text-sm"><strong>Viewer Mode:</strong> Sign in as Admin to record payments.</p>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
          <Search size={14} className="text-gray-500" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or reference..."
            className="bg-transparent text-white text-sm flex-1 focus:outline-none placeholder-gray-600"
          />
        </div>
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
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr>
                {['Reference', 'Borrower', 'Loan ID', 'Amount', 'Date', 'Installment #', 'Notes'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/3">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    {payments.length === 0 ? 'No payments recorded yet.' : 'No payments match your filters.'}
                  </td>
                </tr>
              ) : sorted.map(p => (
                <tr key={p.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-gray-400 font-mono text-xs whitespace-nowrap">
                      <Hash size={10} />
                      {p.referenceNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{p.borrowerName}</td>
                  <td className="px-4 py-3 text-green-400 font-mono text-xs whitespace-nowrap">{p.loanId}</td>
                  <td className="px-4 py-3">
                    <span className="text-green-400 font-bold whitespace-nowrap">+{formatPeso(p.amount)}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{formatDate(p.date)}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {p.installmentNumber ? `#${p.installmentNumber}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-48 truncate">{p.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <AddPaymentModal onClose={() => setShowModal(false)} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
};

export default Payments;
