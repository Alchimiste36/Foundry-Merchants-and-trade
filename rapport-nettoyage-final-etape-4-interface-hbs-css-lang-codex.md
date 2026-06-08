# Rapport nettoyage final MTT - Etape 4 : interface HBS/CSS/langues

## 1. Resume

Nettoyage cible de l'interface HBS/CSS/langues sans modification de logique metier. Les attributs non lus, la classe typo connue, les anciens selecteurs de navigation et plusieurs cles de langue inutilisees ont ete retires. Le CSS compile a ete regenere depuis les fichiers LESS.

## 2. Fichiers modifies

- `templates/actors/parts/merchant-access-rail.hbs`
- `templates/actors/parts/merchant-header.hbs`
- `styles/applications/merchant-sheet.less`
- `styles/applications/merchant-catalog.less`
- `styles/applications/merchant-dialogs.less`
- `styles/applications/merchant-journal.less`
- `styles/applications/mtt-config.less`
- `css/mtt.css`
- `lang/fr.json`
- `lang/en.json`

## 3. HBS nettoyes

- `merchant-access-rail.hbs` : suppression de `data-client-user-id`, non lu par les MJS.
- `merchant-header.hbs` : correction de `mtt-merchan-nav-row` en `mtt-merchant-nav-row`.

## 4. Classes et attributs supprimes

- `data-client-user-id` : attribut data non lu a supprimer.
- `mtt-merchan-nav-row` : classe typo corrigee.
- `mtt-merchant-description-content` : selecteur orphelin supprime du LESS.
- `mtt-merchant-sidebar-summary-text` : selecteur orphelin supprime du LESS.
- `mtt-merchant-manager-mode` : selecteur orphelin supprime du LESS.
- `displayName` cote produits : conserve comme handler actif, car il renomme directement `item.name` et ne correspond plus a un nom commercial separe affiche.

## 5. Selecteurs CSS/LESS supprimes

- `.mtt-merchant-navigation`
- `.mtt-merchant-navigation-tab`
- `.mtt-merchant-navigation-tab:hover`
- `.mtt-merchant-navigation-tab span`
- `.mtt-merchant-navigation-tab-active`

La navigation actuelle utilise `mtt-merchant-tab-nav`, `mtt-merchant-tab-nav-btn` et `mtt-merchant-tab-nav-btn-active`.

## 6. Fallbacks CSS supprimes ou conserves

Fallbacks redondants retires dans les LESS pour les variables `--mtt-*` deja declarees dans `styles/applications/merchant-variables.less`, puis recompilation vers `css/mtt.css`.

Conserves : les couleurs litterales qui ne sont pas des fallbacks `var(--mtt-..., valeur)` et les valeurs non liees aux variables MTT.

## 7. Cles de langue supprimees

Supprimees dans `lang/fr.json` et `lang/en.json` apres verification d'absence d'appel HBS/MJS :

- `mtt.items.title`
- `mtt.items.subtitle`
- `mtt.items.empty`
- `mtt.items.emptyHelp`
- `mtt.items.quantity.short`
- `mtt.items.quantity.none`
- `mtt.products.sourceName`
- `mtt.journal.columns.side`
- `mtt.journal.columns.date`
- `mtt.journal.columns.unitPrice`
- `mtt.journal.columns.negotiation`
- `mtt.price.proposedPriceHint`
- `mtt.price.referenceCurrency`

## 8. Cles de langue conservees car reellement utilisees

- `mtt.items.newItem` : utilise dans `merchant-sheet.mjs`.
- `mtt.journal.columns.unitPriceShort` : utilise dans les journaux HBS.
- `mtt.journal.columns.negotiationShort` : utilise dans les journaux HBS.
- `mtt.price.freePrice`, `mtt.price.minimumPrice`, `mtt.price.minimumPriceHint`, `mtt.price.proposedPrice` : utilisees par produits, services, dialogues ou helpers.
- `mtt.services.sourceName` : conservee car les services gardent leur logique de source.

## 9. Verifications statiques effectuees

- `data-client-user-id` absent.
- `mtt-merchan-nav-row` absent.
- Anciens selecteurs `.mtt-merchant-navigation*` absents des templates, MJS, LESS et CSS.
- `source-name` absent.
- `item.displayName` absent des HBS produits.
- Cles supprimees absentes des fichiers de langue.
- `fr.json` valide.
- `en.json` valide.
- `npm run compile` reussi.
- `rg "var\(\)|var\(--mtt-[^)]+," styles css` sans resultat.

`npm run lint` a ete tente, mais ESLint 9 echoue car aucun fichier `eslint.config.js`, `eslint.config.mjs` ou `eslint.config.cjs` n'est present. Aucune configuration ESLint n'a ete ajoutee.

## 10. Tests en jeu a effectuer

- Ouvrir un marchand neuf et verifier header, onglets et navigation.
- Verifier que le rail client reste visible a droite et que clic gauche / clic droit fonctionnent.
- Verifier le catalogue produits : aucun texte "objet source", nom produit = `item.name`, icones correctes.
- Verifier le catalogue services : source et icones toujours correctes.
- Verifier journal marchand et journal global.
- Verifier les interfaces FR et EN sans cle brute visible.
- Verifier la console Foundry : aucune erreur HBS, i18n ou CSS bloquante.

## 11. Risques restants

- Les tests en jeu n'ont pas ete executables depuis Codex.
- Le handler produit `displayName` reste nomme ainsi dans le MJS/HBS, mais il modifie directement le nom de l'Item marchand. Le renommer en `name` serait un nettoyage non metier possible dans une etape dediee.
- `npm run lint` reste bloque par la configuration ESLint absente.

## 12. Recommandation pour l'etape suivante

Effectuer une passe en jeu sur marchand neuf, puis traiter separement les noms internes restants qui sont actifs mais historiquement ambigus, comme `displayName` pour le renommage direct des produits.
