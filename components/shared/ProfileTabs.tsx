'use client';

import { useId, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tab = { id: string; label: string; content: ReactNode };

export function ProfileTabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const [active, setActive] = useState(tabs[0].id);
  const baseId = useId();

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${baseId}-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`${baseId}-panel-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={cn(
              '-mb-px min-h-11 border-b-2 px-5 text-base font-semibold',
              active === tab.id
                ? 'border-primary text-primary-hover'
                : 'border-transparent text-ink-muted hover:text-ink'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={active !== tab.id}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
