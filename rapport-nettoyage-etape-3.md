# Rapport nettoyage MTT — Étape 3

Date : 2026-06-06
Branche : dev4

---

## 1. Résumé

L'étape 3 a audité l'intégralité des settings déclarés, leur affichage dans la configuration MTT, leur sauvegarde, leur usage dans le code et leur présence dans la liste d'export/import. Deux incohérences réelles ont été détectées et corrigées :

1. **`actorCurrencyPath`** : setting déclaré, exporté, traduit en FR/EN, mais absent du template `mtt-config.hbs`, absent du contexte `_prepareContext` et absent de la sauvegarde `#onSave`. Champ ajouté dans les trois emplacements.

2. **`allowExtendedItemMerge`** : option Foundry de base (`config: true`, visible dans les options Foundry standard), incluse par erreur dans `MTT_EXPORTABLE_CONFIG_SETTINGS`. Retirée de la liste d'export.

Aucune autre incohérence réelle n'a été détectée. Tous les autres settings sont cohérents entre déclaration, contexte, sauvegarde, export et traductions.

---

## 2. Fichiers modifiés

| Fichier | Modification |
|---|---|
| `module/config/settings.mjs` | Retrait de `allowExtendedItemMerge` de `MTT_EXPORTABLE_CONFIG_SETTINGS` |
| `module/applications/mtt-config-app.mjs` | Ajout de `actorCurrencyPath` dans `_prepareContext` et `#onSave` |
| `templates/apps/mtt-config.hbs` | Ajout du champ `actorCurrencyPath` dans la section Currencies |

---

## 3. Tableau des settings vérifiés

| Clé | Scope | config | Affiché dans | Sauvegardé | Exporté | Statut |
|---|---|---|---|---|---|---|
| `debug` | client | true | Options Foundry | Foundry natif | Non ✅ | Actif |
| `allowExtendedItemMerge` | world | true | Options Foundry | Foundry natif | Non ✅ (corrigé) | Actif |
| `openConfigWindow` | — | menu | Options Foundry | — | Non ✅ | Menu actif |
| `openGlobalJournalWindow` | — | menu | Options Foundry | — | Non ✅ | Menu actif |
| `itemPriceValuePath` | world | false | Config MTT | `#onSave` | Oui ✅ | Actif, lu dans `merchant-catalog.mjs` |
| `itemPriceCurrencyPath` | world | false | Config MTT | `#onSave` | Oui ✅ | Actif, lu dans `merchant-catalog.mjs` |
| `itemQuantityPath` | world | false | Config MTT | `#onSave` | Oui ✅ | Actif, lu dans `merchant-utils.mjs` |
| `deliveryItemQuantityPath` | world | false | Config MTT | `#onSave` | Oui ✅ | Actif, lu dans `merchant-utils.mjs` |
| `deliveryItemMaxQuantityPath` | world | false | Config MTT | `#onSave` | Oui ✅ | Actif, lu dans `merchant-utils.mjs` |
| `writeDeliveryDescriptionInfo` | world | false | Config MTT | `#onSave` | Oui ✅ | Actif, lu dans `merchant-trade.mjs` |
| `itemDescriptionPath` | world | false | Config MTT | `#onSave` | Oui ✅ | Actif, lu dans `merchant-trade.mjs` |
| `itemSecretDescriptionPath` | world | false | Config MTT | `#onSave` | Oui ✅ | Actif, lu dans `merchant-trade.mjs` |
| `allowedProductTypes` | world | false | Config MTT | `#onSave` | Oui ✅ | Actif, lu dans `merchant-catalog.mjs` |
| `allowedServiceTypes` | world | false | Config MTT | `#onSave` | Oui ✅ | Actif, lu dans `merchant-catalog.mjs` |
| `itemCategoryPaths` | world | false | Config MTT | `#onSave` | Oui ✅ | Actif, lu dans `merchant-utils.mjs` |
| `useItemTypeAsCategoryFallback` | world | false | Config MTT | `#onSave` | Oui ✅ | Actif, lu dans `merchant-utils.mjs` |
| `categoryLabelMap` | world | false | Config MTT | `#onSave` | Oui ✅ | Actif, lu dans `merchant-utils.mjs` |
| `defaultCustomCategories` | world | false | Config MTT | `#onSave` | Oui ✅ | Actif, lu dans `settings.mjs` (`parseDefaultCustomCategories`) |
| `itemSubcategoryPath` | world | false | Config MTT | `#onSave` | Oui ✅ | Actif, lu dans `merchant-catalog.mjs` |
| `itemCategoryI18nPrefix` | world | false | Config MTT | `#onSave` | Oui ✅ | Actif, lu via `getModuleSetting` |
| `itemSubcategoryI18nPrefix` | world | false | Config MTT | `#onSave` | Oui ✅ | Actif, lu via `getModuleSetting` |
| `actorCurrencyPath` | world | false | Config MTT | `#onSave` | Oui ✅ (corrigé) | Déclaré, UI corrigée — lecture par le code non encore implémentée (feature future) |
| `currencies` | world | false | Config MTT | `#onSave` (JSON) | Oui ✅ | Actif, lu via `getCurrencies()` dans `merchant-utils.mjs` |

