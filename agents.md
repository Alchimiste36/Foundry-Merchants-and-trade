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

## 2. Objectif général

MTT doit permettre de gérer des marchands, boutiques, services, catalogues et transactions dans Foundry VTT.

La vision du module inclut :

- des marchands configurables ;
- des produits ;
- des services basés sur des Items ;
- des catégories marchandes ;
- des clients autorisés ;
- des sessions de transaction ;
- du troc ;
- des ventes au marchand ;
- des validations MJ ;
- des négociations manuelles ;
- un ajustement monétaire automatique ;
- un journal de transactions réservé au MJ ;
- des presets d’adaptation pour différents systèmes de jeu.

Le premier système de test et futur preset sera **Chroniques Oubliées 2**, mais le cœur du module ne doit pas dépendre directement de CO2.

---

## 3. Philosophie de développement

Avancer étape par étape, avec rigueur.

Ne pas développer tout le système de transaction d’un coup.

Ne pas ajouter de fonctionnalité avancée non demandée.

Ne pas refactoriser massivement sans demande explicite.

Quand une modification demandée est confirmée comme fonctionnelle par l’utilisateur, considérer qu’elle existe dans son état local, même si elle n’a pas encore été poussée sur GitHub.

Quand l’utilisateur dit qu’il a poussé, le dépôt GitHub redevient l’état de référence.

Pour les gros changements dans un même fichier, préférer un fichier complet ou un diff très clair lorsque l’utilisateur le demande. Pour Codex ou Claude Code, modifier directement les fichiers sans demander à l’utilisateur de recoller manuellement des morceaux.

---

## 4. Outils et dépendances

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

## 5. Foundry VTT et conventions JavaScript

Utiliser du JavaScript moderne compatible Foundry VTT V14.

Respecter les APIs modernes :

- Application V2 ;
- ActorSheetV2 ;
- HandlebarsApplicationMixin ;
- TypeDataModel ;
- `foundry.data.fields` ;
- `foundry.applications.api.DialogV2` pour les dialogues ;
- `foundry.applications.ux.TextEditor.implementation.getDragEventData(event)` pour les données de drag’n drop ;
- `async` / `await`.

Ne pas utiliser les anciens patterns Foundry V1 sauf nécessité explicite.

Ne pas utiliser le global déprécié `TextEditor`.

Ne pas utiliser `new foundry.applications.DialogV2(...)`.

Utiliser un style JavaScript sans point-virgule superflu.

Exemple attendu :

```js
export const MTT = {
  ID: "mtt-merchants",
  NAME: "Merchants, Trades and Transactions"
}
```

À éviter :

```js
export const MTT = {
  ID: "mtt-merchants",
  NAME: "Merchants, Trades and Transactions"
};
```

---

## 6. Convention de fichiers et chemins

Tous les fichiers et dossiers doivent être en minuscules.

Exemples :

```text
mtt.mjs
agents.md
module/config/constants.mjs
module/models/merchant-data.mjs
module/applications/sheets/merchant-sheet.mjs
module/applications/sheets/merchant-catalog.mjs
module/applications/sheets/merchant-trade.mjs
module/applications/sheets/merchant-dialogs.mjs
module/applications/sheets/merchant-utils.mjs
templates/actors/merchant-sheet.hbs
templates/apps/mtt-dialog.hbs
styles/mtt.less
css/mtt.css
lang/fr.json
lang/en.json
```

Éviter les majuscules dans les chemins.

---

## 7. Localisation

Toute chaîne affichée à l’utilisateur doit passer par les fichiers de langue.

Cela concerne : titres, boutons, labels, tooltips, notifications, dialogues, settings, titres de feuilles et messages utiles dans la console.

Le namespace de localisation est `mtt`.

La structure des fichiers de langue doit être hiérarchisée.

Utiliser des clés comme :

```js
game.i18n.localize("mtt.log.initializing")
```

Ne pas utiliser de clés plates comme :

```json
{
  "mtt.log.initializing": "Initialisation"
}
```

Ne pas utiliser de namespace en majuscules comme `MTT.Log.Initializing`.

Pendant la phase actuelle de développement, modifier uniquement `lang/fr.json`, sauf demande explicite de traduction anglaise. `lang/en.json` sera complété à la fin.

---

## 8. CSS / Less

Toutes les classes CSS propres au module doivent être préfixées par `mtt-`.

C’est obligatoire pour éviter les collisions avec les systèmes de jeu et les autres modules.

Classes acceptées :

