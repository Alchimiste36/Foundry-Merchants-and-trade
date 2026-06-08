# Instructions projet — Merchants, Trades and Transactions

## 1. Identité du projet

Nom du module : **Merchants, Trades and Transactions**.

Acronyme : **MTT**.

Identifiant Foundry du module : `mtt-merchants`.

Préfixe CSS obligatoire : `mtt-`.

Namespace de localisation : `mtt`.

Dépôt GitHub : `https://github.com/Alchimiste36/Foundry-Merchants-and-trade`.

Le projet est un **module indépendant pour Foundry VTT**, et non une fonctionnalité intégrée directement dans Chroniques Oubliées 2.

Le module cible **Foundry VTT V14**.

Le fichier d’instructions du projet est nommé `agents.md` en minuscules. Ne pas chercher uniquement `AGENTS.md`.

L’utilisateur est néophyte en développement. Les modifications doivent rester cohérentes avec l’existant, faciles à relire, et éviter les refontes massives non demandées.

---

## 2. Règle majeure : aucun legacy à préserver

Le module MTT est resté local sur le PC de l’utilisateur et n’a pas été partagé.

Il ne faut plus conserver de compatibilité pour :

- les anciens marchands ;
- les anciennes transactions ;
- les anciens journaux ;
- les anciens settings ;
- les anciens champs du modèle ;
- les anciennes décisions de conception abandonnées ;
- les anciens formats de données pré-migration.

Si un ancien monde, ancien acteur marchand, ancien journal ou ancienne transaction casse, c’est accepté. L’utilisateur recréera un monde ou des marchands propres.

Objectif prioritaire :

```text
Le module doit être propre de A à Z pour un monde neuf.
```

Conséquence :

```text
Ne pas ajouter de fallback legacy.
Ne pas conserver de champ “au cas où”.
Ne pas conserver de clé de langue inutilisée.
Ne pas conserver de classe CSS morte.
Ne pas réintroduire les anciens settings supprimés.
Ne pas réintroduire les anciens champs produits commerciaux.
```

---

## 3. Objectif général

MTT doit permettre de gérer des marchands, boutiques, services, catalogues et transactions dans Foundry VTT.

La vision du module inclut :

- des marchands configurables ;
- des produits ;
- des services ;
- des catégories marchandes ;
- des clients autorisés ;
- des sessions de transaction ;
- du troc ;
- des ventes au marchand ;
- des validations MJ ;
- des négociations manuelles ;
- un ajustement monétaire automatique ;
- un journal marchand ;
- un journal global ;
- des presets d’adaptation pour différents systèmes de jeu.

Le premier système de test et futur preset sera **Chroniques Oubliées 2**, mais le cœur du module ne doit pas dépendre directement de CO2.

---

## 4. Philosophie de développement

Avancer étape par étape, avec rigueur.

Ne pas ajouter de fonctionnalité avancée non demandée.

Ne pas refactoriser massivement sans demande explicite.

Quand une modification demandée est confirmée comme fonctionnelle par l’utilisateur, considérer qu’elle existe dans son état local, même si elle n’a pas encore été poussée sur GitHub.

Quand l’utilisateur dit qu’il a poussé, le dépôt GitHub redevient l’état de référence.

Pour Codex ou Claude Code, modifier directement les fichiers sans demander à l’utilisateur de recoller manuellement des morceaux.

Pour les gros changements, créer un rapport `.md` à la racine du module quand l’utilisateur demande une étape de nettoyage, une correction structurée ou une refactorisation. Le rapport doit lister les fichiers modifiés, les choix techniques, les tests réalisés et les risques restants.

---

## 5. Outils et dépendances

Le projet MTT doit rester simple dans ses outils de développement.

Ne pas ajouter de dépendance npm, de plugin Gulp, de configuration de build ou d’outil supplémentaire sans nécessité claire et validation explicite.

Outils actuellement acceptés :

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
- minification CSS
- sourcemaps
- bundler JavaScript
- transpiler
- framework CSS
- dépendance externe non demandée
- outil de packaging non demandé

