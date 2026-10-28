# Horaires d'Alexia : mode d'emploi

## Pour Alexia (et Sam), sur iPhone
1. Ouvrir dans **Safari** le lien que Sam envoie (il finit par `#` + le code).
2. Bouton Partager → **Sur l'écran d'accueil**. C'est tout : l'app se met à jour toute seule.
   En haut de l'app : « À jour · vérifié il y a 12 min ». Point orange = pas de nouvelles depuis plus de 3 h.

### Widget, au choix
- **Calendrier iPhone** (le plus simple) : Réglages → Calendrier → Comptes → Ajouter un compte → Autre → Ajouter un calendrier avec abonnement → coller le lien `.ics` que Sam envoie. Puis le widget « Calendrier » sur l'écran d'accueil montre les prochains services et repos.
- **Widget sur mesure** : installer l'app gratuite **Scriptable**, nouveau script, coller `widget-scriptable.js` (le code y est déjà), puis ajouter un widget Scriptable (petit ou moyen) et choisir ce script.

## Les petits secrets (ne pas lui dire 🤫)
- 5 appuis rapides sur « Coucou Alexia » : pluie de cœurs + mot de Sam.
- Appui court sur ♥ : un mot doux au hasard. Appui long : le cœur caché.
- Toucher deux fois la pastille d'aujourd'hui.
- Le 14 février (et les dates ajoutées dans `special`, dans `index.html`).
- Un mot doux différent chaque jour, et un message les soirs de fermeture.
Les textes sont en haut du script de `index.html` (`MOTS`, `SECRET`), modifiables librement.

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
