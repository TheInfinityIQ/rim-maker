import fs from 'node:fs';
import path from 'node:path';

const fixtures = JSON.parse(fs.readFileSync('e2e/.local/halo-cases.json', 'utf8'));
function reports(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? reports(target) : entry.name === 'coverage.json' ? [JSON.parse(fs.readFileSync(target, 'utf8'))] : [];
  });
}
const cases = reports('test-results').sort((a, b) => (a.pack + a.weapon).localeCompare(b.pack + b.weapon));
const summary = { expectedWeapons: fixtures.length, completedChecks: cases.length,
  completeSourceMatches: cases.filter(row => row.result === 'matched-source-fields').length,
  partialRecreations: cases.filter(row => row.result === 'partial-recreation').length,
  incompleteCases: fixtures.filter(source => !cases.some(row => row.pack === source.pack && row.weapon === source.gun.label)).map(source => source.gun.label), cases };
fs.mkdirSync('test-results', { recursive: true });
fs.writeFileSync('test-results/halo-summary.json', JSON.stringify(summary, null, 2));
const fields = [...new Set(cases.flatMap(row => row.differences.map(diff => diff.field)))].sort();
fs.writeFileSync('test-results/halo-summary.md', [
  '# Halo weapon browser recreation results', '',
  `Completed supported-field checks: **${summary.completedChecks}/${summary.expectedWeapons}**.`,
  `Original source-field matches: **${summary.completeSourceMatches}**. Partial recreations: **${summary.partialRecreations}**.`, '',
  'A passing click-through is not a full recreation. Each partial result records original fields that remain different or untested. This is not an in-game combat test.', '',
  '| Pack | Weapon | Result | Source-field differences |', '| --- | --- | --- | ---: |',
  ...cases.map(row => `| ${row.pack} | ${row.weapon} | ${row.result} | ${row.differences.length} |`), '',
  '## Fields requiring further coverage or editor support', '', ...fields.map(field => `- ${field}`), '',
  'See halo-summary.json and each case’s coverage.json for expected and exported values. Each successful case also retains its recreated-mod.zip.',
  ...(summary.incompleteCases.length ? ['', '## Incomplete cases', '', ...summary.incompleteCases.map(name => `- ${name}`)] : []), '',
].join('\n'));
console.log(`Halo coverage: ${summary.completedChecks}/${summary.expectedWeapons} completed; ${summary.completeSourceMatches} source matches, ${summary.partialRecreations} partial recreations.`);
