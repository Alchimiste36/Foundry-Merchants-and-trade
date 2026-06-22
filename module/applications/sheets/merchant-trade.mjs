import { MTT } from "../../config/constants.mjs"
import { getCurrencies } from "../../config/settings.mjs"
import {
  normalizeCurrencyKey,
  normalizeCurrencyText,
  formatCurrencyLabel,
  formatPriceLabel,
  createCheckMessage,
  parseQuantityValue,
  isUnlimitedQuantity,
  isFreePriceService,
  normalizeFiniteQuantity,
  getReferenceSessionCurrency,
  getConfiguredItemQuantity,
  getConfiguredItemMaxQuantity,
  normalizeMaxQuantity,
  normalizeItemQuantity,
  getAvailableStackSpace,
  getDeliveryStackingConfig,
  getMttSourceUuid,
  toItemOnlyUuid,
  getDeliveredItemMergeMode,
  roundToSmallestCurrencyUnit,
  escapeHTML,
  getModuleSetting,
  hasSecretValue,
  productHasSecretInfo,
  normalizeEffectiveDeliveryQuantityPerLot,
  formatProductNameWithLotQuantity
} from "./merchant-utils.mjs"
import {
  getAutomaticItemCategory,
  getOrCreateAutomaticProductCategory,
  getItemAvailableQuantity
} from "./merchant-catalog.mjs"
import { getMerchantData, getMerchantFlagPath, updateMerchantData } from "../../documents/merchant-flags.mjs"
import {
  getCatalogProduct,
  updateCatalogProduct,
  addCatalogProduct,
  buildCatalogProductFromItem,
  isMerchantProductItem,
  getMerchantProductFlags
} from "../../documents/merchant-products.mjs"
import {
  getMTTEntityType,
  isMTTStorage,
  getStorageItemFlags,
  getStorageData,
  getStorageFlagPath
} from "../../documents/storage-flags.mjs"

// ─── Session normalization ────────────────────────────────────────────────────

export function normalizeSessionItem(item) {
  const quantity = Number(item.quantity)
  const unitPriceValue = Number(item.unitPriceValue)
  const availableQuantity = Number(item.availableQuantity)
  const hasLimitedQuantity =
    Boolean(item.hasLimitedQuantity) && Number.isFinite(availableQuantity) && availableQuantity >= 0
  const normalizedQuantity = Number.isFinite(quantity) && quantity >= 0 ? quantity : 1
  const normalizedUnitPrice = Number.isFinite(unitPriceValue) && unitPriceValue >= 0 ? unitPriceValue : 0
  const normalizedDeliveryQuantityPerLot = normalizeEffectiveDeliveryQuantityPerLot(item.deliveryQuantityPerLot)
  const type = ["product", "service", "item", "money"].includes(item.type) ? item.type : "product"
  const referenceCurrency = getReferenceSessionCurrency()
  const referenceCurrencyLabel = String(
    referenceCurrency?.abbreviation ?? referenceCurrency?.id ?? referenceCurrency?.name ?? ""
  ).trim()

  return {
    id: item.id || foundry.utils.randomID(),
    type,
    sourceKind: String(item.sourceKind ?? "").trim(),
    sourceUuid: item.sourceUuid ?? "",
    sourceActorUuid: item.sourceActorUuid ?? "",
    sourceId: item.sourceId ?? "",
    name: item.name ?? "",
    img: item.img ?? "",
    quantity: type === "money" ? 1 : normalizedQuantity,
    deliveryQuantityPerLot:
      item.type === "product" && normalizedDeliveryQuantityPerLot > 1 ? normalizedDeliveryQuantityPerLot : null,
    availableQuantity: hasLimitedQuantity ? availableQuantity : null,
    hasLimitedQuantity,
    unitPriceValue: normalizedUnitPrice,
    priceCurrency: type === "money" ? referenceCurrencyLabel : String(item.priceCurrency ?? "").trim(),
    totalPriceValue: Number(((type === "money" ? 1 : normalizedQuantity) * normalizedUnitPrice).toFixed(2)),
    sourceLabel: item.sourceLabel ?? "",
    proposedUnitPriceValue:
      item.proposedUnitPriceValue !== null &&
      item.proposedUnitPriceValue !== undefined &&
      Number.isFinite(Number(item.proposedUnitPriceValue))
        ? Number(item.proposedUnitPriceValue)
        : null,
    isFromActor: Boolean(item.isFromActor),
    isFreePrice: Boolean(item.isFreePrice),
    minimumPriceValue:
      item.minimumPriceValue !== null &&
      item.minimumPriceValue !== undefined &&
      Number.isFinite(Number(item.minimumPriceValue)) &&
      Number(item.minimumPriceValue) >= 0
        ? Number(item.minimumPriceValue)
        : null
  }
}

export function normalizeNegotiationOffer(offer = {}) {
  const quantity = Number(offer.quantity)
  const unitPriceValue = Number(offer.unitPriceValue)
  const totalPriceValue = Number(offer.totalPriceValue)
  const percentOfReference = Number(offer.percentOfReference)

  return {
    id: offer.id || foundry.utils.randomID(),
    side: ["buyer", "merchant"].includes(offer.side) ? offer.side : "buyer",
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    unitPriceValue: Number.isFinite(unitPriceValue) && unitPriceValue >= 0 ? unitPriceValue : 0,
    totalPriceValue: Number.isFinite(totalPriceValue) && totalPriceValue >= 0 ? totalPriceValue : 0,
    percentOfReference: Number.isFinite(percentOfReference) && percentOfReference >= 0 ? percentOfReference : 100,
    status: ["draft", "submitted"].includes(offer.status) ? offer.status : "submitted",
    createdAt: offer.createdAt || new Date().toISOString()
  }
}

export function normalizeSessionNegotiation(negotiation = {}) {
  const referenceUnitPriceValue = Number(negotiation.referenceUnitPriceValue)
  const proposedUnitPriceValue = Number(negotiation.proposedUnitPriceValue)
  const minimumPriceValue = Number(negotiation.minimumPriceValue)

  return {
    id: negotiation.id || foundry.utils.randomID(),
    side: ["buyer", "seller"].includes(negotiation.side) ? negotiation.side : "buyer",
    type: ["product", "service", "item"].includes(negotiation.type) ? negotiation.type : "product",
    sourceId: String(negotiation.sourceId ?? "").trim(),
    sourceKind: String(negotiation.sourceKind ?? "").trim(),
    sourceUuid: String(negotiation.sourceUuid ?? "").trim(),
    sourceActorUuid: String(negotiation.sourceActorUuid ?? "").trim(),
    name: String(negotiation.name ?? "").trim(),
    img: negotiation.img ?? "",
    priceCurrency: String(negotiation.priceCurrency ?? "").trim(),
    referenceUnitPriceValue:
      Number.isFinite(referenceUnitPriceValue) && referenceUnitPriceValue >= 0 ? referenceUnitPriceValue : 0,
    proposedUnitPriceValue:
      Number.isFinite(proposedUnitPriceValue) && proposedUnitPriceValue >= 0 ? proposedUnitPriceValue : null,
    isFreePrice: Boolean(negotiation.isFreePrice),
    minimumPriceValue:
      negotiation.minimumPriceValue !== null &&
      negotiation.minimumPriceValue !== undefined &&
      Number.isFinite(minimumPriceValue) &&
      minimumPriceValue >= 0
        ? minimumPriceValue
        : null,
    status: ["active", "accepted", "refused"].includes(negotiation.status) ? negotiation.status : "active",
    currentTurn: ["buyer", "merchant"].includes(negotiation.currentTurn) ? negotiation.currentTurn : "merchant",
    offers: Array.isArray(negotiation.offers)
      ? negotiation.offers.map((offer) => normalizeNegotiationOffer(offer))
      : [],
    createdAt: negotiation.createdAt || new Date().toISOString(),
    updatedAt: negotiation.updatedAt || new Date().toISOString()
  }
}

export function normalizeSession(session) {
  const normalizedStatus = ["active", "pending", "validated", "refused", "submitted"].includes(session.status)
    ? session.status
    : session.isSubmitted
      ? "submitted"
      : "active"

  return {
    id: session.id || foundry.utils.randomID(),
    status: normalizedStatus,
    isSubmitted: normalizedStatus === "submitted",
    label: session.label || game.i18n.localize("mtt.sessions.newLabel"),
    actorUuid: session.actorUuid ?? "",
    actorName: session.actorName ?? "",
    userId: session.userId ?? "",
    userName: session.userName ?? "",
    buyerItems: Array.isArray(session.buyerItems) ? session.buyerItems.map((item) => normalizeSessionItem(item)) : [],
    sellerItems: Array.isArray(session.sellerItems)
      ? session.sellerItems.map((item) => normalizeSessionItem(item))
      : [],
    negotiations: Array.isArray(session.negotiations)
      ? session.negotiations.map((negotiation) => normalizeSessionNegotiation(negotiation))
      : [],
    createdAt: session.createdAt || new Date().toISOString(),
    updatedAt: session.updatedAt || new Date().toISOString()
  }
}

export function buildSessionData(client = null) {
  const now = new Date().toISOString()
  const actorName = client?.actorName ?? ""

  return {
    id: foundry.utils.randomID(),
    status: "active",
    isSubmitted: false,
    label: actorName
      ? game.i18n.format("mtt.sessions.sessionForActor", { name: actorName })
      : game.i18n.localize("mtt.sessions.newLabel"),
    actorUuid: client?.actorUuid ?? "",
    actorName,
    userId: client?.userId ?? "",
    userName: client?.userName ?? "",
    buyerItems: [],
    sellerItems: [],
    negotiations: [],
    createdAt: now,
    updatedAt: now
  }
}

export function getSessions(actor) {
  return foundry.utils.deepClone(getMerchantData(actor)?.sessions?.entries ?? [])
}

// ─── Session item helpers ─────────────────────────────────────────────────────

export function recalculateSessionItemTotal(item) {
  const quantity = Number(item.quantity)
  const unitPriceValue = Number(item.unitPriceValue)

  item.totalPriceValue =
    Number.isFinite(quantity) && Number.isFinite(unitPriceValue) ? Number((quantity * unitPriceValue).toFixed(2)) : 0
}

export function setSessionItemQuantity(item, quantity) {
  item.quantity = Number(Number(quantity).toFixed(2))
  recalculateSessionItemTotal(item)
}

export function getSessionItemsForSide(session, side) {
  return side === "seller" ? session.sellerItems : session.buyerItems
}

export function removeSessionItemById(session, itemId, side = "") {
  const initialBuyerCount = session.buyerItems.length
  const initialSellerCount = session.sellerItems.length

  if (side === "buyer") {
    session.buyerItems = session.buyerItems.filter((item) => item.id !== itemId)
  } else if (side === "seller") {
    session.sellerItems = session.sellerItems.filter((item) => item.id !== itemId)
  } else {
    session.buyerItems = session.buyerItems.filter((item) => item.id !== itemId)
    session.sellerItems = session.sellerItems.filter((item) => item.id !== itemId)
  }

  return initialBuyerCount !== session.buyerItems.length || initialSellerCount !== session.sellerItems.length
}

function getSellerSourceItemFromSessionItem(item) {
  const sourceActorUuid = String(item?.sourceActorUuid ?? "").trim()
  const sourceId = String(item?.sourceId ?? "").trim()
  if (!sourceActorUuid || !sourceId) return null

  const sourceActor =
    game.actors?.find?.((actor) => actor.uuid === sourceActorUuid) ??
    game.actors?.get?.(sourceActorUuid.replace(/^Actor\./, "")) ??
    null
  const sourceItem = sourceActor?.items?.get(sourceId) ?? null
  return sourceItem?.documentName === "Item" ? sourceItem : null
}

function getSellerSourceAvailableQuantity(sourceItem, fallbackItem = null) {
  if (sourceItem && isMerchantProductItem(sourceItem)) {
    const productFlags = getMerchantProductFlags(sourceItem)
    if (isUnlimitedQuantity(productFlags.quantity)) return null

    const productQuantity = normalizeFiniteQuantity(productFlags.quantity)
    if (productQuantity !== null) return productQuantity
  }

  if (sourceItem?.documentName === "Item") return getItemAvailableQuantity(sourceItem)

  const fallbackQuantity = Number(fallbackItem?.availableQuantity)
  return Number.isFinite(fallbackQuantity) && fallbackQuantity >= 0 ? fallbackQuantity : null
}

function syncSessionItemAvailability(actor, item) {
  if (!item) return

  if (item.type === "product") {
    const product = getCatalogProduct(actor, item.sourceId)
    const quantity = product?.quantity
    const availableQuantity = normalizeFiniteQuantity(quantity)
    const hasLimitedQuantity = !isUnlimitedQuantity(quantity) && availableQuantity !== null

    item.availableQuantity = hasLimitedQuantity ? availableQuantity : null
    item.hasLimitedQuantity = hasLimitedQuantity
    return
  }

  if (item.type === "service") {
    const service = getMerchantData(actor)?.catalog?.services?.find((entry) => entry.id === item.sourceId)
    const quantity = service?.quantity
    const availableQuantity = Number(quantity)
    const hasLimitedQuantity =
      quantity !== null &&
      quantity !== undefined &&
      quantity !== "" &&
      Number.isFinite(availableQuantity) &&
      availableQuantity >= 0

    item.availableQuantity = hasLimitedQuantity ? availableQuantity : null
    item.hasLimitedQuantity = hasLimitedQuantity
    return
  }

  if (item.type === "item") {
    const sourceItem = getSellerSourceItemFromSessionItem(item)
    if (sourceItem && isMerchantProductItem(sourceItem)) {
      const productFlags = getMerchantProductFlags(sourceItem)
      const availableQuantity = normalizeFiniteQuantity(productFlags.quantity)
      const hasLimitedQuantity = !isUnlimitedQuantity(productFlags.quantity) && availableQuantity !== null

      item.availableQuantity = hasLimitedQuantity ? availableQuantity : null
      item.hasLimitedQuantity = hasLimitedQuantity
    }
  }
}

