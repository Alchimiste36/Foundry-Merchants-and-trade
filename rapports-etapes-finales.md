# Rapports — Étapes grand nettoyage mjs

## Étape 01 — Extraction des flags communs MTT

### Todo
- [x] Créer `module/documents/mtt-flags.mjs`
- [x] Déplacer `getMTTEntityType(actor)` dans `mtt-flags.mjs`
- [x] Adapter les imports existants
- [x] Vérifier qu'aucun import de `getMTTEntityType` ne vient encore de `storage-flags.mjs`

### Fichiers modifiés
- `module/documents/mtt-flags.mjs` (créé)
- `module/documents/storage-flags.mjs`
- `module/documents/merchant-flags.mjs`
- `module/applications/sheets/merchant-catalog.mjs`
- `module/applications/sheets/merchant-session-socket.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `module/applications/sheets/merchant-trade.mjs`

### Résumé
Extraction du helper commun `getMTTEntityType(actor)` vers `mtt-flags.mjs` et mise à jour des imports pour supprimer la dépendance conceptuelle entre `merchant-flags.mjs` et `storage-flags.mjs`.

### Hors périmètre volontaire
- Pas de renommage de `merchant-flags.mjs`.
- Pas de création de `shop-flags.mjs`.
- Pas de déplacement de logique session, rail ou trade.
- Pas de modification HBS / LESS / lang.

---

## Étape 02 — Renommage ciblé des fichiers de flags shop

### Todo
- [x] Renommer `module/documents/merchant-flags.mjs` en `module/documents/shop-flags.mjs`
- [x] Adapter les imports vers `shop-flags.mjs`
- [x] Vérifier qu'aucun import actif ne pointe encore vers `merchant-flags.mjs`
- [x] Vérifier la syntaxe des fichiers MJS modifiés

### Fichiers modifiés
- `module/documents/shop-flags.mjs` (renommé depuis `merchant-flags.mjs`)
- `module/documents/storage-flags.mjs`
- `module/documents/merchant-conversion.mjs`
- `module/applications/mtt-global-journal-app.mjs`
- `module/applications/sheets/merchant-catalog.mjs`
- `module/applications/sheets/merchant-journal.mjs`
- `module/applications/sheets/merchant-session-socket.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `module/applications/sheets/merchant-trade.mjs`
- `module/applications/sheets/merchant-utils.mjs`
- `mtt.mjs`
- `rapports-etapes-finales.md`

### Résumé
Renommage ciblé du fichier de flags shop et adaptation des imports. Les noms de fonctions et la logique métier restent inchangés.

### Hors périmètre volontaire
- Pas de renommage des fonctions `getMerchantData`, `isMTTMerchant`, etc.
- Pas de modification des flags persistés `flags.mtt-merchants.merchant`.
- Pas de déplacement de logique session, rail ou trade.
- Pas de modification HBS / LESS / lang.

---

## Étape 03 — Renommage permissions

### Todo
- [x] Renommer `merchant-access.mjs` en `merchant-permissions.mjs`
- [x] Adapter les imports vers `merchant-permissions.mjs`
- [x] Mettre à jour l'API interne dans `mtt.mjs`
- [x] Vérifier qu'aucun import actif ne pointe encore vers `merchant-access.mjs`

### Fichiers modifiés
- `module/documents/merchant-permissions.mjs` (renommé depuis `merchant-access.mjs`)
- `module/applications/mtt-config-app.mjs`
- `module/applications/mtt-global-journal-app.mjs`
- `module/applications/sheets/merchant-journal.mjs`
- `module/applications/sheets/merchant-session-socket.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `module/config/config-export.mjs`
- `module/config/settings.mjs`
- `mtt.mjs`
- `rapports-etapes-finales.md`

### Résumé
Renommage ciblé du fichier des permissions et adaptation des imports. L'alias `merchantAccess` dans l'API de `mtt.mjs` a été remplacé par `merchantPermissions`. La logique métier reste inchangée.

### Hors périmètre volontaire
- Pas de déplacement de logique vers `merchant-rail.mjs`.
- Pas de déplacement de logique vers `merchant-session.mjs`.
- Pas de modification HBS / LESS / lang.
- Pas de renommage des fonctions de permissions existantes.

---

## Étape 04 — Création de `merchant-session.mjs`

### Todo
- [x] Créer `merchant-session.mjs`
- [x] Déplacer les fonctions de modèle/manipulation de session
- [x] Adapter les imports dans les fichiers concernés
- [x] Vérifier l'absence de déplacement hors périmètre

### Fichiers modifiés
- `module/applications/sheets/merchant-session.mjs` (créé)
- `module/applications/sheets/merchant-trade.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `module/applications/sheets/merchant-session-socket.mjs`
- `rapports-etapes-finales.md`

