import { describe, it, expect } from 'vitest';
import {
  checkReasonableness,
  compareMethodologies,
  generateInputHash,
  validateInputs,
  generateValidationReport,
} from './validation';
import { PHARMA_BENCHMARKS, CONVERGENCE_THRESHOLDS } from '../types/validation';
import { blockbusterDrugScenario } from '../models/demoScenarios';
import { calculateDamages } from '../models/damagesCalculator';

describe('checkReasonableness', () => {
  it('should pass for values within benchmark range', () => {
    // Gross margin of 75% is typical for pharma
    const result = checkReasonableness(0.75, 'grossMargin', 'pharma');
    expect(result.status).toBe('pass');
    expect(result.benchmarkLow).toBe(0.60);
    expect(result.benchmarkHigh).toBe(0.90);
  });

  it('should warn for values slightly outside range', () => {
    // 55% gross margin is below typical pharma range (60-90%)
    const result = checkReasonableness(0.55, 'grossMargin', 'pharma');
    expect(result.status).toBe('warning');
    expect(result.message).toContain('outside typical range');
  });

  it('should fail for values significantly outside range', () => {
    // 30% gross margin is way below pharma norms
    const result = checkReasonableness(0.30, 'grossMargin', 'pharma');
    expect(result.status).toBe('fail');
    expect(result.message).toContain('significantly outside');
  });

  it('should use biotech ranges when specified', () => {
    // Biotech has higher typical margins
    const result = checkReasonableness(0.90, 'grossMargin', 'biotech');
    expect(result.status).toBe('pass');
  });

  it('should warn when no benchmark exists', () => {
    const result = checkReasonableness(100, 'unknownMetric');
    expect(result.status).toBe('warning');
    expect(result.message).toContain('No benchmark available');
  });
});

describe('compareMethodologies', () => {
  it('should identify converged methodologies (< 15% difference)', () => {
    const result = compareMethodologies(
      'Lost Profits',
      1000000,
      'Reasonable Royalty',
      1100000  // 10% higher
    );
    expect(result.status).toBe('converged');
    expect(result.percentDifference).toBeCloseTo(0.095, 2);
  });

  it('should identify acceptable divergence (15-35% difference)', () => {
    const result = compareMethodologies(
      'Lost Profits',
      1000000,
      'Reasonable Royalty',
      1300000  // 30% higher
    );
    expect(result.status).toBe('acceptable');
    expect(result.percentDifference).toBeCloseTo(0.26, 2);
  });

  it('should identify significant divergence (> 35% difference)', () => {
    const result = compareMethodologies(
      'Lost Profits',
      1000000,
      'Reasonable Royalty',
      2000000  // 100% higher
    );
    expect(result.status).toBe('divergent');
    expect(result.explanation).toContain('significant divergence');
  });

  it('should calculate absolute difference correctly', () => {
    const result = compareMethodologies(
      'Method A',
      500000,
      'Method B',
      700000
    );
    expect(result.difference).toBe(200000);
  });

  it('should handle zero values gracefully', () => {
    const result = compareMethodologies(
      'Method A',
      0,
      'Method B',
      0
    );
    expect(result.percentDifference).toBe(0);
  });
});

