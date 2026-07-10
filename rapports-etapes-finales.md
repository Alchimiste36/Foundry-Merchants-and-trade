# Rapports — Étapes grand nettoyage mjs

## Étape 01 — Extraction des flags communs MTT

### Todo
- [x] Créer `module/documents/mtt-flags.mjs`
- [x] Déplacer `getMTTEntityType(actor)` dans `mtt-flags.mjs`
- [x] Adapter les imports existants
- [x] Vérifier qu'aucun import de `getMTTEntityType` ne vient encore de `storage-flags.mjs`

### Fichiers modifiés
- `module/documents/mtt-flags.mjs` (créé)
- `module/documents/storage-flags.mjs`
- `module/documents/merchant-flags.mjs`
- `module/applications/sheets/merchant-catalog.mjs`
- `module/applications/sheets/merchant-session-socket.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `module/applications/sheets/merchant-trade.mjs`

### Résumé
Extraction du helper commun `getMTTEntityType(actor)` vers `mtt-flags.mjs` et mise à jour des imports pour supprimer la dépendance conceptuelle entre `merchant-flags.mjs` et `storage-flags.mjs`.

### Hors périmètre volontaire
- Pas de renommage de `merchant-flags.mjs`.
- Pas de création de `shop-flags.mjs`.
- Pas de déplacement de logique session, rail ou trade.
- Pas de modification HBS / LESS / lang.

---

## Étape 02 — Renommage ciblé des fichiers de flags shop

### Todo
- [x] Renommer `module/documents/merchant-flags.mjs` en `module/documents/shop-flags.mjs`
- [x] Adapter les imports vers `shop-flags.mjs`
- [x] Vérifier qu'aucun import actif ne pointe encore vers `merchant-flags.mjs`
- [x] Vérifier la syntaxe des fichiers MJS modifiés

### Fichiers modifiés
- `module/documents/shop-flags.mjs` (renommé depuis `merchant-flags.mjs`)
- `module/documents/storage-flags.mjs`
- `module/documents/merchant-conversion.mjs`
- `module/applications/mtt-global-journal-app.mjs`
- `module/applications/sheets/merchant-catalog.mjs`
- `module/applications/sheets/merchant-journal.mjs`
- `module/applications/sheets/merchant-session-socket.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `module/applications/sheets/merchant-trade.mjs`
- `module/applications/sheets/merchant-utils.mjs`
- `mtt.mjs`
- `rapports-etapes-finales.md`

### Résumé
Renommage ciblé du fichier de flags shop et adaptation des imports. Les noms de fonctions et la logique métier restent inchangés.

### Hors périmètre volontaire
- Pas de renommage des fonctions `getMerchantData`, `isMTTMerchant`, etc.
- Pas de modification des flags persistés `flags.mtt-merchants.merchant`.
- Pas de déplacement de logique session, rail ou trade.
- Pas de modification HBS / LESS / lang.

---

## Étape 03 — Renommage permissions

### Todo
- [x] Renommer `merchant-access.mjs` en `merchant-permissions.mjs`
- [x] Adapter les imports vers `merchant-permissions.mjs`
- [x] Mettre à jour l'API interne dans `mtt.mjs`
- [x] Vérifier qu'aucun import actif ne pointe encore vers `merchant-access.mjs`

### Fichiers modifiés
- `module/documents/merchant-permissions.mjs` (renommé depuis `merchant-access.mjs`)
- `module/applications/mtt-config-app.mjs`
- `module/applications/mtt-global-journal-app.mjs`
- `module/applications/sheets/merchant-journal.mjs`
- `module/applications/sheets/merchant-session-socket.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `module/config/config-export.mjs`
- `module/config/settings.mjs`
- `mtt.mjs`
- `rapports-etapes-finales.md`

### Résumé
Renommage ciblé du fichier des permissions et adaptation des imports. L'alias `merchantAccess` dans l'API de `mtt.mjs` a été remplacé par `merchantPermissions`. La logique métier reste inchangée.

### Hors périmètre volontaire
- Pas de déplacement de logique vers `merchant-rail.mjs`.
- Pas de déplacement de logique vers `merchant-session.mjs`.
- Pas de modification HBS / LESS / lang.
- Pas de renommage des fonctions de permissions existantes.

---

## Étape 04 — Création de `merchant-session.mjs`

### Todo
- [x] Créer `merchant-session.mjs`
- [x] Déplacer les fonctions de modèle/manipulation de session
- [x] Adapter les imports dans les fichiers concernés
- [x] Vérifier l'absence de déplacement hors périmètre

### Fichiers modifiés
- `module/applications/sheets/merchant-session.mjs` (créé)
- `module/applications/sheets/merchant-trade.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `module/applications/sheets/merchant-session-socket.mjs`
- `rapports-etapes-finales.md`

