# CLAUDE.md — PK-01, portfolio de Pinkoune

Mémoire des décisions du projet. À tenir à jour à chaque phase.

## Projet

Portfolio 3D gamifié de Jérémy Barcelo (Pinkoune), alternant DevOps / plateforme. On y visite un vaisseau
low-poly en orbite autour d'un trou noir (« la Pupille »), guidé par un pingouin rose. Cible : recruteurs
(après le diplôme de septembre 2027) et visiteurs curieux. Un **mode classique** (page scrollable, même
contenu, sans 3D) est toujours disponible.

## Références

- `design/` : export Claude Design, **référence visuelle à respecter**. `Pinkoune DA.dc.html` (identité,
  tokens), `Pinkoune #U00c9crans.dc.html` (maquettes), `Pinkoune HUD.dc.html`, `Pinkoune Motion.dc.html`,
  `pinkoune-3d.js` (trou noir, pingouin, vaisseau en three.js), `pk-motion.js` (timings).
  À ignorer : `support.js`, `.thumbnail`, `github.md`, `shots/`.
  Pour voir les maquettes : `python3 -m http.server` dans `design/` (les CDN unpkg sont bloqués dans le
  bac à sable cloud ; servir react/three depuis node_modules via `page.route` Playwright).
- Plan validé : 8 phases (voir plus bas).

## Décisions validées

- **Salles** (codes PK-01 → 07) : `bridge` Pont · `starmap` Carte stellaire · `arsenal` Arsenal ·
  `machines` Salle des machines · `logbook` Journal de bord · `quarters` Quartiers · `comms` Comms.
  Les noms de salle des maquettes (Labo, Armurerie, Archives, Hangar, Com) sont remplacés par ceux-ci.
  **Trophées** = écran récapitulatif des succès, ouvert depuis le compteur du HUD, toujours accessible
  (pas de verrou de rang).
- Brief prioritaire sur les maquettes : pas d'email de contact, pas de borne d'arcade ni de mini-jeu,
  vrais projets à la place des projets fictifs.
- **CMS** : Sveltia CMS sur `/admin` (phase 7), connexion GitHub sans serveur (PKCE ou token fin).
- **Niveaux Arsenal** : échelle de 1 à 5 proposée par Claude, marquée `TODO` dans `content/skills/*.yaml`,
  à valider par Jérémy.
