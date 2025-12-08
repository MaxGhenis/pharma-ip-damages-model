import { ShapleyInputs, PatentValue, UncertaintyRange, CalculationStep } from '../types';
import { sampleUncertainty } from '../utils/uncertainty';

/**
 * Shapley Value Allocation
 *
 * Used when a product is covered by multiple patents and we need to
 * allocate value among them (e.g., for royalty stacking or when
 * determining the contribution of a single asserted patent).
 *
 * The Shapley value gives each patent its average marginal contribution
 * across all possible orderings of patents.
 *
 * φᵢ = Σ [|S|!(n-|S|-1)!/n!] × [v(S∪{i}) - v(S)]
 *
 * This is the fair allocation based on cooperative game theory.
 */

export interface ShapleyResult {
  allocations: { patentId: string; patentName: string; shapleyValue: number; shareOfTotal: number }[];
  totalValue: number;
  calculationSteps: CalculationStep[];
}

// Helper: factorial
function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

// Helper: generate all subsets of an array
function* subsets<T>(arr: T[]): Generator<T[]> {
  const n = arr.length;
  for (let i = 0; i < (1 << n); i++) {
    const subset: T[] = [];
    for (let j = 0; j < n; j++) {
      if (i & (1 << j)) {
        subset.push(arr[j]);
      }
    }
    yield subset;
  }
}

/**
 * Calculate characteristic function v(S)
 * Value of coalition S of patents
 */
export function characteristicFunction(
  coalition: PatentValue[],
  totalProductValue: number
): number {
  if (coalition.length === 0) return 0;

  // Simple model: value = product value × combined essentiality × combined validity
  // For essentiality, we use complement probability (1 - product of non-essential probs)
  // For validity, we use product (all must be valid for full value)

  let combinedEssentiality = 0;
  let combinedValidity = 1;

  for (const patent of coalition) {
    // Essentiality: more essential patents add more value
    combinedEssentiality += patent.essentiality.base * (1 - combinedEssentiality);
    // Validity: probability all patents in coalition are valid
    combinedValidity *= patent.validityProbability.base;
  }

  return totalProductValue * combinedEssentiality * combinedValidity;
}

/**
 * Calculate Shapley value for each patent
 */
export function calculateShapleyValues(
  patents: PatentValue[],
  totalProductValue: number
): Map<string, number> {
  const n = patents.length;
  const shapleyValues = new Map<string, number>();

  // Initialize
  for (const patent of patents) {
    shapleyValues.set(patent.id, 0);
  }

  // For each patent, calculate its marginal contribution to each coalition
  for (const patent of patents) {
    const otherPatents = patents.filter(p => p.id !== patent.id);

    for (const subset of subsets(otherPatents)) {
      const s = subset.length;
      const coalitionWithout = characteristicFunction(subset, totalProductValue);
      const coalitionWith = characteristicFunction([...subset, patent], totalProductValue);
      const marginalContribution = coalitionWith - coalitionWithout;

      // Shapley weight for this subset size
      const weight = (factorial(s) * factorial(n - s - 1)) / factorial(n);

      const currentValue = shapleyValues.get(patent.id) || 0;
      shapleyValues.set(patent.id, currentValue + weight * marginalContribution);
    }
  }

  return shapleyValues;
}

/**
 * Simplified proportional allocation (alternative to Shapley)
 * Faster but less theoretically rigorous
 */
export function proportionalAllocation(
  patents: PatentValue[],
  totalProductValue: number
): Map<string, number> {
  const allocations = new Map<string, number>();

  // Weight by essentiality × validity × standalone value
  let totalWeight = 0;
  const weights: { id: string; weight: number }[] = [];

  for (const patent of patents) {
    const weight =
      patent.essentiality.base *
      patent.validityProbability.base *
      patent.standaloneValue.base;
    weights.push({ id: patent.id, weight });
    totalWeight += weight;
  }

  for (const { id, weight } of weights) {
    allocations.set(id, (weight / totalWeight) * totalProductValue);
  }

  return allocations;
}

export function calculateShapleyAllocation(
  inputs: ShapleyInputs,
  useSampling: boolean = false
): ShapleyResult {
  const totalValue = useSampling
    ? sampleUncertainty(inputs.totalProductValue)
    : inputs.totalProductValue.base;

  // If too many patents, use proportional allocation (Shapley is O(2^n))
  const useExactShapley = inputs.patents.length <= 10;

  const allocations = useExactShapley
    ? calculateShapleyValues(inputs.patents, totalValue)
    : proportionalAllocation(inputs.patents, totalValue);

  const result: ShapleyResult['allocations'] = [];

  for (const patent of inputs.patents) {
    const shapleyValue = allocations.get(patent.id) || 0;
    result.push({
      patentId: patent.id,
      patentName: patent.name,
      shapleyValue,
      shareOfTotal: shapleyValue / totalValue,
    });
  }

  // Sort by value descending
  result.sort((a, b) => b.shapleyValue - a.shapleyValue);

  const calculationSteps: CalculationStep[] = [
    {
      id: 'shapley-overview',
      label: 'Shapley Value Calculation',
      formula: 'φᵢ = Σ [|S|!(n-|S|-1)!/n!] × [v(S∪{i}) - v(S)]',
      inputs: [
        { name: 'Number of Patents', value: inputs.patents.length },
        { name: 'Total Product Value', value: totalValue },
        { name: 'Method', value: useExactShapley ? 'Exact Shapley' : 'Proportional (approx)' },
      ],
      result: totalValue,
      notes: `The Shapley value fairly allocates value based on each patent's marginal contribution across all possible coalition orderings.`,
      children: inputs.patents.map((patent, i) => ({
        id: `patent-${patent.id}`,
        label: `Patent: ${patent.name}`,
        inputs: [
          { name: 'Essentiality', value: patent.essentiality.base },
          { name: 'Validity Probability', value: patent.validityProbability.base },
          { name: 'Standalone Value', value: patent.standaloneValue.base },
        ],
        result: result[i]?.shapleyValue || 0,
        notes: `Share of total: ${((result[i]?.shareOfTotal || 0) * 100).toFixed(1)}%`,
      })),
    },
  ];

  return {
    allocations: result,
    totalValue,
    calculationSteps,
  };
}

/**
 * Calculate royalty stacking adjustment
 * When multiple patents read on a product, total royalty burden may be excessive
 */
export function calculateRoyaltyStacking(
  patents: { id: string; royaltyRate: number }[],
  maxReasonableRoyalty: number = 0.25 // e.g., 25% of revenue
): { adjustedRates: Map<string, number>; stackingDiscount: number } {
  const totalRoyalty = patents.reduce((sum, p) => sum + p.royaltyRate, 0);

  if (totalRoyalty <= maxReasonableRoyalty) {
    // No stacking problem
    const adjustedRates = new Map<string, number>();
    patents.forEach(p => adjustedRates.set(p.id, p.royaltyRate));
    return { adjustedRates, stackingDiscount: 1 };
  }

  // Apply proportional reduction
  const stackingDiscount = maxReasonableRoyalty / totalRoyalty;
  const adjustedRates = new Map<string, number>();

  for (const patent of patents) {
    adjustedRates.set(patent.id, patent.royaltyRate * stackingDiscount);
  }

  return { adjustedRates, stackingDiscount };
}
