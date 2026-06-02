import type { Loan, Installment } from '../types';

export interface LoanCalcResult {
  interestAmount: number;
  totalDue: number;
  monthlyPayment: number;
  dueDate: string;
}

export const calculateLoan = (
  amountBorrowed: number,
  interestRate: number,
  monthsToPay: number,
  dateBorrowed: string
): LoanCalcResult => {
  const interestAmount = amountBorrowed * (interestRate / 100);
  const totalDue = amountBorrowed + interestAmount;
  const monthlyPayment = totalDue / monthsToPay;
  const start = new Date(dateBorrowed);
  start.setMonth(start.getMonth() + monthsToPay);
  const dueDate = start.toISOString().split('T')[0];
  return { interestAmount, totalDue, monthlyPayment, dueDate };
};

export const generateInstallments = (loan: Loan): Installment[] => {
  const installments: Installment[] = [];
  const start = new Date(loan.dateBorrowed);
  for (let i = 1; i <= loan.monthsToPay; i++) {
    const due = new Date(start);
    due.setMonth(due.getMonth() + i);
    const dueDateStr = due.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    let status: Installment['status'] = 'unpaid';
    if (dueDateStr < today) status = 'overdue';
    installments.push({
      id: `${loan.id}-inst-${i}`,
      loanId: loan.id,
      installmentNumber: i,
      dueDate: dueDateStr,
      monthlyAmount: loan.monthlyPayment,
      amountPaid: 0,
      remainingAmount: loan.monthlyPayment,
      status,
    });
  }
  return installments;
};

export const generateTransactionId = (existing: Loan[]): string => {
  const year = new Date().getFullYear();
  const num = existing.length + 1;
  return `WLB-${year}-${String(num).padStart(4, '0')}`;
};
