# Rapport nettoyage final MTT — Étape 3 : MJS exports/helpers/imports

## 1. Résumé

Suppression de 4 fonctions inutilisées, retrait du mot-clé `export` sur 39 fonctions internes réparties dans `merchant-utils.mjs` (13) et `merchant-trade.mjs` (26). Aucun import mort identifié. Aucune logique métier modifiée.

---

## 2. Fichiers modifiés

| Fichier | Changements |
|---|---|
| `module/applications/sheets/merchant-catalog.mjs` | Suppression de `getSellPercent`, `getServiceSellPercent` |
| `module/config/settings.mjs` | Suppression de `setCurrencies` |
| `module/applications/sheets/merchant-utils.mjs` | Suppression de `buildCurrencySelectOptions` ; retrait de `export` sur 13 fonctions internes |
| `module/applications/sheets/merchant-trade.mjs` | Retrait de `export` sur 24 fonctions + 2 fonctions `async` internes |

---

## 3. Imports supprimés

Aucun import mort identifié dans l'ensemble du module. Tous les imports existants correspondent à des symboles réellement utilisés dans le fichier importeur.

---

## 4. Exports supprimés (fonctions entièrement supprimées)

### 4.1 `getSellPercent` — `merchant-catalog.mjs`

Lisait `actor.system.trade?.sellPercent`. Jamais importée par aucun fichier. Doublon avec la logique embarquée dans `prepareItems` et `prepareServices`.

### 4.2 `getServiceSellPercent` — `merchant-catalog.mjs`

Lisait `actor.system.trade?.serviceSellPercent`. Même situation que `getSellPercent`.

### 4.3 `setCurrencies` — `settings.mjs`

Wrapper de `game.settings.set(MTT.ID, "currencies", JSON.stringify(currencies))`. Jamais importé. Tous les écrits en devises passent directement par `game.settings.set` dans `mtt-config-app.mjs`.

### 4.4 `buildCurrencySelectOptions` — `merchant-utils.mjs`

Construisait des `<option>` HTML pour un sélecteur de devises. Jamais importée. La sélection de devise se fait via `prepareCurrencyOptions()` dans les templates HBS et les dialogues.

---

## 5. Helpers rendus privés (retrait de `export` seulement)

### 5.1 merchant-utils.mjs — 13 fonctions

| Fonction | Appelante interne |
|---|---|
| `isUnlimitedMaxQuantity` | `normalizeMaxQuantity` |
| `canStrictMergeDeliveredItem` | `getDeliveredItemMergeMode` |
| `canExtendedMergeDeliveredItem` | `getDeliveredItemMergeMode` |
| `resolveConfiguredCurrency` | `resolveItemCurrencyKey`, `buildItemPriceWriteData` |
| `cleanMoneyNumber` | `roundToSmallestCurrencyUnit` |
| `getSmallestCurrencyRate` | `roundToSmallestCurrencyUnit` |
| `formatAutomaticCategoryLabel` | `normalizeAutomaticCategoryValue` (via getAutomaticItemCategory) |
| `getAllowedTypes` | `isItemTypeAllowed` |
| `parseCurrencyAliases` | `readItemCurrencyAmount`, `buildItemPriceWriteData` |
| `matchesCurrencyAlias` | `readItemCurrencyAmount` |
| `readItemCurrencyAmount` | `readItemCurrencyAmounts` |
| `readItemCurrencyAmounts` | `readItemReferencePrice` |
| `convertCurrencyAmountsToReference` | `readItemReferencePrice` |

### 5.2 merchant-trade.mjs — 26 fonctions (24 régulières + 2 async)

Toutes ces fonctions sont utilisées uniquement en interne par d'autres fonctions du même fichier (`buildExecutionPreview`, `buildSessionItemExecutionPlan`, `prepareSessionContext`, `checkSessionTransaction`, etc.) :

`syncSessionItemAvailability`, `prepareSessionTotals`, `prepareMoneyAdjustments`, `getSessionStatusNotice`, `prepareSessionCheckContext`, `prepareSessionClientContext`, `normalizeClientRateValue`, `formatClientCustomRatesTooltip`, `getAccessSessionBadgeIcon`, `getAccessSessionTooltipLabel`, `formatAccessClientTooltip`, `getConfiguredCurrency`, `getMerchantWalletAmount`, `getActorCurrencyAmount`, `prepareBuyerFortune`, `buildCurrencyTransferPlan`, `checkLimitedSessionQuantity`, `checkSessionStatus`, `checkSessionBuyerItems`, `checkSessionMoneyAdjustments`, `checkSessionCurrencies`, `getProductCheckAvailableQuantity`, `getServiceCheckAvailableQuantity`, `simulatePurchasedItemDeliveryToActor` *(async)* `checkSessionSellerItems`, *(async)* `deliverPurchasedItemToActor`

---

## 6. Helpers conservés car réellement utilisés

### merchant-utils.mjs — exports restants (44)

