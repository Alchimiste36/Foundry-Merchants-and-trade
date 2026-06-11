MERCHANTS, TRADES AND TRANSACTIONS — ROADMAP DE CONVERSION V1
Refonte : acteur système normal + boutique MTT unique attachée en flags
Base analysée : Foundry-Merchants-and-trade-main (15).zip
Date du document : 2026-06-10
Mise à jour : conversion principale via options d'en-tête de fiche acteur, pas via clic droit Actor Directory

====================================================================== 0. OBJECTIF DU DOCUMENT
======================================================================

Ce document est un document de travail obligatoire pour les agents CC / Codex.
Il doit être relu avant chaque étape de modification du module.

But global : transformer l'architecture actuelle du module MTT pour abandonner le type d'acteur spécifique `mtt-merchants.merchant` et passer à une logique universelle :

- le MJ crée lui-même un acteur normal du système actif ;
- MTT permet de convertir certains types d'acteurs configurés en boutique MTT ;
- l'acteur système reste le gérant / support Foundry ;
- la boutique MTT est unique et attachée à cet acteur via des flags MTT ;
- l'inventaire système de l'acteur et le catalogue marchand sont strictement indépendants ;
- l'ouverture normale d'un acteur converti doit ouvrir la feuille boutique MTT ;
- la feuille système native du gérant reste accessible par une action explicite.

Ce document décrit les conséquences sur le code actuel et la roadmap globale. Il ne doit pas être traité comme une demande de tout faire en une seule passe. Chaque étape doit être appliquée seulement quand elle est explicitement demandée.

======================================================================

1. # DECISIONS FONCTIONNELLES VALIDÉES

## 1.1. Plus aucun type d'acteur marchand MTT

MTT ne doit plus créer, enregistrer ou dépendre d'un type d'acteur spécial comme :

mtt-merchants.merchant

L'ancien type d'acteur MTT doit être considéré comme abandonné pour la V1 propre.
Ne pas chercher une compatibilité lourde avec les anciens acteurs de type MTT.

## 1.2. Conversion uniquement, pas de création d'acteur

MTT ne doit pas créer automatiquement un acteur.
Le MJ crée un acteur système normal via Foundry, puis MTT permet de le convertir en boutique MTT.

Exemples :

CO2 : character / encounter selon configuration.
DnD5e : npc / character selon configuration.
PF2e : npc / loot / character selon configuration.

MTT fournit uniquement des actions de conversion et d'ouverture.

Méthode de conversion validée :

- la conversion d'un acteur en boutique MTT se fait principalement depuis les options d'en-tête de la feuille acteur système, c'est-à-dire dans les contrôles de fenêtre / menu des trois points de l'application acteur ;
- le clic droit dans l'Actor Directory n'est plus la méthode principale V1, car il s'est révélé fragile selon le HTML de Foundry v14 et des systèmes ;
- une option Actor Directory peut rester un bonus futur ou secondaire, mais aucun agent ne doit en dépendre pour la V1.

## 1.3. Types d'acteurs convertibles configurables

La configuration MTT doit permettre de choisir plusieurs types d'acteurs système pouvant recevoir une boutique MTT.

Exemple de setting :

allowedMerchantActorTypes = ["character", "encounter"]

Ne pas prévoir un type d'acteur par défaut pour création, car la création automatique est abandonnée.

## 1.4. Une seule boutique par acteur

Règle définitive V1 :

1 acteur système = 0 ou 1 boutique MTT

Il ne faut pas prévoir de collection multi-boutiques dans les flags.
Ne pas créer `shops`, `merchants[]`, `merchantId` multiples, ni système de sélection de plusieurs boutiques sur le même acteur.

## 1.5. Acteur système = gérant / support Foundry

L'acteur converti reste un acteur normal du système actif.
Il conserve :

- son type système ;
- ses caractéristiques ;
- son inventaire système personnel ;
- ses actions / capacités / attaques ;
- sa feuille système native ;
- son token ;
- son image acteur ;
- ses permissions Foundry / ownership.

Il représente le gérant, le PNJ, la créature, le coffre vivant, la caravane ou tout autre support de la boutique.

## 1.6. Boutique MTT = données indépendantes en flags

La boutique attachée contient ses propres données MTT :

- nom de boutique ;
- image de boutique ;
- description commerciale ;
- catalogue produits ;
- catalogue services ;
- catégories ;
- sous-catégories ;
- bourse / monnaies marchand ;
- taux de vente / rachat ;
- clients autorisés ;
- sessions ;
- négociations ;
- journal marchand ;
- état de référence ;
- secrets produits/services ;
- prix personnalisés par acheteur.

Ces informations ne doivent plus être stockées dans `actor.system`, car `actor.system` appartient au système de jeu actif.

## 1.7. Inventaires séparés

L'inventaire système de l'acteur n'est pas le stock du marchand.

Exemple :

Acteur système : Gorim le Forgeron
Inventaire acteur : marteau personnel, armure portée, actions de combat.

Boutique MTT attachée : dagues à vendre, armures, services de forge, journal des transactions.

Le catalogue MTT doit être indépendant de `actor.items`.

## 1.8. Compendiums

Les compendiums d'acteurs sont toujours liés au système de jeu pour lequel ils ont été créés.
Il ne faut pas chercher de compatibilité inter-systèmes pour les marchands en compendium.

