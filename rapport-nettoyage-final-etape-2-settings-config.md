# Rapport nettoyage final MTT — Étape 2 : settings, config, export

## 1. Résumé

Suppression des 3 settings obsolètes (`itemPriceValuePath`, `itemPriceCurrencyPath`, `actorCurrencyPath`), de leur UI, de leurs usages dans le code métier, et cassure du cycle d'import circulaire entre `settings.mjs` et `mtt-config-app.mjs`.

---

## 2. Nouveau fichier créé

### `module/config/config-export.mjs`

Contient `MTT_EXPORTABLE_CONFIG_SETTINGS` et `buildModuleConfigurationExport()`, extraits de `settings.mjs`. Ce déplacement casse le cycle circulaire :

**Avant :**
- `settings.mjs` → importe `MttConfigApp` (pour le menu)
- `mtt-config-app.mjs` → importe `MTT_EXPORTABLE_CONFIG_SETTINGS` depuis `settings.mjs`
→ **cycle**

**Après :**
- `settings.mjs` → importe `MttConfigApp` (inchangé)
- `mtt-config-app.mjs` → importe `MTT_EXPORTABLE_CONFIG_SETTINGS` depuis `config-export.mjs`
→ **pas de cycle**

---

## 3. Fichiers modifiés

| Fichier | Changements |
|---|---|
| `module/config/settings.mjs` | Suppression des 3 `game.settings.register`, suppression des exports `MTT_EXPORTABLE_CONFIG_SETTINGS` et `buildModuleConfigurationExport` |
| `module/applications/mtt-config-app.mjs` | Import changé vers `config-export.mjs`, retrait de 3 clés dans `_prepareContext`, retrait de 3 `game.settings.set` dans `#onSave` |
| `module/applications/sheets/merchant-utils.mjs` | Suppression de `readItemLegacyPriceData`, simplification de `getComparableInitialPrice` et `getComparableCurrency`, simplification de `buildItemPriceWriteData` (retrait du bloc fallback legacy) |
| `module/applications/sheets/merchant-catalog.mjs` | Retrait de l'import `readItemLegacyPriceData`, 4 blocs `else` mis à jour avec `getItemPrice`/`getItemCurrency`/`resolveItemCurrencyKey` |
| `module/applications/sheets/merchant-sheet.mjs` | Remplacement de `readItemLegacyPriceData` par `getItemPrice`/`getItemCurrency`/`resolveItemCurrencyKey` dans 2 endroits, import mis à jour |
| `templates/apps/mtt-config.hbs` | Suppression du champ `actorCurrencyPath`, suppression de la section entière "Compatibilité" |
| `lang/fr.json` | Suppression de 3 blocs settings, mise à jour de `noItemPricePath`, suppression de `sections.legacy` et `sections.legacyHint` |
| `lang/en.json` | Idem |

---

## 4. Settings supprimés

### 4.1 `itemPriceValuePath`

Chemin de lecture du prix numérique d'un item. Utilisé dans le bloc legacy de `buildItemPriceWriteData` et dans `readItemLegacyPriceData`. Remplacé par `getItemPrice(item)` (lecture standard Foundry).

### 4.2 `itemPriceCurrencyPath`

Chemin de lecture de la monnaie d'un item. Utilisé dans `readItemLegacyPriceData` et `getComparableCurrency`. Remplacé par `getItemCurrency(item)`.

### 4.3 `actorCurrencyPath`

Setting enregistré mais **jamais lu** par le code métier — `merchant-trade.mjs` utilise `currency.actorPath` (champ par devise dans le tableau des devises). Code mort supprimé.

---

## 5. Fonctions supprimées

### `readItemLegacyPriceData(item)` — `merchant-utils.mjs`

Lisait prix et monnaie via `itemPriceValuePath`/`itemPriceCurrencyPath` avec fallback vers `getItemPrice`/`getItemCurrency`. Avec la suppression des settings, toute la logique se réduit à `getItemPrice`/`getItemCurrency` directement.

---

## 6. Simplifications

### `getComparableInitialPrice` — `merchant-utils.mjs`

**Avant :** `getConfiguredItemValue(itemOrData, "itemPriceValuePath") ?? getItemPrice(itemOrData)`
**Après :** `getItemPrice(itemOrData)`

### `getComparableCurrency` — `merchant-utils.mjs`

**Avant :** Lecture via `getConfiguredItemValue(..., "itemPriceCurrencyPath")` avec fallback
**Après :** `getItemCurrency(itemOrData)` directement

### `buildItemPriceWriteData` — `merchant-utils.mjs`

**Avant :** Si aucune devise avec chemin → fallback sur `itemPriceValuePath`/`itemPriceCurrencyPath`
**Après :** Si aucune devise avec chemin → `return { ok: false, paths: {} }` (pas de chemin, pas d'écriture)

---

## 7. Message de notification mis à jour

`mtt.notifications.noItemPricePath` :
- **fr avant :** "…Vérifiez les paramètres de compatibilité du module."
- **fr après :** "…Vérifiez le tableau des devises du module."
- **en avant :** "…Check the module compatibility settings."
- **en après :** "…Check the module currencies table."

---

## 8. Impacts

- **Systèmes sans tableau de devises configuré** : `buildItemPriceWriteData` retourne `{ ok: false }` au lieu d'essayer un ancien chemin. La notification `noItemPricePath` s'affiche — l'utilisateur doit configurer le tableau des devises.
- **Anciens mondes avec `itemPriceValuePath` sauvegardé** : la valeur reste dans les settings Foundry (non supprimée au runtime), mais n'est plus lue ni affichée. Inoffensif.
- **Acteurs avec `actorCurrencyPath` configuré** : le setting reste en base, ignoré. `merchant-trade.mjs` utilise `currency.actorPath` du tableau des devises — comportement inchangé.
- **Import/export de configuration** : `MTT_EXPORTABLE_CONFIG_SETTINGS` dans `config-export.mjs` ne contient plus les 3 clés supprimées. Les anciens fichiers exportés avec ces clés sont importés sans erreur (les clés inconnues sont ignorées).

---

## 9. Vérifications statiques post-nettoyage

- `itemPriceValuePath` : absent de tout le code ✓
- `itemPriceCurrencyPath` : absent de tout le code ✓
- `actorCurrencyPath` : absent de tout le code ✓
- `readItemLegacyPriceData` : absent de tout le code ✓
- `getConfiguredItemValue` : présent uniquement pour `itemQuantityPath` et `itemDescriptionPath` (légitimes) ✓
- `getItemPrice`, `getItemCurrency`, `resolveItemCurrencyKey` : bien exportés depuis `merchant-utils.mjs` ✓
- Cycle d'import `settings.mjs` ↔ `mtt-config-app.mjs` : cassé ✓

---

## 10. Tests à réaliser en jeu

1. Ouvrir la config MTT — la section "Compatibilité" n'est plus visible
2. Le champ "Chemin de la monnaie principale de l'acteur" n'est plus dans la section Devises
3. Sauvegarder la config — pas d'erreur console
4. Drop d'un Item sur un marchand sans devises configurées — notification `noItemPricePath` s'affiche
5. Drop d'un Item sur un marchand avec devises configurées — prix et monnaie lus correctement
6. Session marchand → ajout produit → prix et monnaie corrects
7. Export configuration → fichier JSON sans `itemPriceValuePath`, `itemPriceCurrencyPath`, `actorCurrencyPath`
8. Import configuration → import réussi
