# CRAI Club · clubcrai.com

Una comunidad para quienes construyen lo que viene. Mexicali, Baja California · 686.

Sitio estático con dos partes:

- **Landing pública:** el hero del amanecer (Founders de día, Underground de noche), las dos puertas, las tres preguntas, las seis funciones, el Weekly Loop, CRAI Build Night, las reglas del club, la ruta de lanzamiento y la convocatoria de miembros fundadores.
- **App del club** (botón «Entrar»): Inicio, People, Projects, Community, Events, Explore, Collab Match, Quests, Mi perfil y Blueprint.

## Qué es real y qué es de ejemplo

- **Real (Firebase):** cuentas con Google o correo, perfiles de miembros, publicaciones y comentarios del feed, mensajes de primer contacto (llegan a las notificaciones de la otra persona), solicitudes de miembros fundadores y denuncias.
- **De ejemplo:** proyectos, eventos, quests y las personas de muestra que se pueden mostrar con «Ver ejemplos» mientras el club crece.
- **Personajes:** cada miembro arma su cara caricatura en Mi perfil; es su foto de perfil en todo el club.

## Estructura

```
index.html         Documento principal
firebase.js        SDK de Firebase: Analytics, Auth y Firestore
live.js            Modo real: sesión, perfiles, feed, comentarios y mensajes
toons.js           Generador de personajes (avatares SVG)
styles.css         Estilos y tokens de color (tema claro y oscuro)
data.js            Datos de ejemplo
core.js            Estado, utilidades, matching y capas
landing.js         Animaciones de la landing y del hero
views.js           Vistas: Inicio, People, Projects, Community, Collab Match
views2.js          Vistas: Events, Quests, Explore, Mi perfil, Blueprint
people.js          Tarjetas emergentes, perfiles, tarjeta de presentación y primer contacto
app.js             Navegación, cajones, diálogos y acciones
firebase.json      Configuración de Hosting (publica la raíz del repo)
.firebaserc        Proyecto por defecto: club-de-robotica-crai
firestore.rules    Reglas de seguridad de Firestore
.nojekyll          Para que GitHub Pages sirva los archivos tal cual
```

## Publicar

**GitHub Pages:** en Settings > Pages, rama `main` y carpeta `/ (root)`. Queda en https://deimosvn.github.io/CRAI/.

**Firebase Hosting:**

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only hosting,firestore:rules
```

En la consola de Firebase:

- En Authentication > Sign-in method deben estar activos **Google** y **Correo electrónico/contraseña**.
- En Authentication > Settings > Authorized domains debe estar el dominio donde se publique (por ejemplo `deimosvn.github.io` o `clubcrai.com`).

Para probarlo en local, sirve la raíz del repo con cualquier servidor estático, por ejemplo `npx serve .`.
