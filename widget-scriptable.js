// Widget « Horaires d'Alexia » pour l'app Scriptable (iPhone). Coller tout ce fichier dans un nouveau script.
const CODE = "COLLE_ICI_LE_CODE"; // le code secret (même que dans le lien de l'app)
const APP = `https://sam-domia.github.io/horaires-alexia/#${CODE}`;
const MOTS = ["Je suis fier de toi 💛", "Je t'aime ❤️", "Tu es incroyable ✨", "Courage, mon amour 💪", "Câlin ce soir 🫶"];

const fm = FileManager.local(), cache = fm.joinPath(fm.documentsDirectory(), "alexia.json");
let data;
try {
  const r = new Request(`https://gist.githubusercontent.com/SAM-domia/${CODE}/raw/data.json?t=${Date.now()}`);
  data = await r.loadJSON();
  if (!data || !data.days) throw new Error('vide');
  fm.writeString(cache, JSON.stringify(data));
} catch (e) { try { data = JSON.parse(fm.readString(cache)); } catch (_) { data = null; } }

const iso = d => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 10); };
const add = (s, n) => { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return iso(d); };
const info = d => { const v = data.days[d] || {}; if (!v.s && data.tt && data.tt[d]) return { work: true, tt: true, txt: "Télétravail 🏠" }; return v.s ? { work: true, txt: v.s.map(x => x.join(" – ")).join("\n") } : (v.off || (!v.draft && d <= data.publishedUntil)) ? { rest: true, txt: v.off || "Repos" } : { txt: "Pas encore publié" }; };
const green = Color.dynamic(new Color("#248A3D"), new Color("#30D158")), dot = Color.dynamic(new Color("#34C759"), new Color("#30D158")), grey = Color.dynamic(new Color("#3C3C43", .6), new Color("#EBEBF5", .6));
const indigo = Color.dynamic(new Color("#5856D6"), new Color("#5E5CE6"));
const red = Color.dynamic(new Color("#FF3B30"), new Color("#FF453A")), ink = Color.dynamic(Color.black(), Color.white());

const w = new ListWidget();
w.backgroundColor = Color.dynamic(new Color("#FAF8F5"), new Color("#1C1C1E"));
w.url = APP;
w.refreshAfterDate = new Date(Date.now() + 30 * 6e4);
const small = config.widgetFamily === "small";
const t = (s, size, color = ink, weight = "regular") => { const x = w.addText(s); x.font = Font[weight === "bold" ? "boldSystemFont" : weight === "semibold" ? "semiboldSystemFont" : "systemFont"](size); x.textColor = color; x.lineLimit = 2; x.minimumScaleFactor = .7; return x; };

if (!data) { t("Ouvre l'app une fois 💌", 15); }
else {
  const today = iso(new Date()), now = info(today);
  t(new Date().toLocaleDateString("fr-FR", { weekday: "long" }).toUpperCase(), 12, red, "semibold");
  w.addSpacer(2);
  if (now.rest) t("Repos 🌿", small ? 26 : 28, green, "bold");
  else t(now.txt, small ? 17 : 16, now.tt ? indigo : ink, "semibold");
  w.addSpacer(small ? 6 : 3);
  let next = null;
  for (let d = add(today, 1); d <= add(today, 60); d = add(d, 1)) { const x = info(d); if (x.rest) { next = d; break; } if (!x.work) break; }
  if (now.rest) {
    for (let d = add(today, 1); d <= add(today, 30); d = add(d, 1)) {
      const x = info(d); if (!x.work && !x.rest) break;
      if (x.work) { if (x.tt) { t(`Télétravail ${d === add(today, 1) ? "demain" : new Date(d + "T12:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })}`, 13, grey, "semibold"); break; } const day = d === add(today, 1) ? "demain" : new Date(d + "T12:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }); t(`Reprise ${day} · ${data.days[d].s[0][0]}`, 13, grey, "semibold"); break; }
    }
  }
  if (!now.rest && next) {
    const label = next === add(today, 1) ? "demain" : new Date(next + "T12:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
    t(`Prochain repos : ${label}`, 13, green, "semibold");
  }
  if (!small) {
    w.addSpacer(6);
    const row = w.addStack(); row.spacing = 6;
    for (let i = 0; i < 7; i++) {
      const d = add(today, i), x = info(d), c = row.addStack();
      c.size = new Size(28, 28); c.cornerRadius = 14; c.centerAlignContent();
      c.backgroundColor = x.rest ? dot : x.tt ? indigo : Color.dynamic(new Color("#787880", .16), new Color("#787880", .32));
      const n = c.addText(String(+d.slice(8))); n.font = Font.semiboldSystemFont(12); n.textColor = x.rest ? Color.black() : x.tt ? Color.white() : ink;
    }
  }
  w.addSpacer();
  const mins = Math.round((Date.now() - new Date(data.checkedAt)) / 6e4);
  const age = mins < 60 ? `${mins} min` : `${Math.round(mins / 60)} h`;
  t(small ? `à jour · ${age}` : `${MOTS[new Date().getDate() % MOTS.length]}  ·  à jour il y a ${age}`, 11, mins > 180 ? red : grey);
}
Script.setWidget(w);
if (!config.runsInWidget) await w.presentMedium();
Script.complete();
