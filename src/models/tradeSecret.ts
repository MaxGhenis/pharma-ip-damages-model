import {
  TradeSecretInputs,
  MarketInputs,
  CompetitorInputs,
  UncertaintyRange,
  CalculationStep,
} from '../types';
import { sampleUncertainty } from '../utils/uncertainty';
import { logisticCurve } from './scurve';

/**
 * Trade Secret Damages Model
 *
 * Trade secret misappropriation cases differ from patent cases:
 * 1. No fixed term - protection lasts as long as secret is maintained
 * 2. Head start advantage - key damages theory
 * 3. Unjust enrichment - defendant's cost savings
 * 4. Market share shifts may be permanent
 *
 * Key case: Ruckelshaus v. Monsanto Co. (1984)
 *
 * Common scenarios in pharma:
 * - Manufacturing process secrets
 * - Clinical trial data
 * - Formulation know-how
 * - Customer/pricing information
 */

export interface TradeSecretResult {
  headStartDamages: number;
  developmentCostsSaved: number;
  permanentMarketLoss: number;
  unjustEnrichment: number;
  totalDamages: number;
  calculationSteps: CalculationStep[];
}

/**
 * Calculate head start damages
 * The value of the time advantage gained by misappropriation
 */
export function calculateHeadStartDamages(
  inputs: TradeSecretInputs,
  marketInputs: MarketInputs,
  competitorInputs: CompetitorInputs,
  annualMarketSize: number,
  useSampling: boolean = false
): { damages: number; steps: CalculationStep[] } {
  const headStartMonths = inputs.headStartMonths;
  const headStartYears = headStartMonths / 12;

  const marketShareDuringHeadStart = useSampling
    ? sampleUncertainty(inputs.marketShareDuringHeadStart)
    : inputs.marketShareDuringHeadStart.base;

  const plaintiffMargin = useSampling
    ? sampleUncertainty(competitorInputs.plaintiffIncrementalMargin)
    : competitorInputs.plaintiffIncrementalMargin.base;

  // Simple head start: defendant's profits during head start period
  // that plaintiff would have earned
  const headStartRevenue = annualMarketSize * marketShareDuringHeadStart * headStartYears;
  const headStartDamages = headStartRevenue * plaintiffMargin;

  const steps: CalculationStep[] = [
    {
      id: 'head-start-basic',
      label: 'Head Start Damages',
      formula: 'Head Start Damages = Market Size × Head Start Share × Years × Margin',
      inputs: [
        { name: 'Head Start Duration', value: `${headStartMonths} months` },
        { name: 'Market Share During Head Start', value: marketShareDuringHeadStart },
        { name: 'Annual Market Size', value: annualMarketSize },
        { name: 'Plaintiff Margin', value: plaintiffMargin },
      ],
      result: headStartDamages,
      notes: `Represents profits defendant earned during ${headStartMonths} month advantage that plaintiff would have earned but-for misappropriation.`,
    },
  ];

  return { damages: headStartDamages, steps };
}

/**
 * Calculate development costs saved by defendant
 * Unjust enrichment theory
 */
export function calculateDevelopmentSavings(
  inputs: TradeSecretInputs,
  useSampling: boolean = false
): { savings: number; steps: CalculationStep } {
  const costSaved = useSampling
    ? sampleUncertainty(inputs.developmentCostSaved)
    : inputs.developmentCostSaved.base;

  const step: CalculationStep = {
    id: 'dev-cost-savings',
    label: 'Development Cost Savings (Unjust Enrichment)',
    inputs: [
      { name: 'R&D Costs Avoided', value: costSaved },
    ],
    result: costSaved,
    notes: 'Represents the investment defendant avoided by misappropriating trade secrets rather than independent development.',
  };

  return { savings: costSaved, steps: step };
}

/**
 * Calculate permanent market share shift
 * In some cases, first mover advantage creates lasting damage
 */
export function calculatePermanentMarketLoss(
  inputs: TradeSecretInputs,
  marketInputs: MarketInputs,
  competitorInputs: CompetitorInputs,
  annualMarketSize: number,
  remainingYears: number,
  discountRate: number,
  useSampling: boolean = false
): { damages: number; steps: CalculationStep } {
  const permanentShift = useSampling
    ? sampleUncertainty(inputs.permanentMarketShareShift)
    : inputs.permanentMarketShareShift.base;

  const plaintiffMargin = useSampling
    ? sampleUncertainty(competitorInputs.plaintiffIncrementalMargin)
    : competitorInputs.plaintiffIncrementalMargin.base;

  const marketGrowth = useSampling
    ? sampleUncertainty(marketInputs.marketGrowthRate)
    : marketInputs.marketGrowthRate.base;

  // Calculate NPV of permanent lost profits
  let totalPV = 0;
  const yearlyDetails: { year: number; marketSize: number; lostProfits: number; pv: number }[] = [];

  for (let year = 1; year <= remainingYears; year++) {
    const projectedMarket = annualMarketSize * Math.pow(1 + marketGrowth, year);
    const lostProfits = projectedMarket * permanentShift * plaintiffMargin;
    const discountFactor = Math.pow(1 + discountRate, -year);
    const pv = lostProfits * discountFactor;
    totalPV += pv;

    yearlyDetails.push({ year, marketSize: projectedMarket, lostProfits, pv });
  }

  const step: CalculationStep = {
    id: 'permanent-loss',
    label: 'Permanent Market Share Loss',
    formula: 'PV = Σ (Market × Lost Share × Margin) / (1 + r)^t',
    inputs: [
      { name: 'Permanent Share Shift', value: permanentShift },
      { name: 'Remaining Years', value: remainingYears },
      { name: 'Discount Rate', value: discountRate },
      { name: 'Market Growth Rate', value: marketGrowth },
    ],
    result: totalPV,
    notes: 'First mover advantage from trade secret theft may cause permanent market share loss due to customer switching costs, brand loyalty, and network effects.',
    children: yearlyDetails.slice(0, 5).map(y => ({
      id: `perm-loss-year-${y.year}`,
      label: `Year ${y.year}`,
      inputs: [
        { name: 'Market Size', value: y.marketSize },
        { name: 'Lost Profits', value: y.lostProfits },
      ],
      result: y.pv,
    })),
  };

  return { damages: totalPV, steps: step };
}