export function canAcceptSessionQuantity(actor, item, quantity) {
  syncSessionItemAvailability(actor, item)

  const requestedQuantity = Number(quantity)
  if (!Number.isFinite(requestedQuantity) || requestedQuantity < 0) return false
  if (!item.hasLimitedQuantity) return true

  const availableQuantity = Number(item.availableQuantity)
  if (!Number.isFinite(availableQuantity) || availableQuantity < 0) return true

  return requestedQuantity <= availableQuantity
}

// ─── Session totals and adjustments ──────────────────────────────────────────

function isSessionMoneyItem(item) {
  return item?.type === "money"
}

function prepareSessionTotals(items) {
  const totals = new Map()

  items.forEach((item) => {
    const currency = normalizeCurrencyKey(item.priceCurrency)
    const totalPriceValue = Number(item.totalPriceValue)
    if (!Number.isFinite(totalPriceValue) || totalPriceValue < 0) return

    totals.set(currency, (totals.get(currency) ?? 0) + totalPriceValue)
  })

  return Array.from(totals.entries()).map(([currency, totalPriceValue]) => {
    const roundedTotal = Number(totalPriceValue.toFixed(2))

    return {
      currency,
      currencyLabel: formatCurrencyLabel(currency === "__none" ? "" : currency),
      totalPriceValue: roundedTotal,
      totalPriceLabel: formatPriceLabel(roundedTotal, currency === "__none" ? "" : currency)
    }
  })
}

function prepareMoneyAdjustments(buyerTotals, sellerTotals) {
  const totalsByCurrency = new Map()

  buyerTotals.forEach((total) => {
    totalsByCurrency.set(total.currency, {
      currency: total.currency,
      buyer: Number(total.totalPriceValue) || 0,
      seller: 0
    })
  })

  sellerTotals.forEach((total) => {
    const existing = totalsByCurrency.get(total.currency) ?? {
      currency: total.currency,
      buyer: 0,
      seller: 0
    }
    existing.seller = Number(total.totalPriceValue) || 0
    totalsByCurrency.set(total.currency, existing)
  })

  return Array.from(totalsByCurrency.values())
    .map(({ currency, buyer, seller }) => {
      const difference = Number((buyer - seller).toFixed(2))
      if (difference === 0) return null

      const side = difference > 0 ? "seller" : "buyer"
      const amount = Math.abs(difference)
      const displayCurrency = currency === "__none" ? "" : currency

      return {
        id: `money-adjustment-${side}-${currency}`,
        side,
        currency,
        currencyLabel: formatCurrencyLabel(displayCurrency),
        amount,
        amountLabel: formatPriceLabel(amount, displayCurrency),
        label: game.i18n.localize("mtt.sessions.moneyAdjustment"),
        isMoneyAdjustment: true
      }
    })
    .filter(Boolean)
}

function getSessionStatusNotice(status) {
  if (status === "submitted") return game.i18n.localize("mtt.sessions.submittedNotice")
  if (status === "pending") return game.i18n.localize("mtt.sessions.pendingNotice")
  if (status === "validated") return game.i18n.localize("mtt.sessions.validatedNoTransfer")
  if (status === "refused") return game.i18n.localize("mtt.sessions.refusedNotice")
  return game.i18n.localize("mtt.sessions.activeNotice")
}

// ─── Session context preparation ─────────────────────────────────────────────

function prepareSessionCheckContext(sessionCheckResult) {
  if (!sessionCheckResult?.checked) {
    return {
      checked: false,
      canProceed: false,
      infos: [],
      warnings: [],
      errors: [],
      hasInfos: false,
      hasWarnings: false,
      hasErrors: false
    }
  }

  const infos = sessionCheckResult.infos ?? []
  const warnings = sessionCheckResult.warnings ?? []
  const errors = sessionCheckResult.errors ?? []

  return {
    checked: true,
    canProceed: Boolean(sessionCheckResult.canProceed),
    infos,
    warnings,
    errors,
    hasInfos: infos.length > 0,
    hasWarnings: warnings.length > 0,
    hasErrors: errors.length > 0
  }
}

function prepareSessionClientContext(session, accessClients) {
  const actorUuid = String(session?.actorUuid ?? "").trim()
  if (!actorUuid) {
    return {
      hasClient: false,
      actorUuid: "",
      actorName: "",
      actorImg: "",
      userName: "",
      isAuthorized: false,
      isUnauthorized: false
    }
  }

  const client =
    accessClients.find((entry) => entry.actorUuid === actorUuid) ??
    normalizeAccessClient({
      actorUuid,
      actorName: session.actorName ?? "",
      userId: session.userId ?? "",
      userName: session.userName ?? "",
      isAuthorized: false
    })

  return {
    hasClient: true,
    actorUuid: client.actorUuid,
    actorName: client.actorName || session.actorName || game.i18n.localize("mtt.access.noClient"),
    actorImg: client.actorImg,
    userName: client.userName || session.userName || "",
    isAuthorized: Boolean(client.isAuthorized),
    isUnauthorized: !client.isAuthorized
  }
}

function prepareNegotiationForDisplay(negotiation) {
  const offers = (negotiation.offers ?? []).map((offer) => ({
    ...offer,
    unitPriceLabel: formatPriceLabel(offer.unitPriceValue, negotiation.priceCurrency),
    totalPriceLabel: formatPriceLabel(offer.totalPriceValue, negotiation.priceCurrency),
    percentLabel: `${offer.percentOfReference} %`,
    isBuyerOffer: offer.side === "buyer",
    isMerchantOffer: offer.side === "merchant",
    sideClass:
      offer.side === "merchant" ? "mtt-merchant-negotiation-offer-merchant" : "mtt-merchant-negotiation-offer-buyer",
    sideLabel: game.i18n.localize(`mtt.sessions.negotiations.side.${offer.side}`)
  }))

  const lastOffer = offers.at(-1) ?? null
  const quantity = Number(lastOffer?.quantity ?? 1)
  const unitPriceValue = Number(lastOffer?.unitPriceValue ?? negotiation.referenceUnitPriceValue ?? 0)
  const referenceUnitPriceValue = Number(negotiation.referenceUnitPriceValue)
  const minimumPriceValue = Number(negotiation.minimumPriceValue)
  const hasMinimumPrice =
    negotiation.minimumPriceValue !== null &&
    negotiation.minimumPriceValue !== undefined &&
    Number.isFinite(minimumPriceValue) &&
    minimumPriceValue >= 0
  const draftQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1
  const draftUnitPriceValue = Number.isFinite(unitPriceValue) && unitPriceValue >= 0 ? unitPriceValue : 0
  const draftTotalPriceValue = Number((draftQuantity * draftUnitPriceValue).toFixed(2))
  const draftPercentOfReference =
    Number.isFinite(referenceUnitPriceValue) && referenceUnitPriceValue > 0
      ? Number(((draftUnitPriceValue / referenceUnitPriceValue) * 100).toFixed(2))
      : 100

  return {
    ...negotiation,
    offers,
    hasOffers: offers.length > 0,
    lastOffer,
    referenceUnitPriceLabel: formatPriceLabel(referenceUnitPriceValue, negotiation.priceCurrency),
    hasMinimumPrice,
    minimumPriceLabel: hasMinimumPrice ? formatPriceLabel(minimumPriceValue, negotiation.priceCurrency) : "",
    hasDraft: negotiation.status === "active",
    draft: {
      quantity: draftQuantity,
      unitPriceValue: draftUnitPriceValue,
      totalPriceValue: draftTotalPriceValue,
      percentOfReference: draftPercentOfReference
    },
    isBuyerTurn: negotiation.currentTurn === "buyer",
    isMerchantTurn: negotiation.currentTurn === "merchant",
    draftSideClass:
      negotiation.currentTurn === "buyer"
        ? "mtt-merchant-negotiation-offer-buyer"
        : "mtt-merchant-negotiation-offer-merchant",
    draftSideLabel: game.i18n.localize(`mtt.sessions.negotiations.side.${negotiation.currentTurn}`),
    isBuyerNegotiation: negotiation.side === "buyer",
    isSellerNegotiation: negotiation.side === "seller",
    isRefused: negotiation.status === "refused",
    isAccepted: negotiation.status === "accepted",
    isActive: negotiation.status === "active",
    canShowMerchantDecisionActions: negotiation.status === "active"
  }
}

export function prepareSessionContext(
  actor,
  { session, selectedClient, sessionCheckResult, accessClients, buyerActor }
) {
  const checkResult = prepareSessionCheckContext(sessionCheckResult)
  const buyerFortune = session ? prepareBuyerFortune(buyerActor) : []

  if (!session) {
    return {
      id: "",
      label: "",
      status: "",
      statusLabel: "",
      buyerItems: [],
      sellerItems: [],
      buyerNegotiations: [],
      sellerNegotiations: [],
      refusedNegotiations: [],
      hasBuyerItems: false,
      hasSellerItems: false,
      hasBuyerNegotiations: false,
      hasSellerNegotiations: false,
      hasRefusedNegotiations: false,
      buyerTotalByCurrency: [],
      sellerTotalByCurrency: [],
      hasBuyerTotals: false,
      hasSellerTotals: false,
      hasSession: false,
      hasSelectedClient: Boolean(selectedClient?.actorUuid),
      canEdit: false,
      isSubmitted: false,
      statusNotice: "",
      isActive: false,
      isPending: false,
      isValidated: false,
      isRefused: false,
      hasAnyItems: false,
      isBalanced: false,
      moneyAdjustments: [],
      buyerMoneyAdjustments: [],
      sellerMoneyAdjustments: [],
      hasMoneyAdjustments: false,
      hasBuyerLines: false,
      hasSellerLines: false,
      buyerFortune,
      client: {
        hasClient: Boolean(selectedClient?.actorUuid),
        actorUuid: selectedClient?.actorUuid ?? "",
        actorName: selectedClient?.actorName ?? "",
        actorImg: selectedClient?.actorImg ?? "",
        userName: selectedClient?.userName ?? "",
        isAuthorized: Boolean(selectedClient?.isAuthorized),
        isUnauthorized: Boolean(selectedClient?.actorUuid && !selectedClient?.isAuthorized)
      },
      checkResult
    }
  }

  const buyerItems = (session.buyerItems ?? []).map((item) => {
    syncSessionItemAvailability(actor, item)
    recalculateSessionItemTotal(item)

    const minimumPriceValue = Number(item.minimumPriceValue)
    const hasMinimumPrice = item.isFreePrice && Number.isFinite(minimumPriceValue) && minimumPriceValue > 0

    return {
      ...item,
      isMoney: item.type === "money",
      sourceLabel: item.sourceLabel || game.i18n.localize(`mtt.sessions.item.${item.type}`),
      unitPriceLabel: formatPriceLabel(item.unitPriceValue, item.priceCurrency),
      totalPriceLabel: formatPriceLabel(item.totalPriceValue, item.priceCurrency),
      availableQuantityLabel: Number.isFinite(Number(item.availableQuantity)) ? String(item.availableQuantity) : "",
      isFreePrice: Boolean(item.isFreePrice),
      hasMinimumPrice,
      minimumPriceLabel: hasMinimumPrice ? formatPriceLabel(minimumPriceValue, item.priceCurrency) : ""
    }
  })

  const sellerItems = (session.sellerItems ?? []).map((item) => {
    syncSessionItemAvailability(actor, item)
    recalculateSessionItemTotal(item)

    return {
      ...item,
      isMoney: item.type === "money",
      sourceLabel: item.sourceLabel || game.i18n.localize("mtt.sessions.item.object"),
      unitPriceLabel: formatPriceLabel(item.unitPriceValue, item.priceCurrency),
      totalPriceLabel: formatPriceLabel(item.totalPriceValue, item.priceCurrency),
      availableQuantityLabel: Number.isFinite(Number(item.availableQuantity)) ? String(item.availableQuantity) : ""
    }
  })

  const negotiations = Array.isArray(session.negotiations)
    ? session.negotiations.map((negotiation) => prepareNegotiationForDisplay(negotiation))
    : []
  const buyerNegotiations = negotiations.filter(
    (negotiation) => negotiation.side === "buyer" && negotiation.status === "active"
  )
  const sellerNegotiations = negotiations.filter(
    (negotiation) => negotiation.side === "seller" && negotiation.status === "active"
  )
  const refusedNegotiations = negotiations.filter((negotiation) => negotiation.status === "refused")

  const buyerTotalByCurrency = prepareSessionTotals(buyerItems)
  const sellerTotalByCurrency = prepareSessionTotals(sellerItems)
  const moneyAdjustments = prepareMoneyAdjustments(buyerTotalByCurrency, sellerTotalByCurrency)
  const buyerMoneyAdjustments = moneyAdjustments.filter((adjustment) => adjustment.side === "buyer")
  const sellerMoneyAdjustments = moneyAdjustments.filter((adjustment) => adjustment.side === "seller")
  const status = session.status ?? "active"
  const hasAnyItems = buyerItems.length > 0 || sellerItems.length > 0
  const client = prepareSessionClientContext(session, accessClients)
  const isSessionFinal = ["validated", "refused"].includes(status)

  return {
    id: session.id,
    label: session.label,
    status,
    statusLabel: game.i18n.localize(`mtt.sessions.status.${status}`),
    buyerItems,
    sellerItems,
    buyerNegotiations,
    sellerNegotiations,
    refusedNegotiations,
    hasBuyerItems: buyerItems.length > 0,
    hasSellerItems: sellerItems.length > 0,
    hasBuyerNegotiations: buyerNegotiations.length > 0,
    hasSellerNegotiations: sellerNegotiations.length > 0,
    hasRefusedNegotiations: refusedNegotiations.length > 0,
    buyerTotalByCurrency,
    sellerTotalByCurrency,
    hasBuyerTotals: buyerTotalByCurrency.length > 0,
    hasSellerTotals: sellerTotalByCurrency.length > 0,
    hasSession: true,
    canEdit: !isSessionFinal,
    isSubmitted: status === "submitted",
    isActive: status === "active",
    isPending: status === "pending",
    isValidated: status === "validated",
    isRefused: status === "refused",
    statusNotice: getSessionStatusNotice(status),
    hasAnyItems,
    moneyAdjustments,
    buyerMoneyAdjustments,
    sellerMoneyAdjustments,
    hasMoneyAdjustments: moneyAdjustments.length > 0,
    isBalanced: hasAnyItems && moneyAdjustments.length === 0,
    hasBuyerLines: buyerItems.length > 0 || buyerMoneyAdjustments.length > 0,
    hasSellerLines: sellerItems.length > 0 || sellerMoneyAdjustments.length > 0,
    buyerFortune,
    client,
    checkResult
  }
}

