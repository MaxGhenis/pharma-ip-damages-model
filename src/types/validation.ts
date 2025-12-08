/**
 * Validation and Audit Types for Daubert Compliance
 *
 * These types support the evidentiary requirements for expert testimony:
 * - Source documentation for all inputs
 * - Cross-methodology validation
 * - Reasonableness checks against industry benchmarks
 * - Full calculation provenance
 */

/**
 * Source citation for an input value
 */
export interface SourceCitation {
  /** Type of source document */
  sourceType:
    | 'sec_filing'      // 10-K, 10-Q, proxy statements
    | 'market_data'     // IMS, IQVIA, Symphony Health
    | 'comparable_license' // Prior licensing agreements
    | 'expert_opinion'  // Expert judgment with basis
    | 'industry_report' // Analyst reports, trade publications
    | 'academic_study'  // Peer-reviewed research
    | 'court_record'    // Prior litigation, discovery
    | 'company_internal' // Internal documents produced in discovery
    | 'public_data'     // FDA, CMS, government databases
    | 'assumption';     // Explicit assumption (requires justification)

  /** Document name/title */
  document: string;

  /** Specific location within document (page, exhibit, etc.) */
  location?: string;

  /** Date of the source document */
  sourceDate?: string;

  /** Bates number if from discovery */
  batesNumber?: string;

  /** URL if publicly available */
  url?: string;

  /** Free-form notes on the source */
  notes?: string;

  /** For assumptions: the reasoning/justification */
  justification?: string;
}

/**
 * Extended uncertainty range with source documentation
 */
export interface DocumentedRange {
  low: number;
  base: number;
  high: number;
  distribution?: 'triangular' | 'normal' | 'uniform' | 'lognormal';

  /** Source for the base case value */
  baseSource?: SourceCitation;

  /** Source/justification for the range (low/high) */
  rangeSource?: SourceCitation;
}

/**
 * Validation status for a single input
 */
export interface InputValidation {
  inputName: string;
  inputPath: string; // e.g., "market.totalMarketSize"
  value: number;

  /** Does this input have proper source documentation? */
  hasSource: boolean;
  source?: SourceCitation;

  /** Reasonableness check results */
  reasonablenessCheck?: {
    status: 'pass' | 'warning' | 'fail';
    benchmarkLow?: number;
    benchmarkHigh?: number;
    benchmarkSource?: string;
    message: string;
  };

  /** Sensitivity: how much does this input affect the result? */
  sensitivityRank?: number; // 1 = most sensitive
  elasticity?: number;
}

/**
 * Cross-methodology validation result
 */
export interface MethodologyComparison {
  method1: string;
  method1Result: number;
  method2: string;
  method2Result: number;

  /** Absolute difference */
  difference: number;

  /** Percentage difference from average */
  percentDifference: number;

  /** Is the divergence within acceptable bounds? */
  status: 'converged' | 'acceptable' | 'divergent';

  /** Explanation of divergence if any */
  explanation?: string;
}

/**
 * Industry benchmark for reasonableness checks
 */
export interface IndustryBenchmark {
  metric: string;
  pharmaRange: { low: number; high: number; typical: number };
  biotechRange: { low: number; high: number; typical: number };
  source: string;
  notes?: string;
}

/**
 * Overall validation report
 */
export interface ValidationReport {
  /** Timestamp of validation */
  timestamp: string;

  /** Overall validation status */
  overallStatus: 'valid' | 'needs_review' | 'invalid';

  /** Daubert factor assessments */
  daubertFactors: {
    /** Are inputs based on sufficient facts/data? */
    sufficientBasis: {
      score: number; // 0-100
      documentedInputs: number;
      totalInputs: number;
      undocumentedInputs: string[];
    };

    /** Are methods reliable and generally accepted? */
    reliableMethods: {
      score: number;
      methodsUsed: string[];
      notes: string;
    };

    /** Are methods properly applied to facts? */
    properApplication: {
      score: number;
      reasonablenessChecks: InputValidation[];
      failures: string[];
    };
  };

  /** Input-level validation */
  inputValidations: InputValidation[];

  /** Cross-methodology comparisons */
  methodologyComparisons: MethodologyComparison[];

  /** Sensitivity analysis summary */
  sensitivitySummary: {
    topDrivers: Array<{ input: string; elasticity: number }>;
    robustnessScore: number; // How stable is the result?
  };

  /** Reproducibility information */
  reproducibility: {
    modelVersion: string;
    calculationHash: string; // Hash of inputs for reproducibility
    canReplicate: boolean;
  };

  /** Recommendations for strengthening the analysis */
  recommendations: string[];
}

/**
 * Pharma industry benchmarks for reasonableness checks
 */
export const PHARMA_BENCHMARKS: IndustryBenchmark[] = [
  {
    metric: 'grossMargin',
    pharmaRange: { low: 0.60, high: 0.90, typical: 0.75 },
    biotechRange: { low: 0.70, high: 0.95, typical: 0.85 },
    source: 'Industry average from S&P Capital IQ, 2020-2024',
    notes: 'Biotech typically higher due to specialty nature',
  },
  {
    metric: 'royaltyRate',
    pharmaRange: { low: 0.02, high: 0.15, typical: 0.05 },
    biotechRange: { low: 0.03, high: 0.20, typical: 0.08 },
    source: 'Royalty rates derived from SEC filings and ktMINE database',
    notes: 'Rates vary significantly by stage, exclusivity, and field',
  },
  {
    metric: 'marketGrowthRate',
    pharmaRange: { low: 0.02, high: 0.15, typical: 0.05 },
    biotechRange: { low: 0.05, high: 0.30, typical: 0.12 },
    source: 'EvaluatePharma World Preview, IQVIA Market Reports',
  },
  {
    metric: 'priceErosion',
    pharmaRange: { low: 0.05, high: 0.40, typical: 0.15 },
    biotechRange: { low: 0.03, high: 0.25, typical: 0.10 },
    source: 'Generic entry analysis, FDA Orange Book data',
    notes: 'Higher erosion for small molecules vs biologics',
  },
  {
    metric: 'patentStrength',
    pharmaRange: { low: 0.50, high: 0.95, typical: 0.75 },
    biotechRange: { low: 0.55, high: 0.95, typical: 0.80 },
    source: 'USPTO/PTAB statistics, litigation outcomes',
    notes: 'Combined validity × infringement probability',
  },
  {
    metric: 'technologyContribution',
    pharmaRange: { low: 0.10, high: 0.80, typical: 0.35 },
    biotechRange: { low: 0.15, high: 0.90, typical: 0.45 },
    source: 'Patent claim mapping, prior art analysis',
    notes: 'Highly case-specific; requires technical analysis',
  },
  {
    metric: 'wacc',
    pharmaRange: { low: 0.07, high: 0.12, typical: 0.09 },
    biotechRange: { low: 0.10, high: 0.18, typical: 0.13 },
    source: 'Duff & Phelps Cost of Capital Navigator',
    notes: 'Biotech higher due to development risk',
  },
];

/**
 * Threshold for methodology convergence (percentage difference)
 */
export const CONVERGENCE_THRESHOLDS = {
  /** Methods are considered converged */
  converged: 0.15, // 15% difference
  /** Methods have acceptable divergence with explanation */
  acceptable: 0.35, // 35% difference
  /** Methods diverge significantly - requires strong justification */
  divergent: Infinity,
};
