# Pharma/Biotech IP Damages Calculator

An interactive DCF-based damages model for pharmaceutical and biotech intellectual property litigation. This tool implements standard economic methodologies used by damages experts in patent and trade secret cases.

**[Live Demo](https://maxghenis.github.io/pharma-ip-damages-model)**

## Features

### Damages Methodologies

- **Lost Profits Analysis** - Panduit factors, but-for world modeling, price erosion
- **Reasonable Royalty** - Georgia-Pacific 15 factors framework
- **Rubinstein Bargaining** - Game-theoretic hypothetical negotiation model
- **Shapley Value Allocation** - Multi-patent value apportionment
- **Trade Secret Damages** - Head start, unjust enrichment, permanent market loss

### Market Modeling

- **S-Curve / Bass Diffusion** - Product adoption modeling
- **Market Share Dynamics** - But-for vs actual world comparison
- **Price Erosion** - Competition-driven price reduction analysis

### Uncertainty Analysis

- **Monte Carlo Simulation** - 5,000+ iteration probability distributions
- **Sensitivity Analysis** - Tornado charts with parameter elasticities
- **Confidence Intervals** - 90% CI for all key outputs

### Demo Scenarios

Pre-configured scenarios inspired by real pharmaceutical litigation:

1. **Blockbuster Biologic** - Patent case similar to Humira biosimilar litigation
2. **Trade Secret Theft** - Clinical data misappropriation with head start damages
3. **Hatch-Waxman ANDA** - Generic drug Paragraph IV certification case
4. **Custom Scenario** - Build your own case parameters

## Economic Models

### Rubinstein Bargaining Model

Models a hypothetical pre-infringement negotiation between patent holder and potential licensee:

```
Plaintiff Share = (1 - delta_2) / (1 - delta_1 * delta_2)
```

Where delta_1 and delta_2 are discount factors representing each party's patience/time preference.

### Shapley Value Allocation

For multi-patent products, allocates value using cooperative game theory:

```
phi_i = Sum [|S|!(n-|S|-1)!/n!] * [v(S u {i}) - v(S)]
```

Each patent receives its average marginal contribution across all possible coalition orderings.

### Bass Diffusion Model

Models market adoption over time:

```
N(t) = m * (1 - e^(-(p+q)t)) / (1 + (q/p) * e^(-(p+q)t))
```

Where:
- p = innovation coefficient (external influence)
- q = imitation coefficient (word-of-mouth)
- m = market potential

## Legal References

- **Panduit Corp. v. Stahlin Bros. Fibre Works** (1978) - Lost profits test
- **Georgia-Pacific Corp. v. U.S. Plywood Corp.** (1970) - 15 factors for reasonable royalty
- **Uniloc Inc. v. Microsoft Corp.** (Fed. Cir. 2011) - Rejection of 25% rule
- **Ruckelshaus v. Monsanto Co.** (1984) - Trade secret damages framework

## Academic References

- Rubinstein, A. (1982). "Perfect Equilibrium in a Bargaining Model." *Econometrica*
- Shapley, L.S. (1953). "A Value for n-Person Games." *Contributions to the Theory of Games*
- Bass, F.M. (1969). "A New Product Growth Model for Consumer Durables." *Management Science*

## Technology Stack

- React 19 + TypeScript
- Tailwind CSS
- Chart.js for visualizations
- Vite for build tooling
- GitHub Pages for deployment

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

The site automatically deploys to GitHub Pages on push to `main` via GitHub Actions.

Manual deployment:
```bash
npm run deploy
```

## Disclaimer

This tool is for educational and illustrative purposes only. It is not legal advice and should not be relied upon for actual litigation. Consult qualified legal and economic experts for real cases.

## License

MIT
