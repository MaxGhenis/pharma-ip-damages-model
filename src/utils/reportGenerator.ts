/**
 * Report Generator for IP Damages Analysis
 *
 * Generates structured report content that can be rendered as HTML or exported to PDF.
 */

export interface ReportData {
  title: string;
  date: string;
  scenario: string;
  summary: {
    totalDamages: { base: number; low: number; high: number };
    lostProfits: { base: number; low: number; high: number };
    reasonableRoyalty: { base: number; low: number; high: number };
  };
  inputs: {
    market: {
      totalMarketSize: number;
      growthRate: number;
      infringementPeriod: string;
    };
    shares: {
      plaintiffPreInfringement: number;
      plaintiffActual: number;
      defendantActual: number;
      butForShare: number;
      absorptionRate: number;
      method: string;
    };
    royalty: {
      baseRate: number;
      rubinsteinSplit: number;
    };
  };
  methodology: {
    lostProfits: string;
    royalty: string;
    butForWorld: string;
  };
  calculationSteps: Array<{
    name: string;
    formula: string;
    inputs: Record<string, number>;
    result: number;
  }>;
  uncertaintyAnalysis: {
    monteCarloIterations: number;
    confidenceInterval: string;
    percentile5: number;
    percentile95: number;
  };
}

export interface ReportSection {
  title: string;
  type: 'text' | 'table' | 'calculations' | 'list';
  content: string;
  data?: unknown;
}

export interface ReportContent {
  title: string;
  date: string;
  sections: ReportSection[];
}

/**
 * Format a number as currency (billions/millions)
 */
