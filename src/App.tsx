import React, { useState, useMemo, useCallback } from 'react';
import { DamagesInputs } from './types';
import { DemoScenario, blockbusterDrugScenario } from './models/demoScenarios';
import { calculateDamages, FullDamagesResult } from './models/damagesCalculator';
import { ScenarioSelector } from './components/ScenarioSelector';
import { InputPanel } from './components/InputPanel';
import { ResultsSummary } from './components/ResultsSummary';
import { ExpandableSection } from './components/ExpandableSection';
import { CalculationStepsList } from './components/CalculationStep';
import { ReportView } from './components/ReportView';
import { ValidationReportView } from './components/ValidationReport';
import {
  YearlyDamagesChart,
  MonteCarloChart,
  SensitivityChart,
  SCurveChart,
} from './components/Charts';
import { formatCurrency } from './utils/uncertainty';
import { generateReportContent } from './utils/reportGenerator';
import { buildReportData } from './utils/reportDataBuilder';
import { generateValidationReport } from './utils/validation';
import { ValidationReport, SourceCitation } from './types/validation';
import './index.css';

function App() {
  const [scenario, setScenario] = useState<DemoScenario>(blockbusterDrugScenario);
  const [inputs, setInputs] = useState<DamagesInputs>(blockbusterDrugScenario.inputs);
  const [isCalculating, setIsCalculating] = useState(false);
  const [options, setOptions] = useState({
    includeLostProfits: true,
    includeReasonableRoyalty: true,
    includeRubinstein: true,
    includeShapley: true,
    includeSCurve: true,
    includeTradeSecret: false,
    runMonteCarlo: true,
    runSensitivity: true,
    monteCarloIterations: 5000,
  });
  const [showReport, setShowReport] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [inputSources] = useState<Map<string, SourceCitation>>(new Map());

  const handleScenarioChange = useCallback((newScenario: DemoScenario) => {
    setScenario(newScenario);
    setInputs(newScenario.inputs);
    setOptions((prev) => ({
      ...prev,
      includeTradeSecret: newScenario.caseType === 'trade_secret',
    }));
  }, []);

  const results: FullDamagesResult | null = useMemo(() => {
    setIsCalculating(true);
    try {
      const result = calculateDamages(inputs, options);
      return result;
    } catch (e) {
      console.error('Calculation error:', e);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, [inputs, options]);

  const reportContent = useMemo(() => {
    if (!results) return null;
    const reportData = buildReportData(
      results.summary,
      inputs,
      results.monteCarloResults,
      scenario.name
    );
    return generateReportContent(reportData);
  }, [results, inputs, scenario.name]);

  const validationReport: ValidationReport | null = useMemo(() => {
    if (!results) return null;
    return generateValidationReport(inputs, results, inputSources);
  }, [results, inputs, inputSources]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Show report view if active
  if (showReport && reportContent) {
    return (
      <ReportView
        report={reportContent}
        onClose={() => setShowReport(false)}
        onPrint={handlePrint}
      />
    );
  }

  // Show validation report if active
  if (showValidation && validationReport) {
    return (
      <ValidationReportView
        report={validationReport}
        onClose={() => setShowValidation(false)}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="badge badge-gold">IP DAMAGES</span>
            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Economic Analysis Platform
            </span>
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Pharma/Biotech IP Damages Calculator
          </h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            DCF-based damages model with uncertainty analysis for patent and trade secret litigation
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Scenario Selection */}
        <section className="mb-8">
          <ScenarioSelector selectedScenario={scenario} onSelect={handleScenarioChange} />
        </section>

        {/* Analysis Options */}
        <section className="mb-8">
          <div className="card p-5">
            <h3 className="data-label mb-4">Analysis Options</h3>
            <div className="flex flex-wrap gap-5">
              {[
                { key: 'includeLostProfits', label: 'Lost Profits' },
                { key: 'includeReasonableRoyalty', label: 'Reasonable Royalty' },
                { key: 'includeRubinstein', label: 'Rubinstein Bargaining' },
                { key: 'includeShapley', label: 'Shapley Allocation' },
                { key: 'includeSCurve', label: 'S-Curve Analysis' },
                { key: 'includeTradeSecret', label: 'Trade Secret' },
                { key: 'runMonteCarlo', label: 'Monte Carlo' },
                { key: 'runSensitivity', label: 'Sensitivity' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={options[key as keyof typeof options] as boolean}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="checkbox-custom"
                  />
                  <span className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Model Inputs</h2>
              <InputPanel inputs={inputs} onChange={setInputs} />
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {isCalculating && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-gold)' }}></div>
                <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>Calculating...</span>
              </div>
            )}

            {results && !isCalculating && (
              <>
                {/* Summary */}
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Damages Summary</h2>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowValidation(true)}
                        className="px-4 py-2 rounded text-sm font-medium transition-colors"
                        style={{
                          background: validationReport?.overallStatus === 'valid'
                            ? 'rgba(52, 211, 153, 0.15)'
                            : validationReport?.overallStatus === 'needs_review'
                            ? 'rgba(251, 191, 36, 0.15)'
                            : 'rgba(248, 113, 113, 0.15)',
                          color: validationReport?.overallStatus === 'valid'
                            ? 'var(--accent-emerald)'
                            : validationReport?.overallStatus === 'needs_review'
                            ? 'var(--accent-gold)'
                            : 'var(--accent-rose)',
                          border: '1px solid currentColor',
                        }}
                      >
                        Daubert Validation
                      </button>
                      <button
                        onClick={() => setShowReport(true)}
                        className="btn-primary"
                      >
                        Generate Report
                      </button>
                    </div>
                  </div>
                  <ResultsSummary
                    summary={results.summary}
                    monteCarloResults={results.monteCarloResults}
                  />
                </section>

                {/* Charts */}
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Visualizations</h2>

                  <ExpandableSection title="Yearly Damages Breakdown" defaultOpen>
                    <YearlyDamagesChart data={results.summary.yearlyBreakdown} />
                  </ExpandableSection>

                  {results.monteCarloResults && (
                    <ExpandableSection title="Monte Carlo Distribution" defaultOpen>
                      <MonteCarloChart
                        result={results.monteCarloResults.totalDamages}
                        title="Total Damages Distribution"
                      />
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="card p-3">
                          <span className="data-label">Mean</span>
                          <p className="data-value mt-1" style={{ color: 'var(--text-primary)' }}>
                            {formatCurrency(results.monteCarloResults.totalDamages.mean)}
                          </p>
                        </div>
                        <div className="card p-3">
                          <span className="data-label">Std Dev</span>
                          <p className="data-value mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {formatCurrency(results.monteCarloResults.totalDamages.std)}
                          </p>
                        </div>
                        <div className="card p-3">
                          <span className="data-label">5th %ile</span>
                          <p className="data-value mt-1" style={{ color: 'var(--accent-rose)' }}>
                            {formatCurrency(results.monteCarloResults.totalDamages.percentile5)}
                          </p>
                        </div>
                        <div className="card p-3">
                          <span className="data-label">95th %ile</span>
                          <p className="data-value mt-1" style={{ color: 'var(--accent-emerald)' }}>
                            {formatCurrency(results.monteCarloResults.totalDamages.percentile95)}
                          </p>
                        </div>
                      </div>
                    </ExpandableSection>
                  )}

                  {results.sensitivityResults && results.sensitivityResults.length > 0 && (
                    <ExpandableSection title="Sensitivity Analysis (Tornado Chart)">
                      <SensitivityChart results={results.sensitivityResults} />
                      <div className="mt-4">
                        <h4 className="data-label mb-3">Parameter Elasticities</h4>
                        <div className="overflow-x-auto">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Parameter</th>
                                <th className="text-right">Base</th>
                                <th className="text-right">Low</th>
                                <th className="text-right">High</th>
                                <th className="text-right">Elasticity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {results.sensitivityResults.slice(0, 6).map((r) => (
                                <tr key={r.parameter}>
                                  <td style={{ color: 'var(--text-secondary)' }}>{r.parameter}</td>
                                  <td className="text-right">
                                    {r.baseValue > 1 ? r.baseValue.toFixed(0) : r.baseValue.toFixed(2)}
                                  </td>
                                  <td className="text-right" style={{ color: 'var(--accent-rose)' }}>
                                    {formatCurrency(r.lowDamages)}
                                  </td>
                                  <td className="text-right" style={{ color: 'var(--accent-emerald)' }}>
                                    {formatCurrency(r.highDamages)}
                                  </td>
                                  <td className="text-right font-medium" style={{ color: 'var(--accent-gold)' }}>
                                    {r.elasticity.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </ExpandableSection>
                  )}

                  {results.scurveDetail && (
                    <ExpandableSection title="S-Curve / Bass Diffusion">
                      <SCurveChart data={results.scurveDetail.yearlyAdoption} />
                      <div className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <p>Time to 50% adoption: <span className="data-value" style={{ color: 'var(--accent-gold)' }}>{results.scurveDetail.timeToHalfAdoption}</span> years</p>
                        <p>Time to 90% adoption: <span className="data-value" style={{ color: 'var(--accent-gold)' }}>{results.scurveDetail.timeToFullAdoption}</span> years</p>
                      </div>
                    </ExpandableSection>
                  )}
                </section>

                {/* Detailed Calculations */}
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Detailed Calculations</h2>

                  <ExpandableSection
                    title="Lost Profits Analysis"
                    subtitle="Panduit factors and but-for world"
                    badge={formatCurrency(results.lostProfitsDetail.totalLostProfits)}
                    badgeColor="blue"
                  >
                    <CalculationStepsList steps={results.lostProfitsDetail.calculationSteps} />
                  </ExpandableSection>

                  {results.reasonableRoyaltyDetail && (
                    <ExpandableSection
                      title="Reasonable Royalty Analysis"
                      subtitle="Georgia-Pacific factors"
                      badge={formatCurrency(results.reasonableRoyaltyDetail.totalRoyalties)}
                      badgeColor="green"
                    >
                      <CalculationStepsList
                        steps={results.reasonableRoyaltyDetail.calculationSteps}
                      />
                      <div className="mt-4 p-4 card text-sm">
                        <p style={{ color: 'var(--text-secondary)' }}>
                          <span className="data-label mr-2">Methods Used:</span>
                          <span className="data-value">{results.reasonableRoyaltyDetail.methodsUsed.join(', ')}</span>
                        </p>
                        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                          <span className="data-label mr-2">Royalty Rate:</span>
                          <span className="data-value" style={{ color: 'var(--accent-emerald)' }}>
                            {(results.reasonableRoyaltyDetail.royaltyRate * 100).toFixed(2)}%
                          </span>
                        </p>
                      </div>
                    </ExpandableSection>
                  )}

                  {results.rubinsteinDetail && (
                    <ExpandableSection
                      title="Rubinstein Bargaining Model"
                      subtitle="Hypothetical negotiation analysis"
                      badge={`${(results.rubinsteinDetail.royaltyRate * 100).toFixed(2)}%`}
                      badgeColor="gold"
                    >
                      <CalculationStepsList steps={results.rubinsteinDetail.calculationSteps} />
                      <div className="mt-4 p-4 card text-sm space-y-2">
                        <p style={{ color: 'var(--text-secondary)' }}>
                          <span className="data-label mr-2">Plaintiff Share:</span>
                          <span className="data-value" style={{ color: 'var(--accent-gold)' }}>
                            {formatCurrency(results.rubinsteinDetail.plaintiffShare)}
                          </span>
                        </p>
                        <p style={{ color: 'var(--text-secondary)' }}>
                          <span className="data-label mr-2">Defendant Share:</span>
                          <span className="data-value">
                            {formatCurrency(results.rubinsteinDetail.defendantShare)}
                          </span>
                        </p>
                        <p style={{ color: 'var(--text-secondary)' }}>
                          <span className="data-label mr-2">Total Surplus:</span>
                          <span className="data-value">
                            {formatCurrency(results.rubinsteinDetail.totalSurplus)}
                          </span>
                        </p>
                      </div>
                    </ExpandableSection>
                  )}

                  {results.shapleyDetail && (
                    <ExpandableSection
                      title="Shapley Value Allocation"
                      subtitle="Multi-patent value apportionment"
                    >
                      <CalculationStepsList steps={results.shapleyDetail.calculationSteps} />
                      <div className="mt-4">
                        <h4 className="data-label mb-3">Patent Allocations</h4>
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Patent</th>
                              <th className="text-right">Shapley Value</th>
                              <th className="text-right">Share of Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.shapleyDetail.allocations.map((a) => (
                              <tr key={a.patentId}>
                                <td style={{ color: 'var(--text-secondary)' }}>{a.patentName}</td>
                                <td className="text-right" style={{ color: 'var(--accent-gold)' }}>{formatCurrency(a.shapleyValue)}</td>
                                <td className="text-right">
                                  {(a.shareOfTotal * 100).toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </ExpandableSection>
                  )}

                  {results.tradeSecretDetail && (
                    <ExpandableSection
                      title="Trade Secret Damages"
                      subtitle="Head start and unjust enrichment"
                      badge={formatCurrency(results.tradeSecretDetail.totalDamages)}
                      badgeColor="red"
                    >
                      <CalculationStepsList steps={results.tradeSecretDetail.calculationSteps} />
                      <div className="mt-4 p-4 card text-sm space-y-2" style={{ borderColor: 'rgba(248, 113, 113, 0.3)' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>
                          <span className="data-label mr-2">Head Start Damages:</span>
                          <span className="data-value" style={{ color: 'var(--accent-rose)' }}>
                            {formatCurrency(results.tradeSecretDetail.headStartDamages)}
                          </span>
                        </p>
                        <p style={{ color: 'var(--text-secondary)' }}>
                          <span className="data-label mr-2">Development Costs Saved:</span>
                          <span className="data-value">
                            {formatCurrency(results.tradeSecretDetail.developmentCostsSaved)}
                          </span>
                        </p>
                        <p style={{ color: 'var(--text-secondary)' }}>
                          <span className="data-label mr-2">Permanent Market Loss:</span>
                          <span className="data-value">
                            {formatCurrency(results.tradeSecretDetail.permanentMarketLoss)}
                          </span>
                        </p>
                      </div>
                    </ExpandableSection>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h3 className="font-display text-lg font-semibold mb-4" style={{ color: 'var(--accent-gold)' }}>About This Tool</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                This calculator implements standard economic methodologies for calculating
                damages in pharmaceutical/biotech IP litigation, including lost profits,
                reasonable royalty, Rubinstein bargaining, and Shapley value allocation.
              </p>
              <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
                For educational and illustrative purposes only. Not legal or expert advice.
              </p>
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold mb-4" style={{ color: 'var(--accent-gold)' }}>References</h3>
              <ul className="text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--accent-gold-dim)' }}>-</span>
                  Panduit Corp. v. Stahlin Bros. Fibre Works (1978)
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--accent-gold-dim)' }}>-</span>
                  Georgia-Pacific Corp. v. U.S. Plywood Corp. (1970)
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--accent-gold-dim)' }}>-</span>
                  Rubinstein, A. (1982). Perfect Equilibrium in a Bargaining Model
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--accent-gold-dim)' }}>-</span>
                  Shapley, L.S. (1953). A Value for n-Person Games
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--accent-gold-dim)' }}>-</span>
                  Bass, F.M. (1969). A New Product Growth Model
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-10 pt-8 text-center text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
            <p className="font-mono">Built with React, TypeScript, and Tailwind CSS</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
