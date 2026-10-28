# DESIGN-APPLE : guide de style de l'app d'Alexia

Chiffres vérifiés sur la HIG Apple (28/10/2026), en points = pixels CSS. Prochaine relecture : janvier 2027 (iOS 26.x).

## 1. Jetons CSS
```css
:root{
  --red:#FF3B30; --orange:#FF9500; --green:#34C759; --blue:#007AFF; --pink:#FF2D55;
  --bg:#F2F2F7;            /* systemGroupedBackground; Sam veut un blanc cassé : #FAF8F5 */
  --card:#FFFFFF; --ink:#000;                     /* grande carte « Upcoming » : --card-dark */
  --card-dark:#1C1C1E; --on-dark:#FFF;
  --label:#000; --label2:rgba(60,60,67,.6); --label3:rgba(60,60,67,.3);
  --sep:rgba(60,60,67,.29); --fill:rgba(120,120,128,.12);
  --rest:var(--green); --work:var(--blue); --today:var(--red);
  --font:-apple-system,"SF Pro Text","SF Pro Display",system-ui,"Segoe UI",sans-serif;
  --sp1:4px; --sp2:8px; --sp3:12px; --sp4:16px; --sp5:20px; --sp6:32px;   /* marge page = 16 */
  --r-chip:8px; --r-row:12px; --r-card:24px; --r-sheet:34px; --r-pill:999px;
  --shadow:0 1px 2px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.08);
  --ease:cubic-bezier(.32,.72,0,1);
}
@media (prefers-color-scheme:dark){:root{
  --red:#FF453A; --orange:#FF9F0A; --green:#30D158; --blue:#0A84FF; --pink:#FF375F;
  --bg:#000; --card:#1C1C1E; --card-dark:#2C2C2E; --label:#FFF;
  --label2:rgba(235,235,245,.6); --label3:rgba(235,235,245,.3);
  --sep:rgba(84,84,88,.6); --fill:rgba(120,120,128,.24);
  --shadow:none; }}
body{margin:0;background:var(--bg);color:var(--label);font:17px/22px var(--font);
  -webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%}
```
Échelle typo iOS (taille/interligne, pile `--font`) : Large Title 34/41 bold, Title 1 28/34, Title 2 22/28, Title 3 20/25, **Headline 17/22 semibold**, **Body 17/22**, Callout 16/21, Subhead 15/20, **Footnote 13/18**, Caption 1 12/16, Caption 2 11/13 (minimum absolu). Chiffres des jours : `font-variant-numeric:tabular-nums`. Étiquette de jour « LUN. » : 13 px, semibold, capitales, `--red` pour aujourd'hui (comme le widget Calendrier). Pour suivre la taille de texte choisie par Alexia : `font:-apple-system-body` en secours de `17px`.

Rayons : widget iOS ~22 à 24, carte 24, pastille ronde `50%`, barre pilule `999px`. Un élément dans un conteneur arrondi a un rayon plus petit (rayon parent moins marge).

## 2. Verre propre (Liquid Glass, en CSS)
Apple : le verre est pour la couche des contrôles et de la navigation (barre d'onglets, feuilles), jamais pour le contenu, et avec parcimonie.
```css
.glass{
  background:rgba(255,255,255,.62);
  -webkit-backdrop-filter:blur(24px) saturate(180%); backdrop-filter:blur(24px) saturate(180%);
  border:.5px solid rgba(255,255,255,.5);
  box-shadow:0 8px 32px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.6);
}
.nav{position:fixed;left:50%;transform:translateX(-50%);
  bottom:calc(8px + env(safe-area-inset-bottom)); border-radius:var(--r-pill);padding:6px;}
@media (prefers-color-scheme:dark){.glass{background:rgba(44,44,46,.6);border-color:rgba(255,255,255,.12)}}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.glass{background:var(--card)}}
@media (prefers-reduced-transparency:reduce),(prefers-contrast:more){.glass{background:var(--card);backdrop-filter:none;-webkit-backdrop-filter:none;border:1px solid var(--sep)}}
```
Pour la pilule noire de la référence de Sam : `background:rgba(20,20,22,.78)` + même flou, icônes blanches, onglet actif en pastille `rgba(255,255,255,.16)`. Toujours le préfixe `-webkit-` (Safari iOS). Garde le contenu défilant sous la barre avec `padding-bottom:calc(88px + env(safe-area-inset-bottom))`.

## 3. Réglages PWA iOS
```html
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Horaires">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#FAF8F5" media="(prefers-color-scheme:light)">
<meta name="theme-color" content="#000000" media="(prefers-color-scheme:dark)">
<meta name="format-detection" content="telephone=no">
<link rel="apple-touch-icon" href="icon-180.png">   <!-- 180x180, carré, sans coins arrondis ni transparence -->
<link rel="manifest" href="manifest.webmanifest">    <!-- display:standalone, icônes 192 et 512 -->
```
- `black-translucent` : le contenu passe sous l'heure et la batterie, donc `padding-top:env(safe-area-inset-top)` obligatoire (barre d'état 47 à 59 pt selon l'iPhone, ne jamais coder en dur). Côtés et bas : `env(safe-area-inset-left|right|bottom)` (bas ~34 pt, indicateur d'accueil).
- `html,body{overscroll-behavior:none}` et `-webkit-tap-highlight-color:transparent`, `user-select:none` sauf sur le texte utile.
- Pas de tailles de police fixes qui bloquent le zoom ; ne pas mettre `user-scalable=no`. Les champs de saisie font au moins 16 px (sinon Safari zoome).
- Alexia doit ajouter l'app à l'écran d'accueil via Partager puis « Sur l'écran d'accueil » (pas d'installation automatique sur iOS).

