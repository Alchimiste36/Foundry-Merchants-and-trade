# Structure finale MJS attendue — MTT 1.0

Ce document définit la cible de réorganisation MJS du module **Merchants, Trades and Transactions**.

Objectif : obtenir des fichiers cohérents par domaine, sans chercher à réduire artificiellement toutes les tailles de fichiers.

Un fichier de 600 à 900 lignes est acceptable si sa responsabilité est claire.

---

# 1. Principe d’organisation

Le découpage cible est par domaine fonctionnel :

```text
flags
permissions
rail
session
socket
trade
catalog
journal
dialogs
sheet
utils
```

Ne pas créer une séparation parallèle `sheet shop` / `sheet storage`.

La feuille MTT reste commune.

---

# 2. Structure cible des fichiers

## 2.1. `module/documents/mtt-flags.mjs`

### Statut

Nouveau fichier à créer.

### Rôle

Helpers communs d’identification MTT, sans logique shop ni storage.

### Fonctions attendues

```js
getMTTEntityType(actor)
isMTTEntity(actor)
getMTTEntityFlagRoot(entityType)
getMTTEntityFlagPath(entityType, path)
```

### Notes

- `getMTTEntityType(actor)` doit être déplacé depuis `storage-flags.mjs`.
- Ce fichier ne doit pas importer `shop-flags.mjs` ou `storage-flags.mjs`.
- Ce fichier peut importer uniquement des constantes communes si nécessaire.

---

## 2.2. `module/documents/shop-flags.mjs`

### Statut

Renommage cible de `module/documents/merchant-flags.mjs`.

### Rôle

Données persistées de la boutique/shop dans `flags.mtt-merchants.merchant`.

### Fonctions attendues

```js
getShopFlagPath(path)
createLocalShopCategory(name)
buildDefaultShopData(actor)
normalizeShopData(data, actor)
getShopData(actor)
getShopDataForUpdate(actor)
isMTTShop(actor)
setShopData(actor, data)
updateShopData(actor, changes)
unsetShopData(actor)
```

### Transition acceptée

Pour limiter les risques pendant le refactor, une étape intermédiaire peut conserver les anciens noms exportés :

```js
getMerchantFlagPath
buildDefaultMerchantData
normalizeMerchantData
getMerchantData
getMerchantDataForUpdate
isMTTMerchant
setMerchantData
updateMerchantData
unsetMerchantData
```

Mais la structure finale doit viser `shop-*` pour ce qui est réellement boutique.

### Notes

- Le stockage ne doit jamais écrire dans `flags.mtt-merchants.merchant`.
- Les services restent une logique shop.

---

## 2.3. `module/documents/storage-flags.mjs`

### Statut

Fichier existant à conserver.

### Rôle

Données persistées et états propres au stockage.

### Fonctions attendues à conserver

```js
STORAGE_IGNORE_CATEGORY_ID
getStorageFlagPath(path)
buildInitialLocalStorageCategories()
buildDefaultStorageData(actor)
normalizeStorageData(data, actor)
getStorageData(actor)
isMTTStorage(actor)
setStorageData(actor, data)
updateStorageData(actor, changes)
unsetStorageData(actor)
getStorageTradeWithMerchantData(actor)
getStorageTradeResponsibleActorUuids(actor)
getStorageAccessActorUuids(actor)
isStorageTradeResponsibleActor(actor, actorUuid)
canActorTradeWithMerchantAsStorage(storageActor, actorUuid)
setStorageTradeResponsibleActorUuids(actor, actorUuids)
getStorageItemFlags(item)
isStorageItemBlocked(item)
isStorageItemWarningGM(item)
setStorageItemBlocked(item, value)
setStorageItemWarningGM(item, value)
getStorageItemTags(item)
getStorageItemTagForActor(item, actorUuid)
hasStorageItemTagType(item, tagType)
getStorageSessionClaimQuantityForItem(storageActor, item)
buildStorageItemIntentState(item, options)
getStorageClaimQuantityBlockReasonKey(item, options)
getStorageAddBlockReasonKey(item, options)
buildStorageAddIntentBlockState(item, options)
toggleStorageItemTag(item, actorUuid, tagType)
applyStorageIgnoreAutoCategory(item)
```

### À déplacer hors de ce fichier

```js
getMTTEntityType(actor)
```

vers `mtt-flags.mjs`.

---

## 2.4. `module/documents/merchant-products.mjs`

