// MTT base — modèle et manipulation commune des sessions shop/storage.
// Ce fichier ne gère pas les sockets et ne réalise pas les transferts métier.

import { getMerchantData } from "../../documents/shop-flags.mjs"
import {
  getCatalogProduct,
  isMerchantProductItem,
  getMerchantProductFlags
} from "../../documents/merchant-products.mjs"
import { getItemAvailableQuantity } from "./merchant-catalog.mjs"
import {
  getReferenceSessionCurrency,
  normalizeEffectiveDeliveryQuantityPerLot,
  isUnlimitedQuantity,
  normalizeFiniteQuantity
} from "./merchant-utils.mjs"

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

export function getSellerSourceItemFromSessionItem(item) {
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

export function getSellerSourceAvailableQuantity(sourceItem, fallbackItem = null) {
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

export function syncSessionItemAvailability(actor, item) {
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

// ─── Session lifecycle ────────────────────────────────────────────────────────

export function clearSessionAfterExecution(session) {
  session.buyerItems = []
  session.sellerItems = []
  session.negotiations = []
  session.status = "active"
  session.isSubmitted = false
  session.updatedAt = new Date().toISOString()
  return session
}
