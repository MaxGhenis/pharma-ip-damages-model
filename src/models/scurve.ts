import { SCurveInputs, UncertaintyRange, CalculationStep } from '../types';
import { sampleUncertainty } from '../utils/uncertainty';

/**
 * S-Curve / Bass Diffusion Model
 *
 * Models market adoption over time using either:
 * 1. Bass Diffusion Model: N(t) = m * (1 - e^(-(p+q)t)) / (1 + (q/p)e^(-(p+q)t))
 * 2. Logistic/Sigmoid: N(t) = m / (1 + e^(-k(t - t0)))
 *
 * Used to project:
 * - Product adoption curves
 * - Market penetration timing
 * - Defendant's "but-for" entry timing effects
 */

export interface SCurveResult {
  yearlyAdoption: { year: number; adoption: number; cumulativeAdoption: number }[];
  timeToHalfAdoption: number;
  timeToFullAdoption: number;
  calculationSteps: CalculationStep[];
}

// Bass Diffusion Model
export function bassDiffusion(
  t: number,
  p: number, // innovation coefficient (external influence)
  q: number, // imitation coefficient (internal influence)
  m: number  // market potential
): number {
  if (t <= 0) return 0;

  const pq = p + q;
  const numerator = 1 - Math.exp(-pq * t);
  const denominator = 1 + (q / p) * Math.exp(-pq * t);

  return m * numerator / denominator;
}

// Incremental adoption in period t (first derivative)
export function bassIncremental(
  t: number,
  p: number,
  q: number,
  m: number
): number {
  if (t <= 0) return 0;

  const N_t = bassDiffusion(t, p, q, m);
  return (p + (q / m) * N_t) * (m - N_t);
}

// Logistic S-curve (alternative formulation)
export function logisticCurve(
  t: number,
  k: number,     // steepness
  t0: number,    // midpoint (inflection point)
  L: number      // maximum value
): number {
  return L / (1 + Math.exp(-k * (t - t0)));
}

// Gompertz curve (asymmetric S-curve, often better for pharma)
export function gompertzCurve(
  t: number,
  a: number,    // asymptote (maximum)
  b: number,    // displacement
  c: number     // growth rate
): number {
  return a * Math.exp(-b * Math.exp(-c * t));
}

export function calculateSCurve(
  inputs: SCurveInputs,
  startYear: number,
  endYear: number,
  useSampling: boolean = false
): SCurveResult {
  const p = useSampling
    ? sampleUncertainty(inputs.innovationCoefficient)
    : inputs.innovationCoefficient.base;

  const q = useSampling
    ? sampleUncertainty(inputs.imitationCoefficient)
    : inputs.imitationCoefficient.base;

  const m = useSampling
    ? sampleUncertainty(inputs.marketPotential)
    : inputs.marketPotential.base;

  const yearlyAdoption: { year: number; adoption: number; cumulativeAdoption: number }[] = [];

  let prevCumulative = 0;

  for (let year = startYear; year <= endYear; year++) {
    const t = year - startYear + 1;
    const cumulativeAdoption = bassDiffusion(t, p, q, m);
    const adoption = cumulativeAdoption - prevCumulative;

    yearlyAdoption.push({
      year,
      adoption: Math.max(0, adoption),
      cumulativeAdoption,
    });

    prevCumulative = cumulativeAdoption;
  }

  // Calculate time to 50% and 90% adoption
  const halfAdoptionYear = yearlyAdoption.find(y => y.cumulativeAdoption >= m * 0.5)?.year || endYear;
  const fullAdoptionYear = yearlyAdoption.find(y => y.cumulativeAdoption >= m * 0.9)?.year || endYear;

  const calculationSteps: CalculationStep[] = [
    {
      id: 'bass-model',
      label: 'Bass Diffusion Model',
      formula: 'N(t) = m × (1 - e^(-(p+q)t)) / (1 + (q/p)×e^(-(p+q)t))',
      inputs: [
        { name: 'p (innovation coefficient)', value: p, source: 'External influence rate' },
        { name: 'q (imitation coefficient)', value: q, source: 'Internal/word-of-mouth influence' },
        { name: 'm (market potential)', value: m, source: 'Maximum market size' },
      ],
      result: yearlyAdoption[yearlyAdoption.length - 1]?.cumulativeAdoption || 0,
      notes: `Typical pharma values: p ≈ 0.01-0.03, q ≈ 0.3-0.5. Higher q means faster imitation-driven growth.`,
    },
  ];

  return {
    yearlyAdoption,
    timeToHalfAdoption: halfAdoptionYear - startYear,
    timeToFullAdoption: fullAdoptionYear - startYear,
    calculationSteps,
  };
}

/**
 * Calculate market share trajectory with S-curve adoption
 * Used for modeling "but-for" world where defendant didn't enter early
 */
export function calculateMarketShareWithSCurve(
  baseShare: number,
  competitorEntry: { year: number; share: number }[],
  sCurveParams: SCurveInputs,
  startYear: number,
  endYear: number
): { year: number; share: number }[] {
  const result: { year: number; share: number }[] = [];

  for (let year = startYear; year <= endYear; year++) {
    let share = baseShare;

    // Reduce share based on competitor entries using S-curve adoption
    for (const entry of competitorEntry) {
      if (year >= entry.year) {
        const t = year - entry.year + 1;
        const adoptionFraction = logisticCurve(
          t,
          sCurveParams.adoptionSteepness.base,
          sCurveParams.adoptionMidpoint.base - entry.year,
          1
        );
        share -= entry.share * adoptionFraction;
      }
    }

    result.push({ year, share: Math.max(0, share) });
  }

  return result;
}