describe('generateInputHash', () => {
  it('should generate consistent hash for same inputs', () => {
    const inputs = blockbusterDrugScenario.inputs;
    const hash1 = generateInputHash(inputs);
    const hash2 = generateInputHash(inputs);
    expect(hash1).toBe(hash2);
  });

  it('should generate different hash for different inputs', () => {
    const inputs1 = blockbusterDrugScenario.inputs;
    const inputs2 = {
      ...inputs1,
      market: {
        ...inputs1.market,
        totalMarketSize: { low: 1e9, base: 2e9, high: 3e9 },
      },
    };
    const hash1 = generateInputHash(inputs1);
    const hash2 = generateInputHash(inputs2);
    expect(hash1).not.toBe(hash2);
  });

  it('should produce 8-character hex string', () => {
    const hash = generateInputHash(blockbusterDrugScenario.inputs);
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe('validateInputs', () => {
  it('should validate all key inputs', () => {
    const inputs = blockbusterDrugScenario.inputs;
    const validations = validateInputs(inputs);

    // Should have validations for key inputs
    expect(validations.length).toBeGreaterThan(10);

    // Check that key inputs are present
    const inputNames = validations.map(v => v.inputName);
    expect(inputNames).toContain('Total Market Size');
    expect(inputNames).toContain('Plaintiff Gross Margin');
    expect(inputNames).toContain('Patent Strength');
  });

  it('should mark inputs without sources as undocumented', () => {
    const inputs = blockbusterDrugScenario.inputs;
    const validations = validateInputs(inputs);

    // Without any sources provided, all should be marked as not having sources
    expect(validations.every(v => v.hasSource === false)).toBe(true);
  });

  it('should mark inputs with sources as documented', () => {
    const inputs = blockbusterDrugScenario.inputs;
    const sources = new Map([
      ['market.totalMarketSize', {
        sourceType: 'market_data' as const,
        document: 'IQVIA Market Report 2024',
        location: 'Page 15, Table 3',
      }],
    ]);

    const validations = validateInputs(inputs, sources);
    const marketSizeValidation = validations.find(v => v.inputPath === 'market.totalMarketSize');

    expect(marketSizeValidation?.hasSource).toBe(true);
    expect(marketSizeValidation?.source?.document).toBe('IQVIA Market Report 2024');
  });

  it('should include reasonableness checks for applicable inputs', () => {
    const inputs = blockbusterDrugScenario.inputs;
    const validations = validateInputs(inputs);

    const marginValidation = validations.find(v => v.inputName === 'Plaintiff Gross Margin');
    expect(marginValidation?.reasonablenessCheck).toBeDefined();
    expect(marginValidation?.reasonablenessCheck?.benchmarkSource).toBeDefined();
  });
});

describe('generateValidationReport', () => {
  it('should generate a complete validation report', () => {
    const inputs = blockbusterDrugScenario.inputs;
    const results = calculateDamages(inputs, {
      includeLostProfits: true,
      includeReasonableRoyalty: true,
      includeRubinstein: true,
      includeShapley: true,
      includeSCurve: true,
      includeTradeSecret: false,
      runMonteCarlo: true,
      runSensitivity: true,
      monteCarloIterations: 1000, // Fewer for testing
    });

    const report = generateValidationReport(inputs, results);

    // Check structure
    expect(report.timestamp).toBeDefined();
    expect(report.overallStatus).toBeDefined();
    expect(['valid', 'needs_review', 'invalid']).toContain(report.overallStatus);

    // Check Daubert factors
    expect(report.daubertFactors.sufficientBasis.totalInputs).toBeGreaterThan(0);
    expect(report.daubertFactors.reliableMethods.methodsUsed.length).toBeGreaterThan(0);

    // Check methodology comparisons
    expect(report.methodologyComparisons.length).toBeGreaterThan(0);

    // Check reproducibility
    expect(report.reproducibility.calculationHash).toMatch(/^[0-9a-f]{8}$/);
    expect(report.reproducibility.canReplicate).toBe(true);

    // Check recommendations exist
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it('should identify undocumented inputs in Daubert assessment', () => {
    const inputs = blockbusterDrugScenario.inputs;
    const results = calculateDamages(inputs, {
      includeLostProfits: true,
      includeReasonableRoyalty: false,
      includeRubinstein: false,
      includeShapley: false,
      includeSCurve: false,
      includeTradeSecret: false,
      runMonteCarlo: false,
      runSensitivity: false,
    });

    const report = generateValidationReport(inputs, results);

    // Without any sources, documentation score should be 0
    expect(report.daubertFactors.sufficientBasis.documentedInputs).toBe(0);
    expect(report.daubertFactors.sufficientBasis.undocumentedInputs.length).toBeGreaterThan(0);
  });

  it('should compare lost profits vs reasonable royalty', () => {
    const inputs = blockbusterDrugScenario.inputs;
    const results = calculateDamages(inputs, {
      includeLostProfits: true,
      includeReasonableRoyalty: true,
      includeRubinstein: false,
      includeShapley: false,
      includeSCurve: false,
      includeTradeSecret: false,
      runMonteCarlo: false,
      runSensitivity: false,
    });

    const report = generateValidationReport(inputs, results);

    const lpVsRr = report.methodologyComparisons.find(
      m => m.method1.includes('Lost Profits') && m.method2.includes('Reasonable Royalty')
    );

    expect(lpVsRr).toBeDefined();
    expect(lpVsRr?.method1Result).toBeGreaterThan(0);
    expect(lpVsRr?.method2Result).toBeGreaterThan(0);
  });

  it('should include sensitivity summary when available', () => {
    const inputs = blockbusterDrugScenario.inputs;
    const results = calculateDamages(inputs, {
      includeLostProfits: true,
      includeReasonableRoyalty: false,
      includeRubinstein: false,
      includeShapley: false,
      includeSCurve: false,
      includeTradeSecret: false,
      runMonteCarlo: false,
      runSensitivity: true,
    });

    const report = generateValidationReport(inputs, results);

    expect(report.sensitivitySummary.topDrivers.length).toBeGreaterThan(0);
    expect(report.sensitivitySummary.topDrivers[0].elasticity).toBeDefined();
  });
});

describe('PHARMA_BENCHMARKS', () => {
  it('should have benchmarks for key metrics', () => {
    const requiredMetrics = [
      'grossMargin',
      'royaltyRate',
      'marketGrowthRate',
      'priceErosion',
      'patentStrength',
      'technologyContribution',
    ];

    for (const metric of requiredMetrics) {
      const benchmark = PHARMA_BENCHMARKS.find(b => b.metric === metric);
      expect(benchmark).toBeDefined();
      expect(benchmark?.pharmaRange).toBeDefined();
      expect(benchmark?.biotechRange).toBeDefined();
      expect(benchmark?.source).toBeDefined();
    }
  });

  it('should have valid ranges (low < typical < high)', () => {
    for (const benchmark of PHARMA_BENCHMARKS) {
      expect(benchmark.pharmaRange.low).toBeLessThan(benchmark.pharmaRange.typical);
      expect(benchmark.pharmaRange.typical).toBeLessThan(benchmark.pharmaRange.high);
      expect(benchmark.biotechRange.low).toBeLessThan(benchmark.biotechRange.typical);
      expect(benchmark.biotechRange.typical).toBeLessThan(benchmark.biotechRange.high);
    }
  });
});

describe('CONVERGENCE_THRESHOLDS', () => {
  it('should have appropriate thresholds', () => {
    expect(CONVERGENCE_THRESHOLDS.converged).toBe(0.15);
    expect(CONVERGENCE_THRESHOLDS.acceptable).toBe(0.35);
    expect(CONVERGENCE_THRESHOLDS.divergent).toBe(Infinity);
  });
});
