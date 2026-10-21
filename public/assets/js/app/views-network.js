/* CRAI Club · vistas de la app (1/2): Inicio, People, Projects, Community, Collab Match */
(function () {
  'use strict';
  const C = window.CRAI;
  const D = C.D;
  const S = C.S;
  const esc = C.esc;
  const icon = C.icon;
  const V = (C.views = {});

  /* ---------- Piezas compartidas ---------- */
  C.doorOk = (door) => S.door === 'all' || door === 'both' || door === S.door;
  C.doorSwitch = () => `<div class="seg" role="group" aria-label="Puerta">${[['all', 'Todo'], ['founders', 'Founders'], ['underground', 'Underground']].map(([k, l]) =>
    `<button type="button" class="${S.door === k ? 'on' : ''}" data-act="door" data-door="${k}" aria-pressed="${S.door === k}">${k === 'all' ? '' : `<i class="door-chip dc-${k}"><i></i></i>`}${l}</button>`).join('')}</div>`;
  const STATUS_ICON = { team: 'userplus', help: 'buoy', testers: 'users', feedback: 'chat', launched: 'rocket' };
  const stageLabel = (id) => (D.STAGES.find((s) => s.id === id) || {}).label || id;
  C.stageLabel = stageLabel;
  C.coverHTML = (pr, extra = '') => `<div class="cover pat-${pr.pattern} ${extra}" style="--h:${pr.hue}"><span class="stage stage-${pr.stage}">${stageLabel(pr.stage)}</span><span class="cover-glyph">${esc(pr.glyph)}</span></div>`;
  C.testersOf = (pr) => (pr.testers ? { need: pr.testers.need, have: Math.min(pr.testers.need, pr.testers.have + (S.testers.includes(pr.id) ? 1 : 0)) } : null);
  C.followersOf = (pr) => pr.followers + (S.follows.has(pr.id) ? 1 : 0);
  C.teamOf = (pr) => (pr.id === 'brisa' && S.accepted ? [...pr.team, ['ricardo', 'Ventas']] : pr.team);

  C.isExample = (p) => C.isLive() && p && !p.live && p.id !== 'me';
  C.visibleProjects = () => (C.isLive() ? D.projects.filter((p) => p.owner !== 'me') : D.projects);
  C.exampleChip = () => (C.isLive() ? '<span class="chip chip-sol">Ejemplos</span>' : '');
  C.liveNote = (what) => {
    if (!C.isLive()) return '';
    const posts = what === 'posts';
    const n = posts ? S.livePosts.length : S.liveMembers.length;
    if (!S.showDemo && n >= (posts ? 4 : 3)) return '';
    const count = posts ? `${n} ${n === 1 ? 'publicación' : 'publicaciones'}` : `${n + 1} ${n === 0 ? 'miembro' : 'miembros'} con perfil`;
    return `<div class="live-note">${icon('spark')}<div><b>${S.showDemo ? 'Estás viendo ejemplos' : 'El club apenas empieza'}</b><p>${S.showDemo ? 'Lo marcado como «Ejemplo» no es real: sirve para ver cómo funciona el club.' : `Hay ${count}. Mientras llegan más, puedes ver ejemplos para conocer cómo funciona.`}</p></div><div class="live-note-actions"><button class="btn btn-sm" data-act="invite">${icon('link')}Invitar</button><button class="btn btn-sm${S.showDemo ? '' : ' btn-primary'}" data-act="toggle-demo">${S.showDemo ? 'Ocultar ejemplos' : 'Ver ejemplos'}</button></div></div>`;
  };
  C.commentHTML = (c) => { const a = C.person(c.author); return `<div class="comment">${C.avatar(a, 'sm', { hc: true })}<p><b>${esc(a.name)}</b>${esc(c.text)}</p></div>`; };
  C.postHTML = (p) => {
    const a = C.person(p.author);
    const comments = C.postComments(p);
    const cc = C.commentCount(p);
    const pr = p.project && C.project(p.project);
    const saved = S.saved.has(p.id);
    const helpable = p.author !== 'me' && ['help', 'team', 'ask'].includes(p.type);
    const rel = C.canHelp(p) ? `<span class="rel">${icon('spark')}Puedes ayudar aquí</span>` : C.relevance(p) ? `<span class="rel">${icon('spark')}Relevante para ti</span>` : '';
    return `<article class="card post" id="post-${p.id}">
      <header class="post-h"><button data-act="person" data-id="${a.id}" data-hc="${a.id}" aria-label="Ver perfil de ${esc(a.name)}">${C.avatar(a, 'md', { presence: true })}</button><div><button class="post-author" data-act="person" data-id="${a.id}" data-hc="${a.id}">${esc(a.id === 'me' ? a.name + ' · tú' : a.name)}</button><small>${esc(a.role)} · ${C.ago(C.postHours(p))}</small></div>${C.ptype(p.type)}</header>
      <p class="post-text">${esc(p.text)}</p>
      <div class="post-meta">${pr ? `<button class="chip chip-skill" data-act="project" data-id="${pr.id}">${icon('box')}${esc(pr.name)}</button>` : ''}${(p.tags || []).map((t) => `<span class="chip">#${esc(C.tagLabel(t).toLowerCase())}</span>`).join('')}${p.verified ? `<span class="chip chip-mint">${icon('shield')}Verificada</span>` : ''}${p.example ? '<span class="chip chip-sol">Ejemplo</span>' : ''}${rel}</div>
      <footer class="post-actions">
        <button class="pa" data-act="comments" data-id="${p.id}" aria-expanded="false">${icon('chat')}${cc ? `${cc} ${cc === 1 ? 'comentario' : 'comentarios'}` : 'Comentar'}</button>
        <button class="pa${saved ? ' on' : ''}" data-act="save-post" data-id="${p.id}" aria-pressed="${saved}">${icon('bookmark')}${saved ? 'Guardada' : 'Guardar'}</button>
        ${p.author !== 'me' ? `<button class="pa" data-act="contact" data-id="${a.id}">${icon('send')}Contactar</button>` : ''}
        ${helpable ? `<button class="pa strong" data-act="help-post" data-id="${p.id}">${icon('heart')}Puedo ayudar</button>` : ''}
        ${p.live && (p.author === 'me' || (C.isAdmin && C.isAdmin())) ? `<button class="pa" data-act="delete-post" data-id="${p.id}">${icon('x')}${p.author === 'me' ? 'Eliminar' : 'Eliminar (admin)'}</button>` : ''}
      </footer>
      <div class="comments" id="cm-${p.id}" hidden>${comments.map(C.commentHTML).join('')}
        <form class="comment-form" data-form="comment" data-id="${p.id}"><input class="inp" name="text" id="ci-${p.id}" placeholder="Escribe un comentario útil…" maxlength="300" autocomplete="off" aria-label="Comentario"><button class="btn btn-primary btn-sm" type="submit">Enviar</button></form>
      </div>
    </article>`;
  };
  C.projectCard = (pr) => {
    const t = C.testersOf(pr);
    const on = S.follows.has(pr.id);
    const team = C.teamOf(pr);
    return `<article class="card prj spot" data-act="project" data-id="${pr.id}" tabindex="0">
      <div class="cover pat-${pr.pattern}" style="--h:${pr.hue}"><span class="stage stage-${pr.stage}">${stageLabel(pr.stage)}</span>
        <button class="prj-follow${on ? ' on' : ''}" data-act="follow-project" data-id="${pr.id}" aria-pressed="${on}" aria-label="${on ? 'Dejar de seguir' : 'Seguir'} ${esc(pr.name)}">${icon('bookmark')}</button>
        <span class="cover-glyph">${esc(pr.glyph)}</span></div>
      <div class="prj-body"><h3>${esc(pr.name)}</h3><p>${esc(pr.tagline)}</p>
        <p class="status">${icon(STATUS_ICON[pr.status.type] || 'spark')}<span>«${esc(pr.status.text)}»</span></p>
        ${t ? `<div><div class="bar sol" style="--v:${(t.have / t.need) * 100}%"><i></i></div><p class="fine" style="margin-top:6px">${t.have} de ${t.need} testers</p></div>` : ''}
        <div class="prj-foot"><span class="av-stack">${team.map(([id]) => C.avatar(C.person(id), 'xs', { hc: true })).join('')}</span><span>${C.followersOf(pr)} seguidores</span></div>
      </div>
    </article>`;
  };
  C.personCard = (p, fit) => {
    const sent = S.contacted.includes(p.id);
    return `<article class="card pcard spot" data-act="person" data-id="${p.id}" tabindex="0">
      <div class="pcard-banner bn-${p.door}" style="--h:${p.hue}">${C.isExample(p) ? '<span class="active-pill">Ejemplo</span>' : p.active ? '<span class="active-pill"><i></i>Activo hoy</span>' : ''}${fit >= 60 ? `<span class="fit">${fit}% para ti</span>` : ''}</div>
      <div class="pcard-top">${C.avatar(p, 'lg', { presence: true })}<div><b>${esc(p.name)}</b><small>${esc(p.role)}</small></div></div>
      <p class="pcard-build"><span class="lbl" style="display:inline;margin-right:6px">Construye</span>${esc(p.building)}</p>
      <div class="pcard-split"><div><span class="lbl">Necesita</span><div class="chips">${C.tagChips(p.needsTags, 'need', 3)}</div></div><div><span class="lbl">Aporta</span><div class="chips">${C.tagChips(p.offerTags, 'offer', 3)}</div></div></div>
      <div class="pcard-foot">${C.doorChip(p.door)}<span class="open-dot${p.open ? '' : ' off'}">${p.open ? esc(p.reply || 'Open to collaborate') : 'Sin disponibilidad'}</span></div>
      <div class="pcard-hover">${sent ? `<span class="btn btn-sm is-on">${icon('check')}Mensaje enviado</span>` : `<button class="btn btn-sm btn-door" data-act="contact" data-id="${p.id}">${icon('send')}Presentarme</button>`}<button class="btn btn-sm" data-act="bizcard" data-id="${p.id}">${icon('briefcase')}Tarjeta</button></div>
    </article>`;
  };

  /* ======================= INICIO · Mi semana ======================= */
  const TODAY_ACTIONS = {
    lun: [['compose', 'building', 'Compartir mi meta'], ['go', 'community', 'Ver qué construyen']],
    mar: [['feed', 'help', 'Responder una pregunta'], ['compose', 'help', 'Pedir ayuda']],
    mie: [['go', 'explore', 'Leer el Founder Spotlight'], ['compose', 'building', 'Contar mi avance']],
    jue: [['go', 'explore', 'Ver oportunidades'], ['compose', 'opportunity', 'Compartir una']],
    vie: [['compose', 'launched', 'Mostrar mi demo'], ['go', 'events', 'Ver Demo Day']],
    fin: [['go', 'events', 'Ver Build Together'], ['go', 'quests', 'Elegir una misión']]
  };
  const actBtn = ([kind, arg, label], cls) => kind === 'go' ? `<button class="btn ${cls}" data-go="${arg}">${label}</button>`
    : kind === 'feed' ? `<button class="btn ${cls}" data-act="feed-type" data-type="${arg}">${label}</button>`
      : `<button class="btn ${cls}" data-act="compose" data-type="${arg}">${label}</button>`;

  V.inicio = {
    render() {
      const me = S.me;
      const loop = C.todayLoop();
      const dow = C.todayDow();
      const idx = dow === 0 ? 7 : dow;
      const mine = C.allPosts().filter((p) => p.author === 'me');
      const replies = mine.reduce((n, p) => n + C.postComments(p).filter((c) => c.author !== 'me').length, 0);
      const week = C.sortedEvents().filter((x) => !x.e.past && C.dayDiff(x.d) <= 7);
      const meet = C.peopleToMeet(3);
      const helps = C.allPosts().filter(C.canHelp).slice(0, 3);
      const ups = [...S.follows].map(C.project).filter(Boolean).flatMap((pr) => pr.updates.map((u) => ({ pr, u }))).sort((a, b) => a.u.d - b.u.d).slice(0, 4);
      const next = C.sortedEvents().find((x) => !x.e.past && (S.going.has(x.e.id) || x.e.featured));
      const quest = D.quests.find((q) => !C.questDone(q));
      const labels = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
      return `
      <section class="hello">
        <p class="eyebrow">${C.todayLabel()} · ${C.mxl().time} en Mexicali</p>
        <h1>${C.greeting()}, <span>${esc(C.firstName(me))}</span>.</h1>
        <p>Esto es lo que se mueve esta semana alrededor de ${esc(C.projectName(me))}.</p>
        <div class="week-stats">
          <button class="wstat" data-go="community"><b>${replies}</b>respuestas a tus publicaciones</button>
          ${C.isLive() ? `<button class="wstat" data-act="notifs"><b>${C.unread ? C.unread() : 0}</b>mensajes nuevos</button>` : `<button class="wstat" data-act="request"><b>${S.accepted ? 0 : 1}</b>solicitud de colaboración</button>`}
          ${C.isLive() ? `<button class="wstat" data-go="people"><b>${S.liveMembers.length + 1}</b>${S.liveMembers.length ? 'miembros en el club' : 'miembro en el club'}</button>
          <button class="wstat" data-go="community"><b>${S.livePosts.filter((p) => Date.now() - p.ts < 7 * 864e5).length}</b>publicaciones esta semana</button>`
            : `<button class="wstat" data-go="events"><b>${week.length}</b>eventos esta semana</button>
          <button class="wstat" data-go="projects"><b>${S.follows.size}</b>proyectos que sigues</button>`}
        </div>
      </section>
      <div class="split">
        <div class="stack">
          <section class="today">
            <div><p class="eyebrow">Hoy en el Weekly Loop · ${loop.day}</p><h2>${esc(loop.name)}</h2><p>${esc(loop.desc)}</p></div>
            <div class="today-actions">${actBtn(TODAY_ACTIONS[loop.key][0], 'btn-light')}${actBtn(TODAY_ACTIONS[loop.key][1], 'btn-outline')}</div>
            <div class="week-strip" aria-hidden="true">${labels.map((l, i) => `<span class="${i + 1 === idx ? 'on' : i + 1 < idx ? 'past' : ''}">${l}</span>`).join('')}</div>
          </section>
          <section>
            <div class="block-h"><h2>3 personas para conocer</h2><button class="link-btn" data-go="match">Abrir Collab Match ${icon('arrow')}</button><p>Elegidas por lo que necesitas y lo que puedes aportar. Se renuevan cada lunes.</p></div>
            ${C.liveNote('members')}
            <div class="meet-grid">${meet.map((r) => `<article class="card meet spot" data-act="person" data-id="${r.p.id}" tabindex="0">
              <div class="meet-top">${C.avatar(r.p, 'lg')}<div><b>${esc(r.p.name)}</b><small>${esc(r.p.role)}</small></div><span class="pct" style="margin-left:auto">${r.s}%</span></div>
              <p class="why">${icon('spark')}<span>${esc(r.why[0] || 'Perfil complementario al tuyo.')}</span></p>
              <div class="chips">${C.tagChips(r.p.offerTags, 'offer', 3)}</div>
              <div class="meet-foot"><button class="btn btn-sm btn-door" data-act="contact" data-id="${r.p.id}">Presentarme</button><button class="btn btn-sm" data-act="person" data-id="${r.p.id}">Ver perfil</button></div>
            </article>`).join('')}</div>
          </section>
          <section>
            <div class="block-h"><h2>Help Wanted para ti</h2><button class="link-btn" data-act="feed-type" data-type="help">Ver todas ${icon('arrow')}</button><p>Solicitudes que puedes responder con una habilidad, un contacto o una propuesta concreta.</p></div>
            <div class="help-list">${helps.length ? helps.map((p) => { const a = C.person(p.author); return `<div class="card help-item">${C.avatar(a, 'sm')}<div><small>${esc(a.name)} · ${C.ago(C.postHours(p))}</small><p>${esc(p.text)}</p></div><button class="btn btn-sm" data-act="help-post" data-id="${p.id}">Puedo ayudar</button></div>`; }).join('')
              : `<div class="empty">${icon('heart')}<p>Nada que coincida con lo que aportas. Agrega habilidades en tu perfil.</p></div>`}</div>
          </section>
          <section>
            <div class="block-h"><h2>Project Updates</h2>${C.exampleChip()}<button class="link-btn" data-go="projects">Explorar proyectos ${icon('arrow')}</button><p>Avances de los proyectos que decidiste seguir.</p></div>
            <div class="card update-list">${ups.length ? ups.map(({ pr, u }) => `<div class="update"><span class="cover update-cover pat-${pr.pattern}" style="--h:${pr.hue}"></span><div><b>${esc(pr.name)}</b> <small>· hace ${u.d} ${u.d === 1 ? 'día' : 'días'}</small><p>${esc(u.text)}</p></div></div>`).join('')
              : `<div class="empty">${icon('bookmark')}<p>Sigue proyectos para ver sus avances aquí.</p></div>`}</div>
          </section>
        </div>
        <aside class="aside">
          <div class="card">
            <div class="card-h"><h3>Mi semana</h3><span class="chip chip-blue">${loop.day}</span></div>
            ${S.goal ? `<p style="font-size:15px">${esc(S.goal)}</p><div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn btn-sm btn-door" data-act="share-goal">Compartir en el feed</button><button class="btn btn-sm btn-ghost" data-act="edit-goal">Editar</button></div>`
              : `<form class="goal-form" data-form="goal"><label class="fld"><span>¿Qué quieres conseguir esta semana?</span><input class="inp" id="goalInput" name="goal" maxlength="140" placeholder="Ej. Probar Brisa en una escuela"></label><button class="btn btn-sm btn-primary" type="submit">Guardar meta</button></form>`}
          </div>
          ${next ? `<div class="card"><div class="card-h"><h3>Próximo encuentro</h3>${S.going.has(next.e.id) ? '<span class="chip chip-mint">Registrado</span>' : ''}</div>
            <div class="ev-mini" data-act="event" data-id="${next.e.id}">${C.dateBlock(next.d)}<div><b>${esc(next.e.title)}</b><p class="fine">${esc(next.e.time)} · ${esc(next.e.venue)}</p></div></div></div>` : ''}
          ${quest ? `<div class="card"><div class="card-h"><h3>Quest en curso</h3><button class="link-btn" data-go="quests">Todas</button></div>
            <div style="display:flex;gap:14px;align-items:center">${C.ring((C.qp(quest.id) / quest.goal) * 100, `${C.qp(quest.id)}/${quest.goal}`, 'under', 60)}<p style="font-size:14px">${esc(quest.title)}</p></div></div>` : ''}
          <div class="card"><div class="card-h"><h3>Community Recap</h3><span class="fine">${C.isLive() ? 'Esta semana' : 'Ejemplo'}</span></div>
            <div class="recap-grid">${C.recapItems().map(([n, l]) => `<div><b data-count="${n}">${n}</b><small>${l}</small></div>`).join('')}</div></div>
        </aside>
      </div>`;
    }
  };

  C.recapItems = () => {
    if (!C.isLive()) return [[3, 'proyectos nuevos'], [14, 'conexiones hechas'], [4, 'encuentros'], [5, 'oportunidades']];
    const week = S.livePosts.filter((p) => Date.now() - p.ts < 7 * 864e5);
    return [[S.liveMembers.length + 1, 'miembros'], [week.length, 'publicaciones en 7 días'],
      [week.reduce((n, p) => n + (p.commentCount || 0), 0), 'comentarios en 7 días'], [[S.me, ...S.liveMembers].filter((m) => m.open).length, 'abiertos a colaborar']];
  };

  /* ======================= PEOPLE ======================= */
  const OFFER_FILTER = ['firmware', 'ventas', 'diseno', 'software', 'fabricacion', 'marketing', 'data', 'legal', 'mentoria', 'fundraising'];
  C.peopleList = () => {
    const f = S.pf;
    const fits = C.fitMap();
    if (C.isLive() && !C.members().length) return `<div class="empty" style="grid-column:1/-1">${icon('users')}<p>Todavía no hay otros miembros con perfil. Invita a las personas con las que quieres construir.</p><button class="btn btn-sm btn-primary" data-act="invite">${icon('link')}Copiar invitación</button></div>`;
    let list = C.members().filter((p) => C.doorOk(p.door));
    if (f.seek !== 'all') list = list.filter((p) => p.seeking.includes(f.seek));
    if (f.offer !== 'all') list = list.filter((p) => p.offerTags.includes(f.offer) || p.tags.includes(f.offer));
    if (f.open) list = list.filter((p) => p.open);
    if (f.q) {
      const q = C.norm(f.q);
      list = list.filter((p) => C.norm([p.name, p.role, p.building, p.skills.join(' '), p.learn.join(' '), p.offers, p.tags.map(C.tagLabel).join(' ')].join(' ')).includes(q));
    }
    list.sort((a, b) => fits[b.id] - fits[a.id]);
    return list.length ? list.map((p) => C.personCard(p, fits[p.id])).join('')
      : `<div class="empty" style="grid-column:1/-1">${icon('search')}<p>Nadie coincide con esos filtros.</p><button class="btn btn-sm" data-act="people-reset">Quitar filtros</button></div>`;
  };
  V.people = {
    render() {
      const f = S.pf;
      return `
      <div class="vh"><div><p class="eyebrow">People · directorio de talento</p><h1>¿Qué necesitas y qué puedes aportar?</h1><p>Cada perfil es una tarjeta profesional viva. Ordenados por lo complementarios que son contigo.</p></div>
        <div class="vh-actions"><button class="btn btn-door" data-act="need">${icon('spark')}Necesito a alguien que…</button></div></div>
      <div class="toolbar">
        <label class="search-inp grow"><span class="sr-only">Buscar personas</span>${icon('search')}<input class="inp" id="peopleQ" data-input="people-q" value="${esc(f.q)}" placeholder="Busca por nombre, habilidad o proyecto" autocomplete="off"></label>
        ${C.doorSwitch()}
      </div>
      <div class="filter-row"><span class="fchip-label">Busca</span>${[['all', 'Todo'], ...Object.entries(D.SEEK)].map(([k, l]) => `<button class="fchip${f.seek === k ? ' on' : ''}" data-act="pf" data-k="seek" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="filter-row"><span class="fchip-label">Puede aportar</span>${[['all', 'Cualquier cosa'], ...OFFER_FILTER.map((t) => [t, C.tagLabel(t)])].map(([k, l]) => `<button class="fchip${f.offer === k ? ' on' : ''}" data-act="pf" data-k="offer" data-v="${k}">${l}</button>`).join('')}
        <label class="toggle" style="margin-left:8px"><input type="checkbox" id="openToggle" data-act="pf-open" ${f.open ? 'checked' : ''}><i></i>Open to Collaborate</label></div>
      ${C.liveNote('members')}
      <div class="people-grid" id="peopleGrid">${C.peopleList()}</div>`;
    }
  };

  /* ======================= PROJECTS ======================= */
  V.projects = {
    render() {
      const f = S.jf;
      let list = C.visibleProjects().filter((p) => C.doorOk(p.door));
      if (f.stage !== 'all') list = list.filter((p) => p.stage === f.stage);
      if (f.help) list = list.filter((p) => ['team', 'help', 'testers', 'feedback'].includes(p.status.type));
      return `
      <div class="vh"><div><p class="eyebrow">Projects · escaparate ${C.exampleChip()}</p><h1>Lo que se está creando en Mexicali</h1><p>Ofrece ayuda, solicita colaborar, prueba el producto o sigue el proyecto para recibir sus avances.</p></div>
        <div class="vh-actions"><button class="btn btn-primary" data-act="compose" data-type="team">${icon('plus')}Publicar proyecto</button></div></div>
      <div class="toolbar">
        <div class="filter-row" style="margin:0"><span class="fchip-label">Etapa</span>${[['all', 'Todas'], ...D.STAGES.map((s) => [s.id, s.label])].map(([k, l]) => `<button class="fchip${f.stage === k ? ' on' : ''}" data-act="jf-stage" data-v="${k}">${l}</button>`).join('')}</div>
        <label class="toggle"><input type="checkbox" id="helpToggle" data-act="jf-help" ${f.help ? 'checked' : ''}><i></i>Buscan ayuda</label>
        <span style="margin-left:auto">${C.doorSwitch()}</span>
      </div>
      <div class="proj-grid">${list.length ? list.map(C.projectCard).join('') : `<div class="empty" style="grid-column:1/-1">${icon('box')}<p>No hay proyectos con esos filtros.</p></div>`}</div>`;
    }
  };

  /* ======================= COMMUNITY · The Feed ======================= */
  const TOPICS = ['electronica', 'firmware', 'software', 'diseno', 'fabricacion', 'ventas', 'marketing', 'data', 'fundraising', 'agro'];
  C.feedList = () => {
    let posts = C.allPosts().filter((p) => C.doorOk(C.person(p.author).door));
    if (S.ff.type === 'saved') posts = posts.filter((p) => S.saved.has(p.id));
    else if (S.ff.type !== 'all') posts = posts.filter((p) => p.type === S.ff.type);
    posts = C.rankPosts(posts, S.ff.sort);
    return posts.length ? posts.map(C.postHTML).join('') : `<div class="empty">${icon('chat')}<p>${S.ff.type === 'saved' ? 'Todavía no guardas publicaciones.' : (C.isLive() && S.ff.type === 'all' ? 'Todavía no hay publicaciones. Cuenta qué estás construyendo y abre la conversación.' : 'No hay publicaciones de este tipo.')}</p><button class="btn btn-sm btn-primary" data-act="compose" data-type="${S.ff.type in D.TYPES ? S.ff.type : 'building'}">Publicar la primera</button></div>`;
  };
  V.community = {
    render() {
      const loop = C.todayLoop();
      return `
      <div class="vh"><div><p class="eyebrow">Community · the feed</p><h1>El pulso de la comunidad</h1><p>Publicaciones breves y útiles. Se ordenan por relevancia para ti y por qué tan recientes son, no por cuántas reacciones tienen.</p></div>
        <div class="vh-actions">${C.doorSwitch()}</div></div>
      <div class="split">
        <div style="min-width:0">
          <div class="card composer">${C.avatar(S.me)}<button class="composer-box" data-act="compose" data-type="${loop.type}">${esc(D.TYPES[loop.type].ph)}</button>
            <div class="composer-types">${Object.keys(D.TYPES).map((k) => `<button class="ctype" data-act="compose" data-type="${k}">${C.tdot(k)}${esc(D.TYPES[k].label)}</button>`).join('')}</div></div>
          <div class="toolbar" style="margin-bottom:14px">
            <div class="seg">${[['foryou', 'Para ti'], ['recent', 'Recientes']].map(([k, l]) => `<button type="button" class="${S.ff.sort === k ? 'on' : ''}" data-act="ff-sort" data-v="${k}">${l}</button>`).join('')}</div>
          </div>
          <div class="filter-row">${[['all', 'Todo'], ...Object.entries(D.TYPES).map(([k, t]) => [k, t.label]), ['saved', 'Guardadas']].map(([k, l]) => `<button class="fchip${S.ff.type === k ? ' on' : ''}" data-act="ff-type" data-v="${k}">${l}</button>`).join('')}</div>
          ${C.liveNote('posts')}
          <div class="feed" id="feed">${C.feedList()}</div>
        </div>
        <aside class="aside">
          <div class="card"><div class="card-h"><h3>Hoy · ${esc(loop.name)}</h3><span class="chip chip-sol">${loop.day}</span></div><p class="muted" style="font-size:14px">${esc(loop.desc)}</p>
            <button class="btn btn-sm btn-door" style="margin-top:12px" data-act="compose" data-type="${loop.type}">Participar</button></div>
          <div class="card"><div class="card-h"><h3>Temas que sigues</h3></div><div class="topic-list">${TOPICS.map((t) => `<button class="topic${S.topics.has(t) ? ' on' : ''}" data-act="topic" data-t="${t}" aria-pressed="${S.topics.has(t)}">${S.topics.has(t) ? icon('check') : icon('plus')}${esc(C.tagLabel(t))}</button>`).join('')}</div>
            <p class="fine" style="margin-top:10px">Los temas que sigues suben en «Para ti».</p></div>
          <div class="card"><div class="card-h"><h3>Ask Mexicali</h3>${icon('pin')}</div><p class="muted" style="font-size:14px">Pregunta por proveedores, talento, recursos o experiencias de negocio en la ciudad.</p>
            <button class="btn btn-sm" style="margin-top:12px" data-act="compose" data-type="ask">Hacer una pregunta</button></div>
        </aside>
      </div>`;
    }
  };

  /* ======================= COLLAB MATCH ======================= */
  const SUGGEST = ['sepa de firmware y alguien que sepa vender', 'diseñe la marca de mi proyecto', 'me ayude a levantar inversión', 'quiera probar mi app', 'sepa de datos e IA'];
  C.defaultNeedQuery = () => {
    const t = S.me.needsTags || [];
    if (t.includes('firmware') && t.includes('ventas')) return 'sepa de firmware y alguien que sepa vender';
    return t.length ? `sepa de ${C.list(t.map((x) => C.tagLabel(x).toLowerCase()))}` : 'sepa de diseño';
  };
  C.detectedHTML = (needs) => `<span>Entendimos:</span>${needs.length ? needs.map((t) => `<span class="chip chip-need">${esc(C.tagLabel(t))}</span>`).join('') : '<span>nada todavía. Prueba con «firmware», «ventas», «diseño», «inversión»…</span>'}`;
  const resHTML = (r) => `<article class="card res spot">
      ${C.ring(r.s, r.s + '%', '', 62)}
      <div class="res-main"><div class="res-h"><b>${esc(r.p.name)}</b><small>${esc(r.p.role)}</small></div>
        <div class="fits">${r.hit.map((t) => `<span class="chip chip-blue">Encaja en ${esc(C.tagLabel(t).toLowerCase())}</span>`).join('')}${C.doorChip(r.p.door)}</div>
        <ul class="why-list">${r.why.slice(0, 3).map((w) => `<li>${icon('check')}<span>${esc(w)}</span></li>`).join('')}</ul>
        <div class="res-actions"><button class="btn btn-sm btn-door" data-act="contact" data-id="${r.p.id}" data-reason="${esc(r.hit[0] ? C.tagLabel(r.hit[0]) : '')}">Presentarme</button><button class="btn btn-sm" data-act="person" data-id="${r.p.id}">Ver perfil</button></div>
      </div></article>`;
  V.match = {
    render() {
      const q = S.match.q || C.defaultNeedQuery();
      S.match.q = q;
      const needs = C.parseNeeds(q);
      const res = C.matchPeople(needs, { avail: S.match.avail, door: S.door });
      const top = res.filter((r) => r.hit.length).slice(0, 6);
      return `
      <div class="vh"><div><p class="eyebrow">Collab Match</p><h1>Encuentra a las personas correctas</h1><p>Describe lo que necesitas. CRAI busca perfiles compatibles por habilidades, intereses, disponibilidad y objetivos, y te explica por qué encajan.</p></div></div>
      <div class="match-top">
        <form class="need-form" data-form="match" autocomplete="off">
          <div class="need-box"><label for="matchQ">Necesito a alguien que…</label><textarea id="matchQ" name="q" rows="2" maxlength="200" data-input="match-q">${esc(q)}</textarea></div>
          <div class="detected" id="detected">${C.detectedHTML(needs)}</div>
          <div class="filter-row" style="margin:0"><span class="fchip-label">Ideas</span>${SUGGEST.map((s) => `<button type="button" class="fchip" data-act="match-suggest" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div>
          <div class="filter-row" style="margin:0"><span class="fchip-label">Disponibilidad</span>${Object.entries(D.AVAIL).map(([k, l]) => `<button type="button" class="fchip${S.match.avail.includes(k) ? ' on' : ''}" data-act="match-avail" data-k="${k}" aria-pressed="${S.match.avail.includes(k)}">${l}</button>`).join('')}</div>
          <div class="need-foot">${C.doorSwitch()}<button class="btn btn-door btn-lg" type="submit">${icon('radar')}Buscar personas</button></div>
        </form>
        <div class="radar" id="radar" aria-label="Radar de compatibilidad">${C.radarHTML(res, { top: 4 })}</div>
      </div>
      ${C.liveNote('members')}
      <div class="block-h" id="matchResults"><h2>${top.length ? `${top.length} ${top.length === 1 ? 'persona encaja' : 'personas encajan'}` : 'Sin coincidencias claras'}</h2><p>Ordenadas por compatibilidad. Más cerca del centro del radar, más afinidad.</p></div>
      ${top.length ? `<div class="results">${top.map(resHTML).join('')}</div>`
        : `<div class="empty">${icon('radar')}<p>No encontramos a nadie con esas habilidades todavía. Publica la solicitud y deja que la comunidad responda.</p></div>`}
      <div class="disclaimer">${icon('info')}<span>CRAI facilita el primer contacto. No promete que dos personas serán buenos socios: eso lo deciden ustedes después de conocerse.</span></div>
      <div class="card" style="margin-top:14px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between"><div><b>¿No encontraste a quien buscabas?</b><p class="muted" style="font-size:14px">Publica tu necesidad como «Necesito ayuda» y otros miembros podrán responder.</p></div><button class="btn" data-act="publish-need">${icon('megaphone')}Publicar como solicitud</button></div>`;
    }
  };
})();