**Aucun setting mort ou orphelin détecté.**

---

## 4. Options Foundry vs configuration MTT

### Options Foundry de base (`config: true`)

| Clé | Type | Visible dans |
|---|---|---|
| `debug` | Boolean | Options module Foundry (client) |
| `allowExtendedItemMerge` | Boolean | Options module Foundry (world) |
| `openConfigWindow` | Menu | Options module Foundry |
| `openGlobalJournalWindow` | Menu | Options module Foundry |

Ces quatre entrées sont les seules visibles dans les options Foundry natives. Aucun chemin technique n'est exposé à ce niveau. La séparation est correcte.

### Configuration MTT (`config: false`, gérée dans `MttConfigApp`)

Tous les settings techniques (chemins, types, catégories, monnaies) sont gérés exclusivement dans la fenêtre `MttConfigApp`, accessible via le bouton "Ouvrir la configuration" dans les options Foundry. La séparation est correcte et propre.

---

## 5. Import/export de configuration

### Liste `MTT_EXPORTABLE_CONFIG_SETTINGS` après correction (19 clés)

```
itemPriceValuePath
itemPriceCurrencyPath
itemQuantityPath
deliveryItemQuantityPath
deliveryItemMaxQuantityPath
writeDeliveryDescriptionInfo
itemDescriptionPath
itemSecretDescriptionPath
allowedProductTypes
allowedServiceTypes
itemCategoryPaths
useItemTypeAsCategoryFallback
categoryLabelMap
defaultCustomCategories
actorCurrencyPath
currencies
itemSubcategoryPath
itemCategoryI18nPrefix
itemSubcategoryI18nPrefix
```

### Exclusions volontaires de l'export

| Clé exclue | Raison |
|---|---|
| `debug` | Option client Foundry, non partageable entre utilisateurs |
| `allowExtendedItemMerge` | Option Foundry de base (`config: true`), choix par monde, non spécifique au système de jeu |
| `openConfigWindow` | Menu Foundry, pas un setting de données |
| `openGlobalJournalWindow` | Menu Foundry, pas un setting de données |

### Format du fichier exporté

Vérifié dans `buildModuleConfigurationExport()` :

```json
{
  "module": "mtt-merchants",
  "type": "module-configuration",
  "schemaVersion": 1,
  "exportedAt": "ISO date",
  "foundryVersion": "...",
  "moduleVersion": "...",
  "systemId": "...",
  "systemTitle": "...",
  "settings": { ... }
}
```

Format stable. `schemaVersion: 1` inchangé (aucune modification structurelle). Aucune donnée marchand, session, journal ou client n'est exportée.

### Validation de l'import

