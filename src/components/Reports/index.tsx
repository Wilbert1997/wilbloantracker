import React from 'react';
import { FileText, Download, FileSpreadsheet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatPeso, formatDate } from '../../utils/formatters';

const downloadCSV = (filename: string, rows: string[][]) => {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const Reports: React.FC = () => {
  const { loans, borrowers, payments, installments } = useApp();

  const exportLoanSummaryCSV = () => {
    const headers = ['Transaction ID', 'Borrower', 'Amount Borrowed', 'Interest Rate', 'Interest Amount', 'Total Due', 'Monthly Payment', 'Months', 'Date Borrowed', 'Due Date', 'Remaining Balance', 'Status', 'Category'];
    const rows = loans.map(l => [l.id, l.borrowerName, l.amountBorrowed, `${l.interestRate}%`, l.interestAmount, l.totalDue, l.monthlyPayment, l.monthsToPay, l.dateBorrowed, l.dueDate, l.remainingBalance, l.status, l.category]);
    downloadCSV('WilbLoan_Loan_Summary.csv', [headers, ...rows.map(r => r.map(String))]);
  };

  const exportBorrowersCSV = () => {
    const headers = ['Name', 'Contact', 'Address', 'Active Loans', 'Total Borrowed', 'Outstanding', 'Notes'];
    const rows = borrowers.map(b => {
      const bLoans = loans.filter(l => l.borrowerName === b.name);
      return [b.name, b.contact, b.address, bLoans.filter(l => l.status === 'active').length, bLoans.reduce((s, l) => s + l.amountBorrowed, 0), bLoans.reduce((s, l) => s + l.remainingBalance, 0), b.notes];
    });
    downloadCSV('WilbLoan_Borrowers.csv', [headers, ...rows.map(r => r.map(String))]);
  };

  const exportPaymentsCSV = () => {
    const headers = ['Reference', 'Borrower', 'Loan ID', 'Amount', 'Date', 'Installment #', 'Notes'];
    const rows = payments.map(p => [p.referenceNumber, p.borrowerName, p.loanId, p.amount, p.date, p.installmentNumber ?? '', p.notes]);
    downloadCSV('WilbLoan_Payments.csv', [headers, ...rows.map(r => r.map(String))]);
  };

  const exportInstallmentsCSV = () => {
    const headers = ['Loan ID', 'Borrower', 'Inst. #', 'Due Date', 'Monthly Amount', 'Amount Paid', 'Remaining', 'Status'];
    const rows = installments.map(inst => {
      const loan = loans.find(l => l.id === inst.loanId);
      return [inst.loanId, loan?.borrowerName ?? '', inst.installmentNumber, inst.dueDate, inst.monthlyAmount, inst.amountPaid, inst.remainingAmount, inst.status];
    });
    downloadCSV('WilbLoan_Installments.csv', [headers, ...rows.map(r => r.map(String))]);
  };

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('WilbLoan', 14, 14);
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'normal');
    doc.text('Smart Loan & Repayment Tracker', 14, 21);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-PH')}`, pageW - 14, 21, { align: 'right' });

    let y = 36;

    // Summary
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Loan Summary Report', 14, y); y += 6;

    const totalBorrowed = loans.reduce((s, l) => s + l.amountBorrowed, 0);
    const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
    const outstanding = loans.reduce((s, l) => s + l.remainingBalance, 0);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 163, 175);
    [
      ['Total Loans:', String(loans.length)],
      ['Total Borrowed:', formatPeso(totalBorrowed)],
      ['Total Collected:', formatPeso(totalCollected)],
      ['Outstanding Balance:', formatPeso(outstanding)],
      ['Active Loans:', String(loans.filter(l => l.status === 'active').length)],
      ['Overdue Loans:', String(loans.filter(l => l.status === 'overdue').length)],
    ].forEach(([label, val]) => {
      doc.text(label, 14, y);
      doc.setTextColor(255, 255, 255);
      doc.text(val, 80, y);
      doc.setTextColor(156, 163, 175);
      y += 5.5;
    });

    y += 6;

    // Loan table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('Loan Details', 14, y); y += 5;

    // Table header
    doc.setFillColor(17, 17, 17);
    doc.rect(14, y, pageW - 28, 7, 'F');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'bold');
    ['ID', 'Borrower', 'Amount', 'Total Due', 'Balance', 'Status'].forEach((h, i) => {
      doc.text(h, 14 + i * 30, y + 4.5);
    });
    y += 7;

    doc.setFont('helvetica', 'normal');
    loans.forEach((l, idx) => {
      if (y > 270) { doc.addPage(); y = 20; }
      if (idx % 2 === 0) {
        doc.setFillColor(20, 20, 20);
        doc.rect(14, y, pageW - 28, 6.5, 'F');
      }
      doc.setTextColor(200, 200, 200);
      doc.text(l.id, 14, y + 4.5);
      doc.text(l.borrowerName.slice(0, 14), 44, y + 4.5);
      doc.text(formatPeso(l.amountBorrowed), 74, y + 4.5);
      doc.text(formatPeso(l.totalDue), 104, y + 4.5);
      doc.text(formatPeso(l.remainingBalance), 134, y + 4.5);
      const sColor = l.status === 'completed' ? [34, 197, 94] : l.status === 'overdue' ? [239, 68, 68] : [59, 130, 246];
      doc.setTextColor(sColor[0], sColor[1], sColor[2]);
      doc.text(l.status, 164, y + 4.5);
      doc.setTextColor(200, 200, 200);
      y += 6.5;
    });

    doc.save('WilbLoan_Report.pdf');
  };

  const reportTypes = [
    {
      title: 'Loan Summary Report',
      desc: `${loans.length} loans · Export all loan records with amounts, interest, and status`,
      onCSV: exportLoanSummaryCSV,
      onPDF: exportPDF,
    },
    {
      title: 'Borrower Report',
      desc: `${borrowers.length} borrowers · Export borrower profiles with loan summaries`,
      onCSV: exportBorrowersCSV,
      onPDF: null,
    },
    {
      title: 'Payment Report',
      desc: `${payments.length} payments · All recorded payments with reference numbers`,
      onCSV: exportPaymentsCSV,
      onPDF: null,
    },
    {
      title: 'Installment Schedule',
      desc: `${installments.length} installments · Full repayment schedules for all loans`,
      onCSV: exportInstallmentsCSV,
      onPDF: null,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white text-2xl font-bold">Reports</h2>
        <p className="text-gray-500 text-sm mt-1">Export your data as CSV or PDF</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reportTypes.map(({ title, desc, onCSV, onPDF }) => (
          <div key={title} className="glass-card p-6 hover-lift">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold">{title}</h3>
                <p className="text-gray-500 text-xs mt-1">{desc}</p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={onCSV}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-all"
                  >
                    <FileSpreadsheet size={13} />
                    Export CSV
                  </button>
                  {onPDF && (
                    <button
                      onClick={onPDF}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition-all"
                    >
                      <Download size={13} />
                      Export PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="glass-card p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <FileText size={16} className="text-green-400" />
          Quick Preview — Recent Transactions
        </h3>
        {payments.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No transactions to preview.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  {['Reference', 'Borrower', 'Loan ID', 'Amount', 'Date'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-gray-500 uppercase tracking-wider font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/3">
                {[...payments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10).map(p => (
                  <tr key={p.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-3 py-2.5 text-gray-400 font-mono">{p.referenceNumber}</td>
                    <td className="px-3 py-2.5 text-white font-medium">{p.borrowerName}</td>
                    <td className="px-3 py-2.5 text-green-400 font-mono">{p.loanId}</td>
                    <td className="px-3 py-2.5 text-green-400 font-semibold">{formatPeso(p.amount)}</td>
                    <td className="px-3 py-2.5 text-gray-400">{formatDate(p.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
