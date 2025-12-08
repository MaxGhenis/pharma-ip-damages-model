import { describe, it, expect } from 'vitest'
import { rubinsteinWithBATNA, rubinsteinSolution } from './rubinstein'

describe('Rubinstein Bargaining Model', () => {
  describe('rubinsteinSolution', () => {
    it('calculates approximately equal split when discount factors are equal', () => {
      // With discount factor 0.95 (5% discount per round)
      const result = rubinsteinSolution(0.95, 0.95)

      // Formula: plaintiff gets (1 - delta_2) / (1 - delta_1 * delta_2)
      // = (1 - 0.95) / (1 - 0.9025) = 0.05 / 0.0975 ≈ 0.513
      expect(result.plaintiffShare).toBeCloseTo(0.513, 2)
      expect(result.defendantShare).toBeCloseTo(0.487, 2)
    })

    it('gives more patient party (higher delta) larger share', () => {
      // More patient plaintiff (higher delta = more patient)
      const patientPlaintiff = rubinsteinSolution(0.98, 0.92)

      // Less patient plaintiff
      const impatientPlaintiff = rubinsteinSolution(0.92, 0.98)

      // More patient party should get larger share
      expect(patientPlaintiff.plaintiffShare).toBeGreaterThan(impatientPlaintiff.plaintiffShare)
    })

    it('shares sum to 1', () => {
      const result = rubinsteinSolution(0.9, 0.85)
      expect(result.plaintiffShare + result.defendantShare).toBeCloseTo(1, 6)
    })

    it('handles extreme patience correctly', () => {
      // Very patient plaintiff, impatient defendant
      const result = rubinsteinSolution(0.99, 0.5)

      // Plaintiff should get most of the surplus
      expect(result.plaintiffShare).toBeGreaterThan(0.8)
    })

    it('clamps discount factors to valid range', () => {
      // Should not throw even with extreme values
      const result = rubinsteinSolution(1.5, -0.5)
      expect(result.plaintiffShare).toBeGreaterThan(0)
      expect(result.defendantShare).toBeGreaterThan(0)
    })
  })

  describe('rubinsteinWithBATNA', () => {
    const totalSurplus = 1000000000 // $1B
    const batna1 = 100000000 // Plaintiff's BATNA: $100M
    const batna2 = 50000000 // Defendant's BATNA: $50M

    it('respects BATNA constraints', () => {
      const result = rubinsteinWithBATNA(0.95, 0.95, batna1, batna2, totalSurplus)

      // Each party should get at least their BATNA
      expect(result.plaintiffPayoff).toBeGreaterThanOrEqual(batna1)
      expect(result.defendantPayoff).toBeGreaterThanOrEqual(batna2)
    })

    it('payoffs sum to total surplus when deal is possible', () => {
      const result = rubinsteinWithBATNA(0.95, 0.95, batna1, batna2, totalSurplus)

      expect(result.plaintiffPayoff + result.defendantPayoff).toBeCloseTo(totalSurplus, -6)
    })

    it('returns BATNAs when no deal zone exists', () => {
      // BATNAs sum to more than surplus - no deal
      const result = rubinsteinWithBATNA(0.95, 0.95, 600000000, 500000000, totalSurplus)

      expect(result.plaintiffPayoff).toBe(600000000)
      expect(result.defendantPayoff).toBe(500000000)
    })

    it('binding BATNA increases party payoff', () => {
      // High plaintiff BATNA should bind
      const highBatna = rubinsteinWithBATNA(0.95, 0.95, 600000000, 50000000, totalSurplus)
      const lowBatna = rubinsteinWithBATNA(0.95, 0.95, 100000000, 50000000, totalSurplus)

      // Higher BATNA should result in higher payoff
      expect(highBatna.plaintiffPayoff).toBeGreaterThan(lowBatna.plaintiffPayoff)
    })
  })
})
