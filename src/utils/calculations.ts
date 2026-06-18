import type { Loan, Installment, InterestMode, MonthlyInterest } from '../types';

export interface LoanCalcResult {
  interestAmount: number;
  totalDue: number;
  monthlyPayment: number;
  dueDate: string;
  monthlyInterestBreakdown: MonthlyInterest[];
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
  dateBorrowed: string,
  interestMode: InterestMode = 'total'
): LoanCalcResult => {
  const start = new Date(dateBorrowed + 'T00:00:00');
  const dueDate = addMonths(start, monthsToPay);

  if (interestMode === 'monthly') {
    // Monthly interest: rate applied each month to principal
    const monthlyRate = interestRate / 100;
    const monthlyInterestBreakdown: MonthlyInterest[] = [];
    let totalInterest = 0;

    for (let i = 1; i <= monthsToPay; i++) {
      const monthInterest = Math.round(amountBorrowed * monthlyRate * 100) / 100;
      totalInterest += monthInterest;
      monthlyInterestBreakdown.push({
        month: i,
        rate: interestRate,
        amount: monthInterest,
      });
    }

    const interestAmount = Math.round(totalInterest * 100) / 100;
    const totalDue = amountBorrowed + interestAmount;
    const monthlyPayment = totalDue / monthsToPay;

    return { interestAmount, totalDue, monthlyPayment, dueDate, monthlyInterestBreakdown };
  }

  // Total interest: single flat rate on principal
  const interestAmount = Math.round(amountBorrowed * (interestRate / 100) * 100) / 100;
  const totalDue = amountBorrowed + interestAmount;
  const monthlyPayment = totalDue / monthsToPay;

  return { interestAmount, totalDue, monthlyPayment, dueDate, monthlyInterestBreakdown: [] };
};

export const generateInstallments = (loan: Loan): Installment[] => {
  const installments: Installment[] = [];
  const start = new Date(loan.dateBorrowed + 'T00:00:00');
  const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  // Round monthly payment to 2 decimal places, adjust last installment for drift
  const roundedMonthly = Math.round(loan.monthlyPayment * 100) / 100;
  const sumBeforeLast = roundedMonthly * (loan.monthsToPay - 1);
  const lastMonthly = Math.round((loan.totalDue - sumBeforeLast) * 100) / 100;

  for (let i = 1; i <= loan.monthsToPay; i++) {
    const dueDateStr = addMonths(start, i);
    let status: Installment['status'] = 'unpaid';
    if (dueDateStr < today) status = 'overdue';
    const monthlyAmount = i === loan.monthsToPay ? lastMonthly : roundedMonthly;
    installments.push({
      id: `${loan.id}-inst-${i}`,
      loanId: loan.id,
      installmentNumber: i,
      dueDate: dueDateStr,
      monthlyAmount,
      amountPaid: 0,
      remainingAmount: monthlyAmount,
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
