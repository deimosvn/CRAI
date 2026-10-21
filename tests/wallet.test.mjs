// Pruebas de los pases de Apple Wallet con certificados de prueba generados aquí mismo.
// Apple no aceptaría estos pases (no los firma un certificado suyo), pero así se comprueba que
// el pase tiene los archivos, el manifiesto y la firma correctos. Se corre con: npm run test:wallet
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';
import forge from 'node-forge';

// Certificados de prueba: una «WWDR» falsa y un certificado de pase firmado por ella.
function testCertificates() {
  const pki = forge.pki;
  const make = (subject, issuer, keys, signKey, ca) => {
    const cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = String(Math.floor(Math.random() * 1e9));
    cert.validity.notBefore = new Date(Date.now() - 864e5);
    cert.validity.notAfter = new Date(Date.now() + 864e5 * 30);
    cert.setSubject([{ name: 'commonName', value: subject }]);
    cert.setIssuer([{ name: 'commonName', value: issuer }]);
    cert.setExtensions([{ name: 'basicConstraints', cA: ca }, { name: 'keyUsage', digitalSignature: true, keyCertSign: ca }]);
    cert.sign(signKey, forge.md.sha256.create());
    return cert;
  };
  const caKeys = pki.rsa.generateKeyPair(2048);
  const ca = make('Prueba WWDR', 'Prueba WWDR', caKeys, caKeys.privateKey, true);
  const keys = pki.rsa.generateKeyPair(2048);
  const signer = make('Pass Type ID: pass.com.clubcrai.prueba', 'Prueba WWDR', keys, caKeys.privateKey, false);
  return { wwdr: pki.certificateToPem(ca), cert: pki.certificateToPem(signer), key: pki.privateKeyToPem(keys.privateKey) };
}

let passes;
let certs;
before(async () => {
  certs = testCertificates();
  Object.assign(process.env, {
    WALLET_PASS_TYPE_ID: 'pass.com.clubcrai.prueba', WALLET_TEAM_ID: 'PRUEBA1234',
    WALLET_WWDR: certs.wwdr, WALLET_SIGNER_CERT: Buffer.from(certs.cert).toString('base64'), WALLET_SIGNER_KEY: certs.key.replace(/\n/g, '\\n')
  });
  passes = await import('../server/wallet/passes.js');
});

