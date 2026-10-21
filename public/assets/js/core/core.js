/* CRAI Club · núcleo: estado, utilidades, íconos, fechas, matching, capas */
(function () {
  'use strict';
  const D = window.CRAI_DATA;
  const C = (window.CRAI = { D });
  const doc = document;
  const root = doc.documentElement;

  C.$ = (s, r = doc) => r.querySelector(s);
  C.$$ = (s, r = doc) => Array.from(r.querySelectorAll(s));
  C.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  C.norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  // Solo enlaces web: agrega https:// si falta y descarta otros esquemas (javascript:, data:, etc.).
  C.safeUrl = (v) => {
    let u = String(v || '').trim();
    if (!u) return '';
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u.replace(/^\/+/, '');
    try { const x = new URL(u); return /^https?:$/.test(x.protocol) && x.hostname.includes('.') ? x.href : ''; } catch (e) { return ''; }
  };
  C.cap = (s) => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
  C.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  C.RM = () => reduce.matches;
  C.canHover = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Almacenamiento local (solo comodidad por visitante) ---------- */
  let KEY = 'crai.v1.';
  C.store = {
    get(k, d) { try { const v = localStorage.getItem(KEY + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
    scope(uid) { KEY = 'crai.v1.' + (uid ? 'u.' + uid + '.' : ''); },
    clear() { try { Object.keys(localStorage).filter((k) => k.startsWith(KEY)).forEach((k) => localStorage.removeItem(k)); } catch (e) { /* nada */ } }
  };
  const st = C.store;

  /* ---------- Estado ---------- */
  // En el club real nadie empieza siguiendo proyectos de ejemplo.
  const DEMO_FOLLOWS = window.CRAI_LIVE ? [] : ['cosecha', 'sinte'];
  const S = (C.S = {
    mode: 'landing',
    view: 'inicio',
    me: Object.assign({}, JSON.parse(JSON.stringify(D.me)), st.get('me', {})),
    follows: new Set(st.get('follows', DEMO_FOLLOWS)),
    followPeople: new Set(st.get('followPeople', [])),
    saved: new Set(st.get('saved', [])),
    going: new Set(st.get('going', [])),
    reminders: new Set(st.get('reminders', [])),
    posts: st.get('posts', []),
    comments: st.get('comments', {}),
    quests: st.get('quests', {}),
    contacted: st.get('contacted', []),
    testers: st.get('testers', []),
    topics: new Set(st.get('topics', ['electronica', 'fabricacion'])),
    goal: st.get('goal', ''),
    door: st.get('door', 'all'),
    accepted: st.get('accepted', false),
    applied: st.get('applied', null),
    endorse: st.get('endorse', {}),
    auth: { ready: false, user: null, profile: false },
    liveMembers: [],
    liveById: {},
    livePosts: [],
    liveComments: {},
    inbox: [],
    showDemo: st.get('showDemo', false),
    pf: { q: '', seek: 'all', offer: 'all', open: false },
    jf: { stage: 'all', help: false },
    ff: { type: 'all', sort: 'foryou' },
    match: { q: '', avail: [] }
  });
  C.isLive = () => !!(C.fb && S.auth.user && S.auth.profile);
  C.save = () => {
    if (!C.isLive()) st.set('me', S.me);
    st.set('showDemo', S.showDemo);
    st.set('follows', [...S.follows]);
    st.set('followPeople', [...S.followPeople]);
    st.set('saved', [...S.saved]);
    st.set('going', [...S.going]);
    st.set('reminders', [...S.reminders]);
    st.set('posts', S.posts);
    st.set('comments', S.comments);
    st.set('quests', S.quests);
    st.set('contacted', S.contacted);
    st.set('testers', S.testers);
    st.set('topics', [...S.topics]);
    st.set('goal', S.goal);
    st.set('door', S.door);
    st.set('accepted', S.accepted);
    st.set('applied', S.applied);
    st.set('endorse', S.endorse);
  };
  // Recarga las preferencias locales (al cambiar de cuenta cambia el espacio de guardado).
  C.reloadLocal = () => {
    S.follows = new Set(st.get('follows', DEMO_FOLLOWS));
    S.followPeople = new Set(st.get('followPeople', []));
    S.saved = new Set(st.get('saved', []));
    S.going = new Set(st.get('going', []));
    S.reminders = new Set(st.get('reminders', []));
    S.posts = st.get('posts', []);
    S.comments = st.get('comments', {});
    S.quests = st.get('quests', {});
    S.contacted = st.get('contacted', []);
    S.testers = st.get('testers', []);
    S.topics = new Set(st.get('topics', ['electronica', 'fabricacion']));
    S.goal = st.get('goal', '');
    S.endorse = st.get('endorse', {});
    S.showDemo = st.get('showDemo', false);
  };

  /* ---------- Íconos ---------- */
  const I = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.9.7 3.1 2.4 3.5 5.2"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12 18.4 5.6"/><circle cx="12" cy="12" r="1"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.2-6 8-6s7 2 8 6"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    build: '<path d="M3 21h18M6 21V10l6-4 6 4v11M10 21v-5h4v5"/>',
    buoy: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m5.6 5.6 3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M17 8a5 5 0 0 1 0 8"/>',
    rocket: '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2"/><path d="M9 15 6 12l3-6c3-4 8-4 12-4 0 4 0 9-4 12l-6 3z"/><circle cx="15" cy="9" r="1.6"/>',
    userplus: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M19 8v6M16 11h6"/>',
    zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    coffee: '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    wave: '<path d="M2 12c2.5 0 2.5-6 5-6s2.5 12 5 12 2.5-12 5-12 2.5 6 5 6"/>',
    shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    circle: '<circle cx="12" cy="12" r="8"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    exit: '<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>'
  };
  C.icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n] || I.spark}</svg>`;
  const icon = C.icon;
  const esc = C.esc;

  /* ---------- Búsquedas ---------- */
  const byId = Object.fromEntries(D.people.map((p) => [p.id, p]));
  C.ghost = (id) => ({ id, name: 'Miembro de CRAI', role: '', door: 'both', hue: 220, building: '', bio: '', skills: [], learn: [], seeking: [], offers: '',
    needsTags: [], offerTags: [], tags: [], avail: [], interests: [], links: {}, open: false, ghost: true });
  C.person = (id) => {
    if (id === 'me' || (S.auth.user && id === S.auth.user.uid)) return S.me;
    return S.liveById[id] || byId[id] || C.ghost(id);
  };
  // Con sesión real: miembros de Firestore (y, si se piden, los perfiles de ejemplo).
  C.members = () => (C.isLive() ? (S.showDemo ? [...S.liveMembers, ...D.people] : S.liveMembers) : D.people);
  C.project = (id) => D.projects.find((p) => p.id === id);
  C.eventById = (id) => D.events.find((e) => e.id === id);
  C.tagLabel = (t) => D.TAGS[t] || t;
  C.firstName = (p) => String(p.name || '').split(' ')[0];
  C.list = (arr) => (arr.length <= 1 ? (arr[0] || '') : arr.slice(0, -1).join(', ') + ' y ' + arr[arr.length - 1]);
  // «Una app para…» se lee mejor a media frase como «una app para…».
  C.projectName = (p) => (String(p.building || '').split(' — ')[0] || 'mi proyecto').replace(/^(Un|Una|El|La|Los|Las|Mi) /, (w) => w.toLowerCase());

  /* ---------- Piezas de interfaz ---------- */
  C.initials = (name) => String(name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const photoOk = (u) => typeof u === 'string' && /^https:///.test(u);
  C.avatar = (p, size = 'md', o = {}) => `<span class="av av-${size} door-${p.door}${photoOk(p.photo) ? ' has-photo' : ''}" style="--h:${Number(p.hue) || 220}${photoOk(p.photo) ? `;background-image:url(${esc(JSON.stringify(p.photo))})` : ''}" aria-hidden="true"${o.hc ? ` data-hc="${p.id}"` : ''}>${photoOk(p.photo) ? '' : esc(C.initials(p.name))}${o.presence && p.active ? '<i class="presence" title="Activo hoy"></i>' : ''}</span>`;

  /* ---------- Detalles de perfil ---------- */
  const LEVEL = { 3: 'Experto', 2: 'Avanzado', 1: 'En práctica' };
  C.skillRows = (p) => (p.skills || []).map((s, i) => {
    const lv = (p.levels || [])[i] || 2;
    return `<div class="skill-row"><span>${esc(s)}</span><span class="dots" aria-label="${LEVEL[lv]}">${[1, 2, 3].map((n) => `<i class="${n <= lv ? 'on' : ''}"></i>`).join('')}</span><small>${LEVEL[lv]}</small></div>`;
  }).join('');
  C.availGrid = (p) => {
    const av = p.avail || [];
    const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const slots = [['mananas', 'Mañana'], ['tardes', 'Tarde'], ['noches', 'Noche']];
    const on = (d, s) => (d >= 5 ? av.includes('fines') : av.includes(s));
    return `<div class="heat" role="img" aria-label="Disponibilidad: ${esc((av.map((a) => D.AVAIL[a]).join(', ')) || 'sin definir')}">
      <span></span>${days.map((d) => `<b>${d}</b>`).join('')}
      ${slots.map(([k, l], r) => `<small>${l}</small>${days.map((_, d) => `<i class="${on(d, k) ? 'on' : ''}" style="--i:${r * 7 + d}"></i>`).join('')}`).join('')}
    </div>`;
  };
  C.codeSVG = (id) => {
    let h = 7;
    const bars = [];
    for (let i = 0; i < 23; i++) { h = (h * 31 + id.charCodeAt(i % id.length) + i * 17) % 997; bars.push(4 + (h % 9) * 2.6); }
    return `<svg class="bz-code-svg" viewBox="0 0 120 32" aria-hidden="true"><circle cx="12" cy="16" r="10"/>${bars.map((b, i) => `<rect x="${28 + i * 4}" y="${16 - b / 2}" width="2.4" height="${b}" rx="1.2"/>`).join('')}</svg>`;
  };
  C.endorsementsOf = (id) => [...(S.endorse[id] || []), ...((C.person(id) || {}).endorsements || []).filter((e) => !(C.isLive() && e.from === 'me'))];
  C.sharedWith = (p) => {
    const me = S.me;
    const interests = (p.interests || []).filter((i) => (me.interests || []).includes(i));
    const events = D.events.filter((e) => !e.past && e.attendees.includes(p.id) && S.going.has(e.id));
    const offers = (p.needsTags || []).filter((t) => (me.offerTags || []).includes(t));
    const gets = (p.offerTags || []).filter((t) => (me.needsTags || []).includes(t));
    return { interests, events, offers, gets };
  };
  C.tagChips = (tags = [], kind = 'offer', max = 4) =>
    tags.slice(0, max).map((t) => `<span class="chip chip-${kind}">${esc(C.tagLabel(t))}</span>`).join('') +
    (tags.length > max ? `<span class="chip chip-more">+${tags.length - max}</span>` : '');
  C.doorChip = (door) => `<span class="door-chip dc-${door}"><i></i>${esc(D.DOORS[door] || '')}</span>`;
  C.tdot = (type) => { const t = D.TYPES[type]; return `<span class="tdot tone-${t.tone}">${icon(t.icon)}</span>`; };
  C.ptype = (type) => { const t = D.TYPES[type]; return `<span class="ptype tone-${t.tone}"><span class="tdot">${icon(t.icon)}</span>${esc(t.label)}</span>`; };
  C.ring = (v, label, tone = '', size = 76) =>
    `<div class="ring ${tone}" style="--v:0;--size:${size}px" data-v="${Math.round(v)}"><svg viewBox="0 0 36 36"><circle class="track" cx="18" cy="18" r="15.9155" pathLength="100"/><circle class="val" cx="18" cy="18" r="15.9155" pathLength="100"/></svg><span>${label}</span></div>`;
  C.ago = (h) => {
    if (h < 1 / 60) return 'ahora';
    if (h < 1) return `hace ${Math.max(1, Math.round(h * 60))} min`;
    if (h < 24) return `hace ${Math.round(h)} h`;
    const d = Math.round(h / 24);
    return d === 1 ? 'ayer' : `hace ${d} días`;
  };

  /* ---------- Fechas ---------- */
  const DOW = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const DOWS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  const MON = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MONS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  C.today = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
  C.eventDate = (ev) => {
    const b = C.today();
    const dow = b.getDay();
    const diff = ev.weeks < 0 ? -(((dow - ev.dow + 7) % 7) || 7) + (ev.weeks + 1) * 7 : ((ev.dow - dow + 7) % 7) + ev.weeks * 7;
    return new Date(b.getFullYear(), b.getMonth(), b.getDate() + diff);
  };
  C.dayDiff = (d) => Math.round((d - C.today()) / 864e5);
  C.fmtLong = (d) => `${C.cap(DOW[d.getDay()])} ${d.getDate()} de ${MON[d.getMonth()]}`;
  C.fmtRel = (d) => { const n = C.dayDiff(d); if (n === 0) return 'Hoy'; if (n === 1) return 'Mañana'; return C.fmtLong(d); };
  C.dateBlock = (d) => `<span class="date-block"><b>${d.getDate()}</b><small>${DOWS[d.getDay()]} · ${MONS[d.getMonth()]}</small></span>`;
  C.DOWS = DOWS;
  C.sortedEvents = () => D.events.map((e) => ({ e, d: C.eventDate(e) })).sort((a, b) => a.d - b.d);

  C.mxl = () => {
    try {
      const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Tijuana', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' });
      const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
      return { hh: Number(p.hour) % 24, time: `${String(Number(p.hour) % 24).padStart(2, '0')}:${p.minute}`, wd: p.weekday };
    } catch (e) {
      const d = new Date();
      return { hh: d.getHours(), time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] };
    }
  };
  const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  C.todayDow = () => WD[C.mxl().wd] ?? new Date().getDay();
  C.loopKeyFor = (dow) => ({ 1: 'lun', 2: 'mar', 3: 'mie', 4: 'jue', 5: 'vie', 6: 'fin', 0: 'fin' }[dow]);
  C.todayLoop = () => D.loop.find((l) => l.key === C.loopKeyFor(C.todayDow()));
  C.greeting = () => { const h = C.mxl().hh; return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; };
  C.todayLabel = () => { const d = C.today(); return `${C.cap(DOW[C.todayDow()])} ${d.getDate()} de ${MON[d.getMonth()]}`; };

  /* ---------- Collab Match ---------- */
  const KEYS = [
    [/firm|esp32|microcontrol|embebid|arduino|pcb|rtos/, ['firmware', 'electronica']],
    [/electron|sold|smd|circuit|placa/, ['electronica']],
    [/vend|venta|comercial|b2b|clientes/, ['ventas']],
    [/disen|\bux\b|\bui\b|interfaz|figma/, ['diseno']],
    [/marca|branding|logo|identidad/, ['branding']],
    [/invers|fondos|levantar|capital|pitch|fundrais|financ/, ['fundraising']],
    [/\bapp|movil|ios\b|android|flutter|swift/, ['mobile']],
    [/web|next|react|frontend|backend|program|codigo|software|supabase|typescript|desarroll/, ['software']],
    [/legal|contrat|abogad|patente|propiedad intelectual|pacto/, ['legal']],
    [/dato|\bml\b|\bia\b|inteligencia artificial|machine|python|vision/, ['data']],
    [/\b3d\b|blender|unity|juego|anima/, ['3d']],
    [/cnc|fabric|impres|manufact|torno|laser|carcasa|pieza/, ['fabricacion']],
    [/market|redes|tiktok|contenido|seo|growth|lanzamiento|difusion/, ['marketing']],
    [/music|audio|sonido|sinte/, ['audio']],
    [/logist|export|aduan|arancel|comercio exterior|envio/, ['logistica']],
    [/evento|comunidad|facilit|taller|organiz/, ['comunidad']],
    [/mentor|consej|asesor|guia|experiencia/, ['mentoria']],
    [/probar|prueb|tester|testear|beta/, ['testers']],
    [/agro|campo|cultivo|riego|productor/, ['agro']],
    [/cafe|restaur|comida|retail|tienda|inventario/, ['retail']],
    [/robot|\bros\b|mecatr/, ['robotica']]
  ];
  C.parseNeeds = (text) => {
    const t = C.norm(text);
    const out = [];
    KEYS.forEach(([re, tags]) => { if (re.test(t)) tags.forEach((x) => { if (!out.includes(x)) out.push(x); }); });
    return out;
  };
  C.matchPeople = (needs, opts = {}) => {
    const me = S.me;
    const meOffer = me.offerTags || [];
    const useAvail = opts.avail && opts.avail.length ? opts.avail : me.avail || [];
    const myInt = me.interests || [];
    const door = opts.door || 'all';
    return C.members().map((p) => {
      let s = 0;
      const why = [];
      const hit = needs.filter((t) => t !== 'testers' && p.tags.includes(t));
      if (hit.length) { s += 40 + 14 * Math.min(1, hit.length - 1); why.push(`Tiene experiencia en ${C.list(hit.map(C.tagLabel))}, justo lo que pediste.`); }
      else if (needs.includes('testers') && p.open) { s += 32; why.push('Se ofrece a probar productos de otros miembros.'); }
      const recip = (p.needsTags || []).filter((t) => meOffer.includes(t));
      if (recip.length) { s += 18; why.push(`Busca ${C.list(recip.map((t) => C.tagLabel(t).toLowerCase()))}: algo que tú puedes aportar.`); }
      const av = (p.avail || []).filter((a) => useAvail.includes(a));
      if (av.length) { s += 10; why.push(`Coinciden en ${C.list(av.map((a) => D.AVAIL[a].toLowerCase()))}.`); }
      else if (opts.avail && opts.avail.length) s -= 10;
      const shared = (p.interests || []).filter((i) => myInt.includes(i));
      if (shared.length) { s += Math.min(12, shared.length * 6); why.push(`Comparten interés en ${C.list(shared)}.`); }
      if (p.open) s += 6;
      if (door !== 'all' && p.door !== door && p.door !== 'both') s -= 18;
      const tags = hit.length ? hit : needs.includes('testers') && p.open ? ['testers'] : [];
      return { p, s: Math.max(4, Math.min(97, Math.round(s))), why, hit: tags };
    }).sort((a, b) => b.s - a.s);
  };
  C.peopleToMeet = (n = 3) => {
    const res = C.matchPeople(S.me.needsTags || []);
    const out = [];
    (S.me.needsTags || []).forEach((t) => {
      const r = res.find((x) => x.hit.includes(t) && !out.includes(x));
      if (r && out.length < n) out.push(r);
    });
    res.forEach((r) => { if (out.length < n && !out.includes(r)) out.push(r); });
    return out;
  };
  C.fitMap = () => Object.fromEntries(C.matchPeople(S.me.needsTags || []).map((r) => [r.p.id, r.s]));

  /* ---------- Publicaciones ---------- */
  C.allPosts = () => (C.isLive()
    ? [...S.livePosts, ...(S.showDemo ? D.posts.filter((p) => p.author !== 'me').map((p) => ({ ...p, example: true })) : [])]
    : [...S.posts, ...D.posts]);
  C.postHours = (p) => (p.ts ? (Date.now() - p.ts) / 36e5 : p.h);
  C.postComments = (p) => (p.live ? S.liveComments[p.id] || [] : [...(p.comments || []), ...(S.comments[p.id] || [])]);
  C.commentCount = (p) => (p.live ? Math.max(p.commentCount || 0, (S.liveComments[p.id] || []).length) : C.postComments(p).length);
  C.relevance = (p) => {
    const mine = new Set([...(S.me.offerTags || []), ...(S.me.needsTags || []), ...(S.me.tags || [])]);
    return (p.tags || []).filter((t) => mine.has(t)).length;
  };
  C.canHelp = (p) => ['help', 'team', 'ask'].includes(p.type) && p.author !== 'me' &&
    (p.tags || []).some((t) => (S.me.offerTags || []).includes(t) || (S.me.tags || []).includes(t));
  C.rankPosts = (posts, mode) => {
    if (mode === 'recent') return posts.slice().sort((a, b) => C.postHours(a) - C.postHours(b));
    return posts.map((p) => [p, C.relevance(p) * 12 + (C.canHelp(p) ? 10 : 0) + C.postComments(p).length * 2 +
      ((p.tags || []).some((t) => S.topics.has(t)) ? 6 : 0) - C.postHours(p) * 0.4]).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
  };

  /* ---------- Quests ---------- */
  C.qp = (id) => { const q = D.quests.find((x) => x.id === id); return S.quests[id] ?? (q ? q.start : 0); };
  C.questDone = (q) => C.qp(q.id) >= q.goal;
  C.unlockedBadges = () => { const set = new Set(S.me.badges || []); D.quests.forEach((q) => { if (C.questDone(q)) set.add(q.badge); }); return [...set]; };
  C.advanceQuest = (id, n = 1) => {
    const q = D.quests.find((x) => x.id === id);
    if (!q) return;
    const before = C.qp(id);
    if (before >= q.goal) return;
    S.quests[id] = Math.min(q.goal, before + n);
    C.save();
    if (S.quests[id] >= q.goal) setTimeout(() => C.celebrate && C.celebrate(q.badge), 520);
    else setTimeout(() => C.toast(`Quest en progreso: ${S.quests[id]} de ${q.goal}`, 'flag'), 700);
  };

  /* ---------- Avisos ---------- */
  C.toast = (msg, ic = 'check') => {
    const box = C.$('#toasts');
    if (!box) return;
    const t = doc.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.innerHTML = `<span class="tdot">${icon(ic)}</span><span>${msg}</span>`;
    box.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 3800);
  };

  /* ---------- Capas: drawer, modal, paleta, popover ---------- */
  const stack = [];
  C.openLayer = (kind, html, opts = {}) => {
    const el = doc.createElement('div');
    el.className = 'layer' + (kind === 'pop' ? ' pop-layer' : '');
    const cls = { drawer: 'drawer', pop: 'pop', palette: 'modal palette' }[kind] || 'modal';
    el.innerHTML = `<div class="scrim" data-act="close"></div><div class="${cls} ${opts.cls || ''}" role="dialog" aria-modal="true" aria-label="${esc(opts.label || '')}" tabindex="-1">${html}</div>`;
    el._prev = doc.activeElement;
    C.$('#layers').appendChild(el);
    stack.push(el);
    doc.body.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('open')));
    const panel = el.lastElementChild;
    setTimeout(() => { const f = panel.querySelector('[autofocus]') || panel; try { f.focus({ preventScroll: true }); } catch (e) { /* nada */ } }, 70);
    return panel;
  };
  C.closeLayer = (el) => {
    el = el || stack[stack.length - 1];
    if (!el) return;
    const i = stack.indexOf(el);
    if (i >= 0) stack.splice(i, 1);
    el.classList.remove('open');
    el.style.pointerEvents = 'none';
    setTimeout(() => el.remove(), 500);
    if (typeof el._onClose === 'function') { const fn = el._onClose; el._onClose = null; setTimeout(fn, 380); }
    if (C.hideHC) C.hideHC();
    if (!stack.length) doc.body.style.overflow = '';
    try { if (el._prev && doc.contains(el._prev)) el._prev.focus({ preventScroll: true }); } catch (e) { /* nada */ }
  };
  C.closeAll = () => { while (stack.length) C.closeLayer(stack[stack.length - 1]); };
  C.topLayer = () => stack[stack.length - 1];

  /* ---------- Transiciones de vista ---------- */
  C.setVT = (e, el) => {
    let x = innerWidth / 2;
    let y = innerHeight / 2;
    if (e && (e.clientX || e.clientY)) { x = e.clientX; y = e.clientY; }
    else if (el && el.getBoundingClientRect) { const r = el.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
    root.style.setProperty('--vt-x', Math.round(x) + 'px');
    root.style.setProperty('--vt-y', Math.round(y) + 'px');
  };
  C.transition = (fn, kind) => {
    if (!doc.startViewTransition || C.RM()) { fn(); return; }
    if (kind) root.dataset.vt = kind;
    try {
      const t = doc.startViewTransition(fn);
      t.finished.finally(() => { delete root.dataset.vt; });
    } catch (e) { delete root.dataset.vt; fn(); }
  };

  /* ---------- Movimiento: revelado, contadores, anillos, inclinación ---------- */
  let io = null;
  C.observeReveal = (scope) => {
    if (!('IntersectionObserver' in window) || C.RM()) return;
    io = io || new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -6% 0px' });
    C.$$('.rv:not(.in)', scope).forEach((el) => {
      if (el.getBoundingClientRect().top < innerHeight * 0.92) return;
      io.observe(el);
    });
  };
  C.countUp = (scope) => {
    if (C.RM()) return;
    C.$$('[data-count]', scope).forEach((el) => {
      const end = Number(el.dataset.count);
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 1100);
        el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  };
  C.fillRings = (scope) => {
    const els = C.$$('.ring[data-v]', scope);
    requestAnimationFrame(() => requestAnimationFrame(() => els.forEach((r) => r.style.setProperty('--v', r.dataset.v))));
  };
  C.tilt = (el, max = 9) => {
    if (!el || el._tilt || !C.canHover() || C.RM()) return;
    el._tilt = true;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', ((px - 0.5) * max).toFixed(2) + 'deg');
      el.style.setProperty('--rx', ((0.5 - py) * max * 0.8).toFixed(2) + 'deg');
      el.style.setProperty('--sx', (px * 100).toFixed(1) + '%');
      el.style.setProperty('--sy', (py * 100).toFixed(1) + '%');
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  };
  C.mountMotion = (scope) => { C.observeReveal(scope); C.countUp(scope); C.fillRings(scope); };

  /* ---------- Radar (Collab Match) ---------- */
  const angleOf = (id) => { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };
  C.radarHTML = (results, opts = {}) => {
    const hitList = results.filter((r) => r.hit.length).slice(0, opts.top || 4).map((r) => r.p.id);
    const hits = new Set(hitList);
    const sweep = 3.4;
    let blips = '';
    let lines = '';
    results.forEach((r) => {
      const k = hitList.indexOf(r.p.id);
      const a = k >= 0 ? (40 + (k * 360) / hitList.length) % 360 : angleOf(r.p.id);
      const rad = 0.34 + (1 - r.s / 100) * 0.6;
      const x = 50 + Math.sin((a * Math.PI) / 180) * rad * 50;
      const y = 50 - Math.cos((a * Math.PI) / 180) * rad * 50;
      const d = ((a / 360) * sweep).toFixed(2);
      const hit = hits.has(r.p.id);
      if (opts.mini) {
        blips += `<span class="blip ${hit ? 'hit' : 'soft'}" style="--x:${x.toFixed(1)}%;--y:${y.toFixed(1)}%;--d:${d}s">${hit ? C.avatar(r.p, 'xs') : '<span class="blip-dot"></span>'}</span>`;
      } else {
        blips += `<button class="blip ${hit ? 'hit' : 'soft'}" style="--x:${x.toFixed(1)}%;--y:${y.toFixed(1)}%;--d:${d}s" data-act="person" data-id="${r.p.id}" data-hc="${r.p.id}" aria-label="${esc(r.p.name)}, ${r.s}% de compatibilidad">${C.avatar(r.p, hit ? 'sm' : 'xs')}${hit ? `<span class="blip-tag">${esc(C.firstName(r.p))} · ${r.s}%</span>` : ''}</button>`;
      }
      if (hit) lines += `<line x1="50" y1="50" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" style="--d:${(sweep * 0.55 + Number(d) * 0.3).toFixed(2)}s"/>`;
    });
    const rings = [90, 70, 50].map((v) => {
      const rr = (0.34 + (1 - v / 100) * 0.6) * 50;
      return `<span class="radar-ring" style="inset:${(50 - rr).toFixed(1)}%">${opts.mini ? '' : `<b>${v}%</b>`}</span>`;
    }).join('');
    return `<div class="radar-cross"></div>${rings}<div class="radar-sweep" style="--sweep:${sweep}s"></div><svg class="radar-lines" viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>${blips}<span class="radar-me">${C.avatar(S.me, opts.mini ? 'sm' : 'md')}</span>`;
  };

  /* ---------- Confeti ---------- */
  C.confetti = (canvas) => {
    if (!canvas || C.RM()) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr; ctx.scale(dpr, dpr);
    const cs = getComputedStyle(root);
    const cols = ['--sol', '--blue', '--under', '--mint'].map((v) => cs.getPropertyValue(v).trim() || '#F2762E');
    const parts = Array.from({ length: 90 }, () => {
      const a = Math.random() * Math.PI * 2;
      const sp = 3 + Math.random() * 6;
      return { x: w / 2, y: h * 0.32, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, r: 3 + Math.random() * 4, c: cols[Math.floor(Math.random() * cols.length)], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, sq: Math.random() > 0.5 };
    });
    const t0 = performance.now();
    const frame = (now) => {
      const k = (now - t0) / 1800;
      ctx.clearRect(0, 0, w, h);
      parts.forEach((p) => {
        p.vy += 0.16; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
        if (p.sq) ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); else { ctx.beginPath(); ctx.arc(0, 0, p.r / 1.4, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      });
      if (k < 1) requestAnimationFrame(frame); else ctx.clearRect(0, 0, w, h);
    };
    requestAnimationFrame(frame);
  };
})();
