# Lista para el lanzamiento

## Listo en el código

- [x] Registro con Google o con correo; «Únete» abre directo el registro y «Entrar» el inicio de sesión.
- [x] El nombre que escribes al registrarte llega a la bienvenida; el perfil se guarda en Firestore.
- [x] Correo de verificación al registrarse con correo, con opción de reenviarlo desde Mi perfil.
- [x] Aviso cuando la página se abre dentro de Instagram, Facebook o TikTok (Google no deja entrar ahí).
- [x] Mensajes claros si no hay conexión o si Firebase no carga.
- [x] Mi perfil: «Editar mis datos», guardado automático, enlaces que abren de verdad, cambio de contraseña.
- [x] Eliminar mi cuenta (perfil, publicaciones, mensajes, solicitud y cuenta de acceso).
- [x] Panel de administración para las cuentas de `config.js` / `firestore.rules`.
- [x] Reglas de Firestore con pruebas automáticas (registro, publicaciones, mensajes, admin, bloqueos y borrado).
- [x] Celular: barra inferior en la app con menú «Más», menú en la landing, paneles como hojas desde abajo, campos de 16 px (sin zoom en iPhone), sin desbordes horizontales.
- [x] Aviso de privacidad y condiciones de uso (`privacidad.html`), enlazado desde el registro, el pie y Mi perfil.
- [x] Imagen para compartir en redes (`og-cover.jpg`, 1200×630, menos de 100 KB para que WhatsApp la muestre), íconos para «agregar a inicio», `robots.txt`, `sitemap.xml` y página 404.
- [x] CRAI Build Night: cada jueves de 19:00 a 22:00 en Cervecería Averno (Av. República de Brasil 115, Cuauhtémoc Norte), con «Cómo llegar» y la fecha del próximo jueves.
- [x] La landing ya no presenta datos de ejemplo como reales (evento, lugar, «datos de ejemplo» en el pie).

## Pendiente de decidir o configurar (fuera del código)

- [ ] **Correo de contacto del club:** ponlo en `contactEmail` de `public/assets/js/core/config.js`. Aparece en el aviso de privacidad y en Mi perfil.
- [ ] **Vista previa en redes:** si un enlace ya se compartió antes, Facebook y WhatsApp guardan la imagen vieja; se refresca en https://developers.facebook.com/tools/debug/ («Volver a extraer»).
- [ ] **Revisión legal:** el aviso de privacidad es una base clara; conviene que lo revise alguien con experiencia en la LFPDPPP.
- [ ] **Plantillas de correo de Firebase** en español (Authentication › Templates).
- [ ] **GitHub Pages del repositorio CRAI:** opcional, cambiar la fuente a GitHub Actions (ver `docs/DEPLOY.md`).
- [ ] **Proyectos, eventos y quests** siguen siendo de ejemplo dentro de la app; el siguiente paso es guardarlos en Firestore.
