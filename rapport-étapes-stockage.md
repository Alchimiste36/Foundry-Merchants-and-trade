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

# Étape 5 — Neutralisation des blocs shop incompatibles avec le stockage

- [x] Lire `agents.md`, `rapport-étapes-stockage.md` et les instructions de l’étape 5.
- [x] Conserver la base `merchant-*` sans créer d’interface storage séparée.
- [x] Masquer les onglets services, configuration et journal côté storage.
- [x] Masquer le gérant et le portefeuille commercial dans le header storage.
- [x] Masquer les prix, monnaies, secrets, approbations et actions commerciales dans les lignes d’Items.
- [x] Neutraliser la sidebar de transaction commerciale côté storage avec un placeholder minimal.
- [x] Ajouter uniquement les clés de langue nécessaires aux placeholders temporaires.
- [x] Vérifier qu’aucun template, CSS ou fichier métier storage séparé n’a été créé.

## Résumé

La feuille storage utilise toujours la base `merchant-*`, mais les blocs strictement commerciaux ne sont plus affichés côté stockage. La structure commune reste en place : header, navigation de base, zone principale, liste d’Items et sidebar.

Le marchand conserve les mêmes blocs via `isShop`. Le stockage reçoit seulement des placeholders sobres pour les zones dont la logique métier viendra plus tard.

## Non créé volontairement

- Aucun template HBS storage.
- Aucun CSS storage.
- Aucune ligne Item storage différente.
- Aucune icône d’ouverture Item.
- Aucun badge de type.
- Aucun rail storage séparé.
- Aucune session dépôt/retrait fonctionnelle.
- Aucun tag, statut ou journal storage.
- Aucun fichier `shop-*`.

## Vérifications simples

- `merchant-sheet.mjs` passe `node --check`.
- `lang/fr.json` et `lang/en.json` sont valides.
- `npm run lint` passe.
- Les HBS modifiés passent un contrôle Prettier ciblé.
- Aucun fichier `storage-sheet`, template `storage-*`, style `storage-sheet.less` ou fichier `shop-*` n’a été créé.

# Étape 5.2 — Correction du branchement des éléments communs stockage

- [x] Lire `agents.md`, `rapport-étapes-stockage.md` et les instructions de l’étape 5.2.
- [x] Réafficher les onglets `Journal` et `Configuration` côté storage.
- [x] Brancher les contenus `storage-configuration.hbs` et `storage-journal.hbs` dans la structure commune.
- [x] Rendre `mtt.isEditable` disponible côté storage pour le verrouillage.
- [x] Adapter le verrouillage pour écrire dans les flags du type MTT actif.
- [x] Réafficher le bouton d’ajout à une session côté storage sans implémenter encore la session storage.
- [x] Préparer le rail côté storage avec un contexte neutre réutilisant le rail existant.
- [x] Nettoyer les contenus storage temporaires pour éviter les champs commerciaux.
- [x] Mettre à jour `fr.json` et `en.json` pour les placeholders visibles.

## Résumé

L’étape 5.2 corrige le masquage trop large introduit à l’étape 5. La navigation de feuille reste commune : le stockage peut maintenant accéder aux onglets `Journal` et `Configuration`, tout en gardant des contenus spécifiques sobres.

Le verrouillage est redevenu une mécanique `MTT base` et écrit désormais dans `flags.mtt-merchants.storage.sheet.isLocked` pour un stockage, sans toucher au verrouillage marchand. Le bouton d’ajout à une session reste visible côté storage, mais son action métier est volontairement neutralisée jusqu’à l’étape dédiée aux échanges.

## Non créé volontairement

- Aucune feuille storage indépendante.
- Aucun header, main ou contenu complet storage parallèle.
- Aucun CSS storage.
- Aucun nouveau rail storage autonome.
- Aucune ligne Item storage différente.
- Aucune icône d’ouverture Item.
- Aucun badge type.
- Aucune vraie session dépôt/retrait.
- Aucun tag, statut ou journal fonctionnel de mouvements.
- Aucun fichier `shop-*`.

## Vérifications simples

- `merchant-sheet.mjs` passe `node --check`.
- `lang/fr.json` et `lang/en.json` sont valides.
- `npm run lint` passe.
- Les HBS modifiés passent un contrôle Prettier ciblé.
- `git diff --check` ne signale pas d’erreur de whitespace.
- Aucun fichier `storage-sheet`, `storage-content`, `storage-exchange`, template de feuille storage ou fichier `shop-*` n’a été créé.