// ─── Access / client helpers ──────────────────────────────────────────────────

export function normalizeAccessClient(client) {
  const customRates =
    client.customRates && typeof client.customRates === "object"
      ? normalizeAccessClientCustomRates(client.customRates)
      : null

  return {
    actorUuid: String(client.actorUuid ?? "").trim(),
    actorId: String(client.actorId ?? "").trim(),
    actorName: String(client.actorName ?? "").trim(),
    actorImg: String(client.actorImg ?? "").trim(),
    actorType: String(client.actorType ?? "").trim(),
    userId: String(client.userId ?? "").trim(),
    userName: String(client.userName ?? "").trim(),
    isAuthorized: Boolean(client.isAuthorized),
    isFromPlayerCharacter: Boolean(client.isFromPlayerCharacter),
    customRates
  }
}

function normalizeOptionalClientRateValue(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null

  const number = Number(value)
  if (Number.isFinite(number) && number >= 0) return Number(number.toFixed(2))

  return null
}

function normalizeAccessClientCustomRates(customRates) {
  const productSellPercent = normalizeOptionalClientRateValue(customRates.productSellPercent)
  const serviceSellPercent = normalizeOptionalClientRateValue(customRates.serviceSellPercent)
  const itemBuyPercent = normalizeOptionalClientRateValue(customRates.itemBuyPercent)
  const note = String(customRates.note ?? "").trim()

  if (productSellPercent === null && serviceSellPercent === null && itemBuyPercent === null && !note) return null

  return {
    productSellPercent,
    serviceSellPercent,
    itemBuyPercent,
    note
  }
}

function normalizeClientRateValue(value, fallback) {
  if (value === null || value === undefined || String(value).trim() === "") return fallback

  const number = Number(value)
  if (Number.isFinite(number) && number >= 0) return Number(number.toFixed(2))

  return fallback
}

function getMerchantTradePercent(actor, key, fallback) {
  const value = Number(getMerchantData(actor)?.trade?.[key])
  if (Number.isFinite(value) && value >= 0) return value

  return fallback
}

export function getMerchantDefaultClientRates(actor) {
  return {
    productSellPercent: getMerchantTradePercent(actor, "sellPercent", 100),
    serviceSellPercent: getMerchantTradePercent(actor, "serviceSellPercent", 100),
    itemBuyPercent: getMerchantTradePercent(actor, "buyPercent", 50),
    note: ""
  }
}

export function normalizeClientCustomRates(customRates, defaults) {
  if (!customRates || typeof customRates !== "object") return null

  return {
    productSellPercent: normalizeClientRateValue(customRates.productSellPercent, defaults.productSellPercent),
    serviceSellPercent: normalizeClientRateValue(customRates.serviceSellPercent, defaults.serviceSellPercent),
    itemBuyPercent: normalizeClientRateValue(customRates.itemBuyPercent, defaults.itemBuyPercent),
    note: String(customRates.note ?? "").trim()
  }
}

export function getEffectiveClientRates(actor, actorUuid) {
  const defaults = getMerchantDefaultClientRates(actor)
  const client = getStoredAccessClients(actor).find((entry) => entry.actorUuid === String(actorUuid ?? "").trim())
  const customRates = normalizeClientCustomRates(client?.customRates, defaults)

  return {
    ...defaults,
    ...(customRates ?? {}),
    hasCustomRates: Boolean(customRates)
  }
}

function formatClientCustomRatesTooltip(customRates) {
  if (!customRates) return ""

  const parts = [
    game.i18n.format("mtt.clientRates.tooltip.product", { value: customRates.productSellPercent }),
    game.i18n.format("mtt.clientRates.tooltip.service", { value: customRates.serviceSellPercent }),
    game.i18n.format("mtt.clientRates.tooltip.itemBuy", { value: customRates.itemBuyPercent })
  ]
  if (customRates.note) parts.push(game.i18n.format("mtt.clientRates.tooltip.note", { note: customRates.note }))

  return parts.join(" - ")
}

export function buildAccessClientFromActor(
  actor,
  { user = null, isAuthorized = false, isFromPlayerCharacter = false } = {}
) {
  return normalizeAccessClient({
    actorUuid: actor.uuid ?? "",
    actorId: actor.id ?? "",
    actorName: actor.name ?? "",
    actorImg: actor.img ?? "",
    actorType: actor.type ?? "",
    userId: user?.id ?? "",
    userName: user?.name ?? "",
    isAuthorized,
    isFromPlayerCharacter
  })
}

export function getStoredAccessClients(actor) {
  const clients = getMerchantData(actor)?.access?.clients ?? []
  const clientsByUuid = new Map()

  clients.forEach((client) => {
    const normalized = normalizeAccessClient(client)
    if (!normalized.actorUuid) return
    clientsByUuid.set(normalized.actorUuid, normalized)
  })

  return Array.from(clientsByUuid.values())
}

function getAccessSessionBadgeIcon(status) {
  if (status === "active") return "fa-hourglass-half"
  if (status === "pending") return "fa-triangle-exclamation"
  if (status === "submitted") return "fa-thumbs-up"
  return ""
}

function getAccessSessionTooltipLabel(status) {
  if (status === "submitted") return game.i18n.localize("mtt.access.sessionSubmitted")
  if (status === "active") return game.i18n.localize("mtt.access.sessionActive")
  if (status === "pending") return game.i18n.localize("mtt.access.sessionPending")
  if (status === "validated") return game.i18n.localize("mtt.access.sessionValidated")
  if (status === "refused") return game.i18n.localize("mtt.access.sessionRefused")
  return game.i18n.localize("mtt.access.noSession")
}

function formatAccessClientTooltip(client, { isEditable }) {
  const parts = [client.actorName, client.userName || client.sourceLabel, client.statusLabel].filter(Boolean)
  if (client.hasSession) parts.push(getAccessSessionTooltipLabel(client.sessionStatus))
  parts.push(
    game.i18n.localize(client.isAuthorized ? "mtt.access.leftClickOpenSession" : "mtt.access.leftClickAuthorize")
  )
  if (isEditable) parts.push(game.i18n.localize("mtt.access.rightClickManage"))
  return parts.join(" - ")
}

export function getBestSessionForClient(actor, actorUuid) {
  const normalizedActorUuid = String(actorUuid ?? "").trim()
  if (!normalizedActorUuid) return null

  return getBestAccessSessionForClient(getSessions(actor), normalizedActorUuid)
}

function getBestAccessSessionForClient(sessions, actorUuid) {
  const normalizedActorUuid = String(actorUuid ?? "").trim()
  if (!normalizedActorUuid) return null

  const relevantSessions = (sessions ?? [])
    .filter((session) => session.actorUuid === normalizedActorUuid)
    .map((session) => normalizeSession(session))
    .filter((session) => ["active", "pending", "submitted"].includes(session.status))
  if (relevantSessions.length === 0) return null

  const statusOrder = ["active", "pending", "submitted"]
  relevantSessions.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status))
  return relevantSessions[0]
}

export function prepareAccessClients(
  actor,
  { selectedSession, selectedClientActorUuid, isEditable, accessClients = null, sessions = null } = {}
) {
  const clientsByUuid = new Map()
  const defaultRates = getMerchantDefaultClientRates(actor)
  const storedClients = Array.isArray(accessClients) ? accessClients : getStoredAccessClients(actor)

  storedClients.forEach((client) => {
    if (!client.actorUuid) return
    clientsByUuid.set(client.actorUuid, client)
  })

  return Array.from(clientsByUuid.values())
    .map((client) => {
      const session = Array.isArray(sessions)
        ? getBestAccessSessionForClient(sessions, client.actorUuid)
        : getBestSessionForClient(actor, client.actorUuid)
      const sessionStatus = session?.status ?? ""
      const hasCustomRates = Boolean(client.customRates)
      const customRates = normalizeClientCustomRates(client.customRates, defaultRates)
      const preparedClient = {
        ...client,
        hasCustomRates,
        canShowCustomRates: Boolean(isEditable && hasCustomRates),
        customRatesTooltip: isEditable ? formatClientCustomRatesTooltip(customRates) : "",
        statusLabel: game.i18n.localize(client.isAuthorized ? "mtt.access.authorized" : "mtt.access.unauthorized"),
        sourceLabel: game.i18n.localize(
          client.isFromPlayerCharacter ? "mtt.access.playerCharacter" : "mtt.access.manualActor"
        ),
        hasSession: Boolean(session),
        sessionId: session?.id ?? "",
        sessionStatus,
        sessionLabel: session
          ? game.i18n.localize(`mtt.sessions.status.${sessionStatus}`)
          : game.i18n.localize("mtt.access.noSession"),
        sessionBadgeIcon: getAccessSessionBadgeIcon(sessionStatus),
        isSelected: Boolean(
          (session && selectedSession?.id === session.id) ||
          (!session && selectedClientActorUuid && client.actorUuid === selectedClientActorUuid)
        )
      }
      preparedClient.tooltip = formatAccessClientTooltip(preparedClient, { isEditable })
      return preparedClient
    })
    .sort((a, b) => a.actorName.localeCompare(b.actorName, undefined, { sensitivity: "base" }))
}

// ─── Check logic ──────────────────────────────────────────────────────────────

function getConfiguredCurrency(currency) {
  if (currency && typeof currency === "object") {
    const currencyKeys = [currency.id, currency.abbreviation, currency.name]
      .map((value) => normalizeCurrencyText(value))
      .filter(Boolean)
    if (currencyKeys.length === 0) return null

    return (
      getCurrencies().find((entry) => {
        const candidates = [entry.id, entry.abbreviation, entry.name]
          .map((value) => normalizeCurrencyText(value))
          .filter(Boolean)

        return candidates.some((candidate) => currencyKeys.includes(candidate))
      }) ?? null
    )
  }

  const normalizedCurrency = normalizeCurrencyText(currency)
  if (!normalizedCurrency) return null

  return (
    getCurrencies().find((entry) => {
      const candidates = [entry.id, entry.abbreviation, entry.name].map((v) => normalizeCurrencyText(v)).filter(Boolean)

      return candidates.includes(normalizedCurrency)
    }) ?? null
  )
}

function getMttWalletCurrencyAmount(actor, currency) {
  const configuredCurrency = getConfiguredCurrency(currency)
  const currencyId = String(
    configuredCurrency?.id ?? (currency && typeof currency === "object" ? currency.id : currency) ?? ""
  ).trim()
  if (!actor || !currencyId) return 0

  const entityType = getMTTEntityType(actor)
  const walletCurrencies =
    entityType === MTT.ENTITY_TYPES.STORAGE
      ? (getStorageData(actor)?.wallet?.currencies ?? {})
      : entityType === MTT.ENTITY_TYPES.MERCHANT
        ? (getMerchantData(actor)?.wallet?.currencies ?? {})
        : null

  if (!walletCurrencies) return null

  const amount = Number(walletCurrencies[currencyId] ?? 0)
  return Number.isFinite(amount) && amount >= 0 ? amount : 0
}

function getActorCurrencyAmount(actor, currency) {
  if (!currency?.actorPath) return null
  try {
    const raw = foundry.utils.getProperty(actor, currency.actorPath)
    const amount = Number(raw)
    return Number.isFinite(amount) ? Math.max(0, amount) : null
  } catch {
    return null
  }
}

function getTransferCurrencyAmount(actor, currency) {
  const walletAmount = getMttWalletCurrencyAmount(actor, currency)
  if (walletAmount !== null) return walletAmount

  return getActorCurrencyAmount(actor, currency)
}

function prepareBuyerFortune(actor) {
  if (!actor) return []

  return getCurrencies()
    .map((currency) => {
      const abbreviation = String(currency.abbreviation ?? currency.name ?? currency.id ?? "").trim()
      if (!abbreviation) return null

      return {
        value: getTransferCurrencyAmount(actor, currency) ?? 0,
        abbreviation
      }
    })
    .filter(Boolean)
}

function getActorCurrencyAmounts(actor, currencies) {
  const amounts = {}

  for (const currency of currencies) {
    const currId = String(currency.id ?? "").trim()
    if (!currId) continue
    amounts[currId] = getTransferCurrencyAmount(actor, currency) ?? 0
  }

  return amounts
}

function getCurrencyAmountsReferenceValue(amounts, currencies) {
  const total = currencies.reduce((sum, currency) => {
    const currId = String(currency.id ?? "").trim()
    const rate = Number(currency.rate)
    if (!currId || !Number.isFinite(rate) || rate <= 0) return sum

    const amount = Number(amounts[currId] ?? 0)
    return Number.isFinite(amount) && amount > 0 ? sum + amount * rate : sum
  }, 0)

  return roundToSmallestCurrencyUnit(total, currencies)
}

