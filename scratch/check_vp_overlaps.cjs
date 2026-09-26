const fs = require('fs');
const findings = JSON.parse(fs.readFileSync('scratch/audit_results_current.json'));

const customerOverlaps = findings.filter(f => f.type === 'OVERLAP' && f.page.includes('Customer'));

const pairs = {};
customerOverlaps.forEach(f => {
  pairs[f.selector] = (pairs[f.selector] || 0) + 1;
});
console.log(pairs);
