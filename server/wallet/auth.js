// Comprueba la sesión de Firebase y lee el perfil con los permisos de la propia persona.
// No usa credenciales de administrador: Firestore aplica sus reglas al token del miembro.
import { createRemoteJWKSet, jwtVerify } from 'jose';

const PROJECT = process.env.FIREBASE_PROJECT_ID || 'club-de-robotica-crai';
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
const DOCS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

export async function verifyMember(idToken) {
  if (!idToken || typeof idToken !== 'string') throw Object.assign(new Error('Sin sesión'), { status: 401 });
  try {
    const { payload } = await jwtVerify(idToken, JWKS, { issuer: `https://securetoken.google.com/${PROJECT}`, audience: PROJECT });
    if (!payload.sub) throw new Error('Token sin uid');
    return { uid: payload.sub, token: idToken, name: payload.name || '' };
  } catch (e) {
    throw Object.assign(new Error('Sesión inválida o vencida'), { status: 401, cause: e });
  }
}

// Valores de la API REST de Firestore → objetos normales.
const value = (v) => {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(value);
  if ('mapValue' in v) return fields(v.mapValue.fields || {});
  return null;
};
const fields = (f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, value(v)]));

export async function readProfile({ uid, token }) {
  const r = await fetch(`${DOCS}/profiles/${encodeURIComponent(uid)}`, { headers: { Authorization: `Bearer ${token}` } });
  if (r.status === 404) return null;
  if (!r.ok) throw Object.assign(new Error(`Firestore respondió ${r.status}`), { status: 502 });
  return fields((await r.json()).fields || {});
}

// Número de miembro: cuántos perfiles se crearon antes o al mismo tiempo que este.
export async function memberNumber({ token }, createdAt) {
  if (!createdAt) return null;
  const r = await fetch(`${DOCS}:runAggregationQuery`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredAggregationQuery: {
        aggregations: [{ alias: 'n', count: {} }],
        structuredQuery: {
          from: [{ collectionId: 'profiles' }],
          where: { fieldFilter: { field: { fieldPath: 'createdAt' }, op: 'LESS_THAN_OR_EQUAL', value: { timestampValue: createdAt } } }
        }
      }
    })
  });
  if (!r.ok) return null;
  const rows = await r.json();
  const n = rows && rows[0] && rows[0].result && rows[0].result.aggregateFields && rows[0].result.aggregateFields.n;
  return n ? Number(n.integerValue) : null;
}