### Résumé
Création du fichier central de sessions MTT et déplacement des fonctions de modèle/manipulation de session depuis `merchant-trade.mjs` : `normalizeSessionItem`, `normalizeNegotiationOffer`, `normalizeSessionNegotiation`, `normalizeSession`, `buildSessionData`, `getSessions`, `recalculateSessionItemTotal`, `setSessionItemQuantity`, `getSessionItemsForSide`, `removeSessionItemById`, `canAcceptSessionQuantity`, `clearSessionAfterExecution`. Les helpers privés `getSellerSourceItemFromSessionItem`, `getSellerSourceAvailableQuantity` sont déplacés avec eux. `syncSessionItemAvailability` est exportée car `prepareSessionContext` (resté dans trade) l'utilise.

### Hors périmètre volontaire
- `prepareSessionContext` laissé dans `merchant-trade.mjs` : appelle `prepareBuyerFortune` et `normalizeAccessClient` qui restent dans trade — déplacer créerait une dépendance circulaire.
- Pas de création de `merchant-rail.mjs`.
- Pas de déplacement des fonctions d'accès rail/client.
- Pas de modification HBS / LESS / lang.
- Pas de changement fonctionnel volontaire.

---

## Étape 05 — Création de `merchant-rail.mjs`

### Todo
- [x] Créer `merchant-rail.mjs`
- [x] Déplacer les helpers rail/access depuis `merchant-trade.mjs`
- [x] Adapter les imports dans `merchant-sheet.mjs`
- [x] Adapter les imports dans `merchant-trade.mjs`
- [x] Vérifier l'absence de déplacement hors périmètre

### Fichiers modifiés
- `module/applications/sheets/merchant-rail.mjs` (créé)
- `module/applications/sheets/merchant-trade.mjs`
- `module/applications/sheets/merchant-sheet.mjs`
- `rapports-etapes-finales.md`

### Résumé
Création du fichier central du rail d'acteurs MTT et déplacement des helpers de préparation des acteurs du rail, taux personnalisés, statuts, tooltips et icônes depuis `merchant-trade.mjs`. `merchant-trade.mjs` importe `normalizeAccessClient` et `getStoredAccessClients` depuis `merchant-rail.mjs` pour ses besoins internes (`prepareSessionClientContext` et `getExecutionAccessClients`). `merchant-sheet.mjs` importe les 7 fonctions rail depuis `merchant-rail.mjs` et les 6 fonctions trade depuis `merchant-trade.mjs`.

### Hors périmètre volontaire
- Pas de modification HBS / LESS / lang.
- Pas de déplacement des handlers du rail dépendants de `this.actor`, `this.element` ou des événements Foundry.
- Pas de déplacement des permissions configurables depuis `merchant-permissions.mjs`.
- Pas de déplacement de logique de session depuis `merchant-session.mjs`.
- Pas de changement fonctionnel volontaire.

---

## Étape 06 — Nettoyage de `merchant-trade.mjs`

### Todo
- [x] Vérifier les imports de `merchant-trade.mjs`
- [x] Conserver `prepareSessionContext(...)` dans `merchant-trade.mjs`
- [x] Ajouter ou ajuster les commentaires de grands blocs
- [x] Vérifier les fonctions déjà déplacées vers `merchant-session.mjs` et `merchant-rail.mjs`
- [x] Vérifier qu'aucune modification hors périmètre n'a été faite

### Fichiers modifiés
- `module/applications/sheets/merchant-trade.mjs`
- `rapports-etapes-finales.md`

### Résumé
`merchant-trade.mjs` est clarifiée et recentrée sur validation / preview / exécution par l'ajout de commentaires de blocs MTT sans aucun changement fonctionnel. Les imports sont propres (shop-flags.mjs, mtt-flags.mjs, merchant-session.mjs, merchant-rail.mjs). Aucune référence à d'anciens fichiers (merchant-flags.mjs, merchant-access.mjs) ne subsiste.

### Hors périmètre volontaire
- Pas de déplacement de fonctions vers `merchant-session.mjs`.
- Pas de déplacement de fonctions vers `merchant-rail.mjs`.
- Pas de modification HBS / LESS / lang.
- Pas de changement de logique métier.

---

## Étape 07 — Nettoyage de `merchant-sheet.mjs`

### Todo
- [x] Vérifier les imports de `merchant-sheet.mjs`
- [x] Recentrer les commentaires de grands blocs
- [x] Vérifier les helpers purs éventuellement déplaçables
- [x] Conserver les handlers Application V2 dans `merchant-sheet.mjs`
- [x] Vérifier l'absence de modification hors périmètre

### Fichiers modifiés
- `module/applications/sheets/merchant-sheet.mjs`
- `rapports-etapes-finales.md`

