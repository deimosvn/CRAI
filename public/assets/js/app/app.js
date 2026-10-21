/* CRAI Club · app: navegación, cajones, diálogos y acciones */
(function () {
  'use strict';
  const C = window.CRAI;
  const D = C.D;
  const S = C.S;
  const $ = C.$;
  const $$ = C.$$;
  const esc = C.esc;
  const icon = C.icon;
  const doc = document;
  const root = doc.documentElement;
  const APP_VIEWS = ['inicio', 'people', 'projects', 'community', 'events', 'explore', 'match', 'quests', 'perfil', 'blueprint', 'admin'];

  const NAV = [
    { id: 'inicio', label: 'Inicio', icon: 'home' },
    { id: 'people', label: 'People', icon: 'users' },
    { id: 'projects', label: 'Projects', icon: 'box' },
    { id: 'community', label: 'Community', icon: 'chat' },
    { id: 'events', label: 'Events', icon: 'cal' },
    { id: 'explore', label: 'Explore', icon: 'compass' },
    { sep: 'Conectar' },
    { id: 'match', label: 'Collab Match', icon: 'radar' },
    { id: 'quests', label: 'Quests', icon: 'flag' },
    { sep: 'Tú' },
    { id: 'perfil', label: 'Mi perfil', icon: 'user' }
  ];
  // Blueprint (documento interno) sigue disponible en #blueprint, pero no aparece en la navegación.
  // «Administración» solo aparece para las cuentas admin (ver config.js y firestore.rules).
  const navItems = () => (C.isAdmin && C.isAdmin() ? [...NAV, { id: 'admin', label: 'Administración', icon: 'shield' }] : NAV);

  /* ---------- Shell ---------- */
  const railMe = () => `${C.avatar(S.me, 'sm')}<span><b>${esc(S.me.name)}</b><small>${esc(S.me.role)}</small></span>`;
  function shellHTML() {
    return `<div class="shell">
      <aside class="rail" aria-label="Navegación principal">
        <button class="rail-brand logo" data-go="landing" aria-label="Volver a clubcrai.com"><span class="logo-mark"></span><span>CRAI <em>CLUB</em></span></button>
        <nav class="rail-nav">${navItems().map((n) => n.sep ? `<p class="nav-sep">${n.sep}</p>`
          : `<button class="nav-item" data-go="${n.id}" title="${n.label}">${icon(n.icon)}<span>${n.label}</span>${n.badge ? `<b class="nav-badge">${n.badge}</b>` : ''}</button>`).join('')}</nav>
        <div class="rail-cta"><button class="need-btn" data-act="need" title="Necesito a alguien que…">${icon('spark')}<span>Necesito a alguien que…</span></button></div>
        <button class="rail-me" data-go="perfil" id="railMe">${railMe()}</button>
      </aside>
      <div class="main">
        <header class="appbar">
          <button class="appbar-brand logo" data-go="landing" aria-label="Volver a clubcrai.com"><span class="logo-mark"></span></button>
          <button class="search-trigger" data-act="palette" aria-label="Buscar personas, proyectos, eventos y temas">${icon('search')}<span>Buscar personas, proyectos, eventos…</span><kbd>Ctrl K</kbd></button>
          <span class="demo-pill" title="Personas, proyectos y eventos ficticios para mostrar el producto">${icon('eye')}Datos de ejemplo</span>
          <div class="appbar-actions">
            <button class="icon-btn" data-act="theme" aria-label="Cambiar entre tema claro y oscuro">${icon('sun', 'i-sun')}${icon('moon', 'i-moon')}</button>
            <button class="icon-btn has-dot" data-act="notifs" aria-label="Notificaciones">${icon('bell')}</button>
            <button class="btn btn-primary publish-btn" data-act="compose" data-type="building">${icon('plus')}<span>Publicar</span></button>
          </div>
        </header>
        <main class="view" id="view" tabindex="-1"></main>
      </div>
      <nav class="tabbar" aria-label="Navegación">
        <button class="tab" data-go="inicio">${icon('home')}<span>Inicio</span></button>
        <button class="tab" data-go="people">${icon('users')}<span>People</span></button>
        <button class="tab tab-publish" data-act="compose" data-type="building" aria-label="Publicar"><span class="tab-plus">${icon('plus')}</span></button>
        <button class="tab" data-go="community">${icon('chat')}<span>Feed</span></button>
        <button class="tab" data-act="more" data-tab="more" aria-haspopup="dialog">${icon('grid')}<span>Más</span></button>
      </nav>
    </div>`;
  }
  const tabFor = (v) => (['inicio', 'people', 'community'].includes(v) ? v : 'more');
  function renderView() {
    const v = C.views[S.view] || C.views.inicio;
    const el = $('#view');
    if (!el) return;
    el.innerHTML = v.render();
    el.dataset.view = S.view;
    $$('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.go === S.view));
    $$('.tab[data-go], .tab[data-tab]').forEach((b) => b.classList.toggle('active', (b.dataset.go || b.dataset.tab) === tabFor(S.view)));
    C.mountMotion(el);
    $$('.mcard', el).forEach((m) => C.tilt(m, 10));
    if (C.afterRender) C.afterRender();
  }
  C.rerender = () => { if (S.mode !== 'app') return; const y = window.scrollY; renderView(); window.scrollTo(0, y); };
  const applyDoor = () => { if (S.mode === 'app' && S.door !== 'all') root.dataset.door = S.door; else root.removeAttribute('data-door'); };
  const setHash = (v) => { try { history.replaceState(null, '', v ? '#' + v : location.pathname + location.search); } catch (e) { /* nada */ } };

  function showLanding() {
    S.mode = 'landing';
    $('#appRoot').hidden = true;
    $('#site').hidden = false;
    root.dataset.mode = 'landing';
    applyDoor();
    window.scrollTo(0, 0);
    C.landing.resume();
    C.landing.refresh();
    setHash('');
  }
  function showApp(view) {
    S.mode = 'app';
    $('#site').hidden = true;
    const app = $('#appRoot');
    app.innerHTML = shellHTML();
    app.hidden = false;
    root.dataset.mode = 'app';
    applyDoor();
    S.view = view;
    renderView();
    window.scrollTo(0, 0);
    C.landing.pause();
  }
  C.go = (view, e, el) => {
    C.closeAll();
    if (view === 'landing') {
      if (S.mode === 'landing') { window.scrollTo({ top: 0, behavior: C.RM() ? 'auto' : 'smooth' }); return; }
      C.setVT(e, el);
      C.transition(showLanding, 'reveal');
      return;
    }
    if (!APP_VIEWS.includes(view)) view = 'inicio';
    if (S.mode !== 'app') { C.setVT(e, el); C.transition(() => showApp(view), 'reveal'); }
    else if (view === S.view) { C.rerender(); window.scrollTo({ top: 0, behavior: C.RM() ? 'auto' : 'smooth' }); }
    else C.transition(() => { S.view = view; renderView(); window.scrollTo(0, 0); });
    setHash(view);
  };

  /* ---------- Tema y puerta ---------- */
  C.toggleTheme = (e, el) => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    C.setVT(e, el);
    C.transition(() => { root.dataset.theme = next; try { localStorage.setItem('crai.v1.theme', JSON.stringify(next)); } catch (err) { /* sin almacenamiento */ } }, 'reveal');
  };
  function setDoor(d) {
    if (S.door === d) return;
    S.door = d;
    C.save();
    C.transition(() => { applyDoor(); renderView(); });
  }

  /* ---------- Contenido de cajones (se pueden refrescar en su lugar) ---------- */
  const STATUS_ICON = { team: 'userplus', help: 'buoy', testers: 'users', feedback: 'chat', launched: 'rocket' };
  const PATS = ['dots', 'grid', 'stripes', 'rings'];
  const GALLERY = { idea: ['Boceto', 'Mapa de usuarios', 'Encuesta'], prototipo: ['Boceto', 'Prototipo v2', 'Pruebas'], beta: ['Prototipo', 'Beta', 'Primeros usuarios'], lanzado: ['Prototipo', 'Lanzamiento', 'Clientes'] };
  const TESTERS = ['jorge', 'mariana', 'camila', 'tomas', 'daniela', 'salvador', 'paola', 'ximena'];
  function projectHTML(id) {
    const pr = C.project(id);
    const owner = C.person(pr.owner);
    const t = C.testersOf(pr);
    const on = S.follows.has(id);
    const mine = pr.owner === 'me';
    const idx = D.STAGES.findIndex((s) => s.id === pr.stage);
    const tested = S.testers.includes(id);
    return `<div style="position:relative">${C.coverHTML(pr, 'd-cover')}<button class="icon-btn d-close" data-act="close" aria-label="Cerrar">${icon('x')}</button></div>
      <div class="d-hero" style="--h:${pr.hue}">
        <div><h2 style="font-size:30px;letter-spacing:-.035em">${esc(pr.name)}</h2><p class="muted">${esc(pr.tagline)}</p></div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button data-act="person" data-id="${owner.id}" data-hc="${owner.id}" aria-label="Ver perfil de ${esc(owner.name)}">${C.avatar(owner, 'sm')}</button><span style="font-size:13.5px">Por <b>${esc(owner.name)}</b></span>${C.doorChip(pr.door)}<span class="fine">${C.followersOf(pr)} seguidores</span></div>
        <p class="status">${icon(STATUS_ICON[pr.status.type] || 'spark')}<span>«${esc(pr.status.text)}»</span></p>
        <div class="d-actions">
          <button class="btn${on ? ' is-on' : ''}" data-act="follow-project" data-id="${id}" aria-pressed="${on}">${icon('bookmark')}${on ? 'Siguiendo' : 'Seguir'}</button>
          ${mine ? `<button class="btn btn-primary" data-act="compose" data-type="building">${icon('plus')}Publicar avance</button>`
            : `<button class="btn btn-door" data-act="offer-help" data-id="${id}">${icon('heart')}Ofrecer ayuda</button><button class="btn" data-act="collab" data-id="${id}">${icon('userplus')}Solicitar colaborar</button>`}
          ${t && !mine ? `<button class="btn${tested ? ' is-on' : ''}" data-act="tester" data-id="${id}" ${tested ? 'disabled' : ''}>${icon('zap')}${tested ? 'Te anotaste como tester' : 'Probar el producto'}</button>` : ''}
        </div>
      </div>
      <div class="d-sec"><h3>Etapa</h3><div class="stage-track">${D.STAGES.map((s, i) => `<div class="${i < idx ? 'done' : i === idx ? 'cur' : ''}" style="--i:${i}"><i></i>${s.label}</div>`).join('')}</div></div>
      <div class="d-sec"><h3>De qué se trata</h3><p>${esc(pr.desc)}</p>
        <div class="gallery">${(GALLERY[pr.stage] || GALLERY.prototipo).map((l, i) => `<figure class="g-item"><span class="cover pat-${PATS[(PATS.indexOf(pr.pattern) + i + 1) % PATS.length]}" style="--h:${pr.hue + i * 24}"><span class="g-num">0${i + 1}</span></span><figcaption>${esc(l)}</figcaption></figure>`).join('')}</div></div>
      <div class="d-sec"><h3>Roles abiertos</h3><div class="roles">${pr.needs.map((n) => `<div class="role"><span class="tdot tone-blue">${icon('userplus')}</span><span><b>${esc(n)}</b><small>${mine ? 'Tu proyecto busca esto' : `Hablar con ${esc(C.firstName(owner))}`}</small></span>${mine ? `<button class="btn btn-sm" data-act="role-match" data-q="sepa de ${esc(n.toLowerCase())}">${icon('radar')}Buscar</button>` : `<button class="btn btn-sm" data-act="collab" data-id="${id}" data-role="${esc(n)}">Me interesa</button>`}</div>`).join('')}</div>
        ${t ? `<div class="testers"><div class="slots">${Array.from({ length: t.need }, (_, i) => i < t.have ? `<span class="slot on">${C.avatar(C.person(TESTERS[(i + pr.hue) % TESTERS.length]), 'xs', { hc: true })}</span>` : '<span class="slot"></span>').join('')}</div><p class="fine">${t.have} de ${t.need} testers · quedan ${t.need - t.have} lugares</p></div>` : ''}</div>
      <div class="d-sec"><h3>Equipo</h3><div class="team-list">${C.teamOf(pr).map(([m, role]) => { const p = C.person(m); return `<div class="team-row" data-act="person" data-id="${m}" data-hc="${m}" tabindex="0">${C.avatar(p, 'sm', { presence: true })}<div><b>${esc(p.name)}</b><small>${esc(role)}</small></div></div>`; }).join('')}</div></div>
      <div class="d-sec"><h3>Avances</h3><ul class="timeline">${pr.updates.map((u) => `<li><div><small>Hace ${u.d} ${u.d === 1 ? 'día' : 'días'}</small><p>${esc(u.text)}</p></div></li>`).join('')}</ul></div>`;
  }
  function eventHTML(id) {
    const e = C.eventById(id);
    const d = C.eventDate(e);
    const g = C.goingOf(e);
    const list = e.attendees.filter((a) => a !== 'me');
    if (S.going.has(id) && S.me.privacy.attendee) list.unshift('me');
    return `<div class="ev-feature-side" style="padding:22px 22px 26px;gap:14px;border-radius:0"><button class="icon-btn d-close" data-act="close" aria-label="Cerrar">${icon('x')}</button>
        <p class="eyebrow">${esc(e.kind)} · ${C.fmtRel(d)}</p>
        <h2 style="font-size:30px;letter-spacing:-.035em;line-height:1">${esc(e.title)}</h2>
        <p style="color:var(--night-ink-2)">${esc(e.desc)}</p></div>
      <div class="d-sec"><div class="ev-sub" style="font-size:14px"><span>${icon('cal')}${C.fmtLong(d)}</span><span>${icon('clock')}${esc(e.time)}</span><span>${icon('pin')}${esc(e.venue)}</span></div>
        ${e.past ? '' : `<div class="cap" style="width:100%"><div class="bar" style="--v:${Math.min(100, (g / e.cap) * 100)}%"><i></i></div><span class="tnum">${g} de ${e.cap} lugares · quedan ${Math.max(0, e.cap - g)}</span></div>
        <div class="d-actions">${C.regBtn(e)}${C.remindBtn(e)}${e.kind === 'Build Night' && C.walletButton ? C.walletButton('event') : ''}</div>`}</div>
      ${e.agenda ? `<div class="d-sec"><h3>Agenda</h3><ul class="agenda" style="margin-top:0">${e.agenda.map(([t, a]) => `<li><time>${t}</time>${esc(a)}</li>`).join('')}</ul></div>` : ''}
      ${e.results ? `<div class="d-sec"><h3>Resultados</h3><div class="results-box"><div><b>${e.results.demos}</b><small>demos</small></div><div><b>${e.results.connections}</b><small>conexiones nuevas</small></div></div><ul class="why-list">${e.results.highlights.map((h) => `<li>${icon('check')}<span>${esc(h)}</span></li>`).join('')}</ul></div>` : ''}
      <div class="d-sec"><h3>Asistentes</h3><div class="attendee-grid">${list.map((a) => { const p = C.person(a); return `<button class="attendee" data-act="person" data-id="${a}" data-hc="${a}">${C.avatar(p, 'xs', { presence: true })}${esc(a === 'me' ? 'Tú' : p.name)}</button>`; }).join('')}</div>
        <p class="fine">${e.hidden} personas prefieren no aparecer en la lista. Tú decides en tu perfil si apareces.</p></div>
      <div class="d-sec"><h3>Organiza</h3><div class="team-row" data-act="person" data-id="${e.host}" data-hc="${e.host}" tabindex="0">${C.avatar(C.person(e.host), 'sm')}<div><b>${esc(C.person(e.host).name)}</b><small>${esc(C.person(e.host).role)}</small></div></div></div>`;
  }
  const DRAWERS = { person: (id, tab) => C.personHTML(id, tab), project: projectHTML, event: eventHTML };
  function openDrawer(kind, id) {
    const panel = C.openLayer('drawer', DRAWERS[kind](id, 'perfil'), { label: kind });
    panel.dataset.kind = kind;
    panel.dataset.id = id;
    if (kind === 'person') panel.dataset.tab = 'perfil';
    C.mountMotion(panel);
    return panel;
  }
  function refreshLayers() {
    $$('#layers .layer.open [data-kind]').forEach((p) => {
      const top = p.scrollTop;
      p.innerHTML = DRAWERS[p.dataset.kind](p.dataset.id, p.dataset.tab);
      p.scrollTop = top;
    });
  }
  C.refreshLayers = refreshLayers;
  C.openPerson = (id) => openDrawer('person', id);
  C.openComposeWith = (type, preset) => openCompose(type, preset);
  const refreshAll = () => { refreshLayers(); C.rerender(); };

  function helpPost(postId) {
    const post = C.allPosts().find((p) => p.id === postId);
    if (!post) return;
    const a = C.person(post.author);
    const topic = post.tags && post.tags[0] ? C.tagLabel(post.tags[0]).toLowerCase() : 'tu pregunta';
    const offer = S.me.offers ? S.me.offers.charAt(0).toLowerCase() + S.me.offers.slice(1) : 'echarte la mano con esto.';
    C.openContact(a.id, { help: true, text: `Hola ${C.firstName(a)}, vi tu publicación sobre ${topic}. Puedo ayudarte: ${offer} ${C.FORMATS.call}` });
  }

  /* ---------- Publicar ---------- */
  function openCompose(type = 'building', preset = '') {
    if (!D.TYPES[type]) type = 'building';
    const mine = C.visibleProjects().filter((p) => p.owner === 'me');
    C.openLayer('modal', `<form data-form="compose">
      <header class="m-head"><h2>Publicar</h2><button type="button" class="icon-btn" data-act="close" aria-label="Cerrar">${icon('x')}</button></header>
      <div class="m-body">
        <fieldset class="type-pick"><legend>Tipo de publicación</legend>${Object.entries(D.TYPES).map(([k, t]) => `<label class="tp"><input type="radio" name="type" value="${k}" id="tp-${k}" ${k === type ? 'checked' : ''}><span>${C.tdot(k)}${esc(t.label)}</span></label>`).join('')}</fieldset>
        <label class="fld"><span class="sr-only">Texto</span><textarea class="inp" id="cmpText" name="text" rows="4" maxlength="500" required autofocus placeholder="${esc(D.TYPES[type].ph)}">${esc(preset)}</textarea>
          <small class="count" id="cmpCount">${preset.length}/500</small></label>
        <div class="fld"><span>Temas</span><div class="pick">${Object.entries(D.TAGS).filter(([k]) => k !== 'testers').map(([k, l]) => `<label><input type="checkbox" name="tags" value="${k}" id="ct-${k}"><span>${esc(l)}</span></label>`).join('')}</div></div>
        ${mine.length ? `<label class="fld"><span>Proyecto relacionado</span><select class="inp" name="project" id="cmpProject"><option value="">Ninguno</option>${mine.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></label>` : ''}
      </div>
      <footer class="m-foot"><p class="fine">Breve y útil. Si pides ayuda, di qué necesitas y para cuándo.</p><button class="btn btn-door" type="submit">Publicar</button></footer>
    </form>`, { label: 'Publicar' });
  }

  /* ---------- Menú «Más» del celular ---------- */
  function openMore() {
    const items = navItems().filter((n) => n.id);
    C.openLayer('modal', `<header class="m-head"><h2>Secciones</h2><button type="button" class="icon-btn" data-act="close" aria-label="Cerrar">${icon('x')}</button></header>
      <nav class="more-grid" aria-label="Secciones del club">${items.map((n) => `<button type="button" class="more-item${n.id === S.view ? ' on' : ''}" data-go="${n.id}">${icon(n.icon)}<span>${n.label}</span></button>`).join('')}</nav>
      <div class="menu-foot">
        <button type="button" class="btn" data-act="need">${icon('spark')}Necesito a alguien que…</button>
        <button type="button" class="btn btn-ghost" data-act="theme">${icon('sun', 'i-sun')}${icon('moon', 'i-moon')}Cambiar tema</button>
        <button type="button" class="btn btn-ghost" data-go="landing">${icon('arrow')}Ir a clubcrai.com</button>
        ${C.isLive() ? `<button type="button" class="btn btn-ghost" data-act="sign-out">${icon('exit')}Cerrar sesión</button>` : ''}
      </div>`, { cls: 'menu-sheet', label: 'Secciones' });
  }

  /* ---------- Necesito a alguien que… ---------- */
  function needResults(q) {
    const needs = C.parseNeeds(q);
    const det = $('#needDetected');
    const box = $('#needResults');
    if (!det || !box) return;
    det.innerHTML = C.detectedHTML(needs);
    const res = needs.length ? C.matchPeople(needs).filter((r) => r.hit.length).slice(0, 3) : [];
    box.innerHTML = res.map((r) => `<button type="button" class="match-row" data-act="person" data-id="${r.p.id}" style="text-align:left">${C.avatar(r.p, 'sm')}<div><b>${esc(r.p.name)}</b><small>${esc(r.why[0] || '')}</small></div><span class="pct">${r.s}%</span></button>`).join('');
  }
  function openNeed() {
    C.openLayer('modal', `<form data-form="need" autocomplete="off">
      <header class="m-head"><h2>Necesito a alguien que…</h2><button type="button" class="icon-btn" data-act="close" aria-label="Cerrar">${icon('x')}</button></header>
      <div class="m-body">
        <div class="need-box"><label for="needQ" class="sr-only">Describe a quién necesitas</label><textarea id="needQ" name="q" rows="2" maxlength="200" autofocus placeholder="sepa de firmware para mi prototipo">${esc(S.match.q || '')}</textarea></div>
        <div class="detected" id="needDetected"></div>
        <div class="match-list" id="needResults" style="margin-top:0"></div>
      </div>
      <footer class="m-foot"><button type="button" class="btn" data-act="need-publish">${icon('megaphone')}Publicar como solicitud</button><button class="btn btn-door" type="submit">${icon('radar')}Ver todos en Collab Match</button></footer>
    </form>`, { label: 'Necesito a alguien que' });
    needResults(S.match.q || '');
  }

  /* ---------- Paleta de búsqueda ---------- */
  let palItems = [];
  let palIdx = 0;
  function paletteIndex() {
    const items = [];
    NAV.filter((n) => n.id).forEach((n) => items.push({ g: 'Ir a', t: n.label, s: 'Sección', ic: n.icon, run: () => C.go(n.id) }));
    C.members().forEach((p) => items.push({ g: 'Personas', t: p.name, s: `${p.role} · ${p.skills.slice(0, 3).join(', ')}`, x: p.tags.map(C.tagLabel).join(' ') + ' ' + p.building, av: p, run: () => openDrawer('person', p.id) }));
    C.visibleProjects().forEach((p) => items.push({ g: 'Proyectos', t: p.name, s: p.tagline, x: p.desc, ic: 'box', run: () => openDrawer('project', p.id) }));
    C.sortedEvents().forEach(({ e, d }) => items.push({ g: 'Eventos', t: e.title, s: `${C.fmtRel(d)} · ${e.venue}`, x: e.kind, ic: 'cal', run: () => openDrawer('event', e.id) }));
    C.allPosts().forEach((p) => items.push({ g: 'Publicaciones', t: p.text.slice(0, 80), s: `${C.person(p.author).name} · ${D.TYPES[p.type].label}`, x: p.text, ic: D.TYPES[p.type].icon, run: () => { S.ff = { type: 'all', sort: 'recent' }; C.go('community'); setTimeout(() => flashPost(p.id), 450); } }));
    Object.entries(D.TAGS).filter(([k]) => k !== 'testers').forEach(([, l]) => items.push({ g: 'Temas', t: l, s: 'Buscar personas que saben de esto', ic: 'radar', run: () => { S.match.q = 'sepa de ' + l.toLowerCase(); C.go('match'); } }));
    return items;
  }
  function drawPalette() {
    const q = C.norm($('#palQ').value.trim());
    const all = paletteIndex();
    let res;
    if (!q) res = all.filter((i) => i.g === 'Ir a').concat(C.peopleToMeet(3).map((r) => all.find((i) => i.av && i.av.id === r.p.id)));
    else {
      const tokens = q.split(/\s+/);
      res = all.filter((i) => { const hay = C.norm(`${i.t} ${i.s} ${i.x || ''}`); return tokens.every((t) => hay.includes(t)); });
    }
    const groups = {};
    res.forEach((i) => { (groups[i.g] = groups[i.g] || []).length < 6 && groups[i.g].push(i); });
    palItems = Object.values(groups).flat();
    palIdx = Math.min(palIdx, Math.max(0, palItems.length - 1));
    let n = -1;
    $('#palRes').innerHTML = palItems.length ? Object.entries(groups).map(([g, list]) => `<p class="pal-group">${esc(g)}</p>${list.map((i) => { n += 1; return `<button type="button" class="pal-item${n === palIdx ? ' on' : ''}" data-act="pal-run" data-i="${n}" role="option" aria-selected="${n === palIdx}">${i.av ? C.avatar(i.av, 'sm') : `<span class="tdot tone-blue">${icon(i.ic)}</span>`}<span style="min-width:0"><b>${esc(i.t)}</b><small>${esc(i.s)}</small></span><kbd>Enter</kbd></button>`; }).join('')}`).join('')
      : `<p class="pal-empty">Nada coincide con «${esc($('#palQ').value)}». Prueba con una habilidad, un nombre o un proyecto.</p>`;
  }
  function openPalette() {
    if (C.topLayer() && C.topLayer().querySelector('.palette')) return;
    palIdx = 0;
    C.openLayer('palette', `<form data-form="palette" autocomplete="off"><div class="pal-in">${icon('search')}<input id="palQ" placeholder="Busca personas, proyectos, eventos o temas…" aria-label="Buscar" autofocus><kbd>Esc</kbd></div><div class="pal-res" id="palRes" role="listbox"></div></form>`, { label: 'Buscar' });
    drawPalette();
  }
  function runPal(i) { const item = palItems[i]; if (!item) return; C.closeLayer(); setTimeout(item.run, 60); }
  function flashPost(id) {
    const el = doc.getElementById('post-' + id);
    if (!el) return;
    el.scrollIntoView({ behavior: C.RM() ? 'auto' : 'smooth', block: 'center' });
    el.classList.remove('just'); void el.offsetWidth; el.classList.add('just');
  }

  /* ---------- Notificaciones y solicitud de colaboración ---------- */
  function openNotifs() {
    const bell = $('[data-act="notifs"]');
    if (bell) bell.classList.remove('has-dot');
    C.openLayer('pop', `<div class="m-head" style="position:static;padding-bottom:8px"><h2 style="font-size:18px">Notificaciones</h2><button class="icon-btn" data-act="close" aria-label="Cerrar">${icon('x')}</button></div>
      ${D.notifications.map((n, i) => `<button class="notif" data-act="notif" data-i="${i}"><span class="tdot tone-blue">${icon(n.icon)}</span><span><p>${n.html}</p><small>${C.ago(n.h)}</small></span></button>`).join('')}
      <p class="fine" style="padding:10px 16px 16px">Solo avisamos de respuestas, solicitudes y encuentros. Nada de ruido.</p>`, { label: 'Notificaciones' });
  }
  function openRequest() {
    const r = D.request;
    const p = C.person(r.from);
    const pr = C.project(r.project);
    const fit = C.matchPeople(S.me.needsTags || []).find((x) => x.p.id === p.id);
    C.openLayer('modal', `<header class="m-head"><h2>Solicitud de colaboración</h2><button type="button" class="icon-btn" data-act="close" aria-label="Cerrar">${icon('x')}</button></header>
      <div class="m-body">
        <div style="display:flex;gap:12px;align-items:center">${C.avatar(p, 'lg')}<div><b>${esc(p.name)}</b><p class="fine">Quiere unirse a <b>${esc(pr.name)}</b> como ${esc(r.role.toLowerCase())}</p></div></div>
        <p class="quote-box" style="font-size:16px;font-family:var(--f-body);font-weight:400">${esc(r.text)}</p>
        ${fit ? `<ul class="why-list">${fit.why.slice(0, 3).map((w) => `<li>${icon('check')}<span>${esc(w)}</span></li>`).join('')}</ul>` : ''}
        ${S.accepted ? `<p class="chip chip-mint" style="justify-self:start">${icon('check')}Ya forma parte del equipo</p>` : ''}
      </div>
      <footer class="m-foot"><button class="btn btn-ghost" data-act="person" data-id="${p.id}">Ver perfil</button>${S.accepted ? '<button class="btn" data-act="close">Cerrar</button>' : `<span style="display:flex;gap:8px"><button class="btn" data-act="close">Responder después</button><button class="btn btn-door" data-act="accept-request">${icon('check')}Aceptar en ${esc(pr.name)}</button></span>`}</footer>`, { label: 'Solicitud de colaboración' });
  }

  /* ---------- Ayuda a proyectos ---------- */
  function openOfferHelp(id) {
    const pr = C.project(id);
    C.openLayer('modal', `<form data-form="offer" data-id="${id}">
      <header class="m-head"><h2>Ofrecer ayuda a ${esc(pr.name)}</h2><button type="button" class="icon-btn" data-act="close" aria-label="Cerrar">${icon('x')}</button></header>
      <div class="m-body">
        <div class="fld"><span>Qué ofreces</span><div class="seg">${[['feedback', 'Retroalimentación'], ['skill', 'Una habilidad'], ['contact', 'Un contacto'], ['proposal', 'Una propuesta']].map(([k, l], i) => `<label><input type="radio" name="kind" value="${k}" ${i === 0 ? 'checked' : ''}>${l}</label>`).join('')}</div></div>
        <label class="fld"><span>Tu mensaje</span><textarea class="inp" id="offerText" name="text" rows="5" maxlength="600" required autofocus>Hola, vi ${esc(pr.name)} y me gustó mucho la idea. Algo que te puede servir: </textarea><small>La retroalimentación útil es concreta: qué funciona, qué no y qué probarías después.</small></label>
      </div>
      <footer class="m-foot"><p class="fine">Le llega a ${esc(C.person(pr.owner).name)}.</p><button class="btn btn-door" type="submit">${icon('heart')}Enviar ayuda</button></footer>
    </form>`, { label: 'Ofrecer ayuda' });
  }
  function openCollab(id, role) {
    const pr = C.project(id);
    C.openLayer('modal', `<form data-form="collab" data-id="${id}">
      <header class="m-head"><h2>Solicitar colaborar</h2><button type="button" class="icon-btn" data-act="close" aria-label="Cerrar">${icon('x')}</button></header>
      <div class="m-body">
        <p class="muted">${esc(pr.name)} busca: ${esc(pr.needs.join(' · '))}</p>
        <label class="fld"><span>¿Qué rol tomarías?</span><input class="inp" id="collabRole" name="role" value="${esc(role || pr.needs[0])}" maxlength="80" required></label>
        <div class="fld"><span>¿Cuánto tiempo puedes darle?</span><div class="seg">${['2 h por semana', 'Tardes', 'Fines de semana'].map((l, i) => `<label><input type="radio" name="time" value="${l}" ${i === 0 ? 'checked' : ''}>${l}</label>`).join('')}</div></div>
        <label class="fld"><span>Mensaje</span><textarea class="inp" id="collabText" name="text" rows="4" maxlength="600" required>Hola, me interesa sumarme a ${esc(pr.name)}. ${esc(S.me.offers || '')}</textarea></label>
      </div>
      <footer class="m-foot"><p class="fine">La solicitud queda con seguimiento: verás si la aceptan.</p><button class="btn btn-door" type="submit">${icon('userplus')}Enviar solicitud</button></footer>
    </form>`, { label: 'Solicitar colaborar' });
  }

  /* ---------- Sesiones, insignias, celebración ---------- */
  function openPropose() {
    C.openLayer('modal', `<form data-form="propose">
      <header class="m-head"><h2>Proponer una sesión</h2><button type="button" class="icon-btn" data-act="close" aria-label="Cerrar">${icon('x')}</button></header>
      <div class="m-body">
        <label class="fld"><span>¿Qué vas a enseñar?</span><input class="inp" id="propTitle" name="title" required maxlength="90" autofocus placeholder="Ej. Impresión 3D para prototipos que se pueden fabricar"></label>
        <div class="fld"><span>Formato</span><div class="seg">${['Taller', 'Charla corta', 'Sesión de trabajo'].map((l, i) => `<label><input type="radio" name="fmt" value="${l}" ${i === 0 ? 'checked' : ''}>${l}</label>`).join('')}</div></div>
        <label class="fld"><span>Cupo ideal</span><select class="inp" id="propCap" name="cap"><option>8 personas</option><option selected>15 personas</option><option>25 personas</option></select></label>
        <label class="fld"><span>Notas para quien organiza</span><textarea class="inp" id="propNotes" name="notes" rows="3" maxlength="300" placeholder="Material, horario que prefieres, qué deben traer"></textarea></label>
      </div>
      <footer class="m-foot"><p class="fine">Ximena coordina la agenda y te responde en unos días.</p><button class="btn btn-door" type="submit">Enviar propuesta</button></footer>
    </form>`, { label: 'Proponer una sesión' });
  }
  function openBadge(id) {
    const b = D.badges[id];
    const on = C.unlockedBadges().includes(id);
    const q = D.quests.find((x) => x.badge === id);
    C.openLayer('modal', `<div class="celebrate"><span class="hex badge-big ${on ? 't-' + b.tone : 'locked'}">${icon(on ? b.icon : 'lock')}</span>
      <p class="eyebrow">${on ? 'Desbloqueada' : 'Por desbloquear'}</p><h2>${esc(b.name)}</h2><p>${esc(b.desc)}</p>
      ${!on && q ? `<p class="fine">Cómo se gana: ${esc(q.title.toLowerCase())}.</p><button class="btn btn-door" data-act="quest-go" data-id="${q.id}">${esc(q.cta)}</button>` : '<button class="btn" data-act="close">Cerrar</button>'}</div>`, { cls: '', label: b.name });
  }
  C.celebrate = (badgeId) => {
    const b = D.badges[badgeId];
    if (!b) return;
    C.openLayer('modal', `<div class="celebrate"><canvas class="confetti" aria-hidden="true"></canvas><span class="hex badge-big t-${b.tone}">${icon(b.icon)}</span>
      <p class="eyebrow">Insignia desbloqueada</p><h2>${esc(b.name)}</h2><p>${esc(b.desc)}</p><button class="btn btn-primary" data-act="close" autofocus>Seguir construyendo</button></div>`, { label: 'Insignia desbloqueada' });
    setTimeout(() => C.confetti($('#layers .layer:last-child .confetti')), 260);
    C.rerender();
  };

  /* ---------- Bienvenida (onboarding) ---------- */
  let ob = null;
  function obHTML() {
    const tagEntries = Object.entries(D.TAGS).filter(([k]) => k !== 'testers');
    const pick = (name, entries, sel, cls) => `<div class="pick ${cls || ''}">${entries.map(([k, l]) => `<label><input type="checkbox" name="${name}" value="${k}" id="ob-${name}-${k}" ${sel.includes(k) ? 'checked' : ''}><span>${esc(l)}</span></label>`).join('')}</div>`;
    const steps = {
      1: `<h3>¿Por qué puerta entras?</h3><p class="muted">Las dos viven en el mismo club. La puerta solo cambia lo que ves primero.</p>
        <div class="ob-doors">${[['founders', 'Founders', 'Negocios, clientes, socios, inversión y crecimiento.'], ['underground', 'Underground', 'Tecnología, experimentación, maker e ideas raras.'], ['both', 'Las dos', 'Construyes un producto y también un negocio.']].map(([k, t, d]) =>
          `<label class="ob-door d-${k}"><input type="radio" name="door" value="${k}" ${ob.door === k ? 'checked' : ''}><span><b>${t}</b><small>${d}</small></span></label>`).join('')}</div>`,
      2: `<h3>Cuéntanos qué construyes</h3><p class="muted">Tu perfil es una tarjeta profesional viva. Empieza con lo básico.</p>
        <label class="fld"><span>Tu nombre</span><input class="inp" id="obName" name="name" value="${esc(ob.name)}" required maxlength="60" autofocus></label>
        <label class="fld"><span>¿A qué te dedicas?</span><input class="inp" id="obRole" name="role" value="${esc(ob.role)}" maxlength="60" placeholder="Ej. Diseño de producto"></label>
        <label class="fld"><span>¿Qué estás construyendo?</span><input class="inp" id="obBuild" name="building" value="${esc(ob.building)}" required maxlength="120" placeholder="Ej. Una app para reservar canchas en Mexicali"></label>`,
      3: `<h3>¿Qué necesitas y qué puedes aportar?</h3><p class="muted">Con esto CRAI te recomienda personas y explica por qué encajan.</p>
        <div class="fld"><span>Necesito a alguien que sepa de…</span>${pick('needs', tagEntries, ob.needs, 'need')}</div>
        <div class="fld"><span>Yo puedo aportar…</span>${pick('offers', tagEntries, ob.offers, 'offer')}</div>
        <div class="fld"><span>Busco</span>${pick('seeking', Object.entries(D.SEEK), ob.seeking)}</div>`
    };
    return `<form data-form="onboard" autocomplete="off">
      <header class="m-head"><h2>Entrar a CRAI</h2><button type="button" class="icon-btn" data-act="close" aria-label="Cerrar">${icon('x')}</button></header>
      <div class="ob-progress" aria-label="Paso ${ob.step} de 3">${[1, 2, 3].map((i) => `<i class="${i <= ob.step ? 'on' : ''}"></i>`).join('')}</div>
      <div class="m-body" style="padding-top:18px"><div class="ob-step">${steps[ob.step]}</div></div>
      <footer class="m-foot">${ob.step > 1 ? '<button type="button" class="btn btn-ghost" data-act="ob-back">Atrás</button>' : window.CRAI_LIVE ? '<span></span>' : '<button type="button" class="btn btn-ghost" data-act="ob-skip">Explorar con el perfil de ejemplo</button>'}
        <button class="btn btn-door" type="submit">${ob.step < 3 ? 'Siguiente' : 'Entrar al club'}${icon('arrow')}</button></footer>
    </form>`;
  }
  function readOb(form) {
    const fd = new FormData(form);
    if (ob.step === 1) ob.door = String(fd.get('door') || ob.door);
    if (ob.step === 2) { ob.name = String(fd.get('name') || '').trim(); ob.role = String(fd.get('role') || '').trim(); ob.building = String(fd.get('building') || '').trim(); }
    if (ob.step === 3) { ob.needs = fd.getAll('needs').map(String); ob.offers = fd.getAll('offers').map(String); ob.seeking = fd.getAll('seeking').map(String); }
  }
  function drawOb() {
    const panel = $('#layers .layer:last-child .modal');
    if (panel) panel.innerHTML = obHTML();
    setTimeout(() => { const f = panel && (panel.querySelector('[autofocus]') || panel.querySelector('input')); if (f) f.focus({ preventScroll: true }); }, 40);
  }
  C.openOnboarding = (door = 'both', e, prefill = {}) => {
    const a = S.applied;
    ob = { step: 1, door: door || 'both', name: prefill.name || (a ? a.name : ''), role: '', building: a ? a.building : '', needs: a && a.need ? C.parseNeeds(a.need) : [], offers: [], seeking: ['colaboradores'] };
    C.openLayer('modal', obHTML(), { label: 'Entrar a CRAI' });
  };
  function finishOb(e, el) {
    Object.assign(S.me, {
      name: ob.name || S.me.name, role: ob.role || 'Miembro fundador', door: ob.door,
      building: ob.building || S.me.building, needsTags: ob.needs.length ? ob.needs : S.me.needsTags,
      offerTags: ob.offers.length ? ob.offers : S.me.offerTags, seeking: ob.seeking.length ? ob.seeking : S.me.seeking
    });
    S.me.tags = S.me.offerTags.slice();
    S.match.q = '';
    if (C.liveFinishOnboarding && C.liveFinishOnboarding(e, el, ob)) return;
    C.save();
    C.go('inicio', e, el);
    setTimeout(() => C.toast(`Te damos la bienvenida a CRAI, ${esc(C.firstName(S.me))}.`, 'sun'), 700);
  }

  /* ---------- Perfil: enlace en vivo ---------- */
  let lastComplete = -1;
  const setPath = (o, path, v) => { const ks = path.split('.'); let x = o; while (ks.length > 1) { const k = ks.shift(); x[k] = x[k] || {}; x = x[k]; } x[ks[0]] = v; };
  const savePf = C.debounce(() => {
    C.save();
    if (C.liveSaveProfile) C.liveSaveProfile();
    const ind = $('#savedInd');
    if (ind) { ind.classList.add('show'); clearTimeout(ind._t); ind._t = setTimeout(() => ind.classList.remove('show'), 1600); }
  }, 450);
  function bindProfile(t) {
    const path = t.dataset.bind;
    const me = S.me;
    if (t.type === 'checkbox' && t.closest('.pick')) me[path] = $$(`input[data-bind="${path}"]:checked`).map((x) => x.value);
    else if (t.type === 'checkbox') setPath(me, path, t.checked);
    else if (t.type === 'radio') { if (t.checked) me[path] = t.value; }
    else if (path === 'skills' || path === 'learn' || path === 'langs') me[path] = t.value.split(',').map((s) => s.trim()).filter(Boolean);
    else setPath(me, path, t.value);
    if (path === 'offerTags') me.tags = me.offerTags.slice();
    C.profileChanged();
  }
  C.profileChanged = () => {
    const me = S.me;
    const card = $('#mcard');
    if (card) { card.className = 'mcard door-' + me.door; card.innerHTML = C.mcardInner(me); }
    const v = C.completeness(me);
    const comp = $('#complete');
    if (comp && v !== lastComplete) { lastComplete = v; comp.innerHTML = C.completeHTML(me); C.fillRings(comp); }
    const rm = $('#railMe');
    if (rm) rm.innerHTML = railMe();
    savePf();
  }

  /* ---------- Acciones ---------- */
  function toggleFollowProject(id) {
    const on = !S.follows.has(id);
    if (on) S.follows.add(id); else S.follows.delete(id);
    C.save();
    C.toast(on ? `Sigues ${esc(C.project(id).name)}. Verás sus avances en Inicio.` : `Dejaste de seguir ${esc(C.project(id).name)}.`, 'bookmark');
    refreshAll();
  }
  function toggleRegister(id) {
    const e = C.eventById(id);
    if (S.going.has(id)) { S.going.delete(id); C.toast('Cancelaste tu registro. Liberamos tu lugar.', 'cal'); }
    else {
      S.going.add(id); S.reminders.add(id);
      C.toast(`Registro confirmado: ${esc(e.title)}. Te avisamos 24 h antes.`, 'cal');
      if (e.kind === 'Build Night') C.advanceQuest('q6');
    }
    C.save();
    refreshAll();
  }
  let resetArmed = false;
  const A = {
    close: (el) => C.closeLayer(el.closest('.layer')),
    theme: (el, e) => C.toggleTheme(e, el),
    palette: () => openPalette(),
    notifs: () => openNotifs(),
    compose: (el) => openCompose(el.dataset.type, el.dataset.preset || ''),
    need: () => { C.closeAll(); setTimeout(openNeed, C.topLayer() ? 120 : 0); },
    more: () => openMore(),
    join: (el, e) => (C.openJoin ? C.openJoin('signup') : C.go('inicio', e, el)),
    login: (el, e) => (C.openJoin ? C.openJoin('signin') : C.go('inicio', e, el)),
    'edit-profile': (el, e) => {
      C.closeAll();
      const jump = () => { const f = $('#profileForm'); if (f) f.scrollIntoView({ behavior: C.RM() ? 'auto' : 'smooth', block: 'start' }); const n = $('#pf-name'); if (n) setTimeout(() => n.focus({ preventScroll: true }), 450); };
      if (S.view === 'perfil' && S.mode === 'app') jump(); else { C.go('perfil', e, el); setTimeout(jump, 500); }
    },
    person: (el) => openDrawer('person', el.dataset.id),
    project: (el) => openDrawer('project', el.dataset.id),
    event: (el) => openDrawer('event', el.dataset.id),
    'role-match': (el, e) => { S.match.q = el.dataset.q; C.go('match', e, el); },
    'help-post': (el) => helpPost(el.dataset.id),
    'follow-project': (el) => toggleFollowProject(el.dataset.id),
    'follow-person': (el) => {
      const id = el.dataset.id;
      const on = !S.followPeople.has(id);
      if (on) S.followPeople.add(id); else S.followPeople.delete(id);
      C.save();
      C.toast(on ? `Sigues a ${esc(C.person(id).name)}.` : `Dejaste de seguir a ${esc(C.person(id).name)}.`, 'user');
      refreshLayers();
    },
    'save-post': (el) => {
      const id = el.dataset.id;
      const on = !S.saved.has(id);
      if (on) S.saved.add(id); else S.saved.delete(id);
      C.save();
      $$(`[data-act="save-post"][data-id="${id}"]`).forEach((b) => { b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.innerHTML = icon('bookmark') + (on ? 'Guardada' : 'Guardar'); });
    },
    comments: (el) => {
      const box = doc.getElementById('cm-' + el.dataset.id);
      if (!box) return;
      box.hidden = !box.hidden;
      el.setAttribute('aria-expanded', String(!box.hidden));
      if (!box.hidden) { const i = box.querySelector('input'); if (i) i.focus({ preventScroll: true }); }
    },
    register: (el) => toggleRegister(el.dataset.id),
    remind: (el) => {
      const id = el.dataset.id;
      const on = !S.reminders.has(id);
      if (on) S.reminders.add(id); else S.reminders.delete(id);
      C.save();
      C.toast(on ? 'Te avisamos 24 h antes.' : 'Quitamos el recordatorio.', 'bell');
      refreshAll();
    },
    'offer-help': (el) => openOfferHelp(el.dataset.id),
    collab: (el) => openCollab(el.dataset.id, el.dataset.role),
    tester: (el) => {
      const id = el.dataset.id;
      if (S.testers.includes(id)) return;
      S.testers.push(id);
      C.save();
      const t = C.testersOf(C.project(id));
      C.toast(`Te anotaste como tester de ${esc(C.project(id).name)} (${t.have} de ${t.need}).`, 'zap');
      refreshAll();
    },
    door: (el) => setDoor(el.dataset.door),
    pf: (el) => { S.pf[el.dataset.k] = el.dataset.v; C.rerender(); },
    'people-reset': () => { S.pf = { q: '', seek: 'all', offer: 'all', open: false }; S.door = 'all'; C.save(); applyDoor(); C.rerender(); },
    'jf-stage': (el) => { S.jf.stage = el.dataset.v; C.rerender(); },
    'ff-sort': (el) => { S.ff.sort = el.dataset.v; C.rerender(); },
    'ff-type': (el) => { S.ff.type = el.dataset.v; C.rerender(); },
    'feed-type': (el, e) => { S.ff = { type: el.dataset.type, sort: 'foryou' }; if (S.view === 'community' && S.mode === 'app') C.rerender(); else C.go('community', e, el); },
    topic: (el) => { const t = el.dataset.t; if (S.topics.has(t)) S.topics.delete(t); else S.topics.add(t); C.save(); C.rerender(); },
    'match-suggest': (el) => { S.match.q = el.dataset.q; C.rerender(); },
    'match-avail': (el) => { const k = el.dataset.k; const a = S.match.avail; S.match.q = ($('#matchQ') || {}).value || S.match.q; S.match.avail = a.includes(k) ? a.filter((x) => x !== k) : [...a, k]; C.rerender(); },
    'publish-need': () => openCompose('help', 'Necesito a alguien que ' + (S.match.q || '')),
    'need-publish': () => { const q = ($('#needQ') || {}).value || ''; C.closeLayer(); setTimeout(() => openCompose('help', 'Necesito a alguien que ' + q.trim()), 120); },
    'quest-go': (el, e) => {
      const q = D.quests.find((x) => x.id === el.dataset.id);
      C.closeAll();
      if (q.go === 'compose') openCompose('building');
      else if (q.go === 'request') openRequest();
      else if (q.go === 'propose') openPropose();
      else C.go(q.go, e, el);
    },
    badge: (el) => openBadge(el.dataset.id),
    propose: () => openPropose(),
    request: () => openRequest(),
    'accept-request': () => {
      S.accepted = true;
      C.save();
      C.closeLayer();
      C.toast(`${esc(C.firstName(C.person(D.request.from)))} se unió a Brisa. Ya son tres.`, 'users');
      C.advanceQuest('q4');
      refreshAll();
    },
    notif: (el, e) => {
      const n = D.notifications[Number(el.dataset.i)];
      C.closeLayer();
      if (n.act === 'request') setTimeout(openRequest, 80);
      else C.go(n.go, e, el);
    },
    report: (el) => { C.toast(`Gracias. Moderación revisará el perfil de ${esc(C.firstName(C.person(el.dataset.id)))}.`, 'shield'); },
    'demo-link': () => C.toast('Enlace de ejemplo: en la versión real abre el recurso.', 'link'),
    'reset-demo': (el) => {
      if (!resetArmed) { resetArmed = true; el.innerHTML = icon('refresh') + 'Toca otra vez para borrar tus cambios'; setTimeout(() => { resetArmed = false; if (doc.contains(el)) el.innerHTML = icon('refresh') + 'Restablecer la demo'; }, 4000); return; }
      C.store.clear();
      location.reload();
    },
    'share-goal': () => openCompose('building', 'Esta semana quiero ' + S.goal.charAt(0).toLowerCase() + S.goal.slice(1)),
    'edit-goal': () => { const g = S.goal; S.goal = ''; C.save(); C.rerender(); const i = $('#goalInput'); if (i) { i.value = g; i.focus(); } },
    toc: (el) => { const t = doc.getElementById(el.dataset.t); if (t) t.scrollIntoView({ behavior: C.RM() ? 'auto' : 'smooth', block: 'start' }); },
    'enter-applied': (el, e) => {
      const a = S.applied;
      if (!a) return;
      Object.assign(S.me, { name: a.name, building: a.building, door: a.door, role: 'Miembro fundador' });
      const needs = C.parseNeeds(a.need || '');
      if (needs.length) S.me.needsTags = needs;
      S.match.q = '';
      C.save();
      C.go('inicio', e, el);
    },
    reapply: () => C.landing.resetApply(),
    'ob-back': () => { const f = $('#layers .layer:last-child form'); readOb(f); ob.step -= 1; drawOb(); },
    'ob-skip': (el, e) => { C.go('inicio', e, el); },
    'pal-run': (el) => runPal(Number(el.dataset.i)),
    toon: (el) => {
      const k = el.dataset.k;
      const raw = el.dataset.v;
      const v = k === 'acc' ? raw : k === 'beard' || k === 'freckles' ? raw === '1' : Number(raw);
      S.me.toon = Object.assign(C.toonOf(S.me), { [k]: v });
      redrawToon();
    },
    'toon-random': () => {
      const T = C.TOON;
      const r = (n) => Math.floor(Math.random() * n);
      S.me.toon = { skin: r(T.skin.length), hair: r(T.hair.length), hairColor: r(T.hairColor.length), bg: r(T.bg.length), shirt: r(T.shirt.length), acc: C.toonOf(S.me).acc, beard: Math.random() < 0.25, eyes: r(T.eyes.length), mouth: r(T.mouth.length), brows: r(4), nose: r(3), turn: r(3) - 1, tilt: r(13) - 6, freckles: Math.random() < 0.3, doodle: r(T.doodle.length) };
      redrawToon();
    }
  };

  function redrawToon() {
    const fs0 = $('.toon-builder');
    if (fs0) fs0.outerHTML = C.toonBuilderHTML(S.me);
    C.profileChanged();
  }
  Object.assign(A, C.extraActions || {});
  C.baseActions = A;

  /* ---------- Formularios ---------- */
  const F = {
    match: (f) => {
      S.match.q = f.q.value.trim() || C.defaultNeedQuery();
      C.rerender();
      const r = $('#matchResults');
      if (r && innerWidth < 1100) r.scrollIntoView({ behavior: C.RM() ? 'auto' : 'smooth', block: 'start' });
    },
    comment: (f) => {
      const text = f.elements.text.value.trim();
      if (!text) return;
      const id = f.dataset.id;
      (S.comments[id] = S.comments[id] || []).push({ author: 'me', text });
      C.save();
      f.insertAdjacentHTML('beforebegin', C.commentHTML({ author: 'me', text }));
      f.reset();
      const btn = $(`[data-act="comments"][data-id="${id}"]`);
      const post = C.allPosts().find((p) => p.id === id);
      if (btn && post) { const n = C.postComments(post).length; btn.innerHTML = icon('chat') + `${n} ${n === 1 ? 'comentario' : 'comentarios'}`; }
    },
    compose: (f, e) => {
      const fd = new FormData(f);
      const text = String(fd.get('text') || '').trim();
      if (!text) return;
      const type = String(fd.get('type') || 'building');
      const post = { id: 'u' + Date.now(), type, author: 'me', ts: Date.now(), text, tags: fd.getAll('tags').map(String), project: String(fd.get('project') || '') || null, comments: [] };
      S.posts.unshift(post);
      S.ff = { type: 'all', sort: 'recent' };
      C.save();
      C.closeAll();
      C.toast('Publicado en Community.', 'send');
      if (S.mode === 'app' && S.view === 'community') C.rerender(); else C.go('community', e, f.querySelector('[type="submit"]'));
      setTimeout(() => flashPost(post.id), 520);
      if (type === 'building' || type === 'launched') C.advanceQuest('q2');
    },
    goal: (f) => { const g = f.goal.value.trim(); if (!g) return; S.goal = g; C.save(); C.rerender(); C.toast('Meta guardada. El lunes te preguntamos cómo te fue.', 'flag'); },
    palette: () => runPal(palIdx),
    need: (f, e) => { S.match.q = f.q.value.trim() || S.match.q; C.go('match', e, f.querySelector('[type="submit"]')); },
    offer: (f) => {
      if (!f.elements.text.value.trim()) return;
      const pr = C.project(f.dataset.id);
      C.closeLayer(f.closest('.layer'));
      C.toast(`Enviaste ayuda a ${esc(pr.name)}. Gracias por sumar.`, 'heart');
      C.advanceQuest('q3');
    },
    collab: (f) => {
      const pr = C.project(f.dataset.id);
      C.closeLayer(f.closest('.layer'));
      C.toast(`Solicitud enviada a ${esc(C.firstName(C.person(pr.owner)))}. Verás la respuesta en Inicio.`, 'userplus');
    },
    propose: (f) => {
      if (!f.elements.title.value.trim()) return;
      C.closeLayer(f.closest('.layer'));
      C.toast('Propuesta enviada a Ximena, que coordina la agenda.', 'cal');
      C.advanceQuest('q5');
    },
    // El perfil se guarda mientras escribes; «Enter» solo cierra el teclado.
    profile: () => { const a = doc.activeElement; if (a && a.blur) a.blur(); },
    onboard: (f, e) => {
      readOb(f);
      if (ob.step === 2 && (!ob.name || !ob.building)) { const bad = !ob.name ? $('#obName') : $('#obBuild'); if (bad) bad.reportValidity(); return; }
      if (ob.step < 3) { ob.step += 1; drawOb(); return; }
      finishOb(e, f.querySelector('[type="submit"]'));
    }
  };

  Object.assign(F, C.extraForms || {});
  C.baseForms = F;

  /* ---------- Eventos globales ---------- */
  doc.addEventListener('click', (e) => {
    const t = e.target.closest('[data-go],[data-act]');
    if (!t || t.tagName === 'INPUT') return;
    if (t.dataset.act) {
      const act = t.dataset.act;
      const live = C.liveActions || {};
      const fn = (C.isLive() && live[act]) || A[act] || live[act];
      if (fn) { e.preventDefault(); fn(t, e); }
      return;
    }
    e.preventDefault();
    C.go(t.dataset.go, e, t);
  });
  doc.addEventListener('submit', (e) => {
    const f = e.target;
    const kind = f.dataset && f.dataset.form;
    if (kind === 'apply') return;
    // Ningún formulario recarga la página (por ejemplo, «Ir» en el teclado del celular).
    e.preventDefault();
    if (!kind) return;
    const lf = C.liveForms || {};
    const fn = (C.isLive() && lf[kind]) || F[kind] || lf[kind];
    if (fn) fn(f, e);
  });
  doc.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.input === 'people-q') { S.pf.q = t.value; const g = $('#peopleGrid'); if (g) g.innerHTML = C.peopleList(); }
    else if (t.dataset.input === 'match-q') { const d = $('#detected'); if (d) d.innerHTML = C.detectedHTML(C.parseNeeds(t.value)); }
    else if (t.id === 'needQ') needResults(t.value);
    else if (t.id === 'palQ') { palIdx = 0; drawPalette(); }
    else if (t.id === 'cmpText') { const c = $('#cmpCount'); if (c) c.textContent = `${t.value.length}/500`; }
    else if (t.dataset.bind && t.type !== 'checkbox' && t.type !== 'radio') bindProfile(t);
  });
  doc.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.act === 'pf-open') { S.pf.open = t.checked; const g = $('#peopleGrid'); if (g) g.innerHTML = C.peopleList(); }
    else if (t.dataset.act === 'jf-help') { S.jf.help = t.checked; C.rerender(); }
    else if (t.dataset.bind) bindProfile(t);
    else if (t.name === 'type' && t.closest('.type-pick')) { const ta = $('#cmpText'); if (ta) ta.placeholder = D.TYPES[t.value].ph; }
    else if (t.name === 'fmt' && t.closest('#fmtSeg')) {
      const ta = $('#contactText');
      const F2 = C.FORMATS;
      if (ta) { const cur = Object.values(F2).find((s) => ta.value.includes(s)); ta.value = cur ? ta.value.replace(cur, F2[t.value]) : `${ta.value.trim()} ${F2[t.value]}`; }
    }
  });
  doc.addEventListener('keydown', (e) => {
    const top = C.topLayer();
    if (e.key === 'Escape' && top) { e.preventDefault(); C.closeLayer(top); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || '')) || e.target.isContentEditable;
    if (e.key === '/' && !typing && !top && S.mode === 'app') { e.preventDefault(); openPalette(); return; }
    if (e.target.id === 'palQ' && palItems.length) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        palIdx = (palIdx + (e.key === 'ArrowDown' ? 1 : -1) + palItems.length) % palItems.length;
        $$('.pal-item').forEach((b, i) => { b.classList.toggle('on', i === palIdx); b.setAttribute('aria-selected', String(i === palIdx)); if (i === palIdx) b.scrollIntoView({ block: 'nearest' }); });
      }
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && !typing && e.target.matches('[tabindex="0"][data-act], [tabindex="0"][data-go]') && !/^(BUTTON|A)$/.test(e.target.tagName)) {
      e.preventDefault();
      e.target.click();
      return;
    }
    if (e.key === 'Tab' && top) {
      const panel = top.lastElementChild;
      const f = $$('button:not([disabled]), [href], input:not([disabled]), textarea, select, [tabindex="0"]', panel).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && (doc.activeElement === first || doc.activeElement === panel)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  doc.addEventListener('pointermove', (e) => {
    const el = e.target.closest && e.target.closest('.spot');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
  }, { passive: true });

  /* ---------- Arranque ---------- */
  try { history.scrollRestoration = 'manual'; } catch (e) { /* nada */ }
  C.landing.init();
  const start = location.hash.slice(1);
  if (APP_VIEWS.includes(start) && window.CRAI_LIVE) C.pendingView = start;
  else if (APP_VIEWS.includes(start)) showApp(start);
  else root.dataset.mode = 'landing';
})();
