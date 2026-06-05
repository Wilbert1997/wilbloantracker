import type { Loan, Installment } from '../types';

export interface LoanCalcResult {
  interestAmount: number;
  totalDue: number;
  monthlyPayment: number;
  dueDate: string;
}

function addMonths(date: Date, months: number): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const targetMonth = d.getMonth() + months;
  const targetYear = d.getFullYear() + Math.floor(targetMonth / 12);
  const targetMo = ((targetMonth % 12) + 12) % 12;
  const maxDay = new Date(targetYear, targetMo + 1, 0).getDate();
  const targetDay = Math.min(d.getDate(), maxDay);
  const result = new Date(targetYear, targetMo, targetDay);
  return `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`;
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
  const start = new Date(dateBorrowed + 'T00:00:00');
  const dueDate = addMonths(start, monthsToPay);
  return { interestAmount, totalDue, monthlyPayment, dueDate };
};

export const generateInstallments = (loan: Loan): Installment[] => {
  const installments: Installment[] = [];
  const start = new Date(loan.dateBorrowed + 'T00:00:00');
  const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  for (let i = 1; i <= loan.monthsToPay; i++) {
    const dueDateStr = addMonths(start, i);
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
