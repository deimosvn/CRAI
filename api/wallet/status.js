// GET /api/wallet/status → { ready } para saber si mostrar los botones de Apple Wallet.
import { cors, isConfigured } from '../../server/wallet/lib.js';

export default function handler(req, res) {
  cors(res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.end(JSON.stringify({ ready: isConfigured() }));
}
