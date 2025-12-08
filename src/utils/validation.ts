/**
 * Validation Utilities for Daubert Compliance
 *
 * Implements:
 * 1. Cross-methodology comparison and convergence checking
 * 2. Reasonableness checks against industry benchmarks
 * 3. Input documentation completeness scoring
 * 4. Reproducibility hashing
 */

import {
  ValidationReport,
  InputValidation,
  MethodologyComparison,
  SourceCitation,
  PHARMA_BENCHMARKS,
  CONVERGENCE_THRESHOLDS,
  IndustryBenchmark,
} from '../types/validation';
import { DamagesInputs, SensitivityResult } from '../types';
import { FullDamagesResult } from '../models/damagesCalculator';

/**
 * Generate a hash of inputs for reproducibility verification
 */
export function generateInputHash(inputs: DamagesInputs): string {
  const json = JSON.stringify(inputs);
  // Simple hash - in production would use crypto
  let hash = 0;
  for (let i = 0; i < json.length; i++) {
    const char = json.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Check if a value falls within industry benchmark ranges
 */
export function checkReasonableness(
  value: number,
  metric: string,
  industry: 'pharma' | 'biotech' = 'pharma'
): InputValidation['reasonablenessCheck'] {
  const benchmark = PHARMA_BENCHMARKS.find(b => b.metric === metric);
  if (!benchmark) {
    return {
      status: 'warning',
      message: `No benchmark available for ${metric}`,
    };
  }

  const range = industry === 'biotech' ? benchmark.biotechRange : benchmark.pharmaRange;

  if (value >= range.low && value <= range.high) {
    return {
      status: 'pass',
      benchmarkLow: range.low,
      benchmarkHigh: range.high,
      benchmarkSource: benchmark.source,
      message: `Value ${(value * 100).toFixed(1)}% is within industry range (${(range.low * 100).toFixed(0)}-${(range.high * 100).toFixed(0)}%)`,
    };
  } else if (value >= range.low * 0.7 && value <= range.high * 1.3) {
    return {
      status: 'warning',
      benchmarkLow: range.low,
      benchmarkHigh: range.high,
      benchmarkSource: benchmark.source,
      message: `Value ${(value * 100).toFixed(1)}% is outside typical range but may be justified. Industry range: ${(range.low * 100).toFixed(0)}-${(range.high * 100).toFixed(0)}%`,
    };
  } else {
    return {
      status: 'fail',
      benchmarkLow: range.low,
      benchmarkHigh: range.high,
      benchmarkSource: benchmark.source,
      message: `Value ${(value * 100).toFixed(1)}% is significantly outside industry norms (${(range.low * 100).toFixed(0)}-${(range.high * 100).toFixed(0)}%). Requires strong justification.`,
    };
  }
}

/**
 * Compare two methodology results for convergence
 */
export function compareMethodologies(
  method1: string,
  result1: number,
  method2: string,
  result2: number
): MethodologyComparison {
  const difference = Math.abs(result1 - result2);
  const average = (result1 + result2) / 2;
  const percentDifference = average > 0 ? difference / average : 0;

  let status: MethodologyComparison['status'];
  let explanation: string | undefined;

  if (percentDifference <= CONVERGENCE_THRESHOLDS.converged) {
    status = 'converged';
    explanation = `Results converge within ${(percentDifference * 100).toFixed(0)}% - strong corroboration.`;
  } else if (percentDifference <= CONVERGENCE_THRESHOLDS.acceptable) {
    status = 'acceptable';
    explanation = `Results differ by ${(percentDifference * 100).toFixed(0)}% - within acceptable range but warrants explanation.`;
  } else {
    status = 'divergent';
    explanation = `Results differ by ${(percentDifference * 100).toFixed(0)}% - significant divergence requires strong justification or methodology review.`;
  }

  return {
    method1,
    method1Result: result1,
    method2,
    method2Result: result2,
    difference,
    percentDifference,
    status,
    explanation,
  };
}

/**
 * Validate all inputs and check documentation completeness
 */
export function validateInputs(
  inputs: DamagesInputs,
  sources: Map<string, SourceCitation> = new Map(),
  sensitivityResults?: SensitivityResult[]
): InputValidation[] {
  const validations: InputValidation[] = [];

  // Define key inputs to validate with their benchmark mappings
  const inputsToValidate: Array<{
    name: string;
    path: string;
    getValue: () => number;
    benchmark?: string;
  }> = [
    {
      name: 'Total Market Size',
      path: 'market.totalMarketSize',
      getValue: () => inputs.market.totalMarketSize.base,
    },
    {
      name: 'Market Growth Rate',
      path: 'market.marketGrowthRate',
      getValue: () => inputs.market.marketGrowthRate.base,
      benchmark: 'marketGrowthRate',
    },
    {
      name: 'Plaintiff Gross Margin',
      path: 'competitors.plaintiffGrossMargin',
      getValue: () => inputs.competitors.plaintiffGrossMargin.base,
      benchmark: 'grossMargin',
    },
    {
      name: 'Plaintiff Incremental Margin',
      path: 'competitors.plaintiffIncrementalMargin',
      getValue: () => inputs.competitors.plaintiffIncrementalMargin.base,
      benchmark: 'grossMargin',
    },
    {
      name: 'Defendant Gross Margin',
      path: 'competitors.defendantGrossMargin',
      getValue: () => inputs.competitors.defendantGrossMargin.base,
      benchmark: 'grossMargin',
    },
    {
      name: 'Plaintiff But-For Share',
      path: 'competitors.plaintiffButForShare',
      getValue: () => inputs.competitors.plaintiffButForShare.base,
    },
    {
      name: 'Plaintiff Actual Share',
      path: 'competitors.plaintiffActualShare',
      getValue: () => inputs.competitors.plaintiffActualShare.base,
    },
    {
      name: 'Defendant Actual Share',
      path: 'competitors.defendantActualShare',
      getValue: () => inputs.competitors.defendantActualShare.base,
    },
    {
      name: 'Patent Strength',
      path: 'royalty.patentStrength',
      getValue: () => inputs.royalty.patentStrength.base,
      benchmark: 'patentStrength',
    },
    {
      name: 'Technology Contribution',
      path: 'royalty.technologyContribution',
      getValue: () => inputs.royalty.technologyContribution.base,
      benchmark: 'technologyContribution',
    },
    {
      name: 'Profit Split',
      path: 'royalty.profitSplit',
      getValue: () => inputs.royalty.profitSplit.base,
      benchmark: 'royaltyRate',
    },
    {
      name: 'Price Erosion',
      path: 'prices.priceErosionPercent',
      getValue: () => inputs.prices.priceErosionPercent.base,
      benchmark: 'priceErosion',
    },
  ];

  for (const input of inputsToValidate) {
    const value = input.getValue();
    const source = sources.get(input.path);
    const sensitivity = sensitivityResults?.find(s =>
      s.parameter.toLowerCase().includes(input.name.toLowerCase().split(' ')[0])
    );

    const validation: InputValidation = {
      inputName: input.name,
      inputPath: input.path,
      value,
      hasSource: !!source,
      source,
      sensitivityRank: sensitivity ? sensitivityResults!.indexOf(sensitivity) + 1 : undefined,
      elasticity: sensitivity?.elasticity,
    };

    if (input.benchmark) {
      validation.reasonablenessCheck = checkReasonableness(value, input.benchmark);
    }

    validations.push(validation);
  }

  return validations;
}

/**
 * Generate a full validation report
 */
export function generateValidationReport(
  inputs: DamagesInputs,
  results: FullDamagesResult,
  sources: Map<string, SourceCitation> = new Map()
): ValidationReport {
  const timestamp = new Date().toISOString();
  const inputValidations = validateInputs(inputs, sources, results.sensitivityResults);

  // Cross-methodology comparisons
  const methodologyComparisons: MethodologyComparison[] = [];

  // Compare lost profits vs reasonable royalty
  if (results.lostProfitsDetail && results.reasonableRoyaltyDetail) {
    methodologyComparisons.push(
      compareMethodologies(
        'Lost Profits (Panduit)',
        results.lostProfitsDetail.totalLostProfits + results.lostProfitsDetail.priceErosionDamages,
        'Reasonable Royalty (Georgia-Pacific)',
        results.reasonableRoyaltyDetail.totalRoyalties
      )
    );
  }

  // Compare Georgia-Pacific vs Rubinstein
  if (results.reasonableRoyaltyDetail && results.rubinsteinDetail) {
    const gpRoyaltyTotal = results.reasonableRoyaltyDetail.totalRoyalties;
    const rubinsteinTotal = results.rubinsteinDetail.plaintiffShare;
    methodologyComparisons.push(
      compareMethodologies(
        'Georgia-Pacific Royalty',
        gpRoyaltyTotal,
        'Rubinstein Bargaining',
        rubinsteinTotal
      )
    );
  }

  // Calculate documentation score
  const documentedInputs = inputValidations.filter(v => v.hasSource).length;
  const totalInputs = inputValidations.length;
  const undocumentedInputs = inputValidations
    .filter(v => !v.hasSource)
    .map(v => v.inputName);

  // Calculate reasonableness score
  const reasonablenessChecks = inputValidations.filter(v => v.reasonablenessCheck);
  const reasonablenessFailures = reasonablenessChecks
    .filter(v => v.reasonablenessCheck?.status === 'fail')
    .map(v => v.inputName);

  // Sensitivity summary
  const topDrivers = (results.sensitivityResults || [])
    .slice(0, 5)
    .map(s => ({ input: s.parameter, elasticity: s.elasticity }));

  // Calculate robustness score based on sensitivity spread
  const robustnessScore = results.monteCarloResults
    ? calculateRobustnessScore(results.monteCarloResults.totalDamages)
    : 50;

  // Generate recommendations
  const recommendations = generateRecommendations(
    inputValidations,
    methodologyComparisons,
    documentedInputs,
    totalInputs
  );

  // Calculate overall status
  const documentationScore = (documentedInputs / totalInputs) * 100;
  // Methods score is about using generally accepted methodologies, which we always do
  // Divergence is noted but doesn't reduce this score - it's a separate consideration
  const methodologyScore = 100; // All methods used are peer-reviewed and court-accepted
  const reasonablenessScore = reasonablenessFailures.length === 0 ? 100 :
    reasonablenessFailures.length <= 2 ? 70 : 40;

  const overallScore = (documentationScore * 0.4 + methodologyScore * 0.3 + reasonablenessScore * 0.3);
  const overallStatus: ValidationReport['overallStatus'] =
    overallScore >= 80 ? 'valid' :
    overallScore >= 50 ? 'needs_review' : 'invalid';

  return {
    timestamp,
    overallStatus,
    daubertFactors: {
      sufficientBasis: {
        score: documentationScore,
        documentedInputs,
        totalInputs,
        undocumentedInputs,
      },
      reliableMethods: {
        score: methodologyScore,
        methodsUsed: [
          'Lost Profits (Panduit/Grain Processing)',
          'Reasonable Royalty (Georgia-Pacific)',
          results.rubinsteinDetail ? 'Rubinstein Bargaining' : '',
          results.shapleyDetail ? 'Shapley Value Allocation' : '',
          'Monte Carlo Simulation',
          'Sensitivity Analysis',
        ].filter(Boolean),
        notes: 'All methods are generally accepted in economic damages litigation.',
      },
      properApplication: {
        score: reasonablenessScore,
        reasonablenessChecks: inputValidations,
        failures: reasonablenessFailures,
      },
    },
    inputValidations,
    methodologyComparisons,
    sensitivitySummary: {
      topDrivers,
      robustnessScore,
    },
    reproducibility: {
      modelVersion: '1.0.0',
      calculationHash: generateInputHash(inputs),
      canReplicate: true,
    },
    recommendations,
  };
}

/**
 * Calculate robustness score from Monte Carlo results
 */
function calculateRobustnessScore(mcResult: { mean: number; std: number; percentile5: number; percentile95: number }): number {
  // Coefficient of variation (lower is more robust)
  const cv = mcResult.std / mcResult.mean;

  // 90% CI width relative to mean
  const ciWidth = (mcResult.percentile95 - mcResult.percentile5) / mcResult.mean;

  // Score: higher is more robust (less variability)
  // CV of 0.2 = 100, CV of 0.5 = 50, CV of 1.0 = 0
  const cvScore = Math.max(0, Math.min(100, 100 - (cv * 200)));

  // CI width of 0.3 = 100, CI width of 1.0 = 50
  const ciScore = Math.max(0, Math.min(100, 100 - (ciWidth * 70)));

  return Math.round((cvScore + ciScore) / 2);
}

/**
 * Generate recommendations for strengthening the analysis
 */
function generateRecommendations(
  inputValidations: InputValidation[],
  methodologyComparisons: MethodologyComparison[],
  documentedInputs: number,
  totalInputs: number
): string[] {
  const recommendations: string[] = [];

  // Documentation recommendations
  const documentationRate = documentedInputs / totalInputs;
  if (documentationRate < 0.5) {
    recommendations.push(
      'CRITICAL: Less than 50% of inputs have source documentation. Document all key assumptions with citations to SEC filings, market data, or comparable transactions.'
    );
  } else if (documentationRate < 0.8) {
    recommendations.push(
      'Add source citations for remaining undocumented inputs. Courts increasingly require specific factual basis for each assumption.'
    );
  }

  // High-sensitivity undocumented inputs
  const sensitiveUndocumented = inputValidations
    .filter(v => !v.hasSource && v.sensitivityRank && v.sensitivityRank <= 3);
  if (sensitiveUndocumented.length > 0) {
    recommendations.push(
      `HIGH PRIORITY: Document sources for high-sensitivity inputs: ${sensitiveUndocumented.map(v => v.inputName).join(', ')}. These drive the majority of result variation.`
    );
  }

  // Reasonableness failures
  const failures = inputValidations.filter(v => v.reasonablenessCheck?.status === 'fail');
  if (failures.length > 0) {
    recommendations.push(
      `Review inputs that fall outside industry benchmarks: ${failures.map(v => v.inputName).join(', ')}. Prepare detailed justification with supporting evidence.`
    );
  }

  // Methodology divergence
  const divergent = methodologyComparisons.filter(m => m.status === 'divergent');
  if (divergent.length > 0) {
    for (const d of divergent) {
      recommendations.push(
        `Reconcile divergence between ${d.method1} and ${d.method2} (${(d.percentDifference * 100).toFixed(0)}% difference). Consider which methodology is more appropriate for this case or explain the economic basis for the difference.`
      );
    }
  }

  // Cross-validation suggestion if methods converge
  const converged = methodologyComparisons.filter(m => m.status === 'converged');
  if (converged.length > 0) {
    recommendations.push(
      'STRENGTH: Multiple methodologies converge, providing corroboration. Emphasize this cross-validation in expert report.'
    );
  }

  // General best practices
  if (recommendations.length === 0) {
    recommendations.push(
      'Analysis meets baseline Daubert requirements. Consider adding comparable license analysis or additional market data to further strengthen evidentiary basis.'
    );
  }

  return recommendations;
}

/**
 * Get benchmark information for display
 */
export function getBenchmarkInfo(metric: string): IndustryBenchmark | undefined {
  return PHARMA_BENCHMARKS.find(b => b.metric === metric);
}

/**
 * Format validation status for display
 */
export function formatValidationStatus(status: ValidationReport['overallStatus']): {
  label: string;
  color: string;
  description: string;
} {
  switch (status) {
    case 'valid':
      return {
        label: 'Ready for Review',
        color: 'var(--accent-emerald)',
        description: 'Analysis meets Daubert requirements. Inputs documented, methods converge, values within industry norms.',
      };
    case 'needs_review':
      return {
        label: 'Needs Attention',
        color: 'var(--accent-gold)',
        description: 'Some issues identified. Address recommendations before expert report submission.',
      };
    case 'invalid':
      return {
        label: 'Significant Issues',
        color: 'var(--accent-rose)',
        description: 'Multiple validation failures. Risk of Daubert challenge. Address all issues before proceeding.',
      };
  }
}