- **Livraison** : on développe sur la branche de session, une PR vers `main` par phase, Jérémy merge
  (ce qui déploie). Chaque commit porte
  `Co-authored-by: Jérémy Barcelo <76524822+Pinkoune@users.noreply.github.com>` (adresse noreply pour ne
  pas exposer d'email), et la PR est assignée à `Pinkoune`.
- **i18n maison** (`src/i18n/`) au lieu de react-i18next : tous les textes vivent dans les YAML en
  `{ fr, en }` ; `useT()` expose `t()`, `ui(key, params)`, `name()`, `date()`. FR par défaut ; détection =
  première langue supportée dans `navigator.languages`.
- **Polices auto-hébergées** via `@fontsource-variable` (Archivo `wdth.css`, Martian Mono `wdth.css`,
  Instrument Sans `wght.css`). Familles CSS : `'Archivo Variable'`, `'Martian Mono Variable'`,
  `'Instrument Sans Variable'`.
- **Son** (phase 5) : Web Audio maison, désactivé par défaut, sons CC0 listés dans `CREDITS.md` ; note de
  basse synthétisée tant que le riff `public/audio/bass-riff.mp3` n'existe pas.
- **TypeScript 6.0.x** (et non 7) : typescript-eslint ne supporte pas encore TS ≥ 6.1.
- **Mode au démarrage** (`src/app/capabilities.ts`) : 3D par défaut ; classique d'office sans WebGL ou sur
  appareil faible (`deviceMemory`/`hardwareConcurrency` ≤ 2). Le choix explicite du visiteur
  (`preferredMode`, persisté) l'emporte, sauf si WebGL manque. La 3D est un `lazy()` : three.js n'est
  téléchargé qu'à l'embarquement.
- **Pas de drei** : `Html` de drei crée une racine React par hotspot (erreurs `removeChild` au démontage).
  Les hotspots sont des boutons DOM dans l'arbre principal (`HotspotLayer`), positionnés à chaque image
  par `HotspotProjector` depuis un registre d'ancres 3D (`three/hotspots.ts`).
- **Rendu** : `<Canvas flat>` (pas de tone mapping, comme la DA), DPR ≤ 1,75 desktop / 1,5 mobile.
- **Post-traitement** : bibliothèque `postprocessing` utilisée directement (`objects/PostFx.tsx`,
  EffectComposer en `useFrame` priorité 1), pas `@react-three/postprocessing` (dépendances n8ao/maath
  inutiles). Bloom seuil 0,62, allégé sur mobile. Conséquence : tout passe par un rendu linéaire réencodé
  en sRGB à la sortie — un ShaderMaterial maison doit sortir des couleurs **linéaires** (le shader de la
  Pupille fait `pow(col, 2.2)` en sortie).
- **Arrivée à bord** (`state.stage` : `boot` → `aboard`) : `BootScreen` (DOM, maquette A) au-dessus du
  canvas pendant l'approche (`IntroDirector` + `ExteriorShip`, timeline dans `three/intro.ts`) ; « Embarquer »
  (Entrée) → flash rose 300 ms → pont. Espace = passer. Visiteur connu (`introSeen`, persisté) ou lien
  profond `#/salle` : plan final 2 s puis embarquement automatique. Mouvement réduit : embarquement
  immédiat avec fondu 600 ms. Les salles sont masquées pendant l'approche, le vaisseau extérieur après.
- ESLint : `react-hooks/immutability` désactivée dans `src/three/` (muter les objets three dans
  `useFrame` est l'idiome R3F).

## Architecture

```
content/          YAML bilingues (site/, projects/, journey/, skills/, achievements/)
public/media/     captures des projets (référencées par `media[].src`, ex. media/projects/x.webp)
src/content/      schema.ts (Zod, source de vérité) · build.ts (assemblage pur + références croisées)
                  read.ts (Node : lecture YAML) · vite-plugin.ts (module virtuel `virtual:content`)
                  placement.ts (orbites auto des projets) · index.ts (accès typé côté client)
src/i18n/         lang.ts (pur) · useT.ts (hook)
src/state/        store.ts (Zustand + persist) · safeStorage.ts (localStorage protégé)
src/design/       tokens.css (DA) · tokens.ts (miroir pour la 3D)
src/motion/       easings.ts (courbes et `seg()` de pk-motion.js)
src/ui/           primitives.tsx (Diamond, Button, Tags, LevelGauge, LangSwitch…) · HoloPanel ·
                  panels/PanelHost (contenu des panneaux, partagé 3D/classique) · hud/ · Hotspot · BootScreen
src/classic/      mode classique (Header, sections/, SectionHeader)
src/three/        scène R3F chargée en lazy :
                  ShipExperience (Canvas + HUD + panneaux, clavier, balayage, #/salle) · Scene · CameraRig
                  layout.ts (plan : salles alignées sur X, coursive en z ≈ 7,4, Pupille en (6, 20, -340))
                  intro.ts + IntroDirector (approche) · TransitionOverlay (flash, fondu, vitesse, carton)
                  objects/ (BlackHole + shader porté, Starfield avec lentille, RoomShell + Corridor,
                  Penguin, Box, ExteriorShip, PostFx) · models/ (penguin, ship, materials : portages de pinkoune-3d.js)
                  rooms/ (une salle par fichier + RoomDoors) · Hotspot / HotspotLayer / hotspots.ts
src/app/          App (aiguillage classique / 3D) · capabilities.ts · hashRoom.ts
src/game/         (phase 4) XP, rangs, succès — TS pur
scripts/          validate-content.ts
tests/            Vitest (contenu, i18n, navigation, cadrage de l'intro)
```

Règles d'indépendance (vérifiées par ESLint `no-restricted-imports`) : `src/classic/` n'importe jamais
`three/` ni `@react-three/*`, et `src/three/` n'importe jamais `classic/`. Les deux partagent `src/ui/`.

### Contenu

- Le navigateur reçoit du JSON déjà validé (`virtual:content`) : ni YAML ni Zod dans le bundle.
- Contenu invalide = build en échec + `npm run validate:content` en échec, avec un message du type
  `content/projects/x.yaml › summary.en : traduction EN manquante`.
- `localized` est un `strictObject` : une virgule non protégée dans `{ fr: a, b, en: c }` crée une clé
  parasite et fait échouer la validation. **Mettre des guillemets** dès qu'un texte en flow-map contient
  une virgule ou deux-points.
- Microcopie : `content/site/ui.yaml`, clés listées dans `UI_KEYS` (schema.ts). Ajouter une clé = l'ajouter
  aux deux endroits.
- Projets : un fichier par projet, `order` pour l'ordre, `archived: true` pour la ceinture d'archives,
  `todo: [demo, media, year, repo]` pour les badges TODO, `planet:` pour surcharger le placement.
- Succès : `trigger.event` ∈ `GAME_EVENTS`, `count` = nombre ou `all`.

### Navigation à bord

- Salle courante dans le store (`room`), reflétée dans l'adresse `#/starmap` (`replaceState`).
  En revenant au classique, la page défile jusqu'à la section de la salle quittée.
- Panneau ouvert = `state.panel` (`{ kind: 'project', id }`, `profile`, `pupil`, `skills`, `pipeline`,
  `journey`, `passion`, `games`, `contact`). `PanelHost` le rend en `placement="side"` à bord,
  `"center"` en classique.
- Raccourcis : 1–7, ← →, C (classique), Échap (panneau). Mobile : balayage horizontal + flèches du HUD.
- Trajet caméra : spline porte arrière → coursive → salle, ease-io, 1,6 s entre voisines (1,9 s pour
  2 salles), fov +10° au milieu de la coursive, traits de vitesse et carton de salle (TransitionOverlay).
  Saut > 2 salles : deux segments, coupe au noir (fondu 38 % → 62 %, minuteries, pas d'images).
  Mouvement réduit : coupe + fondu 200 ms.
- Panneau holo (Motion III) : projecteur (losange + faisceau), cadre qui se déplie, contenu en cascade,
  titre tapé (texte complet pour les lecteurs d'écran), balayage ; fermeture inverse 0,6 s
  (Échap intercepté via `cancel`).

### Base path

`VITE_BASE` sinon `/Portfolio-overpowered/` pour `build` et `preview`, `/` pour `dev`.

## Tokens (DA vérifiée)

void #07060D · hull-900 #0D0C17 · hull-800 #151426 · hull-700 #201F36 · hull-600 #2E2C4A · line #3B3960 ·
line-soft #22213A · text #EEECF5 · text-dim #A29FBD · pink #FF5FA2 / soft #FFB8D5 / deep #B8286A ·
amber #FFB547 · core #FFF2DC · holo #5CE1E6. Rose = identité/XP, ambre = récompense/trou noir,
cyan = hologrammes/focus/liens ; jamais deux accents sur un même composant.
Rayon 0, bordures 1 px, coins coupés 8–12 px, grille 8 px, losange = repère.
Easings : out (.16,1,.3,1) · io (.65,0,.35,1) · back (.34,1.56,.64,1) losanges seulement.
Durées : 140 / 280 / 560 / 1800 ms.

## Commandes

`npm run dev` · `npm run build` · `npm run preview` · `npm run check` (lint, format, types, contenu, tests).

## Phases

1. ✅ Squelette : contenu, i18n, mode classique, CI + Pages.
2. ✅ Hub 3D : trou noir, vaisseau, salles, caméra, panneaux.
3. ✅ Ambiance : post-processing, intro, transitions.
4. Gamification : HUD, XP, rangs, succès, toasts, persistance.
5. Pingouin, quartiers, son.
6. Polish : perf, mobile, a11y, SEO, tests.
7. Mode éditeur (Sveltia sur /admin) + README « Mettre à jour le site ».
8. Hébergement homelab (Docker, GHCR, compose ou k3s + ArgoCD).

## Points ouverts (à reprendre)

- Mobile portrait : champ limité à 72°, certains hotspots sortent du cadre → phase 6.
- Carte stellaire : étiquettes de planètes qui se chevauchent par moments.
- Chunk 3D ≈ 1 Mo (280 ko gzip), surtout three.js → découpage / budget en phase 6.
- Le rendu logiciel (CI, Playwright + SwiftShader) tourne à ~1 image/s : les étapes intermédiaires des
  trajets ne sont pas capturables, seuls les états finaux et les bascules d'état le sont.
- `hero.webp` (mode classique) : rendu une fois en phase 1 depuis le code three.js de `design/` (élément
  `pk-blackhole` + `pk-penguin` de la maquette G, servi par `python3 -m http.server`). À refaire de la même
  façon si la DA change.

## À faire côté Jérémy

- Settings › Pages › Source = « GitHub Actions » (avant le premier merge sur main).
- Valider les niveaux de compétences, statuts et années des projets (`# TODO` dans les YAML).
- Fournir captures / démos (dossier `public/media/projects/`).
