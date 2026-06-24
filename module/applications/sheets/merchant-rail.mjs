// MTT base — rail d'acteurs, acteurs autorisés, accès client, taux personnalisés client, préparation des cards du rail.

import { getMerchantData } from "../../documents/shop-flags.mjs"
import { getSessions, normalizeSession } from "./merchant-session.mjs"

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
