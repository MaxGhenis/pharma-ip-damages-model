import { DamagesInputs, UncertaintyRange } from '../types';
import { createRange } from '../utils/uncertainty';

/**
 * Demo Scenarios based on real pharmaceutical IP litigation cases
 *
 * These scenarios are inspired by actual cases but use illustrative
 * numbers for educational purposes. All figures are fictional.
 */

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  caseType: 'patent' | 'trade_secret' | 'hatch_waxman';
  realCaseReference?: string;
  inputs: DamagesInputs;
}

// Helper to create uncertainty ranges
const range = (low: number, base: number, high: number): UncertaintyRange =>
  createRange(low, base, high, 'triangular');

/**
 * Scenario 1: Blockbuster Drug Patent Case
 * Inspired by cases like Lipitor, Humira patent litigation
 */
export const blockbusterDrugScenario: DemoScenario = {
  id: 'blockbuster-drug',
  name: 'Blockbuster Biologic Patent Case',
  description: `A branded biologic manufacturer (Innovator Inc.) sues a biosimilar
    manufacturer (Generic Co.) for infringing patents on a monoclonal antibody drug
    used to treat autoimmune diseases. The drug has $8B annual US sales.
    Suit filed after BPCIA dance, seeking lost profits and reasonable royalty.`,
  caseType: 'patent',
  realCaseReference: 'Inspired by Humira/Adalimumab biosimilar litigation pattern',
  inputs: {
    market: {
      totalMarketSize: range(7_000_000_000, 8_000_000_000, 9_000_000_000),
      marketGrowthRate: range(0.02, 0.04, 0.06),
      projectionYears: 10,
      infringementStartYear: 2020,
      infringementEndYear: 2025,
      patentExpiryYear: 2028,
      genericEntryDelay: 0.5,
      productLaunchYear: 2003,
    },
    competitors: {
      plaintiffPreInfringementShare: range(0.85, 0.90, 0.95),
      plaintiffButForShare: range(0.75, 0.82, 0.88),
      plaintiffActualShare: range(0.55, 0.62, 0.70),
      plaintiffGrossMargin: range(0.75, 0.80, 0.85),
      plaintiffIncrementalMargin: range(0.85, 0.90, 0.95),
      defendantActualShare: range(0.15, 0.20, 0.28),
      defendantGrossMargin: range(0.50, 0.60, 0.70),
      defendantHeadStartMonths: 0,
      otherCompetitorsShare: range(0.10, 0.18, 0.25),
    },
    prices: {
      plaintiffPrice: range(65000, 70000, 75000), // annual cost per patient
      defendantPrice: range(45000, 50000, 55000), // biosimilar discount
      priceErosionPercent: range(0.10, 0.15, 0.20),
      butForPrice: range(70000, 75000, 80000),
    },
    royalty: {
      comparableLicenses: [
        {
          name: 'AbbVie-Boehringer Settlement',
          royaltyRate: 0.05,
          adjustmentFactor: range(0.8, 1.0, 1.2),
          weight: 2,
          notes: 'Settlement for biosimilar entry delay',
        },
        {
          name: 'Industry Benchmark - Biologics',
          royaltyRate: 0.08,
          adjustmentFactor: range(0.7, 0.9, 1.1),
          weight: 1,
          notes: 'Typical biologic licensing rates',
        },
      ],
      profitSplit: range(0.40, 0.50, 0.60),
      discountRatePerRound: range(0.05, 0.10, 0.15),
      plaintiffBATNA: range(100_000_000, 200_000_000, 300_000_000),
      defendantBATNA: range(50_000_000, 100_000_000, 150_000_000),
      patentStrength: range(0.65, 0.75, 0.85),
      technologyContribution: range(0.60, 0.70, 0.80),
    },
    sCurve: {
      innovationCoefficient: range(0.01, 0.02, 0.03),
      imitationCoefficient: range(0.30, 0.40, 0.50),
      marketPotential: range(7_000_000_000, 8_000_000_000, 9_000_000_000),
      adoptionMidpoint: range(2022, 2023, 2024),
      adoptionSteepness: range(0.4, 0.5, 0.6),
    },
    shapley: {
      patents: [
        {
          id: 'formulation',
          name: 'Formulation Patent (Primary)',
          standaloneValue: range(2_000_000_000, 3_000_000_000, 4_000_000_000),
          essentiality: range(0.75, 0.85, 0.95),
          validityProbability: range(0.60, 0.75, 0.85),
        },
        {
          id: 'manufacturing',
          name: 'Manufacturing Process',
          standaloneValue: range(500_000_000, 800_000_000, 1_200_000_000),
          essentiality: range(0.40, 0.55, 0.70),
          validityProbability: range(0.55, 0.70, 0.80),
        },
        {
          id: 'dosing',
          name: 'Dosing Regimen',
          standaloneValue: range(300_000_000, 500_000_000, 800_000_000),
          essentiality: range(0.30, 0.45, 0.60),
          validityProbability: range(0.50, 0.65, 0.75),
        },
      ],
      totalProductValue: range(6_000_000_000, 8_000_000_000, 10_000_000_000),
    },
    tradeSecret: {
      headStartMonths: 0,
      developmentCostSaved: range(0, 0, 0),
      timeToMarketAdvantage: range(0, 0, 0),
      marketShareDuringHeadStart: range(0, 0, 0),
      permanentMarketShareShift: range(0, 0, 0),
    },
    discounting: {
      riskFreeRate: range(0.035, 0.045, 0.055),
      equityRiskPremium: range(0.04, 0.05, 0.06),
      companyBeta: range(0.7, 0.9, 1.1),
      debtCostPreTax: range(0.04, 0.05, 0.06),
      taxRate: range(0.18, 0.21, 0.25),
      debtToEquityRatio: range(0.2, 0.3, 0.4),
      additionalRiskPremium: range(0.01, 0.02, 0.03),
      prejudgmentInterestRate: range(0.04, 0.052, 0.06),
    },
  },
};

