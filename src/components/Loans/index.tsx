import React, { useState, useMemo } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, ChevronUp, ChevronDown, Filter, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatPeso, formatDate, daysRemaining } from '../../utils/formatters';
import AddLoanModal from './AddLoanModal';
import LoginModal from '../Auth/LoginModal';
import type { Loan, LoanCategory } from '../../types';

type SortKey = keyof Loan;
type SortDir = 'asc' | 'desc';

const STATUS_COLORS = {
  active: 'bg-blue-500/15 text-blue-400',
  completed: 'bg-green-500/15 text-green-400',
  overdue: 'bg-red-500/15 text-red-400',
};

const CATEGORIES: (LoanCategory | 'All')[] = ['All', 'Family', 'Friend', 'Business', 'Personal', 'Employee', 'Other'];

const Loans: React.FC = () => {
  const { loans, deleteLoan } = useApp();
  const { isAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [editLoan, setEditLoan] = useState<Loan | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...loans];
    if (search) result = result.filter(l => l.borrowerName.toLowerCase().includes(search.toLowerCase()) || l.id.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== 'all') result = result.filter(l => l.status === statusFilter);
    if (categoryFilter !== 'All') result = result.filter(l => l.category === categoryFilter);
    result.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av ?? '').localeCompare(String(bv ?? ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [loans, search, statusFilter, categoryFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon: React.FC<{ k: SortKey }> = ({ k }) => (
    <span className="ml-1 opacity-50">
      {sortKey === k ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronDown size={12} />}
    </span>
  );

  const handleEdit = (loan: Loan) => {
    if (!isAdmin) { setShowLogin(true); return; }
    setEditLoan(loan);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) { setShowLogin(true); return; }
    if (deleteConfirm === id) { deleteLoan(id); setDeleteConfirm(null); }
    else setDeleteConfirm(id);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-white text-2xl font-bold">Loans</h2>
          <p className="text-gray-500 text-sm mt-1">{loans.length} total loan{loans.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditLoan(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
          >
            <Plus size={16} />
            Add Loan
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="glass-card p-4 flex items-center gap-3 bg-blue-500/10 border border-blue-500/20">
          <Lock size={16} className="text-blue-400 flex-shrink-0" />
          <p className="text-blue-400 text-sm"><strong>Viewer Mode:</strong> Sign in as Admin to add, edit, or delete loans.</p>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
          <Search size={14} className="text-gray-500" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or ID..."
            className="bg-transparent text-white text-sm flex-1 focus:outline-none placeholder-gray-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-500" />
          <select
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="all" className="bg-[#111]">All Status</option>
            <option value="active" className="bg-[#111]">Active</option>
            <option value="completed" className="bg-[#111]">Completed</option>
            <option value="overdue" className="bg-[#111]">Overdue</option>
          </select>
          <select
            value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="bg-white/5 border border-white/10 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr>
                {[
                  { key: 'id', label: 'Transaction ID' },
                  { key: 'borrowerName', label: 'Borrower' },
                  { key: 'amountBorrowed', label: 'Amount' },
                  { key: 'interestRate', label: 'Interest' },
                  { key: 'totalDue', label: 'Total Due' },
                  { key: 'monthlyPayment', label: 'Monthly' },
                  { key: 'monthsToPay', label: 'Months' },
                  { key: 'dueDate', label: 'Due Date' },
                  { key: 'remainingBalance', label: 'Balance' },
                  { key: 'status', label: 'Status' },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key as SortKey)}
                    className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors whitespace-nowrap"
                  >
                    <span className="flex items-center">{label}<SortIcon k={key as SortKey} /></span>
                  </th>
                ))}
                <th className="px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/3">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-gray-500">
                    {loans.length === 0 ? 'No loans yet. Click "Add Loan" to get started.' : 'No loans match your filters.'}
                  </td>
                </tr>
              ) : filtered.map(loan => {
                const dr = daysRemaining(loan.dueDate);
                return (
                  <tr key={loan.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-green-400 font-mono text-xs whitespace-nowrap">{loan.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium whitespace-nowrap">{loan.borrowerName}</p>
                      <p className="text-gray-500 text-xs">{loan.category}</p>
                    </td>
                    <td className="px-4 py-3 text-white whitespace-nowrap">{formatPeso(loan.amountBorrowed)}</td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{loan.interestRate}%</td>
                    <td className="px-4 py-3 text-white whitespace-nowrap">{formatPeso(loan.totalDue)}</td>
                    <td className="px-4 py-3 text-blue-400 whitespace-nowrap">{formatPeso(loan.monthlyPayment)}</td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{loan.monthsToPay} mo.</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-gray-300">{formatDate(loan.dueDate)}</p>
                      <p className={`text-[10px] ${dr.overdue ? 'text-red-400' : 'text-gray-500'}`}>{dr.label}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={loan.remainingBalance > 0 ? 'text-amber-400 font-semibold' : 'text-green-400'}>
                        {formatPeso(loan.remainingBalance)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[loan.status]}`}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(loan)}
                            className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                            title="Edit loan"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(loan.id)}
                            className={`p-1.5 rounded-lg transition-all ${
                              deleteConfirm === loan.id
                                ? 'bg-red-500/20 text-red-400'
                                : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                            }`}
                            title="Delete loan"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <AddLoanModal onClose={() => { setShowModal(false); setEditLoan(null); }} editLoan={editLoan} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
};

export default Loans;
