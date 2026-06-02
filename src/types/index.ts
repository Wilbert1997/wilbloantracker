export type LoanCategory = 'Family' | 'Friend' | 'Business' | 'Personal' | 'Employee' | 'Other';
export type LoanStatus = 'active' | 'completed' | 'overdue';
export type InstallmentStatus = 'paid' | 'partial' | 'unpaid' | 'overdue';

export interface Borrower {
  id: string;
  name: string;
  contact: string;
  address: string;
  notes: string;
  createdAt: string;
}

export interface Loan {
  id: string;
  borrowerId: string;
  borrowerName: string;
  amountBorrowed: number;
  interestRate: number;
  interestAmount: number;
  totalDue: number;
  monthlyPayment: number;
  monthsToPay: number;
  dateBorrowed: string;
  dueDate: string;
  remainingBalance: number;
  status: LoanStatus;
  category: LoanCategory;
  notes: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  loanId: string;
  borrowerName: string;
  amount: number;
  date: string;
  notes: string;
  referenceNumber: string;
  installmentNumber?: number;
  createdAt: string;
}

export interface Installment {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  monthlyAmount: number;
  amountPaid: number;
  remainingAmount: number;
  status: InstallmentStatus;
}

export interface Settings {
  businessName: string;
  defaultInterestRate: number;
}

export type ActiveTab = 'dashboard' | 'loans' | 'borrowers' | 'payments' | 'installments' | 'analytics' | 'reports' | 'settings';