### Résumé
Ajout de 6 commentaires de grands blocs MTT dans `merchant-sheet.mjs` pour rendre lisible la structure de l'orchestrateur : contexte/état, rail, helpers storage d'échange, accès session, validation/refus, et shop services/négociation. Aucun helper pur n'a été déplacé : toutes les fonctions restantes dépendent de `this.actor`, `this.element`, `this.render()`, du DOM Foundry, des dialogs ou de l'état de la classe. Les imports ne référencent plus `merchant-flags.mjs` ni `merchant-access.mjs`.

### Hors périmètre volontaire
- Pas de modification HBS / LESS / lang.
- Pas de création de `merchant-sheet-shop.mjs` ou `merchant-sheet-storage.mjs`.
- Pas de déplacement de validation / preview / exécution métier.
- Pas de changement fonctionnel volontaire.

---

## Étape 08 — Commentaires d'architecture MJS

### Todo
- [x] Lire `rapports-etapes-finales.md` et vérifier les rapports 01–07
- [x] Vérifier les commentaires existants après les étapes 06 et 07
- [x] Ajouter ou ajuster les commentaires d'architecture MJS sans changement fonctionnel
- [x] Vérifier qu'aucun fichier HBS / LESS / lang n'a été modifié

### Fichiers modifiés
- `module/documents/mtt-flags.mjs`
- `module/documents/shop-flags.mjs`
- `module/applications/sheets/merchant-catalog.mjs`
- `module/applications/sheets/merchant-journal.mjs`
- `module/applications/sheets/merchant-rail.mjs`
- `rapports-etapes-finales.md`

### Résumé
Commentaires d'architecture ajoutés dans les fichiers MJS principaux : en-têtes de fichiers (`mtt-flags.mjs`, `shop-flags.mjs`, `merchant-catalog.mjs`, `merchant-journal.mjs`), note d'isolation dans `mtt-flags.mjs`, note sur les noms historiques dans `shop-flags.mjs`, et sous-sections `MTT base` / `MTT shop` / `MTT storage` dans `merchant-catalog.mjs`, `merchant-journal.mjs` et `merchant-rail.mjs`. Les fichiers déjà bien commentés après les étapes 06 et 07 (`merchant-trade.mjs`, `merchant-sheet.mjs`, `merchant-session.mjs`, `storage-flags.mjs`) n'ont pas été modifiés.

### Hors périmètre volontaire
- Pas de déplacement de fonctions.
- Pas de renommage de fichiers ou de fonctions.
- Pas de nettoyage imports/exports/fonctions mortes.
- Pas de modification HBS / LESS / lang.
- Pas de changement fonctionnel volontaire.

---

## Étape 09 — Nettoyage imports / exports / fonctions mortes MJS

### Todo
- [x] Vérifier les anciens imports `merchant-flags.mjs` / `merchant-access.mjs`
- [x] Nettoyer les imports inutilisés confirmés
- [x] Rétrograder les exports utilisés uniquement localement
- [x] Supprimer les fonctions mortes confirmées
- [x] Vérifier les TODO obsolètes
- [x] Vérifier l'absence de modification HBS / LESS / lang

### Fichiers modifiés
- `module/applications/sheets/merchant-dialogs.mjs`
- `module/applications/sheets/merchant-journal.mjs`
- `module/applications/sheets/merchant-rail.mjs`
- `module/applications/sheets/merchant-utils.mjs`
- `module/applications/sheets/merchant-catalog.mjs`
- `module/applications/sheets/merchant-trade.mjs`
- `module/config/settings.mjs`
- `module/documents/merchant-permissions.mjs`
- `module/documents/merchant-products.mjs`
- `module/documents/storage-flags.mjs`

### Résumé
Nettoyage confirmé sans changement fonctionnel : 6 exports rétrogradés en fonctions internes (`renderSessionPreparationDialog`, `getMerchantJournalTransactions`, `getStorageJournalEntries`, `getBestSessionForClient`, `parsePriceValue`, `getStorageAddBlockReasonKey`) ; 9 fonctions mortes supprimées après vérification globale (`findMergeableMerchantItemBySourceUuid`, `prepareMerchantCatalogItemData`, `isMerchantSellerDropBlocked`, `parseDefaultCustomCategories`, `canUserViewClientSession`, `findMergeableCatalogProduct`, `isStorageTradeResponsibleActor`, `isStorageItemBlocked`, `isStorageItemWarningGM`) ; le bloc de section `// ─── Seller drop protection ───` et le TODO étape 9 dans `merchant-catalog.mjs` ont été supprimés avec les fonctions concernées. Aucun import vers `merchant-flags.mjs` ni `merchant-access.mjs` n'a été trouvé. `node --check` validé sur les 10 fichiers.

