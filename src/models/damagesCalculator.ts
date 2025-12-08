import {
  DamagesInputs,
  DamagesSummary,
  CalculationStep,
  YearlyDamages,
  MonteCarloResult,
  SensitivityResult,
  UncertaintyRange,
} from '../types';
import { runMonteCarlo, sampleUncertainty } from '../utils/uncertainty';
import { calculateFullLostProfits, applyDiscounting, calculatePrejudgmentInterest } from './lostProfits';
import { calculateReasonableRoyalty, GeorgiaPacificFactors } from './reasonableRoyalty';
import { calculateRubinsteinRoyalty } from './rubinstein';
import { calculateShapleyAllocation } from './shapley';
import { calculateSCurve } from './scurve';
import { calculateTradeSecretDamages } from './tradeSecret';

export interface FullDamagesResult {
  summary: DamagesSummary;
  lostProfitsDetail: ReturnType<typeof calculateFullLostProfits>;
  reasonableRoyaltyDetail?: ReturnType<typeof calculateReasonableRoyalty>;
  rubinsteinDetail?: ReturnType<typeof calculateRubinsteinRoyalty>;
  shapleyDetail?: ReturnType<typeof calculateShapleyAllocation>;
  scurveDetail?: ReturnType<typeof calculateSCurve>;
  tradeSecretDetail?: ReturnType<typeof calculateTradeSecretDamages>;
  monteCarloResults?: {
    totalDamages: MonteCarloResult;
    lostProfits: MonteCarloResult;
    royalties: MonteCarloResult;
  };
  sensitivityResults?: SensitivityResult[];
}

/**
 * Calculate all damages components and aggregate
 */
