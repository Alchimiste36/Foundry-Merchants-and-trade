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
