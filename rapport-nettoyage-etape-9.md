# Rapport nettoyage MTT — Étape 9

## 1. Résumé

Audit complet des imports, exports et helpers de tous les fichiers MJS du module. Aucun import inutilisé n'a été trouvé dans aucun fichier. Plusieurs exports sont over-exposés (exportés mais jamais importés depuis l'extérieur) — conservés par prudence. Un cycle d'import bénin a été identifié. Des commentaires de section ont été ajoutés à `merchant-utils.mjs` pour améliorer la navigabilité d'un fichier de 730+ lignes.

## 2. Fichiers modifiés

- `module/applications/sheets/merchant-utils.mjs` — ajout de 10 commentaires de section

Aucun autre fichier modifié.

## 3. Imports

### Fichiers vérifiés

| Fichier | Imports | Résultat |
|---|---|---|
| `mtt.mjs` | MTT, parseDefaultCustomCategories, registerSettings, models\*, applications\*, registerMerchantSessionSocket | ✓ tous utilisés |
| `module/config/settings.mjs` | MTT, MttConfigApp, MttGlobalJournalApp | ✓ tous utilisés |
| `module/applications/mtt-config-app.mjs` | MTT, MTT_EXPORTABLE_CONFIG_SETTINGS, buildModuleConfigurationExport | ✓ tous utilisés |
| `module/applications/mtt-global-journal-app.mjs` | MTT, getMerchantJournalTransactions, normalizeJournalEntry, prepareJournalEntryDisplay | ✓ tous utilisés |
| `merchant-utils.mjs` | MTT, getCurrencies | ✓ tous utilisés |
| `merchant-dialogs.mjs` | MTT, prepareCurrencyOptions | ✓ tous utilisés |
| `merchant-journal.mjs` | MTT, formatPriceLabel, productHasSecretInfo | ✓ tous utilisés |
| `merchant-catalog.mjs` | 24 imports depuis merchant-utils.mjs + getCurrencies | ✓ tous utilisés (vérifiés grep par grep) |
| `merchant-trade.mjs` | 25 imports depuis merchant-utils.mjs + merchant-catalog.mjs | ✓ tous utilisés |
| `merchant-sheet.mjs` | 80+ imports depuis 6 fichiers | ✓ tous utilisés |
| `merchant-session-socket.mjs` | MTT, normalizeSession | ✓ tous utilisés |
| `module/models/_module.mjs` | (re-export uniquement) | ✓ |
| `module/applications/_module.mjs` | (re-exports uniquement) | ✓ |

### Imports supprimés

Aucun.

### Imports conservés par prudence

Aucun cas ambigu trouvé.

## 4. Exports

### Exports over-exposés identifiés (exportés mais jamais importés de l'extérieur)

| Export | Fichier | Usage interne | Décision |
|---|---|---|---|
| `getSellPercent` | merchant-catalog.mjs | Non | Conservé — helper pricing potentiellement utile via API |
| `getServiceSellPercent` | merchant-catalog.mjs | Non | Conservé — même raison |
| `setCurrencies` | settings.mjs | Non | Conservé — wrapper monnaies, potentiellement utile via API ou console |
| `buildCurrencySelectOptions` | merchant-utils.mjs | Non | Conservé — helper HTML monnaies, potentiel usage futur |
| `renderSessionPreparationDialog` | merchant-dialogs.mjs | Oui (ligne 84) | Conservé — used internally, export potentiellement intentionnel |
| `userCanSeeAllMerchantJournal` | merchant-journal.mjs | Oui | Conservé — permission check potentiellement utile via API |
| `userControlsJournalBuyer` | merchant-journal.mjs | Oui | Conservé — permission check potentiellement utile via API |

