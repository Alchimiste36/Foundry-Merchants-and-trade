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

Le fichier d’instructions du projet est nommé :

```text
agents.md
```

en minuscules.

Ne pas chercher uniquement `AGENTS.md`.

L’utilisateur est néophyte en développement. Les modifications doivent rester cohérentes avec l’existant, faciles à relire, faciles à tester et éviter les refontes massives non demandées.

---

## 2. Principe directeur du projet

MTT doit devenir un module multi-types reposant sur une **base commune stable**.

Le marchand actuel n’est pas seulement une fonctionnalité isolée. Il est aussi la première implémentation fonctionnelle et validée de la base de feuille MTT.

La logique de développement doit donc être :

```text
Ne pas recréer une interface ou des fonctions en parallèle si une base fonctionnelle existe déjà.
Partir de l’existant validé.
Réutiliser.
Adapter progressivement.
Spécialiser seulement quand c’est réellement nécessaire.
```

Objectif prioritaire :

```text
Une seule fondation MTT stable,
puis des variantes métier :
- boutique / marchand commercial ;
- stockage / réserve ;
- autres types MTT futurs.
```

---

## 3. Convention majeure de nommage logique

Le projet utilise beaucoup de fichiers nommés `merchant-*`.

À partir de maintenant, cette convention doit être comprise ainsi :

```text
merchant-* = base stable du module MTT, contenant les parties communes
storage-*  = uniquement ce qui est propre au stockage
shop-*     = uniquement ce qui est propre à la boutique / marchand commercial
```

Important :

```text
merchant-* ne veut pas automatiquement dire “interdit au stockage”.
```

Le module s’appelle **Merchants, Trades and Transactions**. Il est acceptable que les fichiers `merchant-*` restent la base commune du module.

### Règle opérationnelle

Avant de créer une fonction, un fichier HBS, un fichier LESS ou un helper `storage-*`, vérifier si un équivalent existe déjà dans les fichiers `merchant-*`.

Si un équivalent existe :

```text
Ne pas le recréer côté stockage.
Ne pas créer une variante légèrement différente.
Ne pas le renommer.
L’utiliser comme base commune.
```

Créer du `storage-*` uniquement pour ce qui est réellement propre au stockage.

Créer du `shop-*` uniquement pour ce qui est réellement propre à la boutique / marchand commercial.

---

## 4. Distinction entre base commune, boutique et stockage

Le code MTT doit progressivement distinguer trois familles de logique.

### 4.1. Base commune MTT

La base commune MTT concerne les éléments utiles à plusieurs types MTT.

Exemples :

- structure de feuille ;
- header partagé ;
- verrouillage de feuille ;
- mémorisation des scrolls ;
- rail d’acteurs autorisés ;
- cards d’acteurs ;
- niveaux de droits ;
- sessions associées à un acteur ;
- ajout d'un item dans le stockage ;
- affichage de lignes d’Items ;
- objet invisible ;
- objet à validation MJ ;
- ouverture d’un Item par clic sur son image ;
- quantités ;
- catégories ;
- journaux ;
- fusion des items dans le catalogue ;
- fusion des items après livraison ;
- validation de la session ;
- refus de la session ;
- trésorerie de l'acteur ;
- livraison des items sur le client ;
- drag/drop générique ;
- menus contextuels génériques ;
- journalisation générique ;
- dialogues communs ;
- helpers Foundry ;
- rendu compact des boutons ;
- CSS de structure.

Ces éléments restent dans les fichiers `merchant-*`.

### 4.2. Boutique / marchand commercial

La logique boutique concerne uniquement le marchand commercial.

Exemples :

- prix ;
- devises de prix ;
- vente ;
- achat ;
- services ;
- négociation ;
- prix libre ;
- pourcentages d’achat/vente ;
- ajustement monétaire ;
- secrets commerciaux ;
- gérant de boutique si spécifique à la boutique.

Ces éléments pourront plus tard être déplacés vers des fichiers `shop-*`, mais ce déplacement n’est pas prioritaire.

