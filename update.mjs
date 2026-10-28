// Robot : se connecte à Cineplanner, garde les horaires d'Alexia, publie data.json + alexia.ics dans le gist secret.
// Variables : CP_EMAIL, CP_PASSWORD, GIST_ID, GIST_TOKEN (secrets GitHub). Sans GIST_* : écrit les fichiers dans out/.
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = 'https://app.cineplanner.fr';
const WHO = /FOUTEAU/i;
const paris = iso => new Date(iso).toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }); // "AAAA-MM-JJ HH:MM:SS", même si l'API passe en UTC

export function build(shifts, absences, today, prev) {
  const days = {};
  const day = d => (days[d] ??= {});
  for (const s of shifts) {
    if (!WHO.test(s.extendedProps?.userName || s.title)) continue;
    const a = paris(s.start), b = paris(s.end);
    if (s.extendedProps?.draft) { day(a.slice(0, 10)).draft = true; continue; } // brouillon : affiché « pas encore publié »
    (day(a.slice(0, 10)).s ??= []).push([a.slice(11, 16), b.slice(11, 16)]);
  }
  const seen = new Set();
  for (const a of Object.values(absences).flat()) {
    if (!WHO.test(a.user?.last_name) || seen.has(a.id)) continue;
    seen.add(a.id);
    for (let d = a.start_at.slice(0, 10); d <= a.end_at.slice(0, 10); d = addDays(d, 1)) day(d).off = String(a.reason_translated || 'Repos').slice(0, 40);
  }
  for (const d of Object.values(days)) d.s?.sort();
  const sorted = Object.fromEntries(Object.entries(days).sort());
  // Les congés posés loin ne comptent pas : au-delà du dernier service publié, c'est « pas encore publié ».
  const publishedUntil = Object.entries(sorted).filter(([, v]) => v.s).map(([k]) => k).at(-1) || today;
  const same = prev && JSON.stringify(prev.days) === JSON.stringify(sorted);
  const now = new Date().toISOString();
  return { name: 'Alexia', checkedAt: now, changedAt: same ? prev.changedAt : now, publishedUntil, days: sorted };
}

export function addDays(iso, n) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const future = (data, today) => Object.entries(data?.days || {}).filter(([k, v]) => v.s && k >= today).length;

