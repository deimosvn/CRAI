# Desarrollo y publicación

## Requisitos

- Node 20 o más reciente.
- Para los emuladores de Firebase: Java 21 o más reciente.

```bash
npm install
```

## Trabajar en local

Solo el sitio, conectado a la base de datos real (cuidado: lo que hagas es real):

```bash
npm run dev
```

Con los emuladores de Firebase (cuentas y base de datos de prueba, nada sale de tu computadora):

```bash
npm run emulators
```

Luego abre `http://localhost:5000/?emulator`. El parámetro `?emulator` hace que la app use el emulador de Auth (puerto 9099) y de Firestore (8080). La consola de los emuladores queda en `http://localhost:4000`.

## Revisar antes de publicar

```bash
npm run check        # sintaxis de los scripts, enlaces de los HTML y JSON
npm run test:wallet  # pases de Apple Wallet con certificados de prueba
npm run test:rules   # pruebas de firestore.rules contra el emulador
npm test             # todo lo anterior
```

GitHub Actions corre lo mismo en cada push (`.github/workflows/ci.yml`).

## Dónde vive el sitio

| Dirección | Servicio | Qué publica |
|---|---|---|
| https://www.clubcrai.com | Vercel, conectado a `deimosvn/CRAI-TEC` | La carpeta `public/` y las funciones de `api/` (Apple Wallet), en cada push a `main` |
| https://club-de-robotica-crai.web.app | Firebase Hosting | La carpeta `public/`, con `npm run deploy` |
| https://deimosvn.github.io/CRAI/ | GitHub Pages de `deimosvn/CRAI` | Ver abajo |

Los dos repositorios tienen el mismo contenido.

### Firebase (hosting y reglas)

```bash
npx firebase-tools login
npm run deploy
```

Publica `public/` en Firebase Hosting y sube `firestore.rules` y `firestore.indexes.json`. Cada vez que cambien las reglas hay que publicarlas; el sitio en Vercel usa la misma base de datos.

### GitHub Pages (repositorio CRAI)

GitHub Pages solo puede servir la raíz o `/docs` de una rama. Mientras Pages esté en «Deploy from a branch», el `index.html` de la raíz redirige a `public/`, así que la dirección sigue funcionando (termina en `/CRAI/public/`).

Para que el sitio quede en `/CRAI/` sin redirección: en GitHub › Settings › Pages elige **Source: GitHub Actions**. El flujo `.github/workflows/pages.yml` publica `public/` en cada push a `main`.

## Configuración de Firebase que no vive en el código

En la consola de Firebase (proyecto `club-de-robotica-crai`):

- **Authentication › Sign-in method:** Google y Correo electrónico/contraseña activos.
- **Authentication › Settings › Authorized domains:** `localhost`, `club-de-robotica-crai.web.app`, `club-de-robotica-crai.firebaseapp.com`, `clubcrai.com`, `www.clubcrai.com` y `deimosvn.github.io`.
- **Authentication › Templates:** revisa en español los correos de verificación y de cambio de contraseña.
