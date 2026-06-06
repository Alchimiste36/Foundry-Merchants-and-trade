# Rapport audit MTT — Étape 1

Date : 2026-06-06
Module : mtt-merchants (branche dev4)
Auteur de l'analyse : Claude Code (Sonnet 4.6)

---

## 1. Confirmation

**Aucun fichier modifié : OUI**

Toute cette étape est un diagnostic en lecture seule. Aucune suppression, renommage, déplacement,
correction, formatage ni modification de code, CSS, langue ou settings.

---

## 2. Résumé exécutif

### État global du module

Le module MTT-Merchants est un module Foundry VTT V14 de gestion de marchands, transactions et
négociations. Il est développé sur la branche `dev4`, à un stade avancé de développement
(version 0.1.0, non encore publiée).

L'architecture est moderne et cohérente : ApplicationV2, HandlebarsApplicationMixin, DialogV2,
TypeDataModel, APIs `foundry.*` namespaced partout. Aucun appel Foundry déprécié détecté.

### Niveau de complexité : ÉLEVÉ

- 14 fichiers MJS (~421 Ko)
- 18 templates HBS (~121 Ko)
- 10 fichiers LESS (~71 Ko)
- 2 fichiers langue (~55 Ko)
- Total ~893 Ko de code source

### Principaux fichiers à surveiller

| Fichier | Taille | Risque |
|---|---|---|
| module/applications/sheets/merchant-sheet.mjs | 133 Ko | TRÈS ÉLEVÉ (41 actions, ~80 méthodes) |
| module/applications/sheets/merchant-trade.mjs | 89 Ko | ÉLEVÉ (logique transactionnelle) |
| templates/actors/parts/merchant-session.hbs | 33 Ko | ÉLEVÉ (585 lignes, négociations) |
| module/applications/sheets/merchant-utils.mjs | 24 Ko | MOYEN (63 fonctions) |
| module/applications/sheets/merchant-journal.mjs | 20 Ko | MOYEN |
| module/applications/sheets/merchant-dialogs.mjs | 18 Ko | MOYEN (HTML string + duplications) |
| module/models/merchant-data.mjs | 24 Ko | ÉLEVÉ (schéma données) |

### Principaux risques du nettoyage

- merchant-sheet.mjs : 41 actions data-action liées à des handlers statiques privés —
  aucune ne peut être supprimée sans vérification croisée avec les HBS
- merchant-trade.mjs : logique transactionnelle critique (validation, exécution, transferts)
- CSS : fallbacks incohérents dans merchant-journal.less (risque Firefox)
- lang/en.json : incomplet à ~80% — à compléter avant release

---

## 3. Cartographie par zone

### Zone 1 — Initialisation / module

Fichiers :
  mtt.mjs (2.5 Ko)
  module/applications/_module.mjs (114 o)
  module/models/_module.mjs (52 o)

Fonctions principales :
  Hooks.once("init") — register dataModel, registerSheet, loadTemplates, registerSettings
  Hooks.once("ready") — registerMerchantSessionSocket
  Hooks.on("preCreateActor") — applique catégories par défaut aux nouveaux marchands
  API exposée : game.modules.get(MTT.ID).api = { MTT, models, applications }

Settings concernés : tous (registerSettings() appelé ici)
Templates concernés : chargement de Object.values(MTT.TEMPLATES) — 18 templates
LESS concerné : aucun
Points suspects : aucun — code minimal et propre
Priorité de nettoyage : FAIBLE

---

### Zone 2 — Constants / templates / chemins

Fichiers :
  module/config/constants.mjs (4.1 Ko)

Fonctions principales :
  MTT.ID = "mtt-merchants"
  MTT.NAME = "MTT"
  MTT.ACTOR_TYPES.MERCHANT = "mtt-merchants.merchant"
  MTT.TEMPLATES — 18 entrées (toutes référencées et présentes)
  MTT.CSS.SHEET, MTT.CSS.MERCHANT_SHEET
  MTT.FLAGS.PRODUCT
  PRODUCT_DEFAULTS — 21 champs
  SERVICE_DEFAULTS — 23 champs
  JOURNAL_DEFAULTS, JOURNAL_ENTRY_DEFAULTS,
  JOURNAL_TRANSACTION_ENTRY_DEFAULTS, JOURNAL_MONEY_ADJUSTMENT_DEFAULTS

Templates référencés et présents : 18/18 ✅
Templates présents non référencés : 0 ✅
Templates référencés absents : 0 ✅
Points suspects : aucun
Priorité de nettoyage : FAIBLE

---

### Zone 3 — Settings

Fichiers :
  module/config/settings.mjs (8.1 Ko)

Fonctions exportées :
  registerSettings() — enregistre 18 settings + 2 menus
  parseDefaultCustomCategories(value)
  buildModuleConfigurationExport()
  getCurrencies() / setCurrencies()
  MTT_EXPORTABLE_CONFIG_SETTINGS

Points suspects : aucun — voir section 4 pour le détail complet
Priorité de nettoyage : FAIBLE

---

### Zone 4 — Configuration MTT

Fichiers :
  module/applications/mtt-config-app.mjs (10.6 Ko)
  templates/apps/mtt-config.hbs (18.9 Ko, 473 lignes)
  styles/applications/mtt-config.less (4.5 Ko)

Fonctions principales :
  MttConfigApp extends HandlebarsApplicationMixin(ApplicationV2)
  Actions : save, cancel, addCurrency, deleteCurrency, importConfiguration, exportConfiguration
  Import : lecture JSON via input[type=file]
  Export : saveDataToFile() — API Foundry native
  Confirmation import : DialogV2.confirm()

