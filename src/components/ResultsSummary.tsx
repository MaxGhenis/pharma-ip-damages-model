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
        <div className="card p-5">
          <h3 className="data-label mb-4">Monte Carlo Confidence Intervals</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="data-label">5th Percentile</span>
              <p className="data-value text-lg mt-1" style={{ color: 'var(--accent-rose)' }}>
                {formatCurrency(monteCarloResults.totalDamages.percentile5)}
              </p>
            </div>
            <div>
              <span className="data-label">Median (50th)</span>
              <p className="data-value text-lg mt-1" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(monteCarloResults.totalDamages.median)}
              </p>
            </div>
            <div>
              <span className="data-label">Mean</span>
              <p className="data-value text-lg mt-1" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(monteCarloResults.totalDamages.mean)}
              </p>
            </div>
            <div>
              <span className="data-label">95th Percentile</span>
              <p className="data-value text-lg mt-1" style={{ color: 'var(--accent-emerald)' }}>
                {formatCurrency(monteCarloResults.totalDamages.percentile95)}
              </p>
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
      className={isPrimary ? 'card-elevated p-5' : 'card p-5'}
      style={isPrimary ? {
        background: 'linear-gradient(135deg, var(--bg-tertiary), var(--bg-elevated))',
        borderColor: 'var(--accent-gold-dim)'
      } : undefined}
    >
      <h3 className="data-label">{title}</h3>
      <p
        className="data-value text-2xl mt-2"
        style={{ color: isPrimary ? 'var(--accent-gold)' : 'var(--text-primary)' }}
      >
        {formatCurrency(value)}
      </p>
      {(low !== undefined && high !== undefined) && (
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Range: {formatCurrency(low)} - {formatCurrency(high)}
        </p>
      )}
      {monteCarlo && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
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
    <div className="card p-4">
      <h4 className="data-label">{title}</h4>
      <p className="data-value text-lg mt-1" style={{ color: 'var(--text-primary)' }}>
        {isPercent ? `${(value * 100).toFixed(2)}%` : formatCurrency(value)}
      </p>
      {subtitle && (
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
      )}
    </div>
  );
}