export function calculateDamages(
  inputs: DamagesInputs,
  options: {
    includeLostProfits: boolean;
    includeReasonableRoyalty: boolean;
    includeRubinstein: boolean;
    includeShapley: boolean;
    includeSCurve: boolean;
    includeTradeSecret: boolean;
    runMonteCarlo: boolean;
    runSensitivity: boolean;
    monteCarloIterations?: number;
  } = {
    includeLostProfits: true,
    includeReasonableRoyalty: true,
    includeRubinstein: true,
    includeShapley: true,
    includeSCurve: true,
    includeTradeSecret: false,
    runMonteCarlo: true,
    runSensitivity: true,
    monteCarloIterations: 5000,
  }
): FullDamagesResult {
  const calculationSteps: CalculationStep[] = [];
  let yearlyBreakdown: YearlyDamages[] = [];

  // 1. Lost Profits Calculation
  const lostProfitsDetail = calculateFullLostProfits({
    market: inputs.market,
    competitors: inputs.competitors,
    prices: inputs.prices,
    discounting: inputs.discounting,
  });

  if (options.includeLostProfits) {
    calculationSteps.push(...lostProfitsDetail.calculationSteps);
    yearlyBreakdown = lostProfitsDetail.yearlyBreakdown;
  }

  // 2. Reasonable Royalty
  let reasonableRoyaltyDetail: ReturnType<typeof calculateReasonableRoyalty> | undefined;
  if (options.includeReasonableRoyalty) {
    const gpFactors: GeorgiaPacificFactors = {
      establishedRoyalties: [],
      comparableLicenses: inputs.royalty.comparableLicenses,
      isExclusive: false,
      hasFieldOfUseRestrictions: false,
      territorialScope: 'us_only',
      commercialSuccess: { low: 0.6, base: 0.75, high: 0.9 },
      technicalAdvantages: { low: 0.5, base: 0.65, high: 0.8 },
      patentContribution: inputs.royalty.technologyContribution,
      useRubinstein: options.includeRubinstein,
    };

    // Calculate defendant's total profits for royalty base
    const defendantRevenue = inputs.market.totalMarketSize.base *
      inputs.competitors.defendantActualShare.base *
      (inputs.market.infringementEndYear - inputs.market.infringementStartYear + 1);
    const defendantProfits = defendantRevenue * inputs.competitors.defendantGrossMargin.base;
    const defendantMargin = inputs.competitors.defendantGrossMargin.base;

    reasonableRoyaltyDetail = calculateReasonableRoyalty(
      inputs.royalty,
      gpFactors,
      defendantProfits,
      defendantMargin
    );
    calculationSteps.push(...reasonableRoyaltyDetail.calculationSteps);

    // Add royalties to yearly breakdown
    const yearsOfInfringement = inputs.market.infringementEndYear - inputs.market.infringementStartYear + 1;
    const annualRoyalty = reasonableRoyaltyDetail.totalRoyalties / yearsOfInfringement;
    yearlyBreakdown = yearlyBreakdown.map(y => ({
      ...y,
      reasonableRoyalty: annualRoyalty,
      total: y.total + annualRoyalty,
    }));
  }

  // 3. Rubinstein Bargaining (standalone)
  let rubinsteinDetail: ReturnType<typeof calculateRubinsteinRoyalty> | undefined;
  if (options.includeRubinstein) {
    const defendantProfits = inputs.market.totalMarketSize.base *
      inputs.competitors.defendantActualShare.base *
      inputs.competitors.defendantGrossMargin.base *
      (inputs.market.infringementEndYear - inputs.market.infringementStartYear + 1);

    rubinsteinDetail = calculateRubinsteinRoyalty(inputs.royalty, defendantProfits);
  }

  // 4. Shapley Value Allocation
  let shapleyDetail: ReturnType<typeof calculateShapleyAllocation> | undefined;
  if (options.includeShapley && inputs.shapley.patents.length > 0) {
    shapleyDetail = calculateShapleyAllocation(inputs.shapley);
    calculationSteps.push(...shapleyDetail.calculationSteps);
  }

  // 5. S-Curve Analysis
  let scurveDetail: ReturnType<typeof calculateSCurve> | undefined;
  if (options.includeSCurve) {
    scurveDetail = calculateSCurve(
      inputs.sCurve,
      inputs.market.infringementStartYear,
      inputs.market.infringementEndYear
    );
    calculationSteps.push(...scurveDetail.calculationSteps);
  }

  // 6. Trade Secret Damages
  let tradeSecretDetail: ReturnType<typeof calculateTradeSecretDamages> | undefined;
  if (options.includeTradeSecret && inputs.tradeSecret.headStartMonths > 0) {
    tradeSecretDetail = calculateTradeSecretDamages(
      inputs.tradeSecret,
      inputs.market,
      inputs.competitors,
      inputs.market.totalMarketSize.base,
      inputs.discounting.riskFreeRate.base + inputs.discounting.additionalRiskPremium.base
    );
    calculationSteps.push(...tradeSecretDetail.calculationSteps);
  }

  // Aggregate totals
  const totalLostProfits = lostProfitsDetail.totalLostProfits + lostProfitsDetail.priceErosionDamages;
  const totalRoyalties = reasonableRoyaltyDetail?.totalRoyalties || 0;
  const totalTradeSecret = tradeSecretDetail?.totalDamages || 0;

  // Use higher of lost profits or reasonable royalty (standard approach)
  const primaryDamages = Math.max(totalLostProfits, totalRoyalties);
  const totalDamages = primaryDamages + totalTradeSecret;

  // Calculate present value and prejudgment interest
  const valuationYear = new Date().getFullYear();
  const yearlyDamagesForPV = yearlyBreakdown.map(y => ({
    year: y.year,
    damages: y.total,
  }));

  const pvResult = applyDiscounting(
    yearlyDamagesForPV,
    inputs.discounting,
    valuationYear
  );

  const pjiResult = calculatePrejudgmentInterest(
    yearlyDamagesForPV,
    inputs.discounting.prejudgmentInterestRate.base,
    valuationYear
  );

  // Build summary
  const summary: DamagesSummary = {
    lostProfits: {
      low: totalLostProfits * 0.7,
      base: totalLostProfits,
      high: totalLostProfits * 1.3,
    },
    priceErosion: {
      low: lostProfitsDetail.priceErosionDamages * 0.7,
      base: lostProfitsDetail.priceErosionDamages,
      high: lostProfitsDetail.priceErosionDamages * 1.3,
    },
    reasonableRoyalty: {
      low: totalRoyalties * 0.7,
      base: totalRoyalties,
      high: totalRoyalties * 1.3,
    },
    totalDamages: {
      low: totalDamages * 0.7,
      base: totalDamages,
      high: totalDamages * 1.3,
    },
    presentValueDamages: {
      low: pvResult.totalPV * 0.7,
      base: pvResult.totalPV,
      high: pvResult.totalPV * 1.3,
    },
    prejudgmentInterest: {
      low: pjiResult.total * 0.8,
      base: pjiResult.total,
      high: pjiResult.total * 1.2,
    },
    shapleyAllocation: shapleyDetail?.allocations[0]?.shapleyValue,
    rubinsteinRoyalty: rubinsteinDetail?.royaltyRate,
    yearlyBreakdown,
    calculationSteps,
  };

  // 7. Monte Carlo Simulation
  let monteCarloResults: FullDamagesResult['monteCarloResults'];
  if (options.runMonteCarlo) {
    const iterations = options.monteCarloIterations || 5000;

    const totalDamagesMC = runMonteCarlo(() => {
      const lp = calculateFullLostProfits({
        market: inputs.market,
        competitors: inputs.competitors,
        prices: inputs.prices,
        discounting: inputs.discounting,
      }, true);
      return lp.totalLostProfits + lp.priceErosionDamages;
    }, iterations);

    const lostProfitsMC = runMonteCarlo(() => {
      const lp = calculateFullLostProfits({
        market: inputs.market,
        competitors: inputs.competitors,
        prices: inputs.prices,
        discounting: inputs.discounting,
      }, true);
      return lp.totalLostProfits;
    }, iterations);

    const royaltiesMC = runMonteCarlo(() => {
      if (!reasonableRoyaltyDetail) return 0;
      const defendantProfits = sampleUncertainty(inputs.market.totalMarketSize) *
        sampleUncertainty(inputs.competitors.defendantActualShare) *
        sampleUncertainty(inputs.competitors.defendantGrossMargin) *
        (inputs.market.infringementEndYear - inputs.market.infringementStartYear + 1);

      const gpFactors: GeorgiaPacificFactors = {
        establishedRoyalties: [],
        comparableLicenses: inputs.royalty.comparableLicenses,
        isExclusive: false,
        hasFieldOfUseRestrictions: false,
        territorialScope: 'us_only',
        commercialSuccess: { low: 0.6, base: 0.75, high: 0.9 },
        technicalAdvantages: { low: 0.5, base: 0.65, high: 0.8 },
        patentContribution: inputs.royalty.technologyContribution,
        useRubinstein: false,
      };

      const rr = calculateReasonableRoyalty(
        inputs.royalty,
        gpFactors,
        defendantProfits,
        inputs.competitors.defendantGrossMargin.base,
        true
      );
      return rr.totalRoyalties;
    }, iterations);

    monteCarloResults = {
      totalDamages: totalDamagesMC,
      lostProfits: lostProfitsMC,
      royalties: royaltiesMC,
    };

    // Update summary with MC results
    summary.totalDamages = {
      low: totalDamagesMC.percentile5,
      base: totalDamagesMC.median,
      high: totalDamagesMC.percentile95,
    };
  }

  // 8. Sensitivity Analysis
  let sensitivityResults: SensitivityResult[] | undefined;
  if (options.runSensitivity) {
    sensitivityResults = runSensitivityAnalysis(inputs);
  }

  return {
    summary,
    lostProfitsDetail,
    reasonableRoyaltyDetail,
    rubinsteinDetail,
    shapleyDetail,
    scurveDetail,
    tradeSecretDetail,
    monteCarloResults,
    sensitivityResults,
  };
}

