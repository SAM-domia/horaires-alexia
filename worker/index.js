// Mini-service partagé : les jours de télétravail cochés par Alexia. Aucun lien avec Cineplanner.
// GET  /?code=…            → { days: { "AAAA-MM-JJ": "tt" }, updatedAt }
// POST /?code=…  {date, tt} → marque ou démarque un jour
const H = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type', 'content-type': 'application/json' };
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: H });

export default {
  // Réveil du robot toutes les 30 min : la programmation de GitHub saute des passages (trous de 4 à 7 h constatés).
  async scheduled(_event, env) {
    const r = await fetch('https://api.github.com/repos/SAM-domia/horaires-alexia/actions/workflows/update.yml/dispatches', {
      method: 'POST', body: JSON.stringify({ ref: 'main' }),
      headers: { authorization: `Bearer ${env.GH_TOKEN}`, accept: 'application/vnd.github+json', 'user-agent': 'horaires-alexia' },
    });
    if (!r.ok) throw new Error(`GitHub → ${r.status}`); // visible dans les journaux Cloudflare
  },
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: H });
    if (new URL(req.url).searchParams.get('code') !== env.CODE) return json({ error: 'code' }, 403);
    const cur = JSON.parse((await env.TT.get('tt')) || '{"days":{}}');
    if (req.method === 'GET') return json(cur);
    if (req.method !== 'POST') return json({ error: 'méthode' }, 405);
    const { date, tt } = await req.json().catch(() => ({}));
    if (!/^20\d\d-\d\d-\d\d$/.test(date || '')) return json({ error: 'date' }, 400);
    if (tt) cur.days[date] = 'tt'; else delete cur.days[date];
    const old = new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10); // on oublie au-delà de 60 jours passés
    for (const d of Object.keys(cur.days)) if (d < old) delete cur.days[d];
    cur.updatedAt = new Date().toISOString();
    await env.TT.put('tt', JSON.stringify(cur));
    return json(cur);
  },
};
