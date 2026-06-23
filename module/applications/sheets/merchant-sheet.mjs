import { MTT } from "../../config/constants.mjs"
import {
  getMerchantData,
  getMerchantFlagPath,
  updateMerchantData,
  createLocalMerchantCategory
} from "../../documents/merchant-flags.mjs"
import {
  getMTTEntityType,
  getStorageData,
  getStorageFlagPath,
  updateStorageData,
  isMTTStorage,
  getStorageAccessActorUuids,
  getStorageTradeResponsibleActorUuids,
  canActorTradeWithMerchantAsStorage,
  setStorageTradeResponsibleActorUuids,
  setStorageItemWarningGM,
  setStorageItemBlocked,
  applyStorageIgnoreAutoCategory,
  buildStorageAddIntentBlockState,
  buildStorageItemIntentState,
  getStorageClaimQuantityBlockReasonKey,
  toggleStorageItemTag
} from "../../documents/storage-flags.mjs"
import {
  getMerchantAccessContext,
  getMerchantPermissions,
  canUserViewClientActor
} from "../../documents/merchant-access.mjs"
import {
  isUnlimitedQuantity,
  isFreePriceCurrency,
  isFreePriceService,
  normalizeFiniteQuantity,
  convertPriceToReferenceCurrency,
  formatPriceLabel,
  isItemTypeAllowed,
  prepareCurrencyOptions,
  htmlToPlainText,
  getMerchantSheetLockedState,
  getMerchantLimitedState,
  productHasSecretInfo,
  normalizeEffectiveDeliveryQuantityPerLot,
  formatProductNameWithLotQuantity,
  buildProductAvailabilityMap
} from "./merchant-utils.mjs"
import {
  renderMttDialogContent,
  renderConfirmDialogContent,
  openSessionPreparationDialog,
  openSellerItemDialog,
  openPreviewDialog,
  openPreviewErrorDialog,
  openSessionValidationDialog,
  openSessionExecutionErrorsDialog,
  openRefuseConfirmDialog,
  openCatalogItemSecretsDialog,
  openClientRatesDialog
} from "./merchant-dialogs.mjs"
import {
  adjustPriceValue,
  prepareTrade,
  prepareWalletCurrencies,
  getReferenceCurrency,
  prepareItems,
  prepareServices,
  prepareProductCategories,
  getAutomaticItemCategory,
  getOrCreateAutomaticProductCategory,
  addOrMergeProduct,
  moveProductToCategory,
  createServiceFromItem,
  prepareSellerItemDropData,
  resolveDroppedItemSourceUuid,
  copyCatalogProduct,
  copyCatalogService
} from "./merchant-catalog.mjs"
import {
  getCatalogProducts,
  getCatalogProduct,
  addCatalogProduct,
  updateCatalogProduct,
  removeCatalogProduct,
  replaceCatalogProducts
} from "../../documents/merchant-products.mjs"
import {
  normalizeSession,
  normalizeSessionItem,
  normalizeNegotiationOffer,
  normalizeSessionNegotiation,
  normalizeAccessClient,
  buildAccessClientFromActor,
  buildSessionData,
  getSessions,
  recalculateSessionItemTotal,
  setSessionItemQuantity,
  getSessionItemsForSide,
  removeSessionItemById,
  canAcceptSessionQuantity,
  prepareSessionContext,
  getStoredAccessClients,
  getEffectiveClientRates,
  getMerchantDefaultClientRates,
  normalizeClientCustomRates,
  prepareAccessClients,
  checkSessionTransaction,
  buildExecutionPreview,
  buildSessionItemExecutionPlan,
  executeSessionItemTransfers,
  applyCurrencyTransferPlan,
  clearSessionAfterExecution
} from "./merchant-trade.mjs"
import {
  prepareMerchantJournalContext,
  buildMerchantJournalEntryFromSession,
  appendMerchantJournalEntry,
  prepareStorageJournalContext,
  buildStorageJournalEntryFromSession,
  appendStorageJournalEntry
} from "./merchant-journal.mjs"
import { requestMerchantSessionUpdate, requestStorageTagUpdate } from "./merchant-session-socket.mjs"

const { ActorSheetV2 } = foundry.applications.sheets
const { HandlebarsApplicationMixin } = foundry.applications.api
const STORAGE_MONEY_TAKE_ID = "storage-money-take"
const STORAGE_MONEY_DEPOSIT_ID = "storage-money-deposit"
const STORAGE_MONEY_ICON = "icons/commodities/currency/coins-assorted-mix-copper-silver-gold.webp"

