# Arquitectura

CRAI Club es un sitio estático (HTML, CSS y JavaScript sin compilar) con Firebase como backend. No hay paso de build: lo que está en `public/` es exactamente lo que se publica.

## Estructura

```
public/                    Sitio publicado (Vercel, Firebase Hosting y GitHub Pages)
  index.html               Landing y contenedor de la app
  privacidad.html          Aviso de privacidad y condiciones de uso
  404.html                 Página de error
  robots.txt, sitemap.xml  Buscadores
  site.webmanifest         Ícono y nombre al «agregar a inicio» en el celular
  assets/
    css/                   Estilos, en el orden en que se cargan
      tokens.css           Colores, tipografías y radios (tema claro y oscuro)
      base.css             Reset, botones, chips y logo
      landing.css          Barra superior, secciones de la landing y pie
      app.css              Riel, barra inferior del celular y vistas de la app
      layers.css           Cajones, modales, menús y avisos
      people.css           Tarjetas de persona, perfiles y tarjeta de presentación
      hero.css             Hero del amanecer (sol, órbita y sierra)
      live.css             Personajes, cuentas, administración y modo real
      responsive.css       Ajustes por tamaño de pantalla (va al final a propósito)
    js/
      core/config.js       Configuración: Firebase, admins, correo de contacto
      data/demo-data.js    Datos de ejemplo (personas, proyectos, eventos, quests)
      core/core.js         Estado, utilidades, íconos, fechas, matching y capas
      core/toons.js        Generador de personajes (avatares SVG)
      landing/landing.js   Animaciones de la landing, menú del celular y solicitud de fundador
      app/views-network.js Vistas: Inicio, People, Projects, Community, Collab Match
      app/views-club.js    Vistas: Events, Quests, Explore, Mi perfil, Blueprint
      app/admin.js         Panel de administración
      app/people.js        Tarjeta emergente, perfil completo, tarjeta de presentación y primer contacto
      app/app.js           Navegación, cajones, diálogos, acciones y arranque
      services/live.js     Modo real: sesión, perfiles, feed, mensajes, cuentas y admin
      services/wallet.js   Botones de Apple Wallet (pide los pases al servidor)
      services/firebase.js SDK de Firebase (módulo ES); expone una API pequeña a live.js
    img/                   Favicon, íconos de la app e imagen para redes (og-image.png)
api/wallet/                Funciones de Vercel que firman los pases de Apple Wallet
server/wallet/             Código compartido de esas funciones e imágenes de los pases
vercel.json                Carpeta publicada y funciones de Vercel
docs/                      Esta documentación
scripts/check.mjs          Revisión de sintaxis, enlaces y JSON (npm run check)
tests/                     Pruebas de las reglas de Firestore y de los pases de Wallet
firestore.rules            Reglas de seguridad de la base de datos
firestore.indexes.json     Índices de Firestore (hoy no se necesita ninguno compuesto)
firebase.json              Hosting, reglas y emuladores
.github/workflows/ci.yml   Corre las revisiones y las pruebas en cada push
```

## Cómo se arma la página

Todos los scripts comparten un objeto global `window.CRAI` (en el código, `C`) y su estado `C.S`. Se cargan en orden y cada uno usa lo que definieron los anteriores:

1. `config.js` define `window.CRAI_CONFIG` y `window.CRAI_LIVE`.
2. `demo-data.js` define los datos de ejemplo (`window.CRAI_DATA`).
3. `core.js` crea `window.CRAI` con el estado, utilidades y el sistema de capas.
4. `toons.js` agrega los personajes (`C.avatar`, `C.toonSVG`).
5. `landing.js`, las vistas, `admin.js` y `people.js` registran vistas en `C.views` y acciones en `C.extraActions`.
6. `app.js` junta todas las acciones y formularios y escucha los clics (`data-act`, `data-go`) y envíos (`data-form`).
7. `wallet.js` registra los botones de Apple Wallet (antes de `app.js`, para que sus acciones se junten).
8. `live.js` envuelve la navegación para pedir sesión y registra `C.liveActions` / `C.liveForms`.
9. `firebase.js` (módulo) inicia Firebase y llama `C.attachFirebase(api)`.

La interfaz se pinta con plantillas de texto. Para agregar algo:

- **Una vista:** `C.views.nombre = { render() { return '…'; } }` y agrega `'nombre'` a `APP_VIEWS` en `app.js`.
- **Un botón:** ponle `data-act="mi-accion"` y define `'mi-accion': (el, e) => {…}` en `C.extraActions` (o en `C.liveActions` si usa Firebase).
- **Un formulario:** ponle `data-form="mi-form"` y define el manejador en `C.extraForms` o `C.liveForms`. Ningún formulario recarga la página.

## Modo real y datos de ejemplo

Con sesión iniciada y perfil (`C.isLive()`), la app usa Firestore para miembros, publicaciones, comentarios, mensajes y solicitudes. Proyectos, eventos y quests siguen siendo de ejemplo y se marcan como tales en la interfaz. Con «Ver ejemplos» se pueden mostrar las personas de muestra.

Las preferencias que no necesitan servidor (tema, filtros, proyectos seguidos) se guardan en `localStorage`, separadas por cuenta.

## Datos en Firestore

| Colección | Documento | Quién lee | Quién escribe |
|---|---|---|---|
| `profiles/{uid}` | Perfil del miembro | Miembros con sesión | La persona; admin puede borrar |
| `posts/{id}` | Publicación del feed | Miembros con sesión | La autora; admin puede borrar |
| `posts/{id}/comments/{id}` | Comentario | Miembros con sesión | La autora; admin puede borrar |
| `requests/{id}` | Mensaje de primer contacto | Solo quien envía y quien recibe | Quien envía; quien recibe lo marca como leído |
| `applications/{uid}` | Solicitud de miembro fundador | La persona y admin | La persona |
| `reports/{id}` | Denuncia | Solo admin | Cualquier miembro la crea |
| `bans/{uid}` | Cuenta bloqueada | La persona y admin | Solo admin |

Los detalles y límites de cada campo están en `firestore.rules`, y cada regla tiene su prueba en `tests/firestore.rules.test.mjs`.

## Google Analytics

Cada sección cuenta como una página (`/club/<sección>`) y las acciones importantes se miden con `C.track(nombre, datos)`. La lista de eventos y cómo verlos en Firebase: [ANALYTICS.md](ANALYTICS.md).

## Apple Wallet

La credencial de miembro y la invitación al Build Night se firman en Vercel (`api/wallet`). Detalles y cómo activarlo: [WALLET.md](WALLET.md).

## Administración

Las cuentas admin se definen en dos lugares que deben coincidir:

- `firestore.rules` → función `isAdmin()` (esta es la protección real).
- `public/assets/js/core/config.js` → `admins` (solo muestra u oculta el panel).

Un admin necesita correo verificado; entrar con Google lo verifica automáticamente. El panel (menú «Más» o riel → Administración) permite eliminar o bloquear miembros, borrar publicaciones, revisar denuncias y solicitudes, y desbloquear cuentas. Los mensajes privados no son visibles para nadie más que sus participantes. Borrar la cuenta de acceso (correo o Google) se hace en la consola de Firebase › Authentication.