/**
 * Scenario 2: Trade Secret / Clinical Data Theft
 * Inspired by cases like Roche v. Amgen, trade secret cases
 */
export const tradeSecretScenario: DemoScenario = {
  id: 'trade-secret-theft',
  name: 'Clinical Data Trade Secret Case',
  description: `A pharmaceutical company (PharmaA) sues a competitor (PharmaB) for
    misappropriating trade secrets related to clinical trial data and manufacturing
    processes. A former employee took confidential formulation data to PharmaB,
    allowing them to accelerate development by 2+ years and beat PharmaA to market.`,
  caseType: 'trade_secret',
  realCaseReference: 'Inspired by trade secret patterns in biotech, e.g., Waymo v. Uber style fact pattern',
  inputs: {
    market: {
      totalMarketSize: range(1_500_000_000, 2_000_000_000, 2_500_000_000),
      marketGrowthRate: range(0.08, 0.12, 0.15),
      projectionYears: 15,
      infringementStartYear: 2019,
      infringementEndYear: 2025,
      patentExpiryYear: 2035,
      genericEntryDelay: 1,
      productLaunchYear: 2021, // Defendant launched in 2021, plaintiff would have launched 2023
    },
    competitors: {
      plaintiffPreInfringementShare: range(0, 0, 0), // Hadn't launched yet
      plaintiffButForShare: range(0.50, 0.60, 0.70),
      plaintiffActualShare: range(0.20, 0.28, 0.35),
      plaintiffGrossMargin: range(0.70, 0.75, 0.80),
      plaintiffIncrementalMargin: range(0.80, 0.85, 0.90),
      defendantActualShare: range(0.40, 0.50, 0.60),
      defendantGrossMargin: range(0.65, 0.72, 0.78),
      defendantHeadStartMonths: 24,
      otherCompetitorsShare: range(0.15, 0.22, 0.30),
    },
    prices: {
      plaintiffPrice: range(45000, 50000, 55000),
      defendantPrice: range(42000, 48000, 52000),
      priceErosionPercent: range(0.05, 0.08, 0.12),
      butForPrice: range(52000, 58000, 65000),
    },
    royalty: {
      comparableLicenses: [
        {
          name: 'Industry Data License',
          royaltyRate: 0.10,
          adjustmentFactor: range(0.8, 1.0, 1.2),
          weight: 1,
        },
      ],
      profitSplit: range(0.45, 0.55, 0.65),
      discountRatePerRound: range(0.08, 0.12, 0.15),
      plaintiffBATNA: range(20_000_000, 50_000_000, 80_000_000),
      defendantBATNA: range(100_000_000, 150_000_000, 200_000_000),
      patentStrength: range(0.80, 0.90, 0.95), // Trade secret was clearly misappropriated
      technologyContribution: range(0.50, 0.65, 0.75),
    },
    sCurve: {
      innovationCoefficient: range(0.02, 0.03, 0.04),
      imitationCoefficient: range(0.35, 0.45, 0.55),
      marketPotential: range(1_500_000_000, 2_000_000_000, 2_500_000_000),
      adoptionMidpoint: range(2023, 2024, 2025),
      adoptionSteepness: range(0.5, 0.6, 0.7),
    },
    shapley: {
      patents: [
        {
          id: 'clinical-data',
          name: 'Clinical Trial Data Package',
          standaloneValue: range(400_000_000, 600_000_000, 800_000_000),
          essentiality: range(0.70, 0.80, 0.90),
          validityProbability: range(0.85, 0.92, 0.98),
        },
        {
          id: 'manufacturing-process',
          name: 'Manufacturing Know-How',
          standaloneValue: range(150_000_000, 250_000_000, 350_000_000),
          essentiality: range(0.50, 0.65, 0.75),
          validityProbability: range(0.80, 0.88, 0.95),
        },
      ],
      totalProductValue: range(1_200_000_000, 1_800_000_000, 2_400_000_000),
    },
    tradeSecret: {
      headStartMonths: 24,
      developmentCostSaved: range(150_000_000, 250_000_000, 350_000_000),
      timeToMarketAdvantage: range(18, 24, 30),
      marketShareDuringHeadStart: range(0.55, 0.65, 0.75),
      permanentMarketShareShift: range(0.08, 0.12, 0.18),
    },
    discounting: {
      riskFreeRate: range(0.03, 0.04, 0.05),
      equityRiskPremium: range(0.04, 0.05, 0.06),
      companyBeta: range(1.0, 1.2, 1.4),
      debtCostPreTax: range(0.045, 0.055, 0.065),
      taxRate: range(0.18, 0.21, 0.24),
      debtToEquityRatio: range(0.25, 0.35, 0.45),
      additionalRiskPremium: range(0.02, 0.03, 0.04),
      prejudgmentInterestRate: range(0.045, 0.055, 0.065),
    },
  },
};

