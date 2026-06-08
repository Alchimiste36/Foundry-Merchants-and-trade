# Rapport correction toggle lock CO2

## 1. Résumé

Correction d'une erreur `Cannot read properties of undefined (reading 'agi')` déclenchée par `COActor.getRollData` lors du déverrouillage de la fiche marchand MTT. L'erreur apparaissait chaque fois que l'utilisateur cliquait sur le bouton de verrouillage/déverrouillage. La cause était un appel `actor.update()` pour un état purement d'interface, qui déclenchait inutilement le cycle complet de préparation de données du système CO2.

## 2. Cause identifiée

`#onToggleLock` dans `merchant-sheet.mjs` appelait :

```js
await this.actor.update({
  "system.sheet.isLocked": !isLocked,
});
```

`actor.update()` écrit en base et déclenche le cycle complet `updateData → applyActiveEffects → getRollData` de Foundry. Le système CO2 tente alors d'accéder à `system.abilities.agi` dans `COActor.getRollData`, champ inexistant sur les acteurs marchands MTT qui ne partagent pas le schéma complet d'un acteur CO2 classique.

Stack complète de l'erreur :
```text
Failed data preparation for Actor.kyBhFw5o4vSbgDAw.
Cannot read properties of undefined (reading 'agi')
at COActor.getRollData (actor.mjs:74:42)
at COActor.applyActiveEffects
...
at COActor.update
at #onToggleLock (merchant-sheet.mjs:3080:5)
```

## 3. Fichiers modifiés

- `module/applications/sheets/merchant-sheet.mjs` — méthode `#onToggleLock` (ligne 3080)

## 4. Correction effectuée

Remplacement de `actor.update()` par `actor.updateSource()` suivi d'un `render({ force: true })` :

**Avant :**
```js
await this.actor.update({
  "system.sheet.isLocked": !isLocked,
});
```

**Après :**
```js
// Use updateSource to avoid triggering the full actor data-preparation cycle (CO2 getRollData crash on merchant actors).
this.actor.updateSource({ "system.sheet.isLocked": !isLocked });
await this.render({ force: true });
```

Aucune autre modification apportée. La lecture de l'état via `getMerchantSheetLockedState(actor)` passe par `foundry.utils.getProperty(actor, "system.sheet.isLocked")` et reste cohérente après `updateSource()` puisque la donnée source en mémoire est bien mise à jour.

## 5. Choix techniques

`actor.updateSource()` modifie les données source du document en mémoire sans déclencher de requête serveur ni le cycle `update → prepareData → getRollData`. Cela convient pour un état d'interface (verrouillage de feuille) qui n'a pas besoin de déclencher la logique métier du système de jeu.

`this.render({ force: true })` force un re-rendu complet de la feuille pour que l'interface reflète immédiatement le nouvel état de verrouillage, exactement comme un re-rendu post-`actor.update()`.

L'utilisation de `setFlag()` a été écartée : elle peut également déclencher un `actor.update()` selon Foundry et introduirait un changement de chemin de stockage sans gain démontré.

## 6. Tests effectués

Tests statiques :
- [x] Vérification que `getMerchantSheetLockedState` lit `actor.system.sheet.isLocked` via `getProperty` (compatible `updateSource`)
- [x] Vérification que toutes les gardes dans `merchant-sheet.mjs` lisent via `getMerchantSheetLockedState` (lignes 169, 2409, 3074, 3333, 3446, 3576)
- [x] Vérification que la méthode `#saveMerchantTextFieldsFromDom` est appelée avant la modification d'état (comportement conservé)
- [x] Vérification que le reste de `#onToggleLock` est inchangé

Tests fonctionnels (à effectuer en jeu) :
- [ ] Déverrouillage : aucun warning `agi` en console
- [ ] Verrouillage : aucune erreur console
- [ ] Re-render : changement d'onglet après toggle OK
- [ ] Persistance : voir section 7
- [ ] Non-régression : ajout produit, service, rail acheteurs, session, menus contextuels

## 7. Persistance de l'état verrouillé

`updateSource()` modifie uniquement les données en mémoire. La valeur n'est **pas** écrite en base de données.

Le champ `system.sheet.isLocked` dans `merchant-data.mjs` a `initial: true` (verrouillé par défaut).

**Conséquence** : après un rechargement complet du monde Foundry ou une fermeture/réouverture du navigateur, la fiche marchand reviendra toujours dans l'état verrouillé (`true`), indépendamment de l'état au moment de la fermeture.

Au sein d'une même session Foundry (sans rechargement), l'état est cohérent : `getMerchantSheetLockedState` le lit correctement depuis la source en mémoire.

Si la persistance de l'état déverrouillé entre rechargements est requise, une solution à base de `actor.update()` avec un hook CO2 corrigé, ou une écriture par socket MTT, serait nécessaire. Cette évolution n'a pas été introduite ici par prudence.

## 8. Risques restants

- **Non-persistance** : comme décrit en section 7, l'état déverrouillé ne survit pas à un rechargement du monde. C'est le compromis choisi pour éviter l'erreur CO2 sans toucher au système CO2 ni au modèle de données.
- **CO2 versions futures** : si CO2 corrige `getRollData` pour les acteurs sans `system.abilities`, `actor.update()` redeviendrait safe. La correction actuelle resterait valide mais `actor.update()` pourrait être rétabli si la persistance devient prioritaire.
- **Autres appels `actor.update()` dans merchant-sheet.mjs** : cette correction ne couvre que `#onToggleLock`. D'autres méthodes (ex. `#onToggleOpen` ligne 3064) appellent toujours `actor.update()` pour des champs différents. Si ces champs existent dans le schéma CO2, ils ne déclenchent pas l'erreur `agi`. À surveiller si d'autres erreurs similaires apparaissent.