### Hors périmètre volontaire
- Pas de déplacement de fonctions.
- Pas de renommage de fichiers.
- Pas de modification HBS / LESS / lang.
- Pas de changement métier volontaire.

---

## Étape 10 — Contrôle final MJS

### Todo
- [x] Vérifier la structure MJS finale
- [x] Vérifier les anciens imports
- [x] Vérifier la syntaxe des fichiers MJS
- [x] Vérifier la cohérence de `structure-finale.md`
- [x] Vérifier la cohérence de `agents.md`
- [x] Vérifier l'absence de modification hors périmètre

### Fichiers modifiés
- `structure-finale.md`
- `agents.md`
- `rapports-etapes-finales.md`

### Résumé
Contrôle final validé. Structure MJS cohérente : 15 fichiers attendus présents, anciens fichiers `merchant-flags.mjs` et `merchant-access.mjs` absents, aucun import résiduel vers ces chemins, `node --check` OK sur tous les MJS du module. `structure-finale.md` mis à jour pour refléter l'étape 09 : fonctions `isMTTEntity`/`getMTTEntityFlagRoot`/`getMTTEntityFlagPath` déplacées en "éventuel futur" dans mtt-flags.mjs ; fonctions supprimées (`isStorageTradeResponsibleActor`, `isStorageItemBlocked`, `isStorageItemWarningGM`, `findMergeableCatalogProduct`, `canUserViewClientSession`, `isMerchantSellerDropBlocked`, `findMergeableMerchantItemBySourceUuid`, `prepareMerchantCatalogItemData`) retirées des listes de fonctions attendues ; `getStorageAddBlockReasonKey` annotée comme interne. `agents.md` corrigé pour les chemins `merchant-flags.mjs` → `shop-flags.mjs` et `merchant-access.mjs` → `merchant-permissions.mjs` dans les sections normatives (section 18 et section 22). Les mentions historiques de transition dans les notes de renommage sont conservées.

### Hors périmètre volontaire
- Pas de déplacement de fonctions.
- Pas de renommage de fichiers.
- Pas de nouvelle réorganisation.
- Pas de modification HBS / LESS / CSS / lang.
- Pas de changement fonctionnel volontaire.
- Aucun fichier MJS modifié — corrections uniquement dans les documents de référence.
- `TODO MTT services secrets:` conservé dans `merchant-trade.mjs` : fonctionnalité future explicite (description secrète de service dans le journal).

---

## Correction post-nettoyage — Helpers source vendeur session

### Todo
- [x] Exporter `getSellerSourceItemFromSessionItem` depuis `merchant-session.mjs`.
- [x] Exporter `getSellerSourceAvailableQuantity` depuis `merchant-session.mjs`.
- [x] Importer les deux helpers dans `merchant-trade.mjs`.

### Fichiers modifiés
- `module/applications/sheets/merchant-session.mjs`
- `module/applications/sheets/merchant-trade.mjs`

### Résumé
Correction d'un oubli d'export/import après l'extraction des fonctions de session à l'étape 04. `getSellerSourceItemFromSessionItem` et `getSellerSourceAvailableQuantity` étaient restées privées dans `merchant-session.mjs` alors que `merchant-trade.mjs` les utilise dans `checkSessionSellerItems`, `buildExecutionPreview` et `buildSessionItemExecutionPlan`. La preview et la validation des sessions peuvent de nouveau résoudre ces helpers.

### Hors périmètre volontaire
- Aucun changement de logique métier.
- Aucun déplacement supplémentaire de fonctions.
- Aucun changement HBS / LESS / lang.

---

## Correction — Warnings `merchant-trade.mjs`

### Todo
- [x] Supprimer les imports inutilisés dans `merchant-trade.mjs`
- [x] Vérifier que les helpers encore utilisés restent importés

### Fichiers modifiés
- `module/applications/sheets/merchant-trade.mjs`
- `rapports-etapes-finales.md`

### Résumé
Suppression de trois imports inutilisés après le nettoyage MJS : `getReferenceSessionCurrency` (depuis `merchant-utils.mjs`), `normalizeSession` et `getSessions` (depuis `merchant-session.mjs`). Ces symboles restent disponibles dans leurs fichiers d'origine mais ne sont plus appelés directement par `merchant-trade.mjs`. Les imports `syncSessionItemAvailability`, `recalculateSessionItemTotal`, `getSellerSourceItemFromSessionItem` et `getSellerSourceAvailableQuantity` restent en place.

### Hors périmètre volontaire
- Pas de déplacement de fonctions
- Pas de modification de la preview, validation ou exécution des sessions
- Pas de modification HBS / LESS / lang

---

## Correction — Bouton ajout session masqué quand session submitted

### Todo
- [x] Transmettre les sessions shop actives au contexte catalogue.
- [x] Exposer `item.isActiveSessionSubmitted` dans les items préparés.
- [x] Masquer le bouton `addProductToSession` dans le HBS si la session active est `submitted`.

