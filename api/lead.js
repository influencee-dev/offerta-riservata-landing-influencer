// Vercel Serverless Function: salva il contatto su Brevo.
// La chiave API NON sta nel codice: si imposta come variabile d'ambiente nel progetto Vercel.
//   BREVO_API_KEY  = chiave API Brevo di questa landing
//   BREVO_LIST_ID  = id della lista Brevo di questa landing (57, 58 o 59)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+0-9 ().-]{6,25}$/;
const clean = (v, max) => String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').replace(/[<>]/g, '').trim().slice(0, max);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'method' }); }

  // Solo richieste dalla stessa pagina
  const origin = req.headers.origin;
  if (origin) {
    try { if (new URL(origin).host !== req.headers.host) return res.status(403).json({ ok: false, error: 'origin' }); }
    catch (e) { return res.status(403).json({ ok: false, error: 'origin' }); }
  }

  const key = process.env.BREVO_API_KEY, listId = Number(process.env.BREVO_LIST_ID);
  if (!key || !listId) { console.error('lead: variabili BREVO_API_KEY / BREVO_LIST_ID mancanti'); return res.status(500).json({ ok: false, error: 'config' }); }

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};

  // Anti-bot: campo trappola e tempo minimo di compilazione
  if (b.website) return res.status(200).json({ ok: true });
  if (Number(b.elapsed) < 1500) return res.status(200).json({ ok: true });

  const nome = clean(b.nome, 80), email = clean(b.email, 120).toLowerCase(), tel = clean(b.telefono, 25);
  if (nome.length < 2) return res.status(400).json({ ok: false, error: 'nome' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: 'email' });
  if (tel && !PHONE_RE.test(tel)) return res.status(400).json({ ok: false, error: 'telefono' });
  if (b.privacy !== true) return res.status(400).json({ ok: false, error: 'privacy' });

  const channel = b.channel === 'email' ? 'Email' : 'WhatsApp';
  const offer = clean(b.offer, 80) || 'Offerta riservata';
  const ref = clean(b.ref, 60);
  const now = new Date();
  const marketing = b.marketing === true;

  const attributes = {
    FIRSTNAME: nome,
    SOURCE: 'Landing Black Friday + Natale: ' + offer,
    NOTE: ('Richiesta informazioni via ' + channel + ' il ' + now.toISOString().slice(0, 16).replace('T', ' ') + ' UTC' + (ref ? ' · ref: ' + ref : '')).slice(0, 250),
  };
  if (tel) attributes.TELEFONO = tel;
  // Il consenso marketing si scrive solo se dato: non cancella un consenso già registrato.
  if (marketing) { attributes.OPT_IN = true; attributes.OPTIN_TIME = now.toISOString().slice(0, 10); }

  try {
    const r = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ email, attributes, listIds: [listId], updateEnabled: true }),
    });
    if (r.status === 201 || r.status === 204) return res.status(200).json({ ok: true });
    const t = await r.text().catch(() => '');
    console.error('lead: Brevo ha risposto', r.status, t.slice(0, 200));
    return res.status(502).json({ ok: false, error: 'brevo' });
  } catch (e) {
    console.error('lead: errore di rete verso Brevo', e && e.message);
    return res.status(502).json({ ok: false, error: 'network' });
  }
};
