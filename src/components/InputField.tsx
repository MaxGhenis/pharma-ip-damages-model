import React, { useState } from 'react';
import { UncertaintyRange } from '../types';
import { SourceCitation } from '../types/validation';

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
  inputPath?: string;
  source?: SourceCitation;
  onSourceChange?: (path: string, source: SourceCitation | undefined) => void;
}

export function TripleInput({
  label,
  value,
  onChange,
  format = 'number',
  helpText,
  inputPath,
  source,
  onSourceChange,
}: TripleInputProps) {
  const [showSourceEditor, setShowSourceEditor] = useState(false);
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
      <div className="flex items-center justify-between">
        <label className="data-label">{label}</label>
        {inputPath && onSourceChange && (
          <button
            type="button"
            onClick={() => setShowSourceEditor(!showSourceEditor)}
            className="text-xs px-2 py-0.5 rounded transition-colors"
            style={{
              background: source ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)',
              color: source ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            }}
            title={source ? `Source: ${source.document}` : 'Add source citation'}
          >
            {source ? '✓ Sourced' : '+ Source'}
          </button>
        )}
      </div>
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

      {showSourceEditor && inputPath && onSourceChange && (
        <SourceCitationEditor
          source={source}
          onChange={(newSource) => onSourceChange(inputPath, newSource)}
          onClose={() => setShowSourceEditor(false)}
        />
      )}
    </div>
  );
}

const SOURCE_TYPES: { value: SourceCitation['sourceType']; label: string }[] = [
  { value: 'sec_filing', label: 'SEC Filing (10-K, 10-Q)' },
  { value: 'market_data', label: 'Market Data (IMS, IQVIA)' },
  { value: 'comparable_license', label: 'Comparable License' },
  { value: 'industry_report', label: 'Industry Report' },
  { value: 'academic_study', label: 'Academic Study' },
  { value: 'court_record', label: 'Court Record' },
  { value: 'company_internal', label: 'Company Internal Document' },
  { value: 'public_data', label: 'Public Data (FDA, CMS)' },
  { value: 'expert_opinion', label: 'Expert Opinion' },
  { value: 'assumption', label: 'Assumption (requires justification)' },
];

interface SourceCitationEditorProps {
  source?: SourceCitation;
  onChange: (source: SourceCitation | undefined) => void;
  onClose: () => void;
}

function SourceCitationEditor({ source, onChange, onClose }: SourceCitationEditorProps) {
  const [localSource, setLocalSource] = useState<Partial<SourceCitation>>(
    source || { sourceType: 'sec_filing', document: '' }
  );

  const handleSave = () => {
    if (localSource.document && localSource.sourceType) {
      onChange(localSource as SourceCitation);
      onClose();
    }
  };

  const handleClear = () => {
    onChange(undefined);
    onClose();
  };

  return (
    <div
      className="mt-2 p-3 rounded-lg border space-y-3"
      style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Source Citation
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          ✕
        </button>
      </div>

      <div>
        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
          Source Type
        </label>
        <select
          value={localSource.sourceType || 'sec_filing'}
          onChange={(e) =>
            setLocalSource({ ...localSource, sourceType: e.target.value as SourceCitation['sourceType'] })
          }
          className="input-field w-full text-sm"
        >
          {SOURCE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
          Document Name *
        </label>
        <input
          type="text"
          value={localSource.document || ''}
          onChange={(e) => setLocalSource({ ...localSource, document: e.target.value })}
          placeholder="e.g., AbbVie 2023 10-K"
          className="input-field w-full text-sm"
        />
      </div>

      <div>
        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
          Location (page, exhibit, etc.)
        </label>
        <input
          type="text"
          value={localSource.location || ''}
          onChange={(e) => setLocalSource({ ...localSource, location: e.target.value })}
          placeholder="e.g., Page 45, Note 12"
          className="input-field w-full text-sm"
        />
      </div>

      {localSource.sourceType === 'assumption' && (
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            Justification *
          </label>
          <textarea
            value={localSource.justification || ''}
            onChange={(e) => setLocalSource({ ...localSource, justification: e.target.value })}
            placeholder="Explain the basis for this assumption..."
            className="input-field w-full text-sm"
            rows={2}
          />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!localSource.document}
          className="flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors"
          style={{
            background: localSource.document ? 'var(--accent-emerald)' : 'var(--bg-secondary)',
            color: localSource.document ? 'white' : 'var(--text-muted)',
          }}
        >
          Save Source
        </button>
        {source && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1.5 rounded text-xs"
            style={{ background: 'rgba(248, 113, 113, 0.15)', color: 'var(--accent-rose)' }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
