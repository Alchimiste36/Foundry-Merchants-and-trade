# Instructions projet — Merchants, Trades and Transactions

## 1. Identité du projet

Nom du module : **Merchants, Trades and Transactions**.

Acronyme : **MTT**.

Identifiant Foundry du module : `mtt-merchants`.

Préfixe CSS obligatoire : `mtt-`.

Namespace de localisation : `mtt`.

Dépôt GitHub : `https://github.com/Alchimiste36/Foundry-Merchants-and-trade`.

Le projet est un **module indépendant pour Foundry VTT**, et non une fonctionnalité intégrée directement dans Chroniques Oubliées 2.

Le module cible **Foundry VTT v14**.

Le fichier d’instructions du projet est nommé `agents.md` en minuscules. Ne pas chercher uniquement `AGENTS.md`.

L’utilisateur est néophyte en développement. Les modifications doivent rester cohérentes avec l’existant, faciles à relire, faciles à tester et éviter les refontes massives non demandées.

---

## 2. État actuel du module

La partie **Marchand MTT** fonctionne et constitue désormais une base de travail importante.

Ne pas casser les fonctions déjà validées du marchand.

Avant toute modification, lire l’état actuel du dépôt et tenir compte des changements déjà effectués par les agents précédents. Ne pas raisonner uniquement à partir d’une ancienne archive, d’un ancien rapport ou d’une ancienne instruction.

Quand l’utilisateur dit qu’une correction fonctionne, considérer cette correction comme une base stable pour la suite.

Quand l’utilisateur dit qu’il a poussé sur le dépôt GitHub, le dépôt GitHub redevient l’état de référence.

---

## 3. Règle majeure : aucun legacy à préserver

Le module MTT est encore en développement local et n’est pas distribué publiquement.

Il ne faut pas préserver de compatibilité pour :

- anciens marchands ;
- anciennes transactions ;
- anciens journaux ;
- anciens settings ;
- anciens champs de flags ;
- anciens formats de produits ;
- anciennes décisions de conception abandonnées ;
- anciens mondes de test.

Objectif prioritaire :

```text
Le module doit être propre pour un monde neuf.
```

Conséquences :

- ne pas ajouter de fallback legacy ;
- ne pas conserver de champ “au cas où” ;
- ne pas conserver de clé de langue inutilisée ;
- ne pas conserver de classe CSS morte ;
- ne pas réintroduire d’anciens settings supprimés ;
- ne pas réintroduire de modèle marchand par type d’acteur dédié ;
- ne pas réintroduire les anciens produits sous forme de plain objects dans les flags.

---

## 4. Vision générale MTT 2.0

MTT doit évoluer vers un module **multi-types MTT**.

Un acteur Foundry normal peut être converti en entité MTT logique :

```text
Acteur système normal
→ Conversion MTT
→ choix du type MTT
   → Marchand / Boutique
   → Stockage / Réserve
   → autres types éventuels plus tard
```

Types MTT prévus :

- `merchant` : boutique, marchand, services, prix, ventes, achats, négociation, journal marchand ;
- `storage` : coffre, réserve, dépôt, butin, demandes, votes, retrait/dépôt, journal de mouvements.

Le stockage ne doit pas être un marchand avec les prix cachés. Il doit avoir ses propres flags, sa propre feuille, ses propres permissions, son propre journal, et seulement partager des fondations communes avec le marchand.

Structure cible des flags :

```text
flags.mtt-merchants.type = "merchant" | "storage"
flags.mtt-merchants.merchant = { ... }
flags.mtt-merchants.storage = { ... }
```

Ne pas mélanger les données de stockage dans `merchant`.

---

## 5. Philosophie de développement

Avancer étape par étape, avec rigueur.

Ne pas ajouter de fonctionnalité avancée non demandée.

Ne pas refactoriser massivement sans demande explicite.

Ne pas se compliquer la vie avec des notions bloquantes, des couches d’abstraction ou des systèmes génériques non demandés.

Préférer :

- corrections ciblées ;
- étapes courtes ;
- code lisible ;
- noms clairs ;
- peu de constantes ;
- peu de helpers, mais bien définis ;
- réutilisation progressive des fonctions existantes ;
- extraction commune uniquement quand elle est réellement utile.

