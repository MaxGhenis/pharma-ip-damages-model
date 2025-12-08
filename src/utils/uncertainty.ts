import { UncertaintyRange, MonteCarloResult } from '../types';

// Random number generators for different distributions
export function sampleTriangular(low: number, mode: number, high: number): number {
  const u = Math.random();
  const fc = (mode - low) / (high - low);

  if (u < fc) {
    return low + Math.sqrt(u * (high - low) * (mode - low));
  } else {
    return high - Math.sqrt((1 - u) * (high - low) * (high - mode));
  }
}

export function sampleNormal(mean: number, std: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}

export function sampleLogNormal(mean: number, std: number): number {
  // Convert to log-normal parameters
  const variance = std * std;
  const mu = Math.log(mean * mean / Math.sqrt(variance + mean * mean));
  const sigma = Math.sqrt(Math.log(1 + variance / (mean * mean)));

  return Math.exp(sampleNormal(mu, sigma));
}

export function sampleUniform(low: number, high: number): number {
  return low + Math.random() * (high - low);
}

export function sampleUncertainty(range: UncertaintyRange): number {
  const { low, base, high, distribution = 'triangular' } = range;

  switch (distribution) {
    case 'triangular':
      return sampleTriangular(low, base, high);
    case 'normal':
      // Approximate std from range (assume 95% confidence)
      const std = (high - low) / 4;
      return sampleNormal(base, std);
    case 'lognormal':
      const logStd = (high - low) / 4;
      return sampleLogNormal(base, logStd);
    case 'uniform':
      return sampleUniform(low, high);
    default:
      return base;
  }
}

export function runMonteCarlo(
  fn: () => number,
  iterations: number = 10000
): MonteCarloResult {
  const samples: number[] = [];

  for (let i = 0; i < iterations; i++) {
    samples.push(fn());
  }

  samples.sort((a, b) => a - b);

  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const median = samples[Math.floor(samples.length / 2)];
  const variance = samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / samples.length;
  const std = Math.sqrt(variance);

  // Percentiles
  const percentile = (p: number) => samples[Math.floor(samples.length * p / 100)];

  // Histogram
  const min = samples[0];
  const max = samples[samples.length - 1];
  const binCount = 50;
  const binWidth = (max - min) / binCount;
  const histogram: { bin: number; count: number }[] = [];

  for (let i = 0; i < binCount; i++) {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    const count = samples.filter(x => x >= binStart && x < binEnd).length;
    histogram.push({ bin: binStart + binWidth / 2, count });
  }

  return {
    mean,
    median,
    std,
    percentile5: percentile(5),
    percentile25: percentile(25),
    percentile75: percentile(75),
    percentile95: percentile(95),
    histogram,
    samples: samples.slice(0, 1000), // Keep subset for visualization
  };
}

export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (Math.abs(value) >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function createRange(
  low: number,
  base: number,
  high: number,
  distribution: UncertaintyRange['distribution'] = 'triangular'
): UncertaintyRange {
  return { low, base, high, distribution };
}
