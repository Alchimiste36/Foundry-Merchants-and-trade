import { MTT } from "../../config/constants.mjs"
import { getCurrencies } from "../../config/settings.mjs"
import {
  normalizeCurrencyKey,
  formatCurrencyLabel,
  formatPriceLabel,
  createCheckMessage,
} from "./merchant-utils.mjs"
import { getItemAvailableQuantity } from "./merchant-catalog.mjs"

// ─── Session normalization ────────────────────────────────────────────────────

export function normalizeSessionItem(item) {
  const quantity = Number(item.quantity)
  const unitPriceValue = Number(item.unitPriceValue)
  const availableQuantity = Number(item.availableQuantity)
  const hasLimitedQuantity =
    Boolean(item.hasLimitedQuantity) && Number.isFinite(availableQuantity) && availableQuantity >= 0
  const normalizedQuantity = Number.isFinite(quantity) && quantity >= 0 ? quantity : 1
  const normalizedUnitPrice = Number.isFinite(unitPriceValue) && unitPriceValue >= 0 ? unitPriceValue : 0

  return {
    id: item.id || foundry.utils.randomID(),
    type: ["product", "service", "item"].includes(item.type) ? item.type : "product",
    sourceUuid: item.sourceUuid ?? "",
    sourceActorUuid: item.sourceActorUuid ?? "",
    sourceId: item.sourceId ?? "",
    name: item.name ?? "",
    img: item.img ?? "",
    quantity: normalizedQuantity,
    availableQuantity: hasLimitedQuantity ? availableQuantity : null,
    hasLimitedQuantity,
    unitPriceValue: normalizedUnitPrice,
    priceCurrency: String(item.priceCurrency ?? "").trim(),
    totalPriceValue: Number((normalizedQuantity * normalizedUnitPrice).toFixed(2)),
    sourceLabel: item.sourceLabel ?? "",
    proposedUnitPriceValue: Number.isFinite(Number(item.proposedUnitPriceValue))
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
        : null,
  }
}

export function normalizeSession(session) {
  return {
    id: session.id || foundry.utils.randomID(),
    status: ["active", "pending", "validated", "refused"].includes(session.status) ? session.status : "active",
    label: session.label || game.i18n.localize("mtt.sessions.newLabel"),
    actorUuid: session.actorUuid ?? "",
    actorName: session.actorName ?? "",
    userId: session.userId ?? "",
    userName: session.userName ?? "",
    buyerItems: Array.isArray(session.buyerItems)
      ? session.buyerItems.map((item) => normalizeSessionItem(item))
      : [],
    sellerItems: Array.isArray(session.sellerItems)
      ? session.sellerItems.map((item) => normalizeSessionItem(item))
      : [],
    createdAt: session.createdAt || new Date().toISOString(),
    updatedAt: session.updatedAt || new Date().toISOString(),
  }
}

export function buildSessionData(client = null) {
  const now = new Date().toISOString()
  const actorName = client?.actorName ?? ""

  return {
    id: foundry.utils.randomID(),
    status: "active",
    label: actorName
      ? game.i18n.format("mtt.sessions.sessionForActor", { name: actorName })
      : game.i18n.localize("mtt.sessions.newLabel"),
    actorUuid: client?.actorUuid ?? "",
    actorName,
    userId: client?.userId ?? "",
    userName: client?.userName ?? "",
    buyerItems: [],
    sellerItems: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function getSessions(actor) {
  return foundry.utils.deepClone(actor.system.sessions?.entries ?? [])
}

// ─── Session item helpers ─────────────────────────────────────────────────────

export function recalculateSessionItemTotal(item) {
  const quantity = Number(item.quantity)
  const unitPriceValue = Number(item.unitPriceValue)

  item.totalPriceValue =
    Number.isFinite(quantity) && Number.isFinite(unitPriceValue)
      ? Number((quantity * unitPriceValue).toFixed(2))
      : 0
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

  return (
    initialBuyerCount !== session.buyerItems.length ||
    initialSellerCount !== session.sellerItems.length
  )
}

export function syncSessionItemAvailability(actor, item) {
  if (!item) return

  if (item.type === "product") {
    const source = actor.items.get(item.sourceId)
    const product = source?.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {}
    const availableQuantity = Number(product.quantity ?? MTT.PRODUCT_DEFAULTS.quantity)
    const hasLimitedQuantity = Number.isFinite(availableQuantity) && availableQuantity >= 0

    item.availableQuantity = hasLimitedQuantity ? availableQuantity : null
    item.hasLimitedQuantity = hasLimitedQuantity
    return
  }

  if (item.type === "service") {
    const service = actor.system.services?.entries?.find((entry) => entry.id === item.sourceId)
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
  }
}

export function canUseSessionQuantity(actor, item, quantity) {
  syncSessionItemAvailability(actor, item)

  const requestedQuantity = Number(quantity)
  if (!Number.isFinite(requestedQuantity) || requestedQuantity < 0) return false
  if (!item.hasLimitedQuantity) return true

  const availableQuantity = Number(item.availableQuantity)
  if (!Number.isFinite(availableQuantity) || availableQuantity < 0) return true

  return requestedQuantity <= availableQuantity
}

// ─── Session totals and adjustments ──────────────────────────────────────────

export function prepareSessionTotals(items) {
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
      totalPriceLabel: formatPriceLabel(roundedTotal, currency === "__none" ? "" : currency),
    }
  })
}

