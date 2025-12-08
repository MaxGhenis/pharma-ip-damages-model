import { describe, it, expect } from 'vitest'
import {
  calculateButForShare,
  calculateAbsorptionRate,
  ButForShareInputs,
} from './butForShare'

describe('But-For Share Model', () => {
  describe('calculateAbsorptionRate', () => {
    it('returns 1.0 when no acceptable substitutes exist (Panduit Factor 2)', () => {
      // If plaintiff proves no acceptable non-infringing substitutes,
      // they would have captured all of defendant's sales
      const rate = calculateAbsorptionRate({
        acceptableSubstitutesExist: false,
        otherCompetitorsShare: 0.1,
        plaintiffPreInfringementShare: 0.9,
      })
      expect(rate).toBe(1.0)
    })

    it('returns proportional share when substitutes exist (Grain Processing)', () => {
      // Under Grain Processing, even with substitutes, plaintiff can recover
      // portion of lost profits based on market share among alternatives
      const rate = calculateAbsorptionRate({
        acceptableSubstitutesExist: true,
        otherCompetitorsShare: 0.3, // Other competitors have 30%
        plaintiffPreInfringementShare: 0.7, // Plaintiff had 70%
      })
      // Plaintiff's share of non-defendant market = 0.7 / (0.7 + 0.3) = 0.7
      expect(rate).toBeCloseTo(0.7, 2)
    })

    it('handles case where plaintiff was monopolist before infringement', () => {
      const rate = calculateAbsorptionRate({
        acceptableSubstitutesExist: true,
        otherCompetitorsShare: 0,
        plaintiffPreInfringementShare: 1.0,
      })
      // Plaintiff would capture all defendant sales
      expect(rate).toBe(1.0)
    })

    it('handles competitive market with many players', () => {
      const rate = calculateAbsorptionRate({
        acceptableSubstitutesExist: true,
        otherCompetitorsShare: 0.5, // Many other competitors
        plaintiffPreInfringementShare: 0.3, // Plaintiff was minority
      })
      // Plaintiff's proportional share = 0.3 / (0.3 + 0.5) = 0.375
      expect(rate).toBeCloseTo(0.375, 2)
    })
  })

  describe('calculateButForShare', () => {
    const baseInputs: ButForShareInputs = {
      plaintiffPreInfringementShare: 0.8,
      plaintiffActualShare: 0.5,
      defendantActualShare: 0.2,
      otherCompetitorsShare: 0.3,
      acceptableSubstitutesExist: false,
    }

    it('calculates but-for share as actual + absorbed defendant sales', () => {
      const result = calculateButForShare(baseInputs)
      // No substitutes: absorption rate = 1.0
      // But-for share = 0.5 + (0.2 × 1.0) = 0.7
      expect(result.butForShare).toBeCloseTo(0.7, 2)
    })

    it('caps but-for share at pre-infringement share', () => {
      const inputs: ButForShareInputs = {
        plaintiffPreInfringementShare: 0.6, // Lower pre-infringement share
        plaintiffActualShare: 0.5,
        defendantActualShare: 0.3, // Large defendant share
        otherCompetitorsShare: 0.2,
        acceptableSubstitutesExist: false,
      }
      const result = calculateButForShare(inputs)
      // Uncapped: 0.5 + 0.3 = 0.8, but pre-infringement was only 0.6
      // Cap at pre-infringement share
      expect(result.butForShare).toBe(0.6)
      expect(result.cappedAtPreInfringement).toBe(true)
    })

    it('never exceeds 1.0', () => {
      const inputs: ButForShareInputs = {
        plaintiffPreInfringementShare: 1.0,
        plaintiffActualShare: 0.7,
        defendantActualShare: 0.5, // Shares don't add up, but model handles it
        otherCompetitorsShare: 0.0,
        acceptableSubstitutesExist: false,
      }
      const result = calculateButForShare(inputs)
      expect(result.butForShare).toBeLessThanOrEqual(1.0)
    })

    it('with substitutes, uses proportional absorption', () => {
      const inputs: ButForShareInputs = {
        plaintiffPreInfringementShare: 0.8,
        plaintiffActualShare: 0.5,
        defendantActualShare: 0.2,
        otherCompetitorsShare: 0.3,
        acceptableSubstitutesExist: true, // Substitutes exist
      }
      const result = calculateButForShare(inputs)
      // Absorption rate = 0.8 / (0.8 + 0.3) ≈ 0.727
      // But-for share = 0.5 + (0.2 × 0.727) ≈ 0.645
      expect(result.butForShare).toBeCloseTo(0.645, 2)
      expect(result.absorptionRate).toBeCloseTo(0.727, 2)
    })

    it('returns calculation breakdown for transparency', () => {
      const result = calculateButForShare(baseInputs)

      expect(result).toHaveProperty('butForShare')
      expect(result).toHaveProperty('absorptionRate')
      expect(result).toHaveProperty('absorbedSales')
      expect(result).toHaveProperty('cappedAtPreInfringement')
      expect(result).toHaveProperty('method')
    })

    it('identifies correct method based on substitutes', () => {
      const noSubs = calculateButForShare({ ...baseInputs, acceptableSubstitutesExist: false })
      const withSubs = calculateButForShare({ ...baseInputs, acceptableSubstitutesExist: true })

      expect(noSubs.method).toBe('panduit-full-absorption')
      expect(withSubs.method).toBe('grain-processing-proportional')
    })
  })

  describe('Lost Share Calculation', () => {
    it('lost share equals but-for share minus actual share', () => {
      const inputs: ButForShareInputs = {
        plaintiffPreInfringementShare: 0.8,
        plaintiffActualShare: 0.5,
        defendantActualShare: 0.2,
        otherCompetitorsShare: 0.3,
        acceptableSubstitutesExist: false,
      }
      const result = calculateButForShare(inputs)

      const lostShare = result.butForShare - inputs.plaintiffActualShare
      expect(lostShare).toBeCloseTo(0.2, 2) // Should capture defendant's full share
    })
  })
})
