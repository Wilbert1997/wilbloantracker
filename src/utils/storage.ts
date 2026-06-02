import type { Borrower, Loan, Payment, Installment, Settings } from '../types';

const KEYS = {
  borrowers: 'wilbloan_borrowers',
  loans: 'wilbloan_loans',
  payments: 'wilbloan_payments',
  installments: 'wilbloan_installments',
  settings: 'wilbloan_settings',
};

const load = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const save = (key: string, data: unknown): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const storage = {
  getBorrowers: (): Borrower[] => load<Borrower[]>(KEYS.borrowers, []),
  saveBorrowers: (b: Borrower[]) => save(KEYS.borrowers, b),

  getLoans: (): Loan[] => load<Loan[]>(KEYS.loans, []),
  saveLoans: (l: Loan[]) => save(KEYS.loans, l),

  getPayments: (): Payment[] => load<Payment[]>(KEYS.payments, []),
  savePayments: (p: Payment[]) => save(KEYS.payments, p),

  getInstallments: (): Installment[] => load<Installment[]>(KEYS.installments, []),
  saveInstallments: (i: Installment[]) => save(KEYS.installments, i),

  getSettings: (): Settings => load<Settings>(KEYS.settings, { businessName: 'WilbLoan', defaultInterestRate: 10 }),
  saveSettings: (s: Settings) => save(KEYS.settings, s),

  exportAll: () => {
    return {
      borrowers: load<Borrower[]>(KEYS.borrowers, []),
      loans: load<Loan[]>(KEYS.loans, []),
      payments: load<Payment[]>(KEYS.payments, []),
      installments: load<Installment[]>(KEYS.installments, []),
      settings: load<Settings>(KEYS.settings, { businessName: 'WilbLoan', defaultInterestRate: 10 }),
    };
  },

  importAll: (data: ReturnType<typeof storage.exportAll>) => {
    save(KEYS.borrowers, data.borrowers);
    save(KEYS.loans, data.loans);
    save(KEYS.payments, data.payments);
    save(KEYS.installments, data.installments);
    save(KEYS.settings, data.settings);
  },

  clearAll: () => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  },
};
