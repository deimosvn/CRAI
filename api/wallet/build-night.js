// /api/wallet/build-night → invitación al próximo CRAI Build Night (.pkpass).
// GET: invitación general. POST con token: a nombre del miembro y con su código de perfil.
import { cors, isConfigured, readBody, sendError, sendPass } from '../../server/wallet/lib.js';
import { readProfile, verifyMember } from '../../server/wallet/auth.js';
import { buildNightPass } from '../../server/wallet/passes.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'GET' && req.method !== 'POST') { sendError(res, 405, 'Método no permitido.'); return; }
  if (!isConfigured()) { sendError(res, 503, 'Apple Wallet todavía no está activado en CRAI Club.'); return; }
  try {
    let who = {};
    if (req.method === 'POST') {
      const body = await readBody(req);
      if (body.token) {
        const member = await verifyMember(body.token);
        const profile = await readProfile(member).catch(() => null);
        who = { uid: member.uid, name: (profile && profile.name) || member.name };
      }
    }
    const { pass, night } = buildNightPass(who);
    sendPass(res, pass.getAsBuffer(), `crai-build-night-${night.m}-${night.d}.pkpass`);
  } catch (e) {
    console.error('wallet/build-night', e);
    sendError(res, e.status === 401 ? 401 : 500, e.status === 401
      ? 'Tu sesión venció. Vuelve a entrar al club e inténtalo de nuevo.'
      : 'Algo salió mal al crear tu invitación. Intenta de nuevo en un momento.');
  }
}