function distributeReferenceValueToCurrencies(amountReference, currencies) {
  const targetAmounts = {}
  let remaining = roundToSmallestCurrencyUnit(Math.max(0, Number(amountReference) || 0), currencies)
  const sortedCurrencies = [...currencies].sort((a, b) => Number(b.rate) - Number(a.rate))

  for (const currency of sortedCurrencies) {
    const currId = String(currency.id ?? "").trim()
    const rate = Number(currency.rate)
    if (!currId || !Number.isFinite(rate) || rate <= 0) continue

    const amount = Math.floor(remaining / rate + 0.0001)
    targetAmounts[currId] = amount
    remaining = roundToSmallestCurrencyUnit(remaining - amount * rate, currencies)
  }

  return targetAmounts
}

function buildInternalConversionDeltas(currentAmounts, targetAmounts, currencies) {
  return currencies
    .map((currency) => {
      const currId = String(currency.id ?? "").trim()
      if (!currId) return null

      const current = Number(currentAmounts[currId] ?? 0)
      const target = Number(targetAmounts[currId] ?? 0)
      const delta = Number(((Number.isFinite(target) ? target : 0) - (Number.isFinite(current) ? current : 0)).toFixed(2))
      if (delta === 0) return null

      return { currency, delta }
    })
    .filter(Boolean)
}

function buildCurrencyTransferPlan(merchantActor, clientActor, moneyAdjustments, currencies) {
  const result = {
    canExecute: false,
    errors: [],
    warnings: [],
    noTransferNeeded: false,
    payer: null,
    netDebtReference: 0,
    payerRemovals: [],
    receiverAdditions: [],
    changeRemovals: [],
    changeAdditions: [],
    payerDeltas: [],
    receiverDeltas: [],
    hasChange: false
  }

  if (!currencies.length) {
    result.errors.push(game.i18n.localize("mtt.sessions.errors.currencyConfigurationMissing"))
    return result
  }

  const referenceCurrency =
    currencies.find((c) => Boolean(c.isDefault)) ??
    currencies.find((c) => Number(c.rate) === 1) ??
    currencies[0] ??
    null

  if (!referenceCurrency) {
    result.errors.push(game.i18n.localize("mtt.sessions.errors.referenceCurrencyMissing"))
    return result
  }

  let netDebtReference = 0
  for (const adjustment of moneyAdjustments) {
    if (adjustment.currency === "__none") {
      result.warnings.push(game.i18n.localize("mtt.sessions.check.undefinedCurrency"))
      continue
    }
    const adjustmentCurrencyObj = currencies.find((c) => {
      const candidates = [c.id, c.abbreviation, c.name].map((v) => normalizeCurrencyText(v)).filter(Boolean)
      return candidates.includes(normalizeCurrencyText(adjustment.currency))
    })
    if (!adjustmentCurrencyObj) {
      result.warnings.push(
        game.i18n.format("mtt.sessions.check.unknownCurrency", { currency: formatCurrencyLabel(adjustment.currency) })
      )
      continue
    }
    const rate = Number(adjustmentCurrencyObj.rate)
    const debtInRef = adjustment.amount * (Number.isFinite(rate) && rate > 0 ? rate : 1)
    if (adjustment.side === "seller") {
      netDebtReference += debtInRef
    } else {
      netDebtReference -= debtInRef
    }
  }

  const absDebt = Math.abs(netDebtReference)
  const roundedAbsDebt = roundToSmallestCurrencyUnit(absDebt, currencies)
  netDebtReference = netDebtReference < 0 ? -roundedAbsDebt : roundedAbsDebt

  if (Math.abs(netDebtReference) < 0.0001) {
    result.noTransferNeeded = true
    result.canExecute = true
    return result
  }

  const payerIsClient = netDebtReference > 0
  result.payer = payerIsClient ? "client" : "merchant"
  result.netDebtReference = Math.abs(netDebtReference)

  const payerActor = payerIsClient ? clientActor : merchantActor
  const receiverActor = payerIsClient ? merchantActor : clientActor
  const payerEntityType = getMTTEntityType(payerActor)
  const payerUsesMttWallet = [MTT.ENTITY_TYPES.MERCHANT, MTT.ENTITY_TYPES.STORAGE].includes(payerEntityType)
  const payerCanUseInternalConversion = payerUsesMttWallet

  const currenciesSortedDesc = [...currencies].sort((a, b) => Number(b.rate) - Number(a.rate))

  const payerAmounts = getActorCurrencyAmounts(payerActor, currenciesSortedDesc)
  for (const currency of currenciesSortedDesc) {
    const currId = String(currency.id ?? "").trim()
    if (!currId) continue
    const amount = getTransferCurrencyAmount(payerActor, currency)
    if (amount === null && currency.actorPath) {
      result.errors.push(
        game.i18n.format("mtt.sessions.errors.currencyPathUnreadable", {
          currency: formatCurrencyLabel(String(currency.abbreviation ?? currency.id ?? "").trim()),
          actor: payerActor.name
        })
      )
    }
  }

  if (result.errors.length > 0) return result

  if (payerCanUseInternalConversion) {
    const payerReferenceValue = getCurrencyAmountsReferenceValue(payerAmounts, currencies)

    if (payerReferenceValue + 0.0001 < result.netDebtReference) {
      result.errors.push(game.i18n.format("mtt.sessions.errors.payerInsufficientFunds", { actor: payerActor.name }))
      return result
    }

    const payerRemainingValue = roundToSmallestCurrencyUnit(payerReferenceValue - result.netDebtReference, currencies)
    const payerTargetAmounts = distributeReferenceValueToCurrencies(payerRemainingValue, currencies)
    const receiverAdditionAmounts = distributeReferenceValueToCurrencies(result.netDebtReference, currencies)
    const receiverCurrentAmounts = {}

    result.payerDeltas = buildInternalConversionDeltas(payerAmounts, payerTargetAmounts, currencies)
    result.receiverDeltas = buildInternalConversionDeltas(receiverCurrentAmounts, receiverAdditionAmounts, currencies)
    result.payerRemovals = result.receiverDeltas
      .filter((entry) => entry.delta > 0)
      .map((entry) => ({ currency: entry.currency, amount: entry.delta }))
    result.receiverAdditions = result.payerRemovals.map((entry) => ({ ...entry }))
    result.hasChange = false
    result.canExecute = true
    return result
  }

  const payerRemovals = []
  let remaining = result.netDebtReference

  for (const currency of currenciesSortedDesc) {
    if (remaining < 0.0001) break
    const currId = String(currency.id ?? "").trim()
    if (!currId) continue
    const rate = Number(currency.rate)
    if (!Number.isFinite(rate) || rate <= 0) continue
    const available = payerAmounts[currId] ?? 0
    if (available <= 0) continue
    const use = Math.min(available, Math.floor(remaining / rate + 0.0001))
    if (use > 0) {
      payerRemovals.push({ currency, amount: use })
      remaining = Math.round((remaining - use * rate) * 10000) / 10000
    }
  }

  if (remaining > 0.0001) {
    const currenciesSortedAsc = [...currenciesSortedDesc].reverse()
    let covered = false

    for (const currency of currenciesSortedAsc) {
      const currId = String(currency.id ?? "").trim()
      if (!currId) continue
      const rate = Number(currency.rate)
      if (!Number.isFinite(rate) || rate < remaining - 0.0001) continue
      const available = payerAmounts[currId] ?? 0
      const alreadyUsed = payerRemovals.find((r) => r.currency.id === currId)?.amount ?? 0
      if (available - alreadyUsed < 1) continue

      const existing = payerRemovals.find((r) => r.currency.id === currId)
      if (existing) {
        existing.amount += 1
      } else {
        payerRemovals.push({ currency, amount: 1 })
      }

      const overpaid = Math.round((rate - remaining) * 10000) / 10000
      remaining = 0

      if (overpaid > 0.0001) {
        result.hasChange = true
        const changeRemovals = []
        let changeRemaining = overpaid

        const receiverAmounts = {}
        for (const c of currenciesSortedDesc) {
          const cId = String(c.id ?? "").trim()
          if (!cId) continue
          receiverAmounts[cId] = getTransferCurrencyAmount(receiverActor, c) ?? 0
        }

        for (const c of currenciesSortedDesc) {
          if (changeRemaining < 0.0001) break
          const cId = String(c.id ?? "").trim()
          if (!cId) continue
          const r = Number(c.rate)
          if (!Number.isFinite(r) || r <= 0) continue
          const avail = receiverAmounts[cId] ?? 0
          if (avail <= 0) continue
          const use2 = Math.min(avail, Math.floor(changeRemaining / r + 0.0001))
          if (use2 > 0) {
            changeRemovals.push({ currency: c, amount: use2 })
            changeRemaining = Math.round((changeRemaining - use2 * r) * 10000) / 10000
          }
        }

        if (changeRemaining > 0.0001) {
          result.errors.push(
            game.i18n.format("mtt.sessions.errors.receiverCannotMakeChange", { actor: receiverActor.name })
          )
          return result
        }

        result.changeRemovals = changeRemovals
        result.changeAdditions = changeRemovals.map((r) => ({ ...r }))
      }

      covered = true
      break
    }

    if (!covered) {
      result.errors.push(game.i18n.format("mtt.sessions.errors.payerInsufficientFunds", { actor: payerActor.name }))
      return result
    }
  }

  result.payerRemovals = payerRemovals
  result.receiverAdditions = payerRemovals.map((r) => ({ ...r }))
  result.canExecute = result.errors.length === 0
  return result
}

function getMttWalletCurrencyUpdatePath(actor, currencyId) {
  const entityType = getMTTEntityType(actor)
  if (entityType === MTT.ENTITY_TYPES.STORAGE) return getStorageFlagPath(`wallet.currencies.${currencyId}`)
  if (entityType === MTT.ENTITY_TYPES.MERCHANT) return getMerchantFlagPath(`wallet.currencies.${currencyId}`)
  return ""
}

async function applyCurrencyDeltasToActor(actor, deltas, currencyById) {
  if (!actor || !(deltas instanceof Map) || deltas.size === 0) return

  const updateData = {}

  for (const [currId, delta] of deltas) {
    if (delta === 0) continue

    const currency = currencyById.get(currId)
    const walletPath = getMttWalletCurrencyUpdatePath(actor, currId)

    if (walletPath) {
      const current = getMttWalletCurrencyAmount(actor, currId) ?? 0
      updateData[walletPath] = Math.max(0, Number((current + delta).toFixed(2)))
      continue
    }

    if (!currency?.actorPath) continue

    const current = Number(foundry.utils.getProperty(actor, currency.actorPath) ?? 0)
    const currentAmount = Number.isFinite(current) ? current : 0
    foundry.utils.setProperty(
      updateData,
      currency.actorPath,
      Math.max(0, Number((currentAmount + delta).toFixed(2)))
    )
  }

  if (Object.keys(updateData).length > 0) await actor.update(updateData)
}

export async function applyCurrencyTransferPlan(merchantActor, clientActor, plan) {
  if (!plan?.canExecute || plan.noTransferNeeded) return

  const payerIsClient = plan.payer === "client"
  const currencies = getCurrencies()
  const currencyById = new Map(currencies.map((c) => [String(c.id ?? "").trim(), c]))

  const clientDeltas = new Map()
  const merchantDeltas = new Map()

  function applyDelta(isClient, currencyId, delta) {
    const map = isClient ? clientDeltas : merchantDeltas
    map.set(currencyId, (map.get(currencyId) ?? 0) + delta)
  }

  const hasDirectDeltas = (plan.payerDeltas?.length ?? 0) > 0 || (plan.receiverDeltas?.length ?? 0) > 0

  if (hasDirectDeltas) {
    for (const { currency, delta } of plan.payerDeltas ?? []) {
      const currId = String(currency.id ?? "").trim()
      if (currId) applyDelta(payerIsClient, currId, delta)
    }
    for (const { currency, delta } of plan.receiverDeltas ?? []) {
      const currId = String(currency.id ?? "").trim()
      if (currId) applyDelta(!payerIsClient, currId, delta)
    }
  } else {
    for (const { currency, amount } of plan.payerRemovals) {
      const currId = String(currency.id ?? "").trim()
      if (currId) applyDelta(payerIsClient, currId, -amount)
    }
    for (const { currency, amount } of plan.receiverAdditions) {
      const currId = String(currency.id ?? "").trim()
      if (currId) applyDelta(!payerIsClient, currId, +amount)
    }
    if (plan.hasChange) {
      for (const { currency, amount } of plan.changeRemovals) {
        const currId = String(currency.id ?? "").trim()
        if (currId) applyDelta(!payerIsClient, currId, -amount)
      }
      for (const { currency, amount } of plan.changeAdditions) {
        const currId = String(currency.id ?? "").trim()
        if (currId) applyDelta(payerIsClient, currId, +amount)
      }
    }
  }

  await applyCurrencyDeltasToActor(clientActor, clientDeltas, currencyById)
  await applyCurrencyDeltasToActor(merchantActor, merchantDeltas, currencyById)
}

function getProductCheckAvailableQuantity(actor, item) {
  const product = getCatalogProduct(actor, item.sourceId)
  if (!product) {
    const sessionQuantity = Number(item.availableQuantity)
    return Number.isFinite(sessionQuantity) && sessionQuantity >= 0 ? sessionQuantity : null
  }
  if (isUnlimitedQuantity(product.quantity)) return null

  const productQuantity = normalizeFiniteQuantity(product.quantity)
  if (productQuantity !== null) return productQuantity

  const sessionQuantity = Number(item.availableQuantity)
  return Number.isFinite(sessionQuantity) && sessionQuantity >= 0 ? sessionQuantity : null
}

