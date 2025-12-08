import React from 'react';
import { DemoScenario, allScenarios } from '../models/demoScenarios';

interface ScenarioSelectorProps {
  selectedScenario: DemoScenario;
  onSelect: (scenario: DemoScenario) => void;
}

export function ScenarioSelector({ selectedScenario, onSelect }: ScenarioSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Select Scenario</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {allScenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario)}
            className={`text-left p-4 rounded-lg border-2 transition-all ${
              selectedScenario.id === scenario.id
                ? 'border-sky-500 bg-sky-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-gray-900">{scenario.name}</h3>
              <CaseTypeBadge type={scenario.caseType} />
            </div>
            <p className="mt-2 text-sm text-gray-600 line-clamp-3">{scenario.description}</p>
            {scenario.realCaseReference && (
              <p className="mt-2 text-xs text-gray-400 italic">{scenario.realCaseReference}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function CaseTypeBadge({ type }: { type: 'patent' | 'trade_secret' | 'hatch_waxman' }) {
  const styles = {
    patent: 'bg-blue-100 text-blue-800',
    trade_secret: 'bg-purple-100 text-purple-800',
    hatch_waxman: 'bg-green-100 text-green-800',
  };

  const labels = {
    patent: 'Patent',
    trade_secret: 'Trade Secret',
    hatch_waxman: 'ANDA',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}