### 4.3. Stockage

La logique stockage concerne uniquement le stockage.

Exemples :

- dépôt ;
- retrait ;
- demande de retrait ;
- décision de groupe ;
- votes ;
- tags de tri ;
- statuts techniques de stockage ;
- objet bloqué ;
- journal de mouvements ;
- répartition de monnaie ;
- réserve / coffre / butin ;
- règles spécifiques de session d’échange stockage.

Ces éléments doivent aller dans des fichiers `storage-*` quand ils n’existent pas déjà comme mécanique commune.

---

## 5. Commentaires obligatoires pour clarifier la propriété du code

Quand un bloc, une fonction, une section HBS ou un groupe LESS devient utilisé par plusieurs types MTT, il doit être clairement commenté.

Le but n’est pas de commenter chaque ligne. Le but est d’identifier les blocs importants pour faciliter un nettoyage futur.

### 5.1. Commentaire pour code commun

JavaScript :

```js
// MTT base — logique commune
```

HBS :

```hbs
{{! MTT base — bloc commun }}
```

LESS :

```less
/* MTT base — styles communs */
```

### 5.2. Commentaire pour code uniquement boutique / marchand commercial

JavaScript :

```js
// MTT shop — logique propre à la boutique
```

HBS :

```hbs
{{! MTT shop — bloc propre à la boutique }}
```

LESS :

```less
/* MTT shop — styles propres à la boutique */
```

### 5.3. Commentaire pour code uniquement stockage

JavaScript :

```js
// MTT storage — logique propre au stockage
```

HBS :

```hbs
{{! MTT storage — bloc propre au stockage }}
```

LESS :

```less
/* MTT storage — styles propres au stockage */
```

### 5.4. Quand ajouter ces commentaires

Ajouter un commentaire quand :

- une fonction `merchant-*` est utilisée par le stockage ;
- une section HBS `merchant-*` reçoit une condition `isMerchant` / `isStorage` ;
- un bloc LESS `merchant-*` est volontairement partagé ;
- une logique commerciale reste dans un fichier commun et doit être identifiable comme future logique `shop-*` ;
- une logique stockage nouvelle est ajoutée.

Ne pas ajouter de commentaires inutiles sur chaque variable ou chaque ligne.

---

## 6. Règle anti-duplication

Avant toute nouvelle fonction, rechercher dans l’existant.

Règle stricte :

```text
Si une fonction existante fait déjà le travail, ne pas en créer une deuxième.
```

Exemples :

- si `getItemAvailableQuantity` existe déjà côté marchand/base, ne pas recréer `getItemAvailableQuantity` côté stockage ;
- si l’ouverture d’Item existe déjà par clic image, ne pas ajouter une nouvelle icône d’ouverture ;
- si une logique de verrouillage existe déjà, ne pas créer un nouveau verrouillage stockage ;
- si un rail acteur existe déjà, ne pas créer un rail stockage interne différent ;
- si une ligne produit existe déjà, ne pas créer une ligne stockage avec une ergonomie différente.

Quand une fonction existante doit être utilisée par le stockage :

1. vérifier si elle peut être utilisée telle quelle ;
2. si oui, l’utiliser sans changement ;
3. si elle nécessite une adaptation légère, l’adapter en préservant le comportement marchand ;
4. commenter la fonction comme `MTT base` ;
5. ne pas renommer la fonction si le renommage n’est pas nécessaire ;
6. ne pas créer une copie spécifique stockage.

---

## 7. Règle d’interface : copie stricte avant adaptation

Pour le stockage, la règle n’est pas :

```text
Créer une interface stockage inspirée du marchand.
```

La règle est :

```text
Utiliser la feuille marchand/base comme socle réel.
Modifier uniquement ce qui est demandé.
```

Conséquences :

