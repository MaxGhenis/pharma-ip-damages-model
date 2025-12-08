import {
  RoyaltyInputs,
  ComparableLicense,
  CalculationStep,
  UncertaintyRange,
} from '../types';
import { sampleUncertainty } from '../utils/uncertainty';
import { calculateRubinsteinRoyalty } from './rubinstein';

/**
 * Reasonable Royalty Calculation
 *
 * Based on Georgia-Pacific Corp. v. U.S. Plywood Corp. (1970) 15 factors:
 *
 * 1. Royalties received by patentee for licensing the patent
 * 2. Rates paid by licensee for comparable patents
 * 3. Nature and scope of license (exclusive vs non-exclusive, restricted vs unrestricted)
 * 4. Licensor's policy to maintain patent monopoly
 * 5. Commercial relationship between parties
 * 6. Effect of selling patented specialty on promoting other products
 * 7. Duration of patent and license term
 * 8. Established profitability and commercial success of patented product
 * 9. Utility and advantages of patented property over old modes
 * 10. Nature of patented invention and benefits to users
 * 11. Extent of infringer's use and value of such use
 * 12. Customary profit or selling price in the trade
 * 13. Portion of profit attributable to invention vs other elements
 * 14. Opinion of qualified experts
 * 15. Hypothetical negotiation between willing licensor and licensee
 */

export interface GeorgiaPacificFactors {
  // Factor 1: Established royalties
  establishedRoyalties: ComparableLicense[];

  // Factor 2: Comparable licenses
  comparableLicenses: ComparableLicense[];

  // Factor 3: License scope
  isExclusive: boolean;
  hasFieldOfUseRestrictions: boolean;
  territorialScope: 'worldwide' | 'us_only' | 'limited';

  // Factor 8: Commercial success
  commercialSuccess: UncertaintyRange; // 0-1 scale

  // Factor 9: Technical advantages
  technicalAdvantages: UncertaintyRange; // 0-1 scale

  // Factor 13: Apportionment
  patentContribution: UncertaintyRange; // 0-1, portion of profit from patent

  // Factor 15: Hypothetical negotiation (use Rubinstein)
  useRubinstein: boolean;
}

export interface ReasonableRoyaltyResult {
  royaltyRate: number;
  totalRoyalties: number;
  methodsUsed: string[];
  calculationSteps: CalculationStep[];
}

/**
 * Calculate royalty from comparable licenses
 */
export function analyzeComparableLicenses(
  licenses: ComparableLicense[],
  useSampling: boolean = false
): { weightedRate: number; steps: CalculationStep } {
  if (licenses.length === 0) {
    return {
      weightedRate: 0,
      steps: {
        id: 'no-comparables',
        label: 'No Comparable Licenses',
        inputs: [],
        result: 0,
        notes: 'No comparable licenses available for analysis.',
      },
    };
  }

  let totalWeight = 0;
  let weightedSum = 0;
  const adjustedLicenses: { name: string; baseRate: number; adjustment: number; adjustedRate: number; weight: number }[] = [];

  for (const license of licenses) {
    const adjustmentFactor = useSampling
      ? sampleUncertainty(license.adjustmentFactor)
      : license.adjustmentFactor.base;

    const adjustedRate = license.royaltyRate * adjustmentFactor;
    const weight = license.weight;

    adjustedLicenses.push({
      name: license.name,
      baseRate: license.royaltyRate,
      adjustment: adjustmentFactor,
      adjustedRate,
      weight,
    });

    weightedSum += adjustedRate * weight;
    totalWeight += weight;
  }

  const weightedRate = weightedSum / totalWeight;

  const steps: CalculationStep = {
    id: 'comparable-analysis',
    label: 'Comparable License Analysis',
    formula: 'Weighted Rate = Σ(Adjusted Rate × Weight) / Σ Weights',
    inputs: adjustedLicenses.map(l => ({
      name: l.name,
      value: `${(l.baseRate * 100).toFixed(2)}% × ${l.adjustment.toFixed(2)} = ${(l.adjustedRate * 100).toFixed(2)}%`,
      source: `Weight: ${l.weight}`,
    })),
    result: weightedRate,
    notes: 'Adjustments account for differences in exclusivity, field of use, timing, and technology.',
    children: adjustedLicenses.map(l => ({
      id: `license-${l.name}`,
      label: l.name,
      inputs: [
        { name: 'Base Rate', value: l.baseRate },
        { name: 'Adjustment Factor', value: l.adjustment },
        { name: 'Weight', value: l.weight },
      ],
      result: l.adjustedRate,
    })),
  };

  return { weightedRate, steps };
}

/**
 * 25% Rule (historical benchmark, now disfavored after Uniloc v. Microsoft)
 * Included for reference/comparison only
 */
export function twentyFivePercentRule(
  expectedProfitMargin: number
): { rate: number; warning: string } {
  const rate = expectedProfitMargin * 0.25;
  return {
    rate,
    warning: 'The 25% rule was rejected in Uniloc Inc. v. Microsoft Corp. (Fed. Cir. 2011) as lacking economic foundation. Included only for historical comparison.',
  };
}

/**
 * Analytical approach: work backwards from profit potential
 */
