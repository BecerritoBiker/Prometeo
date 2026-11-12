import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const output = process.argv[2];
const profiles = [['Línea base', 'base'], ['Optimizada', 'optimizada']];
const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
const metrics = [
  ['first-contentful-paint', 1000], ['largest-contentful-paint', 1000],
  ['total-blocking-time', 1], ['cumulative-layout-shift', 1],
];

const rows = profiles.map(([name, key]) => {
  const report = JSON.parse(readFileSync(join(output, `${key}.report.json`), 'utf8'));
  const scores = categories.map((category) => {
    const score = report.categories[category]?.score;
    return score === null || score === undefined ? '—' : Math.round(100 * score);
  });
  const values = metrics.map(([id, unit]) => {
    const value = report.audits[id]?.numericValue;
    return Number.isFinite(value) ? (value / unit).toFixed(id === 'cumulative-layout-shift' ? 3 : 2) : '—';
  });
  if (scores.includes('—') || scores[1] < 90) process.exitCode = 1;
  console.log(`${name} · rendimiento ${scores[0]} · accesibilidad ${scores[1]} · ${report.finalDisplayedUrl}`);
  return `| ${name} | ${scores.join(' | ')} | ${values.join(' | ')} | ${report.fetchTime} | [Informe](${key}.report.html) |`;
});
writeFileSync(join(output, 'resumen.md'), [
  '# Comparación Lighthouse', '',
  '| Versión | Rendimiento | Accesibilidad | Buenas prácticas | SEO | FCP (s) | LCP (s) | TBT (ms) | CLS | Fecha UTC | Evidencia |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |',
  ...rows, '',
].join('\n'));
