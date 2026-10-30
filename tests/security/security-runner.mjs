/**
 * Momentum Security Test Runner
 * Executes all security suites and outputs a consolidated machine-readable JSON report.
 */

import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFiles = [
  path.join(__dirname, 'auth-session.test.mjs'),
  path.join(__dirname, 'authorization-idor.test.mjs'),
  path.join(__dirname, 'input-validation-injection.test.mjs'),
  path.join(__dirname, 'rate-limiting.test.mjs'),
  path.join(__dirname, 'api-config-security.test.mjs'),
  path.join(__dirname, 'concurrency-integrity.test.mjs'),
];

console.log('====================================================');
console.log('   MOMENTUM AUTOMATED SECURITY TESTING SUITE        ');
console.log('====================================================');
console.log(`Target: ${process.env.BASE_URL || 'http://127.0.0.1:3001'}`);
console.log(`Running ${testFiles.length} security test suites...\n`);

const testStream = run({
  files: testFiles,
  concurrency: 1, // Sequential execution for safety and isolation
});

testStream.compose(spec).pipe(process.stdout);

const results = {
  timestamp: new Date().toISOString(),
  target: process.env.BASE_URL || 'http://127.0.0.1:3001',
  suites: [],
  passed: 0,
  failed: 0,
};

testStream.on('test:pass', (t) => {
  results.passed++;
  results.suites.push({ name: t.name, status: 'PASSED', durationMs: t.details?.duration_ms });
});

testStream.on('test:fail', (t) => {
  results.failed++;
  results.suites.push({
    name: t.name,
    status: 'FAILED',
    error: t.details?.error?.message,
    durationMs: t.details?.duration_ms,
  });
});

testStream.on('end', () => {
  const outputPath = path.join(__dirname, '../../security-summary.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n✓ Security results written to: ${outputPath}`);
});

