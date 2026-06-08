# Rapport nettoyage final MTT — Étape 1 : modèle et données

## 1. Résumé

4 types de compatibilités anciennes supprimées :
- Fallback journal `hadSecrets ?? hasSecrets` (ancien nom de champ)
- Fallback type acteur `actor.type === "merchant"` (ancien type non-namespacé) — 2 occurrences
- Fallback ownership `product.visibilityLevel` (ancien nom du champ ownershipLevel) — 5 occurrences

Le DataModel (`merchant-data.mjs`), `PRODUCT_DEFAULTS` et `SERVICE_DEFAULTS` sont déjà propres après le refactor produit étapes 1–3. Aucune modification nécessaire sur ces fichiers.

---

## 2. Fichiers modifiés

| Fichier | Changement |
|---|---|
| `module/applications/sheets/merchant-journal.mjs` | Suppression compat `?? entry.hasSecrets` + commentaire |
| `module/applications/mtt-global-journal-app.mjs` | Suppression `\|\| actor?.type === "merchant"` + commentaire |
| `module/applications/sheets/merchant-sheet.mjs` | Suppression `actor?.type === "merchant" \|\|` (ligne 1835) + 4× `?? product.visibilityLevel` |
| `module/applications/sheets/merchant-catalog.mjs` | Suppression 1× `?? product.visibilityLevel` |

---

## 3. Champs supprimés

Aucun champ supprimé du DataModel ni des defaults — déjà nettoyés lors du refactor produit (étapes 1–3).

---

## 4. Defaults supprimés

`PRODUCT_DEFAULTS` déjà propre (nettoyé étape 2 refactor) :
- `displayName` : absent ✓
- `priceValue` commercial : absent ✓
- `isCommerciallyModified` : absent ✓

`SERVICE_DEFAULTS` : inchangé, tous ses champs (`priceValue`, `isCommerciallyModified`, etc.) sont actifs pour les services.

---

## 5. Compatibilités anciennes supprimées

### 5.1 Journal : `hadSecrets ?? entry.hasSecrets`

**Avant :**
```js
// Compatibility: older entries used hasSecrets before the field was renamed to hadSecrets.
hadSecrets: Boolean(entry.hadSecrets ?? entry.hasSecrets ?? defaults.hadSecrets),
```

**Après :**
```js
hadSecrets: Boolean(entry.hadSecrets ?? defaults.hadSecrets),
```

Les anciennes entrées de journal avec `hasSecrets` au lieu de `hadSecrets` ne seront plus lues. Accepté.

### 5.2 Type acteur : `actor.type === "merchant"`

**`mtt-global-journal-app.mjs` — avant :**
```js
// Compatibility: actor.type may be "merchant" on worlds migrated before the namespaced actor type was introduced.
return actor?.type === MTT.ACTOR_TYPES.MERCHANT || actor?.type === "merchant"
```
**Après :**
```js
return actor?.type === MTT.ACTOR_TYPES.MERCHANT
```

**`merchant-sheet.mjs` — avant :**
```js
return actor?.type === "merchant" || actor?.type === MTT.ACTOR_TYPES.MERCHANT;
```
**Après :**
```js
return actor?.type === MTT.ACTOR_TYPES.MERCHANT;
```

Les acteurs marchands avec `type === "merchant"` (pré-namespace) ne seront plus reconnus. Accepté.

### 5.3 Ownership : `product.visibilityLevel`

5 occurrences dans `merchant-catalog.mjs` (1×) et `merchant-sheet.mjs` (4×) :

**Avant :** `product.ownershipLevel ?? product.visibilityLevel ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER`

**Après :** `product.ownershipLevel ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER`

Les produits avec `visibilityLevel` au lieu de `ownershipLevel` tomberont sur le défaut Observer. Accepté.

---

## 6. Champs conservés car encore actifs dans le modèle actuel

| Champ | Localisation | Rôle actuel |
|---|---|---|
| `hadSecrets` | merchant-data.mjs + constants + journal | Champ actif du journal — enregistre si une ligne avait des secrets au moment de la transaction |
| `hasSecrets` (variable locale) | merchant-catalog.mjs, merchant-sheet.mjs | Variable booléenne calculée par `productHasSecretInfo()` — affichage/logique courante des secrets |
| `system.manager.displayName` | merchant-data.mjs:478 | Nom d'affichage du gestionnaire de la boutique, indépendant des produits |
| `system.services.entries[].priceValue` | merchant-data.mjs:690 | Prix d'un service MTT — logique service active |
| `system.services.entries[].isCommerciallyModified` | merchant-data.mjs:764 | Indicateur de modification manuelle d'un service — logique service active |
| `SERVICE_DEFAULTS.priceValue` | constants.mjs | Défaut de prix pour un nouveau service |
| `SERVICE_DEFAULTS.isCommerciallyModified` | constants.mjs | Défaut d'état de modification pour un nouveau service |
| `sourceName` | SERVICE_DEFAULTS + merchant-data.mjs | Snapshot du nom de la source lors du drop d'un Item en service |
| `readItemLegacyPriceData` | merchant-utils.mjs | Fallback actif pour les systèmes configurés avec `itemPriceValuePath` (settings, pas anciens mondes) |

---

## 7. Impacts produits

- **Nouveaux produits** : inchangés — ne créent plus les anciens champs (`displayName`, `priceValue` flag, `isCommerciallyModified`)
- **Anciens produits avec `visibilityLevel`** : tomberont sur Observer par défaut — comportement accepté
- **Anciens produits avec flags dormants** : ignorés comme avant — aucune régression

---

## 8. Impacts services

Aucun impact. Tous les champs actifs des services (`priceValue`, `isCommerciallyModified`, `priceCurrency`, etc.) sont conservés intacts dans le DataModel et les defaults.

---

## 9. Impacts journaux / transactions

- **Nouvelles transactions** : inchangées
- **Anciennes entrées de journal avec `hasSecrets`** : ne seront plus lues — affiché `hadSecrets: false` par défaut. Accepté.
- **Anciennes entrées de journal avec `hadSecrets`** : lues normalement

---

## 10. Tests effectués

Vérifications statiques :
- `visibilityLevel` : absent de tout le code module ✓
- `actor.type === "merchant"` (chaîne nue) : absent ✓
- `entry.hasSecrets` dans normalizeJournalEntry : absent ✓
- Imports et variables locales `hasSecrets` (calculées par `productHasSecretInfo`) : inchangés, légitimes ✓

Tests à réaliser en jeu (Foundry démarré) selon la checklist de l'étape 1 (Tests 1–6).

---

## 11. Risques restants

| Point | Niveau | Note |
|---|---|---|
| Anciens marchands `type === "merchant"` | Accepté | Ne seront plus détectés comme marchands MTT |
| Anciens produits `visibilityLevel` | Faible | Tomberont sur Observer — comportement visible mais acceptable |
| Anciens journaux `hasSecrets` | Faible | L'indicateur "avait des secrets" affichera `false` pour ces entrées |

---

## 12. Recommandation pour l'étape suivante

Étape 2 : nettoyage des imports/exports/helpers inutilisés, des settings et de l'export/import de configuration.