function getServiceCheckAvailableQuantity(actor, item) {
  const service = getMerchantData(actor)?.catalog?.services?.find((entry) => entry.id === item.sourceId)
  if (isUnlimitedQuantity(service?.quantity)) return null

  const serviceQuantity = normalizeFiniteQuantity(service?.quantity)
  if (serviceQuantity !== null) return serviceQuantity

  const sessionQuantity = Number(item.availableQuantity)
  return Number.isFinite(sessionQuantity) && sessionQuantity >= 0 ? sessionQuantity : null
}

function checkLimitedSessionQuantity({ item, availableQuantity, result, messageId, messageKey, icon }) {
  if (availableQuantity === null || availableQuantity === undefined || availableQuantity === "") return

  const requestedQuantity = Number(item.quantity)
  const normalizedAvailableQuantity = Number(availableQuantity)

  if (!Number.isFinite(requestedQuantity) || !Number.isFinite(normalizedAvailableQuantity)) return
  if (requestedQuantity <= normalizedAvailableQuantity) return

  result.errors.push(createCheckMessage("error", messageId, game.i18n.format(messageKey, { name: item.name }), icon))
}

function checkSessionStatus(session, result) {
  if (session.status === "validated") {
    result.warnings.push(
      createCheckMessage(
        "warning",
        "already-validated",
        game.i18n.localize("mtt.sessions.check.alreadyValidated"),
        "fa-triangle-exclamation"
      )
    )
  }

  if (session.status === "refused") {
    result.warnings.push(
      createCheckMessage(
        "warning",
        "already-refused",
        game.i18n.localize("mtt.sessions.check.alreadyRefused"),
        "fa-ban"
      )
    )
  }
}

function checkSessionBuyerItems(actor, session, result) {
  const buyerItems = session.buyerItems ?? []
  if (buyerItems.length === 0) return

  const errorCount = result.errors.length

  buyerItems.forEach((item) => {
    if (isSessionMoneyItem(item)) return

    if (item.type === "product") {
      const availableQuantity = getProductCheckAvailableQuantity(actor, item)
      checkLimitedSessionQuantity({
        item,
        availableQuantity,
        result,
        messageId: `product-stock-${item.id}`,
        messageKey: "mtt.sessions.check.productStockInsufficient",
        icon: "fa-box-open"
      })
    }

    if (item.type === "service") {
      const availableQuantity = getServiceCheckAvailableQuantity(actor, item)
      checkLimitedSessionQuantity({
        item,
        availableQuantity,
        result,
        messageId: `service-stock-${item.id}`,
        messageKey: "mtt.sessions.check.serviceQuantityInsufficient",
        icon: "fa-bell-concierge"
      })
    }
  })

  if (result.errors.length === errorCount) {
    result.infos.push(
      createCheckMessage("info", "stock-ok", game.i18n.localize("mtt.sessions.check.stockOk"), "fa-circle-check")
    )
  }
}

async function checkSessionSellerItems(actor, session, result) {
  const sellerItems = session.sellerItems ?? []
  if (sellerItems.length === 0) return

  const errorCount = result.errors.length
  const warningCount = result.warnings.length

  for (const item of sellerItems) {
    if (isSessionMoneyItem(item)) continue

    const sourceUuid = String(item.sourceUuid ?? "").trim()
    let source = getSellerSourceItemFromSessionItem(item)

    if (!source && sourceUuid) {
      try {
        source = await fromUuid(sourceUuid)
      } catch {
        source = null
      }
    }

    if (!source || source.documentName !== "Item") {
      result.warnings.push(
        createCheckMessage(
          "warning",
          `seller-source-${item.id}`,
          game.i18n.format("mtt.sessions.check.sellerSourceMissing", { name: item.name }),
          "fa-link-slash"
        )
      )
      continue
    }

    const availableQuantity = getSellerSourceAvailableQuantity(source, item)
    checkLimitedSessionQuantity({
      item,
      availableQuantity,
      result,
      messageId: `seller-stock-${item.id}`,
      messageKey: "mtt.sessions.check.sellerQuantityInsufficient",
      icon: "fa-box-open"
    })
  }

  if (result.errors.length === errorCount && result.warnings.length === warningCount) {
    result.infos.push(
      createCheckMessage(
        "info",
        "seller-items-ok",
        game.i18n.localize("mtt.sessions.check.sellerItemsOk"),
        "fa-circle-check"
      )
    )
  }
}

function checkSessionMoneyAdjustments(actor, moneyAdjustments, result, options = {}) {
  moneyAdjustments.forEach((adjustment) => {
    const currencyLabel = formatCurrencyLabel(adjustment.currency === "__none" ? "" : adjustment.currency)

    if (adjustment.currency === "__none") {
      result.warnings.push(
        createCheckMessage(
          "warning",
          `money-undefined-${adjustment.side}`,
          game.i18n.localize("mtt.sessions.check.undefinedCurrency"),
          "fa-coins"
        )
      )
      return
    }

    if (adjustment.side === "seller") {
      result.infos.push(
        createCheckMessage(
          "info",
          `player-must-pay-${adjustment.currency}`,
          game.i18n.format("mtt.sessions.check.playerMustPay", { amount: adjustment.amount, currency: currencyLabel }),
          "fa-coins"
        )
      )
      return
    }

    result.infos.push(
      createCheckMessage(
        "info",
        `merchant-must-return-${adjustment.currency}`,
        game.i18n.format("mtt.sessions.check.merchantMustReturn", {
          amount: adjustment.amount,
          currency: currencyLabel
        }),
        "fa-coins"
      )
    )

    if (options.currencyTransferPlan) return

    const merchantAmount = getTransferCurrencyAmount(actor, adjustment.currency) ?? 0
    if (merchantAmount < adjustment.amount) {
      result.errors.push(
        createCheckMessage(
          "error",
          `merchant-currency-${adjustment.currency}`,
          game.i18n.format("mtt.sessions.check.merchantCurrencyInsufficient", { currency: currencyLabel }),
          "fa-coins"
        )
      )
      return
    }

    result.infos.push(
      createCheckMessage(
        "info",
        `merchant-change-ok-${adjustment.currency}`,
        game.i18n.localize("mtt.sessions.check.merchantChangeOk"),
        "fa-circle-check"
      )
    )
  })

  const plan = options.currencyTransferPlan
  if (plan) {
    for (const warning of plan.warnings ?? []) {
      result.warnings.push(
        createCheckMessage("warning", `currency-plan-warning-${result.warnings.length}`, warning, "fa-coins")
      )
    }
    for (const error of plan.errors ?? []) {
      result.errors.push(createCheckMessage("error", `currency-plan-error-${result.errors.length}`, error, "fa-coins"))
    }
  }
}

function checkSessionCurrencies(actor, preparedSession, result) {
  const seen = new Set()
  const currencyKeys = [
    ...(preparedSession.buyerTotalByCurrency ?? []).map((total) => total.currency),
    ...(preparedSession.sellerTotalByCurrency ?? []).map((total) => total.currency),
    ...(preparedSession.moneyAdjustments ?? []).map((adjustment) => adjustment.currency)
  ]

  currencyKeys.forEach((currency) => {
    const currencyKey = normalizeCurrencyKey(currency === "__none" ? "" : currency)
    if (seen.has(currencyKey)) return
    seen.add(currencyKey)

    if (currencyKey === "__none") {
      result.warnings.push(
        createCheckMessage(
          "warning",
          "currency-undefined",
          game.i18n.localize("mtt.sessions.check.undefinedCurrency"),
          "fa-coins"
        )
      )
      return
    }

    if (getConfiguredCurrency(currencyKey)) return

    result.warnings.push(
      createCheckMessage(
        "warning",
        `currency-unknown-${currencyKey}`,
        game.i18n.format("mtt.sessions.check.unknownCurrency", { currency: formatCurrencyLabel(currencyKey) }),
        "fa-coins"
      )
    )
  })
}

export async function checkSessionTransaction(actor, session, preparedSession, options = {}) {
  const result = {
    checked: true,
    canProceed: false,
    infos: [],
    warnings: [],
    errors: []
  }

  if (!session) {
    result.canProceed = false
    return result
  }

  checkSessionStatus(session, result)
  checkSessionBuyerItems(actor, session, result)
  await checkSessionSellerItems(actor, session, result)
  const currencyPreview = await buildExecutionPreview(actor, session, options)
  checkSessionMoneyAdjustments(actor, preparedSession.moneyAdjustments ?? [], result, {
    ...options,
    currencyTransferPlan: currencyPreview?.currencyTransferPlan ?? null
  })
  checkSessionCurrencies(actor, preparedSession, result)

  result.canProceed = result.errors.length === 0
  return result
}

// ─── Seller drop protection ───────────────────────────────────────────────────

export function isMerchantSellerDropBlocked(payload, actorUuid) {
  void payload
  void actorUuid
  return false
}

// ─── Execution preview ────────────────────────────────────────────────────────

function getExecutionAccessClients(actor, options = {}) {
  return Array.isArray(options.accessClients) ? options.accessClients : getStoredAccessClients(actor)
}

