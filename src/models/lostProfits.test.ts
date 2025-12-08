import { describe, it, expect } from 'vitest'
import {
  calculateButForWorld,
  calculateLostProfits,
  applyDiscounting,
  calculatePrejudgmentInterest,
  calculateFullLostProfits,
} from './lostProfits'
import { MarketInputs, CompetitorInputs, PriceInputs, DiscountingInputs } from '../types'

const mockMarketInputs: MarketInputs = {
  totalMarketSize: { base: 10000000000, low: 8000000000, high: 12000000000, distribution: 'triangular' },
  marketGrowthRate: { base: 0.05, low: 0.03, high: 0.07, distribution: 'triangular' },
  infringementStartYear: 2020,
  infringementEndYear: 2024,
  patentExpiryYear: 2030,
  projectionYears: 5,
  genericEntryDelay: 0,
  productLaunchYear: 2015,
}

const mockCompetitorInputs: CompetitorInputs = {
  plaintiffPreInfringementShare: { base: 0.8, low: 0.7, high: 0.9, distribution: 'triangular' },
  plaintiffButForShare: { base: 0.7, low: 0.6, high: 0.8, distribution: 'triangular' },
  plaintiffActualShare: { base: 0.5, low: 0.4, high: 0.6, distribution: 'triangular' },
  defendantActualShare: { base: 0.2, low: 0.15, high: 0.25, distribution: 'triangular' },
  otherCompetitorsShare: { base: 0.3, low: 0.2, high: 0.4, distribution: 'triangular' },
  plaintiffGrossMargin: { base: 0.75, low: 0.7, high: 0.8, distribution: 'triangular' },
  plaintiffIncrementalMargin: { base: 0.85, low: 0.8, high: 0.9, distribution: 'triangular' },
  defendantGrossMargin: { base: 0.6, low: 0.5, high: 0.7, distribution: 'triangular' },
  defendantHeadStartMonths: 0,
}

const mockPriceInputs: PriceInputs = {
  plaintiffPrice: { base: 50000, low: 45000, high: 55000, distribution: 'triangular' },
  butForPrice: { base: 55000, low: 50000, high: 60000, distribution: 'triangular' },
  defendantPrice: { base: 40000, low: 35000, high: 45000, distribution: 'triangular' },
  priceErosionPercent: { base: 0.1, low: 0.05, high: 0.15, distribution: 'triangular' },
}

const mockDiscountingInputs: DiscountingInputs = {
  riskFreeRate: { base: 0.04, low: 0.03, high: 0.05, distribution: 'triangular' },
  equityRiskPremium: { base: 0.06, low: 0.05, high: 0.07, distribution: 'triangular' },
  companyBeta: { base: 1.2, low: 1.0, high: 1.4, distribution: 'triangular' },
  debtCostPreTax: { base: 0.05, low: 0.04, high: 0.06, distribution: 'triangular' },
  taxRate: { base: 0.21, low: 0.18, high: 0.25, distribution: 'triangular' },
  debtToEquityRatio: { base: 0.3, low: 0.2, high: 0.4, distribution: 'triangular' },
  additionalRiskPremium: { base: 0.02, low: 0.01, high: 0.03, distribution: 'triangular' },
  prejudgmentInterestRate: { base: 0.05, low: 0.04, high: 0.06, distribution: 'triangular' },
}

describe('calculateButForWorld', () => {
  it('generates yearly market data for each year of infringement', () => {
    const inputs = { market: mockMarketInputs, competitors: mockCompetitorInputs, prices: mockPriceInputs }
    const result = calculateButForWorld(inputs, false)

    // Should have 5 years (2020-2024)
    expect(result.length).toBe(5)
    expect(result[0].year).toBe(2020)
    expect(result[4].year).toBe(2024)
  })

  it('applies market growth rate correctly', () => {
    const inputs = { market: mockMarketInputs, competitors: mockCompetitorInputs, prices: mockPriceInputs }
    const result = calculateButForWorld(inputs, false)

    // Year 2 should be 5% larger than year 1
    const expectedYear2 = result[0].marketSize * 1.05
    expect(result[1].marketSize).toBeCloseTo(expectedYear2, 0)
  })

  it('uses base values when useSampling is false', () => {
    const inputs = { market: mockMarketInputs, competitors: mockCompetitorInputs, prices: mockPriceInputs }
    const result = calculateButForWorld(inputs, false)

    expect(result[0].marketSize).toBe(10000000000)
    expect(result[0].plaintiffButForShare).toBe(0.7)
    expect(result[0].plaintiffActualShare).toBe(0.5)
    expect(result[0].plaintiffMargin).toBe(0.85)
  })
})

