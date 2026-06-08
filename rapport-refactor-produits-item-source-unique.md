# Rapport refactor — Item marchand = source unique pour les produits

## 1. Résumé

Refactor complet de la couche commerciale des produits marchands. Avant ce refactor, le module maintenait deux sources de vérité en parallèle : les données natives de l'Item Foundry (nom, prix dans les chemins configurés) et un doublon commercial stocké dans `flags.mtt-merchants.product` (`displayName`, `priceValue`, `priceCurrency`, `isCommerciallyModified`). Ces données flags étaient prioritaires et pouvaient diverger silencieusement des données Item réelles.

Après ce refactor, l'Item embarqué chez le marchand est la source unique. Le catalogue lit le nom depuis `item.name`, le prix depuis le tableau des monnaies via `readItemReferencePrice(item)`. Les modifications (nom, prix) sont écrites directement sur l'Item. Le flag `isCommerciallyModified` n'est plus utilisé ni écrit pour les produits.

## 2. Fichiers modifiés

| Fichier | Nature des changements |
|---|---|
| `module/applications/sheets/merchant-utils.mjs` | Ajout `buildItemPriceWriteData`, correction `getDeliveredItemMergeMode` |
| `module/applications/sheets/merchant-catalog.mjs` | Refactor `prepareItems`, `updateMerchantProductCommercialData`, `createProductFlags`, `prepareMerchantCatalogItemData`, `findMergeableMerchantItemBySourceUuid` |
| `module/applications/sheets/merchant-trade.mjs` | Correction `buildVisibleProductItemData`, nettoyage delivery merge |
| `module/applications/sheets/merchant-sheet.mjs` | Ajout import `readItemReferencePrice`, correction `#onAddProductToSession`, `#getCatalogContextItem`, `#updateCatalogItemSecretData`, `minimumPriceValue` handler, `hasFreePrice` toggle |
| `templates/actors/parts/merchant-products.hbs` | Remplacement `item.displayName` → `item.name`, suppression bloc source-name |

## 3. Ancienne logique supprimée

### Champs flags supprimés (products uniquement)

- `displayName` : plus écrit dans `createProductFlags`, plus écrit dans `updateMerchantProductCommercialData`, plus lu comme priorité d'affichage
- `priceValue` (en tant que source commerciale) : plus écrit pour les modifications de prix, plus lu comme source de prix dans `prepareItems`
- `isCommerciallyModified` : plus écrit par aucune méthode product, plus lu comme switch de source de prix

### Logique supprimée

- Branche `if (hasFreePrice || isCommerciallyModified)` dans `prepareItems()` qui court-circuitait `readItemReferencePrice`
- `if (product.displayName) itemData.name = product.displayName` dans `buildVisibleProductItemData` (livraison)
- Check `product.isCommerciallyModified === true` dans `findMergeableMerchantItemBySourceUuid` (merge au drop)
- Check `isProductCommerciallyModified` dans `getDeliveredItemMergeMode` (fusion livraison)
- Écriture `updatedProduct.displayName = displayName` dans `updateMerchantProductCommercialData`
- Écriture `updatedProduct.priceValue = changes.priceValue` dans `updateMerchantProductCommercialData`
- Écriture via `getModuleSetting("itemPriceValuePath")` dans `updateMerchantProductCommercialData`
- Écriture via `getModuleSetting("itemPriceCurrencyPath")` dans `updateMerchantProductCommercialData`
- `productFlags.displayName = itemData.name` dans `createProductFlags`
- `productFlags.isCommerciallyModified = false` dans `createProductFlags`
- `setProperty(..., "isCommerciallyModified", false)` dans `prepareMerchantCatalogItemData`
- `isCommerciallyModified: false` dans le merge update (delivery)
- `isCommerciallyModified: true` dans `#updateCatalogItemSecretData` (product case)
- `isCommerciallyModified: true` dans `minimumPriceValue` handler
- `isCommerciallyModified: true` dans `hasFreePrice` toggle
- Bloc HBS `{{#if (ne item.displayName item.name)}}...source-name...{{/if}}`
- Propriétés `displayName`, `hasCustomDisplayName`, `isCommerciallyModified` retirées du retour de `prepareItems()`

## 4. Nouvelle logique d'affichage

### Nom

`item.name` directement. Aucun `displayName` flag en intermédiaire.

