import { RoyaltyInputs, UncertaintyRange, CalculationStep } from '../types';
import { sampleUncertainty } from '../utils/uncertainty';

/**
 * Rubinstein Bargaining Model
 *
 * Models a hypothetical negotiation between patent holder and potential licensee.
 * Used in IP litigation to determine a "reasonable royalty" rate.
 *
 * Key insight: The outcome depends on:
 * 1. Each party's discount rate (patience/time pressure)
 * 2. Each party's BATNA (Best Alternative to Negotiated Agreement)
 * 3. The surplus to be divided
 *
 * The Rubinstein solution provides a unique subgame-perfect equilibrium.
 */

export interface RubinsteinResult {
  royaltyRate: number;
  plaintiffShare: number;
  defendantShare: number;
  totalSurplus: number;
  calculationSteps: CalculationStep[];
}

/**
 * Classic Rubinstein alternating-offers solution
 *
 * With discount factors δ₁ (plaintiff) and δ₂ (defendant):
 * Plaintiff's share = (1 - δ₂) / (1 - δ₁δ₂)
 *
 * When δ₁ = δ₂ = δ: shares approach 50-50 as δ → 1
 */
export function rubinsteinSolution(
  delta1: number, // plaintiff's discount factor (patience)
  delta2: number  // defendant's discount factor
): { plaintiffShare: number; defendantShare: number } {
  // Ensure valid discount factors
  const d1 = Math.min(Math.max(delta1, 0.01), 0.99);
  const d2 = Math.min(Math.max(delta2, 0.01), 0.99);

  const plaintiffShare = (1 - d2) / (1 - d1 * d2);
  const defendantShare = 1 - plaintiffShare;

  return { plaintiffShare, defendantShare };
}

/**
 * Extended Rubinstein with outside options (BATNAs)
 *
 * If either party has a valuable outside option, it affects
 * their bargaining power.
 */
export function rubinsteinWithBATNA(
  delta1: number,
  delta2: number,
  batna1: number, // plaintiff's BATNA value
  batna2: number, // defendant's BATNA value
  totalSurplus: number
): { plaintiffPayoff: number; defendantPayoff: number } {
  // First check if BATNAs are binding
  const basicSolution = rubinsteinSolution(delta1, delta2);
  const plaintiffBasic = basicSolution.plaintiffShare * totalSurplus;
  const defendantBasic = basicSolution.defendantShare * totalSurplus;

  // If BATNA exceeds negotiated outcome, use BATNA
  const plaintiffPayoff = Math.max(plaintiffBasic, batna1);
  const defendantPayoff = Math.max(defendantBasic, batna2);

  // Adjust if BATNAs sum to more than surplus (no deal zone)
  if (plaintiffPayoff + defendantPayoff > totalSurplus) {
    // Deal may not happen - return BATNAs
    return { plaintiffPayoff: batna1, defendantPayoff: batna2 };
  }

  return { plaintiffPayoff, defendantPayoff };
}

/**
 * Nash Bargaining Solution (alternative to Rubinstein)
 *
 * Maximizes (u₁ - d₁)(u₂ - d₂) where d is disagreement point (BATNA)
 * Gives equal split of surplus above BATNAs when bargaining powers equal.
 */
export function nashBargainingSolution(
  batna1: number,
  batna2: number,
  totalSurplus: number,
  bargainingPower1: number = 0.5 // plaintiff's relative bargaining power
): { plaintiffPayoff: number; defendantPayoff: number } {
  const surplus = totalSurplus - batna1 - batna2;

  if (surplus <= 0) {
    return { plaintiffPayoff: batna1, defendantPayoff: batna2 };
  }

  const plaintiffPayoff = batna1 + bargainingPower1 * surplus;
  const defendantPayoff = batna2 + (1 - bargainingPower1) * surplus;

  return { plaintiffPayoff, defendantPayoff };
}

