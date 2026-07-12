import React from 'react';

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-[var(--color-surface-raised)] rounded w-3/4 skeleton"></div>
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto ops-panel w-full">
      <table className="min-w-full divide-y divide-[var(--color-border)] text-left text-sm">
        <thead className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'rgba(35,43,55,0.4)', color: 'var(--color-text-muted)' }}>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-6 py-4">
                <div className="h-3 bg-[var(--color-surface-raised)] rounded w-1/2 skeleton"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="ops-panel p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3 w-full">
          <div className="rounded-lg p-2.5 h-10 w-10 bg-[var(--color-surface-raised)] skeleton shrink-0" />
          <div className="space-y-2 w-full">
            <div className="h-4 bg-[var(--color-surface-raised)] rounded w-1/3 skeleton" />
            <div className="h-3 bg-[var(--color-surface-raised)] rounded w-1/4 skeleton" />
          </div>
        </div>
      </div>
      <div className="h-10 bg-[var(--color-surface-raised)] rounded w-full skeleton" />
      <div className="h-6 bg-[var(--color-surface-raised)] rounded w-1/2 skeleton" />
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonKanban() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, colIdx) => (
        <div key={colIdx} className="ops-panel p-3 space-y-4 min-h-[500px] border-t-2" style={{ borderColor: colIdx === 0 ? 'var(--color-border)' : colIdx === 1 ? 'var(--color-signal-amber)' : colIdx === 2 ? 'var(--color-signal-green)' : 'var(--color-signal-red)' }}>
          <div className="h-4 bg-[var(--color-surface-raised)] rounded w-1/2 skeleton mb-2" />
          {Array.from({ length: colIdx === 0 || colIdx === 1 ? 2 : 1 }).map((_, cardIdx) => (
            <div key={cardIdx} className="ops-panel p-4 space-y-3" style={{ background: 'var(--color-surface-raised)' }}>
              <div className="h-3 bg-[var(--color-base)] rounded w-3/4 skeleton" />
              <div className="h-3 bg-[var(--color-base)] rounded w-1/2 skeleton" />
              <div className="h-2 bg-[var(--color-base)] rounded w-1/4 skeleton" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