Objectif V1 :

- un compendium Actor CO2 peut contenir des acteurs CO2 convertis en boutiques MTT ;
- ces acteurs restent utilisables dans un monde CO2 ;
- les flags MTT doivent être conservés et suffisants pour rouvrir la boutique après import.

## 1.9. Retrait du statut marchand

Orientation actuelle : retirer le statut marchand supprime tous les flags MTT de boutique sur l'acteur.
Cette décision pourra être revue plus tard.

Pour l'instant, prévoir une action avec confirmation forte :

Retirer la boutique MTT = supprimer les données MTT attachées.
Ne jamais supprimer l'acteur système ni son inventaire personnel.

====================================================================== 2. ÉTAT ACTUEL DE L'ARCHIVE ANALYSÉE
======================================================================

## 2.1. Initialisation actuelle

Fichier concerné :

mtt.mjs

Constat :

- le module ajoute `CONFIG.Actor.dataModels[MTT.ACTOR_TYPES.MERCHANT] = models.MerchantData` ;
- le module ajoute `CONFIG.Actor.typeLabels[MTT.ACTOR_TYPES.MERCHANT]` ;
- le module enregistre `MerchantSheet` comme sheet par défaut pour ce type ;
- `preCreateActor` applique une image par défaut et des catégories uniquement aux acteurs de type MTT.

Conséquence : cette logique doit être supprimée ou remplacée. MTT ne doit plus injecter de type d'acteur dans le système.

## 2.2. Constantes actuelles

Fichier concerné :

module/config/constants.mjs

Constat :

MTT.ACTOR_TYPES.MERCHANT = "mtt-merchants.merchant"

Conséquence : cette constante ne doit plus servir de critère principal. Elle peut être supprimée ou conservée temporairement uniquement si une étape de nettoyage en a besoin, mais elle ne doit plus être utilisée en logique V1.

## 2.3. Modèle actuel `MerchantData`

Fichier concerné :

module/models/merchant-data.mjs

Constat :

- `MerchantData` étend `foundry.abstract.TypeDataModel` ;
- son schéma décrit toutes les données MTT dans `actor.system` ;
- il contient actuellement : merchant, manager, sheet, trade, wallet, referenceState, journal, access, catalog, services, sessions.

Conséquence : ce fichier ne doit plus être utilisé comme data model de type Actor. Son contenu doit être converti en builders / validateurs / normaliseurs de données de flags MTT, ou remplacé par un module de données indépendant.

## 2.4. Feuille actuelle

Fichier concerné :

module/applications/sheets/merchant-sheet.mjs

Constat :

- `MerchantSheet` étend `ActorSheetV2` ;
- elle lit massivement `this.actor.system.*` ;
- elle lit les produits depuis `this.actor.items` ;
- elle modifie les produits via `Item` embedded documents ;
- elle écrit services, sessions, journal, wallet, access, config dans `system.*`.

Conséquence : la feuille peut rester attachée à un Actor, mais elle doit lire/écrire les données boutique depuis `flags.mtt-merchants.merchant`, pas depuis `actor.system` ni `actor.items` pour le catalogue.

## 2.5. Catalogue produits actuel

Fichiers concernés :

module/applications/sheets/merchant-catalog.mjs
module/applications/sheets/merchant-sheet.mjs
module/applications/sheets/merchant-trade.mjs

Constat :

- les produits sont des Items embedded dans l'acteur marchand ;
- chaque produit stocke les données commerciales dans `item.flags.mtt-merchants.product` ;
- `prepareItems(actor, ...)` fait `actor.items.map(...)` ;
- ajout au catalogue = `actor.createEmbeddedDocuments("Item", [productData])` ;
- suppression = `actor.deleteEmbeddedDocuments("Item", [item.id])` ;
- mise à jour stock = `item.setFlag(...)` ;
- fusion stock marchand = recherche dans `actor.items` par `sourceUuid`.

Conséquence : ce modèle doit être remplacé par un catalogue de produits stocké dans les flags MTT de l'acteur support.

## 2.6. Services actuels

Constat :

- les services sont déjà des objets de données dans `actor.system.services.entries` ;
- ils sont donc plus proches du futur modèle attendu.

Conséquence : déplacer `system.services.entries` vers le flag unique de boutique est plus simple que pour les produits.

## 2.7. Sessions / accès / journal / wallet actuels

Constat :

- sessions : `actor.system.sessions.entries` ;
- accès clients : `actor.system.access.clients` ;
- journal : `actor.system.journal.transactions` et `actor.system.journal.nextTransactionNumber` ;
- wallet : `actor.system.wallet.currencies` ;
- état de référence : `actor.system.referenceState` ;
- trade : `actor.system.trade.*`.

Conséquence : tous ces chemins doivent être déplacés vers `flags.mtt-merchants.merchant.*`.

## 2.8. Journal global actuel

Fichier concerné :

module/applications/mtt-global-journal-app.mjs

Constat :

- il reconnaît les marchands par `actor.type === MTT.ACTOR_TYPES.MERCHANT` ;
- il collecte les journaux des acteurs de ce type.

Conséquence : il doit reconnaître les boutiques par flag MTT, pas par type d'acteur.

## 2.9. Socket de sessions actuel

Fichier concerné :

module/applications/sheets/merchant-session-socket.mjs

Constat :