### Statut

Fichier existant à conserver.

### Rôle

Lecture/écriture des Embedded Items utilisés comme produits MTT.

### Fonctions attendues

```js
isMerchantProductItem(item)
getMerchantProductFlags(item)
getMerchantProductSourceUuid(item)
isMerchantProductCommerciallyModified(item)
merchantProductHasSecrets(item)
normalizeProductFlags(flags)
getCatalogProducts(actor)
getCatalogProduct(actor, itemId)
buildCatalogProductFromItem(item, options)
addCatalogProduct(actor, data)
updateCatalogProduct(actor, itemId, changes)
removeCatalogProduct(actor, itemId)
replaceCatalogProducts(actor, items)
findMergeableCatalogProduct(actor, data)
findMergeableCatalogItemBySourceUuid(actor, sourceUuid)
sanitizeItemDataForMerchantProductCopy(itemData)
```

### Notes

Le nom du fichier peut rester `merchant-products.mjs` car il décrit le modèle historique des produits MTT.

---

## 2.5. `module/documents/merchant-conversion.mjs`

### Statut

Fichier existant à conserver.

### Rôle

Conversion d’acteurs système en entités MTT et ouverture des feuilles.

### Fonctions attendues

```js
convertActorToMerchant(actor)
convertActorToStorage(actor)
openMerchantSheet(actor)
openStorageSheet(actor)
openManagerActorSheet(actor)
removeMerchantFromActor(actor)
removeStorageFromActor(actor)
openMTTConversionDialog(actor)
registerActorSheetHeaderHooks()
registerMerchantSheetOpenHooks()
registerActorDirectoryHooks()
```

### Notes

Les imports de flags devront suivre les renommages : `mtt-flags.mjs`, `shop-flags.mjs`, `storage-flags.mjs`.

---

## 2.6. `module/documents/merchant-permissions.mjs`

### Statut

Renommage cible de `module/documents/merchant-access.mjs`.

### Rôle

Matrice de permissions configurables et droits utilisateur.

### Fonctions et constantes attendues

```js
MERCHANT_CONFIGURABLE_PERMISSIONS
MERCHANT_PERMISSION_DEFINITIONS
MERCHANT_DEFAULT_PERMISSION_PROFILES
MERCHANT_PERMISSION_PROFILE_KEYS
MERCHANT_OWNER_ONLY_PERMISSION_KEYS
canConfigureMerchantPermission(permissionKey)
normalizeMerchantPermissionProfiles(profiles)
getMerchantPermissions(actor)
getUserActorAccessLevel(actor, user)
canUserViewClientActor(actor, clientActorUuid, user, options)
canUserViewClientSession(actor, session, user, options)
canUserViewClientJournalEntries(actor, clientActorUuid, user, options)
getMerchantAccessContext(actor, user)
```

### Notes

- Ce fichier ne gère pas le rail visuel.
- Ce fichier ne modifie pas les sessions.
- Le mot `merchant` dans les noms de permissions peut rester tant que la matrice historique est celle du shop/base.

---

## 2.7. `module/applications/sheets/merchant-rail.mjs`

### Statut

Nouveau fichier à créer.

### Rôle

Rail des acteurs : données d’accès, acteurs autorisés, sélection, cartes, affichage DOM et helpers rail.

Ce fichier regroupe ce qui aurait pu être séparé entre `merchant-session-access.mjs` et `merchant-access-rail.mjs`.

### Fonctions à déplacer depuis `merchant-trade.mjs`

```js
normalizeAccessClient(client)
buildAccessClientFromActor(actor, options)
getStoredAccessClients(actor)
getBestSessionForClient(sessions, actorUuid)
prepareAccessClients(actor, options)
getMerchantDefaultClientRates()
normalizeClientCustomRates(rates)
getEffectiveClientRates(actor, client, options)
```

### Fonctions à déplacer depuis `merchant-sheet.mjs` si possible

Fonctions privées de construction visuelle du rail, à transformer en fonctions exportées si elles ne dépendent pas fortement de `this` :

```js
buildAccessRailElement(context, options)
buildAccessRailClientCard(client, options)
buildAccessRailContextMenu(client, options)
getAccessRailStatusClass(client)
getAccessRailTooltip(client)
```

Les noms exacts peuvent être adaptés à l’existant.

### À laisser dans `merchant-sheet.mjs`

Les handlers qui dépendent directement de `this`, du DOM Application V2 ou du rendu peuvent rester dans la classe :

