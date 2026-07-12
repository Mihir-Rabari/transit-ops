import fs from 'fs';

const script = fs.readFileSync('scripts/fix-design.mjs', 'utf8');
const replacements = [];
const regex = /{ old: `([^`]*)`, new: `([^`]*)` }/g;
let m;
while ((m = regex.exec(script)) !== null) {
  replacements.push({ old: m[1], neu: m[2] });
}
console.log('Loaded', replacements.length, 'rules');

let content = fs.readFileSync('src/app/drivers/page.tsx', 'utf8');
for (let i=0; i<replacements.length; i++) {
  const r = replacements[i];
  if (!content.includes(r.old)) continue;
  content = content.split(r.old).join(r.neu);
}
fs.writeFileSync('src/app/drivers/page.tsx.test', content);

if (content.includes(' ,>') || content.includes(' ,\n')) {
  console.log('CORRUPTION DETECTED');
  const idx = content.indexOf(' ,');
  console.log('Context:', content.substring(idx-40, idx+40));
} else {
  console.log('No comma corruption detected');
}
