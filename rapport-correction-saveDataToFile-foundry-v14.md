# Rapport correction saveDataToFile — Foundry V14

Date : 2026-06-06
Branche : dev4

## 1. Résumé

Correction d'un appel global déprécié `saveDataToFile(...)` signalé par Foundry V14 :

```
Error: You are accessing the global "saveDataToFile" which is now namespaced under foundry.utils.saveDataToFile
Deprecated since Version 13 — Backwards-compatible support will be removed in Version 15
```

Un seul appel global identifié et corrigé dans `mtt-config-app.mjs`.

## 2. Fichiers modifiés

| Fichier | Modification |
|---|---|
| `module/applications/mtt-config-app.mjs` | `saveDataToFile` → `foundry.utils.saveDataToFile` |

## 3. Appels remplacés

**Avant :**
```js
saveDataToFile(json, "application/json", filename);
```

**Après :**
```js
foundry.utils.saveDataToFile(json, "application/json", filename);
```

Emplacement : méthode `#onExportConfiguration`, ligne 165.

## 4. Recherche globale

Recherche `saveDataToFile(` dans tous les `.mjs` du module : **aucun appel global restant**.

Recherche complémentaire des autres globaux Foundry souvent dépréciés (`renderTemplate`, `loadTemplates`, `duplicate`, `mergeObject`, `expandObject`, `flattenObject`, `readTextFromFile`) : **aucun appel global détecté** dans le code du module. Tous les appels existants utilisent déjà le namespace `foundry.*`.

## 5. Tests effectués

Tests non réalisables sans Foundry actif. Checklist recommandée :

- [ ] Ouvrir la configuration MTT
- [ ] Cliquer "Exporter la configuration"
- [ ] Vérifier que le fichier JSON se télécharge correctement
- [ ] Vérifier l'absence du warning `saveDataToFile` dans la console
- [ ] Réimporter le fichier exporté et vérifier que l'import fonctionne

## 6. Problèmes restants

Aucun. Le format d'export, la liste des settings exportés, la logique d'import et le `schemaVersion` restent inchangés.