- il fusionne des mises à jour ciblant `system.sessions.entries` ;
- il applique ensuite `merchantActor.update(updateData)`.

Conséquence : il doit fusionner et écrire les sessions dans le chemin de flags MTT, probablement `flags.mtt-merchants.merchant.sessions.entries`.

## 2.10. Templates actuels

Dossier concerné :

templates/actors/

Constat :

- les templates utilisent `actor.name`, `actor.img` pour le marchand ;
- les templates utilisent `system.*` pour manager, description, trade, wallet, etc.

Conséquence : les templates doivent distinguer clairement :

- managerActor : l'acteur système / gérant ;
- shop : la boutique MTT ;
- merchantData : données de la boutique.

Ne pas continuer à utiliser `system.*` pour les données MTT.

====================================================================== 3. NOUVELLE STRUCTURE DE DONNÉES CONSEILLÉE
======================================================================

## 3.1. Chemin de flag unique

Chemin recommandé :

flags.mtt-merchants.merchant

Helper obligatoire : ne jamais manipuler ce chemin brut partout dans le code.

Créer un fichier dédié, par exemple :

module/documents/merchant-flags.mjs
ou
module/applications/sheets/merchant-store.mjs

Contenu recommandé :

- isMerchantActor(actor)
- getMerchantData(actor)
- getMerchantDataForUpdate(actor)
- buildDefaultMerchantData(actor)
- updateMerchantData(actor, changes)
- setMerchantData(actor, data)
- unsetMerchantData(actor)
- getMerchantFlagPath(path)
- normalizeMerchantData(data, actor)

## 3.2. Structure indicative

flags.mtt-merchants.merchant = {
enabled: true,
version: 1,
sheet: {
isLocked: true
},
shop: {
name: "",
img: "icons/svg/hanging-sign.svg",
description: ""
},
manager: {
actorUuid: actor.uuid,
displayName: actor.name,
img: actor.img
},
trade: {
buyPercent: 50,
sellPercent: 100,
serviceSellPercent: 100,
negotiationFormula: ""
},
wallet: {
currencies: {}
},
catalog: {
products: [],
services: [],
productCategories: [],
collapsedCategories: {},
hiddenCategories: {},
keepEmptyItems: true
},
access: {
clients: []
},
sessions: {
entries: []
},
journal: {
nextTransactionNumber: 1,
transactions: []
},
referenceState: null
}

## 3.3. Produit catalogue recommandé

Un produit n'est plus un Item embedded dans l'acteur gérant.
Il devient une entrée de données dans `catalog.products`.

Structure indicative :

{
id: "randomID",
sourceUuid: "",
itemData: {},
name: "",
img: "",
type: "",
quantity: 1 ou null,
deliveryQuantityPerLot: null,
priceValue: 0,
priceCurrency: "",
category: "",
systemCategoryKey: "",
systemCategoryLabel: "",
systemCategoryPath: "",
systemSubcategory: "",
ownershipLevel: 2,
isHidden: false,
requiresApproval: false,
hasFreePrice: false,
minimumPriceValue: 0,
secretName: "",
secretPrice: "",
secretCurrency: "",
secretDescription: "",
isCommerciallyModified: false
}

Important : conserver `itemData` ou une copie complète suffisante de l'Item source pour que le produit reste livrable même si `sourceUuid` ne résout plus après import de compendium.

## 3.4. Service catalogue recommandé

Les services peuvent être déplacés presque tels quels depuis `system.services.entries` vers `catalog.services` ou `services.entries` dans le flag.
Choisir un emplacement unique et ne pas mélanger.

Recommandation :

merchant.catalog.services

ou, pour limiter les modifications initiales :

merchant.services.entries

Mais il faut être cohérent dans toute l'application.

## 3.5. Ne pas utiliser `actor.system` pour MTT

Après refonte, `actor.system` doit être réservé au système de jeu.
Les seules lectures de `actor.system` autorisées dans MTT sont celles concernant :

- l'acteur gérant comme acteur système ;
- les objets vendus par un PJ lors d'une vente au marchand ;
- les chemins système configurés pour lire prix, quantité, description, monnaies d'Items/Actors externes.

Ne jamais écrire des données de boutique dans `actor.system`.

====================================================================== 4. ROADMAP GLOBALE PAR ÉTAPES
======================================================================

IMPORTANT : les étapes ci-dessous sont ordonnées.
Un agent ne doit pas réaliser une étape future tant que l'étape demandée n'est pas explicitement sélectionnée, sauf si une micro-modification est strictement nécessaire pour compiler ou tester l'étape en cours.

Chaque étape doit être livrée avec :

- un résumé des fichiers modifiés ;
- les décisions techniques prises ;
- les tests manuels à faire dans Foundry ;
- les limites connues ;
- aucune refactorisation cosmétique non demandée.

---

## ÉTAPE 1 — Préparer les helpers de données MTT en flags

Objectif : créer une couche unique d'accès aux données boutique MTT sans encore convertir tout le module.

Actions :

1. Ajouter des constantes de chemins de flags :
   MTT.FLAGS.MERCHANT = "merchant"
   ou équivalent.

2. Créer un module helper central :
   isMTTMerchant(actor)
   buildDefaultMerchantData(actor)
   getMerchantData(actor)
   updateMerchantData(actor, update)
   unsetMerchantData(actor)
   normalizeMerchantData(data, actor)

