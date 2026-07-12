import fs from 'fs';

const script = fs.readFileSync('scripts/fix-design.mjs', 'utf8');
const replacements = [];
const regex = /{ old: `([^`]*)`, new: `([^`]*)` }/g;
let m;
while ((m = regex.exec(script)) !== null) {
  replacements.push({ old: m[1], neu: m[2] });
}
console.log('Loaded', replacements.length, 'replacement rules from fix-design.mjs');

const files = [
  'src/app/drivers/page.tsx',
  'src/app/vehicles/page.tsx',
  'src/app/maintenance/page.tsx',
  'src/app/fuel-expenses/page.tsx',
  'src/app/reports/page.tsx',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let total = 0;
  for (const r of replacements) {
    if (!content.includes(r.old)) continue;
    const occurrences = content.split(r.old).length - 1;
    content = content.split(r.old).join(r.neu);
    total += occurrences;
  }
  fs.writeFileSync(file, content);
  console.log(`${file}: ${total} replacements applied`);
}