L'import vérifie dans l'ordre :
1. `data.module === MTT.ID` et `data.type === "module-configuration"` ✅
2. `schemaVersion` fini et ≤ 1 ✅
3. `data.settings` est un objet non nul ✅
4. Confirmation dialog avec info système, version, date, nombre de settings ✅
5. Avertissement si `systemId` ≠ système actuel ✅
6. Application uniquement des clés de `MTT_EXPORTABLE_CONFIG_SETTINGS` ✅ (`for (const key of MTT_EXPORTABLE_CONFIG_SETTINGS)`)
7. Les clés absentes du fichier sont ignorées (pas d'écrasement inutile) ✅
8. Les clés inconnues dans le fichier sont ignorées (whitelist stricte) ✅
9. Re-render après import ✅

L'import est sécurisé et conforme aux exigences.

---

## 6. Corrections effectuées

### Correction 1 — `allowExtendedItemMerge` retiré de `MTT_EXPORTABLE_CONFIG_SETTINGS`

**Fichier** : `module/config/settings.mjs`

**Raison** : `allowExtendedItemMerge` est déclaré `config: true` (apparaît dans les options Foundry natives) et représente un choix de comportement par monde, non lié à la configuration d'un système de jeu spécifique. L'inclure dans l'export permettrait à une configuration importée d'écraser un choix intentionnel du MJ.

**Impact** : Aucun impact sur les configurations existantes. Les fichiers exportés avant cette correction qui contenaient cette clé seront simplement ignorés sur cette clé lors de l'import (la whitelist ne la contient plus).

### Correction 2 — `actorCurrencyPath` complété dans l'interface de configuration

**Fichiers** :
- `module/applications/mtt-config-app.mjs` : ajout dans `_prepareContext` + `#onSave`
- `templates/apps/mtt-config.hbs` : ajout du champ input dans la section Currencies

**Raison** : Le setting était déclaré, exporté et traduit (FR + EN), mais il n'existait aucun champ UI pour que le MJ le renseigne. Le setting était donc inaccessible via l'interface.

**Note** : La lecture effective de ce setting par la logique métier n'est pas encore implémentée dans le code (aucun `getModuleSetting("actorCurrencyPath")` dans les MJS). Le champ UI est maintenant présent et persisté pour préparer l'implémentation future sans toucher à la logique transactionnelle dans cette étape.

---

## 7. Éléments volontairement non modifiés

- Aucun setting n'a été renommé
- Aucun setting actif n'a été supprimé
- Les valeurs par défaut n'ont pas été modifiées
- `allowExtendedItemMerge` reste déclaré et fonctionnel dans les options Foundry — seule son entrée dans la liste d'export a été retirée
- Aucune logique transactionnelle touchée
- Aucune logique de monnaie modifiée
- `schemaVersion` inchangé (aucune modification structurelle du format d'export)
- La logique de catégories et sous-catégories conservée telle quelle
- Le socket non touché
- Les journaux non touchés
- Le CSS non touché

---

## 8. Tests effectués

Tests non réalisables dans ce contexte (environnement sans Foundry actif). Checklist de tests recommandée :

**Options Foundry de base**
- [ ] Vérifier que `debug`, `allowExtendedItemMerge`, le bouton config et le bouton journal global sont présents
- [ ] Vérifier qu'aucun chemin technique n'est visible dans les options Foundry

**Configuration MTT**
- [ ] Ouvrir la configuration MTT
- [ ] Vérifier la présence du nouveau champ "Chemin de la monnaie principale de l'acteur" dans la section Currencies
- [ ] Saisir une valeur, sauvegarder, rouvrir : la valeur est conservée
- [ ] Vérifier que tous les autres champs se chargent et sauvegardent correctement

**Export**
- [ ] Exporter la configuration
- [ ] Vérifier l'absence de `allowExtendedItemMerge` dans le JSON exporté
- [ ] Vérifier la présence de `actorCurrencyPath` dans le JSON exporté
- [ ] Vérifier `module`, `type`, `schemaVersion`
- [ ] Vérifier l'absence de données marchand, sessions, journaux

**Import**
- [ ] Importer un fichier exporté avant cette étape (avec `allowExtendedItemMerge`) — vérifier que la clé est ignorée sans erreur
- [ ] Importer un fichier exporté après cette étape — vérifier que `actorCurrencyPath` est restauré

**Non-régression minimale**
- [ ] Ouvrir un marchand, ajouter un produit, vérifier prix et catégories
- [ ] Console sans erreur

---

## 9. Problèmes ou risques restants

1. **`actorCurrencyPath` non lu par le code** : Le setting est maintenant configurable par le MJ, mais aucune logique métier ne le lit encore. C'est intentionnel dans cette étape (feature future). À implémenter lors d'une étape dédiée aux transferts de monnaie simplifiés (acteur avec monnaie unique).

2. **Fichiers exportés avant cette étape** : Les fichiers exportés avec l'ancienne liste incluaient `allowExtendedItemMerge`. À l'import, cette clé sera simplement ignorée (whitelist stricte). Pas de migration nécessaire, mais à mentionner dans la documentation utilisateur.

3. **`currencies` exporté comme string JSON** : Le setting `currencies` est stocké et exporté sous forme de chaîne JSON (`"[]"` ou `"[{...}]"`). L'import `game.settings.set(MTT.ID, "currencies", data.settings["currencies"])` réimporte directement cette chaîne, ce qui est cohérent avec la déclaration `type: String`. Pas d'incohérence, mais c'est un point de fragilité si la structure interne des objets currency évolue sans bump de `schemaVersion`.

---

## 10. Recommandation pour l'étape suivante

**Étape 4 suggérée : CSS — Nettoyage et organisation LESS**

L'audit de l'étape 1 identifiait plusieurs zones CSS à consolider :
- Migration des valeurs hardcodées vers les custom properties `--mtt-*` dans tous les fichiers LESS
- Centralisation des custom properties dans un bloc `:root {}` dans `merchant-variables.less`
- Vérification de la cohérence des classes entre templates HBS et sélecteurs LESS

Alternativement : **Étape 4 : Implémentation de la lecture de `actorCurrencyPath`** si la priorité est de compléter le circuit de monnaie unique pour les systèmes qui n'utilisent pas les devises multiples.
