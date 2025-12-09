# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DCF-based damages calculator for pharmaceutical/biotech IP litigation. Implements economic methodologies used by damages experts in patent and trade secret cases: lost profits (Panduit), reasonable royalty (Georgia-Pacific), Rubinstein bargaining, Shapley value allocation, and trade secret damages.

Live at: https://maxghenis.github.io/pharma-ip-damages-model

## Commands

```bash
npm run dev          # Start development server
npm run build        # TypeScript check + Vite build
npm run test         # Run vitest in watch mode
npm run test:run     # Run tests once (CI mode)
npm run lint         # ESLint
npm run deploy       # Build and deploy to GitHub Pages
```

## Architecture

### Core Calculation Flow

`src/models/damagesCalculator.ts` orchestrates all damage calculations:
1. Lost profits (`lostProfits.ts`) - Panduit factors, but-for world modeling
2. Reasonable royalty (`reasonableRoyalty.ts`) - Georgia-Pacific 15 factors
3. Rubinstein bargaining (`rubinstein.ts`) - Game-theoretic negotiation
4. Shapley value (`shapley.ts`) - Multi-patent allocation
5. Trade secret (`tradeSecret.ts`) - Head start damages
6. S-curve/Bass diffusion (`scurve.ts`) - Market adoption modeling

### Uncertainty System

All numeric inputs use `UncertaintyRange` type with `{low, base, high, distribution}`. The `src/utils/uncertainty.ts` module provides:
- Distribution samplers (triangular, normal, lognormal, uniform)
- `sampleUncertainty()` - Random draw from any range
- `runMonteCarlo()` - Run N iterations of a calculation function

### Type System

`src/types/index.ts` defines all interfaces. Key types:
- `DamagesInputs` - Complete input state (market, competitors, prices, royalty, etc.)
- `DamagesSummary` - Aggregated results with yearly breakdown
- `CalculationStep` - Audit trail for each calculation (label, formula, inputs, result)
- `MonteCarloResult` - Statistics and histogram from simulation

### State Management

Single `App.tsx` manages all state via `useState`. No external state library. Key state:
- `inputs: DamagesInputs` - All model parameters
- `options` - Which analyses to run (lost profits, royalty, Monte Carlo, etc.)
- `results: FullDamagesResult` - Computed via `useMemo` when inputs/options change

### Component Patterns

- `InputPanel.tsx` - Renders all input groups using `InputField.tsx`
- `ResultsSummary.tsx` - Key metrics display
- `ExpandableSection.tsx` - Collapsible calculation details
- `CalculationStep.tsx` - Shows formula, inputs, and result for audit trail
- `Charts.tsx` - Chart.js visualizations (bar, histogram, tornado, line)

## Testing

Tests use Vitest with React Testing Library. Run single test file:
```bash
npx vitest run src/models/rubinstein.test.ts
```

## Key Economic Models

**But-For Share**: `src/models/butForShare.ts` implements Panduit/Grain Processing analysis:
- If Panduit factors met: plaintiff gets all defendant's sales
- Otherwise: Market share approach (proportional attribution)

**WACC Discounting**: Lost profits discounted using CAPM-based WACC calculated in `lostProfits.ts:applyDiscounting()`

**Monte Carlo**: 5000 iterations default. Each iteration samples all uncertain inputs, recalculates damages, builds histogram.