Éviter :

- gros frameworks internes trop tôt ;
- factorisation anticipée ;
- réécriture complète d’une fonctionnalité validée ;
- changements simultanés sur plusieurs sujets sans nécessité ;
- multiplication de constantes du type `isEditable`, `canManage...`, `canDoThis...` si une constante existante couvre déjà le besoin.

Règle importante :

```text
Ne pas créer de rapport `.md` après chaque instruction.
Créer un rapport uniquement si l’utilisateur le demande explicitement.
```

---

## 6. Roadmap et ordre de travail

Avant de modifier une fonctionnalité importante, vérifier la roadmap du projet et l’état réellement déjà implémenté.

Ne pas refaire une étape déjà effectuée.

Ne pas changer une logique validée sans raison.

Quand une instruction concerne les stockages, vérifier si une fonction équivalente existe déjà côté marchand :

```text
Si la fonction existe déjà côté marchand :
→ l’extraire vers une partie commune seulement si c’est nécessaire ;
→ préserver le comportement marchand ;
→ ne pas casser les imports ni la logique existante.

Si la fonction n’existe pas côté marchand :
→ l’implémenter côté stockage sans créer prématurément une abstraction commune.
```

La règle est :

```text
Réutiliser ce qui existe, mais ne pas forcer l’abstraction.
```

---

## 7. Outils et dépendances

Le projet MTT doit rester simple.

Ne pas ajouter de dépendance npm, de plugin Gulp, de configuration de build ou d’outil supplémentaire sans nécessité claire et validation explicite.

Outils acceptés :

- `gulp`
- `gulp-less`
- `less`
- `prettier`
- `eslint`
- `@eslint/js`
- `globals`

Le fichier `gulpfile.mjs` doit rester minimal.

Il doit uniquement compiler :

```text
styles/mtt.less
```

vers :

```text
css/mtt.css
```

et permettre un mode watch sur les fichiers `.less`.

Ne pas ajouter automatiquement :

- `gulp-sourcemaps`
- `gulp-clean-css`
- minification CSS ;
- sourcemaps ;
- bundler JavaScript ;
- transpiler ;
- framework CSS ;
- dépendance externe non demandée ;
- outil de packaging non demandé.

---

## 8. Conventions JavaScript et Foundry v14

Utiliser du JavaScript moderne compatible Foundry VTT v14.

Respecter les APIs modernes :

- Application V2 ;
- ActorSheetV2 ;
- HandlebarsApplicationMixin ;
- DialogV2 ;
- `foundry.applications.handlebars.renderTemplate(...)` ;
- `foundry.utils.saveDataToFile(...)` ;
- `foundry.applications.apps.FilePicker.implementation` ;
- `foundry.applications.ux.TextEditor.implementation.getDragEventData(event)` ;
- `foundry.utils.*` ;
- `async` / `await`.

Ne pas utiliser les anciens globals dépréciés quand une version namespacée existe :

```text
TextEditor
renderTemplate
saveDataToFile
FilePicker
Dialog
getProperty
setProperty
mergeObject
duplicate
```

Utiliser plutôt :

```js
foundry.utils.getProperty(data, path)
foundry.utils.setProperty(data, path, value)
foundry.utils.mergeObject(target, source)
foundry.utils.duplicate(data)
```

Ne pas utiliser `new foundry.applications.DialogV2(...)`.

Utiliser un style JavaScript sans point-virgule superflu.

Exemple attendu :

```js
export const MTT = {
  ID: "mtt-merchants",
  NAME: "Merchants, Trades and Transactions"
}
```

---

## 9. Convention de fichiers et chemins

Tous les fichiers et dossiers doivent être en minuscules.

Exemples :

