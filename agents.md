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

L’utilisateur est néophyte en développement. Les modifications doivent rester cohérentes avec l’existant, faciles à relire, faciles à tester, et éviter les refontes massives non demandées.

---

## 2. Règle majeure : aucun legacy à préserver

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

## 3. Vision générale MTT 2.0

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

Le module ne doit plus être pensé comme “le module marchand uniquement”.

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

## 4. Philosophie de développement

Avancer étape par étape, avec rigueur.

Ne pas ajouter de fonctionnalité avancée non demandée.

Ne pas refactoriser massivement sans demande explicite.

Quand une modification demandée est confirmée comme fonctionnelle par l’utilisateur, considérer qu’elle existe dans son état local, même si elle n’a pas encore été poussée sur GitHub.

Quand l’utilisateur dit qu’il a poussé, le dépôt GitHub redevient l’état de référence.

Pour Codex ou Claude Code, modifier directement les fichiers sans demander à l’utilisateur de recoller manuellement de gros morceaux.

Pour les gros changements, créer un rapport `.md` à la racine du module quand l’utilisateur demande une étape de nettoyage, une correction structurée ou une refactorisation. Le rapport doit lister les fichiers modifiés, les choix techniques, les tests réalisés et les risques restants.

Préférer :

- corrections ciblées ;
- étapes courtes ;
- tests fréquents ;
- instructions vérifiables ;
- code lisible plutôt qu’abstractions prématurées.

Éviter :

- gros frameworks internes trop tôt ;
- factorisation anticipée ;
- réécriture complète d’une fonctionnalité validée ;
- changements simultanés sur plusieurs sujets sans nécessité.

---

## 5. Outils et dépendances

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

Si une nouvelle dépendance semble utile, proposer d’abord l’ajout avec une justification courte, puis attendre validation.

---

## 6. Conventions JavaScript et Foundry v14

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

## 7. Convention de fichiers et chemins

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
module/applications/sheets/merchant-sheet.mjs
module/applications/sheets/merchant-catalog.mjs
module/applications/sheets/merchant-trade.mjs
module/applications/sheets/merchant-dialogs.mjs
module/applications/sheets/merchant-utils.mjs
templates/actors/merchant-sheet.hbs
templates/actors/parts/merchant-access-rail.hbs
templates/dialogs/confirm-dialog.hbs
styles/mtt.less
css/mtt.css
lang/fr.json
lang/en.json
```

Éviter les majuscules dans les chemins.

---

## 8. Localisation

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

La structure des fichiers de langue doit rester hiérarchisée.

Utiliser :

```js
game.i18n.localize("mtt.log.initializing")
```

Ne pas utiliser de namespace en majuscules comme `MTT.Log.Initializing`.

Les fichiers `lang/fr.json` et `lang/en.json` doivent rester alignés.

Quand une clé visible est ajoutée, modifiée, renommée ou supprimée, mettre à jour les deux fichiers.

Ne pas conserver de clés de langue inutilisées pour d’anciennes décisions.

---

## 9. CSS / Less

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

Structure souhaitée :

```text
styles/
  mtt.less
  applications/
    _index.less
    merchant-variables.less
    merchant-sheet.less
    merchant-catalog.less
    merchant-session.less
    merchant-access-rail.less
    merchant-journal.less
    merchant-dialogs.less
    mtt-config.less
