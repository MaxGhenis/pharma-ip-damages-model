import React, { useState } from 'react';

interface ExpandableSectionProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string | number;
  badgeColor?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
}

export function ExpandableSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
  badge,
  badgeColor = 'blue',
}: ExpandableSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const badgeColors = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {badge !== undefined && (
          <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${badgeColors[badgeColor]}`}>
            {badge}
          </span>
        )}
      </button>
      {isOpen && <div className="px-4 py-4 border-t border-gray-100">{children}</div>}
    </div>
  );
}
