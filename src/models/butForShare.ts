/**
 * But-For Share Calculation Model
 *
 * Calculates the plaintiff's market share in the hypothetical "but-for" world
 * (i.e., what would have happened absent the infringement).
 *
 * Legal Framework:
 * - Panduit Corp. v. Stahlin Bros. (1978): If plaintiff proves no acceptable
 *   non-infringing substitutes (Factor 2), they capture all defendant sales.
 * - Grain Processing Corp. v. American Maize-Products (Fed. Cir. 1999):
 *   Even with substitutes, plaintiff can recover lost profits on portion of
 *   sales that would have gone to them based on market share.
 *
 * Economic Theory:
 * - Full absorption: All defendant sales would have gone to plaintiff
 * - Proportional absorption: Defendant sales distributed among remaining
 *   competitors based on their relative market shares
 */

export interface ButForShareInputs {
  /** Plaintiff's market share before infringement began */
  plaintiffPreInfringementShare: number;
  /** Plaintiff's actual market share during infringement */
  plaintiffActualShare: number;
  /** Defendant's actual market share during infringement */
  defendantActualShare: number;
  /** Combined share of other (non-infringing) competitors */
  otherCompetitorsShare: number;
  /** Whether acceptable non-infringing substitutes exist in the market */
  acceptableSubstitutesExist: boolean;
}

export interface ButForShareResult {
  /** Calculated but-for market share */
  butForShare: number;
  /** Rate at which defendant sales are absorbed by plaintiff (0-1) */
  absorptionRate: number;
  /** Absolute sales absorbed from defendant */
  absorbedSales: number;
  /** Whether the result was capped at pre-infringement share */
  cappedAtPreInfringement: boolean;
  /** Method used for calculation */
  method: 'panduit-full-absorption' | 'grain-processing-proportional';
}

export interface AbsorptionRateInputs {
  acceptableSubstitutesExist: boolean;
  otherCompetitorsShare: number;
  plaintiffPreInfringementShare: number;
}

/**
 * Calculate the absorption rate - what fraction of defendant's sales
 * would have gone to the plaintiff absent infringement.
 *
 * Two approaches:
 * 1. Panduit (no substitutes): 100% absorption - plaintiff gets all
 * 2. Grain Processing (with substitutes): Proportional to market share
 */
export function calculateAbsorptionRate(inputs: AbsorptionRateInputs): number {
  const {
    acceptableSubstitutesExist,
    otherCompetitorsShare,
    plaintiffPreInfringementShare,
  } = inputs;

  // If no acceptable substitutes exist (Panduit Factor 2 satisfied),
  // plaintiff would have captured all of defendant's sales
  if (!acceptableSubstitutesExist) {
    return 1.0;
  }

  // With substitutes, use proportional allocation (Grain Processing)
  // Plaintiff's share of the non-defendant market
  const totalNonDefendantShare = plaintiffPreInfringementShare + otherCompetitorsShare;

  // Avoid division by zero
  if (totalNonDefendantShare === 0) {
    return 1.0;
  }

  return plaintiffPreInfringementShare / totalNonDefendantShare;
}

/**
 * Calculate the plaintiff's but-for market share.
 *
 * But-For Share = Actual Share + (Defendant Share × Absorption Rate)
 *
 * The result is capped at:
 * 1. The pre-infringement share (plaintiff can't exceed historical peak)
 * 2. 100% (mathematical ceiling)
 */
export function calculateButForShare(inputs: ButForShareInputs): ButForShareResult {
  const {
    plaintiffPreInfringementShare,
    plaintiffActualShare,
    defendantActualShare,
    otherCompetitorsShare,
    acceptableSubstitutesExist,
  } = inputs;

  // Calculate absorption rate
  const absorptionRate = calculateAbsorptionRate({
    acceptableSubstitutesExist,
    otherCompetitorsShare,
    plaintiffPreInfringementShare,
  });

  // Calculate absorbed sales (as share points)
  const absorbedSales = defendantActualShare * absorptionRate;

  // Calculate uncapped but-for share
  let butForShare = plaintiffActualShare + absorbedSales;

  // Track if we need to cap
  let cappedAtPreInfringement = false;

  // Cap at pre-infringement share
  // Rationale: Plaintiff can't claim they would have exceeded their historical market position
  if (butForShare > plaintiffPreInfringementShare) {
    butForShare = plaintiffPreInfringementShare;
    cappedAtPreInfringement = true;
  }

  // Never exceed 100%
  if (butForShare > 1.0) {
    butForShare = 1.0;
  }

  // Determine method
  const method = acceptableSubstitutesExist
    ? 'grain-processing-proportional'
    : 'panduit-full-absorption';

  return {
    butForShare,
    absorptionRate,
    absorbedSales,
    cappedAtPreInfringement,
    method,
  };
}
