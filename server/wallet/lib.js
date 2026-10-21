// Utilidades compartidas por las funciones de /api/wallet (Vercel, Node 20+).
// Los certificados viven en variables de entorno; nunca en el repositorio. Ver docs/WALLET.md.
import { readFileSync } from 'node:fs';

export const SITE = (process.env.SITE_URL || 'https://www.clubcrai.com').replace(/\/+$/, '');

// Acepta el PEM tal cual, con saltos de línea escritos como «\n», o codificado en base64.
const decodePem = (value) => {
  const v = String(value || '').trim();
  if (!v) return '';
  if (v.includes('-----BEGIN')) return v.replace(/\\n/g, '\n');
  return Buffer.from(v, 'base64').toString('utf8');
};

export const walletConfig = () => ({
  passTypeIdentifier: process.env.WALLET_PASS_TYPE_ID || '',
  teamIdentifier: process.env.WALLET_TEAM_ID || ''
});

export const isConfigured = () => {
  const c = walletConfig();
  return !!(c.passTypeIdentifier && c.teamIdentifier && process.env.WALLET_SIGNER_CERT && process.env.WALLET_SIGNER_KEY && process.env.WALLET_WWDR);
};

export const certificates = () => ({
  wwdr: decodePem(process.env.WALLET_WWDR),
  signerCert: decodePem(process.env.WALLET_SIGNER_CERT),
  signerKey: decodePem(process.env.WALLET_SIGNER_KEY),
  signerKeyPassphrase: process.env.WALLET_SIGNER_KEY_PASSPHRASE || undefined
});

// Imágenes fijas de los pases (server/wallet/model). Se leen una vez por instancia.
const cache = new Map();
export const image = (name) => {
  if (!cache.has(name)) cache.set(name, readFileSync(new URL(`./model/${name}`, import.meta.url)));
  return cache.get(name);
};

// El sitio también vive en web.app y GitHub Pages: el estado se consulta desde cualquier origen.
export const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

// Vercel ya interpreta formularios y JSON; en otros entornos se lee el cuerpo a mano.
export async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  let raw = typeof req.body === 'string' ? req.body : '';
  if (!raw) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 1024 * 1024) throw Object.assign(new Error('Cuerpo demasiado grande'), { status: 413 });
      chunks.push(chunk);
    }
    raw = Buffer.concat(chunks).toString('utf8');
  }
  const type = String(req.headers['content-type'] || '');
  if (type.includes('application/json')) return raw ? JSON.parse(raw) : {};
  return Object.fromEntries(new URLSearchParams(raw));
}

export function sendPass(res, buffer, filename) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.end(buffer);
}

// Estas rutas se abren con un formulario (navegación completa), así que los errores son una página.
export function sendError(res, status, message) {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Apple Wallet · CRAI Club</title>
<style>body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:24px;background:#0B0F1E;color:#EEF1F8;font:16px/1.5 system-ui,sans-serif;text-align:center}
main{max-width:420px}h1{font-size:24px;margin:0 0 10px}p{color:#B8B0F0}a,button{display:inline-flex;margin-top:18px;padding:12px 20px;border-radius:999px;border:0;background:#F2762E;color:#0B0F1E;font:600 15px system-ui;text-decoration:none;cursor:pointer}</style></head>
<body><main><h1>No pudimos crear tu pase</h1><p>${esc(message)}</p><button onclick="history.length>1?history.back():location.assign('${SITE}/')">Volver a CRAI Club</button></main></body></html>`);
}

// Fecha y hora de Mexicali (America/Tijuana), con su desfase real de horario de verano.
const TZ = 'America/Tijuana';
const parts = (date) => Object.fromEntries(new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short', timeZoneName: 'longOffset'
}).formatToParts(date).map((p) => [p.type, p.value]));
export function mexicaliDate(year, month, day, hh, mm) {
  // Se toma el desfase del mediodía de ese día para construir la hora local exacta.
  const noon = new Date(Date.UTC(year, month - 1, day, 19));
  const offset = (parts(noon).timeZoneName || 'GMT-08:00').replace('GMT', '') || '+00:00';
  const pad = (n) => String(n).padStart(2, '0');
  return new Date(`${year}-${pad(month)}-${pad(day)}T${pad(hh)}:${pad(mm)}:00${offset}`);
}
// Próximo jueves de Build Night: hoy si es jueves y aún no termina (22:00), si no el siguiente.
export function nextBuildNight(now = new Date()) {
  const p = parts(now);
  const dow = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday];
  let add = (4 - dow + 7) % 7;
  if (add === 0 && Number(p.hour) >= 22) add = 7;
  const base = new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day) + add));
  const y = base.getUTCFullYear();
  const m = base.getUTCMonth() + 1;
  const d = base.getUTCDate();
  return { start: mexicaliDate(y, m, d, 19, 0), end: mexicaliDate(y, m, d, 22, 0), y, m, d };
}
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const longDate = ({ m, d }) => `Jueves ${d} de ${MONTHS[m - 1]}`;
export const shortDate = ({ m, d }) => `${d} ${MONTHS[m - 1].slice(0, 3).toUpperCase()}`;