/**
 * Scenario 3: Hatch-Waxman / ANDA Case
 * Small molecule generic drug litigation
 */
export const hatchWaxmanScenario: DemoScenario = {
  id: 'hatch-waxman',
  name: 'Hatch-Waxman ANDA Patent Case',
  description: `A branded pharmaceutical company (BrandCo) sues a generic manufacturer
    (GenericCo) under Hatch-Waxman after GenericCo filed an ANDA with Paragraph IV
    certification. The case involves a small molecule drug with ~$3B annual sales.
    Key issues include infringement of formulation patents and validity challenges.`,
  caseType: 'hatch_waxman',
  realCaseReference: 'Common Hatch-Waxman pattern, similar to Lipitor, Nexium litigation',
  inputs: {
    market: {
      totalMarketSize: range(2_500_000_000, 3_000_000_000, 3_500_000_000),
      marketGrowthRate: range(-0.02, 0.02, 0.05), // Mature market
      projectionYears: 8,
      infringementStartYear: 2022,
      infringementEndYear: 2027,
      patentExpiryYear: 2027,
      genericEntryDelay: 0, // Immediate after patent expiry
      productLaunchYear: 2008,
    },
    competitors: {
      plaintiffPreInfringementShare: range(0.92, 0.96, 0.99),
      plaintiffButForShare: range(0.85, 0.90, 0.94),
      plaintiffActualShare: range(0.45, 0.55, 0.65),
      plaintiffGrossMargin: range(0.80, 0.85, 0.90),
      plaintiffIncrementalMargin: range(0.88, 0.92, 0.95),
      defendantActualShare: range(0.25, 0.32, 0.40),
      defendantGrossMargin: range(0.35, 0.45, 0.55),
      defendantHeadStartMonths: 0,
      otherCompetitorsShare: range(0.08, 0.13, 0.20),
    },
    prices: {
      plaintiffPrice: range(280, 320, 360), // per monthly script
      defendantPrice: range(40, 55, 70), // generic pricing
      priceErosionPercent: range(0.20, 0.30, 0.40),
      butForPrice: range(340, 380, 420),
    },
    royalty: {
      comparableLicenses: [
        {
          name: 'First-Filer Settlement',
          royaltyRate: 0.03,
          adjustmentFactor: range(0.8, 1.0, 1.3),
          weight: 2,
          notes: '180-day exclusivity settlement',
        },
        {
          name: 'Subsequent Generic License',
          royaltyRate: 0.02,
          adjustmentFactor: range(0.7, 1.0, 1.2),
          weight: 1,
        },
      ],
      profitSplit: range(0.35, 0.45, 0.55),
      discountRatePerRound: range(0.06, 0.10, 0.14),
      plaintiffBATNA: range(50_000_000, 100_000_000, 150_000_000),
      defendantBATNA: range(80_000_000, 120_000_000, 180_000_000),
      patentStrength: range(0.50, 0.65, 0.78),
      technologyContribution: range(0.25, 0.35, 0.50),
    },
    sCurve: {
      innovationCoefficient: range(0.01, 0.015, 0.02),
      imitationCoefficient: range(0.50, 0.60, 0.70), // Fast generic adoption
      marketPotential: range(2_500_000_000, 3_000_000_000, 3_500_000_000),
      adoptionMidpoint: range(2023, 2024, 2025),
      adoptionSteepness: range(0.7, 0.8, 0.9),
    },
    shapley: {
      patents: [
        {
          id: 'compound',
          name: 'Active Compound Patent',
          standaloneValue: range(1_500_000_000, 2_000_000_000, 2_500_000_000),
          essentiality: range(0.90, 0.95, 1.0),
          validityProbability: range(0.40, 0.55, 0.70),
        },
        {
          id: 'formulation',
          name: 'Extended Release Formulation',
          standaloneValue: range(400_000_000, 600_000_000, 800_000_000),
          essentiality: range(0.45, 0.60, 0.75),
          validityProbability: range(0.50, 0.65, 0.78),
        },
        {
          id: 'polymorph',
          name: 'Crystal Form Patent',
          standaloneValue: range(100_000_000, 200_000_000, 350_000_000),
          essentiality: range(0.25, 0.40, 0.55),
          validityProbability: range(0.35, 0.50, 0.65),
        },
      ],
      totalProductValue: range(2_500_000_000, 3_000_000_000, 3_500_000_000),
    },
    tradeSecret: {
      headStartMonths: 0,
      developmentCostSaved: range(0, 0, 0),
      timeToMarketAdvantage: range(0, 0, 0),
      marketShareDuringHeadStart: range(0, 0, 0),
      permanentMarketShareShift: range(0, 0, 0),
    },
    discounting: {
      riskFreeRate: range(0.035, 0.045, 0.055),
      equityRiskPremium: range(0.04, 0.05, 0.06),
      companyBeta: range(0.6, 0.8, 1.0),
      debtCostPreTax: range(0.035, 0.045, 0.055),
      taxRate: range(0.18, 0.21, 0.24),
      debtToEquityRatio: range(0.15, 0.25, 0.35),
      additionalRiskPremium: range(0.005, 0.01, 0.02),
      prejudgmentInterestRate: range(0.04, 0.052, 0.06),
    },
  },
};