```text
mtt.mjs
agents.md
module/config/constants.mjs
module/config/settings.mjs
module/config/actor-types.mjs
module/config/config-export.mjs
module/documents/merchant-conversion.mjs
module/documents/merchant-flags.mjs
module/documents/merchant-access.mjs
module/documents/merchant-products.mjs
module/documents/storage-flags.mjs
module/documents/storage-access.mjs
module/applications/sheets/merchant-sheet.mjs
module/applications/sheets/merchant-catalog.mjs
module/applications/sheets/merchant-trade.mjs
module/applications/sheets/merchant-dialogs.mjs
module/applications/sheets/merchant-utils.mjs
module/applications/sheets/storage-sheet.mjs
module/applications/sheets/storage-content.mjs
module/applications/sheets/storage-trade.mjs
module/applications/sheets/mtt-sheet-common.mjs
templates/actors/merchant-sheet.hbs
templates/actors/storage-sheet.hbs
templates/actors/parts/merchant-access-rail.hbs
templates/dialogs/confirm-dialog.hbs
styles/mtt.less
css/mtt.css
lang/fr.json
lang/en.json
```

Éviter les majuscules dans les chemins.

---

## 10. Localisation

Toute chaîne affichée à l’utilisateur doit passer par les fichiers de langue.

Cela concerne :

- titres ;
- boutons ;
- labels ;
- tooltips ;
- notifications ;
- dialogues ;
- settings ;
- titres de feuilles ;
- messages utiles dans la console.

Le namespace de localisation est `mtt`.

Les fichiers `lang/fr.json` et `lang/en.json` doivent rester alignés.

Quand une clé visible est ajoutée, modifiée, renommée ou supprimée, mettre à jour les deux fichiers.

Ne pas conserver de clés de langue inutilisées pour d’anciennes décisions.

---

## 11. CSS / Less

Toutes les classes CSS propres au module doivent être préfixées par `mtt-`.

Classes acceptées en principe :

```text
mtt-sheet
mtt-merchant-sheet
mtt-merchant-window
mtt-merchant-form
mtt-merchant-header
mtt-merchant-main
mtt-merchant-tab-nav
mtt-merchant-product-row
mtt-merchant-service-row
mtt-merchant-session
mtt-merchant-access-rail
mtt-storage-sheet
mtt-storage-window
mtt-storage-content
mtt-storage-session
mtt-dialog
mtt-config
```

Classes à éviter seules :

```text
sheet
header
content
sidebar
main
item
item-list
card
actions
button
title
```

Le CSS compilé doit aller dans :

```text
css/mtt.css
```

Le CSS local modifié manuellement par l’utilisateur doit être préservé.

Ne pas réécrire/refactoriser le CSS des produits, du rail client, des sessions ou du layout général sans nécessité explicite.

Les boutons MTT doivent être compacts, avec icône Font Awesome et tooltip localisé, surtout dans les zones denses.

---

## 12. Architecture JavaScript marchand

La feuille marchand est séparée en plusieurs fichiers cohérents. Respecter cette organisation.

### `module/applications/sheets/merchant-sheet.mjs`

Fichier principal et orchestrateur de la feuille marchand.

Il contient la classe `MerchantSheet`, les options, les parties de template, la préparation du contexte, le rendu, les actions Application V2 et les appels vers les fonctions spécialisées.

Ce fichier pourra être séparé plus tard, mais ne pas commencer par un refactor massif tant que ce n’est pas demandé.

### `module/applications/sheets/merchant-catalog.mjs`

Catalogue du marchand.

Il regroupe :

- produits ;
- services ;
- catégories ;
- sous-catégories ;
- catégories automatiques ;
- drops ;
- déplacement de produit ;
- ajout/fusion de produit ;
- création de services ;
- prix ;
- prix libre ;
- quantités ;
- masquage ;
- secrets ;
- approbation MJ ;
- copie produit/service.

Produits et services restent ensemble dans ce fichier.

### `module/applications/sheets/merchant-trade.mjs`

Échange entre client et marchand.

Ce fichier peut rester volumineux tant qu’il reste cohérent.

Il regroupe :

- sessions de transaction ;
- buyerItems ;
- sellerItems ;
- quantités ;
- totaux ;
- ajustement monétaire ;
- vérification transaction ;
- validation/refus ;
- transfert objets/monnaies ;
- livraison ;
- fusion/stacking ;
- négociation ;
- visibilité de session.

Ne pas le découper sauf demande explicite.

### `module/applications/sheets/merchant-dialogs.mjs`

Centralise les dialogues MTT.

Les dialogues importants doivent utiliser les templates dédiés dans :

```text
templates/dialogs/
```