Si une nouvelle dépendance semble utile, proposer d’abord l’ajout avec une justification courte, puis attendre validation avant de modifier `package.json`, `package-lock.json` ou `gulpfile.mjs`.

---

## 6. Foundry VTT et conventions JavaScript

Utiliser du JavaScript moderne compatible Foundry VTT V14.

Respecter les APIs modernes :

- Application V2 ;
- ActorSheetV2 ;
- HandlebarsApplicationMixin ;
- TypeDataModel ;
- `foundry.data.fields` ;
- `foundry.applications.api.DialogV2` pour les dialogues ;
- `foundry.applications.handlebars.renderTemplate(...)` pour le rendu de templates ;
- `foundry.utils.saveDataToFile(...)` pour l’export de fichier ;
- `foundry.applications.apps.FilePicker.implementation` pour le FilePicker ;
- `foundry.applications.ux.TextEditor.implementation.getDragEventData(event)` pour les données de drag’n drop ;
- `async` / `await`.

Ne pas utiliser les anciens patterns Foundry V1 sauf nécessité explicitement demandée.

Ne pas utiliser les globals dépréciés :

```text
TextEditor
renderTemplate
saveDataToFile
FilePicker
Dialog
```

Ne pas utiliser les helpers Foundry globaux quand une version namespacée existe.

Exemples :

```js
foundry.utils.getProperty(data, path);
foundry.utils.setProperty(data, path, value);
foundry.utils.mergeObject(target, source);
foundry.utils.duplicate(data);
```

Ne pas utiliser :

```js
getProperty(data, path);
setProperty(data, path, value);
mergeObject(target, source);
duplicate(data);
```

Ne pas utiliser `new foundry.applications.DialogV2(...)`.

Utiliser un style JavaScript sans point-virgule superflu.

Exemple attendu :

```js
export const MTT = {
  ID: "mtt-merchants",
  NAME: "Merchants, Trades and Transactions",
};
```

À éviter :