export function prepareMoneyAdjustments(buyerTotals, sellerTotals) {
  const totalsByCurrency = new Map()

  buyerTotals.forEach((total) => {
    totalsByCurrency.set(total.currency, {
      currency: total.currency,
      buyer: Number(total.totalPriceValue) || 0,
      seller: 0,
    })
  })

  sellerTotals.forEach((total) => {
    const existing = totalsByCurrency.get(total.currency) ?? {
      currency: total.currency,
      buyer: 0,
      seller: 0,
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
        isMoneyAdjustment: true,
      }
    })
    .filter(Boolean)
}

export function getSessionStatusNotice(status) {
  if (status === "pending") return game.i18n.localize("mtt.sessions.pendingNotice")
  if (status === "validated") return game.i18n.localize("mtt.sessions.validatedNoTransfer")
  if (status === "refused") return game.i18n.localize("mtt.sessions.refusedNotice")
  return game.i18n.localize("mtt.sessions.activeNotice")
}

// ─── Session context preparation ─────────────────────────────────────────────

export function prepareSessionCheckContext(sessionCheckResult) {
  if (!sessionCheckResult?.checked) {
    return {
      checked: false,
      canProceed: false,
      infos: [],
      warnings: [],
      errors: [],
      hasInfos: false,
      hasWarnings: false,
      hasErrors: false,
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
    hasErrors: errors.length > 0,
  }
}

export function prepareSessionClientContext(session, accessClients) {
  const actorUuid = String(session?.actorUuid ?? "").trim()
  if (!actorUuid) {
    return {
      hasClient: false,
      actorUuid: "",
      actorName: "",
      actorImg: "",
      userName: "",
      isAuthorized: false,
      isUnauthorized: false,
    }
  }

  const client =
    accessClients.find((entry) => entry.actorUuid === actorUuid) ??
    normalizeAccessClient({
      actorUuid,
      actorName: session.actorName ?? "",
      userId: session.userId ?? "",
      userName: session.userName ?? "",
      isAuthorized: false,
    })

  return {
    hasClient: true,
    actorUuid: client.actorUuid,
    actorName: client.actorName || session.actorName || game.i18n.localize("mtt.access.noClient"),
    actorImg: client.actorImg,
    userName: client.userName || session.userName || "",
    isAuthorized: Boolean(client.isAuthorized),
    isUnauthorized: !client.isAuthorized,
  }
}

export function prepareSessionContext(actor, { session, selectedClient, sessionCheckResult, sellPercent, accessClients }) {
  const checkResult = prepareSessionCheckContext(sessionCheckResult)

  if (!session) {
    return {
      id: "",
      label: "",
      status: "",
      statusLabel: "",
      buyerItems: [],
      sellerItems: [],
      hasBuyerItems: false,
      hasSellerItems: false,
      buyerTotalByCurrency: [],
      sellerTotalByCurrency: [],
      hasBuyerTotals: false,
      hasSellerTotals: false,
      hasSession: false,
      hasSelectedClient: Boolean(selectedClient?.actorUuid),
      canEdit: false,
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
      client: {
        hasClient: Boolean(selectedClient?.actorUuid),
        actorUuid: selectedClient?.actorUuid ?? "",
        actorName: selectedClient?.actorName ?? "",
        actorImg: selectedClient?.actorImg ?? "",
        userName: selectedClient?.userName ?? "",
        isAuthorized: Boolean(selectedClient?.isAuthorized),
        isUnauthorized: Boolean(selectedClient?.actorUuid && !selectedClient?.isAuthorized),
      },
      checkResult,
    }
  }

  const buyerItems = (session.buyerItems ?? []).map((item) => {
    syncSessionItemAvailability(actor, item)
    recalculateSessionItemTotal(item)

    const minimumPriceValue = Number(item.minimumPriceValue)
    const hasMinimumPrice = item.isFreePrice && Number.isFinite(minimumPriceValue) && minimumPriceValue > 0

    return {
      ...item,
      sourceLabel: item.sourceLabel || game.i18n.localize(`mtt.sessions.item.${item.type}`),
      unitPriceLabel: formatPriceLabel(item.unitPriceValue, item.priceCurrency),
      totalPriceLabel: formatPriceLabel(item.totalPriceValue, item.priceCurrency),
      availableQuantityLabel: Number.isFinite(Number(item.availableQuantity)) ? String(item.availableQuantity) : "",
      isFreePrice: Boolean(item.isFreePrice),
      hasMinimumPrice,
      minimumPriceLabel: hasMinimumPrice ? formatPriceLabel(minimumPriceValue, item.priceCurrency) : "",
    }
  })

  const sellerItems = (session.sellerItems ?? []).map((item) => {
    recalculateSessionItemTotal(item)

    return {
      ...item,
      sourceLabel: item.sourceLabel || game.i18n.localize("mtt.sessions.item.object"),
      unitPriceLabel: formatPriceLabel(item.unitPriceValue, item.priceCurrency),
      totalPriceLabel: formatPriceLabel(item.totalPriceValue, item.priceCurrency),
      availableQuantityLabel: Number.isFinite(Number(item.availableQuantity)) ? String(item.availableQuantity) : "",
    }
  })

  const buyerTotalByCurrency = prepareSessionTotals(buyerItems)
  const sellerTotalByCurrency = prepareSessionTotals(sellerItems)
  const moneyAdjustments = prepareMoneyAdjustments(buyerTotalByCurrency, sellerTotalByCurrency)
  const buyerMoneyAdjustments = moneyAdjustments.filter((adjustment) => adjustment.side === "buyer")
  const sellerMoneyAdjustments = moneyAdjustments.filter((adjustment) => adjustment.side === "seller")
  const status = session.status ?? "active"
  const hasAnyItems = buyerItems.length > 0 || sellerItems.length > 0
  const client = prepareSessionClientContext(session, accessClients)

  return {
    id: session.id,
    label: session.label,
    status,
    statusLabel: game.i18n.localize(`mtt.sessions.status.${status}`),
    buyerItems,
    sellerItems,
    hasBuyerItems: buyerItems.length > 0,
    hasSellerItems: sellerItems.length > 0,
    buyerTotalByCurrency,
    sellerTotalByCurrency,
    hasBuyerTotals: buyerTotalByCurrency.length > 0,
    hasSellerTotals: sellerTotalByCurrency.length > 0,
    hasSession: true,
    canEdit: !["validated", "refused"].includes(status),
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
    client,
    checkResult,
  }
}

// ─── Access / client helpers ──────────────────────────────────────────────────

export function normalizeAccessClient(client) {
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
  }
}