Éviter le HTML brut dispersé dans les MJS.

### `module/applications/sheets/merchant-utils.mjs`

Utilitaires simples et réutilisables.

Ne pas transformer ce fichier en fourre-tout.

---

## 13. Architecture commune future

Découpage futur possible :

```text
module/applications/sheets/mtt-sheet-common.mjs
  → fonctions communes de feuille MTT
  → helpers UI, positionnement, mémorisation scroll, activation listeners communs

module/applications/sheets/merchant-sheet.mjs
  → fonctions spécifiques marchand

module/applications/sheets/storage-sheet.mjs
  → fonctions spécifiques stockage
```

Règle pour les stockages :

```text
À chaque fonction nécessaire pour le stockage, vérifier si elle existe déjà côté marchand.
```

Si oui :

- déplacer vers une partie commune uniquement si le stockage en a réellement besoin ;
- ne pas changer le comportement marchand ;
- garder le nom clair ;
- éviter les wrappers inutiles ;
- ne pas créer de surcouche générique si un helper simple suffit.

Si non :

- créer la fonction côté stockage ;
- ne pas anticiper une généralisation inutile.

---

## 14. Architecture marchand actuelle

MTT ne crée plus de type d’acteur marchand dédié.

Le MJ crée un acteur système normal d’un type autorisé puis le convertit en marchand via les options d’en-tête de sa feuille acteur.

L’acteur reste l’acteur support/gérant. Son `actor.type` reste celui du système actif.

Les données marchand sont stockées dans :

```text
flags.mtt-merchants.merchant
```

La détection d’un marchand MTT se fait via :

```js
isMTTMerchant(actor)
```

`module/config/actor-types.mjs` sert uniquement à lire, normaliser et vérifier les types d’acteurs du système actif autorisés à être convertis en marchand. Il ne doit jamais déclarer, ajouter, exposer ou sauvegarder `merchant` / `mtt-merchants.merchant` comme type d’acteur Foundry.

Le mot `merchant` reste valide comme nom métier et comme nom de flag dans `flags.mtt-merchants.merchant`, mais il est interdit comme type d’acteur Foundry.

Ne pas réintroduire :

- `CONFIG.Actor.dataModels["mtt-merchants.merchant"]` ;
- `Actors.registerSheet(...)` avec `types: ["mtt-merchants.merchant"]` ;
- `actor.type === "mtt-merchants.merchant"` ;
- tout test `actor.type` pour identifier un marchand MTT.

---

## 15. Données marchand

Toutes les données marchand sont stockées dans les flags Foundry de l’acteur support, pas dans `actor.system`.

Structure principale :

```text
flags.mtt-merchants.merchant.enabled
flags.mtt-merchants.merchant.shop.name / img / description
flags.mtt-merchants.merchant.manager.mode / displayName / actorUuid / img
flags.mtt-merchants.merchant.sheet.isLocked
flags.mtt-merchants.merchant.catalog.services[]
flags.mtt-merchants.merchant.sessions.entries[]
flags.mtt-merchants.merchant.access.clients[]
flags.mtt-merchants.merchant.wallet.currencies
flags.mtt-merchants.merchant.trade.sellPercent / buyPercent / serviceSellPercent / negotiationFormula
flags.mtt-merchants.merchant.journal.transactions[]
flags.mtt-merchants.merchant.referenceState
```

Helpers centralisés dans `module/documents/merchant-flags.mjs` :

```js
getMerchantData(actor)
setMerchantData(actor, data)
updateMerchantData(actor, changes)
isMTTMerchant(actor)
getMerchantFlagPath(path)
```

Aucune donnée marchand ne doit être écrite dans `actor.system`.

Ne pas utiliser `TypeDataModel` pour les données marchand MTT.

---

## 16. Produits marchands actuels

Décision actuelle importante :

```text
Les produits du catalogue sont de vrais Embedded Items de l’acteur support.
```

Un produit marchand est un Item de `actor.items` dont les flags MTT indiquent qu’il est activé comme produit catalogue.

Ne pas revenir à l’ancien modèle où les produits étaient des plain objects dans :

```text
flags.mtt-merchants.merchant.catalog.products[]
```

