# CRAI Club · clubcrai.com

[![CI](https://github.com/deimosvn/CRAI-TEC/actions/workflows/ci.yml/badge.svg)](https://github.com/deimosvn/CRAI-TEC/actions/workflows/ci.yml)

El club de founders, makers y creadores de Mexicali, Baja California · 686. Encuentra con quién construir, pide ayuda y muestra lo que haces.

- **Sitio:** https://www.clubcrai.com
- **Firebase Hosting:** https://club-de-robotica-crai.web.app

## Qué incluye

- **Landing:** hero del amanecer (Founders de día, Underground de noche), las dos puertas, funciones, Weekly Loop, CRAI Build Night, reglas, ruta y convocatoria de miembros fundadores.
- **App del club:** Inicio, People, Projects, Community, Events, Explore, Collab Match, Quests y Mi perfil, con barra inferior en el celular.
- **Cuentas reales (Firebase):** registro con Google o correo, perfiles, publicaciones, comentarios, mensajes de primer contacto, solicitudes de fundadores, denuncias, borrado de cuenta y panel de administración.
- **Apple Wallet:** credencial de miembro con su personaje y QR a su perfil, e invitación al Build Night de los jueves. Se activa con un certificado de Apple ([cómo](docs/WALLET.md)).
- **De ejemplo por ahora:** proyectos, eventos, quests y las personas de muestra que se pueden mostrar con «Ver ejemplos».

## Estructura

```
public/       Sitio publicado: index.html, privacidad.html, 404.html y assets/ (css, js, img)
api/ server/  Funciones de Vercel que firman los pases de Apple Wallet
docs/         Arquitectura, publicación y lista de lanzamiento
scripts/      Revisión automática del sitio
tests/        Pruebas de las reglas de Firestore y de los pases de Wallet
firestore.rules · firestore.indexes.json · firebase.json · .firebaserc
```

## Comandos

```bash
npm install          # dependencias de desarrollo (solo para las pruebas)
npm run dev          # sitio en http://localhost:5173
npm run emulators    # Firebase local; abre http://localhost:5000/?emulator
npm test             # revisión del sitio, pases de Wallet y reglas (requiere Java 21)
npm run deploy       # publica en Firebase Hosting y sube las reglas
```

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md): cómo está armado el código, los datos y la administración.
- [Desarrollo y publicación](docs/DEPLOY.md): emuladores, pruebas, Vercel, Firebase y GitHub Pages.
- [Google Analytics](docs/ANALYTICS.md): qué se mide y dónde verlo en Firebase.
- [Apple Wallet](docs/WALLET.md): credencial y pase del Build Night; cómo activarlo.
- [Lista para el lanzamiento](docs/LAUNCH-CHECKLIST.md): qué está listo y qué falta decidir.
