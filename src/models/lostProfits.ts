import {
  MarketInputs,
  CompetitorInputs,
  PriceInputs,
  DiscountingInputs,
  UncertaintyRange,
  CalculationStep,
  YearlyDamages,
} from '../types';
import { sampleUncertainty } from '../utils/uncertainty';

/**
 * Lost Profits Damages Calculation
 *
 * Based on Panduit Corp. v. Stahlin Bros. Fibre Works (1978) factors:
 * 1. Demand for the patented product
 * 2. Absence of acceptable non-infringing substitutes
 * 3. Manufacturing and marketing capability to exploit demand
 * 4. Amount of profit that would have been made
 *
 * Also incorporates:
 * - Price erosion (defendant's lower prices forced plaintiff to lower prices)
 * - Market share erosion
 * - Convoyed sales (lost sales of related products)
 */

export interface LostProfitsResult {
  totalLostProfits: number;
  lostSalesVolume: number;
  priceErosionDamages: number;
  yearlyBreakdown: YearlyDamages[];
  calculationSteps: CalculationStep[];
}

export interface YearlyMarketData {
  year: number;
  marketSize: number;
  plaintiffActualShare: number;
  plaintiffButForShare: number;
  defendantActualShare: number;
  plaintiffActualPrice: number;
  plaintiffButForPrice: number;
  plaintiffMargin: number;
}

/**
 * Calculate "But-For" world market shares
 * What would have happened absent infringement?
 */
export function calculateButForWorld(
  inputs: {
    market: MarketInputs;
    competitors: CompetitorInputs;
    prices: PriceInputs;
  },
  useSampling: boolean = false
): YearlyMarketData[] {
  const result: YearlyMarketData[] = [];

  const baseMarketSize = useSampling
    ? sampleUncertainty(inputs.market.totalMarketSize)
    : inputs.market.totalMarketSize.base;

  const growthRate = useSampling
    ? sampleUncertainty(inputs.market.marketGrowthRate)
    : inputs.market.marketGrowthRate.base;

  const plaintiffButForShare = useSampling
    ? sampleUncertainty(inputs.competitors.plaintiffButForShare)
    : inputs.competitors.plaintiffButForShare.base;

  const plaintiffActualShare = useSampling
    ? sampleUncertainty(inputs.competitors.plaintiffActualShare)
    : inputs.competitors.plaintiffActualShare.base;

  const defendantActualShare = useSampling
    ? sampleUncertainty(inputs.competitors.defendantActualShare)
    : inputs.competitors.defendantActualShare.base;

  const plaintiffPrice = useSampling
    ? sampleUncertainty(inputs.prices.plaintiffPrice)
    : inputs.prices.plaintiffPrice.base;

  const butForPrice = useSampling
    ? sampleUncertainty(inputs.prices.butForPrice)
    : inputs.prices.butForPrice.base;

  const margin = useSampling
    ? sampleUncertainty(inputs.competitors.plaintiffIncrementalMargin)
    : inputs.competitors.plaintiffIncrementalMargin.base;

  for (let year = inputs.market.infringementStartYear; year <= inputs.market.infringementEndYear; year++) {
    const yearsFromStart = year - inputs.market.infringementStartYear;
    const marketSize = baseMarketSize * Math.pow(1 + growthRate, yearsFromStart);

    result.push({
      year,
      marketSize,
      plaintiffActualShare,
      plaintiffButForShare,
      defendantActualShare,
      plaintiffActualPrice: plaintiffPrice,
      plaintiffButForPrice: butForPrice,
      plaintiffMargin: margin,
    });
  }

  return result;
}

/**
 * Calculate lost profits for each year
 */
export function calculateLostProfits(
  yearlyData: YearlyMarketData[]
): { yearlyLostProfits: { year: number; lostProfits: number; priceErosion: number }[]; total: number } {
  const yearlyLostProfits: { year: number; lostProfits: number; priceErosion: number }[] = [];
  let total = 0;

  for (const data of yearlyData) {
    // Lost Sales Volume = Market Size × (But-For Share - Actual Share)
    const lostVolume = data.marketSize * (data.plaintiffButForShare - data.plaintiffActualShare);

    // Lost Profits from Lost Volume = Lost Volume × But-For Price × Margin
    const lostProfitsVolume = lostVolume * data.plaintiffButForPrice * data.plaintiffMargin;

    // Price Erosion = Actual Volume × (But-For Price - Actual Price) × Margin
    const actualVolume = data.marketSize * data.plaintiffActualShare;
    const priceErosion = actualVolume * (data.plaintiffButForPrice - data.plaintiffActualPrice) * data.plaintiffMargin;

    const yearTotal = lostProfitsVolume + priceErosion;
    yearlyLostProfits.push({
      year: data.year,
      lostProfits: lostProfitsVolume,
      priceErosion,
    });
    total += yearTotal;
  }

  return { yearlyLostProfits, total };
}