# Correction 5.3 — Partials storage et édition commune de feuille

- [x] Lire `agents.md`, `rapport-étapes-stockage.md` et les instructions de correction 5.3.
- [x] Ajouter les partials `storage-configuration.hbs` et `storage-journal.hbs` dans `MTT.TEMPLATES`.
- [x] Supprimer l’alias inutile `isMttEditable`.
- [x] Corriger `canEditMerchant` pour qu’il reste commun à la feuille historique `merchant-*`.
- [x] Conserver le verrouillage commun selon le type MTT actif.
- [x] Vérifier que les corrections ne créent pas de feuille storage autonome.

## Résumé

Les deux partials storage existants sont maintenant déclarés dans `MTT.TEMPLATES`, ce qui permet à Foundry de les charger avec les autres templates du module. Les onglets `Journal` et `Configuration` côté storage ne devraient donc plus provoquer d’erreur de partial introuvable.

Le contexte d’édition a aussi été nettoyé : `isMttEditable` a été supprimé, et `canEditMerchant` désigne de nouveau l’édition de la feuille commune `merchant-*`, sans être limité à `isShop`.

## Non créé volontairement

- Aucune feuille storage indépendante.
- Aucun template de feuille storage complet.
- Aucun CSS storage.
- Aucun nouveau système de permissions.
- Aucune matrice de permissions storage.
- Aucun fichier `shop-*`.
- Aucune fonctionnalité métier storage nouvelle.

## Vérifications simples

- `constants.mjs` passe `node --check`.
- `merchant-sheet.mjs` passe `node --check`.
- `lang/fr.json` et `lang/en.json` sont valides.
- `npm run lint` passe.
- `git diff --check` ne signale pas d’erreur de whitespace.

# Étape 7 — Rail d’acteurs sur la feuille stockage

- [x] Lire `agents.md`, `rapport-étapes-stockage.md` et les instructions de l’étape 7.
- [x] Analyser le rendu hybride MJS/HBS du rail existant.
- [x] Réutiliser `merchant-access-rail.hbs` sans créer de rail storage parallèle.
- [x] Brancher le contexte rail côté storage sur `flags.mtt-merchants.storage.access.actors`.
- [x] Permettre l’ajout d’un acteur au rail storage par drag/drop.
- [x] Permettre la sélection locale d’une carte storage sans ouvrir de session commerciale.
- [x] Permettre le retrait d’un acteur du rail storage sans supprimer l’acteur Foundry.
- [x] Garder les écritures marchand sur `merchant.access.clients` et les écritures storage sur `storage.access.actors`.
- [x] Ajouter uniquement les clés de langue visibles nécessaires au rail storage.

## Résumé

Le rail d’acteurs est maintenant branché côté stockage en réutilisant le rail historique `merchant-*`. La feuille storage prépare un contexte compatible avec le template existant, affiche les acteurs liés au stockage et permet d’en ajouter ou d’en retirer sans écrire dans les flags marchand.

Le clic gauche sur une carte storage sélectionne simplement l’acteur dans la feuille. Il ne crée pas de session commerciale et ne déclenche pas de transaction marchand.

## Non créé volontairement

- Aucun template `storage-access-rail.hbs`.
- Aucun fichier JS de rail storage autonome.
- Aucun CSS storage dédié au rail.
- Aucune session dépôt/retrait.
- Aucun système de votes.
- Aucune matrice de permissions storage.
- Aucune modification des lignes d’Items ou catégories.
- Aucun fichier `shop-*`.

## Vérifications simples

- `merchant-sheet.mjs` passe `node --check`.
- `lang/fr.json` et `lang/en.json` sont valides.
- `npm run lint` passe.
- `git diff --check` ne signale pas d’erreur de whitespace.
- Le partial `merchant-access-rail.hbs` passe un contrôle Prettier ciblé.
- Aucun rail storage parallèle ni fichier `shop-*` n’a été créé.

# Correction 7.2 — Rail storage : ajout hors verrouillage et position gauche

