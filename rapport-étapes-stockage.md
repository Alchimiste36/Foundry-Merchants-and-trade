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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

# Étape 8.2 — Session d’échange storage : validation et transferts

- [x] Lire `agents.md`, le rapport stockage et les instructions de l’étape 8.2.
- [x] Identifier la structure réelle de session storage issue de 8.1.
- [x] Réutiliser `buyerItems` pour le flux stockage vers acteur.
- [x] Réutiliser `sellerItems` pour le flux acteur vers stockage.
- [x] Réutiliser le plan d’exécution marchand pour vérifier les quantités juste avant validation.
- [x] Réutiliser la livraison/fusion existante pour les Items récupérés.
- [x] Réutiliser l’ajout/fusion catalogue existant pour les Items déposés.
- [x] Brancher la validation storage sur les transferts réels d’Items.
- [x] Nettoyer la session après validation réussie.
- [x] Faire refuser une session storage sans aucun transfert.
- [x] Désactiver toute logique monétaire pour le plan storage.
- [x] Ne pas ajouter de journal de mouvements storage avancé.

## Résumé

La validation storage utilise maintenant le même plan technique que la transaction marchand pour vérifier les quantités, livrer les Items et fusionner les piles compatibles.

Le flux `Le PJ prend / récupère` applique un transfert stockage vers acteur : le stock du stockage est décrémenté via la logique catalogue existante, puis l’Item est livré à l’acteur avec la logique commune de livraison, fusion et quantité max.

Le flux `Le PJ dépose / stock` applique un transfert acteur vers stockage : l’Item source de l’acteur est décrémenté, puis l’Item est ajouté ou fusionné dans le stockage avec la logique existante du catalogue MTT.

Le refus storage nettoie la session sans déplacer d’Item. La validation storage n’appelle pas de paiement, ne crée pas d’ajustement monétaire et ne journalise pas de transaction commerciale.

## Non créé volontairement

- Aucun fichier `storage-session.mjs`.
- Aucun fichier `storage-transfer.mjs`.
- Aucune nouvelle mécanique de fusion.
- Aucune nouvelle mécanique de livraison.
- Aucune nouvelle structure `takenItems`, `depositItems` ou équivalente.
- Aucun transfert de monnaie.
- Aucun ajustement monétaire.
- Aucun vote.
- Aucun journal de mouvements storage avancé.
- Aucune classe CSS ou modification du template de session.
- Aucun nouveau système de permissions.

---

# Correction 8.2A — Transferts storage sans écriture commerciale

- [x] Lire `agents.md` et `rapport-étapes-stockage.md`.
- [x] Localiser la fonction qui écrit le texte commercial dans l’Item livré (`addDeliveredItemDescriptionBlock`).
- [x] Localiser la construction de `deliveryProductData` dans `buildSessionItemExecutionPlan`.
- [x] Ajouter l’option `skipCommercialDeliveryText` dans `storageExecutionOptions` côté `merchant-sheet.mjs`.
- [x] Lire cette option dans `buildSessionItemExecutionPlan` et vider `merchantName` et les secrets pour storage.

## Résumé

La fonction `buildSessionItemExecutionPlan` dans `merchant-trade.mjs` construit un objet `deliveryProductData` contenant `merchantName`, `transactionNumber` et les champs secrets du produit catalogue. Ces données sont ensuite passées à `addDeliveredItemDescriptionBlock`, qui écrit dans la description de l’Item livré le texte d’origine commerciale et les informations secrètes.

Un paramètre `skipCommercialDeliveryText: true` a été ajouté aux `storageExecutionOptions` dans `merchant-sheet.mjs`. Dans `buildSessionItemExecutionPlan`, ce flag est lu (`skipCommercial`) et force `merchantName` à `""`, `transactionNumber` à `undefined`, et tous les champs secrets à `""` lorsque `true`.

Comme `buildDeliveredItemOriginHtml` retourne déjà `""` si `merchantName` est vide, et que `buildDeliveredItemSecretHtml` retourne déjà `""` si aucun secret n’est présent, la fonction `addDeliveredItemDescriptionBlock` ne trouve rien à écrire et retourne sans modifier la description de l’Item.

Le flux marchand (shop) n’est pas affecté : sans `skipCommercialDeliveryText`, `skipCommercial` vaut `false` et toutes les valeurs sont lues depuis le produit catalogue comme avant.

Le flux dépôt acteur → stockage (`sellerTransfers`) n’appelle jamais `addDeliveredItemDescriptionBlock` — il était déjà propre.

## Non créé volontairement

- Aucune nouvelle fonction de livraison storage.
- Aucun fichier `storage-transfer.mjs`.
- Aucune modification du flux de livraison shop.
- Aucune modification des fonctions `buildDeliveredItemOriginHtml`, `buildDeliveredItemSecretHtml`, `addDeliveredItemDescriptionBlock`.
- Aucun changement du modèle de session, du rail, des lignes HBS ou du CSS.

---

# Correction — Ouverture persistante de la feuille stockage et options d'entête

- [x] Lire `agents.md` et `rapport-étapes-stockage.md`.
- [x] Identifier la cause réelle de l'ouverture persistante de la feuille système.
- [x] Corriger `isMTTMerchant` pour utiliser `flags.mtt-merchants.type` comme source de vérité.
- [x] Nettoyer le bypass WeakSet à la fermeture des feuilles système.
- [x] Ajouter "Ouvrir la feuille de l'acteur" pour storage sur la feuille MTT (AppV2 et AppV1).
- [x] Mettre à jour `fr.json` et `en.json`.
- [x] Vérifier `node --check` et JSON valide.

## Résumé

**Problème 1 — Ouverture persistante :** Le bypass `_managerBypassApps` (WeakSet) ajoutait la feuille système de manière durable. Foundry réutilise la même instance JS après fermeture → le hook de redirection ne se déclenchait plus → la feuille système restait l'ouverture par défaut jusqu'au prochain refresh navigateur.

Correction : deux hooks `closeApplicationV2` et `closeApplication` retirent désormais l'instance du WeakSet dès sa fermeture. La prochaine ouverture de l'acteur déclenche donc bien la redirection vers la feuille stockage.

**Problème 2 — Options d'entête :** `isMTTMerchant(actor)` testait uniquement `flags.mtt-merchants.merchant.enabled`, sans vérifier `flags.mtt-merchants.type`. Un acteur converti en storage conservant des flags merchant anciens était donc aussi détecté comme marchand, ce qui affichait "Retirer la boutique MTT" et "Ouvrir le gérant" sur la feuille storage.

Correction : `isMTTMerchant` vérifie maintenant que `flags.mtt-merchants.type === "merchant"` avant de tester les données merchant. Symétrique avec `isMTTStorage` qui vérifiait déjà le type.

**Option manquante :** Sur la feuille MTT storage, il n'existait aucune option pour ouvrir temporairement la feuille système (l'option n'était visible que via le bug merchant). Ajout de "Ouvrir la feuille de l'acteur" (`mtt-open-actor-sheet`) dans `buildMTTControlsV2` et `buildMTTButtonsV1` pour le cas `isOnMerchantSheet = true` côté storage. La même fonction `openManagerActorSheet` est réutilisée — elle ouvre la feuille système via bypass ponctuel sans modifier les flags.

## Non créé volontairement

- Aucune classe `StorageSheet`.
- Aucun template HBS ni style LESS modifié.
- Aucune modification des flags de conversion.
- Aucune migration des acteurs existants.
- Aucune modification des sessions, du rail, des lignes d'Items ou de la logique commerciale.
- Aucun nouveau système de permissions.

## Vérifications manuelles

1. Ouvrir un acteur storage → feuille stockage MTT.
2. Cliquer "Ouvrir la feuille de l'acteur" dans le menu `...` → feuille système s'ouvre en parallèle.
3. La feuille stockage reste ouverte.
4. Fermer la feuille système → fermer la feuille stockage → rouvrir l'acteur → feuille stockage (pas la feuille système).
5. Refresh navigateur → rouvrir l'acteur → feuille stockage.
6. Menu `...` storage : pas de "Retirer la boutique MTT", présence de "Retirer le stockage MTT".
7. Ouvrir un acteur shop/marchand → options shop correctes, pas d'option storage.

---

# Correction 10.1B — Retrait de « Copier l'objet » côté storage

## Todo

- [x] Identifier l'entrée de menu « Copier l'objet » dans `merchant-sheet.mjs`
- [x] Supprimer la création du bouton `copy` dans le bloc `isStorage` / `kind === "product"`
- [x] Vérifier que le bloc marchand conserve son bouton `copy` intact
- [x] `node --check` sur `merchant-sheet.mjs`
- [x] Rapport ajouté

## Résumé

Dans `#openCatalogItemContextMenu`, le menu product storage appelait `#createCatalogContextButton` pour créer un bouton `copy` puis l'ajoutait à `menu.append(warningGM, blocked, ownership, copy)`. La correction retire uniquement cette création et réduit l'appel à `menu.append(warningGM, blocked, ownership)`.

Le bloc `else` (marchand) n'est pas touché : `copyProduct` / `copyService` restent présents et fonctionnels.

**Fichier modifié :** `module/applications/sheets/merchant-sheet.mjs` (2 lignes supprimées, 1 ligne simplifiée).

## Non créé volontairement

- Aucun nouveau fichier.
- Aucune modification du handler `#copyCatalogItem` ni de `copyCatalogProduct` / `copyCatalogService`.
- Aucune suppression de traduction (`mtt.catalog.context.copyProduct` conservé pour le marchand).
- Aucune modification des autres entrées du menu contextuel storage ni marchand.
- Aucune modification HBS.

## Vérifications manuelles

1. Charger Foundry sans erreur console.
2. Ouvrir un stockage → clic droit sur un Item → « Copier l'objet » absent.
3. Options storage présentes : Avertissement MJ, Bloquer/débloquer, Limité/Observateur.
4. Ouvrir un marchand → clic droit sur un Item → « Copier l'objet » toujours présent.
5. Cliquer « Copier l'objet » côté marchand → copie fonctionnelle comme avant.

---

# Étape 11.1 — Tags de vote rapides sur les Items du stockage

## Todo

