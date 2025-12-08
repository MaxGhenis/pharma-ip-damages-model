import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TooltipItem,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { YearlyDamages, MonteCarloResult, SensitivityResult } from '../types';
import { formatCurrency } from '../utils/uncertainty';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface YearlyDamagesChartProps {
  data: YearlyDamages[];
}

export function YearlyDamagesChart({ data }: YearlyDamagesChartProps) {
  const chartData = {
    labels: data.map((d) => d.year.toString()),
    datasets: [
      {
        label: 'Lost Profits',
        data: data.map((d) => d.lostProfits / 1e6),
        backgroundColor: 'rgba(14, 165, 233, 0.8)',
        stack: 'damages',
      },
      {
        label: 'Price Erosion',
        data: data.map((d) => d.priceErosion / 1e6),
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        stack: 'damages',
      },
      {
        label: 'Reasonable Royalty',
        data: data.map((d) => d.reasonableRoyalty / 1e6),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        stack: 'damages',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Yearly Damages Breakdown ($M)',
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const value = context.parsed.y ?? 0;
            return `${context.dataset.label}: $${value.toFixed(1)}M`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Damages ($M)',
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  );
}

interface MonteCarloChartProps {
  result: MonteCarloResult;
  title: string;
}

export function MonteCarloChart({ result, title }: MonteCarloChartProps) {
  const chartData = {
    labels: result.histogram.map((h) => formatCurrency(h.bin)),
    datasets: [
      {
        label: 'Frequency',
        data: result.histogram.map((h) => h.count),
        backgroundColor: 'rgba(14, 165, 233, 0.6)',
        borderColor: 'rgba(14, 165, 233, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Damages',
        },
        ticks: {
          maxTicksLimit: 8,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Frequency',
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}

interface SensitivityChartProps {
  results: SensitivityResult[];
}

export function SensitivityChart({ results }: SensitivityChartProps) {
  // Tornado chart - sorted by impact
  const sortedResults = [...results].sort(
    (a, b) => Math.abs(b.highDamages - b.lowDamages) - Math.abs(a.highDamages - a.lowDamages)
  );

  const baseDamages = sortedResults[0]?.baseDamages || 0;

  const chartData = {
    labels: sortedResults.map((r) => r.parameter),
    datasets: [
      {
        label: 'Low Scenario',
        data: sortedResults.map((r) => (r.lowDamages - baseDamages) / 1e6),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
      },
      {
        label: 'High Scenario',
        data: sortedResults.map((r) => (r.highDamages - baseDamages) / 1e6),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Sensitivity Analysis (Deviation from Base Case, $M)',
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const value = context.parsed.x ?? 0;
            const sign = value >= 0 ? '+' : '';
            return `${context.dataset.label}: ${sign}$${value.toFixed(1)}M`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Change in Damages ($M)',
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  );
}

interface SCurveChartProps {
  data: { year: number; adoption: number; cumulativeAdoption: number }[];
}

export function SCurveChart({ data }: SCurveChartProps) {
  const chartData = {
    labels: data.map((d) => d.year.toString()),
    datasets: [
      {
        label: 'Cumulative Adoption',
        data: data.map((d) => d.cumulativeAdoption / 1e6),
        borderColor: 'rgba(14, 165, 233, 1)',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Annual Adoption',
        data: data.map((d) => d.adoption / 1e6),
        borderColor: 'rgba(249, 115, 22, 1)',
        backgroundColor: 'transparent',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'S-Curve Market Adoption ($M)',
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Market Size ($M)',
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}

interface MarketShareChartProps {
  data: { year: number; plaintiffShare: number; defendantShare: number }[];
  butForData?: { year: number; plaintiffShare: number; defendantShare: number }[];
}

export function MarketShareChart({ data, butForData }: MarketShareChartProps) {
  const datasets = [
    {
      label: 'Plaintiff (Actual)',
      data: data.map((d) => d.plaintiffShare * 100),
      borderColor: 'rgba(14, 165, 233, 1)',
      backgroundColor: 'transparent',
    },
    {
      label: 'Defendant (Actual)',
      data: data.map((d) => d.defendantShare * 100),
      borderColor: 'rgba(239, 68, 68, 1)',
      backgroundColor: 'transparent',
    },
  ];

  if (butForData) {
    datasets.push({
      label: 'Plaintiff (But-For)',
      data: butForData.map((d) => d.plaintiffShare * 100),
      borderColor: 'rgba(14, 165, 233, 0.5)',
      backgroundColor: 'transparent',
    });
  }

  const chartData = {
    labels: data.map((d) => d.year.toString()),
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Market Share Over Time (%)',
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Market Share (%)',
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}
