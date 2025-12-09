import React from 'react';
import {
  ValidationReport as ValidationReportType,
  InputValidation,
  MethodologyComparison,
} from '../types/validation';
import { formatValidationStatus } from '../utils/validation';
import { formatCurrency } from '../utils/uncertainty';
import { ExpandableSection } from './ExpandableSection';

interface ValidationReportProps {
  report: ValidationReportType;
  onClose: () => void;
}

export function ValidationReportView({ report, onClose }: ValidationReportProps) {
  const statusInfo = formatValidationStatus(report.overallStatus);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header
        className="border-b sticky top-0 z-10"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)' }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="badge badge-gold">DAUBERT VALIDATION</span>
              <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Accuracy & Reliability Report
              </span>
            </div>
            <h1
              className="font-display text-2xl font-semibold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Validation Report
            </h1>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
          >
            Close
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Overall Status */}
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Overall Status
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {statusInfo.description}
              </p>
            </div>
            <div
              className="px-4 py-2 rounded-lg text-lg font-semibold"
              style={{ background: statusInfo.color + '20', color: statusInfo.color }}
            >
              {statusInfo.label}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <ScoreCard
              label="Documentation"
              score={report.daubertFactors.sufficientBasis.score}
              detail={`${report.daubertFactors.sufficientBasis.documentedInputs}/${report.daubertFactors.sufficientBasis.totalInputs} inputs sourced`}
            />
            <ScoreCard
              label="Methods"
              score={report.daubertFactors.reliableMethods.score}
              detail={`${report.daubertFactors.reliableMethods.methodsUsed.length} accepted methods`}
            />
            <ScoreCard
              label="Reasonableness"
              score={report.daubertFactors.properApplication.score}
              detail={`${report.daubertFactors.properApplication.failures.length} concerns`}
            />
          </div>
        </section>

        {/* Recommendations */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Recommendations
          </h2>
          <ul className="space-y-3">
            {report.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background: rec.startsWith('CRITICAL')
                      ? 'var(--accent-rose)'
                      : rec.startsWith('HIGH PRIORITY')
                      ? 'var(--accent-gold)'
                      : rec.startsWith('STRENGTH')
                      ? 'var(--accent-emerald)'
                      : 'var(--text-muted)',
                  }}
                />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {rec}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Methodology Comparisons */}
        <ExpandableSection title="Cross-Methodology Validation" defaultOpen>
          <div className="space-y-4">
            {report.methodologyComparisons.map((comparison, i) => (
              <MethodologyComparisonCard key={i} comparison={comparison} />
            ))}
            {report.methodologyComparisons.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Enable multiple methodologies to see cross-validation results.
              </p>
            )}
          </div>
        </ExpandableSection>

        {/* Input Validations */}
        <ExpandableSection title="Input Documentation & Reasonableness" defaultOpen>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="text-left">Input</th>
                  <th className="text-center">Documented</th>
                  <th className="text-center">Reasonableness</th>
                  <th className="text-center">Sensitivity</th>
                  <th className="text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {report.inputValidations.map((validation, i) => (
                  <InputValidationRow key={i} validation={validation} />
                ))}
              </tbody>
            </table>
          </div>
        </ExpandableSection>

        {/* Sensitivity Summary */}
        <ExpandableSection title="Result Robustness">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="data-label mb-3">Top Drivers of Uncertainty</h4>
              <ul className="space-y-2">
                {report.sensitivitySummary.topDrivers.map((driver, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>{driver.input}</span>
                    <span className="font-mono" style={{ color: 'var(--accent-gold)' }}>
                      {driver.elasticity.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="data-label mb-3">Robustness Score</h4>
              <div className="flex items-center gap-4">
                <div
                  className="text-3xl font-semibold"
                  style={{
                    color:
                      report.sensitivitySummary.robustnessScore >= 70
                        ? 'var(--accent-emerald)'
                        : report.sensitivitySummary.robustnessScore >= 50
                        ? 'var(--accent-gold)'
                        : 'var(--accent-rose)',
                  }}
                >
                  {report.sensitivitySummary.robustnessScore}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  <p>Higher = more stable results</p>
                  <p>Based on Monte Carlo variation</p>
                </div>
              </div>
            </div>
          </div>
        </ExpandableSection>

        {/* Reproducibility */}
        <ExpandableSection title="Reproducibility">
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4">
              <span className="data-label">Model Version</span>
              <p className="font-mono mt-1" style={{ color: 'var(--text-primary)' }}>
                {report.reproducibility.modelVersion}
              </p>
            </div>
            <div className="card p-4">
              <span className="data-label">Input Hash</span>
              <p className="font-mono mt-1" style={{ color: 'var(--accent-gold)' }}>
                {report.reproducibility.calculationHash}
              </p>
            </div>
            <div className="card p-4">
              <span className="data-label">Replicable</span>
              <p className="mt-1" style={{ color: 'var(--accent-emerald)' }}>
                {report.reproducibility.canReplicate ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
          <p className="text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
            The input hash uniquely identifies this calculation. Opposing experts can verify results
            by running the same inputs through the model.
          </p>
        </ExpandableSection>

        {/* Report Metadata */}
        <div className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          <p>Generated: {new Date(report.timestamp).toLocaleString()}</p>
          <p className="mt-1">
            This validation report assesses Daubert compliance factors. It does not guarantee
            admissibility.
          </p>
        </div>
      </main>
    </div>
  );
}

function ScoreCard({
  label,
  score,
  detail,
}: {
  label: string;
  score: number;
  detail: string;
}) {
  const color =
    score >= 80 ? 'var(--accent-emerald)' : score >= 50 ? 'var(--accent-gold)' : 'var(--accent-rose)';

  return (
    <div className="card p-4 text-center">
      <span className="data-label">{label}</span>
      <div className="mt-2">
        <span className="text-2xl font-semibold" style={{ color }}>
          {Math.round(score)}%
        </span>
      </div>
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
        {detail}
      </p>
    </div>
  );
}

function MethodologyComparisonCard({ comparison }: { comparison: MethodologyComparison }) {
  const statusColor =
    comparison.status === 'converged'
      ? 'var(--accent-emerald)'
      : comparison.status === 'acceptable'
      ? 'var(--accent-gold)'
      : 'var(--accent-rose)';

  return (
    <div className="card p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="data-label">{comparison.method1}</span>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(comparison.method1Result)}
              </p>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>vs</span>
            <div>
              <span className="data-label">{comparison.method2}</span>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(comparison.method2Result)}
              </p>
            </div>
          </div>
        </div>
        <div
          className="px-3 py-1 rounded text-sm capitalize"
          style={{ background: statusColor + '20', color: statusColor }}
        >
          {comparison.status}
        </div>
      </div>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {comparison.explanation}
      </p>
      <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
        Difference: {formatCurrency(comparison.difference)} (
        {(comparison.percentDifference * 100).toFixed(0)}%)
      </p>
    </div>
  );
}

function InputValidationRow({ validation }: { validation: InputValidation }) {
  return (
    <tr>
      <td style={{ color: 'var(--text-secondary)' }}>
        {validation.inputName}
        {validation.sensitivityRank && validation.sensitivityRank <= 3 && (
          <span
            className="ml-2 text-xs px-1 rounded"
            style={{ background: 'var(--accent-gold)', color: 'var(--bg-primary)' }}
          >
            High Impact
          </span>
        )}
      </td>
      <td className="text-center">
        {validation.hasSource ? (
          <span style={{ color: 'var(--accent-emerald)' }}>✓</span>
        ) : (
          <span style={{ color: 'var(--accent-rose)' }}>✗</span>
        )}
      </td>
      <td className="text-center">
        {validation.reasonablenessCheck ? (
          <span
            style={{
              color:
                validation.reasonablenessCheck.status === 'pass'
                  ? 'var(--accent-emerald)'
                  : validation.reasonablenessCheck.status === 'warning'
                  ? 'var(--accent-gold)'
                  : 'var(--accent-rose)',
            }}
          >
            {validation.reasonablenessCheck.status === 'pass'
              ? '✓'
              : validation.reasonablenessCheck.status === 'warning'
              ? '⚠'
              : '✗'}
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </td>
      <td className="text-center">
        {validation.sensitivityRank ? (
          <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
            #{validation.sensitivityRank}
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </td>
      <td className="text-xs" style={{ color: 'var(--text-muted)', maxWidth: '200px' }}>
        {validation.reasonablenessCheck?.status !== 'pass' && validation.reasonablenessCheck?.message
          ? validation.reasonablenessCheck.message.substring(0, 60) + '...'
          : validation.source?.document || '—'}
      </td>
    </tr>
  );
}
