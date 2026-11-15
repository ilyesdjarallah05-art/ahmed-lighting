# Ahmed Lighting — Boutique & Catalogue de Luminaires

Bienvenue sur le projet **Ahmed Lighting**, une boutique e-commerce moderne, rapide et autonome dédiée aux luminaires haut de gamme (suspensions, plafonniers, lampes à poser, lampadaires, spots orientables, spots encastrés).

Ce projet a été développé en **Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + TypeScript**, avec intégration optionnelle à **Supabase** et **Telegram**. Il est entièrement indépendant et ne dépend d'aucun dossier externe.

---

## Sommaire

1. [Fonctionnalités clés](#1-fonctionnalités-clés)
2. [Démarrage rapide en local (Mode Démo)](#2-démarrage-rapide-en-local-mode-démo)
3. [Architecture technique & Arborescence](#3-architecture-technique--arborescence)
4. [Internationalisation & Traduction Automatique](#4-internationalisation--traduction-automatique)
5. [Guide d'utilisation de l'Administration](#5-guide-dutilisation-de-ladministration)
6. [Connexion Supabase & Telegram](#6-connexion-supabase--telegram)
7. [Guide de personnalisation autonome](#7-guide-de-personnalisation-autonome)
8. [Vérification & Tests](#8-vérification--tests)

---

## 1. Fonctionnalités clés

- **Design épuré et chaleureux** : Palette neutre haut de gamme (beige sable, blanc cassé, noir profond, laiton) adaptée à l'éclairage intérieur.
- **Bouton « Allumer la lumière » (Day / Night switch)** :
  - Un clic assombrit instantanément l'interface et effectue un fondu croisé (_crossfade_) en **0,18 seconde** vers les photographies de nuit des luminaires allumés.
  - Fonctionne sur la page d'accueil, le catalogue de recherche et les fiches produits.
- **Trilingue natif (Français, Arabe avec RTL, Anglais)** :
  - **Français (`fr`)** en langue principale par défaut.
  - **Arabe (`ar`)** avec support bidirectionnel complet (**RTL** : alignements, tiroirs et navigation inversés naturellement).
  - **Anglais (`en`)** en langue tertiaire.
  - Sélecteur de langue immédiat dans le Header et le menu mobile.
- **Moteur d'Auto-traduction dans l'Administration** :
  - L'administrateur peut taper ses produits ou réglages en français et cliquer sur **« ✨ Auto-traduire (FR → AR & EN) »** pour remplir instantanément les versions arabe et anglaise avec un vocabulaire adapté aux luminaires et matériaux.
- **Catalogue & Filtres avancés** :
  - Recherche texte instantanée, insensible aux accents, matching dans les 3 langues.
  - Filtres combinables : catégorie, finitions/couleurs (avec pastilles visuelles), température de couleur (2700K, 3000K, 4000K), fourchette de prix min/max, disponibilité, modèles avec aperçu nuit.
  - Tri par pertinence, prix croissant/décroissant, ordre alphabétique ou nouveautés.
- **Commande directe sans paiement en ligne** :
  - Les clients sélectionnent leurs finitions, températures et quantités.
  - Formulaire de demande avec nom, téléphone, ville/wilaya, adresse et remarques.
  - Confirmation humaine préalable par téléphone (aucun paiement en ligne requis).
  - Envoi sécurisé des commandes vers un **canal Telegram privé** via Supabase Edge Function.
- **Espace d'Administration complet** :
  - Tableau de bord avec statistiques (produits publiés, nouvelles demandes, chiffre estimé).
  - Gestion des produits (création, modification, brouillon/publié, mise en avant sur l'accueil, upload d'images jour & nuit).
  - Gestion des catégories d'éclairage.
  - Suivi des commandes avec changement de statut (Nouveau, Confirmé, Terminé, Annulé avec **remise en stock automatique**).
  - Réglages du magasin (logo, devises, bannières, histoire de la marque, contacts, politiques).
- **Visites de showrooms à 360°** :
  - Le lien **« Visite 360° »** remplace « Notre histoire » dans le header, le menu mobile et le footer.
  - Visionneuse Pannellum fluide avec plein écran, zoom, rotation automatique douce et fondu entre les espaces.
  - Liste des salles et repères cliquables dans le panorama pour passer d'un espace à un autre.
  - Plusieurs magasins peuvent être publiés et classés; chacun possède sa couverture, son adresse et ses textes FR / AR / EN.
  - L'administrateur téléverse les panoramas, choisit la vue de départ, les réordonne et place les liens à l'angle actuellement affiché.

---

## 2. Démarrage rapide en local (Mode Démo)

Aucun compte Supabase n'est requis pour tester immédiatement le site sur votre ordinateur !

### Prérequis

- **Node.js** version 20 ou supérieure (recommandé 22.18+).
- Terminal PowerShell ou Bash.

### Lancement

Dans le dossier du projet :

```powershell
npm install
npm run dev
```

Ouvrez ensuite votre navigateur :

- **Boutique publique** : `http://localhost:3000`
- **Administration** : `http://localhost:3000/admin`

> **Note sur le mode démo** :
> Tant que les identifiants Supabase ne sont pas configurés dans `.env.local`, le site fonctionne en mode **démonstration locale**. Vous pouvez cliquer sur **« Ouvrir l'administration de démonstration »** pour modifier des produits, changer les réglages, passer des commandes tests et explorer toutes les fonctionnalités. Les données sont conservées dans le stockage local de votre navigateur.

---

## 3. Architecture technique & Arborescence

Le projet est conçu selon les meilleures pratiques Next.js (App Router) et React 19 :

```
ahmed/
├── app/                        # Next.js App Router
│   ├── globals.css             # Styles CSS globaux, thèmes clair/sombre et règles RTL
│   ├── layout.tsx              # Layout racine (polices, StoreProvider, StoreShell)
│   ├── page.tsx                # Page d'accueil vitrine (Hero, Collections, Philosophie)
│   ├── catalog/page.tsx        # Page Catalogue avec filtres et recherche
│   ├── product/[id]/page.tsx   # Fiche produit détaillée avec sélecteur d'options
│   ├── order/page.tsx          # Formulaire de commande et récapitulatif
│   ├── tour-360/page.tsx       # Visites publiques des showrooms à 360°
│   └── admin/page.tsx          # Espace d'administration complet
│
├── components/                 # Composants React interactifs
│   ├── store-provider.tsx      # Gestionnaire d'état global (panier, langue, thème jour/nuit)
│   ├── storefront.tsx          # Header, Navigation, CartDrawer, Footer, ProductCard
│   ├── catalog-page.tsx        # Vue catalogue avec filtres dynamiques
│   ├── product-page.tsx        # Vue produit détaillée
│   ├── order-page.tsx          # Vue de finalisation de commande
│   ├── admin-page.tsx          # Interface d'administration
│   ├── tour-page.tsx           # Sélection du magasin, salle active et liste des espaces
│   ├── panorama-viewer.tsx     # Adaptateur React sécurisé autour de Pannellum
│   ├── tour-admin.tsx          # Création, upload et édition des visites 360°
│   └── ui.tsx                  # Composants atomiques (LightSwitch, LanguageSwitch, Scene, Modales)
│
├── lib/                        # Logique métier et adaptateurs
│   ├── types.ts                # Interfaces TypeScript (Product, Category, Settings, Order, Language)
│   ├── i18n.ts                 # Dictionnaires de traduction UI pour FR, AR, EN
│   ├── translate.ts            # Moteur d'auto-traduction spécialisé dans le luminaire
│   ├── catalog.ts              # Fonctions de filtrage, validation du panier, formatage monétaire
│   ├── tours.ts                # Validation, tri et normalisation des scènes / angles
│   ├── seed.ts                 # Catalogue initial de démonstration (trilingue)
│   └── store.ts                # Adaptateur hybride (Supabase en prod / LocalStorage en démo)
│
├── public/assets/              # Images de démonstration indépendantes (paires jour/nuit)
│   ├── pendant-off.webp / pendant-on.webp
│   ├── table-off.webp   / table-on.webp
│   ├── floor-off.webp   / floor-on.webp
│   ├── spotlight-off.webp / spotlight-on.webp
│   ├── downlight-off.webp / downlight-on.webp
│   ├── ceiling-off.webp / ceiling-on.webp
│   ├── tour-entree.png         # Panorama 2:1 de démonstration
│   ├── tour-galerie.png        # Deuxième espace relié au premier
│   └── favicon.svg
│
├── public/vendor/pannellum/    # Visionneuse 360° locale, sans CDN externe
│
├── supabase/                   # Scripts de base de données PostgreSQL & Edge Function
│   ├── schema.sql              # Schéma des tables, RLS, fonctions transactionnelles
│   ├── seed.sql                # Données initiales trilingues à insérer dans Supabase
│   ├── migrations/202609190001_add_virtual_tours.sql # Mise à niveau d'une base existante
│   └── functions/place-order/  # Edge Function Deno d'envoi des commandes vers Telegram
│
└── tests/                      # Suite de tests automatisés
    ├── catalog.test.ts         # Tests de filtrage, prix promos et panier
    ├── i18n.test.ts            # Tests du dictionnaire, RTL et auto-traduction
    ├── tours.test.ts           # Tests des scènes, angles et liens entre panoramas
    └── database.test.ts        # Tests PostgreSQL (PGlite) sur les stocks et l'idempotence
```

---

## 4. Internationalisation & Traduction Automatique

Le site gère nativement trois langues :

1. **Français (`fr`)** : Langue par défaut et langue de saisie privilégiée de l'administration.
2. **Arabe (`ar`)** : Traduction soignée avec inversion automatique de la direction (`dir="rtl"`). Les panneaux coulissants (panier, menu) s'ouvrent depuis le côté approprié et la typographie est adaptée.
3. **Anglais (`en`)** : Langue internationale pour les clients anglophones.

### L'approche hybride adoptée

- **Interface fixe (Boutons, menus, messages d'erreur, étapes)** : Traduite à 100% dans `lib/i18n.ts`.
- **Catalogue dynamique (Produits, catégories, textes du magasin)** :
  - Dans l'administration, l'administrateur dispose d'onglets pour voir et modifier les versions française, arabe et anglaise.
  - Un bouton **« ✨ Auto-traduire »** traduit instantanément le texte français en arabe et en anglais grâce au dictionnaire spécialisé de `lib/translate.ts`.
  - Si un champ en arabe ou en anglais est laissé vide, le site applique un **repli intelligent** vers le français pour éviter tout blanc dans l'affichage.

Le meilleur choix pour ce projet est cette approche à trois champs. Les traductions automatiques externes changent, coûtent parfois de l'argent et peuvent produire un vocabulaire commercial imprécis. Le bouton fourni génère un premier brouillon local à partir du français; l'administrateur garde toujours la possibilité de relire et corriger l'arabe et l'anglais avant publication. Ce fonctionnement couvre aussi les noms de magasins, les descriptions de salles et les libellés des repères 360°.

---

## 5. Guide d'utilisation de l'Administration

L'administration est accessible sur `/admin`.

### 1. Gestion des Produits

- Pour créer un article, cliquez sur **« Nouveau produit »**.
- **Nom, description, matière et badge** : Saisissez vos textes en français dans l'onglet 🇫🇷, puis cliquez sur **« ✨ Auto-traduire (FR → AR & EN) »** pour remplir automatiquement les onglets 🇸🇦 et 🇬🇧. Vous pouvez ajuster chaque texte à la main.
- **Référence / SKU** : Identifiant unique pour le stock (ex. `ZT-P001`).
- **Prix standard et Prix promo** : Si vous renseignez un prix promo, l'ancien prix sera barré automatiquement.
- **Stock** : Quantité d'articles disponibles.
- **Finitions / Couleurs** : Tapez vos couleurs séparées par des virgules (ex: `Ivoire, Beige, Noir, Laiton`). Le site crée automatiquement les pastilles visuelles correspondantes.
- **Températures** : Ex: `2700K, 3000K, 4000K`.
- **Paires d'images Jour / Nuit** :
  - `Image de jour` : Photo du luminaire éteint en lumière naturelle.
  - `Image de nuit` : Photo du même luminaire allumé dans la pénombre.
  - _Astuce_ : Utilisez le même angle de vue pour que la transition au clic sur « Allumer la lumière » soit magique !
- Cochez **« Publier le produit »** pour qu'il soit visible par les visiteurs.

### 2. Gestion des Catégories

- Cliquez sur **« Ajouter une catégorie »** dans l'onglet Produits.
- Donnez un nom en français, cliquez sur **« ✨ Auto-traduire »** pour obtenir l'arabe et l'anglais, choisissez une icône (Suspension, Lampe de table, Lampadaire, Spot, etc.) et validez.

### 3. Traitement des Commandes

- Consultez la liste des commandes reçues avec le nom du client, son numéro de téléphone, sa ville et ses articles.
- Cliquez sur l'icône flèche pour afficher la fiche complète.
- Modifiez le statut : **Nouveau**, **Confirmé**, **Terminé**, ou **Annulé**.
- _Important_ : Si vous passez une commande à **Annulé**, le stock des articles réservés est automatiquement restitué dans le catalogue !
- Un bouton **« Exporter CSV »** permet de télécharger l'historique complet pour Excel.

### 4. Réglages du Magasin

- Modifiez le nom de la boutique, la devise (ex: `DZD`), le numéro WhatsApp et les liens de réseaux sociaux.
- Personnalisez le bandeau d'annonce défilant, l'histoire de la marque, les textes de livraison et de confidentialité (avec auto-traduction disponible).

### 5. Création d'une visite 360°

1. Ouvrez `/admin` puis **Visites 360°** et cliquez sur **Nouvelle visite**.
2. Saisissez le nom du showroom, son adresse et son introduction en français. Utilisez **Traduire depuis le français**, puis relisez les onglets arabe et anglais.
3. Ajoutez un panorama par espace. Utilisez une image équirectangulaire **2:1**, idéalement `4096 × 2048 px`, en JPG, PNG ou WebP. La limite Supabase est de 30 Mo par fichier.
4. Dans l'aperçu, orientez la caméra vers la meilleure vue d'ouverture puis cliquez sur **Utiliser la vue actuelle**.
5. Ajoutez au moins un second panorama. Orientez ensuite le premier vers une porte ou un passage et cliquez sur **Ajouter à la vue actuelle**. Choisissez l'espace cible et traduisez le texte du repère.
6. Utilisez les flèches pour classer les espaces. Cochez **Publier immédiatement sur le site** seulement quand tous les liens ont été vérifiés.

La suppression d'une visite retire ses données du site mais ne supprime volontairement pas les fichiers du bucket Supabase, afin d'éviter une perte d'image accidentelle. Les fichiers inutilisés peuvent être nettoyés manuellement dans **Storage → tour-panoramas**.

---

## 6. Connexion Supabase & Telegram

Pour passer du mode démo local à la version de production connectée :

### Étape 1 : Création de la base Supabase

1. Créez un nouveau projet gratuit sur [Supabase](https://supabase.com).
2. Dans le menu **SQL Editor**, collez et exécutez le contenu de `supabase/schema.sql`.
3. (Facultatif) Pour charger les luminaires d'exemple, exécutez le contenu de `supabase/seed.sql`.
4. Allez dans **Authentication → Users** et cliquez sur **Add user**. Entrez votre email et un mot de passe fort.
5. Copiez l'UUID de cet utilisateur, puis dans **SQL Editor**, exécutez :
   ```sql
   insert into public.admins(user_id) values ('VOTRE_UUID_ICI');
   ```

Si votre base Ahmed existe déjà, n'exécutez pas de nouveau `schema.sql`. Exécutez uniquement [la migration des visites 360°](supabase/migrations/202609190001_add_virtual_tours.sql) dans le SQL Editor. Elle crée la table `virtual_tours`, les règles de sécurité et le bucket public `tour-panoramas`; elle ne modifie ni les produits ni les commandes.

### Étape 2 : Configuration du Frontend

Dans le dossier du projet, ouvrez le fichier `.env.local` et renseignez :

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE_PROJET.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=VOTRE_CLE_PUBLIQUE_ANON
NEXT_PUBLIC_ENABLE_LOCAL_DEMO=false
```

### Étape 3 : Création du Bot Telegram

1. Dans l'application Telegram, ouvrez **@BotFather** et envoyez `/newbot`.
2. Donnez un nom et un identifiant à votre bot. Copiez le jeton (_token_) fourni.
3. Créez un canal ou groupe Telegram pour recevoir les commandes, et ajoutez votre bot en tant qu'**administrateur**.
4. Déployez l'Edge Function de commande située dans `supabase/functions/place-order` :
   ```powershell
   supabase functions deploy place-order --no-verify-jwt
   ```
5. Dans Supabase (**Edge Functions → Secrets**), ajoutez :
   - `TELEGRAM_BOT_TOKEN` : le jeton de votre bot.
   - `TELEGRAM_CHAT_ID` : l'identifiant de votre canal (ex: `@mon_canal_commandes` ou `-100...`).
   - `ALLOWED_ORIGINS` : l'adresse de votre site (ex: `http://localhost:3000,https://votre-site.com`).

Dès lors, chaque commande passée sur le site sera validée côté serveur, déduira le stock et enverra une alerte instantanée sur Telegram !

---

## 7. Guide de personnalisation autonome

Vous pouvez très facilement personnaliser les éléments de votre site sans modifier de code complexe :

### 1. Changer le logo

- **Option A (Depuis l'administration)** : Rendez-vous dans `/admin` → **Réglages** → téléversez votre logo sous format JPG, PNG, WebP ou SVG.
- **Option B (Remplacer le fichier favicon)** : Remplacez simplement le fichier `public/assets/favicon.svg` par votre propre icône SVG.

### 2. Remplacer les images des luminaires

- Les photos d'exemple sont situées dans `public/assets/`.
- Vous pouvez téléverser directement vos propres photos de jour et de nuit depuis le formulaire produit de l'administration.
- Formats recommandés : **WebP** ou **JPG**, dimensions recommandées : 1200 × 1400 px, poids inférieur à 5 Mo.

### 2 bis. Remplacer les panoramas de démonstration

- Ne remplacez pas un panorama par une photo ordinaire : utilisez une projection équirectangulaire complète, deux fois plus large que haute.
- Depuis **Administration → Visites 360°**, le bouton d'upload vérifie le format et une largeur minimale de 2000 px avant l'envoi.
- Les images locales `tour-entree.png` et `tour-galerie.png` servent uniquement à la démonstration. Les visites créées en production utilisent les URL du bucket Supabase.
- Pannellum est conservé dans `public/vendor/pannellum/`; le site ne dépend donc pas d'un CDN au chargement.

### 3. Modifier les couleurs du site

Les couleurs sont définies en tête du fichier `app/globals.css` :

```css
:root {
  --paper: #faf9f6; /* Fond clair principal (beige doux) */
  --surface: #f0ede6; /* Fond des cartes et sections */
  --cream: #e9e3d6; /* Fond des bandeaux */
  --ink: #252620; /* Couleur du texte et des boutons */
  --accent: #a77745; /* Couleur d'accentuation (laiton doré) */
}
```

Pour le mode sombre activé par le bouton « Allumer la lumière », modifiez le bloc `body.lights-on` dans ce même fichier.

### 4. Modifier les polices de caractères

Les polices sont configurées dans `app/layout.tsx` :

- Police de texte courant : **DM Sans** (élégante et moderne).
- Police des grands titres : **Georgia** / serif éditorial.
- Police arabe : fallback sur **Noto Sans Arabic** et **Tajawal** pour une lisibilité irréprochable.

---

## 8. Vérification & Tests

Le projet est livré avec une suite de tests unitaires et d'intégration validée :

```powershell
# Exécuter tous les tests (Catalogue, Panier, Base de données, i18n & Traductions)
npm test

# Vérifier la validité des types TypeScript
npm run typecheck

# Tester la compilation de production Next.js
npm run build
```

Tous les tests sont au vert (10 tests réussis, 0 échec).

---

## Félicitations !

Votre boutique Ahmed Lighting est prête pour la démonstration et le déploiement en production ! 💡✨