export function buildAccessClientFromActor(actor, { user = null, isAuthorized = false, isFromPlayerCharacter = false } = {}) {
  return normalizeAccessClient({
    actorUuid: actor.uuid ?? "",
    actorId: actor.id ?? "",
    actorName: actor.name ?? "",
    actorImg: actor.img ?? "",
    actorType: actor.type ?? "",
    userId: user?.id ?? "",
    userName: user?.name ?? "",
    isAuthorized,
    isFromPlayerCharacter,
  })
}

export function getStoredAccessClients(actor) {
  const clients = actor.system.access?.clients ?? []
  const clientsByUuid = new Map()

  clients.forEach((client) => {
    const normalized = normalizeAccessClient(client)
    if (!normalized.actorUuid) return
    clientsByUuid.set(normalized.actorUuid, normalized)
  })

  return Array.from(clientsByUuid.values())
}

export function getAccessSessionBadgeIcon(status) {
  if (status === "active") return "fa-hourglass-half"
  if (status === "pending") return "fa-triangle-exclamation"
  if (status === "validated") return "fa-check"
  if (status === "refused") return "fa-xmark"
  return ""
}

export function getAccessSessionTooltipLabel(status) {
  if (status === "active") return game.i18n.localize("mtt.access.sessionActive")
  if (status === "pending") return game.i18n.localize("mtt.access.sessionPending")
  if (status === "validated") return game.i18n.localize("mtt.access.sessionValidated")
  if (status === "refused") return game.i18n.localize("mtt.access.sessionRefused")
  return game.i18n.localize("mtt.access.noSession")
}

