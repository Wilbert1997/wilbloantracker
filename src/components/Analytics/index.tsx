import React, { useEffect, useRef, useMemo } from 'react';
import {
  Chart,
  ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Legend, Tooltip,
  DoughnutController, BarController, LineController,
} from 'chart.js';
import { useApp } from '../../context/AppContext';
import { formatPeso } from '../../utils/formatters';

Chart.register(
  ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Legend, Tooltip,
  DoughnutController, BarController, LineController
);

const CHART_DEFAULTS = {
  color: '#9ca3af',
  plugins: {
    legend: { labels: { color: '#9ca3af', font: { size: 11 } } },
    tooltip: { backgroundColor: '#1a1a1a', titleColor: '#fff', bodyColor: '#9ca3af', borderColor: '#333', borderWidth: 1 },
  },
};

const DoughnutChart: React.FC<{ labels: string[]; data: number[]; colors: string[]; title: string }> = ({ labels, data, colors, title }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(ref.current, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: colors.map(c => c + '80'), borderWidth: 1, hoverOffset: 4 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { ...CHART_DEFAULTS.plugins, legend: { ...CHART_DEFAULTS.plugins.legend, position: 'bottom' } },
        cutout: '65%',
      },
    });
    return () => chartRef.current?.destroy();
  }, [labels, data, colors]);

  return (
    <div className="glass-card p-5">
      <h3 className="text-white text-sm font-semibold mb-4">{title}</h3>
      <div className="h-52"><canvas ref={ref} /></div>
    </div>
  );
};

const BarChartComp: React.FC<{ labels: string[]; datasets: { label: string; data: number[]; color: string }[]; title: string }> = ({ labels, datasets, title }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(ref.current, {
      type: 'bar',
      data: {
        labels,
        datasets: datasets.map(d => ({
          label: d.label, data: d.data,
          backgroundColor: d.color + '33', borderColor: d.color, borderWidth: 1.5, borderRadius: 4,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { color: '#ffffff08' } },
          y: { ticks: { color: '#6b7280', font: { size: 10 }, callback: (v) => '₱' + Number(v).toLocaleString() }, grid: { color: '#ffffff08' } },
        },
        plugins: CHART_DEFAULTS.plugins,
      },
    });
    return () => chartRef.current?.destroy();
  }, [labels, datasets]);

  return (
    <div className="glass-card p-5">
      <h3 className="text-white text-sm font-semibold mb-4">{title}</h3>
      <div className="h-52"><canvas ref={ref} /></div>
    </div>
  );
};

const LineChartComp: React.FC<{ labels: string[]; datasets: { label: string; data: number[]; color: string }[]; title: string }> = ({ labels, datasets, title }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map(d => ({
          label: d.label, data: d.data,
          borderColor: d.color, backgroundColor: d.color + '15',
          borderWidth: 2, pointBackgroundColor: d.color, pointRadius: 3,
          tension: 0.4, fill: true,
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { color: '#ffffff08' } },
          y: { ticks: { color: '#6b7280', font: { size: 10 }, callback: (v) => '₱' + Number(v).toLocaleString() }, grid: { color: '#ffffff08' } },
        },
        plugins: CHART_DEFAULTS.plugins,
      },
    });
    return () => chartRef.current?.destroy();
  }, [labels, datasets]);

  return (
    <div className="glass-card p-5">
      <h3 className="text-white text-sm font-semibold mb-4">{title}</h3>
      <div className="h-52"><canvas ref={ref} /></div>
    </div>
  );
};

