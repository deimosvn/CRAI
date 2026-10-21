/* CRAI Club · Apple Wallet: credencial de miembro e invitación al Build Night.
   Los pases los genera y firma el servidor (/api/wallet en Vercel). Aquí solo se muestran los botones
   cuando el servidor dice que Wallet está listo y la persona usa un dispositivo de Apple. */
(function () {
  'use strict';
  const C = window.CRAI;
  const S = C.S;
  const $ = C.$;
  const API = String((window.CRAI_CONFIG || {}).walletApi || '').replace(/\/+$/, '');
  const UA = navigator.userAgent || '';
  // iPhone, iPad (que se presenta como Mac con pantalla táctil) y Mac.
  const APPLE = /iPhone|iPad|iPod|Macintosh/.test(UA);

  C.wallet = { ready: false };
  const ICON = '<svg class="wallet-ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="4" width="19" height="16" rx="3.5" fill="#fff"/><rect x="4.5" y="6" width="15" height="3.2" rx="1.2" fill="#2F9BFF"/><rect x="4.5" y="8.6" width="15" height="3.2" rx="1.2" fill="#2BC46B"/><rect x="4.5" y="11.2" width="15" height="3.2" rx="1.2" fill="#FFB020"/><path d="M2.5 14.2h6.2a3.3 3.3 0 0 0 6.6 0h6.2V17a3 3 0 0 1-3 3h-13a3 3 0 0 1-3-3z" fill="#E9E9EE"/></svg>';
  C.walletButton = (kind) => (C.wallet.ready
    ? `<button type="button" class="btn wallet-btn" data-act="wallet-${kind}">${ICON}<span>Agregar a Apple Wallet</span></button>`
    : '');

  // Los pases se piden con un formulario (navegación completa): Safari muestra «Agregar» al recibir el .pkpass.
  function post(path, fields) {
    const f = document.createElement('form');
    f.method = 'POST';
    f.action = API + path;
    f.hidden = true;
    Object.entries(fields).forEach(([name, value]) => {
      const i = document.createElement('input');
      i.type = 'hidden';
      i.name = name;
      i.value = value;
      f.appendChild(i);
    });
    document.body.appendChild(f);
    f.submit();
    setTimeout(() => f.remove(), 2000);
  }
  // El personaje del miembro como PNG, para que aparezca en su credencial.
  async function toonPng() {
    const svg = C.toonSVG(S.me).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="270" height="270" ');
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 270;
    canvas.height = 270;
    canvas.getContext('2d').drawImage(img, 0, 0, 270, 270);
    return canvas.toDataURL('image/png');
  }
  const working = (el, on) => {
    if (!el) return;
    if (on) { el.dataset.html = el.innerHTML; el.disabled = true; el.innerHTML = `${ICON}<span>Preparando tu pase…</span>`; setTimeout(() => working(el, false), 4000); }
    else if (el.dataset.html) { el.disabled = false; el.innerHTML = el.dataset.html; }
  };

  C.extraActions = Object.assign(C.extraActions || {}, {
    'wallet-member': async (el) => {
      if (!C.isLive() || !C.fb) return;
      working(el, true);
      try {
        const token = await C.fb.idToken();
        let toon = '';
        try { toon = await toonPng(); } catch (e) { /* sin personaje: la credencial sale sin foto */ }
        post('/member', { token, toon });
      } catch (e) {
        working(el, false);
        C.toast('No pudimos preparar tu credencial. Revisa tu conexión.', 'info');
      }
    },
    'wallet-event': async (el) => {
      working(el, true);
      if (C.isLive() && C.fb) {
        try { post('/build-night', { token: await C.fb.idToken() }); return; } catch (e) { /* sigue como invitación general */ }
      }
      location.href = API + '/build-night';
    }
  });

  // Botón del boleto en la landing; los de la app se pintan con C.walletButton().
  function mount() {
    const slot = $('#walletEvent');
    if (slot) slot.innerHTML = C.walletButton('event');
    if (C.refreshLayers) C.refreshLayers();
  }
  if (APPLE && API && 'fetch' in window) {
    fetch(API + '/status').then((r) => (r.ok ? r.json() : { ready: false })).then((j) => {
      C.wallet.ready = !!(j && j.ready);
      if (C.wallet.ready) mount();
    }).catch(() => {});
  }
})();