- ne pas ajouter une icône si l’équivalent marchand n’en a pas ;
- ne pas ajouter un badge si l’équivalent marchand n’en a pas ;
- ne pas déplacer un bouton sans demande ;
- ne pas changer l’ouverture d’un Item ;
- ne pas changer les classes CSS ;
- ne pas changer la densité des lignes ;
- ne pas changer la structure des sections ;
- ne pas changer la place du rail ;
- ne pas créer un onglet supplémentaire si la zone existe déjà dans le layout ;
- ne pas répéter une information déjà portée par la catégorie.

Exemple important :

```text
Si la ligne marchand ouvre l’Item par clic sur l’image,
la ligne stockage doit ouvrir l’Item par clic sur l’image.

Si la ligne marchand n’a pas d’icône “ouvrir”,
la ligne stockage ne doit pas avoir d’icône “ouvrir”.

Si la catégorie affiche déjà le type ou la catégorie,
la ligne stockage ne doit pas ajouter un badge type.
```

Toute différence visible entre marchand/base et stockage doit être justifiée par :

- une demande explicite de l’utilisateur ;
- une différence métier indispensable ;
- une limitation technique réelle expliquée.

---

## 8. Variables de contexte et types MTT

Les feuilles MTT doivent savoir quel type MTT elles affichent.

Prévoir dans les contextes HBS des variables simples :

```js
entityType
isStorage
isShop
isMTTBase
mttAccent
```

Ne pas multiplier inutilement les booléens.

Le type logique doit venir de :

```text
flags.mtt-merchants.type
```

Valeurs prévues :

```text
merchant
storage
```

Un acteur MTT est en usage normal un seul type MTT à la fois.

```text
Un acteur marchand n’est pas un stockage.
Un acteur stockage n’est pas un marchand.
```

Il faut donc éviter de coder par peur d’un mélange simultané des deux types sur une même feuille.

---

## 9. HBS : logique commune et variantes

Quand un HBS est partagé par marchand et stockage, utiliser des conditions simples.

Exemple :

```hbs
{{! MTT base — header commun marchand/stockage }}
<header class="mtt-merchant-header">
  ...

  {{#if isShop}}
    {{! MTT shop — informations boutique/gérant }}
    ...
  {{/if}}

  {{#if isStorage}}
    {{! MTT storage — informations stockage }}
    ...
  {{/if}}
</header>
```

Règles :

- garder les classes existantes si elles portent la structure commune ;
- ajouter des classes `mtt-storage-*` seulement en complément ;
- éviter de dupliquer un fichier HBS entier si seules quelques conditions changent ;
- ne pas créer une version storage parallèle d’un bloc qui fonctionne déjà ;
- ne pas supprimer un bloc commun sans vérifier son usage marchand.

---

## 10. LESS : base commune et variantes

Le CSS actuel peut utiliser des classes `mtt-merchant-*` comme base commune.

Ne pas tout renommer maintenant.

Règle :

```text
Les classes `mtt-merchant-*` peuvent rester la base commune de structure si elles sont déjà utilisées et stables.
```

Pour les variantes, utiliser des classes racines et des variables CSS.

Exemple :

```less
.mtt-merchant-form {
  --mtt-accent: #c9923e;
}

.mtt-storage-form {
  --mtt-accent: #5ba3bf;
}
```

Puis les styles communs doivent utiliser :

```less
color: var(--mtt-accent);
border-color: var(--mtt-accent);
```

Règles :

- ne pas dupliquer tout le CSS marchand en CSS stockage ;
- ne pas renommer toutes les classes pour le stockage ;
- ne pas créer une feuille visuellement différente sans demande ;
- ne pas ajouter de glow, badges ou décorations fantaisie ;
- conserver les styles compacts ;
- préserver le CSS local modifié par l’utilisateur.

---

## 11. Architecture générale actuelle

Les fichiers `merchant-*` actuels sont stables et servent de base.

### `module/applications/sheets/merchant-sheet.mjs`

Fichier principal et orchestrateur de la feuille MTT commune.

Il contient la classe de feuille, les options, les parties de template, la préparation du contexte, le rendu, les actions Application V2 et les appels vers les fonctions spécialisées.