### Résumé
Création du fichier central de sessions MTT et déplacement des fonctions de modèle/manipulation de session depuis `merchant-trade.mjs` : `normalizeSessionItem`, `normalizeNegotiationOffer`, `normalizeSessionNegotiation`, `normalizeSession`, `buildSessionData`, `getSessions`, `recalculateSessionItemTotal`, `setSessionItemQuantity`, `getSessionItemsForSide`, `removeSessionItemById`, `canAcceptSessionQuantity`, `clearSessionAfterExecution`. Les helpers privés `getSellerSourceItemFromSessionItem`, `getSellerSourceAvailableQuantity` sont déplacés avec eux. `syncSessionItemAvailability` est exportée car `prepareSessionContext` (resté dans trade) l'utilise.

### Hors périmètre volontaire
- `prepareSessionContext` laissé dans `merchant-trade.mjs` : appelle `prepareBuyerFortune` et `normalizeAccessClient` qui restent dans trade — déplacer créerait une dépendance circulaire.
- Pas de création de `merchant-rail.mjs`.
- Pas de déplacement des fonctions d'accès rail/client.
- Pas de modification HBS / LESS / lang.
- Pas de changement fonctionnel volontaire.

---

## Étape 05 — Création de `merchant-rail.mjs`

### Todo
- [x] Créer `merchant-rail.mjs`
- [x] Déplacer les helpers rail/access depuis `merchant-trade.mjs`
- [x] Adapter les imports dans `merchant-sheet.mjs`
- [x] Adapter les imports dans `merchant-trade.mjs`
- [x] Vérifier l'absence de déplacement hors périmètre