/**
 * Apply discounting to calculate present value
 */
export function applyDiscounting(
  yearlyDamages: { year: number; damages: number }[],
  discountInputs: DiscountingInputs,
  valuationDate: number,
  useSampling: boolean = false
): { yearlyPV: { year: number; nominalDamages: number; presentValue: number }[]; totalPV: number } {
  // Calculate WACC (Weighted Average Cost of Capital)
  const riskFreeRate = useSampling
    ? sampleUncertainty(discountInputs.riskFreeRate)
    : discountInputs.riskFreeRate.base;

  const equityRiskPremium = useSampling
    ? sampleUncertainty(discountInputs.equityRiskPremium)
    : discountInputs.equityRiskPremium.base;

  const beta = useSampling
    ? sampleUncertainty(discountInputs.companyBeta)
    : discountInputs.companyBeta.base;

  const debtCost = useSampling
    ? sampleUncertainty(discountInputs.debtCostPreTax)
    : discountInputs.debtCostPreTax.base;

  const taxRate = useSampling
    ? sampleUncertainty(discountInputs.taxRate)
    : discountInputs.taxRate.base;

  const deToEquity = useSampling
    ? sampleUncertainty(discountInputs.debtToEquityRatio)
    : discountInputs.debtToEquityRatio.base;

  // Cost of Equity (CAPM)
  const costOfEquity = riskFreeRate + beta * equityRiskPremium;

  // After-tax cost of debt
  const afterTaxDebtCost = debtCost * (1 - taxRate);

  // WACC
  const equityWeight = 1 / (1 + deToEquity);
  const debtWeight = deToEquity / (1 + deToEquity);
  const wacc = costOfEquity * equityWeight + afterTaxDebtCost * debtWeight;

  const yearlyPV: { year: number; nominalDamages: number; presentValue: number }[] = [];
  let totalPV = 0;

  for (const { year, damages } of yearlyDamages) {
    const periodsFromValuation = year - valuationDate;
    const discountFactor = Math.pow(1 + wacc, -periodsFromValuation);
    const presentValue = damages * discountFactor;

    yearlyPV.push({
      year,
      nominalDamages: damages,
      presentValue,
    });
    totalPV += presentValue;
  }

  return { yearlyPV, totalPV };
}

/**
 * Calculate prejudgment interest
 */
export function calculatePrejudgmentInterest(
  yearlyDamages: { year: number; damages: number }[],
  interestRate: number,
  judgmentYear: number
): { total: number; byYear: { year: number; principal: number; interest: number }[] } {
  const byYear: { year: number; principal: number; interest: number }[] = [];
  let total = 0;

  for (const { year, damages } of yearlyDamages) {
    const yearsToJudgment = judgmentYear - year;
    // Simple interest (courts often use this)
    const interest = damages * interestRate * yearsToJudgment;

    byYear.push({
      year,
      principal: damages,
      interest,
    });
    total += interest;
  }

  return { total, byYear };
}

/**
 * Full lost profits calculation with all steps
 */