const TZ = ['BEGIN:VTIMEZONE', 'TZID:Europe/Paris',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE'];

export function ics(data) {
  const z = s => s.replace(/[-:]/g, '');
  const txt = s => s.replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n');
  const stamp = `DTSTAMP:${z(data.checkedAt.slice(0, 19))}Z`;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Alexia//Horaires//FR', 'X-WR-CALNAME:Horaires Alexia 💛', 'X-WR-TIMEZONE:Europe/Paris',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H', 'X-PUBLISHED-TTL:PT1H', ...TZ];
  for (const [d, v] of Object.entries(data.days)) {
    for (const [a, b] of v.s || []) {
      const end = b < a ? addDays(d, 1) : d; // service qui finit après minuit
      lines.push('BEGIN:VEVENT', `UID:${d}-${z(a)}@alexia`, stamp, `DTSTART;TZID=Europe/Paris:${z(d)}T${z(a)}00`, `DTEND;TZID=Europe/Paris:${z(end)}T${z(b)}00`, `SUMMARY:🎬 Cinéma ${a}–${b}`, 'END:VEVENT');
    }
    if (v.off && !v.s) lines.push('BEGIN:VEVENT', `UID:${d}-off@alexia`, stamp, `DTSTART;VALUE=DATE:${z(d)}`, `DTEND;VALUE=DATE:${z(addDays(d, 1))}`, `SUMMARY:🌿 ${txt(v.off)}`, 'TRANSP:TRANSPARENT', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n'; // lignes toutes < 75 octets (libellés coupés à 40 caractères)
}

async function login() {
  const jar = new Map();
  const keep = r => r.headers.getSetCookie().forEach(c => { const [kv] = c.split(';'); const i = kv.indexOf('='); jar.set(kv.slice(0, i), kv.slice(i + 1)); });
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
  const page = await fetch(`${BASE}/users/sign_in`, { signal: AbortSignal.timeout(30000) });
  keep(page);
  const token = (await page.text()).match(/name="authenticity_token" value="([^"]+)"/)?.[1];
  if (!token) throw new Error('Page de connexion Cineplanner illisible');
  const body = new URLSearchParams({ authenticity_token: token, 'user[email]': process.env.CP_EMAIL, 'user[password]': process.env.CP_PASSWORD, 'user[remember_me]': '1' });
  const res = await fetch(`${BASE}/users/sign_in`, { method: 'POST', body, redirect: 'manual', headers: { cookie: cookie() }, signal: AbortSignal.timeout(30000) });
  keep(res);
  // Devise répond 302 ou 303 (Turbo) vers l'accueil si c'est bon, 422/200 ou un retour vers sign_in sinon.
  if (![302, 303].includes(res.status) || /sign_in/.test(res.headers.get('location') || '')) throw new Error(`Connexion Cineplanner refusée (code ${res.status}) : vérifier CP_EMAIL / CP_PASSWORD`);
  // RÈGLE DE SAM : on ne fait que LIRE Cineplanner, jamais rien modifier. Seule exception : le formulaire de connexion ci-dessus.
  return async path => {
    if (!path.startsWith('/api/v1/') || !path.includes('.json?')) throw new Error(`Lecture seule : ${path} refusé`);
    const r = await fetch(BASE + path, { method: 'GET', headers: { cookie: cookie(), accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error(`${path} → ${r.status}`);
    return r.json(); // une page HTML (session expirée) lève ici : rien n'est écrit
  };
}

async function main() {
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
  const { GIST_ID, GIST_TOKEN } = process.env;
  if (process.env.GITHUB_ACTIONS && !(GIST_ID && GIST_TOKEN)) throw new Error('Secret GIST_ID ou GIST_TOKEN manquant');
  const q = `start_at=${addDays(today, -14)}&end_at=${addDays(today, 150)}&view=week`;
  const get = await login();
  const [shifts, absences] = await Promise.all([get(`/api/v1/shifts.json?${q}&group_by=position`), get(`/api/v1/absences.json?${q}`)]);
  const gh = (method, body) => fetch(`https://api.github.com/gists/${GIST_ID}`, { method, body, headers: { authorization: `Bearer ${GIST_TOKEN}`, accept: 'application/vnd.github+json' } });
  let prev = null;
  if (GIST_ID) prev = await gh('GET').then(r => r.json()).then(g => JSON.parse(g.files['data.json'].content)).catch(() => null);
  const data = build(shifts, absences, today, prev);
  // Garde-fous : mieux vaut un planning un peu vieux qu'un planning effacé.
  const n = future(data, today), before = future(prev, today);
  if (!n) throw new Error('Aucun service à venir pour Alexia : on ne touche à rien');
  if (before >= 10 && before >= 5 * n) throw new Error(`Services à venir passés de ${before} à ${n} : suspect, on ne touche à rien`);
  const files = { 'data.json': JSON.stringify(data), 'alexia.ics': ics(data) };
  if (GIST_ID) {
    const r = await gh('PATCH', JSON.stringify({ files: Object.fromEntries(Object.entries(files).map(([k, content]) => [k, { content }])) }));
    if (!r.ok) throw new Error(`Gist → ${r.status}`);
  } else {
    mkdirSync('out', { recursive: true });
    for (const [k, v] of Object.entries(files)) writeFileSync(`out/${k}`, v);
  }
  console.log(`OK : ${n} services à venir, publié jusqu'au ${data.publishedUntil}`);
}

if (process.argv[1]?.endsWith('update.mjs')) main().catch(e => { console.error(e.message); process.exit(1); });