- [x] Lire `agents.md`, `rapport-étapes-stockage.md` et les instructions de correction 7.2.
- [x] Corriger l’ajout d’acteurs au rail storage pour ne plus dépendre du verrouillage de la feuille.
- [x] Conserver le comportement marchand existant pour l’ajout au rail.
- [x] Afficher dynamiquement les acteurs liés aux joueurs dans le rail storage, sans les persister automatiquement.
- [x] Positionner le rail storage à gauche avec une classe de variante sur le rail commun.
- [x] Compiler le LESS vers `css/mtt.css`.
- [x] Vérifier qu’aucun rail storage parallèle n’a été créé.

## Résumé

Le rail storage peut maintenant recevoir un acteur même lorsque la feuille est verrouillée, tant que l’utilisateur courant dispose des droits d’édition nécessaires. Cette correction évite d’utiliser le verrouillage de contenu comme condition d’ajout au rail.

Comme côté marchand, les acteurs liés aux joueurs sont ajoutés dynamiquement au rendu du rail storage sans écriture automatique dans les flags. Le rail storage reste basé sur le partial commun `merchant-access-rail.hbs`, avec une classe de variante qui le positionne à gauche de la feuille.

## Non créé volontairement

- Aucun template `storage-access-rail.hbs`.
- Aucun fichier LESS storage séparé pour le rail.
- Aucun nouveau fichier JS de rail storage.
- Aucune session dépôt/retrait.
- Aucun tag, statut ou vote storage.
- Aucune modification des lignes d’Items ou catégories.
- Aucun fichier `shop-*`.

## Vérifications simples

- `merchant-sheet.mjs` passe `node --check`.
- `lang/fr.json` et `lang/en.json` sont valides.
- `npm run compile` passe.
- `npm run lint` passe.
- `git diff --check` ne signale pas d’erreur de whitespace.
- `merchant-access-rail.hbs` et `merchant-access-rail.less` passent un contrôle Prettier ciblé.
- Aucun rail storage parallèle ni fichier `shop-*` n’a été créé.

# Correction — Verrouillage initial de la feuille stockage

- [x] Lire `agents.md` et rechercher la logique existante de verrouillage.
- [x] Vérifier le contexte de feuille `merchant-sheet.mjs`.
- [x] Vérifier la conversion en stockage.
- [x] Identifier la cause dans les données par défaut storage.
- [x] Corriger le verrouillage initial sans créer de logique parallèle.

## Résumé

La feuille storage était déverrouillée dès sa création parce que `buildDefaultStorageData()` initialisait `sheet.isLocked` à `false`. La conversion en stockage persistait ensuite directement cette valeur dans `flags.mtt-merchants.storage.sheet.isLocked`.

Le défaut storage est maintenant aligné sur le comportement attendu de la feuille commune : un nouveau stockage s’ouvre verrouillé par défaut, puis le bouton de verrouillage commun permet toujours de le déverrouiller volontairement.

## Non créé volontairement

- Aucun nouveau helper de verrouillage storage.
- Aucun template storage séparé.
- Aucun changement du bouton commun de verrouillage.
- Aucune migration legacy.
- Aucun fichier `shop-*`.

## Vérifications simples

- `storage-flags.mjs` passe `node --check`.
- `merchant-conversion.mjs` passe `node --check`.
- `merchant-sheet.mjs` passe `node --check`.

# Correction — Position d’ouverture différente shop / stockage

- [x] Lire `agents.md`, `rapport-étapes-stockage.md` et les instructions de correction.
- [x] Identifier le point commun d’ouverture des feuilles MTT.
- [x] Conserver la taille commune dans `MerchantSheet.DEFAULT_OPTIONS`.
- [x] Appliquer un `left` par défaut différent selon le type MTT ouvert.
- [x] Respecter une position `left` explicite déjà fournie à l’ouverture.
- [x] Ne pas modifier les templates HBS ni les styles LESS.

## Résumé

La feuille commune MTT conserve sa taille actuelle de `820 x 750`. Le décalage horizontal est maintenant appliqué au point d’ouverture commun : une boutique/marchand s’ouvre par défaut à `left: 380`, tandis qu’un stockage s’ouvre par défaut à `left: 50`.

La correction ne force pas la position si une valeur `position.left` explicite est déjà transmise à l’ouverture.

## Non créé volontairement

- Aucune classe `StorageSheet`.
- Aucun CSS de positionnement de fenêtre.
- Aucun style inline.
- Aucun changement HBS.
- Aucun setting Foundry.
- Aucune modification du rail, des sessions ou des lignes d’Items.

## Vérifications simples

