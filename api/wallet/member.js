// POST /api/wallet/member (formulario con token y personaje) → credencial de miembro .pkpass.
import { cors, isConfigured, readBody, sendError, sendPass } from '../../server/wallet/lib.js';
import { memberNumber, readProfile, verifyMember } from '../../server/wallet/auth.js';
import { memberPass, toonImage } from '../../server/wallet/passes.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') { sendError(res, 405, 'Abre tu credencial desde Mi perfil › Mi tarjeta › Agregar a Apple Wallet.'); return; }
  if (!isConfigured()) { sendError(res, 503, 'Apple Wallet todavía no está activado en CRAI Club.'); return; }
  try {
    const body = await readBody(req);
    const member = await verifyMember(body.token);
    const profile = await readProfile(member);
    if (!profile) { sendError(res, 404, 'Primero completa tu perfil en el club.'); return; }
    const number = await memberNumber(member, profile.createdAt).catch(() => null);
    const pass = memberPass({ uid: member.uid, profile, number, toon: toonImage(body.toon) });
    sendPass(res, pass.getAsBuffer(), 'crai-credencial.pkpass');
  } catch (e) {
    console.error('wallet/member', e);
    sendError(res, e.status === 401 ? 401 : 500, e.status === 401
      ? 'Tu sesión venció. Vuelve a entrar al club e inténtalo de nuevo.'
      : 'Algo salió mal al crear tu credencial. Intenta de nuevo en un momento.');
  }
}