Les données produit MTT doivent être en flags sur l’Item.

Exemples :

```text
flags.mtt-merchants.product.enabled
flags.mtt-merchants.product.sourceUuid
flags.mtt-merchants.product.quantity
flags.mtt-merchants.product.category
flags.mtt-merchants.product.isHidden
flags.mtt-merchants.product.requiresApproval
flags.mtt-merchants.product.ownershipLevel
flags.mtt-merchants.product.secrets
flags.mtt-merchants.product.hasFreePrice
flags.mtt-merchants.product.minimumPriceValue
flags.mtt-merchants.product.isCommerciallyModified
```

Les helpers liés aux produits se trouvent dans :

```text
module/documents/merchant-products.mjs
```

La copie produit/service du menu contextuel doit créer une nouvelle ligne indépendante, quantité `1`, sans diminuer la ligne d’origine, et conserver `sourceUuid`.

---

## 17. Services

Les services restent stockés dans :

```text
flags.mtt-merchants.merchant.catalog.services[]
```

Un service acheté :

- ne crée pas automatiquement un Item sur l’acteur acheteur ;
- est journalisé ;
- peut avoir un stock limité ou illimité ;
- peut avoir un prix libre ;
- peut demander une approbation MJ ;
- peut avoir des informations secrètes.

Quantité service vide, `null` ou `undefined` = illimité.

Un nouveau service doit initialiser sa monnaie de prix avec la monnaie de référence par défaut.

---

## 18. Catégories et sous-catégories marchand

MTT distingue :

1. le type Foundry de l’Item ;
2. le type/sous-type/catégorie système lu via des chemins configurés ;
3. la catégorie marchande MTT, indépendante et modifiable.

Les catégories automatiques doivent utiliser des chemins configurables.

La catégorie automatique issue du système ne doit jamais modifier l’Item source.

Si le MJ déplace un produit vers une autre catégorie, ne pas le remettre automatiquement dans sa catégorie système.

Les catégories personnalisées globales sont copiées une seule fois à la conversion en catégories locales du marchand. Pas de resynchronisation automatique ensuite.

La catégorie “Sans catégorie” doit être affichée à la fin du catalogue.

Le clic droit sur une catégorie principale peut appliquer une action de masse aux produits de cette catégorie :

- passer tous les produits en Limited ou Observer ;
- demander l’approbation MJ sur tous les produits ;
- retirer l’approbation MJ sur tous les produits.

Ces actions modifient directement chaque produit, pas la catégorie. Si le produit change ensuite de catégorie, il conserve son droit et son statut d’approbation.

---

## 19. Monnaies et prix

Le tableau des devises est la source actuelle pour les prix et monnaies.

Ne pas réintroduire les anciens settings globaux :

```text
itemPriceValuePath
itemPriceCurrencyPath
actorCurrencyPath
```

Lecture et écriture du prix Item doivent passer par les fonctions actuelles fondées sur le tableau des devises.

Si le tableau des devises n’est pas configuré correctement, afficher une notification claire au MJ.

---

## 20. Informations secrètes

Un produit ou service peut avoir :

- nom secret ;
- prix secret ;
- monnaie secrète ;
- description secrète.

Ces informations sont réservées au MJ et aux utilisateurs ayant les droits appropriés.

Le joueur ne doit pas voir de bouton ou d’indicateur lui révélant qu’un secret existe.

Dans le journal, les secrets ne doivent pas exposer leur contenu aux acheteurs.

---

## 21. Prix libre et négociation

Le prix classique d’un produit/service peut être ajusté par les pourcentages du marchand et les taux personnalisés du client actif.

Le prix libre doit rester compact, avec icône, tooltip, prix minimum MJ caché et décision manuelle du MJ.

Le test de négociation n’a aucun rôle automatique. Il sert seulement d’outil MJ.

---

## 22. Rail clients et sessions marchand

Le MJ gère les clients autorisés via le rail de cards.

Logique :

- acteur non autorisé : clic gauche = autoriser ;
- acteur autorisé : clic gauche = ouvrir/sélectionner sa session ;
- retirer une autorisation : clic droit / menu contextuel ;
- supprimer l’acteur du marchand : clic droit / menu contextuel.

