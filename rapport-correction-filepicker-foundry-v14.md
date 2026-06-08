# Rapport correction FilePicker — Foundry V14

## 1. Résumé

`FilePicker` global remplacé par `foundry.applications.apps.FilePicker.implementation`.

## 2. Cause identifiée

Foundry V13 a namespacé `FilePicker` sous `foundry.applications.apps.FilePicker.implementation`. Le global `FilePicker` est conservé par rétrocompatibilité jusqu'à V15 mais déclenche un warning à chaque utilisation.

## 3. Fichiers modifiés

| Fichier | Ligne |
|---|---|
| `module/applications/sheets/merchant-sheet.mjs` | 3124 |

## 4. Appels remplacés

**Avant :**
```js
const picker = new FilePicker({ ... });
picker.browse();
```

**Après :**
```js
const FilePickerApp = foundry.applications.apps.FilePicker.implementation;
const picker = new FilePickerApp({ ... });
picker.browse();
```

Logique inchangée : type `"image"`, `current: this.actor.img`, callback `actor.update({ img: path })`.

## 5. Recherche globale FilePicker

Aucun autre usage de `FilePicker` global dans le module. Un seul appel existait, dans `#onEditMerchantImage`.

## 6. Tests effectués

Tests à réaliser en jeu :
- Ouvrir une fiche marchand déverrouillée → cliquer sur l'image → le FilePicker s'ouvre sans warning console.
- Sélectionner une image → l'image du marchand est mise à jour.
- Annuler → aucune modification.

## 7. Risques restants

Aucun. Correction localisée, sans changement de logique.