3. Construire les données par défaut à partir du schéma actuel de `MerchantData` mais sans `TypeDataModel`.

4. Prévoir le préremplissage :
   manager.actorUuid = actor.uuid
   manager.displayName = actor.name
   manager.img = actor.img
   shop.name = actor.name ou "Boutique de [actor.name]" selon décision UI
   shop.img = image par défaut boutique ou actor.img selon décision UI

5. Ne pas encore supprimer le modèle actuel si cela casse l'application immédiatement.

WARNING ÉTAPE 1 :
Ne pas déplacer encore tout le catalogue, toutes les sessions ou toute la feuille. Cette étape sert seulement à créer la fondation propre. Ne pas modifier les transactions en profondeur à cette étape sauf nécessité stricte.

---

## ÉTAPE 2 — Retirer la dépendance au type d'acteur MTT dans l'initialisation

Objectif : empêcher MTT d'injecter un type d'acteur dans `CONFIG.Actor.dataModels`.

Actions :

1. Modifier `mtt.mjs` :
   - supprimer l'ajout à `CONFIG.Actor.dataModels` ;
   - supprimer l'ajout à `CONFIG.Actor.typeLabels` ;
   - supprimer ou désactiver l'enregistrement de sheet limité à `types: [MTT.ACTOR_TYPES.MERCHANT]` ;
   - supprimer la logique `preCreateActor` réservée au type marchand.

2. Remplacer la détection `actor.type === MTT.ACTOR_TYPES.MERCHANT` par `isMTTMerchant(actor)` dans les zones non critiques.

3. Conserver temporairement `MerchantSheet` comme Application attachée à un Actor si nécessaire, mais ne plus la rendre dépendante d'un type d'acteur.

WARNING ÉTAPE 2 :
Ne pas essayer de réécrire tout `MerchantSheet` dans cette étape. Le but est seulement de supprimer la création du type d'acteur MTT et de rendre la détection future possible par flags.

---

## ÉTAPE 3 — Ajouter la configuration des types d'acteurs convertibles

Objectif : permettre au MJ de choisir quels types d'acteurs système peuvent recevoir une boutique MTT.

Actions :

1. Ajouter un setting monde :
   allowedMerchantActorTypes

2. Le setting peut être stocké en JSON string ou en liste texte normalisée.
   Recommandation : JSON string pour éviter les ambiguïtés.

3. Ajouter à l'application de configuration MTT :
   - affichage des types d'acteurs disponibles ;
   - sélection multiple ;
   - sauvegarde ;
   - import/export de configuration.

4. Récupérer les types disponibles depuis le système actif.
   Ne pas supposer que `CONFIG.Actor.dataModels` est la seule source fiable sans vérifier Foundry v14.
   Prévoir fallback robuste.

5. Ajouter les clés i18n FR/EN.

WARNING ÉTAPE 3 :
Ne pas ajouter de création automatique de marchand. La configuration sert uniquement à autoriser la conversion d'acteurs existants.

---

## ÉTAPE 4 — Ajouter la conversion / retrait via options d'en-tête de fiche acteur

Objectif : permettre de convertir un acteur système existant en boutique MTT depuis les options d'en-tête de sa feuille acteur native, dans les contrôles de fenêtre / menu des trois points.

Décision mise à jour :

- le clic droit dans l'Actor Directory n'est plus la méthode principale V1 ;
- l'Actor Directory peut rester une amélioration future ou secondaire, mais ne doit pas être nécessaire pour convertir un acteur ;
- la méthode principale validée est l'ajout de contrôles d'en-tête sur les feuilles acteur système.

Actions :

1. Ajouter des actions dans les contrôles d'en-tête des feuilles acteur système :
   Convertir en marchand MTT
   Ouvrir la boutique MTT
   Ouvrir le gérant
   Retirer la boutique MTT

2. Utiliser les hooks Foundry adaptés aux header controls, pas une injection DOM manuelle.
   Pour Foundry v14 / ApplicationV2 :
   - utiliser les contrôles d'en-tête ApplicationV2, par exemple `getHeaderControlsApplicationV2` ou hook spécialisé équivalent si disponible.
     Pour les fiches legacy ApplicationV1 :
   - prévoir un fallback via les boutons d'en-tête ApplicationV1.
     Ne pas injecter manuellement des boutons dans `.window-header` après rendu.
     Ne pas dépendre de `renderApplication` comme mécanisme principal.

3. Résoudre l'acteur depuis l'application de feuille, pas depuis le HTML du directory :
   - `app.document`
   - `app.actor`
   - `app.object`
   - `app.options?.document`
     Le helper doit retourner un Actor uniquement si le document trouvé est bien un Actor.

4. Conditions d'affichage :
   - Convertir en marchand MTT : visible pour MJ seulement, si l'acteur existe, si son type est autorisé et s'il n'est pas déjà converti.
   - Ouvrir la boutique MTT : visible si l'acteur est déjà converti.
   - Ouvrir le gérant : visible si l'acteur est déjà converti.
   - Retirer la boutique MTT : visible pour MJ seulement, si l'acteur est déjà converti.

5. La conversion doit :
   - vérifier que l'utilisateur est MJ ;
   - vérifier que l'acteur existe ;
   - vérifier que `actor.type` est autorisé ;
   - vérifier qu'il n'est pas déjà converti ;
   - écrire `flags.mtt-merchants.merchant` avec les données par défaut ;
   - ouvrir la feuille MTT.