Quand un acteur est autorisé à commercer, une session doit exister pour lui chez ce marchand.

Un acteur ne peut avoir qu’une seule session par marchand.

Toutes les transactions passent par une session.

La session contient :

```text
Le PJ achète / reçoit
Le PJ vend / donne
```

L’ajustement monétaire automatique est une ligne dans l’une de ces deux parties.

Quand une session est validée, la transaction est exécutée, le journal est écrit, et l’acteur repart sur une session vide.

Quand une session est refusée, aucune transaction réelle n’est appliquée, le journal est écrit, et l’acteur repart sur une session vide.

---

## 23. Render, update et scroll marchand

Terminologie de travail pour ce projet :

```text
update = mise à jour globale qui modifie l’acteur marchand et peut impacter toutes les feuilles ouvertes
render = rafraîchissement local de la feuille utilisateur
```

Les grosses modifications du marchand peuvent utiliser un update :

- catalogue ;
- configuration ;
- changement de catégorie ;
- validation/refus ;
- modification réelle de stock ;
- journalisation ;
- masquage ;
- prix ;
- services.

Les interactions de session utilisent les renders existants et ne doivent pas être complexifiées tant que la mémorisation du scroll rend l’expérience fluide.

La position des scrolls doit être préservée lors des renders/updates de la feuille marchand :

- onglet produits ;
- onglet services ;
- onglet configuration si scrollable ;
- journal ;
- session ;
- autres conteneurs scrollables pertinents.

---

## 24. Quantités disponibles et réservations

Le catalogue marchand tient compte des quantités engagées dans les sessions pertinentes.

Logique :

```text
stockTotal = quantité réelle du produit chez le marchand
reservedQuantity = quantités déjà engagées dans les sessions actives/submitted/pending pertinentes
availableQuantity = stockTotal - reservedQuantity
```

L’affichage produit doit rester compact :

```text
8x
8x!
```

Le `!` indique que le stock réel est partiellement engagé dans une ou plusieurs sessions.

Le tooltip de la quantité indique :

```text
disponible / stock réel
```

Exemple :

```text
8/10
```

La validation finale doit toujours revérifier la disponibilité réelle.

---

## 25. Livraison et fusion des objets

Lors d’un achat validé, MTT doit :

- copier l’Item marchand actuel ;
- créer ou fusionner l’Item sur l’acteur client ;
- appliquer la quantité achetée ;
- appliquer l’origine visible si configurée ;
- ajouter les informations secrètes si configurées ;
- accorder les droits prévus sur l’objet livré ;
- respecter les quantités maximales uniquement sur l’acteur destinataire.

La quantité max ne limite pas le stock du marchand.

---

## 26. Permissions marchand

La matrice de permissions marchand doit rester simple.

Permissions configurables validées :

```text
canViewConfigTab
canViewApprovalStatus
canViewPrices
canOpenProduct
canInteractWithSession
canAddActorToMerchantRail
canViewOtherActorsInRail
canViewObserverActorSessions
canValidateOrRefuseSessions
canViewObserverActorJournalEntries
```

Colonnes configurables :

```text
limited
observer
owner
```

Le MJ a toujours toutes les permissions à `true`.

Le profil `owner` est configurable. Par défaut il peut tout faire, mais un MJ peut désactiver certaines permissions owner.

Ne pas rendre configurables :

- produits/services/catégories masqués ;
- indicateurs de secrets ;
- stock exact ;
- fonctions profondes de gestion marchand.

Conserver uniquement :

```text
isEditable
canEditMerchant
```

pour la gestion profonde du marchand.

Ne pas réintroduire :

```text
canUserManageMerchant
isOwnerLike
```

`canUserManageMerchant` est redondant avec `canEditMerchant`.

`isOwnerLike` mélangeait GM et Owner et doit rester supprimé.

---

## 27. Journal marchand et journal global

Le journal marchand existe.

Le journal global existe.

La visibilité est filtrée selon les droits et permissions actuels.

Les sessions validées/refusées sont copiées dans le journal du marchand.

Les secrets ne doivent pas exposer leur contenu aux acheteurs.

Ne pas prévoir d’annulation automatique après coup.

---

## 28. Configuration du module