export function formatAccessClientTooltip(client, { isEditable }) {
  const parts = [client.actorName, client.userName || client.sourceLabel, client.statusLabel].filter(Boolean)
  if (client.hasSession) parts.push(getAccessSessionTooltipLabel(client.sessionStatus))
  parts.push(game.i18n.localize(client.isAuthorized ? "mtt.access.leftClickOpenSession" : "mtt.access.leftClickAuthorize"))
  if (isEditable) parts.push(game.i18n.localize("mtt.access.rightClickManage"))
  return parts.join(" - ")
}

export function getBestSessionForClient(actor, actorUuid) {
  const normalizedActorUuid = String(actorUuid ?? "").trim()
  if (!normalizedActorUuid) return null

  const sessions = getSessions(actor)
    .filter((session) => session.actorUuid === normalizedActorUuid)
    .map((session) => normalizeSession(session))
  if (sessions.length === 0) return null

  const statusOrder = ["active", "pending", "validated", "refused"]
  sessions.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status))
  return sessions[0]
}

export function prepareAccessClients(actor, { selectedSession, selectedClientActorUuid, isEditable }) {
  const clientsByUuid = new Map()

  getStoredAccessClients(actor).forEach((client) => {
    if (!client.actorUuid) return
    clientsByUuid.set(client.actorUuid, client)
  })

  game.users.forEach((user) => {
    const userActor = user.character
    if (!userActor?.uuid) return

    const existing = clientsByUuid.get(userActor.uuid)
    const playerClient = buildAccessClientFromActor(userActor, {
      user,
      isAuthorized: existing?.isAuthorized ?? false,
      isFromPlayerCharacter: true,
    })

    clientsByUuid.set(userActor.uuid, {
      ...playerClient,
      ...existing,
      actorName: userActor.name ?? existing?.actorName ?? "",
      actorImg: userActor.img ?? existing?.actorImg ?? "",
      actorType: userActor.type ?? existing?.actorType ?? "",
      userId: user.id ?? existing?.userId ?? "",
      userName: user.name ?? existing?.userName ?? "",
      isFromPlayerCharacter: true,
    })
  })

  return Array.from(clientsByUuid.values())
    .map((client) => {
      const session = getBestSessionForClient(actor, client.actorUuid)
      const sessionStatus = session?.status ?? ""
      const preparedClient = {
        ...client,
        statusLabel: game.i18n.localize(client.isAuthorized ? "mtt.access.authorized" : "mtt.access.unauthorized"),
        sourceLabel: game.i18n.localize(
          client.isFromPlayerCharacter ? "mtt.access.playerCharacter" : "mtt.access.manualActor",
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
            (!session && selectedClientActorUuid && client.actorUuid === selectedClientActorUuid),
        ),
      }
      preparedClient.tooltip = formatAccessClientTooltip(preparedClient, { isEditable })
      return preparedClient
    })
    .sort((a, b) => a.actorName.localeCompare(b.actorName, undefined, { sensitivity: "base" }))
}

// ─── Check logic ──────────────────────────────────────────────────────────────

