# Rapport correctif - CPG copiees comme categories locales

## Fichiers modifies

- `module/documents/merchant-flags.mjs`
- `module/documents/merchant-conversion.mjs`
- `module/applications/sheets/merchant-sheet.mjs`

## Cause trouvee

`normalizeMerchantData()` appelait `mergeGlobalCategoriesIntoMerchantCatalog()`.

Comme `getMerchantData()` passe par cette normalisation, les categories personnalisees globales etaient reinjectees a chaque lecture des donnees marchand. Une categorie locale supprimee pouvait donc revenir tant que la CPG existait dans la configuration globale.

## Fonctions supprimees ou neutralisees

- Suppression de la logique `slugifyCategoryId()` qui produisait des ids `global-*`.
- Suppression de `getGlobalMerchantProductCategories()` sous sa forme de categories globales persistantes.
- Suppression de `mergeGlobalCategoriesIntoMerchantCatalog()`.
- Suppression de l'appel de synchronisation globale depuis `normalizeMerchantData()`.

## Creation locale utilisee

Ajout de `createLocalMerchantCategory()` dans `merchant-flags.mjs`.

Ce helper est utilise par :

- la conversion initiale, via `buildDefaultMerchantData(actor, { includeInitialGlobalCategories: true })` ;
- le bouton local "Ajouter une categorie" sur la feuille marchand.

Les CPG sont donc copiees comme categories locales ordinaires au moment de la conversion uniquement.

## Marqueurs nettoyes

La normalisation retire des categories locales existantes :

- `isGlobal`
- `global`
- `globalId`
- `source: "global"`
- `sourceType`
- `fromGlobal`
- `fromGlobalCategory`
- `isFromGlobalCategory`
- `protected`
- `locked`
- `isProtected`
- `canDelete`
- `readonly`
- `templateId`
- `settingId`
- `configId`
- `globalCategoryId`

Les categories ne sont pas supprimees ni renommees. Les ids existants sont conserves pour ne pas casser les produits deja ranges dans ces categories.

## Confirmations code

- Les CPG sont lues uniquement pour construire les donnees initiales lors de la conversion.
- Une CPG copiee devient une categorie locale ordinaire.
- Le bouton d'ajout local et la copie de conversion utilisent le meme helper.
- La suppression locale ne consulte pas la configuration globale.
- La modification de `defaultCustomCategories` ne modifie pas les marchands existants.
- `normalizeMerchantData()` ne recree plus les CPG manquantes.
- Le rendu du catalogue ne contient pas de logique speciale pour une origine globale.

## Tests realises

- `node --check module/documents/merchant-flags.mjs`
- `node --check module/documents/merchant-conversion.mjs`
- `node --check module/applications/sheets/merchant-sheet.mjs`
- `npm.cmd exec -- eslint module/documents/merchant-flags.mjs module/documents/merchant-conversion.mjs`

## Limites connues

Tests manuels Foundry non executes depuis Codex. A verifier en jeu :

- creer une CPG, convertir un marchand, supprimer la categorie locale immediatement ;
- fermer/rouvrir et rafraichir Foundry : la categorie ne doit pas revenir ;
- modifier la configuration globale : les marchands existants ne doivent pas changer ;
- convertir un nouveau marchand apres modification globale : il doit recevoir le modele global actuel ;
- ouvrir un ancien marchand pollue par les marqueurs globaux : les categories doivent devenir supprimables.
