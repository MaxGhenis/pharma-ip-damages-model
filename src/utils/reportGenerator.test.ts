import { describe, it, expect, vi } from 'vitest'
import { generateReportContent, ReportData } from './reportGenerator'

describe('Report Generator', () => {
  const mockReportData: ReportData = {
    title: 'IP Damages Analysis Report',
    date: '2025-12-08',
    scenario: 'Lost Profits with Reasonable Royalty Floor',
    summary: {
      totalDamages: { base: 1500000000, low: 1200000000, high: 1800000000 },
      lostProfits: { base: 1000000000, low: 800000000, high: 1200000000 },
      reasonableRoyalty: { base: 500000000, low: 400000000, high: 600000000 },
    },
    inputs: {
      market: {
        totalMarketSize: 10000000000,
        growthRate: 0.04,
        infringementPeriod: '2018-2023',
      },
      shares: {
        plaintiffPreInfringement: 0.8,
        plaintiffActual: 0.5,
        defendantActual: 0.2,
        butForShare: 0.7,
        absorptionRate: 1.0,
        method: 'panduit-full-absorption',
      },
      royalty: {
        baseRate: 0.05,
        rubinsteinSplit: 0.513,
      },
    },
    methodology: {
      lostProfits: 'Panduit test satisfied; full absorption of defendant sales',
      royalty: 'Georgia-Pacific factors with Rubinstein bargaining validation',
      butForWorld: 'Pre-infringement share as ceiling; no acceptable substitutes',
    },
    calculationSteps: [
      {
        name: 'But-For Share Analysis',
        formula: 'But-For Share = Actual Share + (Defendant Share × Absorption Rate)',
        inputs: { actualShare: 0.5, defendantShare: 0.2, absorptionRate: 1.0 },
        result: 0.7,
      },
      {
        name: 'Lost Profits',
        formula: 'Lost Profits = Lost Revenue × Margin',
        inputs: { lostRevenue: 2000000000, margin: 0.5 },
        result: 1000000000,
      },
    ],
    uncertaintyAnalysis: {
      monteCarloIterations: 5000,
      confidenceInterval: '90%',
      percentile5: 1100000000,
      percentile95: 1900000000,
    },
  }

  describe('generateReportContent', () => {
    it('generates report with executive summary section', () => {
      const content = generateReportContent(mockReportData)

      expect(content.sections).toContainEqual(
        expect.objectContaining({
          title: 'Executive Summary',
          type: 'text',
        })
      )
    })

    it('includes damages summary with ranges', () => {
      const content = generateReportContent(mockReportData)

      const summarySection = content.sections.find(s => s.title === 'Damages Summary')
      expect(summarySection).toBeDefined()
      expect(summarySection?.type).toBe('table')
    })

    it('includes methodology section', () => {
      const content = generateReportContent(mockReportData)

      const methodSection = content.sections.find(s => s.title === 'Methodology')
      expect(methodSection).toBeDefined()
    })

    it('includes but-for world analysis', () => {
      const content = generateReportContent(mockReportData)

      const butForSection = content.sections.find(s => s.title === 'But-For World Analysis')
      expect(butForSection).toBeDefined()
    })

    it('includes calculation steps with formulas', () => {
      const content = generateReportContent(mockReportData)

      const calcSection = content.sections.find(s => s.title === 'Calculation Details')
      expect(calcSection).toBeDefined()
      expect(calcSection?.type).toBe('calculations')
    })

    it('includes uncertainty analysis', () => {
      const content = generateReportContent(mockReportData)

      const uncertaintySection = content.sections.find(s => s.title === 'Uncertainty Analysis')
      expect(uncertaintySection).toBeDefined()
    })

    it('formats currency values correctly', () => {
      const content = generateReportContent(mockReportData)

      // Should contain formatted billion values
      const execSummary = content.sections.find(s => s.title === 'Executive Summary')
      expect(execSummary?.content).toContain('$1.5B')
    })

    it('includes legal framework references', () => {
      const content = generateReportContent(mockReportData)

      const legalSection = content.sections.find(s => s.title === 'Legal Framework')
      expect(legalSection).toBeDefined()
      expect(legalSection?.content).toContain('Panduit')
    })
  })
})