describe('calculateLostProfits', () => {
  it('calculates lost profits as lost revenue times margin', () => {
    const yearlyData = [
      {
        year: 2020,
        marketSize: 10000000000, // $10B market
        plaintiffActualShare: 0.5,
        plaintiffButForShare: 0.7,
        defendantActualShare: 0.2,
        plaintiffActualPrice: 50000,
        plaintiffButForPrice: 55000,
        plaintiffMargin: 0.85,
      },
    ]

    const result = calculateLostProfits(yearlyData)

    // Lost Revenue = $10B × (0.7 - 0.5) = $2B
    // Lost Profits = $2B × 0.85 = $1.7B
    expect(result.yearlyLostProfits[0].lostProfits).toBeCloseTo(1700000000, -6)
  })

  it('calculates price erosion correctly', () => {
    const yearlyData = [
      {
        year: 2020,
        marketSize: 10000000000,
        plaintiffActualShare: 0.5,
        plaintiffButForShare: 0.7,
        defendantActualShare: 0.2,
        plaintiffActualPrice: 50000,
        plaintiffButForPrice: 55000,
        plaintiffMargin: 0.85,
      },
    ]

    const result = calculateLostProfits(yearlyData)

    // Actual Revenue = $10B × 0.5 = $5B
    // Price Erosion % = (55000 - 50000) / 55000 = 9.09%
    // Price Erosion Damages = $5B × 0.0909 × 0.85 = ~$386M
    expect(result.yearlyLostProfits[0].priceErosion).toBeCloseTo(386363636, -5)
  })

  it('sums total correctly across years', () => {
    const yearlyData = [
      {
        year: 2020,
        marketSize: 10000000000,
        plaintiffActualShare: 0.5,
        plaintiffButForShare: 0.7,
        defendantActualShare: 0.2,
        plaintiffActualPrice: 50000,
        plaintiffButForPrice: 55000,
        plaintiffMargin: 0.85,
      },
      {
        year: 2021,
        marketSize: 10500000000,
        plaintiffActualShare: 0.5,
        plaintiffButForShare: 0.7,
        defendantActualShare: 0.2,
        plaintiffActualPrice: 50000,
        plaintiffButForPrice: 55000,
        plaintiffMargin: 0.85,
      },
    ]

    const result = calculateLostProfits(yearlyData)

    const yearTotal = result.yearlyLostProfits.reduce((sum, y) => sum + y.lostProfits + y.priceErosion, 0)
    expect(result.total).toBeCloseTo(yearTotal, 0)
  })
})

describe('applyDiscounting', () => {
  it('calculates WACC correctly', () => {
    const yearlyDamages = [
      { year: 2020, damages: 1000000000 },
      { year: 2021, damages: 1050000000 },
    ]

    const result = applyDiscounting(yearlyDamages, mockDiscountingInputs, 2025, false)

    // WACC calculation:
    // Cost of Equity = 0.04 + 1.2 × 0.06 = 0.112 (11.2%)
    // After-tax Debt = 0.05 × (1 - 0.21) = 0.0395 (3.95%)
    // Equity Weight = 1 / (1 + 0.3) = 0.769
    // Debt Weight = 0.3 / (1 + 0.3) = 0.231
    // WACC = 0.112 × 0.769 + 0.0395 × 0.231 ≈ 9.52%

    // Present values should be less than nominal values (for past damages brought forward)
    expect(result.yearlyPV[0].presentValue).toBeGreaterThan(result.yearlyPV[0].nominalDamages)
  })

  it('discounts future damages correctly', () => {
    const yearlyDamages = [
      { year: 2030, damages: 1000000000 },
    ]

    const result = applyDiscounting(yearlyDamages, mockDiscountingInputs, 2025, false)

    // Future damages should be discounted (PV < nominal)
    expect(result.yearlyPV[0].presentValue).toBeLessThan(result.yearlyPV[0].nominalDamages)
  })
})

describe('calculatePrejudgmentInterest', () => {
  it('calculates simple interest correctly', () => {
    const yearlyDamages = [
      { year: 2020, damages: 1000000000 },
    ]

    const result = calculatePrejudgmentInterest(yearlyDamages, 0.05, 2025)

    // 5 years × 5% × $1B = $250M
    expect(result.total).toBeCloseTo(250000000, -6)
    expect(result.byYear[0].interest).toBeCloseTo(250000000, -6)
  })

  it('handles multiple years correctly', () => {
    const yearlyDamages = [
      { year: 2020, damages: 1000000000 },
      { year: 2022, damages: 500000000 },
    ]

    const result = calculatePrejudgmentInterest(yearlyDamages, 0.05, 2025)

    // Year 2020: 5 years × 5% × $1B = $250M
    // Year 2022: 3 years × 5% × $0.5B = $75M
    // Total = $325M
    expect(result.total).toBeCloseTo(325000000, -6)
  })
})

describe('calculateFullLostProfits', () => {
  it('returns complete result with all components', () => {
    const inputs = {
      market: mockMarketInputs,
      competitors: mockCompetitorInputs,
      prices: mockPriceInputs,
      discounting: mockDiscountingInputs,
    }

    const result = calculateFullLostProfits(inputs, false)

    expect(result.totalLostProfits).toBeGreaterThan(0)
    expect(result.lostSalesVolume).toBeGreaterThan(0)
    expect(result.priceErosionDamages).toBeGreaterThan(0)
    expect(result.yearlyBreakdown.length).toBe(5)
    expect(result.calculationSteps.length).toBeGreaterThan(0)
  })

  it('generates calculation steps with proper structure', () => {
    const inputs = {
      market: mockMarketInputs,
      competitors: mockCompetitorInputs,
      prices: mockPriceInputs,
      discounting: mockDiscountingInputs,
    }

    const result = calculateFullLostProfits(inputs, false)

    // Check that key calculation steps exist
    const stepIds = result.calculationSteps.map(s => s.id)
    expect(stepIds).toContain('panduit-factors')
    expect(stepIds).toContain('but-for-analysis')
    expect(stepIds).toContain('lost-profits-calc')
    expect(stepIds).toContain('price-erosion')
    expect(stepIds).toContain('present-value')
  })

  it('yearly breakdown sums correctly', () => {
    const inputs = {
      market: mockMarketInputs,
      competitors: mockCompetitorInputs,
      prices: mockPriceInputs,
      discounting: mockDiscountingInputs,
    }

    const result = calculateFullLostProfits(inputs, false)

    const sumFromBreakdown = result.yearlyBreakdown.reduce(
      (sum, y) => sum + y.lostProfits + y.priceErosion,
      0
    )

    // Should equal totalLostProfits + priceErosionDamages
    expect(sumFromBreakdown).toBeCloseTo(result.totalLostProfits + result.priceErosionDamages, -6)
  })
})