- `merchant-conversion.mjs` passe `node --check`.
- `merchant-sheet.mjs` passe `node --check`.
- Le diff de correction ne modifie aucun HBS ni LESS.

# Correction — Verrouillage storage local à la fenêtre

- [x] Lire `agents.md`, `rapport-étapes-stockage.md` et les nouvelles instructions de correction.
- [x] Vérifier l’état actuel après suppression manuelle de la correction précédente.
- [x] Ajouter un verrouillage storage local à l’instance de fenêtre.
- [x] Faire lire le contexte storage depuis l’état local de fenêtre.
- [x] Faire basculer le bouton de verrouillage storage sans persister `sheet.isLocked: false`.
- [x] Conserver le comportement de verrouillage marchand existant.
- [x] Neutraliser les anciens `sheet.isLocked: false` storage lors de la normalisation future.

## Résumé

Le verrouillage de la feuille storage n’est plus piloté par `flags.mtt-merchants.storage.sheet.isLocked` pendant l’ouverture de la fenêtre. Chaque nouvelle instance de feuille storage démarre verrouillée via un état local de fenêtre.

Le bouton déverrouiller/verrouiller fonctionne toujours tant que la fenêtre est ouverte, mais côté storage il ne persiste plus l’état déverrouillé avec `actor.update`. Le marchand conserve son comportement existant.

## Non créé volontairement

- Aucun helper externe de lock storage.
- Aucune feuille storage séparée.
- Aucun template storage supplémentaire.
- Aucun changement du rail.
- Aucun changement des lignes d’Items, catégories ou sessions.
- Aucun nouveau système de permissions.
- Aucune migration complexe.

## Vérifications simples

- `merchant-sheet.mjs` passe `node --check`.
- `storage-flags.mjs` passe `node --check`.
- `npm run lint` passe.
- `git diff --check` ne signale pas d’erreur de whitespace.

# Étape 8.1 — Session d’échange storage : affichage et quantités

- [x] Lire `agents.md`, le rapport stockage et les instructions de l’étape 8.1.
- [x] Réutiliser la base de session existante au lieu de créer une logique parallèle.
- [x] Ajouter un partial `storage-session.hbs` branché depuis `merchant-session.hbs`.
- [x] Afficher une session storage dédiée avec les zones récupération et dépôt.
- [x] Brancher l’ajout direct d’un objet du stockage vers `buyerItems`.
- [x] Brancher le dépôt par drop d’un Item de l’acteur sélectionné vers `sellerItems`.
- [x] Conserver les contrôles de quantité communs : plus, moins, saisie directe et suppression à zéro.
- [x] Conserver les actions communes de vidage, soumission, déblocage, validation et refus.
- [x] Mettre à jour les localisations FR/EN.
- [x] Ne pas implémenter les transferts réels, réservés à l’étape 8.2.

## Résumé

La feuille storage utilise maintenant une vraie session d’échange affichée dans le rail de session commun. Le titre affiché est `Échange`, avec l’acteur sélectionné, son image et sa fortune quand elle est disponible.

La zone `Le PJ prend / récupère` ajoute directement un exemplaire depuis le stockage dans `buyerItems`, sans dialogue et sans prix. La zone `Le PJ dépose / stock` accepte le drop d’un Item appartenant à l’acteur sélectionné et l’ajoute dans `sellerItems`, là aussi sans prix.

Les quantités restent pilotées par les fonctions communes de session. Les validations et refus storage sont préparatoires : ils changent seulement l’état de session, sans transfert d’Items, sans journal et sans prévisualisation commerciale.

## Non créé volontairement

- Aucun fichier `storage-session.mjs`.
- Aucun fichier LESS spécifique storage session.
- Aucun nouveau modèle de données `takenItems` ou `depositedItems`.
- Aucun prix, monnaie, négociation, ajustement monétaire ou prévisualisation commerciale dans la session storage.
- Aucun transfert réel entre acteurs.
- Aucun nouveau système de permissions.
- Aucun duplicat des helpers de quantité ou des helpers de session existants.

## Vérifications simples

- `merchant-sheet.mjs` passe `node --check`.
- `merchant-catalog.mjs` passe `node --check`.
- `constants.mjs` passe `node --check`.
- `lang/fr.json` et `lang/en.json` sont du JSON valide.
- `npm run lint` passe.
- `npx.cmd prettier --check` passe sur les fichiers touchés.
- `git diff --check` ne signale pas d’erreur de whitespace.
