import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Borrower, Loan, Payment, Installment, Settings } from '../types';
import { storage } from '../utils/storage';
import { generateInstallments } from '../utils/calculations';

interface AppState {
  borrowers: Borrower[];
  loans: Loan[];
  payments: Payment[];
  installments: Installment[];
  settings: Settings;
}

interface AppContextType extends AppState {
  addBorrower: (b: Borrower) => void;
  updateBorrower: (b: Borrower) => void;
  deleteBorrower: (id: string) => void;
  addLoan: (l: Loan) => void;
  updateLoan: (l: Loan) => void;
  deleteLoan: (id: string) => void;
  addPayment: (p: Payment) => void;
  updateInstallment: (inst: Installment) => void;
  updateSettings: (s: Settings) => void;
  refreshStatuses: () => void;
  importData: (data: AppState) => void;
  clearAll: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [borrowers, setBorrowers] = useState<Borrower[]>(() => storage.getBorrowers());
  const [loans, setLoans] = useState<Loan[]>(() => storage.getLoans());
  const [payments, setPayments] = useState<Payment[]>(() => storage.getPayments());
  const [installments, setInstallments] = useState<Installment[]>(() => storage.getInstallments());
  const [settings, setSettings] = useState<Settings>(() => storage.getSettings());

  const refreshStatuses = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setLoans(prev => {
      const updated = prev.map(loan => {
        const loanInst = installments.filter(i => i.loanId === loan.id);
        const allPaid = loanInst.length > 0 && loanInst.every(i => i.status === 'paid');
        const hasOverdue = loanInst.some(i => i.status === 'overdue');
        let status = loan.status;
        if (allPaid || loan.remainingBalance <= 0) status = 'completed';
        else if (hasOverdue || loan.dueDate < today) status = 'overdue';
        else status = 'active';
        return { ...loan, status };
      });
      storage.saveLoans(updated);
      return updated;
    });
    setInstallments(prev => {
      const updated = prev.map(inst => {
        if (inst.status === 'paid') return inst;
        if (inst.amountPaid > 0 && inst.amountPaid < inst.monthlyAmount) {
          return { ...inst, status: 'partial' as const };
        }
        if (inst.dueDate < today && inst.status !== 'paid') {
          return { ...inst, status: 'overdue' as const };
        }
        return inst;
      });
      storage.saveInstallments(updated);
      return updated;
    });
  }, [installments]);

  useEffect(() => { refreshStatuses(); }, []);

  const addBorrower = useCallback((b: Borrower) => {
    setBorrowers(prev => { const n = [...prev, b]; storage.saveBorrowers(n); return n; });
  }, []);

  const updateBorrower = useCallback((b: Borrower) => {
    setBorrowers(prev => { const n = prev.map(x => x.id === b.id ? b : x); storage.saveBorrowers(n); return n; });
  }, []);

  const deleteBorrower = useCallback((id: string) => {
    setBorrowers(prev => { const n = prev.filter(x => x.id !== id); storage.saveBorrowers(n); return n; });
  }, []);

  const addLoan = useCallback((l: Loan) => {
    setLoans(prev => { const n = [...prev, l]; storage.saveLoans(n); return n; });
    const newInst = generateInstallments(l);
    setInstallments(prev => { const n = [...prev, ...newInst]; storage.saveInstallments(n); return n; });
  }, []);

  const updateLoan = useCallback((l: Loan) => {
    setLoans(prev => { const n = prev.map(x => x.id === l.id ? l : x); storage.saveLoans(n); return n; });
  }, []);

  const deleteLoan = useCallback((id: string) => {
    setLoans(prev => { const n = prev.filter(x => x.id !== id); storage.saveLoans(n); return n; });
    setInstallments(prev => { const n = prev.filter(x => x.loanId !== id); storage.saveInstallments(n); return n; });
    setPayments(prev => { const n = prev.filter(x => x.loanId !== id); storage.savePayments(n); return n; });
  }, []);

  const addPayment = useCallback((p: Payment) => {
    setPayments(prev => { const n = [...prev, p]; storage.savePayments(n); return n; });
    setLoans(prev => {
      const n = prev.map(loan => {
        if (loan.id !== p.loanId) return loan;
        const newBalance = Math.max(0, loan.remainingBalance - p.amount);
        const status = newBalance <= 0 ? 'completed' as const : loan.status;
        return { ...loan, remainingBalance: newBalance, status };
      });
      storage.saveLoans(n);
      return n;
    });
    if (p.installmentNumber) {
      setInstallments(prev => {
        const n = prev.map(inst => {
          if (inst.loanId !== p.loanId || inst.installmentNumber !== p.installmentNumber) return inst;
          const newPaid = inst.amountPaid + p.amount;
          const newRemaining = Math.max(0, inst.monthlyAmount - newPaid);
          const status = newRemaining <= 0 ? 'paid' as const : 'partial' as const;
          return { ...inst, amountPaid: newPaid, remainingAmount: newRemaining, status };
        });
        storage.saveInstallments(n);
        return n;
      });
    }
  }, []);

  const updateInstallment = useCallback((inst: Installment) => {
    setInstallments(prev => { const n = prev.map(x => x.id === inst.id ? inst : x); storage.saveInstallments(n); return n; });
  }, []);

  const updateSettings = useCallback((s: Settings) => {
    setSettings(s);
    storage.saveSettings(s);
  }, []);

  const importData = useCallback((data: AppState) => {
    setBorrowers(data.borrowers);
    setLoans(data.loans);
    setPayments(data.payments);
    setInstallments(data.installments);
    setSettings(data.settings);
    storage.importAll(data);
  }, []);

  const clearAll = useCallback(() => {
    setBorrowers([]);
    setLoans([]);
    setPayments([]);
    setInstallments([]);
    setSettings({ businessName: 'WilbLoan', defaultInterestRate: 10 });
    storage.clearAll();
  }, []);

  return (
    <AppContext.Provider value={{
      borrowers, loans, payments, installments, settings,
      addBorrower, updateBorrower, deleteBorrower,
      addLoan, updateLoan, deleteLoan,
      addPayment, updateInstallment, updateSettings,
      refreshStatuses, importData, clearAll,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