// Comprueba manifiesto (SHA-1 de cada archivo) y, si hay openssl, la firma PKCS#7 del manifiesto.
function checkBundle(files) {
  assert.ok(files['pass.json'] && files['manifest.json'] && files.signature, 'faltan pass.json, manifest.json o signature');
  const manifest = JSON.parse(files['manifest.json'].toString('utf8'));
  for (const [name, buf] of Object.entries(files)) {
    if (name === 'manifest.json' || name === 'signature') continue;
    assert.equal(manifest[name], createHash('sha1').update(buf).digest('hex'), `hash de ${name}`);
  }
  try { execFileSync('openssl', ['version'], { stdio: 'ignore' }); } catch (e) { return JSON.parse(files['pass.json']); }
  const dir = mkdtempSync(join(tmpdir(), 'crai-pass-'));
  try {
    writeFileSync(join(dir, 'manifest.json'), files['manifest.json']);
    writeFileSync(join(dir, 'signature'), files.signature);
    writeFileSync(join(dir, 'ca.pem'), certs.wwdr);
    execFileSync('openssl', ['smime', '-verify', '-binary', '-inform', 'DER', '-in', join(dir, 'signature'), '-content', join(dir, 'manifest.json'), '-CAfile', join(dir, 'ca.pem'), '-purpose', 'any', '-out', join(dir, 'out')], { stdio: 'pipe' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  return JSON.parse(files['pass.json']);
}

describe('pases de Apple Wallet', () => {
  test('credencial de miembro: datos, personaje y código QR al perfil', () => {
    const toonPng = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);
    const toon = passes.toonImage(`data:image/png;base64,${toonPng.toString('base64')}`);
    assert.ok(toon, 'acepta un PNG válido');
    assert.equal(passes.toonImage('data:image/png;base64,PHN2Zz4='), null, 'rechaza lo que no es PNG');
    const pass = passes.memberPass({
      uid: 'abc123', number: 7, toon,
      profile: { name: 'Ana Prueba', role: 'Diseño de producto', door: 'founders', zone: 'Centro', building: 'Una app para canchas', createdAt: '2026-10-21T16:00:00Z', links: { linkedin: 'linkedin.com/in/ana' } }
    });
    const files = pass.getAsRaw();
    assert.ok(files['thumbnail@2x.png'] && files['icon.png'] && files['logo@3x.png']);
    const json = checkBundle(files);
    assert.equal(json.passTypeIdentifier, 'pass.com.clubcrai.prueba');
    assert.equal(json.teamIdentifier, 'PRUEBA1234');
    assert.equal(json.generic.primaryFields[0].value, 'Ana Prueba');
    assert.equal(json.generic.headerFields[0].value, 'No. 007');
    assert.equal(json.barcodes[0].message, 'https://www.clubcrai.com/#p-abc123');
  });

  test('invitación al Build Night: jueves a las 19:00 en Cervecería Averno', () => {
    const { pass, night } = passes.buildNightPass({ uid: 'abc123', name: 'Ana Prueba' });
    const json = checkBundle(pass.getAsRaw());
    assert.equal(json.eventTicket.primaryFields[0].value, 'Build Night');
    assert.equal(json.eventTicket.auxiliaryFields[0].value, 'Cervecería Averno');
    assert.equal(json.eventTicket.auxiliaryFields[1].value, 'Ana Prueba');
    const start = new Date(json.relevantDate);
    const local = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Tijuana', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(start);
    assert.equal(local, 'Thu 19:00');
    assert.ok(new Date(json.expirationDate) > start);
    assert.ok(night.start.getTime() >= Date.now() - 3 * 3600 * 1000, 'es el próximo jueves, no uno pasado');
  });

  test('invitación sin sesión: a nombre de invitado', () => {
    const { pass } = passes.buildNightPass();
    const json = checkBundle(pass.getAsRaw());
    assert.equal(json.eventTicket.auxiliaryFields[1].value, 'Invitado de CRAI');
  });
});

// Respuesta mínima compatible con la de Node/Vercel.
const fakeRes = () => {
  const r = { statusCode: 200, headers: {}, body: null };
  r.setHeader = (k, v) => { r.headers[k.toLowerCase()] = v; };
  r.end = (b) => { r.body = b; };
  return r;
};

describe('rutas /api/wallet', () => {
  test('status avisa si Wallet está configurado', async () => {
    const { default: status } = await import('../api/wallet/status.js');
    const res = fakeRes();
    status({ method: 'GET', headers: {} }, res);
    assert.deepEqual(JSON.parse(res.body), { ready: true });
    assert.equal(res.headers['access-control-allow-origin'], '*');
  });
  test('build-night por GET entrega un .pkpass', async () => {
    const { default: route } = await import('../api/wallet/build-night.js');
    const res = fakeRes();
    await route({ method: 'GET', headers: {} }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['content-type'], 'application/vnd.apple.pkpass');
    assert.equal(Buffer.from(res.body).subarray(0, 2).toString(), 'PK');
  });
  test('member rechaza una sesión falsa y no acepta GET', async () => {
    const { default: route } = await import('../api/wallet/member.js');
    const bad = fakeRes();
    await route({ method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: { token: 'no-es-un-token' } }, bad);
    assert.equal(bad.statusCode, 401);
    assert.match(String(bad.body), /sesión venció/);
    const get = fakeRes();
    await route({ method: 'GET', headers: {} }, get);
    assert.equal(get.statusCode, 405);
  });
});