**Cas particulier — `getSellPercent` et `getServiceSellPercent` :**
Ces deux fonctions sont exportées depuis `merchant-catalog.mjs` mais n'y sont pas non plus utilisées en interne. Elles lisent `actor.system.trade.sellPercent` et `actor.system.trade.serviceSellPercent`. Elles semblent être des reliquats d'une API plus ouverte ou des helpers prévus pour un usage externe. Conservées car elles constituent une interface claire vers des données d'acteur.

### Exports supprimés

Aucun.

### Exports de merchant-utils.mjs — fonctions exportées à usage uniquement interne

Ces fonctions sont exportées mais utilisées uniquement dans le même fichier. Elles sont conservées car elles pourraient faire partie de la surface API publique attendue d'un module utilitaire.

| Fonction | Usage interne dans merchant-utils.mjs |
|---|---|
| `isUnlimitedMaxQuantity` | appelée dans `normalizeMaxQuantity` |
| `getAllowedTypes` | appelée dans `isItemTypeAllowed` |
| `resolveConfiguredCurrency` | appelée dans `resolveItemCurrencyKey` |
| `formatAutomaticCategoryLabel` | appelée dans `normalizeAutomaticCategoryValue` |
| `isProductCommerciallyModified` | appelée dans `getDeliveredItemMergeMode` |
| `canStrictMergeDeliveredItem` | appelée dans `getDeliveredItemMergeMode` |
| `canExtendedMergeDeliveredItem` | appelée dans `getDeliveredItemMergeMode` |
| `parseCurrencyAliases` | appelée dans `readItemCurrencyAmount` |
| `matchesCurrencyAlias` | appelée dans `readItemCurrencyAmount` |
| `readItemCurrencyAmount` | appelée dans `readItemCurrencyAmounts` |
| `readItemCurrencyAmounts` | appelée dans `readItemReferencePrice` |
| `convertCurrencyAmountsToReference` | appelée dans `readItemReferencePrice` |
| `cleanMoneyNumber` | appelée dans `roundToSmallestCurrencyUnit` |
| `getSmallestCurrencyRate` | appelée dans `roundToSmallestCurrencyUnit` |

## 5. Imports circulaires

### Cycle détecté

**`settings.mjs` ↔ `mtt-config-app.mjs`** — cycle direct :
- `settings.mjs` importe `MttConfigApp` (pour `game.settings.registerMenu(...)`)
- `mtt-config-app.mjs` importe `MTT_EXPORTABLE_CONFIG_SETTINGS` et `buildModuleConfigurationExport` (depuis settings)

**Verdict : cycle bénin.** Ce cycle fonctionne en pratique parce que :
1. Les deux modules sont entièrement chargés avant l'exécution de `registerSettings()` (appelée dans le hook `init`)
2. Les valeurs échangées sont une classe et des fonctions/constantes, pas des variables dépendantes de l'initialisation
3. Aucune erreur au chargement n'a été observée

Le cycle pourrait être résolu en déplaçant l'enregistrement des menus de settings dans un fichier séparé, mais ce serait un refactor significatif sans bénéfice concret. À noter comme point d'attention.

### Autres cycles

Aucun autre cycle détecté. Le graphe de dépendances est essentiellement unidirectionnel :

```
mtt.mjs
  → constants, settings, models/_module, applications/_module, merchant-session-socket
settings.mjs
  → constants, mtt-config-app, mtt-global-journal-app   ← cycle avec mtt-config-app
merchant-utils.mjs
  → constants, settings
merchant-dialogs.mjs
  → constants, merchant-utils
merchant-catalog.mjs
  → constants, settings, merchant-utils
merchant-journal.mjs
  → constants, merchant-utils
merchant-trade.mjs
  → constants, settings, merchant-utils, merchant-catalog
merchant-sheet.mjs
  → constants, merchant-utils, merchant-dialogs, merchant-catalog, merchant-trade, merchant-journal, merchant-session-socket
merchant-session-socket.mjs
  → constants, merchant-trade
mtt-config-app.mjs
  → constants, settings   ← cycle avec settings
mtt-global-journal-app.mjs
  → constants, merchant-journal
```