```text
mtt-sheet
mtt-merchant-sheet
mtt-merchant-window
mtt-merchant-form
mtt-merchant-header
mtt-merchant-sidebar
mtt-merchant-main
mtt-merchant-navigation
mtt-merchant-product-row
mtt-merchant-service-row
mtt-merchant-session
mtt-merchant-access-rail
mtt-dialog
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

Les fichiers Less doivent rester organisés clairement.

Structure souhaitée :

```text
styles/
  mtt.less
  applications/
    _index.less
    merchant-sheet.less
```

Le CSS compilé doit aller dans :

```text
css/mtt.css
```

Le CSS local modifié manuellement par l’utilisateur doit être préservé. Ne pas réécrire/refactoriser le CSS des produits, du rail client, des sessions ou du layout général sans nécessité explicite.

Les boutons MTT doivent être compacts, avec icône Font Awesome et tooltip localisé, surtout dans les zones denses.

Le texte visible sur les boutons doit être évité dans : lignes produits, lignes services, rail clients, actions rapides, navigation secondaire et session.

Utiliser `data-tooltip="{{localize '...'}}"`.

---

## 9. Architecture JavaScript actuelle

La feuille marchand a été séparée en plusieurs fichiers cohérents. Respecter cette organisation.

### `module/applications/sheets/merchant-sheet.mjs`

Rôle : fichier principal et orchestrateur de la feuille.

Ce fichier doit contenir principalement :

- la classe `MerchantSheet` ;
- `DEFAULT_OPTIONS` ;
- `PARTS` ;
- `_prepareContext` si la préparation reste directement liée à la feuille ;
- `_onRender` ;
- les actions Application V2 déclarées ;
- les appels vers les fonctions importées ;
- les wrappers nécessaires quand une action Application V2 doit rester attachée à la classe.

Ce fichier ne doit pas redevenir un gros fichier fourre-tout. Toute logique métier importante doit être placée dans le fichier spécialisé adapté.

### `module/applications/sheets/merchant-catalog.mjs`

Rôle : gérer le catalogue proposé par le marchand.

Ce fichier regroupe la logique liée à :

- produits ;
- services ;
- catégories ;
- catégories automatiques par type/sous-type système ;
- distinction drop externe / drop interne du catalogue ;
- déplacement de produit entre catégories ;
- ajout/fusion de produit ;
- ajout de service basé sur Item ;
- édition des données commerciales produits/services ;
- prix affichés ;
- prix libre / icône balance ;
- prix minimum MJ ;
- quantités catalogue ;
- produits/services masqués ;
- informations commerciales ;
- informations secrètes si déjà présentes.

Produits et services restent ensemble dans ce fichier, car leur logique est proche.

Ne pas créer séparément `merchant-products.mjs` et `merchant-services.mjs` sauf demande explicite.

### `module/applications/sheets/merchant-trade.mjs`

Rôle : gérer l’échange entre un client et le marchand.

Ce fichier regroupe la logique liée à :

- clients autorisés ;
- rail de cards clients ;
- clic gauche / clic droit sur cards ;
- autorisation / retrait d’autorisation ;
- suppression d’un acteur du marchand ;
- verrou global anti-double-session ;
- session automatiquement liée à un acteur autorisé ;
- sélection de session ;
- buyerItems : “Le PJ achète / reçoit” ;
- sellerItems : “Le PJ vend / donne” ;
- correction du drop marchand vers “Le PJ donne” ;
- quantités dans la session ;
- totaux ;
- ajustement monétaire ;
- vérification de transaction ;
- prévisualisation d’exécution ;
- future validation/refus réel ;
- futur transfert objets/monnaies ;
- futur journal marchand.

Ne pas recréer séparément `merchant-access.mjs`, `merchant-sessions.mjs` ou `merchant-transaction-check.mjs` sauf demande explicite.

### `module/applications/sheets/merchant-dialogs.mjs`

Rôle : centraliser les dialogues MTT.

Ce fichier regroupe :

- rendu du template de dialogue MTT ;
- helpers de DialogV2 ;
- confirmations MTT ;
- dialogue de retrait d’autorisation ;
- dialogue de suppression d’acteur du marchand ;
- dialogue de drop sellerItem ;
- dialogue de vidage de session ;
- dialogue de prévisualisation transaction ;
- dialogue d’erreur transaction.

Le but est d’éviter du HTML brut de dialogue dispersé dans les autres fichiers.

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
- récupération de monnaie de référence si déjà présente.

Ne pas transformer ce fichier en fourre-tout. Une fonction fortement liée à `MerchantSheet`, au DOM ou à une action métier doit rester dans le fichier métier adapté.

### Règles d’imports

Éviter les dépendances circulaires.

Accepté :

- `merchant-sheet.mjs` importe `merchant-catalog.mjs`
- `merchant-sheet.mjs` importe `merchant-trade.mjs`
- `merchant-sheet.mjs` importe `merchant-dialogs.mjs`
- `merchant-sheet.mjs` importe `merchant-utils.mjs`
- `merchant-catalog.mjs` importe `merchant-utils.mjs`
- `merchant-catalog.mjs` importe `merchant-dialogs.mjs` si nécessaire
- `merchant-trade.mjs` importe `merchant-utils.mjs`
- `merchant-trade.mjs` importe `merchant-dialogs.mjs` si nécessaire

À éviter :

- `merchant-catalog.mjs` importe `merchant-sheet.mjs`
- `merchant-trade.mjs` importe `merchant-sheet.mjs`
- `merchant-dialogs.mjs` importe `merchant-sheet.mjs`
- `merchant-utils.mjs` importe les fichiers métier.

Les modules spécialisés peuvent recevoir `sheet`, `actor`, `event`, `target`, `session`, `item` ou les données nécessaires en paramètre.

---

## 10. Type d’acteur marchand

Le module fournit son propre type d’acteur marchand.

Type attendu :

```text
mtt-merchants.merchant
```

Le module ne doit pas modifier les types d’acteurs du système actif.

MTT ne doit pas remplacer la classe document des acteurs du système actif.

MTT ne doit pas modifier directement les feuilles des acteurs CO2 ou d’un autre système.

---

## 11. Relation avec Chroniques Oubliées 2

CO2 est seulement le premier environnement de test.

Le cœur MTT doit rester générique.

Les règles spécifiques CO2 doivent être isolées plus tard dans un preset CO2.

Le preset CO2 pourra gérer : monnaies PO / PA / PC, chemins de prix, chemins de quantité, types d’Items vendables, types d’acteurs acheteurs, règles de transfert d’objets et règles de transfert de monnaie.

Ne pas coder ces éléments en dur dans le cœur MTT.

---

## 12. Données système du marchand

Utiliser un `TypeDataModel`.

Utiliser des blocs explicites plutôt qu’un champ trop générique.

Exemples :

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

---

## 13. Structure visuelle actuelle du marchand

La feuille marchand contient :

- un en-tête avec les informations principales du marchand ;
- une zone de catalogue avec Produits, Services et Configuration ;
- une sidebar/session de transaction ;
- un rail client compact sur le côté droit sous forme de cards/portraits.

Le rail client ne doit pas casser le layout global de Foundry ni déplacer la sidebar Foundry.

Les clients autorisés ne doivent plus être affichés dans un grand cadre dans l’en-tête.

Les cards clients contiennent uniquement le portrait carré. Les informations textuelles doivent être en tooltip.

---

## 14. Produits et services

Les produits et services partent tous deux d’Items Foundry.

Abandonner les services libres écrits directement depuis le marchand.

Les services suivent une logique proche des produits avec quelques différences mineures : quantité souvent illimitée ou optionnelle, validation MJ possible, livraison future différente d’un produit, entrée de transaction ou preuve de service possible plus tard.

Ne pas séparer inutilement produits et services dans l’architecture tant que leur logique reste proche.

---

## 15. Catégories et sous-types système

MTT distingue trois notions :

1. Le type Foundry de l’Item, qui peut servir à autoriser/refuser l’ajout.
2. Le type/sous-type/catégorie système, lu via des chemins configurés.
3. La catégorie marchande MTT, indépendante et modifiable.

Les catégories automatiques doivent utiliser plusieurs chemins configurables par le MJ, car certains systèmes ont plusieurs types d’objets d’équipement avec leurs propres sous-types.

La catégorie automatique issue du type/sous-type système ne doit jamais modifier l’Item source.

Elle sert seulement à initialiser ou suggérer la catégorie MTT.

Si le MJ déplace ensuite un produit vers une autre catégorie, ne pas le remettre automatiquement dans sa catégorie système.

Drop attendu :

- drop externe d’un Item Foundry vers le marchand : ajout dans la catégorie automatique de l’objet source ;
- drop interne d’un produit MTT vers une catégorie : changement de catégorie MTT ;
- drop externe visuellement au-dessus d’une catégorie : ne doit pas forcer cette catégorie.

---

## 16. Informations secrètes des produits/services

Un produit ou service peut avoir des informations secrètes : nom secret, prix secret, description secrète.

Ces informations sont réservées au MJ.

Elles ne remplacent pas les données visibles.

Lors d’une future livraison d’objet, MTT devra ajouter un bloc secret au début de la description de l’objet livré, ainsi qu’une ligne non secrète avec les informations de transaction.

Le joueur ne doit pas voir de bouton ou d’indicateur lui révélant qu’un secret existe.

---

## 17. Prix, prix libre et négociation

Le prix classique d’un produit/service peut être ajusté par les pourcentages du marchand.

Pour l’option “prix libre / proposer un prix au vendeur” :

- afficher une icône compacte, par exemple une balance ;
- ne pas afficher un long texte dans la ligne catalogue ;
- ajouter un tooltip ;
- ajouter un prix minimum MJ caché ;
- ne pas afficher ce prix minimum aux acheteurs ;
- ne pas appliquer les pourcentages de vente/rachat à ce prix libre ;
- les propositions se font dans la monnaie principale configurée, celle dont le taux vaut 1.

Le test de négociation n’a aucun rôle automatique.

Il sert seulement de raccourci/outillage MJ.

Il ne valide, refuse ou modifie rien automatiquement.

Le MJ décide manuellement d’accepter, refuser ou contre-proposer chaque ligne de négociation.

---

## 18. Clients autorisés et cards

Le MJ gère les clients autorisés via le rail de cards.

Logique :

- acteur non autorisé : clic gauche = autoriser ;
- acteur autorisé : clic gauche = ouvrir/sélectionner sa session ;
- retirer une autorisation : clic droit / menu contextuel ;
- supprimer l’acteur du marchand : clic droit / menu contextuel.

Une card non autorisée est en noir et blanc avec opacité réduite.

Une card autorisée est en couleur avec opacité normale.

L’icône de card ne signale pas l’autorisation. Elle signale seulement l’état de session : aucune session = aucune icône, session en cours = sablier, en attente de décision = warning, validée = check vert, refusée = croix rouge.

La card de la session sélectionnée doit être mise en valeur.

Quand un acteur est autorisé à commercer, une session doit exister pour lui chez ce marchand.

Un acteur ne peut avoir qu’une seule session par marchand.

---

## 19. Limitation globale des sessions

Un acteur ne doit pas pouvoir avoir plusieurs sessions `active` ou `pending` avec plusieurs marchands différents.

Objectif : éviter qu’un PJ vende deux fois le même objet unique à deux marchands.

Statuts bloquants : `active`, `pending`.

Statuts non bloquants : `validated`, `refused`.

Le verrou global est par acteur, pas par Item.

---

## 20. Sessions et transaction

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

## 21. Validation/refus de ligne et de session

Distinguer deux niveaux : validation/refus d’une négociation de ligne et validation/refus de la session entière.

La validation/refus d’une ligne concerne un produit ou service précis et sera développée plus tard.

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

## 22. Vente d’objets du PJ au marchand

Lors de l’exécution future, MTT doit seulement diminuer la quantité possédée par le PJ sur l’Item source.

MTT ne doit pas supprimer directement l’Item si la quantité tombe à zéro.

Le système actif gère ses propres règles du type “détruire l’objet si vide”.

Au moment de valider/exécuter la session, MTT doit revérifier quantité disponible actuelle, prix/valeur actuelle et existence de l’Item source.

Ne pas se fier uniquement aux valeurs capturées au moment du drop.

La zone “Le PJ vend / donne” doit refuser les drops internes depuis le catalogue du marchand.

---

## 23. Livraison future des objets au PJ

Lors d’un futur achat validé, MTT devra :

- créer une copie de l’Item acheté sur l’acteur client ;
- appliquer la quantité achetée ;
- appliquer les données commerciales visibles ;
- ajouter un bloc secret en début de description si nécessaire ;
- ajouter une ligne non secrète avec les informations de transaction ;
- accorder des droits sur l’objet livré selon une option système : limité, observateur ou propriétaire.

La visibilité du bloc secret dépendra des droits accordés et du comportement Foundry/système actif.

---

## 24. Ajustement monétaire

La transaction pourra utiliser plusieurs monnaies.

Le système devra faire une conversion automatique selon les devises configurées, en commençant par la monnaie la plus forte.

Le marchand rend la monnaie si possible.

Si le marchand n’a pas assez de monnaie pour rendre, la vente automatique est bloquée et demande une décision MJ.

Par défaut, une validation MJ est toujours nécessaire.

Une option future pourra éventuellement permettre des ventes automatiques.

---

## 25. Journal des transactions

Le journal est réservé au MJ.

Chaque marchand aura son propre journal des transactions réalisées chez lui.

Les sessions validées/refusées seront copiées dans le journal du marchand.

Les secrets doivent être inclus dans le journal MJ.

Ne pas prévoir d’annulation automatique après coup : c’est trop risqué et complexe.

Un journal global du module est une idée future, mais reste à définir plus tard.

Le journal marchand servira aussi à savoir si un PJ a déjà beaucoup dépensé chez ce marchand.

Plus tard, prévoir des réductions ou augmentations par acteur autorisé, par exemple bons ou mauvais clients.

---

## 26. Visibilité MJ / acheteur

Produit masqué : le joueur ne voit rien, pas même la ligne.

Catégorie masquée : le joueur ne voit pas la catégorie ni ses produits.

Stock exact : visible par défaut aux acheteurs.

Service nécessitant validation MJ : visible par défaut aux acheteurs.

Les joueurs ne voient pas les autres sessions/acheteurs par défaut.

Prévoir une option système permettant d’autoriser ou non la visibilité des autres sessions et acheteurs.

Distinguer deux niveaux d’accès : permissions Foundry sur l’acteur marchand et autorisations commerciales propres au marchand via les clients autorisés.

Les détails des droits par niveau Foundry seront définis plus tard.

---

## 27. Dialogues et notifications

Les dialogues MTT doivent utiliser une structure stylable propre au module, avec des classes `mtt-dialog`.

Éviter les contenus HTML bruts et moches dans les DialogV2.

Supprimer les doubles confirmations inutiles.

Exemple : choisir “retirer l’autorisation” dans un menu contextuel puis confirmer une fois suffit.

Les notifications info pour actions normales doivent être évitées.

Ne pas afficher de notification info pour session créée, acteur autorisé, session sélectionnée, produit ajouté si l’interface le montre, quantité mise à jour ou catégorie changée.

Conserver les notifications seulement pour erreurs, warnings, actions impossibles, blocages de sécurité, drop invalide, quantité invalide, verrou global, stock ou monnaie insuffisante, absence de client/session quand l’action ne peut pas continuer.

---

## 28. Configuration du module

Le module doit permettre de configurer des chemins pour rester universel.

Options importantes :

- types d’Items autorisés comme produits ;
- types d’Items autorisés comme services ;
- chemins de quantité ;
- chemins de prix ;
- chemins de monnaie ;
- chemins de catégories automatiques ;
- mapping de libellés de catégories ;
- monnaies et taux de conversion ;
- monnaie de référence avec taux 1 ;
- droits accordés aux objets livrés plus tard ;
- option future d’affichage des autres clients/sessions aux joueurs.

---

## 29. Prompts pour Codex / Claude Code

Les instructions destinées à Codex ou Claude Code doivent mentionner :

```text
Lis le fichier `agents.md` à la racine du dépôt.
Attention : le fichier est nommé `agents.md` en minuscules, pas `AGENTS.md`.
```

Ne pas demander de lire `AGENTS.md`.

Quand l’utilisateur demande un bloc pour Codex ou Claude Code, fournir toutes les instructions dans un seul bloc copiable.

Ne pas mettre de consignes importantes hors du bloc copiable.

---

## 30. Règles de réponse attendues pour Codex / Claude Code

Quand Codex ou Claude Code modifie les fichiers :

- lire `agents.md` avant de modifier ;
- travailler en respectant l’état actuel du repo ;
- éviter les gros changements non demandés ;
- ne pas ajouter de fonctionnalités avancées sans demande explicite ;
- respecter le style sans point-virgule ;
- respecter les localisations hiérarchisées ;
- modifier `lang/fr.json` seulement sauf demande explicite ;
- respecter les classes CSS préfixées `mtt-` ;
- ne pas introduire de dépendance directe au système CO2 dans le cœur MTT ;
- ne pas ajouter de dépendances npm sans validation ;
- ne pas refactoriser massivement sans demande explicite ;
- préserver les corrections CSS locales ;
- préserver le rail client et ne pas casser le layout global Foundry ;
- respecter la séparation entre `merchant-sheet.mjs`, `merchant-catalog.mjs`, `merchant-trade.mjs`, `merchant-dialogs.mjs` et `merchant-utils.mjs`.