### Fichiers modifiés
- `module/applications/sheets/merchant-sheet.mjs`
- `module/applications/sheets/merchant-catalog.mjs`
- `templates/actors/parts/merchant-products.hbs`

### Résumé
Le catalogue shop connaît maintenant la session active et masque le bouton d'ajout quand cette session est soumise.

### Hors périmètre volontaire
- Pas de modification de la validation, de la preview, des sockets ou des statuts de session.
- Pas de modification des règles storage hors utilisation du contexte commun existant.

---

## Correction — Simplification du bouton d'ajout shop submitted

### Todo
- [x] Remplacer la donnée redondante `isActiveSessionSubmitted`.
- [x] Utiliser `activeSession.isSubmitted` comme source de vérité unique dans la condition d'ajout déjà existante.
- [x] Adapter le HBS du catalogue shop.
- [x] Vérifier qu'il ne reste aucune occurrence de l'ancien nom.

### Fichiers modifiés
- `module/applications/sheets/merchant-catalog.mjs`
- `templates/actors/parts/merchant-products.hbs`
- `rapports-etapes-finales.md`

### Résumé
Suppression de la variable locale `isActiveSessionSubmitted` dans `prepareItems(...)`. Le statut `submitted` de la session active (`activeSession.isSubmitted`, déjà normalisé dans `merchant-session.mjs`) est désormais lu directement là où il est utilisé, en intégrant `!activeSession?.isSubmitted` dans la condition existante `canShowAddToSessionButton` (au lieu d'être uniquement `OR`-contourné par `isEditable`) et dans `isAddToSessionDangerVisible`. Comme `canShowAddToSessionButton` porte désormais correctement ce garde-fou pour tous les profils, y compris en mode édition, le wrapper HBS `{{#unless item.isActiveSessionSubmitted}}` ajouté par le correctif précédent n'est plus nécessaire : `templates/actors/parts/merchant-products.hbs` revient à sa structure d'origine à deux niveaux (`canEditActiveSession` puis `canShowAddToSessionButton`), sans propriété d'item dédiée au statut de session.

### Hors périmètre volontaire
- Pas de modification des statuts de session.
- Pas de modification des sockets.
- Pas de modification de la validation, preview ou exécution.
- Pas de modification storage : comportement vérifié comme inchangé, `isAddToSessionDangerVisible` continue de couvrir le cas storage via `activeSession?.isSubmitted`.

---

## Correction — Blocage des types d'Item sur les zones seller

### Todo
- [x] Réutiliser le helper existant `isItemTypeAllowed(...)`.
- [x] Ajouter le contrôle de type dans `#onSessionSellerDrop(...)`.
- [x] Réutiliser `allowedProductTypes` et le message `productTypeNotAllowed`.
- [x] Ne pas modifier les HBS, LESS, lang, validation ou preview.

### Fichiers modifiés
- `module/applications/sheets/merchant-sheet.mjs`

### Résumé
La zone de drop seller refuse maintenant les Items dont le type n'est pas autorisé par la configuration `allowedProductTypes`, pour les shops comme pour les storages. Le contrôle est ajouté juste après la résolution du document droppé dans `#onSessionSellerDrop(...)`, avant la branche storage/shop, en réutilisant `isItemTypeAllowed(...)` (déjà importé) et la clé de langue existante `mtt.notifications.productTypeNotAllowed`.

### Hors périmètre volontaire
- Pas de nouvelle fonction de validation.
- Pas de nouvelle option de configuration.
- Pas de modification HBS/LESS/lang.
- Pas de changement sur la validation, la preview ou l'exécution des sessions.

---

## Correction — Tri ajustement monétaire journal Storage local

### Todo
- [x] Ajouter la clé locale `adjustment` au tri des journaux locaux.
- [x] Trier `adjustment` avec `moneyAdjustmentValue`.
- [x] Faire pointer le bouton d'ajustement du journal Storage vers `adjustment`.

### Fichiers modifiés
- `module/applications/sheets/merchant-journal.mjs`
- `templates/actors/parts/storage-journal.hbs`

### Résumé
Le bouton d'ajustement monétaire du journal Storage local trie maintenant la colonne affichée via `moneyAdjustmentValue`, comme les journaux globaux Storage.

### Hors périmètre volontaire
- Pas de modification du journal Shop local.
- Pas de modification des journaux globaux.
- Pas de modification CSS/lang/configuration.

---

## Correction — Tri Ajustement monétaire Storage local

### Todo
- [x] Vérifier le bouton `adjustment` dans `storage-journal.hbs`
- [x] Vérifier le tri `adjustment` dans `merchant-journal.mjs`
- [x] Ajouter `adjustment` à la whitelist de `#onSortJournal(...)`
- [x] Contrôler la syntaxe

### Fichiers modifiés
- `module/applications/sheets/merchant-sheet.mjs`

### Résumé
Le bouton et le comparateur `adjustment` étaient déjà corrects depuis le correctif précédent, mais le handler local `#onSortJournal(...)` dans `merchant-sheet.mjs` filtrait encore la clé reçue via une whitelist `["date", "buyer", "status", "total"]` qui ne contenait pas `adjustment` : le clic était donc ignoré avant même de mettre à jour `this.#journalSort`. La whitelist accepte maintenant `adjustment`, sans autre changement dans la fonction.

### Hors périmètre volontaire
- Pas de modification du journal Shop local.
- Pas de modification des journaux globaux.
- Pas de nouveau système de tri.
- Pas de modification HBS/LESS/lang.

---

## Correction — Suppression du pliage des services Shop

### Todo
- [x] Suppression du bouton chevron dans le template des services.
- [x] Affichage permanent des détails de service.
- [x] Suppression de l'action et du handler `toggleServiceExpanded`.
- [x] Suppression de `isExpanded` côté services.
- [x] Suppression des clés de langue inutilisées.
- [x] Vérifications syntaxiques effectuées.

### Fichiers modifiés
- `templates/actors/parts/merchant-services.hbs`
- `module/applications/sheets/merchant-sheet.mjs`
- `module/applications/sheets/merchant-catalog.mjs`
- `module/config/constants.mjs`
- `lang/fr.json`
- `lang/en.json`

### Résumé
La fonctionnalité de pliage/dépliage des détails de services Shop a été supprimée. Les détails des services sont maintenant toujours visibles et les chevrons ne sont plus affichés. Aucune règle CSS dédiée à `.mtt-merchant-service-expanded` n'existait, donc les fichiers de styles n'ont pas eu besoin d'être touchés.

### Hors périmètre volontaire
- Pas de modification des sessions.
- Pas de modification du stockage.
- Pas de modification des catégories de produits.
- Pas de modification des secrets produits (`isSecretExpanded` conservé).
- Pas de refactor supplémentaire.

---

## Correction — Wallet shop et ajustement monétaire simple

### Todo
- [x] Empêcher la redistribution globale du wallet Shop pendant une transaction.
- [x] Remplacer le rendu de monnaie Shop par une conversion interne du payeur.
- [x] Afficher uniquement le paiement exact dans la preview.
- [x] Vérifier que le Storage n'a pas été modifié volontairement.

### Fichiers modifiés
- `module/applications/sheets/merchant-trade.mjs`

### Résumé
Nouvelle branche dédiée `buildShopCurrencyTransferPlan(...)` dans `buildCurrencyTransferPlan(...)`, activée dès que `getMTTEntityType(merchantActor) === MTT.ENTITY_TYPES.MERCHANT` (donc avant tout calcul de `netDebtReference` global, qui aurait noyé des ajustements multi-devises de signes opposés). Chaque entrée de `moneyAdjustments` est traitée indépendamment dans sa propre devise : le payeur (client ou shop selon `adjustment.side`) paie exactement `adjustment.amount`, en cassant au besoin une à une ses pièces de valeur supérieure la plus proche via le nouveau helper `ensureShopPayerHasAmount(...)` (jamais l'inverse, jamais de pièce de valeur inférieure). La monnaie rendue par une casse reste interne au payeur (jamais `changeRemovals`/`changeAdditions`/`hasChange`). Comme un shop peut avoir plusieurs ajustements avec des payeurs différents (le client paie dans une devise, le shop rembourse dans une autre), le plan expose des deltas explicites par acteur (`result.clientDeltas` / `result.merchantDeltas`, obtenus par diff avant/après via `buildInternalConversionDeltas(...)` déjà existant) plutôt que le couple `payerDeltas`/`receiverDeltas` à payeur unique. `applyCurrencyTransferPlan(...)` a été étendu avec une branche prioritaire `hasExplicitActorDeltas` qui applique ces deltas directement, sans dupliquer `applyCurrencyDeltasToActor(...)`. La preview (`buildExecutionPreview`) lit `payerRemovals` avec un `payerName`/`receiverName` par entrée (repli sur le payeur/receveur global existant si absent), pour rester correcte même en cas d'ajustements à sens opposés. `distributeReferenceValueToCurrencies(...)` et `buildInternalConversionDeltas(...)` en tant que redistribution globale ne sont plus utilisés pour le Shop. Storage et acteurs système : branches `payerCanUseInternalConversion`/chemin classique totalement inchangées (diff confirmé nul sur ces blocs). Les 4 cas chiffrés de la spec + un cas bonus (devises et sens opposés dans la même session) ont été rejoués dans un script Node isolé reproduisant fidèlement la logique : tous les soldes attendus sont obtenus à l'unité près.

### Hors périmètre volontaire
- Pas de modification HBS.
- Pas de modification CSS/LESS.
- Pas de modification lang.
- Pas de refactor des sessions, sockets, journaux ou catalogues.
- Pas de changement volontaire du comportement Storage.

---

## Correction — Ajustement monétaire Shop en pièces entières

### Todo
- [x] Décomposer les ajustements Shop décimaux en devises physiques entières.
- [x] Empêcher l'application de montants décimaux dans les wallets.
- [x] Conserver la non-redistribution globale du wallet Shop.
- [x] Conserver l'absence de rendu de monnaie entre les deux parties.

### Fichiers modifiés
- `module/applications/sheets/merchant-trade.mjs`

### Résumé
Ajout du helper `buildShopPhysicalCurrencyParts(amount, currency, currencies)` juste au-dessus de `buildShopCurrencyTransferPlan(...)` : il convertit le montant d'un ajustement (encore exprimé dans sa devise d'origine) en valeur de référence via `roundToSmallestCurrencyUnit(...)`, puis décompose cette valeur en montants entiers par devise via `distributeReferenceValueToCurrencies(...)` déjà existant, en filtrant les devises à 0. Dans `buildShopCurrencyTransferPlan(...)`, le traitement qui appliquait directement `amount` dans `targetCurrency` (source des décimales du type `15.2 PA`) a été remplacé par une boucle sur les parties entières retournées par ce helper : `ensureShopPayerHasAmount(...)` est appelé pour chaque partie (donc chaque dénomination physique) avant toute écriture, puis chaque partie entière est appliquée individuellement aux wallets et ajoutée à `payerRemovals`/`receiverAdditions`. `clientDeltas`/`merchantDeltas` (calculés par diff avant/après) sont donc désormais construits à partir d'entiers uniquement. `applyCurrencyTransferPlan(...)` n'a pas été touché : la branche `hasExplicitActorDeltas` déjà en place absorbe ces nouveaux deltas entiers sans changement. Les 5 cas de décomposition de la spec (15.2 PA → 1 PO+5 PA+2 PC, 0.2 PA → 2 PC, 1.5 PO → 1 PO+5 PA, 12 PC → 1 PA+2 PC, 7 PA → 7 PA sans padding à 0) ainsi que le cas 6 (shop payeur, wallets complets 65/30/38 → 64/25/36 côté shop et +1 PO/+5 PA/+2 PC côté client) ont été rejoués dans un script Node isolé reproduisant fidèlement `roundToSmallestCurrencyUnit`/`distributeReferenceValueToCurrencies`/`ensureShopPayerHasAmount` : tous les résultats correspondent exactement à la spec, aucune décimale résiduelle. Le cas 4 (12 PC) n'était pas réellement ambigu : il se décompose proprement en 1 PA + 2 PC avec la configuration CO2 (1 PA = 10 PC).

### Hors périmètre volontaire
- Pas de modification HBS/CSS/lang.
- Pas de changement Storage volontaire (branche `payerCanUseInternalConversion` non touchée).
- Pas de changement des journaux.
- Pas de réécriture de `applyCurrencyTransferPlan(...)` ni de `distributeReferenceValueToCurrencies(...)`.

---

## Correction — Export configuration : paramètres manquants

### Todo
- [x] Ajouter `defaultStorageCategories` à l'export/import de configuration.
- [x] Ajouter `allowExtendedItemMerge` à l'export/import de configuration.
- [x] Ajouter `deleteEmptySystemActorItems` à l'export/import de configuration.
- [x] Vérifier que `merchantPermissionProfiles` reste exporté/importé.
- [x] Vérifier la syntaxe du fichier modifié.

### Fichiers modifiés
- `module/config/config-export.mjs`
- `rapports-etapes-finales.md`

### Résumé
L'export/import de configuration MTT inclut désormais les catégories Storage par défaut, l'option de fusion étendue et l'option de suppression des Items système à quantité 0. Les traitements existants des permissions et des types d'acteurs sont conservés. Vérifié que l'import générique dans `mtt-config-app.mjs` (`await game.settings.set(MTT.ID, key, data.settings[key])`) couvre déjà ces trois clés sans traitement spécial nécessaire, et que ce fichier n'a pas eu besoin d'être modifié.

### Hors périmètre volontaire
- Pas de modification de la fenêtre de configuration.
- Pas de modification HBS, LESS ou lang.
- Pas de refactor des settings.
- Pas de changement métier.

---

## Amélioration — Notification tchat MJ au submit de session

### Todo
- [x] Ajouter un message tchat MJ lors du submit d'une session Shop.
- [x] Ajouter le même message lors du submit d'une session Storage.
- [x] Afficher le nom et l'image du Shop/Storage.
- [x] Afficher le nom et l'image de l'acteur client.
- [x] Ajouter un lien cliquable vers l'acteur support Shop/Storage.
- [x] Limiter le message aux MJ.

### Fichiers modifiés
- `module/applications/sheets/merchant-sheet.mjs`
- `lang/fr.json`
- `lang/en.json`

### Résumé
Un message tchat chuchoté aux MJ (`ChatMessage.getWhisperRecipients("GM")`) est maintenant envoyé quand une session Shop ou Storage est submit via `#onSubmitSession(...)`. Le nouveau helper d'instance `#sendSubmittedSessionGmChatMessage(session)` récupère le nom/image du Shop (`getMerchantData(...)?.shop`) ou du Storage (`#buildStorageMerchantContext(getStorageData(...))?.shop`, déjà existant) ainsi que l'acteur client via `#getActorByUuid(session.actorUuid)` déjà existant, et construit deux liens d'acteur cliquables via le nouveau helper `#buildSubmitChatActorLink(...)` (classe Foundry standard `content-link`, pas de nouveau CSS). `#onSubmitSession(...)` mémorise `wasSubmitted` avant de changer le statut, pour n'envoyer le message qu'une seule fois même si le bouton est cliqué plusieurs fois sur une session déjà submitted. `#onSetSessionStatus(...)` (changement de statut manuel) n'appelle pas ce helper, donc un changement manuel vers `submitted` ne déclenche pas la notification. Deux clés de langue `mtt.sessions.submitChat.title`/`waitingDecision` ont été ajoutées dans `fr.json` et `en.json`, distinctes de `submittedMessage` (affichage feuille, pas tchat).

### Hors périmètre volontaire
- Pas de modification des sockets.
- Pas de modification de la validation/refus.
- Pas de modification de la preview.
- Pas de modification HBS.
- Pas de modification CSS/LESS.

---

## Correction — Liens acteurs dans le tchat submit MJ

### Todo
- [x] Remplacer le lien HTML manuel par un lien Foundry enrichi via `TextEditor.enrichHTML(...)`.
- [x] Adapter les appels dans `#sendSubmittedSessionGmChatMessage(...)`.
- [x] Vérifier que le submit Shop ouvre le Shop et l'acteur client depuis le tchat.
- [x] Vérifier que le submit Storage ouvre le Storage et l'acteur client depuis le tchat.

### Fichiers modifiés
- `module/applications/sheets/merchant-sheet.mjs`
- `rapports-etapes-finales.md`

### Résumé
`#buildSubmitChatActorLink(...)` est devenu asynchrone et construit désormais un texte `@UUID[...]{label}` enrichi via `foundry.applications.ux.TextEditor.implementation.enrichHTML(...)` (avec repli sur le nom échappé en cas d'erreur), au lieu de fabriquer manuellement une balise `<a class="content-link">`. Les deux appels dans `#sendSubmittedSessionGmChatMessage(...)` (lien du Shop/Storage et lien du client) sont maintenant `await`és. `#onSubmitSession(...)` n'a pas eu besoin d'être modifié, car il appelait déjà `#sendSubmittedSessionGmChatMessage(...)` avec `await` et cette dernière est déjà `async`.

### Hors périmètre volontaire
- Pas de modification des sockets.
- Pas de modification de la validation/refus.
- Pas de modification de la preview.
- Pas de modification HBS/LESS/lang.
- Pas de nouveau système de notification.

---

## Correction — Message submit visible uniquement MJ

### Todo
- [x] Remplacer le whisper simple par un message blind GM Foundry.
- [x] Conserver le contenu et les liens existants du message.
- [x] Vérifier que le joueur submitter ne voit plus le contenu du message.
- [x] Vérifier que les MJ voient encore le message et les liens cliquables.

### Fichiers modifiés
- `module/applications/sheets/merchant-sheet.mjs`
- `rapports-etapes-finales.md`

### Résumé
Le message tchat envoyé lors du submit d'une session Shop ou Storage utilise maintenant le mode Foundry `blind` (`ChatMessage.applyMode(chatData, "blind")` puis `ChatMessage.create(chatData)`), afin que seuls les MJ voient le contenu de la notification — y compris le joueur qui a cliqué sur submit. La construction du contenu, des images et des liens d'acteurs (`#buildSubmitChatActorLink(...)`) reste inchangée. Le garde `const gmRecipients = ChatMessage.getWhisperRecipients("GM"); if (!gmRecipients.length) return` a été supprimé car devenu inutile : `applyMode(..., "blind")` calcule lui-même le whisper vers les MJ.

### Hors périmètre volontaire
- Pas de socket ajouté.
- Pas de hook tchat ajouté.
- Pas de CSS/HBS/lang modifié.
- Pas de changement sur la validation, le refus, la preview ou les sessions.
