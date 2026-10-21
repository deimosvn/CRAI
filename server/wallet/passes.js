// Los dos pases de CRAI Club: la credencial de miembro y la invitación al Build Night.
// Cada función devuelve el PKPass sin empaquetar; quien lo usa decide getAsBuffer() o getAsRaw().
import { randomUUID } from 'node:crypto';
import { PKPass } from 'passkit-generator';
import { SITE, certificates, image, longDate, nextBuildNight, shortDate, walletConfig } from './lib.js';

const DOORS = { founders: 'Founders', underground: 'Underground', both: 'Founders + Underground' };
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const VENUE = {
  name: 'Cervecería Averno',
  address: 'Av. República de Brasil 115, Cuauhtémoc Norte, Mexicali, B.C.',
  maps: 'https://www.google.com/maps/search/?api=1&query=Cervecer%C3%ADa%20Averno%2C%20Av.%20Rep%C3%BAblica%20de%20Brasil%20115%2C%20Cuauht%C3%A9moc%20Norte%2C%20Mexicali%2C%20B.C.'
};
const COLORS = { backgroundColor: 'rgb(11, 15, 30)', foregroundColor: 'rgb(255, 255, 255)' };
const clip = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

// Íconos y logo comunes a los dos pases (tamaños @1x, @2x y @3x de Apple).
const baseImages = () => ({
  'icon.png': image('icon.png'), 'icon@2x.png': image('icon@2x.png'), 'icon@3x.png': image('icon@3x.png'),
  'logo.png': image('logo.png'), 'logo@2x.png': image('logo@2x.png'), 'logo@3x.png': image('logo@3x.png')
});

function newPass(files, props) {
  return new PKPass(files, certificates(), {
    formatVersion: 1,
    ...walletConfig(),
    organizationName: 'CRAI Club',
    logoText: 'CRAI Club',
    ...COLORS,
    ...props
  });
}

// PNG enviado por el navegador (el personaje del miembro). Solo se acepta un PNG pequeño.
export function toonImage(dataUrl) {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!m) return null;
  const buf = Buffer.from(m[1], 'base64');
  const png = buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return png && buf.length < 400 * 1024 ? buf : null;
}

export function memberPass({ uid, profile, number, toon }) {
  const files = baseImages();
  if (toon) Object.assign(files, { 'thumbnail.png': toon, 'thumbnail@2x.png': toon, 'thumbnail@3x.png': toon });
  const door = DOORS[profile.door] || DOORS.both;
  const since = profile.createdAt ? new Date(profile.createdAt) : null;
  const link = `${SITE}/#p-${uid}`;
  const pass = newPass(files, {
    serialNumber: `member-${uid}`,
    description: 'Credencial de miembro de CRAI Club',
    labelColor: profile.door === 'underground' ? 'rgb(184, 166, 255)' : 'rgb(255, 176, 122)',
    sharingProhibited: false
  });
  pass.type = 'generic';
  pass.headerFields.push({ key: 'number', label: 'MIEMBRO', value: number ? `No. ${String(number).padStart(3, '0')}` : 'CRAI' });
  pass.primaryFields.push({ key: 'name', label: door.toUpperCase(), value: clip(profile.name, 60) || 'Miembro' });
  pass.secondaryFields.push({ key: 'role', label: 'QUÉ HACE', value: clip(profile.role, 60) || 'Miembro de CRAI' });
  pass.auxiliaryFields.push(
    { key: 'since', label: 'DESDE', value: since ? `${MONTHS[since.getMonth()]} ${since.getFullYear()}` : '2026' },
    { key: 'city', label: 'ZONA', value: clip(profile.zone, 30) || 'Mexicali' }
  );
  const back = [
    profile.building && { key: 'building', label: 'Qué está construyendo', value: clip(profile.building, 160) },
    profile.offers && { key: 'offers', label: 'Cómo puede ayudar', value: clip(profile.offers, 300) },
    profile.prefers && { key: 'prefers', label: 'Primer contacto preferido', value: clip(profile.prefers, 40) },
    { key: 'profile', label: 'Perfil en el club', value: link, attributedValue: `<a href="${link}">Ver perfil en clubcrai.com</a>` },
    ...['linkedin', 'github', 'web'].filter((k) => profile.links && profile.links[k]).map((k) => ({
      key: `link-${k}`, label: { linkedin: 'LinkedIn', github: 'GitHub', web: 'Portafolio' }[k], value: clip(profile.links[k], 200), dataDetectorTypes: ['PKDataDetectorTypeLink']
    })),
    { key: 'about', label: 'CRAI Club', value: 'El club de founders, makers y creadores de Mexicali. Escanea el código para ver este perfil.' }
  ].filter(Boolean);
  pass.backFields.push(...back);
  pass.setBarcodes({ message: link, format: 'PKBarcodeFormatQR', messageEncoding: 'iso-8859-1', altText: 'clubcrai.com' });
  return pass;
}

export function buildNightPass({ uid, name } = {}) {
  const night = nextBuildNight();
  const files = {
    ...baseImages(),
    'strip.png': image('strip.png'), 'strip@2x.png': image('strip@2x.png'), 'strip@3x.png': image('strip@3x.png')
  };
  const date = `${night.y}${String(night.m).padStart(2, '0')}${String(night.d).padStart(2, '0')}`;
  const pass = newPass(files, {
    serialNumber: `build-night-${date}-${uid || randomUUID()}`,
    description: `CRAI Build Night · ${longDate(night)}`,
    labelColor: 'rgb(255, 176, 122)',
    groupingIdentifier: 'crai-build-night'
  });
  pass.type = 'eventTicket';
  pass.headerFields.push({ key: 'date', label: 'JUEVES', value: shortDate(night) });
  pass.primaryFields.push({ key: 'event', label: 'CRAI', value: 'Build Night' });
  pass.secondaryFields.push(
    { key: 'when', label: 'FECHA', value: longDate(night) },
    { key: 'time', label: 'HORA', value: '19:00 – 22:00', textAlignment: 'PKTextAlignmentRight' }
  );
  pass.auxiliaryFields.push(
    { key: 'venue', label: 'LUGAR', value: VENUE.name },
    { key: 'guest', label: 'INVITADO', value: clip(name, 40) || 'Invitado de CRAI', textAlignment: 'PKTextAlignmentRight' }
  );
  pass.backFields.push(
    { key: 'address', label: 'Dirección', value: VENUE.address },
    { key: 'maps', label: 'Cómo llegar', value: VENUE.maps, attributedValue: `<a href="${VENUE.maps}">Abrir en Google Maps</a>` },
    { key: 'agenda', label: 'Cómo es la noche', value: '19:00 Llegas y abres tu laptop o tu protoboard\n19:15 Ronda rápida: qué vas a lograr hoy\n19:30 Trabajo profundo y ayuda entre mesas\n21:30 Demos de dos minutos\n22:00 Cierre y conexiones' },
    { key: 'site', label: 'CRAI Club', value: `${SITE}/#irl`, attributedValue: `<a href="${SITE}/#irl">clubcrai.com</a>` }
  );
  pass.setRelevantDate(night.start);
  pass.setExpirationDate(new Date(night.end.getTime() + 2 * 3600 * 1000));
  pass.setBarcodes({ message: uid ? `${SITE}/#p-${uid}` : `${SITE}/#irl`, format: 'PKBarcodeFormatQR', messageEncoding: 'iso-8859-1', altText: 'Build Night · CRAI Club' });
  return { pass, night };
}
