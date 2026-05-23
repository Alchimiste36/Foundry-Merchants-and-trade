# Instructions projet — Merchants, Trades and Transactions

## 1. Identité du projet

Nom du module : **Merchants, Trades and Transactions**

Acronyme : **MTT**

Identifiant Foundry du module : `mtt-merchants`

Préfixe CSS obligatoire : `mtt-`

Namespace de localisation : `mtt`

Dépôt GitHub : `https://github.com/Alchimiste36/Foundry-Merchants-and-trade`

Le projet est un **module indépendant pour Foundry VTT**, et non une fonctionnalité directement intégrée dans le système Chroniques Oubliées 2.

Le module cible **Foundry VTT V14**.

> Note : l’utilisateur est néophyte en développement. Merci de garder les fichiers cohérents entre l’existant et les nouvelles modifications.

---

## 2. Objectif général

Le module MTT doit permettre de gérer des marchands, boutiques, services, catalogues et transactions dans Foundry VTT.

La vision complète du module inclut à terme :

- des marchands configurables ;
- des produits ;
- des services ;
- des catégories ;
- des sessions joueur / marchand ;
- des paniers ;
- des ventes au marchand ;
- des validations MJ ;
- des négociations ;
- un journal des transactions ;
- des presets d’adaptation pour différents systèmes de jeu.

Le premier système de test et futur preset sera **Chroniques Oubliées 2**, mais le cœur du module ne doit pas dépendre directement de CO2.

---

## 3. Philosophie de développement

Avancer **étape par étape**.

Ne pas développer immédiatement tout le système de transaction.

La première étape doit être simple :

- un module qui se charge dans Foundry VTT V14 ;
- un type d’acteur marchand fourni par le module ;
- une feuille marchand qui s’ouvre ;
- une interface propre ;
- une liste d’objets embarqués ;
- possibilité future d’insérer ou créer des objets depuis la feuille.

Les fonctionnalités avancées viennent plus tard.

---

## Règle de simplicité des outils de développement

Le projet MTT doit rester simple dans ses outils de développement.

Ne pas ajouter de dépendance npm, de plugin Gulp, de configuration de build ou d’outil supplémentaire sans nécessité claire et explicitement demandée.

Pour la phase actuelle, les outils autorisés sont :

- `gulp`
- `gulp-less`
- `less`
- `prettier`
- `eslint`
- `@eslint/js`
- `globals`

Le fichier `gulpfile.mjs` doit rester minimal.

Il doit uniquement compiler :

````text
styles/mtt.less

vers :

css/mtt.css

et permettre un mode watch sur les fichiers .less.

Ne pas ajouter automatiquement :

gulp-sourcemaps
gulp-clean-css
minification CSS
sourcemaps
bundler JavaScript
transpiler
framework CSS
dépendance liée à Steam, au commerce en ligne ou à un sujet externe
outil de packaging non demandé

Si une nouvelle dépendance semble utile, proposer d’abord l’ajout avec une justification courte, puis attendre validation avant de modifier package.json, package-lock.json ou gulpfile.mjs.

Principe général :

Commencer par la solution la plus simple qui fonctionne, puis complexifier seulement si un besoin réel apparaît.

En cas de doute, ne pas ajouter de dépendance.

## 4. Type d’acteur marchand

Le module doit fournir son propre sous-type d’acteur marchand.

Type attendu :