```js
#renderAccessRail(context)
#activateAccessRail(rail)
#onClientDragOver(event)
#onClientDrop(event)
#onClientContextMenu(event, target)
#selectClient(actorUuid)
#removeAccessClient(actorUuid)
```

### Notes

- Ce fichier peut importer `merchant-permissions.mjs` si nécessaire.
- Ce fichier ne doit pas exécuter de transaction.
- Ce fichier ne doit pas contenir de logique de transfert d’Items.

---

## 2.8. `module/applications/sheets/merchant-session.mjs`

### Statut

Nouveau fichier à créer.

### Rôle

Modèle et manipulation commune des sessions shop/storage.

### Fonctions à déplacer depuis `merchant-trade.mjs`

```js
normalizeSessionItem(item)
normalizeNegotiationOffer(offer)
normalizeSessionNegotiation(negotiation)
normalizeSession(session)
buildSessionData(actorUuid, options)
getSessions(actor)
recalculateSessionItemTotal(item)
setSessionItemQuantity(session, side, itemId, quantity)
getSessionItemsForSide(session, side)
removeSessionItemById(session, side, itemId)
canAcceptSessionQuantity(item, requestedQuantity, options)
prepareSessionContext(actor, options)
clearSessionAfterExecution(session)
```

### Fonctions à déplacer depuis `merchant-sheet.mjs` si elles sont pures

```js
helpers de lecture de session active
helpers de quantité buyer/seller
helpers de création d’item de session
helpers de mise à jour d’une ligne de session
helpers de nettoyage local de session
```

Ne déplacer que les fonctions qui ne dépendent pas fortement de `this`, `this.actor`, `this.render()` ou `this.element`.

### Notes

- Ce fichier ne doit pas gérer les sockets.
- Ce fichier ne doit pas exécuter les transferts réels.
- Ce fichier peut être importé par `merchant-sheet.mjs`, `merchant-trade.mjs` et `merchant-session-socket.mjs`.

---

## 2.9. `module/applications/sheets/merchant-session-socket.mjs`

### Statut

Fichier existant à conserver.

### Rôle

Socket uniquement : demandes de mise à jour de sessions et tags storage.

### Fonctions attendues

```js
registerMerchantSessionSocket()
requestMerchantSessionUpdate(actor, updateData, options)
requestStorageTagUpdate(item, actorUuid, tagType, options)
```

### Règle

Ne pas ajouter dans ce fichier :

```text
normalisation générale de session
préparation du contexte session
exécution de transaction
rendu de feuille
rail visuel
```

Ce fichier peut importer `merchant-session.mjs` si un helper de normalisation est nécessaire.

---

## 2.10. `module/applications/sheets/merchant-trade.mjs`

### Statut

Fichier existant à réduire mais conserver.

### Rôle final

Validation, preview, exécution métier et transferts réels.

### Fonctions attendues à conserver

```js
applyCurrencyTransferPlan(merchantActor, clientActor, plan)
checkSessionTransaction(merchantActor, clientActor, session, options)
isMerchantSellerDropBlocked(actor, item, options)
buildExecutionPreview(merchantActor, clientActor, session, options)
buildSessionItemExecutionPlan(merchantActor, clientActor, session, options)
executeSessionItemTransfers(merchantActor, clientActor, executionPlan, options)
```

### Fonctions à déplacer vers `merchant-session.mjs`

```js
normalizeSessionItem
normalizeNegotiationOffer
normalizeSessionNegotiation
normalizeSession
buildSessionData
getSessions
recalculateSessionItemTotal
setSessionItemQuantity
getSessionItemsForSide
removeSessionItemById
canAcceptSessionQuantity
prepareSessionContext
clearSessionAfterExecution
```

### Fonctions à déplacer vers `merchant-rail.mjs`

```js
normalizeAccessClient
getMerchantDefaultClientRates
normalizeClientCustomRates
getEffectiveClientRates
buildAccessClientFromActor
getStoredAccessClients
getBestSessionForClient
prepareAccessClients
```

### Notes

Le fichier peut rester long si l’exécution des transferts y est cohérente.

---

## 2.11. `module/applications/sheets/merchant-catalog.mjs`

### Statut

Fichier existant à conserver.

### Rôle

Préparation du catalogue/contenu, produits, services, catégories, wallet et données de drop seller.

### Fonctions attendues

