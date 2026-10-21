// Revisión rápida del sitio antes de publicar (npm run check):
// 1. Que todos los scripts tengan sintaxis válida.
// 2. Que todo lo que enlazan los HTML exista dentro de public/.
// 3. Que los JSON (manifest, firebase.json, índices) se puedan leer.
// No necesita dependencias: solo Node 20 o más reciente.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const errors = [];
const rel = (p) => relative(ROOT, p).split('\\').join('/');

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk(PUBLIC);

// 1. Sintaxis de JavaScript (firebase.js es un módulo ES).
for (const file of files.filter((f) => extname(f) === '.js')) {
  const isModule = /^\s*import\s/m.test(readFileSync(file, 'utf8'));
  try {
    if (isModule) execFileSync(process.execPath, ['--input-type=module', '--check'], { input: readFileSync(file), stdio: ['pipe', 'ignore', 'pipe'] });
    else execFileSync(process.execPath, ['--check', file], { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (e) {
    errors.push(`${rel(file)}: error de sintaxis\n${String(e.stderr || e.message).trim()}`);
  }
}

// 2. Referencias locales en los HTML (src, href) y en el manifest.
const local = (url) => url && !/^(https?:|mailto:|tel:|data:|#|javascript:)/i.test(url);
for (const file of files.filter((f) => extname(f) === '.html')) {
  const html = readFileSync(file, 'utf8');
  for (const [, url] of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) {
    if (!local(url)) continue;
    const clean = url.split(/[?#]/)[0];
    if (!clean || clean === './' || clean === '/') continue;
    const target = clean.startsWith('/') ? join(PUBLIC, clean) : join(dirname(file), clean);
    if (!existsSync(target)) errors.push(`${rel(file)}: no existe «${url}»`);
  }
}

// 3. JSON válidos.
for (const file of [join(PUBLIC, 'site.webmanifest'), join(ROOT, 'firebase.json'), join(ROOT, 'firestore.indexes.json'), join(ROOT, '.firebaserc')]) {
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    if (file.endsWith('site.webmanifest')) {
      for (const icon of data.icons || []) if (!existsSync(join(PUBLIC, icon.src))) errors.push(`site.webmanifest: no existe el ícono «${icon.src}»`);
    }
  } catch (e) {
    errors.push(`${rel(file)}: JSON inválido (${e.message})`);
  }
}

if (errors.length) {
  console.error(`✖ ${errors.length} problema(s):\n\n${errors.join('\n\n')}`);
  process.exit(1);
}
console.log(`✔ ${files.length} archivos revisados en public/: sintaxis, enlaces y JSON en orden.`);