Settings affichés/sauvegardés : tous les 18 settings world ✅
Settings absents de la fenêtre : debug (scope client, normal)
Points suspects : template HBS très volumineux (473 lignes)
Priorité de nettoyage : FAIBLE

---

### Zone 5 — Fiche marchand principale

Fichiers :
  module/applications/sheets/merchant-sheet.mjs (133 Ko, ~3804 lignes)
  templates/actors/merchant-sheet.hbs (560 o)
  templates/actors/parts/merchant-header.hbs (6.4 Ko)
  templates/actors/parts/merchant-main.hbs (1.2 Ko)
  templates/actors/parts/merchant-configuration.hbs (7.2 Ko)

Fonctions principales :
  MerchantSheet extends HandlebarsApplicationMixin(ActorSheetV2)
  41 actions DEFAULT_OPTIONS.actions
  _prepareContext() — contexte global
  _onRender() — attache les listeners DOM
  #renderAccessRail() — rendu DOM externe du rail
  #buildAccessRail() — rendu HBS du rail
  #prepareSessionContext() — délègue à merchant-trade
  ~80 méthodes privées (#) couvrant : sessions, négociation, drag/drop,
  menus contextuels, secrets, referenceState, taux

Onglets : products, services, journal, configuration
  (sessions = panneau latéral, pas un onglet)

Propriétés privées internes :
  #activeTab = "products"
  #activeSessionId = null
  #selectedClientActorUuid = ""
  #sessionCheckResult = null
  #journalSort = { key: "date", direction: "desc" }
  #scrollPositions = {}

Points suspects :
  - Quelques wrappers privés redondants (#renderMttDialogContent,
    #htmlToPlainText, #getSessions…) — pas vraiment morts
  - Menus contextuels construits en DOM pur (pas de template HBS)
  - #onValidateSessionTransaction = 93 lignes (proche du seuil 100)

Priorité de nettoyage : HAUTE (fichier central très sensible)

---

### Zone 6 — Catalogue produits / services

Fichiers :
  module/applications/sheets/merchant-catalog.mjs (30 Ko, 770 lignes)
  templates/actors/parts/merchant-products.hbs (16.8 Ko, 344 lignes)
  templates/actors/parts/merchant-services.hbs (11.2 Ko, 264 lignes)

Fonctions principales :
  prepareItems() — 110 lignes, prépare tous les produits pour affichage
  prepareServices() — 65 lignes
  prepareProductCategories() — catégories/sous-catégories
  getAutomaticItemCategory() + getOrCreateAutomaticProductCategory()
  createProductFlags() — initialise flags lors du drop
  addOrMergeProduct() — fusion ou création produit
  createServiceFromItem() — crée service depuis Item
  prepareSellerItemDropData() — prépare drop vendeur en session
  prepareTrade() / prepareWalletCurrencies() / getReferenceCurrency()

Settings concernés :
  allowedProductTypes, allowedServiceTypes,
  itemCategoryPaths, itemCategoryI18nPrefix,
  itemSubcategoryPath, itemSubcategoryI18nPrefix,
  useItemTypeAsCategoryFallback, categoryLabelMap, defaultCustomCategories

Templates concernés : merchant-products.hbs, merchant-services.hbs
Points suspects : aucun — code propre, bien structuré
Priorité de nettoyage : FAIBLE

---

### Zone 7 — Monnaies universelles

Fichiers :
  module/applications/sheets/merchant-utils.mjs (partie devises)
  module/config/settings.mjs (currencies, actorCurrencyPath)

Fonctions principales :
  getCurrencies() / setCurrencies()
  readItemReferencePrice() — prix universel depuis item
  readItemCurrencyAmount() / readItemCurrencyAmounts()
  convertCurrencyAmountsToReference()
  parseCurrencyAliases() / matchesCurrencyAlias()
  resolveConfiguredCurrency() / resolveItemCurrencyKey()
  convertPriceToReferenceCurrency()
  getReferenceSessionCurrency()
  prepareCurrencyOptions() / buildCurrencySelectOptions()
  isFreePriceCurrency() / FREE_PRICE_CURRENCY_KEY

Settings concernés : currencies (JSON array), actorCurrencyPath

Points suspects :
  - normalizeComparableText() (private) quasi-identique à normalizeCurrencyText()
    (public) — différence intentionnelle ? (toLocaleLowerCase vs toLowerCase)
  - getComparableCurrency() et resolveConfiguredCurrency() :
    même pattern de lookup devise, deux implémentations

Priorité de nettoyage : MOYENNE

---

### Zone 8 — Sessions / transactions

Fichiers :
  module/applications/sheets/merchant-trade.mjs (89 Ko, 2418 lignes)
  templates/actors/parts/merchant-session.hbs (33.5 Ko, 585 lignes)

Fonctions principales :
  normalizeSession() / buildSessionData() / getSessions()
  normalizeSessionItem() / setSessionItemQuantity() / recalculateSessionItemTotal()
  syncSessionItemAvailability() / canAcceptSessionQuantity()
  prepareSessionContext() — 150 lignes
  checkSessionTransaction() — orchestre tous les checks
  checkSessionBuyerItems() / checkSessionSellerItems()
  checkSessionMoneyAdjustments() / checkSessionCurrencies()
  buildExecutionPreview() — 291 lignes, simulation complète
  buildSessionItemExecutionPlan() — 195 lignes
  executeSessionItemTransfers() — 128 lignes
  buildCurrencyTransferPlan() — 195 lignes, rounding complexe
  applyCurrencyTransferPlan()
  simulatePurchasedItemDeliveryToActor() / deliverPurchasedItemToActor()
  clearSessionAfterExecution()

Settings concernés :
  allowExtendedItemMerge, deliveryItemQuantityPath, deliveryItemMaxQuantityPath,
  writeDeliveryDescriptionInfo, itemDescriptionPath, itemSecretDescriptionPath,
  actorCurrencyPath, currencies

Templates concernés : merchant-session.hbs

Gestion descriptions livraison (3 cas documentés dans le code) :
  Cas A (même chemin) : origin + secret + original dans même champ
  Cas B (chemins distincts) : origin dans visiblePath, secret dans secretPath
  Cas C (secret vide) : origin seulement dans visiblePath

Points suspects :
  - TODO ligne 2350 (services secrets — feature non implémentée)
  - buildExecutionPreview() et buildSessionItemExecutionPlan() :
    patterns similaires, opportunité de factorisation future
  - buildCurrencyTransferPlan() : logique rounding complexe (mantisse 10000)

Priorité de nettoyage : HAUTE (logique critique transactionnelle)

---

### Zone 9 — Négociations

Fichiers :
  module/applications/sheets/merchant-trade.mjs (partie négociation)
  module/applications/sheets/merchant-sheet.mjs (handlers négociation)
  templates/actors/parts/merchant-session.hbs (partie négociation)

Fonctions principales :
  normalizeNegotiationOffer() / normalizeSessionNegotiation()
  prepareNegotiationForDisplay()
  #createNegotiation() / #addSessionNegotiation()
  #getNegotiationFromEvent() / #canAnswerNegotiation()
  #getNegotiationDraftValues() / #createSubmittedNegotiationOffer()
  #buildSessionItemFromNegotiationOffer()
  #onSubmitNegotiationOffer() / #onAcceptNegotiationOffer()
  #onRefuseNegotiationOffer() / #onRollNegotiation()
  #recalculateNegotiationDraft()

Points suspects : aucun — bien structuré
Priorité de nettoyage : FAIBLE

---

### Zone 10 — Journaux marchand / global

Fichiers :
  module/applications/sheets/merchant-journal.mjs (20.6 Ko, 420 lignes)
  module/applications/mtt-global-journal-app.mjs (6.7 Ko, 180 lignes)
  templates/actors/parts/merchant-journal.hbs (7.1 Ko, 152 lignes)
  templates/apps/mtt-global-journal.hbs (9.6 Ko, 219 lignes)

Fonctions principales :
  normalizeJournalEntry() / normalizeJournalTransactionEntry()
  buildMerchantJournalEntryFromSession()
  appendMerchantJournalEntry() — append + auto-incrémente nextTransactionNumber
  prepareMerchantJournalContext() — filtre selon permissions
  prepareJournalEntryDisplay()
  userCanSeeAllMerchantJournal() — GM ou Owner uniquement
  userControlsJournalBuyer() — buyer visible par joueur propriétaire
  MttGlobalJournalApp extends HandlebarsApplicationMixin(ApplicationV2)
    — filtres merchantUuid / buyerUuid

Backward compat :
  hadSecrets: Boolean(entry.hadSecrets ?? entry.hasSecrets ?? defaults.hadSecrets)
  (accepte l'ancien champ "hasSecrets" pour compatibilité ascendante)

Clés tri journal marchand : "date", "buyer", "status", "total"
Clés tri journal global : idem + "merchant", "paid", "received", "adjustment"

Points suspects :
  - Compatibilité hadSecrets/hasSecrets à documenter et migrer
  - Clé de tri "adjustment" absente du journal marchand (cohérence à vérifier)

Priorité de nettoyage : FAIBLE

---

### Zone 11 — Rail acheteurs

Fichiers :
  module/applications/sheets/merchant-sheet.mjs (partie rail)
  templates/actors/parts/merchant-access-rail.hbs (1.3 Ko)
  styles/applications/merchant-access-rail.less (4 Ko)

Fonctions principales :
  #renderAccessRail() — orchestre le rendu
  #buildAccessRail() — rendu HBS du template
  #activateAccessRail() — attache les listeners
  #prepareAccessContext() — prépare données clients
  #onToggleClientAccess() — clic gauche (autoriser, créer session)
  #onClientContextMenu() / #openClientContextMenu() — clic droit DOM pur
  #closeAccessContextMenu()
  #onClientDragOver() / #onClientDrop() — drop acteur
  #upsertAccessClient() / #setClientAuthorization()
  #removeClientAuthorization() / #removeAccessClient()
  #editClientCustomRates() / #resetClientCustomRates()
  #findExternalOpenSessionForClient()

Positionnement : Rail ajouté HORS de la fenêtre ApplicationV2
  (applicationElement.append(rail)) — construction DOM externe

Tooltips : direction UP (data-tooltip-direction="UP" dans le HBS)
Menus contextuels : construction DOM pure (pas de template HBS dédié)

Points suspects :
  - Menu contextuel construit en DOM pur — pas de template HBS dédié
  - Rail positionné hors de la fenêtre (risque sur resize/repositionnement)

Priorité de nettoyage : MOYENNE

---

### Zone 12 — Dialogues HBS/MJS

Fichiers :
  module/applications/sheets/merchant-dialogs.mjs (18.3 Ko, 517 lignes)
  templates/apps/mtt-dialog.hbs (1.1 Ko) — wrapper générique
  templates/dialogs/ — 6 templates dédiés

Dialogues implémentés :
  renderSessionPreparationDialog() — ⚠️ HTML STRING en MJS (lignes 34-85)
  openSessionPreparationDialog() — DialogV2.wait()
  openCatalogItemSecretsDialog() — template secret-info-dialog.hbs
  openClientRatesDialog() — template client-rates-dialog.hbs
  openPreviewDialog() — template transaction-summary-dialog.hbs
  openPreviewErrorDialog() — template transaction-errors-dialog.hbs
  openSessionValidationDialog() — template transaction-summary-dialog.hbs
  openSessionExecutionErrorsDialog() — template transaction-errors-dialog.hbs
  openRefuseConfirmDialog() — template confirm-dialog.hbs
  openSellerItemDialog() — template seller-item-dialog.hbs

Conformité Foundry V14 :
  Tous les DialogV2 : foundry.applications.api.DialogV2.wait() ✅
  Tous les renderTemplate : foundry.applications.handlebars.renderTemplate() ✅
  Aucun Dialog ancien, aucun renderTemplate global ✅

Points suspects :
  - renderSessionPreparationDialog() : HTML string MJS (lignes 34-85)
    → À migrer vers template HBS (session-preparation-dialog.hbs à créer)
  - Pattern getFormElement dupliqué 4 fois (L128, 212, 255, 537)
  - Pattern buildCurrencyOptionsList dupliqué 2 fois (L182, 499)
  - Pattern validation quantité dupliqué 4 fois (L142, 154, 551, 562)

Priorité de nettoyage : MOYENNE

---

### Zone 13 — LESS/CSS

Fichiers :
  styles/mtt.less (36 o — point d'entrée)
  styles/applications/_index.less (58 o)
  styles/applications/merchant-variables.less (628 o)
  styles/applications/merchant-sheet.less (11.2 Ko, 508 lignes)
  styles/applications/merchant-catalog.less (17 Ko, 848 lignes)
  styles/applications/merchant-session.less (17.3 Ko, 844 lignes)
  styles/applications/merchant-access-rail.less (4 Ko, 186 lignes)
  styles/applications/merchant-dialogs.less (8.3 Ko, 411 lignes)
  styles/applications/merchant-journal.less (7.9 Ko, 371 lignes)
  styles/applications/mtt-config.less (4.5 Ko, 220 lignes)
  css/mtt.css (70 Ko — compilé)

Points suspects :
  - Variables CSS déclarées dans .mtt-sheet : scope trop étroit,
    dialogues et config dépendent des fallbacks hardcodés
  - Fallbacks INCORRECTS dans merchant-journal.less :
    Ligne 261 : var(--mtt-bg-panel-soft, #2a2d33) → valeur réelle #32363b
    Ligne 270 : var(--mtt-bg-hover, #2a2d33) → valeur réelle #383d44
  - merchant-catalog.less et merchant-session.less très volumineux (~848 lignes chacun)

Priorité de nettoyage : HAUTE (fallbacks incorrects = risque Firefox)

---

### Zone 14 — Langues

Fichiers :
  lang/fr.json (47.2 Ko, 901 lignes, ~500 clés)
  lang/en.json (7.8 Ko, 212 lignes, ~100 clés)

Points suspects :
  - en.json incomplet à ~80% (400+ clés manquantes)
  - Sections complètes absentes en EN :
    mtt.sessions.* (230+ clés !)
    mtt.notifications.* (70 clés)
    mtt.products.* (60 clés)
    mtt.services.* (25 clés)
    mtt.settings.* (17/18 absents, seul debug présent)
    mtt.globalJournal.* (15 clés)
    mtt.referenceState.* (11 clés)
    mtt.clientRates.* (10 clés)
    mtt.secrets.* (9 clés)
  - EN ⊂ FR strictement : aucune clé en EN absente de FR

Priorité de nettoyage : HAUTE (bloquant pour release anglophone)

---

### Zone 15 — Helpers / utilitaires

Fichiers :
  module/applications/sheets/merchant-utils.mjs (24.1 Ko, 595 lignes, 63 fonctions)

Groupes fonctionnels :
  Parseurs : parsePriceValue(), parseQuantityValue() — ⚠️ CODE IDENTIQUE
  Quantités : getConfiguredItemQuantity(), normalizeMaxQuantity()…
  Secrets/Produits : productHasSecretInfo(), isProductCommerciallyModified()…
  Merge : canStrictMergeDeliveredItem(), canExtendedMergeDeliveredItem()…
  Monnaies (15 fonctions) : readItemReferencePrice(), convertPriceToReferenceCurrency()…
  HTML : escapeHTML(), htmlToPlainText()
  Config : getMerchantSheetLockedState(), getMerchantLimitedState()
  Catégories : slugifyCategoryKey(), localizeConfiguredValue()…
  Settings : getModuleSetting(), getConfiguredItemValue()…

Points suspects :
  - parsePriceValue() vs parseQuantityValue() : code IDENTIQUE, seul le nom diffère
  - normalizeComparableText() (private) vs normalizeCurrencyText() (public) :
    quasi-identiques (toLocaleLowerCase vs toLowerCase)
  - getComparableCurrency() vs resolveConfiguredCurrency() :
    même pattern de lookup devise, deux implémentations

Priorité de nettoyage : MOYENNE

---

### Zone 16 — Sockets / synchronisation

Fichiers :
  module/applications/sheets/merchant-session-socket.mjs (8.8 Ko, 242 lignes)

Actions socket :
  Channel : "module.mtt-merchants"
  sessionUpdateRequest — demande mise à jour session (lignes 245-253)
  sessionUpdateResponse — réponse du processeur (lignes 43-55)

Sécurité :
  userCanUpdateMerchant() — vérifie OWNER level ✅
  buildSafeSessionUpdate() — filtre vers system.sessions.entries uniquement ✅
  REQUEST_TIMEOUT = 10000ms ✅

Debug socket :
  isSessionSocketDebugEnabled() — guarded par flag
  debugSessionSocket() — 13 appels, tous gardés
  1 console.debug() garanti par le flag ✅ (intentionnel)

Points suspects :
  - buildSafeSessionUpdate() accepte d'ajouter de nouvelles sessions
    sans validation stricte du sourceActorUuid
  - Pas de retry en cas de timeout (rejection définitive)
  - Pas d'optimistic locking

Priorité de nettoyage : FAIBLE

---

### Zone 17 — Modèle de données

Fichiers :
  module/models/merchant-data.mjs (24 Ko, 867 lignes)

Classe :
  MerchantData extends foundry.abstract.TypeDataModel

Schémas imbriqués définis :
  sessionItemSchema()
  negotiationOfferSchema()
  sessionNegotiationSchema()
  journalTransactionEntrySchema()
  journalMoneyAdjustmentSchema()
  journalTransactionSchema()

Sections du schéma principal :
  merchant (description HTMLField)
  manager (mode texte|acteur, displayName, actorUuid)
  status (isOpen)
  sheet (isLocked)
  trade (buyPercent, sellPercent, serviceSellPercent, negotiationFormula)
  wallet (currencies ObjectField)
  referenceState (ObjectField nullable)
  journal (nextTransactionNumber, transactions ArrayField)
  access (clients ArrayField avec customRates nullable)
  catalog (productCategories, collapsedCategories, hiddenCategories)
  services (entries ArrayField)
  sessions (entries ArrayField, status: active|pending|submitted|validated|refused)

Méthodes :
  defineSchema()
  updateAllActionsUuid() — no-op compatibilité CO2 (placeholder)

Points suspects :
  - referenceState : ObjectField nullable, structure non schématisée (JSON libre)
  - wallet.currencies : ObjectField libre (pas SchemaField validé)

Priorité de nettoyage : TRÈS FAIBLE (schéma core, ne pas toucher légèrement)

---

## 4. Settings — liste complète

| Clé | Scope | Type | Config | Default | Statut |
|---|---|---|---|---|---|
| debug | client | Boolean | true | false | Actif |
| itemPriceValuePath | world | String | false | "" | Actif |
| itemPriceCurrencyPath | world | String | false | "" | Actif |
| itemQuantityPath | world | String | false | "" | Actif |
| deliveryItemQuantityPath | world | String | false | "" | Actif |
| deliveryItemMaxQuantityPath | world | String | false | "" | Actif |
| allowExtendedItemMerge | world | Boolean | true | false | Actif |
| writeDeliveryDescriptionInfo | world | Boolean | false | true | Actif |
| itemDescriptionPath | world | String | false | "" | Actif |
| itemSecretDescriptionPath | world | String | false | "" | Actif |
| allowedProductTypes | world | String | false | "" | Actif |
| allowedServiceTypes | world | String | false | "" | Actif |
| itemCategoryPaths | world | String | false | "" | Actif |
| useItemTypeAsCategoryFallback | world | Boolean | false | true | Actif |
| categoryLabelMap | world | String | false | "" | Actif |
| defaultCustomCategories | world | String | false | "" | Actif |
| itemSubcategoryPath | world | String | false | "" | Actif |
| itemCategoryI18nPrefix | world | String | false | "" | Actif |
| itemSubcategoryI18nPrefix | world | String | false | "" | Actif |
| actorCurrencyPath | world | String | false | "" | Actif |
| currencies | world | String | false | "[]" | Actif |

Menus settings :
  openConfigWindow → MttConfigApp (ApplicationV2)
  openGlobalJournalWindow → MttGlobalJournalApp (ApplicationV2)

Aucun setting suspect, fallback ou mort détecté.

---

## 5. Templates HBS — état complet

| Template | Taille | Statut | Complexité |
|---|---|---|---|
| templates/actors/merchant-sheet.hbs | 560 o | ✅ Actif | Faible (conteneur) |
| templates/actors/parts/merchant-header.hbs | 6.4 Ko | ✅ Actif | Moyenne |
| templates/actors/parts/merchant-main.hbs | 1.2 Ko | ✅ Actif | Faible |
| templates/actors/parts/merchant-products.hbs | 16.8 Ko | ✅ Actif | Très élevée (344 lignes) |
| templates/actors/parts/merchant-services.hbs | 11.2 Ko | ✅ Actif | Élevée (264 lignes) |
| templates/actors/parts/merchant-configuration.hbs | 7.2 Ko | ✅ Actif | Élevée |
| templates/actors/parts/merchant-journal.hbs | 7.1 Ko | ✅ Actif | Élevée |
| templates/actors/parts/merchant-session.hbs | 33.5 Ko | ✅ Actif | EXTRÊME (585 lignes) |
| templates/actors/parts/merchant-access-rail.hbs | 1.3 Ko | ✅ Actif | Faible |
| templates/apps/mtt-config.hbs | 18.9 Ko | ✅ Actif | Très élevée (473 lignes) |
| templates/apps/mtt-dialog.hbs | 1.1 Ko | ✅ Actif | Faible (wrapper générique) |
| templates/apps/mtt-global-journal.hbs | 9.6 Ko | ✅ Actif | Élevée |
| templates/dialogs/confirm-dialog.hbs | 264 o | ✅ Actif | Minimale |
| templates/dialogs/secret-info-dialog.hbs | 1 Ko | ✅ Actif | Simple |
| templates/dialogs/client-rates-dialog.hbs | 962 o | ✅ Actif | Simple |
| templates/dialogs/transaction-summary-dialog.hbs | 4.9 Ko | ✅ Actif | Moyenne |
| templates/dialogs/transaction-errors-dialog.hbs | 362 o | ✅ Actif | Minimale |
| templates/dialogs/seller-item-dialog.hbs | 1.8 Ko | ✅ Actif | Simple |

18/18 templates présents, référencés et actifs. Aucun orphelin, aucun manquant.

Template absent notable :
  Il n'existe pas encore de templates/dialogs/session-preparation-dialog.hbs —
  le dialogue de préparation de session est construit en HTML string dans
  merchant-dialogs.mjs lignes 34-85.

---

## 6. MJS — cartographie des fichiers

| Fichier | Taille | Rôle | Sensibilité |
|---|---|---|---|
| mtt.mjs | 2.5 Ko | Point d'entrée, hooks, init | FAIBLE |
| module/config/constants.mjs | 4.1 Ko | Constantes, templates, defaults | FAIBLE |
| module/config/settings.mjs | 8.1 Ko | Settings, import/export config | FAIBLE |
| module/models/_module.mjs | 52 o | Agrégateur exports | FAIBLE |
| module/models/merchant-data.mjs | 24 Ko | Schéma TypeDataModel | TRÈS HAUTE |
| module/applications/_module.mjs | 114 o | Agrégateur exports | FAIBLE |
| module/applications/mtt-config-app.mjs | 10.6 Ko | UI configuration | FAIBLE |
| module/applications/mtt-global-journal-app.mjs | 6.7 Ko | UI journal global | FAIBLE |
| module/applications/sheets/merchant-sheet.mjs | 133 Ko | Fiche principale, 41 actions | TRÈS HAUTE |
| module/applications/sheets/merchant-catalog.mjs | 30 Ko | Gestion catalogue | HAUTE |
| module/applications/sheets/merchant-trade.mjs | 89 Ko | Logique transactionnelle | TRÈS HAUTE |
| module/applications/sheets/merchant-dialogs.mjs | 18.3 Ko | Dialogues | MOYENNE |
| module/applications/sheets/merchant-utils.mjs | 24 Ko | 63 helpers transversaux | MOYENNE |
| module/applications/sheets/merchant-journal.mjs | 20.6 Ko | Journal transactions | MOYENNE |
| module/applications/sheets/merchant-session-socket.mjs | 8.8 Ko | Socket sessions | MOYENNE |

---

## 7. LESS/CSS

### Chaîne d'imports

```
mtt.less
  └── applications/_index.less
        ├── merchant-sheet.less
        │     ├── merchant-variables.less  ← variables CSS
        │     ├── merchant-catalog.less
        │     ├── merchant-session.less
        │     ├── merchant-access-rail.less
        │     ├── merchant-journal.less
        │     └── merchant-dialogs.less
        └── mtt-config.less
```

### Variables CSS — merchant-variables.less (scope .mtt-sheet)

| Variable | Valeur | Catégorie |
|---|---|---|
| --mtt-bg-main | #202225 | Arrière-plans |
| --mtt-bg-panel | #2a2d31 | Arrière-plans |
| --mtt-bg-panel-soft | #32363b | Arrière-plans |
| --mtt-bg-field | #1f2125 | Arrière-plans |
| --mtt-bg-hover | #383d44 | Arrière-plans |
| --mtt-border | #4a4f57 | Bordures |
| --mtt-border-soft | #3a3f46 | Bordures |
| --mtt-text | #e5e0d6 | Textes |
| --mtt-text-muted | #b6afa3 | Textes |
| --mtt-text-soft | #948d82 | Textes |
| --mtt-accent | #c79a48 | Couleurs thème (or) |
| --mtt-accent-soft | rgba(199, 154, 72, 0.18) | Couleurs thème |
| --mtt-danger | #d36b5f | Couleurs thème |
| --mtt-secret | #8f75c9 | Couleurs thème |
| --mtt-secret-soft | rgba(143, 117, 201, 0.18) | Couleurs thème |

### Problèmes LESS

Scope trop étroit :
  Variables déclarées dans .mtt-sheet { ... } uniquement.
  Les composants hors-scope (dialogues, config) dépendent des fallbacks hardcodés.
  Architecture fragile — les dialogues doivent redéclarer des fallbacks explicites.

Fallbacks INCORRECTS dans merchant-journal.less :
  Ligne 261 : var(--mtt-bg-panel-soft, #2a2d33) ← valeur réelle #32363b (INCORRECT)
  Ligne 270 : var(--mtt-bg-hover, #2a2d33)       ← valeur réelle #383d44 (INCORRECT)
  Risque Firefox : rendu journal différent du reste de l'interface si variables désactivées.

### Tailles fichiers LESS

| Fichier | Lignes | Complexité |
|---|---|---|
| merchant-variables.less | 29 | Variables uniquement |
| merchant-sheet.less | 508 | Layout général, header, navigation |
| merchant-catalog.less | 848 | Produits, services, configuration |
| merchant-session.less | 844 | Sessions, négociations, monnaie |
| merchant-access-rail.less | 186 | Rail acheteurs |
| merchant-dialogs.less | 411 | Dialogues modaux |
| merchant-journal.less | 371 | Journal (marchand + global) |
| mtt-config.less | 220 | Fenêtre configuration |

---

## 8. Langues

| | FR | EN |
|---|---|---|
| Taille | 47.2 Ko | 7.8 Ko |
| Lignes | 901 | 212 |
| Clés estimées | ~500 | ~100 |
| Complétude EN/FR | — | ~20% |

EN est un sous-ensemble strict de FR. Aucune clé présente en EN qui serait absente de FR.

Sections entières absentes en EN :
  mtt.sessions.* — 230+ clés (CRITIQUE)
  mtt.notifications.* — 70 clés
  mtt.products.* — 60 clés (partielle)
  mtt.settings.* — 17/18 absents (seul debug présent)
  mtt.services.* — 25 clés
  mtt.globalJournal.* — 15 clés
  mtt.dialog.* — 20+ clés (partielle)
  mtt.referenceState.* — 11 clés
  mtt.clientRates.* — 10 clés
  mtt.secrets.* — 9 clés

Clés liées aux fonctionnalités récentes (présentes FR, absentes/partielles EN) :
  Monnaies universelles : mtt.price.*, mtt.config.currencies.*
  Catégories : mtt.products.category.*, mtt.settings.itemCategoryPaths
  Export/import config : mtt.config.importExport.* (7/12 clés présentes en EN)
  État de référence : mtt.referenceState.*

---

## 9. Recherches transversales

### 9.1 Appels dépréciés / compatibilité Foundry

RÉSULTAT : AUCUN appel déprécié détecté.

| Pattern | Résultat |
|---|---|
| renderTemplate( global | ❌ Non trouvé |
| foundry.applications.handlebars.renderTemplate | ✅ 8 occurrences (modernes) |
| new Dialog( / Dialog.confirm | ❌ Non trouvé |
| foundry.applications.api.DialogV2 | ✅ 10 occurrences (modernes) |
| ApplicationV2 | ✅ Utilisé correctement |
| ActorSheetV2 | ✅ Utilisé correctement |
| Actors.registerSheet | ✅ API V14 moderne |
| handlebars.loadTemplates | ✅ API V14 moderne |

### 9.2 Logs et debug

| Fichier | Pattern | Ligne | Classification |
|---|---|---|---|
| merchant-session-socket.mjs | console.debug(...) | 21 | Debug volontaire, gardé par isSessionSocketDebugEnabled() |

Aucun console.log, console.warn, console.error ni debugger non gardé dans toute la base.

Les notifications utilisateur passent toutes par ui.notifications.warn() / ui.notifications.info().

### 9.3 Restes de chantier

| Pattern | Fichier | Ligne | Contenu |
|---|---|---|---|
| TODO | merchant-trade.mjs | 2350 | // TODO MTT services secrets: Add an owner-only / GM-only secret description block for services. |

Aucun FIXME, deprecated, legacy, old, unused, backup, requestSessionDecision,
canManageMerchant détecté.

### 9.4 Actions / handlers

| Fichier | Actions DEFAULT_OPTIONS | addEventListener |
|---|---|---|
| merchant-sheet.mjs | 1 bloc, 41 actions | 32 occurrences |
| mtt-config-app.mjs | 1 bloc | 2 occurrences |
| mtt-global-journal-app.mjs | 1 bloc | 1 occurrence |

41 actions déclarées dans merchant-sheet.mjs, toutes liées à des handlers statiques privés (#on*).
Aucune action suspecte ou non implémentée.

### 9.5 Templates et chemins

| Vérification | Résultat |
|---|---|
| Templates présents mais non référencés | 0 |
| Templates référencés mais absents | 0 |
| Chemins HBS hardcodés hors MTT.TEMPLATES | 0 |
| Cohérence MTT.TEMPLATES vs fichiers réels | 18/18 ✅ |

---

## 10. Points suspects classés par priorité

### Priorité haute

H1 — merchant-journal.less : fallbacks CSS incorrects
  Lignes 261 et 270 : fallbacks #2a2d33 ≠ valeurs déclarées (#32363b et #383d44)
  Risque : artefacts visuels en Firefox si variables CSS désactivées
  Impact : rendu journal différent du reste de l'interface

H2 — lang/en.json : incomplet à ~80%
  400+ clés manquantes, sections entières absentes (sessions 230 clés, notifications 70 clés…)
  Bloquant pour toute release anglophone
  Aucune clé en EN absente de FR (EN ⊂ FR strictement)

H3 — merchant-dialogs.mjs : HTML string en MJS (lignes 34-85)
  renderSessionPreparationDialog() construit le HTML manuellement
  Incohérent avec tous les autres dialogues qui utilisent des templates HBS
  Template templates/dialogs/session-preparation-dialog.hbs à créer

H4 — merchant-trade.mjs : TODO services secrets (ligne 2350)
  Feature non implémentée : description secrète pour les services dans le journal
  Commentée mais pas oubliée — à implémenter avant release

### Priorité moyenne

M1 — merchant-utils.mjs : parsePriceValue et parseQuantityValue identiques
  Deux fonctions avec code identique, seul le nom diffère
  Refactorisation : une seule parsePositiveNumberValue(value)

M2 — merchant-dialogs.mjs : pattern getFormElement dupliqué 4 fois
  Lignes 128, 212, 255, 537 — extraction form identique
  Helper privé à créer

M3 — merchant-dialogs.mjs : buildCurrencyOptionsList dupliqué 2 fois
  Lignes 182-187 et 499-504 — construction options devise identique
  Helper privé à créer

M4 — merchant-utils.mjs : normalizeComparableText vs normalizeCurrencyText
  Quasi-identiques, légère différence toLocaleLowerCase vs toLowerCase
  À unifier ou documenter la différence intentionnelle

M5 — merchant-utils.mjs : getComparableCurrency vs resolveConfiguredCurrency
  Même pattern de lookup devise, deux implémentations indépendantes

M6 — Variables CSS scope trop étroit
  Déclarées dans .mtt-sheet {} — dialogues et config dépendent des fallbacks
  Solution idéale : déplacer vers :root

M7 — merchant-journal.mjs : backward compat hadSecrets / hasSecrets
  Ligne 59 : accepte les deux noms de champ
  Migration à documenter et date de retrait à définir

M8 — merchant-session-socket.mjs : buildSafeSessionUpdate accepte nouveaux acteurs
  Pas de validation stricte du sourceActorUuid lors d'insertion de nouvelles sessions
  Risque sécurité limité (OWNER level requis) mais cohérence à vérifier

### Priorité basse

B1 — merchant-sheet.mjs : wrappers privés redondants
  #renderMttDialogContent, #htmlToPlainText, #getSessions…
  Utiles pour le binding, pas vraiment morts — à évaluer

B2 — merchant-sheet.mjs : menus contextuels en DOM pur
  #openClientContextMenu et #openCatalogItemContextMenu construisent le DOM directement
  Cohérence à évaluer : template HBS ou garder DOM pur

B3 — merchant-trade.mjs : opportunité de factorisation
  buildExecutionPreview() et buildSessionItemExecutionPlan() ont des patterns similaires
  Factorisation possible mais risquée — à traiter en chantier dédié

B4 — merchant-catalog.less et merchant-session.less très volumineux
  ~848 lignes chacun — à découper en étapes ultérieures si souhaité

B5 — merchant-session-socket.mjs : pas de retry sur timeout
  Rejection définitive après 10s — comportement acceptable mais à documenter

---

## 11. Fichiers sensibles

### Ne pas toucher sans précaution maximale

module/models/merchant-data.mjs
  Schéma de données complet — toute modification peut corrompre les données
  sauvegardées des acteurs existants.

module/applications/sheets/merchant-sheet.mjs
  Fichier central avec 41 actions liées aux templates HBS — supprimer une action
  sans vérifier le HBS brise silencieusement l'UI.

module/applications/sheets/merchant-trade.mjs
  Logique transactionnelle critique — une erreur = mauvais transferts de monnaies
  ou d'items en jeu.

module/applications/sheets/merchant-session-socket.mjs
  Mécanisme socket avec sécurité et timeout — modifier peut désynchroniser
  des sessions actives.

module/config/settings.mjs
  Modifier les clés de settings peut invalider les configurations mondiales existantes.

templates/actors/parts/merchant-session.hbs
  585 lignes avec logique négociation symétrique — très facile de casser
  un côté acheteur/vendeur.

### Modifier avec soin

module/applications/sheets/merchant-utils.mjs
  63 fonctions importées par presque tous les autres fichiers — une modification
  de signature casse en cascade.

module/applications/sheets/merchant-catalog.mjs
  Logique de fusion/merge des produits — une erreur crée des doublons
  ou des pertes de stock.

module/applications/sheets/merchant-journal.mjs
  La normalisation doit rester backward compatible (hadSecrets/hasSecrets).

styles/applications/merchant-session.less
styles/applications/merchant-catalog.less
  Très volumineux, classes très imbriquées.

---

## 12. Recommandation pour l'étape 2

### Périmètre proposé : nettoyage ciblé sans risque logique

Étape 2 — Nettoyage : fallbacks CSS, TODO, duplications utilitaires, langues

#### Groupe A — CSS (risque faible, impact visible)

styles/applications/merchant-journal.less
  → Corriger lignes 261 et 270 (remplacer #2a2d33 par les valeurs correctes)

styles/applications/merchant-variables.less + styles/mtt.less
  → Optionnel : évaluer déplacement scope variables vers :root
    (nécessite test de non-régression CSS)

#### Groupe B — MJS : duplications simples (risque faible)

module/applications/sheets/merchant-utils.mjs
  → Fusionner parsePriceValue() et parseQuantityValue() en parsePositiveNumberValue()
  → Documenter la différence normalizeComparableText vs normalizeCurrencyText

module/applications/sheets/merchant-dialogs.mjs
  → Extraire helper getFormFromDialog() (4 duplications L128, 212, 255, 537)
  → Extraire helper buildCurrencyOptionsList() (2 duplications L182, 499)

#### Groupe C — Template manquant (risque faible)

templates/dialogs/session-preparation-dialog.hbs (à créer)
module/applications/sheets/merchant-dialogs.mjs
  → Migrer renderSessionPreparationDialog() (lignes 34-85) vers le template HBS

#### Groupe D — Langues (risque nul, travail de traduction)

lang/en.json
  → Compléter toutes les clés manquantes depuis fr.json
    Priorité : mtt.sessions.*, mtt.notifications.*, mtt.settings.*

#### Ce qui n'est PAS dans l'étape 2

- Refactorisation de merchant-trade.mjs (trop sensible)
- Découpage de merchant-sheet.mjs (trop risqué)
- Implémentation du TODO services secrets (fonctionnalité, pas nettoyage)
- Déplacement scope variables CSS vers :root (nécessite test régression)
- Factorisation buildExecutionPreview / buildSessionItemExecutionPlan (chantier dédié)

#### Critères de validation de l'étape 2

[ ] Fallbacks merchant-journal.less corrigés (couleurs identiques aux variables déclarées)
[ ] parsePriceValue et parseQuantityValue fusionnés sans régression
[ ] Helper getFormFromDialog créé et utilisé dans 4 emplacements
[ ] Template session-preparation-dialog.hbs créé et branché
[ ] lang/en.json complété (parité avec fr.json pour les sections prioritaires)
[ ] Aucune régression fonctionnelle introduite
[ ] Tests manuels : session, négociation, journal, dialogue secrets

---

## Confirmation finale

Aucun fichier du module mtt-merchants n'a été modifié pendant cette étape.
Ce rapport est un audit en lecture seule destiné à préparer les étapes de nettoyage suivantes.
