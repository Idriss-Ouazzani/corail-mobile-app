#!/usr/bin/env node
/**
 * Vérifie que package-lock.json n'embarque pas d'URL de registry interne
 * (risque : CI / EAS / autres devs ne peuvent pas installer).
 * Les seules origines acceptées pour "resolved" : registry.npmjs.org et liens file:/ intégrité locale.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const lockPath = join(root, 'package-lock.json');

const ALLOWED_PREFIX = 'https://registry.npmjs.org/';
const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
const bad = [];

if (lock.packages && typeof lock.packages === 'object') {
  for (const [name, pkg] of Object.entries(lock.packages)) {
    if (!pkg || typeof pkg !== 'object' || !pkg.resolved) continue;
    const r = String(pkg.resolved);
    if (r.startsWith('file:')) continue;
    if (r.startsWith(ALLOWED_PREFIX)) continue;
    bad.push({ name, resolved: r });
  }
}

if (bad.length > 0) {
  console.error(
    '[check-lockfile] Le package-lock.json contient des "resolved" hors registry public npmjs.org.\n' +
      'Ne pas commit tel quel si GitHub / EAS doivent installer sans proxy interne.\n'
  );
  for (const row of bad.slice(0, 20)) {
    console.error(`  ${row.name}\n    ${row.resolved}`);
  }
  if (bad.length > 20) console.error(`  ... et ${bad.length - 20} autre(s)`);
  process.exit(1);
}

console.log('[check-lockfile] OK — resolved pointent vers registry.npmjs.org (ou file:).');