Le module doit permettre de configurer des chemins pour rester universel.

Options importantes :

- types d’acteurs convertibles en marchand ;
- futurs types d’acteurs convertibles en stockage ;
- types d’Items autorisés comme produits ;
- types d’Items autorisés comme services ;
- chemins de quantité ;
- chemins de quantité max de livraison ;
- chemins de description visible ;
- chemins de description secrète ;
- chemins de catégories automatiques ;
- mapping de libellés de catégories ;
- catégories personnalisées globales ;
- sous-catégories ;
- préfixes i18n simples ;
- tableau des devises ;
- monnaie de référence ;
- matrice de permissions marchand.

L’import/export de configuration est géré via :

```text
module/config/config-export.mjs
```

---

## 29. Stockage MTT — vision fonctionnelle

Le stockage MTT représentera :

- coffre ;
- réserve de groupe ;
- stockage personnel ;
- charrette ou monture ;
- salle au trésor ;
- dépôt de butin.

Le stockage n’est pas une boutique sans prix.

Différence métier :

```text
Marchand MTT :
acheter, vendre, prix, tarifs, négociation, transaction commerciale.

Stockage MTT :
déposer, demander, retirer, trier, voter, répartir, tracer les mouvements.
```

Feuille stockage souhaitée :

- visuellement proche du marchand ;
- palette de couleurs distincte ;
- layout inversé ;
- rail acteurs/session à gauche ;
- contenu du stockage à droite.

Le contenu du stockage doit afficher :

- quantité ;
- image ;
- nom ;
- catégorie ;
- tags ;
- statuts techniques ;
- actions.

Le stockage doit utiliser des sessions d’échange, pas du retrait libre généralisé.

---

## 30. Stockage MTT — développement progressif

Ordre de développement prévu :

1. Introduire le type logique MTT `storage`.
2. Ajouter la conversion MTT avec choix Marchand / Stockage.
3. Ajouter les types d’acteurs convertibles en stockage dans la configuration.
4. Créer les helpers de flags stockage.
5. Créer la feuille stockage minimale.
6. Créer les templates de base.
7. Ajouter une palette CSS distincte et un layout inversé.
8. Afficher le contenu du stockage.
9. Gérer les catégories du stockage.
10. Ajouter les tags d’information.
11. Ajouter les statuts techniques.
12. Créer les sessions d’échange.
13. Ajouter les actions de dépôt.
14. Ajouter les actions de retrait/demande.
15. Valider/refuser les sessions d’échange.
16. Exécuter les transferts réels.
17. Journaliser les mouvements.
18. Ajouter demandes/votes.
19. Ajouter gestion des monnaies.
20. Ajouter répartition de monnaie.

Ne pas ajouter les étapes de test ou de consolidation dans les instructions de développement sauf demande explicite de l’utilisateur.

---

## 31. Tags et statuts du stockage

Distinguer clairement tags humains et statuts techniques.

Tags d’information :

- À garder ;
- Attention particulière ;
- Réservé ;
- Sans intérêt / à vendre / à archiver.

Important :

```text
“Sans intérêt”, “à vendre” et “à archiver” forment un seul tag fonctionnel.
```

Statuts techniques :

- objet bloqué ;
- objet qui demande validation MJ avant retrait ;
- objet invisible ;
- objet normal avec warning MJ/chat si récupéré.

Les tags servent au tri et à l’intention humaine.

Les statuts servent aux règles techniques.

Ne pas mélanger les deux.

---

## 32. Permissions stockage futures

Le stockage devra utiliser une table centrale de permissions par profil, mais elle devra rester simple.

Niveaux prévus :

```text
limited
observer
owner
gm
```

Le MJ peut tout faire.

Ne pas partir dans une liste excessive de micro-permissions.

Définir seulement les permissions réellement utiles pour l’interface stockage :

- voir le stockage ;
- voir le contenu ;
- ouvrir un Item ;
- déposer ;
- demander/retrait ;
- voir les sessions selon droits ;
- valider/refuser ;
- gérer tags/statuts si prévu ;
- gérer catégories si prévu ;
- gérer accès si prévu ;
- répartir monnaie si prévu.

Les permissions doivent être utilisées côté HBS et revérifiées côté JS.

