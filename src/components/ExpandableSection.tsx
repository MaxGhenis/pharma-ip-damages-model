import React, { useState } from 'react';

interface ExpandableSectionProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string | number;
  badgeColor?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'gold';
}

export function ExpandableSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
  badge,
  badgeColor = 'gold',
}: ExpandableSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const badgeClasses: Record<string, string> = {
    blue: 'badge-blue',
    green: 'badge-emerald',
    yellow: 'badge-gold',
    gold: 'badge-gold',
    red: 'badge-rose',
    gray: 'badge',
  };

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="expandable-header w-full text-left"
        data-open={isOpen}
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-4 h-4 transition-transform duration-200"
            style={{ color: 'var(--accent-gold-dim)', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            {subtitle && <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
          </div>
        </div>
        {badge !== undefined && (
          <span className={`badge ${badgeClasses[badgeColor]} font-mono`}>
            {badge}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {children}
        </div>
      )}
    </div>
  );
}
