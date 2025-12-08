import React, { useState } from 'react';
import { CalculationStep as CalculationStepType } from '../types';
import { formatCurrency } from '../utils/uncertainty';

interface CalculationStepProps {
  step: CalculationStepType;
  depth?: number;
}

export function CalculationStepComponent({ step, depth = 0 }: CalculationStepProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);

  const hasChildren = step.children && step.children.length > 0;
  const indent = depth * 16;

  return (
    <div
      className="calc-step"
      style={{ marginLeft: `${indent}px` }}
    >
      <div className="py-2 px-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {hasChildren && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  style={{ color: 'var(--text-muted)' }}
                  className="hover:opacity-80 transition-opacity"
                >
                  <svg
                    className="w-4 h-4 transition-transform duration-200"
                    style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{step.label}</h4>
            </div>

            {step.formula && (
              <div
                className="mt-1 font-mono text-xs px-2 py-1 inline-block"
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--accent-gold)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '2px'
                }}
              >
                {step.formula}
              </div>
            )}

            {step.inputs.length > 0 && (
              <div className="mt-2 space-y-1">
                {step.inputs.map((input, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>{input.name}:</span>
                    <span className="font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {typeof input.value === 'number'
                        ? input.value > 1000
                          ? formatCurrency(input.value)
                          : input.value.toLocaleString(undefined, { maximumFractionDigits: 4 })
                        : input.value}
                    </span>
                    {input.source && (
                      <span className="italic" style={{ color: 'var(--text-muted)' }}>({input.source})</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {step.notes && (
              <p className="mt-2 text-xs italic" style={{ color: 'var(--text-muted)' }}>{step.notes}</p>
            )}
          </div>

          <div className="text-right">
            <div className="data-value text-lg" style={{ color: 'var(--accent-gold)' }}>
              {typeof step.result === 'number' && step.result > 1000
                ? formatCurrency(step.result)
                : step.result?.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </div>
            {step.resultUncertainty && (
              <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                {formatCurrency(step.resultUncertainty.low)} - {formatCurrency(step.resultUncertainty.high)}
              </div>
            )}
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {step.children!.map((child, i) => (
            <CalculationStepComponent key={child.id || i} step={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface CalculationStepsListProps {
  steps: CalculationStepType[];
  title?: string;
}

export function CalculationStepsList({ steps, title }: CalculationStepsListProps) {
  return (
    <div className="space-y-2">
      {title && <h3 className="data-label mb-3">{title}</h3>}
      {steps.map((step, i) => (
        <CalculationStepComponent key={step.id || i} step={step} />
      ))}
    </div>
  );
}