## 4. Motion
Ressort court, fin, discret. Entrée d'élément 250 à 350 ms, retour tactile 100 à 150 ms.
```css
.tap{transition:transform .2s var(--ease)} .tap:active{transform:scale(.97)}
.in{animation:in .35s var(--ease) both} @keyframes in{from{opacity:0;transform:translateY(8px)}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
```
Pas d'animation sur les gestes fréquents (changer de semaine). Les easter eggs : une surprise rare, courte (moins de 1,5 s), jamais bloquante, désactivée par reduced-motion (texte seul).

## 5. Widgets
- Tailles iPhone (pt) : petit 158x158, moyen 338x158, grand 338x354 (iPhone récent type 6,1"). Marge standard 16, serrée 11. Rayon du contenu concentrique au rayon du widget.
- Un widget = une info lisible en 1 à 2 secondes : prochain repos en gros, 2 à 3 lignes au plus. Pas d'interaction fine.
- Scriptable : `ListWidget`, fond `Color.dynamic(clair, sombre)`, `Font.systemFont(size, weight)`, ne pas dépasser ~3 lignes en petit. Calendrier .ics : les couleurs d'événement viennent du calendrier abonné (une couleur « repos » dédiée) ; l'iPhone décide du rafraîchissement.
- Widget « Up Next » en référence : jour en capitales rouges 13 pt, gros numéro (~34 pt), barre verticale colorée par événement.

## 6. Règles UX : voir ses horaires et ses repos d'un coup d'œil
1. **Le repos d'abord.** Ouverture sur « Prochain repos : jeudi 5 » en Large Title et en vert, puis « Aujourd'hui » en dessous.
2. **Deux états, deux formes.** Repos = pastille pleine verte + libellé ; travail = anneau/gris avec l'heure de début en dessous. Jamais la couleur seule (daltonisme).
3. **Horaires coupés lisibles.** Deux créneaux sur deux lignes ou « 13:15 – 16:30 · 17:30 – 22:45 » en `tabular-nums` ; durée totale en Footnote gris. Format 24 h.
4. **Aujourd'hui toujours repérable** : numéro rouge (`--today`) ou anneau, jamais caché hors écran ; ouvrir la vue centrée dessus.
5. **14 jours en un écran** (2 rangées de 7) dans la carte sombre ; chaque pastille 44 pt minimum, appui = détail dans une feuille (sheet) qu'on ferme en glissant.
6. **Zéro configuration à l'ouverture** : pas de login, pas de popup ; données locales, affichage instantané, hors ligne.
7. **Densité calme** : une info principale par bloc, 16 pt de marge, séparateurs `0.5px` (`--sep`), pas d'ombres lourdes en sombre.
8. **Tendresse rare.** Easter eggs cachés (appui long sur un cœur, un jour spécial, 100e visite) ; jamais sur le chemin de la lecture des horaires.

## Sources
- Typography (tailles, 17 pt défaut, 11 pt min.) : https://developer.apple.com/design/human-interface-guidelines/typography
- Color (clair/sombre, contraste augmenté, pas de couleur seule) : https://developer.apple.com/design/human-interface-guidelines/color
- Dark Mode (fonds base/élevé) : https://developer.apple.com/design/human-interface-guidelines/dark-mode
- Materials / Liquid Glass (couche des contrôles, parcimonie, transparence réduite) : https://developer.apple.com/design/human-interface-guidelines/materials
- Layout (safe areas, marges) : https://developer.apple.com/design/human-interface-guidelines/layout
- Accessibility (44x44 pt, contraste 4.5:1 et 3:1) : https://developer.apple.com/design/human-interface-guidelines/accessibility
- Buttons (zone tactile 44x44 pt) : https://developer.apple.com/design/human-interface-guidelines/buttons
- Tab bars (barre flottante) : https://developer.apple.com/design/human-interface-guidelines/tab-bars
- Motion (bref, optionnel, Reduce Motion) : https://developer.apple.com/design/human-interface-guidelines/motion
- Widgets (tailles 158/338/354, marges 16 et 11) : https://developer.apple.com/design/human-interface-guidelines/widgets
- Meta tags Safari iOS (capable, status-bar-style) : https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html
- Couleurs système hex (valeurs UIKit largement publiées, non listées en hex sur la HIG) : https://developer.apple.com/design/human-interface-guidelines/color#System-colors
- Lecture des pages HIG en JSON : https://developer.apple.com/tutorials/data/design/human-interface-guidelines/typography.json