Il peut contenir du commun, du shop historique et des points d’extension stockage.

Ne pas le réécrire massivement.

### `module/applications/sheets/merchant-catalog.mjs`

Catalogue / contenu de la feuille MTT commune.

Il contient actuellement la logique produits/services/catégories du marchand.

Certaines fonctions peuvent être communes :

- affichage d’Items ;
- quantités ;
- catégories ;
- ouverture Item ;
- drag/drop ;
- actions de ligne ;
- déplacement de catégorie.

D’autres sont `shop` :

- prix ;
- services ;
- secrets commerciaux ;
- approbation marchand ;
- prix libre.

### `module/applications/sheets/merchant-trade.mjs`

Sessions et transactions historiques du marchand.

Certaines mécaniques peuvent devenir communes :

- session par acteur ;
- sélection d’acteur ;
- lignes de session ;
- quantités en session ;
- validation/refus de session ;
- journalisation de base.

D’autres sont `shop` :

- achat ;
- vente ;
- ajustement monétaire commercial ;
- négociation ;
- livraison d’un achat.

### `module/applications/sheets/merchant-dialogs.mjs`

Dialogues MTT historiques.

Peut contenir du commun et du shop.

Les dialogues importants doivent utiliser les templates dédiés dans :

```text
templates/dialogs/
```

### `module/applications/sheets/merchant-utils.mjs`

Utilitaires simples.

Peut contenir du commun.

Ne pas transformer ce fichier en fourre-tout.

### Fichiers `storage-*`

Créer uniquement pour la logique réellement propre au stockage.

Exemples :

```text
module/applications/sheets/storage-sheet.mjs
module/applications/sheets/storage-content.mjs
module/applications/sheets/storage-exchange.mjs
module/documents/storage-flags.mjs
module/documents/storage-access.mjs
```

Ne pas créer un fichier `storage-*` pour copier une fonction déjà présente dans un fichier `merchant-*`.

### Fichiers `shop-*`

Fichiers futurs pour isoler ce qui est purement marchand commercial.

Ne pas créer ou déplacer massivement vers `shop-*` tant que le stockage n’est pas stabilisé, sauf demande explicite.

---

## 12. Méthode de développement du stockage

Le développement du stockage doit suivre cette méthode.

### 12.1. Étape de base logique

Créer ou vérifier :

```text
flags.mtt-merchants.type = "storage"
flags.mtt-merchants.storage = { ... }
```

Créer les helpers de flags stockage :

```text
module/documents/storage-flags.mjs
```

Ce fichier est spécifique stockage car il manipule les données propres au stockage.

### 12.2. Réutiliser la base marchand/base

Pour la feuille, ne pas créer une feuille stockage indépendante.

Partir des fichiers `merchant-*` comme base commune.

Si une zone de la feuille doit exister pour le stockage et existe déjà côté marchand/base, la réutiliser.

### 12.3. Ajouter les conditions métier minimales

Utiliser des conditions :

```hbs
{{#if isShop}}{{/if}}

{{#if isStorage}}{{/if}}
```

ou côté JS :

```js
if (context.isStorage) {
  ...
}
```

Mais ne pas transformer chaque ligne en forêt de conditions.

Si un bloc devient trop différent, il pourra plus tard être extrait proprement.

### 12.4. Développer les fonctions exclusives stockage ensuite

Une fois le squelette commun utilisé, ajouter progressivement :

- contenu stockage ;
- catégories stockage ;
- tags ;
- statuts ;
- sessions d’échange ;
- dépôt ;
- retrait ;
- validation ;
- journal de mouvements ;
- votes ;
- répartition de monnaie.

Chaque fonction exclusive doit aller dans `storage-*`.

---

## 13. Rapports de développement

Règle générale :

```text
Ne pas créer de rapport `.md` après chaque instruction.
Créer un rapport uniquement si l’utilisateur le demande explicitement.
```

Exception actuelle pour le développement du stockage MTT :