export function calculateRubinsteinRoyalty(
  inputs: RoyaltyInputs,
  defendantProfits: number,
  useSampling: boolean = false
): RubinsteinResult {
  // Extract parameters
  const discountRate = useSampling
    ? sampleUncertainty(inputs.discountRatePerRound)
    : inputs.discountRatePerRound.base;

  const plaintiffBATNA = useSampling
    ? sampleUncertainty(inputs.plaintiffBATNA)
    : inputs.plaintiffBATNA.base;

  const defendantBATNA = useSampling
    ? sampleUncertainty(inputs.defendantBATNA)
    : inputs.defendantBATNA.base;

  const patentStrength = useSampling
    ? sampleUncertainty(inputs.patentStrength)
    : inputs.patentStrength.base;

  const techContribution = useSampling
    ? sampleUncertainty(inputs.technologyContribution)
    : inputs.technologyContribution.base;

  // Calculate surplus: value of the deal
  // = defendant's expected profits × technology contribution × patent strength
  const relevantProfits = defendantProfits * techContribution;
  const expectedValue = relevantProfits * patentStrength;
  const totalSurplus = expectedValue - plaintiffBATNA - defendantBATNA;

  // Convert discount rate to discount factor
  // Higher discount rate = less patient = lower delta
  const delta1 = 1 / (1 + discountRate);
  const delta2 = 1 / (1 + discountRate); // Assume same for simplicity

  // Get Rubinstein solution
  const basicSolution = rubinsteinSolution(delta1, delta2);

  // Apply with BATNAs
  const withBATNA = rubinsteinWithBATNA(
    delta1,
    delta2,
    plaintiffBATNA,
    defendantBATNA,
    expectedValue
  );

  // Calculate effective royalty rate
  const royaltyRate = withBATNA.plaintiffPayoff / defendantProfits;

  const calculationSteps: CalculationStep[] = [
    {
      id: 'surplus-calc',
      label: 'Step 1: Calculate Bargaining Surplus',
      formula: 'Surplus = Defendant Profits × Tech Contribution × Patent Strength - BATNAs',
      inputs: [
        { name: 'Defendant Profits', value: defendantProfits, source: 'From profit analysis' },
        { name: 'Technology Contribution', value: techContribution, source: 'Expert assessment' },
        { name: 'Patent Strength', value: patentStrength, source: 'Validity × Infringement probability' },
        { name: 'Plaintiff BATNA', value: plaintiffBATNA, source: 'Alternative licensing options' },
        { name: 'Defendant BATNA', value: defendantBATNA, source: 'Design-around costs' },
      ],
      result: totalSurplus,
      notes: 'BATNA = Best Alternative to Negotiated Agreement. Represents each party\'s walkaway value.',
    },
    {
      id: 'rubinstein-basic',
      label: 'Step 2: Basic Rubinstein Solution',
      formula: 'Plaintiff Share = (1 - δ₂) / (1 - δ₁×δ₂)',
      inputs: [
        { name: 'Discount Rate', value: discountRate, source: 'Cost of capital / time preference' },
        { name: 'δ₁ (Plaintiff discount factor)', value: delta1 },
        { name: 'δ₂ (Defendant discount factor)', value: delta2 },
      ],
      result: basicSolution.plaintiffShare,
      notes: 'Equal discount factors yield 50-50 split. More patient party gets larger share.',
    },
    {
      id: 'adjusted-payoff',
      label: 'Step 3: Apply BATNA Constraints',
      inputs: [
        { name: 'Basic Plaintiff Share', value: basicSolution.plaintiffShare * expectedValue },
        { name: 'Plaintiff BATNA', value: plaintiffBATNA },
      ],
      result: withBATNA.plaintiffPayoff,
      notes: 'Payoff cannot fall below BATNA. Strong BATNA improves bargaining position.',
    },
    {
      id: 'royalty-rate',
      label: 'Step 4: Calculate Implied Royalty Rate',
      formula: 'Royalty Rate = Plaintiff Payoff / Defendant Total Profits',
      inputs: [
        { name: 'Plaintiff Payoff', value: withBATNA.plaintiffPayoff },
        { name: 'Defendant Profits', value: defendantProfits },
      ],
      result: royaltyRate,
      notes: 'This is the royalty rate that would result from a hypothetical pre-infringement negotiation.',
    },
  ];

  return {
    royaltyRate,
    plaintiffShare: withBATNA.plaintiffPayoff,
    defendantShare: withBATNA.defendantPayoff,
    totalSurplus,
    calculationSteps,
  };
}