```js
adjustPriceValue(value, percent)
prepareTrade(actor)
prepareWalletCurrencies(actor)
getReferenceCurrency()
prepareItems(actor, options)
prepareServices(actor, options)
prepareProductCategories(actor, options)
getAutomaticItemCategory(item)
getOrCreateAutomaticProductCategory(actor, automaticCategory)
resolveDroppedItemSourceUuid(event, document)
findMergeableMerchantItemBySourceUuid(actor, sourceUuid)
addOrMergeProduct(actor, item, productCategoryValue, automaticCategory, sourceUuid)
moveProductToCategory(actor, itemId, categoryValue)
prepareMerchantCatalogItemData(item, options)
createServiceFromItem(item, options)
getItemAvailableQuantity(actor, item, options)
prepareSellerItemDropData(merchantActor, droppedItem, rates)
rehydrateMerchantItemsOnConversion(actor)
copyCatalogProduct(product, options)
copyCatalogService(service, options)
```

### Notes

Ne pas éclater ce fichier maintenant. Il est long mais son domaine est cohérent.

---

## 2.12. `module/applications/sheets/merchant-journal.mjs`

### Statut

Fichier existant à conserver.

### Rôle

Journaux locaux shop/storage.

### Fonctions attendues

```js
buildMerchantJournalEntryFromSession(actor, session, options)
getMerchantJournalTransactions(actor)
normalizeJournalEntry(entry)
appendMerchantJournalEntry(actor, entry)
prepareMerchantJournalContext(actor, options)
prepareJournalEntryDisplay(entry, options)
buildStorageJournalEntryFromSession(actor, session, options)
getStorageJournalEntries(actor)
appendStorageJournalEntry(actor, entry)
prepareStorageJournalContext(actor, options)
```

### Notes

Ne pas séparer shop/storage maintenant. Le domaine “journal local” est cohérent.

---

## 2.13. `module/applications/mtt-global-journal-app.mjs`

### Statut

Fichier existant à conserver.

### Rôle

Applications globales de journaux shop/storage.

### Classes attendues

```js
MttGlobalJournalApp
MttGlobalStorageJournalApp
```

### Notes

Pas prioritaire pour le nettoyage MJS.

---

## 2.14. `module/applications/sheets/merchant-dialogs.mjs`

### Statut

Fichier existant à conserver.

### Rôle

Dialogs MTT.

### Fonctions attendues

```js
renderMttDialogContent(templatePath, data)
renderConfirmDialogContent(data)
renderSessionPreparationDialog(data)
openSessionPreparationDialog(data)
openCatalogItemSecretsDialog(data)
openClientRatesDialog(data)
openPreviewDialog(data)
openPreviewErrorDialog(data)
openSessionValidationDialog(data)
openSessionExecutionErrorsDialog(data)
openRefuseConfirmDialog(data)
openSellerItemDialog(data)
```

### Notes

Le fichier est cohérent. Ne pas le découper maintenant.

---

## 2.15. `module/applications/sheets/merchant-utils.mjs`

### Statut

Fichier existant à conserver.

### Rôle

Helpers vraiment transversaux.

### Fonctions attendues à conserver

```js
parsePriceValue(value)
parseQuantityValue(value)
isUnlimitedQuantity(value)
normalizeFiniteQuantity(value)
buildProductAvailabilityMap(actor, options)
getConfiguredItemQuantity(item)
getConfiguredItemMaxQuantity(item)
normalizeMaxQuantity(value)
normalizeItemQuantity(value)
normalizeEffectiveDeliveryQuantityPerLot(value)
formatProductNameWithLotQuantity(name, quantity)
getAvailableStackSpace(item, maxQuantity)
getDeliveryStackingConfig(item)
hasSecretValue(value)
productHasSecretInfo(product)
getMttSourceUuid(item)
toItemOnlyUuid(uuid)
getDeliveredItemMergeMode(item)
normalizeCurrencyKey(value)
FREE_PRICE_CURRENCY_KEY
isFreePriceCurrency(currencyKey)
isFreePriceService(service)
normalizeCurrencyText(value)
resolveItemCurrencyKey(item, options)
getReferenceSessionCurrency()
convertPriceToReferenceCurrency(value, currencyKey, options)
roundToSmallestCurrencyUnit(value)
formatCurrencyLabel(currencyKey, options)
formatPriceLabel(value, currencyKey, options)
escapeHTML(value)
htmlToPlainText(value)
getMerchantSheetLockedState(actor)
getMerchantLimitedState(actor)
slugifyCategoryKey(value)
normalizeAutomaticCategoryValue(value)
localizeConfiguredValue(value, options)
createCheckMessage(key, data)
getItemDescription(item, options)
getItemPrice(item, options)
getItemCurrency(item, options)
getModuleSetting(key)
getConfiguredItemValue(item, path)
isItemTypeAllowed(item, settingKey)
getCategoryPaths()
getCategoryLabelMap()
readItemReferencePrice(item)
buildItemPriceWriteData(item, value, currencyKey)
prepareCurrencyOptions(options)
```