export async function buildExecutionPreview(actor, session, options = {}) {
  const preview = {
    canExecute: false,
    errors: [],
    warnings: [],
    client: null,
    merchant: { id: actor.id, name: actor.name, img: actor.img },
    buyerDeliveries: [],
    actorDeliverySimulations: [],
    sellerDeliveries: [],
    merchantStockUpdates: [],
    clientItemUpdates: [],
    moneyTransfers: [],
    services: []
  }

  if (!session) {
    preview.errors.push(game.i18n.localize("mtt.sessions.preview.emptySession"))
    return preview
  }

  const buyerItems = session.buyerItems ?? []
  const sellerItems = session.sellerItems ?? []

  if (buyerItems.length === 0 && sellerItems.length === 0) {
    preview.errors.push(game.i18n.localize("mtt.sessions.preview.emptySession"))
    return preview
  }

  const actorUuid = String(session.actorUuid ?? "").trim()
  if (!actorUuid) {
    preview.errors.push(game.i18n.localize("mtt.sessions.preview.clientMissing"))
    return preview
  }

  let clientActor = null
  try {
    clientActor = await fromUuid(actorUuid)
  } catch {
    // ignore
  }

  if (!clientActor || clientActor.documentName !== "Actor") {
    preview.errors.push(game.i18n.localize("mtt.sessions.preview.clientMissing"))
    return preview
  }

  const storedClients = getExecutionAccessClients(actor, options)
  const accessClient = storedClients.find((c) => c.actorUuid === actorUuid)
  if (!accessClient?.isAuthorized) {
    preview.errors.push(game.i18n.localize("mtt.sessions.preview.clientNotAuthorized"))
  }

  preview.client = {
    actorUuid,
    actorName: clientActor.name,
    actorImg: clientActor.img
  }
  const clientMttEntityType = getMTTEntityType(clientActor)
  const clientIsMtt = [MTT.ENTITY_TYPES.MERCHANT, MTT.ENTITY_TYPES.STORAGE].includes(clientMttEntityType)

  // Check buyer items (merchant → client)
  for (const item of buyerItems) {
    if (isSessionMoneyItem(item)) continue

    const totalPriceValue = Number((item.unitPriceValue * item.quantity).toFixed(2))
    const totalPriceLabel = formatPriceLabel(item.totalPriceValue ?? totalPriceValue, item.priceCurrency)
    const unitPriceLabel = formatPriceLabel(item.unitPriceValue, item.priceCurrency)

    if (item.type === "product") {
      const catalogProduct = getCatalogProduct(actor, item.sourceId)
      if (!catalogProduct) {
        preview.errors.push(game.i18n.format("mtt.sessions.preview.merchantProductMissing", { name: item.name }))
        preview.buyerDeliveries.push({
          type: "product",
          id: item.id,
          name: item.name,
          img: item.img,
          quantity: item.quantity,
          unitPriceLabel,
          totalPriceLabel,
          sourceLabel: item.sourceLabel,
          missing: true
        })
        continue
      }

      const available = getProductCheckAvailableQuantity(actor, item)
      if (Number.isFinite(available) && available >= 0 && available < item.quantity) {
        preview.errors.push(game.i18n.format("mtt.sessions.preview.merchantStockInsufficient", { name: item.name }))
      }

      const deliveryQuantityPerLot = normalizeEffectiveDeliveryQuantityPerLot(
        item.deliveryQuantityPerLot ?? catalogProduct.deliveryQuantityPerLot
      )
      const requestedQuantity = Number(item.quantity)
      const quantityToDeliver = clientIsMtt
        ? Math.floor(requestedQuantity)
        : Math.floor(requestedQuantity * deliveryQuantityPerLot)
      const displayName = formatProductNameWithLotQuantity(catalogProduct.name ?? item.name, deliveryQuantityPerLot)
      const deliveryProductData = {
        id: catalogProduct.id,
        sourceUuid: catalogProduct.sourceUuid,
        sourceItemUuid: toItemOnlyUuid(actor.items.get(catalogProduct.id)?.uuid),
        sourceIsCommerciallyModified: Boolean(catalogProduct.isCommerciallyModified),
        ownershipLevel: catalogProduct.ownershipLevel,
        isHidden: Boolean(catalogProduct.isHidden),
        deliveryQuantityPerLot: deliveryQuantityPerLot > 1 ? deliveryQuantityPerLot : null,
        isCommerciallyModified: Boolean(catalogProduct.isCommerciallyModified),
        secretName: catalogProduct.secretName ?? "",
        secretPrice: catalogProduct.secretPrice ?? "",
        secretCurrency: catalogProduct.secretCurrency ?? "",
        secretDescription: catalogProduct.secretDescription ?? ""
      }
      const deliveredItemData = buildVisibleProductItemDataFromCatalogProduct(catalogProduct, quantityToDeliver)
      const deliverySimulation = simulatePurchasedItemDeliveryToActor(
        clientActor,
        deliveryProductData,
        deliveredItemData,
        quantityToDeliver,
        clientIsMtt ? { quantityMode: "productFlag" } : {}
      )
      preview.actorDeliverySimulations.push(deliverySimulation)
      for (const error of deliverySimulation.errors) {
        if (!preview.errors.includes(error)) preview.errors.push(error)
      }
      for (const warning of deliverySimulation.warnings) {
        if (!preview.warnings.includes(warning)) preview.warnings.push(warning)
      }

      preview.buyerDeliveries.push({
        type: "product",
        id: item.id,
        name: displayName,
        img: item.img,
        quantity: item.quantity,
        unitPriceLabel,
        totalPriceLabel,
        sourceLabel: item.sourceLabel,
        missing: false,
        deliverySimulation
      })
      if (Number.isFinite(available) && available >= 0) {
        preview.merchantStockUpdates.push({
          name: displayName,
          img: item.img,
          quantityToReduce: item.quantity,
          availableQuantity: available
        })
      }
    } else if (item.type === "service") {
      const available = getServiceCheckAvailableQuantity(actor, item)
      if (Number.isFinite(available) && available >= 0 && available < item.quantity) {
        preview.errors.push(game.i18n.format("mtt.sessions.preview.merchantStockInsufficient", { name: item.name }))
      }

      preview.services.push({
        id: item.id,
        name: item.name,
        img: item.img,
        quantity: item.quantity,
        unitPriceLabel,
        totalPriceLabel,
        sourceLabel: item.sourceLabel
      })
    }
  }

  // Check seller items (client → merchant)
  for (const item of sellerItems) {
    if (isSessionMoneyItem(item)) continue

    const totalPriceValue = Number((item.unitPriceValue * item.quantity).toFixed(2))
    const totalPriceLabel = formatPriceLabel(item.totalPriceValue ?? totalPriceValue, item.priceCurrency)
    const unitPriceLabel = formatPriceLabel(item.unitPriceValue, item.priceCurrency)
    const sourceUuid = String(item.sourceUuid ?? "").trim()

    if (!sourceUuid) {
      preview.sellerDeliveries.push({
        id: item.id,
        name: item.name,
        img: item.img,
        quantity: item.quantity,
        unitPriceLabel,
        totalPriceLabel,
        sourceLabel: item.sourceLabel,
        missing: false
      })
      continue
    }

    let sourceItem = getSellerSourceItemFromSessionItem(item)
    if (!sourceItem) {
      try {
        sourceItem = await fromUuid(sourceUuid)
      } catch {
        // ignore
      }
    }

    if (!sourceItem || sourceItem.documentName !== "Item") {
      preview.errors.push(game.i18n.format("mtt.sessions.preview.sellerItemMissing", { name: item.name }))
      preview.sellerDeliveries.push({
        id: item.id,
        name: item.name,
        img: item.img,
        quantity: item.quantity,
        unitPriceLabel,
        totalPriceLabel,
        sourceLabel: item.sourceLabel,
        missing: true
      })
      continue
    }

    const available = getSellerSourceAvailableQuantity(sourceItem, item)
    if (Number.isFinite(available) && available >= 0 && available < item.quantity) {
      preview.errors.push(game.i18n.format("mtt.sessions.preview.sellerQuantityInsufficient", { name: item.name }))
    }

    preview.sellerDeliveries.push({
      id: item.id,
      name: item.name,
      img: item.img,
      quantity: item.quantity,
      unitPriceLabel,
      totalPriceLabel,
      sourceLabel: item.sourceLabel,
      missing: false
    })
    preview.clientItemUpdates.push({
      name: item.name,
      img: item.img,
      quantityToReduce: item.quantity,
      availableQuantity: available
    })
  }

  // Check money adjustments
  const buyerTotals = prepareSessionTotals(
    buyerItems.map((item) => {
      const copy = { ...item }
      recalculateSessionItemTotal(copy)
      return copy
    })
  )
  const sellerTotals = prepareSessionTotals(
    sellerItems.map((item) => {
      const copy = { ...item }
      recalculateSessionItemTotal(copy)
      return copy
    })
  )
  const adjustments = prepareMoneyAdjustments(buyerTotals, sellerTotals)

  const includeCurrencyTransfers = options.includeCurrencyTransfers !== false
  const currencies = includeCurrencyTransfers ? getCurrencies() : []
  const currencyTransferPlan =
    includeCurrencyTransfers && clientActor && currencies.length > 0
      ? buildCurrencyTransferPlan(actor, clientActor, adjustments, currencies)
      : null

  preview.currencyTransferPlan = currencyTransferPlan ?? null
  preview.moneyTransfers = []

  if (currencyTransferPlan) {
    for (const err of currencyTransferPlan.errors ?? []) {
      if (!preview.errors.includes(err)) preview.errors.push(err)
    }
    for (const warn of currencyTransferPlan.warnings ?? []) {
      if (!preview.warnings.includes(warn)) preview.warnings.push(warn)
    }

    if (!currencyTransferPlan.noTransferNeeded) {
      const payerName = currencyTransferPlan.payer === "client" ? (preview.client?.actorName ?? "") : actor.name
      const receiverName = currencyTransferPlan.payer === "client" ? actor.name : (preview.client?.actorName ?? "")

      for (const { currency, amount } of currencyTransferPlan.payerRemovals) {
        const abbr = String(currency.abbreviation ?? currency.id ?? "").trim()
        preview.moneyTransfers.push({
          currencyLabel: abbr,
          amountLabel: formatPriceLabel(amount, abbr),
          payer: payerName,
          receiver: receiverName,
          hasEnough: true,
          unknownCurrency: false,
          isChange: false
        })
      }

      for (const { currency, amount } of currencyTransferPlan.changeRemovals ?? []) {
        const abbr = String(currency.abbreviation ?? currency.id ?? "").trim()
        preview.moneyTransfers.push({
          currencyLabel: abbr,
          amountLabel: formatPriceLabel(amount, abbr),
          payer: receiverName,
          receiver: payerName,
          hasEnough: true,
          unknownCurrency: false,
          isChange: true
        })
      }
    }
  } else if (includeCurrencyTransfers && adjustments.length > 0) {
    for (const adjustment of adjustments) {
      const adjustmentCurrency = adjustment.currency === "__none" ? "" : adjustment.currency
      preview.moneyTransfers.push({
        currencyLabel: formatCurrencyLabel(adjustmentCurrency),
        amountLabel: adjustment.amountLabel,
        payer: adjustment.side === "seller" ? (preview.client?.actorName ?? "") : actor.name,
        receiver: adjustment.side === "seller" ? actor.name : (preview.client?.actorName ?? ""),
        hasEnough: false,
        unknownCurrency: true,
        isChange: false
      })
    }
  }

  preview.canExecute = preview.errors.length === 0
  return preview
}

// ─── Real item execution ─────────────────────────────────────────────────────

function getQuantityPathForItem(item) {
  const configuredPath = String(game.settings.get(MTT.ID, "itemQuantityPath") ?? "").trim()
  if (configuredPath && parseQuantityValue(foundry.utils.getProperty(item, configuredPath)) !== null)
    return configuredPath

  const candidates = ["system.quantity.value", "system.qty", "system.stack.quantity", "system.quantity"]

  return candidates.find((path) => parseQuantityValue(foundry.utils.getProperty(item, path)) !== null) ?? ""
}

function setItemDataQuantity(itemData, quantity, sourceItem = null) {
  const configuredPath = String(game.settings.get(MTT.ID, "itemQuantityPath") ?? "").trim()
  const candidatePaths = [
    configuredPath,
    "system.quantity.value",
    "system.qty",
    "system.stack.quantity",
    "system.quantity"
  ].filter(Boolean)

  const targetPath =
    candidatePaths.find(
      (path) => parseQuantityValue(foundry.utils.getProperty(sourceItem ?? itemData, path)) !== null
    ) ??
    candidatePaths[0] ??
    ""

  if (!targetPath) return
  foundry.utils.setProperty(itemData, targetPath, quantity)
}

function catalogEntryHasSecretData(entry = {}) {
  return productHasSecretInfo(entry)
}

function formatDeliveryTransactionNumber(transactionNumber) {
  const number = Number(transactionNumber)
  if (!Number.isFinite(number) || number <= 0) return ""

  return String(Math.floor(number))
}

function buildDeliveredItemOriginHtml(productData = {}) {
  const merchantName = String(productData.merchantName ?? "").trim()
  if (!merchantName) return ""

  const transactionNumber = formatDeliveryTransactionNumber(productData.transactionNumber)
  const originText = transactionNumber
    ? game.i18n.format("mtt.delivery.originWithTransaction", {
        merchantName,
        transactionNumber
      })
    : game.i18n.format("mtt.delivery.origin", { merchantName })

  return `<p class="mtt-delivery-origin">${escapeHTML(originText)}</p>`
}

function buildDeliveredItemSecretHtml(productData = {}) {
  if (!catalogEntryHasSecretData(productData)) return ""

  const lines = []
  if (hasSecretValue(productData.secretName)) {
    lines.push(
      game.i18n.format("mtt.delivery.secretName", {
        value: String(productData.secretName ?? "").trim()
      })
    )
  }

  if (hasSecretValue(productData.secretPrice) || hasSecretValue(productData.secretCurrency)) {
    const formattedPrice = hasSecretValue(productData.secretPrice)
      ? formatPriceLabel(productData.secretPrice, productData.secretCurrency)
      : ""
    const priceLabel =
      formattedPrice ||
      [productData.secretPrice, productData.secretCurrency]
        .map((part) => String(part ?? "").trim())
        .filter(Boolean)
        .join(" ")
    if (priceLabel) {
      lines.push(game.i18n.format("mtt.delivery.secretPrice", { value: priceLabel }))
    }
  }

  if (hasSecretValue(productData.secretDescription)) {
    lines.push(
      game.i18n.format("mtt.delivery.secretDescription", {
        value: String(productData.secretDescription ?? "").trim()
      })
    )
  }

  if (lines.length === 0) return ""

  const paragraphs = lines.map((line) => `<p>${escapeHTML(line).replace(/\r?\n/g, "<br>")}</p>`).join("")

  return `<section class="secret"><h4>${escapeHTML(game.i18n.localize("mtt.delivery.secretTitle"))}</h4>${paragraphs}</section>`
}

function addDeliveredItemDescriptionBlock(itemData, productData = {}) {
  if (!getModuleSetting("writeDeliveryDescriptionInfo")) return

  const visiblePath = String(getModuleSetting("itemDescriptionPath") ?? "").trim()
  const secretPath = String(getModuleSetting("itemSecretDescriptionPath") ?? "").trim()
  if (!visiblePath && !secretPath) return

  const originHtml = buildDeliveredItemOriginHtml(productData)
  const secretHtml = buildDeliveredItemSecretHtml(productData)
  if (!originHtml && !secretHtml) return

  if (visiblePath && (!secretPath || secretPath === visiblePath)) {
    const originalVisible = String(foundry.utils.getProperty(itemData, visiblePath) ?? "")
    const parts = secretPath === visiblePath ? [originHtml, secretHtml, originalVisible] : [originHtml, originalVisible]
    foundry.utils.setProperty(itemData, visiblePath, parts.filter(Boolean).join("\n"))
    return
  }

  if (visiblePath && originHtml) {
    const originalVisible = String(foundry.utils.getProperty(itemData, visiblePath) ?? "")
    foundry.utils.setProperty(itemData, visiblePath, [originHtml, originalVisible].filter(Boolean).join("\n"))
  }

  if (secretPath && secretHtml) {
    const originalSecret = String(foundry.utils.getProperty(itemData, secretPath) ?? "")
    foundry.utils.setProperty(itemData, secretPath, [secretHtml, originalSecret].filter(Boolean).join("\n"))
  }
}

function buildVisibleProductItemDataFromCatalogProduct(catalogProduct, quantity) {
  const itemData = foundry.utils.deepClone(catalogProduct.itemData ?? {})
  delete itemData._id
  delete itemData.uuid

  if (catalogProduct.img) itemData.img = catalogProduct.img

  if (itemData.flags?.[MTT.ID]) delete itemData.flags[MTT.ID]
  foundry.utils.setProperty(itemData, `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}`, {
    sourceUuid: catalogProduct.sourceUuid ?? "",
    ownershipLevel: catalogProduct.ownershipLevel,
    isHidden: Boolean(catalogProduct.isHidden)
  })
  setItemDataQuantity(itemData, quantity, null)

  return itemData
}

function getDeliveryQuantityPath(itemData, config) {
  return config.quantityPath || getQuantityPathForItem(itemData)
}

function createDeliveryResult({ actor = null, productData = {}, quantityToDeliver = 0 } = {}) {
  const requestedQuantity = Number(quantityToDeliver)

  return {
    ok: false,
    actor,
    productId: productData.id ?? "",
    sourceUuid: getMttSourceUuid(null, productData),
    requestedQuantity: Number.isFinite(requestedQuantity) ? requestedQuantity : 0,
    deliveredQuantity: 0,
    updated: [],
    created: [],
    warnings: [],
    errors: []
  }
}

function getDeliverySimulationQuantity(item, quantityPath, quantityMode = "system") {
  if (quantityMode === "productFlag") {
    return normalizeItemQuantity(item?.getFlag?.(MTT.ID, MTT.FLAGS.PRODUCT)?.quantity, 0)
  }

  return normalizeItemQuantity(getConfiguredItemQuantity(item, quantityPath), 0)
}

