# Rapport nettoyage MTT — Étape 4

## 1. Résumé

Audit complet des templates HBS, dialogues, actions, champs de formulaire, attributs data-*, et clés de langue du module MTT-Merchants. Une seule correction réelle a été effectuée (icône manquante dans un bouton de service). Aucun template orphelin, aucune clé de langue manquante, aucun renderTemplate global. L'architecture HBS/MJS est cohérente dans l'ensemble.

---

## 2. Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `templates/actors/parts/merchant-services.hbs` | Ajout de l'icône `<i class="fas fa-trash"></i>` manquante dans le premier bouton `deleteService` (rangée header) |

---

## 3. Templates HBS vérifiés

### MTT.TEMPLATES — 19 entrées déclarées dans `module/config/constants.mjs`

| Clé | Chemin déclaré | Fichier existe |
|-----|---------------|---------------|
| MERCHANT_SHEET | templates/actors/merchant-sheet.hbs | ✓ |
| MERCHANT_HEADER | templates/actors/parts/merchant-header.hbs | ✓ |
| MERCHANT_MAIN | templates/actors/parts/merchant-main.hbs | ✓ |
| MERCHANT_PRODUCTS | templates/actors/parts/merchant-products.hbs | ✓ |
| MERCHANT_SERVICES | templates/actors/parts/merchant-services.hbs | ✓ |
| MERCHANT_CONFIGURATION | templates/actors/parts/merchant-configuration.hbs | ✓ |
| MERCHANT_JOURNAL | templates/actors/parts/merchant-journal.hbs | ✓ |
| MERCHANT_SESSION | templates/actors/parts/merchant-session.hbs | ✓ |
| MERCHANT_ACCESS_RAIL | templates/actors/parts/merchant-access-rail.hbs | ✓ |
| MTT_CONFIG | templates/apps/mtt-config.hbs | ✓ |
| MTT_GLOBAL_JOURNAL | templates/apps/mtt-global-journal.hbs | ✓ |
| MTT_DIALOG | templates/apps/mtt-dialog.hbs | ✓ |
| CONFIRM_DIALOG | templates/dialogs/confirm-dialog.hbs | ✓ |
| SECRET_INFO_DIALOG | templates/dialogs/secret-info-dialog.hbs | ✓ |
| CLIENT_RATES_DIALOG | templates/dialogs/client-rates-dialog.hbs | ✓ |
| TRANSACTION_SUMMARY_DIALOG | templates/dialogs/transaction-summary-dialog.hbs | ✓ |
| TRANSACTION_ERRORS_DIALOG | templates/dialogs/transaction-errors-dialog.hbs | ✓ |
| SELLER_ITEM_DIALOG | templates/dialogs/seller-item-dialog.hbs | ✓ |
| SESSION_PREPARATION_DIALOG | templates/dialogs/session-preparation-dialog.hbs | ✓ |

**19/19 templates présents — CORRESPONDANCE PARFAITE**

Aucun fichier HBS orphelin trouvé dans le dépôt.

---

## 4. Dialogues vérifiés

### `foundry.applications.handlebars.renderTemplate`

Toutes les occurrences dans les MJS utilisent le chemin complet. Aucun alias global `renderTemplate` n'est présent.

| Dialogue | Template constant | renderTemplate complet | Contexte ↔ HBS |
|----------|-----------------|----------------------|----------------|
| confirm-dialog.hbs | MTT.TEMPLATES.CONFIRM_DIALOG | ✓ | ✓ |
| secret-info-dialog.hbs | MTT.TEMPLATES.SECRET_INFO_DIALOG | ✓ | ✓ (secretCurrency passé via currencyOptions avec .selected) |
| client-rates-dialog.hbs | MTT.TEMPLATES.CLIENT_RATES_DIALOG | ✓ | ✓ |
| transaction-summary-dialog.hbs | MTT.TEMPLATES.TRANSACTION_SUMMARY_DIALOG | ✓ | ✓ |
| transaction-errors-dialog.hbs | MTT.TEMPLATES.TRANSACTION_ERRORS_DIALOG | ✓ | ✓ |
| seller-item-dialog.hbs | MTT.TEMPLATES.SELLER_ITEM_DIALOG | ✓ | ✓ |
| session-preparation-dialog.hbs | MTT.TEMPLATES.SESSION_PREPARATION_DIALOG | ✓ | ✓ |

