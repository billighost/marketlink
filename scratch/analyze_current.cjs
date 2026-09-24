const fs = require('fs');

const findings = JSON.parse(fs.readFileSync('scratch/audit_results_current.json', 'utf8'));

console.log(`Total findings: ${findings.length}`);

// Group by type
const byType = {};
findings.forEach(f => {
  byType[f.type] = (byType[f.type] || 0) + 1;
});
console.log('\n--- BY TYPE ---');
console.table(byType);

// Group by page and type
const byPage = {};
findings.forEach(f => {
  if (!byPage[f.page]) byPage[f.page] = {};
  byPage[f.page][f.type] = (byPage[f.page][f.type] || 0) + 1;
});
console.log('\n--- BY PAGE & TYPE ---');
console.table(byPage);

// Inspect SMALL-TARGET elements
const smallTargets = {};
findings.filter(f => f.type === 'SMALL-TARGET').forEach(f => {
  const key = f.selector;
  smallTargets[key] = (smallTargets[key] || 0) + 1;
});
console.log('\n--- TOP SMALL TARGETS ---');
const sortedSmall = Object.entries(smallTargets).sort((a,b) => b[1] - a[1]).slice(0, 15);
console.log(sortedSmall);

// Inspect OVERFLOW
const overflows = {};
findings.filter(f => f.type === 'OVERFLOW').forEach(f => {
  const key = `${f.page} | ${f.selector} | ${f.message}`;
  overflows[key] = (overflows[key] || 0) + 1;
});
console.log('\n--- TOP OVERFLOWS ---');
const sortedOverflow = Object.entries(overflows).sort((a,b) => b[1] - a[1]).slice(0, 15);
console.log(sortedOverflow);

// Inspect OVERLAP
const overlaps = {};
findings.filter(f => f.type === 'OVERLAP').forEach(f => {
  const key = `${f.page} | ${f.selector} | ${f.message}`;
  overlaps[key] = (overlaps[key] || 0) + 1;
});
console.log('\n--- TOP OVERLAPS ---');
const sortedOverlap = Object.entries(overlaps).sort((a,b) => b[1] - a[1]).slice(0, 15);
console.log(sortedOverlap);

// Inspect SQUEEZED
const squeezed = {};
findings.filter(f => f.type === 'SQUEEZED').forEach(f => {
  const key = `${f.page} | ${f.selector} | ${f.message}`;
  squeezed[key] = (squeezed[key] || 0) + 1;
});
console.log('\n--- TOP SQUEEZED ---');
const sortedSqueezed = Object.entries(squeezed).sort((a,b) => b[1] - a[1]).slice(0, 15);
console.log(sortedSqueezed);

// Inspect DISTORTED-MEDIA
const distorted = {};
findings.filter(f => f.type === 'DISTORTED-MEDIA').forEach(f => {
  const key = `${f.page} | ${f.selector} | ${f.message}`;
  distorted[key] = (distorted[key] || 0) + 1;
});
console.log('\n--- TOP DISTORTED ---');
console.log(Object.entries(distorted));
