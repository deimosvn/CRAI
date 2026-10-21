/* CRAI Club · vistas de la app (2/2): Events, Quests, Explore, Mi perfil, Blueprint */
(function () {
  'use strict';
  const C = window.CRAI;
  const D = C.D;
  const S = C.S;
  const V = C.views;
  const esc = C.esc;
  const icon = C.icon;

  /* ======================= EVENTS · IRL ======================= */
  const KIND_TONE = { 'Build Night': 'under', Demo: 'sol', Taller: 'blue', Coworking: 'mint', Cena: 'sol', Hackatón: 'under' };
  C.goingOf = (e) => e.going + (S.going.has(e.id) ? 1 : 0);
  C.regBtn = (e, small) => {
    const sz = small ? ' btn-sm' : '';
    if (e.past) return '';
    if (S.going.has(e.id)) return `<button class="btn is-on${sz}" data-act="register" data-id="${e.id}" aria-pressed="true">${icon('check')}Registrado</button>`;
    if (C.goingOf(e) >= e.cap) return `<button class="btn${sz}" data-act="register" data-id="${e.id}">Lista de espera</button>`;
    return `<button class="btn btn-door${sz}" data-act="register" data-id="${e.id}" aria-pressed="false">Registrarme</button>`;
  };
  C.remindBtn = (e) => { const on = S.reminders.has(e.id); return `<button class="btn btn-ghost${on ? ' is-on' : ''}" data-act="remind" data-id="${e.id}" aria-pressed="${on}">${icon('bell')}${on ? 'Te avisamos 24 h antes' : 'Recordarme'}</button>`; };
  C.attendeesHTML = (e, max = 7) => {
    const list = e.attendees.filter((id) => id !== 'me' || S.going.has(e.id));
    if (S.going.has(e.id) && S.me.privacy && S.me.privacy.attendee && !list.includes('me')) list.unshift('me');
    const shown = list.slice(0, max);
    const rest = Math.max(0, C.goingOf(e) - e.hidden - shown.length);
    return `<span class="av-stack">${shown.map((id) => C.avatar(C.person(id), 'sm', { hc: true })).join('')}${rest ? `<span class="av-more">+${rest}</span>` : ''}</span>`;
  };
  const capHTML = (e, wide) => { const g = C.goingOf(e); return `<div class="cap"${wide ? ' style="width:100%;max-width:360px"' : ''}><div class="bar" style="--v:${Math.min(100, (g / e.cap) * 100)}%"><i></i></div><span class="tnum">${g} de ${e.cap} lugares${wide ? ` · quedan ${Math.max(0, e.cap - g)}` : ''}</span></div>`; };

  V.events = {
    render() {
      const evs = C.sortedEvents().filter((x) => C.doorOk(x.e.door));
      const up = evs.filter((x) => !x.e.past);
      const past = evs.filter((x) => x.e.past);
      const feat = up.find((x) => x.e.featured) || up[0];
      const rest = up.filter((x) => x !== feat);
      return `
      <div class="vh"><div><p class="eyebrow">Events · IRL ${C.exampleChip()}</p><h1>La comunidad fuera de internet</h1><p>Encuentros pequeños, sesiones de trabajo, talleres, cenas de founders, demos y hackatones.</p></div>
        <div class="vh-actions">${C.doorSwitch()}<button class="btn btn-primary" data-act="propose">${icon('plus')}Proponer una sesión</button></div></div>
      ${feat ? `<article class="card ev-feature">
        <div class="ev-feature-main">
          <p class="eyebrow">${esc(feat.e.kind)} · ${C.fmtRel(feat.d)}</p>
          <h2>${esc(feat.e.title)}</h2>
          <p class="muted">${esc(feat.e.desc)}</p>
          <div class="ev-sub"><span>${icon('cal')}${C.fmtLong(feat.d)}</span><span>${icon('clock')}${esc(feat.e.time)}</span><span>${icon('pin')}${esc(feat.e.venue)}</span></div>
          ${capHTML(feat.e, true)}
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">${C.attendeesHTML(feat.e)}<span class="fine">${feat.e.hidden} personas prefieren no aparecer en la lista</span></div>
          <div class="d-actions">${C.regBtn(feat.e)}${C.remindBtn(feat.e)}</div>
        </div>
        <div class="ev-feature-side"><p class="eyebrow">Agenda de la noche</p>
          ${feat.e.agenda ? `<ul class="agenda">${feat.e.agenda.map(([t, a]) => `<li><time>${t}</time>${esc(a)}</li>`).join('')}</ul>` : `<p>${esc(feat.e.desc)}</p>`}
        </div>
      </article>` : ''}
      <div class="block-h"><h2>Próximos encuentros</h2><p>Con registro, cupo, recordatorios y lista de asistentes según la privacidad de cada quien.</p></div>
      <div class="ev-list">${rest.length ? rest.map(({ e, d }) => `<article class="card ev" data-act="event" data-id="${e.id}" tabindex="0">
          ${C.dateBlock(d)}
          <div class="ev-info"><div class="chips"><span class="chip chip-${KIND_TONE[e.kind] || 'blue'}">${esc(e.kind)}</span>${C.doorChip(e.door)}</div><h3>${esc(e.title)}</h3>
            <div class="ev-sub"><span>${icon('clock')}${esc(e.time)}</span><span>${icon('pin')}${esc(e.venue)}</span></div></div>
          <div class="ev-side">${capHTML(e)}${C.regBtn(e, true)}</div>
        </article>`).join('') : `<div class="empty">${icon('cal')}<p>No hay más encuentros con este filtro.</p></div>`}</div>
      ${past.length ? `<div class="block-h" style="margin-top:34px"><h2>Después del encuentro</h2><p>Un espacio para compartir resultados: qué se mostró y qué conexiones salieron.</p></div>
        ${past.map(({ e, d }) => `<article class="card ev-past" style="display:grid;gap:14px">
          <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center"><div><p class="eyebrow">${C.fmtLong(d)}</p><h3 style="font-size:20px;margin-top:6px">${esc(e.title)}</h3></div>${C.attendeesHTML(e, 6)}</div>
          <div class="results-box"><div><b data-count="${e.results.demos}">${e.results.demos}</b><small>demos presentadas</small></div><div><b data-count="${e.results.connections}">${e.results.connections}</b><small>conexiones nuevas</small></div></div>
          <ul class="why-list">${e.results.highlights.map((h) => `<li>${icon('check')}<span>${esc(h)}</span></li>`).join('')}</ul>
          <div><button class="btn btn-sm" data-act="compose" data-type="launched">Compartir un resultado</button></div>
        </article>`).join('')}` : ''}`;
    }
  };

  /* ======================= QUESTS ======================= */
  V.quests = {
    render() {
      const unlocked = new Set(C.unlockedBadges());
      const done = D.quests.filter(C.questDone).length;
      return `
      <div class="vh"><div><p class="eyebrow">Quests · misiones comunitarias</p><h1>Retos que convierten la participación en acción</h1><p>Las insignias se ganan con contribuciones reales. No premiamos publicar mucho: premiamos ayuda, proyectos y conexiones de calidad.</p></div>
        <div class="vh-actions">${C.ring((done / D.quests.length) * 100, `${done}/${D.quests.length}`, 'mint', 64)}</div></div>
      <div class="quest-grid">${D.quests.map((q) => {
        const v = C.qp(q.id);
        const ok = v >= q.goal;
        const b = D.badges[q.badge];
        return `<article class="card quest${ok ? ' done' : ''}">
          ${C.ring((v / q.goal) * 100, `${v}/${q.goal}`, b.tone, 64)}
          <div><h3>${esc(q.title)}</h3><p>${esc(q.hint)}</p>
            <div class="quest-foot"><span class="chip chip-${b.tone}">${icon(b.icon)}${esc(b.name)}</span>
              ${ok ? `<span class="chip chip-mint">${icon('check')}Completada</span>` : `<button class="btn btn-sm btn-door" data-act="quest-go" data-id="${q.id}">${esc(q.cta)}</button>`}</div></div>
        </article>`;
      }).join('')}</div>
      <div class="block-h"><h2>Insignias</h2><p>${unlocked.size} de ${Object.keys(D.badges).length} desbloqueadas. Toca una para ver cómo se gana.</p></div>
      <div class="badge-row">${Object.entries(D.badges).map(([id, b]) => {
        const on = unlocked.has(id);
        return `<button class="card badge-card${on ? '' : ' locked'}" data-act="badge" data-id="${id}"><span class="hex ${on ? 't-' + b.tone : 'locked'}">${icon(on ? b.icon : 'lock')}</span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></button>`;
      }).join('')}</div>`;
    }
  };

  /* ======================= EXPLORE ======================= */
  V.explore = {
    render() {
      const sp = D.spotlight;
      const sp_p = C.person(sp.person);
      const fresh = C.isLive() ? C.members().slice().sort((a, b) => (b.created || 0) - (a.created || 0)).slice(0, 6) : D.people.slice(-6).reverse();
      const top = C.visibleProjects().slice().sort((a, b) => C.followersOf(b) - C.followersOf(a)).slice(0, 3);
      const asks = C.allPosts().filter((p) => p.type === 'ask').slice(0, 2);
      const hub = [['community', 'chat', 'blue', 'Community', 'Feed y preguntas'], ['people', 'users', 'sol', 'People', 'Directorio de talento'], ['projects', 'box', 'under', 'Projects', 'Lo que se crea'], ['match', 'radar', 'mint', 'Collab Match', 'Encuentra a quien necesitas'], ['quests', 'flag', 'sol', 'Quests', 'Misiones de la semana']];
      return `
      <div class="vh"><div><p class="eyebrow">Explore</p><h1>Descubre lo que pasa en el club</h1><p>Nuevos miembros, proyectos destacados, recursos y oportunidades.</p></div></div>
      <div class="hub">${hub.map(([go, ic, tone, t, s]) => `<button class="hub-tile" data-go="${go}"><span class="tdot tone-${tone}">${icon(ic)}</span><span><b>${t}</b><small>${s}</small></span></button>`).join('')}</div>
      <div class="stack">
        <section>
          <div class="block-h"><h2>Founder Spotlight</h2><span class="chip chip-sol">${C.isLive() ? 'Ejemplo' : 'Miércoles'}</span><p>Una persona cuenta qué está creando, qué ha aprendido y qué necesita.</p></div>
          <article class="card spot-card">${C.avatar(sp_p, 'xl')}<div style="display:grid;gap:14px;min-width:0"><div><b style="font-size:18px">${esc(sp_p.name)}</b><p class="muted">${esc(sp_p.role)}</p></div>
            <dl><div><dt>Qué está creando</dt><dd>${esc(sp.creating)}</dd></div><div><dt>Qué ha aprendido</dt><dd>${esc(sp.learned)}</dd></div><div><dt>Qué necesita</dt><dd>${esc(sp.needs)}</dd></div></dl>
            <div class="d-actions"><button class="btn btn-sm btn-door" data-act="contact" data-id="${sp_p.id}">Presentarme</button><button class="btn btn-sm" data-act="person" data-id="${sp_p.id}">Ver perfil</button></div></div></article>
        </section>
        <section>
          ${fresh.length ? '' : C.liveNote('members')}<div class="block-h"><h2>Nuevos miembros</h2><button class="link-btn" data-go="people">Ver directorio ${icon('arrow')}</button></div>
          <div class="hscroll">${fresh.map((p) => `<article class="card newbie spot" data-act="person" data-id="${p.id}" tabindex="0">${C.avatar(p, 'lg')}<div><b>${esc(p.name)}</b><small style="display:block">${esc(p.role)}</small></div><div class="chips">${C.tagChips(p.offerTags, 'offer', 2)}</div></article>`).join('')}</div>
        </section>
        <section class="two-col">
          <div class="card"><div class="card-h"><h3>Opportunity Drop</h3><span class="chip chip-mint">${icon('shield')}Verificadas</span></div>
            ${D.opportunities.map((o) => `<div class="opp"><span class="tdot tone-${o.tone}">${icon('megaphone')}</span><div><b>${esc(o.title)}</b><small>${esc(o.kind)} · ${esc(o.org)} · ${esc(o.due)}</small></div></div>`).join('')}
            <p class="fine" style="margin-top:10px">Lo patrocinado se marca como patrocinado. Nadie paga por aparecer en las búsquedas.</p></div>
          <div class="card"><div class="card-h"><h3>Recursos</h3></div>
            ${D.resources.map((r) => `<button class="res-link" data-act="demo-link"><span class="tdot tone-blue">${icon(r.icon)}</span><span><b>${esc(r.title)}</b><small>${esc(r.kind)}</small></span>${icon('chev')}</button>`).join('')}</div>
        </section>
        <section>
          <div class="block-h"><h2>Ask Mexicali</h2><button class="link-btn" data-act="compose" data-type="ask">Hacer una pregunta ${icon('arrow')}</button><p>Proveedores, talento, recursos, experiencias de negocio o ayuda técnica en la ciudad.</p></div>
          <div class="feed">${asks.map(C.postHTML).join('')}</div>
        </section>
        <section>
          <div class="block-h"><h2>Proyectos destacados</h2><button class="link-btn" data-go="projects">Ver todos ${icon('arrow')}</button></div>
          <div class="proj-grid">${top.map(C.projectCard).join('')}</div>
        </section>
      </div>`;
    }
  };

  /* ======================= MI PERFIL ======================= */
  const tagsText = (tags) => tags && tags.length ? esc(tags.map(C.tagLabel).join(' · ')) : '—';
  C.mcardInner = (me) => `${me.door === 'both' ? '<span class="mc-sun"></span>' : ''}<span class="mc-toon">${C.toonSVG(me)}</span>
    <div class="mc-top"><span>CRAI Club</span><span>MXL · 686</span></div>
    <div><p class="mc-name">${esc(me.name || 'Tu nombre')}</p><p class="mc-role">${esc(me.role || 'Qué haces')}</p></div>
    <p class="mc-build">${me.building ? 'Construye · ' + esc(me.building) : 'Cuéntanos qué estás construyendo'}</p>
    <div class="mc-row"><div><small>Necesita</small>${tagsText(me.needsTags)}</div><div><small>Aporta</small>${tagsText(me.offerTags)}</div></div>
    <div class="mc-foot"><span>${esc(D.DOORS[me.door] || '')}</span><span class="tnum">No. ${me.number ? String(me.number).padStart(3, '0') : '—'} · 2026</span></div>`;
  C.completeness = (me) => {
    const checks = [me.name, me.role, me.building, me.bio, (me.skills || []).length, (me.learn || []).length, (me.seeking || []).length, me.offers, (me.needsTags || []).length, (me.offerTags || []).length, (me.avail || []).length, Object.values(me.links || {}).some(Boolean)];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  };
  C.completeHTML = (me) => { const v = C.completeness(me); return `${C.ring(v, v + '%', v >= 80 ? 'mint' : 'sol', 58)}<div><b>${v >= 80 ? 'Perfil listo para conectar' : 'Completa tu perfil'}</b><small>${v >= 80 ? 'Ya apareces en las recomendaciones de Collab Match.' : 'Un perfil completo recibe mejores recomendaciones.'}</small></div>`; };
  C.toonBuilderHTML = (me) => {
    const T = C.TOON;
    const tb = C.toonOf(me);
    const sw = (k, list, names) => `<div class="tb-row" role="group" aria-label="${names}">${list.map((c, i) => `<button type="button" class="tb-sw${tb[k] === i ? ' on' : ''}" style="--c:${c}" data-act="toon" data-k="${k}" data-v="${i}" aria-label="${names} ${i + 1}" aria-pressed="${tb[k] === i}"></button>`).join('')}</div>`;
    return `<fieldset class="toon-builder"><legend>Tu personaje</legend>
      <p class="fine">Es tu foto de perfil en todo el club. Elige el detalle que va con lo que haces.</p>
      <div class="tb-wrap">
        <div class="tb-preview" id="toonPreview">${C.toonSVG(me)}</div>
        <div class="tb-opts">
          <div class="fld"><span>Peinado</span><div class="tb-row">${T.hair.map((h, i) => `<button type="button" class="tb-opt${tb.hair === i ? ' on' : ''}" data-act="toon" data-k="hair" data-v="${i}" title="${T.labels.hair[h]}" aria-label="${T.labels.hair[h]}" aria-pressed="${tb.hair === i}">${C.toonSVG(me, { hair: i, acc: 'ninguno', beard: false })}</button>`).join('')}</div></div>
          <div class="tb-cols"><div class="fld"><span>Piel</span>${sw('skin', T.skin, 'Tono de piel')}</div><div class="fld"><span>Cabello</span>${sw('hairColor', T.hairColor, 'Color de cabello')}</div></div>
          <div class="tb-cols"><div class="fld"><span>Fondo</span>${sw('bg', T.bg, 'Color de fondo')}</div><div class="fld"><span>Playera</span>${sw('shirt', T.shirt, 'Color de playera')}</div></div>
          <div class="fld"><span>Detalle de tu profesión</span><div class="tb-chips">${T.acc.map((a) => `<button type="button" class="fchip${tb.acc === a ? ' on' : ''}" data-act="toon" data-k="acc" data-v="${a}" aria-pressed="${tb.acc === a}">${T.labels.acc[a]}</button>`).join('')}<button type="button" class="fchip${tb.beard ? ' on' : ''}" data-act="toon" data-k="beard" data-v="${tb.beard ? 0 : 1}" aria-pressed="${tb.beard}">Barba</button></div></div>
          <div class="fld"><span>Ojos</span><div class="tb-row">${T.eyes.map((k, i) => `<button type="button" class="tb-opt${tb.eyes === i ? ' on' : ''}" data-act="toon" data-k="eyes" data-v="${i}" title="${T.labels.eyes[k]}" aria-label="${T.labels.eyes[k]}" aria-pressed="${tb.eyes === i}">${C.toonSVG(me, { eyes: i, acc: 'ninguno', tilt: 0, turn: 0, doodle: 0 })}</button>`).join('')}</div></div>
          <div class="fld"><span>Boca</span><div class="tb-row">${T.mouth.map((k, i) => `<button type="button" class="tb-opt${tb.mouth === i ? ' on' : ''}" data-act="toon" data-k="mouth" data-v="${i}" title="${T.labels.mouth[k]}" aria-label="${T.labels.mouth[k]}" aria-pressed="${tb.mouth === i}">${C.toonSVG(me, { mouth: i, acc: 'ninguno', tilt: 0, turn: 0, doodle: 0 })}</button>`).join('')}</div></div>
          <div class="fld"><span>Postura</span><div class="tb-chips">${[-1, 0, 1].map((k) => `<button type="button" class="fchip${tb.turn === k ? ' on' : ''}" data-act="toon" data-k="turn" data-v="${k}" aria-pressed="${tb.turn === k}">${T.labels.turn[k]}</button>`).join('')}${[[-6, 'Inclinar ↺'], [0, 'Derecho'], [6, 'Inclinar ↻']].map(([k, l]) => `<button type="button" class="fchip${tb.tilt === k ? ' on' : ''}" data-act="toon" data-k="tilt" data-v="${k}" aria-pressed="${tb.tilt === k}">${l}</button>`).join('')}</div></div>
          <div class="fld"><span>Garabato y detalles</span><div class="tb-chips">${T.doodle.map((k, i) => `<button type="button" class="fchip${tb.doodle === i ? ' on' : ''}" data-act="toon" data-k="doodle" data-v="${i}" aria-pressed="${tb.doodle === i}">${T.labels.doodle[k]}</button>`).join('')}<button type="button" class="fchip${tb.freckles ? ' on' : ''}" data-act="toon" data-k="freckles" data-v="${tb.freckles ? 0 : 1}" aria-pressed="${tb.freckles}">Pecas</button></div></div>
          <div><button type="button" class="btn btn-sm" data-act="toon-random">${icon('refresh')}Sorpréndeme</button></div>
        </div>
      </div>
    </fieldset>`;
  };
  const pick = (name, entries, selected, cls = '') => `<div class="pick ${cls}">${entries.map(([k, l]) => `<label><input type="checkbox" id="pf-${name}-${k}" data-bind="${name}" value="${k}" ${selected.includes(k) ? 'checked' : ''}><span>${esc(l)}</span></label>`).join('')}</div>`;
  V.perfil = {
    render() {
      const me = S.me;
      const tagEntries = Object.entries(D.TAGS).filter(([k]) => k !== 'testers');
      return `
      <div class="vh"><div><p class="eyebrow">Mi perfil</p><h1>Tu tarjeta profesional viva</h1><p>Lo que construyes, lo que sabes, lo que buscas y lo que puedes aportar. Se actualiza mientras escribes.</p></div>
        <div class="vh-actions"><span class="saved-ind" id="savedInd">${icon('check')}Guardado</span><button class="btn" data-act="bizcard" data-id="me">${icon('briefcase')}Mi tarjeta</button><button class="btn" data-act="person" data-id="me">${icon('eye')}Ver como me ven</button></div></div>
      <div class="profile">
        <div class="profile-left">
          <div class="mcard-zone"><div class="mcard door-${me.door}" id="mcard">${C.mcardInner(me)}</div></div>
          <div class="card complete" id="complete">${C.completeHTML(me)}</div>
          <div class="card"><div class="card-h"><h3>Insignias</h3></div><div class="chips">${C.unlockedBadges().map((b) => `<span class="chip chip-${D.badges[b].tone}">${icon(D.badges[b].icon)}${esc(D.badges[b].name)}</span>`).join('')}</div></div>
          ${C.isLive() ? `<div class="card session-card"><div><small>Sesión iniciada</small><b>${esc(S.auth.user.email || S.me.name)}</b></div><button class="btn btn-sm" data-act="sign-out">${icon('exit')}Cerrar sesión</button></div>` : `<button class="btn btn-ghost btn-sm" data-act="reset-demo" style="justify-self:start">${icon('refresh')}Restablecer la demo</button>`}
        </div>
        <form class="pform card" id="profileForm" autocomplete="off" style="padding:clamp(18px,2.4vw,28px)">
          ${C.toonBuilderHTML(me)}
          <fieldset><legend>Quién eres</legend>
            <div class="pf-grid">
              <label class="fld"><span>Nombre</span><input class="inp" id="pf-name" data-bind="name" value="${esc(me.name)}" maxlength="60"></label>
              <label class="fld"><span>Qué haces</span><input class="inp" id="pf-role" data-bind="role" value="${esc(me.role)}" maxlength="60"></label>
            </div>
            <div class="fld"><span>Tu puerta</span><div class="seg">${Object.entries(D.DOORS).map(([k, l]) => `<label><input type="radio" name="pf-door" id="pf-door-${k}" data-bind="door" value="${k}" ${me.door === k ? 'checked' : ''}>${esc(l)}</label>`).join('')}</div></div>
            <label class="fld"><span>Qué estás construyendo</span><input class="inp" id="pf-building" data-bind="building" value="${esc(me.building)}" maxlength="120"></label>
            <label class="fld"><span>Bio corta</span><textarea class="inp" id="pf-bio" data-bind="bio" maxlength="280" rows="3">${esc(me.bio)}</textarea></label>
          </fieldset>
          <fieldset><legend>Lo que sabes</legend>
            <div class="pf-grid">
              <label class="fld"><span>Sabe hacer</span><input class="inp" id="pf-skills" data-bind="skills" value="${esc((me.skills || []).join(', '))}"><small>Separa con comas</small></label>
              <label class="fld"><span>Quiere aprender</span><input class="inp" id="pf-learn" data-bind="learn" value="${esc((me.learn || []).join(', '))}"><small>Separa con comas</small></label>
            </div>
          </fieldset>
          <fieldset><legend>Necesitas y aportas</legend>
            <div class="fld"><span>Qué buscas</span>${pick('seeking', Object.entries(D.SEEK), me.seeking || [])}</div>
            <div class="fld"><span>Necesitas a alguien que sepa de…</span>${pick('needsTags', tagEntries, me.needsTags || [], 'need')}</div>
            <div class="fld"><span>Puedes aportar…</span>${pick('offerTags', tagEntries, me.offerTags || [], 'offer')}</div>
            <label class="fld"><span>Cómo puedes ayudar a otras personas</span><textarea class="inp" id="pf-offers" data-bind="offers" maxlength="200" rows="2">${esc(me.offers)}</textarea></label>
          </fieldset>
          <fieldset><legend>Disponibilidad</legend>
            ${pick('avail', Object.entries(D.AVAIL), me.avail || [])}
            <label class="toggle"><input type="checkbox" id="pf-open" data-bind="open" ${me.open ? 'checked' : ''}><i></i>Open to Collaborate: aparezco como disponible para proyectos</label>
          </fieldset>
          <fieldset><legend>Cómo trabajar conmigo</legend>
            <div class="pf-grid">
              <label class="fld"><span>Zona de la ciudad</span><input class="inp" id="pf-zone" data-bind="zone" value="${esc(me.zone || '')}" maxlength="40" placeholder="Ej. Centro"></label>
              <label class="fld"><span>Idiomas</span><input class="inp" id="pf-langs" data-bind="langs" value="${esc((me.langs || []).join(', '))}"><small>Separa con comas</small></label>
            </div>
            <div class="fld"><span>Primer contacto preferido</span><div class="seg">${['Café en persona', 'Llamada corta', 'Mensaje primero', 'En el Build Night'].map((l, i) => `<label><input type="radio" name="pf-prefers" id="pf-pref-${i}" data-bind="prefers" value="${l}" ${me.prefers === l ? 'checked' : ''}>${l}</label>`).join('')}</div></div>
            <label class="fld"><span>Tu estilo en una frase</span><textarea class="inp" id="pf-style" data-bind="style" maxlength="160" rows="2">${esc(me.style || '')}</textarea><small>Aparece al reverso de tu tarjeta de presentación.</small></label>
          </fieldset>
          <fieldset><legend>Enlaces</legend>
            <div class="pf-grid">
              <label class="fld"><span>LinkedIn</span><input class="inp" id="pf-linkedin" data-bind="links.linkedin" value="${esc(me.links.linkedin)}" placeholder="https://"></label>
              <label class="fld"><span>GitHub</span><input class="inp" id="pf-github" data-bind="links.github" value="${esc(me.links.github)}" placeholder="https://"></label>
            </div>
            <label class="fld"><span>Portafolio o sitio</span><input class="inp" id="pf-web" data-bind="links.web" value="${esc(me.links.web)}" placeholder="https://"></label>
          </fieldset>
          <fieldset><legend>Privacidad</legend>
            <label class="toggle"><input type="checkbox" id="pf-index" data-bind="privacy.indexable" ${me.privacy.indexable ? 'checked' : ''}><i></i>Mi perfil público puede aparecer en buscadores</label>
            <label class="toggle"><input type="checkbox" id="pf-attendee" data-bind="privacy.attendee" ${me.privacy.attendee ? 'checked' : ''}><i></i>Aparezco en las listas de asistentes de eventos</label>
          </fieldset>
        </form>
      </div>`;
    }
  };

  /* ======================= BLUEPRINT ======================= */
  const TOC = [['bp-idea', 'La idea'], ['bp-arq', 'Arquitectura'], ['bp-stack', 'Tecnología'], ['bp-datos', 'Base de datos'], ['bp-fases', 'Fases'], ['bp-lanz', 'Lanzamiento'], ['bp-metricas', 'Métricas'], ['bp-dinero', 'Sostenibilidad']];
  const ENT = [
    ['Identidad', [['profiles', 'bio, habilidades, preferencias de visibilidad'], ['follows', 'personas y proyectos seguidos', 'follower_id → profiles']]],
    ['Proyectos', [['projects', 'creadores, estado, necesidades', 'owner_id → profiles'], ['project_members', 'integrantes y rol', 'project_id → projects'], ['collaboration_requests', 'solicitudes y su seguimiento', 'project_id, from_id']]],
    ['Conversación', [['posts', 'tipo, texto, etiquetas', 'author_id → profiles'], ['comments', 'conversaciones', 'post_id → posts'], ['reactions · bookmarks', 'reacciones y guardados', 'post_id, profile_id']]],
    ['IRL', [['events', 'fecha, lugar, cupo', 'host_id → profiles'], ['event_attendees', 'registro y visibilidad', 'event_id, profile_id']]],
    ['Mensajes · opcional', [['conversations', 'si entra en la primera etapa'], ['messages', 'mensajería privada', 'conversation_id']]],
    ['Sistema', [['notifications', 'avisos dentro de la plataforma', 'profile_id'], ['reports · moderation_actions', 'denuncias y decisiones']]]
  ];
  V.blueprint = {
    render() {
      return `
      <div class="vh"><div><p class="eyebrow">Blueprint · para el equipo</p><h1>Cómo se construye clubcrai.com</h1><p>Arquitectura, datos, fases, métricas y modelo económico. Documento de trabajo, no página pública.</p></div></div>
      <div class="doc">
        <nav class="toc" aria-label="Contenido">${TOC.map(([id, l]) => `<a href="#${id}" data-act="toc" data-t="${id}">${l}</a>`).join('')}</nav>
        <div class="doc-body">
          <section class="doc-sec" id="bp-idea"><h2>La idea</h2>
            <p class="quote-box">Una combinación de red profesional local, comunidad creativa y plataforma de colaboración.</p>
            <p>El elemento central no es el feed. Es que cada persona pueda responder tres preguntas al entrar: quién está construyendo algo que le interesa, quién puede ayudarle con lo que crea y qué puede hacer esta semana para avanzar y ayudar a alguien más.</p>
            <p>La marca se siente como un cruce entre un club creativo privado, una startup moderna y una escena tecnológica local. No como una cámara empresarial ni como una red social genérica.</p></section>

          <section class="doc-sec" id="bp-arq"><h2>Arquitectura recomendada</h2>
            <p>Una web app responsive que se siente como producto digital: carga rápido, funciona muy bien en celular, tiene cuentas de usuario y puede crecer sin rehacerse.</p>
            <div class="layers">
              <div class="layer-row" style="--c:var(--sol)"><div><b>Frontend</b><small>Next.js · TypeScript · Tailwind</small></div><p>La experiencia del usuario: web rápida, responsive, perfiles y navegación.</p></div>
              <div class="layer-row" style="--c:var(--blue)"><div><b>Autenticación y lógica</b><small>Sesiones · permisos · API</small></div><p>Validaciones en servidor y políticas de acceso en la base: cada persona solo modifica lo que le corresponde.</p></div>
              <div class="layer-row" style="--c:var(--under)"><div><b>Backend y datos</b><small>Supabase · PostgreSQL</small></div><p>Auth, Storage y Realtime para miembros, proyectos, publicaciones, eventos y notificaciones.</p></div>
              <div class="layer-row" style="--c:var(--mint)"><div><b>Servicios</b><small>Resend · PostHog · respaldos</small></div><p>Correo transaccional, analítica, copias de seguridad y monitoreo.</p></div>
            </div>
            <p class="fine">Es una propuesta de arquitectura, no una revisión del hosting actual. Si el hosting no ejecuta Node.js de forma persistente, el frontend se despliega en una plataforma compatible.</p></section>

          <section class="doc-sec" id="bp-stack"><h2>Tecnología</h2>
            <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Componente</th><th>Recomendación</th></tr></thead><tbody>
              <tr><td>Interfaz</td><td>Next.js, TypeScript y Tailwind CSS</td></tr>
              <tr><td>Base de datos</td><td>PostgreSQL mediante Supabase</td></tr>
              <tr><td>Registro e inicio de sesión</td><td>Supabase Auth con verificación de correo</td></tr>
              <tr><td>Fotos y archivos</td><td>Supabase Storage con tamaños optimizados</td></tr>
              <tr><td>Actualizaciones en vivo</td><td>Supabase Realtime, cuando haga falta</td></tr>
              <tr><td>Correos</td><td>Resend para notificaciones importantes</td></tr>
              <tr><td>Analítica</td><td>PostHog o una alternativa de analítica web</td></tr>
              <tr><td>Control de versiones</td><td>GitHub</td></tr>
              <tr><td>Hosting</td><td>El proveedor actual si es compatible; si no, una plataforma de despliegue de frontend</td></tr>
            </tbody></table></div>
            <p>Antes de contratar: revisar límites del hosting, costos por uso, región de alojamiento, política de respaldos y opciones de exportación de datos. Desde el inicio: políticas de acceso en la base, protección contra spam, verificación de correo y herramientas para bloquear y denunciar.</p></section>

          <section class="doc-sec" id="bp-datos"><h2>Base de datos</h2>
            <p>Entidades separadas y relacionadas, no una sola tabla. No hace falta implementarlas todas el primer día, pero el modelo no debe obligar a reconstruir la app al crecer.</p>
            <div class="entities">${ENT.map(([g, rows]) => `<div class="entity"><h4>${esc(g)}</h4>${rows.map(([n, d, fk]) => `<div><code>${esc(n)}</code><span>${esc(d)}</span>${fk ? `<span class="fk mono">${esc(fk)}</span>` : ''}</div>`).join('')}</div>`).join('')}</div>
            <p>Índices para las búsquedas frecuentes, paginación, límites contra solicitudes automatizadas y una estrategia de copias de seguridad. Las páginas públicas de perfiles y proyectos se indexan solo cuando su dueño lo permite.</p></section>

          <section class="doc-sec" id="bp-fases"><h2>Fases</h2>
            <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Fase</th><th>Objetivo</th><th>Incluye</th></tr></thead><tbody>
              <tr><td>01 · MVP</td><td>Lanzar con un grupo pequeño de miembros reales</td><td>Perfiles, directorio, publicaciones, proyectos con solicitud de colaboración, eventos, moderación</td></tr>
              <tr><td>02 · Retención</td><td>Dar razones para regresar</td><td>Resumen personalizado, notificaciones, seguimiento, dinámicas semanales, recomendaciones</td></tr>
              <tr><td>03 · Matching</td><td>Conectar talento y oportunidades</td><td>Collab Match, solicitudes con seguimiento, espacios de equipo, oportunidades verificadas, reputación</td></tr>
              <tr><td>04 · Escala</td><td>Convertirlo en un ecosistema</td><td>Patrocinios, membresías opcionales, programas, herramientas para universidades, expansión en Baja California</td></tr>
            </tbody></table></div></section>

          <section class="doc-sec" id="bp-lanz"><h2>Cómo conseguir que la gente lo use</h2>
            <p>No se lanza la web vacía esperando que la gente publique. Primero se siembra actividad real con un núcleo que tenga razones para participar.</p>
            <ol class="steps">
              <li>Invitar personalmente a 20–30 miembros fundadores con proyectos, habilidades u oportunidades concretas.</li>
              <li>Completar los primeros perfiles y publicar proyectos reales con permiso de sus creadores.</li>
              <li>Lograr que cada miembro encuentre al menos a una persona relevante para su objetivo.</li>
              <li>Organizar el primer encuentro de trabajo y dar seguimiento a las conexiones.</li>
              <li>Publicar los resultados: equipos formados, prototipos, colaboraciones y proyectos que avanzaron.</li>
              <li>Invitar a nuevos miembros por recomendación personal, no con invitaciones masivas sin contexto.</li>
            </ol>
            <p class="quote-box">«Estamos reuniendo a 30 personas que están construyendo proyectos interesantes en Mexicali. Presenta el tuyo y encuentra con quién hacerlo crecer».</p></section>

          <section class="doc-sec" id="bp-metricas"><h2>Cómo medir si funciona</h2>
            <p>No solo por número de registros. Objetivos iniciales de prueba para el primer trimestre:</p>
            <div class="metric-grid">
              <div class="metric"><b>60%+</b><strong>Activación</strong><small>Miembros que completan su perfil y realizan una acción útil</small></div>
              <div class="metric"><b>30%+</b><strong>Retención semanal</strong><small>Miembros activos que regresan la semana siguiente</small></div>
              <div class="metric"><b>50%+</b><strong>Colaboración</strong><small>Solicitudes de contacto que reciben respuesta</small></div>
              <div class="metric"><b>Mensual</b><strong>Valor real</strong><small>Colaboraciones concretadas y proyectos que avanzan</small></div>
            </div>
            <p class="fine">Los porcentajes son hipótesis para evaluar y ajustar con datos de uso; no son benchmarks ni promedios de la industria. También hay que preguntar a quienes dejan de entrar qué les faltó encontrar.</p></section>

          <section class="doc-sec" id="bp-dinero"><h2>Cómo se sostiene</h2>
            <p>El núcleo de la comunidad se mantiene gratis. Los ingresos llegan después y sin destruir la confianza.</p>
            <ul class="why-list" style="font-size:15px">
              <li>${icon('check')}<span><b>Patrocinios:</b> empresas locales apoyan eventos, retos o programas de innovación.</span></li>
              <li>${icon('check')}<span><b>Eventos especiales:</b> cenas de founders, talleres o encuentros con cupo limitado.</span></li>
              <li>${icon('check')}<span><b>Membresía Pro opcional:</b> herramientas para equipos, gestión de proyectos o visibilidad profesional.</span></li>
              <li>${icon('check')}<span><b>Programas empresariales:</b> empresas publican retos reales y encuentran equipos o talento.</span></li>
              <li>${icon('check')}<span><b>Bolsa de oportunidades:</b> publicaciones patrocinadas, siempre identificadas.</span></li>
            </ul>
            <div class="card"><div class="card-h"><h3>Lo que evitaríamos</h3></div><ul class="dont">
              <li>${icon('x')}Cobrar por aparecer en las búsquedas normales.</li>
              <li>${icon('x')}Convertir la comunidad en un catálogo de publicidad.</li>
              <li>${icon('x')}Vender una supuesta garantía de conseguir socios o inversión.</li>
            </ul></div></section>
        </div>
      </div>`;
    }
  };
})();
