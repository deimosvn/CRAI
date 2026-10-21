/* CRAI Club · landing: hero, puertas, estrellas, semana, lugares y menú móvil */
(function () {
  'use strict';
  const C = window.CRAI;
  const D = C.D;
  const S = C.S;
  const $ = C.$;
  const $$ = C.$$;
  const esc = C.esc;
  const L = (C.landing = {});

  /* ---------- Reloj de Mexicali y barra superior ---------- */
  const tickClock = () => { const el = $('#clock'); if (el) el.textContent = 'MXL ' + C.mxl().time; };
  const onScroll = () => { const tb = $('#topbar'); if (tb) tb.classList.toggle('scrolled', window.scrollY > 8); };

  /* ---------- Texto que se descifra (Underground) ---------- */
  function scramble(el) {
    if (!el || C.RM()) return;
    const final = el.dataset.text || el.textContent;
    el.dataset.text = final;
    const chars = '!<>-_/[]{}=+*^?#01ABCDEF';
    let frame = 0;
    const total = 20;
    cancelAnimationFrame(el._raf);
    const step = () => {
      let out = '';
      const reveal = (frame / total) * final.length;
      for (let i = 0; i < final.length; i++) out += i < reveal ? final[i] : chars[Math.floor(Math.random() * chars.length)];
      el.textContent = out;
      frame += 1;
      if (frame <= total) el._raf = requestAnimationFrame(step); else el.textContent = final;
    };
    step();
  }

  /* ---------- Escena nocturna: estrellas y osciloscopio ---------- */
  let ctx = null;
  let stars = [];
  let sw = 0;
  let sh = 0;
  let starColor = '#EFEBFF';
  let amp = 1;
  let ampNow = 1;
  let running = false;
  let doorsVisible = true;

  function sizeStars() {
    const cv = $('#stars');
    if (!cv) return;
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    if (!w || !h || (w === sw && h === sh)) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    sw = w; sh = h;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.round((w * h) / 2300) }, () => ({
      x: Math.random() * w, y: Math.random() * h * 0.74, r: Math.random() * 1.15 + 0.25, p: Math.random() * 6.28, s: 0.4 + Math.random() * 1.6
    }));
    starColor = getComputedStyle(document.documentElement).getPropertyValue('--night-ink').trim() || starColor;
    if (C.RM()) drawFrame(0);
  }
  function drawStars(t) {
    if (!ctx) return;
    ctx.clearRect(0, 0, sw, sh);
    ctx.fillStyle = starColor;
    for (const s of stars) {
      ctx.globalAlpha = 0.22 + 0.78 * Math.abs(Math.sin(s.p + t * 0.0009 * s.s));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function drawScope(t) {
    const p1 = $('#wave1');
    const p2 = $('#wave2');
    if (!p1 || !p2) return;
    ampNow += (amp - ampNow) * 0.05;
    let d1 = '';
    let d2 = '';
    for (let x = 0; x <= 1200; x += 8) {
      const n = x / 1200;
      const env = Math.pow(Math.sin(Math.PI * n), 1.2);
      const y1 = 70 + (Math.sin(n * 22 + t * 0.0022) * 20 + Math.sin(n * 61 - t * 0.0037) * 6) * ampNow * env;
      const y2 = 70 + Math.sin(n * 13 - t * 0.0015) * 14 * ampNow * env;
      d1 += (x ? 'L' : 'M') + x + ' ' + y1.toFixed(1);
      d2 += (x ? 'L' : 'M') + x + ' ' + y2.toFixed(1);
    }
    p1.setAttribute('d', d1);
    p2.setAttribute('d', d2);
  }
  function drawFrame(t) { drawStars(t); drawScope(t); }
  function loop(t) {
    if (!running) return;
    drawFrame(t);
    requestAnimationFrame(loop);
  }
  function startLoop() {
    if (running || C.RM() || !doorsVisible || S.mode !== 'landing') return;
    running = true;
    requestAnimationFrame(loop);
  }
  function stopLoop() { running = false; }

  function doors() {
    const wrap = $('#doors');
    if (!wrap) return;
    const setW = () => wrap.style.setProperty('--dw', wrap.clientWidth + 'px');
    setW();
    if ('ResizeObserver' in window) new ResizeObserver(() => { setW(); requestAnimationFrame(sizeStars); }).observe(wrap);
    else window.addEventListener('resize', () => { setW(); sizeStars(); });
    requestAnimationFrame(sizeStars);
    $$('.door', wrap).forEach((d) => {
      d.addEventListener('click', (e) => C.openOnboarding(d.dataset.door, e));
      d.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); C.openOnboarding(d.dataset.door, e); }
      });
    });
    const night = $('.door-night', wrap);
    night.addEventListener('pointerenter', () => { scramble($('#ugName')); amp = 2.4; });
    night.addEventListener('focus', () => scramble($('#ugName')));
    night.addEventListener('pointerleave', () => { amp = 1; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => {
        doorsVisible = es[0].isIntersecting;
        if (doorsVisible) startLoop(); else stopLoop();
      }).observe(wrap);
    }
    if (C.RM()) drawFrame(0); else startLoop();
  }

  /* ---------- Demos dentro del bento ---------- */
  let flipTimer = null;
  function flipStack() {
    const box = $('#flipStack');
    if (!box) return;
    const ids = ['ivan', 'valeria', 'mariana'];
    box.innerHTML = ids.map((id, i) => {
      const p = C.person(id);
      return `<div class="flip-card${i === 0 ? ' on' : ''}">${C.avatar(p, 'lg')}<div><p class="fc-name">${esc(p.name)}</p><p class="fc-role">${esc(p.role)}</p></div>
        <p class="fc-build"><span class="lbl" style="display:inline;margin-right:6px">Construye</span>${esc(C.projectName(p))}</p>
        <div class="fc-row"><div><span class="lbl">Necesita</span><div class="chips">${C.tagChips(p.needsTags, 'need', 2)}</div></div><div><span class="lbl">Aporta</span><div class="chips">${C.tagChips(p.offerTags, 'offer', 2)}</div></div></div></div>`;
    }).join('');
    if (C.RM()) return;
    let i = 0;
    flipTimer = setInterval(() => {
      if (S.mode !== 'landing') return;
      const cards = $$('.flip-card', box);
      cards[i].classList.remove('on'); cards[i].classList.add('off');
      const prev = cards[i];
      setTimeout(() => prev.classList.remove('off'), 800);
      i = (i + 1) % cards.length;
      cards[i].classList.add('on');
    }, 3200);
  }
  function typeReel() {
    const box = $('#typeReel');
    if (!box) return;
    const samples = { building: 'Bajar el consumo de Sombra a 20 mA', help: '¿Quién ha calibrado un PMS5003?', offer: 'Revisiones de UX de 30 minutos', opportunity: 'Reto verificado de una planta local', launched: 'Salió la v1 del Sintetizador', team: 'Busco a alguien que venda a clínicas', ask: '¿Coworking abierto de noche?' };
    const row = Object.keys(D.TYPES).map((k) => `<div class="type-pill">${C.tdot(k)}<b>${esc(D.TYPES[k].label)}</b><span>${esc(samples[k])}</span></div>`).join('');
    box.innerHTML = row + row;
  }
  function miniMatch() {
    const radar = $('#miniRadar');
    const list = $('#miniMatches');
    if (!radar || !list) return;
    const needs = ['firmware', 'ventas'];
    const res = C.matchPeople(needs);
    radar.innerHTML = C.radarHTML(res, { mini: true, top: 2 });
    const picks = needs.map((t) => res.find((r) => r.hit.includes(t))).filter(Boolean);
    list.innerHTML = `<p class="fine">«Necesito a alguien que sepa de firmware y alguien que sepa vender»</p>` + picks.map((r) =>
      `<div class="match-row">${C.avatar(r.p, 'sm')}<div><b>${esc(r.p.name)}</b><small>${esc(r.why[0] || '')}</small></div><span class="pct">${r.s}%</span></div>`).join('');
  }
  /* ---------- Build Night: cada jueves en Cervecería Averno ---------- */
  // Muestra el próximo jueves; pasadas las 22:00 del jueves, el de la semana siguiente.
  function buildNightDates() {
    const d = C.eventDate({ dow: 4, weeks: 0 });
    if (C.dayDiff(d) === 0 && C.mxl().hh >= 22) d.setDate(d.getDate() + 7);
    const td = $('#ticketDate');
    if (td) td.textContent = C.dayDiff(d) === 0 ? 'Hoy · ' + C.fmtLong(d).toLowerCase() : C.fmtLong(d);
    const day = $('#miniTicketDay');
    if (day) day.textContent = d.getDate();
  }

  /* ---------- Weekly Loop: carátula ---------- */
  const polar = (cx, cy, r, deg) => { const a = (deg * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const arc = (cx, cy, R, r, a1, a2) => {
    const [x1, y1] = polar(cx, cy, R, a1);
    const [x2, y2] = polar(cx, cy, R, a2);
    const [x3, y3] = polar(cx, cy, r, a2);
    const [x4, y4] = polar(cx, cy, r, a1);
    const lg = a2 - a1 > 180 ? 1 : 0;
    return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${R} ${R} 0 ${lg} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}L${x3.toFixed(2)} ${y3.toFixed(2)}A${r} ${r} 0 ${lg} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}Z`;
  };
  let handShown = false;
  let selected = null;
  function dial() {
    const svg = $('#dial');
    if (!svg) return;
    const R = 188;
    const r = 128;
    const today = C.loopKeyFor(C.todayDow());
    let a0 = -90;
    let segs = '';
    D.loop.forEach((l) => {
      const span = ((l.key === 'fin' ? 2 : 1) * 360) / 7;
      l._mid = a0 + span / 2;
      const [tx, ty] = polar(200, 200, (R + r) / 2, l._mid);
      segs += `<g class="dial-seg${l.key === today ? ' today' : ''}" data-key="${l.key}"><path d="${arc(200, 200, R, r, a0 + 0.8, a0 + span - 0.8)}"/><text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="central">${l.day}</text></g>`;
      a0 += span;
    });
    let ticks = '';
    for (let i = 0; i < 56; i++) {
      const a = -90 + (i * 360) / 56;
      const [x1, y1] = polar(200, 200, r - 26, a);
      const [x2, y2] = polar(200, 200, r - (i % 8 === 0 ? 38 : 31), a);
      ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    }
    const tip = 200 - (r - 5);
    svg.innerHTML = `<g class="dial-ticks">${ticks}</g>${segs}<g class="dial-hand" id="dialHand"><path d="M200 ${tip} L193 ${tip + 13} L207 ${tip + 13} Z" style="fill:var(--ink)"/></g>`;
    svg.addEventListener('click', (e) => { const g = e.target.closest('.dial-seg'); if (g) selectDay(g.dataset.key, true); });
    const tabs = $('#dayTabs');
    tabs.innerHTML = D.loop.map((l) => `<button class="day-tab" role="tab" data-key="${l.key}" aria-selected="false">${l.day}${l.key === today ? '<span class="today-mark" title="Hoy"></span>' : ''}</button>`).join('');
    tabs.addEventListener('click', (e) => { const b = e.target.closest('.day-tab'); if (b) selectDay(b.dataset.key, true); });
    selectDay(today, false);
    const wrap = $('.dial-wrap');
    if ('IntersectionObserver' in window && !C.RM()) {
      const io = new IntersectionObserver((es) => {
        if (es[0].isIntersecting) { handShown = true; rotateHand(); io.disconnect(); }
      }, { threshold: 0.4 });
      io.observe(wrap);
    } else { handShown = true; rotateHand(); }
  }
  function rotateHand() {
    const hand = $('#dialHand');
    const l = D.loop.find((x) => x.key === selected);
    if (hand && l && handShown) hand.style.transform = `rotate(${(l._mid + 90).toFixed(2)}deg)`;
  }
  function selectDay(key, animate) {
    selected = key;
    const l = D.loop.find((x) => x.key === key);
    const today = C.loopKeyFor(C.todayDow());
    const isToday = key === today;
    $$('.dial-seg').forEach((g) => g.classList.toggle('on', g.dataset.key === key));
    $$('.day-tab').forEach((b) => { const on = b.dataset.key === key; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    $('#dialDay').textContent = isToday ? 'Hoy · ' + l.day : l.day;
    $('#dialName').textContent = l.name;
    rotateHand();
    const p = C.person(l.example.author);
    $('#loopDetail').innerHTML = `<div class="loop-detail${animate ? ' anim-swap' : ''}">
      <p class="eyebrow">${esc(l.long)}${isToday ? ' · hoy' : ''}</p>
      <h3>${esc(l.name)}</h3>
      <p class="ld-desc">${esc(l.desc)}</p>
      <div class="loop-example">${C.avatar(p, 'sm')}<div><small>${esc(p.name)} · ejemplo de publicación</small><p>${esc(l.example.text)}</p></div></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" data-act="compose" data-type="${l.type}">${isToday ? 'Participar hoy' : 'Preparar mi publicación'}</button><button class="btn" data-go="community">Ver el feed</button></div>
      <p class="loop-note">Es una programación inicial, no una obligación de publicar. Con pocos miembros empezamos con dos o tres dinámicas y aumentamos la frecuencia cuando haya participación real.</p>
    </div>`;
  }

  /* ---------- Miembros fundadores ---------- */
  function seats() {
    const box = $('#seats');
    if (!box) return;
    const lit = S.applied ? S.applied.seat : 0;
    box.innerHTML = Array.from({ length: 30 }, (_, i) => {
      const n = i + 1;
      return `<span class="seat${n === lit ? ' lit' : ''}" style="--i:${i}" title="Lugar ${n}">${n === lit ? esc(C.initials(S.applied.name)) : String(n).padStart(2, '0')}</span>`;
    }).join('');
    if (S.applied) showApplied();
  }
  function showApplied() {
    const card = $('#applyCard');
    if (!card || !S.applied) return;
    card.innerHTML = `<h3>Presenta tu proyecto</h3><div class="form-ok anim-swap">
      <b>Recibimos tu proyecto, ${esc(S.applied.name)}.</b>
      <p>${window.CRAI_LIVE ? 'Guardamos tu solicitud. Completa tu perfil para entrar al club; alguien del equipo te escribirá para conocerte.' : `Apartamos el lugar ${String(S.applied.seat).padStart(2, '0')} de 30 en este navegador. En la versión real, alguien del equipo te escribe para conocerte antes de abrirte la puerta.`}</p>
      <p class="fine">«${esc(S.applied.building)}»</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" data-act="enter-applied">${window.CRAI_LIVE ? 'Completar mi perfil' : 'Entrar a la demo con este perfil'}</button><button class="btn btn-ghost" data-act="reapply">Editar solicitud</button></div>
    </div>`;
  }
  L.resetApply = () => {
    S.applied = null; C.save();
    const card = $('#applyCard');
    if (card) card.innerHTML = applyMarkup;
    seats();
    bindApply();
  };
  let applyMarkup = '';
  function bindApply() {
    const form = $('#applyForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const building = String(fd.get('building') || '').trim();
      if (!name || !building) return;
      const live = !!window.CRAI_LIVE;
      S.applied = { name, building, need: String(fd.get('need') || '').trim(), door: String(fd.get('door') || 'both'), seat: live ? 0 : 1 + Math.floor(Math.random() * 30) };
      C.save();
      seats();
      $$('.seat.lit').forEach((s) => s.animate && !C.RM() && s.animate([{ transform: 'scale(.3)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1.12)' }], { duration: 700, easing: 'cubic-bezier(.34,1.56,.64,1)' }));
      C.toast(live ? `Recibimos tu proyecto, ${esc(name)}.` : `Lugar ${String(S.applied.seat).padStart(2, '0')} apartado para ${esc(name)}`, 'sun');
    });
  }

  /* ---------- Menú del celular: secciones, entrar y tema ---------- */
  const MENU = [['puertas', 'Las dos puertas'], ['preguntas', 'El club'], ['funciones', 'Funciones'], ['semana', 'La semana'], ['irl', 'IRL'], ['reglas', 'Reglas'], ['ruta', 'Ruta'], ['unete', 'Miembros fundadores']];
  function menuHTML() {
    const signed = S.auth && S.auth.user;
    return `<header class="m-head"><h2>CRAI Club</h2><button type="button" class="icon-btn" data-act="close" aria-label="Cerrar menú">${C.icon('x')}</button></header>
      <nav class="menu-list" aria-label="Secciones">${MENU.map(([id, l]) => `<button type="button" class="menu-link" data-act="nav-to" data-t="${id}">${esc(l)}${C.icon('chev')}</button>`).join('')}</nav>
      <div class="menu-foot">
        ${signed ? '<button type="button" class="btn btn-primary btn-lg" data-act="join">Ir a mi club</button>'
          : '<button type="button" class="btn btn-primary btn-lg" data-act="join">Crear mi cuenta</button><button type="button" class="btn btn-lg" data-act="login">Ya tengo cuenta · Entrar</button>'}
        <button type="button" class="btn btn-ghost" data-act="theme">${C.icon('sun', 'i-sun')}${C.icon('moon', 'i-moon')}Cambiar tema</button>
      </div>`;
  }
  function mobileMenu() {
    const btn = $('#menuBtn');
    if (!btn) return;
    btn.addEventListener('click', () => C.openLayer('modal', menuHTML(), { cls: 'menu-sheet', label: 'Menú' }));
  }
  C.extraActions = Object.assign(C.extraActions || {}, {
    'nav-to': (el) => {
      const t = document.getElementById(el.dataset.t);
      C.closeAll();
      if (t) setTimeout(() => t.scrollIntoView({ behavior: C.RM() ? 'auto' : 'smooth', block: 'start' }), 80);
    }
  });

  /* ---------- Botones magnéticos ---------- */
  function magnets() {
    if (!C.canHover() || C.RM()) return;
    $$('.magnet').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.2).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1)}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Hero vivo: verbo rotativo, sol que sigue al cursor y salida al hacer scroll ---------- */
  const VERBS = [['construyen', 'c-blue'], ['diseñan', 'c-sol'], ['programan', 'c-under'], ['fabrican', 'c-sol'], ['lanzan', 'c-blue']];
  let verbIdx = 0;
  let heroVisible = true;
  const split = (w) => [...w].map((c, i) => `<span class="ch" style="--i:${i}">${c}</span>`).join('');
  function rotateVerb() {
    const rot = $('#rot');
    if (!rot || S.mode !== 'landing' || document.hidden || !heroVisible) return;
    const cur = rot.querySelector('.rot-word:not(.leave)');
    verbIdx = (verbIdx + 1) % VERBS.length;
    const [word, tone] = VERBS[verbIdx];
    if (cur) {
      if (!cur.querySelector('.ch')) cur.innerHTML = split(cur.textContent);
      cur.classList.remove('enter', 'morph');
      cur.classList.add('leave');
      setTimeout(() => cur.remove(), 950);
    }
    const el = document.createElement('span');
    el.className = `rot-word ${tone} enter`;
    el.innerHTML = split(word);
    rot.appendChild(el);
    const hl = $('#hlVerb');
    if (hl) { hl.dataset.tone = tone.replace('c-', ''); rot.style.width = el.offsetWidth + 'px'; }
  }
  function fitVerb() {
    const rot = $('#rot');
    const w0 = rot && rot.querySelector('.rot-word');
    if (w0 && $('#hlVerb')) rot.style.width = w0.offsetWidth + 'px';
  }
  function heroMotion() {
    const hero = $('.hero');
    if (!hero || C.RM()) return;
    let raf = 0;
    let gx = 0;
    const apply = () => {
      raf = 0;
      const sun = $('.big-sun');
      if (!sun) return;
      const sr = sun.getBoundingClientRect();
      sun.style.setProperty('--gx', Math.max(0, Math.min(100, ((gx - sr.left) / sr.width) * 100)).toFixed(1) + '%');
    };
    hero.addEventListener('pointermove', (e) => {
      gx = e.clientX;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { heroVisible = es[0].isIntersecting; }).observe(hero);
  }
  let scrollRaf = 0;
  function heroScroll() {
    scrollRaf = 0;
    const head = $('#heroHead');
    const stage = $('#doorsStage');
    if (!head || !stage || S.mode !== 'landing' || C.RM()) return;
    const hp = Math.min(1, Math.max(0, window.scrollY / 540));
    head.style.transform = hp ? `translate3d(0, ${(-hp * 48).toFixed(1)}px, 0)` : '';
    head.style.opacity = hp ? (1 - hp * 0.45).toFixed(3) : '';
    const orb = $('#orbStage');
    if (orb) orb.style.setProperty('--rise', hp.toFixed(3));
    if (innerWidth > 900) {
      const r = stage.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.85)));
      stage.style.setProperty('--ds', (0.94 + 0.06 * p).toFixed(4));
    } else stage.style.removeProperty('--ds');
  }
  const onHeroScroll = () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(heroScroll); };
  // Personajes del club en órbita alrededor del sol: detrás del sol arriba, al frente abajo.
  function sunOrbit() {
    const stage = $('#orbStage');
    const box = $('#orbiters');
    if (!stage || !box) return;
    const ids = ['valeria', 'ivan', 'mariana', 'andres', 'salvador', 'ximena', 'rodrigo', 'paola'];
    box.innerHTML = ids.map((id) => { const p = C.person(id); return `<span class="orbiter"><span class="ob-face">${C.toonSVG(p)}</span><span class="ob-tag">${esc(C.firstName(p))} · ${esc(String(p.role).split(' · ')[0])}</span></span>`; }).join('');
    const els = $$('.orbiter', box);
    let angle = -0.4;
    let last = performance.now();
    let paused = false;
    let visible = true;
    const place = () => {
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const rx = Math.min(W * 0.45, 620);
      const ry = H * 0.27;
      els.forEach((el, i) => {
        const a = angle + (i * Math.PI * 2) / els.length;
        const depth = (Math.sin(a) + 1) / 2;
        el.style.transform = `translate3d(${(W / 2 + Math.cos(a) * rx).toFixed(1)}px, ${(H * 0.56 + Math.sin(a) * ry).toFixed(1)}px, 0) translate(-50%, -50%) scale(${(0.6 + depth * 0.5).toFixed(3)})`;
        el.style.zIndex = depth > 0.5 ? 5 : 1;
        el.style.opacity = (0.55 + depth * 0.45).toFixed(2);
      });
    };
    place();
    window.addEventListener('resize', place, { passive: true });
    if (C.RM()) return;
    box.addEventListener('pointerover', () => { paused = true; });
    box.addEventListener('pointerout', () => { paused = false; });
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(stage);
    const tick = (now) => {
      const dt = Math.min(64, now - last);
      last = now;
      if (!paused && visible && S.mode === 'landing' && !document.hidden) { angle += dt * 0.00011; place(); }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  function liveHero() {
    sunOrbit();
    heroMotion();
    heroScroll();
    window.addEventListener('scroll', onHeroScroll, { passive: true });
    window.addEventListener('resize', onHeroScroll, { passive: true });
    if (C.RM()) return;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitVerb); else setTimeout(fitVerb, 600);
    setTimeout(() => { setInterval(rotateVerb, 2900); }, 3400);
  }

  L.pause = () => { stopLoop(); };
  L.resume = () => { sw = 0; sh = 0; requestAnimationFrame(() => { sizeStars(); startLoop(); }); };
  L.refresh = () => { miniMatch(); };

  L.init = () => {
    applyMarkup = ($('#applyCard') || {}).innerHTML || '';
    tickClock();
    setInterval(tickClock, 20000);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    doors();
    liveHero();
    flipStack();
    typeReel();
    miniMatch();
    buildNightDates();
    dial();
    seats();
    bindApply();
    magnets();
    mobileMenu();
    C.tilt($('#ticket'), 12);
    C.observeReveal($('#site'));
  };
})();
