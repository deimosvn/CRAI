/* CRAI Club · modo real: cuentas, perfiles, publicaciones y mensajes con Firebase.
   Solo se activa cuando la página define window.CRAI_LIVE y firebase.js entrega su API. */
(function () {
  'use strict';
  if (!window.CRAI_LIVE) return;
  const C = window.CRAI;
  const D = C.D;
  const S = C.S;
  const $ = C.$;
  const $$ = C.$$;
  const esc = C.esc;
  const icon = C.icon;

  let fb = null;
  let intent = null;
  let unsubs = [];
  const commentWatch = {};

  /* ---------- Contenido de ejemplo cuando el club es real ---------- */
  D.people.forEach((p) => { p.demo = true; });
  const q3 = D.quests.find((q) => q.id === 'q3');
  if (q3) q3.start = 0;
  const q4 = D.quests.find((q) => q.id === 'q4');
  if (q4) Object.assign(q4, { start: 0, hint: 'Solicita colaborar en un proyecto o invita a dos personas a sumarse al tuyo.', go: 'projects', cta: 'Ver proyectos' });

  /* ---------- Utilidades ---------- */
  const ERR = {
    'auth/invalid-email': 'Ese correo no parece válido.',
    'auth/missing-password': 'Escribe tu contraseña.',
    'auth/weak-password': 'La contraseña necesita al menos 6 caracteres.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Entra en lugar de crear otra.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'No hay una cuenta con ese correo.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos y vuelve a probar.',
    'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de terminar.',
    'auth/cancelled-popup-request': 'Cerraste la ventana de Google antes de terminar.',
    'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
    'auth/operation-not-allowed': 'Este método de acceso todavía no está activado en el proyecto.',
    'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase Authentication.',
    'auth/popup-blocked': 'Tu navegador bloqueó la ventana de Google. Permite ventanas emergentes o entra con tu correo.',
    'auth/web-storage-unsupported': 'Tu navegador no permite guardar la sesión. Abre la página en Safari o Chrome.',
    'auth/internal-error': 'Google no respondió. Si estás dentro de Instagram o Facebook, abre la página en tu navegador.',
    'auth/user-disabled': 'Esta cuenta está desactivada.',
    'auth/account-exists-with-different-credential': 'Ese correo ya está registrado con otro método. Entra con tu correo y contraseña.',
    'auth/requires-recent-login': 'Por seguridad, cierra sesión, vuelve a entrar y repite la acción.',
    'permission-denied': 'No tienes permiso para hacer esto.',
    unavailable: 'Sin conexión con la base de datos. Intenta de nuevo.'
  };
  // Navegadores dentro de apps (Instagram, Facebook, TikTok…): Google no deja iniciar sesión ahí.
  const UA = navigator.userAgent || '';
  const IN_APP = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Line\/|TikTok|musical_ly|BytedanceWebview|LinkedInApp|Snapchat|Twitter/i.test(UA) || (/Android/.test(UA) && /; wv\)/.test(UA));
  const siteLink = () => location.origin + location.pathname.replace(/index\.html$/, '');
  const INTENT_KEY = 'crai.intent';
  const keepIntent = () => { try { sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent || { view: 'inicio' })); } catch (e) { /* sin almacenamiento */ } };
  const dropIntent = () => { try { sessionStorage.removeItem(INTENT_KEY); } catch (e) { /* nada */ } };
  let pendingName = '';
  const errMsg = (e) => ERR[e && e.code] || 'Algo salió mal. Intenta de nuevo.';
  const onErr = (e) => {
    if (window.console) console.warn('CRAI', e);
    if (e && e.code === 'permission-denied') C.toast('No pudimos leer datos del club. Revisa las reglas de Firestore.', 'info');
  };
  const busy = (btn, label) => {
    if (!btn) return;
    if (label) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.textContent = label; }
    else { btn.disabled = false; if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
  };
  const hashHue = (s) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };
  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const monthOf = (ms) => { const d = new Date(ms); return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  const arr = (v) => (Array.isArray(v) ? v : []);
  const clip = (v, n) => String(v == null ? '' : v).slice(0, n);
  const list = (v, n) => arr(v).slice(0, n).map((x) => clip(x, 60));
  const DOORS = ['founders', 'underground', 'both'];

  /* ---------- Perfiles: Firestore <-> app ---------- */
  function toPerson(d) {
    const created = fb.ts(d.createdAt);
    const seen = d.lastSeen ? fb.ts(d.lastSeen) : 0;
    return {
      id: d.uid, uid: d.uid, live: true,
      name: d.name || 'Miembro', role: d.role || '', door: DOORS.includes(d.door) ? d.door : 'both',
      hue: typeof d.hue === 'number' ? d.hue : hashHue(d.uid),
      building: d.building || '', bio: d.bio || '', skills: arr(d.skills), learn: arr(d.learn), seeking: arr(d.seeking), offers: d.offers || '',
      needsTags: arr(d.needsTags), offerTags: arr(d.offerTags), tags: arr(d.tags).length ? arr(d.tags) : arr(d.offerTags),
      avail: arr(d.avail), open: d.open !== false, interests: arr(d.interests),
      links: Object.assign({ linkedin: '', github: '', web: '' }, d.links || {}),
      privacy: Object.assign({ indexable: true, attendee: true }, d.privacy || {}),
      zone: d.zone || '', langs: arr(d.langs), prefers: d.prefers || '', style: d.style || '',
      toon: d.toon && typeof d.toon === 'object' ? d.toon : null,
      created, joined: monthOf(created), active: !!seen && Date.now() - seen < 864e5,
      levels: [], badges: [], endorsements: [], projectId: null
    };
  }
  function profileDoc(me) {
    const links = me.links || {};
    const privacy = me.privacy || {};
    return {
      name: clip(me.name, 60) || 'Miembro', role: clip(me.role, 80), door: DOORS.includes(me.door) ? me.door : 'both',
      building: clip(me.building, 160), bio: clip(me.bio, 400), skills: list(me.skills, 20), learn: list(me.learn, 20),
      seeking: list(me.seeking, 10), offers: clip(me.offers, 300), needsTags: list(me.needsTags, 20), offerTags: list(me.offerTags, 20),
      tags: list(me.offerTags, 20), avail: list(me.avail, 4), open: me.open !== false, interests: list(me.interests, 20),
      links: { linkedin: clip(links.linkedin, 200), github: clip(links.github, 200), web: clip(links.web, 200) },
      privacy: { indexable: privacy.indexable !== false, attendee: privacy.attendee !== false },
      zone: clip(me.zone, 60), langs: list(me.langs, 8), prefers: clip(me.prefers, 40), style: clip(me.style, 200),
      hue: Number(me.hue) || 0, toon: C.toonOf(me)
    };
  }
  function setMe(doc, user) {
    const prev = S.me || {};
    S.me = Object.assign(toPerson(doc), { id: 'me', uid: user.uid, email: user.email || '', number: prev.uid === user.uid ? prev.number : undefined });
  }
  C.liveStats = (p) => {
    const posts = S.livePosts.filter((x) => x.authorId === p.uid);
    return {
      posts: posts.length,
      comments: posts.reduce((n, x) => n + (x.commentCount || 0), 0),
      days: p.created ? Math.max(1, Math.ceil((Date.now() - p.created) / 864e5)) : 1,
      skills: (p.skills || []).length
    };
  };
  C.unread = () => S.inbox.filter((r) => !r.read).length;

  /* ---------- Escuchas en vivo ---------- */
  function stopWatchers() {
    unsubs.forEach((u) => { try { u(); } catch (e) { /* nada */ } });
    unsubs = [];
    Object.keys(commentWatch).forEach((k) => { try { commentWatch[k](); } catch (e) { /* nada */ } delete commentWatch[k]; });
  }
  function startWatchers() {
    const uid = S.auth.user.uid;
    unsubs.push(fb.watchProfiles((rows) => {
      const all = rows.map(toPerson).sort((a, b) => a.created - b.created);
      all.forEach((p, i) => { p.number = i + 1; p.badges = p.number <= 30 ? ['fundador'] : []; });
      const mine = all.find((p) => p.uid === uid);
      if (mine) Object.assign(S.me, { number: mine.number, badges: mine.badges, created: mine.created, joined: mine.joined });
      S.liveMembers = all.filter((p) => p.uid !== uid);
      S.liveById = Object.fromEntries(S.liveMembers.map((p) => [p.id, p]));
      softRender();
    }, onErr));
    unsubs.push(fb.watchPosts((rows) => {
      S.livePosts = rows.filter((r) => D.TYPES[r.type]).map((r) => ({
        id: r.id, live: true, type: r.type, author: r.authorId === uid ? 'me' : r.authorId, authorId: r.authorId,
        ts: fb.ts(r.createdAt), text: r.text || '', tags: arr(r.tags).filter((t) => D.TAGS[t]), project: null, commentCount: r.commentCount || 0, comments: []
      }));
      softRender();
    }, onErr));
    unsubs.push(fb.watchInbox(uid, (rows) => {
      S.inbox = rows.map((r) => ({ id: r.id, fromId: r.fromId, text: r.text || '', read: !!r.read, ts: fb.ts(r.createdAt) })).sort((a, b) => b.ts - a.ts);
      updateBell();
      if (S.view === 'inicio') softRender();
    }, onErr));
    unsubs.push(fb.watchOutbox(uid, (rows) => {
      rows.forEach((r) => { if (r.toId && !S.contacted.includes(r.toId)) S.contacted.push(r.toId); });
    }, onErr));
    if (C.isAdmin()) {
      const adminView = () => { if (S.view === 'admin') softRender(); };
      unsubs.push(fb.watchReports((rows) => { S.admin.reports = rows.map((r) => ({ ...r, ts: fb.ts(r.createdAt) })); adminView(); }, onErr));
      unsubs.push(fb.watchApplications((rows) => { S.admin.apps = rows.map((r) => ({ ...r, uid: r.id, ts: fb.ts(r.createdAt) })).sort((a, b) => b.ts - a.ts); adminView(); }, onErr));
      unsubs.push(fb.watchBans((rows) => { S.admin.bans = rows.map((r) => ({ ...r, uid: r.id, ts: fb.ts(r.createdAt) })).sort((a, b) => b.ts - a.ts); adminView(); }, onErr));
    }
  }
  // Administración: correo verificado que esté en la lista de config.js (las reglas lo vuelven a comprobar).
  const ADMINS = ((window.CRAI_CONFIG || {}).admins || []).map((m) => String(m).toLowerCase());
  S.admin = { reports: [], apps: [], bans: [] };
  C.isAdmin = () => !!(S.auth.user && S.auth.user.emailVerified && ADMINS.includes(String(S.auth.user.email || '').toLowerCase()));

  // Repinta sin interrumpir a quien está escribiendo.
  let dirty = false;
  function softRender() {
    if (S.mode !== 'app') return;
    const ae = document.activeElement;
    if (ae && ae.closest && ae.closest('#view') && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) { dirty = true; return; }
    dirty = false;
    if (S.view === 'perfil') return;
    if (S.view === 'community' && $('#feed')) {
      const open = $$('.comments:not([hidden])').map((b) => b.id.slice(3));
      $('#feed').innerHTML = C.feedList();
      open.forEach(openComments);
    } else C.rerender();
    C.refreshLayers();
  }
  document.addEventListener('focusout', () => { setTimeout(() => { if (dirty) softRender(); }, 250); });

  function updateBell() {
    $$('[data-act="notifs"]').forEach((b) => b.classList.toggle('has-dot', C.unread() > 0));
  }
  function updateTopbar() {
    const signed = !!S.auth.user;
    $$('#topbar [data-act="login"]').forEach((b) => { b.hidden = signed; });
    $$('#topbar [data-act="join"]').forEach((b) => { b.textContent = signed ? 'Mi club' : 'Únete'; });
    $$('.foot-grid [data-act="login"]').forEach((b) => { b.textContent = signed ? 'Ir a mi club' : 'Entrar al club'; });
  }
  C.afterRender = () => {
    if (!C.isLive()) return;
    updateBell();
    const pill = $('.demo-pill');
    if (pill) { pill.innerHTML = `${icon('eye')}Beta`; pill.title = 'Miembros, publicaciones y mensajes son reales. Proyectos y eventos todavía son de ejemplo.'; }
  };

  /* ---------- Comentarios en vivo ---------- */
  function renderCommentsBox(id) {
    const box = document.getElementById('cm-' + id);
    if (!box) return;
    $$('.comment, .no-comments', box).forEach((n) => n.remove());
    const items = S.liveComments[id] || [];
    box.querySelector('form').insertAdjacentHTML('beforebegin', items.length ? items.map(C.commentHTML).join('') : '<p class="fine no-comments">Sé la primera persona en comentar.</p>');
    const btn = $(`[data-act="comments"][data-id="${id}"]`);
    const post = S.livePosts.find((p) => p.id === id);
    if (btn && post) { const n = C.commentCount(post); btn.innerHTML = icon('chat') + (n ? `${n} ${n === 1 ? 'comentario' : 'comentarios'}` : 'Comentar'); }
  }
  function openComments(id) {
    const box = document.getElementById('cm-' + id);
    if (!box) return;
    box.hidden = false;
    const btn = $(`[data-act="comments"][data-id="${id}"]`);
    if (btn) btn.setAttribute('aria-expanded', 'true');
    if (!commentWatch[id]) {
      commentWatch[id] = fb.watchComments(id, (rows) => {
        S.liveComments[id] = rows.map((r) => ({ author: r.authorId === S.auth.user.uid ? 'me' : r.authorId, text: r.text || '', ts: fb.ts(r.createdAt) }));
        renderCommentsBox(id);
      }, onErr);
    } else renderCommentsBox(id);
  }

  /* ---------- Entrar: Google o correo ---------- */
  const GOOGLE = '<svg class="g-logo" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  let authMode = 'signup';
  let authMsg = '';
  function authHTML() {
    const up = authMode === 'signup';
    return `<div class="auth">
      <header class="m-head"><h2>${up ? 'Únete a CRAI' : 'Entra a CRAI'}</h2><button type="button" class="icon-btn" data-act="close" aria-label="Cerrar">${icon('x')}</button></header>
      <div class="m-body">
        <div class="auth-crowd" aria-hidden="true">${['valeria', 'ivan', 'mariana', 'salvador', 'ximena'].map((id) => C.avatar(C.person(id), 'md')).join('')}</div>
        <p class="muted">${esc(authMsg || (up ? 'Crea tu cuenta para armar tu perfil, publicar y conectar con quienes construyen en Mexicali.' : 'Qué bueno verte de vuelta.'))}</p>
        ${IN_APP ? `<div class="auth-inapp">${icon('info')}<span><b>Estás dentro de una app</b> (Instagram, Facebook o similar). Google no permite entrar desde aquí: usa tu correo, o abre la página en Safari o Chrome.</span><button type="button" class="btn btn-sm" data-act="copy-link" data-link="${esc(siteLink())}">${icon('link')}Copiar enlace</button></div>`
          : `<button type="button" class="btn btn-lg auth-google" data-act="auth-google">${GOOGLE}Continuar con Google</button>`}
        <div class="auth-or"><span>${IN_APP ? 'entra con tu correo' : 'o con tu correo'}</span></div>
        <form data-form="auth-email" class="auth-form" novalidate>
          ${up ? '<label class="fld"><span>Tu nombre</span><input class="inp" id="authName" name="name" autocomplete="name" maxlength="60" autofocus></label>' : ''}
          <label class="fld"><span>Correo</span><input class="inp" id="authEmail" name="email" type="email" inputmode="email" autocapitalize="off" autocomplete="email"${up ? '' : ' autofocus'}></label>
          <label class="fld"><span>Contraseña</span><input class="inp" id="authPass" name="password" type="password" autocomplete="${up ? 'new-password' : 'current-password'}">${up ? '<small>Mínimo 6 caracteres.</small>' : ''}</label>
          <p class="auth-err" id="authErr" role="alert"></p>
          <button class="btn btn-primary btn-lg" type="submit">${up ? 'Crear cuenta' : 'Entrar'}</button>
        </form>
        <div class="auth-links"><button type="button" class="link-btn" data-act="auth-mode">${up ? '¿Ya tienes cuenta? Entra' : '¿Primera vez? Crea tu cuenta'}</button>${up ? '' : '<button type="button" class="link-btn" data-act="auth-reset">Olvidé mi contraseña</button>'}</div>
        <p class="fine">Al ${up ? 'crear tu cuenta' : 'entrar'} aceptas las <a href="#reglas" data-act="nav-to" data-t="reglas">reglas del club</a> y el <a href="privacidad.html" target="_blank" rel="noopener">aviso de privacidad</a>.</p>
      </div>
    </div>`;
  }
  function openAuth(want, msg, mode) {
    if (want) intent = want;
    authMsg = msg || '';
    if (mode) authMode = mode;
    const top = C.topLayer && C.topLayer();
    if (top && top.querySelector('.auth')) { const p = authPanel(); if (p && mode) p.innerHTML = authHTML(); return; }
    C.closeAll();
    C.openLayer('modal', authHTML(), { label: authMode === 'signup' ? 'Únete a CRAI' : 'Entra a CRAI' });
  }
  // «Únete» abre directo el registro y «Entrar» el inicio de sesión; con sesión, llevan al club.
  C.openJoin = (mode = 'signup') => {
    if (C.isLive()) { go0('inicio'); return; }
    if (S.auth.user && !S.auth.profile) { intent = { view: 'inicio' }; flushPending(); return; }
    if (!S.auth.ready || !fb) { authMode = mode; waitForFirebase({ view: 'inicio' }); return; }
    openAuth({ view: 'inicio' }, '', mode);
  };
  const authPanel = () => { const p = $('#layers .layer:last-child .modal'); return p && p.querySelector('.auth') ? p : null; };
  const authError = (msg) => { const el = $('#authErr'); if (el) el.textContent = msg; };

  /* ---------- Sesión ---------- */
  async function onUser(user) {
    stopWatchers();
    S.auth.user = user || null;
    S.auth.profile = false;
    if (!user) {
      C.store.scope(null);
      C.reloadLocal();
      S.me = Object.assign({}, JSON.parse(JSON.stringify(D.me)), C.store.get('me', {}));
      S.liveMembers = []; S.liveById = {}; S.livePosts = []; S.inbox = []; S.liveComments = {}; S.admin = { reports: [], apps: [], bans: [] };
      fb.identify(null, { con_cuenta: 'no' });
      S.auth.ready = true;
      updateTopbar();
      if (S.mode === 'app') C.go('landing');
      flushPending();
      return;
    }
    C.store.scope(user.uid);
    C.reloadLocal();
    let doc = null;
    try { doc = await fb.getProfile(user.uid); } catch (e) {
      // Sin conexión o error de permisos: no confundirlo con «todavía no tiene perfil».
      onErr(e);
      S.auth.ready = true;
      intent = null;
      dropIntent();
      updateTopbar();
      C.closeAll();
      C.toast('No pudimos cargar tu perfil. Revisa tu conexión y recarga la página.', 'info');
      return;
    }
    let banned = false;
    try { banned = await fb.isBanned(user.uid); } catch (e) { /* sin acceso a la lista: se trata como no bloqueada */ }
    if (banned) {
      S.auth.ready = true;
      intent = null;
      dropIntent();
      C.closeAll();
      const mail = (window.CRAI_CONFIG || {}).contactEmail;
      C.toast(`El equipo de CRAI bloqueó esta cuenta. Si crees que es un error, escríbenos${mail ? ` a ${esc(mail)}` : ''}.`, 'shield');
      fb.signOut().catch(() => {});
      return;
    }
    fb.identify(user.uid, { con_cuenta: 'si', con_perfil: doc ? 'si' : 'no', puerta: doc && DOORS.includes(doc.door) ? doc.door : 'sin_perfil' });
    if (doc) {
      setMe(doc, user);
      S.auth.profile = true;
      startWatchers();
      fb.touch(user.uid).catch(() => {});
    }
    S.auth.ready = true;
    updateTopbar();
    flushPending();
    const auth = authPanel();
    if (auth) C.closeLayer(auth.closest('.layer'));
    if (S.auth.profile && S.mode === 'app') C.rerender();
  }
  function saveApplication() {
    const a = S.applied;
    if (!a || !S.auth.user) return;
    fb.saveApplication(S.auth.user.uid, { name: clip(a.name, 60), building: clip(a.building, 160), need: clip(a.need, 160), door: DOORS.includes(a.door) ? a.door : 'both' })
      .then(() => { C.track('generate_lead', { lead_source: 'miembros_fundadores', puerta: DOORS.includes(a.door) ? a.door : 'both' }); C.toast('Guardamos tu solicitud de miembro fundador.', 'sun'); })
      .catch((e) => C.toast(`No pudimos guardar tu solicitud: ${esc(errMsg(e))}`, 'info'));
  }
  const go0 = C.go;
  function flushPending() {
    const want = intent || (C.pendingView ? { view: C.pendingView } : null);
    C.pendingView = null;
    if (!want) return;
    if (!S.auth.user) { openAuth(want); return; }
    intent = null;
    dropIntent();
    if (want.apply) saveApplication();
    if (!S.auth.profile) {
      C.closeAll();
      setTimeout(() => C.openOnboarding(want.door || (S.applied && S.applied.door) || 'both', null, { name: S.auth.user.displayName || pendingName }), 120);
      return;
    }
    C.closeAll();
    if (want.person) { go0('people'); setTimeout(() => C.openPerson(want.person), 600); return; }
    go0(want.view || 'inicio');
  }

  // Mientras Firebase carga, se guarda lo que la persona quería hacer; si nunca carga, se le avisa.
  const waitForFirebase = (want) => {
    intent = want;
    if (S.auth.failed) C.toast('No pudimos conectar con el club. Revisa tu conexión o desactiva el bloqueador de contenido y recarga.', 'info');
    else C.toast('Conectando con el club…', 'clock');
  };
  // Todas las secciones del club piden sesión.
  C.go = (view, e, el) => {
    if (view === 'landing' || C.isLive()) return go0(view, e, el);
    const want = { view };
    if (!S.auth.ready || !fb) { waitForFirebase(want); return undefined; }
    if (!S.auth.user) { openAuth(want); return undefined; }
    intent = want;
    flushPending();
    return undefined;
  };
  const ob0 = C.openOnboarding;
  C.openOnboarding = (door, e, prefill) => {
    if (S.auth.user && !S.auth.profile) return ob0(door, e, Object.assign({ name: S.auth.user.displayName || pendingName }, prefill || {}));
    if (C.isLive()) return go0('inicio', e);
    const want = { door, view: 'inicio' };
    if (!S.auth.ready || !fb) { waitForFirebase(want); return undefined; }
    openAuth(want);
    return undefined;
  };
  C.liveFinishOnboarding = (e, el, ob) => {
    if (!S.auth.user || S.auth.profile) return false;
    const user = S.auth.user;
    const fresh = {
      id: 'me', uid: user.uid, email: user.email || '', name: ob.name || user.displayName || pendingName || 'Miembro', role: ob.role || 'Miembro de CRAI',
      door: ob.door, building: ob.building, needsTags: ob.needs, offerTags: ob.offers, tags: ob.offers.slice(), seeking: ob.seeking,
      bio: '', skills: [], learn: [], offers: '', avail: ['tardes'], open: true, interests: [],
      links: { linkedin: '', github: '', web: '' }, privacy: { indexable: true, attendee: true },
      zone: '', langs: ['Español'], prefers: 'Café en persona', style: '', hue: hashHue(user.uid), badges: [], levels: []
    };
    fresh.toon = C.toonOf(fresh);
    busy(el, 'Guardando…');
    fb.saveProfile(user.uid, profileDoc(fresh), true).then(() => {
      S.me = fresh;
      S.auth.profile = true;
      startWatchers();
      updateTopbar();
      if (S.applied) saveApplication();
      C.track('tutorial_complete', { puerta: fresh.door });
      fb.identify(user.uid, { con_perfil: 'si', puerta: fresh.door });
      go0('inicio', e, el);
      setTimeout(() => C.toast(`Te damos la bienvenida a CRAI, ${esc(C.firstName(S.me))}. Arma tu personaje en Mi perfil.`, 'sun'), 700);
    }).catch((err) => {
      busy(el, null);
      C.toast(`No pudimos guardar tu perfil: ${esc(errMsg(err))}`, 'info');
    });
    return true;
  };
  let saveTimer = 0;
  C.liveSaveProfile = () => {
    if (!C.isLive()) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      fb.saveProfile(S.auth.user.uid, profileDoc(S.me), false).catch((e) => C.toast(`No se guardó tu perfil: ${esc(errMsg(e))}`, 'info'));
    }, 600);
  };

  /* ---------- Notificaciones (mensajes recibidos) ---------- */
  function notifsHTML() {
    const items = S.inbox.slice(0, 30);
    return `<div class="m-head" style="position:static;padding-bottom:8px"><h2 style="font-size:18px">Notificaciones</h2><button class="icon-btn" data-act="close" aria-label="Cerrar">${icon('x')}</button></div>
      ${items.length ? items.map((r) => {
        const p = C.person(r.fromId);
        return `<div class="notif live${r.read ? '' : ' unread'}">${C.avatar(p, 'sm', { hc: true })}<span><p><b>${esc(p.name)}</b> quiere platicar contigo</p><p class="notif-msg">«${esc(r.text)}»</p><small>${C.ago((Date.now() - r.ts) / 36e5)}</small>
          <span class="notif-actions"><button class="btn btn-sm btn-door" data-act="reply-req" data-id="${esc(r.fromId)}">Responder</button><button class="btn btn-sm" data-act="person" data-id="${esc(r.fromId)}">Ver perfil</button></span></span></div>`;
      }).join('') : `<div class="empty" style="margin:8px 16px 16px">${icon('bell')}<p>Aquí verás cuando alguien quiera platicar contigo.</p></div>`}`;
  }

  /* ---------- Acciones y formularios del modo real ---------- */
  C.liveActions = {
    'auth-google': (el) => {
      authError('');
      busy(el, 'Abriendo Google…');
      keepIntent();
      fb.google().catch((e) => { busy(el, null); dropIntent(); authError(errMsg(e)); });
    },
    'auth-mode': () => { authMode = authMode === 'signup' ? 'signin' : 'signup'; const p = authPanel(); if (p) p.innerHTML = authHTML(); },
    'auth-reset': () => {
      const email = (($('#authEmail') || {}).value || '').trim();
      if (!email) { authError('Escribe tu correo y vuelve a tocar «Olvidé mi contraseña».'); return; }
      fb.reset(email).then(() => authError('Si hay una cuenta con ese correo, te llegará un enlace para cambiar la contraseña.')).catch((e) => authError(errMsg(e)));
    },
    'sign-out': () => { fb.signOut().then(() => C.toast('Cerraste sesión.', 'exit')).catch((e) => C.toast(esc(errMsg(e)), 'info')); },
    notifs: () => {
      C.openLayer('pop', notifsHTML(), { label: 'Notificaciones' });
      S.inbox.filter((r) => !r.read).forEach((r) => fb.markRead(r.id).catch(() => {}));
    },
    'reply-req': (el) => {
      const p = C.person(el.dataset.id);
      C.closeAll();
      setTimeout(() => C.openContact(el.dataset.id, { text: `Hola ${C.firstName(p)}, gracias por escribirme. ` }), 120);
    },
    comments: (el, e) => {
      const id = el.dataset.id;
      if (!S.livePosts.some((p) => p.id === id)) { C.baseActions.comments(el, e); return; }
      const box = document.getElementById('cm-' + id);
      if (box && !box.hidden) { box.hidden = true; el.setAttribute('aria-expanded', 'false'); return; }
      openComments(id);
      const i = box && box.querySelector('input');
      if (i) i.focus({ preventScroll: true });
    },
    'delete-post': (el) => {
      if (el.dataset.armed !== '1') {
        el.dataset.armed = '1';
        el.innerHTML = `${icon('x')}Toca otra vez para eliminar`;
        setTimeout(() => { if (document.contains(el)) { el.dataset.armed = ''; el.innerHTML = `${icon('x')}Eliminar`; } }, 4000);
        return;
      }
      fb.deletePost(el.dataset.id).then(() => C.toast('Publicación eliminada.', 'x')).catch((e) => C.toast(esc(errMsg(e)), 'info'));
    },
    'toggle-demo': () => { S.showDemo = !S.showDemo; C.save(); C.rerender(); },
    invite: () => {
      C.track('share', { method: 'invitar', content_type: 'club' });
      const text = `Te invito a CRAI Club, la comunidad de quienes construyen en Mexicali: ${siteLink()}`;
      const fail = () => C.toast(`Copia y comparte: ${esc(siteLink())}`, 'link');
      if (navigator.share && matchMedia('(pointer: coarse)').matches) { navigator.share({ title: 'CRAI Club', text, url: siteLink() }).catch(() => {}); return; }
      try { navigator.clipboard.writeText(text).then(() => C.toast('Invitación copiada. Pégala donde quieras.', 'link'), fail); } catch (e) { fail(); }
    },
    'change-pass': () => {
      fb.reset(S.auth.user.email).then(() => C.toast('Te enviamos un enlace a tu correo para cambiar la contraseña.', 'send'))
        .catch((e) => C.toast(esc(errMsg(e)), 'info'));
    },
    'resend-verify': (el) => {
      busy(el, 'Enviando…');
      fb.resendVerification().then(() => { busy(el, null); el.remove(); C.toast('Te enviamos otro correo de verificación.', 'send'); })
        .catch((e) => { busy(el, null); C.toast(esc(errMsg(e)), 'info'); });
    },
    // Borrado de cuenta en dos toques: perfil, publicaciones, mensajes, solicitud y la cuenta misma.
    'delete-account': (el) => {
      if (el.dataset.armed !== '1') {
        el.dataset.armed = '1';
        el.innerHTML = `${icon('x')}Toca otra vez para borrar todo`;
        setTimeout(() => { if (document.contains(el) && !el.disabled) { el.dataset.armed = ''; el.innerHTML = `${icon('x')}Eliminar mi cuenta`; } }, 5000);
        return;
      }
      const uid = S.auth.user.uid;
      busy(el, 'Borrando tu cuenta…');
      stopWatchers();
      fb.deleteAccount().then(() => {
        C.track('account_delete');
        C.store.scope(uid); C.store.clear(); C.store.scope(null);
        C.toast('Borramos tu cuenta y tus datos del club.', 'check');
      }).catch((e) => {
        busy(el, null);
        el.dataset.armed = '';
        C.toast(e && e.code === 'auth/requires-recent-login'
          ? 'Por seguridad, cierra sesión y vuelve a entrar; después elimina tu cuenta.'
          : `No pudimos borrar tu cuenta: ${esc(errMsg(e))}`, 'info');
        onUser(fb.currentUser());
      });
    },
    report: (el) => {
      fb.report(S.auth.user.uid, el.dataset.id, 'perfil').then(() => C.track('report_submit', { kind: 'perfil' })).then(() => C.toast('Gracias. El equipo revisará este perfil.', 'shield')).catch((e) => C.toast(esc(errMsg(e)), 'info'));
    },
    'enter-applied': (el, e) => {
      if (S.auth.user && !S.auth.profile) { saveApplication(); C.openOnboarding((S.applied && S.applied.door) || 'both', e); return; }
      C.baseActions['enter-applied'](el, e);
    }
  };
  C.liveForms = {
    'auth-email': (f) => {
      const up = authMode === 'signup';
      const name = ((f.elements.name || {}).value || '').trim();
      const email = f.elements.email.value.trim();
      const pass = f.elements.password.value;
      if (up && !name) { authError('Escribe tu nombre.'); return; }
      if (!email) { authError('Escribe tu correo.'); return; }
      if (pass.length < 6) { authError('La contraseña necesita al menos 6 caracteres.'); return; }
      authError('');
      const btn = f.querySelector('[type="submit"]');
      if (up) pendingName = name.slice(0, 60);
      busy(btn, up ? 'Creando tu cuenta…' : 'Entrando…');
      (up ? fb.signUp(name, email, pass) : fb.signIn(email, pass)).catch((e) => { busy(btn, null); authError(errMsg(e)); });
    },
    compose: (f, e) => {
      const fd = new FormData(f);
      const text = String(fd.get('text') || '').trim().slice(0, 500);
      if (!text) return;
      const type = String(fd.get('type') || 'building');
      const tags = fd.getAll('tags').map(String).filter((t) => D.TAGS[t]).slice(0, 8);
      const btn = f.querySelector('[type="submit"]');
      busy(btn, 'Publicando…');
      fb.addPost(S.auth.user.uid, { type, text, tags, project: null }).then(() => {
        S.ff = { type: 'all', sort: 'recent' };
        C.closeAll();
        C.toast('Publicado en Community.', 'send');
        C.track('post_create', { post_type: type, temas: tags.length });
        if (S.view === 'community' && S.mode === 'app') C.rerender(); else go0('community', e, btn);
        if (type === 'building' || type === 'launched') C.advanceQuest('q2');
      }).catch((err) => { busy(btn, null); C.toast(`No se pudo publicar: ${esc(errMsg(err))}`, 'info'); });
    },
    comment: (f, e) => {
      const id = f.dataset.id;
      if (!S.livePosts.some((p) => p.id === id)) { C.baseForms.comment(f, e); return; }
      const input = f.elements.text;
      const text = input.value.trim().slice(0, 300);
      if (!text) return;
      input.disabled = true;
      fb.addComment(S.auth.user.uid, id, text)
        .then(() => { f.reset(); C.track('comment_create'); })
        .catch((err) => C.toast(`No se pudo comentar: ${esc(errMsg(err))}`, 'info'))
        .finally(() => { input.disabled = false; input.focus({ preventScroll: true }); });
    },
    contact: (f, e) => {
      const id = f.dataset.id;
      const p = C.person(id);
      if (!p.live) { C.baseForms.contact(f, e); return; }
      const text = f.elements.text.value.trim().slice(0, 600);
      if (!text) return;
      const fmt = String(new FormData(f).get('fmt') || 'cafe').slice(0, 10);
      const btn = f.querySelector('[type="submit"]');
      busy(btn, 'Enviando…');
      fb.sendRequest(S.auth.user.uid, id, text, fmt).then(() => {
        C.track('contact_request', { formato: fmt, tipo: f.dataset.help === '1' ? 'ofrecer_ayuda' : 'primer_contacto' });
        if (!S.contacted.includes(id)) S.contacted.push(id);
        C.save();
        const panel = f.closest('.modal');
        const layer = panel.parentElement;
        if ((p.tags || []).some((t) => (S.me.needsTags || []).includes(t))) layer._onClose = () => C.advanceQuest('q1');
        panel.innerHTML = C.sentHTML(p, f.dataset.help === '1', true);
        C.refreshLayers();
      }).catch((err) => { busy(btn, null); C.toast(`No se pudo enviar: ${esc(errMsg(err))}`, 'info'); });
    }
  };

  // Formulario de miembros fundadores de la landing.
  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (!f.dataset || f.dataset.form !== 'apply') return;
    setTimeout(() => {
      if (!S.applied) return;
      if (S.auth.user) saveApplication();
      else openAuth({ apply: true, door: S.applied.door, view: 'inicio' }, 'Crea tu cuenta para guardar tu solicitud y completar tu perfil.');
    }, 0);
  });

  /* ---------- Arranque ---------- */
  const note = $('#applyForm .fine');
  if (note) note.textContent = 'Te pediremos crear una cuenta para guardar tu solicitud.';
  const h = location.hash.slice(1);
  if (h.indexOf('p-') === 0) {
    intent = { person: h.slice(2) };
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* nada */ }
  } else {
    // Vuelta de un inicio de sesión con redirección: retomar lo que la persona quería hacer.
    try { const saved = JSON.parse(sessionStorage.getItem(INTENT_KEY) || 'null'); if (saved) intent = saved; } catch (e) { /* nada */ }
  }
  C.attachFirebase = (api) => {
    if (fb) return;
    fb = C.fb = api;
    C.flushTrack();
    S.auth.failed = false;
    fb.onUser(onUser);
  };
  if (window.CRAI_FB) C.attachFirebase(window.CRAI_FB);
  // Si el SDK no carga (sin red o bloqueado), los botones avisan en lugar de quedarse «conectando».
  setTimeout(() => { if (!fb) S.auth.failed = true; }, 10000);
})();