```text
Après chaque étape de développement stockage,
ajouter un rapport clair et simple à la suite de `rapport-étapes-stockage.md`.
```

Le rapport stockage doit reprendre le modèle existant :

- titre de l’étape ;
- todo list cochée ;
- résumé de ce qui a été fait ;
- ce qui n’a pas été créé volontairement ;

Ne pas créer un autre fichier de rapport.

Ne pas détailler ligne par ligne tout le code modifié.

---

## 14. État actuel du module et priorité marchand

La partie Marchand MTT fonctionne et constitue la base validée.

Ne pas casser les fonctions déjà validées du marchand.

Quand une modification commune touche un fichier `merchant-*`, vérifier que le marchand conserve exactement son comportement attendu.

Avant toute modification :

1. lire l’état actuel du dépôt ;
2. lire `agents.md` ;
3. lire les rapports pertinents si l’instruction concerne le stockage ;
4. chercher les fonctions existantes ;
5. éviter les doublons ;
6. modifier uniquement ce qui est demandé.

Quand l’utilisateur dit qu’une correction fonctionne, considérer cette correction comme une base stable pour la suite.

Quand l’utilisateur dit qu’il a poussé sur GitHub, le dépôt GitHub redevient l’état de référence.

---

## 15. Aucun legacy à préserver

Le module MTT est encore en développement local et n’est pas distribué publiquement.

Il ne faut pas préserver de compatibilité pour :

- anciens marchands ;
- anciens stockages ;
- anciennes transactions ;
- anciens journaux ;
- anciens settings ;
- anciens champs de flags ;
- anciens formats de produits ;
- anciennes décisions abandonnées ;
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

## 16. Foundry VTT v14 et JavaScript

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

Ne pas utiliser :

```js
new foundry.applications.DialogV2(...)
```

Utiliser un style JavaScript sans point-virgule superflu.

Exemple attendu :

```js
export const MTT = {
  ID: "mtt-merchants",
  NAME: "Merchants, Trades and Transactions"
}
```

---

## 17. Outils et dépendances

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

- `gulp-sourcemaps` ;
- `gulp-clean-css` ;
- minification CSS ;
- sourcemaps ;
- bundler JavaScript ;
- transpiler ;
- framework CSS ;
- dépendance externe non demandée ;
- outil de packaging non demandé.

---

## 18. Conventions fichiers et chemins

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
module/applications/sheets/storage-exchange.mjs
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

## 19. Localisation

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

Les fichiers suivants doivent rester alignés :

```text
lang/fr.json
lang/en.json
```

Quand une clé visible est ajoutée, modifiée, renommée ou supprimée, mettre à jour les deux fichiers.

Ne pas conserver de clés de langue inutilisées pour d’anciennes décisions.

---

## 20. CSS / LESS

Toutes les classes CSS propres au module doivent être préfixées par `mtt-`.

Classes acceptées :

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

Les boutons MTT doivent être compacts, avec icône Font Awesome et tooltip localisé, surtout dans les zones denses.

Ne pas réécrire/refactoriser le CSS des produits, du rail client, des sessions ou du layout général sans nécessité explicite.

---

## 21. Conversion MTT et types d’acteurs

MTT ne crée plus de type d’acteur marchand dédié.

Le MJ crée un acteur système normal d’un type autorisé puis le convertit en entité MTT via les contrôles d’en-tête ou le menu contextuel.

L’acteur reste un acteur système normal. Son `actor.type` reste celui du système actif.

La détection MTT doit passer par les flags :

```text
flags.mtt-merchants.type
flags.mtt-merchants.merchant
flags.mtt-merchants.storage
```

Ne pas utiliser `actor.type` pour identifier un marchand ou un stockage MTT.

Interdit :

```text
CONFIG.Actor.dataModels["mtt-merchants.merchant"]
Actors.registerSheet(...) avec types: ["mtt-merchants.merchant"]
actor.type === "mtt-merchants.merchant"
actor.type === "storage"
actor.type === "mtt-merchants.storage"
```