### session-preparation-dialog.hbs — vérification approfondie

Contexte transmis par `merchant-dialogs.mjs` :

| Variable | Présente en HBS | Status |
|----------|----------------|--------|
| name | ✓ | ✓ |
| hasFreePrice | ✓ | ✓ |
| priceLabel | ✓ | ✓ |
| availableQuantityLabel | ✓ | ✓ |
| hasQuantityMax | ✓ | ✓ |
| availableQuantity | ✓ | ✓ |
| referenceCurrencyLabel | ✓ | ✓ |
| includeProposedPrice | ✓ | ✓ |

Champs formulaire `name=` :
- `name="quantity"` — lu via `FormData` ✓
- `name="proposedPrice"` — lu via `FormData` ✓

---

## 5. Actions et handlers vérifiés

### Actions déclarées en MJS

| MJS | Nombre d'actions |
|-----|-----------------|
| merchant-sheet.mjs | 41 |
| mtt-config-app.mjs | 6 |
| mtt-global-journal-app.mjs | 3 |

### Croisement data-action HBS ↔ actions MJS

Tous les `data-action` utilisés dans les HBS ont un handler déclaré dans un MJS correspondant. **Aucun data-action orphelin côté HBS.**

### Actions déclarées en MJS sans data-action HBS

Les actions suivantes sont déclarées dans `DEFAULT_OPTIONS.actions` de `merchant-sheet.mjs` mais n'ont aucun `data-action` correspondant dans les HBS :

| Action | Handler | Raison probable |
|--------|---------|----------------|
| toggleProductApproval | `#onToggleProductApproval` | Déclenché via menu contextuel DOM (`#openCatalogItemContextMenu`) |
| toggleServiceApproval | `#onToggleServiceApproval` | Déclenché via menu contextuel DOM |
| toggleProductSecret | `#onToggleProductSecret` | Déclenché via menu contextuel DOM |
| toggleProductFreePrice | `#onTogglProductFreePrice` | Handler disponible, non exposé en HBS |
| toggleServiceFreePrice | `#onToggleServiceFreePrice` | Handler disponible, non exposé en HBS |
| removeSessionItem | `#onRemoveSessionItem` | Déclenché programmatiquement (quantité → 0) |
| setSessionStatus | `#onSetSessionStatus` | Handler disponible, non exposé en HBS |
| checkSessionTransaction | `#onCheckSessionTransaction` | Handler disponible, non exposé en HBS |

**Non supprimées** — per les instructions ("Ne jamais supprimer une action uniquement parce qu'elle n'est pas appelée directement en JS"). Ces actions sont disponibles pour usage futur sans modification du MJS.

---

## 6. Formulaires vérifiés

### Champs de formulaire par dialogue

| Dialogue | Champs name= HBS | Lu en MJS | Cohérence |
|----------|-----------------|-----------|-----------|
| secret-info-dialog.hbs | secretName, secretPrice, secretCurrency, secretDescription | ✓ FormData | ✓ |
| client-rates-dialog.hbs | productSellPercent, serviceSellPercent, itemBuyPercent, note | ✓ FormData | ✓ |
| seller-item-dialog.hbs | quantity, unitPriceValue, priceCurrency | ✓ FormData | ✓ |
| session-preparation-dialog.hbs | quantity, proposedPrice | ✓ FormData | ✓ |
| mtt-config.hbs | itemPriceValuePath, itemPriceCurrencyPath, itemQuantityPath, deliveryItemQuantityPath, deliveryItemMaxQuantityPath, writeDeliveryDescriptionInfo, itemDescriptionPath, itemSecretDescriptionPath, allowedProductTypes, allowedServiceTypes, itemCategoryPaths, useItemTypeAsCategoryFallback, categoryLabelMap, defaultCustomCategories, itemSubcategoryPath, itemCategoryI18nPrefix, itemSubcategoryI18nPrefix, actorCurrencyPath | ✓ FormData fd.get() | ✓ |

`actorCurrencyPath` présent dans le HBS (section currencies, ligne 361) et lu dans `mtt-config-app.mjs` — ajout étape 3 confirmé. ✓

---

## 7. CSS / classes vérifiés