### Fichiers modifiés
- `module/applications/sheets/merchant-rail.mjs` (créé)
- `module/applications/sheets/merchant-trade.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `rapports-etapes-finales.md`

### Résumé
Création du fichier central du rail d'acteurs MTT et déplacement des helpers de préparation des acteurs du rail, taux personnalisés, statuts, tooltips et icônes depuis `merchant-trade.mjs`. `merchant-trade.mjs` importe `normalizeAccessClient` et `getStoredAccessClients` depuis `merchant-rail.mjs` pour ses besoins internes (`prepareSessionClientContext` et `getExecutionAccessClients`). `merchant-sheet.mjs` importe les 7 fonctions rail depuis `merchant-rail.mjs` et les 6 fonctions trade depuis `merchant-trade.mjs`.

### Hors périmètre volontaire
- Pas de modification HBS / LESS / lang.
- Pas de déplacement des handlers du rail dépendants de `this.actor`, `this.element` ou des événements Foundry.
- Pas de déplacement des permissions configurables depuis `merchant-permissions.mjs`.
- Pas de déplacement de logique de session depuis `merchant-session.mjs`.
- Pas de changement fonctionnel volontaire.

---

## Étape 06 — Nettoyage de `merchant-trade.mjs`

### Todo
- [x] Vérifier les imports de `merchant-trade.mjs`
- [x] Conserver `prepareSessionContext(...)` dans `merchant-trade.mjs`
- [x] Ajouter ou ajuster les commentaires de grands blocs
- [x] Vérifier les fonctions déjà déplacées vers `merchant-session.mjs` et `merchant-rail.mjs`
- [x] Vérifier qu'aucune modification hors périmètre n'a été faite

### Fichiers modifiés
- `module/applications/sheets/merchant-trade.mjs`
- `rapports-etapes-finales.md`

### Résumé
`merchant-trade.mjs` est clarifiée et recentrée sur validation / preview / exécution par l'ajout de commentaires de blocs MTT sans aucun changement fonctionnel. Les imports sont propres (shop-flags.mjs, mtt-flags.mjs, merchant-session.mjs, merchant-rail.mjs). Aucune référence à d'anciens fichiers (merchant-flags.mjs, merchant-access.mjs) ne subsiste.

### Hors périmètre volontaire
- Pas de déplacement de fonctions vers `merchant-session.mjs`.
- Pas de déplacement de fonctions vers `merchant-rail.mjs`.
- Pas de modification HBS / LESS / lang.
- Pas de changement de logique métier.

---

## Étape 07 — Nettoyage de `merchant-sheet.mjs`

### Todo
- [x] Vérifier les imports de `merchant-sheet.mjs`
- [x] Recentrer les commentaires de grands blocs
- [x] Vérifier les helpers purs éventuellement déplaçables
- [x] Conserver les handlers Application V2 dans `merchant-sheet.mjs`
- [x] Vérifier l'absence de modification hors périmètre

### Fichiers modifiés
- `module/applications/sheets/merchant-sheet.mjs`
- `rapports-etapes-finales.md`

### Résumé
Ajout de 6 commentaires de grands blocs MTT dans `merchant-sheet.mjs` pour rendre lisible la structure de l'orchestrateur : contexte/état, rail, helpers storage d'échange, accès session, validation/refus, et shop services/négociation. Aucun helper pur n'a été déplacé : toutes les fonctions restantes dépendent de `this.actor`, `this.element`, `this.render()`, du DOM Foundry, des dialogs ou de l'état de la classe. Les imports ne référencent plus `merchant-flags.mjs` ni `merchant-access.mjs`.

### Hors périmètre volontaire
- Pas de modification HBS / LESS / lang.
- Pas de création de `merchant-sheet-shop.mjs` ou `merchant-sheet-storage.mjs`.
- Pas de déplacement de validation / preview / exécution métier.
- Pas de changement fonctionnel volontaire.

---

## Étape 08 — Commentaires d'architecture MJS

### Todo
- [x] Lire `rapports-etapes-finales.md` et vérifier les rapports 01–07
- [x] Vérifier les commentaires existants après les étapes 06 et 07
- [x] Ajouter ou ajuster les commentaires d'architecture MJS sans changement fonctionnel
- [x] Vérifier qu'aucun fichier HBS / LESS / lang n'a été modifié

### Fichiers modifiés
- `module/documents/mtt-flags.mjs`
- `module/documents/shop-flags.mjs`
- `module/applications/sheets/merchant-catalog.mjs`
- `module/applications/sheets/merchant-journal.mjs`
- `module/applications/sheets/merchant-rail.mjs`
- `rapports-etapes-finales.md`

### Résumé
Commentaires d'architecture ajoutés dans les fichiers MJS principaux : en-têtes de fichiers (`mtt-flags.mjs`, `shop-flags.mjs`, `merchant-catalog.mjs`, `merchant-journal.mjs`), note d'isolation dans `mtt-flags.mjs`, note sur les noms historiques dans `shop-flags.mjs`, et sous-sections `MTT base` / `MTT shop` / `MTT storage` dans `merchant-catalog.mjs`, `merchant-journal.mjs` et `merchant-rail.mjs`. Les fichiers déjà bien commentés après les étapes 06 et 07 (`merchant-trade.mjs`, `merchant-sheet.mjs`, `merchant-session.mjs`, `storage-flags.mjs`) n'ont pas été modifiés.

### Hors périmètre volontaire
- Pas de déplacement de fonctions.
- Pas de renommage de fichiers ou de fonctions.
- Pas de nettoyage imports/exports/fonctions mortes.
- Pas de modification HBS / LESS / lang.
- Pas de changement fonctionnel volontaire.

---

## Étape 09 — Nettoyage imports / exports / fonctions mortes MJS

### Todo
- [x] Vérifier les anciens imports `merchant-flags.mjs` / `merchant-access.mjs`
- [x] Nettoyer les imports inutilisés confirmés
- [x] Rétrograder les exports utilisés uniquement localement
- [x] Supprimer les fonctions mortes confirmées
- [x] Vérifier les TODO obsolètes
- [x] Vérifier l'absence de modification HBS / LESS / lang

### Fichiers modifiés
- `module/applications/sheets/merchant-dialogs.mjs`
- `module/applications/sheets/merchant-journal.mjs`
- `module/applications/sheets/merchant-rail.mjs`
- `module/applications/sheets/merchant-utils.mjs`
- `module/applications/sheets/merchant-catalog.mjs`
- `module/applications/sheets/merchant-trade.mjs`
- `module/config/settings.mjs`
- `module/documents/merchant-permissions.mjs`
- `module/documents/merchant-products.mjs`
- `module/documents/storage-flags.mjs`

### Résumé
Nettoyage confirmé sans changement fonctionnel : 6 exports rétrogradés en fonctions internes (`renderSessionPreparationDialog`, `getMerchantJournalTransactions`, `getStorageJournalEntries`, `getBestSessionForClient`, `parsePriceValue`, `getStorageAddBlockReasonKey`) ; 9 fonctions mortes supprimées après vérification globale (`findMergeableMerchantItemBySourceUuid`, `prepareMerchantCatalogItemData`, `isMerchantSellerDropBlocked`, `parseDefaultCustomCategories`, `canUserViewClientSession`, `findMergeableCatalogProduct`, `isStorageTradeResponsibleActor`, `isStorageItemBlocked`, `isStorageItemWarningGM`) ; le bloc de section `// ─── Seller drop protection ───` et le TODO étape 9 dans `merchant-catalog.mjs` ont été supprimés avec les fonctions concernées. Aucun import vers `merchant-flags.mjs` ni `merchant-access.mjs` n'a été trouvé. `node --check` validé sur les 10 fichiers.

### Hors périmètre volontaire
- Pas de déplacement de fonctions.
- Pas de renommage de fichiers.
- Pas de modification HBS / LESS / lang.
- Pas de changement métier volontaire.
- `TODO MTT services secrets:` conservé dans `merchant-trade.mjs` : fonctionnalité future explicite (description secrète de service dans le journal).
