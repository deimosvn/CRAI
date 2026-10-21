# Google Analytics

CRAI Club usa **Google Analytics 4 a través de Firebase** (ID de medición `G-9Y8MC4ECJM`, proyecto `club-de-robotica-crai`). Todo lo que se mide aparece en la consola de Firebase y en Google Analytics.

## Dónde verlo

| Qué quieres ver | Dónde |
|---|---|
| Resumen: usuarios, países, dispositivos, eventos | Firebase › **Analytics › Dashboard** |
| Cada evento y cuántas veces pasa | Firebase › **Analytics › Events** |
| Eventos en vivo mientras pruebas | Firebase › **Analytics › DebugView**, abriendo el sitio con `?debug_analytics` (por ejemplo `https://www.clubcrai.com/?debug_analytics`) |
| Quién está en el sitio ahora | Google Analytics › **Informes › Tiempo real** (botón «View more in Google Analytics» desde Firebase) |
| Páginas y secciones más vistas | Google Analytics › Informes › Interacción › **Páginas y pantallas** |
| De dónde llega la gente (Instagram, WhatsApp, Google…) | Google Analytics › Informes › Adquisición › **Adquisición de tráfico** |

Los informes normales tardan hasta 24 horas en llenarse; Tiempo real y DebugView son inmediatos.

## Qué se mide

**Páginas.** Al ser una sola página, cada sección se manda como una vista: la landing es `/` y cada sección del club es `/club/<sección>` (`/club/inicio`, `/club/people`, `/club/community`, `/club/match`, `/club/perfil`, `/club/admin`…). `privacidad.html` también se mide.

**Eventos.**

| Evento | Cuándo | Datos |
|---|---|---|
| `sign_up` | Alguien crea su cuenta | `method`: `google` o `email` |
| `login` | Alguien entra con una cuenta existente | `method` |
| `tutorial_complete` | Termina la bienvenida y crea su perfil | `puerta` |
| `generate_lead` | Se guarda una solicitud de miembro fundador | `lead_source`, `puerta` |
| `cta_click` | Toca «Únete», «Entrar», una puerta, el menú, «Editar mi perfil» o «Presentar mi proyecto» | `cta`, `location` (barra_superior, hero, menu, build_night, pie, app…) |
| `view_section` | Una sección de la landing llega a la pantalla (una vez por visita) | `section` (puertas, funciones, irl, unete…) |
| `post_create` | Publica en el feed | `post_type`, `temas` |
| `comment_create` | Comenta una publicación | — |
| `contact_request` | Envía un mensaje de primer contacto | `formato`, `tipo` |
| `search` | Busca en Collab Match | `search_term` (solo los temas detectados, nunca el texto) |
| `share` | Invita al club o copia el enlace de un perfil | `method`, `content_type` |
| `view_item` | Abre una tarjeta de presentación | `item_category`, `propia` |
| `directions_click` | Toca «Cómo llegar» del Build Night | `place`, `location` |
| `contact_email_click` | Toca el correo de contacto | `location` |
| `add_to_wallet` | Toca «Agregar a Apple Wallet» | `pass`, `location` |
| `report_submit` | Denuncia un perfil | `kind` |
| `account_delete` | Borra su cuenta | — |

**Personas.** Con sesión iniciada se manda el identificador interno de Firebase (`user_id`) para contar personas y no dispositivos, y estas propiedades: `con_cuenta`, `con_perfil` y `puerta`. Nunca se manda nombre, correo, ni lo que alguien escribe en publicaciones, mensajes o búsquedas.

El código está en `public/assets/js/services/firebase.js` (conexión) y se usa con `C.track(nombre, datos)` desde cualquier archivo.

## Configuración recomendada en Google Analytics (una sola vez)

En Google Analytics › **Administrar** (engrane):

1. **Eventos clave** (antes «conversiones»): marca `sign_up`, `tutorial_complete`, `generate_lead`, `contact_request` y `post_create`. Así ves cuántas visitas terminan en algo que importa.
2. **Definiciones personalizadas › Crear dimensión personalizada**, para poder filtrar los informes por estos datos:
   - Ámbito *Evento*: `cta`, `location`, `section`, `post_type`, `pass`, `puerta`, `formato`, `tipo`, `lead_source`.
   - Ámbito *Usuario*: `con_cuenta`, `con_perfil`, `puerta`.
3. **Configuración de datos › Retención de datos**: cámbiala de 2 a **14 meses** para comparar meses y temporadas.
4. Opcional: **Vinculaciones de productos › Search Console**, para ver con qué búsquedas de Google llega la gente.

## Pruebas

- En `localhost` no se mide nada, para no mezclar pruebas con visitas reales. Para probar en local: `http://localhost:5173/?debug_analytics`.
- Con `?debug_analytics` (en local o en el sitio publicado) los eventos llegan marcados como depuración y se ven al instante en **DebugView**.
- Un bloqueador de anuncios puede impedir que se mida una visita; la app sigue funcionando igual.