---

## 33. Fondations communes à préparer progressivement

Ne pas créer immédiatement un gros framework commun.

Préparer progressivement des helpers communs pour :

- permissions par profils `can...` ;
- rail d’acteurs autorisés ;
- cartes d’acteurs avec niveau de droit ;
- sessions par acteur ;
- calcul des quantités réservées ;
- disponibilité réelle ;
- transferts d’Items ;
- fusion intelligente ;
- respect de la quantité max seulement à la livraison ;
- catégories ;
- drag & drop vers catégorie ;
- menus contextuels ;
- journalisation ;
- dialogues ;
- recherche/filtre/tri ;
- mémorisation de scroll.

Principe :

```text
Le marchand fonctionne : ne pas le casser.
Le stockage arrive : réutiliser ce qui existe quand c’est pertinent.
Extraire en commun seulement quand les deux usages le justifient vraiment.
```

---

## 34. Relation avec Chroniques Oubliées 2

CO2 est le premier environnement de test et le futur premier preset.

Le cœur MTT doit rester générique.

Les règles spécifiques CO2 doivent rester isolées plus tard dans un preset CO2.

Le cœur MTT ne doit pas coder CO2 en dur.

Ne pas ajouter de migration MTT pour corriger des données internes CO2.

---

## 35. Dialogues et notifications

Les dialogues MTT doivent utiliser une structure stylable propre au module, avec des classes `mtt-dialog`.

Les dialogues importants doivent utiliser les templates dédiés dans :

```text
templates/dialogs/
```

Éviter les contenus HTML bruts dispersés dans les MJS.

Supprimer les doubles confirmations inutiles.

Les notifications info pour actions normales doivent être évitées.

Conserver les notifications pour :

- erreurs ;
- warnings ;
- actions impossibles ;
- blocages de sécurité ;
- drop invalide ;
- quantité invalide ;
- stock insuffisant ;
- monnaie insuffisante ;
- configuration manquante.

---

## 36. Presets système

Les presets système sont une direction future.

Un preset CO2 pourra configurer automatiquement :

- devises ;
- chemins prix/monnaie ;
- chemins quantité ;
- chemins catégorie/sous-catégorie ;
- types autorisés ;
- chemins description visible/secrète.

Le cœur MTT ne doit pas coder CO2 en dur.

---

## 37. Instructions pour Codex / Claude Code

Les instructions destinées à Codex ou Claude Code doivent mentionner :

```text
Lis le fichier `agents.md` à la racine du dépôt.
Attention : le fichier est nommé `agents.md` en minuscules, pas `AGENTS.md`.
```

Ne pas demander de lire `AGENTS.md`.

Quand l’utilisateur demande un bloc pour Codex ou Claude Code, fournir toutes les instructions dans un seul bloc copiable.

Ne pas mettre de consignes importantes hors du bloc copiable.

Quand Codex ou Claude Code modifie les fichiers :

- lire `agents.md` avant de modifier ;
- vérifier la roadmap et l’état actuel avant de changer une logique ;
- respecter le fait que la partie marchand fonctionne ;
- ne pas casser une fonction marchand validée ;
- éviter les gros changements non demandés ;
- ne pas ajouter de fonctionnalités avancées sans demande explicite ;
- respecter le style sans point-virgule ;
- maintenir `lang/fr.json` et `lang/en.json` quand une clé visible change ;
- respecter les classes CSS préfixées `mtt-` ;
- ne pas introduire de dépendance directe au système CO2 dans le cœur MTT ;
- ne pas ajouter de dépendances npm sans validation ;
- ne pas refactoriser massivement sans demande explicite ;
- préserver les corrections CSS locales ;
- préserver le rail client et ne pas casser le layout global Foundry ;
- respecter la séparation entre fichiers marchand actuels ;
- ne pas réintroduire de compatibilité legacy supprimée ;
- ne pas réintroduire d’anciens settings supprimés ;
- ne pas réintroduire l’ancien modèle produits plain objects dans les flags ;
- ne pas réintroduire de type d’acteur marchand dédié ;
- ne pas utiliser les globals Foundry dépréciés ;
- ne pas créer de rapport `.md` sauf demande explicite de l’utilisateur.