### data-* attributes

| Attribut HBS | Lu par MJS | Status |
|-------------|-----------|--------|
| data-client-actor-uuid | dataset.clientActorUuid | ✓ |
| data-client-user-id | **non lu** | ⚠️ documenté (voir ci-dessous) |
| data-mtt-product-id | dataset.mttProductId | ✓ |
| data-mtt-catalog-context-menu | dataset.mttCatalogContextMenu | ✓ |
| data-catalog-kind | dataset.catalogKind | ✓ |
| data-category | dataset.category | ✓ |
| data-category-id | dataset.categoryId | ✓ |
| data-system-category | dataset.systemCategory | ✓ |
| data-mtt-category-name | dataset.mttCategoryName | ✓ |
| data-mtt-category-drop | dataset.mttCategoryDrop | ✓ |
| data-mtt-product-field | dataset.mttProductField | ✓ |
| data-mtt-merchant-field | dataset.mttMerchantField | ✓ |
| data-mtt-service-field | dataset.mttServiceField | ✓ |
| data-mtt-service-drop | dataset.mttServiceDrop | ✓ |
| data-mtt-merchant-config-field | dataset.mttMerchantConfigField | ✓ |
| data-mtt-wallet-currency | dataset.mttWalletCurrency | ✓ |
| data-mtt-session-field | dataset.mttSessionField | ✓ |
| data-session-item-id | dataset.sessionItemId | ✓ |
| data-session-side | dataset.sessionSide | ✓ |
| data-mtt-negotiation-field | dataset.mttNegotiationField | ✓ |
| data-negotiation-draft | closest("[data-negotiation-draft]") | ✓ |
| data-negotiation-id | dataset.negotiationId | ✓ |
| data-is-free-price | dataset.isFreePrice | ✓ |
| data-reference-unit-price | dataset.referenceUnitPrice | ✓ |
| data-mtt-session-seller-drop | dataset.mttSellerDropBound | ✓ |
| data-mtt-client-drop | dataset.mttClientDropBound | ✓ |
| data-tooltip | rendu par Foundry | ✓ |
| data-tooltip-direction | rendu par Foundry | ✓ |
| data-currency-id | dataset.currencyId | ✓ |
| data-mtt-currency-field | dataset.mttCurrencyField | ✓ |
| data-sort-key | dataset.sortKey | ✓ |
| data-filter-key | dataset.filterKey | ✓ |

**⚠️ data-client-user-id** : présent dans `merchant-access-rail.hbs` (data-client-user-id="{{client.userId}}") mais aucune lecture MJS trouvée (`dataset.clientUserId` absent de tous les MJS). Attribut potentiellement informatif ou prévu pour usage futur. Non supprimé — aucune preuve qu'il est un reste d'ancien code.

**Correction effectuée — merchant-services.hbs** : Le premier bouton `deleteService` (rangée header de service, visible hors expand) était vide — il n'avait pas d'icône. L'icône `<i class="fas fa-trash"></i>` a été ajoutée pour le rendre visible et cohérent avec le second bouton `deleteService` (section expanded).

---

## 8. Langues vérifiées

### session-preparation-dialog.hbs — clés localize

| Clé | FR | EN |
|-----|----|----|
| mtt.price.freePrice | ✓ | ✓ |
| mtt.products.price.adjusted | ✓ | ✓ |
| mtt.sessions.dialog.availableQuantity | ✓ | ✓ |
| mtt.sessions.dialog.quantity | ✓ | ✓ |
| mtt.price.proposedPrice | ✓ | ✓ |
| mtt.sessions.dialog.proposedPrice | ✓ | ✓ |

**Toutes les clés du dialogue de préparation de session sont présentes en FR et EN.** ✓

### Cohérence globale des langues

Aucune clé utilisée dans les HBS n'a été trouvée manquante en FR ou EN. Les dialogues, templates acteurs, apps et configuration MTT utilisent tous des clés présentes dans les deux fichiers de langue.

Aucune clé brute visible (texte non traduit) n'a été identifiée.

---

## 9. Éléments volontairement non modifiés

Conformément au périmètre de l'étape 4 :