6. Le retrait doit :
   - afficher une confirmation forte ;
   - supprimer seulement les flags MTT de boutique ;
   - ne jamais supprimer l'acteur ni ses Items système.

WARNING ÉTAPE 4 :
Ne pas implémenter encore toutes les redirections d'ouverture token/feuille si cela demande une interception lourde. L'objectif minimum est la conversion et l'ouverture explicite depuis les options d'en-tête de la feuille acteur. Ne pas faire de l'Actor Directory une dépendance de la V1.

---

## ÉTAPE 5 — Ouverture directe de la boutique MTT

Objectif : un acteur converti doit ouvrir directement la feuille MTT depuis l'Actor Directory ou son token.

Actions :

1. Intercepter l'ouverture normale d'un acteur ou enregistrer une sheet MTT compatible selon la solution la plus stable pour Foundry v14.

2. Si `isMTTMerchant(actor)` est vrai :
   ouvrir `MerchantSheet` MTT.

3. Si l'acteur n'est pas converti :
   laisser la feuille système normale.

4. Ajouter un mécanisme de bypass pour ouvrir la feuille système native du gérant sans boucle.

5. Ajouter dans la feuille MTT une action d'entête :
   Ouvrir le gérant

6. L'ouverture du gérant doit afficher la sheet système native de l'acteur support.

WARNING ÉTAPE 5 :
Ne pas casser les fiches acteurs normales des systèmes. Toute interception doit être strictement limitée aux acteurs portant le flag MTT. Toujours prévoir un bypass de la fiche native.

---

## ÉTAPE 6 — Adapter la feuille MTT à une boutique en flags

Objectif : faire lire la feuille MTT depuis `flags.mtt-merchants.merchant` au lieu de `actor.system`.

Actions :

1. Dans `_prepareContext`, créer des contextes explicites :
   context.managerActor = this.actor
   context.merchant = getMerchantData(this.actor)
   context.shop = context.merchant.shop

2. Remplacer progressivement :
   actor.system.trade -> merchant.trade
   actor.system.wallet -> merchant.wallet
   actor.system.manager -> merchant.manager
   actor.system.catalog -> merchant.catalog
   actor.system.services -> merchant.catalog.services ou merchant.services
   actor.system.sessions -> merchant.sessions
   actor.system.journal -> merchant.journal
   actor.system.referenceState -> merchant.referenceState
   actor.system.access -> merchant.access

3. Adapter `#onMerchantFieldChange`, wallet, verrouillage, configuration, manager, image boutique.

4. Adapter les templates pour utiliser `merchant`, `shop`, `managerActor` au lieu de `system.*`.

5. L'image et le nom de la boutique ne doivent plus modifier automatiquement `actor.name` ou `actor.img`.

WARNING ÉTAPE 6 :
Ne pas encore convertir les produits embedded Items dans cette étape si cela rend la modification trop large. Il est acceptable de déplacer d'abord les données simples : trade, wallet, manager, services, sessions, journal, access. Les produits sont l'étape la plus délicate.

---

## ÉTAPE 7 — Refondre le catalogue produits hors `actor.items`

Objectif : rendre le catalogue marchand indépendant de l'inventaire système du gérant.

Actions :

1. Déplacer les produits vers `merchant.catalog.products`.

2. Remplacer `prepareItems(actor, ...)` par une préparation depuis les données produit MTT.

3. Remplacer `item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT)` par des champs directs sur l'entrée produit.

4. Remplacer les identifiants `item.id` par `product.id`.

5. Remplacer les mises à jour `item.setFlag(...)` par mises à jour de l'entrée produit dans les flags.

6. Remplacer création/suppression :
   actor.createEmbeddedDocuments("Item", ...) -> ajout dans `merchant.catalog.products`
   actor.deleteEmbeddedDocuments("Item", ...) -> suppression de l'entrée produit

7. Lors d'un drop d'Item vers le catalogue :
   - copier les données nécessaires de l'Item dans `product.itemData` ;
   - stocker `sourceUuid` ;
   - extraire prix, monnaie, quantité, catégorie, sous-catégorie ;
   - ne pas créer d'Item embedded dans l'acteur gérant.

8. Lors de l'ouverture/preview d'un produit :
   - reconstruire un Item temporaire à partir de `product.itemData` ;
   - appliquer nom/prix/monnaie commerciaux ;
   - ouvrir une sheet de prévisualisation si possible ;
   - ne pas modifier l'acteur gérant.

9. Conserver la logique “sourceUuid utile mais non obligatoire”.

WARNING ÉTAPE 7 :
C'est l'étape la plus risquée. Ne pas modifier la livraison vers l'acteur acheteur tant que le catalogue n'est pas stabilisé. Ne jamais utiliser l'inventaire du gérant comme stock marchand.

---

## ÉTAPE 8 — Adapter sessions, négociations et ajout au panier

Objectif : toutes les sessions doivent référencer des produits/services du nouveau catalogue MTT.

Actions :

1. Remplacer `sourceId` correspondant à un Item embedded par `product.id`.

2. Adapter `#onAddProductToSession` :
   - lire l'entrée produit ;
   - calculer quantité disponible ;
   - calculer prix depuis produit/itemData ;
   - stocker dans session les données nécessaires.