export function analyticalApproach(
  defendantAnticipatedProfitMargin: number,
  patentContribution: number,
  patentStrength: number
): { royaltyRate: number; steps: CalculationStep } {
  // Defendant would pay up to the patent's contribution to expected profits
  // adjusted for validity/infringement risk
  const maxWillingToPay = defendantAnticipatedProfitMargin * patentContribution * patentStrength;

  // Assume 50-50 split of surplus (or use Rubinstein for more nuanced split)
  const royaltyRate = maxWillingToPay * 0.5;

  const steps: CalculationStep = {
    id: 'analytical-approach',
    label: 'Analytical Approach',
    formula: 'Royalty = Profit Margin × Patent Contribution × Patent Strength × 50%',
    inputs: [
      { name: 'Defendant Profit Margin', value: defendantAnticipatedProfitMargin },
      { name: 'Patent Contribution', value: patentContribution },
      { name: 'Patent Strength', value: patentStrength },
      { name: 'Surplus Split', value: 0.5 },
    ],
    result: royaltyRate,
    notes: 'The analytical approach derives royalty from expected profits attributable to the patent.',
  };

  return { royaltyRate, steps };
}

/**
 * Full reasonable royalty calculation
 */
export function calculateReasonableRoyalty(
  inputs: RoyaltyInputs,
  factors: GeorgiaPacificFactors,
  defendantProfits: number,
  defendantProfitMargin: number,
  useSampling: boolean = false
): ReasonableRoyaltyResult {
  const methodsUsed: string[] = [];
  const calculationSteps: CalculationStep[] = [];
  const rates: { method: string; rate: number; weight: number }[] = [];

  // Method 1: Established royalties (Factor 1)
  if (factors.establishedRoyalties.length > 0) {
    const established = analyzeComparableLicenses(factors.establishedRoyalties, useSampling);
    if (established.weightedRate > 0) {
      rates.push({ method: 'Established Royalties', rate: established.weightedRate, weight: 2 });
      methodsUsed.push('Established Royalties');
      calculationSteps.push(established.steps);
    }
  }

  // Method 2: Comparable licenses (Factor 2)
  if (factors.comparableLicenses.length > 0) {
    const comparables = analyzeComparableLicenses(factors.comparableLicenses, useSampling);
    if (comparables.weightedRate > 0) {
      rates.push({ method: 'Comparable Licenses', rate: comparables.weightedRate, weight: 1.5 });
      methodsUsed.push('Comparable Licenses');
      calculationSteps.push(comparables.steps);
    }
  }

  // Method 3: Analytical approach
  const patentContribution = useSampling
    ? sampleUncertainty(factors.patentContribution)
    : factors.patentContribution.base;

  const patentStrength = useSampling
    ? sampleUncertainty(inputs.patentStrength)
    : inputs.patentStrength.base;

  const analytical = analyticalApproach(
    defendantProfitMargin,
    patentContribution,
    patentStrength
  );
  rates.push({ method: 'Analytical Approach', rate: analytical.royaltyRate, weight: 1 });
  methodsUsed.push('Analytical Approach');
  calculationSteps.push(analytical.steps);

  // Method 4: Rubinstein bargaining (if requested)
  if (factors.useRubinstein) {
    const rubinstein = calculateRubinsteinRoyalty(inputs, defendantProfits, useSampling);
    rates.push({ method: 'Rubinstein Bargaining', rate: rubinstein.royaltyRate, weight: 1.5 });
    methodsUsed.push('Rubinstein Bargaining');
    calculationSteps.push(...rubinstein.calculationSteps);
  }

  // Calculate weighted average of methods
  const totalWeight = rates.reduce((sum, r) => sum + r.weight, 0);
  const weightedRate = rates.reduce((sum, r) => sum + r.rate * r.weight, 0) / totalWeight;

  // Adjustments for Georgia-Pacific factors
  let adjustedRate = weightedRate;

  // Exclusive license adjustment (typically 2-3x non-exclusive)
  if (factors.isExclusive) {
    adjustedRate *= 2.0;
    calculationSteps.push({
      id: 'exclusive-adjustment',
      label: 'Exclusive License Adjustment',
      inputs: [{ name: 'Base Rate', value: weightedRate }],
      result: adjustedRate,
      notes: 'Exclusive licenses command a premium, typically 2-3x non-exclusive rates.',
    });
  }

  // Commercial success adjustment
  const commercialSuccess = useSampling
    ? sampleUncertainty(factors.commercialSuccess)
    : factors.commercialSuccess.base;

  if (commercialSuccess > 0.7) {
    adjustedRate *= (1 + (commercialSuccess - 0.7) * 0.5);
  }

  // Technical advantages adjustment
  const technicalAdvantages = useSampling
    ? sampleUncertainty(factors.technicalAdvantages)
    : factors.technicalAdvantages.base;

  if (technicalAdvantages > 0.7) {
    adjustedRate *= (1 + (technicalAdvantages - 0.7) * 0.3);
  }

  // Calculate total royalties
  const totalRoyalties = defendantProfits * adjustedRate;

  // Summary step
  calculationSteps.unshift({
    id: 'royalty-summary',
    label: 'Reasonable Royalty Summary',
    inputs: rates.map(r => ({
      name: r.method,
      value: `${(r.rate * 100).toFixed(2)}%`,
      source: `Weight: ${r.weight}`,
    })),
    result: adjustedRate,
    notes: `Final rate after Georgia-Pacific adjustments. Methods: ${methodsUsed.join(', ')}`,
  });

  return {
    royaltyRate: adjustedRate,
    totalRoyalties,
    methodsUsed,
    calculationSteps,
  };
}
