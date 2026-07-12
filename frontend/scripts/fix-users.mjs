import fs from 'fs';

// Load replacements from fix-design.mjs
const script1 = fs.readFileSync('scripts/fix-design.mjs', 'utf8');
const replacements = [];
const regex = /{ old: `([^`]*)`, new: `([^`]*)` }/g;
let m;
while ((m = regex.exec(script1)) !== null) {
  replacements.push({ old: m[1], neu: m[2] });
}

// Additional replacements matching final-colors.mjs for users
const extra = [
  ['text-slate-800 dark:text-white', 'text-[var(--color-text-primary)]'],
  ['text-slate-700 dark:text-slate-300', 'text-[var(--color-text-primary)]'],
  ['text-slate-600 dark:text-slate-300', 'text-[var(--color-text-muted)]'],
  ['text-slate-500 dark:text-dark-muted', 'text-[var(--color-text-muted)]'],
  ['text-slate-900 dark:text-white', 'text-[var(--color-text-primary)]'],
  ['text-xs text-slate-400', 'text-xs text-[var(--color-text-muted)]'],
  ['text-slate-400', 'text-[var(--color-text-muted)]'],
  ['bg-slate-100 dark:bg-slate-800', 'bg-[var(--color-surface-raised)]'],
  ['bg-slate-50 dark:bg-slate-900', 'bg-[var(--color-surface-raised)]'],
  ['bg-white dark:bg-dark-card shadow-sm', 'ops-panel'],
  ['bg-white dark:bg-dark-card', 'bg-[var(--color-surface)]'],
  ['border-slate-200 dark:border-dark-border', 'border-[var(--color-border)]'],
  ['border-slate-100 dark:border-dark-border', 'border-[var(--color-border)]'],
  ['text-brand-500', 'text-[var(--color-signal-amber)]'],
  ['text-emerald-500', 'text-[var(--color-signal-green)]'],
  ['text-brand-600', 'text-[var(--color-signal-amber)]'],
  ['bg-brand-600', 'bg-[var(--color-signal-amber)]'],
  ['border-brand-500', 'border-[var(--color-signal-amber)]'],
  [' shadow-sm', ''],
  [' shadow-md', ''],
  [' shadow-2xl', ''],
];

const file = 'src/app/users/page.tsx';
let content = fs.readFileSync(file, 'utf8');
let total = 0;

for (const r of replacements) {
  if (!content.includes(r.old)) continue;
  const occurrences = content.split(r.old).length - 1;
  content = content.split(r.old).join(r.neu);
  total += occurrences;
}

for (const [old, neu] of extra) {
  if (!old || !content.includes(old)) continue;
  const occurrences = content.split(old).length - 1;
  content = content.split(old).join(neu);
  total += occurrences;
}

fs.writeFileSync(file, content);
console.log(`${file}: ${total} replacements`);
