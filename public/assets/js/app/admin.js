/* CRAI Club · panel de administración: miembros, publicaciones, denuncias, solicitudes y bloqueos.
   Solo aparece para las cuentas de config.js (admins). La protección real está en firestore.rules:
   aunque alguien abra esta vista, Firestore rechaza lo que no le toca. */
(function () {
  'use strict';
  const C = window.CRAI;
  const D = C.D;
  const S = C.S;
  const $ = C.$;
  const esc = C.esc;
  const icon = C.icon;

  const project = ((window.CRAI_CONFIG || {}).firebase || {}).projectId || '';
  const AUTH_CONSOLE = `https://console.firebase.google.com/project/${project}/authentication/users`;
  const TABS = [['members', 'Miembros'], ['posts', 'Publicaciones'], ['reports', 'Denuncias'], ['apps', 'Solicitudes'], ['bans', 'Bloqueos']];
  let tab = 'members';
  let q = '';

  const isAdmin = () => !!(C.isAdmin && C.isAdmin());
  const dateOf = (ms) => (ms ? new Date(ms).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
  const empty = (msg) => `<div class="empty adm-empty">${icon('check')}<p>${esc(msg)}</p></div>`;
  const members = () => [S.me, ...S.liveMembers].filter((p) => p && p.uid);
  const nameOf = (uid) => { const p = C.person(uid); return p.ghost ? 'Perfil eliminado' : p.name; };
  // Botón de dos toques para lo que no se puede deshacer.
  const twoTap = (act, id, label, tone = 'danger') => `<button type="button" class="btn btn-sm ${tone === 'danger' ? 'btn-danger' : ''}" data-act="${act}" data-id="${esc(id)}" data-label="${esc(label)}">${esc(label)}</button>`;

  /* ---------- Pestañas ---------- */
  function memberRow(p) {
    const self = p.id === 'me';
    const posts = S.livePosts.filter((x) => x.authorId === p.uid).length;
    const reports = S.admin.reports.filter((r) => r.targetId === p.uid).length;
    return `<div class="adm-row">${C.avatar(p, 'sm')}
      <div class="adm-main"><b>${esc(p.name)}${self ? ' <span class="chip chip-mint">Tú</span>' : ''}</b>
        <small>${esc(p.role || 'Sin rol')} · No. ${p.number ? String(p.number).padStart(3, '0') : '—'} · desde ${dateOf(p.created)} · ${posts} ${posts === 1 ? 'publicación' : 'publicaciones'}${reports ? ` · <em class="adm-flag">${reports} ${reports === 1 ? 'denuncia' : 'denuncias'}</em>` : ''}</small></div>
      <div class="adm-actions"><button type="button" class="btn btn-sm" data-act="person" data-id="${self ? 'me' : esc(p.id)}">Ver</button>${self ? '' : twoTap('adm-remove', p.uid, 'Eliminar') + twoTap('adm-block', p.uid, 'Bloquear')}</div>
    </div>`;
  }
  const memberRows = () => {
    const nq = C.norm(q);
    const list = members().filter((p) => !nq || C.norm(`${p.name} ${p.role} ${p.building}`).includes(nq)).sort((a, b) => (b.created || 0) - (a.created || 0));
    return list.map(memberRow).join('') || empty('Nadie coincide con esa búsqueda.');
  };
  function membersTab() {
    return `<div class="toolbar"><div class="search-inp grow">${icon('search')}<input class="inp" type="search" data-input="admin-q" value="${esc(q)}" placeholder="Buscar por nombre, rol o proyecto" aria-label="Buscar miembros"></div></div>
      <div class="adm-list" id="admList">${memberRows()}</div>
      <p class="fine adm-note">${icon('info')}<span><b>Eliminar</b> borra el perfil, sus publicaciones y su solicitud; la persona puede volver a registrarse. <b>Bloquear</b> además le impide volver a entrar. La cuenta de acceso (correo o Google) se borra en <a href="${AUTH_CONSOLE}" target="_blank" rel="noopener">Firebase › Authentication</a>.</span></p>`;
  }
  function postsTab() {
    const list = S.livePosts.slice().sort((a, b) => b.ts - a.ts);
    return `<div class="adm-list">${list.map((p) => `<div class="adm-row">${C.avatar(C.person(p.author), 'sm')}
        <div class="adm-main"><b>${esc(C.person(p.author).name)} · ${esc(D.TYPES[p.type].label)}</b><p class="adm-text">${esc(p.text.length > 220 ? p.text.slice(0, 220) + '…' : p.text)}</p>
          <small>${C.ago(C.postHours(p))} · ${p.commentCount || 0} ${p.commentCount === 1 ? 'comentario' : 'comentarios'}</small></div>
        <div class="adm-actions">${twoTap('adm-del-post', p.id, 'Eliminar')}</div></div>`).join('') || empty('Todavía no hay publicaciones.')}</div>
      <p class="fine adm-note">${icon('info')}<span>Se muestran las 80 publicaciones más recientes. También puedes eliminar cualquier publicación desde el feed.</span></p>`;
  }
  function reportsTab() {
    return `<div class="adm-list">${S.admin.reports.map((r) => {
      const target = C.person(r.targetId);
      return `<div class="adm-row">${C.avatar(target, 'sm')}
        <div class="adm-main"><b>${esc(nameOf(r.targetId))}</b><small>Denunciado por ${esc(nameOf(r.reporterId))} · ${esc(r.kind || 'perfil')} · ${dateOf(r.ts)}</small></div>
        <div class="adm-actions">${target.ghost ? '' : `<button type="button" class="btn btn-sm" data-act="person" data-id="${esc(r.targetId)}">Ver</button>${twoTap('adm-remove', r.targetId, 'Eliminar perfil')}`}${twoTap('adm-dismiss', r.id, 'Descartar', 'plain')}</div></div>`;
    }).join('') || empty('No hay denuncias pendientes.')}</div>`;
  }
  function appsTab() {
    return `<div class="adm-list">${S.admin.apps.map((a) => {
      const p = C.person(a.uid);
      return `<div class="adm-row">${C.avatar(p.ghost ? { name: a.name, door: a.door, hue: 220 } : p, 'sm')}
        <div class="adm-main"><b>${esc(a.name)}</b><p class="adm-text">Construye: ${esc(a.building || '—')}${a.need ? `<br>Necesita: ${esc(a.need)}` : ''}</p>
          <small>${esc(D.DOORS[a.door] || '')} · ${dateOf(a.ts)} · ${p.ghost ? 'Todavía sin perfil' : `Miembro No. ${p.number ? String(p.number).padStart(3, '0') : '—'}`}</small></div>
        <div class="adm-actions">${p.ghost ? '' : `<button type="button" class="btn btn-sm" data-act="person" data-id="${esc(a.uid)}">Ver</button>`}</div></div>`;
    }).join('') || empty('No hay solicitudes de miembros fundadores.')}</div>`;
  }
  function bansTab() {
    return `<div class="adm-list">${S.admin.bans.map((b) => `<div class="adm-row"><span class="tdot tone-sol">${icon('lock')}</span>
        <div class="adm-main"><b>${esc(b.name || 'Cuenta bloqueada')}</b><small>${esc(b.reason || 'Sin motivo')} · ${dateOf(b.ts)}</small></div>
        <div class="adm-actions">${twoTap('adm-unban', b.uid, 'Desbloquear', 'plain')}</div></div>`).join('') || empty('No hay cuentas bloqueadas.')}</div>`;
  }
  const BODY = { members: membersTab, posts: postsTab, reports: reportsTab, apps: appsTab, bans: bansTab };

  C.views.admin = {
    render() {
      if (!isAdmin()) return `<div class="empty" style="margin-top:40px">${icon('lock')}<p>Esta sección es solo para el equipo de administración.</p></div>`;
      const total = members().length;
      const counts = { members: total, posts: S.livePosts.length, reports: S.admin.reports.length, apps: S.admin.apps.length, bans: S.admin.bans.length };
      return `
      <div class="vh"><div><p class="eyebrow">${icon('shield')} Administración</p><h1>Panel del club</h1><p>Modera miembros y publicaciones, revisa denuncias y solicitudes de fundadores. Los mensajes privados no se ven aquí.</p></div></div>
      <div class="adm-stats">
        <div class="card"><b class="tnum">${total}</b><small>miembros</small></div>
        <div class="card"><b class="tnum">${Math.min(30, total)}/30</b><small>fundadores</small></div>
        <div class="card"><b class="tnum">${counts.posts}</b><small>publicaciones recientes</small></div>
        <div class="card${counts.reports ? ' adm-alert' : ''}"><b class="tnum">${counts.reports}</b><small>denuncias</small></div>
      </div>
      <div class="adm-tabs" role="tablist">${TABS.map(([k, l]) => `<button type="button" role="tab" class="fchip${tab === k ? ' on' : ''}" aria-selected="${tab === k}" data-act="adm-tab" data-tab="${k}">${l}<span class="adm-count">${counts[k]}</span></button>`).join('')}</div>
      <section class="adm-body">${BODY[tab]()}</section>`;
    }
  };

  /* ---------- Acciones ---------- */
  function confirmed(el) {
    if (el.dataset.armed === '1') return true;
    el.dataset.armed = '1';
    el.textContent = '¿Seguro? Toca otra vez';
    setTimeout(() => { if (document.contains(el) && !el.disabled) { el.dataset.armed = ''; el.textContent = el.dataset.label; } }, 4000);
    return false;
  }
  function run(el, task, done) {
    if (!isAdmin() || !C.fb) return;
    if (!confirmed(el)) return;
    el.disabled = true;
    el.textContent = 'Un momento…';
    task().then(() => C.toast(done, 'shield')).catch((e) => {
      el.disabled = false;
      el.dataset.armed = '';
      el.textContent = el.dataset.label;
      C.toast(e && e.code === 'permission-denied' ? 'Firestore no lo permitió. Revisa que tu correo esté verificado y las reglas publicadas.' : 'No se pudo completar. Intenta de nuevo.', 'info');
    });
  }
  C.extraActions = Object.assign(C.extraActions || {}, {
    'adm-tab': (el) => { tab = el.dataset.tab; C.rerender(); },
    'adm-remove': (el) => { const uid = el.dataset.id; run(el, () => C.fb.removeMember(uid), `Eliminamos el perfil de ${esc(nameOf(uid))}.`); },
    'adm-block': (el) => { const uid = el.dataset.id; const name = nameOf(uid); run(el, () => C.fb.removeMember(uid, { block: true, name, reason: 'Bloqueada desde el panel' }), `${esc(name)} quedó bloqueada y fuera del club.`); },
    'adm-del-post': (el) => run(el, () => C.fb.deletePost(el.dataset.id), 'Publicación eliminada.'),
    'adm-dismiss': (el) => run(el, () => C.fb.deleteReport(el.dataset.id), 'Denuncia descartada.'),
    'adm-unban': (el) => run(el, () => C.fb.unban(el.dataset.id), 'Cuenta desbloqueada.')
  });
  document.addEventListener('input', (e) => {
    if (e.target.dataset && e.target.dataset.input === 'admin-q') { q = e.target.value; const l = $('#admList'); if (l) l.innerHTML = memberRows(); }
  });
})();