function simulatePurchasedItemDeliveryToActor(actor, productData, deliveredItemData, quantityToDeliver, options = {}) {
  const result = createDeliveryResult({ actor, productData, quantityToDeliver })
  const requestedQuantity = Number(quantityToDeliver)

  if (!actor) {
    result.errors.push(game.i18n.localize("mtt.sessions.errors.deliveryActorMissing"))
    return result
  }

  if (!deliveredItemData || typeof deliveredItemData !== "object") {
    result.errors.push(game.i18n.localize("mtt.sessions.errors.deliveryItemDataMissing"))
    return result
  }

  if (!Number.isFinite(requestedQuantity) || !Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
    result.errors.push(game.i18n.localize("mtt.sessions.errors.deliveryQuantityInvalid"))
    return result
  }

  const quantityMode = options.quantityMode === "productFlag" ? "productFlag" : "system"
  const config = getDeliveryStackingConfig()
  const quantityPath = getDeliveryQuantityPath(deliveredItemData, config)
  if (!quantityPath && quantityMode !== "productFlag") {
    result.errors.push(game.i18n.localize("mtt.sessions.errors.deliveryQuantityPathMissing"))
    return result
  }

  let remaining = normalizeItemQuantity(requestedQuantity, 0)

  const compatibleItems = actor.items
    .filter((item) => quantityMode !== "productFlag" || item.getFlag?.(MTT.ID, MTT.FLAGS.PRODUCT)?.enabled === true)
    .map((item) => ({
      item,
      mergeMode: getDeliveredItemMergeMode(item, deliveredItemData, productData)
    }))
    .filter(({ mergeMode }) => Boolean(mergeMode))

  for (const { item, mergeMode } of compatibleItems) {
    if (remaining <= 0) break

    const currentQuantity = getDeliverySimulationQuantity(item, quantityPath, quantityMode)
    const maxQuantity =
      quantityMode === "productFlag"
        ? Infinity
        : normalizeMaxQuantity(getConfiguredItemMaxQuantity(item, config.maxQuantityPath))
    const availableSpace = getAvailableStackSpace(currentQuantity, maxQuantity)
    if (availableSpace <= 0) continue

    const quantityToAdd = maxQuantity === Infinity ? remaining : Math.min(remaining, availableSpace)
    const quantity = currentQuantity + quantityToAdd
    if (quantityToAdd <= 0) continue

    result.updated.push({
      item,
      itemId: item.id ?? "",
      name: item.name ?? deliveredItemData.name ?? "",
      beforeQuantity: currentQuantity,
      addedQuantity: quantityToAdd,
      afterQuantity: quantity,
      mergeMode
    })
    remaining -= quantityToAdd
  }

  const maxQuantity =
    quantityMode === "productFlag"
      ? Infinity
      : normalizeMaxQuantity(getConfiguredItemMaxQuantity(deliveredItemData, config.maxQuantityPath))

  while (remaining > 0) {
    const quantity = maxQuantity === Infinity ? remaining : Math.min(remaining, maxQuantity)
    if (quantity <= 0) break

    result.created.push({
      name: deliveredItemData.name ?? "",
      quantity,
      mergeMode: "none"
    })
    remaining -= quantity
  }

  result.ok = remaining === 0
  result.deliveredQuantity = result.ok ? requestedQuantity : requestedQuantity - remaining
  if (!result.ok) result.errors.push(game.i18n.localize("mtt.sessions.errors.deliveryIncomplete"))

  return result
}

async function deliverPurchasedItemToActor(actor, productData, deliveredItemData, quantityToDeliver) {
  const simulation = simulatePurchasedItemDeliveryToActor(actor, productData, deliveredItemData, quantityToDeliver)
  if (!simulation.ok) return simulation

  const config = getDeliveryStackingConfig()
  const quantityPath = getDeliveryQuantityPath(deliveredItemData, config)
  const result = {
    ...simulation,
    deliveredQuantity: 0,
    updated: [],
    created: []
  }

  try {
    for (const stack of simulation.updated) {
      await stack.item.update({ [quantityPath]: stack.afterQuantity })
      result.updated.push(stack)
      result.deliveredQuantity += stack.addedQuantity
    }

    for (const stack of simulation.created) {
      const itemData = foundry.utils.deepClone(deliveredItemData)
      foundry.utils.setProperty(itemData, quantityPath, stack.quantity)
      addDeliveredItemDescriptionBlock(itemData, productData)
      const productFlagPath = `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}`
      const productFlags = foundry.utils.getProperty(itemData, productFlagPath) ?? {}
      const nextSourceUuid =
        productData?.sourceIsCommerciallyModified === true
          ? String(productData?.sourceItemUuid ?? "").trim()
          : getMttSourceUuid(itemData, productData)
      foundry.utils.setProperty(itemData, productFlagPath, {
        ...productFlags,
        sourceUuid: nextSourceUuid,
        isCommerciallyModified: false
      })
      const documents = await actor.createEmbeddedDocuments("Item", [itemData])
      const item = documents[0]
      if (!item) throw new Error(game.i18n.localize("mtt.sessions.errors.deliveryCreationFailed"))

      result.created.push({
        item,
        itemId: item.id ?? "",
        name: item.name ?? stack.name,
        quantity: stack.quantity,
        mergeMode: "none"
      })
      result.deliveredQuantity += stack.quantity
    }
  } catch (error) {
    result.ok = false
    result.errors.push(error?.message || game.i18n.localize("mtt.sessions.errors.deliveryFailed"))
  }

  return result
}

// MTT base — livraison d'un achat marchand vers une destination MTT avec les règles communes de fusion
async function deliverPurchasedProductToMttDestination(destinationActor, transfer) {
  const productData = transfer?.deliveryProductData
  const deliveredItemData = transfer?.deliveredItemData
  const quantityToDeliver = transfer?.quantityToDeliver
  const simulation = simulatePurchasedItemDeliveryToActor(
    destinationActor,
    productData,
    deliveredItemData,
    quantityToDeliver,
    { quantityMode: "productFlag" }
  )
  if (!simulation.ok) return simulation

  const config = getDeliveryStackingConfig()
  const quantityPath = getDeliveryQuantityPath(deliveredItemData, config)
  const result = {
    ...simulation,
    deliveredQuantity: 0,
    updated: [],
    created: []
  }

  try {
    const nextSourceUuid =
      productData?.sourceIsCommerciallyModified === true
        ? String(productData?.sourceItemUuid ?? "").trim()
        : getMttSourceUuid(deliveredItemData, productData)

    for (const stack of simulation.updated) {
      await updateCatalogProduct(destinationActor, stack.item.id, { quantity: stack.afterQuantity })
      result.updated.push(stack)
      result.deliveredQuantity += stack.addedQuantity
    }

    for (const stack of simulation.created) {
      const itemData = foundry.utils.deepClone(deliveredItemData)
      if (quantityPath) foundry.utils.setProperty(itemData, quantityPath, stack.quantity)
      addDeliveredItemDescriptionBlock(itemData, productData)
      if (itemData.flags?.[MTT.ID]?.[MTT.FLAGS.PRODUCT]) delete itemData.flags[MTT.ID][MTT.FLAGS.PRODUCT]
      const automaticCategory = getAutomaticItemCategory(itemData)
      const categoryValue = await getOrCreateAutomaticProductCategory(destinationActor, automaticCategory)

      const item = await addCatalogProduct(destinationActor, {
        itemData,
        productFlags: {
          enabled: true,
          sourceUuid: nextSourceUuid,
          quantity: stack.quantity,
          deliveryQuantityPerLot: productData?.deliveryQuantityPerLot ?? null,
          category: categoryValue,
          systemCategoryKey: automaticCategory?.key ?? "",
          systemCategoryLabel: automaticCategory?.label ?? "",
          systemCategoryPath: automaticCategory?.path ?? "",
          ownershipLevel: productData?.ownershipLevel ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
          isHidden: Boolean(productData?.isHidden),
          isCommerciallyModified: false
        }
      })
      if (!item) throw new Error(game.i18n.localize("mtt.sessions.errors.deliveryCreationFailed"))

      result.created.push({
        item,
        itemId: item.id ?? "",
        name: item.name ?? stack.name,
        quantity: stack.quantity,
        mergeMode: "none"
      })
      result.deliveredQuantity += stack.quantity
    }
  } catch (error) {
    result.ok = false
    result.errors.push(error?.message || game.i18n.localize("mtt.sessions.errors.deliveryFailed"))
  }

  return result
}

function getSourceActorUuid(item) {
  return item?.parent?.documentName === "Actor" ? item.parent.uuid : ""
}

async function getClientActor(session, errors) {
  const actorUuid = String(session?.actorUuid ?? "").trim()
  if (!actorUuid) {
    errors.push(game.i18n.localize("mtt.sessions.errors.clientMissing"))
    return null
  }

  try {
    const actor = await fromUuid(actorUuid)
    if (actor?.documentName === "Actor") return actor
  } catch {
    // ignore
  }

  errors.push(game.i18n.localize("mtt.sessions.errors.clientMissing"))
  return null
}

export async function buildSessionItemExecutionPlan(actor, session, options = {}) {
  const preview = await buildExecutionPreview(actor, session, options)
  const errors = [...(preview.errors ?? [])]
  const clientActor = await getClientActor(session, errors)
  const clientMttEntityType = getMTTEntityType(clientActor)
  const clientIsMtt = [MTT.ENTITY_TYPES.MERCHANT, MTT.ENTITY_TYPES.STORAGE].includes(clientMttEntityType)
  const operations = {
    productTransfers: [],
    serviceTransfers: [],
    sellerTransfers: []
  }
  const deliveryPlans = []
  const reservedMerchantQuantities = new Map()
  const reservedServiceQuantities = new Map()

  if (!session || ((session.buyerItems ?? []).length === 0 && (session.sellerItems ?? []).length === 0)) {
    if (!errors.includes(game.i18n.localize("mtt.sessions.errors.emptySession"))) {
      errors.push(game.i18n.localize("mtt.sessions.errors.emptySession"))
    }
  }

  const accessClient = getExecutionAccessClients(actor, options).find(
    (client) => client.actorUuid === session?.actorUuid
  )
  if (!accessClient?.isAuthorized) {
    errors.push(game.i18n.localize("mtt.sessions.errors.clientNotAuthorized"))
  }

  if (preview.currencyTransferPlan && !preview.currencyTransferPlan.canExecute) {
    for (const err of preview.currencyTransferPlan.errors ?? []) {
      if (!errors.includes(err)) errors.push(err)
    }
  }

  if ((session?.negotiations ?? []).some((negotiation) => negotiation.status === "active")) {
    errors.push(game.i18n.localize("mtt.sessions.errors.activeNegotiation"))
  }

  for (const item of session?.buyerItems ?? []) {
    if (item.type !== "product") continue

    const catalogProduct = getCatalogProduct(actor, item.sourceId)
    if (!catalogProduct) {
      errors.push(game.i18n.format("mtt.sessions.errors.merchantProductMissing", { name: item.name }))
      continue
    }

    const availableQuantity = normalizeFiniteQuantity(catalogProduct.quantity)
    const hasLimitedQuantity = !isUnlimitedQuantity(catalogProduct.quantity)
    const requestedQuantity = Number(item.quantity)
    const deliveryQuantityPerLot = normalizeEffectiveDeliveryQuantityPerLot(
      item.deliveryQuantityPerLot ?? catalogProduct.deliveryQuantityPerLot
    )
    const quantityToDeliver = clientIsMtt
      ? Math.floor(requestedQuantity)
      : Math.floor(requestedQuantity * deliveryQuantityPerLot)
    const reservedQuantity = reservedMerchantQuantities.get(catalogProduct.id) ?? 0
    const totalRequestedQuantity = reservedQuantity + requestedQuantity

    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      errors.push(game.i18n.format("mtt.sessions.errors.merchantStockInsufficient", { name: item.name }))
      continue
    }

    if (hasLimitedQuantity && (availableQuantity === null || availableQuantity < totalRequestedQuantity)) {
      errors.push(game.i18n.format("mtt.sessions.errors.merchantStockInsufficient", { name: item.name }))
      continue
    }

    reservedMerchantQuantities.set(catalogProduct.id, totalRequestedQuantity)

    // MTT base — skipCommercialDeliveryText: true pour le stockage (transfert brut sans enrichissement commercial)
    const skipCommercial = Boolean(options.skipCommercialDeliveryText)
    const deliveryProductData = {
      id: catalogProduct.id,
      sourceUuid: catalogProduct.sourceUuid,
      sourceItemUuid: toItemOnlyUuid(actor.items.get(catalogProduct.id)?.uuid),
      sourceIsCommerciallyModified: Boolean(catalogProduct.isCommerciallyModified),
      ownershipLevel: catalogProduct.ownershipLevel,
      isHidden: Boolean(catalogProduct.isHidden),
      merchantName: skipCommercial ? "" : (actor?.name ?? ""),
      transactionNumber: skipCommercial ? undefined : options.transactionNumber,
      deliveryQuantityPerLot: deliveryQuantityPerLot > 1 ? deliveryQuantityPerLot : null,
      isCommerciallyModified: Boolean(catalogProduct.isCommerciallyModified),
      secretName: skipCommercial ? "" : (catalogProduct.secretName ?? ""),
      secretPrice: skipCommercial ? "" : (catalogProduct.secretPrice ?? ""),
      secretCurrency: skipCommercial ? "" : (catalogProduct.secretCurrency ?? ""),
      secretDescription: skipCommercial ? "" : (catalogProduct.secretDescription ?? "")
    }
    const deliveredItemData = buildVisibleProductItemDataFromCatalogProduct(catalogProduct, quantityToDeliver)
    const deliveryPlan = simulatePurchasedItemDeliveryToActor(
      clientActor,
      deliveryProductData,
      deliveredItemData,
      quantityToDeliver,
      clientIsMtt ? { quantityMode: "productFlag" } : {}
    )
    deliveryPlans.push(deliveryPlan)
    if (!deliveryPlan.ok) {
      errors.push(...deliveryPlan.errors)
      continue
    }

    operations.productTransfers.push({
      sessionItem: item,
      catalogProduct,
      deliveryProductData,
      deliveredItemData,
      deliveryPlan,
      quantity: requestedQuantity,
      quantityToDeliver,
      nextQuantity: hasLimitedQuantity ? Number((availableQuantity - totalRequestedQuantity).toFixed(2)) : null,
      hasLimitedQuantity
    })
  }

  for (const item of session?.buyerItems ?? []) {
    if (item.type !== "service") continue

    const service = getMerchantData(actor)?.catalog?.services?.find((entry) => entry.id === item.sourceId)
    if (!service) {
      errors.push(game.i18n.format("mtt.sessions.errors.merchantServiceMissing", { name: item.name }))
      continue
    }

    const availableQuantity = normalizeFiniteQuantity(service.quantity)
    const hasLimitedQuantity = !isUnlimitedQuantity(service.quantity)
    const requestedQuantity = Number(item.quantity)
    const unitPriceValue = Number(item.unitPriceValue)
    const reservedQuantity = reservedServiceQuantities.get(service.id) ?? 0
    const totalRequestedQuantity = reservedQuantity + requestedQuantity

    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      errors.push(game.i18n.format("mtt.sessions.errors.serviceQuantityInsufficient", { name: item.name }))
      continue
    }

    if (isFreePriceService(service) && (!item.isFreePrice || !Number.isFinite(unitPriceValue) || unitPriceValue <= 0)) {
      errors.push(game.i18n.format("mtt.sessions.errors.serviceFreePriceInvalid", { name: item.name }))
      continue
    }

    if (hasLimitedQuantity && (availableQuantity === null || availableQuantity < totalRequestedQuantity)) {
      errors.push(game.i18n.format("mtt.sessions.errors.serviceQuantityInsufficient", { name: item.name }))
      continue
    }

    reservedServiceQuantities.set(service.id, totalRequestedQuantity)
    operations.serviceTransfers.push({
      sessionItem: item,
      service,
      quantity: requestedQuantity,
      stockBefore: hasLimitedQuantity ? Number((availableQuantity - reservedQuantity).toFixed(2)) : null,
      stockAfter: hasLimitedQuantity ? Number((availableQuantity - totalRequestedQuantity).toFixed(2)) : null,
      hasLimitedQuantity
    })
  }

  for (const item of session?.sellerItems ?? []) {
    if (isSessionMoneyItem(item)) continue

    const sourceUuid = String(item.sourceUuid ?? "").trim()
    let sourceItem = getSellerSourceItemFromSessionItem(item)

    if (!sourceItem && sourceUuid) {
      try {
        sourceItem = await fromUuid(sourceUuid)
      } catch {
        sourceItem = null
      }
    }

    if (!sourceItem || sourceItem.documentName !== "Item") {
      errors.push(game.i18n.format("mtt.sessions.errors.sellerItemMissing", { name: item.name }))
      continue
    }

    if (clientActor && getSourceActorUuid(sourceItem) !== clientActor.uuid) {
      errors.push(game.i18n.format("mtt.sessions.errors.sellerItemMissing", { name: item.name }))
      continue
    }

    // MTT base — les sellerItems peuvent venir d'un Item classique ou d'un produit MTT embedded.
    const sourceIsMttProduct = isMerchantProductItem(sourceItem)
    const productFlags = sourceIsMttProduct ? getMerchantProductFlags(sourceItem) : null
    const availableQuantity = sourceIsMttProduct ? normalizeFiniteQuantity(productFlags.quantity) : getItemAvailableQuantity(sourceItem)
    const hasLimitedQuantity = sourceIsMttProduct
      ? !isUnlimitedQuantity(productFlags.quantity)
      : Number.isFinite(availableQuantity) && availableQuantity >= 0
    const requestedQuantity = Number(item.quantity)

    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      errors.push(game.i18n.format("mtt.sessions.errors.sellerQuantityInsufficient", { name: item.name }))
      continue
    }

    if (hasLimitedQuantity && (!Number.isFinite(availableQuantity) || availableQuantity < requestedQuantity)) {
      errors.push(game.i18n.format("mtt.sessions.errors.sellerQuantityInsufficient", { name: item.name }))
      continue
    }

    const quantityPath = sourceIsMttProduct
      ? `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}.quantity`
      : getQuantityPathForItem(sourceItem)
    if (hasLimitedQuantity && !quantityPath) {
      errors.push(game.i18n.format("mtt.sessions.errors.sellerQuantityInsufficient", { name: item.name }))
      continue
    }

    operations.sellerTransfers.push({
      sessionItem: item,
      sourceItem,
      quantityPath,
      quantity: requestedQuantity,
      nextQuantity: hasLimitedQuantity ? Number((availableQuantity - requestedQuantity).toFixed(2)) : null,
      hasLimitedQuantity
    })
  }

  return {
    ...preview,
    canExecute: errors.length === 0,
    errors: Array.from(new Set(errors)),
    clientActor,
    deliveryPlans,
    operations
  }
}