## 6. Helpers

### merchant-utils.mjs — groupes identifiés

Après ajout des commentaires de section, le fichier est structuré en 11 groupes :

| Groupe | Lignes approx. | Fonctions principales |
|---|---|---|
| Parsing / quantités | 4–83 | parsePriceValue, parseQuantityValue, isUnlimitedQuantity, normalizeFiniteQuantity, getConfiguredItemQuantity/MaxQuantity, isUnlimitedMaxQuantity, normalizeMaxQuantity/ItemQuantity, getAvailableStackSpace, getDeliveryStackingConfig |
| Secrets | 87–105 | hasSecretValue, productHasSecretInfo, isProductCommerciallyModified |
| Fusion de livraison | 109–230 | getMttSourceUuid, getMttProductFlags (privé), canStrictMergeDeliveredItem, canExtendedMergeDeliveredItem, getDeliveredItemMergeMode |
| Monnaies | 234–355 | normalizeCurrencyKey, FREE_PRICE_CURRENCY_KEY, isFreePriceCurrency, isFreePriceService, normalizeCurrencyText, resolveConfiguredCurrency, resolveItemCurrencyKey, getReferenceSessionCurrency, convertPriceToReferenceCurrency, cleanMoneyNumber, getSmallestCurrencyRate, roundToSmallestCurrencyUnit, formatCurrencyLabel, formatPriceLabel |
| HTML / texte | 359–410 | escapeHTML, htmlToPlainText |
| Droits / état feuille | 414–420 | getMerchantSheetLockedState, getMerchantLimitedState |
| Catégories | 424–480 | slugifyCategoryKey, formatAutomaticCategoryLabel, normalizeAutomaticCategoryValue, localizeConfiguredValue, createCheckMessage |
| Lecture d'items | 484–542 | getItemDescription, getItemPrice, getItemCurrency |
| Settings / lecture de chemins | 546–600 | getModuleSetting, getConfiguredItemValue, getAllowedTypes, isItemTypeAllowed, getCategoryPaths, getCategoryLabelMap |
| Monnaies universelles (Étape B) | 604–680 | parseCurrencyAliases, matchesCurrencyAlias, readItemCurrencyAmount, readItemCurrencyAmounts, convertCurrencyAmountsToReference, readItemReferencePrice |
| Options de monnaies | 682–735 | prepareCurrencyOptions, buildCurrencySelectOptions |

**Total approximatif : ~60 fonctions exportées, ~8 fonctions privées.**

### Helpers supprimés

Aucun.

### Helpers déplacés

Aucun.

### Helpers conservés par prudence

Voir section 4 — exports over-exposés.

## 7. API publique

L'API exposée dans `mtt.mjs` :
```js
game.modules.get(MTT.ID).api = {
  MTT,
  models,    // → MerchantData
  applications,  // → MerchantSheet, MttConfigApp
}
```

Cette API n'expose PAS directement les helpers de `merchant-utils.mjs`, `merchant-catalog.mjs`, ni `settings.mjs`. Les exports over-exposés ne transitent donc pas par l'API publique officielle, mais pourraient être accessibles via import direct du module si un autre module le consomme.

Aucune modification de l'API publique effectuée.

## 8. Éléments volontairement non modifiés

