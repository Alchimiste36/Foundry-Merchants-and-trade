# Rapport — Refactor "Item marchand = source unique" — Étape 2

## Objectif

Nettoyer et stabiliser les reliquats du refactor produit (étape 1). Supprimer les dernières dépendances aux anciens flags commerciaux (`displayName`, `priceValue`, `isCommerciallyModified`) pour les produits. Centraliser la lecture legacy des prix dans un helper dédié. Déplacer les paramètres de compatibilité dans une section UI séparée.

---

## Fichiers modifiés

### `module/config/constants.mjs`

**Suppression de 3 clés de `PRODUCT_DEFAULTS` :**
- `displayName: ""`
- `priceValue: 0`
- `isCommerciallyModified: false`

Ces valeurs n'ont plus de rôle : le nom vient de `item.name`, le prix de l'Item directement, et `isCommerciallyModified` n'est plus utilisé pour les produits.

---

### `module/applications/sheets/merchant-utils.mjs`

**Suppression de `isProductCommerciallyModified` :**
Fonction export qui n'était plus importée nulle part après l'étape 1. Supprimée proprement.

**Ajout de `readItemLegacyPriceData(item)` :**
Helper qui centralise la lecture du prix et de la devise via les anciens chemins globaux (`itemPriceValuePath` / `itemPriceCurrencyPath`), en repli sur les valeurs système de l'item (`getItemPrice` / `getItemCurrency`). Retourne `{ value: number, currency: string }`. Remplace les blocs répétés dans `prepareItems` et `createProductFlags`.

---

### `module/applications/sheets/merchant-catalog.mjs`

**Import de `readItemLegacyPriceData` depuis `merchant-utils.mjs`.**

**`prepareItems` — bloc legacy simplifié :**
```js
const legacyData = readItemLegacyPriceData(item)
basePriceValue = legacyData.value
priceCurrency = legacyData.currency || (product.priceCurrency?.trim() ?? "")
```
- Suppression de `MTT.PRODUCT_DEFAULTS.priceValue` comme fallback final
- Suppression des appels directs à `getConfiguredItemValue` / `parsePriceValue` / `getItemPrice` / `getItemCurrency` / `resolveItemCurrencyKey` dans ce bloc

**`createProductFlags` — suppression de l'écriture `priceValue` dans les flags :**
```js
const universalPrice = readItemReferencePrice(itemData)
if (universalPrice !== null) {
  productFlags.priceCurrency = universalPrice.currency
} else {
  const legacyData = readItemLegacyPriceData(itemData)
  productFlags.priceCurrency = legacyData.currency
}
```
Le flag `priceValue` n'est plus écrit : le prix est toujours lu depuis l'Item directement.

---

### `module/applications/sheets/merchant-sheet.mjs`

**Import de `readItemLegacyPriceData`.**

**`#onAddProductToSession` — suppression de `product.priceValue` comme source :**
```js
const universalPrice = readItemReferencePrice(item);
const legacyPriceData = universalPrice === null ? readItemLegacyPriceData(item) : null;
const basePriceValue = universalPrice !== null ? universalPrice.value : legacyPriceData.value;
const priceCurrency = universalPrice !== null
  ? universalPrice.currency
  : (legacyPriceData.currency || product.priceCurrency?.trim() || "");
```
- `product.priceValue` (flag commercial) n'est plus lu
- `MTT.PRODUCT_DEFAULTS.priceValue` n'est plus utilisé

**`priceValue` field handler — reset sur entrée invalide :**
```js
const _universalPrice = readItemReferencePrice(item);
target.value = _universalPrice !== null ? _universalPrice.value : readItemLegacyPriceData(item).value;
```
Lit le prix courant depuis l'Item plutôt que depuis l'ancien flag.

---

### `lang/fr.json` et `lang/en.json`

**Ajout de `mtt.notifications.noItemPricePath` :**
- FR : `"Aucun chemin de prix d'item configuré. Vérifiez les paramètres de compatibilité du module."`
- EN : `"No item price path configured. Check the module compatibility settings."`

**Ajout de `mtt.config.sections.legacy` et `mtt.config.sections.legacyHint` :**
- FR : section "Compatibilité — anciens chemins de prix" avec description explicative
- EN : section "Compatibility — legacy price paths"

---

### `templates/apps/mtt-config.hbs`

**Déplacement de `itemPriceValuePath` et `itemPriceCurrencyPath` :**
- Retirés de la section "Chemins des objets" (section `items`)
- Ajoutés dans une nouvelle section "Compatibilité — anciens chemins de prix" en bas du formulaire, avec hint explicatif

Les autres chemins d'items (`itemQuantityPath`, `itemDescriptionPath`, `itemSecretDescriptionPath`) restent dans la section principale.

---

## Invariants respectés

- Les services (`system.services.entries[]`) ne sont **pas touchés** : leur `isCommerciallyModified`, `priceValue`, etc. dans le DataModel sont inchangés.
- `merchant-data.mjs` n'est **pas modifié** : les champs `system.manager.displayName` (ligne 478) et `system.services.entries[].isCommerciallyModified` (ligne 764) sont indépendants des flags produits.
- La lecture des prix legacy (via `itemPriceValuePath` / `itemPriceCurrencyPath`) reste fonctionnelle en repli pour les configurations sans table de devises.
- `product.priceCurrency` dans les flags reste utilisé comme préférence d'affichage de devise (fallback ultime).