/**
 * Custom/empty scenario for user input
 */
export const customScenario: DemoScenario = {
  id: 'custom',
  name: 'Custom Scenario',
  description: 'Enter your own case parameters',
  caseType: 'patent',
  inputs: {
    market: {
      totalMarketSize: range(500_000_000, 1_000_000_000, 1_500_000_000),
      marketGrowthRate: range(0.02, 0.05, 0.08),
      projectionYears: 10,
      infringementStartYear: 2020,
      infringementEndYear: 2025,
      patentExpiryYear: 2030,
      genericEntryDelay: 0.5,
      productLaunchYear: 2015,
    },
    competitors: {
      plaintiffPreInfringementShare: range(0.70, 0.80, 0.90),
      plaintiffButForShare: range(0.65, 0.75, 0.85),
      plaintiffActualShare: range(0.45, 0.55, 0.65),
      plaintiffGrossMargin: range(0.65, 0.75, 0.85),
      plaintiffIncrementalMargin: range(0.75, 0.85, 0.92),
      defendantActualShare: range(0.15, 0.25, 0.35),
      defendantGrossMargin: range(0.40, 0.55, 0.70),
      defendantHeadStartMonths: 0,
      otherCompetitorsShare: range(0.08, 0.15, 0.25),
    },
    prices: {
      plaintiffPrice: range(800, 1000, 1200),
      defendantPrice: range(500, 650, 800),
      priceErosionPercent: range(0.08, 0.12, 0.18),
      butForPrice: range(900, 1100, 1300),
    },
    royalty: {
      comparableLicenses: [],
      profitSplit: range(0.40, 0.50, 0.60),
      discountRatePerRound: range(0.08, 0.12, 0.15),
      plaintiffBATNA: range(10_000_000, 25_000_000, 50_000_000),
      defendantBATNA: range(15_000_000, 30_000_000, 60_000_000),
      patentStrength: range(0.55, 0.70, 0.85),
      technologyContribution: range(0.35, 0.50, 0.65),
    },
    sCurve: {
      innovationCoefficient: range(0.015, 0.025, 0.035),
      imitationCoefficient: range(0.35, 0.45, 0.55),
      marketPotential: range(500_000_000, 1_000_000_000, 1_500_000_000),
      adoptionMidpoint: range(2022, 2023, 2024),
      adoptionSteepness: range(0.4, 0.55, 0.7),
    },
    shapley: {
      patents: [
        {
          id: 'primary',
          name: 'Primary Patent',
          standaloneValue: range(300_000_000, 500_000_000, 700_000_000),
          essentiality: range(0.60, 0.75, 0.88),
          validityProbability: range(0.55, 0.70, 0.82),
        },
      ],
      totalProductValue: range(500_000_000, 1_000_000_000, 1_500_000_000),
    },
    tradeSecret: {
      headStartMonths: 0,
      developmentCostSaved: range(0, 0, 0),
      timeToMarketAdvantage: range(0, 0, 0),
      marketShareDuringHeadStart: range(0, 0, 0),
      permanentMarketShareShift: range(0, 0, 0),
    },
    discounting: {
      riskFreeRate: range(0.03, 0.04, 0.05),
      equityRiskPremium: range(0.04, 0.05, 0.06),
      companyBeta: range(0.8, 1.0, 1.2),
      debtCostPreTax: range(0.04, 0.05, 0.06),
      taxRate: range(0.18, 0.21, 0.25),
      debtToEquityRatio: range(0.2, 0.3, 0.4),
      additionalRiskPremium: range(0.01, 0.02, 0.03),
      prejudgmentInterestRate: range(0.04, 0.05, 0.06),
    },
  },
};

export const allScenarios: DemoScenario[] = [
  blockbusterDrugScenario,
  tradeSecretScenario,
  hatchWaxmanScenario,
  customScenario,
];

export function getScenarioById(id: string): DemoScenario | undefined {
  return allScenarios.find(s => s.id === id);
}