// MTT base — feuille historique commune utilisée par les types MTT basés sur merchant-*
export class MerchantSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  #activeTab = "products"
  #activeSessionId = null
  #selectedClientActorUuid = ""
  #sessionCheckResult = null
  #journalSort = { key: "date", direction: "desc" }
  #localProductCategoryCollapseState = new Map()
  #scrollPositions = {}
  #scrollRestorePending = false
  #storageSheetLocked = true

  static DEFAULT_OPTIONS = {
    classes: [MTT.CSS.SHEET, MTT.CSS.MERCHANT_SHEET, "mtt-merchant-window"],
    position: {
      width: 820,
      height: 750
    },
    form: {
      submitOnChange: true
    },
    window: {
      title: "mtt.sheets.merchant",
      resizable: true
    },
    actions: {
      createItem: MerchantSheet.#onCreateItem,
      createProductCategory: MerchantSheet.#onCreateProductCategory,
      editItem: MerchantSheet.#onEditItem,
      deleteItem: MerchantSheet.#onDeleteItem,
      deleteProductCategory: MerchantSheet.#onDeleteProductCategory,
      toggleProductCategoryVisibility: MerchantSheet.#onToggleProductCategoryVisibility,
      createService: MerchantSheet.#onCreateService,
      deleteService: MerchantSheet.#onDeleteService,
      toggleServiceExpanded: MerchantSheet.#onToggleServiceExpanded,
      toggleCatalogItemVisibility: MerchantSheet.#onToggleCatalogItemVisibility,
      toggleProductApproval: MerchantSheet.#onToggleProductApproval,
      toggleServiceApproval: MerchantSheet.#onToggleServiceApproval,
      toggleLock: MerchantSheet.#onToggleLock,
      toggleSessionInteractions: MerchantSheet.#onToggleSessionInteractions,
      toggleProductSecret: MerchantSheet.#onToggleProductSecret,
      toggleProductCategory: MerchantSheet.#onToggleProductCategory,
      toggleProductFreePrice: MerchantSheet.#onToggleProductFreePrice,
      toggleServiceFreePrice: MerchantSheet.#onToggleServiceFreePrice,
      toggleStorageTradeResponsibleActor: MerchantSheet.#onToggleStorageTradeResponsibleActor,
      addProductToSession: MerchantSheet.#onAddProductToSession,
      addServiceToSession: MerchantSheet.#onAddServiceToSession,
      toggleClientAccess: MerchantSheet.#onToggleClientAccess,
      setSessionStatus: MerchantSheet.#onSetSessionStatus,
      checkSessionTransaction: MerchantSheet.#onCheckSessionTransaction,
      previewSessionExecution: MerchantSheet.#onPreviewSessionExecution,
      submitSession: MerchantSheet.#onSubmitSession,
      unlockSubmittedSession: MerchantSheet.#onUnlockSubmittedSession,
      validateSessionTransaction: MerchantSheet.#onValidateSessionTransaction,
      refuseSessionTransaction: MerchantSheet.#onRefuseSessionTransaction,
      increaseSessionItemQuantity: MerchantSheet.#onIncreaseSessionItemQuantity,
      decreaseSessionItemQuantity: MerchantSheet.#onDecreaseSessionItemQuantity,
      increaseStorageMoney: MerchantSheet.#onIncreaseStorageMoney,
      decreaseStorageMoney: MerchantSheet.#onDecreaseStorageMoney,
      removeSessionItem: MerchantSheet.#onRemoveSessionItem,
      submitNegotiationOffer: MerchantSheet.#onSubmitNegotiationOffer,
      acceptNegotiationOffer: MerchantSheet.#onAcceptNegotiationOffer,
      refuseNegotiationOffer: MerchantSheet.#onRefuseNegotiationOffer,
      clearSessionDraft: MerchantSheet.#onClearSessionDraft,
      editShopImage: MerchantSheet.#onEditShopImage,
      editManagerImage: MerchantSheet.#onEditManagerImage,
      rollNegotiation: MerchantSheet.#onRollNegotiation,
      selectTab: MerchantSheet.#onSelectTab,
      sortJournal: MerchantSheet.#onSortJournal,
      saveReferenceState: MerchantSheet.#onSaveReferenceState,
      restoreReferenceState: MerchantSheet.#onRestoreReferenceState,
      toggleStorageTag: MerchantSheet.#onToggleStorageTag
    }
  }

  static PARTS = {
    body: {
      template: MTT.TEMPLATES.MERCHANT_SHEET
    }
  }

  get title() {
    const entityType = getMTTEntityType(this.actor) || MTT.ENTITY_TYPES.MERCHANT
    const titleKey = entityType === MTT.ENTITY_TYPES.STORAGE ? "mtt.sheets.storageTitle" : "mtt.sheets.merchantTitle"
    return game.i18n.format(titleKey, {
      name: this.actor?.name ?? ""
    })
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options)

    if (this.#activeTab === "sessions") this.#activeTab = "products"

    // MTT base — utilisé par les types MTT partageant la feuille
    const entityType = getMTTEntityType(this.actor) || MTT.ENTITY_TYPES.MERCHANT
    const isStorage = entityType === MTT.ENTITY_TYPES.STORAGE
    const isShop = entityType === MTT.ENTITY_TYPES.MERCHANT
    const storageData = isStorage ? getStorageData(this.actor) : null
    const merchantContext = isStorage ? this.#buildStorageMerchantContext(storageData) : getMerchantData(this.actor)

    // MTT base — édition de la feuille commune merchant-* selon verrouillage et droits Foundry
    const isEditable = this.isEditable
    const isLocked = this.#getSheetLockedState(entityType)
    const isUnlocked = !isLocked
    const canEditMerchant = isEditable && isUnlocked
    const sessionInteractionsOpen = this.#getSessionInteractionsOpenState(entityType)
    const isLimited = getMerchantLimitedState(this.actor)
    const permissions = getMerchantPermissions(this.actor, { user: game.user })
    const sheetPermissions = isStorage
      ? {
          ...permissions,
          canViewConfigTab: true,
          canOpenProduct: true
        }
      : permissions

    if (this.#activeTab === "services" && !isShop) this.#activeTab = "products"
    if (this.#activeTab === "configuration" && !sheetPermissions.canViewConfigTab) this.#activeTab = "products"

    context.mtt = {
      css: MTT.CSS,
      entityType,
      isShop,
      isStorage,
      activeTab: this.#activeTab,
      isEditable,
      isLocked,
      isUnlocked,
      canEditMerchant,
      sessionInteractionsOpen,
      canToggleSessionInteractions: isEditable,
      canDragProductToSeller: this.#canDragProductToSeller(),
      isLimited,
      permissions: getMerchantAccessContext(this.actor),
      configurablePermissions: sheetPermissions,
      labels: {
        merchantSheet: "mtt.sheets.merchant",
        lock: "mtt.sheet.lock",
        unlock: "mtt.sheet.unlock",
        createItem: "mtt.actions.createItem"
      }
    }

    context.entityType = entityType
    context.isShop = isShop
    context.isStorage = isStorage
    context.actor = this.actor
    context.merchant = merchantContext
    context.permissions = sheetPermissions
    context.storageTradeWithMerchant = isStorage ? this.#prepareStorageTradeWithMerchantContext(storageData) : null

    const activeSession = this.#getActiveSession()
    const canEditActiveSession = Boolean(isStorage && this.#canEditStorageTagsForSession(activeSession))
    context.canEditActiveSession = canEditActiveSession
    const canEditActiveSessionItems = this.#prepareActiveSessionAccess(activeSession).canEditActiveSession
    const effectiveRates = this.#getEffectiveRatesForSession(activeSession)
    context.items = prepareItems(this.actor, effectiveRates.productSellPercent, {
      includeHidden: isEditable,
      sessionEntries: isStorage ? (storageData?.sessions?.entries ?? []) : null,
      activeSessionId: isStorage ? (activeSession?.id ?? "") : "",
      canEditActiveSession: canEditActiveSessionItems,
      voterActorUuid: canEditActiveSession ? activeSession.actorUuid : "",
      isEditable
    })
    context.productCategories = prepareProductCategories(this.actor, context.items, {
      includeHidden: isEditable,
      collapsedCategories: Object.fromEntries(this.#localProductCategoryCollapseState)
    })
    context.services = prepareServices(this.actor, effectiveRates.serviceSellPercent, { includeHidden: isEditable })
    context.trade = prepareTrade(this.actor)
    context.wallet = context.merchant?.wallet ?? {}
    context.mtt.walletCurrencies = prepareWalletCurrencies(this.actor)
    context.mtt.headerCurrencies = context.mtt.walletCurrencies
    context.mtt.hasHeaderCurrencies = context.mtt.headerCurrencies.length > 0
    context.mtt.currencyOptions = prepareCurrencyOptions()
    context.mtt.access = this.#prepareAccessContext()
    context.mtt.session = isStorage ? this.#prepareStorageSessionContext() : this.#prepareSessionContext()
    context.mtt.referenceState = this.#prepareReferenceStateContext()
    context.mtt.journal = isStorage
      ? prepareStorageJournalContext(this.actor, {
          user: game.user,
          sort: this.#journalSort,
          permissions: sheetPermissions
        })
      : prepareMerchantJournalContext(this.actor, {
          user: game.user,
          sort: this.#journalSort,
          permissions: sheetPermissions
        })

    return context
  }

  #getSheetLockedState(entityType) {
    // MTT base — lecture du verrouillage actif selon le type de feuille MTT
    if (entityType === MTT.ENTITY_TYPES.STORAGE) return this.#storageSheetLocked
    return getMerchantSheetLockedState(this.actor)
  }

  #getSessionInteractionsOpenState(entityType) {
    const data = entityType === MTT.ENTITY_TYPES.STORAGE ? getStorageData(this.actor) : getMerchantData(this.actor)
    return data?.sheet?.sessionInteractionsOpen !== false
  }

  #getSessionInteractionsOpenPath(entityType) {
    return entityType === MTT.ENTITY_TYPES.STORAGE
      ? getStorageFlagPath("sheet.sessionInteractionsOpen")
      : getMerchantFlagPath("sheet.sessionInteractionsOpen")
  }

  #buildStorageMerchantContext(storageData = null) {
    const storage = storageData?.storage ?? {}
    const name = String(storage.name ?? "").trim() || (this.actor?.name ?? "")
    const img = String(storage.img ?? "").trim() || (this.actor?.img ?? "")

    return {
      enabled: true,
      sheet: {
        isLocked: this.#storageSheetLocked
      },
      shop: {
        name,
        img,
        description: storage.description ?? ""
      },
      manager: {
        mode: "actor",
        actorUuid: this.actor?.uuid ?? null,
        displayName: "",
        img
      },
      trade: {
        buyPercent: 50,
        sellPercent: 100,
        serviceSellPercent: 100,
        negotiationFormula: ""
      },
      wallet: storageData?.wallet ?? { currencies: {} },
      referenceState: null,
      journal: {
        nextTransactionNumber: 1,
        transactions: []
      },
      access: {
        clients: []
      },
      catalog: {
        keepEmptyItems: true,
        collapsedCategories: {},
        hiddenCategories: {},
        productCategories: [],
        products: [],
        services: []
      },
      sessions: {
        entries: []
      }
    }
  }

  #prepareStorageSessionContext() {
    // MTT base — la session storage réutilise le contexte de session commun sans logique commerciale dans le HBS
    const accessClients = this.#prepareAccessClients()
    const session = this.#getActiveSession()
    this.#normalizeStorageExchangeSession(session)
    const buyerActor = session?.actorUuid ? game.actors.find((actor) => actor.uuid === session.actorUuid) : null

    const sessionContext = prepareSessionContext(this.actor, {
      session,
      selectedClient: this.#getSelectedClient(),
      sessionCheckResult: this.#sessionCheckResult,
      accessClients,
      buyerActor
    })
    const referenceCurrency = getReferenceCurrency()
    const referenceCurrencyLabel = String(
      referenceCurrency?.abbreviation ?? referenceCurrency?.id ?? referenceCurrency?.name ?? ""
    ).trim()
    const moneyTakeItem = session?.sellerItems?.find(
      (item) => item.id === STORAGE_MONEY_TAKE_ID && item.type === "money"
    )
    const moneyDepositItem = session?.buyerItems?.find(
      (item) => item.id === STORAGE_MONEY_DEPOSIT_ID && item.type === "money"
    )
    const takeValue = Number(moneyTakeItem?.unitPriceValue ?? 0)
    const depositValue = Number(moneyDepositItem?.unitPriceValue ?? 0)
    const buyerItems = sessionContext.buyerItems.filter((item) => item.type !== "money")
    const sellerItems = sessionContext.sellerItems.filter((item) => item.type !== "money")

    return {
      ...sessionContext,
      ...this.#prepareActiveSessionAccess(session),
      buyerItems,
      sellerItems,
      hasBuyerItems: buyerItems.length > 0,
      hasSellerItems: sellerItems.length > 0,
      hasAnyItems:
        buyerItems.length > 0 ||
        sellerItems.length > 0 ||
        (Number.isFinite(takeValue) && takeValue > 0) ||
        (Number.isFinite(depositValue) && depositValue > 0),
      storageMoney: {
        referenceCurrencyLabel,
        takeItemId: STORAGE_MONEY_TAKE_ID,
        depositItemId: STORAGE_MONEY_DEPOSIT_ID,
        takeValue: Number.isFinite(takeValue) && takeValue >= 0 ? takeValue : 0,
        depositValue: Number.isFinite(depositValue) && depositValue >= 0 ? depositValue : 0
      }
    }
  }

  #prepareStorageTradeWithMerchantContext(storageData = null) {
    // MTT storage — configuration des responsables de marchandage du stockage
    const responsibleActorUuids = new Set(storageData?.tradeWithMerchant?.responsibleActorUuids ?? [])
    const actorsByUuid = new Map()

    for (const entry of this.#prepareAccessClients()) {
      const actorUuid = String(entry.actorUuid ?? "").trim()
      if (!actorUuid) continue

      const existing = actorsByUuid.get(actorUuid)
      actorsByUuid.set(actorUuid, {
        ...entry,
        actorName: String(entry.actorName ?? "").trim() || existing?.actorName || actorUuid,
        actorImg: String(entry.actorImg ?? "").trim() || existing?.actorImg || "icons/svg/mystery-man.svg"
      })
    }

    const actors = Array.from(actorsByUuid.values()).map((actor) => {
      const actorUuid = String(actor.actorUuid ?? "").trim()
      const actorName = String(actor.actorName ?? "").trim() || actorUuid
      const actorImg = String(actor.actorImg ?? "").trim() || "icons/svg/mystery-man.svg"
      const isResponsible = responsibleActorUuids.has(actorUuid)

      return {
        actorUuid,
        actorName,
        actorImg,
        isResponsible,
        cardClasses: [
          "mtt-storage-trade-responsible-card",
          isResponsible ? "mtt-storage-trade-responsible-card-active" : ""
        ]
          .filter(Boolean)
          .join(" "),
        tooltip: game.i18n.format(
          isResponsible
            ? "mtt.storage.tradeWithMerchant.responsibleTooltip"
            : "mtt.storage.tradeWithMerchant.notResponsibleTooltip",
          { actorName }
        )
      }
    })

    return {
      actors,
      hasActors: actors.length > 0,
      canConfigure: this.isEditable,
      description: game.i18n.localize("mtt.storage.tradeWithMerchant.description")
    }
  }

  async _preRender(context, options) {
    await super._preRender(context, options)
    this.#saveScrollPositions()
  }

  _onRender(context, options) {
    super._onRender(context, options)

    this.element
      .querySelectorAll("[data-mtt-product-field]")
      .forEach((input) => input.addEventListener("change", (event) => this.#onProductFieldChange(event)))

    this.element.querySelectorAll("[data-mtt-merchant-field]").forEach((input) => {
      input.addEventListener("change", (event) => this.#onMerchantFieldChange(event))
      input.addEventListener("blur", (event) => this.#onMerchantFieldChange(event))
    })

    this.element
      .querySelectorAll("[data-mtt-category-name]")
      .forEach((input) => input.addEventListener("change", (event) => this.#onCategoryNameChange(event)))

    this.element
      .querySelectorAll("[data-product-id]")
      .forEach((row) => row.addEventListener("dragstart", (event) => this.#onProductDragStart(event)))

    this.element.querySelectorAll("[data-mtt-category-drop]").forEach((dropZone) => {
      dropZone.addEventListener("dragover", (event) => this.#onCategoryDragOver(event))
      dropZone.addEventListener("drop", (event) => this.#onCategoryDrop(event))
    })

    this.element
      .querySelectorAll("[data-mtt-service-field]")
      .forEach((input) => input.addEventListener("change", (event) => this.#onServiceFieldChange(event)))

    this.element
      .querySelectorAll("[data-mtt-catalog-context-menu]")
      .forEach((target) =>
        target.addEventListener("contextmenu", (event) => this.#onCatalogItemContextMenu(event, target))
      )

    this.element.querySelectorAll("[data-mtt-service-drop]").forEach((dropZone) => {
      if (dropZone.dataset.mttDropBound) return
      dropZone.dataset.mttDropBound = "1"
      dropZone.addEventListener("dragover", (event) => this.#onServiceDragOver(event))
      dropZone.addEventListener("drop", (event) => this.#onServiceDrop(event))
    })

    this.element
      .querySelectorAll("[data-mtt-merchant-config-field]")
      .forEach((input) => input.addEventListener("change", (event) => this.#onMerchantConfigFieldChange(event)))

    this.element
      .querySelectorAll("[data-mtt-wallet-currency]")
      .forEach((input) => input.addEventListener("change", (event) => this.#onWalletCurrencyChange(event)))

    this.element
      .querySelectorAll("[data-mtt-session-field]")
      .forEach((input) => input.addEventListener("change", (event) => this.#onSessionFieldChange(event)))

    this.element
      .querySelectorAll("[data-mtt-negotiation-field]")
      .forEach((input) => input.addEventListener("input", (event) => this.#onNegotiationDraftFieldInput(event)))

    this.element.querySelectorAll("[data-mtt-session-seller-drop]").forEach((dropZone) => {
      if (dropZone.dataset.mttSellerDropBound) return
      dropZone.dataset.mttSellerDropBound = "1"
      dropZone.addEventListener("dragover", (event) => this.#onSessionSellerDragOver(event))
      dropZone.addEventListener("drop", (event) => this.#onSessionSellerDrop(event))
    })

    this.element.querySelectorAll("[data-mtt-client-drop]").forEach((dropZone) => {
      if (dropZone.dataset.mttClientDropBound) return
      dropZone.dataset.mttClientDropBound = "1"
      dropZone.addEventListener("dragover", (event) => this.#onClientDragOver(event))
      dropZone.addEventListener("drop", (event) => this.#onClientDrop(event))
    })

    this.#renderAccessRail(context)

    this.#scrollRestorePending = true
    requestAnimationFrame(() => this.#restoreScrollPositions())
  }

  #onNegotiationDraftFieldInput(event) {
    const input = event.currentTarget
    const field = input.dataset.mttNegotiationField
    const draft = input.closest("[data-negotiation-draft]")
    if (!draft || !field) return

    this.#recalculateNegotiationDraft(draft, field)
  }

  #recalculateNegotiationDraft(draft, changedField) {
    const quantityInput = draft.querySelector('[data-mtt-negotiation-field="quantity"]')
    const unitInput = draft.querySelector('[data-mtt-negotiation-field="unitPriceValue"]')
    const totalInput = draft.querySelector('[data-mtt-negotiation-field="totalPriceValue"]')
    const percentInput = draft.querySelector('[data-mtt-negotiation-field="percentOfReference"]')
    const isFreePrice = draft.dataset.isFreePrice === "true"
    if (!quantityInput || !unitInput || !totalInput) return
    if (!isFreePrice && !percentInput) return

    const reference = Number(draft.dataset.referenceUnitPrice)
    let quantity = Number(quantityInput.value)
    let unitPrice = Number(unitInput.value)
    let totalPrice = Number(totalInput.value)
    let percent = percentInput ? Number(percentInput.value) : 100

    if (!Number.isFinite(quantity) || quantity <= 0) quantity = 1
    if (!Number.isFinite(unitPrice) || unitPrice < 0) unitPrice = 0
    if (!Number.isFinite(totalPrice) || totalPrice < 0) totalPrice = 0
    if (!Number.isFinite(percent) || percent < 0) percent = 0

    if (["quantity", "unitPriceValue"].includes(changedField)) {
      totalPrice = quantity * unitPrice
      if (!isFreePrice) percent = reference > 0 ? (unitPrice / reference) * 100 : 100
    }

    if (changedField === "totalPriceValue") {
      unitPrice = quantity > 0 ? totalPrice / quantity : 0
      if (!isFreePrice) percent = reference > 0 ? (unitPrice / reference) * 100 : 100
    }

    if (!isFreePrice && changedField === "percentOfReference") {
      unitPrice = reference > 0 ? (reference * percent) / 100 : 0
      totalPrice = quantity * unitPrice
    }

    if (changedField !== "quantity") quantityInput.value = Number(quantity.toFixed(2))
    if (changedField !== "unitPriceValue") unitInput.value = Number(unitPrice.toFixed(2))
    if (changedField !== "totalPriceValue") totalInput.value = Number(totalPrice.toFixed(2))
    if (!isFreePrice && percentInput && changedField !== "percentOfReference") {
      percentInput.value = Number(percent.toFixed(2))
    }
  }

  #getNegotiationFromEvent(target, session) {
    const negotiationId = target.closest("[data-negotiation-id]")?.dataset.negotiationId
    if (!negotiationId || !session) return null

    session.negotiations = Array.isArray(session.negotiations) ? session.negotiations : []
    return session.negotiations.find((negotiation) => negotiation.id === negotiationId) ?? null
  }

  #getNegotiationOfferSide() {
    return this.isEditable ? "merchant" : "buyer"
  }

  #requireMerchantPermission(permissionKey, { notify = true } = {}) {
    if (game.user?.isGM) return true

    const permissions = getMerchantPermissions(this.actor, { user: game.user })
    if (permissions?.[permissionKey]) return true

    if (notify) ui.notifications.warn(game.i18n.localize("mtt.notifications.permissionDenied"))
    return false
  }

  #canUserManageCurrentSheet(user = game.user) {
    if (user?.isGM) return true
    if (this.actor?.testUserPermission?.(user, "OWNER")) return true
    const level = this.actor?.getUserLevel?.(user) ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
    return level >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
  }

  #getActorByUuid(actorUuid) {
    const uuid = String(actorUuid ?? "").trim()
    if (!uuid) return null
    return (
      game.actors?.find?.((actor) => actor.uuid === uuid) ??
      game.actors?.get?.(uuid) ??
      game.actors?.get?.(uuid.replace(/^Actor\./, "")) ??
      null
    )
  }

  #userOwnsActorUuid(actorUuid, user = game.user) {
    const actor = this.#getActorByUuid(actorUuid)
    if (!actor) return false
    return (
      Boolean(actor.testUserPermission?.(user, "OWNER")) ||
      (actor.getUserLevel?.(user) ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE) >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
    )
  }

  #canUserViewStorageMerchantSession(storageActor, user = game.user) {
    if (user?.isGM) return true
    if (this.#canUserManageCurrentSheet(user)) return true

    return getStorageAccessActorUuids(storageActor).some((actorUuid) => this.#userOwnsActorUuid(actorUuid, user))
  }

  #canUserTradeWithMerchantAsStorage(storageActor, user = game.user) {
    if (user?.isGM) return true
    if (this.#canUserManageCurrentSheet(user)) return true

    return getStorageTradeResponsibleActorUuids(storageActor).some(
      (actorUuid) =>
        canActorTradeWithMerchantAsStorage(storageActor, actorUuid) && this.#userOwnsActorUuid(actorUuid, user)
    )
  }

  #canDragProductToSeller() {
    if (game.user?.isGM) return true
    if (this.isEditable) return true
    if (this.#isStorageEntity()) return this.#canUserTradeWithMerchantAsStorage(this.actor)
    return false
  }

  #getSessionActorAccess(sessionOrActorUuid, user = game.user) {
    const actorUuid =
      typeof sessionOrActorUuid === "string" ? sessionOrActorUuid : String(sessionOrActorUuid?.actorUuid ?? "").trim()
    const actor = this.#getActorByUuid(actorUuid)
    const ownershipLevel = actor?.getUserLevel?.(user) ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
    const isGM = Boolean(user?.isGM)
    const canManageSheet = this.#canUserManageCurrentSheet(user)
    const isOwner =
      Boolean(actor?.testUserPermission?.(user, "OWNER")) || ownershipLevel >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
    const isObserver = ownershipLevel >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
    const isLimited = ownershipLevel >= CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED
    const permissions = getMerchantPermissions(this.actor, { user })
    const canViewOtherSessions = Boolean(permissions.canViewObserverActorSessions)
    const canInteractWithSession = Boolean(permissions.canInteractWithSession)
    const entityType = getMTTEntityType(this.actor) || MTT.ENTITY_TYPES.MERCHANT
    const sessionInteractionsOpen = this.#getSessionInteractionsOpenState(entityType)
    const canUseSessionInteraction = sessionInteractionsOpen || this.isEditable || canManageSheet || isGM

    const baseAccess = {
      actor,
      actorUuid,
      ownershipLevel,
      isOwner,
      isObserver,
      isLimited,
      canViewOtherSession: isGM || canManageSheet || isOwner || (canViewOtherSessions && isObserver),
      canSelectOtherSession: isGM || canManageSheet || isOwner || (canViewOtherSessions && isObserver),
      canInteractWithOtherSession: isGM || canManageSheet || (canUseSessionInteraction && isOwner && canInteractWithSession)
    }

    if (!isMTTStorage(actor)) return baseAccess

    const canViewStorageSession = this.#canUserViewStorageMerchantSession(actor, user)
    const canTradeAsStorage = this.#canUserTradeWithMerchantAsStorage(actor, user)

    return {
      ...baseAccess,
      canViewOtherSession: baseAccess.canViewOtherSession || canViewStorageSession,
      canSelectOtherSession: baseAccess.canSelectOtherSession || canViewStorageSession,
      canInteractWithOtherSession: baseAccess.canInteractWithOtherSession || (canUseSessionInteraction && canTradeAsStorage)
    }
  }

  #canInteractWithSession(session, { notify = true } = {}) {
    if (this.#getSessionActorAccess(session).canInteractWithOtherSession) return true
    if (notify) ui.notifications.warn(game.i18n.localize("mtt.notifications.permissionDenied"))
    return false
  }

  #getActiveSessionForInteraction({ notify = true } = {}) {
    const session = this.#getActiveSession()
    if (!session) return null
    if (!this.#canInteractWithSession(session, { notify })) return null
    return session
  }

  #prepareActiveSessionAccess(session) {
    // MTT base — droits communs de consultation et d'interaction sur la session/actor actif.
    const access = this.#getSessionActorAccess(session ?? this.#getSelectedClient()?.actorUuid)
    return {
      ...access,
      canEditActiveSession: access.canInteractWithOtherSession
    }
  }

  #canEditStorageTagsForSession(session) {
    if (!session?.actorUuid) return false
    if (["submitted", "validated", "refused"].includes(session.status)) return false
    return this.#getSessionActorAccess(session).canInteractWithOtherSession
  }

  #canAnswerNegotiation(negotiation) {
    if (!negotiation || negotiation.status !== "active") return false
    return negotiation.currentTurn === this.#getNegotiationOfferSide()
  }

  #getNegotiationDraftValues(target) {
    const draft =
      target.closest("[data-negotiation-draft]") ??
      target.closest("[data-negotiation-id]")?.querySelector("[data-negotiation-draft]")
    if (!draft) return null

    const quantity = Number(draft.querySelector('[data-mtt-negotiation-field="quantity"]')?.value)
    const unitPriceValue = Number(draft.querySelector('[data-mtt-negotiation-field="unitPriceValue"]')?.value)
    const totalPriceValue = Number(draft.querySelector('[data-mtt-negotiation-field="totalPriceValue"]')?.value)
    const isFreePrice = draft.dataset.isFreePrice === "true"
    const percentInput = draft.querySelector('[data-mtt-negotiation-field="percentOfReference"]')
    const percentOfReference = percentInput ? Number(percentInput.value) : 100

    if (!Number.isFinite(quantity) || quantity <= 0) return null
    if (!Number.isFinite(unitPriceValue) || unitPriceValue < 0) return null
    if (!Number.isFinite(totalPriceValue) || totalPriceValue < 0) return null
    if (!isFreePrice && (!Number.isFinite(percentOfReference) || percentOfReference < 0)) return null

    return {
      quantity,
      unitPriceValue,
      totalPriceValue,
      percentOfReference: Number.isFinite(percentOfReference) && percentOfReference >= 0 ? percentOfReference : 100
    }
  }

  #createSubmittedNegotiationOffer(values, side) {
    return normalizeNegotiationOffer({
      id: foundry.utils.randomID(),
      side: side === "merchant" ? "merchant" : "buyer",
      quantity: Number(values.quantity),
      unitPriceValue: Number(Number(values.unitPriceValue).toFixed(2)),
      totalPriceValue: Number(Number(values.totalPriceValue).toFixed(2)),
      percentOfReference: Number(Number(values.percentOfReference).toFixed(2)),
      status: "submitted",
      createdAt: new Date().toISOString()
    })
  }

  #getLastNegotiationOffer(negotiation) {
    const offers = Array.isArray(negotiation?.offers) ? negotiation.offers : []
    return offers.length > 0 ? offers[offers.length - 1] : null
  }

  #getNegotiationSourceLabel(negotiation) {
    if (negotiation.type === "service") return game.i18n.localize("mtt.sessions.item.service")
    if (negotiation.type === "item") return game.i18n.localize("mtt.sessions.item.object")
    return game.i18n.localize("mtt.sessions.item.product")
  }

  #buildSessionItemFromNegotiationOffer(negotiation, offer) {
    const quantity = Number(offer.quantity)
    const unitPriceValue = Number(offer.unitPriceValue)
    if (!Number.isFinite(quantity) || quantity <= 0) return null
    if (!Number.isFinite(unitPriceValue) || unitPriceValue < 0) return null
    if (negotiation.isFreePrice && unitPriceValue <= 0) return null

    return normalizeSessionItem({
      id: foundry.utils.randomID(),
      type: negotiation.type,
      sourceKind: negotiation.sourceKind,
      sourceId: negotiation.sourceId,
      sourceUuid: negotiation.sourceUuid,
      sourceActorUuid: negotiation.sourceActorUuid,
      name: negotiation.name,
      img: negotiation.img,
      quantity,
      unitPriceValue,
      priceCurrency: negotiation.priceCurrency,
      totalPriceValue: Number((quantity * unitPriceValue).toFixed(2)),
      sourceLabel: this.#getNegotiationSourceLabel(negotiation),
      proposedUnitPriceValue: negotiation.proposedUnitPriceValue ?? unitPriceValue,
      isFreePrice: Boolean(negotiation.isFreePrice),
      minimumPriceValue: negotiation.minimumPriceValue,
      deliveryQuantityPerLot: negotiation.deliveryQuantityPerLot,
      isFromActor: negotiation.side === "seller"
    })
  }

  #saveScrollPositions() {
    if (this.#scrollRestorePending) return

    this.#scrollPositions = {}

    const selectors = [".mtt-merchant-tab-content", ".mtt-merchant-session-sidebar"]

    for (const selector of selectors) {
      const element = this.element?.querySelector(selector)
      if (!element) continue
      this.#scrollPositions[selector] = element.scrollTop
    }
  }

  #restoreScrollPositions() {
    this.#scrollRestorePending = false
    for (const [selector, scrollTop] of Object.entries(this.#scrollPositions ?? {})) {
      const element = this.element?.querySelector(selector)
      if (!element) continue
      const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight)
      element.scrollTop = Math.min(scrollTop, maxScrollTop)
    }
  }

  // ─── Access rail (DOM building, stays in sheet) ───────────────────────────

  async #renderAccessRail(context) {
    const applicationElement = this.#getApplicationElement()
    if (!applicationElement) return

    this.#closeAccessContextMenu()
    applicationElement.querySelectorAll(".mtt-merchant-access-rail").forEach((rail) => rail.remove())
    this.element.querySelectorAll(".mtt-merchant-access-rail").forEach((rail) => rail.remove())

    const accessContext = context?.mtt?.access ?? this.#prepareAccessContext()
    const rail = await this.#buildAccessRail(accessContext)
    if (!rail) return
    applicationElement.append(rail)
    this.#activateAccessRail(rail)
  }

  #getApplicationElement() {
    const applicationElement = this.element.closest?.(".mtt-merchant-window")
    if (!applicationElement?.classList?.contains("mtt-merchant-sheet")) return null
    if (!applicationElement.contains(this.element) && applicationElement !== this.element) return null

    return applicationElement
  }

  async #buildAccessRail(accessContext) {
    const html = await foundry.applications.handlebars.renderTemplate(MTT.TEMPLATES.MERCHANT_ACCESS_RAIL, accessContext)
    const wrapper = document.createElement("div")
    wrapper.innerHTML = html.trim()
    return wrapper.firstElementChild ?? null
  }

  #activateAccessRail(rail) {
    rail.querySelectorAll('[data-mtt-client-access-action="toggle"]').forEach((button) => {
      button.addEventListener("click", (event) => MerchantSheet.#onToggleClientAccess.call(this, event, button))
      button.addEventListener("contextmenu", (event) => this.#onClientContextMenu(event, button))
    })

    rail.querySelectorAll("[data-mtt-client-drop]").forEach((dropZone) => {
      dropZone.addEventListener("dragover", (event) => this.#onClientDragOver(event))
      dropZone.addEventListener("drop", (event) => this.#onClientDrop(event))
    })
  }

  // ─── Wrappers for imported dialog functions ───────────────────────────────

  async #renderMttDialogContent(options) {
    return renderMttDialogContent(options)
  }

  async #renderConfirmDialogContent(options) {
    return renderConfirmDialogContent(options)
  }

  async #openSellerItemDialog(options) {
    return openSellerItemDialog(options)
  }

  // ─── Wrappers for imported utility functions ──────────────────────────────

  #htmlToPlainText(v) {
    return htmlToPlainText(v)
  }
  // ─── Wrappers for imported catalog functions ──────────────────────────────

  async #moveProductToCategory(itemId, categoryValue) {
    await moveProductToCategory(this.actor, itemId, categoryValue)
    this.render()
  }

  async #createServiceFromItem(item) {
    await createServiceFromItem(this.actor, item)
    this.render()
  }

  // ─── Wrappers for imported trade functions ────────────────────────────────

  #getSessions() {
    if (this.#isStorageEntity()) return foundry.utils.deepClone(getStorageData(this.actor)?.sessions?.entries ?? [])
    return getSessions(this.actor)
  }
  #setSessionItemQuantity(item, quantity) {
    return setSessionItemQuantity(item, quantity)
  }
  #getSessionItemsForSide(session, side) {
    return getSessionItemsForSide(session, side)
  }
  #removeSessionItemById(session, itemId, side) {
    return removeSessionItemById(session, itemId, side)
  }
  #setStorageSessionMoneyValue(session, side, amount) {
    // MTT storage — lignes permanentes de monnaie dans la session de stockage
    if (!this.#isStorageEntity() || !session) return null

    const isDeposit = side === "deposit"
    const itemId = isDeposit ? STORAGE_MONEY_DEPOSIT_ID : STORAGE_MONEY_TAKE_ID
    const itemsKey = isDeposit ? "buyerItems" : "sellerItems"
    const referenceCurrency = getReferenceCurrency()
    const referenceCurrencyLabel = String(
      referenceCurrency?.abbreviation ?? referenceCurrency?.id ?? referenceCurrency?.name ?? ""
    ).trim()
    const normalizedAmount = Number(Number(Math.max(0, Number(amount) || 0)).toFixed(2))

    session[itemsKey] = Array.isArray(session[itemsKey]) ? session[itemsKey] : []
    let item = session[itemsKey].find((entry) => entry.id === itemId && entry.type === "money")

    if (!item) {
      item = normalizeSessionItem({
        id: itemId,
        type: "money",
        sourceKind: "storageMoney",
        sourceUuid: "",
        sourceActorUuid: "",
        sourceId: itemId,
        name: game.i18n.localize(isDeposit ? "mtt.storage.session.money.deposit" : "mtt.storage.session.money.take"),
        img: STORAGE_MONEY_ICON,
        quantity: 1,
        unitPriceValue: normalizedAmount,
        totalPriceValue: normalizedAmount,
        priceCurrency: referenceCurrencyLabel,
        sourceLabel: ""
      })
      session[itemsKey].push(item)
      return item
    }

    item.quantity = 1
    item.unitPriceValue = normalizedAmount
    item.totalPriceValue = normalizedAmount
    item.priceCurrency = referenceCurrencyLabel
    item.sourceKind = "storageMoney"
    item.sourceId = itemId
    item.name = game.i18n.localize(isDeposit ? "mtt.storage.session.money.deposit" : "mtt.storage.session.money.take")
    item.img = item.img || STORAGE_MONEY_ICON
    return item
  }
  #normalizeStorageExchangeSession(session) {
    // MTT storage — prépare les lignes de session pour le moteur commun MTT
    if (!this.#isStorageEntity() || !session) return session

    session.buyerItems = Array.isArray(session.buyerItems) ? session.buyerItems : []
    session.sellerItems = Array.isArray(session.sellerItems) ? session.sellerItems : []

    const findMoneyItem = (itemId) => {
      const matchingItems = [...session.buyerItems, ...session.sellerItems].filter(
        (item) => item?.id === itemId && item?.type === "money"
      )
      return (
        matchingItems.find((item) => {
          const amount = Number(item.unitPriceValue)
          return Number.isFinite(amount) && amount > 0
        }) ??
        matchingItems[0] ??
        null
      )
    }

    const moneyTakeItem = findMoneyItem(STORAGE_MONEY_TAKE_ID)
    const moneyDepositItem = findMoneyItem(STORAGE_MONEY_DEPOSIT_ID)

    session.buyerItems = session.buyerItems.filter(
      (item) => !(item?.type === "money" && [STORAGE_MONEY_TAKE_ID, STORAGE_MONEY_DEPOSIT_ID].includes(item?.id))
    )
    session.sellerItems = session.sellerItems.filter(
      (item) => !(item?.type === "money" && [STORAGE_MONEY_TAKE_ID, STORAGE_MONEY_DEPOSIT_ID].includes(item?.id))
    )

    if (moneyDepositItem) {
      recalculateSessionItemTotal(moneyDepositItem)
      session.buyerItems.push(moneyDepositItem)
    }
    if (moneyTakeItem) {
      recalculateSessionItemTotal(moneyTakeItem)
      session.sellerItems.push(moneyTakeItem)
    }

    const refCurrency = getReferenceCurrency()
    const refCurrencyLabel = String(refCurrency?.abbreviation ?? refCurrency?.id ?? "").trim()
    for (const item of [...session.buyerItems, ...session.sellerItems]) {
      if (!item || item.type === "money") continue
      item.unitPriceValue = 0
      item.priceCurrency = String(item.priceCurrency ?? "").trim() || refCurrencyLabel
      recalculateSessionItemTotal(item)
    }

    return session
  }
  #getProductAvailability(productId, options = {}) {
    return (
      buildProductAvailabilityMap(getCatalogProducts(this.actor), this.#getSessions(), options).get(productId) ?? null
    )
  }
  #getProductSessionItemQuantityLimit(item, session) {
    if (!item || item.type !== "product") return null

    const availability = this.#getProductAvailability(item.sourceId, {
      excludeSessionId: session?.id ?? "",
      excludeSessionItemId: item.id ?? ""
    })

    if (!availability?.hasLimitedQuantity) return null
    return availability.availableQuantity
  }
  #getStorageSessionItemClaimState(item, session, requestedQuantity) {
    // MTT storage — limite temporaire de récupération par acteur want
    if (!this.#isStorageEntity() || item?.type !== "product" || !session) {
      return {
        applies: false,
        canAccept: true,
        reasonKey: "",
        limit: null,
        acceptedQuantity: requestedQuantity
      }
    }

    const product = getCatalogProduct(this.actor, item.sourceId)
    if (!product) {
      return {
        applies: false,
        canAccept: true,
        reasonKey: "",
        limit: null,
        acceptedQuantity: requestedQuantity
      }
    }

    const availability = this.#getProductAvailability(product.id)
    const storageIntentState = buildStorageItemIntentState({
      rawTags: product.rawStorageTags ?? {},
      sessions: this.#getSessions(),
      activeSession: session,
      activeSessionActorUuid: session.actorUuid ?? "",
      availableQuantity: availability?.availableQuantity ?? 0,
      product
    })
    const reasonKey = getStorageClaimQuantityBlockReasonKey(storageIntentState, requestedQuantity)
    const limit = storageIntentState.claimLimitPerWantActor
    const requested = Number(requestedQuantity)
    const acceptedQuantity =
      storageIntentState.hasWant && Number.isFinite(requested) && Number.isFinite(limit)
        ? Math.min(requested, limit)
        : requestedQuantity

    return {
      applies: storageIntentState.hasWant || storageIntentState.activeActorTag === "ignore",
      canAccept: !reasonKey || game.user?.isGM === true,
      reasonKey,
      limit,
      acceptedQuantity,
      intentState: storageIntentState
    }
  }
  #getStorageSessionClaimLimitErrors(session) {
    // MTT storage — sécurité finale avant transfert réel
    if (!this.#isStorageEntity() || game.user?.isGM === true || !session) return []

    const errors = []
    const checkedProductIds = new Set()
    for (const item of session.buyerItems ?? []) {
      if (item?.type !== "product" || checkedProductIds.has(item.sourceId)) continue

      checkedProductIds.add(item.sourceId)
      const product = getCatalogProduct(this.actor, item.sourceId)
      if (product?.isBlocked) {
        errors.push(game.i18n.localize("mtt.storage.intent.block.blockedItem"))
        continue
      }

      const totalClaimQuantity = (session.buyerItems ?? []).reduce((total, entry) => {
        if (entry?.type !== "product" || entry.sourceId !== item.sourceId) return total

        const quantity = Number(entry.quantity)
        return Number.isFinite(quantity) && quantity > 0 ? total + quantity : total
      }, 0)
      const storageClaimState = this.#getStorageSessionItemClaimState(item, session, totalClaimQuantity)
      if (!storageClaimState.applies || storageClaimState.canAccept) continue

      errors.push(game.i18n.localize(storageClaimState.reasonKey || "mtt.storage.intent.block.generic"))
    }

    return [...new Set(errors)]
  }
  #canAcceptSessionQuantity(item, quantity, { session = null, side = "" } = {}) {
    if (side === "buyer") {
      const requestedQuantity = Number(quantity)
      const currentQuantity = Number(item?.quantity ?? 0)
      const storageClaimState = this.#getStorageSessionItemClaimState(
        item,
        session ?? this.#getActiveSession(),
        quantity
      )
      if (
        storageClaimState.applies &&
        Number.isFinite(requestedQuantity) &&
        Number.isFinite(currentQuantity) &&
        requestedQuantity > currentQuantity &&
        !storageClaimState.canAccept
      ) {
        return false
      }
    }

    if (item?.type === "product") {
      session = session ?? this.#getActiveSession()
      const quantityLimit = this.#getProductSessionItemQuantityLimit(item, session)
      const requestedQuantity = Number(quantity)

      if (!Number.isFinite(requestedQuantity) || requestedQuantity < 0) return false
      if (quantityLimit === null) return true
      return requestedQuantity <= quantityLimit
    }

    return canAcceptSessionQuantity(this.actor, item, quantity)
  }

  #prepareReferenceStateContext() {
    const referenceState = getMerchantData(this.actor)?.referenceState ?? null
    const savedAt = new Date(referenceState?.savedAt ?? "")
    const savedAtLabel = Number.isNaN(savedAt.getTime()) ? "" : savedAt.toLocaleString()

    return {
      hasReferenceState: Boolean(referenceState?.savedAt),
      savedAtLabel
    }
  }

  #prepareAccessClients() {
    // MTT base — rail d’acteurs autorisés partagé par les types MTT
    return prepareAccessClients(this.actor, {
      selectedSession: this.#getSelectedSession(),
      selectedClientActorUuid: this.#selectedClientActorUuid,
      isEditable: this.isEditable,
      accessClients: this.#getAccessEntries(),
      sessions: this.#getSessions()
    })
  }

  #prepareSessionContext() {
    const accessClients = this.#prepareAccessClients()
    const session = this.#getActiveSession()
    const buyerActor = session?.actorUuid ? game.actors.find((actor) => actor.uuid === session.actorUuid) : null
    const sessionContext = prepareSessionContext(this.actor, {
      session,
      selectedClient: this.#getSelectedClient(),
      sessionCheckResult: this.#sessionCheckResult,
      accessClients,
      buyerActor
    })
    return {
      ...sessionContext,
      ...this.#prepareActiveSessionAccess(session)
    }
  }

  async #checkSessionTransaction(session) {
    const isStorage = this.#isStorageEntity()
    if (isStorage) this.#normalizeStorageExchangeSession(session)
    const preparedSession = isStorage ? this.#prepareStorageSessionContext() : this.#prepareSessionContext()
    return checkSessionTransaction(
      this.actor,
      session,
      preparedSession,
      isStorage
        ? {
            accessClients: this.#prepareAccessClients(),
            includeCurrencyTransfers: true,
            skipCommercialDeliveryText: true
          }
        : {}
    )
  }

  // ─── Session field change handler ─────────────────────────────────────────

  async #onSessionFieldChange(event) {
    const input = event.currentTarget
    const field = input.dataset.mttSessionField
    const session = this.#getActiveSessionForInteraction()
    if (!session) return

    if (field === "label") {
      const label = input.value?.trim() ?? ""
      if (!label) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.emptySessionLabel"))
        input.value = session.label
        return
      }

      session.label = label
      await this.#saveSession(session)
      this.render()
      return
    }

    if (field === "storageMoney") {
      const side = input.dataset.storageMoneySide
      if (!["take", "deposit"].includes(side)) return

      const amount = Number(input.value)
      if (!Number.isFinite(amount) || amount < 0) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidWalletAmount"))
        input.value = 0
        this.#setStorageSessionMoneyValue(session, side, 0)
        await this.#saveSession(session)
        this.render()
        return
      }

      const roundedAmount = Number(amount.toFixed(2))
      this.#setStorageSessionMoneyValue(session, side, roundedAmount)
      await this.#saveSession(session)
      this.render()
      return
    }

    if (field !== "quantity") return

    const raw = input.value
    const itemId = input.dataset.sessionItemId ?? input.closest("[data-session-item-id]")?.dataset.sessionItemId
    if (!itemId) return

    const side = input.dataset.sessionSide ?? input.closest("[data-session-side]")?.dataset.sessionSide ?? "buyer"
    const items = this.#getSessionItemsForSide(session, side)
    const item = items.find((it) => it.id === itemId)
    if (!item) return

    const requested = Number(raw)
    if (!Number.isFinite(requested) || requested < 0) {
      ui.notifications.warn(
        game.i18n.localize(
          side === "seller" ? "mtt.notifications.invalidSellerItemQuantity" : "mtt.notifications.invalidSessionQuantity"
        )
      )
      input.value = item.quantity
      return
    }

    const storageClaimState =
      side === "buyer" && requested > Number(item.quantity)
        ? this.#getStorageSessionItemClaimState(item, session, requested)
        : null
    if (storageClaimState?.applies && !storageClaimState.canAccept) {
      ui.notifications.warn(game.i18n.localize(storageClaimState.reasonKey || "mtt.storage.intent.block.generic"))
      const acceptedQuantity = Number(storageClaimState.acceptedQuantity)
      if (
        storageClaimState.reasonKey === "mtt.storage.intent.block.claimLimitReached" &&
        Number.isFinite(acceptedQuantity) &&
        acceptedQuantity > 0 &&
        acceptedQuantity !== Number(item.quantity)
      ) {
        this.#setSessionItemQuantity(item, acceptedQuantity)
        await this.#saveSession(session)
        this.render()
        return
      }

      input.value = item.quantity
      return
    }

    if (!this.#canAcceptSessionQuantity(item, requested, { session, side })) {
      ui.notifications.warn(
        game.i18n.localize(
          side === "seller" ? "mtt.notifications.notEnoughSellerItemQuantity" : "mtt.notifications.notEnoughQuantity"
        )
      )
      input.value = item.quantity
      return
    }

    if (requested === 0) {
      this.#removeSessionItemById(session, itemId, side)
      await this.#saveSession(session)
      this.render()
      return
    }

    this.#setSessionItemQuantity(item, requested)
    await this.#saveSession(session)
    this.render()
  }

  // ─── Document drop handlers ───────────────────────────────────────────────

  _canDragDrop(selector) {
    return super._canDragDrop(selector)
  }

  async _onDropDocument(event, document) {
    const target = event.target instanceof Element ? event.target : null
    if (!target?.closest("[data-mtt-product-document-drop]")) return

    if (!this.isEditable) return

    if (document.documentName !== "Item") {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.onlyItemsCanBeDropped"))
      return
    }

    if (!isItemTypeAllowed(document, "allowedProductTypes")) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.productTypeNotAllowed"))
      return
    }

    this.#saveScrollPositions()

    const automaticCategory = getAutomaticItemCategory(document)
    const productCategoryValue = await getOrCreateAutomaticProductCategory(this.actor, automaticCategory)

    const sourceUuid = resolveDroppedItemSourceUuid(event, document)
    await addOrMergeProduct(this.actor, document, productCategoryValue, automaticCategory, sourceUuid)
  }

  // ─── Item/service helpers ─────────────────────────────────────────────────

  #getProductFromEvent(target) {
    const productId =
      target.closest("[data-product-id]")?.dataset.productId ?? target.closest("[data-item-id]")?.dataset.itemId
    if (!productId) return null
    return getCatalogProduct(this.actor, productId) ?? null
  }

  #getServiceFromEvent(target) {
    const serviceId = target.closest("[data-service-id]")?.dataset.serviceId
    if (!serviceId) return null

    return getMerchantData(this.actor)?.catalog?.services?.find((service) => service.id === serviceId) ?? null
  }

  // ─── Product drag/drop handlers ───────────────────────────────────────────

  #onProductDragStart(event) {
    const target = event.currentTarget
    const productId = target.dataset.mttProductId
    if (!productId || !this.#canDragProductToSeller()) return

    const product = getCatalogProduct(this.actor, productId)
    const sourceCategory = product?.category ?? ""

    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({ type: "mtt.product", itemId: productId, actorUuid: this.actor.uuid, sourceCategory })
    )
    event.dataTransfer.effectAllowed = "copyMove"
  }

  #onCategoryDragOver(event) {
    if (!this.isEditable) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }

  async #onCategoryDrop(event) {
    const categoryValue = event.currentTarget.dataset.category ?? ""
    let payload = null

    try {
      payload = JSON.parse(event.dataTransfer.getData("application/json"))
    } catch {
      return
    }

    if (!payload || payload.type !== "mtt.product") return

    if (payload.actorUuid && payload.actorUuid !== this.actor.uuid) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidProductDrop"))
      return
    }

    if (!this.isEditable) return

    event.preventDefault()
    event.stopPropagation()

    this.#saveScrollPositions()
    await this.#moveProductToCategory(payload.itemId, categoryValue)
  }

  // ─── Service drag/drop handlers ───────────────────────────────────────────

  #onServiceDragOver(event) {
    if (!this.isEditable) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }

  async #onServiceDrop(event) {
    if (!this.isEditable) return

    event.preventDefault()
    event.stopPropagation()

    const dragData = foundry.applications.ux.TextEditor.implementation.getDragEventData(event)
    if (!dragData) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.onlyItemsCanCreateServices"))
      return
    }

    let doc = null
    try {
      if (dragData.uuid) {
        doc = await fromUuid(dragData.uuid)
      } else if (dragData.pack && dragData.id) {
        const pack = game.packs.get(dragData.pack)
        if (pack) doc = await pack.getDocument(dragData.id)
      } else if (dragData.type === "Item" && dragData.id) {
        doc = game.items.get(dragData.id) ?? null
      }
    } catch {
      // ignore
    }

    if (!doc || doc.documentName !== "Item") {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.onlyItemsCanCreateServices"))
      return
    }

    if (!isItemTypeAllowed(doc, "allowedServiceTypes")) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.serviceTypeNotAllowed"))
      return
    }

    this.#saveScrollPositions()
    await this.#createServiceFromItem(doc)
  }

  // ─── Session seller drag/drop ─────────────────────────────────────────────

  #onSessionSellerDragOver(event) {
    const activeSession = this.#getActiveSession()
    if (activeSession && !this.#canInteractWithSession(activeSession, { notify: false })) return
    if (!activeSession && !this.#requireMerchantPermission("canInteractWithSession", { notify: false })) return

    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }

  async #onSessionSellerDrop(event) {
    event.preventDefault()
    event.stopPropagation()

    const activeSession = this.#getActiveSession()
    if (activeSession && !this.#canInteractWithSession(activeSession)) return
    if (!activeSession && !this.#requireMerchantPermission("canInteractWithSession")) return

    if (!this.#isStorageEntity() && !this.#requireSelectedSessionForItemAddition()) return

    const droppedItem = await this.#getDroppedItemDocument(event)
    if (!droppedItem) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.onlyItemsCanBeSold"))
      return
    }

    if (this.#isStorageEntity()) {
      const session = await this.#getOrCreateStorageSessionForAddingItem()
      if (!session) return

      if (session.actorUuid && droppedItem.sourceActor?.uuid !== session.actorUuid) {
        ui.notifications.warn(game.i18n.localize("mtt.storage.session.dropSelectedActorOnly"))
        return
      }

      const sellerData = prepareSellerItemDropData(this.actor, droppedItem, { buyPercent: 100 })
      const sessionItem = await this.#addSessionSellerItem({
        ...sellerData,
        quantity: 1,
        unitPriceValue: 0,
        priceCurrency: "",
        sourceLabel: game.i18n.localize("mtt.storage.session.item.actor")
      })
      if (!sessionItem) return

      this.render()
      return
    }

    const session = this.#getSessionForAddingItem()
    if (!session) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.selectSessionBeforeAction"))
      return
    }

    const rates = this.#getEffectiveRatesForSession(session)
    const sellerData = prepareSellerItemDropData(this.actor, droppedItem, { buyPercent: rates.itemBuyPercent })
    const dialogData = await this.#openSellerItemDialog({
      ...sellerData,
      availableQuantity: sellerData.availableQuantity
    })
    if (!dialogData) return

    const requestedTotal =
      dialogData.quantity +
      this.#getSessionSellerQuantity({
        sourceUuid: sellerData.sourceUuid,
        sourceId: sellerData.sourceId,
        unitPriceValue: dialogData.unitPriceValue,
        priceCurrency: dialogData.priceCurrency
      })

    if (
      Number.isFinite(sellerData.availableQuantity) &&
      sellerData.availableQuantity >= 0 &&
      requestedTotal > sellerData.availableQuantity
    ) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.notEnoughSellerItemQuantity"))
      return
    }

    const referenceUnitPriceValue = Number(sellerData.unitPriceValue ?? 0)
    const proposedUnitPriceValue = Number(dialogData.unitPriceValue)
    const priceWasChanged = Math.abs(proposedUnitPriceValue - referenceUnitPriceValue) > 0.0001

    if (priceWasChanged) {
      const negotiation = await this.#addSessionNegotiation(
        this.#createNegotiation({
          side: "seller",
          type: "item",
          sourceKind: sellerData.sourceKind,
          sourceUuid: sellerData.sourceUuid,
          sourceActorUuid: sellerData.sourceActorUuid,
          sourceId: sellerData.sourceId,
          name: sellerData.name,
          img: sellerData.img,
          quantity: dialogData.quantity,
          unitPriceValue: dialogData.unitPriceValue,
          priceCurrency: dialogData.priceCurrency,
          referenceUnitPriceValue
        })
      )
      if (!negotiation) return

      this.render()
      return
    }

    const sessionItem = await this.#addSessionSellerItem({
      ...sellerData,
      quantity: dialogData.quantity,
      unitPriceValue: dialogData.unitPriceValue,
      priceCurrency: dialogData.priceCurrency
    })
    if (!sessionItem) return

    this.render()
  }

  // ─── Client drag/drop and context menu ───────────────────────────────────

  #onClientDragOver(event) {
    if (!this.#canModifyAccessRail({ notify: false })) return

    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }

  async #onClientDrop(event) {
    event.preventDefault()
    event.stopPropagation()

    const actor = await this.#getDroppedActorDocument(event)
    if (!actor) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.onlyActorsCanBeClients"))
      return
    }

    if (!this.#canModifyAccessRail()) return

    await this.#upsertAccessClient(buildAccessClientFromActor(actor, { isAuthorized: true }))
    this.render()
  }

  async #onClientContextMenu(event, target) {
    event.preventDefault()
    event.stopPropagation()

    if (!this.isEditable) return

    const client = this.#getAccessClientCandidate(target.dataset.clientActorUuid)
    if (!client) return

    this.#openClientContextMenu(event, client)
  }

  #openClientContextMenu(event, client) {
    const applicationElement = this.#getApplicationElement()
    if (!applicationElement) return

    this.#closeAccessContextMenu()

    const menu = document.createElement("nav")
    menu.classList.add("mtt-merchant-access-context-menu")
    menu.style.left = `${event.clientX}px`
    menu.style.top = `${event.clientY}px`
    menu.setAttribute("aria-label", game.i18n.localize("mtt.access.contextTitle"))

    const openActor = document.createElement("button")
    openActor.type = "button"
    openActor.classList.add("mtt-merchant-access-context-menu-button")
    const openActorIcon = document.createElement("i")
    openActorIcon.classList.add("fa-solid", "fa-user")
    const openActorLabel = document.createElement("span")
    openActorLabel.textContent = game.i18n.localize("mtt.access.openActor")
    openActor.append(openActorIcon, openActorLabel)
    openActor.addEventListener("click", async () => {
      this.#closeAccessContextMenu()
      await this.#openAccessClientActor(client)
    })

    const removeAuthorization = document.createElement("button")
    removeAuthorization.type = "button"
    removeAuthorization.classList.add("mtt-merchant-access-context-menu-button")
    const removeAuthorizationIcon = document.createElement("i")
    removeAuthorizationIcon.classList.add("fas", "fa-user-slash")
    const removeAuthorizationLabel = document.createElement("span")
    removeAuthorizationLabel.textContent = game.i18n.localize("mtt.access.removeAuthorization")
    removeAuthorization.append(removeAuthorizationIcon, removeAuthorizationLabel)
    removeAuthorization.addEventListener("click", async () => {
      this.#closeAccessContextMenu()
      await this.#removeClientAuthorization(client)
    })

    const customRates = document.createElement("button")
    customRates.type = "button"
    customRates.classList.add("mtt-merchant-access-context-menu-button")
    const customRatesIcon = document.createElement("i")
    customRatesIcon.classList.add("fas", "fa-percent")
    const customRatesLabel = document.createElement("span")
    customRatesLabel.textContent = game.i18n.localize("mtt.clientRates.menu")
    customRates.append(customRatesIcon, customRatesLabel)
    customRates.addEventListener("click", async () => {
      this.#closeAccessContextMenu()
      await this.#editClientCustomRates(client)
    })

    let resetCustomRates = null
    if (client.hasCustomRates) {
      resetCustomRates = document.createElement("button")
      resetCustomRates.type = "button"
      resetCustomRates.classList.add("mtt-merchant-access-context-menu-button")
      const resetCustomRatesIcon = document.createElement("i")
      resetCustomRatesIcon.classList.add("fas", "fa-rotate-left")
      const resetCustomRatesLabel = document.createElement("span")
      resetCustomRatesLabel.textContent = game.i18n.localize("mtt.clientRates.reset")
      resetCustomRates.append(resetCustomRatesIcon, resetCustomRatesLabel)
      resetCustomRates.addEventListener("click", async () => {
        this.#closeAccessContextMenu()
        await this.#resetClientCustomRates(client)
      })
    }

    const removeActor = document.createElement("button")
    removeActor.type = "button"
    removeActor.classList.add("mtt-merchant-access-context-menu-button")
    const removeActorIcon = document.createElement("i")
    removeActorIcon.classList.add("fas", "fa-trash")
    const removeActorLabel = document.createElement("span")
    removeActorLabel.textContent = game.i18n.localize("mtt.access.removeActor")
    removeActor.append(removeActorIcon, removeActorLabel)
    removeActor.addEventListener("click", async () => {
      this.#closeAccessContextMenu()
      await this.#removeAccessClient(client)
    })

    menu.append(openActor)
    if (!this.#isStorageEntity()) {
      menu.append(customRates)
      if (resetCustomRates) menu.append(resetCustomRates)
    }
    menu.append(removeAuthorization, removeActor)
    applicationElement.append(menu)

    window.setTimeout(() => {
      const closeMenu = (closeEvent) => {
        if (!menu.contains(closeEvent.target)) this.#closeAccessContextMenu()
        document.removeEventListener("click", closeMenu, true)
      }
      document.addEventListener("click", closeMenu, true)
    }, 0)
  }

  #closeAccessContextMenu() {
    const applicationElement = this.#getApplicationElement()
    applicationElement?.querySelectorAll(".mtt-merchant-access-context-menu").forEach((menu) => menu.remove())
  }

  async #onCatalogItemContextMenu(event, target) {
    event.preventDefault()
    event.stopPropagation()

    if (!this.isEditable) return

    const catalogItem = this.#getCatalogContextItem(target)
    if (!catalogItem) return

    this.#openCatalogItemContextMenu(event, catalogItem)
  }

  #getCatalogContextItem(target) {
    const kind = target.dataset.catalogKind ?? ""

    if (kind === "product") {
      const product = this.#getProductFromEvent(target)
      if (!product) return null

      return {
        kind,
        name: product.name,
        hasSecrets: productHasSecretInfo(product),
        requiresApproval: Boolean(product.requiresApproval),
        isObserverOwnership: product.ownershipLevel === CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
        isBlocked: Boolean(product.isBlocked),
        hasWarningGM: Boolean(product.hasWarningGM),
        productId: product.id,
        data: product
      }
    }

    if (kind === "service") {
      const service = this.#getServiceFromEvent(target)
      if (!service) return null

      return {
        kind,
        name: service.name,
        hasSecrets: productHasSecretInfo(service),
        requiresApproval: Boolean(service.requiresApproval),
        serviceId: service.id,
        data: service
      }
    }

    if (kind === "category") {
      const categoryValue = target.closest("[data-category]")?.dataset.category ?? ""
      return { kind, categoryValue }
    }

    return null
  }

  #openCatalogItemContextMenu(event, catalogItem) {
    const applicationElement = this.#getApplicationElement()
    if (!applicationElement) return

    this.#closeAccessContextMenu()

    const menu = document.createElement("nav")
    menu.classList.add("mtt-merchant-access-context-menu", "mtt-merchant-catalog-context-menu")
    menu.style.left = `${event.clientX}px`
    menu.style.top = `${event.clientY}px`
    menu.setAttribute("aria-label", game.i18n.localize("mtt.catalog.context.title"))

    const isStorage = this.#isStorageEntity()

    if (catalogItem.kind === "category") {
      const setLimited = this.#createCatalogContextButton({
        icon: "fa-file-slash",
        label: game.i18n.localize("mtt.catalog.context.categorySetProductsLimited"),
        onClick: async () => this.#setCategoryProductsOwnership(catalogItem, CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED)
      })
      const setObserver = this.#createCatalogContextButton({
        icon: "fa-file-plus",
        label: game.i18n.localize("mtt.catalog.context.categorySetProductsObserver"),
        onClick: async () => this.#setCategoryProductsOwnership(catalogItem, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)
      })
      menu.append(setLimited, setObserver)

      if (isStorage) {
        const setWarningGM = this.#createCatalogContextButton({
          icon: "fa-triangle-exclamation",
          label: game.i18n.localize("mtt.catalog.context.categorySetWarningGM"),
          onClick: async () => this.#setCategoryItemsWarningGM(catalogItem, true)
        })
        const removeWarningGM = this.#createCatalogContextButton({
          icon: "fa-triangle-exclamation",
          label: game.i18n.localize("mtt.catalog.context.categoryRemoveWarningGM"),
          onClick: async () => this.#setCategoryItemsWarningGM(catalogItem, false)
        })
        const setBlocked = this.#createCatalogContextButton({
          icon: "fa-lock",
          label: game.i18n.localize("mtt.catalog.context.categorySetBlocked"),
          onClick: async () => this.#setCategoryItemsBlocked(catalogItem, true)
        })
        const removeBlocked = this.#createCatalogContextButton({
          icon: "fa-lock-open",
          label: game.i18n.localize("mtt.catalog.context.categoryRemoveBlocked"),
          onClick: async () => this.#setCategoryItemsBlocked(catalogItem, false)
        })
        menu.append(setWarningGM, removeWarningGM, setBlocked, removeBlocked)
      } else {
        const requireApproval = this.#createCatalogContextButton({
          icon: "fa-user-check",
          label: game.i18n.localize("mtt.catalog.context.categoryRequireApprovalForProducts"),
          onClick: async () => this.#setCategoryProductsApproval(catalogItem, true)
        })
        const removeApproval = this.#createCatalogContextButton({
          icon: "fa-user-minus",
          label: game.i18n.localize("mtt.catalog.context.categoryRemoveApprovalForProducts"),
          onClick: async () => this.#setCategoryProductsApproval(catalogItem, false)
        })
        menu.append(requireApproval, removeApproval)
      }

      applicationElement.append(menu)
      window.setTimeout(() => {
        const closeMenu = (closeEvent) => {
          if (!menu.contains(closeEvent.target)) this.#closeAccessContextMenu()
          document.removeEventListener("click", closeMenu, true)
        }
        document.addEventListener("click", closeMenu, true)
      }, 0)
      return
    }

    if (isStorage) {
      if (catalogItem.kind === "product") {
        const warningGMLabel = catalogItem.hasWarningGM
          ? game.i18n.localize("mtt.catalog.context.removeWarningGM")
          : game.i18n.localize("mtt.catalog.context.setWarningGM")
        const warningGM = this.#createCatalogContextButton({
          icon: "fa-triangle-exclamation",
          label: warningGMLabel,
          onClick: async () => this.#toggleStorageItemWarningGM(catalogItem)
        })
        const blockedLabel = catalogItem.isBlocked
          ? game.i18n.localize("mtt.catalog.context.removeBlocked")
          : game.i18n.localize("mtt.catalog.context.setBlocked")
        const blocked = this.#createCatalogContextButton({
          icon: catalogItem.isBlocked ? "fa-lock-open" : "fa-lock",
          label: blockedLabel,
          onClick: async () => this.#toggleStorageItemBlocked(catalogItem)
        })
        const ownershipLabel = catalogItem.isObserverOwnership
          ? game.i18n.localize("mtt.catalog.context.switchToLimitedOwnership")
          : game.i18n.localize("mtt.catalog.context.switchToObserverOwnership")
        const ownership = this.#createCatalogContextButton({
          icon: catalogItem.isObserverOwnership ? "fa-file-slash" : "fa-file-plus",
          label: ownershipLabel,
          onClick: async () => this.#toggleCatalogProductOwnership(catalogItem)
        })
        menu.append(warningGM, blocked, ownership)
      }
    } else {
      const secretInfo = this.#createCatalogContextButton({
        icon: "fa-mask",
        label: game.i18n.localize("mtt.catalog.context.secretInfo"),
        onClick: async () => this.#editCatalogItemSecrets(catalogItem)
      })
      menu.append(secretInfo)

      if (catalogItem.hasSecrets) {
        const deleteSecrets = this.#createCatalogContextButton({
          icon: "fa-eraser",
          label: game.i18n.localize("mtt.catalog.context.deleteSecretInfo"),
          onClick: async () => this.#deleteCatalogItemSecrets(catalogItem)
        })
        menu.append(deleteSecrets)
      }

      const approvalLabel = catalogItem.requiresApproval
        ? game.i18n.localize("mtt.catalog.context.removeApproval")
        : game.i18n.localize("mtt.catalog.context.requestApproval")
      const approval = this.#createCatalogContextButton({
        icon: catalogItem.requiresApproval ? "fa-user-minus" : "fa-user-check",
        label: approvalLabel,
        onClick: async () => this.#toggleCatalogItemApproval(catalogItem)
      })
      menu.append(approval)

      if (catalogItem.kind === "product") {
        const ownershipLabel = catalogItem.isObserverOwnership
          ? game.i18n.localize("mtt.catalog.context.switchToLimitedOwnership")
          : game.i18n.localize("mtt.catalog.context.switchToObserverOwnership")
        const ownership = this.#createCatalogContextButton({
          icon: catalogItem.isObserverOwnership ? "fa-file-slash" : "fa-file-plus",
          label: ownershipLabel,
          onClick: async () => this.#toggleCatalogProductOwnership(catalogItem)
        })
        menu.append(ownership)
      }

      const copyLabel =
        catalogItem.kind === "product"
          ? game.i18n.localize("mtt.catalog.context.copyProduct")
          : game.i18n.localize("mtt.catalog.context.copyService")
      const copy = this.#createCatalogContextButton({
        icon: "fa-copy",
        label: copyLabel,
        onClick: async () => this.#copyCatalogItem(catalogItem)
      })
      menu.append(copy)
    }

    applicationElement.append(menu)

    window.setTimeout(() => {
      const closeMenu = (closeEvent) => {
        if (!menu.contains(closeEvent.target)) this.#closeAccessContextMenu()
        document.removeEventListener("click", closeMenu, true)
      }
      document.addEventListener("click", closeMenu, true)
    }, 0)
  }

  #createCatalogContextButton({ icon, label, onClick }) {
    const button = document.createElement("button")
    button.type = "button"
    button.classList.add("mtt-merchant-access-context-menu-button")

    const iconElement = document.createElement("i")
    iconElement.classList.add(
      "fas",
      ...String(icon ?? "")
        .split(" ")
        .filter(Boolean)
    )
    const labelElement = document.createElement("span")
    labelElement.textContent = label

    button.append(iconElement, labelElement)
    button.addEventListener("click", async () => {
      this.#closeAccessContextMenu()
      await onClick()
    })

    return button
  }

  async #editCatalogItemSecrets(catalogItem) {
    if (!this.isEditable) return

    const result = await openCatalogItemSecretsDialog({
      name: catalogItem.name,
      secretName: catalogItem.data.secretName ?? "",
      secretPrice: catalogItem.data.secretPrice ?? "",
      secretCurrency: this.#getCatalogItemSecretCurrency(catalogItem),
      secretDescription: catalogItem.data.secretDescription ?? ""
    })
    if (!result) return

    await this.#updateCatalogItemSecretData(catalogItem, result)
  }

  async #deleteCatalogItemSecrets(catalogItem) {
    if (!this.isEditable) return

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: game.i18n.localize("mtt.secrets.deleteTitle")
      },
      content: await this.#renderConfirmDialogContent({ message: game.i18n.localize("mtt.secrets.deleteConfirm") }),
      yes: {
        label: game.i18n.localize("mtt.actions.delete")
      },
      no: {
        label: game.i18n.localize("mtt.actions.cancel")
      }
    })
    if (!confirmed) return

    await this.#updateCatalogItemSecretData(catalogItem, {
      secretName: "",
      secretPrice: "",
      secretCurrency: "",
      secretDescription: ""
    })
  }

  #getCatalogItemSecretCurrency(catalogItem) {
    const configuredCurrency = String(catalogItem.data.secretCurrency ?? "").trim()
    if (configuredCurrency) return configuredCurrency

    const referenceCurrency = getReferenceCurrency()
    const referenceKey = String(referenceCurrency?.abbreviation ?? referenceCurrency?.id ?? "").trim()
    if (referenceKey) return referenceKey

    return String(catalogItem.data.priceCurrency ?? "").trim()
  }

  async #updateCatalogItemSecretData(catalogItem, secrets) {
    if (!this.isEditable) return

    if (catalogItem.kind === "product") {
      const hasSecrets = Boolean(
        secrets.secretName || secrets.secretPrice || secrets.secretCurrency || secrets.secretDescription
      )
      await updateCatalogProduct(this.actor, catalogItem.productId, {
        ...secrets,
        ...(hasSecrets ? { isCommerciallyModified: true } : {})
      })
      this.render()
      return
    }

    const entries = foundry.utils.deepClone(getMerchantData(this.actor)?.catalog?.services ?? [])
    const index = entries.findIndex((service) => service.id === catalogItem.serviceId)
    if (index === -1) return

    entries[index] = {
      ...entries[index],
      ...secrets,
      isCommerciallyModified: true
    }

    await updateMerchantData(this.actor, { catalog: { services: entries } })

    this.render()
  }

  async #toggleCatalogItemApproval(catalogItem) {
    if (!this.isEditable) return

    this.#saveScrollPositions()

    if (catalogItem.kind === "product") {
      this.#saveScrollPositions()
      await updateCatalogProduct(this.actor, catalogItem.productId, {
        requiresApproval: !catalogItem.requiresApproval
      })
      this.render()
      return
    }

    const entries = foundry.utils.deepClone(getMerchantData(this.actor)?.catalog?.services ?? [])
    const index = entries.findIndex((service) => service.id === catalogItem.serviceId)
    if (index === -1) return

    entries[index].requiresApproval = !catalogItem.requiresApproval

    await updateMerchantData(this.actor, { catalog: { services: entries } })

    this.render()
  }

  async #toggleCatalogProductOwnership(catalogItem) {
    if (!this.isEditable || catalogItem.kind !== "product") return

    const currentLevel = Number(catalogItem.data.ownershipLevel ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)
    const nextLevel =
      currentLevel === CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
        ? CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED
        : CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER

    this.#saveScrollPositions()
    await updateCatalogProduct(this.actor, catalogItem.productId, { ownershipLevel: nextLevel })
    this.render()
  }

  async #copyCatalogItem(catalogItem) {
    if (!this.isEditable) return

    this.#saveScrollPositions()

    if (catalogItem.kind === "product") {
      const result = await copyCatalogProduct(this.actor, catalogItem.productId)
      if (result) {
        ui.notifications.info(game.i18n.localize("mtt.notifications.productCopied"))
      } else {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.productCopyFailed"))
      }
      this.render()
      return
    }

    if (catalogItem.kind === "service") {
      const result = await copyCatalogService(this.actor, catalogItem.serviceId)
      if (result) {
        ui.notifications.info(game.i18n.localize("mtt.notifications.serviceCopied"))
      } else {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.serviceCopyFailed"))
      }
      this.render()
    }
  }

  async #setCategoryProductsOwnership(catalogItem, level) {
    if (!this.isEditable) return

    const products = getCatalogProducts(this.actor).filter((p) => p.category === catalogItem.categoryValue)
    if (!products.length) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.noProductsInCategory"))
      return
    }

    this.#saveScrollPositions()
    const updates = products.map((p) => ({
      _id: p.id,
      [`flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}.ownershipLevel`]: level
    }))
    await this.actor.updateEmbeddedDocuments("Item", updates)
    this.render()
  }

  async #setCategoryProductsApproval(catalogItem, requiresApproval) {
    if (!this.isEditable) return

    const products = getCatalogProducts(this.actor).filter((p) => p.category === catalogItem.categoryValue)
    if (!products.length) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.noProductsInCategory"))
      return
    }

    this.#saveScrollPositions()
    const updates = products.map((p) => ({
      _id: p.id,
      [`flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}.requiresApproval`]: requiresApproval
    }))
    await this.actor.updateEmbeddedDocuments("Item", updates)
    this.render()
  }

  // ─── Statuts stockage sur les items ──────────────────────────────────────

  async #toggleStorageItemWarningGM(catalogItem) {
    if (!this.isEditable || catalogItem.kind !== "product") return
    const item = this.actor.items.get(catalogItem.productId)
    if (!item) return
    this.#saveScrollPositions()
    await setStorageItemWarningGM(item, !catalogItem.hasWarningGM)
    this.render()
  }

  async #toggleStorageItemBlocked(catalogItem) {
    if (!this.isEditable || catalogItem.kind !== "product") return
    const item = this.actor.items.get(catalogItem.productId)
    if (!item) return
    this.#saveScrollPositions()
    await setStorageItemBlocked(item, !catalogItem.isBlocked)
    this.render()
  }

  async #setCategoryItemsWarningGM(catalogItem, warningGM) {
    if (!this.isEditable) return
    const products = getCatalogProducts(this.actor).filter((p) => p.category === catalogItem.categoryValue)
    if (!products.length) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.noProductsInCategory"))
      return
    }
    this.#saveScrollPositions()
    for (const product of products) {
      const item = this.actor.items.get(product.id)
      if (item) await setStorageItemWarningGM(item, warningGM)
    }
    this.render()
  }

  async #setCategoryItemsBlocked(catalogItem, blocked) {
    if (!this.isEditable) return
    const products = getCatalogProducts(this.actor).filter((p) => p.category === catalogItem.categoryValue)
    if (!products.length) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.noProductsInCategory"))
      return
    }
    this.#saveScrollPositions()
    for (const product of products) {
      const item = this.actor.items.get(product.id)
      if (item) await setStorageItemBlocked(item, blocked)
    }
    this.render()
  }

  // ─── Tags de vote rapides storage ────────────────────────────────────────

  static async #onToggleStorageTag(event, target) {
    event.preventDefault()

    if (!this.#isStorageEntity()) return

    const activeSession = this.#getActiveSession()
    if (!this.#canEditStorageTagsForSession(activeSession)) {
      ui.notifications.warn(game.i18n.localize("mtt.storage.tags.noEditableSession"))
      return
    }

    const voterActorUuid = String(activeSession.actorUuid ?? "").trim()
    if (!voterActorUuid) {
      ui.notifications.warn(game.i18n.localize("mtt.storage.tags.noActiveActor"))
      return
    }

    const productId =
      target.dataset.itemId ??
      target.closest("[data-product-id]")?.dataset.productId ??
      target.closest("[data-item-id]")?.dataset.itemId
    if (!productId) return

    const tagType = String(target.dataset.tagType ?? "").trim()
    if (!tagType) return

    const item = this.actor.items.get(productId)
    if (!item) return

    this.#saveScrollPositions()
    if (this.#canUserManageCurrentSheet()) {
      const updatedTags = await toggleStorageItemTag(item, voterActorUuid, tagType)
      if (updatedTags) {
        item.updateSource?.({ [`flags.${MTT.ID}.${MTT.FLAGS.STORAGE}.tags`]: updatedTags })
        await applyStorageIgnoreAutoCategory(this.actor, item, {
          sessions: this.#getSessions(),
          activeSessionActorUuid: voterActorUuid
        })
        this.render()
      }
      return
    }

    try {
      const response = await requestStorageTagUpdate(this.actor, {
        itemId: productId,
        sessionId: activeSession.id,
        voterActorUuid,
        tagType
      })
      if (response?.ok && response.itemId && response.updatedTags) {
        const updatedItem = this.actor.items.get(response.itemId)
        updatedItem?.updateSource?.({ [`flags.${MTT.ID}.${MTT.FLAGS.STORAGE}.tags`]: response.updatedTags })
        this.render()
      }
    } catch (error) {
      ui.notifications.warn(error?.message ?? game.i18n.localize("mtt.notifications.sessionSocketRequestDenied"))
    }
  }

  static async #onToggleStorageTradeResponsibleActor(event, target) {
    event.preventDefault()

    if (!this.#isStorageEntity()) return
    if (!this.isEditable) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.permissionDenied"))
      return
    }

    const actorUuid = String(target.dataset.actorUuid ?? "").trim()
    if (!actorUuid) return

    const current = getStorageTradeResponsibleActorUuids(this.actor)
    const next = current.includes(actorUuid) ? current.filter((uuid) => uuid !== actorUuid) : [...current, actorUuid]

    await setStorageTradeResponsibleActorUuids(this.actor, next)
    this.render()
  }

  // ─── Dropped document helpers ─────────────────────────────────────────────

  async #getDroppedActorDocument(event) {
    const dragData = foundry.applications.ux.TextEditor.implementation.getDragEventData(event)
    if (!dragData) return null

    try {
      if (dragData.uuid) {
        const document = await fromUuid(dragData.uuid)
        return document?.documentName === "Actor" ? document : null
      }

      if (dragData.pack && dragData.id) {
        const pack = game.packs.get(dragData.pack)
        const document = pack ? await pack.getDocument(dragData.id) : null
        return document?.documentName === "Actor" ? document : null
      }

      if (dragData.type === "Actor" && dragData.id) {
        const document = game.actors.get(dragData.id) ?? null
        return document?.documentName === "Actor" ? document : null
      }
    } catch {
      return null
    }

    return null
  }

  async #getDroppedItemDocument(event) {
    try {
      // MTT base — logique commune de résolution des sources Item classiques et produits MTT.
      const rawJson = event.dataTransfer?.getData("application/json")
      const payload = rawJson ? JSON.parse(rawJson) : null
      if (payload?.type === "mtt.product") {
        const sourceActor = payload.actorUuid ? await fromUuid(payload.actorUuid) : null
        if (sourceActor?.documentName !== "Actor") return null

        const itemId = String(payload.itemId ?? payload.productId ?? payload.sourceId ?? payload.id ?? "").trim()
        const item = itemId ? (sourceActor.items?.get(itemId) ?? null) : null
        if (item?.documentName !== "Item") return null

        const product = getCatalogProduct(sourceActor, item.id)
        if (!product && !item.getFlag?.(MTT.ID, MTT.FLAGS.PRODUCT)?.enabled) return null

        return {
          kind: "mttProduct",
          item,
          sourceActor,
          product
        }
      }
    } catch {
      // Ne pas bloquer les drops Foundry classiques si le JSON MTT est absent ou invalide.
    }

    const dragData = foundry.applications.ux.TextEditor.implementation.getDragEventData(event)
    if (!dragData) return null

    try {
      if (dragData.uuid) {
        const document = await fromUuid(dragData.uuid)
        return document?.documentName === "Item"
          ? {
              kind: "actorItem",
              item: document,
              sourceActor: document.parent?.documentName === "Actor" ? document.parent : null,
              product: null
            }
          : null
      }

      if (dragData.pack && dragData.id) {
        const pack = game.packs.get(dragData.pack)
        const document = pack ? await pack.getDocument(dragData.id) : null
        return document?.documentName === "Item"
          ? {
              kind: "actorItem",
              item: document,
              sourceActor: document.parent?.documentName === "Actor" ? document.parent : null,
              product: null
            }
          : null
      }

      if (dragData.type === "Item" && dragData.id) {
        const document = game.items.get(dragData.id) ?? null
        return document?.documentName === "Item"
          ? {
              kind: "actorItem",
              item: document,
              sourceActor: document.parent?.documentName === "Actor" ? document.parent : null,
              product: null
            }
          : null
      }
    } catch {
      return null
    }

    return null
  }

  // ─── Category CRUD ────────────────────────────────────────────────────────

  async #onCategoryNameChange(event) {
    if (!this.#canModifyMerchant()) return

    const target = event.currentTarget
    const categoryId = target.dataset.categoryId
    const categoryName = target.value?.trim()

    if (!categoryId) return

    const categories = foundry.utils.deepClone(getMerchantData(this.actor)?.catalog?.productCategories ?? [])
    const index = categories.findIndex((category) => category.id === categoryId)
    if (index === -1) return

    if (!categoryName) {
      target.value = categories[index].name
      return
    }

    categories[index] = {
      ...categories[index],
      name: categoryName
    }

    await updateMerchantData(this.actor, { catalog: { productCategories: categories } }, { render: false })
  }

  static async #onToggleProductCategory(event, target) {
    event.preventDefault()

    const categoryValue = target.dataset.category ?? ""
    const isCollapsed = this.#localProductCategoryCollapseState.get(categoryValue) === true
    this.#localProductCategoryCollapseState.set(categoryValue, !isCollapsed)

    this.#saveScrollPositions()
    this.render()
  }

  static async #onCreateProductCategory(event, _target) {
    event.preventDefault()

    if (!this.#canModifyMerchant()) return

    const categories = foundry.utils.deepClone(getMerchantData(this.actor)?.catalog?.productCategories ?? [])
    categories.push(
      createLocalMerchantCategory({
        name: game.i18n.localize("mtt.products.category.new")
      })
    )

    this.#saveScrollPositions()
    await updateMerchantData(this.actor, { catalog: { productCategories: categories } })

    this.render()
  }

  static async #onDeleteProductCategory(event, target) {
    event.preventDefault()

    if (!this.#canModifyMerchant()) return

    const categoryId = target.dataset.categoryId
    if (!categoryId) return

    const categories = foundry.utils.deepClone(getMerchantData(this.actor)?.catalog?.productCategories ?? [])
    const category = categories.find((item) => item.id === categoryId)
    if (!category) return

    const itemsInCategory = getCatalogProducts(this.actor).filter((product) => product.category === categoryId)

    if (itemsInCategory.length > 0) {
      ui.notifications.warn(game.i18n.localize("mtt.products.category.notEmpty"))
      return
    }

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: game.i18n.localize("mtt.products.category.deleteTitle")
      },
      content: await this.#renderConfirmDialogContent({
        message: game.i18n.localize("mtt.products.category.deleteContent")
      }),
      yes: {
        label: game.i18n.localize("mtt.actions.delete")
      },
      no: {
        label: game.i18n.localize("mtt.actions.cancel")
      }
    })

    if (!confirmed) return

    const updatedCategories = categories.filter((item) => item.id !== categoryId)
    const merchantCatalog = getMerchantData(this.actor)?.catalog
    const collapsedCategories = foundry.utils.deepClone(merchantCatalog?.collapsedCategories ?? {})
    const hiddenCategories = foundry.utils.deepClone(merchantCatalog?.hiddenCategories ?? {})
    delete collapsedCategories[categoryId]
    delete hiddenCategories[categoryId]

    this.#saveScrollPositions()
    await updateMerchantData(this.actor, {
      catalog: { productCategories: updatedCategories, collapsedCategories, hiddenCategories }
    })

    this.render()
  }

  static async #onToggleProductCategoryVisibility(event, target) {
    event.preventDefault()

    if (!this.isEditable) return

    const categoryValue = target.dataset.categoryId ?? ""
    const isSystemCategory = target.dataset.systemCategory === "true"
    const merchantCatalog = getMerchantData(this.actor)?.catalog
    const categories = merchantCatalog?.productCategories ?? []
    const categoryExists = isSystemCategory || categories.some((category) => category.id === categoryValue)
    if (!categoryExists) return

    const hiddenCategories = foundry.utils.deepClone(merchantCatalog?.hiddenCategories ?? {})
    hiddenCategories[categoryValue] = !hiddenCategories[categoryValue]

    this.#saveScrollPositions()
    await updateMerchantData(this.actor, { catalog: { hiddenCategories } })

    this.render()
  }

  // ─── Access context ───────────────────────────────────────────────────────

  #getClientActor(actorUuid) {
    const normalizedUuid = String(actorUuid ?? "").trim()
    if (!normalizedUuid) return null

    return game.actors.find((actor) => actor.uuid === normalizedUuid) ?? null
  }

  #userControlsActor(actorUuid) {
    if (game.user.isGM) return true
    const normalizedUuid = String(actorUuid ?? "").trim()
    if (!normalizedUuid) return false
    if (game.user.character?.uuid === normalizedUuid) return true
    const actor = this.#getClientActor(normalizedUuid)
    if (!actor) return false
    return actor.testUserPermission(game.user, "OWNER")
  }

  #isStorageEntity() {
    return getMTTEntityType(this.actor) === MTT.ENTITY_TYPES.STORAGE
  }

  #normalizeStorageAccessActor(entry = {}) {
    const normalized = normalizeAccessClient({
      ...entry,
      isAuthorized: entry.isAuthorized ?? true
    })
    if (!normalized.actorUuid) return null

    const actor = this.#getClientActor(normalized.actorUuid)
    if (!actor) return normalized

    return normalizeAccessClient({
      ...normalized,
      actorId: actor.id ?? normalized.actorId,
      actorName: actor.name ?? normalized.actorName,
      actorImg: actor.img ?? normalized.actorImg,
      actorType: actor.type ?? normalized.actorType
    })
  }

  #getStoredStorageAccessActors() {
    const actors = getStorageData(this.actor)?.access?.actors ?? []
    const actorsByUuid = new Map()

    actors.forEach((entry) => {
      const normalized = this.#normalizeStorageAccessActor(entry)
      if (!normalized?.actorUuid) return
      actorsByUuid.set(normalized.actorUuid, normalized)
    })

    return Array.from(actorsByUuid.values())
  }

  #getAccessEntries() {
    // MTT base — adapte uniquement le chemin de données du rail commun
    if (this.#isStorageEntity()) return this.#getStoredStorageAccessActors()
    return getStoredAccessClients(this.actor)
  }

  async #setAccessEntries(entries, changes = {}) {
    // MTT base — écrit les entrées du rail commun dans le type MTT actif
    if (this.#isStorageEntity()) {
      await updateStorageData(this.actor, {
        ...changes,
        access: { actors: entries }
      })
      return
    }

    await updateMerchantData(this.actor, {
      ...changes,
      access: { clients: entries }
    })
  }

  #userCanViewSession(session) {
    if (!session) return false
    return this.#getSessionActorAccess(session).canViewOtherSession
  }

  #getPreferredPlayerSession(sessions) {
    const userCharacterUuid = game.user?.character?.uuid ?? ""

    if (userCharacterUuid) {
      const characterSession = sessions.find((session) => session.actorUuid === userCharacterUuid)
      if (characterSession && this.#userControlsActor(characterSession.actorUuid)) return characterSession
    }

    return sessions.find((session) => this.#userControlsActor(session.actorUuid)) ?? null
  }

  #prepareAccessContext() {
    const permissions = getMerchantPermissions(this.actor, { user: game.user })
    const isStorage = this.#isStorageEntity()
    const canSeeAccessDropZone = isStorage ? this.isEditable : permissions.canAddActorToMerchantRail

    const rawClients = this.#prepareAccessClients()
    const clients = rawClients
      .map((client) => {
        const clientActor = this.#getClientActor(client.actorUuid)
        const sessionActorAccess = this.#getSessionActorAccess(client.actorUuid)
        const isOwnClientCard = this.#userControlsActor(client.actorUuid)
        // MTT base — la permission "Voir les autres acteurs du rail" filtre les cards communes.
        const canSeeCard =
          this.#canUserManageCurrentSheet() || canUserViewClientActor(clientActor, permissions, game.user)
        const canClickCard =
          (client.hasSession && sessionActorAccess.canSelectOtherSession) ||
          (!client.hasSession && sessionActorAccess.canInteractWithOtherSession) ||
          (!client.isAuthorized && canSeeAccessDropZone)
        const cardClasses = [
          "mtt-merchant-access-card",
          client.isAuthorized ? "mtt-merchant-access-card-authorized" : "mtt-merchant-access-card-unauthorized",
          client.isSelected ? "mtt-merchant-access-card-selected" : null,
          !canClickCard ? "mtt-merchant-access-card-readonly" : null
        ]
          .filter(Boolean)
          .join(" ")
        const sessionBadgeClasses = client.hasSession
          ? `fas ${client.sessionBadgeIcon} mtt-merchant-access-session-badge mtt-merchant-access-session-${client.sessionStatus}`
          : ""
        return {
          ...client,
          ...sessionActorAccess,
          isOwnClientCard,
          canSeeCard,
          canClickCard,
          cardClasses,
          sessionBadgeClasses
        }
      })
      .filter((client) => client.canSeeCard)

    return {
      clients,
      hasClients: clients.length > 0,
      canSeeAccessDropZone,
      isStorage,
      railAriaLabel: game.i18n.localize("mtt.access.title"),
      dropZoneTooltip: game.i18n.localize("mtt.access.dropTooltip")
    }
  }

  #getAccessClientForSession(session) {
    const actorUuid = String(session?.actorUuid ?? "").trim()
    if (!actorUuid) return null

    const client = this.#prepareAccessClients().find((entry) => entry.actorUuid === actorUuid)
    if (client) return client

    return normalizeAccessClient({
      actorUuid,
      actorName: session.actorName ?? "",
      userId: session.userId ?? "",
      userName: session.userName ?? "",
      isAuthorized: false
    })
  }

  #getAccessClientCandidate(actorUuid) {
    const normalizedActorUuid = String(actorUuid ?? "").trim()
    if (!normalizedActorUuid) return null

    return this.#prepareAccessClients().find((client) => client.actorUuid === normalizedActorUuid) ?? null
  }

  async #upsertAccessClient(client) {
    const normalizedClient = normalizeAccessClient(client)
    if (!normalizedClient.actorUuid) return null

    const clients = this.#getAccessEntries()
    const index = clients.findIndex((entry) => entry.actorUuid === normalizedClient.actorUuid)

    if (index === -1) {
      clients.push(normalizedClient)
    } else {
      clients[index] = {
        ...clients[index],
        ...normalizedClient,
        isFromPlayerCharacter: clients[index].isFromPlayerCharacter || normalizedClient.isFromPlayerCharacter,
        customRates: normalizedClient.customRates ?? clients[index].customRates ?? null
      }
    }

    await this.#setAccessEntries(clients)

    return normalizedClient
  }

  #canModifyAccessRail({ notify = true } = {}) {
    if (this.#isStorageEntity()) {
      if (!this.isEditable) {
        if (notify) ui.notifications.warn(game.i18n.localize("mtt.notifications.permissionDenied"))
        return false
      }

      return true
    }

    return this.#requireMerchantPermission("canAddActorToMerchantRail", { notify })
  }

  async #setClientAuthorization(client, isAuthorized, { removeOpenSessions = false } = {}) {
    const normalizedClient = normalizeAccessClient({
      ...client,
      isAuthorized
    })
    if (!normalizedClient.actorUuid) return

    const clients = this.#getAccessEntries()
    const clientIndex = clients.findIndex((entry) => entry.actorUuid === normalizedClient.actorUuid)

    if (clientIndex === -1) {
      clients.push(normalizedClient)
    } else {
      clients[clientIndex] = {
        ...clients[clientIndex],
        ...normalizedClient,
        customRates: normalizedClient.customRates ?? clients[clientIndex].customRates ?? null
      }
    }

    const changes = { access: { clients } }

    if (removeOpenSessions) {
      const removedSessionIds = new Set(
        this.#getSessions()
          .filter((session) => session.actorUuid === normalizedClient.actorUuid)
          .map((session) => session.id)
      )
      changes.sessions = { entries: this.#getSessions().filter((session) => !removedSessionIds.has(session.id)) }
      if (removedSessionIds.has(this.#activeSessionId)) this.#activeSessionId = null
      if (this.#selectedClientActorUuid === normalizedClient.actorUuid) this.#selectedClientActorUuid = ""
      this.#sessionCheckResult = null
    }

    await this.#setAccessEntries(clients, changes)
  }

  async #removeClientAuthorization(client) {
    const openSessions = this.#getSessions().filter((session) => session.actorUuid === client.actorUuid)
    let removeOpenSessions = false

    if (openSessions.length > 0) {
      const content = await this.#renderMttDialogContent({
        icon: "fa-user-slash",
        title: game.i18n.localize("mtt.dialog.removeAuthorizationTitle"),
        message: game.i18n.localize("mtt.dialog.removeAuthorizationMessage"),
        details: game.i18n.localize("mtt.dialog.noTransactionNoJournal"),
        variant: "warning",
        entity: {
          name: client.actorName,
          img: client.actorImg,
          meta: client.userName || client.sourceLabel || ""
        }
      })
      const confirmed = await foundry.applications.api.DialogV2.confirm({
        window: {
          title: game.i18n.localize("mtt.dialog.removeAuthorizationTitle")
        },
        content,
        yes: {
          label: game.i18n.localize("mtt.dialog.removeAuthorizationConfirm")
        },
        no: {
          label: game.i18n.localize("mtt.dialog.cancel")
        }
      })

      if (!confirmed) return false
      removeOpenSessions = true
    }

    await this.#setClientAuthorization(client, false, { removeOpenSessions })
    this.render()
    return true
  }

  async #openAccessClientActor(client) {
    const actorUuid = String(client?.actorUuid ?? "").trim()
    if (!actorUuid) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.actorNotFound"))
      return null
    }

    let actor = null
    try {
      actor = await fromUuid(actorUuid)
    } catch {
      // UUID périmé — boutique importée depuis un compendium
    }
    if (actor?.documentName !== "Actor") {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.actorNotFound"))
      return null
    }

    actor.sheet?.render(true)
    return actor
  }

  async #removeAccessClient(client) {
    const openSessions = this.#getSessions().filter((session) => session.actorUuid === client.actorUuid)
    const content = await this.#renderMttDialogContent({
      icon: "fa-trash",
      title: game.i18n.localize("mtt.dialog.removeActorTitle"),
      message: game.i18n.localize("mtt.dialog.removeActorMessage"),
      details: openSessions.length > 0 ? game.i18n.localize("mtt.dialog.noTransactionNoJournal") : "",
      variant: "danger",
      entity: {
        name: client.actorName,
        img: client.actorImg,
        meta: client.userName || client.sourceLabel || ""
      }
    })
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: game.i18n.localize("mtt.dialog.removeActorTitle")
      },
      content,
      yes: {
        label: game.i18n.localize("mtt.dialog.removeActorConfirm")
      },
      no: {
        label: game.i18n.localize("mtt.dialog.cancel")
      }
    })

    if (!confirmed) return false

    const removedActorUuid = String(client.actorUuid ?? "").trim()
    const clients = this.#getAccessEntries().filter((entry) => entry.actorUuid !== removedActorUuid)
    const removedSessionIds = new Set(openSessions.map((session) => session.id))
    const sessions = this.#getSessions().filter((session) => !removedSessionIds.has(session.id))
    if (removedSessionIds.has(this.#activeSessionId)) this.#activeSessionId = null
    if (this.#selectedClientActorUuid === removedActorUuid) this.#selectedClientActorUuid = ""
    this.#sessionCheckResult = null

    const changes = {
      sessions: { entries: sessions }
    }

    if (this.#isStorageEntity()) {
      changes.tradeWithMerchant = {
        responsibleActorUuids: getStorageTradeResponsibleActorUuids(this.actor).filter(
          (actorUuid) => actorUuid !== removedActorUuid
        )
      }
    }

    await this.#setAccessEntries(clients, changes)

    this.render()
    return true
  }

  // ─── Session state management ─────────────────────────────────────────────

  async #editClientCustomRates(client) {
    const defaults = getMerchantDefaultClientRates(this.actor)
    const existingRates = normalizeClientCustomRates(client.customRates, defaults) ?? defaults
    const result = await openClientRatesDialog({
      clientName: client.actorName,
      rates: existingRates
    })
    if (!result) return false

    const customRates = normalizeClientCustomRates(result, defaults) ?? defaults
    await this.#setClientCustomRates(client, customRates)
    return true
  }

  async #resetClientCustomRates(client) {
    await this.#setClientCustomRates(client, null)
    return true
  }

  async #setClientCustomRates(client, customRates) {
    const normalizedActorUuid = String(client?.actorUuid ?? "").trim()
    if (!normalizedActorUuid) return

    const clients = getStoredAccessClients(this.actor)
    const clientIndex = clients.findIndex((entry) => entry.actorUuid === normalizedActorUuid)
    if (clientIndex === -1) return

    clients[clientIndex] = normalizeAccessClient({
      ...clients[clientIndex],
      customRates
    })

    await updateMerchantData(this.actor, { access: { clients } })
    this.render()
  }

  #getSelectedSession() {
    if (!this.#activeSessionId) return null

    const session = this.#getSessions().find((entry) => entry.id === this.#activeSessionId)
    if (!session) {
      this.#activeSessionId = null
      return null
    }

    if (!this.#getSessionActorAccess(session).canSelectOtherSession) {
      this.#activeSessionId = null
      this.#selectedClientActorUuid = ""
      return null
    }

    return normalizeSession(session)
  }

  #getSelectedClient() {
    if (!this.#selectedClientActorUuid) return null

    return this.#getAccessClientCandidate(this.#selectedClientActorUuid)
  }

  #selectSession(sessionId) {
    const session = this.#getSessions().find((entry) => entry.id === sessionId)
    if (!session) {
      this.#activeSessionId = null
      return null
    }

    if (!this.#getSessionActorAccess(session).canSelectOtherSession) {
      this.#activeSessionId = null
      this.#selectedClientActorUuid = ""
      ui.notifications.warn(game.i18n.localize("mtt.notifications.permissionDenied"))
      return null
    }

    this.#activeSessionId = session.id
    this.#selectedClientActorUuid = session.actorUuid ?? ""
    this.#sessionCheckResult = null
    return normalizeSession(session)
  }

  #getActiveSession() {
    const sessions = this.#getSessions()

    if (this.#activeSessionId) {
      const selectedSession = sessions.find((s) => s.id === this.#activeSessionId)
      if (selectedSession && this.#userCanViewSession(selectedSession)) return normalizeSession(selectedSession)
      this.#activeSessionId = null
      this.#selectedClientActorUuid = ""
    }

    if (this.#selectedClientActorUuid) {
      const selectedClientSession = sessions.find((session) => session.actorUuid === this.#selectedClientActorUuid)
      if (selectedClientSession && this.#userCanViewSession(selectedClientSession)) {
        return this.#selectSession(selectedClientSession.id)
      }

      if (!this.isEditable) this.#selectedClientActorUuid = ""
      if (this.isEditable) return null
    }

    if (!this.isEditable) {
      const preferredSession = this.#getPreferredPlayerSession(sessions)
      if (preferredSession) {
        return this.#selectSession(preferredSession.id)
      }

      this.#activeSessionId = null
      this.#selectedClientActorUuid = ""
      return null
    }

    const visibleSessions = sessions.filter((session) => this.#getSessionActorAccess(session).canSelectOtherSession)
    const activeSession = visibleSessions.find((s) => s.status === "active")
    if (activeSession) {
      this.#activeSessionId = activeSession.id
      this.#selectedClientActorUuid = activeSession.actorUuid ?? ""
      return normalizeSession(activeSession)
    }

    const firstSession = visibleSessions[0]
    if (firstSession) {
      this.#activeSessionId = firstSession.id
      this.#selectedClientActorUuid = firstSession.actorUuid ?? ""
      return normalizeSession(firstSession)
    }

    return null
  }

  async #getOrCreateActiveSession() {
    if (this.#isStorageEntity()) return this.#getOrCreateStorageSessionForAddingItem()
    return this.#getSessionForAddingItem()
  }

  async #getOrCreateStorageSessionForAddingItem() {
    const selectedSession = this.#getSelectedSession()
    if (selectedSession) {
      if (!this.#canInteractWithSession(selectedSession)) return null
      return selectedSession
    }

    const client = this.#getSelectedClient()
    if (!client?.actorUuid) {
      ui.notifications.warn(game.i18n.localize("mtt.storage.session.selectActorBeforeAdding"))
      return null
    }
    if (!this.#getSessionActorAccess(client.actorUuid).canInteractWithOtherSession) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.permissionDenied"))
      return null
    }

    return this.#createSessionForClient({
      ...client,
      isAuthorized: true
    })
  }

  #getSessionForAddingItem() {
    const selectedSession = this.#getSelectedSession()
    if (selectedSession) {
      if (!this.#canInteractWithSession(selectedSession)) return null
      const client = this.#getAccessClientForSession(selectedSession)
      if (selectedSession.actorUuid && !client?.isAuthorized) {
        ui.notifications.warn(game.i18n.localize("mtt.access.notAuthorizedForTrade"))
        return null
      }

      return selectedSession
    }

    if (this.#selectedClientActorUuid) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.selectClientBeforeAdding"))
      return null
    }

    ui.notifications.warn(game.i18n.localize("mtt.notifications.selectClientBeforeAdding"))
    return null
  }

  #requireSelectedSessionForItemAddition() {
    return Boolean(this.#getSessionForAddingItem())
  }

  #getBestSessionForClientActor(actorUuid) {
    const normalizedActorUuid = String(actorUuid ?? "").trim()
    if (!normalizedActorUuid) return null

    let sessions = this.#getSessions()
      .filter((session) => session.actorUuid === normalizedActorUuid)
      .map((session) => normalizeSession(session))
    if (sessions.length === 0) return null

    const statusOrder = ["active", "pending", "submitted"]
    sessions = sessions.filter((session) => statusOrder.includes(session.status))
    if (sessions.length === 0) return null

    sessions.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status))
    return sessions[0]
  }

  // ─── Session quantity helpers ─────────────────────────────────────────────

  #getEffectiveRatesForSession(session = this.#getSessionForAddingItem()) {
    return getEffectiveClientRates(this.actor, session?.actorUuid ?? "")
  }

  #buildReferenceState() {
    const merchantData = getMerchantData(this.actor)
    const catalog = merchantData?.catalog ?? {}

    return {
      savedAt: new Date().toISOString(),
      catalog: {
        products: getCatalogProducts(this.actor),
        services: foundry.utils.deepClone(catalog.services ?? []),
        productCategories: foundry.utils.deepClone(catalog.productCategories ?? []),
        keepEmptyItems: catalog.keepEmptyItems !== false,
        collapsedCategories: foundry.utils.deepClone(catalog.collapsedCategories ?? {}),
        hiddenCategories: foundry.utils.deepClone(catalog.hiddenCategories ?? {})
      }
    }
  }

  async #saveReferenceState() {
    if (!this.#canModifyMerchant()) return

    await this.#saveMerchantTextFieldsFromDom()
    await updateMerchantData(this.actor, { referenceState: this.#buildReferenceState() })
    ui.notifications.info(game.i18n.localize("mtt.referenceState.saveSuccess"))
    this.render()
  }

  async #restoreReferenceState() {
    if (!this.#canModifyMerchant()) return

    const referenceState = getMerchantData(this.actor)?.referenceState
    if (!referenceState?.savedAt) {
      ui.notifications.warn(game.i18n.localize("mtt.referenceState.missing"))
      return
    }

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: game.i18n.localize("mtt.referenceState.confirmTitle")
      },
      content: await this.#renderConfirmDialogContent({
        message: game.i18n.localize("mtt.referenceState.confirmContent")
      }),
      yes: {
        label: game.i18n.localize("mtt.referenceState.confirmRestore")
      },
      no: {
        label: game.i18n.localize("mtt.referenceState.cancel")
      }
    })
    if (!confirmed) return

    await this.#applyReferenceState(referenceState)
    ui.notifications.info(game.i18n.localize("mtt.referenceState.restoreSuccess"))
    this.render()
  }

  async #applyReferenceState(referenceState) {
    const savedCatalog = referenceState.catalog
    if (!savedCatalog) return

    await replaceCatalogProducts(this.actor, savedCatalog.products ?? [])

    await updateMerchantData(this.actor, {
      catalog: {
        services: foundry.utils.deepClone(savedCatalog.services ?? []),
        productCategories: foundry.utils.deepClone(savedCatalog.productCategories ?? []),
        keepEmptyItems: savedCatalog.keepEmptyItems !== false,
        collapsedCategories: foundry.utils.deepClone(savedCatalog.collapsedCategories ?? {}),
        hiddenCategories: foundry.utils.deepClone(savedCatalog.hiddenCategories ?? {})
      }
    })
  }

  #getSessionBuyerQuantity({ type, sourceId, unitPriceValue, priceCurrency }) {
    const session = this.#getSelectedSession()
    if (!session) return 0

    const normalizedCurrency = String(priceCurrency ?? "").trim()

    return session.buyerItems.reduce((total, item) => {
      if (item.type !== type) return total
      if (item.sourceId !== sourceId) return total
      if (item.unitPriceValue !== unitPriceValue) return total
      if (item.priceCurrency !== normalizedCurrency) return total

      return total + item.quantity
    }, 0)
  }

  #getSessionSellerQuantity({ sourceUuid, sourceId, unitPriceValue, priceCurrency }) {
    const session = this.#getSelectedSession()
    if (!session) return 0

    const normalizedCurrency = String(priceCurrency ?? "").trim()
    const normalizedSourceUuid = String(sourceUuid ?? "").trim()
    const normalizedSourceId = String(sourceId ?? "").trim()

    return session.sellerItems.reduce((total, item) => {
      if (normalizedSourceUuid && item.sourceUuid !== normalizedSourceUuid) return total
      if (!normalizedSourceUuid && item.sourceId !== normalizedSourceId) return total
      if (item.unitPriceValue !== unitPriceValue) return total
      if (item.priceCurrency !== normalizedCurrency) return total

      return total + item.quantity
    }, 0)
  }

  // ─── Session item CRUD ────────────────────────────────────────────────────

  async #addSessionBuyerItem({
    type,
    sourceId,
    name,
    img,
    quantity,
    availableQuantity = null,
    hasLimitedQuantity = false,
    unitPriceValue,
    priceCurrency,
    sourceLabel,
    proposedUnitPriceValue = "",
    isFreePrice = false,
    minimumPriceValue = null,
    deliveryQuantityPerLot = null
  }) {
    const session = await this.#getOrCreateActiveSession()
    if (!session) return null

    const normalizedQuantity = Number(quantity)
    const convertedPrice = convertPriceToReferenceCurrency(unitPriceValue, priceCurrency)
    const normalizedUnitPrice = Number(convertedPrice.value)
    const normalizedCurrency = convertedPrice.currency
    const normalizedDeliveryQuantityPerLot = normalizeEffectiveDeliveryQuantityPerLot(deliveryQuantityPerLot)
    const normalizedAvailableQuantity = Number(availableQuantity)
    const hasLimitedStock =
      Boolean(hasLimitedQuantity) && Number.isFinite(normalizedAvailableQuantity) && normalizedAvailableQuantity >= 0

    if (
      !Number.isFinite(normalizedQuantity) ||
      normalizedQuantity <= 0 ||
      !Number.isFinite(normalizedUnitPrice) ||
      normalizedUnitPrice < 0
    ) {
      return null
    }

    const pricesMatchForMerge = (item) => {
      if (Number(item.unitPriceValue) === 0 && normalizedUnitPrice === 0) return true
      return item.priceCurrency === normalizedCurrency
    }
    const existingItem = session.buyerItems.find(
      (item) =>
        item.type === type &&
        item.sourceId === sourceId &&
        item.unitPriceValue === normalizedUnitPrice &&
        pricesMatchForMerge(item) &&
        normalizeEffectiveDeliveryQuantityPerLot(item.deliveryQuantityPerLot) === normalizedDeliveryQuantityPerLot
    )

    if (existingItem) {
      const existingQuantityLimit =
        type === "product"
          ? this.#getProductSessionItemQuantityLimit(existingItem, session)
          : normalizedAvailableQuantity
      const hasExistingQuantityLimit = Number.isFinite(existingQuantityLimit) && existingQuantityLimit >= 0

      existingItem.availableQuantity = hasExistingQuantityLimit ? existingQuantityLimit : null
      existingItem.hasLimitedQuantity = type === "product" ? hasExistingQuantityLimit : hasLimitedStock
      if (
        !this.#canAcceptSessionQuantity(existingItem, existingItem.quantity + normalizedQuantity, {
          session,
          side: "buyer"
        })
      ) {
        return null
      }

      existingItem.quantity = Number((existingItem.quantity + normalizedQuantity).toFixed(2))
      recalculateSessionItemTotal(existingItem)
      await this.#saveSession(session)
      return existingItem
    }

    const sessionItem = {
      id: foundry.utils.randomID(),
      type,
      sourceId,
      name,
      img: img ?? "",
      quantity: normalizedQuantity,
      deliveryQuantityPerLot: normalizedDeliveryQuantityPerLot > 1 ? normalizedDeliveryQuantityPerLot : null,
      availableQuantity: hasLimitedStock ? normalizedAvailableQuantity : null,
      hasLimitedQuantity: hasLimitedStock,
      unitPriceValue: normalizedUnitPrice,
      priceCurrency: normalizedCurrency,
      totalPriceValue: Number((normalizedQuantity * normalizedUnitPrice).toFixed(2)),
      sourceLabel,
      proposedUnitPriceValue:
        proposedUnitPriceValue !== "" && Number.isFinite(Number(proposedUnitPriceValue))
          ? Number(proposedUnitPriceValue)
          : null,
      isFreePrice: Boolean(isFreePrice),
      minimumPriceValue:
        minimumPriceValue !== null && Number.isFinite(Number(minimumPriceValue)) && Number(minimumPriceValue) >= 0
          ? Number(minimumPriceValue)
          : null
    }

    session.buyerItems.push(sessionItem)
    await this.#saveSession(session)
    return sessionItem
  }

  #createNegotiation({
    side,
    type,
    sourceKind = "",
    sourceId = "",
    sourceUuid = "",
    sourceActorUuid = "",
    name,
    img = "",
    quantity,
    unitPriceValue,
    priceCurrency,
    referenceUnitPriceValue,
    referencePriceCurrency = priceCurrency,
    isFreePrice = false,
    minimumPriceValue = null,
    deliveryQuantityPerLot = null
  }) {
    const normalizedQuantity = Number(quantity)
    const convertedUnitPrice = convertPriceToReferenceCurrency(unitPriceValue, priceCurrency)
    const convertedReference = convertPriceToReferenceCurrency(referenceUnitPriceValue, referencePriceCurrency)
    const normalizedUnitPrice = Number(convertedUnitPrice.value)
    const normalizedReference = Number(convertedReference.value)
    const safeQuantity = Number.isFinite(normalizedQuantity) && normalizedQuantity > 0 ? normalizedQuantity : 1
    const safeUnitPrice = Number.isFinite(normalizedUnitPrice) && normalizedUnitPrice >= 0 ? normalizedUnitPrice : 0
    const safeReference = Number.isFinite(normalizedReference) && normalizedReference >= 0 ? normalizedReference : 0
    const safeDeliveryQuantityPerLot = normalizeEffectiveDeliveryQuantityPerLot(deliveryQuantityPerLot)
    const totalPriceValue = Number((safeQuantity * safeUnitPrice).toFixed(2))
    const percentOfReference = safeReference > 0 ? Number(((safeUnitPrice / safeReference) * 100).toFixed(2)) : 100
    const now = new Date().toISOString()

    return {
      id: foundry.utils.randomID(),
      side: side === "seller" ? "seller" : "buyer",
      type: ["product", "service", "item"].includes(type) ? type : "product",
      sourceKind: String(sourceKind ?? "").trim(),
      sourceId: String(sourceId ?? "").trim(),
      sourceUuid: String(sourceUuid ?? "").trim(),
      sourceActorUuid: String(sourceActorUuid ?? "").trim(),
      name: String(name ?? "").trim(),
      img: img ?? "",
      priceCurrency: convertedUnitPrice.currency,
      referenceUnitPriceValue: safeReference,
      proposedUnitPriceValue: safeUnitPrice,
      isFreePrice: Boolean(isFreePrice),
      minimumPriceValue:
        minimumPriceValue !== null && Number.isFinite(Number(minimumPriceValue)) && Number(minimumPriceValue) >= 0
          ? Number(minimumPriceValue)
          : null,
      deliveryQuantityPerLot: safeDeliveryQuantityPerLot > 1 ? safeDeliveryQuantityPerLot : null,
      status: "active",
      currentTurn: "merchant",
      offers: [
        {
          id: foundry.utils.randomID(),
          side: "buyer",
          quantity: safeQuantity,
          unitPriceValue: safeUnitPrice,
          totalPriceValue,
          percentOfReference,
          status: "submitted",
          createdAt: now
        }
      ],
      createdAt: now,
      updatedAt: now
    }
  }

  async #addSessionNegotiation(negotiationData) {
    const session = await this.#getOrCreateActiveSession()
    if (!session) return null

    const negotiation = normalizeSessionNegotiation(negotiationData)
    session.negotiations = Array.isArray(session.negotiations) ? session.negotiations : []
    session.negotiations.push(negotiation)
    session.status = "pending"

    await this.#saveSession(session)
    return negotiation
  }

  async #addSessionSellerItem({
    type,
    sourceKind = "",
    sourceUuid,
    sourceActorUuid,
    sourceId,
    name,
    img,
    quantity,
    availableQuantity = null,
    hasLimitedQuantity = false,
    unitPriceValue,
    priceCurrency,
    sourceLabel,
    isFromActor = false
  }) {
    const session = await this.#getOrCreateActiveSession()
    if (!session) return null

    const normalizedQuantity = Number(quantity)
    const convertedPrice = convertPriceToReferenceCurrency(unitPriceValue, priceCurrency)
    const normalizedUnitPrice = Number(convertedPrice.value)
    const normalizedCurrency = convertedPrice.currency
    const normalizedSourceKind = String(sourceKind ?? "").trim()
    const normalizedSourceUuid = String(sourceUuid ?? "").trim()
    const normalizedAvailableQuantity = Number(availableQuantity)
    const hasLimitedStock =
      Boolean(hasLimitedQuantity) && Number.isFinite(normalizedAvailableQuantity) && normalizedAvailableQuantity >= 0

    if (
      !Number.isFinite(normalizedQuantity) ||
      normalizedQuantity <= 0 ||
      !Number.isFinite(normalizedUnitPrice) ||
      normalizedUnitPrice < 0
    ) {
      return null
    }

    const pricesMatchForMerge = (item) => {
      if (Number(item.unitPriceValue) === 0 && normalizedUnitPrice === 0) return true
      return item.priceCurrency === normalizedCurrency
    }
    const existingItem = session.sellerItems.find(
      (item) =>
        (normalizedSourceUuid ? item.sourceUuid === normalizedSourceUuid : item.sourceId === sourceId) &&
        item.unitPriceValue === normalizedUnitPrice &&
        pricesMatchForMerge(item)
    )

    if (existingItem) {
      if (normalizedSourceKind && !existingItem.sourceKind) existingItem.sourceKind = normalizedSourceKind
      existingItem.availableQuantity = hasLimitedStock ? normalizedAvailableQuantity : null
      existingItem.hasLimitedQuantity = hasLimitedStock
      if (
        !this.#canAcceptSessionQuantity(existingItem, existingItem.quantity + normalizedQuantity, {
          session,
          side: "seller"
        })
      ) {
        return null
      }

      existingItem.quantity = Number((existingItem.quantity + normalizedQuantity).toFixed(2))
      recalculateSessionItemTotal(existingItem)
      await this.#saveSession(session)
      return existingItem
    }

    const sessionItem = {
      id: foundry.utils.randomID(),
      type,
      sourceKind: normalizedSourceKind,
      sourceUuid: normalizedSourceUuid,
      sourceActorUuid: sourceActorUuid ?? "",
      sourceId,
      name,
      img: img ?? "",
      quantity: normalizedQuantity,
      availableQuantity: hasLimitedStock ? normalizedAvailableQuantity : null,
      hasLimitedQuantity: hasLimitedStock,
      unitPriceValue: normalizedUnitPrice,
      priceCurrency: normalizedCurrency,
      totalPriceValue: Number((normalizedQuantity * normalizedUnitPrice).toFixed(2)),
      sourceLabel,
      proposedUnitPriceValue: null,
      isFromActor: Boolean(isFromActor)
    }

    session.sellerItems.push(sessionItem)
    await this.#saveSession(session)
    return sessionItem
  }

  async #createSessionForClient(client) {
    if (!client?.actorUuid || !client.isAuthorized) {
      ui.notifications.warn(game.i18n.localize("mtt.access.notAuthorizedForTrade"))
      return null
    }

    const existingSession = this.#getBestSessionForClientActor(client.actorUuid)
    if (existingSession) {
      this.#selectSession(existingSession.id)
      return existingSession
    }

    const sessions = this.#getSessions().map((session) => normalizeSession(session))
    const session = buildSessionData(client)
    if (this.#isStorageEntity()) {
      this.#setStorageSessionMoneyValue(session, "take", 0)
      this.#setStorageSessionMoneyValue(session, "deposit", 0)
    }
    sessions.push(session)
    this.#activeSessionId = session.id
    this.#selectedClientActorUuid = client.actorUuid
    this.#sessionCheckResult = null

    await this.#updateSessionEntries(sessions)

    return session
  }

  async #saveSession(session) {
    this.#saveScrollPositions()
    this.#sessionCheckResult = null

    const normalizedSession = normalizeSession(session)
    this.#normalizeStorageExchangeSession(normalizedSession)
    normalizedSession.updatedAt = new Date().toISOString()
    normalizedSession.buyerItems.forEach((item) => recalculateSessionItemTotal(item))
    normalizedSession.sellerItems.forEach((item) => recalculateSessionItemTotal(item))

    const sessions = this.#getSessions().map((entry) => normalizeSession(entry))
    const index = sessions.findIndex((entry) => entry.id === normalizedSession.id)

    if (index === -1) {
      sessions.push(normalizedSession)
    } else {
      sessions[index] = normalizedSession
    }

    this.#activeSessionId = normalizedSession.id
    this.#selectedClientActorUuid = normalizedSession.actorUuid ?? ""

    await this.#updateSessionEntries(sessions)
  }

  async #updateSessionEntries(sessions) {
    if (!this.#canUserManageCurrentSheet()) {
      const currentSessions = new Map(this.#getSessions().map((session) => [session.id, normalizeSession(session)]))
      const changedSessions = sessions
        .map((session) => normalizeSession(session))
        .filter((session) => {
          const current = currentSessions.get(session.id)
          return !current || JSON.stringify(current) !== JSON.stringify(session)
        })

      if (changedSessions.some((session) => !this.#canInteractWithSession(session))) return
    }

    const sessionEntriesPath = this.#isStorageEntity()
      ? getStorageFlagPath("sessions.entries")
      : getMerchantFlagPath("sessions.entries")
    const updateData = {
      [sessionEntriesPath]: sessions
    }

    if (game.user?.isGM) {
      await this.actor.update(updateData)
      return
    }

    const permissionLevel = this.actor.getUserLevel(game.user) ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
    const isOwner =
      this.actor.testUserPermission?.(game.user, "OWNER") || permissionLevel >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER

    if (isOwner) {
      await this.actor.update(updateData)
      return
    }

    const response = await requestMerchantSessionUpdate(this.actor, updateData)
    if (response?.updateData && this.actor.updateSource) this.actor.updateSource(response.updateData)
  }

  // ─── Misc helpers ─────────────────────────────────────────────────────────

  #canModifyMerchant() {
    if (!this.isEditable) return false

    const entityType = getMTTEntityType(this.actor) || MTT.ENTITY_TYPES.MERCHANT
    const isLocked = this.#getSheetLockedState(entityType)

    if (isLocked) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.sheetLocked"))
      return false
    }

    return true
  }

  // ─── Action handlers ──────────────────────────────────────────────────────

  static async #onCreateItem(event, target) {
    event.preventDefault()

    if (!this.#canModifyMerchant()) return

    const type = target.dataset.type || "loot"
    const name = game.i18n.localize("mtt.items.newItem")

    this.#saveScrollPositions()
    await addCatalogProduct(this.actor, {
      itemData: { name, type, img: "" },
      productFlags: { enabled: true, isHidden: false }
    })
  }

  static async #onEditItem(event, target) {
    event.preventDefault()

    const product = this.#getProductFromEvent(target)
    if (!product) return
    if (!product.itemData?.type) return

    if (this.isEditable) {
      // GM/propriétaire : ouvre le vrai Item embedded — aucun Item temporaire, aucune erreur CoEquipmentSheet
      const item = this.actor.items.get(product.id)
      if (!item) return
      item.sheet?.render(true)
      return
    }

    if (!this.#requireMerchantPermission("canOpenProduct")) return

    // Client : vue en lecture seule via Item temporaire avec ID synthétique
    const ItemClass = getDocumentClass("Item")
    if (!ItemClass) return
    const rawItemData = foundry.utils.deepClone(product.itemData)
    const idPart = product.id
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 13)
      .padEnd(13, "0")
    rawItemData._id = `mtt${idPart}`
    rawItemData.ownership = { default: product.ownershipLevel }
    const tempItem = new ItemClass(rawItemData)
    tempItem.update = async function () {
      return this
    }
    tempItem.sheet?.render(true)
  }

  static async #onDeleteItem(event, target) {
    event.preventDefault()

    if (!this.#canModifyMerchant()) return

    const product = this.#getProductFromEvent(target)
    if (!product) return

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: game.i18n.localize("mtt.dialog.deleteItem.title")
      },
      content: await this.#renderConfirmDialogContent({ message: game.i18n.localize("mtt.dialog.deleteItem.content") }),
      yes: {
        label: "mtt.actions.delete"
      },
      no: {
        label: "mtt.actions.cancel"
      }
    })

    if (!confirmed) return

    this.#saveScrollPositions()
    await removeCatalogProduct(this.actor, product.id)
  }

  static async #onAddProductToSession(event, target) {
    event.preventDefault()

    const productId =
      target.closest("[data-product-id]")?.dataset.productId ?? target.closest("[data-item-id]")?.dataset.itemId
    if (!productId) return

    if (getMTTEntityType(this.actor) === MTT.ENTITY_TYPES.STORAGE) {
      // MTT storage — ajout direct d’un exemplaire à la session d’échange
      if (!this.#requireMerchantPermission("canInteractWithSession")) return

      const product = getCatalogProduct(this.actor, productId)
      if (!product) return
      if (product.isHidden && !this.isEditable) return
      if (product.isBlocked && game.user?.isGM !== true && !this.isEditable) {
        ui.notifications.warn(game.i18n.localize("mtt.storage.intent.block.blockedItem"))
        return
      }

      const availability = this.#getProductAvailability(product.id)
      const hasLimitedAvailableQuantity = Boolean(availability?.hasLimitedQuantity)
      const availableQuantity = hasLimitedAvailableQuantity ? availability.availableQuantity : null
      const activeSession = this.#getActiveSession()

      const storageIntentState = buildStorageItemIntentState({
        rawTags: product.rawStorageTags ?? {},
        sessions: this.#getSessions(),
        activeSession,
        activeSessionActorUuid: activeSession?.actorUuid ?? "",
        availableQuantity: availability?.availableQuantity ?? 0,
        product
      })
      const storageAddIntentBlockState = buildStorageAddIntentBlockState(storageIntentState, {
        canOverride: game.user?.isGM === true
      })

      if (storageAddIntentBlockState.isStorageAddBlockedForCurrentUser) {
        const reasonKey = storageAddIntentBlockState.storageAddBlockReasonKey || "mtt.storage.intent.block.generic"
        ui.notifications.warn(game.i18n.localize(reasonKey))
        return
      }

      if (hasLimitedAvailableQuantity && availableQuantity <= 0) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.productUnavailableQuantity"))
        return
      }

      const sessionItem = await this.#addSessionBuyerItem({
        type: "product",
        sourceId: product.id,
        name: product.name,
        img: product.img,
        quantity: 1,
        availableQuantity,
        hasLimitedQuantity: !isUnlimitedQuantity(product.quantity) && availableQuantity !== null,
        unitPriceValue: 0,
        priceCurrency: "",
        sourceLabel: game.i18n.localize("mtt.storage.session.item.storage")
      })
      if (!sessionItem) return

      this.render()
      return
    }

    if (!this.#requireMerchantPermission("canInteractWithSession")) return

    this.render()
    await new Promise((resolve) => requestAnimationFrame(resolve))

    const product = getCatalogProduct(this.actor, productId)
    if (!product) return

    if (product.isHidden && !this.isEditable) return
    if (product.isBlocked && !this.isEditable) return
    if (!this.#requireSelectedSessionForItemAddition()) return

    const availability = this.#getProductAvailability(product.id)
    const hasLimitedAvailableQuantity = Boolean(availability?.hasLimitedQuantity)
    const availableQuantity = hasLimitedAvailableQuantity ? availability.availableQuantity : null

    if (hasLimitedAvailableQuantity && availableQuantity <= 0) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.productUnavailableQuantity"))
      return
    }

    const effectiveDeliveryQuantityPerLot = normalizeEffectiveDeliveryQuantityPerLot(product.deliveryQuantityPerLot)
    const displayName = formatProductNameWithLotQuantity(product.name, product.deliveryQuantityPerLot)
    const itemPriceValue = product.priceValue
    const rates = this.#getEffectiveRatesForSession()
    const displayPriceValue = adjustPriceValue(itemPriceValue, rates.productSellPercent)
    const priceCurrency = product.priceCurrency
    const quantity = product.quantity
    const hasFreePrice = Boolean(product.hasFreePrice)
    const minimumPriceValue = product.minimumPriceValue

    const referenceCurrency = getReferenceCurrency()
    const referenceCurrencyLabel = referenceCurrency
      ? String(referenceCurrency.abbreviation ?? referenceCurrency.name ?? "").trim()
      : ""

    const sessionCurrency = hasFreePrice ? referenceCurrencyLabel || priceCurrency : priceCurrency

    const dialogData = await openSessionPreparationDialog({
      title: game.i18n.localize("mtt.sessions.dialog.productTitle"),
      name: displayName,
      priceLabel: hasFreePrice
        ? game.i18n.localize("mtt.price.freePrice")
        : formatPriceLabel(displayPriceValue, priceCurrency),
      availableQuantity,
      availableQuantityLabel: availability?.quantityTooltip ?? "",
      includeProposedPrice: !hasFreePrice,
      hasFreePrice,
      referenceCurrencyLabel
    })
    if (!dialogData) return

    const hasProposedPrice = dialogData.proposedPrice !== ""
    const unitPriceValue = hasFreePrice || hasProposedPrice ? Number(dialogData.proposedPrice) : displayPriceValue

    if (Number.isFinite(availableQuantity) && availableQuantity >= 0 && dialogData.quantity > availableQuantity) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.notEnoughQuantity"))
      return
    }

    const requiresApproval = Boolean(product.requiresApproval)
    const priceWasChanged = Math.abs(Number(unitPriceValue) - Number(displayPriceValue)) > 0.0001
    const shouldNegotiate = requiresApproval || hasFreePrice || priceWasChanged

    if (shouldNegotiate) {
      const negotiation = await this.#addSessionNegotiation(
        this.#createNegotiation({
          side: "buyer",
          type: "product",
          sourceId: product.id,
          sourceUuid: product.sourceUuid,
          name: displayName,
          img: product.img,
          quantity: dialogData.quantity,
          unitPriceValue,
          priceCurrency: sessionCurrency,
          referenceUnitPriceValue: displayPriceValue,
          referencePriceCurrency: priceCurrency,
          isFreePrice: hasFreePrice,
          minimumPriceValue: hasFreePrice ? minimumPriceValue : null,
          deliveryQuantityPerLot: effectiveDeliveryQuantityPerLot
        })
      )
      if (!negotiation) return

      this.render()
      return
    }

    const sessionItem = await this.#addSessionBuyerItem({
      type: "product",
      sourceId: product.id,
      name: displayName,
      img: product.img,
      quantity: dialogData.quantity,
      availableQuantity,
      hasLimitedQuantity: !isUnlimitedQuantity(quantity) && availableQuantity !== null,
      unitPriceValue,
      priceCurrency: sessionCurrency,
      sourceLabel: game.i18n.localize("mtt.sessions.item.product"),
      proposedUnitPriceValue: hasFreePrice ? unitPriceValue : (dialogData.proposedPrice ?? ""),
      isFreePrice: hasFreePrice,
      minimumPriceValue: hasFreePrice ? minimumPriceValue : null,
      deliveryQuantityPerLot: effectiveDeliveryQuantityPerLot
    })
    if (!sessionItem) return

    this.render()
  }

  static async #onRemoveSessionItem(event, target) {
    event.preventDefault()

    const session = this.#getActiveSessionForInteraction()
    if (!session) return

    const itemId = target.closest("[data-session-item-id]")?.dataset.sessionItemId
    if (!itemId) return
    const side = target.closest("[data-session-side]")?.dataset.sessionSide ?? "buyer"

    if (!removeSessionItemById(session, itemId, side)) return

    await this.#saveSession(session)
    this.render()
  }

  static async #onSubmitNegotiationOffer(event, target) {
    event.preventDefault()

    const session = this.#getActiveSession()
    if (!session) return
    if (!this.isEditable && !this.#canInteractWithSession(session)) return

    const negotiation = this.#getNegotiationFromEvent(target, session)
    if (!negotiation || negotiation.status !== "active") return

    const side = this.#getNegotiationOfferSide()
    if (negotiation.currentTurn !== side) return

    const values = this.#getNegotiationDraftValues(target)
    if (!values) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidNegotiationOffer"))
      return
    }
    if (negotiation.isFreePrice && Number(values.unitPriceValue) <= 0) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.missingProposedPrice"))
      return
    }

    const offer = this.#createSubmittedNegotiationOffer(values, side)
    negotiation.offers = Array.isArray(negotiation.offers) ? negotiation.offers : []
    negotiation.offers.push(offer)
    negotiation.currentTurn = side === "buyer" ? "merchant" : "buyer"
    negotiation.updatedAt = new Date().toISOString()
    session.status = "pending"

    await this.#saveSession(session)
    this.render()
  }

  static async #onAcceptNegotiationOffer(event, target) {
    event.preventDefault()

    const session = this.#getActiveSession()
    if (!session) return
    if (!this.isEditable && !this.#canInteractWithSession(session)) return

    const negotiation = this.#getNegotiationFromEvent(target, session)
    if (!negotiation || negotiation.status !== "active") return
    if (!this.#canAnswerNegotiation(negotiation)) return

    const lastOffer = this.#getLastNegotiationOffer(negotiation)
    if (!lastOffer) return
    if (negotiation.isFreePrice && Number(lastOffer.unitPriceValue) <= 0) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.missingProposedPrice"))
      return
    }

    const acceptedItem = this.#buildSessionItemFromNegotiationOffer(negotiation, lastOffer)
    if (!acceptedItem) return

    if (negotiation.side === "seller") {
      session.sellerItems = Array.isArray(session.sellerItems) ? session.sellerItems : []
      session.sellerItems.push(acceptedItem)
    } else {
      session.buyerItems = Array.isArray(session.buyerItems) ? session.buyerItems : []
      session.buyerItems.push(acceptedItem)
    }

    negotiation.status = "accepted"
    negotiation.updatedAt = new Date().toISOString()
    session.status = "active"

    await this.#saveSession(session)
    this.render()
  }

  static async #onRefuseNegotiationOffer(event, target) {
    event.preventDefault()

    const session = this.#getActiveSession()
    if (!session) return
    if (!this.isEditable && !this.#canInteractWithSession(session)) return

    const negotiation = this.#getNegotiationFromEvent(target, session)
    if (!negotiation || negotiation.status !== "active") return
    if (!this.#canAnswerNegotiation(negotiation)) return

    negotiation.status = "refused"
    negotiation.updatedAt = new Date().toISOString()
    session.status = "active"

    await this.#saveSession(session)
    this.render()
  }

  static async #onIncreaseStorageMoney(event, target) {
    event.preventDefault()

    const session = this.#getActiveSessionForInteraction()
    if (!session) return

    const side = target.dataset.storageMoneySide
    if (!["take", "deposit"].includes(side)) return

    this.#normalizeStorageExchangeSession(session)
    const items = side === "deposit" ? (session.buyerItems ?? []) : (session.sellerItems ?? [])
    const itemId = side === "deposit" ? STORAGE_MONEY_DEPOSIT_ID : STORAGE_MONEY_TAKE_ID
    const current = items.find((item) => item.id === itemId && item.type === "money")
    const currentAmount = Number(current?.unitPriceValue ?? 0)
    const nextAmount = Number(
      ((Number.isFinite(currentAmount) && currentAmount >= 0 ? currentAmount : 0) + 1).toFixed(2)
    )

    this.#setStorageSessionMoneyValue(session, side, nextAmount)
    await this.#saveSession(session)
    this.render()
  }

  static async #onDecreaseStorageMoney(event, target) {
    event.preventDefault()

    const session = this.#getActiveSessionForInteraction()
    if (!session) return

    const side = target.dataset.storageMoneySide
    if (!["take", "deposit"].includes(side)) return

    this.#normalizeStorageExchangeSession(session)
    const items = side === "deposit" ? (session.buyerItems ?? []) : (session.sellerItems ?? [])
    const itemId = side === "deposit" ? STORAGE_MONEY_DEPOSIT_ID : STORAGE_MONEY_TAKE_ID
    const current = items.find((item) => item.id === itemId && item.type === "money")
    const currentAmount = Number(current?.unitPriceValue ?? 0)
    const nextAmount = Math.max(
      0,
      Number(((Number.isFinite(currentAmount) && currentAmount >= 0 ? currentAmount : 0) - 1).toFixed(2))
    )

    this.#setStorageSessionMoneyValue(session, side, nextAmount)
    await this.#saveSession(session)
    this.render()
  }

  static async #onIncreaseSessionItemQuantity(event, target) {
    event.preventDefault()

    const session = this.#getActiveSessionForInteraction()
    if (!session) return

    const itemId = target.closest("[data-session-item-id]")?.dataset.sessionItemId
    if (!itemId) return
    const side = target.closest("[data-session-side]")?.dataset.sessionSide ?? "buyer"

    const item = getSessionItemsForSide(session, side).find((it) => it.id === itemId)
    if (!item) return

    const storageClaimState =
      side === "buyer" ? this.#getStorageSessionItemClaimState(item, session, item.quantity + 1) : null
    if (storageClaimState?.applies && !storageClaimState.canAccept) {
      ui.notifications.warn(game.i18n.localize(storageClaimState.reasonKey || "mtt.storage.intent.block.generic"))
      return
    }

    if (!this.#canAcceptSessionQuantity(item, item.quantity + 1, { session, side })) {
      ui.notifications.warn(
        game.i18n.localize(
          side === "seller" ? "mtt.notifications.notEnoughSellerItemQuantity" : "mtt.notifications.notEnoughQuantity"
        )
      )
      return
    }

    setSessionItemQuantity(item, item.quantity + 1)
    await this.#saveSession(session)
    this.render()
  }

  static async #onDecreaseSessionItemQuantity(event, target) {
    event.preventDefault()

    const session = this.#getActiveSessionForInteraction()
    if (!session) return

    const itemId = target.closest("[data-session-item-id]")?.dataset.sessionItemId
    if (!itemId) return
    const side = target.closest("[data-session-side]")?.dataset.sessionSide ?? "buyer"

    const item = getSessionItemsForSide(session, side).find((it) => it.id === itemId)
    if (!item) return

    const nextQuantity = Number(item.quantity) - 1
    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
      removeSessionItemById(session, itemId, side)
      await this.#saveSession(session)
      this.render()
      return
    }

    setSessionItemQuantity(item, nextQuantity)
    await this.#saveSession(session)
    this.render()
  }

  static async #onClearSessionDraft(event) {
    event.preventDefault()

    const session = this.#getActiveSessionForInteraction()
    if (!session) return

    const isStorage = this.#isStorageEntity()
    const hasItems = isStorage
      ? [...(session.buyerItems ?? []), ...(session.sellerItems ?? [])].some((item) => {
          if (item.type !== "money") return true
          const amount = Number(item.unitPriceValue)
          return Number.isFinite(amount) && amount > 0
        })
      : session.buyerItems.length > 0 || session.sellerItems.length > 0
    if (!hasItems) return

    const content = await this.#renderMttDialogContent({
      icon: "fa-rotate-left",
      title: game.i18n.localize("mtt.dialog.clearSessionTitle"),
      message: game.i18n.localize("mtt.dialog.clearSessionMessage"),
      details: game.i18n.localize("mtt.dialog.noTransactionNoJournal"),
      variant: "warning"
    })
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: game.i18n.localize("mtt.dialog.clearSessionTitle")
      },
      content,
      yes: {
        label: game.i18n.localize("mtt.dialog.clearSessionConfirm")
      },
      no: {
        label: game.i18n.localize("mtt.dialog.cancel")
      }
    })

    if (!confirmed) return

    if (isStorage) {
      session.buyerItems = (session.buyerItems ?? []).filter((item) => item.type === "money")
      session.sellerItems = (session.sellerItems ?? []).filter((item) => item.type === "money")
      this.#setStorageSessionMoneyValue(session, "take", 0)
      this.#setStorageSessionMoneyValue(session, "deposit", 0)
    } else {
      session.buyerItems = []
      session.sellerItems = []
    }
    session.status = "active"
    await this.#saveSession(session)

    this.render()
  }

  static async #onToggleClientAccess(event, target) {
    event.preventDefault()

    const actorUuid = target.dataset.clientActorUuid

    const client = this.#getAccessClientCandidate(actorUuid)
    if (!client) return

    if (!client.isAuthorized) {
      if (!this.#canModifyAccessRail()) return

      await this.#setClientAuthorization(client, true)
      const session = await this.#createSessionForClient({
        ...client,
        isAuthorized: true
      })
      if (!session) return

      this.render()
      return
    }

    this.#selectedClientActorUuid = client.actorUuid
    this.#sessionCheckResult = null
    const sessionActorAccess = this.#getSessionActorAccess(client.actorUuid)
    const session = this.#getBestSessionForClientActor(client.actorUuid)
    if (session) {
      if (!sessionActorAccess.canSelectOtherSession) {
        this.#activeSessionId = null
        this.#selectedClientActorUuid = ""
        ui.notifications.warn(game.i18n.localize("mtt.notifications.permissionDenied"))
        return
      }

      this.#selectSession(session.id)
      this.render()
      return
    }

    if (!this.#canModifyAccessRail()) return

    const repairedSession = await this.#createSessionForClient(client)
    if (!repairedSession) return

    this.render()
  }

  static async #onSetSessionStatus(event, target) {
    event.preventDefault()

    const session = this.#getActiveSession()
    if (!session) return

    const status = target.dataset.sessionStatus
    if (!["active", "pending", "submitted", "validated", "refused"].includes(status)) return
    if (["validated", "refused"].includes(status)) {
      if (!this.#requireMerchantPermission("canValidateOrRefuseSessions")) return
    } else if (!this.#canInteractWithSession(session)) {
      return
    }

    session.status = status
    await this.#saveSession(session)

    this.render()
  }

  static async #onCheckSessionTransaction(event) {
    event.preventDefault()

    const session = this.#getActiveSession()
    if (!session) return

    this.#sessionCheckResult = await this.#checkSessionTransaction(session)

    if (!this.#sessionCheckResult.canProceed) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.sessionCheckFailed"))
    }
    this.render()
  }

  static async #onPreviewSessionExecution(event) {
    event.preventDefault()

    const session = this.#getActiveSession()
    if (!session) return
    if (this.#isStorageEntity()) this.#normalizeStorageExchangeSession(session)

    const preview = await buildExecutionPreview(
      this.actor,
      session,
      this.#isStorageEntity()
        ? {
            accessClients: this.#prepareAccessClients(),
            includeCurrencyTransfers: true,
            skipCommercialDeliveryText: true
          }
        : {}
    )

    this.#sessionCheckResult = {
      checked: true,
      canProceed: preview.canExecute,
      infos: [],
      warnings: preview.warnings.map((w, i) => ({
        id: `preview-warn-${i}`,
        level: "warning",
        text: w,
        icon: "fa-triangle-exclamation"
      })),
      errors: preview.errors.map((e, i) => ({
        id: `preview-err-${i}`,
        level: "error",
        text: e,
        icon: "fa-circle-xmark"
      }))
    }

    if (!preview.canExecute) {
      this.render()
      await openPreviewErrorDialog(preview)
      return
    }

    this.render()
    await openPreviewDialog(preview, { isStorage: this.#isStorageEntity() })
  }

  static async #onSubmitSession(event) {
    event.preventDefault()

    const session = this.#getActiveSessionForInteraction()
    if (!session) return

    session.status = "submitted"
    session.isSubmitted = true
    await this.#saveSession(session)
    this.render()
  }

  static async #onUnlockSubmittedSession(event) {
    event.preventDefault()

    if (!this.#requireMerchantPermission("canValidateOrRefuseSessions")) return

    const session = this.#getActiveSession()
    if (!session) return

    session.status = "active"
    session.isSubmitted = false
    await this.#saveSession(session)
    this.render()
  }

  static async #onValidateSessionTransaction(event) {
    event.preventDefault()

    if (!this.#requireMerchantPermission("canValidateOrRefuseSessions")) return

    const session = this.#getActiveSession()
    if (!session) return

    if (this.#isStorageEntity()) {
      // MTT storage — transfert réel des Items et des lignes money, avec journal storage
      this.#normalizeStorageExchangeSession(session)
      const storageExecutionOptions = {
        accessClients: this.#prepareAccessClients(),
        includeCurrencyTransfers: true,
        skipCommercialDeliveryText: true
      }
      const storageClaimErrors = this.#getStorageSessionClaimLimitErrors(session)
      if (storageClaimErrors.length > 0) {
        const blockedPreview = {
          canExecute: false,
          warnings: [],
          errors: storageClaimErrors
        }
        this.#sessionCheckResult = {
          checked: true,
          canProceed: false,
          infos: [],
          warnings: [],
          errors: storageClaimErrors.map((error, i) => ({
            id: `storage-claim-limit-err-${i}`,
            level: "error",
            text: error,
            icon: "fa-circle-xmark"
          }))
        }
        this.render()
        await openSessionExecutionErrorsDialog(blockedPreview)
        return
      }

      const preview = await buildSessionItemExecutionPlan(this.actor, session, storageExecutionOptions)

      this.#sessionCheckResult = {
        checked: true,
        canProceed: preview.canExecute,
        infos: [],
        warnings: preview.warnings.map((w, i) => ({
          id: `storage-preview-warn-${i}`,
          level: "warning",
          text: w,
          icon: "fa-triangle-exclamation"
        })),
        errors: preview.errors.map((e, i) => ({
          id: `storage-preview-err-${i}`,
          level: "error",
          text: e,
          icon: "fa-circle-xmark"
        }))
      }

      if (!preview.canExecute) {
        this.render()
        await openSessionExecutionErrorsDialog(preview)
        return
      }

      const confirmed = await openSessionValidationDialog(preview, { isStorage: true })
      if (!confirmed) return

      try {
        const executionPlan = await buildSessionItemExecutionPlan(this.actor, session, storageExecutionOptions)
        if (!executionPlan.canExecute) {
          this.#sessionCheckResult = {
            checked: true,
            canProceed: false,
            infos: [],
            warnings: executionPlan.warnings.map((w, i) => ({
              id: `storage-execution-warn-${i}`,
              level: "warning",
              text: w,
              icon: "fa-triangle-exclamation"
            })),
            errors: executionPlan.errors.map((e, i) => ({
              id: `storage-execution-err-${i}`,
              level: "error",
              text: e,
              icon: "fa-circle-xmark"
            }))
          }
          await openSessionExecutionErrorsDialog(executionPlan)
          this.render()
          return
        }

        await executeSessionItemTransfers(this.actor, executionPlan)
        if (executionPlan.currencyTransferPlan?.canExecute && !executionPlan.currencyTransferPlan?.noTransferNeeded) {
          await applyCurrencyTransferPlan(this.actor, executionPlan.clientActor, executionPlan.currencyTransferPlan)
        }
        await appendStorageJournalEntry(
          this.actor,
          buildStorageJournalEntryFromSession(this.actor, session, {
            status: "validated",
            executionPlan
          })
        )
        clearSessionAfterExecution(session)
        this.#setStorageSessionMoneyValue(session, "take", 0)
        this.#setStorageSessionMoneyValue(session, "deposit", 0)
        await this.#saveSession(session)
        this.#sessionCheckResult = null
        this.render()
      } catch (error) {
        const failurePreview = {
          ...preview,
          canExecute: false,
          errors: [
            ...(preview.errors ?? []),
            error?.message || game.i18n.localize("mtt.sessions.execution.executionErrorTitle")
          ]
        }
        await openSessionExecutionErrorsDialog(failurePreview)
        this.render()
      }
      return
    }

    const preview = await buildSessionItemExecutionPlan(this.actor, session)

    this.#sessionCheckResult = {
      checked: true,
      canProceed: preview.canExecute,
      infos: [],
      warnings: preview.warnings.map((w, i) => ({
        id: `preview-warn-${i}`,
        level: "warning",
        text: w,
        icon: "fa-triangle-exclamation"
      })),
      errors: preview.errors.map((e, i) => ({
        id: `preview-err-${i}`,
        level: "error",
        text: e,
        icon: "fa-circle-xmark"
      }))
    }

    if (!preview.canExecute) {
      this.render()
      await openSessionExecutionErrorsDialog(preview)
      return
    }

    const confirmed = await openSessionValidationDialog(preview)
    if (!confirmed) return

    try {
      const transactionNumber = this.#getNextJournalTransactionNumber()
      const executionPlan = await buildSessionItemExecutionPlan(this.actor, session, { transactionNumber })
      if (!executionPlan.canExecute) {
        this.#sessionCheckResult = {
          checked: true,
          canProceed: false,
          infos: [],
          warnings: executionPlan.warnings.map((w, i) => ({
            id: `execution-warn-${i}`,
            level: "warning",
            text: w,
            icon: "fa-triangle-exclamation"
          })),
          errors: executionPlan.errors.map((e, i) => ({
            id: `execution-err-${i}`,
            level: "error",
            text: e,
            icon: "fa-circle-xmark"
          }))
        }
        await openSessionExecutionErrorsDialog(executionPlan)
        this.render()
        return
      }

      const itemTransferResult = await executeSessionItemTransfers(this.actor, executionPlan)
      executionPlan.itemTransferResult = itemTransferResult
      if (executionPlan.currencyTransferPlan?.canExecute && !executionPlan.currencyTransferPlan?.noTransferNeeded) {
        await applyCurrencyTransferPlan(this.actor, executionPlan.clientActor, executionPlan.currencyTransferPlan)
      }
      await appendMerchantJournalEntry(
        this.actor,
        buildMerchantJournalEntryFromSession(this.actor, session, {
          status: "validated",
          executionPlan,
          transactionNumber
        })
      )
      clearSessionAfterExecution(session)
      await this.#saveSession(session)
      this.#sessionCheckResult = null
      this.render()
    } catch (error) {
      const failurePreview = {
        ...preview,
        canExecute: false,
        errors: [
          ...(preview.errors ?? []),
          error?.message || game.i18n.localize("mtt.sessions.execution.executionErrorTitle")
        ]
      }
      await openSessionExecutionErrorsDialog(failurePreview)
      this.render()
    }
  }

  static async #onRefuseSessionTransaction(event) {
    event.preventDefault()

    if (!this.#requireMerchantPermission("canValidateOrRefuseSessions")) return

    const session = this.#getActiveSession()
    if (!session) return

    if (this.#isStorageEntity()) {
      // MTT storage — refus sans transfert, avec journal storage
      const confirmed = await openRefuseConfirmDialog()
      if (!confirmed) return

      await appendStorageJournalEntry(
        this.actor,
        buildStorageJournalEntryFromSession(this.actor, session, { status: "refused" })
      )
      clearSessionAfterExecution(session)
      this.#setStorageSessionMoneyValue(session, "take", 0)
      this.#setStorageSessionMoneyValue(session, "deposit", 0)
      await this.#saveSession(session)
      this.render()
      return
    }

    const confirmed = await openRefuseConfirmDialog()
    if (!confirmed) return

    const transactionNumber = this.#getNextJournalTransactionNumber()
    await appendMerchantJournalEntry(
      this.actor,
      buildMerchantJournalEntryFromSession(this.actor, session, {
        status: "refused",
        transactionNumber
      })
    )
    clearSessionAfterExecution(session)
    await this.#saveSession(session)
    this.render()
  }

  #getNextJournalTransactionNumber() {
    const nextTransactionNumber = Number(getMerchantData(this.actor)?.journal?.nextTransactionNumber)
    if (!Number.isFinite(nextTransactionNumber) || nextTransactionNumber <= 0) return 1

    return Math.floor(nextTransactionNumber)
  }

  static async #onToggleLock(event) {
    event.preventDefault()

    if (!this.isEditable) return

    // MTT base — verrouillage de feuille selon le type MTT actif
    const entityType = getMTTEntityType(this.actor) || MTT.ENTITY_TYPES.MERCHANT
    const isStorage = entityType === MTT.ENTITY_TYPES.STORAGE
    const isLocked = this.#getSheetLockedState(entityType)

    if (!isLocked && !isStorage) {
      await this.#saveMerchantTextFieldsFromDom()
      await this.#saveMerchantConfigFieldsFromDom()
    }

    if (isStorage) {
      this.#storageSheetLocked = !isLocked
    } else {
      // Use updateSource to avoid triggering the full actor data-preparation cycle for actors converted by flags.
      const lockPath = getMerchantFlagPath("sheet.isLocked")
      this.actor.updateSource({ [lockPath]: !isLocked })
    }
    await this.render({ force: true })
  }

  static async #onToggleSessionInteractions(event) {
    event.preventDefault()

    if (!this.isEditable) return

    const entityType = getMTTEntityType(this.actor) || MTT.ENTITY_TYPES.MERCHANT
    const isOpen = this.#getSessionInteractionsOpenState(entityType)
    const path = this.#getSessionInteractionsOpenPath(entityType)

    await this.actor.update({ [path]: !isOpen })
  }

  static async #onSaveReferenceState(event) {
    event.preventDefault()

    await this.#saveReferenceState()
  }

  static async #onRestoreReferenceState(event) {
    event.preventDefault()

    await this.#restoreReferenceState()
  }

  static async #onToggleProductSecret(event, target) {
    event.preventDefault()

    if (!this.isEditable) return

    const product = this.#getProductFromEvent(target)
    if (!product) return

    this.#saveScrollPositions()
    await updateCatalogProduct(this.actor, product.id, { isSecretExpanded: !product.isSecretExpanded })
    this.render()
  }

  static async #onEditShopImage(event) {
    event.preventDefault()

    if (!this.#canModifyMerchant()) return

    const entityType = getMTTEntityType(this.actor) || MTT.ENTITY_TYPES.MERCHANT
    const isStorage = entityType === MTT.ENTITY_TYPES.STORAGE
    const current = isStorage
      ? (getStorageData(this.actor)?.storage?.img ?? this.actor.img ?? "icons/svg/chest.svg")
      : (getMerchantData(this.actor)?.shop?.img ?? "icons/svg/hanging-sign.svg")
    const FilePickerApp = foundry.applications.apps.FilePicker.implementation
    const picker = new FilePickerApp({
      type: "image",
      current,
      callback: async (path) => {
        if (!path) return
        if (isStorage) {
          await updateStorageData(this.actor, { storage: { img: path } })
        } else {
          await updateMerchantData(this.actor, { shop: { img: path } })
        }
        this.render()
      }
    })

    picker.browse()
  }

  static async #onEditManagerImage(event) {
    event.preventDefault()

    if (!this.#canModifyMerchant()) return

    const current = getMerchantData(this.actor)?.manager?.img ?? this.actor.img ?? "icons/svg/mystery-man.svg"
    const FilePickerApp = foundry.applications.apps.FilePicker.implementation
    const picker = new FilePickerApp({
      type: "image",
      current,
      callback: async (path) => {
        if (!path) return
        await updateMerchantData(this.actor, { manager: { img: path } })
        this.render()
      }
    })

    picker.browse()
  }

  static async #onRollNegotiation(event) {
    event.preventDefault()

    const formula = String(getMerchantData(this.actor)?.trade?.negotiationFormula ?? "").trim()

    if (!formula) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.emptyNegotiationFormula"))
      return
    }

    const rollFormula = formula.replace(/^\/roll\s+/i, "").trim()

    if (!rollFormula || rollFormula.startsWith("/")) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidNegotiationFormula"))
      return
    }

    try {
      const roll = await new Roll(rollFormula).evaluate()
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: game.i18n.localize("mtt.configuration.negotiationFormula")
      })
    } catch {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidNegotiationFormula"))
    }
  }

  static #onSelectTab(event, target) {
    event.preventDefault()

    const tab = target.dataset.tab
    if (!tab || tab === "sessions") return

    const permissions = getMerchantPermissions(this.actor, { user: game.user })
    const entityType = getMTTEntityType(this.actor) || MTT.ENTITY_TYPES.MERCHANT
    const isStorage = entityType === MTT.ENTITY_TYPES.STORAGE
    if (tab === "services" && isStorage) return
    if (tab === "configuration" && !isStorage && !permissions.canViewConfigTab) return

    this.#activeTab = tab
    this.render()
  }

  static #onSortJournal(event, target) {
    event.preventDefault()

    const key = target.dataset.sortKey
    if (!["date", "buyer", "status", "total"].includes(key)) return

    const direction = this.#journalSort.key === key && this.#journalSort.direction === "asc" ? "desc" : "asc"
    this.#journalSort = { key, direction }
    this.render()
  }

  // ─── Field change handlers ────────────────────────────────────────────────

  async #onProductFieldChange(event) {
    const target = event.currentTarget

    if (!this.#canModifyMerchant()) return

    const product = this.#getProductFromEvent(target)
    if (!product) return

    const field = target.dataset.mttProductField

    if (field === "name") {
      const name = String(target.value ?? "").trim() || product.name
      await updateCatalogProduct(this.actor, product.id, { name, isCommerciallyModified: true }, { render: false })
      return
    }

    if (field === "quantity") {
      const raw = target.value?.trim()
      if (raw === "") {
        await updateCatalogProduct(this.actor, product.id, { quantity: null }, { render: false })
        return
      }
      const qty = Number(raw)
      if (!Number.isFinite(qty) || qty < 0) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidQuantity"))
        target.value = product.quantity ?? ""
        return
      }
      await updateCatalogProduct(this.actor, product.id, { quantity: qty }, { render: false })
      return
    }

    if (field === "deliveryQuantityPerLot") {
      const raw = target.value?.trim()
      if (raw === "") {
        await updateCatalogProduct(this.actor, product.id, { deliveryQuantityPerLot: null }, { render: false })
        return
      }
      const qty = Number(raw)
      if (!Number.isFinite(qty) || qty < 1) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidQuantity"))
        target.value = product.deliveryQuantityPerLot ?? ""
        return
      }
      await updateCatalogProduct(this.actor, product.id, { deliveryQuantityPerLot: Math.floor(qty) }, { render: false })
      return
    }

    if (field === "priceValue") {
      const rawValue = Number(target.value)
      if (!Number.isFinite(rawValue) || rawValue < 0) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidPrice"))
        target.value = product.priceValue ?? 0
        return
      }
      await updateCatalogProduct(
        this.actor,
        product.id,
        { priceValue: rawValue, isCommerciallyModified: true },
        { render: false }
      )
      return
    }

    if (field === "priceCurrency") {
      const selectedValue = target.value?.trim() ?? ""
      const isFreePriceCurrencyValue = isFreePriceCurrency(selectedValue)
      const effectiveCurrency = isFreePriceCurrencyValue ? "" : selectedValue
      await updateCatalogProduct(
        this.actor,
        product.id,
        {
          priceCurrency: effectiveCurrency,
          hasFreePrice: isFreePriceCurrencyValue,
          isCommerciallyModified: true
        },
        { render: false }
      )
      return
    }

    if (field === "category") {
      this.#saveScrollPositions()
      await updateCatalogProduct(this.actor, product.id, { category: target.value?.trim() ?? "" })
      return
    }

    if (["secretName", "secretPrice", "secretCurrency", "secretDescription"].includes(field)) {
      this.#saveScrollPositions()
      await updateCatalogProduct(this.actor, product.id, {
        [field]: target.value?.trim() ?? "",
        isCommerciallyModified: true
      })
      return
    }

    if (field === "minimumPriceValue") {
      const rawValue = Number(target.value)
      if (!Number.isFinite(rawValue) || rawValue < 0) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidPrice"))
        target.value = product.minimumPriceValue ?? 0
        return
      }
      this.#saveScrollPositions()
      await updateCatalogProduct(this.actor, product.id, { minimumPriceValue: rawValue })
    }
  }

  async #onMerchantFieldChange(event) {
    const target = event.currentTarget

    if (!this.#canModifyMerchant()) return

    const updateData = this.#getMerchantFieldUpdateData(target)
    if (!updateData) return

    await this.actor.update(updateData)
  }

  #getMerchantFieldUpdateData(target) {
    const field = target?.dataset?.mttMerchantField
    if (!field) return null

    if (field === "shop.name") {
      const name = target.value?.trim() ?? ""
      const entityType = getMTTEntityType(this.actor) || MTT.ENTITY_TYPES.MERCHANT

      if (entityType === MTT.ENTITY_TYPES.STORAGE) {
        const current = getStorageData(this.actor)?.storage?.name ?? ""
        if (name === current) return null

        return { [getStorageFlagPath("storage.name")]: name }
      }

      const current = getMerchantData(this.actor)?.shop?.name ?? ""
      if (name === current) return null

      return { [getMerchantFlagPath("shop.name")]: name }
    }

    if (field === "manager.displayName") {
      const displayName = target.value?.trim() ?? ""
      const currentDisplayName = getMerchantData(this.actor)?.manager?.displayName ?? ""
      if (displayName === currentDisplayName) return null

      return {
        [getMerchantFlagPath("manager.mode")]: "text",
        [getMerchantFlagPath("manager.displayName")]: displayName
      }
    }

    return null
  }

  async #saveMerchantTextFieldsFromDom() {
    if (!this.isEditable || getMerchantSheetLockedState(this.actor)) return

    const updateData = {}

    this.element.querySelectorAll("[data-mtt-merchant-field]").forEach((input) => {
      const fieldUpdateData = this.#getMerchantFieldUpdateData(input)
      if (!fieldUpdateData) return
      Object.assign(updateData, fieldUpdateData)
    })

    if (Object.keys(updateData).length > 0) {
      await this.actor.update(updateData)
    }
  }

  async #saveMerchantConfigFieldsFromDom() {
    if (!this.isEditable || getMerchantSheetLockedState(this.actor)) return

    const NUMERIC_FIELDS = ["trade.buyPercent", "trade.sellPercent", "trade.serviceSellPercent"]
    const changes = {}

    this.element.querySelectorAll("[data-mtt-merchant-config-field]").forEach((input) => {
      const field = input.dataset.mttMerchantConfigField
      if (!field) return

      if (NUMERIC_FIELDS.includes(field)) {
        const value = Number(input.value)
        if (Number.isFinite(value) && value >= 0) {
          foundry.utils.setProperty(changes, field, value)
        }
      } else {
        foundry.utils.setProperty(changes, field, String(input.value ?? "").trim())
      }
    })

    if (Object.keys(changes).length > 0) {
      await updateMerchantData(this.actor, changes)
    }
  }

  async #onMerchantConfigFieldChange(event) {
    const target = event.currentTarget

    if (!this.#canModifyMerchant()) return

    const field = target.dataset.mttMerchantConfigField
    if (!field) return

    if (["trade.buyPercent", "trade.sellPercent", "trade.serviceSellPercent"].includes(field)) {
      const value = Number(target.value)

      if (!Number.isFinite(value) || value < 0) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidTradePercent"))
        target.value = foundry.utils.getProperty(getMerchantData(this.actor) ?? {}, field) ?? 0
        return
      }

      const changes = {}
      foundry.utils.setProperty(changes, field, value)
      await updateMerchantData(this.actor, changes)
      return
    }

    const changes = {}
    foundry.utils.setProperty(changes, field, target.value?.trim() ?? "")
    await updateMerchantData(this.actor, changes)
  }

  async #onWalletCurrencyChange(event) {
    const target = event.currentTarget

    if (!this.#canModifyMerchant()) return

    const currencyId = target.dataset.mttWalletCurrency
    if (!currencyId) return

    const entityType = getMTTEntityType(this.actor) || MTT.ENTITY_TYPES.MERCHANT
    const isStorage = entityType === MTT.ENTITY_TYPES.STORAGE
    const wallet = isStorage ? getStorageData(this.actor)?.wallet : getMerchantData(this.actor)?.wallet
    const currentCurrencies = wallet?.currencies ?? {}
    const amount = Number(target.value)

    if (!Number.isFinite(amount) || amount < 0) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidWalletAmount"))
      target.value = currentCurrencies[currencyId] ?? 0
      return
    }

    const currencies = foundry.utils.deepClone(currentCurrencies)
    currencies[currencyId] = amount

    if (isStorage) {
      await updateStorageData(this.actor, { wallet: { currencies } })
      return
    }

    await updateMerchantData(this.actor, { wallet: { currencies } })
  }

  // ─── Free price toggle handlers ───────────────────────────────────────────

  static async #onToggleProductFreePrice(event, target) {
    event.preventDefault()

    if (!this.#canModifyMerchant()) return

    const product = this.#getProductFromEvent(target)
    if (!product) return

    this.#saveScrollPositions()
    await updateCatalogProduct(this.actor, product.id, { hasFreePrice: !product.hasFreePrice })
    this.render()
  }

  static async #onToggleServiceFreePrice(event, target) {
    event.preventDefault()

    if (!this.#canModifyMerchant()) return

    const serviceId = target.closest("[data-service-id]")?.dataset.serviceId
    if (!serviceId) return

    const entries = foundry.utils.deepClone(getMerchantData(this.actor)?.catalog?.services ?? [])
    const serviceIndex = entries.findIndex((s) => s.id === serviceId)
    if (serviceIndex === -1) return

    entries[serviceIndex].hasFreePrice = !entries[serviceIndex].hasFreePrice
    entries[serviceIndex].isCommerciallyModified = true

    this.#saveScrollPositions()
    await updateMerchantData(this.actor, { catalog: { services: entries } })
    this.render()
  }

  // ─── Service CRUD ─────────────────────────────────────────────────────────

  static async #onCreateService(event, _target) {
    event.preventDefault()

    if (!this.isEditable || getMerchantSheetLockedState(this.actor)) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.sheetLocked"))
      return
    }

    const entries = foundry.utils.deepClone(getMerchantData(this.actor)?.catalog?.services ?? [])

    const newId = foundry.utils.randomID()
    const referenceCurrency = getReferenceCurrency()
    const referenceCurrencyKey = String(
      referenceCurrency?.abbreviation ?? referenceCurrency?.id ?? referenceCurrency?.key ?? ""
    ).trim()
    const newService = {
      id: newId,
      ...foundry.utils.deepClone(MTT.SERVICE_DEFAULTS),
      name: game.i18n.localize("mtt.services.new"),
      priceCurrency: referenceCurrencyKey
    }

    entries.push(newService)

    await updateMerchantData(this.actor, { catalog: { services: entries } })
  }

  static async #onAddServiceToSession(event, target) {
    event.preventDefault()

    if (!this.#requireMerchantPermission("canInteractWithSession")) return

    const service = this.#getServiceFromEvent(target)
    if (!service || service.isHidden) return
    if (!this.#requireSelectedSessionForItemAddition()) return

    const basePriceValue =
      Number.isFinite(Number(service.priceValue)) && Number(service.priceValue) >= 0
        ? Number(service.priceValue)
        : MTT.SERVICE_DEFAULTS.priceValue
    const priceCurrency = service.priceCurrency?.trim() ?? MTT.SERVICE_DEFAULTS.priceCurrency
    const quantity = service.quantity
    const availableQuantity = normalizeFiniteQuantity(quantity)
    const hasFreePrice = isFreePriceService(service)
    const rates = this.#getEffectiveRatesForSession()
    const displayPriceValue = hasFreePrice ? 0 : adjustPriceValue(basePriceValue, rates.serviceSellPercent)
    const minimumPriceValue =
      Number.isFinite(Number(service.minimumPriceValue)) && Number(service.minimumPriceValue) >= 0
        ? Number(service.minimumPriceValue)
        : 0

    const referenceCurrency = getReferenceCurrency()
    const referenceCurrencyLabel = referenceCurrency
      ? String(referenceCurrency.abbreviation ?? referenceCurrency.name ?? "").trim()
      : ""

    const sessionCurrency = hasFreePrice ? referenceCurrencyLabel || priceCurrency : priceCurrency

    const dialogData = await openSessionPreparationDialog({
      title: game.i18n.localize("mtt.sessions.dialog.serviceTitle"),
      name: service.name,
      priceLabel: hasFreePrice
        ? game.i18n.localize("mtt.price.freePrice")
        : formatPriceLabel(displayPriceValue, priceCurrency),
      availableQuantity,
      includeProposedPrice: !hasFreePrice,
      hasFreePrice,
      referenceCurrencyLabel
    })
    if (!dialogData) return

    const hasProposedPrice = dialogData.proposedPrice !== ""
    const unitPriceValue = hasFreePrice || hasProposedPrice ? Number(dialogData.proposedPrice) : displayPriceValue

    const requestedTotal =
      dialogData.quantity +
      this.#getSessionBuyerQuantity({
        type: "service",
        sourceId: service.id,
        unitPriceValue,
        priceCurrency: sessionCurrency
      })

    if (Number.isFinite(availableQuantity) && availableQuantity >= 0 && requestedTotal > availableQuantity) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.notEnoughQuantity"))
      return
    }

    const requiresApproval = Boolean(service.requiresApproval)
    const priceWasChanged = Math.abs(Number(unitPriceValue) - Number(displayPriceValue)) > 0.0001
    const shouldNegotiate = requiresApproval || hasFreePrice || priceWasChanged

    if (shouldNegotiate) {
      const negotiation = await this.#addSessionNegotiation(
        this.#createNegotiation({
          side: "buyer",
          type: "service",
          sourceId: service.id,
          sourceUuid: service.sourceUuid,
          name: service.name,
          img: service.sourceImg,
          quantity: dialogData.quantity,
          unitPriceValue,
          priceCurrency: sessionCurrency,
          referenceUnitPriceValue: displayPriceValue,
          referencePriceCurrency: priceCurrency,
          isFreePrice: hasFreePrice,
          minimumPriceValue: hasFreePrice ? minimumPriceValue : null
        })
      )
      if (!negotiation) return

      this.render()
      return
    }

    const sessionItem = await this.#addSessionBuyerItem({
      type: "service",
      sourceId: service.id,
      name: service.name,
      img: service.sourceImg,
      quantity: dialogData.quantity,
      availableQuantity,
      hasLimitedQuantity: !isUnlimitedQuantity(quantity) && availableQuantity !== null,
      unitPriceValue,
      priceCurrency: sessionCurrency,
      sourceLabel: game.i18n.localize("mtt.sessions.item.service"),
      isFreePrice: hasFreePrice,
      minimumPriceValue: hasFreePrice ? minimumPriceValue : null
    })
    if (!sessionItem) return

    this.render()
  }

  static async #onDeleteService(event, target) {
    event.preventDefault()

    if (!this.isEditable || getMerchantSheetLockedState(this.actor)) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.sheetLocked"))
      return
    }

    const serviceId = target.closest("[data-service-id]")?.dataset.serviceId
    if (!serviceId) return

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: game.i18n.localize("mtt.services.deleteTitle")
      },
      content: await this.#renderConfirmDialogContent({ message: game.i18n.localize("mtt.services.deleteContent") }),
      yes: {
        label: game.i18n.localize("mtt.actions.delete")
      },
      no: {
        label: game.i18n.localize("mtt.actions.cancel")
      }
    })

    if (!confirmed) return

    const entries = foundry.utils.deepClone(getMerchantData(this.actor)?.catalog?.services ?? [])
    const index = entries.findIndex((s) => s.id === serviceId)

    if (index !== -1) {
      entries.splice(index, 1)
      await updateMerchantData(this.actor, { catalog: { services: entries } })
    }
  }

  static async #onToggleServiceExpanded(event, target) {
    event.preventDefault()

    if (!this.isEditable) return

    const serviceId = target.closest("[data-service-id]")?.dataset.serviceId
    if (!serviceId) return

    const entries = foundry.utils.deepClone(getMerchantData(this.actor)?.catalog?.services ?? [])
    const index = entries.findIndex((s) => s.id === serviceId)
    if (index === -1) return

    entries[index].isExpanded = !entries[index].isExpanded

    this.#saveScrollPositions()
    await updateMerchantData(this.actor, { catalog: { services: entries } })

    this.render()
  }

  static async #onToggleCatalogItemVisibility(event, target) {
    event.preventDefault()

    if (!this.isEditable) return

    const catalogKind = target.dataset.catalogKind ?? ""
    if (catalogKind === "product") {
      const product = this.#getProductFromEvent(target)
      if (!product) return

      this.#saveScrollPositions()
      await updateCatalogProduct(this.actor, product.id, { isHidden: !product.isHidden })
      this.render()
      return
    }

    if (catalogKind !== "service") return
    const serviceId = target.closest("[data-service-id]")?.dataset.serviceId
    if (!serviceId) return

    const entries = foundry.utils.deepClone(getMerchantData(this.actor)?.catalog?.services ?? [])
    const index = entries.findIndex((s) => s.id === serviceId)
    if (index === -1) return

    entries[index].isHidden = !entries[index].isHidden

    this.#saveScrollPositions()
    await updateMerchantData(this.actor, { catalog: { services: entries } })

    this.render()
  }

  static async #onToggleServiceApproval(event, target) {
    event.preventDefault()

    if (!this.isEditable) return

    const serviceId = target.closest("[data-service-id]")?.dataset.serviceId
    if (!serviceId) return

    const entries = foundry.utils.deepClone(getMerchantData(this.actor)?.catalog?.services ?? [])
    const index = entries.findIndex((s) => s.id === serviceId)
    if (index === -1) return

    entries[index].requiresApproval = !entries[index].requiresApproval

    this.#saveScrollPositions()
    await updateMerchantData(this.actor, { catalog: { services: entries } })

    this.render()
  }

  static async #onToggleProductApproval(event, target) {
    event.preventDefault()

    if (!this.isEditable) return

    const product = this.#getProductFromEvent(target)
    if (!product) return

    this.#saveScrollPositions()
    await updateCatalogProduct(this.actor, product.id, { requiresApproval: !product.requiresApproval })
    this.render()
  }

  async #onServiceFieldChange(event) {
    const target = event.currentTarget

    if (!this.#canModifyMerchant()) return

    const serviceId = target.closest("[data-service-id]")?.dataset.serviceId
    if (!serviceId) return

    const entries = foundry.utils.deepClone(getMerchantData(this.actor)?.catalog?.services ?? [])
    const serviceIndex = entries.findIndex((s) => s.id === serviceId)

    if (serviceIndex === -1) return

    const field = target.dataset.mttServiceField

    if (field === "name") {
      const name = target.value?.trim()
      if (name) {
        entries[serviceIndex].name = name
        entries[serviceIndex].isCommerciallyModified = true
      } else {
        target.value = entries[serviceIndex].name
        return
      }
    }

    if (field === "description") {
      entries[serviceIndex].description = this.#htmlToPlainText(target.value?.trim() ?? "")
      entries[serviceIndex].isCommerciallyModified = true
    }

    if (field === "priceValue") {
      const priceValue = Number(target.value)

      if (!Number.isFinite(priceValue) || priceValue < 0) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidServicePrice"))
        target.value = entries[serviceIndex].priceValue ?? MTT.SERVICE_DEFAULTS.priceValue
        return
      }

      entries[serviceIndex].priceValue = priceValue
      entries[serviceIndex].isCommerciallyModified = true
    }

    if (field === "priceCurrency") {
      const selectedValue = target.value?.trim() ?? ""
      if (isFreePriceCurrency(selectedValue)) {
        entries[serviceIndex].hasFreePrice = true
        entries[serviceIndex].isCommerciallyModified = true
      } else {
        entries[serviceIndex].priceCurrency = selectedValue
        entries[serviceIndex].hasFreePrice = false
        entries[serviceIndex].isCommerciallyModified = true
      }
    }

    if (field === "quantity") {
      const quantity = target.value?.trim()

      if (quantity === "") {
        entries[serviceIndex].quantity = null
      } else {
        const quantityNum = Number(quantity)

        if (!Number.isFinite(quantityNum) || quantityNum < 0) {
          ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidServiceQuantity"))
          target.value = entries[serviceIndex].quantity ?? ""
          return
        }

        entries[serviceIndex].quantity = quantityNum
      }
    }

    if (field === "minimumPriceValue") {
      const value = Number(target.value)

      if (!Number.isFinite(value) || value < 0) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidPrice"))
        target.value = entries[serviceIndex].minimumPriceValue ?? MTT.SERVICE_DEFAULTS.minimumPriceValue
        return
      }

      entries[serviceIndex].minimumPriceValue = value
      entries[serviceIndex].isCommerciallyModified = true
    }

    await updateMerchantData(this.actor, { catalog: { services: entries } })
  }
}
