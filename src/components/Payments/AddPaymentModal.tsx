import React, { useState } from 'react';
import { X, Hash } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatPeso } from '../../utils/formatters';
import type { Loan } from '../../types';

interface AddPaymentModalProps {
  onClose: () => void;
  preselectedLoan?: Loan;
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ onClose, preselectedLoan }) => {
  const { loans, installments, addPayment } = useApp();
  const [selectedLoanId, setSelectedLoanId] = useState(preselectedLoan?.id ?? '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [installmentNum, setInstallmentNum] = useState('');

  const activeLoan = loans.find(l => l.id === selectedLoanId);
  const loanInstallments = activeLoan ? installments.filter(i => i.loanId === activeLoan.id && i.status !== 'paid') : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId || !amount || !date) return;
    const loan = loans.find(l => l.id === selectedLoanId);
    if (!loan) return;

    const refNum = `REF-${Date.now().toString(36).toUpperCase()}`;
    addPayment({
      id: crypto.randomUUID(),
      loanId: selectedLoanId,
      borrowerName: loan.borrowerName,
      amount: parseFloat(amount),
      date,
      notes,
      referenceNumber: refNum,
      installmentNumber: installmentNum ? parseInt(installmentNum) : undefined,
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <h2 className="text-white font-bold text-lg">Record Payment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Loan selector */}
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">Select Loan <span className="text-red-400">*</span></label>
            <select
              value={selectedLoanId} onChange={e => setSelectedLoanId(e.target.value)} required
              className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 transition-all"
            >
              <option value="" className="bg-[#111]">-- Select a loan --</option>
              {loans.filter(l => l.status !== 'completed').map(l => (
                <option key={l.id} value={l.id} className="bg-[#111]">
                  {l.id} – {l.borrowerName} ({formatPeso(l.remainingBalance)} remaining)
                </option>
              ))}
            </select>
          </div>

          {activeLoan && (
            <div className="bg-white/3 border border-white/5 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Borrower</span>
                <span className="text-white font-medium">{activeLoan.borrowerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Due</span>
                <span className="text-white">{formatPeso(activeLoan.totalDue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Remaining Balance</span>
                <span className="text-amber-400 font-bold">{formatPeso(activeLoan.remainingBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Monthly Payment</span>
                <span className="text-blue-400">{formatPeso(activeLoan.monthlyPayment)}</span>
              </div>
            </div>
          )}

          {/* Installment select */}
          {loanInstallments.length > 0 && (
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">Apply to Installment</label>
              <select
                value={installmentNum} onChange={e => {
                  setInstallmentNum(e.target.value);
                  if (e.target.value) {
                    const inst = loanInstallments.find(i => i.installmentNumber === parseInt(e.target.value));
                    if (inst) setAmount(String(inst.remainingAmount.toFixed(2)));
                  }
                }}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 transition-all"
              >
                <option value="" className="bg-[#111]">-- Optional: Select installment --</option>
                {loanInstallments.map(inst => (
                  <option key={inst.id} value={inst.installmentNumber} className="bg-[#111]">
                    #{inst.installmentNumber} – Due {inst.dueDate} – {formatPeso(inst.remainingAmount)} remaining
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">Amount Paid (₱) <span className="text-red-400">*</span></label>
            <input
              type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0.01" step="0.01"
              placeholder="0.00"
              className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 transition-all placeholder-gray-600"
            />
            {activeLoan && (
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setAmount(String(activeLoan.monthlyPayment.toFixed(2)))}
                  className="text-[10px] px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md hover:bg-blue-500/20 transition-all">
                  Monthly ({formatPeso(activeLoan.monthlyPayment)})
                </button>
                <button type="button" onClick={() => setAmount(String(activeLoan.remainingBalance.toFixed(2)))}
                  className="text-[10px] px-2 py-1 bg-green-500/10 text-green-400 rounded-md hover:bg-green-500/20 transition-all">
                  Full Balance ({formatPeso(activeLoan.remainingBalance)})
                </button>
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">Payment Date <span className="text-red-400">*</span></label>
            <input
              type="date" value={date} onChange={e => setDate(e.target.value)} required
              className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">Notes</label>
            <input
              type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 transition-all placeholder-gray-600"
            />
          </div>

          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <Hash size={11} />
            <span>Reference number will be auto-generated.</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-white/10 text-gray-400 rounded-xl text-sm font-medium hover:bg-white/5 transition-all">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 text-black rounded-xl text-sm font-bold transition-all">
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPaymentModal;