3. Adapter les vérifications de quantité à partir de `merchant.catalog.products`.

4. Adapter les négociations produit pour ne plus chercher `actor.items.get(sourceId)`.

5. Adapter les sockets de sessions vers le chemin flag.

WARNING ÉTAPE 8 :
Ne pas modifier la logique métier de négociation sauf adaptation nécessaire au nouveau stockage. Garder les statuts, tours, historiques et comportements déjà validés.

---

## ÉTAPE 9 — Adapter validation/exécution des transactions

Objectif : exécuter les achats/ventes avec le nouveau catalogue en flags.

Actions :

1. Pour les produits achetés par le PJ :
   - retrouver `product` dans `merchant.catalog.products` ;
   - reconstruire `deliveredItemData` depuis `product.itemData` ;
   - appliquer les données commerciales ;
   - livrer à l'acteur client via `createEmbeddedDocuments` sur le client seulement ;
   - décrémenter la quantité dans le produit MTT si quantité limitée.

2. Pour les services achetés :
   - retrouver le service dans le catalogue MTT ;
   - décrémenter seulement si stock limité ;
   - ne jamais créer d'Item service chez le client.

3. Pour les Items vendus par le PJ au marchand :
   - diminuer la quantité sur l'Item source du PJ ;
   - ajouter/fusionner un produit dans `merchant.catalog.products` ;
   - ne pas créer d'Item sur l'acteur gérant.

4. Pour le wallet marchand :
   - écrire dans `merchant.wallet`, pas dans `actor.system.wallet`.

5. Pour les ajustements monétaires :
   - conserver la logique actuelle, adapter seulement les chemins de lecture/écriture.

WARNING ÉTAPE 9 :
Ne pas toucher à la règle de livraison côté acteur client : la quantité max par pile s'applique uniquement au destinataire, jamais au stock marchand. Ne pas supprimer les Items PJ quand leur quantité tombe à 0 : laisser le système actif gérer ce comportement.

---

## ÉTAPE 10 — Adapter journal marchand et journal global

Objectif : le journal doit fonctionner avec les boutiques attachées à des acteurs système.

Actions :

1. Déplacer les transactions vers `merchant.journal.transactions`.

2. Déplacer `nextTransactionNumber` vers `merchant.journal.nextTransactionNumber`.

3. Adapter `mtt-global-journal-app.mjs` :
   - collecter `game.actors.filter(isMTTMerchant)` ;
   - afficher le nom boutique plutôt que seulement `actor.name` si disponible ;
   - garder `merchantActorUuid = actor.uuid`.

4. Vérifier que les acheteurs voient seulement leurs transactions selon les règles existantes.

5. Conserver la règle : ne pas enregistrer le détail des secrets dans le journal, seulement l'indicateur booléen `hadSecrets`.

WARNING ÉTAPE 10 :
Ne pas changer le design du journal sauf nécessité. Garder la structure validée : transaction dépliable, numéro par marchand, statuts Validée/Refusée, signes +/-, tri sans pagination.

---

## ÉTAPE 11 — Adapter état de référence

Objectif : l'état de référence doit sauvegarder/restaurer le catalogue MTT en flags.

Actions :

1. `saveReferenceState` doit capturer :
   - quantités produits ;
   - visibilité produits ;
   - ownership commercial des produits ;
   - approbation produits ;
   - quantités services ;
   - visibilité services ;
   - approbation services ;
   - visibilité catégories.

2. `restoreReferenceState` doit modifier les entrées du catalogue MTT, pas des Items embedded.

3. Ne jamais restaurer ou modifier l'inventaire système du gérant.

WARNING ÉTAPE 11 :
Ne pas ajouter une restauration globale destructive. Cette fonction doit rester limitée à la boutique MTT attachée, pas à l'acteur système.

---

## ÉTAPE 12 — Adapter droits, visibilité et accès

Objectif : maintenir la séparation entre permissions Foundry et droits métier MTT.

Actions :

1. Utiliser l'ownership Foundry de l'acteur support comme premier niveau d'accès.

2. Conserver les droits MTT existants : Aucun / Limité / Observateur / Propriétaire, selon logique déjà décidée.

3. Les clients autorisés restent dans les flags MTT.

4. Le rail acheteur continue de manipuler des acteurs clients, mais doit écrire dans `merchant.access.clients` et `merchant.sessions.entries`.

WARNING ÉTAPE 12 :
Ne pas refaire toute la matrice de permissions. Respecter les décisions déjà validées : simplicité, visibilité contrôlée par cards/sessions, pas de verrouillage global inutile.

---

## ÉTAPE 13 — Adapter compendiums et imports

Objectif : un acteur système converti et placé en compendium doit rester une boutique MTT utilisable après import.

Actions :

1. Vérifier que toutes les données boutique nécessaires sont dans les flags de l'Actor.

2. Vérifier que le catalogue ne dépend pas d'Items embedded du gérant.

3. Vérifier que chaque produit contient une copie suffisante de l'Item source dans `itemData`.

4. Vérifier que les `sourceUuid` cassés n'empêchent pas la vente/livraison.

5. Ne pas chercher la compatibilité inter-systèmes des compendiums.

WARNING ÉTAPE 13 :
Ne pas ajouter de logique d'export/import universel multi-systèmes. Les compendiums Actor sont considérés comme liés au système actif.