/**
 * Model market share dynamics with S-curve for trade secret case
 * Plaintiff enters late due to defendant's head start
 */
export function modelMarketShareDynamics(
  defendantEntryYear: number,
  plaintiffActualEntryYear: number,
  plaintiffButForEntryYear: number,
  endYear: number,
  adoptionSteepness: number = 0.5,
  marketPotential: number = 1.0
): {
  actual: { year: number; plaintiffShare: number; defendantShare: number }[];
  butFor: { year: number; plaintiffShare: number; defendantShare: number }[];
} {
  const actual: { year: number; plaintiffShare: number; defendantShare: number }[] = [];
  const butFor: { year: number; plaintiffShare: number; defendantShare: number }[] = [];

  for (let year = defendantEntryYear; year <= endYear; year++) {
    // Actual world: defendant enters first
    const defYearsSinceEntry = year - defendantEntryYear;
    const pltYearsSinceActualEntry = Math.max(0, year - plaintiffActualEntryYear);

    // Defendant gets first mover advantage in actual world
    const defActualShare = logisticCurve(defYearsSinceEntry, adoptionSteepness, 3, marketPotential * 0.5);
    const pltActualShare = pltYearsSinceActualEntry > 0
      ? logisticCurve(pltYearsSinceActualEntry, adoptionSteepness, 3, marketPotential * 0.4)
      : 0;

    actual.push({
      year,
      plaintiffShare: pltActualShare,
      defendantShare: defActualShare,
    });

    // But-for world: plaintiff enters first
    const pltYearsSinceButForEntry = Math.max(0, year - plaintiffButForEntryYear);
    const defButForEntry = plaintiffButForEntryYear + 2; // Defendant enters 2 years later without secrets
    const defYearsSinceButForEntry = Math.max(0, year - defButForEntry);

    const pltButForShare = pltYearsSinceButForEntry > 0
      ? logisticCurve(pltYearsSinceButForEntry, adoptionSteepness, 3, marketPotential * 0.6)
      : 0;
    const defButForShare = defYearsSinceButForEntry > 0
      ? logisticCurve(defYearsSinceButForEntry, adoptionSteepness, 3, marketPotential * 0.3)
      : 0;

    butFor.push({
      year,
      plaintiffShare: pltButForShare,
      defendantShare: defButForShare,
    });
  }

  return { actual, butFor };
}

/**
 * Full trade secret damages calculation
 */
export function calculateTradeSecretDamages(
  inputs: TradeSecretInputs,
  marketInputs: MarketInputs,
  competitorInputs: CompetitorInputs,
  annualMarketSize: number,
  discountRate: number = 0.1,
  useSampling: boolean = false
): TradeSecretResult {
  const calculationSteps: CalculationStep[] = [];

  // 1. Head start damages
  const headStart = calculateHeadStartDamages(
    inputs,
    marketInputs,
    competitorInputs,
    annualMarketSize,
    useSampling
  );
  calculationSteps.push(...headStart.steps);

  // 2. Development cost savings
  const devSavings = calculateDevelopmentSavings(inputs, useSampling);
  calculationSteps.push(devSavings.steps);

  // 3. Permanent market loss
  const remainingYears = marketInputs.patentExpiryYear - new Date().getFullYear();
  const permanentLoss = calculatePermanentMarketLoss(
    inputs,
    marketInputs,
    competitorInputs,
    annualMarketSize,
    Math.max(5, remainingYears),
    discountRate,
    useSampling
  );
  calculationSteps.push(permanentLoss.steps);

  // Total damages (avoid double counting)
  // Head start and permanent loss may overlap, so we take max of first year
  const totalDamages = headStart.damages + devSavings.savings + permanentLoss.damages;

  // Summary
  calculationSteps.unshift({
    id: 'trade-secret-summary',
    label: 'Trade Secret Damages Summary',
    inputs: [
      { name: 'Head Start Damages', value: headStart.damages },
      { name: 'Development Costs Saved', value: devSavings.savings },
      { name: 'Permanent Market Loss (NPV)', value: permanentLoss.damages },
    ],
    result: totalDamages,
    notes: 'Trade secret damages may include unjust enrichment (costs saved) plus lost profits (head start + permanent loss). Courts vary on allowing both.',
  });

  return {
    headStartDamages: headStart.damages,
    developmentCostsSaved: devSavings.savings,
    permanentMarketLoss: permanentLoss.damages,
    unjustEnrichment: devSavings.savings,
    totalDamages,
    calculationSteps,
  };
}
