import React from 'react';
import { DamagesInputs } from '../types';
import { SourceCitation } from '../types/validation';
import { ExpandableSection } from './ExpandableSection';
import { TripleInput, NumberInput } from './InputField';

interface InputPanelProps {
  inputs: DamagesInputs;
  onChange: (inputs: DamagesInputs) => void;
  sources?: Map<string, SourceCitation>;
  onSourceChange?: (path: string, source: SourceCitation | undefined) => void;
}

export function InputPanel({ inputs, onChange, sources, onSourceChange }: InputPanelProps) {
  const getSource = (path: string) => sources?.get(path);
  return (
    <div className="space-y-4">
      <ExpandableSection title="Market Parameters" defaultOpen>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TripleInput
            label="Total Market Size"
            value={inputs.market.totalMarketSize}
            onChange={(v) =>
              onChange({ ...inputs, market: { ...inputs.market, totalMarketSize: v } })
            }
            format="currency"
            helpText="Annual US market size in dollars"
            inputPath="market.totalMarketSize"
            source={getSource('market.totalMarketSize')}
            onSourceChange={onSourceChange}
          />
          <TripleInput
            label="Market Growth Rate"
            value={inputs.market.marketGrowthRate}
            onChange={(v) =>
              onChange({ ...inputs, market: { ...inputs.market, marketGrowthRate: v } })
            }
            format="percent"
            helpText="Annual growth rate"
            inputPath="market.marketGrowthRate"
            source={getSource('market.marketGrowthRate')}
            onSourceChange={onSourceChange}
          />
          <NumberInput
            label="Infringement Start Year"
            value={inputs.market.infringementStartYear}
            onChange={(v) =>
              onChange({ ...inputs, market: { ...inputs.market, infringementStartYear: v } })
            }
            min={2000}
            max={2030}
          />
          <NumberInput
            label="Infringement End Year"
            value={inputs.market.infringementEndYear}
            onChange={(v) =>
              onChange({ ...inputs, market: { ...inputs.market, infringementEndYear: v } })
            }
            min={2000}
            max={2035}
          />
          <NumberInput
            label="Patent Expiry Year"
            value={inputs.market.patentExpiryYear}
            onChange={(v) =>
              onChange({ ...inputs, market: { ...inputs.market, patentExpiryYear: v } })
            }
            min={2020}
            max={2045}
          />
          <NumberInput
            label="Projection Years"
            value={inputs.market.projectionYears}
            onChange={(v) =>
              onChange({ ...inputs, market: { ...inputs.market, projectionYears: v } })
            }
            min={1}
            max={20}
          />
        </div>
      </ExpandableSection>

      <ExpandableSection title="Market Shares">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TripleInput
            label="Plaintiff But-For Share"
            value={inputs.competitors.plaintiffButForShare}
            onChange={(v) =>
              onChange({
                ...inputs,
                competitors: { ...inputs.competitors, plaintiffButForShare: v },
              })
            }
            format="percent"
            helpText="Plaintiff's share absent infringement"
            inputPath="competitors.plaintiffButForShare"
            source={getSource('competitors.plaintiffButForShare')}
            onSourceChange={onSourceChange}
          />
          <TripleInput
            label="Plaintiff Actual Share"
            value={inputs.competitors.plaintiffActualShare}
            onChange={(v) =>
              onChange({
                ...inputs,
                competitors: { ...inputs.competitors, plaintiffActualShare: v },
              })
            }
            format="percent"
            helpText="Plaintiff's actual share with infringement"
            inputPath="competitors.plaintiffActualShare"
            source={getSource('competitors.plaintiffActualShare')}
            onSourceChange={onSourceChange}
          />
          <TripleInput
            label="Defendant Actual Share"
            value={inputs.competitors.defendantActualShare}
            onChange={(v) =>
              onChange({
                ...inputs,
                competitors: { ...inputs.competitors, defendantActualShare: v },
              })
            }
            format="percent"
            helpText="Defendant's infringing market share"
            inputPath="competitors.defendantActualShare"
            source={getSource('competitors.defendantActualShare')}
            onSourceChange={onSourceChange}
          />
          <TripleInput
            label="Other Competitors Share"
            value={inputs.competitors.otherCompetitorsShare}
            onChange={(v) =>
              onChange({
                ...inputs,
                competitors: { ...inputs.competitors, otherCompetitorsShare: v },
              })
            }
            format="percent"
            helpText="Non-infringing alternatives"
          />
        </div>
      </ExpandableSection>

      <ExpandableSection title="Profit Margins">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TripleInput
            label="Plaintiff Gross Margin"
            value={inputs.competitors.plaintiffGrossMargin}
            onChange={(v) =>
              onChange({
                ...inputs,
                competitors: { ...inputs.competitors, plaintiffGrossMargin: v },
              })
            }
            format="percent"
            helpText="Gross profit margin"
            inputPath="competitors.plaintiffGrossMargin"
            source={getSource('competitors.plaintiffGrossMargin')}
            onSourceChange={onSourceChange}
          />
          <TripleInput
            label="Plaintiff Incremental Margin"
            value={inputs.competitors.plaintiffIncrementalMargin}
            onChange={(v) =>
              onChange({
                ...inputs,
                competitors: { ...inputs.competitors, plaintiffIncrementalMargin: v },
              })
            }
            format="percent"
            helpText="Margin on incremental lost sales (excludes fixed costs)"
            inputPath="competitors.plaintiffIncrementalMargin"
            source={getSource('competitors.plaintiffIncrementalMargin')}
            onSourceChange={onSourceChange}
          />
          <TripleInput
            label="Defendant Gross Margin"
            value={inputs.competitors.defendantGrossMargin}
            onChange={(v) =>
              onChange({
                ...inputs,
                competitors: { ...inputs.competitors, defendantGrossMargin: v },
              })
            }
            format="percent"
            helpText="For royalty base calculation"
            inputPath="competitors.defendantGrossMargin"
            source={getSource('competitors.defendantGrossMargin')}
            onSourceChange={onSourceChange}
          />
        </div>
      </ExpandableSection>

      <ExpandableSection title="Pricing">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TripleInput
            label="Plaintiff Price (Actual)"
            value={inputs.prices.plaintiffPrice}
            onChange={(v) =>
              onChange({ ...inputs, prices: { ...inputs.prices, plaintiffPrice: v } })
            }
            format="currency"
            helpText="Actual price per unit/patient/year"
          />
          <TripleInput
            label="Plaintiff Price (But-For)"
            value={inputs.prices.butForPrice}
            onChange={(v) =>
              onChange({ ...inputs, prices: { ...inputs.prices, butForPrice: v } })
            }
            format="currency"
            helpText="Price absent infringement"
          />
          <TripleInput
            label="Defendant Price"
            value={inputs.prices.defendantPrice}
            onChange={(v) =>
              onChange({ ...inputs, prices: { ...inputs.prices, defendantPrice: v } })
            }
            format="currency"
            helpText="Defendant's infringing product price"
          />
          <TripleInput
            label="Price Erosion"
            value={inputs.prices.priceErosionPercent}
            onChange={(v) =>
              onChange({ ...inputs, prices: { ...inputs.prices, priceErosionPercent: v } })
            }
            format="percent"
            helpText="Price reduction due to competition"
            inputPath="prices.priceErosionPercent"
            source={getSource('prices.priceErosionPercent')}
            onSourceChange={onSourceChange}
          />
        </div>
      </ExpandableSection>

      <ExpandableSection title="Patent & Royalty Parameters">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TripleInput
            label="Patent Strength"
            value={inputs.royalty.patentStrength}
            onChange={(v) =>
              onChange({ ...inputs, royalty: { ...inputs.royalty, patentStrength: v } })
            }
            format="percent"
            helpText="Combined validity × infringement probability"
            inputPath="royalty.patentStrength"
            source={getSource('royalty.patentStrength')}
            onSourceChange={onSourceChange}
          />
          <TripleInput
            label="Technology Contribution"
            value={inputs.royalty.technologyContribution}
            onChange={(v) =>
              onChange({ ...inputs, royalty: { ...inputs.royalty, technologyContribution: v } })
            }
            format="percent"
            helpText="Portion of product value from patented tech"
            inputPath="royalty.technologyContribution"
            source={getSource('royalty.technologyContribution')}
            onSourceChange={onSourceChange}
          />
          <TripleInput
            label="Profit Split"
            value={inputs.royalty.profitSplit}
            onChange={(v) =>
              onChange({ ...inputs, royalty: { ...inputs.royalty, profitSplit: v } })
            }
            format="percent"
            helpText="Plaintiff's share of attributable profits"
            inputPath="royalty.profitSplit"
            source={getSource('royalty.profitSplit')}
            onSourceChange={onSourceChange}
          />
          <TripleInput
            label="Discount Rate per Round"
            value={inputs.royalty.discountRatePerRound}
            onChange={(v) =>
              onChange({ ...inputs, royalty: { ...inputs.royalty, discountRatePerRound: v } })
            }
            format="percent"
            helpText="For Rubinstein bargaining model"
          />
        </div>
      </ExpandableSection>

      <ExpandableSection title="Rubinstein Bargaining">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TripleInput
            label="Plaintiff BATNA"
            value={inputs.royalty.plaintiffBATNA}
            onChange={(v) =>
              onChange({ ...inputs, royalty: { ...inputs.royalty, plaintiffBATNA: v } })
            }
            format="currency"
            helpText="Best Alternative to Negotiated Agreement"
          />
          <TripleInput
            label="Defendant BATNA"
            value={inputs.royalty.defendantBATNA}
            onChange={(v) =>
              onChange({ ...inputs, royalty: { ...inputs.royalty, defendantBATNA: v } })
            }
            format="currency"
            helpText="Design-around or alternative licensing"
          />
        </div>
      </ExpandableSection>

      <ExpandableSection title="S-Curve / Bass Diffusion">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TripleInput
            label="Innovation Coefficient (p)"
            value={inputs.sCurve.innovationCoefficient}
            onChange={(v) =>
              onChange({ ...inputs, sCurve: { ...inputs.sCurve, innovationCoefficient: v } })
            }
            format="number"
            helpText="External influence (typically 0.01-0.03)"
          />
          <TripleInput
            label="Imitation Coefficient (q)"
            value={inputs.sCurve.imitationCoefficient}
            onChange={(v) =>
              onChange({ ...inputs, sCurve: { ...inputs.sCurve, imitationCoefficient: v } })
            }
            format="number"
            helpText="Word-of-mouth effect (typically 0.3-0.5)"
          />
          <TripleInput
            label="Market Potential (m)"
            value={inputs.sCurve.marketPotential}
            onChange={(v) =>
              onChange({ ...inputs, sCurve: { ...inputs.sCurve, marketPotential: v } })
            }
            format="currency"
            helpText="Maximum market size"
          />
        </div>
      </ExpandableSection>

      <ExpandableSection title="Discounting / WACC">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TripleInput
            label="Risk-Free Rate"
            value={inputs.discounting.riskFreeRate}
            onChange={(v) =>
              onChange({ ...inputs, discounting: { ...inputs.discounting, riskFreeRate: v } })
            }
            format="percent"
            helpText="Treasury rate"
          />
          <TripleInput
            label="Equity Risk Premium"
            value={inputs.discounting.equityRiskPremium}
            onChange={(v) =>
              onChange({
                ...inputs,
                discounting: { ...inputs.discounting, equityRiskPremium: v },
              })
            }
            format="percent"
          />
          <TripleInput
            label="Company Beta"
            value={inputs.discounting.companyBeta}
            onChange={(v) =>
              onChange({ ...inputs, discounting: { ...inputs.discounting, companyBeta: v } })
            }
            format="number"
            helpText="Systematic risk"
          />
          <TripleInput
            label="Tax Rate"
            value={inputs.discounting.taxRate}
            onChange={(v) =>
              onChange({ ...inputs, discounting: { ...inputs.discounting, taxRate: v } })
            }
            format="percent"
          />
          <TripleInput
            label="Debt/Equity Ratio"
            value={inputs.discounting.debtToEquityRatio}
            onChange={(v) =>
              onChange({
                ...inputs,
                discounting: { ...inputs.discounting, debtToEquityRatio: v },
              })
            }
            format="number"
          />
          <TripleInput
            label="Prejudgment Interest Rate"
            value={inputs.discounting.prejudgmentInterestRate}
            onChange={(v) =>
              onChange({
                ...inputs,
                discounting: { ...inputs.discounting, prejudgmentInterestRate: v },
              })
            }
            format="percent"
          />
        </div>
      </ExpandableSection>

      {inputs.tradeSecret.headStartMonths > 0 && (
        <ExpandableSection title="Trade Secret Parameters">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumberInput
              label="Head Start (Months)"
              value={inputs.tradeSecret.headStartMonths}
              onChange={(v) =>
                onChange({
                  ...inputs,
                  tradeSecret: { ...inputs.tradeSecret, headStartMonths: v },
                })
              }
              min={0}
              max={60}
            />
            <TripleInput
              label="Development Costs Saved"
              value={inputs.tradeSecret.developmentCostSaved}
              onChange={(v) =>
                onChange({
                  ...inputs,
                  tradeSecret: { ...inputs.tradeSecret, developmentCostSaved: v },
                })
              }
              format="currency"
              helpText="R&D costs avoided by defendant"
            />
            <TripleInput
              label="Market Share During Head Start"
              value={inputs.tradeSecret.marketShareDuringHeadStart}
              onChange={(v) =>
                onChange({
                  ...inputs,
                  tradeSecret: { ...inputs.tradeSecret, marketShareDuringHeadStart: v },
                })
              }
              format="percent"
            />
            <TripleInput
              label="Permanent Market Share Shift"
              value={inputs.tradeSecret.permanentMarketShareShift}
              onChange={(v) =>
                onChange({
                  ...inputs,
                  tradeSecret: { ...inputs.tradeSecret, permanentMarketShareShift: v },
                })
              }
              format="percent"
              helpText="Long-term market share loss"
            />
          </div>
        </ExpandableSection>
      )}
    </div>
  );
}