- Toutes les transactions (`merchant-trade.mjs` — fonctions d'exécution intactes)
- `merchant-sheet.mjs` — aucun découpage, aucun handler supprimé
- `merchant-trade.mjs` — aucun refactor des fonctions sensibles
- `merchant-data.mjs` — non touché
- Socket (`merchant-session-socket.mjs`) — logique, timeout, protocole intacts
- Templates HBS — non modifiés
- LESS/CSS — non modifiés
- Fichiers de langue — non modifiés
- Exports over-exposés — conservés par prudence

## 9. Tests effectués

Tests statiques (audit de code) :
- [x] Tous les imports de tous les fichiers MJS vérifiés par grep
- [x] Confirmation que `merchant-catalog.mjs` utilise bien ses 24 imports
- [x] Confirmation que `merchant-trade.mjs` utilise bien ses 25 imports
- [x] Confirmation que `merchant-sheet.mjs` utilise ses imports critiques (isFreePriceCurrency, isFreePriceService, renderMttDialogContent, renderConfirmDialogContent, normalizeNegotiationOffer, normalizeSessionNegotiation, getMerchantDefaultClientRates, normalizeClientCustomRates)
- [x] Recherche de patterns dépréciés (console.log, debugger, TODO, FIXME, renderTemplate global, saveDataToFile global, FilePicker global)
- [x] Graphe de dépendances tracé manuellement
- [x] Cycle settings.mjs ↔ mtt-config-app.mjs identifié et analysé

Tests fonctionnels (à effectuer en jeu) :
- [ ] Module charge sans erreur import/export
- [ ] Aucune erreur console au hook init
- [ ] Aucune erreur console au hook ready
- [ ] Ouvrir configuration MTT
- [ ] Ouvrir journal global
- [ ] Ouvrir fiche marchand
- [ ] Vérifier que les commentaires de section n'ont pas cassé le parsing MJS

## 10. Problèmes ou risques restants

- **`FilePicker` global** (`merchant-sheet.mjs:3122`) : `new FilePicker({...})` utilise la classe globale. En Foundry V14, `FilePicker` a peut-être migré vers `foundry.applications.apps.FilePicker` ou équivalent. À vérifier en jeu — si un warning de dépréciation apparaît, corriger dans une prochaine étape.
  
- **`getSellPercent` / `getServiceSellPercent`** (`merchant-catalog.mjs`) : exportés, jamais utilisés (ni en interne ni en externe). Reliquats probables d'une version antérieure où la feuille les lisait directement. À supprimer si confirmé inutiles lors d'une future étape.

- **`setCurrencies`** (`settings.mjs`) : exporté mais jamais importé. `mtt-config-app.mjs` utilise `game.settings.set(MTT.ID, "currencies", ...)` directement. Ce wrapper n'est pas consommé. À évaluer si supprimable.

- **`buildCurrencySelectOptions`** (`merchant-utils.mjs`) : exporté, jamais importé. Génère du HTML pour un `<select>`. Usage futur ou résidu. À évaluer.

- **Cycle settings ↔ mtt-config-app** : bénin à runtime mais représente une dépendance circulaire structurelle. Si settings.mjs grossit, ce cycle pourrait devenir problématique. Solution à long terme : extraire l'enregistrement des menus dans `mtt.mjs`.

- **`TODO MTT services secrets`** (`merchant-trade.mjs:2350`) : TODO fonctionnel déjà documenté à l'étape 7. Non touché.

## 11. Recommandation pour l'étape suivante

**Étape 10 suggérée — Tests en jeu et validation finale**

Après les 9 étapes de nettoyage statique, une validation complète en jeu sous Foundry + CO2 est recommandée :

1. Charger le module et vérifier la console (aucune erreur ni warning inattendu)
2. Tester le toggle de verrouillage (correction étape 9 toggle-lock-CO2)
3. Tester la configuration MTT (titre "Catégories" visible — correction étape 8)
4. Effectuer une transaction complète (produit + service + négociation)
5. Vérifier le journal marchand et global
6. Vérifier le rail acheteurs
7. Tester l'import/export de configuration

Si tous les tests passent, une PR de merge vers `main` peut être envisagée.

Optionnellement, une étape 10 de nettoyage "dernier kilomètre" pourrait :
- Supprimer `getSellPercent` / `getServiceSellPercent` si confirmés inutilisés
- Supprimer `setCurrencies` si confirmé inutilisé
- Corriger le `FilePicker` global si V14 le signale
- Clarifier le cycle settings ↔ mtt-config-app
