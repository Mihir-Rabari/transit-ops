import fs from 'fs';

const files = [
  'src/app/drivers/page.tsx',
  'src/app/vehicles/page.tsx',
  'src/app/maintenance/page.tsx',
  'src/app/fuel-expenses/page.tsx',
  'src/app/reports/page.tsx',
];

const replacements = [
  // Text color combos (replace longer ones first)
  ['text-slate-800 dark:text-slate-200', 'text-[var(--color-text-primary)]'],
  ['text-slate-700 dark:text-slate-300', 'text-[var(--color-text-primary)]'],
  ['text-slate-600 dark:text-slate-300', 'text-[var(--color-text-muted)]'],
  ['text-slate-500 dark:text-dark-muted', 'text-[var(--color-text-muted)]'],
  ['text-slate-900 dark:text-white', 'text-[var(--color-text-primary)]'],

  // Background combos
  ['bg-slate-100 dark:bg-slate-800', 'bg-[var(--color-surface-raised)]'],
  ['bg-slate-50/10 dark:bg-slate-900/10', 'bg-[var(--color-surface-raised)]'],
  ['bg-slate-50 dark:bg-slate-900', 'bg-[var(--color-surface-raised)]'],

  // Specific fuel-expenses registration badge
  ['font-mono text-2xs text-slate-400 dark:text-dark-muted bg-slate-50 dark:bg-slate-900 px-1 py-0.5 rounded', 'font-mono text-2xs bg-[var(--color-surface-raised)] px-1 py-0.5 rounded telemetry'],

  // Specific maintenance description
  ['text-sm text-slate-600 dark:text-slate-300', 'text-sm'],

  // Specific maintenance cost labels
  ['text-slate-400 uppercase font-bold tracking-wider', 'uppercase font-bold tracking-wider'],

  // Report chart descriptions
  ['text-2xs text-slate-400', 'text-2xs text-[var(--color-text-muted)]'],

  // Report legend items
  ['font-semibold text-slate-700 dark:text-slate-300', 'font-semibold'],
  ['ml-1.5 font-bold text-slate-900 dark:text-white', 'ml-1.5 font-bold'],

  // No data / empty state texts
  ['text-center text-slate-400', 'text-center text-[var(--color-text-muted)]'],

  // Brand colors
  ['text-brand-500', 'text-[var(--color-signal-amber)]'],
  ['text-emerald-500', 'text-[var(--color-signal-green)]'],

  // Shadows (remove)
  [' shadow-sm', ''],
  [' shadow-md', ''],
  [' hover:shadow-md', ''],

  // Rounded-xl in remaining contexts (mostly maintenance wrapper)
  ['rounded-xl border p-5 bg-white dark:bg-dark-card space-y-4 hover:shadow-md transition-all', 'rounded-lg border p-5 space-y-4 transition-all'],

  // Maintenance icon wrapper conditionals
  ["bg-amber-50 text-amber-600 dark:bg-amber-950/20", "bg-[rgba(255,176,32,0.12)] text-[var(--color-signal-amber)]"],
  ["bg-slate-100 text-slate-500 dark:bg-slate-900/40", "bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]"],

  // Vehicles document expiry badge conditionals
  ["bg-red-50 text-red-600 dark:bg-red-950/20", "status-badge--red"],
  ["bg-brand-50 text-brand-600 dark:bg-brand-950/20", "status-badge--amber"],

  // Report access denied / error colored cards (keep layout, remove generic light-mode backgrounds)
  ['bg-amber-50 dark:bg-amber-950/10', 'bg-[rgba(255,176,32,0.08)]'],
  ['bg-red-50 dark:bg-red-950/10', 'bg-[rgba(255,92,92,0.08)]'],
  ['text-amber-200', 'border-[rgba(255,176,32,0.3)]'],
  ['border-red-200', 'border-[rgba(255,92,92,0.3)]'],
  ['text-amber-800', 'text-[var(--color-signal-amber)]'],
  ['text-amber-600', 'text-[var(--color-signal-amber)]'],
  ['text-amber-500', 'text-[var(--color-signal-amber)]'],
  ['text-red-800', 'text-[var(--color-signal-red)]'],
  ['text-red-600', 'text-[var(--color-signal-red)]'],
  ['text-red-500', 'text-[var(--color-signal-red)]'],
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let total = 0;
  for (const [old, neu] of replacements) {
    if (!content.includes(old)) continue;
    const occurrences = content.split(old).length - 1;
    content = content.split(old).join(neu);
    total += occurrences;
  }
  fs.writeFileSync(file, content);
  console.log(`${file}: ${total} replacements`);
}
