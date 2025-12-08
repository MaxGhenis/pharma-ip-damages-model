import React from 'react';
import { UncertaintyRange } from '../types';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  helpText?: string;
  disabled?: boolean;
}

export function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  helpText,
  disabled = false,
}: NumberInputProps) {
  return (
    <div className="space-y-1">
      <label className="data-label block">{label}</label>
      <div className="relative">
        {prefix && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span style={{ color: 'var(--text-muted)' }} className="text-sm">{prefix}</span>
          </div>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`input-field w-full ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-12' : ''}`}
          style={disabled ? { opacity: 0.5 } : undefined}
        />
        {suffix && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span style={{ color: 'var(--text-muted)' }} className="text-sm">{suffix}</span>
          </div>
        )}
      </div>
      {helpText && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{helpText}</p>}
    </div>
  );
}

interface RangeInputProps {
  label: string;
  value: UncertaintyRange;
  onChange: (value: UncertaintyRange) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: 'currency' | 'percent' | 'number';
  helpText?: string;
}

export function RangeInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.01,
  format = 'number',
  helpText,
}: RangeInputProps) {
  const formatValue = (v: number) => {
    if (format === 'percent') return `${(v * 100).toFixed(1)}%`;
    if (format === 'currency') {
      if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
      if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
      if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
      return `$${v.toFixed(0)}`;
    }
    return v.toLocaleString();
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBase = parseFloat(e.target.value);
    // Adjust low and high proportionally
    const ratio = value.base > 0 ? newBase / value.base : 1;
    onChange({
      low: value.low * ratio,
      base: newBase,
      high: value.high * ratio,
      distribution: value.distribution,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="data-label">{label}</label>
        <span className="data-value text-sm" style={{ color: 'var(--accent-gold)' }}>{formatValue(value.base)}</span>
      </div>

      <input
        type="range"
        min={min ?? value.low * 0.5}
        max={max ?? value.high * 1.5}
        step={step}
        value={value.base}
        onChange={handleSliderChange}
        className="w-full"
      />

      <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>Low: {formatValue(value.low)}</span>
        <span>High: {formatValue(value.high)}</span>
      </div>

      {helpText && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{helpText}</p>}
    </div>
  );
}

interface TripleInputProps {
  label: string;
  value: UncertaintyRange;
  onChange: (value: UncertaintyRange) => void;
  format?: 'currency' | 'percent' | 'number';
  helpText?: string;
}

export function TripleInput({
  label,
  value,
  onChange,
  format = 'number',
  helpText,
}: TripleInputProps) {
  const multiplier = format === 'percent' ? 100 : 1;
  const step = format === 'percent' ? 0.1 : format === 'currency' ? 1000000 : 0.01;

  const handleChange = (field: 'low' | 'base' | 'high', rawValue: number) => {
    const newValue = format === 'percent' ? rawValue / 100 : rawValue;
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  return (
    <div className="space-y-2">
      <label className="data-label">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Low</label>
          <input
            type="number"
            value={(value.low * multiplier).toFixed(format === 'percent' ? 1 : 0)}
            onChange={(e) => handleChange('low', parseFloat(e.target.value) || 0)}
            step={step}
            className="input-field w-full text-sm text-center"
            style={{ color: 'var(--accent-rose)' }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Base</label>
          <input
            type="number"
            value={(value.base * multiplier).toFixed(format === 'percent' ? 1 : 0)}
            onChange={(e) => handleChange('base', parseFloat(e.target.value) || 0)}
            step={step}
            className="input-field w-full text-sm text-center font-medium"
            style={{ color: 'var(--accent-gold)' }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>High</label>
          <input
            type="number"
            value={(value.high * multiplier).toFixed(format === 'percent' ? 1 : 0)}
            onChange={(e) => handleChange('high', parseFloat(e.target.value) || 0)}
            step={step}
            className="input-field w-full text-sm text-center"
            style={{ color: 'var(--accent-emerald)' }}
          />
        </div>
      </div>
      {helpText && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{helpText}</p>}
    </div>
  );
}