export function getConfiguredCurrency(currency) {
  const normalizedCurrency = String(currency ?? "").trim().toLowerCase()
  if (!normalizedCurrency) return null

  return (
    getCurrencies().find((entry) => {
      const candidates = [entry.id, entry.abbreviation, entry.name]
        .map((value) => String(value ?? "").trim().toLowerCase())
        .filter(Boolean)

      return candidates.includes(normalizedCurrency)
    }) ?? null
  )
}

export function getMerchantWalletAmount(actor, currency) {
  const configuredCurrency = getConfiguredCurrency(currency)
  const walletKey = String(configuredCurrency?.id ?? currency ?? "").trim()
  if (!walletKey) return 0

  const amount = Number(actor.system.wallet?.currencies?.[walletKey] ?? 0)
  return Number.isFinite(amount) && amount >= 0 ? amount : 0
}

export function getProductCheckAvailableQuantity(actor, item) {
  const source = actor.items.get(item.sourceId)
  const product = source?.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {}
  const productQuantity = Number(product.quantity)
  if (Number.isFinite(productQuantity) && productQuantity >= 0) return productQuantity

  const sessionQuantity = Number(item.availableQuantity)
  return Number.isFinite(sessionQuantity) && sessionQuantity >= 0 ? sessionQuantity : null
}

export function getServiceCheckAvailableQuantity(actor, item) {
  const service = actor.system.services?.entries?.find((entry) => entry.id === item.sourceId)
  const serviceQuantity = Number(service?.quantity)
  if (Number.isFinite(serviceQuantity) && serviceQuantity >= 0) return serviceQuantity

  const sessionQuantity = Number(item.availableQuantity)
  return Number.isFinite(sessionQuantity) && sessionQuantity >= 0 ? sessionQuantity : null
}

export function checkLimitedSessionQuantity({ item, availableQuantity, result, messageId, messageKey, icon }) {
  if (!item.hasLimitedQuantity) return

  const requestedQuantity = Number(item.quantity)
  const normalizedAvailableQuantity = Number(availableQuantity)

  if (!Number.isFinite(requestedQuantity) || !Number.isFinite(normalizedAvailableQuantity)) return
  if (requestedQuantity <= normalizedAvailableQuantity) return

  result.errors.push(
    createCheckMessage(
      "error",
      messageId,
      game.i18n.format(messageKey, { name: item.name }),
      icon,
    ),
  )
}

export function checkSessionStatus(session, result) {
  if (session.status === "validated") {
    result.warnings.push(
      createCheckMessage("warning", "already-validated", game.i18n.localize("mtt.sessions.check.alreadyValidated"), "fa-triangle-exclamation"),
    )
  }

  if (session.status === "refused") {
    result.warnings.push(
      createCheckMessage("warning", "already-refused", game.i18n.localize("mtt.sessions.check.alreadyRefused"), "fa-ban"),
    )
  }
}

export function checkSessionBuyerItems(actor, session, result) {
  const buyerItems = session.buyerItems ?? []
  if (buyerItems.length === 0) return

  const errorCount = result.errors.length

  buyerItems.forEach((item) => {
    if (item.type === "product") {
      const availableQuantity = getProductCheckAvailableQuantity(actor, item)
      checkLimitedSessionQuantity({
        item,
        availableQuantity,
        result,
        messageId: `product-stock-${item.id}`,
        messageKey: "mtt.sessions.check.productStockInsufficient",
        icon: "fa-box-open",
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
        icon: "fa-bell-concierge",
      })
    }
  })

  if (result.errors.length === errorCount) {
    result.infos.push(
      createCheckMessage("info", "stock-ok", game.i18n.localize("mtt.sessions.check.stockOk"), "fa-circle-check"),
    )
  }
}

