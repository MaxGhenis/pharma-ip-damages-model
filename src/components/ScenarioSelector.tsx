import React from 'react';
import { DemoScenario, allScenarios } from '../models/demoScenarios';

interface ScenarioSelectorProps {
  selectedScenario: DemoScenario;
  onSelect: (scenario: DemoScenario) => void;
}

export function ScenarioSelector({ selectedScenario, onSelect }: ScenarioSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Select Scenario</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {allScenarios.map((scenario) => {
          const isSelected = selectedScenario.id === scenario.id;
          return (
            <button
              key={scenario.id}
              onClick={() => onSelect(scenario)}
              className="card text-left p-4 transition-all duration-200"
              style={{
                borderColor: isSelected ? 'var(--accent-gold)' : 'var(--border-subtle)',
                background: isSelected ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold" style={{ color: isSelected ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
                  {scenario.name}
                </h3>
                <CaseTypeBadge type={scenario.caseType} />
              </div>
              <p className="mt-2 text-sm line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                {scenario.description}
              </p>
              {scenario.realCaseReference && (
                <p className="mt-2 text-xs italic" style={{ color: 'var(--text-muted)' }}>
                  {scenario.realCaseReference}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CaseTypeBadge({ type }: { type: 'patent' | 'trade_secret' | 'hatch_waxman' }) {
  const badgeClasses: Record<string, string> = {
    patent: 'badge-blue',
    trade_secret: 'badge-rose',
    hatch_waxman: 'badge-emerald',
  };

  const labels = {
    patent: 'Patent',
    trade_secret: 'Trade Secret',
    hatch_waxman: 'ANDA',
  };

  return (
    <span className={`badge ${badgeClasses[type]}`}>
      {labels[type]}
    </span>
  );
}