---

## ÉTAPE 14 — Nettoyage final de l'ancien modèle

Objectif : retirer les reliquats de l'ancienne architecture.

Actions :

1. Supprimer ou neutraliser :
   MTT.ACTOR_TYPES.MERCHANT
   CONFIG.Actor.dataModels[...]
   CONFIG.Actor.typeLabels[...]
   TypeDataModel MerchantData comme modèle acteur
   tests `actor.type === MTT.ACTOR_TYPES.MERCHANT`

2. Supprimer les écritures MTT dans `actor.system.*`.

3. Supprimer l'usage de `actor.items` comme catalogue marchand.

4. Garder seulement `actor.items` pour :
   - inventaire personnel du gérant ;
   - Items source des PJ dans les ventes ;
   - livraison d'Items vers l'acteur client.

5. Mettre à jour README / agents.md si nécessaire.

WARNING ÉTAPE 14 :
Ne pas conserver de compatibilité ancienne si elle complexifie ou salit le module. L'utilisateur accepte de recréer des marchands propres si nécessaire.

====================================================================== 5. FICHIERS PRINCIPAUX À SURVEILLER
======================================================================

## 5.1. Initialisation / API

mtt.mjs
module/config/constants.mjs
module/models/\_module.mjs
module/models/merchant-data.mjs

## 5.2. Settings / configuration

module/config/settings.mjs
module/config/config-export.mjs
module/applications/mtt-config-app.mjs
templates/apps/mtt-config.hbs
lang/fr.json
lang/en.json

## 5.3. Feuille principale

module/applications/sheets/merchant-sheet.mjs
templates/actors/merchant-sheet.hbs
templates/actors/parts/merchant-header.hbs
templates/actors/parts/merchant-main.hbs
templates/actors/parts/merchant-products.hbs
templates/actors/parts/merchant-services.hbs
templates/actors/parts/merchant-configuration.hbs
templates/actors/parts/merchant-session.hbs
templates/actors/parts/merchant-journal.hbs
templates/actors/parts/merchant-access-rail.hbs

## 5.4. Catalogue / services / utils

module/applications/sheets/merchant-catalog.mjs
module/applications/sheets/merchant-utils.mjs
module/applications/sheets/merchant-dialogs.mjs

## 5.5. Transactions / sessions

module/applications/sheets/merchant-trade.mjs
module/applications/sheets/merchant-session-socket.mjs

## 5.6. Journaux

module/applications/sheets/merchant-journal.mjs
module/applications/mtt-global-journal-app.mjs

## 5.7. CSS

styles/applications/\*.less
css/mtt.css

Ne pas refactoriser le CSS des produits sauf nécessité explicite. Préserver les classes et améliorations CSS locales existantes.

====================================================================== 6. RÈGLES DE CODAGE POUR LES AGENTS
======================================================================

## 6.1. Méticulosité obligatoire

Avant toute modification :

- lire ce document ;
- identifier l'étape exacte demandée ;
- lister mentalement les fichiers impactés ;
- ne pas faire les étapes suivantes par anticipation.

Après modification :

- vérifier les imports ;
- vérifier les chemins de données ;
- vérifier les clés i18n ;
- vérifier qu'aucune écriture MTT ne reste dans `actor.system` pour les données boutique modifiées ;
- vérifier que l'inventaire du gérant n'est pas modifié par les opérations de catalogue.

## 6.2. Centralisation des accès

Ne pas disperser partout :

actor.getFlag("mtt-merchants", "merchant")
actor.update({"flags.mtt-merchants.merchant...": ...})

Utiliser des helpers centralisés.

## 6.3. Nommage clair

Utiliser :

managerActor = acteur système / gérant
merchantData = données MTT
shop = identité de boutique
catalogProduct = produit catalogue MTT
catalogService = service catalogue MTT

Éviter :

merchantActorItems
actorInventoryAsStock
merchantItem pour un produit stocké en flags

## 6.4. Ne pas mélanger gérant et boutique

Règle absolue :

actor.name / actor.img / actor.system / actor.items = gérant système
merchant.shop / merchant.catalog / merchant.sessions / merchant.journal = boutique MTT

## 6.5. Préserver les comportements validés

Ne pas supprimer ou modifier sans demande explicite :

- rail acheteurs ;
- sessions : En cours / En attente d'une décision / Validée / Refusée ;
- prix libres produits/services ;
- approbation MJ produits/services ;
- négociation par ligne ;
- quantités par lot ;
- services sans livraison d'Item ;
- journal marchand consultable selon droits ;
- état de référence ;
- catégories personnalisées globales ;
- sous-catégories si déjà présentes ;
- fusion/livraison côté acteur client avec quantité max.

## 6.6. Pas de migration lourde ancienne

Ne pas écrire une migration complexe pour les anciens acteurs de type `mtt-merchants.merchant`, sauf demande explicite.
Le module doit viser une V1 propre.

## 6.7. Foundry v14

Le module vise Foundry VTT v14.
Vérifier les APIs ApplicationV2 / ActorSheetV2 / DocumentDirectory / context menus avant de coder une interception complexe.
Ne pas copier aveuglément du code v10/v11/v12 si l'API v14 diffère.

====================================================================== 7. TESTS MANUELS MINIMUM À PRÉVOIR
======================================================================