export async function checkSessionSellerItems(actor, session, result) {
  const sellerItems = session.sellerItems ?? []
  if (sellerItems.length === 0) return

  const errorCount = result.errors.length
  const warningCount = result.warnings.length

  for (const item of sellerItems) {
    const sourceUuid = String(item.sourceUuid ?? "").trim()
    let source = null

    if (sourceUuid) {
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
          "fa-link-slash",
        ),
      )
      continue
    }

    const availableQuantity = getItemAvailableQuantity(source)
    checkLimitedSessionQuantity({
      item,
      availableQuantity,
      result,
      messageId: `seller-stock-${item.id}`,
      messageKey: "mtt.sessions.check.sellerQuantityInsufficient",
      icon: "fa-box-open",
    })
  }

  if (result.errors.length === errorCount && result.warnings.length === warningCount) {
    result.infos.push(
      createCheckMessage("info", "seller-items-ok", game.i18n.localize("mtt.sessions.check.sellerItemsOk"), "fa-circle-check"),
    )
  }
}

export function checkSessionMoneyAdjustments(actor, moneyAdjustments, result) {
  moneyAdjustments.forEach((adjustment) => {
    const currencyLabel = formatCurrencyLabel(adjustment.currency === "__none" ? "" : adjustment.currency)

    if (adjustment.currency === "__none") {
      result.warnings.push(
        createCheckMessage("warning", `money-undefined-${adjustment.side}`, game.i18n.localize("mtt.sessions.check.undefinedCurrency"), "fa-coins"),
      )
      return
    }

    if (adjustment.side === "seller") {
      result.infos.push(
        createCheckMessage(
          "info",
          `player-must-pay-${adjustment.currency}`,
          game.i18n.format("mtt.sessions.check.playerMustPay", { amount: adjustment.amount, currency: currencyLabel }),
          "fa-coins",
        ),
      )
      return
    }

    result.infos.push(
      createCheckMessage(
        "info",
        `merchant-must-return-${adjustment.currency}`,
        game.i18n.format("mtt.sessions.check.merchantMustReturn", { amount: adjustment.amount, currency: currencyLabel }),
        "fa-coins",
      ),
    )

    const merchantAmount = getMerchantWalletAmount(actor, adjustment.currency)
    if (merchantAmount < adjustment.amount) {
      result.errors.push(
        createCheckMessage(
          "error",
          `merchant-currency-${adjustment.currency}`,
          game.i18n.format("mtt.sessions.check.merchantCurrencyInsufficient", { currency: currencyLabel }),
          "fa-coins",
        ),
      )
      return
    }

    result.infos.push(
      createCheckMessage("info", `merchant-change-ok-${adjustment.currency}`, game.i18n.localize("mtt.sessions.check.merchantChangeOk"), "fa-circle-check"),
    )
  })
}

export function checkSessionCurrencies(actor, preparedSession, result) {
  const seen = new Set()
  const currencyKeys = [
    ...(preparedSession.buyerTotalByCurrency ?? []).map((total) => total.currency),
    ...(preparedSession.sellerTotalByCurrency ?? []).map((total) => total.currency),
    ...(preparedSession.moneyAdjustments ?? []).map((adjustment) => adjustment.currency),
  ]

  currencyKeys.forEach((currency) => {
    const currencyKey = normalizeCurrencyKey(currency === "__none" ? "" : currency)
    if (seen.has(currencyKey)) return
    seen.add(currencyKey)

    if (currencyKey === "__none") {
      result.warnings.push(
        createCheckMessage("warning", "currency-undefined", game.i18n.localize("mtt.sessions.check.undefinedCurrency"), "fa-coins"),
      )
      return
    }

    if (getConfiguredCurrency(currencyKey)) return

    result.warnings.push(
      createCheckMessage(
        "warning",
        `currency-unknown-${currencyKey}`,
        game.i18n.format("mtt.sessions.check.unknownCurrency", { currency: formatCurrencyLabel(currencyKey) }),
        "fa-coins",
      ),
    )
  })
}

export async function checkSessionTransaction(actor, session, preparedSession) {
  const result = {
    checked: true,
    canProceed: false,
    infos: [],
    warnings: [],
    errors: [],
  }

  if (!session) {
    result.canProceed = false
    return result
  }

  checkSessionStatus(session, result)
  checkSessionBuyerItems(actor, session, result)
  await checkSessionSellerItems(actor, session, result)
  checkSessionMoneyAdjustments(actor, preparedSession.moneyAdjustments ?? [], result)
  checkSessionCurrencies(actor, preparedSession, result)

  result.canProceed = result.errors.length === 0
  return result
}