const Analytics: React.FC = () => {
  const { loans, payments } = useApp();

  const paidVsOutstanding = useMemo(() => {
    const paid = loans.reduce((s, l) => s + (l.totalDue - l.remainingBalance), 0);
    const outstanding = loans.reduce((s, l) => s + l.remainingBalance, 0);
    return { paid, outstanding };
  }, [loans]);

  const monthlyCollections = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('en', { month: 'short', year: '2-digit' });
      months[key] = 0;
    }
    payments.forEach(p => {
      const d = new Date(p.date);
      const key = d.toLocaleString('en', { month: 'short', year: '2-digit' });
      if (key in months) months[key] = (months[key] || 0) + p.amount;
    });
    return months;
  }, [payments]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    loans.forEach(l => { cats[l.category] = (cats[l.category] || 0) + l.amountBorrowed; });
    return cats;
  }, [loans]);

  const statusData = useMemo(() => ({
    active: loans.filter(l => l.status === 'active').length,
    completed: loans.filter(l => l.status === 'completed').length,
    overdue: loans.filter(l => l.status === 'overdue').length,
  }), [loans]);

  const monthlyExpectedVsCollected = useMemo(() => {
    const months: Record<string, { expected: number; collected: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('en', { month: 'short', year: '2-digit' });
      months[key] = { expected: 0, collected: 0 };
    }
    loans.forEach(l => {
      const key = new Date(l.dateBorrowed).toLocaleString('en', { month: 'short', year: '2-digit' });
      if (key in months) months[key].expected += l.monthlyPayment;
    });
    payments.forEach(p => {
      const key = new Date(p.date).toLocaleString('en', { month: 'short', year: '2-digit' });
      if (key in months) months[key].collected += p.amount;
    });
    return months;
  }, [loans, payments]);

  const totalCollected = paidVsOutstanding.paid;
  const totalBorrowed = loans.reduce((s, l) => s + l.amountBorrowed, 0);
  const collectionRate = totalBorrowed > 0 ? (totalCollected / totalBorrowed) * 100 : 0;

  if (loans.length === 0) {
    return (
      <div className="space-y-5">
        <h2 className="text-white text-2xl font-bold">Analytics</h2>
        <div className="glass-card p-12 text-center">
          <p className="text-gray-400">No data to display. Add loans to see analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white text-2xl font-bold">Analytics</h2>
        <p className="text-gray-500 text-sm mt-1">Collection performance at a glance</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Disbursed', value: formatPeso(totalBorrowed), color: 'text-blue-400' },
          { label: 'Total Collected', value: formatPeso(totalCollected), color: 'text-green-400' },
          { label: 'Outstanding', value: formatPeso(paidVsOutstanding.outstanding), color: 'text-amber-400' },
          { label: 'Collection Rate', value: `${collectionRate.toFixed(1)}%`, color: 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-5 text-center">
            <p className="text-gray-500 text-xs uppercase tracking-wider">{label}</p>
            <p className={`text-xl font-bold mt-2 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <DoughnutChart
          title="Paid vs Outstanding"
          labels={['Collected', 'Outstanding']}
          data={[paidVsOutstanding.paid, paidVsOutstanding.outstanding]}
          colors={['#22c55e', '#f59e0b']}
        />
        <DoughnutChart
          title="Loan Status Distribution"
          labels={['Active', 'Completed', 'Overdue']}
          data={[statusData.active, statusData.completed, statusData.overdue]}
          colors={['#3b82f6', '#22c55e', '#ef4444']}
        />
        <DoughnutChart
          title="Loan Category Breakdown"
          labels={Object.keys(categoryData)}
          data={Object.values(categoryData)}
          colors={['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']}
        />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BarChartComp
          title="Monthly Collections (Last 6 Months)"
          labels={Object.keys(monthlyCollections)}
          datasets={[{ label: 'Collected', data: Object.values(monthlyCollections), color: '#22c55e' }]}
        />
        <LineChartComp
          title="Expected vs Collected (Last 6 Months)"
          labels={Object.keys(monthlyExpectedVsCollected)}
          datasets={[
            { label: 'Expected', data: Object.values(monthlyExpectedVsCollected).map(m => m.expected), color: '#3b82f6' },
            { label: 'Collected', data: Object.values(monthlyExpectedVsCollected).map(m => m.collected), color: '#22c55e' },
          ]}
        />
      </div>
    </div>
  );
};

export default Analytics;