- **Menus contextuels DOM pur** : `#openCatalogItemContextMenu` et `#openClientContextMenu` construisent leurs menus en JS pur (pas de data-action HBS). Non transformés en HBS — prévu pour une étape future si souhaité.
- **merchant-session.hbs non découpé** : Le fichier (585 lignes) est volontairement conservé monolithique.
- **merchant-sheet.mjs non refactoré** : Aucune modification de la logique de la fiche marchande.
- **Transactions non modifiées** : `merchant-trade.mjs` non touché.
- **Journaux non modifiés** : `merchant-journal.mjs` et logique de journal inchangée.
- **CSS :root non traité** : Variables CSS non déplacées vers `:root`.
- **Settings non modifiés** : `module/config/settings.mjs` inchangé.
- **merchant-data.mjs non touché**.
- **Actions orphelines conservées** : Les 8 actions déclarées en MJS sans data-action HBS sont conservées — elles peuvent être déclenchées sans modification du MJS si des boutons HBS sont ajoutés ultérieurement.
- **data-client-user-id conservé** : Attribut non lu par les MJS actuels mais conservé sans preuve suffisante qu'il est un reste d'ancien code.

---

## 10. Tests effectuellement réalisables (statiques)

Les tests suivants ont été réalisés de manière statique (audit de code) :

- [x] Vérification de l'existence de tous les templates référencés dans MTT.TEMPLATES
- [x] Vérification qu'aucun fichier HBS n'est orphelin
- [x] Croisement data-action HBS ↔ actions MJS
- [x] Croisement data-* HBS ↔ lectures dataset MJS
- [x] Vérification des champs name= dans les dialogues vs lectures FormData
- [x] Vérification du contexte transmis à session-preparation-dialog.hbs
- [x] Vérification que tous les renderTemplate utilisent le chemin complet Foundry v14
- [x] Vérification des clés de langue du dialogue session-preparation
- [x] Vérification du champ actorCurrencyPath dans mtt-config.hbs
- [x] Vérification de la cohérence des boutons d'actions dans merchant-session.hbs
- [x] Vérification des attributs data-tooltip-direction dans merchant-access-rail.hbs et merchant-session.hbs

Les tests en conditions réelles (lancement Foundry, clic sur les dialogues, vérification console) ne peuvent pas être effectués depuis cet environnement et restent à la charge du développeur.

---

## 11. Problèmes ou risques restants

### Faible priorité / à surveiller

1. **data-client-user-id** : Présent dans `merchant-access-rail.hbs` mais non lu par les MJS. À surveiller si une future fonctionnalité en a besoin, ou à supprimer lors d'un nettoyage ultérieur avec confirmation que c'est du code mort.

2. **8 actions déclarées sans data-action HBS** (`toggleProductApproval`, `toggleServiceApproval`, `toggleProductSecret`, `toggleProductFreePrice`, `toggleServiceFreePrice`, `removeSessionItem`, `setSessionStatus`, `checkSessionTransaction`) : Déclarées dans DEFAULT_OPTIONS.actions mais non utilisées en HBS. Non problématiques à court terme mais constituent du code potentiellement inutile si les menus contextuels ne les délèguent jamais au système d'actions Foundry.

3. **merchant-session.hbs** (585 lignes) : Fichier dense. Une décomposition en sous-templates améliorerait la maintenabilité, mais hors périmètre de cette étape.

4. **Menus contextuels** : Construits en JS pur (DOM), ce qui les rend non-thémables et plus difficiles à maintenir. Une future migration en HBS permettrait une meilleure cohérence.

---

## 12. Recommandation pour l'étape suivante

**Étape 5 suggérée : Nettoyage CSS/LESS**

Objectifs :
- Auditer les classes CSS utilisées dans les HBS vs les sélecteurs définis dans les fichiers LESS
- Identifier les sélecteurs orphelins (définis en LESS mais absents des HBS)
- Identifier les classes HBS sans style correspondant
- Nettoyer les variables CSS redondantes
- Évaluer l'opportunité de déplacer les variables globales vers `:root`

Alternativement, si la priorité est fonctionnelle :

**Étape 5 alternative : Audit et refactoring léger de merchant-sheet.mjs**

Objectifs :
- Vérifier la cohérence des méthodes privées et du cycle de rendu
- Identifier les méthodes mortes ou dupliquées
- Documenter les points d'extension pour les prochaines fonctionnalités