```

Le CSS compilé doit aller dans :

```text
css/mtt.css
```

Le CSS local modifié manuellement par l’utilisateur doit être préservé. Ne pas réécrire/refactoriser le CSS des produits, du rail client, des sessions ou du layout général sans nécessité explicite.

Les variables CSS `--mtt-*` sont centralisées dans `:root`.

Les boutons MTT doivent être compacts, avec icône Font Awesome et tooltip localisé, surtout dans les zones denses.

Éviter le texte visible sur les boutons dans :

- lignes produits ;
- lignes services ;
- rail clients ;
- actions rapides ;
- navigation secondaire ;
- session.

Utiliser :

```hbs
data-tooltip="{{localize "..."}}"
```

---

## 10. Architecture JavaScript actuelle

La feuille marchand est séparée en plusieurs fichiers cohérents. Respecter cette organisation.

### `module/applications/sheets/merchant-sheet.mjs`

Rôle : fichier principal et orchestrateur de la feuille marchand.

Il contient principalement :

- la classe `MerchantSheet` ;
- `DEFAULT_OPTIONS` ;
- `PARTS` ;
- `_prepareContext` si la préparation reste directement liée à la feuille ;
- `_onRender` ;
- les actions Application V2 déclarées ;
- les appels vers les fonctions importées ;
- les wrappers nécessaires quand une action Application V2 doit rester attachée à la classe ;
- l’injection et l’activation de certaines zones de feuille si elles dépendent de la fenêtre.

Ce fichier pourra être séparé plus tard.

Découpage futur souhaité, mais pas à faire avant stabilisation :

```text
module/applications/sheets/mtt-sheet-common.mjs
  → fonctions communes de feuille MTT
  → helpers UI, positionnement, activation listeners communs, contexte partagé éventuel

module/applications/sheets/merchant-sheet.mjs
  → fonctions spécifiques marchand

module/applications/sheets/storage-sheet.mjs
  → fonctions spécifiques stockage
