/**
 * Converts damages calculation results to report format
 */

import { DamagesSummary, DamagesInputs, MonteCarloResult } from '../types';
import { ReportData } from './reportGenerator';
import { calculateButForShare, ButForShareInputs } from '../models/butForShare';

export function buildReportData(
  summary: DamagesSummary,
  inputs: DamagesInputs,
  monteCarloResults?: {
    totalDamages: MonteCarloResult;
    lostProfits: MonteCarloResult;
    royalties: MonteCarloResult;
  },
  scenario?: string
): ReportData {
  // Calculate but-for share
  const butForInputs: ButForShareInputs = {
    plaintiffPreInfringementShare: inputs.competitors.plaintiffPreInfringementShare.base,
    plaintiffActualShare: inputs.competitors.plaintiffActualShare.base,
    defendantActualShare: inputs.competitors.defendantActualShare.base,
    otherCompetitorsShare: inputs.competitors.otherCompetitorsShare.base,
    acceptableSubstitutesExist: inputs.competitors.otherCompetitorsShare.base > 0.05,
  };
  const butForResult = calculateButForShare(butForInputs);

  const today = new Date().toISOString().split('T')[0];

  return {
    title: 'IP Damages Analysis Report',
    date: today,
    scenario: scenario || 'Lost Profits with Reasonable Royalty Floor',
    summary: {
      totalDamages: {
        base: summary.totalDamages.base,
        low: summary.totalDamages.low,
        high: summary.totalDamages.high,
      },
      lostProfits: {
        base: summary.lostProfits.base,
        low: summary.lostProfits.low,
        high: summary.lostProfits.high,
      },
      reasonableRoyalty: {
        base: summary.reasonableRoyalty.base,
        low: summary.reasonableRoyalty.low,
        high: summary.reasonableRoyalty.high,
      },
    },
    inputs: {
      market: {
        totalMarketSize: inputs.market.totalMarketSize.base,
        growthRate: inputs.market.marketGrowthRate.base,
        infringementPeriod: `${inputs.market.infringementStartYear}-${inputs.market.infringementEndYear}`,
      },
      shares: {
        plaintiffPreInfringement: inputs.competitors.plaintiffPreInfringementShare.base,
        plaintiffActual: inputs.competitors.plaintiffActualShare.base,
        defendantActual: inputs.competitors.defendantActualShare.base,
        butForShare: butForResult.butForShare,
        absorptionRate: butForResult.absorptionRate,
        method: butForResult.method,
      },
      royalty: {
        baseRate: inputs.royalty.profitSplit.base,
        rubinsteinSplit: summary.rubinsteinRoyalty || 0.5,
      },
    },
    methodology: {
      lostProfits: butForResult.method === 'panduit-full-absorption'
        ? 'Panduit test satisfied; full absorption of defendant sales assumed.'
        : 'Grain Processing proportional allocation based on market share among non-infringing alternatives.',
      royalty: 'Georgia-Pacific factors analysis with Rubinstein alternating-offers bargaining model validation.',
      butForWorld: butForResult.cappedAtPreInfringement
        ? 'But-for share capped at pre-infringement level; plaintiff cannot exceed historical market position.'
        : 'But-for share calculated as actual share plus absorbed defendant sales.',
    },
    calculationSteps: summary.calculationSteps.map(step => ({
      name: step.label,
      formula: step.formula || '',
      inputs: step.inputs.reduce((acc, inp) => {
        acc[inp.name] = typeof inp.value === 'number' ? inp.value : 0;
        return acc;
      }, {} as Record<string, number>),
      result: step.result,
    })),
    uncertaintyAnalysis: {
      monteCarloIterations: monteCarloResults ? 5000 : 0,
      confidenceInterval: '90%',
      percentile5: monteCarloResults?.totalDamages.percentile5 || summary.totalDamages.low,
      percentile95: monteCarloResults?.totalDamages.percentile95 || summary.totalDamages.high,
    },
  };
}
