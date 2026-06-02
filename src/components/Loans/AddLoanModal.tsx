import React, { useState, useEffect } from 'react';
import { X, Calculator } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateLoan, generateTransactionId } from '../../utils/calculations';
import { formatPeso } from '../../utils/formatters';
import type { Loan, LoanCategory } from '../../types';

interface AddLoanModalProps {
  onClose: () => void;
  editLoan?: Loan | null;
}

const CATEGORIES: LoanCategory[] = ['Family', 'Friend', 'Business', 'Personal', 'Employee', 'Other'];

const InputField: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}> = ({ label, value, onChange, type = 'text', placeholder, required }) => (
  <div>
    <label className="block text-gray-400 text-xs font-medium mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} required={required}
      className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 focus:bg-white/8 transition-all placeholder-gray-600"
    />
  </div>
);

const AddLoanModal: React.FC<AddLoanModalProps> = ({ onClose, editLoan }) => {
  const { addLoan, updateLoan, borrowers, addBorrower, loans, settings } = useApp();

  const [name, setName] = useState(editLoan?.borrowerName ?? '');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState(editLoan?.notes ?? '');
  const [amount, setAmount] = useState(editLoan ? String(editLoan.amountBorrowed) : '');
  const [interest, setInterest] = useState(editLoan ? String(editLoan.interestRate) : String(settings.defaultInterestRate));
  const [dateBorrowed, setDateBorrowed] = useState(editLoan?.dateBorrowed ?? new Date().toISOString().split('T')[0]);
  const [months, setMonths] = useState(editLoan ? String(editLoan.monthsToPay) : '12');
  const [category, setCategory] = useState<LoanCategory>(editLoan?.category ?? 'Personal');

  const [calc, setCalc] = useState({ interestAmount: 0, totalDue: 0, monthlyPayment: 0, dueDate: '' });

  useEffect(() => {
    const a = parseFloat(amount) || 0;
    const i = parseFloat(interest) || 0;
    const m = parseInt(months) || 1;
    if (a > 0 && m > 0 && dateBorrowed) {
      setCalc(calculateLoan(a, i, m, dateBorrowed));
    }
  }, [amount, interest, months, dateBorrowed]);

  const existingBorrower = borrowers.find(b => b.name.toLowerCase() === name.toLowerCase());

  useEffect(() => {
    if (existingBorrower) {
      setContact(existingBorrower.contact);
      setAddress(existingBorrower.address);
    }
  }, [existingBorrower]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const a = parseFloat(amount);
    const i = parseFloat(interest);
    const m = parseInt(months);
    if (!name || !a || !dateBorrowed || !m) return;

    let borrowerId = existingBorrower?.id ?? '';
    if (!existingBorrower) {
      const nb = { id: crypto.randomUUID(), name, contact, address, notes, createdAt: new Date().toISOString() };
      addBorrower(nb);
      borrowerId = nb.id;
    }

    if (editLoan) {
      updateLoan({
        ...editLoan,
        borrowerName: name, amountBorrowed: a, interestRate: i,
        interestAmount: calc.interestAmount, totalDue: calc.totalDue,
        monthlyPayment: calc.monthlyPayment, monthsToPay: m,
        dateBorrowed, dueDate: calc.dueDate, category, notes,
      });
    } else {
      const newLoan: Loan = {
        id: generateTransactionId(loans),
        borrowerId, borrowerName: name,
        amountBorrowed: a, interestRate: i,
        interestAmount: calc.interestAmount, totalDue: calc.totalDue,
        monthlyPayment: calc.monthlyPayment, monthsToPay: m,
        dateBorrowed, dueDate: calc.dueDate,
        remainingBalance: calc.totalDue,
        status: 'active', category, notes,
        createdAt: new Date().toISOString(),
      };
      addLoan(newLoan);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 sticky top-0 bg-[#111111] z-10">
          <h2 className="text-white font-bold text-lg">{editLoan ? 'Edit Loan' : 'Add New Loan'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Borrower Info */}
          <div>
            <h3 className="text-gray-300 text-sm font-semibold mb-3 pb-2 border-b border-white/5">Borrower Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Borrower Name <span className="text-red-400">*</span></label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Enter full name" list="borrower-names"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 transition-all placeholder-gray-600"
                />
                <datalist id="borrower-names">
                  {borrowers.map(b => <option key={b.id} value={b.name} />)}
                </datalist>
              </div>
              <InputField label="Contact Number" value={contact} onChange={setContact} placeholder="+63 xxx xxxx xxxx" />
              <InputField label="Address" value={address} onChange={setAddress} placeholder="City, Province" />
              <InputField label="Notes" value={notes} onChange={setNotes} placeholder="Optional notes" />
            </div>
          </div>

          {/* Loan Info */}
          <div>
            <h3 className="text-gray-300 text-sm font-semibold mb-3 pb-2 border-b border-white/5">Loan Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Amount Borrowed (₱) <span className="text-red-400">*</span></label>
                <input
                  type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="1"
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 transition-all placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Interest Rate (%)</label>
                <input
                  type="number" value={interest} onChange={e => setInterest(e.target.value)} min="0" step="0.1"
                  placeholder="10"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 transition-all placeholder-gray-600"
                />
              </div>
              <InputField label="Date Borrowed" value={dateBorrowed} onChange={setDateBorrowed} type="date" required />
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Months to Pay <span className="text-red-400">*</span></label>
                <input
                  type="number" value={months} onChange={e => setMonths(e.target.value)} required min="1"
                  placeholder="12"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 transition-all placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Category</label>
                <select
                  value={category} onChange={e => setCategory(e.target.value as LoanCategory)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500/50 transition-all"
                >
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Auto Calculation Preview */}
          {parseFloat(amount) > 0 && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator size={14} className="text-green-400" />
                <span className="text-green-400 text-sm font-semibold">Auto Calculation</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Interest Amount', value: formatPeso(calc.interestAmount) },
                  { label: 'Total Due', value: formatPeso(calc.totalDue) },
                  { label: 'Monthly Payment', value: formatPeso(calc.monthlyPayment) },
                  { label: 'Final Due Date', value: calc.dueDate },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider">{label}</p>
                    <p className="text-white text-sm font-bold mt-1">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-white/10 text-gray-400 rounded-xl text-sm font-medium hover:bg-white/5 transition-all">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 text-black rounded-xl text-sm font-bold transition-all">
              {editLoan ? 'Update Loan' : 'Add Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLoanModal;