`module/config/actor-types.mjs` sert uniquement à lire, normaliser et vérifier les types d’acteurs du système actif autorisés à être convertis.

---

## 22. Données marchand

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

Helpers centralisés dans :

```text
module/documents/merchant-flags.mjs
```

Fonctions attendues :

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

## 23. Données stockage

Les données stockage doivent être stockées dans :

```text
flags.mtt-merchants.storage
```

Le type logique doit être stocké dans :

```text
flags.mtt-merchants.type = "storage"
```

Helpers dédiés :

```text
module/documents/storage-flags.mjs
```

Fonctions attendues ou équivalentes :

```js
buildDefaultStorageData(actor)
getStorageData(actor)
setStorageData(actor, data)
updateStorageData(actor, changes)
unsetStorageData(actor)
isMTTStorage(actor)
getMTTEntityType(actor)
getStorageFlagPath(path)
normalizeStorageData(data, actor)
```

Aucune donnée stockage ne doit être écrite dans `actor.system`.

Ne pas mélanger les données stockage dans :

```text
flags.mtt-merchants.merchant
```

---

## 24. Produits / Items

Décision actuelle importante :

```text
Les produits du catalogue marchand sont de vrais Embedded Items de l’acteur support.
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

Pour le stockage, les Items du stockage sont aussi des Embedded Items de l’acteur support.

Ne pas créer un modèle parallèle de stockage sous forme de plain objects tant que les Embedded Items suffisent.

---

## 25. Services

Les services restent stockés dans :

```text
flags.mtt-merchants.merchant.catalog.services[]
```

Les services sont une logique `shop`.

Un service acheté :

- ne crée pas automatiquement un Item sur l’acteur acheteur ;
- est journalisé ;
- peut avoir un stock limité ou illimité ;
- peut avoir un prix libre ;
- peut demander une approbation MJ ;
- peut avoir des informations secrètes.

Quantité service vide, `null` ou `undefined` = illimité.

Un nouveau service doit initialiser sa monnaie de prix avec la monnaie de référence par défaut.

Les services ne concernent pas le stockage sauf demande explicite.

---

## 26. Catégories

MTT distingue :

1. le type Foundry de l’Item ;
2. le type/sous-type/catégorie système lu via des chemins configurés ;
3. la catégorie MTT indépendante et modifiable.

Les catégories automatiques doivent utiliser des chemins configurables.

La catégorie automatique issue du système ne doit jamais modifier l’Item source.

Si le MJ déplace un produit vers une autre catégorie, ne pas le remettre automatiquement dans sa catégorie système.

La catégorie “Sans catégorie” doit être affichée à la fin.

Si la catégorie affiche déjà le type ou la catégorie, ne pas répéter cette information dans chaque ligne d’Item sous forme de badge.

Le clic droit sur une catégorie principale peut appliquer des actions de masse côté marchand. Des actions similaires pourront être définies plus tard pour le stockage, mais ne pas les inventer sans instruction.

---

## 27. Monnaies et prix

Le tableau des devises est la source actuelle pour les prix et monnaies.

Ne pas réintroduire les anciens settings globaux :

```text
itemPriceValuePath
itemPriceCurrencyPath
actorCurrencyPath
```

Lecture et écriture du prix Item doivent passer par les fonctions actuelles fondées sur le tableau des devises.

Si le tableau des devises n’est pas configuré correctement, afficher une notification claire au MJ.

Prix et monnaies sont une logique `shop`, sauf futures fonctionnalités de répartition de monnaie dans le stockage.

Ne pas ajouter de prix dans une ligne stockage.

---

## 28. Informations secrètes

Un produit ou service marchand peut avoir :

- nom secret ;
- prix secret ;
- monnaie secrète ;
- description secrète.

Ces informations sont réservées au MJ et aux utilisateurs ayant les droits appropriés.

Le joueur ne doit pas voir de bouton ou d’indicateur lui révélant qu’un secret existe.

Dans le journal, les secrets ne doivent pas exposer leur contenu aux acheteurs.

Les secrets marchands sont une logique `shop`, sauf si une logique de note privée stockage est explicitement demandée plus tard.

---

## 29. Prix libre et négociation

Le prix classique d’un produit/service peut être ajusté par les pourcentages du marchand et les taux personnalisés du client actif.

Le prix libre doit rester compact, avec icône, tooltip, prix minimum MJ caché et décision manuelle du MJ.

Le test de négociation n’a aucun rôle automatique. Il sert seulement d’outil MJ.

Prix libre et négociation sont une logique `shop`.

---

## 30. Rail acteurs et sessions

Le rail d’acteurs est une mécanique potentiellement commune.

Le rail marchand actuel est stable et doit servir de base.

Ne pas créer un rail stockage interne différent si le rail marchand/base existe déjà.

Le stockage pourra utiliser le même modèle de rail avec des variantes :

```text
marchand : clients autorisés
stockage : acteurs autorisés / participants au stockage
```

La mécanique commune :

- cards d’acteurs ;
- image ;
- nom ;
- niveau de droit ;
- état de session ;
- sélection ;
- menu contextuel ;
- ajout/retrait d’acteur ;
- session liée à un acteur.

La logique métier diffère :

```text
marchand : acheter / vendre
stockage : déposer / retirer / demander
```

Les sessions doivent rester un modèle central d’échange, pas des actions directes dispersées.

---

## 31. Render, update et scroll

Terminologie de travail :

```text
update = mise à jour globale qui modifie l’acteur et peut impacter toutes les feuilles ouvertes
render = rafraîchissement local de la feuille utilisateur
```

Les grosses modifications peuvent utiliser un update :

- catalogue/contenu ;
- configuration ;
- changement de catégorie ;
- validation/refus ;
- modification réelle de stock ;
- journalisation ;
- masquage ;
- prix ;
- services ;
- transfert réel.

Les interactions légères de session peuvent utiliser des renders locaux si l’expérience reste fluide.

La position des scrolls doit être préservée lors des renders/updates :

- onglet produits/contenu ;
- onglet services si présent ;
- onglet configuration si scrollable ;
- journal ;
- session ;
- rail ;
- autres conteneurs scrollables pertinents.

---

## 32. Quantités disponibles et réservations

La quantité est une mécanique potentiellement commune.

Logique générale :

```text
stockTotal = quantité réelle de l’Item sur l’acteur support
reservedQuantity = quantités déjà engagées dans des sessions pertinentes
availableQuantity = stockTotal - reservedQuantity
```

Côté marchand, cela concerne les achats/ventes.

Côté stockage, cela concernera les retraits/demandes/dépôts engagés.

Si une fonction de quantité existe déjà côté marchand/base, ne pas la recréer côté stockage.

L’affichage doit rester compact.

Exemple marchand :

```text
8x
8x!
```

Le `!` indique que le stock réel est partiellement engagé dans une ou plusieurs sessions.

La validation finale doit toujours revérifier la disponibilité réelle.

---

## 33. Livraison, transfert et fusion

Le transfert d’Items est une mécanique potentiellement commune.

Côté marchand, lors d’un achat validé, MTT doit :

- copier l’Item marchand actuel ;
- créer ou fusionner l’Item sur l’acteur client ;
- appliquer la quantité achetée ;
- appliquer l’origine visible si configurée ;
- ajouter les informations secrètes si configurées ;
- accorder les droits prévus sur l’objet livré ;
- respecter les quantités maximales uniquement sur l’acteur destinataire.

Côté stockage, les transferts devront réutiliser autant que possible cette logique de copie/fusion/quantité.

La quantité max ne limite jamais le stock de l’acteur source. Elle s’applique seulement à la livraison sur l’acteur destinataire.

---

## 34. Permissions

La matrice de permissions marchand doit rester simple.

Permissions configurables marchand validées :

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

Ne pas réintroduire :

```text
canUserManageMerchant
isOwnerLike
```

Pour le stockage, définir les permissions progressivement, uniquement quand elles deviennent nécessaires.

Ne pas partir dans une liste excessive de micro-permissions.

---

## 35. Journal

Le journal marchand existe.

Le journal global existe.

La visibilité est filtrée selon les droits et permissions actuels.

Les sessions validées/refusées sont copiées dans le journal du marchand.

Le stockage aura plus tard un journal de mouvements.

La mécanique de journalisation peut devenir partiellement commune, mais ne pas l’abstraire massivement sans besoin concret.

---

## 36. Configuration du module

Le module doit permettre de configurer des chemins pour rester universel.

Options importantes :

- types d’acteurs convertibles en marchand ;
- types d’acteurs convertibles en stockage ;
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

## 37. Stockage MTT — vision fonctionnelle

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
Marchand / boutique :
acheter, vendre, prix, tarifs, négociation, transaction commerciale.

Stockage :
déposer, demander, retirer, trier, voter, répartir, tracer les mouvements.
```

