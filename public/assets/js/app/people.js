/* CRAI Club · personas: tarjeta emergente, perfil completo, tarjeta de presentación y primer contacto */
(function () {
  'use strict';
  const C = window.CRAI;
  const D = C.D;
  const S = C.S;
  const $ = C.$;
  const esc = C.esc;
  const icon = C.icon;
  const doc = document;

  C.FORMATS = {
    cafe: '¿Te late un café de 20 minutos esta semana para platicarte la idea?',
    call: '¿Tienes 15 minutos para una llamada esta semana?',
    bn: '¿Vas al Build Night del jueves? Me encantaría platicarte la idea ahí.',
    msg: '¿Te cuento la idea por aquí y vemos si tiene sentido platicar?'
  };
  const PREF_KEY = { 'Café en persona': 'cafe', 'Llamada corta': 'call', 'En el Build Night': 'bn', 'Mensaje primero': 'msg' };
  const PREF_ICON = { 'Café en persona': 'coffee', 'Llamada corta': 'chat', 'Mensaje primero': 'send', 'En el Build Night': 'moon' };
  const fitOf = (id) => (id === 'me' ? null : C.matchPeople(S.me.needsTags || []).find((r) => r.p.id === id));
  const lower = (t) => C.tagLabel(t).toLowerCase();

  /* =================== Tarjeta emergente =================== */
  let hc = null;
  let showT = 0;
  let hideT = 0;
  let hcFor = null;
  const hcEl = () => {
    if (!hc) { hc = doc.createElement('div'); hc.id = 'hovercard'; hc.className = 'hc'; hc.setAttribute('role', 'tooltip'); doc.body.appendChild(hc); }
    return hc;
  };
  function hcHTML(p) {
    const isMe = p.id === 'me';
    const fit = fitOf(p.id);
    const sh = isMe ? null : C.sharedWith(p);
    const common = sh ? [...sh.gets.map((t) => `te aporta ${lower(t)}`), ...sh.interests.map((i) => `les interesa ${i}`)].slice(0, 2) : [];
    return `<div class="hc-banner bn-${p.door}" style="--h:${p.hue}"></div>
      <div class="hc-body">
        <div class="hc-id">${C.avatar(p, 'lg', { presence: true })}<div><b>${esc(p.name)}</b><small>${esc(p.role)}</small></div>${fit && fit.s >= 40 ? `<span class="pct" title="Compatibilidad contigo">${fit.s}%</span>` : ''}</div>
        <p class="hc-build">${icon('build')}<span>${esc(C.projectName(p))}</span></p>
        <div class="hc-grid"><div><span class="lbl">Necesita</span><div class="chips">${C.tagChips(p.needsTags, 'need', 2)}</div></div><div><span class="lbl">Aporta</span><div class="chips">${C.tagChips(p.offerTags, 'offer', 2)}</div></div></div>
        <div class="hc-meta">${p.reply ? `<span>${icon('clock')}${esc(p.reply)}</span>` : p.prefers ? `<span>${icon(PREF_ICON[p.prefers] || 'coffee')}${esc(p.prefers)}</span>` : ''}<span>${icon('pin')}${esc(p.zone || 'Mexicali')}</span></div>
        ${common.length ? `<p class="hc-common">${icon('spark')}<span>En común: ${esc(C.list(common))}.</span></p>` : ''}
        <div class="hc-actions">${isMe ? '<button class="btn btn-sm btn-primary" data-act="edit-profile">Editar mi perfil</button>' : `<button class="btn btn-sm btn-door" data-act="contact" data-id="${p.id}">${icon('send')}Presentarme</button>`}
          <button class="btn btn-sm" data-act="person" data-id="${p.id}">Ver perfil</button>
          <button class="icon-btn hc-card" data-act="bizcard" data-id="${p.id}" aria-label="Ver tarjeta de presentación" title="Tarjeta de presentación">${icon('briefcase')}</button></div>
      </div>`;
  }
  function showHC(t) {
    const p = C.person(t.dataset.hc);
    if (!p || !doc.contains(t)) return;
    const el = hcEl();
    hcFor = t;
    el.classList.remove('on');
    el.innerHTML = hcHTML(p);
    const r = t.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const below = r.bottom + 12 + h < innerHeight - 8 || r.top < h + 20;
    const left = Math.max(10, Math.min(innerWidth - w - 10, r.left + r.width / 2 - w / 2));
    const top = below ? r.bottom + 12 : r.top - h - 12;
    el.style.top = Math.round(Math.max(8, Math.min(innerHeight - h - 8, top))) + 'px';
    el.style.left = Math.round(left) + 'px';
    el.dataset.place = below ? 'below' : 'above';
    el.style.setProperty('--ox', Math.round(Math.max(18, Math.min(w - 18, r.left + r.width / 2 - left))) + 'px');
    requestAnimationFrame(() => el.classList.add('on'));
  }
  C.hideHC = () => { clearTimeout(showT); hcFor = null; if (hc) hc.classList.remove('on'); };
  doc.addEventListener('pointerover', (e) => {
    if ((e.pointerType && e.pointerType !== 'mouse') || !C.canHover()) return;
    if (e.target.closest('#hovercard')) { clearTimeout(hideT); return; }
    const t = e.target.closest('[data-hc]');
    if (!t) return;
    clearTimeout(hideT);
    if (t === hcFor) return;
    clearTimeout(showT);
    showT = setTimeout(() => showHC(t), hc && hc.classList.contains('on') ? 140 : 450);
  });
  doc.addEventListener('pointerout', (e) => {
    const from = e.target.closest('[data-hc], #hovercard');
    if (!from) return;
    const to = e.relatedTarget;
    if (to && to.closest && (from.contains(to) || to.closest('#hovercard'))) return;
    clearTimeout(showT);
    hideT = setTimeout(C.hideHC, 260);
  });
  doc.addEventListener('focusin', (e) => {
    const t = e.target.closest && e.target.closest('[data-hc]');
    if (t && t.matches(':focus-visible')) { clearTimeout(showT); showT = setTimeout(() => showHC(t), 300); }
  });
  doc.addEventListener('focusout', (e) => {
    const to = e.relatedTarget;
    if (to && to.closest && to.closest('#hovercard')) return;
    if (e.target.closest && e.target.closest('[data-hc], #hovercard')) { clearTimeout(showT); hideT = setTimeout(C.hideHC, 200); }
  });
  window.addEventListener('scroll', () => { if (hcFor) C.hideHC(); }, { passive: true, capture: true });
  doc.addEventListener('click', (e) => { if (e.target.closest('#hovercard [data-act], #hovercard [data-go]')) setTimeout(C.hideHC, 0); }, true);

  /* =================== Perfil completo =================== */
  const LINK_LABEL = { linkedin: 'LinkedIn', github: 'GitHub', web: 'Portafolio' };
  // Los perfiles reales abren su enlace; los de ejemplo solo avisan que son de muestra.
  const linkChip = (p, k, v) => (p.live || (p.id === 'me' && C.isLive())
    ? `<a class="chip chip-skill" href="${esc(C.safeUrl(v))}" target="_blank" rel="noopener noreferrer nofollow">${icon('link')}${LINK_LABEL[k] || 'Enlace'}</a>`
    : `<button class="chip chip-skill" data-act="demo-link">${icon('link')}${LINK_LABEL[k] || 'Enlace'}</button>`);
  function profileTab(p) {
    const isMe = p.id === 'me';
    const fit = fitOf(p.id);
    const pr = p.projectId && C.project(p.projectId);
    const sh = isMe ? null : C.sharedWith(p);
    const links = Object.entries(p.links || {}).filter(([, v]) => v && (!(p.live || isMe) || C.safeUrl(v)));
    const badges = isMe ? C.unlockedBadges() : p.badges || [];
    const hasCommon = sh && (sh.interests.length || sh.events.length || sh.offers.length || sh.gets.length);
    return `
      ${fit && fit.s >= 40 ? `<div class="d-sec pd-fit">${C.ring(fit.s, fit.s + '%', '', 60)}<div><h3>Por qué encaja contigo</h3><ul class="why-list">${fit.why.slice(0, 3).map((w) => `<li>${icon('check')}<span>${esc(w)}</span></li>`).join('')}</ul></div></div>` : ''}
      <div class="d-sec"><h3>Qué está construyendo</h3>
        ${pr ? `<button class="pd-project" data-act="project" data-id="${pr.id}"><span class="cover update-cover pat-${pr.pattern}" style="--h:${pr.hue}"></span><span><b>${esc(pr.name)}</b><small>${esc(C.stageLabel(pr.stage))} · ${esc(pr.tagline)}</small></span>${icon('chev')}</button>` : `<p>${esc(p.building)}</p>`}
        ${p.bio ? `<p class="muted" style="font-size:14.5px">${esc(p.bio)}</p>` : ''}</div>
      ${p.style ? `<div class="d-sec"><h3>Cómo trabajar ${isMe ? 'conmigo' : `con ${esc(C.firstName(p))}`}</h3><blockquote class="pd-quote">${esc(p.style)}</blockquote>
        <div class="pd-facts">
          <div>${icon(PREF_ICON[p.prefers] || 'coffee')}<span><small>Primer contacto</small>${esc(p.prefers || '—')}</span></div>
          <div>${icon('clock')}<span><small>Tiempo de respuesta</small>${esc((p.reply || '—').replace('Responde en ', 'En '))}</span></div>
          <div>${icon('chat')}<span><small>Idiomas</small>${esc((p.langs || []).join(', ') || '—')}</span></div>
          <div>${icon('send')}<span><small>Tasa de respuesta</small>${p.replyRate ? p.replyRate + '% de los primeros contactos' : '—'}</span></div>
        </div></div>` : ''}
      <div class="d-sec"><h3>Qué sabe hacer</h3><div class="skills">${C.skillRows(p)}</div>
        ${(p.learn || []).length ? `<h3 style="margin-top:8px">Quiere aprender</h3><div class="chips">${p.learn.map((s) => `<span class="chip chip-need">${esc(s)}</span>`).join('')}</div>` : ''}</div>
      <div class="d-sec pd-two">
        <div><h3>Busca</h3><div class="chips">${(p.seeking || []).map((k) => `<span class="chip chip-blue">${esc(D.SEEK[k])}</span>`).join('')}${C.tagChips(p.needsTags, 'need', 6)}</div></div>
        <div><h3>Puede aportar</h3><div class="chips">${C.tagChips(p.offerTags, 'offer', 6)}</div>${p.offers ? `<p class="pd-offer">${esc(p.offers)}</p>` : ''}</div>
      </div>
      <div class="d-sec"><h3>Disponibilidad</h3>${C.availGrid(p)}</div>
      ${hasCommon ? `<div class="d-sec"><h3>En común contigo</h3><ul class="common">
        ${sh.gets.length ? `<li>${icon('arrow')}<span>Te puede aportar <b>${esc(C.list(sh.gets.map(lower)))}</b></span></li>` : ''}
        ${sh.offers.length ? `<li>${icon('heart')}<span>Tú le puedes aportar <b>${esc(C.list(sh.offers.map(lower)))}</b></span></li>` : ''}
        ${sh.interests.length ? `<li>${icon('spark')}<span>A los dos les interesa <b>${esc(C.list(sh.interests))}</b></span></li>` : ''}
        ${sh.events.map((e) => `<li>${icon('cal')}<span>Los dos van a <b>${esc(e.title)}</b></span></li>`).join('')}
      </ul></div>` : ''}
      ${badges.length ? `<div class="d-sec"><h3>Insignias</h3><div class="mini-badges">${badges.map((b) => `<span class="mini-badge"><span class="hex t-${D.badges[b].tone}">${icon(D.badges[b].icon)}</span><small>${esc(D.badges[b].name)}</small></span>`).join('')}</div></div>` : ''}
      <div class="d-sec"><h3>Enlaces</h3><div class="chips">${links.length ? links.map(([k, v]) => linkChip(p, k, v)).join('') : '<span class="fine">Sin enlaces todavía.</span>'}</div></div>
      ${isMe ? '' : `<div class="d-sec"><p class="fine">¿Algo no está bien con este perfil? <button class="link-btn" data-act="report" data-id="${p.id}">Denunciar este perfil</button></p></div>`}`;
  }
  function activityTab(p) {
    const posts = C.allPosts().filter((x) => x.author === p.id).slice(0, 4);
    const evs = C.sortedEvents().filter((x) => !x.e.past && (x.e.attendees.includes(p.id) || x.e.host === p.id || (p.id === 'me' && S.going.has(x.e.id))));
    const projs = D.projects.filter((pr) => pr.owner === p.id || C.teamOf(pr).some(([m]) => m === p.id));
    return `
      <div class="d-sec"><h3>Publicaciones recientes</h3>${posts.length ? `<div class="mini-posts">${posts.map((x) => `<div class="mini-post">${C.ptype(x.type)}<p>${esc(x.text)}</p><small>${C.ago(C.postHours(x))} · ${C.postComments(x).length} ${C.postComments(x).length === 1 ? 'comentario' : 'comentarios'}</small></div>`).join('')}</div>` : '<p class="fine">Todavía no publica en el feed.</p>'}</div>
      <div class="d-sec"><h3>Próximos encuentros</h3>${evs.length ? `<div class="team-list">${evs.map(({ e, d }) => `<div class="ev-mini" data-act="event" data-id="${e.id}" tabindex="0">${C.dateBlock(d)}<div><b>${esc(e.title)}</b><p class="fine">${esc(e.time)} · ${e.host === p.id ? 'organiza' : esc(e.venue)}</p></div></div>`).join('')}</div>` : '<p class="fine">Sin encuentros próximos.</p>'}</div>
      <div class="d-sec"><h3>Proyectos</h3>${projs.length ? `<div class="team-list">${projs.map((pr) => `<div class="team-row" data-act="project" data-id="${pr.id}" tabindex="0"><span class="cover update-cover pat-${pr.pattern}" style="--h:${pr.hue}"></span><div><b>${esc(pr.name)}</b><small>${pr.owner === p.id ? 'Fundador' : 'Integrante'} · ${esc(C.stageLabel(pr.stage))}</small></div></div>`).join('')}</div>` : '<p class="fine">Todavía no forma parte de un proyecto publicado.</p>'}</div>
      <div class="d-sec"><h3>Trayectoria en el club</h3><ul class="timeline">
        <li><div><small>${esc(p.joined || '2026')}</small><p>Se unió a CRAI${p.number && p.number <= 30 ? ' como miembro fundador' : ''}.</p></div></li>
        ${(p.id === 'me' ? C.unlockedBadges() : p.badges || []).map((b) => `<li><div><small>Insignia</small><p>Ganó «${esc(D.badges[b].name)}». ${esc(D.badges[b].desc)}</p></div></li>`).join('')}
        ${p.stats ? `<li><div><small>Hasta hoy</small><p>Ayudó ${p.stats.helped} veces, asistió a ${p.stats.events} encuentros y suma ${p.stats.connections} conexiones.</p></div></li>` : ''}
      </ul></div>`;
  }
  function recosTab(p, ends) {
    return `<div class="d-sec"><p class="muted" style="font-size:14px">Recomendaciones de otros miembros. Solo cuentan las que describen algo concreto que pasó.</p>
      <div class="recos">${ends.length ? ends.map((e) => { const a = C.person(e.from); return `<figure class="reco"><blockquote>${esc(e.text)}</blockquote><figcaption>${C.avatar(a, 'sm', { hc: true })}<span><b>${esc(a.id === 'me' ? 'Tú' : a.name)}</b><small>Sobre ${esc(e.tag)}</small></span></figcaption></figure>`; }).join('') : '<p class="fine">Aún no tiene recomendaciones.</p>'}</div>
      ${p.id === 'me' || p.live ? '' : `<button class="btn" style="justify-self:start" data-act="endorse" data-id="${p.id}">${icon('star')}Recomendar a ${esc(C.firstName(p))}</button>`}</div>`;
  }
  C.personHTML = (id, tab = 'perfil') => {
    const p = C.person(id);
    const isMe = id === 'me';
    const following = S.followPeople.has(id);
    const contacted = S.contacted.includes(id);
    const realStats = p.live || (isMe && C.isLive());
    const st = realStats && C.liveStats ? C.liveStats(p) : p.stats || { projects: 0, helped: 0, events: 0, connections: 0 };
    const statLabels = realStats ? [['posts', 'publicaciones'], ['comments', 'comentarios recibidos'], ['days', 'días en el club'], ['skills', 'habilidades']] : [['projects', 'proyectos'], ['helped', 'ayudas dadas'], ['events', 'encuentros'], ['connections', 'conexiones']];
    const ends = C.endorsementsOf(id);
    const tabs = [['perfil', 'Perfil'], ['actividad', 'Actividad'], ['recos', `Recomendaciones · ${ends.length}`]];
    return `<div class="pd-banner bn-${p.door}" style="--h:${p.hue}"><span class="pd-deco" aria-hidden="true"></span><button class="icon-btn d-close" data-act="close" aria-label="Cerrar">${icon('x')}</button></div>
      <div class="pd-head">
        <div class="pd-av">${C.avatar(p, 'xl', { presence: true })}</div>
        <div class="pd-id"><h2>${esc(p.name)}</h2><p>${esc(p.role)}</p>
          <div class="pd-tags">${C.doorChip(p.door)}<span class="open-dot${p.open ? '' : ' off'}">${p.open ? 'Open to collaborate' : 'Sin disponibilidad'}</span>${p.active ? '<span class="chip chip-mint">Activo hoy</span>' : ''}</div></div>
        <div class="pd-actions">
          ${isMe ? `<button class="btn btn-primary" data-act="edit-profile">${icon('edit')}Editar mi perfil</button>`
            : contacted ? `<span class="btn is-on">${icon('check')}Mensaje enviado</span>` : `<button class="btn btn-door" data-act="contact" data-id="${id}">${icon('send')}Presentarme</button>`}
          ${isMe ? '' : `<button class="btn${following ? ' is-on' : ''}" data-act="follow-person" data-id="${id}" aria-pressed="${following}">${following ? icon('check') + 'Siguiendo' : icon('plus') + 'Seguir'}</button>`}
          <button class="btn" data-act="bizcard" data-id="${id}">${icon('briefcase')}Tarjeta</button>
        </div>
        <div class="pd-stats">${statLabels.map(([k, l]) => `<div><b class="tnum" data-count="${st[k]}">${st[k]}</b><small>${l}</small></div>`).join('')}</div>
        <p class="pd-since">${p.number ? `Miembro No. ${String(p.number).padStart(3, '0')}` : 'Miembro'} · desde ${esc(p.joined || '2026')} · ${esc(p.zone || 'Mexicali')}</p>
      </div>
      <div class="pd-tabs" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" class="${tab === k ? 'on' : ''}" aria-selected="${tab === k}" data-act="ptab" data-tab="${k}">${l}</button>`).join('')}</div>
      <div class="pd-body">${tab === 'actividad' ? activityTab(p) : tab === 'recos' ? recosTab(p, ends) : profileTab(p)}</div>`;
  };

  /* =================== Tarjeta de presentación =================== */
  C.openBizcard = (id) => {
    const p = C.person(id);
    if (!p) return;
    C.track('view_item', { item_category: 'tarjeta', propia: id === 'me' ? 'si' : 'no' });
    const liveLink = C.isLive() && (p.live || p.id === 'me') && p.uid;
    const handle = liveLink ? `${location.host}${location.pathname.replace(/index\.html$/, '')}#p-${p.uid}` : 'clubcrai.com/p/' + C.norm(p.name).replace(/[^a-z]+/g, '');
    const panel = C.openLayer('modal', `
      <header class="m-head"><h2>Tarjeta de presentación</h2><button class="icon-btn" data-act="close" aria-label="Cerrar">${icon('x')}</button></header>
      <div class="m-body bz-body">
        <div class="bz-zone"><div class="bz${C.RM() ? '' : ' intro'}" data-act="flip" role="button" tabindex="0" aria-label="Voltear la tarjeta" aria-pressed="false">
          <div class="bz-face bz-front mcard door-${p.door}">${C.mcardInner(p)}</div>
          <div class="bz-face bz-back">
            <div class="mc-top"><span>Cómo trabajar conmigo</span><span>No. ${String(p.number || 0).padStart(3, '0')}</span></div>
            <p class="bz-style">«${esc(p.style || p.offers || '')}»</p>
            <dl class="bz-facts">
              <div><dt>Primer contacto</dt><dd>${esc(p.prefers || '—')}</dd></div>
              <div><dt>Responde</dt><dd>${esc((p.reply || '—').replace('Responde ', ''))}</dd></div>
              <div><dt>Idiomas</dt><dd>${esc((p.langs || []).join(' · ') || '—')}</dd></div>
              <div><dt>Zona</dt><dd>${esc(p.zone || 'Mexicali')}</dd></div>
            </dl>
            <div class="bz-code">${C.codeSVG(p.id)}<span>${esc(handle)}</span></div>
          </div>
        </div></div>
        <p class="fine bz-hint">${icon('refresh')}Toca la tarjeta para voltearla</p>
      </div>
      ${p.id === 'me' && C.isLive() && C.walletButton ? `<div class="bz-wallet">${C.walletButton('member')}</div>` : ''}
      <footer class="m-foot"><button class="btn" data-act="copy-link" data-link="${liveLink ? esc(location.origin + location.pathname + '#p-' + p.uid) : 'https://' + esc(handle)}">${icon('link')}Copiar enlace</button>${p.id === 'me' ? '<button class="btn btn-primary" data-act="edit-profile">Editar mi tarjeta</button>' : `<button class="btn btn-door" data-act="contact" data-id="${p.id}">${icon('send')}Presentarme</button>`}</footer>`,
    { label: 'Tarjeta de ' + p.name, cls: 'bz-modal' });
    C.tilt(panel.querySelector('.bz-zone'), 12);
  };

  /* =================== Primer contacto =================== */
  C.openContact = (id, ctx = {}) => {
    const p = C.person(id);
    if (!p || id === 'me') return;
    const fit = fitOf(id);
    const sh = C.sharedWith(p);
    const pref = PREF_KEY[p.prefers] || 'cafe';
    const reason = (ctx.reason || (fit && fit.hit[0] ? C.tagLabel(fit.hit[0]) : (p.offerTags || [])[0] ? C.tagLabel(p.offerTags[0]) : (p.skills || [])[0]) || '').toLowerCase();
    const why = reason ? ` y vi que sabes de ${reason}` : '';
    const text = ctx.text || `Hola ${C.firstName(p)}, soy ${C.firstName(S.me)}. Estoy construyendo ${C.projectName(S.me)}${why}. ${C.FORMATS[pref]} Si no es buen momento, no pasa nada.`;
    const points = [];
    if (fit) fit.hit.filter((t) => t !== 'testers').slice(0, 2).forEach((t) => points.push([`Su experiencia en ${lower(t)}`, `Tu experiencia en ${lower(t)} es justo lo que me falta.`]));
    sh.offers.slice(0, 1).forEach((t) => points.push([`Puedes aportarle ${lower(t)}`, `A cambio, te puedo echar la mano con ${lower(t)}.`]));
    sh.interests.slice(0, 1).forEach((i) => points.push([`Interés en ${i}`, `También me interesa mucho ${i}.`]));
    if (p.projectId) { const pr = C.project(p.projectId); points.push([`Su proyecto ${pr.name}`, `Vi ${pr.name} y me gustó mucho la idea.`]); }
    sh.events.slice(0, 1).forEach((e) => points.push([`Los dos van a ${e.title}`, `Vi que también vas a ${e.title}; ¿nos vemos ahí?`]));
    const fmts = [['cafe', 'Café 20 min'], ['call', 'Llamada 15 min'], ['bn', 'En el Build Night'], ['msg', 'Por mensaje']];
    C.openLayer('modal', `<form data-form="contact" data-id="${id}" data-help="${ctx.help ? 1 : 0}">
      <header class="m-head"><h2>${ctx.help ? 'Ofrecer ayuda' : 'Primer contacto'}</h2><button type="button" class="icon-btn" data-act="close" aria-label="Cerrar">${icon('x')}</button></header>
      <div class="m-body">
        <div class="link-vis" aria-hidden="true">${C.avatar(S.me, 'lg')}<span class="link-line"><i></i></span>${C.avatar(p, 'lg', { presence: true })}</div>
        <p class="link-cap"><b>${esc(p.name)}</b> · ${esc(p.reply || '')}${p.replyRate ? ` · responde al ${p.replyRate}%` : ''}</p>
        <div class="fld"><span>Propón un formato</span><div class="seg" id="fmtSeg">${fmts.map(([k, l]) => `<label><input type="radio" name="fmt" value="${k}" ${k === pref ? 'checked' : ''}>${l}${k === pref ? '<em class="pref-dot" title="Lo prefiere"></em>' : ''}</label>`).join('')}</div>
          <small class="fine">El punto marca lo que ${esc(C.firstName(p))} prefiere.</small></div>
        ${points.length ? `<div class="fld"><span>Menciona algo en común</span><div class="points">${points.map(([l, t]) => `<button type="button" class="point" data-act="insert-point" data-text="${esc(t)}">${icon('plus')}${esc(l)}</button>`).join('')}</div></div>` : ''}
        <label class="fld"><span>Mensaje</span><textarea class="inp" id="contactText" name="text" rows="5" maxlength="600" autofocus>${esc(text)}</textarea>
          <small class="fine">Breve, concreto y con una salida fácil. Así se responde más.</small></label>
      </div>
      <footer class="m-foot"><p class="fine">CRAI facilita el primer contacto; no garantiza que sean buenos socios.</p><button class="btn btn-door" type="submit">${icon('send')}Enviar</button></footer>
    </form>`, { label: 'Mensaje para ' + p.name });
  };
  const sentHTML = (C.sentHTML = (p, help, live) => live ? `<div class="sent">
      <div class="sent-vis" aria-hidden="true">${C.avatar(S.me, 'lg')}<span class="sent-track"><span class="sent-plane">${icon('send')}</span></span><span class="sent-to">${C.avatar(p, 'lg')}<svg class="sent-check" viewBox="0 0 26 26"><circle cx="13" cy="13" r="12"/><path d="m7.5 13.5 3.6 3.6 7.4-7.6"/></svg></span></div>
      <h2>${help ? 'Ayuda ofrecida' : 'Mensaje enviado'}</h2>
      <p class="muted">${esc(C.firstName(p))} lo verá en sus notificaciones de CRAI.</p>
      <ol class="next-steps">
        <li><span><b>${esc(C.firstName(p))} lo lee</b> en la campana de notificaciones.</span></li>
        <li><span><b>Si le interesa</b>, te responde y lo ves en tus notificaciones.</span></li>
        <li><span><b>Mientras</b>, sigue explorando o publica en qué andas.</span></li>
      </ol>
      <div class="sent-actions"><button class="btn" data-go="match">Encontrar a más personas</button><button class="btn btn-primary" data-act="close" autofocus>Listo</button></div>
    </div>` : `<div class="sent">
      <div class="sent-vis" aria-hidden="true">${C.avatar(S.me, 'lg')}<span class="sent-track"><span class="sent-plane">${icon('send')}</span></span><span class="sent-to">${C.avatar(p, 'lg')}<svg class="sent-check" viewBox="0 0 26 26"><circle cx="13" cy="13" r="12"/><path d="m7.5 13.5 3.6 3.6 7.4-7.6"/></svg></span></div>
      <h2>${help ? 'Ayuda ofrecida' : 'Mensaje enviado'}</h2>
      <p class="muted">Le llegó a ${esc(C.firstName(p))}. ${esc(p.reply || '')}.</p>
      <ol class="next-steps">
        <li><span><b>${esc(C.firstName(p))} lo lee</b> y decide si quiere platicar.</span></li>
        <li><span><b>Si acepta</b>, se abre la conversación y les sugerimos ${esc((p.prefers || 'un café').toLowerCase())}.</span></li>
        <li><span><b>En 5 días</b> te recordamos dar seguimiento, pase lo que pase.</span></li>
      </ol>
      <p class="fine">Prototipo: el mensaje no sale de tu navegador.</p>
      <div class="sent-actions"><button class="btn" data-go="match">Encontrar a más personas</button><button class="btn btn-primary" data-act="close" autofocus>Listo</button></div>
    </div>`);

  /* =================== Recomendar =================== */
  C.openEndorse = (id) => {
    const p = C.person(id);
    C.openLayer('modal', `<form data-form="endorse" data-id="${id}">
      <header class="m-head"><h2>Recomendar a ${esc(C.firstName(p))}</h2><button type="button" class="icon-btn" data-act="close" aria-label="Cerrar">${icon('x')}</button></header>
      <div class="m-body">
        <div class="fld"><span>¿En qué te ayudó?</span><div class="pick">${(p.skills || []).map((s, i) => `<label><input type="radio" name="tag" value="${esc(s)}" id="en-${i}" ${i === 0 ? 'checked' : ''}><span>${esc(s)}</span></label>`).join('')}</div></div>
        <label class="fld"><span>Cuéntalo en una o dos frases</span><textarea class="inp" id="endorseText" name="text" rows="4" maxlength="280" required autofocus placeholder="Qué hizo y qué resultado tuvo. Ej. «Revisó mi circuito y encontró el error en una hora.»"></textarea></label>
      </div>
      <footer class="m-foot"><p class="fine">Las recomendaciones concretas pesan más que los elogios.</p><button class="btn btn-door" type="submit">${icon('star')}Publicar recomendación</button></footer>
    </form>`, { label: 'Recomendar a ' + p.name });
  };

  /* =================== Acciones y formularios =================== */
  C.extraActions = Object.assign(C.extraActions || {}, {
    contact: (el) => C.openContact(el.dataset.id, { reason: el.dataset.reason }),
    bizcard: (el) => C.openBizcard(el.dataset.id),
    flip: (el) => { el.classList.remove('intro'); const on = el.classList.toggle('flipped'); el.setAttribute('aria-pressed', String(on)); },
    ptab: (el) => {
      const panel = el.closest('[data-kind]');
      if (!panel) return;
      const tabs = panel.querySelector('.pd-tabs');
      const keep = tabs && panel.scrollTop > tabs.offsetTop - 8;
      panel.dataset.tab = el.dataset.tab;
      panel.innerHTML = C.personHTML(panel.dataset.id, el.dataset.tab);
      panel.querySelector('.pd-body').classList.add('anim-swap');
      C.fillRings(panel);
      const nt = panel.querySelector('.pd-tabs');
      if (keep && nt) panel.scrollTop = nt.offsetTop - 8;
      const btn = panel.querySelector(`.pd-tabs [data-tab="${el.dataset.tab}"]`);
      if (btn) btn.focus({ preventScroll: true });
    },
    endorse: (el) => C.openEndorse(el.dataset.id),
    'insert-point': (el) => {
      const ta = $('#contactText');
      if (!ta || el.disabled) return;
      const add = el.dataset.text;
      const v = ta.value;
      const firstStop = v.indexOf('. ');
      const at = firstStop > -1 ? firstStop + 2 : v.length;
      ta.value = (v.slice(0, at) + add + ' ' + v.slice(at)).replace(/\s{2,}/g, ' ');
      el.disabled = true;
      el.classList.add('used');
      ta.focus({ preventScroll: true });
      ta.setSelectionRange(at, at + add.length);
    },
    'copy-link': (el) => {
      const link = el.dataset.link;
      C.track('share', { method: 'copiar_enlace', content_type: 'perfil' });
      const done = () => C.toast('Enlace copiado.', 'link');
      const fail = () => C.toast(`Copia el enlace: ${esc(link)}`, 'link');
      try { navigator.clipboard.writeText(link).then(done, fail); } catch (e) { fail(); }
    }
  });
  C.extraForms = Object.assign(C.extraForms || {}, {
    contact: (f) => {
      const id = f.dataset.id;
      const p = C.person(id);
      if (!f.elements.text.value.trim()) return;
      if (!S.contacted.includes(id)) S.contacted.push(id);
      C.save();
      const panel = f.closest('.modal');
      const layer = panel.parentElement;
      if ((p.tags || []).some((t) => (S.me.needsTags || []).includes(t))) layer._onClose = () => C.advanceQuest('q1');
      panel.innerHTML = sentHTML(p, f.dataset.help === '1');
      const done = panel.querySelector('[autofocus]');
      if (done) setTimeout(() => done.focus({ preventScroll: true }), 60);
      if (C.refreshLayers) C.refreshLayers();
    },
    endorse: (f) => {
      const id = f.dataset.id;
      const text = f.elements.text.value.trim();
      if (!text) return;
      (S.endorse[id] = S.endorse[id] || []).unshift({ from: 'me', tag: String(new FormData(f).get('tag') || ''), text });
      C.save();
      C.closeLayer(f.closest('.layer'));
      C.toast(`Publicaste una recomendación para ${esc(C.firstName(C.person(id)))}.`, 'star');
      if (C.refreshLayers) C.refreshLayers();
    }
  });
})();