```text
mtt-merchants.merchant
````

Le module ne doit pas modifier les types d’acteurs du système actif.

Dans un monde CO2, on doit pouvoir avoir côte à côte :

- des acteurs CO2 `character` ;
- des acteurs CO2 `encounter` ;
- des acteurs MTT `mtt-merchants.merchant`.

MTT ne doit pas remplacer la classe document des acteurs du système actif.

MTT ne doit pas modifier directement les feuilles des acteurs CO2.

---

## 5. Relation avec Chroniques Oubliées 2

CO2 est seulement le premier environnement de test.

Le système CO2 déclare principalement les acteurs :

- `character`
- `encounter`

MTT doit ajouter un acteur marchand séparé.

Le cœur MTT doit rester générique.

Les règles spécifiques CO2 devront être isolées plus tard dans un preset CO2.

Le preset CO2 pourra gérer :

- monnaies PO / PA / PC ;
- chemins de prix ;
- chemins de quantité ;
- types d’items vendables ;
- types d’acteurs acheteurs ;
- règles de transfert d’objets ;
- règles de transfert de monnaie.

Ces éléments ne doivent pas être codés en dur dans le cœur MTT au début.

---

## 6. Convention JavaScript

Utiliser du JavaScript moderne compatible Foundry VTT V14.

Respecter les APIs modernes :

- Application V2 ;
- ActorSheetV2 ;
- HandlebarsApplicationMixin ;
- TypeDataModel ;
- `foundry.data.fields` ;
- DialogV2 quand un dialogue est nécessaire ;
- `async` / `await`.

Ne pas utiliser les anciens patterns Foundry V1 sauf nécessité explicite.

Ne pas utiliser de point-virgule superflu.

Style attendu :

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
module/config/constants.mjs
module/models/merchant-data.mjs
module/applications/sheets/merchant-sheet.mjs
templates/actors/merchant-sheet.hbs
styles/mtt.less
css/mtt.css
lang/fr.json
lang/en.json
```

Éviter les majuscules dans les chemins.

---

## 8. Convention de localisation

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

Exemple attendu :

```json
{
  "mtt": {
    "log": {
      "initializing": "Initialisation",
      "initialized": "Initialisé",
      "ready": "Prêt"
    },
    "sheets": {
      "merchant": "Feuille de marchand"
    },
    "settings": {
      "debug": {
        "name": "Mode debug MTT",
        "hint": "Active des informations supplémentaires dans la console pour le module Merchants, Trades and Transactions."
      }
    }
  }
}
```

Dans le code, utiliser des clés comme :

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

---

## 9. Convention CSS / Less

Toutes les classes CSS propres au module doivent être préfixées par `mtt-`.

C’est une règle obligatoire.

But : éviter les collisions avec les systèmes de jeu et les autres modules.

Classes acceptées :

```text
mtt-sheet
mtt-merchant-sheet
mtt-merchant-form
mtt-merchant-header
mtt-merchant-sidebar
mtt-merchant-main
mtt-merchant-navigation
mtt-merchant-product-row
mtt-merchant-service-row
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

Les fichiers Less doivent être organisés clairement.

Structure souhaitée :

```text
styles/
  mtt.less
  applications/
    _index.less
    merchant-sheet.less
```

Le fichier `styles/mtt.less` importe les autres fichiers.

Le CSS compilé doit aller dans :

```text
css/mtt.css
```

Le projet utilise Gulp pour compiler les fichiers `.less` en `.css`.

---

## 10. Structure initiale du module

Structure cible de départ :

```text
module.json
mtt.mjs
package.json
gulpfile.mjs
.gitignore
.prettierrc
README.md

css/
  mtt.css

styles/
  mtt.less
  applications/
    _index.less
    merchant-sheet.less

templates/
  actors/
    merchant-sheet.hbs
    parts/
      merchant-header.hbs
      merchant-sidebar.hbs
      merchant-main.hbs
      merchant-navigation.hbs
      merchant-products.hbs
      merchant-services.hbs

module/
  config/
    constants.mjs
    settings.mjs

  models/
    merchant-data.mjs
    _module.mjs

  applications/
    _module.mjs
    sheets/
      merchant-sheet.mjs

lang/
  fr.json
  en.json

docs/
  specification-fonctionnelle.md
  roadmap.md
  decisions.md

.github/
  copilot-instructions.md