Le stockage doit utiliser les fondations MTT existantes quand elles sont pertinentes.

Le stockage ne doit pas réinventer :

- la feuille ;
- le rail ;
- les lignes d’Items ;
- les catégories ;
- le verrouillage ;
- les sessions ;
- les dialogues communs ;
- les helpers de quantité ;
- les helpers de transfert.

---

## 38. Tags et statuts du stockage

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

Ne pas ajouter tags/statuts tant que l’étape ne le demande pas.

---

## 39. Permissions stockage futures

Le stockage devra utiliser une table centrale de permissions par profil, mais elle devra rester simple.

Niveaux prévus :

```text
limited
observer
owner
gm
```

Le MJ peut tout faire.

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

## 40. Relation avec Chroniques Oubliées 2

CO2 est le premier environnement de test et le futur premier preset.

Le cœur MTT doit rester générique.

Les règles spécifiques CO2 doivent rester isolées plus tard dans un preset CO2.

Le cœur MTT ne doit pas coder CO2 en dur.

Ne pas ajouter de migration MTT pour corriger des données internes CO2.

---

## 41. Dialogues et notifications

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

## 42. Presets système

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

## 43. Instructions pour Codex / Claude Code

Les instructions destinées à Codex ou Claude Code doivent mentionner :

```text
Lis le fichier `agents.md` à la racine du dépôt.
Attention : le fichier est nommé `agents.md` en minuscules, pas `AGENTS.md`.
```