```

Ne pas commencer par ce refactor tant que les règles marchand ne sont pas stabilisées.

### `module/applications/sheets/merchant-catalog.mjs`

Rôle : catalogue du marchand.

Il regroupe la logique liée à :

- produits ;
- services ;
- catégories ;
- sous-catégories ;
- catégories automatiques ;
- drop externe / drop interne ;
- déplacement de produit entre catégories ;
- ajout/fusion de produit ;
- création de services libres ;
- ajout de service basé sur Item ;
- prix affichés ;
- prix libre ;
- prix minimum MJ ;
- quantités catalogue ;
- produits/services masqués ;
- informations secrètes ;
- approbation MJ ;
- copie produit/service.

Produits et services restent ensemble dans ce fichier, car leur logique reste proche.

### `module/applications/sheets/merchant-trade.mjs`

Rôle : échange entre un client et le marchand.

Ce fichier peut rester volumineux tant qu’il reste cohérent, car il porte une logique métier dense.

Il regroupe :

- sessions de transaction ;
- buyerItems : “Le PJ achète / reçoit” ;
- sellerItems : “Le PJ vend / donne” ;
- quantités dans la session ;
- totaux ;
- ajustement monétaire ;
- vérification de transaction ;
- prévisualisation d’exécution ;
- validation/refus réel ;
- transfert objets/monnaies ;
- livraison ;
- fusion/stacking ;
- négociation ;
- visibilité de session ;
- préparation de données utiles aux sessions.

Ne pas recréer séparément `merchant-sessions.mjs` ou `merchant-transaction-check.mjs` sauf demande explicite.

### `module/applications/sheets/merchant-dialogs.mjs`

Rôle : centraliser les dialogues MTT.

Les dialogues importants doivent utiliser les templates dédiés dans :

```text
templates/dialogs/
```

Éviter le HTML brut dispersé dans les fichiers MJS.

### `module/applications/sheets/merchant-utils.mjs`

Rôle : utilitaires simples et réutilisables.

Ce fichier peut contenir :

- génération d’identifiants ;
- parsing de nombres ;
- normalisation de quantités ;
- lecture de valeur par chemin configuré ;
- helpers de devises ;
- helpers de fusion ;
- helpers de livraison ;
- helpers HTML/textes réutilisés.

Ne pas transformer ce fichier en fourre-tout.

### `module/config/config-export.mjs`

Rôle : regrouper la liste des settings exportables et la logique d’export de configuration.

Ne pas recréer de cycle d’import `settings.mjs ↔ mtt-config-app.mjs`.

---

## 11. Architecture marchand actuelle

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

Point de vigilance prioritaire :

```text
module.json ne doit pas déclarer un ancien type d’acteur marchand dédié si la logique active repose sur la conversion par flags.
```

Vérifier et clarifier tout reliquat du type :

```json
"documentTypes": {
  "Actor": {
    "merchant": {}
  }
}
```

Sauf preuve technique contraire, ce reliquat est incohérent avec l’architecture actuelle et doit être supprimé.

---

## 12. Données marchand

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

## 13. Produits marchands actuels

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

Exemples de métadonnées produit :

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

Attention aux copies d’Items :

- nettoyer `flags.exportSource` ;
- utiliser `_stats.exportSource` si nécessaire ;
- préserver `sourceUuid` quand c’est utile ;
- ne pas modifier l’Item source d’origine si une copie commerciale est créée.

La copie produit/service du menu contextuel doit :

- créer une nouvelle ligne indépendante ;
- mettre la quantité à `1` ;
- ne pas diminuer la ligne d’origine ;
- conserver `sourceUuid`.

---

## 14. Services

Les services restent stockés dans :

```text
flags.mtt-merchants.merchant.catalog.services[]
```

Les services peuvent être créés librement depuis l’interface MTT ou provenir d’un Item.

Ne pas supprimer le bouton ni la logique de création de service libre.

Un service acheté :

- ne crée pas automatiquement un Item sur l’acteur acheteur ;
- est journalisé ;
- peut avoir un stock limité ou illimité ;
- peut avoir un prix libre ;
- peut demander une approbation MJ ;
- peut avoir des informations secrètes ;
- peut utiliser une logique propre aux services.

Quantité service vide, `null` ou `undefined` = illimité.

Un nouveau service doit initialiser sa monnaie de prix avec la monnaie de référence par défaut.

---

## 15. Catégories et sous-catégories

MTT distingue :

1. le type Foundry de l’Item ;
2. le type/sous-type/catégorie système lu via des chemins configurés ;
3. la catégorie marchande MTT, indépendante et modifiable.

Les catégories automatiques doivent utiliser des chemins configurables.

La catégorie automatique issue du système ne doit jamais modifier l’Item source.

Elle sert seulement à initialiser ou suggérer la catégorie MTT.

Si le MJ déplace ensuite un produit vers une autre catégorie, ne pas le remettre automatiquement dans sa catégorie système.

Les catégories personnalisées globales sont copiées une seule fois à la conversion en catégories locales du marchand. Pas de resynchronisation automatique ensuite.

---

## 16. Monnaies et prix

Le tableau des devises est la source actuelle pour les prix et monnaies.

Chaque ligne de devise peut définir :

```text
id
name
abbreviation
actorPath
itemPricePath
itemCurrencyPath
itemCurrencyValues
rate
isDefault
```

Ne pas réintroduire les anciens settings globaux :

```text
itemPriceValuePath
itemPriceCurrencyPath
actorCurrencyPath
```

Lecture et écriture du prix Item doivent passer par les fonctions actuelles fondées sur le tableau des devises.

Si le tableau des devises n’est pas configuré correctement, afficher une notification claire au MJ plutôt que d’utiliser un fallback legacy.

La monnaie de référence est la devise dont le taux vaut 1 et/ou qui est marquée comme référence selon la logique actuelle.

---

## 17. Informations secrètes

Un produit ou service peut avoir des informations secrètes :

- nom secret ;
- prix secret ;
- monnaie secrète ;
- description secrète.

Ces informations sont réservées au MJ et aux utilisateurs ayant les droits appropriés.

Elles ne remplacent pas les données visibles.

Lors de la livraison d’un objet acheté, MTT peut ajouter :

- une origine visible dans le chemin de description visible configuré ;
- un bloc secret dans le chemin de description secrète configuré.

Le joueur ne doit pas voir de bouton ou d’indicateur lui révélant qu’un secret existe.

Dans le journal, les secrets ne doivent pas exposer leur contenu aux acheteurs.

---

## 18. Prix libre et négociation

Le prix classique d’un produit/service peut être ajusté par les pourcentages du marchand et par les taux personnalisés du client actif.

Pour l’option “prix libre / proposer un prix au vendeur” :

- afficher une icône compacte, par exemple une balance ;
- ne pas afficher un long texte dans la ligne catalogue ;
- ajouter un tooltip ;
- ajouter un prix minimum MJ caché ;
- ne pas afficher ce prix minimum aux acheteurs ;
- ne pas appliquer les pourcentages de vente/rachat à ce prix libre.

Le test de négociation n’a aucun rôle automatique.

Il sert seulement d’outil MJ.

Le MJ décide manuellement d’accepter, refuser ou contre-proposer chaque ligne de négociation.

---

## 19. Clients autorisés et rail de cards

Le MJ gère les clients autorisés via le rail de cards.

Logique :

- acteur non autorisé : clic gauche = autoriser ;
- acteur autorisé : clic gauche = ouvrir/sélectionner sa session ;
- retirer une autorisation : clic droit / menu contextuel ;
- supprimer l’acteur du marchand : clic droit / menu contextuel.

Une card non autorisée est en noir et blanc avec opacité réduite.

Une card autorisée est en couleur avec opacité normale.

L’icône de card signale seulement l’état de session :

- aucune session = aucune icône ;
- session en cours = sablier ;
- en attente de décision = warning ;
- validée = check vert ;
- refusée = croix rouge.

Quand un acteur est autorisé à commercer, une session doit exister pour lui chez ce marchand.

Un acteur ne peut avoir qu’une seule session par marchand.

---

## 20. Sessions marchand

Toutes les transactions passent par une session.

La session contient deux parties :

```text
Le PJ achète / reçoit
Le PJ vend / donne
```

Ne pas créer de troisième zone “Le PJ doit” ni de section séparée “Solde”.

La monnaie d’équilibrage est représentée par une ligne automatique “Ajustement monétaire” dans l’une des deux parties.

Si le PJ doit compléter, l’ajustement apparaît côté “Le PJ vend / donne”.

Si le marchand doit rendre de la monnaie, l’ajustement apparaît côté “Le PJ achète / reçoit”.

Le bouton “Créer une session” ne doit pas être utilisé dans la sidebar : la session est créée via l’autorisation client.

Le bouton “Supprimer la session” ne doit pas être utilisé dans la sidebar : la session prend fin via retrait d’autorisation ou décision finale.

Le bouton “Vider la session” reste utile.

Quand une session entière est validée :

- la transaction est exécutée ;
- les objets sont transmis dans les deux sens ;
- l’ajustement monétaire est appliqué ;
- une entrée “validée” est ajoutée au journal marchand ;
- l’acteur repart sur une session vide ;
- l’autorisation de commercer peut être conservée.

Quand une session entière est refusée :

- aucune transaction réelle n’est appliquée ;
- une entrée “refusée” est ajoutée au journal marchand ;
- l’acteur repart sur une session vide ;
- l’autorisation de commercer peut être conservée.

Quand le MJ retire l’autorisation d’un acteur :

- c’est une annulation/remise à zéro ;
- aucun transfert ;
- aucune entrée de journal.

---

## 21. Quantités disponibles et réservations

Point prioritaire pour la consolidation marchand.

Le catalogue ne doit pas seulement afficher le stock réel brut.

Il faut tenir compte des quantités déjà engagées dans les sessions pertinentes.

Logique attendue :

```text
stockTotal = quantité réelle du produit ou service chez le marchand
reservedQuantity = quantités déjà engagées dans les sessions actives/submitted/pending pertinentes
availableQuantity = stockTotal - reservedQuantity
```

Exemple :

```text
Potion de soins : 3 disponibles / 10 total
```

Si une session est vidée, refusée ou annulée, les quantités réservées redeviennent disponibles.

Si une session est validée/exécutée, le stock réel est décrémenté.

Le même principe sera nécessaire pour le futur stockage.

Il faut donc éviter un patch trop local qui rendrait impossible la réutilisation future.

À la validation réelle d’une session, toujours revérifier :

- existence de l’objet ;
- quantité réelle ;
- quantité disponible ;
- droits ;
- statut technique éventuel ;
- acteur source ;
- acteur destination ;
- chemins configurés.

Ne jamais se fier uniquement à ce qui était vrai au moment du clic d’ajout à la session.

---

## 22. Livraison et fusion des objets

Lors d’un achat validé, MTT doit :

- copier l’Item marchand actuel ;
- créer ou fusionner l’Item sur l’acteur client selon les règles de stacking/fusion ;
- appliquer la quantité achetée ;
- appliquer les informations de provenance visibles si l’option est activée ;
- ajouter les informations secrètes au chemin secret configuré si nécessaire ;
- accorder des droits sur l’objet livré selon l’option prévue ;
- respecter les quantités maximales de pile uniquement sur l’acteur destinataire.

La logique de quantité maximale par pile ne s’applique pas au stock du marchand.

Un marchand peut avoir un stock catalogue de 35 armures même si le système actif limite l’Item acteur à 1 par pile.

La quantité max sert uniquement au moment de livrer/fusionner/créer les Items sur l’acteur acheteur.

---

## 23. Vente d’objets du PJ au marchand

Lors de l’exécution réelle, MTT doit seulement diminuer la quantité possédée par le PJ sur l’Item source.

MTT ne doit pas supprimer directement l’Item si la quantité tombe à zéro.

Le système actif gère ses propres règles du type “détruire l’objet si vide”.

Au moment de valider/exécuter la session, MTT doit revérifier :

- quantité disponible actuelle ;
- prix/valeur actuelle ;
- existence de l’Item source.

La zone “Le PJ vend / donne” doit refuser les drops internes depuis le catalogue du marchand.

---

## 24. Permissions marchand à consolider

Les permissions marchand doivent évoluer vers une table centrale de profils.

Éviter les conditions dispersées du type :

```js
if (isObserver) { ... }
if (isOwner) { ... }
```

Ces états peuvent servir à identifier le profil, mais les actions doivent vérifier des permissions concrètes.

Structure attendue à terme :

```js
const MERCHANT_PERMISSION_PROFILES = {
  limited: {
    canViewCatalog: true,
    canViewPrices: true,
    canAddProductToSession: false,
    canAddServiceToSession: false,
    canSellItemToMerchant: false,
    canSubmitSession: false,
    canValidateTransaction: false,
    canRejectTransaction: false,
    canClearSession: false,
    canManageCatalog: false,
    canManageServices: false,
    canManageClientRates: false,
    canManageSecrets: false,
    canViewJournal: true,
    canManageMerchantConfig: false
  },
  observer: {
    canViewCatalog: true,
    canViewPrices: true,
    canAddProductToSession: true,
    canAddServiceToSession: true,
    canSellItemToMerchant: true,
    canSubmitSession: true,
    canValidateTransaction: false,
    canRejectTransaction: false,
    canClearSession: true,
    canManageCatalog: false,
    canManageServices: false,
    canManageClientRates: false,
    canManageSecrets: false,
    canViewJournal: true,
    canManageMerchantConfig: false
  },
  owner: {
    canViewCatalog: true,
    canViewPrices: true,
    canAddProductToSession: true,
    canAddServiceToSession: true,
    canSellItemToMerchant: true,
    canSubmitSession: true,
    canValidateTransaction: true,
    canRejectTransaction: true,
    canClearSession: true,
    canManageCatalog: true,
    canManageServices: true,
    canManageClientRates: true,
    canManageSecrets: true,
    canViewJournal: true,
    canManageMerchantConfig: true
  },
  gm: {
    // toutes les permissions à true
  }
}
```

Le MJ peut tout faire, toujours.

Les templates HBS doivent utiliser ces permissions pour afficher/masquer les éléments.

Les handlers JS doivent revérifier les mêmes permissions avant d’exécuter une action.

Ne jamais se contenter de masquer un bouton côté HTML.

---

## 25. Journal marchand et journal global

Le journal marchand existe.

Le journal global existe.

La visibilité est filtrée selon les droits :

- MJ / propriétaire / gestionnaire du marchand : voit toutes les transactions du marchand ;
- acheteur : voit uniquement ses propres transactions avec ce marchand ;
- journal global : doit respecter la même logique de visibilité.

Les sessions validées/refusées sont copiées dans le journal du marchand.

Les secrets ne doivent pas exposer leur contenu aux acheteurs.

Ne pas prévoir d’annulation automatique après coup : c’est trop risqué et complexe.

---

## 26. Configuration du module

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
- préfixes i18n simples pour catégories/sous-catégories ;
- tableau des devises et taux de conversion ;
- monnaie de référence ;
- droits accordés aux objets livrés si l’option existe.

Ne pas réintroduire les anciens settings supprimés :

```text
itemPriceValuePath
itemPriceCurrencyPath
actorCurrencyPath
```

L’import/export de configuration est géré via :

```text
module/config/config-export.mjs
```

---

## 27. Futur stockage MTT

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

Actions futures :

- déposer objet ;
- demander objet ;
- retirer objet selon droits ;
- voter/répondre à une demande ;
- valider/refuser une session ;
- répartir monnaie ;
- journaliser tous les mouvements.

---

## 28. Tags et statuts du stockage

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

## 29. Permissions stockage futures

Le stockage devra utiliser une table centrale de permissions par profil.

Niveaux de base :

- `limited`
- `observer`
- `owner`
- `gm`

Exemples de permissions :

```js
const STORAGE_PERMISSION_PROFILES = {
  limited: {
    canViewStorage: true,
    canViewContent: true,
    canOpenItemSheet: true,
    canSearchContent: true,
    canFilterContent: true,
    canAddItemToExchangeSession: false,
    canDepositItems: false,
    canWithdrawItems: false,
    canCreateItemRequest: true,
    canRespondItemRequest: true,
    canResolveItemRequest: false,
    canSplitCurrency: false,
    canManageCategories: false,
    canManageAccess: false
  },
  observer: {
    canViewStorage: true,
    canViewContent: true,
    canOpenItemSheet: true,
    canSearchContent: true,
    canFilterContent: true,
    canAddItemToExchangeSession: true,
    canDepositItems: true,
    canWithdrawItems: false,
    canViewOtherSessions: true,
    canCreateItemRequest: true,
    canRespondItemRequest: true,
    canResolveItemRequest: false,
    canSplitCurrency: false,
    canManageCategories: false,
    canManageAccess: false
  },
  owner: {
    canViewStorage: true,
    canViewContent: true,
    canOpenItemSheet: true,
    canSearchContent: true,
    canFilterContent: true,
    canAddItemToExchangeSession: true,
    canDepositItems: true,
    canWithdrawItems: true,
    canViewOtherSessions: true,
    canValidateExchangeSession: true,
    canRejectExchangeSession: true,
    canClearExchangeSession: true,
    canCreateItemRequest: true,
    canRespondItemRequest: true,
    canResolveItemRequest: true,
    canSplitCurrency: true,
    canManageCategories: true,
    canManageAccess: false
  },
  gm: {
    // toutes les permissions à true
  }
}
```

Même règle que pour le marchand :

- permissions utilisées côté HBS ;
- permissions revérifiées côté JS ;
- MJ toujours tout-puissant.

---

## 30. Fondations communes à préparer progressivement

Ne pas créer immédiatement un gros framework commun.

Préparer progressivement des helpers communs pour :

- permissions par profils `can...` ;
- rail d’acteurs autorisés ;
- cartes d’acteurs avec niveau de droit ;
- sessions par acteur ;
- calcul des quantités réservées ;
- disponibilité réelle ;
- transferts d’Items entre acteur source et acteur destination ;
- fusion intelligente des Items ;
- respect de la quantité max seulement à la livraison ;
- catégories ;
- drag & drop vers catégorie ;
- menus contextuels ;
- journalisation ;
- dialogues de validation/refus ;
- recherche/filtre/tri.

Principe :

```text
Consolider le marchand d’abord.
Créer le stockage ensuite.
Extraire les helpers communs quand les deux usages justifient réellement l’extraction.
```

---

## 31. Relation avec Chroniques Oubliées 2

CO2 est le premier environnement de test et le futur premier preset.

Le cœur MTT doit rester générique.

Les règles spécifiques CO2 doivent rester isolées plus tard dans un preset CO2.

Le preset CO2 pourra gérer :

- monnaies PO / PA / PC ;
- chemins de prix ;
- chemins de quantité ;
- types d’Items vendables ;
- types d’acteurs acheteurs ;
- règles de transfert d’objets ;
- règles de transfert de monnaie.

Ne pas coder ces éléments en dur dans le cœur MTT.

Ne pas ajouter de migration MTT pour corriger des données internes CO2.

---

## 32. Dialogues et notifications

Les dialogues MTT doivent utiliser une structure stylable propre au module, avec des classes `mtt-dialog`.

Les dialogues importants doivent utiliser les templates dédiés dans :

```text
templates/dialogs/
```

Éviter les contenus HTML bruts dispersés dans les MJS.

Supprimer les doubles confirmations inutiles.

Les notifications info pour actions normales doivent être évitées.

Ne pas afficher de notification info pour :

- session créée ;
- acteur autorisé ;
- session sélectionnée ;
- produit ajouté si l’interface le montre ;
- quantité mise à jour ;
- catégorie changée.

Conserver les notifications pour :

- erreurs ;
- warnings ;
- actions impossibles ;
- blocages de sécurité ;
- drop invalide ;
- quantité invalide ;
- verrou global ;
- stock insuffisant ;
- monnaie insuffisante ;
- absence de client/session ;
- configuration manquante.

---

## 33. Presets système

Les presets système sont une direction future.

Un preset CO2 pourra configurer automatiquement :

- devises ;
- chemins prix/monnaie via le tableau des devises ;
- chemins quantité ;
- chemins catégorie/sous-catégorie ;
- types autorisés ;
- chemins description visible/secrète.

Le cœur MTT ne doit pas coder CO2 en dur.

---

## 34. Instructions pour Codex / Claude Code

Les instructions destinées à Codex ou Claude Code doivent mentionner :

```text
Lis le fichier `agents.md` à la racine du dépôt.
Attention : le fichier est nommé `agents.md` en minuscules, pas `AGENTS.md`.
```

Ne pas demander de lire `AGENTS.md`.

Quand l’utilisateur demande un bloc pour Codex ou Claude Code, fournir toutes les instructions dans un seul bloc copiable.

Ne pas mettre de consignes importantes hors du bloc copiable.

Si une étape demande un rapport, le rapport doit être créé en `.md` à la racine du module.

Quand Codex ou Claude Code modifie les fichiers :

- lire `agents.md` avant de modifier ;
- travailler en respectant l’état actuel du repo ;
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
- respecter la séparation entre `merchant-sheet.mjs`, `merchant-catalog.mjs`, `merchant-trade.mjs`, `merchant-dialogs.mjs` et `merchant-utils.mjs` ;
- ne pas réintroduire de compatibilité legacy supprimée ;
- ne pas réintroduire d’anciens settings supprimés ;
- ne pas réintroduire l’ancien modèle produits plain objects dans les flags ;
- ne pas réintroduire de type d’acteur marchand dédié ;
- ne pas utiliser les globals Foundry dépréciés ;
- créer un rapport `.md` à la racine quand l’utilisateur le demande ou quand une étape de nettoyage l’exige.

---

## 35. Ordre de développement recommandé

Phase 1 — Clarification marchand actuel :

1. Clarifier et supprimer si nécessaire le reliquat `documentTypes.Actor.merchant` dans `module.json`.
2. Vérifier que la conversion marchand repose uniquement sur les flags.
3. Vérifier que l’ouverture boutique/gérant ne modifie pas `actor.name` ou `actor.img`.

Phase 2 — Consolidation marchand :

4. Introduire une vraie table de permissions marchand par profils.
5. Corriger le calcul des quantités disponibles avec réservations de sessions.
6. Nettoyer la logique de réservation/libération/validation des sessions.
7. Identifier les helpers communs utiles sans refactor massif.

Phase 3 — Architecture multi-types :

8. Introduire la notion de type MTT logique : `merchant` / `storage`.
9. Remplacer la conversion directe par “Conversion MTT” + dialogue de choix.
10. Ajouter les types d’acteurs convertibles en stockage dans la configuration.

Phase 4 — Base stockage :

11. Ajouter les helpers de flags storage.
12. Créer la feuille `storage-sheet.mjs`.
13. Créer les templates stockage.
14. Ajouter une palette CSS distincte et un layout inversé.

Phase 5 — Stockage fonctionnel :

15. Afficher le contenu.
16. Gérer catégories, tags, statuts.
17. Créer les sessions d’échange.
18. Exécuter dépôt/retrait avec revérification finale.
19. Journaliser tous les mouvements.
20. Ajouter demandes/votes/répartition monnaie plus tard.
