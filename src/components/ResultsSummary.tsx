import React from 'react';
import { DamagesSummary, MonteCarloResult } from '../types';
import { formatCurrency } from '../utils/uncertainty';

interface ResultsSummaryProps {
  summary: DamagesSummary;
  monteCarloResults?: {
    totalDamages: MonteCarloResult;
    lostProfits: MonteCarloResult;
    royalties: MonteCarloResult;
  };
}

export function ResultsSummary({ summary, monteCarloResults }: ResultsSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Top-level damages summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Damages"
          value={summary.totalDamages.base}
          low={summary.totalDamages.low}
          high={summary.totalDamages.high}
          isPrimary
          monteCarlo={monteCarloResults?.totalDamages}
        />
        <SummaryCard
          title="Lost Profits"
          value={summary.lostProfits.base}
          low={summary.lostProfits.low}
          high={summary.lostProfits.high}
          monteCarlo={monteCarloResults?.lostProfits}
        />
        <SummaryCard
          title="Reasonable Royalty"
          value={summary.reasonableRoyalty.base}
          low={summary.reasonableRoyalty.low}
          high={summary.reasonableRoyalty.high}
          monteCarlo={monteCarloResults?.royalties}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Price Erosion"
          value={summary.priceErosion.base}
          subtitle="Included in Lost Profits"
        />
        <MetricCard
          title="Present Value"
          value={summary.presentValueDamages.base}
          subtitle="Discounted to today"
        />
        <MetricCard
          title="Prejudgment Interest"
          value={summary.prejudgmentInterest.base}
          subtitle="Through judgment date"
        />
        {summary.rubinsteinRoyalty && (
          <MetricCard
            title="Rubinstein Royalty"
            value={summary.rubinsteinRoyalty}
            isPercent
            subtitle="Negotiated rate"
          />
        )}
      </div>

      {/* Monte Carlo confidence intervals */}
      {monteCarloResults && (
        <div className="bg-sky-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Monte Carlo Confidence Intervals</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">5th Percentile</span>
              <p className="font-semibold">{formatCurrency(monteCarloResults.totalDamages.percentile5)}</p>
            </div>
            <div>
              <span className="text-gray-500">Median (50th)</span>
              <p className="font-semibold">{formatCurrency(monteCarloResults.totalDamages.median)}</p>
            </div>
            <div>
              <span className="text-gray-500">Mean</span>
              <p className="font-semibold">{formatCurrency(monteCarloResults.totalDamages.mean)}</p>
            </div>
            <div>
              <span className="text-gray-500">95th Percentile</span>
              <p className="font-semibold">{formatCurrency(monteCarloResults.totalDamages.percentile95)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  low?: number;
  high?: number;
  isPrimary?: boolean;
  monteCarlo?: MonteCarloResult;
}

function SummaryCard({ title, value, low, high, isPrimary = false, monteCarlo }: SummaryCardProps) {
  return (
    <div
      className={`rounded-lg p-4 ${
        isPrimary
          ? 'bg-gradient-to-br from-sky-600 to-sky-700 text-white'
          : 'bg-white border border-gray-200'
      }`}
    >
      <h3 className={`text-sm font-medium ${isPrimary ? 'text-sky-100' : 'text-gray-500'}`}>
        {title}
      </h3>
      <p className={`text-2xl font-bold mt-1 ${isPrimary ? 'text-white' : 'text-gray-900'}`}>
        {formatCurrency(value)}
      </p>
      {(low !== undefined && high !== undefined) && (
        <p className={`text-xs mt-1 ${isPrimary ? 'text-sky-200' : 'text-gray-500'}`}>
          Range: {formatCurrency(low)} - {formatCurrency(high)}
        </p>
      )}
      {monteCarlo && (
        <div className={`mt-2 pt-2 border-t ${isPrimary ? 'border-sky-500' : 'border-gray-100'}`}>
          <p className={`text-xs ${isPrimary ? 'text-sky-200' : 'text-gray-500'}`}>
            90% CI: {formatCurrency(monteCarlo.percentile5)} - {formatCurrency(monteCarlo.percentile95)}
          </p>
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  isPercent?: boolean;
}

function MetricCard({ title, value, subtitle, isPercent = false }: MetricCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <h4 className="text-xs font-medium text-gray-500">{title}</h4>
      <p className="text-lg font-semibold text-gray-900 mt-1">
        {isPercent ? `${(value * 100).toFixed(2)}%` : formatCurrency(value)}
      </p>
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}