```js
export const MTT = {
  ID: "mtt-merchants",
  NAME: "Merchants, Trades and Transactions",
};
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
module/config/config-export.mjs
module/models/merchant-data.mjs
module/applications/sheets/merchant-sheet.mjs
module/applications/sheets/merchant-catalog.mjs
module/applications/sheets/merchant-trade.mjs
module/applications/sheets/merchant-dialogs.mjs
module/applications/sheets/merchant-utils.mjs
module/applications/sheets/merchant-journal.mjs
templates/actors/merchant-sheet.hbs
templates/actors/parts/merchant-access-rail.hbs
templates/apps/mtt-dialog.hbs
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

La structure des fichiers de langue doit être hiérarchisée.

Utiliser des clés comme :

```js
game.i18n.localize("mtt.log.initializing");
```

Ne pas utiliser de clés plates comme :

```json
{
  "mtt.log.initializing": "Initialisation"
}
```

Ne pas utiliser de namespace en majuscules comme `MTT.Log.Initializing`.

Les fichiers `lang/fr.json` et `lang/en.json` doivent rester alignés.

Quand une clé visible est ajoutée, modifiée, renommée ou supprimée, mettre à jour **les deux fichiers**.

Ne pas conserver de clés de langue inutilisées pour d’anciennes décisions.

---

## 9. CSS / Less

Toutes les classes CSS propres au module doivent être préfixées par `mtt-`.

C’est obligatoire pour éviter les collisions avec les systèmes de jeu et les autres modules.

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

Ne pas réintroduire d’anciens sélecteurs supprimés comme reliquats de navigation si l’interface actuelle utilise une autre structure.

Les fichiers Less doivent rester organisés clairement.

Structure actuelle souhaitée :

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

Les variables CSS `--mtt-*` sont centralisées dans `:root`. Ne pas recréer des fallbacks incohérents ou des variables locales contradictoires.

Les boutons MTT doivent être compacts, avec icône Font Awesome et tooltip localisé, surtout dans les zones denses.

Le texte visible sur les boutons doit être évité dans :

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

La feuille marchand a été séparée en plusieurs fichiers cohérents. Respecter cette organisation.

### `module/applications/sheets/merchant-sheet.mjs`

Rôle : fichier principal et orchestrateur de la feuille.

Ce fichier contient principalement :

- la classe `MerchantSheet` ;
- `DEFAULT_OPTIONS` ;
- `PARTS` ;
- `_prepareContext` si la préparation reste directement liée à la feuille ;
- `_onRender` ;
- les actions Application V2 déclarées ;
- les appels vers les fonctions importées ;
- les wrappers nécessaires quand une action Application V2 doit rester attachée à la classe ;
- l’injection et l’activation de certaines zones de feuille si elles dépendent de la fenêtre.

Ce fichier ne doit pas redevenir un gros fichier fourre-tout. Toute logique métier importante doit être placée dans le fichier spécialisé adapté.

### `module/applications/sheets/merchant-catalog.mjs`

Rôle : gérer le catalogue proposé par le marchand.

Ce fichier regroupe la logique liée à :

- produits ;
- services ;
- catégories ;
- sous-catégories ;
- catégories automatiques par type/sous-type système ;
- distinction drop externe / drop interne du catalogue ;
- déplacement de produit entre catégories ;
- ajout/fusion de produit ;
- création de services libres ;
- ajout de service basé sur Item ;
- prix affichés ;
- prix libre / icône balance ;
- prix minimum MJ ;
- quantités catalogue ;
- produits/services masqués ;
- informations secrètes si déjà présentes ;
- approbation MJ.

Produits et services restent ensemble dans ce fichier, car leur logique reste proche.

Ne pas créer séparément `merchant-products.mjs` et `merchant-services.mjs` sauf demande explicite.

### `module/applications/sheets/merchant-trade.mjs`

Rôle : gérer l’échange entre un client et le marchand.

Ce fichier regroupe la logique liée à :

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

Ce fichier regroupe :

- helpers de DialogV2 ;
- confirmations MTT ;
- dialogue de retrait d’autorisation ;
- dialogue de suppression d’acteur du marchand ;
- dialogue de drop sellerItem ;
- dialogue de vidage de session ;
- dialogue de prévisualisation transaction ;
- dialogue de validation transaction ;
- dialogue d’erreur transaction ;
- dialogue de préparation de session ;
- dialogue d’informations secrètes ;
- dialogue de prix/taux personnalisés.

Le HTML important des dialogues doit être placé dans `templates/dialogs/`.

Éviter le HTML brut de dialogue dispersé dans les fichiers MJS.

### `module/applications/sheets/merchant-utils.mjs`

Rôle : utilitaires communs simples et réutilisables.

Ce fichier peut contenir :

- génération d’identifiants ;
- parsing de nombres ;
- normalisation de quantités ;
- lecture de valeur par chemin configuré ;
- wrappers autour de `foundry.utils.getProperty` si utile ;
- normalisation de catégories ;
- lecture/mapping de catégories automatiques si utilisée par plusieurs parties ;
- regroupement de totaux par monnaie ;
- helpers de devises ;
- récupération de monnaie de référence ;
- helpers de fusion ;
- helpers de livraison ;
- helpers HTML/textes réutilisés.

Ne pas transformer ce fichier en fourre-tout. Une fonction fortement liée à `MerchantSheet`, au DOM ou à une action métier doit rester dans le fichier métier adapté.

### `module/config/config-export.mjs`

Rôle : regrouper la liste des settings exportables et la logique d’export de configuration.

Ce fichier évite le cycle d’import entre `settings.mjs` et `mtt-config-app.mjs`.

Ne pas recréer le cycle `settings.mjs ↔ mtt-config-app.mjs`.

### Règles d’imports

Éviter les dépendances circulaires.

Accepté :

- `merchant-sheet.mjs` importe `merchant-catalog.mjs`
- `merchant-sheet.mjs` importe `merchant-trade.mjs`
- `merchant-sheet.mjs` importe `merchant-dialogs.mjs`
- `merchant-sheet.mjs` importe `merchant-utils.mjs`
- `merchant-catalog.mjs` importe `merchant-utils.mjs`
- `merchant-trade.mjs` importe `merchant-utils.mjs`
- `merchant-dialogs.mjs` importe `merchant-utils.mjs` si nécessaire
- `mtt-config-app.mjs` importe `config-export.mjs`

À éviter :

- `merchant-catalog.mjs` importe `merchant-sheet.mjs`
- `merchant-trade.mjs` importe `merchant-sheet.mjs`
- `merchant-dialogs.mjs` importe `merchant-sheet.mjs`
- `merchant-utils.mjs` importe les fichiers métier
- `settings.mjs` importe des helpers d’export qui importent eux-mêmes `settings.mjs`

Les modules spécialisés peuvent recevoir `sheet`, `actor`, `event`, `target`, `session`, `item` ou les données nécessaires en paramètre.

---

## 11. Type d’acteur marchand

Le module fournit son propre type d’acteur marchand.

Type attendu :

```text
mtt-merchants.merchant
```

Le module ne doit pas modifier les types d’acteurs du système actif.

MTT ne doit pas remplacer la classe document des acteurs du système actif.

MTT ne doit pas modifier directement les feuilles des acteurs CO2 ou d’un autre système.

Ne pas réintroduire de fallback pour un ancien type d’acteur marchand non namespaced comme :

```text
merchant
```

---

## 12. Relation avec Chroniques Oubliées 2

CO2 est seulement le premier environnement de test.

Le cœur MTT doit rester générique.

Les règles spécifiques CO2 doivent être isolées plus tard dans un preset CO2.

Le preset CO2 pourra gérer :

- monnaies PO / PA / PC ;
- chemins de prix ;
- chemins de quantité ;
- types d’Items vendables ;
- types d’acteurs acheteurs ;
- règles de transfert d’objets ;
- règles de transfert de monnaie.

Ne pas coder ces éléments en dur dans le cœur MTT.

Ne pas ajouter de migration MTT pour corriger des données internes CO2, par exemple des warnings système liés à des actions ou modifiers CO2. Ces corrections relèvent du système CO2.

---

## 13. Données système du marchand

Utiliser un `TypeDataModel`.

Utiliser des blocs explicites plutôt qu’un champ trop générique.

Exemples de blocs :

```text
system.merchant.description
system.manager.displayName
system.manager.actorUuid
system.status.isOpen
system.sheet.isLocked
system.catalog
system.services
system.sessions.entries
system.access.clients
system.wallet.currencies
system.trade.sellPercent
system.trade.buyPercent
system.trade.negotiationFormula
```

La feuille marchand est verrouillée par défaut.

Le verrouillage est stocké dans :

```text
system.sheet.isLocked
```

Le verrouillage protège les modifications de configuration/catalogue, mais les actions de session peuvent rester disponibles selon les règles du module.

Ne pas ajouter de champ legacy dans le DataModel pour préserver d’anciens marchands.

---

## 14. Structure visuelle actuelle du marchand

La feuille marchand contient :

- un en-tête avec les informations principales du marchand ;
- une zone de catalogue avec Produits, Services et Configuration ;
- une sidebar/session de transaction ;
- un journal marchand ;
- un rail client compact sur le côté droit sous forme de cards/portraits.

Le rail client ne doit pas casser le layout global de Foundry ni déplacer la sidebar Foundry.

Les clients autorisés ne doivent plus être affichés dans un grand cadre dans l’en-tête.

Les cards clients contiennent uniquement le portrait carré. Les informations textuelles doivent être en tooltip.

Le HTML du rail clients est dans :

```text
templates/actors/parts/merchant-access-rail.hbs
```

Le MJS conserve :

- préparation des données ;
- injection hors fenêtre ;
- positionnement ;
- listeners ;
- drop acteur ;
- menu contextuel.

Ne pas casser le dépassement du rail sur la droite de la fenêtre marchand.

---

## 15. Produits : Item marchand source unique

Un produit du catalogue est l’Item embarqué chez le marchand.

Règle actuelle :

```text
Produit catalogue = Item marchand
nom affiché = item.name
prix affiché = prix lu depuis l’Item
monnaie affichée = monnaie lue depuis l’Item
```

Si le MJ modifie le nom, le prix ou la monnaie depuis le catalogue, cela modifie directement l’Item marchand.

Si le MJ ouvre la fiche de l’Item et modifie son nom, son prix ou sa monnaie, le catalogue doit refléter directement ces valeurs au prochain rendu.

Ne pas recréer de couche commerciale séparée pour les produits.

Ne pas stocker dans les flags produit :

- nom commercial séparé ;
- prix commercial séparé ;
- monnaie commerciale séparée ;
- `displayName` produit ;
- `priceValue` commercial produit ;
- `isCommerciallyModified` produit.

Les flags produit doivent rester réservés aux métadonnées MTT :

- quantité/stock catalogue ;
- catégorie ;
- sous-catégorie ;
- visibilité ;
- approbation MJ ;
- prix libre ;
- prix minimum MJ ;
- secrets ;
- état Limited / Observer ;
- sourceUuid ;
- état de référence marchand.

La livraison d’un produit acheté copie l’Item marchand actuel. MTT n’applique pas un nom/prix/monnaie commercial séparé depuis des flags.

---

## 16. Services

Les services peuvent être créés librement depuis l’interface MTT ou provenir d’un Item.

Ne pas supprimer le bouton ni la logique de création de service libre.

Les services restent des entrées MTT et ne sont pas forcément des Items livrés à l’acheteur.

Un service acheté :

- ne crée pas automatiquement un Item sur l’acteur acheteur ;
- est journalisé ;
- peut avoir un stock limité ou illimité ;
- peut avoir un prix libre ;
- peut demander une approbation MJ ;
- peut avoir des informations secrètes ;
- peut utiliser une logique de modification propre aux services.

Ne pas appliquer mécaniquement la logique “produit = Item marchand source unique” aux services.

---

## 17. Catégories et sous-catégories système

MTT distingue trois notions :

1. Le type Foundry de l’Item, qui peut servir à autoriser/refuser l’ajout.
2. Le type/sous-type/catégorie système, lu via des chemins configurés.
3. La catégorie marchande MTT, indépendante et modifiable.

Les catégories automatiques doivent utiliser plusieurs chemins configurables par le MJ, car certains systèmes ont plusieurs types d’objets d’équipement avec leurs propres sous-types.

La catégorie automatique issue du type/sous-type système ne doit jamais modifier l’Item.

Elle sert seulement à initialiser ou suggérer la catégorie MTT.

Si le MJ déplace ensuite un produit vers une autre catégorie, ne pas le remettre automatiquement dans sa catégorie système.

Les sous-catégories sont indiquées discrètement par une icône au début de ligne, sans créer de ligne de sous-titre séparée.

Les icônes alternent selon la position triée de la sous-catégorie dans chaque catégorie principale.

---

## 18. Monnaies et prix

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

Ne pas réintroduire les anciens settings globaux supprimés :

```text
itemPriceValuePath
itemPriceCurrencyPath
actorCurrencyPath
```

Lecture et écriture du prix Item doivent passer par les fonctions actuelles fondées sur le tableau des devises.

Si le tableau des devises n’est pas configuré correctement, afficher une notification claire au MJ plutôt que d’utiliser un fallback legacy.

La monnaie de référence est la devise dont le taux vaut 1 et/ou qui est marquée comme référence selon la logique actuelle.

Le prix affiché dans le catalogue peut être formaté dans la monnaie de référence ou selon la logique actuelle du module.

---

## 19. Informations secrètes des produits/services

Un produit ou service peut avoir des informations secrètes :

- nom secret ;
- prix secret ;
- monnaie secrète ;
- description secrète.

Ces informations sont réservées au MJ et aux utilisateurs ayant les droits appropriés.

Elles ne remplacent pas les données visibles.

Lors de la livraison d’un objet acheté, MTT peut ajouter un bloc secret au bon chemin de description secrète si configuré, et une ligne non secrète avec les informations de transaction si l’option correspondante est activée.

Le joueur ne doit pas voir de bouton ou d’indicateur lui révélant qu’un secret existe.

Dans le journal, les secrets ne doivent pas exposer leur contenu aux acheteurs.

---

## 20. Prix libre et négociation

Le prix classique d’un produit/service peut être ajusté par les pourcentages du marchand et par les taux personnalisés de l’acheteur actif.

Pour l’option “prix libre / proposer un prix au vendeur” :

- afficher une icône compacte, par exemple une balance ;
- ne pas afficher un long texte dans la ligne catalogue ;
- ajouter un tooltip ;
- ajouter un prix minimum MJ caché ;
- ne pas afficher ce prix minimum aux acheteurs ;
- ne pas appliquer les pourcentages de vente/rachat à ce prix libre.

Le test de négociation n’a aucun rôle automatique.

Il sert seulement de raccourci/outillage MJ.

Il ne valide, refuse ou modifie rien automatiquement.

Le MJ décide manuellement d’accepter, refuser ou contre-proposer chaque ligne de négociation.

---

## 21. Clients autorisés et rail de cards

Le MJ gère les clients autorisés via le rail de cards.

Logique :

- acteur non autorisé : clic gauche = autoriser ;
- acteur autorisé : clic gauche = ouvrir/sélectionner sa session ;
- retirer une autorisation : clic droit / menu contextuel ;
- supprimer l’acteur du marchand : clic droit / menu contextuel.

Une card non autorisée est en noir et blanc avec opacité réduite.

Une card autorisée est en couleur avec opacité normale.

L’icône de card ne signale pas l’autorisation. Elle signale seulement l’état de session :

- aucune session = aucune icône ;
- session en cours = sablier ;
- en attente de décision = warning ;
- validée = check vert ;
- refusée = croix rouge.

La card de la session sélectionnée doit être mise en valeur.

Quand un acteur est autorisé à commercer, une session doit exister pour lui chez ce marchand.

Un acteur ne peut avoir qu’une seule session par marchand.

---

## 22. Limitation globale des sessions

Un acteur ne doit pas pouvoir avoir plusieurs sessions `active` ou `pending` avec plusieurs marchands différents.

Objectif : éviter qu’un PJ vende deux fois le même objet unique à deux marchands.

Statuts bloquants : `active`, `pending`.

Statuts non bloquants : `validated`, `refused`.

Le verrou global est par acteur, pas par Item.

---

## 23. Sessions et transaction

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

---

## 24. Validation/refus de ligne et de session

Distinguer deux niveaux :

1. validation/refus d’une négociation de ligne ;
2. validation/refus de la session entière.

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
- aucune transaction n’est effectuée ;
- aucun transfert ;
- aucune entrée de journal.

---

## 25. Vente d’objets du PJ au marchand

Lors de l’exécution réelle, MTT doit seulement diminuer la quantité possédée par le PJ sur l’Item source.

MTT ne doit pas supprimer directement l’Item si la quantité tombe à zéro.

Le système actif gère ses propres règles du type “détruire l’objet si vide”.

Au moment de valider/exécuter la session, MTT doit revérifier :

- quantité disponible actuelle ;
- prix/valeur actuelle ;
- existence de l’Item source.

Ne pas se fier uniquement aux valeurs capturées au moment du drop.

La zone “Le PJ vend / donne” doit refuser les drops internes depuis le catalogue du marchand.

---

## 26. Livraison des objets au PJ

Lors d’un achat validé, MTT doit :

- copier l’Item marchand actuel ;
- créer ou fusionner l’Item sur l’acteur client selon les règles de stacking/fusion ;
- appliquer la quantité achetée ;
- appliquer les informations de provenance visibles si l’option est activée ;
- ajouter les informations secrètes au chemin secret configuré si nécessaire ;
- accorder des droits sur l’objet livré selon l’option système prévue ;
- respecter les quantités maximales de pile uniquement sur l’acteur destinataire, pas sur le stock marchand.

La logique de quantité maximale par pile ne s’applique pas au stock du marchand.

Un marchand peut avoir une pile commerciale de 35 armures même si le système actif limite l’Item acteur à 1 par pile.

La quantité max sert uniquement au moment de livrer/fusionner/créer les Items sur l’acteur acheteur.

---

## 27. Ajustement monétaire

La transaction peut utiliser plusieurs monnaies.

Le système doit faire une conversion automatique selon les devises configurées, en commençant par la monnaie la plus forte.

Le marchand rend la monnaie si possible.

Si le marchand n’a pas assez de monnaie pour rendre, la vente automatique est bloquée et demande une décision MJ.

Par défaut, une validation MJ est toujours nécessaire.

Une option future pourra éventuellement permettre des ventes automatiques.

---

## 28. Journal marchand et journal global

Le journal marchand existe.

Le journal global existe.

La visibilité est filtrée selon les droits :

- MJ / propriétaire / gestionnaire du marchand : voit toutes les transactions du marchand ;
- acheteur : voit uniquement ses propres transactions avec ce marchand ;
- journal global : doit respecter la même logique de visibilité.

Les sessions validées/refusées sont copiées dans le journal du marchand.

Le journal conserve les données prévues par le format actuel uniquement. Ne pas réintroduire d’anciens formats comme fallback.

Les secrets ne doivent pas exposer leur contenu aux acheteurs.

Ne pas prévoir d’annulation automatique après coup : c’est trop risqué et complexe.

---

## 29. Visibilité MJ / acheteur

Produit masqué : le joueur ne voit rien, pas même la ligne.

Catégorie masquée : le joueur ne voit pas la catégorie ni ses produits.

Stock exact : visible par défaut aux acheteurs.

Service nécessitant validation MJ : visible par défaut aux acheteurs.

Les joueurs ne voient pas les autres sessions/acheteurs par défaut.

Prévoir une option système permettant d’autoriser ou non la visibilité des autres sessions et acheteurs si la fonctionnalité est demandée plus tard.

Distinguer deux niveaux d’accès :

1. permissions Foundry sur l’acteur marchand ;
2. autorisations commerciales propres au marchand via les clients autorisés.

---

## 30. Dialogues et notifications

Les dialogues MTT doivent utiliser une structure stylable propre au module, avec des classes `mtt-dialog`.

Les dialogues importants doivent utiliser les templates dédiés dans :

```text
templates/dialogs/
```

Éviter les contenus HTML bruts dispersés dans les MJS.

Supprimer les doubles confirmations inutiles.

Exemple : choisir “retirer l’autorisation” dans un menu contextuel puis confirmer une fois suffit.

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
- absence de client/session quand l’action ne peut pas continuer ;
- configuration manquante.

---

## 31. Configuration du module

Le module doit permettre de configurer des chemins pour rester universel.

Options importantes actuelles :

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

L’import/export de configuration est géré via `module/config/config-export.mjs`.

---

## 32. État de référence marchand

Le marchand peut enregistrer un état de référence et réinitialiser certains éléments vers cet état.

La réinitialisation concerne l’état actuel prévu par le module, notamment selon la logique existante :

- quantités produits/services ;
- visibilité produits/services ;
- état Limited/Observer ;
- approbation MJ ;
- visibilité des catégories.

Ne pas réintroduire de compatibilité avec d’anciens formats d’état de référence.

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

## 34. Prompts pour Codex / Claude Code

Les instructions destinées à Codex ou Claude Code doivent mentionner :

```text
Lis le fichier `agents.md` à la racine du dépôt.
Attention : le fichier est nommé `agents.md` en minuscules, pas `AGENTS.md`.
```

Ne pas demander de lire `AGENTS.md`.

Quand l’utilisateur demande un bloc pour Codex ou Claude Code, fournir toutes les instructions dans un seul bloc copiable.

Ne pas mettre de consignes importantes hors du bloc copiable.

Si une étape demande un rapport, le rapport doit être créé en `.md` à la racine du module.

---

## 35. Règles de réponse attendues pour Codex / Claude Code

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
- ne pas réintroduire de couche commerciale séparée pour les produits ;
- ne pas utiliser les globals Foundry dépréciés ;
- créer un rapport `.md` à la racine quand l’utilisateur le demande ou quand une étape de nettoyage l’exige.