/**
 * Run sensitivity analysis on key parameters
 */
function runSensitivityAnalysis(inputs: DamagesInputs): SensitivityResult[] {
  const results: SensitivityResult[] = [];

  const keyParams: {
    name: string;
    getValue: () => UncertaintyRange;
    updateInput: (value: number) => DamagesInputs;
  }[] = [
    {
      name: 'Market Size',
      getValue: () => inputs.market.totalMarketSize,
      updateInput: (v) => ({
        ...inputs,
        market: { ...inputs.market, totalMarketSize: { low: v, base: v, high: v } },
      }),
    },
    {
      name: 'Plaintiff But-For Share',
      getValue: () => inputs.competitors.plaintiffButForShare,
      updateInput: (v) => ({
        ...inputs,
        competitors: { ...inputs.competitors, plaintiffButForShare: { low: v, base: v, high: v } },
      }),
    },
    {
      name: 'Plaintiff Actual Share',
      getValue: () => inputs.competitors.plaintiffActualShare,
      updateInput: (v) => ({
        ...inputs,
        competitors: { ...inputs.competitors, plaintiffActualShare: { low: v, base: v, high: v } },
      }),
    },
    {
      name: 'Incremental Margin',
      getValue: () => inputs.competitors.plaintiffIncrementalMargin,
      updateInput: (v) => ({
        ...inputs,
        competitors: { ...inputs.competitors, plaintiffIncrementalMargin: { low: v, base: v, high: v } },
      }),
    },
    {
      name: 'Patent Strength',
      getValue: () => inputs.royalty.patentStrength,
      updateInput: (v) => ({
        ...inputs,
        royalty: { ...inputs.royalty, patentStrength: { low: v, base: v, high: v } },
      }),
    },
    {
      name: 'Technology Contribution',
      getValue: () => inputs.royalty.technologyContribution,
      updateInput: (v) => ({
        ...inputs,
        royalty: { ...inputs.royalty, technologyContribution: { low: v, base: v, high: v } },
      }),
    },
  ];

  for (const param of keyParams) {
    const range = param.getValue();
    const baseValue = range.base;

    // Calculate damages at low, base, high
    const calculateTotal = (modified: DamagesInputs) => {
      const lp = calculateFullLostProfits({
        market: modified.market,
        competitors: modified.competitors,
        prices: modified.prices,
        discounting: modified.discounting,
      });
      return lp.totalLostProfits + lp.priceErosionDamages;
    };

    const baseDamages = calculateTotal(inputs);
    const lowDamages = calculateTotal(param.updateInput(range.low));
    const highDamages = calculateTotal(param.updateInput(range.high));

    // Calculate elasticity (% change in output / % change in input)
    const pctChangeInput = (range.high - range.low) / baseValue;
    const pctChangeOutput = (highDamages - lowDamages) / baseDamages;
    const elasticity = pctChangeOutput / pctChangeInput;

    results.push({
      parameter: param.name,
      baseValue,
      lowValue: range.low,
      highValue: range.high,
      lowDamages,
      baseDamages,
      highDamages,
      elasticity,
    });
  }

  // Sort by absolute elasticity (most sensitive first)
  results.sort((a, b) => Math.abs(b.elasticity) - Math.abs(a.elasticity));

  return results;
}

/**
 * Quick summary calculation (for display)
 */
export function quickCalculate(inputs: DamagesInputs): {
  lostProfits: number;
  reasonableRoyalty: number;
  totalDamages: number;
} {
  const lp = calculateFullLostProfits({
    market: inputs.market,
    competitors: inputs.competitors,
    prices: inputs.prices,
    discounting: inputs.discounting,
  });

  const defendantRevenue = inputs.market.totalMarketSize.base *
    inputs.competitors.defendantActualShare.base *
    (inputs.market.infringementEndYear - inputs.market.infringementStartYear + 1);
  const defendantProfits = defendantRevenue * inputs.competitors.defendantGrossMargin.base;

  // Simplified royalty calculation
  const royaltyRate = inputs.royalty.technologyContribution.base *
    inputs.royalty.patentStrength.base *
    inputs.royalty.profitSplit.base;
  const reasonableRoyalty = defendantProfits * royaltyRate;

  const lostProfits = lp.totalLostProfits + lp.priceErosionDamages;

  return {
    lostProfits,
    reasonableRoyalty,
    totalDamages: Math.max(lostProfits, reasonableRoyalty),
  };
}