function isGameSystemActor(actor) {
  if (!actor || actor.documentName !== "Actor") return false
  const entityType = getMTTEntityType(actor)
  return ![MTT.ENTITY_TYPES.MERCHANT, MTT.ENTITY_TYPES.STORAGE].includes(entityType)
}

export async function executeSessionItemTransfers(actor, plan) {
  const clientActor = plan.clientActor
  if (!clientActor) throw new Error(game.i18n.localize("mtt.sessions.errors.clientMissing"))
  const clientMttEntityType = getMTTEntityType(clientActor)
  const clientIsMtt = [MTT.ENTITY_TYPES.MERCHANT, MTT.ENTITY_TYPES.STORAGE].includes(clientMttEntityType)

  const deliveries = []
  const executionResult = {
    ok: false,
    deliveries,
    delivered: deliveries,
    merchantStockUpdates: [],
    services: [],
    warnings: [],
    errors: []
  }

  const deliveryPreflightPlans = plan.operations.productTransfers.map((transfer) =>
    simulatePurchasedItemDeliveryToActor(
      clientActor,
      transfer.deliveryProductData,
      transfer.deliveredItemData,
      transfer.quantityToDeliver,
      clientIsMtt ? { quantityMode: "productFlag" } : {}
    )
  )
  const deliveryPreflightErrors = deliveryPreflightPlans.flatMap((deliveryPlan) => deliveryPlan.errors)
  if (deliveryPreflightErrors.length > 0) {
    executionResult.errors.push(...deliveryPreflightErrors)
    throw new Error(deliveryPreflightErrors.join(" "))
  }

  for (const transfer of plan.operations.productTransfers) {
    const delivery = clientIsMtt
      ? await deliverPurchasedProductToMttDestination(clientActor, transfer)
      : await deliverPurchasedItemToActor(
          clientActor,
          transfer.deliveryProductData,
          transfer.deliveredItemData,
          transfer.quantityToDeliver
        )
    if (!delivery.ok) throw new Error(delivery.errors.join(" "))
    if (delivery.deliveredQuantity !== transfer.quantityToDeliver) {
      throw new Error(game.i18n.localize("mtt.sessions.errors.deliveryQuantityMismatch"))
    }

    executionResult.deliveries.push(delivery)

    if (transfer.hasLimitedQuantity) {
      const actorEntityType = getMTTEntityType(actor)
      const actorIsShop = actorEntityType === MTT.ENTITY_TYPES.MERCHANT
      const nextQuantity = Number(transfer.nextQuantity)
      const shouldHideEmptyShopProduct = actorIsShop && Number.isFinite(nextQuantity) && nextQuantity <= 0

      await updateCatalogProduct(actor, transfer.catalogProduct.id, {
        quantity: transfer.nextQuantity,
        ...(shouldHideEmptyShopProduct ? { isHidden: true } : {})
      })
    }

    executionResult.merchantStockUpdates.push({
      itemId: transfer.catalogProduct.id,
      name: transfer.catalogProduct.name,
      purchasedQuantity: transfer.quantity,
      remainingQuantity: transfer.nextQuantity,
      hasLimitedQuantity: transfer.hasLimitedQuantity
    })
  }

  if (isMTTStorage(actor)) {
    for (const transfer of plan.operations.productTransfers) {
      const item = actor.items.get(transfer.catalogProduct.id)
      if (!item) continue
      const storageFlags = getStorageItemFlags(item)
      if (!storageFlags.warningGM) continue
      await ChatMessage.create({
        content: game.i18n.format("mtt.storage.statuses.warningGM.chatMessage", {
          itemName: transfer.catalogProduct.name,
          storageName: actor.name,
          clientName: clientActor.name
        }),
        whisper: ChatMessage.getWhisperRecipients("GM"),
        speaker: { alias: game.i18n.localize("mtt.storage.statuses.warningGM.speaker") }
      })
    }
  }

  if (plan.operations.serviceTransfers.length > 0) {
    const services = foundry.utils.deepClone(getMerchantData(actor)?.catalog?.services ?? [])

    for (const transfer of plan.operations.serviceTransfers) {
      const service = services.find((entry) => entry.id === transfer.service.id)
      if (!service) {
        throw new Error(
          game.i18n.format("mtt.sessions.errors.merchantServiceMissing", { name: transfer.sessionItem.name })
        )
      }

      if (transfer.hasLimitedQuantity) service.quantity = transfer.stockAfter

      // TODO MTT services secrets:
      // Add an owner-only / GM-only secret description block for services.
      // This block must later be copied into the merchant transaction journal.
      executionResult.services.push({
        serviceId: service.id,
        name: transfer.sessionItem.name,
        quantity: transfer.quantity,
        unitPriceValue: transfer.sessionItem.unitPriceValue,
        proposedUnitPriceValue: transfer.sessionItem.proposedUnitPriceValue,
        acceptedUnitPriceValue: transfer.sessionItem.unitPriceValue,
        totalPriceValue: transfer.sessionItem.totalPriceValue,
        currency: transfer.sessionItem.priceCurrency,
        isFreePrice: Boolean(transfer.sessionItem.isFreePrice),
        stockBefore: transfer.stockBefore,
        stockAfter: transfer.stockAfter,
        buyer: clientActor.uuid,
        merchant: actor.uuid,
        status: "validated"
      })
    }

    await updateMerchantData(actor, { catalog: { services } })
  }

  for (const transfer of plan.operations.sellerTransfers) {
    const automaticCategory = getAutomaticItemCategory(transfer.sourceItem)
    const categoryValue = await getOrCreateAutomaticProductCategory(actor, automaticCategory)
    const sourceProductFlags = transfer.sourceItem.getFlag?.(MTT.ID, MTT.FLAGS.PRODUCT) ?? {}
    const sourceIsCommerciallyModified = Boolean(sourceProductFlags.isCommerciallyModified)
    const sourceItemUuid = toItemOnlyUuid(transfer.sourceItem.uuid)
    const deliveredItemData = transfer.sourceItem.toObject()
    const productData = {
      sourceUuid: String(sourceProductFlags.sourceUuid ?? "").trim(),
      sourceItemUuid,
      sourceIsCommerciallyModified
    }
    const existingMerchantItem =
      Array.from(actor.items.values()).find((item) =>
        Boolean(getDeliveredItemMergeMode(item, deliveredItemData, productData))
      ) ?? null

    if (existingMerchantItem) {
      const existingFlags = existingMerchantItem.getFlag?.(MTT.ID, MTT.FLAGS.PRODUCT) ?? {}
      const currentQuantity = isUnlimitedQuantity(existingFlags.quantity)
        ? 0
        : Number.isFinite(Number(existingFlags.quantity))
          ? Number(existingFlags.quantity)
          : 0
      await updateCatalogProduct(actor, existingMerchantItem.id, {
        quantity: Number((currentQuantity + transfer.quantity).toFixed(2))
      })
    } else {
      const nextSourceUuid = sourceIsCommerciallyModified
        ? sourceItemUuid
        : String(sourceProductFlags.sourceUuid ?? sourceItemUuid).trim()
      const { itemData, productFlags } = buildCatalogProductFromItem(transfer.sourceItem, {
        categoryValue,
        automaticCategory,
        sourceUuid: nextSourceUuid
      })
      await addCatalogProduct(actor, {
        itemData,
        productFlags: { ...productFlags, quantity: transfer.quantity, isCommerciallyModified: false }
      })
    }

    if (transfer.hasLimitedQuantity) {
      const nextQuantity = Number(transfer.nextQuantity)
      const sourceActor = transfer.sourceItem?.parent?.documentName === "Actor" ? transfer.sourceItem.parent : null
      const shouldDeleteSystemActorItem =
        Number.isFinite(nextQuantity) &&
        nextQuantity <= 0 &&
        isGameSystemActor(sourceActor) &&
        game.settings.get(MTT.ID, "deleteEmptySystemActorItems") === true
      const sourceEntityType = getMTTEntityType(sourceActor)
      const sourceIsShop = sourceEntityType === MTT.ENTITY_TYPES.MERCHANT
      const sourceIsMttProduct = isMerchantProductItem(transfer.sourceItem)
      const shouldHideEmptySourceShopProduct =
        sourceIsShop && sourceIsMttProduct && Number.isFinite(nextQuantity) && nextQuantity <= 0

      if (shouldDeleteSystemActorItem) {
        await sourceActor.deleteEmbeddedDocuments("Item", [transfer.sourceItem.id])
      } else if (sourceIsShop && sourceIsMttProduct) {
        await updateCatalogProduct(sourceActor, transfer.sourceItem.id, {
          quantity: Math.max(0, nextQuantity),
          ...(shouldHideEmptySourceShopProduct ? { isHidden: true } : {})
        })
      } else {
        await transfer.sourceItem.update({
          [transfer.quantityPath]: Math.max(0, nextQuantity)
        })
      }
    }
  }

  executionResult.ok = true
  return executionResult
}

export function clearSessionAfterExecution(session) {
  session.buyerItems = []
  session.sellerItems = []
  session.negotiations = []
  session.status = "active"
  session.isSubmitted = false
  session.updatedAt = new Date().toISOString()
  return session
}
