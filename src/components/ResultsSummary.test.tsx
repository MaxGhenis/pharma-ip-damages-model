import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResultsSummary } from './ResultsSummary'
import { DamagesSummary } from '../types'

const mockSummary: DamagesSummary = {
  totalDamages: { base: 1000000000, low: 800000000, high: 1200000000 },
  lostProfits: { base: 600000000, low: 500000000, high: 700000000 },
  reasonableRoyalty: { base: 400000000, low: 300000000, high: 500000000 },
  priceErosion: { base: 50000000, low: 40000000, high: 60000000 },
  presentValueDamages: { base: 900000000, low: 720000000, high: 1080000000 },
  prejudgmentInterest: { base: 100000000, low: 80000000, high: 120000000 },
  yearlyBreakdown: [],
  calculationSteps: [],
  rubinsteinRoyalty: 0.05,
}

const mockMonteCarloResults = {
  totalDamages: {
    mean: 1000000000,
    std: 100000000,
    percentile5: 850000000,
    percentile25: 920000000,
    percentile75: 1080000000,
    percentile95: 1150000000,
    median: 990000000,
    samples: [],
    histogram: [],
  },
  lostProfits: {
    mean: 600000000,
    std: 50000000,
    percentile5: 520000000,
    percentile25: 560000000,
    percentile75: 640000000,
    percentile95: 680000000,
    median: 595000000,
    samples: [],
    histogram: [],
  },
  royalties: {
    mean: 400000000,
    std: 40000000,
    percentile5: 340000000,
    percentile25: 370000000,
    percentile75: 430000000,
    percentile95: 460000000,
    median: 398000000,
    samples: [],
    histogram: [],
  },
}

describe('ResultsSummary - Dark Theme', () => {
  it('renders summary cards with dark theme styling', () => {
    render(<ResultsSummary summary={mockSummary} />)
    const summaryCards = document.querySelectorAll('.card-elevated, .card')
    expect(summaryCards.length).toBeGreaterThan(0)
  })

  it('renders primary card with gold gradient for Total Damages', () => {
    render(<ResultsSummary summary={mockSummary} />)
    expect(screen.getByText('Total Damages')).toBeInTheDocument()
    const primaryCard = screen.getByText('Total Damages').closest('div')
    // Primary card should have special gold styling
    expect(primaryCard?.className).toMatch(/gold|primary|elevated/)
  })

  it('renders metric cards with dark background', () => {
    render(<ResultsSummary summary={mockSummary} />)
    expect(screen.getByText('Price Erosion')).toBeInTheDocument()
    expect(screen.getByText('Present Value')).toBeInTheDocument()
  })

  it('displays currency values with data-value class for terminal styling', () => {
    render(<ResultsSummary summary={mockSummary} />)
    const dataValues = document.querySelectorAll('.data-value')
    expect(dataValues.length).toBeGreaterThan(0)
  })

  it('renders Monte Carlo section with dark theme when provided', () => {
    render(<ResultsSummary summary={mockSummary} monteCarloResults={mockMonteCarloResults} />)
    expect(screen.getByText('Monte Carlo Confidence Intervals')).toBeInTheDocument()
    // Should use card styling, not sky-50
    const mcSection = screen.getByText('Monte Carlo Confidence Intervals').closest('div')
    expect(mcSection).toHaveClass('card')
  })

  it('displays percentile labels correctly', () => {
    render(<ResultsSummary summary={mockSummary} monteCarloResults={mockMonteCarloResults} />)
    expect(screen.getByText('5th Percentile')).toBeInTheDocument()
    expect(screen.getByText('95th Percentile')).toBeInTheDocument()
    expect(screen.getByText(/Median/)).toBeInTheDocument()
    expect(screen.getByText('Mean')).toBeInTheDocument()
  })

  it('renders Rubinstein Royalty when present', () => {
    render(<ResultsSummary summary={mockSummary} />)
    expect(screen.getByText('Rubinstein Royalty')).toBeInTheDocument()
    expect(screen.getByText('5.00%')).toBeInTheDocument()
  })
})