Toutes les fonctions exportées sont importées par au moins un autre fichier du module :
- `merchant-trade.mjs` importe : `normalizeCurrencyKey`, `normalizeCurrencyText`, `formatCurrencyLabel`, `formatPriceLabel`, `createCheckMessage`, `parseQuantityValue`, `isUnlimitedQuantity`, `isFreePriceService`, `normalizeFiniteQuantity`, `getConfiguredItemQuantity`, `getConfiguredItemMaxQuantity`, `normalizeMaxQuantity`, `normalizeItemQuantity`, `getAvailableStackSpace`, `getDeliveryStackingConfig`, `getMttSourceUuid`, `getDeliveredItemMergeMode`, `roundToSmallestCurrencyUnit`, `escapeHTML`, `getModuleSetting`, `hasSecretValue`, `productHasSecretInfo`
- `merchant-catalog.mjs` importe : `parsePriceValue`, `parseQuantityValue`, `isUnlimitedQuantity`, `FREE_PRICE_CURRENCY_KEY`, `isFreePriceCurrency`, `isFreePriceService`, `formatPriceLabel`, `normalizeAutomaticCategoryValue`, `slugifyCategoryKey`, `getCategoryPaths`, `getCategoryLabelMap`, `localizeConfiguredValue`, `getConfiguredItemValue`, `getModuleSetting`, `getItemDescription`, `getItemPrice`, `getItemCurrency`, `resolveItemCurrencyKey`, `getReferenceSessionCurrency`, `htmlToPlainText`, `productHasSecretInfo`, `readItemReferencePrice`, `buildItemPriceWriteData`
- `merchant-sheet.mjs` importe : `isUnlimitedQuantity`, `isFreePriceCurrency`, `isFreePriceService`, `normalizeFiniteQuantity`, `convertPriceToReferenceCurrency`, `formatPriceLabel`, `isItemTypeAllowed`, `prepareCurrencyOptions`, `htmlToPlainText`, `getMerchantSheetLockedState`, `getMerchantLimitedState`, `productHasSecretInfo`, `readItemReferencePrice`, `getItemPrice`, `getItemCurrency`, `resolveItemCurrencyKey`
- `merchant-dialogs.mjs` importe : `prepareCurrencyOptions`
- `merchant-journal.mjs` importe : `formatPriceLabel`, `productHasSecretInfo`

### merchant-trade.mjs — exports restants (27)

Toutes importées par `merchant-sheet.mjs` ou `merchant-session-socket.mjs`.

---

## 7. API publique actuelle

```js
game.modules.get(MTT.ID).api = {
  MTT,       // module/config/constants.mjs
  models,    // → { MerchantData }
  applications, // → { MerchantSheet, MttConfigApp }
}
```

Aucun autre export n'est accessible via l'API officielle. Tous les exports non présents ici sont internes au module.

---

## 8. Cycles d'import

Le cycle `settings.mjs ↔ mtt-config-app.mjs` a été cassé à l'étape 2 via la création de `config-export.mjs`.

Graphe actuel (simplifié) :
```
mtt.mjs
  → constants.mjs
  → settings.mjs → constants.mjs, mtt-config-app.mjs, mtt-global-journal-app.mjs
  → models/_module.mjs → merchant-data.mjs
  → applications/_module.mjs → merchant-sheet.mjs, mtt-config-app.mjs
  → merchant-session-socket.mjs → merchant-trade.mjs

merchant-sheet.mjs → merchant-utils.mjs, merchant-catalog.mjs, merchant-trade.mjs,
                      merchant-dialogs.mjs, merchant-journal.mjs, merchant-session-socket.mjs
merchant-trade.mjs → merchant-utils.mjs, merchant-catalog.mjs
merchant-catalog.mjs → merchant-utils.mjs, settings.mjs
merchant-utils.mjs → settings.mjs, constants.mjs
mtt-config-app.mjs → config-export.mjs, constants.mjs
config-export.mjs → constants.mjs
```

Aucun cycle détecté.

---

## 9. Globaux Foundry vérifiés (diagnostic)

| Usage | Statut |
|---|---|
| `foundry.applications.handlebars.renderTemplate(...)` | ✓ API V14+ correcte |
| `foundry.utils.saveDataToFile(...)` | ✓ API V14+ correcte |
| `foundry.applications.apps.FilePicker.implementation` | ✓ corrigé étape précédente |
| `console.info` dans `mtt.mjs` | ✓ intentionnel (init/ready logs) |
| `console.debug` dans `merchant-session-socket.mjs` | ✓ gardé par flag `MTT_DEBUG_SESSION_SOCKET` |
| Aucun `console.log`, `debugger`, `Dialog`, `renderTemplate` global | ✓ |

---

## 10. Risques restants

| Point | Niveau | Note |
|---|---|---|
| Fonction retirée réutilisée dynamiquement | Très faible | Les 4 suppressions n'ont aucun accès dynamique (pas de `game.modules.get(...).api`, pas de `data-action`) |
| `export` retiré d'une fonction de merchant-trade.mjs | Faible | Ces fonctions ne sont PAS dans les imports de merchant-sheet.mjs ni merchant-session-socket.mjs — vérification complète effectuée |

---

## 11. Recommandation pour l'étape suivante

Étape 4 : nettoyage HBS (templates), CSS/LESS, et lang (clés orphelines dans fr.json / en.json non liées aux settings).