### Règle

Ne pas ajouter dans `merchant-utils.mjs` de logique de session, rail, journal ou trade.

---

## 2.16. `module/applications/sheets/merchant-sheet.mjs`

### Statut

Fichier existant à conserver et réduire progressivement.

### Rôle final

Classe `MerchantSheet` et orchestration de la feuille MTT commune.

### À garder

```js
export class MerchantSheet extends foundry.applications.api.HandlebarsApplicationMixin(...)
static DEFAULT_OPTIONS
static PARTS
_prepareContext(options)
_onRender(context, options)
_onClose(options)
handlers Application V2
méthodes dépendantes de this.actor
méthodes dépendantes de this.element
méthodes dépendantes de this.render()
méthodes d’orchestration qui appellent merchant-session / merchant-rail / merchant-trade
```

### À sortir progressivement

Vers `merchant-session.mjs` :

```text
helpers purs de session
calculs de quantité session
création/normalisation de lignes session non dépendante du DOM
```

Vers `merchant-rail.mjs` :

```text
préparation pure des clients rail
construction visuelle du rail si elle peut être isolée
helpers de tooltip/statut rail
```

Vers `merchant-permissions.mjs` :

```text
toute logique de matrice de droits ou profils de permission
```

Vers `merchant-trade.mjs` :

```text
validation métier
preview
execution plan
transfert réel
```

### Notes

`merchant-sheet.mjs` peut rester le plus gros fichier, mais il doit devenir plus lisible et orienté orchestration.

---

# 3. Ordre de refactor conseillé

## Étape A — Flags et permissions

1. Créer `mtt-flags.mjs`.
2. Déplacer `getMTTEntityType(actor)`.
3. Renommer `merchant-access.mjs` en `merchant-permissions.mjs`.
4. Adapter les imports.
5. Ne pas modifier la logique.

## Étape B — Rail

1. Créer `merchant-rail.mjs`.
2. Déplacer les fonctions d’accès client depuis `merchant-trade.mjs`.
3. Déplacer les helpers de rendu rail depuis `merchant-sheet.mjs` seulement si le déplacement est simple.
4. Adapter les imports.
5. Garder les handlers DOM complexes dans `merchant-sheet.mjs` si nécessaire.

## Étape C — Session

1. Créer `merchant-session.mjs`.
2. Déplacer la normalisation et manipulation de session depuis `merchant-trade.mjs`.
3. Adapter `merchant-sheet.mjs`, `merchant-trade.mjs` et `merchant-session-socket.mjs`.
4. Ne pas toucher à l’exécution des transferts.

## Étape D — Nettoyage final

1. Supprimer imports inutilisés.
2. Supprimer exports inutilisés confirmés.
3. Supprimer TODO obsolètes confirmés.
4. Ajouter commentaires de blocs.
5. Vérifier `node --check` sur tous les MJS modifiés.

---

# 4. Fichiers à ne pas créer pour cette phase

Ne pas créer :

```text
merchant-sheet-shop.mjs
merchant-sheet-storage.mjs
storage-sheet.mjs
merchant-session-access.mjs
merchant-access-rail.mjs
merchant-trade-storage.mjs
merchant-trade-shop.mjs
```

Décision retenue :

```text
merchant-rail.mjs regroupe rail + accès acteurs
merchant-session.mjs regroupe modèle session
merchant-permissions.mjs regroupe droits configurables
```

---

# 5. Critère de réussite

Le refactor est réussi si :

```text
les imports sont propres
les responsabilités de fichiers sont lisibles
merchant-sheet.mjs orchestre davantage et contient moins de logique pure
merchant-trade.mjs se concentre sur validation/exécution/transferts
les sessions ont un fichier dédié
le rail a un fichier dédié
les permissions ont un nom clair
le comportement shop/storage reste identique
```
