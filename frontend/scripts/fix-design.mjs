import fs from 'fs';

const files = [
  'src/app/drivers/page.tsx',
  'src/app/vehicles/page.tsx',
  'src/app/maintenance/page.tsx',
  'src/app/fuel-expenses/page.tsx',
  'src/app/reports/page.tsx',
];

const replacements = [
  // text-slate-800 / text-primary colors
  { old: `className="text-xl font-bold text-slate-800 dark:text-white"`, new: `className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}` },
  { old: `className="font-bold text-slate-800 dark:text-white"`, new: `className="font-bold" style={{ color: 'var(--color-text-primary)' }}` },
  { old: `className="font-bold text-slate-800 dark:text-white flex items-center"`, new: `className="font-bold flex items-center" style={{ color: 'var(--color-text-primary)' }}` },
  { old: `className="font-semibold text-slate-800 dark:text-white"`, new: `className="font-semibold" style={{ color: 'var(--color-text-primary)' }}` },
  { old: `className="font-semibold text-slate-800 dark:text-slate-200"`, new: `className="font-semibold" style={{ color: 'var(--color-text-primary)' }}` },
  { old: `className="text-sm font-bold text-slate-800 dark:text-slate-200"`, new: `className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}` },

  // text-slate-400 / text-muted colors
  { old: `className="text-sm text-slate-400 dark:text-dark-muted"`, new: `className="text-sm" style={{ color: 'var(--color-text-muted)' }}` },
  { old: `className="text-xs text-slate-400 dark:text-dark-muted"`, new: `className="text-xs" style={{ color: 'var(--color-text-muted)' }}` },
  { old: `className="text-2xs text-slate-400 dark:text-dark-muted"`, new: `className="text-2xs" style={{ color: 'var(--color-text-muted)' }}` },
  { old: `className="mt-1 text-xs text-slate-400 dark:text-dark-muted"`, new: `className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}` },
  { old: `className="text-xs text-slate-400 dark:text-dark-muted text-center py-12"`, new: `className="text-xs text-center py-12" style={{ color: 'var(--color-text-muted)' }}` },
  { old: `className="text-xs text-slate-400 dark:text-dark-muted flex items-center"`, new: `className="text-xs flex items-center" style={{ color: 'var(--color-text-muted)' }}` },
  { old: `className="text-2xs text-slate-400 dark:text-dark-muted capitalize"`, new: `className="text-2xs capitalize" style={{ color: 'var(--color-text-muted)' }}` },

  // text-slate-500 / text-muted (labels, headers)
  { old: `className="block text-xs font-bold text-slate-500 uppercase mb-1"`, new: `className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}` },
  { old: `className="text-xs font-bold text-slate-500 uppercase tracking-wider"`, new: `className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}` },
  { old: `className="text-xs font-bold text-slate-400 uppercase tracking-wider"`, new: `className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}` },
  { old: `className="text-xs font-bold text-slate-400 uppercase"`, new: `className="text-xs font-bold uppercase" style={{ color: 'var(--color-text-muted)' }}` },
  { old: `className="block text-3xs font-bold text-slate-400 uppercase mb-1"`, new: `className="block text-3xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}` },
  { old: `className="block text-3xs font-bold text-slate-400 uppercase"`, new: `className="block text-3xs font-bold uppercase" style={{ color: 'var(--color-text-muted)' }}` },

  // text-slate-700 / text-primary
  { old: `className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300"`, new: `className="telemetry text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}` },
  { old: `className="text-md font-bold text-slate-700 dark:text-slate-300"`, new: `className="text-md font-bold" style={{ color: 'var(--color-text-muted)' }}` },
  { old: `className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center"`, new: `className="text-xs font-medium flex items-center" style={{ color: 'var(--color-text-primary)' }}` },
  { old: `className="px-6 py-4 text-slate-500 dark:text-dark-muted font-medium"`, new: `className="px-6 py-4 font-medium" style={{ color: 'var(--color-text-muted)' }}` },
  { old: `className="text-xs text-slate-700 dark:text-slate-300 flex items-center mt-1"`, new: `className="text-xs flex items-center mt-1" style={{ color: 'var(--color-text-primary)' }}` },
  { old: `className="font-semibold text-slate-700 dark:text-slate-300 capitalize"`, new: `className="font-semibold capitalize" style={{ color: 'var(--color-text-primary)' }}` },
  { old: `className="font-semibold text-slate-700 dark:text-slate-300 truncate"`, new: `className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}` },

  // Inputs
  { old: `className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"`, new: `className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}` },
  { old: `className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"`, new: `className="w-full rounded-md border py-2 pl-10 pr-4 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}` },
  { old: `className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"`, new: `className="w-full rounded-md border px-2 py-1.5 text-xs focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}` },
  { old: `className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"`, new: `className="rounded-md border px-3 py-1.5 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}` },
  { old: `className="w-full mt-1 rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-brand-500 dark:border-dark-border dark:bg-slate-900 dark:text-white"`, new: `className="w-full mt-1 rounded-md border px-2 py-1.5 text-xs focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}` },
  { old: `className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"`, new: `className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}` },
  { old: `className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"`, new: `className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}` },

  // Textarea (maintenance)
  { old: `className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"`, new: `className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}` },

  // Buttons
  { old: `className="flex items-center space-x-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-md transition-all self-start sm:self-auto"`, new: `className="btn-primary self-start sm:self-auto"` },
  { old: `className="w-full sm:w-auto rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"`, new: `className="btn-primary w-full sm:w-auto px-6 py-2.5 text-sm"` },
  { old: `className="w-full flex items-center justify-center space-x-1 rounded bg-brand-600 py-2 text-xs font-semibold text-white hover:bg-brand-700"`, new: `className="btn-primary w-full justify-center py-2 text-xs"` },
  { old: `className="flex w-full items-center justify-center space-x-1.5 rounded-lg bg-brand-600 py-2 text-xs font-semibold text-white hover:bg-brand-700"`, new: `className="btn-primary w-full justify-center py-2 text-xs"` },
  { old: `className="flex w-full items-center justify-center space-x-1.5 rounded-lg bg-brand-600 py-2.5 text-xs font-semibold text-white hover:bg-brand-700 shadow-sm"`, new: `className="btn-primary w-full justify-center py-2.5 text-xs"` },
  { old: `className="flex items-center space-x-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-700 shadow-sm"`, new: `className="btn-primary px-4 py-2.5 text-xs"` },
  { old: `className="flex items-center space-x-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-700 shadow-sm"`, new: `className="btn-primary px-3.5 py-2 text-xs"` },
  { old: `className="w-full rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 shadow-md"`, new: `className="btn-primary w-full py-3 text-sm"` },

  // Ghost/outline button (reports Print button, fuel-expenses expense button)
  { old: `className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-slate-300 dark:hover:bg-slate-800"`, new: `className="btn-ghost px-4 py-2.5 text-xs"` },
  { old: `className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-slate-300 dark:hover:bg-slate-800"`, new: `className="btn-ghost px-3.5 py-2 text-xs"` },

  // Tab buttons (fuel-expenses)
  { old: `className={\`pb-3 border-b-2 transition-colors \${activeTab === 'summary' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}\`}`, new: `className={\`pb-3 border-b-2 transition-colors \${activeTab === 'summary' ? 'border-[var(--color-signal-amber)] text-[var(--color-signal-amber)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}\`}` },
  { old: `className={\`pb-3 border-b-2 transition-colors \${activeTab === 'fuel' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}\`}`, new: `className={\`pb-3 border-b-2 transition-colors \${activeTab === 'fuel' ? 'border-[var(--color-signal-amber)] text-[var(--color-signal-amber)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}\`}` },
  { old: `className={\`pb-3 border-b-2 transition-colors \${activeTab === 'expenses' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}\`}`, new: `className={\`pb-3 border-b-2 transition-colors \${activeTab === 'expenses' ? 'border-[var(--color-signal-amber)] text-[var(--color-signal-amber)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}\`}` },

  // Wrappers
  { old: `className="rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-md animate-fadeIn"`, new: `className="ops-panel p-5 animate-fadeIn"` },
  { old: `className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-dark-border dark:bg-dark-card"`, new: `className="ops-panel p-8 text-center"` },
  { old: `className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-dark-border dark:bg-dark-card shadow-sm"`, new: `className="overflow-x-auto ops-panel"` },
  { old: `className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-dark-border dark:bg-dark-card shadow-sm"`, new: `className="ops-panel flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"` },

  // Chart cards (reports)
  { old: `className="rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-sm print:border-slate-300 print:shadow-none"`, new: `className="ops-panel p-5 print:shadow-none"` },

  // Form header borders
  { old: `className="mb-4 flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border"`, new: `className="mb-4 flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}` },

  // Close buttons
  { old: `className="text-slate-400 hover:text-slate-600"`, new: `className="hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}` },

  // Search icons
  { old: `className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"`, new: `className="absolute inset-y-0 left-0 flex items-center pl-3" style={{ color: 'var(--color-text-muted)' }}` },

  // Table
  { old: `className="min-w-full divide-y divide-slate-200 dark:divide-dark-border text-left text-sm"`, new: `className="min-w-full divide-y divide-[var(--color-border)] text-left text-sm"` },
  { old: `className="bg-slate-50/70 dark:bg-slate-900/40 text-xs font-semibold text-slate-400 dark:text-dark-muted uppercase tracking-wider"`, new: `className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'rgba(35,43,55,0.4)', color: 'var(--color-text-muted)' }}` },

  // Row hover
  { old: `className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors"`, new: `className="transition-colors hover:bg-[var(--color-surface-raised)]"` },

  // Empty states
  { old: `className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3"`, new: `className="mx-auto h-12 w-12 mb-3" style={{ color: 'var(--color-text-muted)', opacity: 0.3 }}` },

  // Spinners
  { old: `className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent"`, new: `className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent" style={{ borderColor: 'var(--color-signal-amber)' }}` },
  { old: `className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-r-transparent"`, new: `className="h-6 w-6 animate-spin rounded-full border-2 border-r-transparent" style={{ borderColor: 'var(--color-signal-amber)' }}` },

  // Modal wrappers
  { old: `className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-card border border-slate-100 dark:border-dark-border"`, new: `className="w-full max-w-lg ops-panel p-6"` },
  { old: `className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-card border border-slate-100 dark:border-dark-border"`, new: `className="w-full max-w-md ops-panel p-6"` },

  // Modal headers
  { old: `className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border mb-4"`, new: `className="flex items-center justify-between pb-3 mb-4" style={{ borderBottom: '1px solid var(--color-border)' }}` },

  // Error messages
  { old: `className="mb-4 rounded bg-red-50 p-2.5 text-xs font-semibold text-red-500"`, new: `className="mb-4 rounded p-2.5 text-xs font-semibold" style={{ background: 'rgba(255,92,92,0.1)', color: 'var(--color-signal-red)' }}` },
  { old: `className="mb-3 rounded bg-red-50 p-2 text-2xs font-semibold text-red-500"`, new: `className="mb-3 rounded p-2 text-2xs font-semibold" style={{ background: 'rgba(255,92,92,0.1)', color: 'var(--color-signal-red)' }}` },

  // Avatars
  { old: `className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-850 font-semibold text-slate-600 dark:text-slate-300"`, new: `className="flex h-9 w-9 items-center justify-center rounded-full font-semibold" style={{ background: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}` },

  // Icons
  { old: `className="mr-1 text-slate-400"`, new: `className="mr-1" style={{ color: 'var(--color-text-muted)' }}` },
  { old: `className="mr-1.5 text-slate-400"`, new: `className="mr-1.5" style={{ color: 'var(--color-text-muted)' }}` },
  { old: `className="mr-2 text-brand-500"`, new: `className="mr-2" style={{ color: 'var(--color-signal-amber)' }}` },

  // Document button in table
  { old: `className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"`, new: `className="transition-colors hover:opacity-80" style={{ color: 'var(--color-text-muted)' }}` },

  // Upload sections
  { old: `className="border-r border-slate-100 dark:border-dark-border pr-0 md:pr-6 space-y-3"`, new: `className="border-r border-[var(--color-border)] pr-0 md:pr-6 space-y-3"` },
  { old: `className="border-t border-slate-100 pt-4 dark:border-dark-border"`, new: `className="border-t border-[var(--color-border)] pt-4"` },

  // File input
  { old: `className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-3xs file:bg-slate-100 hover:file:bg-slate-200 dark:file:bg-slate-800"`, new: `className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-3xs" style={{ color: 'var(--color-text-muted)' }}` },

  // Doc list items
  { old: `className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900/10 border border-slate-100 dark:border-dark-border text-xs"`, new: `className="flex items-center justify-between p-2 rounded border text-xs" style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}` },
  { old: `className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-100 dark:border-dark-border"`, new: `className="flex justify-between items-center p-3 rounded-lg border" style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}` },

  // Doc type badge
  { old: `className="inline-block text-4xs font-mono font-bold bg-slate-200/50 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-500"`, new: `className="inline-block text-4xs telemetry font-bold px-1 py-0.5 rounded" style={{ background: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}` },

  // Doc open link
  { old: `className="text-xs font-bold text-brand-600 hover:underline shrink-0"`, new: `className="text-xs font-bold hover:underline shrink-0" style={{ color: 'var(--color-signal-amber)' }}` },

  // Brand icon wrappers
  { old: `className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400"`, new: `className="rounded-lg p-2" style={{ background: 'rgba(255,176,32,0.12)', color: 'var(--color-signal-amber)' }}` },

  // Operational cost
  { old: `className="text-2xs text-brand-600 dark:text-brand-400 font-medium"`, new: `className="text-2xs font-medium" style={{ color: 'var(--color-signal-amber)' }}` },

  // Registration number badge
  { old: `className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-2xs mr-2"`, new: `className="telemetry bg-[var(--color-surface-raised)] px-1 py-0.5 rounded text-2xs mr-2" style={{ color: 'var(--color-text-muted)' }}` },
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log(`SKIP (not found): ${file}`);
    continue;
  }
  let content = fs.readFileSync(file, 'utf8');
  let total = 0;
  const missing = [];
  for (const { old, neu } of replacements) {
    if (!content.includes(old)) {
      continue;
    }
    const occurrences = content.split(old).length - 1;
    content = content.split(old).join(neu);
    total += occurrences;
  }
  fs.writeFileSync(file, content);
  console.log(`${file}: ${total} replacements`);
}
console.log(JSON.stringify(replacements[0], null, 2));
