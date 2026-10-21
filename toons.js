/* CRAI Club · personajes: caras caricatura que funcionan como foto de perfil.
   Trazo de tinta irregular (como hecho a mano), colores planos de la marca, cabeza en distintos
   ángulos, expresiones con personalidad y un detalle de la profesión. */
(function () {
  'use strict';
  const C = window.CRAI;
  const INK = '#0B0F1E';

  const T = (C.TOON = {
    skin: ['#FBDCC4', '#F0BE98', '#D99C6C', '#B3784A', '#7E4F2E'],
    hairColor: ['#1A1613', '#4A2D1C', '#8B5A32', '#D29A4C', '#9A9FAE', '#6E52F5', '#E0566E'],
    bg: ['#FFD9B8', '#CFDBFF', '#DCD3FF', '#C6EEDC', '#FFD3DC', '#FFEBA8', '#CDEBF5'],
    shirt: ['#2F5BEA', '#F2762E', '#6E52F5', '#0E9F74', '#D9445B', '#1B2440', '#F2B33D'],
    hair: ['corto', 'ondas', 'rizos', 'bob', 'chongos', 'largo', 'coleta', 'rapado', 'cresta', 'mono'],
    acc: ['ninguno', 'goggles', 'audifonos', 'lentes', 'lentesSol', 'lapiz', 'casco', 'gorro', 'corbata', 'gafete', 'boina', 'sombrero', 'antena', 'aretes', 'flor', 'bandana'],
    eyes: ['punto', 'felices', 'guino', 'grandes', 'sueno', 'pestanas'],
    mouth: ['sonrisa', 'ondas', 'risa', 'o', 'ladeada', 'lengua'],
    doodle: ['ninguno', 'destellos', 'corazon', 'rayitas', 'garabato'],
    labels: {
      hair: { corto: 'Corto', ondas: 'Ondas', rizos: 'Rizos', bob: 'Flequillo', chongos: 'Chongos', largo: 'Largo', coleta: 'Coleta', rapado: 'Rapado', cresta: 'Cresta', mono: 'Chongo alto' },
      acc: { ninguno: 'Ninguno', goggles: 'Goggles de soldar', audifonos: 'Audífonos', lentes: 'Lentes', lentesSol: 'Lentes de sol', lapiz: 'Lápiz', casco: 'Casco', gorro: 'Gorro', corbata: 'Corbata', gafete: 'Gafete', boina: 'Boina', sombrero: 'Sombrero', antena: 'Antenas', aretes: 'Aretes', flor: 'Flor', bandana: 'Bandana' },
      eyes: { punto: 'Punto', felices: 'Felices', guino: 'Guiño', grandes: 'Grandes', sueno: 'Con sueño', pestanas: 'Pestañas' },
      mouth: { sonrisa: 'Sonrisa', ondas: 'Ondas', risa: 'Risa', o: 'Sorpresa', ladeada: 'Ladeada', lengua: 'Lengua' },
      doodle: { ninguno: 'Sin garabato', destellos: 'Destellos', corazon: 'Corazón', rayitas: 'Rayitas', garabato: 'Garabato' },
      turn: { '-1': 'Mira a la izquierda', 0: 'De frente', 1: 'Mira a la derecha' }
    }
  });
  const ACC_BY_TAG = {
    firmware: 'goggles', electronica: 'goggles', audio: 'audifonos', data: 'lentes', software: 'lentes', mobile: 'lentesSol',
    diseno: 'lapiz', branding: 'lapiz', fabricacion: 'casco', ventas: 'corbata', logistica: 'corbata', fundraising: 'corbata',
    legal: 'lentes', comunidad: 'gafete', mentoria: 'lentes', '3d': 'boina', agro: 'sombrero', robotica: 'antena', marketing: 'aretes', retail: 'flor'
  };
  C.accForTag = (tag) => ACC_BY_TAG[tag] || 'ninguno';

  const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const idx = (v, list, fallback) => (Number.isInteger(v) && v >= 0 && v < list.length ? v : fallback);
  const inRange = (v, lo, hi, fallback) => (typeof v === 'number' && v >= lo && v <= hi ? v : fallback);

  // Rasgos: los elegidos por la persona o, si no hay, unos estables a partir de su id.
  C.toonOf = (p) => {
    const h = hash((p && (p.uid || p.id || p.name)) || 'crai');
    const t = (p && p.toon) || {};
    const tag = (p && ((p.offerTags && p.offerTags[0]) || (p.tags && p.tags[0]))) || '';
    return {
      skin: idx(t.skin, T.skin, h % T.skin.length),
      hair: idx(t.hair, T.hair, (h >>> 3) % T.hair.length),
      hairColor: idx(t.hairColor, T.hairColor, (h >>> 6) % 4),
      bg: idx(t.bg, T.bg, (h >>> 9) % T.bg.length),
      shirt: idx(t.shirt, T.shirt, (h >>> 12) % T.shirt.length),
      acc: T.acc.includes(t.acc) ? t.acc : C.accForTag(tag),
      beard: typeof t.beard === 'boolean' ? t.beard : false,
      eyes: idx(t.eyes, T.eyes, (h >>> 15) % T.eyes.length),
      mouth: idx(t.mouth, T.mouth, (h >>> 18) % T.mouth.length),
      brows: idx(t.brows, [0, 1, 2, 3], (h >>> 21) % 4),
      nose: idx(t.nose, [0, 1, 2], (h >>> 23) % 3),
      turn: [-1, 0, 1].includes(t.turn) ? t.turn : ((h >>> 25) % 3) - 1,
      tilt: inRange(t.tilt, -10, 10, ((h >>> 27) % 13) - 6),
      freckles: typeof t.freckles === 'boolean' ? t.freckles : (h >>> 5) % 4 === 0,
      doodle: idx(t.doodle, T.doodle, (h >>> 11) % T.doodle.length)
    };
  };

  /* ---------- Trazo a mano: cada personaje tiene su propio temblor ---------- */
  const mulberry = (a) => () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let rnd = Math.random;
  const n = (v, amp) => (v + (rnd() - 0.5) * amp).toFixed(2);
  const wob = (d, amp) => d.replace(/-?\d*\.?\d+/g, (m) => n(parseFloat(m), amp));
  const w = (base) => n(base, 0.7);
  const P = (d, fill, sw = 2.4, amp = 0.9) => `<path d="${wob(d, amp)}" fill="${fill}" stroke="${INK}" stroke-width="${w(sw)}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const L = (d, sw = 1.9, color = INK, amp = 0.45) => `<path d="${wob(d, amp)}" fill="none" stroke="${color}" stroke-width="${w(sw)}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const F = (d, fill, amp = 0.4) => `<path d="${wob(d, amp)}" fill="${fill}"/>`;
  const O = (cx, cy, r, fill, sw = 2.4) => `<circle cx="${n(cx, 0.5)}" cy="${n(cy, 0.5)}" r="${n(r, 0.35)}" fill="${fill}"${sw ? ` stroke="${INK}" stroke-width="${w(sw)}"` : ''}/>`;
  const E = (cx, cy, rx, ry, fill, rot = 0) => `<ellipse cx="${n(cx, 0.3)}" cy="${n(cy, 0.3)}" rx="${n(rx, 0.2)}" ry="${n(ry, 0.2)}" fill="${fill}"${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}/>`;

  /* ---------- Pelo ---------- */
  const hairBack = {
    bob: (c) => P('M14.5 24C14.5 14 22 8.5 32 8.5S49.5 14 49.5 24V43H44V28H20V43H14.5Z', c),
    chongos: (c) => P('M16.5 21 18.5 5.5 28.5 13Z', c) + F('M19.6 14.5 20.3 9.5 23.6 12Z', '#FFB3C1') + P('M47.5 21 45.5 5.5 35.5 13Z', c) + F('M44.4 14.5 43.7 9.5 40.4 12Z', '#FFB3C1') + P('M15.5 25C15.5 15 22.5 10 32 10S48.5 15 48.5 25V38H43.5V27H20.5V38H15.5Z', c),
    largo: (c) => P('M14 24C14 13 22 8.5 32 8.5S50 13 50 24L52 55C47 57 42.5 55 42.5 55V30H21.5V55S17 57 12 55Z', c),
    coleta: (c) => `<ellipse cx="50" cy="25" rx="4.6" ry="9" transform="rotate(18 50 25)" fill="${c}" stroke="${INK}" stroke-width="${w(2.4)}"/>` + O(47.4, 18.6, 1.9, '#F2762E', 1.8),
    mono: (c) => O(32, 8.5, 6.2, c) + L('M27.6 12.2Q32 14.2 36.4 12.2', 2.2, '#F2762E')
  };
  const hairFront = {
    corto: (c) => P('M17.5 27C16 17 22 10.5 32 10.5S48 17 46.5 27C44 22 40 19.5 33 19.5S22 21.5 17.5 27Z', c) + L('M30 11.5C32 8.5 35.5 8 37.5 10'),
    ondas: (c) => P('M17 28C15 16 22 10 32 10S49 16 47 28C45.5 24 43.5 22 41 23 39 20 36 20.5 34 22.5 32 19.5 28 20 26.5 22.5 24 20.5 20.5 23 17 28Z', c),
    rizos: (c) => `<g>${[[19.5, 23, 5], [23, 15.5, 5.4], [31.5, 12.5, 5.8], [40, 14.5, 5.4], [45, 22, 5], [27, 19, 4.2], [36.5, 18.5, 4.2]].map(([x, y, r]) => O(x, y, r, c)).join('')}</g>`,
    bob: (c) => P('M18 26C18 16 24 11.5 32 11.5S46 16 46 26H41.5L40 22 38.2 26H26L24.2 22 22.6 26Z', c),
    chongos: (c) => P('M18 26C18 16 24 12 32 12S46 16 46 26H41.5L40 22 38.2 26H26L24.2 22 22.6 26Z', c),
    largo: (c) => P('M18 27C17 16 24 11 32 11S47 16 46 27C42 22 36.5 18.5 30 17.5 26 19 22 22 18 27Z', c),
    coleta: (c) => P('M17.5 27C16 17 22 10.5 32 10.5S48 17 46.5 27C43 21.5 38 19 32 19S21.5 21.5 17.5 27Z', c),
    rapado: (c) => `<g opacity=".9">${P('M18.5 24.5C18.5 15 24 11.5 32 11.5S45.5 15 45.5 24.5C41 21 37 20 32 20S23 21 18.5 24.5Z', c)}</g>`,
    cresta: (c) => `<g opacity=".55">${P('M18.5 24.5C18.5 15 24 11.5 32 11.5S45.5 15 45.5 24.5C41 21 37 20 32 20S23 21 18.5 24.5Z', c, 1.8)}</g>` + P('M26.5 20 27.5 7.5 30.5 14 32.5 3.5 34.5 14 37.5 7.5 38 20Z', c),
    mono: (c) => P('M17.5 27C16 17 22 11 32 11S48 17 46.5 27C43 21.5 38 19.5 32 19.5S21.5 21.5 17.5 27Z', c)
  };
  const SHINE = ['corto', 'ondas', 'bob', 'chongos', 'largo', 'coleta', 'mono'];

  /* ---------- Cara ---------- */
  function eyesSVG(type, g) {
    const { eL, eR, eY, farL, farR, look } = g;
    const one = (x, s, side) => {
      switch (type) {
        case 1: return L(`M${x - 2.6 * s} ${eY + 0.8}Q${x} ${eY - 2.4} ${x + 2.6 * s} ${eY + 0.8}`, 2);
        case 2: return side === 'R' ? L(`M${x - 2.6 * s} ${eY + 0.6}Q${x} ${eY - 2.2} ${x + 2.6 * s} ${eY + 0.6}`, 2) : E(x, eY, 1.9 * s, 2.5, INK) + O(x + 0.7, eY - 0.9, 0.65, '#FFFFFF', 0);
        case 3: return O(x, eY, 3.1 * s, '#FFFFFF', 1.7) + O(x + look * 1.1, eY + 0.3, 1.55 * s, INK, 0) + O(x + look * 1.1 + 0.6, eY - 0.4, 0.5, '#FFFFFF', 0);
        case 4: return L(`M${x - 2.4 * s} ${eY}H${x + 2.4 * s}`, 1.9) + F(`M${x - 2 * s} ${eY + 0.2}Q${x} ${eY + 2.6} ${x + 2 * s} ${eY + 0.2}Z`, INK);
        case 5: return E(x, eY, 1.9 * s, 2.5, INK) + O(x + 0.7, eY - 0.9, 0.65, '#FFFFFF', 0) + L(side === 'L' ? `M${x - 1.6} ${eY - 1.8}l-1.6 -1.4M${x - 2} ${eY - 0.6}l-1.9 -.4` : `M${x + 1.6} ${eY - 1.8}l1.6 -1.4M${x + 2} ${eY - 0.6}l1.9 -.4`, 1.3);
        default: return E(x, eY, 1.9 * s, 2.5, INK) + O(x + 0.7, eY - 0.9, 0.65, '#FFFFFF', 0);
      }
    };
    return one(eL, farL, 'L') + one(eR, farR, 'R');
  }
  function browsSVG(type, g, hidden) {
    if (hidden) return '';
    const { eL, eR } = g;
    const y = 27.6;
    switch (type) {
      case 1: return L(`M${eL - 2.5} ${y}Q${eL} ${y - 1.6} ${eL + 2.5} ${y}`, 1.7) + L(`M${eR - 2.5} ${y}Q${eR} ${y - 1.6} ${eR + 2.5} ${y}`, 1.7);
      case 2: return L(`M${eL - 2.6} ${y - 0.8}L${eL + 2.4} ${y + 0.5}`, 1.8) + L(`M${eR - 2.4} ${y + 0.5}L${eR + 2.6} ${y - 1.2}`, 1.8);
      case 3: return L(`M${eL - 2.6} ${y}H${eL + 2.4}`, 2.7) + L(`M${eR - 2.4} ${y}H${eR + 2.6}`, 2.7);
      default: return O(eL - 0.5, y, 1, INK, 0) + O(eR + 0.5, y, 1, INK, 0);
    }
  }
  function mouthSVG(type, mx, my) {
    switch (type) {
      case 1: return L(`M${mx - 3} ${my}Q${mx - 1.5} ${my - 1.2} ${mx} ${my}T${mx + 3} ${my}`, 1.9);
      case 2: return P(`M${mx - 3.2} ${my - 0.8}H${mx + 3.2}Q${mx + 3} ${my + 3.4} ${mx} ${my + 3.4}T${mx - 3.2} ${my - 0.8}Z`, INK, 1.2, 0.3) + F(`M${mx - 1.6} ${my + 2.2}Q${mx} ${my + 0.9} ${mx + 1.6} ${my + 2.2}Q${mx} ${my + 3.2} ${mx - 1.6} ${my + 2.2}Z`, '#FF8FA3');
      case 3: return `<ellipse cx="${mx}" cy="${my + 0.6}" rx="1.5" ry="1.9" fill="${INK}"/>`;
      case 4: return L(`M${mx - 2.8} ${my + 0.4}Q${mx + 0.5} ${my + 1.6} ${mx + 3} ${my - 1.2}`, 1.9);
      case 5: return P(`M${mx - 0.4} ${my + 0.9}h2.8v1.6q0 1.7-1.4 1.7t-1.4-1.7Z`, '#FF8FA3', 1.3, 0.2) + L(`M${mx - 3} ${my - 0.2}Q${mx} ${my + 2.4} ${mx + 3} ${my - 0.2}`, 1.9);
      default: return L(`M${mx - 2.6} ${my - 0.2}Q${mx} ${my + 2.4} ${mx + 2.6} ${my - 0.2}`, 1.9);
    }
  }
  function noseSVG(type, g) {
    const x = 32 + g.dx * 1.6;
    const s = g.turn || 1;
    if (type === 1) return L(`M${x - 0.2 * s} 33.4Q${x + 1.6 * s} 35.3 ${x - 0.4 * s} 36.2`, 1.6);
    if (type === 2) return O(x - 1, 35.6, 0.55, INK, 0) + O(x + 1, 35.6, 0.55, INK, 0);
    return '';
  }
  function doodleSVG(type, tilt) {
    const right = tilt <= 0;
    const x = right ? 52 : 12;
    switch (type) {
      case 1: {
        const star = (cx, cy, s, fill) => P(`M${cx} ${cy - s}Q${cx} ${cy} ${cx + s} ${cy}Q${cx} ${cy} ${cx} ${cy + s}Q${cx} ${cy} ${cx - s} ${cy}Q${cx} ${cy} ${cx} ${cy - s}Z`, fill, 1.3, 0.3);
        return star(x, 12, 4.4, '#FFFFFF') + star(x + (right ? -5 : 5), 5.5, 2.4, '#F2B33D');
      }
      case 2: return P(`M${x} 15C${x - 6} 11 ${x - 4} 6 ${x} 8.8C${x + 4} 6 ${x + 6} 11 ${x} 15Z`, '#FF8FA3', 1.4, 0.4);
      case 3: return right ? L('M49 8l2.6-3M53 11.5l3.6-1.4M54.4 16.4l3.6.2', 1.7) : L('M15 8l-2.6-3M11 11.5l-3.6-1.4M9.6 16.4l-3.6.2', 1.7);
      case 4: return L(right ? 'M44 6.5q2.5-3.5 5-.5t5-.5 5-.5' : 'M5 6.5q2.5-3.5 5-.5t5-.5 5-.5', 1.8, '#F2762E', 0.6);
      default: return '';
    }
  }

  /* ---------- Accesorios (sobre la cabeza y sobre la ropa) ---------- */
  const headAcc = {
    goggles: (g) => L(`M17.5 22.5H46.5`, 2.6) + O(26.5 + g.dx * 0.5, 22, 4.3, '#8EE3F5') + O(37.5 + g.dx * 0.5, 22, 4.3, '#8EE3F5') + L(`M${25 + g.dx * 0.5} 20.6l1.6-1M${36 + g.dx * 0.5} 20.6l1.6-1`, 1.3, '#FFFFFF', 0.2),
    audifonos: (g) => L(`M${g.earL.x - 1.5} 31C${g.earL.x - 1.5} 13 ${g.earR.x + 1.5} 13 ${g.earR.x + 1.5} 31`, 3) + P(`M${g.earL.x - 4} 27.5h6.5v10h-6.5Z`, '#6E52F5', 2.2, 0.6) + P(`M${g.earR.x - 2.5} 27.5h6.5v10h-6.5Z`, '#6E52F5', 2.2, 0.6),
    lentes: (g) => O(g.eL, g.eY, 4.7 * g.farL, 'rgba(255,255,255,.28)', 1.8) + O(g.eR, g.eY, 4.7 * g.farR, 'rgba(255,255,255,.28)', 1.8) + L(`M${g.eL + 4.6 * g.farL} 31.6H${g.eR - 4.6 * g.farR}`, 1.8),
    lentesSol: (g) => P(`M${g.eL - 4.6} 29.6h9.2v2.6q0 3.6-4.6 3.6t-4.6-3.6Z`, INK, 1.8, 0.4) + P(`M${g.eR - 4.6} 29.6h9.2v2.6q0 3.6-4.6 3.6t-4.6-3.6Z`, INK, 1.8, 0.4) + L(`M${g.eL + 4.6} 30.4H${g.eR - 4.6}`, 1.8) + L(`M${g.eL - 2.6} 31.2l1.8-1M${g.eR - 2.6} 31.2l1.8-1`, 1.2, '#FFFFFF', 0.2),
    lapiz: (g) => `<g transform="rotate(38 ${g.earR.x} 22)">${P(`M${g.earR.x - 2.4} 13h4.8v16h-4.8Z`, '#F2B33D', 1.8, 0.4)}${P(`M${g.earR.x - 2.4} 29l2.4 4.5 2.4-4.5Z`, '#FBDCC4', 1.6, 0.3)}${P(`M${g.earR.x - 2.4} 11h4.8v3h-4.8Z`, '#FF8FA3', 1.6, 0.3)}</g>`,
    casco: (g) => P('M15.5 25C15.5 14 23 9.5 32 9.5S48.5 14 48.5 25Z', '#F2B33D') + P('M12.5 25H51.5V28.2H12.5Z', '#F2B33D') + L('M32 9.8V24.6M25.5 12.2 26.8 24.6M38.5 12.2 37.2 24.6', 1.7),
    gorro: (g) => P('M16.5 26C16 14 24 8.5 32 8.5S48 14 47.5 26Z', g.alt) + P('M15.5 22.5H48.5V27.8H15.5Z', g.alt) + L('M20 23v4.6M24 23v4.6M28 23v4.6M32 23v4.6M36 23v4.6M40 23v4.6M44 23v4.6', 1.2, 'rgba(11,15,30,.55)', 0.3) + O(32, 7.6, 3.4, '#FFFFFF'),
    boina: () => P('M15.5 22C15 13 28 8 43 10.5 50.5 12 50 19.5 44 21.5Z', '#D9445B') + L('M33 9 34 6'),
    sombrero: () => `<ellipse cx="32" cy="22.5" rx="21" ry="4.2" fill="#E9C46A" stroke="${INK}" stroke-width="${w(2.4)}"/>` + P('M21.5 21.5C21.5 11.5 42.5 11.5 42.5 21.5Z', '#E9C46A') + L('M22 18.8H42', 2.6, '#D9445B', 0.3),
    antena: () => L('M17.5 21C20 13 44 13 46.5 21', 2.6) + L('M24 15 20.5 6.5M40 15 43.5 6.5') + O(20.2, 6, 2.4, '#F2762E', 1.8) + O(43.8, 6, 2.4, '#6E52F5', 1.8),
    aretes: (g) => `<circle cx="${g.earL.x}" cy="38.2" r="2.5" fill="none" stroke="#F2B33D" stroke-width="1.8"/><circle cx="${g.earR.x}" cy="38.2" r="2.5" fill="none" stroke="#F2B33D" stroke-width="1.8"/>`,
    flor: (g) => {
      const cx = 20.5 + g.dx * 0.4;
      const cy = 15.5;
      return [0, 72, 144, 216, 288].map((a) => O(cx + Math.cos((a * Math.PI) / 180) * 2.6, cy + Math.sin((a * Math.PI) / 180) * 2.6, 2.1, '#FF8FA3', 1.4)).join('') + O(cx, cy, 1.6, '#F2B33D', 1.3);
    },
    bandana: () => P('M17 22C24 17.5 40 17.5 47 22L46.5 25.6C40 21.6 24 21.6 17.5 25.6Z', '#D9445B', 2.2) + P('M46 22.4l5.2-2.6-1 5.4Z', '#D9445B', 1.8, 0.4) + O(25, 21.6, 0.7, '#FFFFFF', 0) + O(32, 20.4, 0.7, '#FFFFFF', 0) + O(39, 21.6, 0.7, '#FFFFFF', 0)
  };
  const bodyAcc = {
    corbata: () => L('M28.5 46 32 50 35.5 46', 1.8) + P('M30.6 49.5H33.4L34.7 58.5 32 61.5 29.3 58.5Z', '#D9445B', 1.8, 0.4),
    gafete: () => L('M26.5 46 30 56M37.5 46 34 56', 1.8, '#2F5BEA') + P('M27.5 55h9v7h-9Z', '#FFFFFF', 1.8, 0.4) + L('M29.6 58.5H34.4', 1.6, '#F2762E', 0.2)
  };
  const COVERS = ['casco', 'sombrero', 'boina', 'gorro'];

  const cache = new Map();
  C.toonSVG = (p, override) => {
    const t = Object.assign(C.toonOf(p || {}), override || {});
    const key = JSON.stringify(t);
    if (cache.has(key)) return cache.get(key);
    rnd = mulberry(hash(key));
    const skin = T.skin[t.skin];
    const hc = T.hairColor[t.hairColor];
    const style = T.hair[t.hair];
    const turn = t.turn;
    const dx = turn * 2.8;
    const g = {
      turn, dx, eY: 32, eL: 26.5 + dx, eR: 37.5 + dx,
      farL: turn === -1 ? 0.8 : 1, farR: turn === 1 ? 0.8 : 1, look: turn || 0.6,
      earL: { x: turn === -1 ? 19.5 : 17.6, r: turn === -1 ? 3 : 3.7 },
      earR: { x: turn === 1 ? 44.5 : 46.4, r: turn === 1 ? 3 : 3.7 },
      alt: t.shirt === 2 ? '#F2762E' : '#6E52F5'
    };
    const cx = 32 + turn * 2.4;
    const covers = COVERS.includes(t.acc);

    let head = '';
    if (hairBack[style]) head += hairBack[style](hc);
    head += P('M27 39H37V46.5C37 48.6 27 48.6 27 46.5Z', skin);
    head += O(g.earL.x, 33, g.earL.r, skin) + O(g.earR.x, 33, g.earR.r, skin);
    if (turn !== -1) head += L(`M${g.earL.x - 0.4} 31.6q-1.4 1.4 0 2.8`, 1.2);
    if (turn !== 1) head += L(`M${g.earR.x + 0.4} 31.6q1.4 1.4 0 2.8`, 1.2);
    head += P(`M18 26C18 16 24 12 32 12S46 16 46 26V33C46 41.5 ${cx + 7} 47 ${cx} 47S18 41.5 18 33Z`, skin);
    if (t.beard) head += P(`M19 33.5C19.5 43.5 25 47.5 ${cx} 47.5S44.5 43.5 45 33.5C42.5 39.5 38.5 42 ${cx} 42S21.5 39.5 19 33.5Z`, hc, 2.2);
    if (!covers) {
      head += `<g transform="translate(${(dx * 0.45).toFixed(2)} 0)">${hairFront[style](hc)}`;
      if (SHINE.includes(style)) head += L('M25.5 15.4Q28.6 13.6 31.8 13.9', 1.6, 'rgba(255,255,255,.55)', 0.3);
      head += '</g>';
    }
    const browsHidden = style === 'bob' || style === 'chongos';
    head += browsSVG(t.brows, g, browsHidden && !covers);
    head += eyesSVG(t.eyes, g);
    head += E(23.2 + dx * 0.9, 37, 2.5 * (turn === -1 ? 0.7 : 1), 1.6, 'rgba(255,143,163,.5)');
    head += E(40.8 + dx * 0.9, 37, 2.5 * (turn === 1 ? 0.7 : 1), 1.6, 'rgba(255,143,163,.5)');
    if (t.freckles) head += [[-2.6, -0.8], [-1, 0.6], [0.6, -0.6]].map(([a, b]) => O(23.2 + dx * 0.9 + a, 36.6 + b, 0.45, 'rgba(120,60,30,.6)', 0) + O(40.8 + dx * 0.9 - a, 36.6 + b, 0.45, 'rgba(120,60,30,.6)', 0)).join('');
    head += noseSVG(t.nose, g);
    head += mouthSVG(t.mouth, 32 + dx * 1.1, 39.6);
    if (headAcc[t.acc]) head += headAcc[t.acc](g);

    const svg = `<svg class="toon" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect width="64" height="64" fill="${T.bg[t.bg]}"/>${doodleSVG(t.doodle, t.tilt)}${P('M7 66C7 51 17.5 45 32 45S57 51 57 66Z', T.shirt[t.shirt])}${L('M27 46.4Q32 49.6 37 46.4', 1.5)}${bodyAcc[t.acc] ? bodyAcc[t.acc]() : ''}<g transform="rotate(${t.tilt} 32 44)">${head}</g></svg>`;
    cache.set(key, svg);
    return svg;
  };

  // El avatar de toda la app es el personaje.
  C.avatar = (p, size = 'md', o = {}) => {
    if (!p) return '';
    return `<span class="av av-${size} av-toon door-${p.door || 'both'}" aria-hidden="true"${o.hc ? ` data-hc="${p.id}"` : ''}><span class="av-face">${C.toonSVG(p)}</span>${o.presence && p.active ? '<i class="presence" title="Activo hoy"></i>' : ''}</span>`;
  };
})();
