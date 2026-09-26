const fs = require('fs');

const findings = JSON.parse(fs.readFileSync('scratch/audit_results_current.json', 'utf8'));

console.log('=== SMALL TARGET DETAILS ===');
const smallMap = {};
findings.filter(f => f.type === 'SMALL-TARGET').forEach(f => {
  const key = `${f.page} | ${f.selector} | ${f.message}`;
  smallMap[key] = (smallMap[key] || 0) + 1;
});
for (const [k, count] of Object.entries(smallMap)) {
  console.log(`${count}x: ${k}`);
}