Quand l’utilisateur demande un bloc pour Codex ou Claude Code, fournir toutes les instructions importantes dans un seul bloc copiable.

Ne pas mettre de consignes importantes hors du bloc copiable.

Quand Codex ou Claude Code modifie les fichiers :

- lire `agents.md` avant de modifier ;
- vérifier la roadmap et l’état actuel avant de changer une logique ;
- respecter le fait que la partie marchand fonctionne ;
- ne pas casser une fonction marchand validée ;
- traiter `merchant-*` comme base historique commune quand c’est pertinent ;
- créer `storage-*` uniquement pour les fonctions propres au stockage ;
- créer `shop-*` uniquement pour les fonctions propres à la boutique ;
- rechercher une fonction existante avant d’en créer une nouvelle ;
- ne pas dupliquer une fonction existante ;
- commenter les blocs communs avec `MTT base` ;
- commenter les blocs boutique avec `MTT shop` ;
- commenter les blocs stockage avec `MTT storage` ;
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
- ne pas réinventer une interface stockage si une base commune existe ;
- ne pas réintroduire de compatibilité legacy supprimée ;
- ne pas réintroduire d’anciens settings supprimés ;
- ne pas réintroduire l’ancien modèle produits plain objects dans les flags ;
- ne pas réintroduire de type d’acteur marchand dédié ;
- ne pas utiliser les globals Foundry dépréciés ;
- ne pas créer de rapport `.md` sauf demande explicite, sauf pour les étapes de développement stockage où `rapport-étapes-stockage.md` doit être complété.
