import React, { useState, useMemo, useCallback } from 'react';
import { DamagesInputs } from './types';
import { DemoScenario, blockbusterDrugScenario } from './models/demoScenarios';
import { calculateDamages, FullDamagesResult } from './models/damagesCalculator';
import { ScenarioSelector } from './components/ScenarioSelector';
import { InputPanel } from './components/InputPanel';
import { ResultsSummary } from './components/ResultsSummary';
import { ExpandableSection } from './components/ExpandableSection';
import { CalculationStepsList } from './components/CalculationStep';
import {
  YearlyDamagesChart,
  MonteCarloChart,
  SensitivityChart,
  SCurveChart,
} from './components/Charts';
import { formatCurrency } from './utils/uncertainty';
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-sky-700 to-sky-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">Pharma/Biotech IP Damages Calculator</h1>
          <p className="mt-1 text-sky-200">
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
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Analysis Options</h3>
            <div className="flex flex-wrap gap-4">
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
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options[key as keyof typeof options] as boolean}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Model Inputs</h2>
              <InputPanel inputs={inputs} onChange={setInputs} />
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {isCalculating && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                <span className="ml-3 text-gray-600">Calculating...</span>
              </div>
            )}

            {results && !isCalculating && (
              <>
                {/* Summary */}
                <section>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Damages Summary</h2>
                  <ResultsSummary
                    summary={results.summary}
                    monteCarloResults={results.monteCarloResults}
                  />
                </section>

                {/* Charts */}
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800">Visualizations</h2>

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
                        <div className="bg-gray-50 p-3 rounded">
                          <span className="text-gray-500">Mean</span>
                          <p className="font-semibold">
                            {formatCurrency(results.monteCarloResults.totalDamages.mean)}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <span className="text-gray-500">Std Dev</span>
                          <p className="font-semibold">
                            {formatCurrency(results.monteCarloResults.totalDamages.std)}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <span className="text-gray-500">5th %ile</span>
                          <p className="font-semibold">
                            {formatCurrency(results.monteCarloResults.totalDamages.percentile5)}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <span className="text-gray-500">95th %ile</span>
                          <p className="font-semibold">
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
                        <h4 className="font-medium text-gray-700 mb-2">Parameter Elasticities</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Parameter</th>
                                <th className="text-right py-2">Base</th>
                                <th className="text-right py-2">Low</th>
                                <th className="text-right py-2">High</th>
                                <th className="text-right py-2">Elasticity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {results.sensitivityResults.slice(0, 6).map((r) => (
                                <tr key={r.parameter} className="border-b">
                                  <td className="py-2">{r.parameter}</td>
                                  <td className="text-right">
                                    {r.baseValue > 1 ? r.baseValue.toFixed(0) : r.baseValue.toFixed(2)}
                                  </td>
                                  <td className="text-right text-red-600">
                                    {formatCurrency(r.lowDamages)}
                                  </td>
                                  <td className="text-right text-green-600">
                                    {formatCurrency(r.highDamages)}
                                  </td>
                                  <td className="text-right font-medium">
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
                      <div className="mt-4 text-sm text-gray-600">
                        <p>Time to 50% adoption: {results.scurveDetail.timeToHalfAdoption} years</p>
                        <p>Time to 90% adoption: {results.scurveDetail.timeToFullAdoption} years</p>
                      </div>
                    </ExpandableSection>
                  )}
                </section>

                {/* Detailed Calculations */}
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800">Detailed Calculations</h2>

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
                      <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                        <p>
                          <strong>Methods Used:</strong>{' '}
                          {results.reasonableRoyaltyDetail.methodsUsed.join(', ')}
                        </p>
                        <p>
                          <strong>Royalty Rate:</strong>{' '}
                          {(results.reasonableRoyaltyDetail.royaltyRate * 100).toFixed(2)}%
                        </p>
                      </div>
                    </ExpandableSection>
                  )}

                  {results.rubinsteinDetail && (
                    <ExpandableSection
                      title="Rubinstein Bargaining Model"
                      subtitle="Hypothetical negotiation analysis"
                      badge={`${(results.rubinsteinDetail.royaltyRate * 100).toFixed(2)}%`}
                      badgeColor="yellow"
                    >
                      <CalculationStepsList steps={results.rubinsteinDetail.calculationSteps} />
                      <div className="mt-4 p-3 bg-yellow-50 rounded text-sm">
                        <p>
                          <strong>Plaintiff Share:</strong>{' '}
                          {formatCurrency(results.rubinsteinDetail.plaintiffShare)}
                        </p>
                        <p>
                          <strong>Defendant Share:</strong>{' '}
                          {formatCurrency(results.rubinsteinDetail.defendantShare)}
                        </p>
                        <p>
                          <strong>Total Surplus:</strong>{' '}
                          {formatCurrency(results.rubinsteinDetail.totalSurplus)}
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
                        <h4 className="font-medium text-gray-700 mb-2">Patent Allocations</h4>
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Patent</th>
                              <th className="text-right py-2">Shapley Value</th>
                              <th className="text-right py-2">Share of Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.shapleyDetail.allocations.map((a) => (
                              <tr key={a.patentId} className="border-b">
                                <td className="py-2">{a.patentName}</td>
                                <td className="text-right">{formatCurrency(a.shapleyValue)}</td>
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
                      <div className="mt-4 p-3 bg-red-50 rounded text-sm">
                        <p>
                          <strong>Head Start Damages:</strong>{' '}
                          {formatCurrency(results.tradeSecretDetail.headStartDamages)}
                        </p>
                        <p>
                          <strong>Development Costs Saved:</strong>{' '}
                          {formatCurrency(results.tradeSecretDetail.developmentCostsSaved)}
                        </p>
                        <p>
                          <strong>Permanent Market Loss:</strong>{' '}
                          {formatCurrency(results.tradeSecretDetail.permanentMarketLoss)}
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
      <footer className="bg-gray-800 text-gray-400 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-3">About This Tool</h3>
              <p className="text-sm">
                This calculator implements standard economic methodologies for calculating
                damages in pharmaceutical/biotech IP litigation, including lost profits,
                reasonable royalty, Rubinstein bargaining, and Shapley value allocation.
              </p>
              <p className="text-sm mt-2">
                For educational and illustrative purposes only. Not legal or expert advice.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">References</h3>
              <ul className="text-sm space-y-1">
                <li>Panduit Corp. v. Stahlin Bros. Fibre Works (1978)</li>
                <li>Georgia-Pacific Corp. v. U.S. Plywood Corp. (1970)</li>
                <li>Rubinstein, A. (1982). Perfect Equilibrium in a Bargaining Model</li>
                <li>Shapley, L.S. (1953). A Value for n-Person Games</li>
                <li>Bass, F.M. (1969). A New Product Growth Model</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm">
            <p>Built with React, TypeScript, and Tailwind CSS</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