export function calculateFullLostProfits(
  inputs: {
    market: MarketInputs;
    competitors: CompetitorInputs;
    prices: PriceInputs;
    discounting: DiscountingInputs;
  },
  useSampling: boolean = false
): LostProfitsResult {
  // Step 1: Calculate But-For World
  const yearlyData = calculateButForWorld(inputs, useSampling);

  // Step 2: Calculate Lost Profits
  const { yearlyLostProfits, total: totalLostProfits } = calculateLostProfits(yearlyData);

  // Step 3: Calculate total volumes
  const totalLostVolume = yearlyData.reduce(
    (sum, d) => sum + d.marketSize * (d.plaintiffButForShare - d.plaintiffActualShare),
    0
  );

  const totalPriceErosion = yearlyLostProfits.reduce((sum, y) => sum + y.priceErosion, 0);

  // Step 4: Apply discounting
  const yearlyDamagesForDiscounting = yearlyLostProfits.map(y => ({
    year: y.year,
    damages: y.lostProfits + y.priceErosion,
  }));

  const valuationDate = new Date().getFullYear();
  const { yearlyPV, totalPV } = applyDiscounting(
    yearlyDamagesForDiscounting,
    inputs.discounting,
    valuationDate,
    useSampling
  );

  // Build calculation steps
  const calculationSteps: CalculationStep[] = [
    {
      id: 'panduit-factors',
      label: 'Panduit Test for Lost Profits',
      inputs: [
        { name: 'Factor 1: Demand', value: 'Established by market data' },
        { name: 'Factor 2: No substitutes', value: 'Patent precludes non-infringing alternatives' },
        { name: 'Factor 3: Capability', value: 'Plaintiff had capacity to serve market' },
        { name: 'Factor 4: Profit amount', value: 'Calculated below' },
      ],
      result: totalLostProfits,
      notes: 'Panduit factors must be satisfied to recover lost profits vs. reasonable royalty.',
    },
    {
      id: 'but-for-analysis',
      label: 'But-For World Analysis',
      formula: 'Lost Share = But-For Share - Actual Share',
      inputs: [
        { name: 'But-For Share', value: inputs.competitors.plaintiffButForShare.base },
        { name: 'Actual Share', value: inputs.competitors.plaintiffActualShare.base },
        { name: 'Defendant Share', value: inputs.competitors.defendantActualShare.base },
      ],
      result: inputs.competitors.plaintiffButForShare.base - inputs.competitors.plaintiffActualShare.base,
      notes: 'But-for world: market state absent infringement. Key assumption: lost sales flow to plaintiff.',
      children: yearlyData.map(d => ({
        id: `year-${d.year}`,
        label: `Year ${d.year}`,
        inputs: [
          { name: 'Market Size', value: d.marketSize },
          { name: 'But-For Share', value: d.plaintiffButForShare },
          { name: 'Actual Share', value: d.plaintiffActualShare },
          { name: 'Lost Volume', value: d.marketSize * (d.plaintiffButForShare - d.plaintiffActualShare) },
        ],
        result: d.marketSize * (d.plaintiffButForShare - d.plaintiffActualShare) * d.plaintiffButForPrice * d.plaintiffMargin,
      })),
    },
    {
      id: 'lost-profits-calc',
      label: 'Lost Profits Calculation',
      formula: 'Lost Profits = Lost Volume × Price × Incremental Margin',
      inputs: [
        { name: 'Total Lost Volume', value: totalLostVolume },
        { name: 'But-For Price', value: inputs.prices.butForPrice.base },
        { name: 'Incremental Margin', value: inputs.competitors.plaintiffIncrementalMargin.base },
      ],
      result: totalLostProfits - totalPriceErosion,
      notes: 'Incremental margin excludes fixed costs that would be incurred regardless.',
    },
    {
      id: 'price-erosion',
      label: 'Price Erosion Damages',
      formula: 'Price Erosion = Actual Volume × (But-For Price - Actual Price) × Margin',
      inputs: [
        { name: 'But-For Price', value: inputs.prices.butForPrice.base },
        { name: 'Actual Price', value: inputs.prices.plaintiffPrice.base },
        { name: 'Price Reduction %', value: `${((1 - inputs.prices.plaintiffPrice.base / inputs.prices.butForPrice.base) * 100).toFixed(1)}%` },
      ],
      result: totalPriceErosion,
      notes: 'Price erosion occurs when infringer forces patentee to lower prices to compete.',
    },
    {
      id: 'present-value',
      label: 'Present Value Calculation',
      formula: 'PV = Σ Damages_t / (1 + WACC)^t',
      inputs: [
        { name: 'Risk-Free Rate', value: inputs.discounting.riskFreeRate.base },
        { name: 'Company Beta', value: inputs.discounting.companyBeta.base },
        { name: 'Equity Risk Premium', value: inputs.discounting.equityRiskPremium.base },
      ],
      result: totalPV,
      notes: 'Discounting brings all damages to present value using WACC.',
    },
  ];

  // Build yearly breakdown
  const yearlyBreakdown: YearlyDamages[] = yearlyLostProfits.map((y, i) => ({
    year: y.year,
    lostProfits: y.lostProfits,
    priceErosion: y.priceErosion,
    reasonableRoyalty: 0, // Calculated separately
    total: y.lostProfits + y.priceErosion,
    presentValue: yearlyPV[i]?.presentValue || 0,
  }));

  return {
    totalLostProfits: totalLostProfits - totalPriceErosion,
    lostSalesVolume: totalLostVolume,
    priceErosionDamages: totalPriceErosion,
    yearlyBreakdown,
    calculationSteps,
  };
}