## 7.1. Conversion

- créer un acteur système normal ;
- ouvrir la feuille acteur système et vérifier que les options d'en-tête / menu des trois points proposent la conversion si le type est autorisé ;
- convertir ;
- vérifier que les flags MTT sont créés ;
- vérifier que l'acteur système conserve ses données.

## 7.2. Ouverture

- clic depuis Actor Directory sur acteur non converti : feuille système ;
- clic depuis Actor Directory sur acteur converti : feuille MTT après l'étape 5 ;
- double-clic token acteur converti : feuille MTT ;
- bouton “Ouvrir le gérant” : feuille système native.

## 7.3. Catalogue

- déposer un Item dans le catalogue MTT ;
- vérifier qu'aucun Item n'est créé dans l'inventaire du gérant ;
- vérifier que le produit est dans les flags MTT ;
- modifier nom/prix/stock/secret/catégorie ;
- fermer/rouvrir la feuille ;
- vérifier la persistance.

## 7.4. Achat / livraison

- autoriser un client ;
- ajouter un produit au panier ;
- valider ;
- vérifier la livraison sur l'acteur client ;
- vérifier la décrémentation du stock MTT ;
- vérifier que l'inventaire du gérant n'a pas changé.

## 7.5. Vente PJ -> marchand

- déposer un Item du PJ dans la session côté “PJ vend/donne” ;
- valider ;
- vérifier la quantité décrémentée sur le PJ ;
- vérifier la création/fusion d'un produit dans le catalogue MTT ;
- vérifier qu'aucun Item n'est créé dans l'inventaire du gérant.

## 7.6. Services

- créer un service ;
- acheter un service ;
- vérifier qu'aucun Item n'est livré au PJ ;
- vérifier le journal ;
- vérifier la décrémentation seulement si quantité limitée.

## 7.7. Journal

- valider/refuser des transactions ;
- vérifier les numéros par boutique ;
- vérifier le journal global ;
- vérifier la visibilité joueur/MJ.

## 7.8. Compendium

- convertir un acteur ;
- configurer une boutique ;
- placer l'acteur en compendium Actor du même système ;
- importer dans le monde ;
- vérifier que la boutique s'ouvre et fonctionne ;
- vérifier que les produits restent vendables même si `sourceUuid` ne résout pas.

====================================================================== 8. PIÈGES À ÉVITER ABSOLUMENT
======================================================================

- recréer un type d'acteur MTT ;
- créer automatiquement des acteurs marchand ;
- utiliser `actor.items` comme stock marchand ;
- écrire des données boutique dans `actor.system` ;
- modifier l'inventaire personnel du gérant lors d'une opération catalogue ;
- supprimer l'acteur ou ses Items lors du retrait de boutique ;
- rendre impossible l'ouverture de la feuille système native ;
- disperser les chemins de flags sans helper ;
- coder une compatibilité multi-boutiques ;
- coder une compatibilité inter-systèmes de compendium ;
- refactoriser tout le CSS sans demande ;
- modifier la logique de négociation au-delà de l'adaptation de stockage ;
- anticiper plusieurs étapes d'un coup ;
- dépendre du clic droit Actor Directory comme mécanisme principal de conversion ;
- injecter manuellement des boutons dans `.window-header` au lieu d'utiliser les contrôles d'en-tête Foundry.

====================================================================== 9. CRITÈRE DE VALIDATION GLOBAL
======================================================================

La refonte est réussie quand :

- MTT ne déclare plus de type d'acteur `mtt-merchants.merchant` ;
- un acteur système normal peut recevoir une boutique MTT par conversion ;
- un acteur converti ouvre directement la feuille boutique MTT ;
- la feuille système du gérant reste accessible ;
- les données boutique sont dans les flags MTT ;
- le catalogue MTT ne dépend pas de l'inventaire du gérant ;
- les achats, ventes, services, sessions, journaux et état de référence fonctionnent avec le nouveau stockage ;
- les marchands préparés en dossiers/compendiums Actor du même système restent utilisables ;
- aucune étape ne réintroduit une dépendance au type d'acteur spécial.

====================================================================== 10. NOTE DE RÉFÉRENCE API FOUNDRY
======================================================================

Points à vérifier par les agents avant implémentation :

- Foundry v14 fournit ActorSheetV2 comme base de feuilles acteur ApplicationV2.
- Les sheets peuvent être enregistrées via la collection Actors / DocumentSheetConfig, mais MTT ne doit pas enregistrer une sheet sur un type spécial abandonné.
- La conversion V1 doit utiliser les contrôles d'en-tête de feuille acteur, pas le context menu Actor Directory comme mécanisme principal.
- Pour ApplicationV2, vérifier les hooks de header controls, notamment `getHeaderControlsApplicationV2` ou équivalent spécialisé disponible dans la version cible.
- Pour les fiches legacy ApplicationV1 encore utilisées par certains systèmes, prévoir un fallback de boutons d'en-tête.
- Ne pas injecter manuellement du HTML dans `.window-header` après rendu pour créer les actions MTT.
- Les context menus de directory comme `getActorDirectoryEntryContext` peuvent être étudiés plus tard comme confort secondaire, mais ne sont pas nécessaires pour la V1.
- Ne pas supposer que des snippets anciens v10-v12 sont directement valides en v14.

Fin du document.