- [x] Helpers flags tags dans `storage-flags.mjs` (`getStorageItemTags`, `toggleStorageItemTag`)
- [x] Fix path-based pour `setStorageItemBlocked` et `setStorageItemWarningGM` (évite d'écraser les tags)
- [x] Exposition de `rawStorageTags` dans `buildProductContextFromItem` (`merchant-products.mjs`)
- [x] `buildStorageTagsContext` + option `selectedActorUuid` dans `prepareItems` (`merchant-catalog.mjs`)
- [x] Import `toggleStorageItemTag`, action `toggleStorageTag`, passage de `selectedActorUuid`, handler `#onToggleStorageTag` (`merchant-sheet.mjs`)
- [x] Bloc HBS tags dans `merchant-products.hbs` (inside `{{#if @root.isStorage}}`, avant actions)
- [x] CSS `.mtt-storage-tags`, `.mtt-storage-tag-button`, `.mtt-storage-tag-active`, `.mtt-storage-tag-count-empty` (`merchant-catalog.less`)
- [x] Clés i18n `storage.tags.*` dans `fr.json` et `en.json`
- [x] `node --check` sur tous les JS modifiés, validation JSON
- [x] Rapport ajouté

## Résumé

Les tags sont stockés sur chaque Item dans `flags.mtt-merchants.storage.tags` sous la forme `{ "Actor.uuid": "keep"|"sell"|"question" }`. Lecture via `getStorageItemTags(item)`, écriture/suppression via `toggleStorageItemTag(item, actorUuid, tagType)` (toggle : re-clic retire le tag).

`buildProductContextFromItem` expose `rawStorageTags` (le dict brut). `prepareItems` calcule `storageTags` (tableau de 3 objets `{type, icon, count, isActive, label}`) en recevant `selectedActorUuid` depuis la feuille. Le HBS itère les 3 boutons pour chaque ligne Item uniquement si `@root.isStorage`.

Le handler `#onToggleStorageTag` vérifie que la feuille est storage, que l'acteur sélectionné est valide et présent dans le rail, puis appelle `toggleStorageItemTag`. Foundry re-render automatiquement via le hook `updateEmbeddedDocuments`.

`setStorageItemBlocked` et `setStorageItemWarningGM` utilisent désormais des mises à jour par chemin (`flags.mtt-merchants.storage.blocked` / `.warningGM`) pour éviter d'écraser les tags lors de la mise à jour d'un autre statut.

**Icônes** : `fa-star-exclamation` (keep), `fa-recycle` (sell), `fa-message-question` (question). Ces icônes sont disponibles en Font Awesome 6 Pro, inclus dans Foundry VTT v14.

## Non créé volontairement

- Aucune nouvelle feuille storage.
- Aucun template HBS storage dédié.
- Aucun nouveau fichier LESS.
- Aucune option de clic droit pour les tags.
- Aucune modification du marchand.
- Aucune modification des statuts existants (warningGM, blocked, invisible).
- Aucune modification de la session d'échange ni des transferts.
- Aucun système de vote majoritaire ni décision automatique.

## Vérifications manuelles

1. Charger Foundry sans erreur console.
2. Ouvrir un marchand → aucune icône de tag visible.
3. Ouvrir un stockage → chaque ligne Item affiche 3 boutons de tag.
4. Compteurs à 0 : chiffres invisibles, icônes à opacité faible, alignement intact.
5. Sélectionner un acteur dans le rail → cliquer « Important / à garder » → compteur passe à 1, icône mise en valeur.
6. Cliquer « Sans intérêt / à vendre » → keep repasse à 0, sell passe à 1.
7. Re-cliquer « Sans intérêt / à vendre » → tag retiré, sell repasse à 0.
8. Tester avec deux acteurs → compteurs additionnent correctement.
9. Fermer/rouvrir la feuille → tags persistants.
10. Sans acteur sélectionné → clic sur tag → notification « Sélectionnez un acteur… ».
11. Clic droit sur un Item storage → aucune option de tag.
12. Vérifier que les statuts warningGM et blocked fonctionnent toujours après un tag posé (pas d'écrasement).

# Correction 11.1B — Nettoyage du rail storage spécifique et rail commun

## Todo

- [x] Lire `agents.md`, `rapport-étapes-stockage.md` et les instructions 11.1B.
- [x] Rechercher les reliquats de rail storage spécifique.
- [x] Supprimer le contexte, le menu, le clic gauche et les écritures storage parallèles.
- [x] Brancher le stockage sur `#prepareAccessClients` et `#prepareAccessContext`.
- [x] Conserver les écritures marchand dans `merchant.access.clients`.
- [x] Conserver les écritures stockage dans `storage.access.actors`.
- [x] Renommer l’option commune en `Retirer l’acteur de la feuille`.
- [x] Compiler le LESS vers `css/mtt.css`.
- [x] Vérifier la syntaxe JS et JSON.

## Résumé

Le rail historique marchand est maintenant le rail commun MTT pour le marchand et le stockage. La feuille choisit seulement la source de données selon le type actif, puis le même pipeline prépare les cartes, les états visuels, les badges de session, la sélection, le drop et le menu contextuel.

Le stockage lit et écrit toujours ses acteurs dans `flags.mtt-merchants.storage.access.actors`, tandis que le marchand conserve `flags.mtt-merchants.merchant.access.clients`.

## Logique storage spécifique supprimée

- Suppression de `#prepareStorageAccessClients`.
- Suppression de `#prepareStorageAccessContext`.
- Suppression de `#upsertStorageAccessActor`.
- Suppression de `#removeStorageAccessActor`.
- Suppression du menu contextuel storage dédié.
- Suppression des clés i18n `storage.rail.*`.
- Nettoyage du LESS pour garder seulement une variante de positionnement gauche du rail storage.

## Non traité volontairement

- Les pourcentages personnalisés du menu commun ne sont pas masqués côté stockage.
- Aucun nouveau template de rail storage.
- Aucun nouveau fichier JS ou LESS storage pour le rail.
- Aucune modification des tags, catégories, statuts d’Items ou transferts hors branchement au rail commun.

## Vérifications manuelles

1. Ouvrir un marchand et vérifier que le rail fonctionne comme avant.
2. Ouvrir un stockage et vérifier que le rail affiche les mêmes états visuels.
3. Vérifier clic gauche sur acteur autorisé et non autorisé.
4. Vérifier clic droit et le libellé `Retirer l’acteur de la feuille`.
5. Vérifier retrait d’autorisation et retrait acteur de la feuille.
6. Vérifier que les tags storage utilisent toujours l’acteur sélectionné.

---

# Correction commune — Pliage local des catégories produits

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction commune.
- [x] Identifier l’écriture globale de pliage dans `catalog.collapsedCategories`.
- [x] Ajouter un état local de pliage sur l’instance de feuille commune.
- [x] Brancher cet état local dans la préparation des catégories produits.
- [x] Neutraliser l’écriture globale du handler de pliage.
- [x] Garder le bouton de pliage utilisable sans droit d’édition.
- [x] Ne pas toucher aux sous-catégories ni aux services.
- [x] Vérifier la syntaxe JS, le lint et le diff.

## Cause de la correction

Le pliage d’une catégorie produit était enregistré dans les flags de l’acteur. Un utilisateur pouvait donc replier une catégorie pour tous les autres.

## Nouvelle règle locale

Le pliage / dépliage des catégories produits est maintenant local à l’instance de feuille ouverte.

L’état est conservé pendant les renders de cette fenêtre, puis naturellement réinitialisé à la fermeture / réouverture.

## Écriture globale neutralisée

Le handler de pliage ne fait plus d’`updateMerchantData` et n’écrit plus dans `catalog.collapsedCategories`.

Les anciens flags éventuels ne sont plus utilisés comme source de rendu pour le pliage.

## Fichiers modifiés

- `module/applications/sheets/merchant-sheet.mjs`
- `module/applications/sheets/merchant-catalog.mjs`
- `rapport-étapes-stockage.md`

## Vérifications manuelles simples

1. Replier une catégorie produit sur un stockage côté joueur.
2. Vérifier qu’elle reste repliée après un render de cette fenêtre.
3. Vérifier que le MJ ne voit pas ce pliage local.
4. Répéter sur un marchand.
5. Verrouiller la feuille et vérifier que le pliage reste utilisable.
6. Fermer puis rouvrir la feuille et vérifier que l’état est réinitialisé.
7. Vérifier qu’aucune donnée de collapse n’est écrite dans les flags.

---

# Correction 12.F.1 — Catégorie ignore en bas du catalogue

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction 12.F.1.
- [x] Réutiliser l’id technique stable `mtt-storage-ignore`.
- [x] Corriger uniquement le tri d’affichage des catégories.
- [x] Garder les catégories normales triées comme avant.
- [x] Placer “A vendre / sans intérêt” après les catégories normales.
- [x] Garder “Sans catégorie” tout en bas.
- [x] Conserver le masquage de la catégorie spéciale quand elle est vide.
- [x] Ne pas modifier l’ordre persistant des catégories.
- [x] Vérifier la syntaxe JS, le lint et le diff.

## Règle d’ordre ajoutée

Le rendu des catégories utilise maintenant un rang d’affichage :

```text
0 — catégories normales
1 — A vendre / sans intérêt
2 — Sans catégorie
```

Ainsi, la catégorie automatique `ignore` n’est plus triée avec les catégories normales.

## Masquage conservé

La catégorie “A vendre / sans intérêt” reste absente du rendu si elle ne contient aucun Item.

Aucune catégorie n’est supprimée ou réordonnée dans les flags pour cette correction.

## Fichiers modifiés

- `module/applications/sheets/merchant-catalog.mjs`
- `rapport-étapes-stockage.md`

## Vérifications manuelles simples

1. Ouvrir un stockage avec plusieurs catégories normales.
2. Vérifier qu’un Item dans “A vendre / sans intérêt” affiche cette catégorie après les catégories normales.
3. Vérifier que “Sans catégorie” reste tout en bas.
4. Vérifier que “A vendre / sans intérêt” disparaît si elle est vide.
5. Vérifier qu’un marchand conserve son tri habituel.

---

# Étape 12.F — Actions actives du tag ignore

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction 12.F.
- [x] Rendre le tag `ignore` bloquant même sans acteur `want`.
- [x] Appliquer ce blocage au bouton “Ajouter à la session”.
- [x] Appliquer ce blocage aux augmentations de quantité.
- [x] Laisser les diminutions de quantité autorisées.
- [x] Ajouter le message court de blocage FR/EN.
- [x] Créer/récupérer une catégorie locale stable “A vendre / sans intérêt”.
- [x] Déplacer automatiquement un Item quand tous les acteurs concernés ont `ignore`.
- [x] Restaurer la catégorie d’origine quand la condition cesse.
- [x] Masquer la catégorie spéciale quand elle est vide.
- [x] Ne pas persister de calcul de vote.
- [x] Vérifier la syntaxe JS, les JSON, le lint et le diff.

## Règle de blocage du tag `ignore`

Si l’acteur de la session active a mis `ignore`, l’ajout et les augmentations de quantité sont bloqués pour un utilisateur non MJ.

Cette règle s’applique même si aucun acteur n’a mis `want`.

Le bouton reste visible et utilise l’état bloqué existant.

## Message ajouté

Le message court utilisé pour le warning et le tooltip est :

```text
Retirez “Sans intérêt pour moi” pour récupérer cet objet.
```

La version anglaise est aussi ajoutée.

## Déplacement automatique

Quand tous les acteurs concernés ont mis `ignore`, l’Item est déplacé vers la catégorie locale :

```text
A vendre / sans intérêt
```

L’identifiant technique stable est :

```text
mtt-storage-ignore
```

La catégorie est créée seulement si un Item doit y être placé.

## Restauration

Avant le déplacement automatique, la catégorie d’origine est mémorisée dans un flag minimal sur l’Item :

```text
flags.mtt-merchants.storage.ignoreOriginalCategory
```

Quand la condition “tous ignore” cesse, l’Item revient dans sa catégorie d’origine. Si cette catégorie n’existe plus, il revient dans “Sans catégorie”, puis le flag temporaire est supprimé.

## Affichage de la catégorie spéciale

La catégorie “A vendre / sans intérêt” est masquée au rendu si elle ne contient aucun Item.

Elle n’est pas supprimée automatiquement des catégories locales.

## Non-persistance des calculs

Aucune liste d’acteurs `ignore`, aucun historique de vote, aucune décision et aucun état calculé complet n’est persisté.

Seule la catégorie d’origine est mémorisée pendant un déplacement automatique.

## Vérifications manuelles simples

1. Mettre `ignore` sur un Item avec l’acteur actif et vérifier que l’ajout est bloqué.
2. Vérifier le tooltip et le warning court.
3. Vérifier que `+` et une saisie directe supérieure sont bloqués.
4. Vérifier que `-` reste possible.
5. Mettre tous les acteurs concernés en `ignore` et vérifier le déplacement vers “A vendre / sans intérêt”.
6. Retirer `ignore` ou passer en `want` et vérifier la restauration de catégorie.
7. Vérifier que la catégorie spéciale disparaît quand elle est vide.
8. Vérifier que le MJ peut toujours outrepasser le blocage d’action.
9. Vérifier que `want` et sa limite de quantité fonctionnent toujours.
10. Ouvrir un marchand et vérifier qu’il n’est pas impacté.

---

# Correction 12.E.1 — Limite de quantité par acteur want

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction 12.E.1.
- [x] Remplacer la logique “1 exemplaire par acteur want” par une limite de quantité calculée.
- [x] Calculer une base de partage stable depuis la quantité disponible et les quantités déjà engagées par les acteurs `want`.
- [x] Exposer la limite par acteur `want`, la quantité déjà prise et la quantité restante.
- [x] Sécuriser le bouton “Ajouter à la session”.
- [x] Sécuriser le bouton `+` des lignes de session.
- [x] Sécuriser la saisie directe de quantité.
- [x] Ajouter une vérification finale avant validation storage.
- [x] Conserver le bypass MJ.
- [x] Ne persister aucune donnée dérivée de répartition.
- [x] Mettre à jour les messages FR/EN.
- [x] Vérifier la syntaxe JS, les JSON, le lint et le diff.

## Cause de la correction

La correction 12.E bloquait surtout le bouton d’ajout, mais une quantité pouvait encore être augmentée ensuite depuis la session avec `+` ou par saisie directe.

## Nouvelle règle de partage

Quand au moins un acteur a choisi `want`, que tous les acteurs concernés ont voté et que la quantité couvre les demandes, la quantité disponible pour la décision est répartie équitablement entre les acteurs `want`.

La base de partage reste stable :

```text
quantité de partage =
  quantité disponible actuelle
  + quantités déjà engagées par les sessions des acteurs want pour cet Item
```

La limite par acteur est :

```text
floor(quantité de partage / nombre d’acteurs want)
```

Le reliquat reste dans le stockage et n’est pas redistribué automatiquement.

## Handlers sécurisés

Le bouton “Ajouter à la session”, le bouton `+` et la saisie directe recalculent maintenant la limite temporaire au moment de l’action.

Les diminutions restent autorisées pour permettre à un acteur de corriger ou retirer une ligne.

## Validation finale

Avant un transfert storage réel, la session est revérifiée pour les utilisateurs non MJ. Si une ligne dépasse la limite calculée, la validation est refusée et aucun transfert n’est exécuté.

Le MJ conserve la possibilité d’outrepasser.

## Non-persistance

Aucune allocation, limite, décision ou quantité calculée n’est enregistrée dans les flags.

La règle est recalculée depuis les tags, les sessions et les `buyerItems`.

## Vérifications manuelles simples

1. Tester 85 flèches avec 2 acteurs `want` et vérifier une limite de 42 chacun.
2. Vérifier que le bouton `+` refuse 43 pour un joueur.
3. Saisir 50 directement et vérifier le plafonnement/refus à la limite.
4. Vérifier qu’un acteur `ignore` ou sans tag ne peut pas augmenter.
5. Vérifier que le reliquat reste dans le stockage.
6. Vérifier que le MJ peut outrepasser.
7. Vérifier qu’un marchand n’est pas impacté.

---

# Correction 11.1C — Ajustements du rail commun et variante storage

## Todo

- [x] Lire `agents.md`, `rapport-étapes-stockage.md` et les instructions 11.1C.
- [x] Vérifier l’absence de rail storage parallèle après 11.1B.
- [x] Corriger les badges utiles du rail commun.
- [x] Faire utiliser les sessions du type MTT actif au rail commun.
- [x] Aligner le clic gauche storage sur le comportement marchand pour un acteur non autorisé.
- [x] Conserver le rail storage à gauche comme variante visuelle légère.
- [x] Masquer les pourcentages personnalisés uniquement côté storage.
- [x] Compiler le LESS vers `css/mtt.css`.
- [x] Vérifier la syntaxe JS et l’absence de reliquats de rail storage.

## Résumé

Le rail commun affiche maintenant les badges uniquement pour les sessions utiles : `active`, `pending` et `submitted`. Les sessions `validated` et `refused` ne sont plus prioritaires pour le badge du rail.

Le rail commun reçoit aussi les sessions lues par la feuille active. Le marchand continue donc à utiliser `merchant.sessions.entries`, tandis que le stockage utilise `storage.sessions.entries`.

## Éléments communs modifiés

- Priorité des sessions du rail : `active`, puis `pending`, puis `submitted`.
- Icônes de badge conservées pour ces trois statuts utiles.
- Clic gauche sur acteur non autorisé : autorisation puis création/récupération de session via le pipeline commun.

## Variantes storage ajoutées

- Le rail commun reste positionné à gauche sur une feuille storage via la classe de variante existante.
- L’entrée `Pourcentages personnalisés` et sa réinitialisation sont masquées côté storage dans le menu commun.

## Non créé volontairement

- Aucun template de rail storage.
- Aucun contexte `prepareStorageAccess*`.
- Aucun menu contextuel storage séparé.
- Aucun handler de clic storage séparé.
- Aucune modification des tags, transferts, catégories, statuts d’Items ou sockets.
- Aucune suppression des fonctions ou traductions de taux personnalisés, qui restent utiles au marchand.

## Vérifications manuelles

1. Ouvrir un marchand et vérifier que le rail reste à droite.
2. Vérifier que les badges utiles de session s’affichent côté marchand.
3. Vérifier que `Pourcentages personnalisés` reste présent côté marchand.
4. Ouvrir un stockage et vérifier que le rail est à gauche.
5. Vérifier que les badges utiles de session s’affichent côté stockage.
6. Cliquer sur un acteur storage non autorisé et vérifier que la session est créée/activée.
7. Vérifier que `Pourcentages personnalisés` est absent côté storage.
8. Vérifier que `Retirer l’acteur de la feuille` reste présent sur les deux types.

---

# Correction 11.1D — Exposition de `isStorage` dans le contexte du rail commun

## Todo

- [x] Lire `agents.md`, `rapport-étapes-stockage.md` et les instructions 11.1D.
- [x] Vérifier le contexte utilisé par le partial du rail commun.
- [x] Ajouter `isStorage` au retour de `#prepareAccessContext()`.
- [x] Corriger la condition HBS du rail pour utiliser `isStorage`.
- [x] Vérifier `node --check` sur `merchant-sheet.mjs`.

## Résumé

Le partial `merchant-access-rail.hbs` reçoit maintenant directement `isStorage` dans son contexte de rendu. La classe `mtt-storage-access-rail` peut donc être appliquée correctement quand la feuille active est un stockage.

## Non modifié volontairement

- Aucune logique de rail.
- Aucun clic gauche.
- Aucun menu contextuel.
- Aucun badge, session, tag ou pourcentage personnalisé.
- Aucun CSS ni fichier de langue.

## Vérifications manuelles

1. Ouvrir un stockage et vérifier que `<aside>` contient `mtt-storage-access-rail`.
2. Ouvrir un marchand et vérifier que `<aside>` ne contient pas `mtt-storage-access-rail`.
3. Vérifier que le rail fonctionne toujours comme avant.

---

# Correction 11.1E — Sessions storage branchées sur le socket commun

## Todo

- [x] Lire `agents.md`, `rapport-étapes-stockage.md` et les instructions 11.1E.
- [x] Identifier la branche `updateStorageData` directe dans `#updateSessionEntries`.
- [x] Construire le chemin de sessions selon le type MTT actif.
- [x] Faire passer les sessions storage par la même logique MJ/propriétaire/socket que le marchand.
- [x] Adapter le socket de session existant aux chemins `merchant.sessions.entries` et `storage.sessions.entries`.
- [x] Vérifier qu’aucun socket storage parallèle n’a été créé.
- [x] Vérifier `node --check` sur les fichiers JS modifiés.

## Résumé

Les sessions storage ne sont plus sauvegardées par un `updateStorageData` direct depuis la feuille. `#updateSessionEntries()` construit maintenant un `updateData` avec le bon chemin de flags selon le type MTT actif, puis utilise la même chaîne que le marchand : mise à jour directe par MJ/propriétaire, sinon demande socket.

Le socket existant reste unique. Il accepte uniquement le chemin `sessions.entries` du type MTT actif et lit les sessions existantes dans `merchant.sessions.entries` ou `storage.sessions.entries` selon l’acteur.

## Non créé volontairement

- Aucun `requestStorageSessionUpdate`.
- Aucun `storageSessionUpdateRequest`.
- Aucun `buildSafeStorageSessionUpdate`.
- Aucun handler socket storage séparé.
- Aucune modification du rail, des tags, des catégories, des statuts d’Items ou des transferts.

## Vérifications manuelles

1. Ouvrir un marchand côté joueur et vérifier ajout d’Item + changement de quantité en session.
2. Ouvrir un stockage côté MJ et autoriser un acteur joueur.
3. Ouvrir le stockage côté joueur et ajouter un Item à la session storage.
4. Modifier la quantité de l’Item dans la session storage.
5. Vérifier que l’erreur `User lacks permission to update Actor [...]` n’apparaît plus.
6. Fermer/réouvrir la feuille storage et vérifier que la session persiste.

---

# Correction 11.1F — Sécurisation des sessions par droits d’acteur

## Todo

- [x] Lire `agents.md`, `rapport-étapes-stockage.md` et les instructions 11.1F.
- [x] Ajouter un contrôle commun des droits de session basé sur l’acteur lié à la session.
- [x] Exposer les booléens `canViewOtherSession`, `canSelectOtherSession` et `canInteractWithOtherSession`.
- [x] Limiter la sélection/interaction des cards et sessions aux acteurs visibles ou possédés.
- [x] Remplacer les actions visibles de session par le droit actif `canEditActiveSession`.
- [x] Sécuriser les handlers de session avant modification.
- [x] Sécuriser le socket commun contre les modifications de sessions d’autres acteurs.
- [x] Vérifier `node --check` sur les fichiers JS modifiés.

## Résumé

Le rail commun et les sessions ne se basent plus uniquement sur le droit global `canInteractWithSession`. Une session est maintenant interactive seulement pour le MJ, un utilisateur qui possède la feuille MTT, ou le propriétaire de l’acteur lié à cette session avec le droit global d’interaction.

Les observateurs peuvent consulter ou sélectionner une session si le droit de consultation le permet, mais les boutons, champs, drag/drop et actions de session passent par `canEditActiveSession`. Le socket commun refuse aussi les mises à jour envoyées par un utilisateur qui tente de modifier une session liée à un acteur qu’il ne possède pas.

## Non créé volontairement

- Aucun rail storage séparé.
- Aucun socket storage séparé.
- Aucun helper de permission storage parallèle.
- Aucune modification des tags, catégories, prix, services ou transferts.

## Vérifications manuelles

1. Ouvrir une feuille MTT avec deux acteurs clients différents.
2. Vérifier qu’un joueur propriétaire de l’acteur A peut interagir avec la session de A.
3. Vérifier que ce joueur ne peut pas modifier la session de l’acteur B.
4. Vérifier qu’un observateur peut consulter la session autorisée sans boutons d’action.
5. Vérifier que le MJ peut toujours sélectionner, modifier, valider et refuser les sessions.
6. Refaire le test sur une feuille stockage et vérifier qu’aucun rail storage séparé n’apparaît.

---

# Correction 11.1G — Permission Voir les autres acteurs du rail

## Todo

- [x] Lire `agents.md`, `rapport-étapes-stockage.md` et les instructions 11.1G.
- [x] Identifier la permission existante `canViewOtherActorsInRail`.
- [x] Vérifier que la permission est déjà exposée dans la configuration des profils.
- [x] Appliquer cette permission au filtrage JS des cards du rail commun.
- [x] Vérifier que `canViewObserverActorSessions` reste réservé aux sessions.
- [x] Vérifier `node --check` sur le fichier JS modifié.

## Clé technique existante

`canViewOtherActorsInRail`

## Fichiers modifiés

- `module/applications/sheets/merchant-sheet.mjs`
- `rapport-étapes-stockage.md`

## Résumé

Le rail commun filtre maintenant les cards avec la permission existante `canViewOtherActorsInRail`. Un joueur voit les cards s’il est MJ, s’il peut gérer la feuille MTT, s’il possède l’acteur de la card, ou si son profil MTT autorise “Voir les autres acteurs du rail”.

Les cards ne sont pas seulement cachées en CSS : elles sont retirées du contexte envoyé au template. La règle est commune au marchand et au stockage, sans branche storage spécifique.

## Non créé volontairement

- Aucune nouvelle permission.
- Aucun rail storage séparé.
- Aucun filtre HBS ou CSS de remplacement.
- Aucune modification des actions de session, tags, transferts, catégories, prix ou services.

## Vérifications manuelles

1. Ouvrir la configuration MTT et vérifier que “Voir les autres acteurs du rail” existe pour Limité, Observateur et Propriétaire.
2. Sur un marchand, désactiver la permission pour un profil et vérifier que le joueur ne voit que ses acteurs.
3. Réactiver la permission et vérifier que les autres cards réapparaissent.
4. Refaire le même test sur un stockage.
5. Vérifier que “Voir les autres sessions” ne contrôle pas l’affichage des cards.

---

# Étape 11.2 — Tags storage branchés sur session active éditable

## Todo

- [x] Lire `agents.md`, `rapport-étapes-stockage.md` et les instructions 11.2.
- [x] Vérifier l’implémentation existante des tags storage.
- [x] Masquer entièrement le bloc tags/votes quand `canEditActiveSession` est faux.
- [x] Construire les compteurs et le tag actif seulement pour une session active éditable.
- [x] Enregistrer le vote avec `activeSession.actorUuid`.
- [x] Bloquer le handler JS si la session active n’est pas modifiable.
- [x] Ajouter une requête socket ciblée pour les joueurs qui ne peuvent pas écrire directement sur l’acteur storage.
- [x] Vérifier la syntaxe JS, les fichiers de langue et le lint.

## Résumé

Les tags storage ne sont plus pilotés par l’acteur sélectionné du rail. Le rendu reçoit maintenant `canEditActiveSession` et l’acteur votant issu de `activeSession.actorUuid`.

Si `canEditActiveSession` est faux, le bloc tags/votes est absent : aucun bouton, aucun compteur, aucun résultat. Si la session active est modifiable, les compteurs sont construits et le tag actif correspond au vote de l’acteur de la session active.

Le handler vérifie aussi la même règle côté JS. Quand l’utilisateur ne peut pas écrire directement sur l’acteur storage, une demande socket dédiée est envoyée et revalidée côté processeur avant d’appeler `toggleStorageItemTag`.

## Utilisation de `canEditActiveSession`

`canEditActiveSession` est la seule condition utilisée pour afficher les tags/votes. Le contexte des tags retourne une liste vide si ce booléen est faux ou si la session active n’a pas d’acteur votant.

## Non modifié volontairement

- Aucun changement de design des tags.
- Aucun tag côté marchand.
- Aucune modification des catégories, transferts, prix, services ou statuts techniques.
- Aucune refonte du rail ou des permissions.

## Vérifications manuelles

1. Ouvrir un stockage côté MJ avec une session active modifiable et vérifier que les tags sont visibles.
2. Cliquer sur `keep`, `sell`, puis `question` et vérifier qu’un seul vote reste actif.
3. Cliquer à nouveau sur le tag actif et vérifier que le vote est retiré.
4. Ouvrir le stockage côté joueur propriétaire de l’acteur de session et vérifier que le vote fonctionne.
5. Ouvrir une session visible mais non modifiable et vérifier que le bloc tags/votes est absent.
6. Ouvrir un marchand et vérifier qu’aucun tag storage n’apparaît.

---

# Correction 11.2A — Fonctionnement réel des tags storage

## Todo

- [x] Lire `agents.md`, `rapport-étapes-stockage.md` et les instructions 11.2A.
- [x] Vérifier `toggleStorageItemTag`.
- [x] Faire retourner les tags mis à jour après écriture.
- [x] Compléter la réponse socket avec `itemId` et `updatedTags`.
- [x] Appliquer localement les tags reçus côté joueur.
- [x] Forcer un render après chaque vote réussi.
- [x] Aligner les datasets HBS/JS avec `data-tag-type` et `data-item-id`.
- [x] Vérifier la syntaxe JS, les fichiers de langue et le lint.

## Cause principale

Le clic pouvait déclencher l’écriture, mais le code ne récupérait pas les tags mis à jour. La réponse socket renvoyait seulement `ok: true`, donc le joueur ne pouvait pas mettre à jour localement l’Item avant le render.

## Résumé

`toggleStorageItemTag` retourne maintenant l’objet `tags` mis à jour. Le socket de tags storage renvoie `itemId` et `updatedTags` au client demandeur. Le handler applique ces tags localement avec `updateSource` puis force un `render()` après un vote réussi.

Le bouton de tag expose aussi directement `data-item-id`, et le handler lit ce champ avant de chercher un parent.

## Fichiers modifiés

- `module/documents/storage-flags.mjs`
- `module/applications/sheets/merchant-session-socket.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `templates/actors/parts/merchant-products.hbs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucun changement de design.
- Aucun tag côté marchand.
- Aucune modification des catégories, transferts, droits du rail, prix ou services.

## Vérifications manuelles

1. Ouvrir un stockage avec une session active éditable.
2. Cliquer sur `keep` et vérifier que le compteur passe à 1.
3. Cliquer sur `sell` puis `question` et vérifier que le vote est remplacé.
4. Cliquer à nouveau sur le tag actif et vérifier que le vote est retiré.
5. Refaire le test côté joueur propriétaire de l’acteur de session.
6. Vérifier qu’un marchand n’affiche aucun tag storage.

---

# Correction 11.2B — Lecture/écriture des tags imbriqués par UUID d’acteur

## Todo

- [x] Lire `agents.md`, `rapport-étapes-stockage.md` et les instructions 11.2B.
- [x] Identifier la structure imbriquée réelle produite par Foundry pour les UUID d’acteur.
- [x] Corriger `getStorageItemTags`.
- [x] Corriger `toggleStorageItemTag` avec `foundry.utils.getProperty`, `setProperty` et `unsetProperty`.
- [x] Corriger le calcul des compteurs avec une collecte récursive.
- [x] Corriger la détection du tag actif avec `foundry.utils.getProperty`.
- [x] Vérifier la syntaxe JS, les fichiers de langue et le lint.

## Cause identifiée

Les tags étaient lus comme une structure plate du type `{ "Actor.xxxxx": "keep" }`, alors que Foundry stocke les UUID avec points sous forme imbriquée : `{ Actor: { xxxxx: "keep" } }`.

## Helpers modifiés

- `getStorageItemTags`
- `toggleStorageItemTag`
- `buildStorageTagsContext`

## Comportement corrigé

Les votes déjà stockés sous forme imbriquée sont maintenant relus correctement. Les compteurs parcourent toute la structure de tags, le tag actif de l’acteur de session est trouvé via son UUID complet, et le clic sur le tag actif retire bien le vote.

## Non modifié volontairement

- Aucun log ajouté.
- Aucun changement de design.
- Aucune modification des permissions.
- Aucune modification du rail, des sessions, des catégories ou du marchand.
- Aucune conversion des flags vers une structure plate.

## Vérifications manuelles

1. Ouvrir un Item storage avec `flags.mtt-merchants.storage.tags.Actor.xxxxx`.
2. Vérifier que le compteur du tag existant est correct.
3. Vérifier que le tag actif est reconnu pour l’acteur de la session.
4. Cliquer sur un autre tag et vérifier que le vote est remplacé.
5. Cliquer sur le tag actif et vérifier que le vote est retiré.
6. Fermer puis rouvrir la feuille et vérifier que les compteurs restent corrects.
7. Ouvrir un marchand et vérifier qu’aucun tag storage n’apparaît.

---

# Étape 12.A — Remplacement des tags informatifs par deux tags actifs

## Todo

- [x] Lire `agents.md`, `rapport-étapes-stockage.md` et les instructions 12.A.
- [x] Identifier les points actifs de l’ancien système `keep` / `sell` / `question`.
- [x] Remplacer la liste des tags autorisés par `want` et `ignore`.
- [x] Adapter le contexte HBS pour ne plus exposer de compteurs.
- [x] Adapter les boutons storage pour afficher deux tags actifs simples.
- [x] Mettre à jour les libellés et tooltips FR/EN.
- [x] Nettoyer le LESS lié aux compteurs.
- [x] Compiler le CSS.
- [x] Vérifier la syntaxe JS, les fichiers de langue et le lint.

## Résumé

Les tags informatifs storage ont été remplacés par deux tags actifs de base. L’infrastructure existante est conservée : affichage uniquement côté stockage, condition `canEditActiveSession`, vote avec `activeSession.actorUuid`, gestion des UUID imbriqués Foundry, socket joueur et render après mise à jour.

Les compteurs ne sont plus construits ni affichés. Les anciennes valeurs `keep`, `sell` et `question` ne sont plus des tags actifs ; si elles existent encore dans des flags, elles sont ignorées par l’affichage.

## Tags supprimés

- `keep`
- `sell`
- `question`

## Tags ajoutés

- `want` : Je le veux
- `ignore` : Sans intérêt pour moi

## Non implémenté volontairement

- Aucune réservation réelle.
- Aucun blocage d’objet.
- Aucune décision commune.
- Aucun vote collectif.
- Aucun tri personnel ou grisage.
- Aucun déplacement global d’objet.
- Aucune modification des permissions, du rail, des sessions, des transferts ou du marchand.

## Vérifications manuelles

1. Ouvrir un stockage avec une session éditable.
2. Vérifier que deux boutons sont visibles : `Je le veux` et `Sans intérêt pour moi`.
3. Cliquer sur `Je le veux` et vérifier que le bouton devient actif.
4. Cliquer sur `Sans intérêt pour moi` et vérifier que l’état actif est remplacé.
5. Cliquer à nouveau sur le bouton actif et vérifier qu’aucun tag ne reste actif.
6. Vérifier qu’aucun compteur n’est affiché.
7. Vérifier qu’un marchand n’affiche aucun tag storage.

---

# Correction 12.A.1 — Désélection fonctionnelle des tags actifs

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction de correction 12.A.1.
- [x] Identifier l’appel incompatible à `foundry.utils.unsetProperty`.
- [x] Ajouter un helper local de suppression du chemin imbriqué d’un acteur.
- [x] Adapter `toggleStorageItemTag` sans changer les tags actifs.
- [x] Vérifier que le socket passe par `toggleStorageItemTag`.
- [x] Vérifier qu’il ne reste plus d’appel à `unsetProperty`.
- [x] Vérifier la syntaxe JS et le lint.

## Cause de l’erreur

La désélection d’un tag actif appelait `foundry.utils.unsetProperty`, qui n’est pas disponible dans l’environnement Foundry ciblé. Le clic sur un tag déjà actif déclenchait donc une erreur console au lieu de retirer le vote de l’acteur.

## Fonction corrigée

La fonction `toggleStorageItemTag` utilise maintenant un helper local pour supprimer uniquement la valeur finale correspondant à `activeSession.actorUuid` dans la structure imbriquée des tags.

Les tags actifs restent limités à :

- `want`
- `ignore`

## Vérifications manuelles

1. Ouvrir un stockage avec une session active éditable.
2. Cliquer sur `Je le veux` et vérifier que le bouton devient actif.
3. Cliquer à nouveau sur `Je le veux` et vérifier que le bouton n’est plus actif.
4. Cliquer sur `Sans intérêt pour moi` et vérifier que le bouton devient actif.
5. Cliquer à nouveau sur `Sans intérêt pour moi` et vérifier que le bouton n’est plus actif.
6. Passer de `Je le veux` à `Sans intérêt pour moi`, puis l’inverse, et vérifier qu’un seul tag reste actif.
7. Vérifier qu’aucune erreur console `unsetProperty is not a function` n’apparaît.
8. Fermer puis rouvrir la feuille et vérifier que l’état affiché correspond au flag enregistré.
9. Ouvrir un marchand et vérifier qu’il n’est pas impacté.

---

# Correction 12.A.2 — Suppression réelle du tag actif avec `-=`

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction de correction 12.A.2.
- [x] Identifier que la désélection locale ne supprimait pas forcément la clé profonde dans Foundry.
- [x] Corriger uniquement la branche de désélection dans `toggleStorageItemTag`.
- [x] Conserver les tags actifs `want` et `ignore`.
- [x] Conserver le helper local de nettoyage de l’objet retourné.
- [x] Vérifier qu’aucun appel à `foundry.utils.unsetProperty` n’est réintroduit.
- [x] Vérifier la syntaxe JS et le lint.

## Cause exacte du problème

La correction précédente retirait bien le tag dans l’objet cloné, mais l’appel `item.update` sur l’objet complet `storage.tags` pouvait fusionner les objets imbriqués au lieu de supprimer réellement la clé profonde de l’acteur.

Après render ou réouverture, Foundry pouvait donc relire l’ancien tag encore présent sous `flags.mtt-merchants.storage.tags.Actor.<idActeur>`.

## Fonction corrigée

La fonction `toggleStorageItemTag` utilise maintenant une suppression Foundry explicite quand l’acteur clique sur son tag déjà actif.

## Syntaxe Foundry utilisée

La correction utilise la syntaxe de suppression de clé :

```text
flags.mtt-merchants.storage.tags.Actor.-=<idActeur>
```

Cela supprime uniquement la clé finale de l’acteur concerné, sans effacer les tags des autres acteurs et sans supprimer tout l’objet `storage.tags`.

## Vérifications manuelles

1. Ouvrir un stockage avec une session active éditable.
2. Cliquer sur `Je le veux` et vérifier que le bouton devient actif.
3. Cliquer à nouveau sur `Je le veux` et vérifier que le bouton devient inactif.
4. Fermer puis rouvrir la feuille et vérifier que `Je le veux` reste inactif.
5. Cliquer sur `Sans intérêt pour moi` et vérifier que le bouton devient actif.
6. Cliquer à nouveau sur `Sans intérêt pour moi` et vérifier que le bouton devient inactif.
7. Fermer puis rouvrir la feuille et vérifier que `Sans intérêt pour moi` reste inactif.
8. Passer de `Je le veux` à `Sans intérêt pour moi`, puis l’inverse, et vérifier qu’un seul tag reste actif.
9. Inspecter ou exporter l’acteur et vérifier que la clé de l’acteur désélectionné n’est plus présente sous les tags de l’Item.
10. Vérifier qu’aucune erreur console n’apparaît et que le marchand n’est pas impacté.

---

# Correction 12.A.3 — Suppression moderne des tags avec ForcedDeletion

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction de correction 12.A.3.
- [x] Identifier la suppression legacy `-=`.
- [x] Remplacer la suppression legacy par `foundry.data.operators.ForcedDeletion`.
- [x] Conserver le comportement de sélection, remplacement et désélection.
- [x] Conserver les tags actifs `want` et `ignore`.
- [x] Vérifier qu’aucun appel à `foundry.utils.unsetProperty` n’est présent.
- [x] Vérifier la syntaxe JS et le lint.

## Cause du warning

La désélection d’un tag actif utilisait la syntaxe Foundry legacy `-=clé`. Cette syntaxe supprimait bien la clé, mais Foundry v14 signale maintenant qu’elle doit être remplacée par l’opérateur moderne `ForcedDeletion`.

## Fonction corrigée

La fonction `toggleStorageItemTag` conserve la même logique fonctionnelle : un clic sur un tag actif retire uniquement le vote de l’acteur de la session active.

## Syntaxe Foundry moderne utilisée

La suppression passe maintenant par :

```text
foundry.data.operators.ForcedDeletion
```

sur le chemin complet du tag de l’acteur :

```text
flags.mtt-merchants.storage.tags.Actor.<idActeur>
```

Le helper local reste utilisé pour nettoyer l’objet retourné à la feuille après la mise à jour du document.

## Vérifications manuelles

1. Ouvrir un stockage avec une session active éditable.
2. Cliquer sur `Je le veux`, puis recliquer dessus et vérifier que le tag est retiré.
3. Cliquer sur `Sans intérêt pour moi`, puis recliquer dessus et vérifier que le tag est retiré.
4. Passer de `Je le veux` à `Sans intérêt pour moi`, puis l’inverse, et vérifier qu’un seul tag reste actif.
5. Fermer puis rouvrir la feuille et vérifier que le tag retiré ne réapparaît pas.
6. Vérifier qu’aucun warning console legacy `-=...` n’apparaît.
7. Vérifier qu’aucune erreur console n’apparaît.
8. Inspecter ou exporter l’acteur et vérifier que la clé de l’acteur retiré n’est plus présente dans les tags de l’Item.
9. Ouvrir un marchand et vérifier qu’il n’est pas impacté.

---

# Correction 12.A.4 — Désélection définitive des tags avec unsetFlag

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction de correction 12.A.4.
- [x] Identifier que `ForcedDeletion` ne supprimait pas correctement le tag dans ce cas précis.
- [x] Remplacer la branche de désélection par `item.unsetFlag`.
- [x] Retirer la logique devenue inutile autour de `ForcedDeletion`.
- [x] Conserver le helper local pour nettoyer l’objet retourné.
- [x] Vérifier que les tags actifs restent `want` et `ignore`.
- [x] Vérifier la syntaxe JS et le lint.

## Cause du problème

La logique métier était correcte, mais la méthode de suppression ne l’était pas pour ce flag imbriqué. `ForcedDeletion` supprimait le warning legacy, mais ne retirait pas correctement le tag actif dans ce cas.

## Fonction corrigée

La fonction `toggleStorageItemTag` utilise maintenant l’API Foundry prévue pour supprimer un flag quand l’acteur clique sur son tag déjà actif.

## Méthode utilisée

La suppression réelle passe par :

```text
item.unsetFlag(MTT.ID, "storage.tags.Actor.<idActeur>")
```

Le helper `deleteStorageTagPath` reste utilisé uniquement pour nettoyer l’objet local retourné par la fonction.

## Méthodes retirées pour cette désélection

- `foundry.utils.unsetProperty`
- syntaxe legacy `-=`
- `foundry.data.operators.ForcedDeletion`

## Vérifications manuelles

1. Ouvrir un stockage avec une session active éditable.
2. Cliquer sur `Je le veux`, puis recliquer dessus et vérifier que le tag devient inactif.
3. Cliquer sur `Sans intérêt pour moi`, puis recliquer dessus et vérifier que le tag devient inactif.
4. Passer de `Je le veux` à `Sans intérêt pour moi`, puis l’inverse, et vérifier qu’un seul tag reste actif.
5. Fermer puis rouvrir la feuille et vérifier que le tag retiré ne réapparaît pas.
6. Inspecter ou exporter l’acteur et vérifier que la clé de l’acteur retiré n’est plus présente dans les tags de l’Item.
7. Vérifier qu’aucun warning legacy `-=...` n’apparaît.
8. Vérifier qu’aucune erreur console n’apparaît.
9. Ouvrir un marchand et vérifier qu’il n’est pas impacté.

---

# Étape 12.B — Effets visuels simples des tags actifs

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction 12.B.
- [x] Exposer le tag actif storage dans le contexte de chaque ligne Item.
- [x] Ajouter les booléens de contexte pour `want` et `ignore`.
- [x] Ajouter les classes HBS conditionnelles sur la ligne Item storage.
- [x] Ajouter un effet visuel simple pour `want`.
- [x] Ajouter un effet visuel simple pour `ignore`.
- [x] Trier localement les Items ignorés en bas de leur catégorie.
- [x] Compiler le LESS vers `css/mtt.css`.
- [x] Vérifier la syntaxe JS, le lint et l’absence de compteurs réintroduits.

## Effet ajouté pour `want`

Quand l’acteur de la session active marque un Item avec `Je le veux`, la ligne reçoit une mise en avant légère : accent vertical discret et fond très léger.

Le tag ne bloque pas l’objet, ne réserve aucune quantité et ne crée aucune décision.

## Effet ajouté pour `ignore`

Quand l’acteur de la session active marque un Item avec `Sans intérêt pour moi`, la ligne est visuellement minorée avec une opacité réduite, un léger grisage et un fond neutre.

L’Item reste visible, lisible, consultable et ses actions restent accessibles.

## Tri local des Items ignorés

Les Items marqués `ignore` par l’acteur de la session active sont triés en bas de leur catégorie uniquement pour le rendu courant.

Ce tri ne modifie pas :

- les flags de catégorie ;
- l’ordre réel des Items ;
- le sort Foundry ;
- les catégories globales ;
- les données persistées du stockage.

## Non implémenté volontairement

- Aucune réservation technique.
- Aucun blocage d’objet.
- Aucune décision commune.
- Aucun vote collectif.
- Aucun compteur de tag.
- Aucun déplacement global d’objet.
- Aucune catégorie spéciale.
- Aucune notification MJ.
- Aucune modification des permissions, du rail, des sessions, des transferts ou du marchand.

## Vérifications manuelles

1. Ouvrir un stockage avec une session active éditable.
2. Cliquer sur `Je le veux` et vérifier que la ligne est mise en avant.
3. Recliquez sur `Je le veux` et vérifier que l’effet disparaît.
4. Cliquer sur `Sans intérêt pour moi` et vérifier que la ligne est minorée.
5. Vérifier que l’Item passe en bas de sa catégorie.
6. Recliquez sur `Sans intérêt pour moi` et vérifier que l’effet disparaît au prochain render.
7. Passer de `Je le veux` à `Sans intérêt pour moi`, puis l’inverse, et vérifier que l’effet change correctement.
8. Tester avec deux acteurs différents et vérifier que les effets restent propres à l’acteur actif.
9. Ouvrir un marchand et vérifier qu’aucun effet storage n’apparaît.
10. Vérifier qu’aucun compteur de tag n’est affiché.

---

# Étape 12.C — Base de calcul temporaire des intentions want/ignore

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction 12.C.
- [x] Ajouter un helper de lecture compatible avec les UUID imbriqués Foundry.
- [x] Ajouter un helper de calcul temporaire des intentions `want` / `ignore`.
- [x] Brancher le calcul au contexte catalogue storage.
- [x] Utiliser les sessions du stockage comme voix potentielles.
- [x] Réutiliser la quantité disponible déjà préparée pour le catalogue.
- [x] Ne pas modifier le bouton d’ajout à la session.
- [x] Ne persister aucune donnée dérivée.
- [x] Vérifier la syntaxe JS et le lint.

## Helper de lecture ajouté

Le helper `getStorageItemTagForActor` lit le tag d’un acteur avec `foundry.utils.getProperty`, ce qui conserve la compatibilité avec la structure imbriquée des UUID Foundry.

Il retourne uniquement :

- `want`
- `ignore`
- une chaîne vide

Les anciennes valeurs éventuelles comme `keep`, `sell` ou `question` sont traitées comme une absence d’avis.

## Helper de calcul ajouté

Le helper `buildStorageItemIntentState` calcule un état temporaire pour un Item à partir des tags, des sessions du stockage, de l’acteur actif et de la quantité disponible.

Il prépare notamment :

- `actorVotes`
- `wantCount`
- `ignoreCount`
- `missingCount`
- `totalVotingSlots`
- `allAnswered`
- `canResolveWithoutConflict`
- `activeActorCanClaimOne`

## Règle des sessions comptées

Chaque session storage possédant un `actorUuid` compte comme une voix potentielle.

Les acteurs ne sont pas dédupliqués, et les sessions ne sont pas filtrées selon leur statut dans cette étape.

## Règle de non-persistance

Le calcul est reconstruit au rendu et n’est jamais écrit dans les flags.

Aucune donnée dérivée de type `intentState`, `voteState`, `claims`, `allocations`, décision ou historique de vote n’a été ajoutée.

## Non implémenté volontairement

- Aucun blocage de bouton.
- Aucune autorisation conditionnelle d’ajout.
- Aucune réservation technique.
- Aucune modification de quantité.
- Aucune décision commune.
- Aucun journal.
- Aucune notification.
- Aucun nouveau tag.
- Aucun compteur visible.
- Aucune modification du rail, des sessions, des transferts ou du marchand.

## Vérifications manuelles

1. Ouvrir un stockage avec plusieurs sessions ayant un `actorUuid`.
2. Mettre `want` sur un Item avec un acteur.
3. Mettre `ignore` sur le même Item avec un autre acteur.
4. Vérifier par inspection de contexte que `wantCount`, `ignoreCount` et `missingCount` correspondent aux sessions.
5. Vérifier qu’un même acteur présent dans deux sessions compte deux fois.
6. Vérifier que `allAnswered` devient vrai seulement si toutes les sessions ont `want` ou `ignore`.
7. Vérifier que `canResolveWithoutConflict` devient vrai seulement si la quantité disponible couvre les `want`.
8. Exporter ou inspecter l’acteur et vérifier qu’aucune donnée dérivée n’a été écrite.
9. Vérifier que les boutons want/ignore, les effets visuels de 12.B et la désélection continuent de fonctionner.
10. Ouvrir un marchand et vérifier qu’il n’est pas impacté.

---

# Étape 12.D — Blocage d’ajout selon les intentions want/ignore

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction 12.D.
- [x] Ajouter une règle temporaire de blocage d’ajout fondée sur l’état d’intention 12.C.
- [x] Ajouter les raisons de blocage FR/EN.
- [x] Marquer visuellement le bouton d’ajout en danger pour les joueurs bloqués.
- [x] Garder le bouton visible et cliquable pour afficher un message clair.
- [x] Recalculer le blocage côté handler avant l’ajout réel.
- [x] Conserver un bypass complet pour le MJ.
- [x] Compiler le LESS vers `css/mtt.css`.
- [x] Vérifier la syntaxe JS, les JSON et le lint.

## Règle de blocage ajoutée

Un Item storage avec au moins un `want` devient soumis à décision pour les joueurs.

Le joueur est bloqué si l’acteur actif ne peut pas prendre un exemplaire sans conflit. Il n’est pas bloqué si tous les acteurs ayant une session ont répondu, si la quantité disponible couvre les `want`, et si son acteur actif a lui-même choisi `Je le veux`.

## Raisons de blocage ajoutées

- L’acteur actif a choisi `Sans intérêt pour moi`.
- L’acteur actif n’a pas choisi `Je le veux` alors que l’objet est demandé.
- Tous les acteurs activés n’ont pas encore donné leur avis.
- La quantité disponible ne couvre pas tous les acteurs qui veulent l’objet.
- Raison générique.

## Bypass MJ

Le MJ n’est jamais bloqué par cette règle temporaire et peut toujours ajouter l’Item à la session.

## Règle de non-persistance

Le blocage par intentions reste un calcul temporaire.

Aucun flag de blocage, décision, claim, allocation ou raison persistée n’a été ajouté. Les seuls flags concernés restent les tags existants et les statuts storage déjà présents.

## Non implémenté volontairement

- Aucune décision persistante.
- Aucune répartition avancée.
- Aucune limitation à un exemplaire par acteur.
- Aucune réservation automatique.
- Aucun historique ou journal.
- Aucune modification des transferts.
- Aucune modification de la logique de sélection/désélection des tags.
- Aucune modification du marchand.

## Vérifications manuelles

1. Ouvrir un stockage avec une session active éditable.
2. Vérifier qu’un Item sans `want` reste ajoutable normalement.
3. Mettre `want` avec un acteur et laisser un autre acteur sans avis.
4. Vérifier que le bouton d’ajout est en danger pour un joueur non MJ.
5. Cliquer et vérifier qu’un warning indique que tous les acteurs doivent donner leur avis.
6. Mettre `ignore` avec l’acteur actif et vérifier que le warning demande de changer le tag.
7. Créer un cas où tous les acteurs ont répondu et où la quantité disponible couvre les `want`.
8. Vérifier qu’un acteur actif ayant `want` peut ajouter l’Item.
9. Créer un cas où les `want` dépassent la quantité disponible et vérifier que le warning de quantité apparaît.
10. Vérifier que le MJ peut toujours ajouter l’Item.
11. Inspecter l’acteur et vérifier qu’aucune donnée dérivée n’a été écrite.
12. Vérifier que le marchand n’est pas impacté.

---

# Étape 12.E — Récupération automatique sans conflit

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction 12.E.
- [x] Ajouter la détection temporaire “déjà récupéré” depuis la session active.
- [x] Adapter la règle de blocage pour utiliser `activeActorCanStillClaimOne`.
- [x] Ajouter la raison de blocage “déjà récupéré” FR/EN.
- [x] Brancher la détection au contexte catalogue storage.
- [x] Recalculer la même règle côté handler avant l’ajout réel.
- [x] Conserver le bypass MJ.
- [x] Ne persister aucune donnée de répartition.
- [x] Vérifier la syntaxe JS, les JSON et le lint.

## Règle d’autorisation ajoutée

Quand un Item a au moins un `want`, un acteur joueur peut ajouter 1 exemplaire à sa session seulement si la situation est résolue sans conflit et si son acteur actif a lui-même choisi `Je le veux`.

La règle reste :

- tous les acteurs ayant une session doivent avoir répondu ;
- la quantité disponible doit couvrir les `want` ;
- l’acteur actif doit être en `want` ;
- l’acteur actif ne doit pas déjà avoir récupéré cet Item dans sa session.

## Détection “déjà récupéré”

La détection se fait temporairement depuis `buyerItems` de la session active.

L’identité existante réutilisée est celle des lignes de session :

- `type: "product"` ;
- `sourceId` égal à l’id du produit storage ;
- `sourceUuid` en secours si disponible.

## Limitation à 1 exemplaire par acteur want

Un acteur `want` autorisé peut ajouter l’Item une première fois. Si l’Item est déjà présent dans `buyerItems` de sa session active, un second ajout joueur est bloqué avec un warning dédié.

Le MJ conserve la possibilité d’outrepasser.

## Bypass MJ

Le MJ n’est pas bloqué par la règle de récupération automatique et peut toujours ajouter l’Item, y compris dans les cas de reliquat ou de conflit.

## Règle de non-persistance

Aucune allocation, décision, résolution ou liste d’acteurs autorisés n’est écrite dans les flags.

Le droit à récupérer et le fait d’avoir déjà récupéré sont recalculés depuis les tags, les sessions et les `buyerItems`.

## Non implémenté volontairement

- Aucune allocation persistante.
- Aucune décision persistante.
- Aucune distribution automatique de reliquat.
- Aucune déduplication des acteurs.
- Aucun filtrage par statut de session.
- Aucun journal de décision.
- Aucune modification des tags eux-mêmes.
- Aucune modification des transferts.
- Aucune modification du marchand.

## Vérifications manuelles

1. Ouvrir un stockage avec plusieurs sessions ayant un acteur.
2. Utiliser un Item avec quantité disponible suffisante.
3. Mettre un acteur en `want` et les autres en `ignore`.
4. Vérifier que l’acteur `want` peut ajouter 1 exemplaire à sa session.
5. Cliquer une deuxième fois avec le même acteur et vérifier que l’ajout est refusé.
6. Vérifier que le warning indique que l’acteur a déjà récupéré son exemplaire.
7. Tester deux acteurs en `want` avec une quantité disponible suffisante et vérifier que chacun peut prendre 1 exemplaire.
8. Vérifier qu’un acteur `ignore` ou sans tag reste bloqué.
9. Vérifier que le MJ peut toujours ajouter l’Item.
10. Inspecter l’acteur et vérifier qu’aucune donnée dérivée de répartition n’a été écrite.
11. Vérifier que les effets visuels et le blocage de 12.D restent fonctionnels.
12. Ouvrir un marchand et vérifier qu’il n’est pas impacté.

---

# Correction commune — Sessions multiples entre feuilles MTT

## Todo

- [x] Lire `agents.md` et l’instruction de correction commune.
- [x] Supprimer la recherche de session ouverte sur les autres feuilles MTT.
- [x] Simplifier `#createSessionForClient`.
- [x] Conserver la récupération de session existante sur la même feuille.
- [x] Nettoyer le clic sur le rail acteur.
- [x] Supprimer les traductions devenues inutiles.
- [x] Vérifier la syntaxe JS et la validité des JSON.

## Résumé

Le blocage historique qui empêchait un même acteur d’ouvrir des sessions sur plusieurs feuilles MTT a été retiré de la feuille commune.

La création de session vérifie toujours la feuille courante : si une session existe déjà pour cet acteur sur cette même feuille, elle est sélectionnée au lieu d’être dupliquée.

Les validations de transaction, de stock, de quantité, de transfert, de livraison et de paiement n’ont pas été modifiées.

## Fichiers modifiés

- `module/applications/sheets/merchant-sheet.mjs`
- `lang/fr.json`
- `lang/en.json`
- `rapport-étapes-stockage.md`

## Non créé volontairement

- Aucun setting Foundry.
- Aucune option de configuration MTT.
- Aucun helper de session multiple.
- Aucune logique différente marchand / stockage.
- Aucun verrouillage supplémentaire.
- Aucune migration.

## Vérifications manuelles simples

1. Ouvrir deux marchands et créer une session pour le même acteur sur chacun.
2. Ouvrir deux stockages et créer une session pour le même acteur sur chacun.
3. Ouvrir un marchand et un stockage puis créer une session pour le même acteur sur les deux.
4. Sur une même feuille MTT, cliquer plusieurs fois sur le même acteur et vérifier que la session existante est récupérée.
5. Tenter une validation avec quantité incohérente et vérifier que les contrôles de stock restent actifs.

---

# Étape 3.1.A — Responsables du marchandage stockage

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction 3.1.A.
- [x] Ajouter `tradeWithMerchant.responsibleActorUuids` aux données storage.
- [x] Normaliser la liste des responsables sans valider l’existence des acteurs.
- [x] Ajouter des helpers storage dédiés au marchandage via marchand.
- [x] Préparer le contexte de configuration depuis les acteurs du rail stockage.
- [x] Ajouter l’action de sélection/désélection des responsables.
- [x] Remplacer le placeholder de configuration stockage par une section fonctionnelle.
- [x] Ajouter les styles et traductions FR/EN.
- [x] Compiler le CSS et vérifier la syntaxe.

## Résumé

Les données stockage contiennent maintenant `tradeWithMerchant.responsibleActorUuids`.

La configuration du stockage affiche les acteurs liés au stockage et permet de sélectionner ceux qui pourront, dans une étape suivante, marchander au nom du stockage chez un marchand.

La sélection est persistée dans les flags du stockage et l’état responsable est visible par une bordure et un halo.

## Fichiers modifiés

- `module/documents/storage-flags.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `templates/actors/parts/storage-configuration.hbs`
- `styles/applications/merchant-catalog.less`
- `css/mtt.css`
- `lang/fr.json`
- `lang/en.json`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucune logique du rail marchand.
- Aucun droit de consultation ou d’interaction marchand pour un stockage.
- Aucun flux d’achat/vente.
- Aucun drop d’Item storage dans une session marchand.
- Aucune livraison d’achat marchand dans le stockage.
- Aucune validation croisée marchand / stockage.
- Aucune option globale.
- Aucun champ `commerce` ou `tradeWithShop`.

## Vérifications manuelles simples

1. Ouvrir un stockage avec au moins un acteur dans son rail.
2. Ouvrir l’onglet Configuration.
3. Vérifier que les acteurs du rail apparaissent en cards carrées.
4. Cliquer sur un acteur et vérifier que la card devient responsable.
5. Fermer / rouvrir la feuille et vérifier que la sélection est persistée.
6. Cliquer à nouveau pour retirer le statut responsable.
7. Ouvrir un marchand et vérifier que le rail marchand et les transactions n’ont pas changé.

---

# Correction 3.1.A.1 — Responsables storage : acteurs dynamiques et retrait rail

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction de correction 3.1.A.1.
- [x] Remplacer la source de la liste des responsables par la source préparée du rail commun.
- [x] Inclure les acteurs dynamiques liés aux joueurs.
- [x] Dédupliquer les responsables proposés par `actorUuid`.
- [x] Conserver l’écriture uniquement dans `storage.tradeWithMerchant.responsibleActorUuids`.
- [x] Nettoyer `responsibleActorUuids` lors du retrait explicite d’un acteur du rail storage.
- [x] Vérifier la syntaxe et le lint ciblé.

## Résumé

La configuration des responsables utilise maintenant la même préparation d’acteurs que le rail storage.

Les acteurs persistés dans `storage.access.actors` et les acteurs dynamiques liés aux joueurs peuvent donc être proposés comme responsables du marchandage.

Lorsqu’un acteur est retiré de la feuille storage via le menu du rail, son UUID est aussi retiré de `tradeWithMerchant.responsibleActorUuids` dans la même mise à jour storage.

## Fichiers modifiés

- `module/applications/sheets/merchant-sheet.mjs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucune logique du rail marchand.
- Aucun droit d’interaction marchand pour un stockage.
- Aucun flux d’achat/vente.
- Aucun nettoyage automatique des responsables au rendu.
- Aucun forçage des acteurs dynamiques dans `storage.access.actors`.
- Aucun template ou style.

## Vérifications manuelles simples

1. Ouvrir un stockage avec un personnage joueur visible dynamiquement dans le rail.
2. Vérifier que ce personnage apparaît dans les responsables du marchandage.
3. Sélectionner ce personnage comme responsable et vérifier que la sélection persiste après rendu.
4. Ajouter un acteur manuel au rail storage.
5. Le sélectionner comme responsable.
6. Le retirer avec le menu “Retirer l’acteur de la feuille”.
7. Ajouter à nouveau le même acteur et vérifier qu’il n’est plus responsable.
8. Vérifier que les autres responsables restent sélectionnés.
9. Ouvrir un marchand et vérifier que son comportement n’a pas changé.

---

# Étape 3.1.B — Lecture des droits storage depuis le rail marchand

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction 3.1.B.
- [x] Ajouter les helpers de lecture storage pour les acteurs du rail et les responsables.
- [x] Ajouter la lecture des acteurs dynamiques du rail storage via le pipeline commun.
- [x] Ajouter les helpers de droits utilisateur côté feuille marchand.
- [x] Adapter `#getSessionActorAccess` pour les sessions dont l’acteur est un stockage MTT.
- [x] Conserver le comportement des acteurs classiques du rail marchand.
- [x] Vérifier la syntaxe et le lint ciblé.

## Résumé

La feuille marchand sait maintenant reconnaître qu’une session concerne un stockage MTT.

Pour une session marchand liée à un stockage, la consultation et la sélection utilisent les acteurs présents dans le rail du stockage, y compris les acteurs dynamiques liés aux joueurs.

L’interaction avec cette session utilise les acteurs listés dans `storage.tradeWithMerchant.responsibleActorUuids`.

## Helpers ajoutés ou réutilisés

- `getStorageAccessActorUuids(actor)`
- `canActorTradeWithMerchantAsStorage(storageActor, actorUuid)`
- `getStorageTradeResponsibleActorUuids(actor)`
- `#canUserViewStorageMerchantSession(storageActor, user)`
- `#canUserTradeWithMerchantAsStorage(storageActor, user)`

## Fichiers modifiés

- `module/documents/storage-flags.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucun flux d’achat.
- Aucun flux de vente.
- Aucun drop d’Item storage dans une session marchand.
- Aucune livraison d’achat marchand dans le stockage.
- Aucune validation croisée marchand / stockage.
- Aucun handler séparé pour les cards storage du rail marchand.
- Aucun template ou style.
- Aucune option globale.

## Vérifications manuelles simples

1. Ajouter un stockage au rail d’un marchand.
2. Ouvrir une session marchand pour ce stockage côté MJ.
3. Vérifier qu’un joueur lié à un acteur du rail storage peut voir et sélectionner la session.
4. Vérifier que ce joueur ne peut pas interagir si son acteur n’est pas responsable.
5. Définir cet acteur comme responsable dans la configuration du stockage.
6. Vérifier que ce joueur peut maintenant interagir avec la session.
7. Retirer cet acteur des responsables et vérifier qu’il redevient simple consultant.
8. Vérifier qu’un acteur classique du rail marchand conserve le comportement habituel.
9. Vérifier que le MJ peut toujours tout faire.

---

# Correction commune — Suppression de l’ajout automatique des personnages joueurs au rail

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction de correction commune.
- [x] Supprimer l’injection automatique de `game.users[].character` dans `prepareAccessClients`.
- [x] Supprimer le paramètre `defaultPlayerAuthorization`.
- [x] Nettoyer les appels à `prepareAccessClients`.
- [x] Corriger la lecture des acteurs pouvant voir une session marchand d’un stockage.
- [x] Conserver les helpers de contrôle d’acteur.
- [x] Vérifier la syntaxe et le lint ciblé.

## Résumé

Le rail MTT ne crée plus d’entrée automatique depuis les personnages liés aux joueurs.

Un acteur apparaît désormais dans le rail seulement s’il est présent dans les flags du rail ou ajouté explicitement ensuite.

La lecture des acteurs pouvant voir la session marchand d’un stockage repose uniquement sur `storage.access.actors`.

## Fichiers modifiés

- `module/applications/sheets/merchant-trade.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucune migration des rails existants.
- Aucun changement des permissions marchand configurables.
- Aucun changement des droits Foundry.
- Aucun changement des helpers de contrôle d’acteur.
- Aucun template ou style.
- Aucun flux d’achat, vente, drop, livraison ou validation.

## Vérifications manuelles simples

1. Ouvrir un marchand sans acteur ajouté au rail.
2. Vérifier qu’aucun personnage joueur n’apparaît automatiquement.
3. Glisser un acteur dans le rail marchand et vérifier qu’il apparaît.
4. Ouvrir un stockage sans acteur ajouté au rail.
5. Vérifier qu’aucun personnage joueur n’apparaît automatiquement.
6. Glisser un acteur dans le rail stockage.
7. Vérifier qu’il apparaît dans le rail et dans les responsables du marchandage.
8. Vérifier qu’un acteur non ajouté au rail stockage n’apparaît pas dans les responsables.
9. Vérifier qu’un acteur non ajouté au rail stockage ne donne pas accès à une session marchand du stockage.
10. Vérifier que le MJ peut toujours tout faire.

---

# Étape 3.1.C — Card stockage sur le rail marchand

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction 3.1.C.
- [x] Identifier les cards du rail marchand qui représentent un stockage MTT.
- [x] Exposer les droits storage sur la card.
- [x] Adapter la visibilité de la card storage sans modifier les acteurs classiques.
- [x] Adapter le clic gauche existant sans créer de handler séparé.
- [x] Ajouter un tooltip simple pour les consultants non responsables.
- [x] Vérifier la syntaxe JS, les JSON et le lint ciblé.

## Résumé

Une card stockage dans le rail marchand est maintenant reconnue comme stockage MTT.

La card est visible si l’utilisateur peut voir la session marchand du stockage, et elle reste invisible pour les utilisateurs qui ne sont pas liés au rail du stockage.

La distinction consultation / interaction est conservée : un consultant peut sélectionner une session existante, tandis que seuls les responsables du marchandage ou le MJ peuvent créer ou modifier la session.

## Fichiers modifiés

- `module/applications/sheets/merchant-sheet.mjs`
- `lang/fr.json`
- `lang/en.json`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucun flux d’achat.
- Aucun flux de vente.
- Aucun drop d’Item storage dans une session marchand.
- Aucune livraison d’achat marchand dans le stockage.
- Aucune validation croisée marchand / stockage.
- Aucun handler séparé pour les cards storage.
- Aucun template ou style.
- Aucune monnaie, aucun journal, aucun pourcentage personnalisé.

## Vérifications manuelles simples

1. Ajouter un stockage au rail d’un marchand.
2. Vérifier côté MJ que la card stockage permet de créer ou sélectionner une session.
3. Vérifier qu’un joueur dont l’acteur est dans le rail du stockage peut voir et sélectionner une session existante.
4. Vérifier que ce joueur ne peut pas créer ou modifier la session s’il n’est pas responsable.
5. Définir cet acteur comme responsable et vérifier qu’il peut interagir.
6. Vérifier qu’un joueur absent du rail du stockage n’a pas accès utile à la card.
7. Vérifier qu’un acteur classique du rail marchand fonctionne comme avant.
8. Vérifier qu’aucun acteur joueur n’est ajouté automatiquement au rail.

---

# Correction 3.1.C — Retour au rail commun pour les cards storage

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction de correction 3.1.C.
- [x] Supprimer le filtre de visibilité spécifique aux cards storage.
- [x] Restaurer `canSeeCard` sur la règle commune du rail.
- [x] Restaurer `canClickCard` sur la règle commune du rail.
- [x] Supprimer les propriétés de contexte storage inutiles sur les cards.
- [x] Supprimer le tooltip spécial ajouté pour les consultants non responsables.
- [x] Conserver la suppression de l’ajout automatique des personnages joueurs au rail.
- [x] Vérifier la syntaxe, les JSON et le lint ciblé.

## Résumé

Le rail marchand utilise de nouveau la même logique de visibilité pour toutes les cards, qu’elles représentent un acteur classique ou un stockage MTT.

Les droits de session restent centralisés dans `#getSessionActorAccess`.

Pour un stockage, seule l’interaction peut être limitée par les responsables du marchandage ; la consultation et la sélection reviennent à la logique commune du rail.

## Code 3.1.C supprimé

- Filtre `canSeeCard` spécifique aux stockages.
- Branche `canClickCard` spécifique aux stockages.
- Propriétés `isStorageClient`, `canViewStorageMerchantSession` et `canTradeWithMerchantAsStorage` dans le contexte des cards.
- Tooltip `responsibleOnlyTooltip` et sa clé FR/EN.
- Helpers de consultation storage devenus inutiles pour le rail commun.

## Fichiers modifiés

- `module/applications/sheets/merchant-sheet.mjs`
- `lang/fr.json`
- `lang/en.json`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucune réintroduction de l’ajout automatique des personnages joueurs au rail.
- Aucun changement du HBS du rail.
- Aucun CSS.
- Aucun flux d’achat, vente, drop, livraison ou validation.
- Aucune permission storage supplémentaire.
- Aucun handler spécifique pour les cards storage.

## Vérifications manuelles simples

1. Ouvrir un marchand avec une card acteur classique et une card stockage.
2. Vérifier que la permission “Voir les autres acteurs du rail” s’applique aux deux.
3. Vérifier que la card stockage n’est pas filtrée par les responsables du stockage.
4. Vérifier qu’un responsable du stockage peut toujours interagir si les droits communs le permettent.
5. Vérifier qu’un non responsable ne peut pas modifier la session si la restriction d’interaction storage s’applique.
6. Vérifier qu’un acteur classique du rail marchand fonctionne comme avant.
7. Vérifier que les personnages liés aux joueurs ne sont toujours pas ajoutés automatiquement au rail.
8. Vérifier que le MJ peut tout voir et tout faire.

---

# Correction 3.1.C.2 — Droits responsables storage sur session marchand

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction de correction 3.1.C.2.
- [x] Vérifier que le rail commun reste inchangé dans `#prepareAccessContext()`.
- [x] Vérifier que `prepareAccessClients()` ne réintroduit aucun personnage joueur automatique.
- [x] Réutiliser `getStorageAccessActorUuids()` pour la consultation storage.
- [x] Conserver `#canUserTradeWithMerchantAsStorage()` pour l’interaction responsable.
- [x] Corriger uniquement la branche storage de `#getSessionActorAccess()`.
- [x] Vérifier la syntaxe, le lint ciblé et le format.

## Bloc corrigé

`#getSessionActorAccess()` sépare maintenant les droits storage :

- consultation / sélection : droits communs ou possession d’un acteur explicitement présent dans le rail du stockage ;
- interaction : droits communs ou possession d’un acteur responsable du marchandage du stockage.

La branche storage utilise donc l’addition des sources de droits :

```js
canViewOtherSession: baseAccess.canViewOtherSession || canViewStorageSession,
canSelectOtherSession: baseAccess.canSelectOtherSession || canViewStorageSession,
canInteractWithOtherSession: baseAccess.canInteractWithOtherSession || canTradeAsStorage
```

## Conservé volontairement

- Le rail marchand reste commun : aucune branche `isStorageClient` n’a été ajoutée dans `#prepareAccessContext()`.
- La card stockage reste visible selon les règles communes du rail marchand.
- `prepareAccessClients()` ne réintroduit ni `game.users`, ni `user.character`, ni `defaultPlayerAuthorization`.
- Les responsables storage ne doivent plus être propriétaires de l’acteur stockage pour interagir.

## Fichiers modifiés

- `module/applications/sheets/merchant-sheet.mjs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucun flux d’achat, vente, drop, livraison ou validation.
- Aucun changement de monnaie, journal, tags, catégories ou transferts storage.
- Aucun template.
- Aucun style.
- Aucune nouvelle permission.
- Aucun helper `storage-*` dupliqué.

## Vérifications manuelles simples

1. Ajouter un stockage au rail d’un marchand.
2. Vérifier que sa card reste visible selon la permission commune du rail.
3. Ajouter des acteurs explicitement dans le rail du stockage.
4. Vérifier qu’un joueur possédant un acteur du rail storage peut voir et sélectionner la session storage chez le marchand.
5. Vérifier qu’il ne peut pas interagir s’il n’est pas responsable.
6. Marquer cet acteur comme responsable du marchandage.
7. Vérifier qu’il peut alors interagir sans être propriétaire de l’acteur stockage.
8. Vérifier qu’un acteur absent du rail du stockage ne gagne aucun accès.
9. Vérifier qu’un client marchand classique fonctionne comme avant.
10. Vérifier qu’aucun personnage joueur n’est ajouté automatiquement au rail.

---

# Étape 3.1.D — Achat marchand livré dans le stockage

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction de l’étape 3.1.D.
- [x] Repérer la livraison actuelle des produits achetés dans `executeSessionItemTransfers()`.
- [x] Réutiliser les helpers catalogue existants pour ajouter ou fusionner les produits.
- [x] Détecter le cas où le client de session est un stockage MTT.
- [x] Exempter le stockage de la simulation de livraison acteur classique.
- [x] Livrer les produits achetés dans le contenu MTT du stockage.
- [x] Conserver la décrémentation du stock marchand.
- [x] Ne pas modifier les services, la monnaie, les ventes depuis stockage, le rail ou les droits.
- [x] Vérifier la syntaxe, le lint ciblé et le format.

## Résumé

La validation d’une session marchand distingue maintenant le type du client réel de la session.

Quand le client est un acteur classique, la livraison existante vers l’inventaire système reste utilisée. Quand le client est un stockage MTT, les produits achetés sont ajoutés ou fusionnés dans le contenu MTT du stockage, c’est-à-dire dans ses Items embedded avec les flags produit MTT.

## Détection client storage

La détection se fait dans `merchant-trade.mjs` avec `isMTTStorage(clientActor)`.

Le marchand vendeur reste `actor`. Le stockage destinataire est uniquement `clientActor`.

## Livraison / fusion storage

La livraison storage utilise un helper local ciblé :

- fusion par `sourceUuid` avec `findMergeableMerchantItemBySourceUuid()` ;
- lecture de quantité depuis les flags produit MTT avec fallback à `0` ;
- mise à jour via `updateCatalogProduct()` si une ligne compatible existe ;
- création via `buildCatalogProductFromItem()` et `addCatalogProduct()` si aucune ligne compatible n’existe ;
- quantité livrée réelle avec `quantityToDeliver`, y compris pour les lots.

Le texte commercial de livraison n’est pas ajouté au stockage.

## Fichiers modifiés

- `module/applications/sheets/merchant-trade.mjs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucun changement du rail.
- Aucun changement des droits ou responsables du marchandage.
- Aucun changement des services.
- Aucun changement des ventes depuis stockage vers marchand.
- Aucun changement de monnaie, pourcentages ou trésorerie.
- Aucun template.
- Aucun style.
- Aucun nouveau helper exporté.

## Vérifications manuelles simples

1. Ajouter un stockage au rail d’un marchand.
2. Ouvrir une session marchand pour ce stockage.
3. Acheter un produit puis valider la transaction.
4. Vérifier que le produit apparaît dans le contenu MTT du stockage.
5. Vérifier qu’il n’est pas livré comme simple Item système hors logique MTT.
6. Acheter de nouveau le même produit et vérifier la fusion de quantité.
7. Vérifier que le stock marchand diminue comme avant.
8. Vérifier qu’un acteur classique reçoit encore les achats dans son inventaire système.
9. Vérifier qu’un service acheté ne crée pas d’Item dans le stockage.
10. Vérifier que la monnaie du stockage continue de fonctionner comme avant.

---

# Correction 3.1.D.1 — Socket marchand pour responsable storage

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction de correction 3.1.D.1.
- [x] Identifier la validation socket qui refuse les sessions modifiées.
- [x] Réutiliser les helpers storage existants pour les responsables du marchandage.
- [x] Ajouter une vérification locale de possession d’acteur responsable.
- [x] Autoriser la modification socket d’une session storage par un joueur responsable.
- [x] Conserver la sécurité existante pour les sessions d’acteurs classiques.
- [x] Ne pas modifier le rail, les droits de visibilité, la livraison ou la fusion.
- [x] Vérifier la syntaxe, le lint ciblé et le format.

## Résumé

La validation socket accepte maintenant une modification de session marchand lorsque le client de la session est un stockage MTT et que l’utilisateur demandeur possède un acteur marqué responsable du marchandage dans ce stockage.

Les acteurs classiques conservent la règle existante : le joueur doit posséder l’acteur de session, sauf si le MJ ou un gestionnaire de la feuille marchand traite la demande.

## Fichier modifié

- `module/applications/sheets/merchant-session-socket.mjs`
- `rapport-étapes-stockage.md`

## Conservé volontairement

- Aucun changement du rail marchand.
- Aucun changement de `#prepareAccessContext()`.
- Aucun changement de `#getSessionActorAccess()`.
- Aucun changement de `prepareAccessClients()`.
- Aucun changement de livraison ou fusion des produits.
- Aucun changement de monnaie ou pourcentages personnalisés.
- Aucun template, style ou fichier de langue.

## Vérifications manuelles simples

1. Ajouter un stockage au rail d’un marchand.
2. Marquer un acteur comme responsable du marchandage du stockage.
3. Avec un joueur propriétaire de cet acteur, ajouter un produit à la session marchand du stockage.
4. Modifier la quantité de cette ligne et vérifier que le socket accepte la demande.
5. Vérifier qu’un joueur non responsable ne peut pas modifier cette session.
6. Vérifier qu’un acteur classique client du marchand fonctionne comme avant.
7. Vérifier que le MJ conserve tous les droits.

---

# Correction 3.1.D.2 — Livraison storage avec règles communes de fusion

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction de correction 3.1.D.2.
- [x] Identifier la fusion directe par `sourceUuid` dans la livraison storage.
- [x] Supprimer la logique storage spécifique de fusion par `findMergeableMerchantItemBySourceUuid()`.
- [x] Brancher le pré-vol storage sur `simulatePurchasedItemDeliveryToActor()`.
- [x] Réutiliser les décisions communes `simulation.updated` et `simulation.created`.
- [x] Écrire les quantités et flags comme la livraison acteur classique.
- [x] Restaurer l’écriture des informations de transaction et secrets sur les nouvelles lignes storage.
- [x] Ne pas modifier le rail, les droits, le socket, les ventes, les services, la monnaie ou le journal.
- [x] Vérifier la syntaxe, le lint ciblé et le format.

## Résumé

La livraison des produits achetés par un stockage utilise maintenant les mêmes règles de fusion et de création que la livraison vers un acteur classique.

La décision de fusion passe par `simulatePurchasedItemDeliveryToActor()`, donc par les règles communes autour de `getDeliveredItemMergeMode()`.

## Correction de fusion

La livraison storage n’utilise plus de fusion directe par `sourceUuid`.

Les piles existantes sont mises à jour uniquement si la simulation commune les accepte. Les nouvelles lignes sont créées depuis `deliveredItemData`, avec la quantité au chemin configuré et le bloc de description de livraison si l’option du module est active.

## Fichiers modifiés

- `module/applications/sheets/merchant-trade.mjs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucun changement du rail marchand.
- Aucun changement des droits ou responsables du marchandage.
- Aucun changement du socket.
- Aucun changement des ventes depuis stockage.
- Aucun changement des services.
- Aucun changement de monnaie ou pourcentages personnalisés.
- Aucun changement du journal.
- Aucun template, style ou fichier de langue.

## Vérifications manuelles simples

1. Acheter avec un stockage une version modifiée d’un objet déjà présent.
2. Vérifier que l’objet modifié ne fusionne pas si les règles communes le refusent.
3. Acheter une deuxième fois un objet identique et vérifier la fusion si elle est autorisée.
4. Acheter un produit avec informations secrètes et vérifier qu’il ne fusionne pas avec une ligne existante.
5. Vérifier que le bloc visible de transaction est écrit si l’option est active.
6. Vérifier que le bloc secret est écrit dans le chemin secret configuré.
7. Vérifier qu’un acteur classique acheteur fonctionne toujours comme avant.
8. Vérifier qu’un service acheté ne crée toujours pas d’Item.

---

# Correction 3.1.D.3 — Livraison marchand vers stockage : décision commune, écriture storage

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction de correction 3.1.D.3.
- [x] Conserver la branche de destination storage dans `executeSessionItemTransfers()`.
- [x] Garder la décision de fusion sur la simulation commune.
- [x] Adapter la simulation commune pour lire la quantité storage depuis les flags produit MTT.
- [x] Écrire les mises à jour storage via les flags produit MTT.
- [x] Créer les nouvelles lignes storage via `addCatalogProduct()`.
- [x] Marquer les lignes storage livrées depuis un produit modifié ou secret comme non fusionnables.
- [x] Conserver l’écriture des informations de transaction et secrets dans l’Item livré.
- [x] Ne pas modifier le rail, les droits, le socket, les responsables, les services, les ventes, la monnaie ou le journal.
- [x] Vérifier la syntaxe, le lint ciblé et le format.

## Résumé

La livraison marchand vers stockage sépare maintenant clairement deux responsabilités :

- décision : les règles communes de fusion restent utilisées via `simulatePurchasedItemDeliveryToActor()`;
- écriture : si la destination est un stockage MTT, les quantités et la création passent par les flags produit MTT du contenu storage.

## Écriture storage

Les lignes existantes du stockage sont mises à jour avec `updateCatalogProduct(storageActor, ..., { quantity })`.

Les nouvelles lignes sont créées avec `addCatalogProduct()`, avec `product.enabled = true`, `product.quantity`, `product.sourceUuid` et le marquage `isCommerciallyModified` quand le produit livré vient d’un produit modifié ou secret.

Les secrets commerciaux ne sont pas recopiés comme flags actifs du produit livré. Ils restent écrits dans l’Item livré via le bloc de description commun.

## Fichiers modifiés

- `module/applications/sheets/merchant-trade.mjs`
- `module/applications/sheets/merchant-utils.mjs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucun changement du rail marchand.
- Aucun changement des droits ou responsables du marchandage.
- Aucun changement du socket.
- Aucun changement des ventes depuis stockage.
- Aucun changement des services.
- Aucun changement de monnaie ou pourcentages personnalisés.
- Aucun changement du journal.
- Aucun template, style ou fichier de langue.

## Vérifications manuelles simples

1. Avec un stockage vide, acheter un produit simple chez un marchand.
2. Vérifier que le produit apparaît comme ligne MTT du stockage.
3. Acheter à nouveau le même produit simple et vérifier que la quantité MTT augmente.
4. Acheter une version modifiée d’un objet déjà présent et vérifier qu’elle crée une nouvelle ligne.
5. Acheter un produit avec informations secrètes et vérifier qu’il crée une nouvelle ligne.
6. Vérifier que les informations de transaction et secrets sont écrites dans l’Item livré.
7. Vérifier qu’un acteur classique acheteur fonctionne toujours comme avant.
8. Vérifier que le stock marchand, la monnaie et le journal restent corrects.

---

# Correction 3.1.D.4 — Destination MTT pour livraison marchand

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction de correction 3.1.D.4.
- [x] Ajouter `getMTTEntityType` sans créer de helper parallèle.
- [x] Remplacer les variables de destination `clientIsStorage` par `clientIsMtt`.
- [x] Renommer la livraison storage en livraison vers destination MTT.
- [x] Conserver la branche destination MTT dans `executeSessionItemTransfers()`.
- [x] Garder les règles communes de fusion via `simulatePurchasedItemDeliveryToActor()`.
- [x] Ignorer la quantité max système uniquement pour `quantityMode: "productFlag"`.
- [x] Ne pas modifier la logique `warningGM` d’un stockage source.
- [x] Ne pas modifier les flags complets, le rail, les droits, le socket, les services, les ventes, la monnaie ou le journal.
- [x] Vérifier la syntaxe, le lint ciblé et le format.

## Résumé

La livraison d’un achat marchand ne parle plus de destination storage dans les variables et helpers de destination.

Le flux actuel `shop -> storage` utilise maintenant une base plus générique `destination MTT`, tout en conservant la distinction entre écriture classique d’acteur et écriture MTT par flags produit.

## Destination MTT

Les destinations MTT sont détectées localement avec `getMTTEntityType(clientActor)` et `clientIsMtt`.

Quand `clientIsMtt` est vrai, la simulation lit les quantités dans `flags.mtt-merchants.product.quantity` et ignore la quantité max système pendant le calcul de pile. L’écriture reste faite avec `updateCatalogProduct()` ou `addCatalogProduct()`.

## Fichiers modifiés

- `module/applications/sheets/merchant-trade.mjs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucun changement des flags complets conservés sur livraison.
- Aucun changement du rail marchand.
- Aucun changement des droits ou responsables du marchandage.
- Aucun changement du socket.
- Aucun changement des ventes depuis stockage.
- Aucun changement des services.
- Aucun changement de monnaie ou pourcentages personnalisés.
- Aucun changement du journal.
- Aucun template, style ou fichier de langue.

## Vérifications manuelles simples

1. Acheter 3 objets simples vers un stockage et vérifier une seule ligne MTT quantité 3.
2. Acheter encore 2 objets identiques et vérifier que la même ligne passe à quantité 5.
3. Vérifier que l’Item embedded conserve sa quantité max système initiale.
4. Acheter le même objet vers un acteur classique et vérifier que la quantité max système reste respectée.
5. Acheter un objet modifié ou secret vers un stockage et vérifier qu’il ne fusionne pas avec une ligne normale.
6. Vérifier que les informations de transaction et secrets continuent d’être écrites.
7. Vérifier que le bloc `warningGM` d’un stockage source n’a pas changé.

---

# Correction 3.1.E — Identité commerciale commune des transferts

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction de correction 3.1.E.
- [x] Adapter la fusion stricte commune sans créer de helper storage/shop parallèle.
- [x] Ajouter les données techniques temporaires `sourceItemUuid` et `sourceIsCommerciallyModified` aux plans de livraison.
- [x] Conserver la comparaison avant mutation de l’identité livrée.
- [x] Mettre à jour uniquement la quantité lors d’une fusion.
- [x] Appliquer la nouvelle identité commerciale seulement lors de la création d’une ligne.
- [x] Brancher les ventes vers marchand sur `getDeliveredItemMergeMode()`.
- [x] Ne pas modifier le rail, les droits, le socket, les services, la monnaie, le journal, les templates, les styles ou les langues.

## Résumé

La fusion des Items livrés repose maintenant sur la fonction commune `getDeliveredItemMergeMode()`.

Un Item non modifié conserve la règle principale `sourceUuid` entrant vers `sourceUuid` existant. La fusion stricte accepte aussi le cas utile où le `sourceUuid` entrant correspond à l’UUID réel de l’Item existant, pour permettre le retour vers l’Item qui a créé une identité commerciale.

Un Item source modifié commercialement est comparé avec son UUID réel avant toute mutation. Si une fusion existe, seule la quantité augmente. Si aucune fusion n’existe, la nouvelle ligne reçoit cet UUID réel comme nouveau `sourceUuid` et repart avec `isCommerciallyModified: false`.

## Fichiers modifiés

- `module/applications/sheets/merchant-utils.mjs`
- `module/applications/sheets/merchant-trade.mjs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucun changement du rail marchand.
- Aucun changement des droits ou responsables du marchandage.
- Aucun changement du socket.
- Aucun changement des services.
- Aucun changement de monnaie ou pourcentages personnalisés.
- Aucun changement du journal.
- Aucun template, style ou fichier de langue.

## Vérifications manuelles simples

1. Acheter un objet non modifié et vérifier que les achats suivants fusionnent par `sourceUuid`.
2. Modifier commercialement un produit marchand, l’acheter vers un stockage, puis vérifier que la ligne créée utilise l’UUID réel du produit vendeur comme `sourceUuid`.
3. Revendre cette ligne vers le marchand initial et vérifier la fusion avec l’Item existant.
4. Vérifier qu’une fusion ne change ni le nom, ni le `sourceUuid`, ni `isCommerciallyModified`, seulement la quantité.
5. Vérifier qu’un produit avec secrets commerciaux actifs ne fusionne pas.

---

# Correction 3.1.E.1 — Source UUID commercial sans acteur

## Todo

- [x] Lire `agents.md`, le rapport stockage et l’instruction de correction 3.1.E.1.
- [x] Corriger uniquement le format de `sourceItemUuid`.
- [x] Normaliser les UUID complets `Actor.xxx.Item.yyy` en `Item.yyy`.
- [x] Appliquer la normalisation dans les plans d’achat et les ventes vers marchand.
- [x] Normaliser aussi l’UUID réel de l’Item existant pendant la comparaison stricte.
- [x] Ne pas refaire la logique de fusion.
- [x] Ne pas réécrire l’identité d’une ligne fusionnée.

## Résumé

La nouvelle identité commerciale d’un Item modifié n’utilise plus l’UUID complet de l’acteur porteur.

Quand un Item commercialement modifié crée une nouvelle ligne chez le receveur, le `sourceUuid` reçu utilise maintenant le format stable `Item.<id>` au lieu de `Actor.<actorId>.Item.<id>`.

La logique de fusion existante n’a pas été refaite. La correction normalise seulement la valeur technique comparée et persistée lors d’une création.

## Fichiers modifiés

- `module/applications/sheets/merchant-utils.mjs`
- `module/applications/sheets/merchant-trade.mjs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucun changement des règles générales de fusion.
- Aucun changement des `sourceUuid` historiques.
- Aucune migration de données existantes.
- Aucune réécriture de l’identité d’une ligne fusionnée.
- Aucun changement du rail, des droits, du socket, des services, de la monnaie, du journal, des templates, des styles ou des langues.

---

# Correction permissions — Actions d’écriture réservées propriétaire/MJ

## Todo

- [x] Lire `agents.md` et l’instruction de correction permissions.
- [x] Identifier le nom réel de la permission d’ajout au rail : `canAddActorToMerchantRail`.
- [x] Centraliser les permissions réservées propriétaire/MJ dans les helpers de permissions existants.
- [x] Retirer les cases `limited` et `observer` de la configuration pour `canValidateOrRefuseSessions`.
- [x] Retirer les cases `limited` et `observer` de la configuration pour `canAddActorToMerchantRail`.
- [x] Neutraliser les anciennes valeurs enregistrées au runtime.
- [x] Conserver le comportement configurable pour `owner` et les droits complets du MJ.
- [x] Ne pas modifier les transferts, sessions, sockets, monnaie, journal ou rendu du rail.

## Résumé

Les permissions qui déclenchent des écritures Foundry restent maintenant configurables uniquement pour le profil `owner`.

Les colonnes `limited` et `observer` n’affichent plus de checkbox pour `canValidateOrRefuseSessions` et `canAddActorToMerchantRail`. La sauvegarde, l’import de configuration et la lecture runtime passent par la normalisation commune, qui force ces valeurs à `false` pour les profils non propriétaires.

Le MJ conserve tous les droits hors matrice, comme avant.

## Fichiers modifiés

- `module/documents/merchant-access.mjs`
- `module/applications/mtt-config-app.mjs`
- `templates/apps/mtt-config.hbs`
- `styles/applications/mtt-config.less`
- `css/mtt.css`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucun changement des transferts d’Items.
- Aucun changement des sessions métier.
- Aucun changement des sockets.
- Aucun changement de monnaie.
- Aucun changement du journal.
- Aucun changement du rendu des cards du rail.
- Aucune permission de remplacement ajoutée.

---

# Correction lots — Transfert MTT vers MTT en lots

## Todo

- [x] Lire `agents.md` et l’instruction de correction lots.
- [x] Identifier les calculs de `quantityToDeliver` dans `buildExecutionPreview()`.
- [x] Identifier les calculs de `quantityToDeliver` dans `buildSessionItemExecutionPlan()`.
- [x] Réutiliser la détection existante `clientIsMtt`.
- [x] Conserver le dépliage des lots vers un acteur classique.
- [x] Transférer des lots non dépliés vers une destination MTT.
- [x] Ne pas modifier la décrémentation du vendeur.
- [x] Ne pas modifier la fusion, l’identité commerciale, les sockets, le rail, les droits, le journal ou la monnaie.

## Résumé

La quantité saisie dans une session reste un nombre de lots.

Pour une destination acteur classique, le lot est toujours déplié en unités réelles avec `requestedQuantity × deliveryQuantityPerLot`.

Pour une destination MTT, le lot n’est plus déplié : la destination reçoit `requestedQuantity` lots et conserve `deliveryQuantityPerLot` sur la ligne reçue.

La quantité retirée au vendeur reste basée sur `requestedQuantity`, donc le vendeur perd bien un nombre de lots et non le nombre d’unités contenues dans ces lots.

## Fichiers modifiés

- `module/applications/sheets/merchant-trade.mjs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucune modification des fonctions de livraison.
- Aucune modification des fonctions de fusion.
- Aucune modification de l’identité commerciale.
- Aucun helper shop/storage dédié créé.
- Aucun changement des sockets, du rail, des droits, du journal ou de la monnaie.

---

# Correction transferts — Flags transférables et catégorie de base

## Todo

- [x] Lire `agents.md` et l’instruction de correction transferts.
- [x] Identifier les données de transfert construites depuis un produit MTT.
- [x] Copier exactement `ownershipLevel` dans les données transférées.
- [x] Copier exactement `isHidden` dans les données transférées.
- [x] Conserver ces flags sur une création vers acteur classique.
- [x] Conserver ces flags sur une création vers destination MTT.
- [x] Recalculer la catégorie de base côté destination MTT.
- [x] Ne pas modifier `deliveryQuantityPerLot`.
- [x] Ne pas modifier les lignes fusionnées.

## Résumé

Les transferts d’Items conservent maintenant les flags MTT `ownershipLevel` et `isHidden` lorsqu’une nouvelle ligne est créée.

Ces flags sont propagés depuis le produit MTT source vers les données de livraison, puis conservés aussi bien pour une destination acteur classique que pour une destination MTT. Le chemin acteur classique permet ainsi de garder ces informations si l’Item est revendu ou déposé plus tard vers un acteur MTT.

Lorsqu’une nouvelle ligne est créée dans un acteur MTT, sa catégorie est recalculée depuis les données système de l’Item reçu. La catégorie personnalisée du vendeur n’est pas copiée.

## Fichiers modifiés

- `module/applications/sheets/merchant-trade.mjs`
- `module/documents/merchant-products.mjs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucune modification de `deliveryQuantityPerLot`.
- Aucune modification de l’identité commerciale.
- Aucune modification des règles de fusion.
- Aucune réécriture des flags d’une ligne fusionnée.
- Aucun helper shop/storage dédié créé.
- Aucun changement des sockets, du rail, des droits, de la monnaie ou du journal.

---

# Étape — Drop MTT dans “PJ vend / donne”

## Todo

- [x] Lire `agents.md` et l’instruction de drop MTT.
- [x] Conserver le pipeline existant `#onSessionSellerDrop()` → `#getDroppedItemDocument()` → `prepareSellerItemDropData()` → `#addSessionSellerItem()`.
- [x] Adapter `#getDroppedItemDocument(event)` pour reconnaître les sources Item classiques et `mtt.product`.
- [x] Résoudre un produit MTT depuis `actorUuid` et `itemId`.
- [x] Réutiliser `prepareSellerItemDropData(...)` pour les Items classiques et les produits MTT.
- [x] Lire la quantité disponible d’un produit MTT depuis les flags produit.
- [x] Préparer le plan d’exécution pour décrémenter `flags.mtt-merchants.product.quantity`.
- [x] Neutraliser le blocage trop large des drops vendeur.
- [x] Ne créer aucune fonction parallèle shop/storage.

## Résumé

La zone de drop vendeur accepte maintenant une source `mtt.product` en plus des Items classiques.

`#getDroppedItemDocument(event)` retourne désormais une source structurée qui indique si le drop vient d’un Item classique ou d’un produit MTT. Pour un produit MTT, la source est résolue via l’acteur MTT et l’Item embedded support, tout en conservant le contexte produit.

`prepareSellerItemDropData(...)` reste le point commun de préparation des lignes `sellerItems`. Elle accepte maintenant soit un Item direct, soit la source structurée retournée par la feuille, et conserve un `sourceUuid` résoluble vers l’Item embedded exact à décrémenter.

Le plan d’exécution lit maintenant la quantité disponible d’un produit MTT depuis `flags.mtt-merchants.product.quantity` et prépare le même chemin pour la décrémentation finale.

## Fichiers modifiés

- `module/applications/sheets/merchant-sheet.mjs`
- `module/applications/sheets/merchant-catalog.mjs`
- `module/applications/sheets/merchant-trade.mjs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucune fonction spécialisée shop/storage n’a été créée.
- Aucune restriction source/destination n’a été ajoutée.
- Les lots déjà stabilisés ne sont pas modifiés.
- L’identité commerciale n’est pas réécrite.
- La fusion et la création des Items reçus restent dans les fonctions communes existantes.
- Le rail, les droits, la monnaie et le journal ne sont pas modifiés.

---

# Correction drop seller — compatibilité copyMove produit MTT

## Todo

- [x] Lire `agents.md` et l’instruction de correction ciblée.
- [x] Vérifier que `isMerchantSellerDropBlocked(...)` est neutralisée.
- [x] Modifier uniquement le drag produit MTT.
- [x] Conserver le payload `mtt.product` existant.
- [x] Conserver les drops de catégories en `move` et protégés par `isEditable`.
- [x] Conserver la zone seller en `copy`.
- [x] Ne pas modifier les fonctions de transfert, de quantité, de lots ou d’identité commerciale.

## Résumé

Le drag d’un produit MTT annonce maintenant `effectAllowed = "copyMove"` au lieu de `effectAllowed = "move"`.

Ce changement rend le même drag compatible avec deux usages existants : déplacer le produit entre catégories avec un drop `move`, ou le copier vers la zone seller avec un drop `copy`.

## Fichier modifié

- `module/applications/sheets/merchant-sheet.mjs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Les drops de catégories restent en `dropEffect = "move"` et protégés par `isEditable`.
- La zone seller reste en `dropEffect = "copy"`.
- Le payload `mtt.product` n’a pas été changé.
- Les fonctions de transfert, de quantité, de lots et d’identité commerciale n’ont pas été modifiées.
- Les permissions, le rail, `canEditMerchant` et `isEditable` n’ont pas été modifiés.

---

# Correction drop seller — Lecture payload MTT

## Todo

- [x] Lire `agents.md` et l’instruction de correction ciblée.
- [x] Vérifier que le drag produit MTT utilise toujours `effectAllowed = "copyMove"`.
- [x] Conserver `getDragEventData(event)` pour les drops Foundry classiques.
- [x] Ajouter un fallback de lecture `application/json` dans `#getDroppedItemDocument(event)`.
- [x] Conserver le payload `mtt.product` existant sans renommage.
- [x] Ne pas modifier les fonctions de transfert, quantité, lots, fusion ou identité commerciale.

## Résumé

`#getDroppedItemDocument(event)` lit toujours d’abord les données de drag/drop Foundry classiques via `getDragEventData(event)`.

Si cette lecture ne retourne rien, la fonction tente maintenant de lire directement le payload JSON stocké en `application/json`. Cela permet à la branche `mtt.product` existante d’être atteinte pour les produits MTT draggés depuis le catalogue.

## Fichiers modifiés

- `module/applications/sheets/merchant-sheet.mjs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Le payload `mtt.product` existant n’a pas été renommé.
- `getDragEventData(event)` est conservé pour les drops Foundry classiques.
- Les fonctions de transfert, quantité, lots, fusion et identité commerciale n’ont pas été modifiées.
- Les permissions, le rail, les catégories et les règles de relation entre acteurs n’ont pas été modifiés.

---

# Correction drop seller — Priorité payload MTT

## Todo

- [x] Lire `agents.md` et l’instruction de correction ciblée.
- [x] Modifier uniquement `#getDroppedItemDocument(event)`.
- [x] Lire `application/json` en priorité pour les payloads `mtt.product`.
- [x] Conserver le retour structuré `kind: "mttProduct"`.
- [x] Conserver `getDragEventData(event)` pour les drops Foundry classiques.
- [x] Ne pas modifier le payload, les transferts, les lots, la fusion ou l’identité commerciale.

## Résumé

`#getDroppedItemDocument(event)` traite maintenant en priorité le JSON interne MTT stocké dans `application/json` quand il contient `type: "mtt.product"`.

Si le JSON est absent, invalide ou n’est pas un produit MTT, la fonction continue ensuite avec `getDragEventData(event)` pour les drops Foundry classiques.

## Fichiers modifiés

- `module/applications/sheets/merchant-sheet.mjs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Le payload `mtt.product` n’a pas été modifié.
- `#onProductDragStart(event)`, `#onSessionSellerDragOver(event)` et `#onSessionSellerDrop(event)` n’ont pas été modifiés.
- Les fonctions de transfert, lots, fusion, quantité et identité commerciale n’ont pas été modifiées.
- Aucun helper ou pipeline parallèle n’a été créé.

---

# Correction seller MTT — Quantités source et fusion commune

## Todo

- [x] Lire `agents.md` et l’instruction de correction seller MTT.
- [x] Conserver le pipeline seller existant sans créer de flux parallèle.
- [x] Ajouter `sourceKind` pour identifier les sellerItems issus d’un produit MTT.
- [x] Conserver `sourceKind` lors de la normalisation, de l’ajout seller et des négociations seller.
- [x] Résoudre la source seller par `sourceActorUuid` + `sourceId` en priorité.
- [x] Resynchroniser les quantités seller MTT depuis `flags.mtt-merchants.product.quantity`.
- [x] Corriger les vérifications et la preview seller pour utiliser la quantité source commune.
- [x] Ne pas réécrire les règles de fusion, de lots ou d’identité commerciale.

## Résumé

Les lignes seller issues d’un produit MTT conservent maintenant `sourceKind: "mttProduct"` dans la session.

Les contrôles synchrones, l’affichage de session, la vérification de transaction, la preview et le plan d’exécution résolvent la source seller par l’acteur source et l’id d’Item, puis lisent la quantité disponible dans `flags.mtt-merchants.product.quantity` quand la source est un produit MTT.

Les Items classiques continuent à utiliser leur quantité système.

## Fichiers modifiés

- `module/applications/sheets/merchant-catalog.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `module/applications/sheets/merchant-trade.mjs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucun pipeline seller parallèle n’a été créé.
- Les règles de fusion destination existantes n’ont pas été réécrites.
- Les règles de lots existantes n’ont pas été réécrites.
- L’identité commerciale `sourceUuid` / `isCommerciallyModified` reste gérée par les fonctions communes existantes.
- Les templates, styles, langues, sockets, permissions et rail n’ont pas été modifiés.

---

# Correction drop seller — Responsables du stockage source

## Todo

- [x] Lire `agents.md` et l’instruction de correction.
- [x] Ajouter un droit local dédié au drag produit vers seller.
- [x] Appliquer la règle MJ / feuille éditable / responsable du stockage source.
- [x] Exposer ce droit dans le contexte `mtt`.
- [x] Modifier uniquement le `draggable` des lignes produit dans le template.
- [x] Modifier `#onProductDragStart(event)` pour utiliser ce droit local.
- [x] Conserver les drops de catégories protégés par `isEditable`.
- [x] Ne pas modifier les quantités, lots, fusion ou `sourceUuid`.

## Résumé

Un produit MTT peut maintenant être rendu draggable depuis une feuille source si l’utilisateur est MJ, si la feuille est éditable, ou si la source est un stockage MTT pour lequel l’utilisateur possède un acteur responsable autorisé au marchandage.

Le droit ajouté concerne uniquement le drag vers une zone seller. Les contrôles d’édition du catalogue restent basés sur `canEditMerchant` ou `isEditable`.

## Fichiers modifiés

- `module/applications/sheets/merchant-sheet.mjs`
- `templates/actors/parts/merchant-products.hbs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Les drops de catégories restent protégés par `isEditable` et utilisent toujours `dropEffect = "move"`.
- La zone seller destination n’a pas été modifiée.
- Les quantités, lots, fusion, `sourceUuid`, `isCommerciallyModified`, `ownershipLevel` et `isHidden` n’ont pas été modifiés.
- Les permissions générales, le rail, les styles, les langues et les sockets n’ont pas été modifiés.

---

## Étape — Header stockage : identité et fortune

### Todo utilisée

- [x] Enregistrer le nom du stockage dans les flags storage.
- [x] Enregistrer l’image du stockage dans les flags storage.
- [x] Afficher la fortune réelle de l’acteur support dans le header stockage.

### Fichiers modifiés

- `module/applications/sheets/merchant-sheet.mjs`
- `module/applications/sheets/merchant-catalog.mjs`
- `rapport-étapes-stockage.md`

### Éléments modifiés

- Routage du champ `shop.name` vers `storage.storage.name` quand la feuille MTT est un stockage.
- Routage de `editShopImage` vers `storage.storage.img` quand la feuille MTT est un stockage.
- Ajout d’un helper d’affichage qui lit les monnaies de l’acteur via `currency.actorPath`.
- Utilisation de ce helper uniquement pour le header stockage.

### Éléments explicitement non modifiés

- Pas de dépôt/retrait de monnaie.
- Pas de répartition de fortune.
- Pas de modification de `actor.name` ou `actor.img`.
- Pas de modification de la logique shop/marchand.

---

# Correction — Trésorerie commune Shop / Storage

## Todo

- [x] Supprimer la lecture `actorPath` pour le header stockage.
- [x] Supprimer `prepareActorWalletCurrencies`.
- [x] Généraliser `prepareWalletCurrencies` selon le type MTT actif.
- [x] Faire écrire l'édition du wallet dans `merchant.wallet` ou `storage.wallet`.
- [x] Conserver la correction du nom et de l'image stockage.
- [x] Ne pas implémenter de transfert de monnaie.

## Résumé

La trésorerie affichée dans le header utilise maintenant le wallet MTT du type actif. Une boutique lit `flags.mtt-merchants.merchant.wallet.currencies`, et un stockage lit `flags.mtt-merchants.storage.wallet.currencies`.

Le stockage possède désormais une structure `wallet.currencies` dans ses données par défaut et dans sa normalisation.

## Fichiers modifiés

- `module/applications/sheets/merchant-catalog.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `module/documents/storage-flags.mjs`
- `rapport-étapes-stockage.md`

## Non modifié volontairement

- Aucun transfert de monnaie n'a été ajouté.
- Le nom et l'image du stockage restent enregistrés dans les flags storage.
- `actor.name` et `actor.img` ne sont pas modifiés.

---

# Étape 1 — Lignes permanentes de monnaie dans la session storage

## Todo

- [x] Accepter `type: "money"` dans les lignes de session.
- [x] Garder les lignes monnaie compatibles avec `quantity: 1`, `unitPriceValue` et `totalPriceValue`.
- [x] Marquer les lignes monnaie dans le contexte de session.
- [x] Ajouter le contexte storage des montants à prendre et à déposer.
- [x] Filtrer les lignes monnaie des boucles d'objets storage.
- [x] Ajouter la création/mise à jour persistée des deux lignes monnaie.
- [x] Brancher l'input décimal et les boutons `+` / `-`.
- [x] Adapter le bouton “Vider la session” pour remettre l'argent à `0`.
- [x] Ajouter les libellés FR/EN.

## Fichiers modifiés

- `module/applications/sheets/merchant-trade.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `templates/actors/parts/storage-session.hbs`
- `lang/fr.json`
- `lang/en.json`
- `rapport-étapes-stockage.md`

## Éléments modifiés

- La session storage affiche maintenant deux lignes permanentes : `Prendre de l'argent` et `Déposer de l'argent`.
- Les montants sont persistés dans `buyerItems` et `sellerItems` avec `type: "money"`.
- Les vrais objets restent affichés dans les boucles existantes, sans afficher les lignes monnaie comme des Items.
- La saisie accepte les décimales, refuse les valeurs négatives et arrondit à deux décimales.

## Non modifié volontairement

- Aucun transfert réel de monnaie n'a été implémenté.
- Les lignes `money` ne sont pas traitées comme des Items Foundry.
- Aucun onglet, rail ou modèle de session parallèle n'a été créé.
- La validation finale de transfert sera traitée dans une étape suivante.

---

# Étape 2 — Pipeline storage money-only

## Todo

- [x] Ajouter un helper d'identification des lignes `type: "money"`.
- [x] Ajouter un filtre de calcul monétaire configurable.
- [x] Exclure les lignes `money` des contrôles d'Items acheteur/vendeur.
- [x] Exclure les lignes `money` de la preview de livraison d'Items.
- [x] Exclure les lignes `money` du plan d'exécution des transferts d'Items.
- [x] Brancher `currencyTransferMode: "money-only"` sur la validation storage.
- [x] Conserver `includeCurrencyTransfers: false` pour cette étape.
- [x] Réinjecter les deux lignes money à `0` après validation ou refus storage.

## Fichiers modifiés

- `module/applications/sheets/merchant-trade.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `rapport-étapes-stockage.md`

## Résumé

Le pipeline commun sait maintenant distinguer les lignes fictives `money` des vrais Items. En mode storage, les vrais objets récupérés ou déposés ne participent pas aux calculs monétaires, tandis que les lignes `money` restent disponibles pour les étapes suivantes.

La validation storage continue à transférer les vrais Items, sans transfert réel de monnaie, puis remet les deux lignes permanentes de monnaie à `0`.

## Non modifié volontairement

- Aucun paiement réel n'a été activé.
- Aucun helper `depositStorageMoney` ou `withdrawStorageMoney` n'a été créé.
- Le comportement marchand par défaut reste basé sur tous les produits, services et items de session.
- Le template `storage-session.hbs` n'a pas été modifié dans cette étape.

---

# Étape 3 — Transfert monétaire commun pour les lignes money storage

## Todo

- [x] Généraliser la lecture de monnaie selon le type réel de l'acteur.
- [x] Lire les wallets MTT merchant et storage avant les chemins `actorPath`.
- [x] Généraliser le plan de transfert monétaire pour le payeur et le receveur.
- [x] Généraliser l'écriture des deltas vers wallet MTT ou `actorPath`.
- [x] Activer `includeCurrencyTransfers: true` en validation storage.
- [x] Conserver `currencyTransferMode: "money-only"` pour le stockage.
- [x] Appliquer le plan monétaire après les transferts d'Items storage.
- [x] Préserver le reset des deux lignes money à `0` après validation/refus storage.

## Fichiers modifiés

- `module/applications/sheets/merchant-trade.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `rapport-étapes-stockage.md`

## Résumé

Le transfert monétaire commun fonctionne maintenant avec les acteurs classiques, les boutiques MTT et les stockages MTT. Les acteurs classiques continuent à utiliser les chemins monnaie configurés, tandis que les acteurs MTT utilisent leur wallet en flags.

La validation storage applique désormais le plan monétaire uniquement sur les lignes `type: "money"`. Les vrais Items déposés ou récupérés restent gratuits et continuent à passer par le pipeline de transfert d'Items.

## Non modifié volontairement

- Aucun helper séparé de dépôt/retrait de monnaie storage n'a été créé.
- Aucune logique de paiement n'a été ajoutée dans `#setStorageSessionMoneyValue`.
- Aucun journal marchand n'a été ajouté pour la validation storage.
- Le template `storage-session.hbs` n'a pas été modifié dans cette étape.

---

# Correction — Inversion dépôt / récupération de monnaie storage

## Todo

- [x] Conserver `storage-money-take` dans `buyerItems`.
- [x] Conserver `storage-money-deposit` dans `sellerItems`.
- [x] Ne pas modifier le template storage ni les libellés.
- [x] Corriger uniquement la transformation des lignes `money` en dette financière.
- [x] Inverser les groupes de calcul monétaire en mode `money-only`.
- [x] Conserver `prepareMoneyAdjustments(...)` inchangé.
- [x] Ne pas ajouter de logique dédiée dépôt/retrait.

## Fichiers modifiés

- `module/applications/sheets/merchant-trade.mjs`
- `rapport-étapes-stockage.md`

## Cause

Le mode `money-only` filtrait correctement les lignes monnaie, mais gardait le sens financier classique de la boutique : `buyerItems` côté client payeur et `sellerItems` côté marchand payeur.

En storage, les lignes sont placées visuellement selon la logique d'Items : `buyerItems` signifie “le PJ récupère”, et `sellerItems` signifie “le PJ dépose”. Pour la monnaie, ce sens financier doit être inversé.

## Correction appliquée

Le calcul monétaire utilise maintenant un helper de groupes. En mode `money-only`, les lignes `sellerItems` money alimentent les totaux buyer, et les lignes `buyerItems` money alimentent les totaux seller.

Résultat : récupérer de l'argent fait payer le stockage, déposer de l'argent fait payer l'acteur de session.

## Non modifié volontairement

- Les lignes `money` ne sont pas déplacées dans la session.
- `storage-session.hbs` n'a pas été modifié.
- `#setStorageSessionMoneyValue(...)` n'a pas été modifiée.
- `prepareMoneyAdjustments(...)` et `applyCurrencyTransferPlan(...)` restent communs.
- Aucun helper `depositStorageMoney`, `withdrawStorageMoney` ou équivalent n'a été créé.

---

# Correction — Faire la monnaie lors des transferts storage

## Todo

- [x] Raisonner sur la valeur totale du payeur en monnaie de référence.
- [x] Ajouter des helpers communs de lecture, conversion, distribution et deltas.
- [x] Ajouter un mode optionnel `allowPayerInternalConversion`.
- [x] Utiliser ce mode pour les sessions storage `money-only`.
- [x] Appliquer des deltas directs quand le payeur fait sa monnaie en interne.
- [x] Corriger le check préalable pour éviter une comparaison directe par devise.
- [x] Ne pas modifier les templates HBS.

## Fichiers modifiés

- `module/applications/sheets/merchant-trade.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `rapport-étapes-stockage.md`

## Correction appliquée

Le plan monétaire peut maintenant convertir la fortune totale du payeur en valeur de référence, vérifier que cette valeur couvre la dette, puis recalculer une répartition de wallet après paiement.

En storage `money-only`, le payeur peut donc régler avec sa valeur totale disponible, même s'il ne possède pas assez d'unités dans la devise saisie. Le receveur reçoit le montant dû décomposé dans les monnaies configurées.

Le check préalable storage utilise les mêmes options de plan monétaire, afin de ne plus refuser à tort une opération qui peut être couverte par conversion interne.

## Non modifié volontairement

- Aucun template HBS n'a été modifié.
- Les lignes `money` ne sont pas déplacées entre `buyerItems` et `sellerItems`.
- Aucun helper dédié `withdrawStorageMoney`, `depositStorageMoney` ou équivalent n'a été créé.
- Les vrais Items de session storage ne participent toujours pas au paiement.
- Le comportement marchand par défaut ne reçoit pas `allowPayerInternalConversion`.

---

# Étape 1 — Mise en commun des sessions MTT storage

## Todo

- [x] Ajouter une normalisation locale des sessions storage.
- [x] Replacer les lignes `money` storage dans le sens financier commun.
- [x] Garder les vrais Items storage à valeur `0`.
- [x] Adapter la lecture des montants affichés sans modifier le HBS.
- [x] Supprimer l'inversion spéciale du mode `money-only`.
- [x] Appliquer la normalisation avant sauvegarde, contrôle, prévisualisation et validation.

## Fichiers modifiés

- `module/applications/sheets/merchant-sheet.mjs`
- `module/applications/sheets/merchant-trade.mjs`
- `rapport-étapes-stockage.md`

## Résumé

Les lignes `money` storage sont maintenant replacées dans le sens financier commun des sessions MTT : `Prendre de l'argent` va dans `sellerItems`, et `Déposer de l'argent` va dans `buyerItems`.

Les vrais Items de storage restent gratuits avec `unitPriceValue`, `totalPriceValue` et `priceCurrency` remis à `0` / vide pendant la normalisation.

Le mode `money-only` filtre encore les lignes `money`, mais il n'inverse plus les côtés. Le moteur monétaire lit désormais le bon sens directement depuis la session normalisée.

## Non modifié volontairement

- Aucun template HBS n'a été modifié.
- Aucune refonte complète de la validation storage.
- Aucun journal storage ou journal commercial ajouté.
- Aucun nouveau modèle `takenItems`, `depositedItems` ou équivalent.
- Les transferts complets et le journal restent réservés à l'étape suivante.

---

# Étape 2 — Mise en commun de la validation MTT storage

## Todo

- [x] Vérifier que `money-only` ne fait plus d'inversion de côtés.
- [x] Retirer `currencyTransferMode: "money-only"` des appels storage.
- [x] Retirer `allowPayerInternalConversion: true` des appels storage.
- [x] Rendre la conversion interne automatique pour un payeur MTT.
- [x] Conserver les lignes `money` exclues des transferts d'Items.
- [x] Garder la validation storage sur le moteur commun.

## Fichiers modifiés

- `module/applications/sheets/merchant-sheet.mjs`
- `module/applications/sheets/merchant-trade.mjs`
- `rapport-étapes-stockage.md`

## Résumé

La validation storage ne dépend plus de `currencyTransferMode: "money-only"`. Les vrais Items storage restent à `0`, donc le moteur commun peut calculer les totaux sur les mêmes tableaux `buyerItems` / `sellerItems` que la boutique.

La conversion interne du payeur est maintenant commune aux acteurs MTT : un marchand ou un stockage MTT peut payer depuis la valeur totale de son wallet sans option spéciale storage.

Les lignes `money` participent aux totaux monétaires, mais restent exclues des contrôles et transferts d'Items Foundry.

## Non modifié volontairement

- Aucun template HBS n'a été modifié.
- Aucun style ou fichier de langue n'a été modifié.
- Le journal n'a pas été modifié dans cette étape.
- Aucun helper dédié storage de dépôt/retrait de monnaie n'a été créé.

---

# Étape 3 — Nettoyage commun des sessions MTT

## Todo

- [x] Supprimer les reliquats `currencyTransferMode` / `money-only` du code actif.
- [x] Supprimer l'option externe `allowPayerInternalConversion`.
- [x] Recentrer le check monétaire sur le plan commun de transfert.
- [x] Conserver les protections qui excluent les lignes `money` des transferts d'Items.
- [x] Ne pas modifier le journal.

## Fichiers modifiés

- `module/applications/sheets/merchant-sheet.mjs`
- `module/applications/sheets/merchant-trade.mjs`
- `rapport-étapes-stockage.md`

## Résumé

La session storage ne dépend plus d'un mode monétaire spécial. Les calculs utilisent les tableaux complets `buyerItems` / `sellerItems`, car les vrais Items storage sont normalisés à `0` et les lignes `money` portent seules la valeur payante.

La conversion interne du payeur repose maintenant uniquement sur le fait que le payeur est un acteur MTT `merchant` ou `storage`.

Le check monétaire utilise systématiquement le plan commun de transfert quand il existe, puis conserve l'ancien contrôle direct seulement comme secours.

## Non modifié volontairement

- Aucun template HBS n'a été modifié.
- Aucun CSS ni fichier de langue n'a été modifié.
- Le journal n'a pas été modifié.
- Aucun helper storage de dépôt/retrait de monnaie n'a été créé.

---

# Correction — Fusion des ajouts répétés en session storage

## Todo

- [x] Lire `agents.md`, le rapport stockage et les instructions de correction.
- [x] Identifier la cause dans `#normalizeStorageExchangeSession` : `priceCurrency = ""` vidait la devise des vrais Items.
- [x] Corriger la normalisation pour conserver la devise existante ou l'initialiser à la devise de référence.
- [x] Ajouter une tolérance de fusion dans `#addSessionBuyerItem` quand les deux prix valent `0`.
- [x] Appliquer la même tolérance dans `#addSessionSellerItem`.
- [x] Vérifier `node --check` sur `merchant-sheet.mjs`.
- [x] Rapport ajouté.

## Fichiers modifiés

- `module/applications/sheets/merchant-sheet.mjs`
- `rapport-étapes-stockage.md`

## Résumé

La normalisation des vrais Items storage ne force plus `priceCurrency = ""`. Elle conserve la devise déjà présente, ou initialise à la devise de référence (`getReferenceCurrency`) si le champ est vide. Les Items ajoutés à la session et les Items déjà en session ont donc toujours la même devise.

Les fonctions `#addSessionBuyerItem` et `#addSessionSellerItem` utilisent maintenant une règle locale `pricesMatchForMerge` : si les deux prix valent `0`, la devise n'est pas requise pour identifier une ligne existante. Si le prix est supérieur à `0`, la comparaison de devise reste inchangée.

Résultat : des clics répétés sur `Ajouter à la session` pour le même Item augmentent la quantité de la ligne existante au lieu de créer des doublons, même si cette ligne avait une devise vide dans une session enregistrée avant la correction.

## Non modifié volontairement

- Aucun fichier HBS, CSS ou de langue.
- Aucun modèle de session parallèle.
- Aucun helper dédié `addStorageItemToSession`.
- Les lignes `money` restent permanentes et inchangées.
- Le moteur de validation et les transferts d'Items ne sont pas modifiés.

---

## Étape — Suppression optionnelle des Items à 0 sur les acteurs du système de jeu

**Option Foundry ajoutée** : `deleteEmptySystemActorItems` (`scope: "world"`, `config: true`, `default: false`). Visible dans les options Foundry du module, pas dans la fenêtre de configuration MTT.

**Point de décrément modifié** : boucle `sellerTransfers` dans `executeSessionItemTransfers`, après la livraison côté destination. Si `nextQuantity <= 0`, que la source appartient à un acteur du système de jeu et que l'option est activée, l'Item source est supprimé via `deleteEmbeddedDocuments`. Sinon, la quantité est mise à jour normalement avec `Math.max(0, nextQuantity)`.

**Helper ajouté** : `isGameSystemActor(actor)` — retourne `true` si l'acteur n'est ni un marchand MTT ni un stockage MTT.

**Périmètre** : seuls les acteurs du système de jeu sont concernés. Les boutiques MTT et les stockages MTT ne sont pas modifiés dans cette étape.

---