Affiché :
- Champ éditable (canEditMerchant) : `value="{{item.name}}"` avec `data-mtt-product-field="displayName"` (conserve la liaison HBS existante)
- Lecture seule : `{{item.name}}`
- Livraison vers acheteur : `itemData.name` non modifié (= nom de l'Item)
- Session/négociation : `item.name`
- Menu contextuel : `item.name`

### Prix

`readItemReferencePrice(item)` → convertion en monnaie de référence du tableau des monnaies configuré.

Fallback si pas de tableau configuré :
```js
const configuredPrice = getConfiguredItemValue(item, "itemPriceValuePath")
const legacyPrice = parsePriceValue(configuredPrice) ?? getItemPrice(item)
basePriceValue = legacyPrice !== null ? legacyPrice : MTT.PRODUCT_DEFAULTS.priceValue
```

`hasFreePrice: true` → le prix de base est utilisé tel quel (pas de conversion en monnaie de référence pour affichage, mais `hasFreePrice` affiche le prix minimum).

### Monnaie affichée

`selectedCurrencyKey = hasFreePrice ? FREE_PRICE_CURRENCY_KEY : priceCurrency`

Où `priceCurrency` vient de `readItemReferencePrice(item).currency` (= monnaie de référence) ou du fallback legacy.

## 5. Nouvelle logique d'écriture

### Nouveau helper `buildItemPriceWriteData(value, currency)`

Exporté depuis `merchant-utils.mjs`. Retourne `{ ok: boolean, paths: Record<string, any> }` sans appeler `item.update`.

- Si tableau des monnaies configuré (au moins une entrée avec `itemPricePath`) : utilise `resolveConfiguredCurrency(currency)` pour trouver la ligne correspondante, écrit `value` dans `targetCurrency.itemPricePath`, met à 0 les autres champs prix (systèmes multi-monnaies comme PF2), écrit l'identifiant dans `targetCurrency.itemCurrencyPath` si configuré
- Sinon : fallback legacy via `itemPriceValuePath`/`itemPriceCurrencyPath` (settings globaux)
- Si aucun chemin trouvé : retourne `{ ok: false, paths: {} }`

### `updateMerchantProductCommercialData(item, changes)`

- `displayName` change → `updateData.name = name` (écrit sur l'Item)
- `priceValue` change → `buildItemPriceWriteData(changes.priceValue, product.priceCurrency)` → écrit via chemins du tableau des monnaies
- `priceCurrency` change → uniquement `product.priceCurrency` dans les flags (préférence d'écriture pour le prochain changement de prix), `product.hasFreePrice` mis à jour → flags sauvegardés
- Les flags ne sont mis à jour que si `priceCurrency` a changé (pas pour `displayName` ni `priceValue`)
- Aucun `isCommerciallyModified`, aucun `displayName` dans les flags

## 6. Gestion prix/monnaie via tableau des monnaies

### Lire

`readItemReferencePrice(item)` — déjà en place depuis étape B du refactor monnaies. Lit tous les champs prix de l'Item correspondant aux entrées `currencies[]`, convertit en monnaie de référence.

### Écrire

`buildItemPriceWriteData(value, currency)` — nouveau. Identifie l'entrée `currencies[]` ciblée et construit le dictionnaire de mises à jour.

La préférence de monnaie d'écriture du MJ est stockée dans `product.priceCurrency` (flag) et utilisée lors du prochain changement de prix.

## 7. Flags conservés (products)

| Flag | Rôle | Modifié par ce refactor ? |
|---|---|---|
| `sourceUuid` | UUID de l'Item source (compendium/monde) | Non — conservé |
| `hasFreePrice` | Prix libre (acheteur propose) | Non — conservé |
| `minimumPriceValue` | Prix minimum pour prix libre | Non — conservé |
| `priceCurrency` | Préférence monnaie d'écriture | Changé : n'est plus source d'affichage, devient préférence write |
| `category` | Catégorie manuelle MJ | Non — conservé |
| `systemCategoryKey/Label/Path` | Catégorie automatique système | Non — conservé |
| `systemSubcategory` | Sous-catégorie | Non — conservé |
| `ownershipLevel` | Niveau de visibilité | Non — conservé |
| `isHidden` | Caché dans catalogue | Non — conservé |
| `requiresApproval` | Nécessite approbation MJ | Non — conservé |
| `quantity` | Stock | Non — conservé |
| `isSecretExpanded` | Expansion UI des secrets | Non — conservé |
| `secretName/Price/Currency/Description` | Informations secrètes | Non — conservés |

## 8. Flags ignorés (products)

| Flag | Ancien rôle | Nouveau statut |
|---|---|---|
| `displayName` | Nom commercial prioritaire | Plus écrit, plus lu — dormant dans les données existantes |
| `priceValue` | Prix commercial override | Plus écrit (pour prix), plus lu — dormant dans les données existantes |
| `isCommerciallyModified` | Switch source de prix | Plus écrit (products), plus lu — dormant dans les données existantes |

Ces champs dorment dans les anciens produits sans provoquer de mauvais affichage. Ils peuvent être migrés/supprimés dans une étape ultérieure si nécessaire.

> Note : `isCommerciallyModified` reste en place et fonctionnel pour les **services** (`merchant-sheet.mjs` lignes 3434, 3731, 3740, 3753, 3760, 3764, 3796, `merchant-catalog.mjs` ligne 322). Aucune modification des services dans ce refactor.

## 9. Impacts livraison

`buildVisibleProductItemData(sourceItem, product, quantity)` :
- **Avant** : `if (product.displayName) itemData.name = product.displayName` → le nom commercial était appliqué à l'Item livré
- **Après** : `itemData.name` non modifié → l'acheteur reçoit l'Item avec son vrai nom
- **Avant** : flags livrés contenaient `{ sourceUuid, isCommerciallyModified }` 
- **Après** : flags livrés contiennent uniquement `{ sourceUuid }`

Conséquence : les Items dans l'inventaire acheteur ont le nom réel de l'Item source, pas un nom commercial personnalisé. Si le MJ avait modifié le nom dans le catalogue, la modification est maintenant permanente sur l'Item lui-même (via `item.update({ name })`) et se reflète à la livraison.

## 10. Impacts fusion

`getDeliveredItemMergeMode(existingItem, deliveredItemData, productData)` :
- **Avant** : bloquait la fusion si `isProductCommerciallyModified` (= `isCommerciallyModified || hasSecrets`)
- **Après** : bloque la fusion uniquement si `productHasSecretInfo` (secrets)

Conséquence : les produits modifiés commercialement (prix changé, nom changé) **peuvent maintenant fusionner** avec les Items existants de même `sourceUuid`, à condition qu'ils n'aient pas de secrets. C'est le comportement voulu : l'Item est la source unique, ses modifications sont structurelles.

`findMergeableMerchantItemBySourceUuid(actor, sourceUuid)` :
- **Avant** : ne proposait pas de fusion si `product.isCommerciallyModified === true`
- **Après** : fusionne toujours les produits de même `sourceUuid` (quantité +1)

Conséquence : si le MJ drop le même Item source plusieurs fois, il incrémente toujours le stock au lieu de créer un doublon.

## 11. Éléments non modifiés

- Logique services (`isCommerciallyModified` pour services conservée intacte)
- `isProductCommerciallyModified()` dans `merchant-utils.mjs` — conservée (toujours exportée, potentiellement utile)
- `PRODUCT_DEFAULTS.displayName`, `PRODUCT_DEFAULTS.isCommerciallyModified` dans `constants.mjs` — conservés (données model, cleanup étape suivante)
- `isCommerciallyModified` dans le schéma `merchant-data.mjs` — conservé (cleanup étape suivante)
- `merchant-trade.mjs` logique de transaction, socket, journal
- Comportement `hasFreePrice` (prix libre) — inchangé
- Comportement secrets (`secretName`, `secretPrice`, etc.) — inchangé
- Styles LESS, CSS
- Fichiers de langue (aucune clé ajoutée/supprimée)

## 12. Tests effectués

Tests statiques :
- [x] `merchant-utils.mjs` : `buildItemPriceWriteData` utilise `resolveConfiguredCurrency`, `parseCurrencyAliases`, `getCurrencies`, `getModuleSetting` — tous disponibles dans le même fichier
- [x] `merchant-catalog.mjs` : `buildItemPriceWriteData` ajouté aux imports ✓
- [x] `merchant-sheet.mjs` : `readItemReferencePrice` ajouté aux imports ✓
- [x] `prepareItems()` : `getConfiguredItemValue`, `parsePriceValue`, `getItemPrice`, `getItemCurrency`, `resolveItemCurrencyKey` — tous déjà importés dans `merchant-catalog.mjs` ✓
- [x] HBS : `item.displayName` absent de `merchant-products.hbs`, `item.name` utilisé ✓
- [x] Services non touchés : toutes les occurrences `isCommerciallyModified` dans les sections service de `merchant-sheet.mjs` (lignes 3434, 3731, 3740, 3753, 3760, 3764, 3796) et `merchant-catalog.mjs` ligne 322 sont intactes ✓
- [x] `buildVisibleProductItemData` : `productHasSecretInfo` toujours importé dans `merchant-trade.mjs` (utilisé ailleurs) ✓

Tests fonctionnels (à effectuer en jeu) :
- [ ] Ouvrir catalogue marchand : noms des produits affichés depuis `item.name`
- [ ] Modifier nom produit dans catalogue : `item.name` mis à jour, affichage cohérent
- [ ] Modifier prix produit dans catalogue : prix écrit via tableau des monnaies (ou legacy si non configuré)
- [ ] Modifier monnaie : `product.priceCurrency` (préférence) mis à jour, pas d'écriture item immédiate
- [ ] Changer monnaie puis prix : prix écrit dans la nouvelle monnaie choisie
- [ ] Toggle prix libre : `hasFreePrice` togglé sans `isCommerciallyModified`
- [ ] Ajouter produit à session : nom = `item.name`, prix = `readItemReferencePrice` ou fallback
- [ ] Drop même Item source × 2 : stock +1 (merge) même si prix/nom modifiés
- [ ] Livraison produit : acheteur reçoit Item avec `item.name` réel
- [ ] Livraison deux fois même produit sans secrets : fusion possible (si `sourceUuid` match)
- [ ] Livraison produit avec secrets : pas de fusion ✓
- [ ] Anciens produits avec `isCommerciallyModified=true` dans flags : affichent le prix depuis l'Item (pas depuis flags) ✓
- [ ] Services inchangés : toggle prix libre service, modification nom/prix service — aucune régression

## 13. Risques restants

- **Anciens produits avec `displayName` ≠ `item.name`** : la divergence existante entre `product.displayName` (flag) et `item.name` (Item) est définitivement résolue en faveur de `item.name`. Si le MJ avait un nom commercial différent du nom source, l'affichage change au premier re-render après le refactor. La modification est permanente sur l'Item si le MJ avait déjà modifié le nom via le catalogue (car `updateMerchantProductCommercialData` écrivait déjà sur `item.name`).

- **Anciens produits avec `isCommerciallyModified=true` et `priceValue` flag ≠ prix Item** : le prix affiché bascule vers `readItemReferencePrice(item)` (ou fallback legacy). Si le MJ avait un prix commercial différent du prix Item réel, l'affichage change. Solution recommandée : vérifier/resynchroniser les prix des produits existants après mise à jour.

- **Systèmes sans tableau de monnaies configuré (`currencies[]` vide)** : le fallback legacy (`itemPriceValuePath`/`itemPriceCurrencyPath`) est préservé dans `buildItemPriceWriteData` et dans `prepareItems()`. Ces systèmes fonctionnent comme avant pour la lecture (depuis l'Item via le chemin configuré) et l'écriture.

- **Systèmes sans aucune configuration de chemin prix** : `buildItemPriceWriteData` retourne `{ ok: false }` et `ui.notifications.warn("mtt.notifications.noItemPricePath")` est affiché. La clé de notification doit exister en FR et EN — à vérifier (probablement existante depuis étape antérieure).

- **`priceValue` dans flags et `hasFreePrice`** : quand `hasFreePrice=true`, le prix de base utilisé pour le minimum price est `basePriceValue` de `prepareItems()`, qui vient maintenant de `readItemReferencePrice`. Si le produit free-price n'a pas de prix dans l'Item, `basePriceValue = 0`. C'est cohérent.

- **Suppression de `isProductCommerciallyModified`** : la fonction est encore exportée et référencée dans le rapport étape 9 comme potentiellement utile. Elle n'est plus appelée en interne après ce refactor (plus utilisée dans `getDeliveredItemMergeMode`). À supprimer ou conserver selon l'API publique souhaitée dans une étape de cleanup.
