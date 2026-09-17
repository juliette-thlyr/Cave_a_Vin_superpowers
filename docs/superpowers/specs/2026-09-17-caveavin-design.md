# CaveAVin — Design

## Aperçu

CaveAVin est une application de gestion d'inventaire de cave à vin personnelle. Elle permet de suivre les bouteilles possédées (dont leur mode d'acquisition), leur fenêtre de dégustation optimale, les dégustations passées (notes, commentaires, occasion), et les accords mets-vin suggérés par le producteur.

## Utilisateurs et périmètre

- **v1** : usage strictement personnel, un seul utilisateur.
- **Évolution prévue** (hors périmètre v1) : partage de la cave avec un foyer. Le modèle de données est conçu pour permettre cette extension sans migration destructrice, mais rien n'est construit pour cela en v1.
- Connexion internet supposée disponible en permanence pendant l'utilisation de l'app. Pas de mode hors-ligne en v1.

## Non-objectifs (v1)

- Pas d'application mobile native (pas de publication App Store / Play Store).
- Pas de mode hors-ligne.
- Pas d'extraction automatique des informations d'un vin par IA ou service payant (voir section Enrichissement).
- Pas de scan d'étiquette ou de code-barres.
- Pas de gestion multi-utilisateurs/foyer.

## Architecture

Trois blocs :

1. **Frontend — Progressive Web App (PWA)** : application web réactive (tableau de bord, formulaires, listes, fiches bouteille), installable sur mobile via "Ajouter à l'écran d'accueil". Un seul code pour web et mobile, pas de build natif séparé.
2. **Backend — Supabase** : base de données Postgres (vins, bouteilles, dégustations, utilisateurs), authentification (email/mot de passe ou lien magique), stockage de fichiers (photos de dégustation). Utilisé sur son tier gratuit.
3. **Assistance à l'enrichissement** : au moment de l'ajout d'une bouteille, un lien ouvre une recherche web pré-remplie (nom/producteur/millésime) dans un nouvel onglet, pour aider l'utilisatrice à trouver cépage/appellation/fenêtre de dégustation/accords mets-vin, qu'elle recopie ensuite manuellement dans le formulaire. Aucune extraction automatique n'a lieu en v1 (voir ci-dessous).

Le frontend communique uniquement avec Supabase pour la persistance des données. Il n'y a pas d'appel serveur vers un service tiers d'enrichissement en v1 : le lien de recherche assistée s'ouvre côté client et ne transite pas par le backend.

## Enrichissement des informations de vin

Il n'existe pas de base de données gratuite et fiable couvrant cépage/appellation/fenêtre de garde/accords pour l'ensemble des vins existants. Trois options ont été évaluées :

- **Recherche web + extraction par IA (LLM)** : la plus fiable et flexible, mais génère un coût par appel (faible mais non nul) — écartée pour la v1 au profit d'un fonctionnement 100% gratuit.
- **API de base de données vin dédiée** : aucune option gratuite et fiable identifiée pour ces données précises — écartée.
- **Lien de recherche assistée (retenue pour la v1)** : l'app pré-remplit une recherche web et ouvre un nouvel onglet ; l'utilisatrice recopie manuellement les informations pertinentes dans le formulaire. Coût nul, aucune dépendance technique externe.

**Point d'extension futur (hors périmètre v1)** : un bouton "recherche approfondie" pourrait être ajouté sur une fiche bouteille, affichant un coût estimé pour un enrichissement automatique via IA, et ne déclenchant l'appel payant qu'après confirmation explicite de l'utilisatrice. Le modèle de données (champ `source` sur les informations du vin) est compatible avec cet ajout ultérieur, mais rien de ce mécanisme n'est implémenté en v1.

## Modèle de données

- **User** — géré par l'authentification Supabase. Possède ses `BottleInstance`.
- **Wine** — la référence d'un vin, partagée par toutes les bouteilles identiques :
  - nom, producteur, millésime, appellation, cépage, région
  - fenêtre de dégustation optimale suggérée (modifiable manuellement)
  - accords mets-vin suggérés (saisis manuellement ou recopiés depuis une recherche)
  - source des informations (`manuelle` ou `recherche assistée`)
- **BottleInstance** — une bouteille physique, liée à un `Wine` :
  - mode d'acquisition (achat, cadeau, héritage, gagnée, autre)
  - lieu / source d'acquisition
  - prix payé
  - date d'acquisition
  - statut (`en_cave` ou `consommée`)
  - Ajouter plusieurs bouteilles identiques d'un coup crée plusieurs `BottleInstance` liées au même `Wine`, avec les mêmes informations d'acquisition (modifiables individuellement ensuite).
- **TastingRecord** — une dégustation, liée à une `BottleInstance` précise :
  - note chiffrée
  - commentaire libre
  - date de dégustation
  - compagnie / occasion
  - photo (optionnelle)
  - Créer un `TastingRecord` bascule automatiquement le statut de la `BottleInstance` liée en `consommée`.

## Parcours utilisateur clés

- **Tableau de bord** : vue d'ensemble de la cave (nombre de bouteilles, valeur totale estimée) et liste des bouteilles "à boire bientôt" (fenêtre de dégustation optimale proche ou dépassée).
- **Ajouter une ou plusieurs bouteilles** : formulaire avec les informations du vin et de l'acquisition (mode, lieu, prix, date). Un champ "quantité" détermine combien de `BottleInstance` sont créées (il n'est pas stocké en tant que tel : chaque bouteille physique reste une ligne distincte). Bouton "rechercher sur internet" ouvrant un onglet pré-rempli.
- **Consulter/filtrer la cave** : liste des bouteilles en cave, filtrable par cépage, région, millésime, statut.
- **Fiche bouteille** : informations du `Wine` et de la `BottleInstance`, historique de dégustation d'un vin similaire déjà goûté le cas échéant.
- **Déguster une bouteille** : depuis la fiche bouteille, action "j'ai bu cette bouteille" ouvrant le formulaire de dégustation et basculant le statut en `consommée`.
- **Historique des dégustations** : liste des bouteilles consommées avec leurs notes, triable (ex: mieux notées d'abord).

## Gestion des erreurs

- Validation côté client des champs obligatoires (nom du vin, mode d'acquisition, date d'acquisition) avec messages d'erreur explicites.
- En cas d'indisponibilité de l'authentification ou de la base de données, affichage d'un message d'erreur clair plutôt qu'un échec silencieux.

## Tests

- Tests automatisés sur la logique métier : calcul du statut "à boire bientôt", bascule automatique en `consommée` lors de la création d'un `TastingRecord`.
- Tests sur les parcours principaux : ajout de bouteille(s), dégustation, filtrage de la cave.
- Approche TDD suivie lors de l'implémentation (skill `test-driven-development`).

## Hébergement

- Frontend déployé gratuitement sur Vercel ou Netlify.
- Backend Supabase (tier gratuit) pour la base de données, l'authentification et le stockage des photos.
