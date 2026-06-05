export const formatPeso = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('PHP', '₱');
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const daysRemaining = (dueDateStr: string): { days: number; label: string; overdue: boolean } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dueDateStr.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff > 0) return { days: diff, label: `${diff} Day${diff !== 1 ? 's' : ''} Remaining`, overdue: false };
  if (diff === 0) return { days: 0, label: 'Due Today', overdue: false };
  return { days: Math.abs(diff), label: `${Math.abs(diff)} Day${Math.abs(diff) !== 1 ? 's' : ''} Overdue`, overdue: true };
};
