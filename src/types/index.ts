// Core types for IP Damages Model

export interface UncertaintyRange {
  low: number;
  base: number;
  high: number;
  distribution?: 'triangular' | 'normal' | 'uniform' | 'lognormal';
}

export interface YearlyData {
  year: number;
  value: number;
  uncertainty?: UncertaintyRange;
}

export interface MarketInputs {
  // Market size
  totalMarketSize: UncertaintyRange;
  marketGrowthRate: UncertaintyRange;
  projectionYears: number;
  infringementStartYear: number;
  infringementEndYear: number;

  // Product specifics
  patentExpiryYear: number;
  genericEntryDelay: number; // years after patent expiry
  productLaunchYear: number;
}

export interface CompetitorInputs {
  // Plaintiff (innovator)
  plaintiffPreInfringementShare: UncertaintyRange;
  plaintiffButForShare: UncertaintyRange;
  plaintiffActualShare: UncertaintyRange;
  plaintiffGrossMargin: UncertaintyRange;
  plaintiffIncrementalMargin: UncertaintyRange;

  // Defendant (infringer)
  defendantActualShare: UncertaintyRange;
  defendantGrossMargin: UncertaintyRange;
  defendantHeadStartMonths: number; // for trade secret cases

  // Other competitors
  otherCompetitorsShare: UncertaintyRange;
}

export interface PriceInputs {
  plaintiffPrice: UncertaintyRange;
  defendantPrice: UncertaintyRange;
  priceErosionPercent: UncertaintyRange;
  butForPrice: UncertaintyRange;
}

export interface RoyaltyInputs {
  // Georgia-Pacific style inputs
  establishedRoyaltyRate?: number;
  comparableLicenses: ComparableLicense[];
  profitSplit: UncertaintyRange; // defendant's profit share to plaintiff

  // Rubinstein bargaining
  discountRatePerRound: UncertaintyRange;
  plaintiffBATNA: UncertaintyRange; // Best Alternative to Negotiated Agreement
  defendantBATNA: UncertaintyRange;

  // Patent value
  patentStrength: UncertaintyRange; // 0-1
  technologyContribution: UncertaintyRange; // % of product value from patented tech
}

export interface ComparableLicense {
  name: string;
  royaltyRate: number;
  adjustmentFactor: UncertaintyRange;
  weight: number;
  notes?: string;
}

export interface SCurveInputs {
  // Bass diffusion model parameters
  innovationCoefficient: UncertaintyRange; // p
  imitationCoefficient: UncertaintyRange; // q
  marketPotential: UncertaintyRange; // m

  // Alternative sigmoid parameters
  adoptionMidpoint: UncertaintyRange; // year at 50% adoption
  adoptionSteepness: UncertaintyRange; // k parameter
}

export interface ShapleyInputs {
  patents: PatentValue[];
  totalProductValue: UncertaintyRange;
}

export interface PatentValue {
  id: string;
  name: string;
  standaloneValue: UncertaintyRange;
  essentiality: UncertaintyRange; // 0-1, how essential to product
  validityProbability: UncertaintyRange;
}

export interface TradeSecretInputs {
  headStartMonths: number;
  developmentCostSaved: UncertaintyRange;
  timeToMarketAdvantage: UncertaintyRange;
  marketShareDuringHeadStart: UncertaintyRange;
  permanentMarketShareShift: UncertaintyRange;
}

export interface DiscountingInputs {
  riskFreeRate: UncertaintyRange;
  equityRiskPremium: UncertaintyRange;
  companyBeta: UncertaintyRange;
  debtCostPreTax: UncertaintyRange;
  taxRate: UncertaintyRange;
  debtToEquityRatio: UncertaintyRange;
  additionalRiskPremium: UncertaintyRange;
  prejudgmentInterestRate: UncertaintyRange;
}

export interface DamagesInputs {
  market: MarketInputs;
  competitors: CompetitorInputs;
  prices: PriceInputs;
  royalty: RoyaltyInputs;
  sCurve: SCurveInputs;
  shapley: ShapleyInputs;
  tradeSecret: TradeSecretInputs;
  discounting: DiscountingInputs;
}

// Calculation results

export interface CalculationStep {
  id: string;
  label: string;
  formula?: string;
  inputs: { name: string; value: number | string; source?: string }[];
  result: number;
  resultUncertainty?: UncertaintyRange;
  notes?: string;
  children?: CalculationStep[];
}

export interface YearlyDamages {
  year: number;
  lostProfits: number;
  priceErosion: number;
  reasonableRoyalty: number;
  total: number;
  presentValue: number;
}

export interface DamagesSummary {
  lostProfits: UncertaintyRange;
  priceErosion: UncertaintyRange;
  reasonableRoyalty: UncertaintyRange;
  totalDamages: UncertaintyRange;
  presentValueDamages: UncertaintyRange;
  prejudgmentInterest: UncertaintyRange;

  // Allocation models
  shapleyAllocation?: number;
  rubinsteinRoyalty?: number;

  yearlyBreakdown: YearlyDamages[];
  calculationSteps: CalculationStep[];
}

export interface MonteCarloResult {
  mean: number;
  median: number;
  std: number;
  percentile5: number;
  percentile25: number;
  percentile75: number;
  percentile95: number;
  histogram: { bin: number; count: number }[];
  samples: number[];
}

export interface SensitivityResult {
  parameter: string;
  baseValue: number;
  lowValue: number;
  highValue: number;
  lowDamages: number;
  baseDamages: number;
  highDamages: number;
  elasticity: number;
}