```

---

## 11. Manifest `module.json`

Le module doit utiliser :

```json
{
  "id": "mtt-merchants",
  "title": "Merchants, Trades and Transactions"
}
```

Le sous-type d’acteur déclaré dans le manifeste est `merchant`.

Le type complet côté Foundry sera normalement :

```text
mtt-merchants.merchant
```

Le manifeste doit déclarer les fichiers :

```json
"esmodules": [
  "mtt.mjs"
],
"styles": [
  "css/mtt.css"
]
```

Les langues :

```json
"languages": [
  {
    "lang": "fr",
    "name": "Français",
    "path": "lang/fr.json"
  },
  {
    "lang": "en",
    "name": "English",
    "path": "lang/en.json"
  }
]
```

Les champs HTML doivent être déclarés avec leur chemin précis.

Pour la description du marchand :

```json
"htmlFields": [
  "merchant.description"
]
```

---

## 12. Données système du marchand

Utiliser un `TypeDataModel`.

Le modèle initial doit rester minimal.

Ne pas utiliser un champ générique `system.description`.

Préférer des blocs explicites :

```text
system.merchant.description
system.manager.displayName
system.manager.actorUuid
system.status.isOpen
system.sheet.isLocked
system.catalog.keepEmptyItems
```

Principe important : bien distinguer les éléments.

Il y aura potentiellement plusieurs descriptions plus tard :

```text
system.merchant.description
system.manager.description
system.catalog.description
system.products[].description
system.services[].description
```

Donc les noms doivent être précis dès le début.

---

## 13. Verrouillage de la feuille

La feuille marchand doit avoir deux états :

- verrouillée ;
- déverrouillée.

La feuille doit être verrouillée par défaut.

Le verrouillage protège contre les modifications accidentelles.

Chemin de donnée :

```text
system.sheet.isLocked
```

Quand la feuille est verrouillée :

- pas de création d’objet ;
- pas de suppression d’objet ;
- pas de modification des réglages sensibles ;
- pas de bascule ouvert / fermé si cette action est considérée comme une modification MJ.

Quand elle est déverrouillée :

- le MJ peut modifier le marchand ;
- les actions de gestion apparaissent ou sont activées.

Le verrouillage doit être enregistré dans les données de l’acteur, pas seulement dans l’état temporaire de la feuille.

---

## 14. Structure visuelle de la feuille marchand

La feuille doit être organisée en trois grandes zones :

```text
Feuille Marchand
├── Header / En-tête
├── Sidebar gauche
└── Corps principal
```

### Header

Le header contient :

- image du marchand ;
- nom du marchand ;
- bouton verrouillé / déverrouillé ;
- bouton ouvert / fermé.

Le header ne doit pas contenir les détails du gérant ou la description complète.

### Sidebar gauche

La sidebar contient :

- gérant ;
- description du marchand ;
- plus tard : fortune, résumé, accès, informations secondaires.

### Corps principal

Le corps principal contient :

- navigation par onglets ;
- onglet Produits ;
- onglet Services ;
- onglet Sessions ;
- onglet Configuration.

---

## 15. Navigation de la feuille

La navigation principale doit contenir :

- Produits ;
- Services ;
- Sessions ;
- Configuration.

L’onglet Configuration remplace l’ancien onglet Journal.

Le journal des transactions sera une section à l’intérieur de l’onglet Configuration.

L’onglet Configuration doit pouvoir être masqué pour les utilisateurs qui n’ont pas assez de droits.

Règle fonctionnelle :

- joueur autorisé : Produits, Services, Sessions ;
- MJ/propriétaire : Produits, Services, Sessions, Configuration.

Prévoir dans le contexte une valeur du type :

```text
mtt.canConfigureMerchant
```

---

## 16. Produits

Un produit est d’abord un item embarqué dans l’acteur marchand.

À terme, un produit devra distinguer :

- image ;
- nom réel ;
- nom affiché ;
- type d’objet ;
- catégorie ;
- description affichée ;
- description MJ ;
- quantité disponible ;
- prix de base ;
- prix marchand ;
- prix final affiché ;
- visibilité ;
- état de disponibilité ;
- achat libre ou validation MJ obligatoire.

Ne pas tout développer au début.

Première étape produit :

- afficher les items embarqués ;
- image ;
- nom ;
- type ;
- quantité si disponible ;
- bouton modifier ;
- bouton supprimer si feuille déverrouillée ;
- bouton créer si feuille déverrouillée.

---

## 17. Catégories de produits

À terme, les produits doivent pouvoir être rangés par catégories.

Chaque catégorie devra potentiellement avoir :

- identifiant interne ;
- nom affiché ;
- ordre ;
- description courte ;
- état replié / déplié ;
- visibilité ;
- règles commerciales futures.

Actions futures :

- créer catégorie ;
- renommer catégorie ;
- supprimer catégorie ;
- réordonner ;
- replier / déplier ;
- déplacer un produit par drag’n drop.

Ne pas développer tout cela dans la toute première étape.

---

## 18. Services

Les services sont séparés des produits.

Un service peut représenter :

- soin ;
- hébergement ;
- réparation ;
- transport ;
- information ;
- embauche ;
- magie ;
- prestation spéciale.

Un service n’est pas forcément lié à un Item Foundry.

La première étape peut simplement afficher un onglet Services vide ou préparatoire.

---

## 19. Sessions

Toutes les transactions futures doivent passer par une session joueur / marchand.

Pas d’achat direct définitif.

Vision future d’une session :

- le joueur ouvre une session avec le marchand ;
- il ajoute des achats au panier ;
- il propose éventuellement des ventes ;
- il voit le solde global ;
- il soumet ou valide la session ;
- le MJ valide/refuse si nécessaire ;
- les objets et monnaies sont transférés ;
- le journal est mis à jour.

Mais les sessions ne sont pas à développer au tout début.

---

## 20. Configuration

L’onglet Configuration contiendra plus tard :

- options générales du marchand ;
- état ouvert / fermé ;
- règles d’accès ;
- règles de visibilité ;
- règles de stock ;
- paramètres de transaction ;
- journal des transactions ;
- outils MJ.

Cet onglet doit être réservé aux utilisateurs avec droits suffisants.

---

## 21. Journal des transactions

Le journal n’est pas un onglet principal.

Il sera une section dans l’onglet Configuration.

Il devra conserver :

- personnage ou joueur concerné ;
- objet ou service ;
- quantité ;
- prix ;
- type d’opération ;
- statut ;
- date ou moment ;
- session concernée si applicable.

Ne pas développer le journal dans la première étape.

---

## 22. Fichiers déjà prévus

### `module/config/constants.mjs`

Doit centraliser :

- id module ;
- nom module ;
- type d’acteur ;
- chemins de templates ;
- classes CSS principales.

Exemple de constantes importantes :

```js
export const MTT = {
  ID: "mtt-merchants",
  NAME: "Merchants, Trades and Transactions",

  ACTOR_TYPES: {
    MERCHANT: "mtt-merchants.merchant",
  },
};
```

### `module/config/settings.mjs`

Doit enregistrer les settings du module.

Premier setting prévu :

- `debug`
- scope client
- type boolean
- default false
- nom et hint localisés.

### `module/models/_module.mjs`

Point d’export des modèles.

### `module/applications/_module.mjs`

Point d’export des applications.

### `module/applications/sheets/merchant-sheet.mjs`

Feuille principale du marchand.

Doit utiliser :

- `ActorSheetV2`
- `HandlebarsApplicationMixin`
- `DEFAULT_OPTIONS`
- `PARTS`
- actions déclarées
- contexte préparé proprement.

---

## 23. Actions de feuille prévues

Actions initiales :

```text
createItem
editItem
deleteItem
toggleOpen
toggleLock
selectTab
```

Les actions de modification doivent vérifier que la feuille n’est pas verrouillée.

Exemple de logique :

```text
si feuille non éditable : refuser
si system.sheet.isLocked : notifier et refuser
sinon autoriser
```

Notification localisée :

```text
mtt.notifications.sheetLocked
```

---

## 24. Gestion des onglets

Prévoir un onglet actif dans le contexte :

```text
mtt.activeTab
```

Au début, l’onglet actif par défaut peut être :

```text
products
```

Les valeurs prévues :

```text
products
services
sessions
configuration
```

L’action `selectTab` devra permettre de changer l’onglet actif.

Si l’utilisateur n’a pas le droit de configurer le marchand, il ne doit pas pouvoir ouvrir l’onglet Configuration.

---

## 25. Droits et visibilité

Pour commencer :

```text
mtt.canEditMerchant = this.isEditable && !isLocked
mtt.canConfigureMerchant = this.isEditable
```

Plus tard, on affinera avec les permissions Foundry et les droits d’accès spécifiques du marchand.

---

## 26. Règles de localisation complètes actuelles

Les fichiers `lang/fr.json` et `lang/en.json` doivent utiliser une structure hiérarchisée.

### Français

```json
{
  "mtt": {
    "log": {
      "initializing": "Initialisation",
      "initialized": "Initialisé",
      "ready": "Prêt"
    },
    "sheets": {
      "merchant": "Feuille de marchand"
    },
    "settings": {
      "debug": {
        "name": "Mode debug MTT",
        "hint": "Active des informations supplémentaires dans la console pour le module Merchants, Trades and Transactions."
      }
    },
    "sheet": {
      "lock": "Verrouiller",
      "unlock": "Déverrouiller",
      "locked": "Verrouillé",
      "unlocked": "Déverrouillé"
    },
    "merchant": {
      "name": {
        "placeholder": "Nom du marchand"
      },
      "status": {
        "open": "Ouvert",
        "closed": "Fermé"
      },
      "description": {
        "title": "Description du marchand"
      }
    },
    "manager": {
      "title": "Gérant",
      "mode": {
        "label": "Type de gérant",
        "text": "Texte libre",
        "actor": "Acteur lié"
      },
      "displayName": {
        "label": "Nom affiché",
        "placeholder": "Nom du gérant"
      },
      "empty": "Aucun gérant renseigné"
    },
    "actions": {
      "createItem": "Créer un objet",
      "edit": "Modifier",
      "delete": "Supprimer",
      "cancel": "Annuler"
    },
    "dialog": {
      "deleteItem": {
        "title": "Supprimer l’objet",
        "content": "Voulez-vous vraiment supprimer cet objet du marchand ?"
      }
    },
    "notifications": {
      "sheetLocked": "La feuille du marchand est verrouillée."
    },
    "navigation": {
      "label": "Navigation de la feuille marchand"
    },
    "tabs": {
      "products": "Produits",
      "services": "Services",
      "sessions": "Sessions",
      "configuration": "Configuration"
    },
    "items": {
      "newItem": "Nouvel objet",
      "title": "Objets du marchand",
      "subtitle": "Objets actuellement contenus dans ce marchand.",
      "empty": "Aucun objet dans ce marchand.",
      "emptyHelp": "Déverrouillez la feuille pour créer ou ajouter des objets.",
      "quantity": {
        "short": "Qté",
        "none": "Quantité non définie"
      }
    },
    "products": {
      "title": "Produits",
      "subtitle": "Objets actuellement proposés ou stockés par ce marchand.",
      "quantity": {
        "short": "Qté",
        "undefined": "Quantité non définie"
      },
      "empty": {
        "title": "Aucun produit",
        "text": "Ce marchand ne contient encore aucun objet.",
        "help": "Déverrouillez la feuille pour créer ou ajouter des objets."
      }
    },
    "services": {
      "empty": {
        "title": "Services",
        "text": "La gestion des services sera ajoutée dans une prochaine étape."
      }
    },
    "sessions": {
      "empty": {
        "title": "Sessions",
        "text": "Les sessions joueur / marchand seront ajoutées plus tard."
      }
    },
    "configuration": {
      "empty": {
        "title": "Configuration",
        "text": "Les options générales du marchand et le journal des transactions seront regroupés ici."
      }
    }
  }
}
```

### Anglais

```json
{
  "mtt": {
    "log": {
      "initializing": "Initializing",
      "initialized": "Initialized",
      "ready": "Ready"
    },
    "sheets": {
      "merchant": "Merchant Sheet"
    },
    "settings": {
      "debug": {
        "name": "MTT debug mode",
        "hint": "Enables additional console information for the Merchants, Trades and Transactions module."
      }
    },
    "sheet": {
      "lock": "Lock",
      "unlock": "Unlock",
      "locked": "Locked",
      "unlocked": "Unlocked"
    },
    "merchant": {
      "name": {
        "placeholder": "Merchant name"
      },
      "status": {
        "open": "Open",
        "closed": "Closed"
      },
      "description": {
        "title": "Merchant description"
      }
    },
    "manager": {
      "title": "Manager",
      "mode": {
        "label": "Manager type",
        "text": "Free text",
        "actor": "Linked actor"
      },
      "displayName": {
        "label": "Displayed name",
        "placeholder": "Manager name"
      },
      "empty": "No manager defined"
    },
    "actions": {
      "createItem": "Create item",
      "edit": "Edit",
      "delete": "Delete",
      "cancel": "Cancel"
    },
    "dialog": {
      "deleteItem": {
        "title": "Delete item",
        "content": "Do you really want to delete this item from the merchant?"
      }
    },
    "notifications": {
      "sheetLocked": "The merchant sheet is locked."
    },
    "navigation": {
      "label": "Merchant sheet navigation"
    },
    "tabs": {
      "products": "Products",
      "services": "Services",
      "sessions": "Sessions",
      "configuration": "Configuration"
    },
    "items": {
      "newItem": "New item",
      "title": "Merchant items",
      "subtitle": "Items currently stored in this merchant.",
      "empty": "No item in this merchant.",
      "emptyHelp": "Unlock the sheet to create or add items.",
      "quantity": {
        "short": "Qty",
        "none": "No quantity defined"
      }
    },
    "products": {
      "title": "Products",
      "subtitle": "Items currently offered or stored by this merchant.",
      "quantity": {
        "short": "Qty",
        "undefined": "Quantity undefined"
      },
      "empty": {
        "title": "No products",
        "text": "This merchant does not contain any item yet.",
        "help": "Unlock the sheet to create or add items."
      }
    },
    "services": {
      "empty": {
        "title": "Services",
        "text": "Service management will be added in a later step."
      }
    },
    "sessions": {
      "empty": {
        "title": "Sessions",
        "text": "Player / merchant sessions will be added later."
      }
    },
    "configuration": {
      "empty": {
        "title": "Configuration",
        "text": "General merchant options and the transaction log will be grouped here."
      }
    }
  }
}
```

---

## 27. Règles de réponse attendues pour Codex

Quand Codex modifie les fichiers :

- travailler fichier par fichier ;
- éviter les gros changements non demandés ;
- expliquer brièvement ce qui est modifié ;
- ne pas ajouter de fonctionnalités avancées sans demande explicite ;
- respecter le style sans point-virgule ;
- respecter les localisations hiérarchisées ;
- respecter les classes CSS préfixées `mtt-` ;
- ne pas introduire de dépendance directe au système CO2 dans le cœur MTT.

---

## 28. Priorité actuelle

La priorité actuelle est de terminer la base minimale de la feuille marchand.

Ordre conseillé :

1. finaliser `module.json`
2. finaliser `mtt.mjs`
3. finaliser `module/config/constants.mjs`
4. finaliser `module/config/settings.mjs`
5. finaliser `module/models/merchant-data.mjs`
6. finaliser `module/models/_module.mjs`
7. finaliser `module/applications/_module.mjs`
8. finaliser `module/applications/sheets/merchant-sheet.mjs`
9. finaliser les templates :
   - `merchant-sheet.hbs`
   - `merchant-header.hbs`
   - `merchant-sidebar.hbs`
   - `merchant-main.hbs`
   - `merchant-navigation.hbs`
   - `merchant-products.hbs`
   - `merchant-services.hbs`
10. finaliser les fichiers de langue
11. finaliser les fichiers Less
12. tester dans Foundry VTT V14 avec le système CO2 actif

---

## 29. Premier succès attendu

Ce projet est encore en phase initiale.

Ne pas chercher à tout automatiser immédiatement.

Le premier succès attendu est simple :

> Foundry charge le module, permet de créer un acteur marchand MTT, ouvre une feuille marchand propre, verrouillable/déverrouillable, avec une zone produits affichant les items embarqués.

---

## 30. Prompt recommandé pour Codex

Au début d’une session Codex dans VS Code, utiliser :

```text
Lis d’abord `.codex/instructions.md` et respecte ces règles pour toutes les modifications du projet MTT.
```