export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1e9) {
    return `$${(value / 1e9).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1e3) {
    return `$${(value / 1e3).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Format a number as percentage
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Generate structured report content from damages analysis data
 */
export function generateReportContent(data: ReportData): ReportContent {
  const sections: ReportSection[] = [];

  // Executive Summary
  sections.push({
    title: 'Executive Summary',
    type: 'text',
    content: `This report presents an economic analysis of damages for patent infringement in the pharmaceutical/biotech sector. Based on the ${data.scenario} methodology, total damages are estimated at ${formatCurrency(data.summary.totalDamages.base)} (range: ${formatCurrency(data.summary.totalDamages.low)} to ${formatCurrency(data.summary.totalDamages.high)}).

The analysis covers the infringement period of ${data.inputs.market.infringementPeriod} and considers a total addressable market of ${formatCurrency(data.inputs.market.totalMarketSize)} with an annual growth rate of ${formatPercent(data.inputs.market.growthRate)}.

Key findings:
• Lost Profits: ${formatCurrency(data.summary.lostProfits.base)}
• Reasonable Royalty Floor: ${formatCurrency(data.summary.reasonableRoyalty.base)}
• But-For Market Share: ${formatPercent(data.inputs.shares.butForShare)}
• Absorption Rate: ${formatPercent(data.inputs.shares.absorptionRate)}`,
  });

  // Damages Summary Table
  sections.push({
    title: 'Damages Summary',
    type: 'table',
    content: `| Component | Low | Base | High |
|-----------|-----|------|------|
| Total Damages | ${formatCurrency(data.summary.totalDamages.low)} | ${formatCurrency(data.summary.totalDamages.base)} | ${formatCurrency(data.summary.totalDamages.high)} |
| Lost Profits | ${formatCurrency(data.summary.lostProfits.low)} | ${formatCurrency(data.summary.lostProfits.base)} | ${formatCurrency(data.summary.lostProfits.high)} |
| Reasonable Royalty | ${formatCurrency(data.summary.reasonableRoyalty.low)} | ${formatCurrency(data.summary.reasonableRoyalty.base)} | ${formatCurrency(data.summary.reasonableRoyalty.high)} |`,
    data: {
      headers: ['Component', 'Low', 'Base', 'High'],
      rows: [
        ['Total Damages', formatCurrency(data.summary.totalDamages.low), formatCurrency(data.summary.totalDamages.base), formatCurrency(data.summary.totalDamages.high)],
        ['Lost Profits', formatCurrency(data.summary.lostProfits.low), formatCurrency(data.summary.lostProfits.base), formatCurrency(data.summary.lostProfits.high)],
        ['Reasonable Royalty', formatCurrency(data.summary.reasonableRoyalty.low), formatCurrency(data.summary.reasonableRoyalty.base), formatCurrency(data.summary.reasonableRoyalty.high)],
      ],
    },
  });

  // Legal Framework
  sections.push({
    title: 'Legal Framework',
    type: 'text',
    content: `This damages analysis is grounded in established legal precedent:

**Lost Profits (35 U.S.C. § 284)**
Under Panduit Corp. v. Stahlin Bros. Fibre Works (1978), a patent holder may recover lost profits by demonstrating:
1. Demand for the patented product
2. Absence of acceptable non-infringing substitutes
3. Manufacturing and marketing capability to exploit demand
4. Amount of profit that would have been made

**Reasonable Royalty**
The Georgia-Pacific factors (Georgia-Pacific Corp. v. U.S. Plywood Corp., 1970) provide a framework for determining a reasonable royalty rate through a hypothetical negotiation between willing licensor and licensee.

**But-For World Analysis**
Under Grain Processing Corp. v. American Maize-Products (Fed. Cir. 1999), even when acceptable substitutes exist, the patentee may recover a proportional share of lost profits based on market share among alternatives.`,
  });

  // Methodology
  sections.push({
    title: 'Methodology',
    type: 'text',
    content: `**Lost Profits Analysis**
${data.methodology.lostProfits}

**Reasonable Royalty Analysis**
${data.methodology.royalty}

**But-For World Construction**
${data.methodology.butForWorld}`,
  });

  // But-For World Analysis
  sections.push({
    title: 'But-For World Analysis',
    type: 'text',
    content: `The but-for world represents the hypothetical market state absent infringement.

**Market Share Analysis:**
• Pre-Infringement Plaintiff Share: ${formatPercent(data.inputs.shares.plaintiffPreInfringement)}
• Actual Plaintiff Share (during infringement): ${formatPercent(data.inputs.shares.plaintiffActual)}
• Defendant's Infringing Share: ${formatPercent(data.inputs.shares.defendantActual)}
• Calculated But-For Share: ${formatPercent(data.inputs.shares.butForShare)}

**Absorption Analysis:**
Method: ${data.inputs.shares.method === 'panduit-full-absorption' ? 'Panduit Full Absorption' : 'Grain Processing Proportional'}
Absorption Rate: ${formatPercent(data.inputs.shares.absorptionRate)}

${data.inputs.shares.method === 'panduit-full-absorption'
    ? 'The Panduit test is satisfied, establishing that no acceptable non-infringing substitutes exist. Therefore, the plaintiff would have captured 100% of the defendant\'s infringing sales.'
    : 'Acceptable substitutes exist in the market. The plaintiff\'s absorption of defendant sales is proportional to their share among non-infringing alternatives.'}`,
  });

  // Calculation Details
  sections.push({
    title: 'Calculation Details',
    type: 'calculations',
    content: data.calculationSteps.map(step =>
      `**${step.name}**
Formula: ${step.formula}
Inputs: ${Object.entries(step.inputs).map(([k, v]) => `${k} = ${typeof v === 'number' && v < 1 ? formatPercent(v) : formatCurrency(v)}`).join(', ')}
Result: ${step.result < 1 ? formatPercent(step.result) : formatCurrency(step.result)}`
    ).join('\n\n'),
    data: data.calculationSteps,
  });

  // Uncertainty Analysis
  sections.push({
    title: 'Uncertainty Analysis',
    type: 'text',
    content: `A Monte Carlo simulation with ${data.uncertaintyAnalysis.monteCarloIterations.toLocaleString()} iterations was performed to quantify uncertainty in the damages estimate.

**${data.uncertaintyAnalysis.confidenceInterval} Confidence Interval:**
• 5th Percentile: ${formatCurrency(data.uncertaintyAnalysis.percentile5)}
• 95th Percentile: ${formatCurrency(data.uncertaintyAnalysis.percentile95)}

The simulation accounts for uncertainty in:
• Market size and growth projections
• Market share estimates
• Price and margin assumptions
• Discount rate components

This range reflects the inherent uncertainty in economic projections and should be considered when evaluating damages claims.`,
  });

  // Disclaimers
  sections.push({
    title: 'Limitations and Disclaimers',
    type: 'text',
    content: `This analysis is based on the inputs and assumptions provided. Actual damages may vary based on:
• Discovery of additional facts
• Expert testimony and litigation dynamics
• Court interpretation of applicable legal standards
• Changes in market conditions

This report is generated for analytical purposes and does not constitute legal advice. Consultation with qualified legal and economic experts is recommended for litigation purposes.`,
  });

  return {
    title: data.title,
    date: data.date,
    sections,
  };
}
