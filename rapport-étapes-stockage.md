# Étape 1 — Base logique du type MTT `storage`

- [x] Lire `agents.md` et les instructions de l’étape 1.
- [x] Vérifier l’absence de reliquats `storage-*` dans les feuilles, templates et styles.
- [x] Ajouter le type logique MTT `storage` et les chemins de flags nécessaires.
- [x] Créer les helpers de flags propres au stockage.
- [x] Ajouter la configuration des types d’acteurs convertibles en stockage.
- [x] Ajouter `allowedStorageActorTypes` à l’import/export de configuration.
- [x] Adapter la conversion MTT pour proposer boutique et/ou stockage selon les types autorisés.
- [x] Exposer les helpers stockage dans l’API du module.
- [x] Mettre à jour `fr.json` et `en.json`.

## Résumé

La base logique du stockage MTT est en place. Un acteur système normal peut maintenant être converti en stockage via les flags `flags.mtt-merchants.type = "storage"` et `flags.mtt-merchants.storage`.

La configuration MTT affiche une section dédiée aux types d’acteurs convertibles en stockage, en parallèle de la section marchand existante. Le dialogue de conversion MTT propose uniquement les types autorisés pour l’acteur choisi.

## Non créé volontairement

- Aucune feuille stockage.
- Aucun template HBS stockage.
- Aucun CSS stockage.
- Aucun rail stockage.
- Aucune session stockage.
- Aucun tag, statut ou journal de stockage avancé.
- Aucun bouton “Ouvrir le stockage MTT”.

## Vérifications simples

- Les fichiers JavaScript modifiés passent `node --check`.
- `lang/fr.json` et `lang/en.json` sont valides.
- Le marchand existant conserve ses contrôles d’ouverture, de gérant et de retrait.
- Un stockage MTT ne propose que le retrait à cette étape.

# Étape 2 — Préparation des variables communes de feuille MTT

- [x] Lire `agents.md`, `rapport-étapes-stockage.md` et les instructions de l’étape 2.
- [x] Analyser la préparation de contexte de `merchant-sheet.mjs`.
- [x] Réutiliser `getMTTEntityType(actor)` existant sans créer de nouveau helper.
- [x] Ajouter `entityType`, `isShop`, `isStorage` et `mttAccent` au contexte de feuille.
- [x] Ne pas ajouter de variable globale `isMerchant` pour la variante boutique.
- [x] Ajouter un commentaire HBS sobre sur la structure commune de feuille MTT.
- [x] Vérifier qu’aucune feuille, template ou feuille de styles stockage n’a été créé.

## Résumé

La feuille MTT historique prépare maintenant les variables communes nécessaires aux futures variantes métier. Pour un marchand actuel, le contexte reste une boutique (`entityType: "merchant"`, `isShop: true`, `isStorage: false`) et le rendu marchand n’est pas modifié.

Les variables sont disponibles à la racine du contexte et dans `mtt`, afin de pouvoir être utilisées progressivement par les partials sans refonte massive.

## Non créé volontairement

- Aucune feuille stockage.
- Aucun template HBS stockage.
- Aucun CSS stockage.
- Aucun rail stockage.
- Aucune session stockage.
- Aucun contenu stockage.
- Aucun bouton “Ouvrir le stockage MTT”.
- Aucune variable globale `isMerchant` de variante boutique.

## Vérifications simples

- `merchant-sheet.mjs` passe `node --check`.
- Les occurrences `isMerchant` restantes correspondent à des fonctions/noms historiques ou à `negotiation.isMerchantTurn`.
- Aucun fichier `storage-sheet`, `storage-content`, `storage-exchange`, template `storage-*` ou style `storage-sheet.less` n’a été créé.

# Étape 4 — Ouverture storage sur la base de feuille `merchant-*`

- [x] Lire `agents.md`, `rapport-étapes-stockage.md` et les instructions de l’étape 4.
- [x] Réutiliser directement `MerchantSheet` comme feuille MTT commune.
- [x] Ne pas créer de classe `StorageSheet`.
- [x] Ajouter l’ouverture `openStorageSheet(actor)` basée sur `MerchantSheet`.
- [x] Ajouter le contrôle “Ouvrir le stockage MTT” pour les acteurs storage.
- [x] Ajouter la redirection automatique storage dans les hooks AppV1/AppV2 existants.
- [x] Fournir un contexte storage compatible minimal pour l’en-tête, les accès, la session et le journal.
- [x] Ajouter uniquement les clés de langue visibles nécessaires.
- [x] Vérifier qu’aucun template ou style storage n’a été créé.

## Résumé

Un acteur converti en stockage peut maintenant ouvrir une feuille MTT en utilisant la base historique `merchant-*`. La même classe `MerchantSheet` sert de point d’entrée commun, sans copie de template ni nouvelle ergonomie.

Pour le stockage, les zones métier encore non développées reçoivent des données neutres afin que la feuille s’ouvre sans écrire dans les flags marchand.

## Non créé volontairement

- Aucune classe `StorageSheet`.
- Aucun template HBS stockage.
- Aucun CSS stockage.
- Aucun rail stockage interne.
- Aucune session stockage fonctionnelle.
- Aucun contenu storage réel.
- Aucun tag, statut ou journal storage.
- Aucun fichier `shop-*`.

## Vérifications simples

- `merchant-sheet.mjs` passe `node --check`.
- `merchant-conversion.mjs` passe `node --check`.
- `lang/fr.json` et `lang/en.json` sont valides.
- `npm run lint` passe.
- Aucun fichier `storage-sheet`, template `storage-*` ou style `storage-sheet.less` n’a été créé.
