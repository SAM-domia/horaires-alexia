# Horaires d'Alexia : mode d'emploi

## Pour Alexia (et Sam), sur iPhone
1. Ouvrir dans **Safari** le lien que Sam envoie (il finit par `#` + le code).
2. Bouton Partager → **Sur l'écran d'accueil**. C'est tout : l'app se met à jour toute seule.
   En haut de l'app : « À jour · vérifié il y a 12 min ». Point orange = pas de nouvelles depuis plus de 3 h.

### Widget, au choix
- **Calendrier iPhone** (le plus simple) : Réglages → Calendrier → Comptes → Ajouter un compte → Autre → Ajouter un calendrier avec abonnement → coller le lien `.ics` que Sam envoie. Puis le widget « Calendrier » sur l'écran d'accueil montre les prochains services et repos.
- **Widget sur mesure** : installer l'app gratuite **Scriptable**, nouveau script, coller `widget-scriptable.js` (le code y est déjà), puis ajouter un widget Scriptable (petit ou moyen) et choisir ce script.

## Les petits secrets (ne pas lui dire 🤫)
Pour l'instant, ils font seulement pleuvoir des cœurs : les messages sont à écrire par Sam,
en haut du script de `index.html` :
- `SECRET` : 5 appuis rapides sur « Coucou Alexia ».
- `MOTS` : le mot du jour sous « Aujourd'hui », et un au hasard en touchant ♥ (aussi dans `widget-scriptable.js`).
- `COEUR_CACHE` : appui long sur ♥.
- `MOT_AUJOURDHUI` : toucher deux fois la pastille d'aujourd'hui.
- `DATES` : un message pour une date précise, ex. `{ '02-14': '…' }`.

## Télétravail
Alexia touche un jour de repos → « Télétravail ». C'est partagé (toi, le widget, le calendrier) via le
petit service Cloudflare `horaires-alexia.sam-domia.workers.dev` (dossier `worker/`). Cineplanner n'est jamais modifié.

## Côté Sam : la mise en route (une seule fois)
Le robot (`update.mjs`) tourne sur GitHub toutes les 30 min, même PC éteint. Il a besoin de 4 secrets,
à entrer **toi-même** dans un terminal (rien ne s'affiche quand tu tapes, c'est normal) :
```
gh secret set CP_EMAIL -R SAM-domia/horaires-alexia
gh secret set CP_PASSWORD -R SAM-domia/horaires-alexia
gh secret set GIST_TOKEN -R SAM-domia/horaires-alexia
```
- `CP_EMAIL` / `CP_PASSWORD` : le compte Cineplanner d'Alexia.
- `GIST_TOKEN` : à créer sur https://github.com/settings/tokens/new?scopes=gist&description=horaires-alexia (case « gist » seule, expiration « No expiration »).
- `GIST_ID` est déjà posé par Claude.

Si Alexia change son mot de passe Cineplanner : refaire `gh secret set CP_PASSWORD …`, sinon le point devient orange.

## Vérifier sur le PC
- `node test.mjs` : rejoue un vrai relevé (fichier `fixture.txt`, gardé hors du dépôt).
- Aperçu : lancer le serveur local et ouvrir `http://localhost:8137/#local`.
