# Apple Wallet

CRAI Club genera dos pases:

- **Credencial de miembro** (Mi perfil › Mi tarjeta › Agregar a Apple Wallet): nombre, a qué se dedica, puerta, número de miembro, su personaje y un código QR que abre su perfil en el club. Sirve para presentarse en persona: quien lo escanea ve el perfil.
- **Invitación al CRAI Build Night** (boleto de la landing y evento en la app): el próximo jueves, 19:00 a 22:00, en Cervecería Averno, con dirección, agenda y «Cómo llegar». Aparece en la pantalla bloqueada a la hora del evento y se archiva sola al terminar. Con sesión iniciada sale a nombre del miembro.

## Cómo funciona

```
Navegador (public/assets/js/services/wallet.js)
  └─ POST con el token de sesión ─▶ Vercel: api/wallet/member.js, api/wallet/build-night.js
                                     ├─ server/wallet/auth.js     verifica el token de Firebase y lee el perfil
                                     ├─ server/wallet/passes.js   arma el pase (passkit-generator)
                                     └─ server/wallet/model/      ícono, logo y franja del evento
```

Apple solo acepta pases firmados con un certificado suyo, así que la firma ocurre en el servidor y los certificados viven en variables de entorno de Vercel, nunca en el repositorio. `GET /api/wallet/status` responde `{"ready": true}` cuando están configurados; mientras tanto, los botones no aparecen. Solo se muestran en iPhone, iPad y Mac.

## Activarlo (una sola vez)

1. **Cuenta de Apple Developer** (USD 99 al año) en https://developer.apple.com/programs/.
2. En **Certificates, Identifiers & Profiles › Identifiers**, crea un **Pass Type ID**, por ejemplo `pass.com.clubcrai.club`.
3. Genera la solicitud de certificado (en Windows sirve la terminal de Git Bash):
   ```bash
   openssl req -new -newkey rsa:2048 -nodes -keyout wallet.key -out wallet.csr -subj "/emailAddress=contacto@clubcrai.com/CN=CRAI Club Wallet/C=MX"
   ```
4. En el Pass Type ID, **Create Certificate**, sube `wallet.csr` y descarga `pass.cer`. Conviértelo:
   ```bash
   openssl x509 -inform der -in pass.cer -out wallet-cert.pem
   ```
5. Descarga el certificado intermedio **Worldwide Developer Relations - G4** de https://www.apple.com/certificateauthority/ y conviértelo:
   ```bash
   openssl x509 -inform der -in AppleWWDRCAG4.cer -out wwdr.pem
   ```
6. Copia tu **Team ID** (Membership details en la cuenta de desarrollador).
7. En **Vercel › proyecto de clubcrai.com › Settings › Environment Variables** (Production), agrega:

   | Variable | Valor |
   |---|---|
   | `WALLET_PASS_TYPE_ID` | `pass.com.clubcrai.club` (el que creaste) |
   | `WALLET_TEAM_ID` | Tu Team ID |
   | `WALLET_SIGNER_CERT` | Contenido de `wallet-cert.pem` |
   | `WALLET_SIGNER_KEY` | Contenido de `wallet.key` |
   | `WALLET_WWDR` | Contenido de `wwdr.pem` |
   | `WALLET_SIGNER_KEY_PASSPHRASE` | Solo si tu llave tiene contraseña |

   Se puede pegar el PEM tal cual o en base64 (`base64 -w0 wallet-cert.pem`).
8. **Redeploy** en Vercel (los cambios de variables necesitan un despliegue nuevo).
9. Abre https://www.clubcrai.com/api/wallet/status: debe decir `{"ready":true}`. Desde un iPhone ya verás «Agregar a Apple Wallet».

Guarda `wallet.key` y los `.pem` fuera del repositorio (están en `.gitignore`). El certificado del pase vence al año: repite los pasos 3 a 8 para renovarlo.

## Pruebas

`npm run test:wallet` crea pases con certificados de prueba generados al vuelo y comprueba el contenido, el manifiesto y la firma (con OpenSSL), además de las rutas de `/api/wallet`. Apple no aceptaría esos pases de prueba; con el certificado real sí.

## Límites actuales

- Los pases no se actualizan solos: si cambias tu perfil, vuelve a agregar la credencial.
- La invitación es para el próximo jueves; después del evento se archiva y se descarga una nueva.
- Solo Apple Wallet. Google Wallet (Android) necesita otra integración.
