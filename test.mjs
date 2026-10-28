// Vérif : node test.mjs (rejoue un vrai relevé d'Alexia du 28/10/2026, fixture.txt)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { build, ics, future } from './update.mjs';

const [S, A] = readFileSync(new URL('fixture.txt', import.meta.url), 'utf8').trim().split(' # ');
const d = x => `20${x.slice(0, 2)}-${x.slice(2, 4)}-${x.slice(4, 6)}`, t = x => `${x.slice(0, 2)}:${x.slice(2)}`;
const shifts = S.split(' ').map(x => ({ title: 'ALEXIA FOUTEAU', start: `${d(x)}T${t(x.slice(6, 10))}:00.000+01:00`, end: `${d(x)}T${t(x.slice(10))}:00.000+01:00`, extendedProps: { userName: 'ALEXIA FOUTEAU', draft: false } }));
shifts.push({ title: 'LINDSAY DIOTEL', start: '2026-10-29T10:00:00+01:00', end: '2026-10-29T12:00:00+01:00', extendedProps: { userName: 'LINDSAY DIOTEL' } });
const ab = A.split(' ').map((x, i) => ({ id: String(i), user: { last_name: 'FOUTEAU' }, start_at: d(x) + 'T00:00:00', end_at: d(x.slice(6)) + 'T23:59:59', reason_translated: 'Repos' }));
const absences = { a: ab, b: ab.slice(0, 2) }; // l'API répète une absence sur chaque jour

const data = build(shifts, absences, '2026-10-28', null);
assert.deepEqual(data.days['2026-10-27'].s, [['13:15', '16:30'], ['17:30', '21:45']]);
assert.equal(data.days['2026-10-29'].off, 'Repos');
assert.equal(data.days['2026-10-30'].off, 'Repos');
assert.equal(data.days['2026-10-29'].s, undefined, 'une collègue ne doit pas apparaître');
assert.equal(data.days['2026-11-12'].off, 'Repos', 'absence sur plusieurs jours');
assert.equal(data.publishedUntil, '2027-01-05');
const again = build(shifts, absences, '2026-10-28', { ...data, changedAt: 'avant' });
assert.equal(again.changedAt, 'avant', 'pas de changement → date de modif conservée');
const cal = ics(data);
assert.match(cal, /DTSTART;TZID=Europe\/Paris:20261215T200000\r\nDTEND;TZID=Europe\/Paris:20261216T030000/, 'service après minuit');
assert.match(cal, /DTSTART;VALUE=DATE:20261029/);
assert.match(cal, /BEGIN:VTIMEZONE/);
assert.ok(cal.split(/\r\n/).every(l => Buffer.byteLength(l) <= 75), 'lignes ics <= 75 octets');
// Congé posé loin : ne doit pas faire croire que février est publié
const far = build(shifts, { x: [{ id: 'f', user: { last_name: 'FOUTEAU' }, start_at: '2027-02-10T00:00:00', end_at: '2027-02-14T23:59:59', reason_translated: 'Congés <payés>' }] }, '2026-10-28', null);
assert.equal(far.publishedUntil, '2027-01-05');
// Brouillon : marqué, pas compté comme service ; heure UTC convertie en heure de Paris
const dr = build([{ title: 'ALEXIA FOUTEAU', start: '2026-11-03T12:15:00Z', end: '2026-11-03T15:30:00Z', extendedProps: { userName: 'ALEXIA FOUTEAU', draft: true } },
  { title: 'ALEXIA FOUTEAU', start: '2026-11-04T12:15:00Z', end: '2026-11-04T15:30:00Z', extendedProps: { userName: 'ALEXIA FOUTEAU' } }], {}, '2026-10-28', null);
assert.deepEqual(dr.days['2026-11-03'], { draft: true });
assert.deepEqual(dr.days['2026-11-04'].s, [['13:15', '16:30']]);
assert.equal(future(build([], absences, '2026-10-28', null), '2026-10-28'), 0, 'planning vide détecté');
mkdirSync('out', { recursive: true });
writeFileSync('out/data.json', JSON.stringify(data));
writeFileSync('out/alexia.ics', cal);
console.log('OK, tests passés');
// Télétravail coché : dans le calendrier, même un jour absent des données, et à la place du repos
const withTT = { ...data, tt: { '2026-10-29': 'tt', '2026-10-28': 'tt' } };
const calTT = ics(withTT);
assert.equal((calTT.match(/Télétravail/g) || []).length, 2);
assert.doesNotMatch(calTT, /UID:2026-10-29-off@alexia\r\nDTSTAMP:[^\r]+\r\nDTSTART;VALUE=DATE:20261029\r\nDTEND;VALUE=DATE:20261030\r\nSUMMARY:🌿/);
console.log('OK, télétravail');
