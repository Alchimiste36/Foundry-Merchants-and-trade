import { MTT } from "../../config/constants.mjs"
import { normalizeSession } from "./merchant-trade.mjs"
import { getMerchantData, getMerchantFlagPath } from "../../documents/merchant-flags.mjs"
import {
  getMTTEntityType,
  getStorageData,
  getStorageFlagPath,
  applyStorageIgnoreAutoCategory,
  toggleStorageItemTag,
  isMTTStorage,
  getStorageTradeResponsibleActorUuids,
  canActorTradeWithMerchantAsStorage
} from "../../documents/storage-flags.mjs"
import { getMerchantPermissions } from "../../documents/merchant-access.mjs"

const SOCKET_NAME = `module.${MTT.ID}`
const REQUEST_TIMEOUT = 10000
const pendingRequests = new Map()
const MTT_DEBUG_SESSION_SOCKET = false
const DEBUG_STORAGE_KEY = "mtt.debug.sessionSocket"
const DEBUG_STAMP = "SESSION_SOCKET"

function isSessionSocketDebugEnabled() {
  return (
    MTT_DEBUG_SESSION_SOCKET ||
    globalThis.MTT_DEBUG_SESSION_SOCKET === true ||
    globalThis.localStorage?.getItem(DEBUG_STORAGE_KEY) === "true"
  )
}

function debugSessionSocket(...args) {
  if (!isSessionSocketDebugEnabled()) return
  console.debug(`${MTT.NAME} | session socket | ${DEBUG_STAMP}`, ...args)
}

debugSessionSocket("loaded", {
  channel: SOCKET_NAME,
  userId: game.user?.id ?? "",
  userName: game.user?.name ?? "",
  isGM: Boolean(game.user?.isGM)
})

function userCanUpdateMerchant(user, merchantActor) {
  if (!user || !merchantActor) return false
  if (user.isGM) return true
  if (merchantActor.testUserPermission?.(user, "OWNER")) return true
  const level = merchantActor.getUserLevel(user) ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
  return level >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
}

function getActorByUuid(actorUuid) {
  const uuid = String(actorUuid ?? "").trim()
  if (!uuid) return null
  return (
    game.actors?.find?.((actor) => actor.uuid === uuid) ??
    game.actors?.get?.(uuid) ??
    game.actors?.get?.(uuid.replace(/^Actor\./, "")) ??
    null
  )
}

function userOwnsActorUuid(user, actorUuid) {
  const actor = getActorByUuid(actorUuid)
  if (!user || !actor) return false
  if (actor.testUserPermission?.(user, "OWNER")) return true
  const level = actor.getUserLevel?.(user) ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
  return level >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
}

function userOwnsSessionActor(user, session) {
  return userOwnsActorUuid(user, session?.actorUuid)
}

function userCanTradeWithMerchantAsStorage(user, storageActor) {
  if (user?.isGM) return true
  if (!isMTTStorage(storageActor)) return false

  return getStorageTradeResponsibleActorUuids(storageActor).some(
    (actorUuid) => canActorTradeWithMerchantAsStorage(storageActor, actorUuid) && userOwnsActorUuid(user, actorUuid)
  )
}

function userCanModifySessionActor(user, session) {
  if (user?.isGM) return true

  const sessionActor = getActorByUuid(session?.actorUuid)
  if (!sessionActor) return false

  if (isMTTStorage(sessionActor)) {
    return userCanTradeWithMerchantAsStorage(user, sessionActor)
  }

  return userOwnsSessionActor(user, session)
}

function userCanEditSession(user, merchantActor, session) {
  if (userCanUpdateMerchant(user, merchantActor)) return true
  if (!getMerchantPermissions(merchantActor, { user }).canInteractWithSession) return false
  return userOwnsSessionActor(user, session)
}

function canEditStorageTagsForSession(user, storageActor, session) {
  if (!session?.actorUuid) return false
  if (["submitted", "validated", "refused"].includes(session.status)) return false
  return userCanEditSession(user, storageActor, session)
}

function getSessionUpdateProcessors(merchantActor) {
  return game.users.filter((user) => user.active && userCanUpdateMerchant(user, merchantActor))
}

function getSessionEntriesFlagPath(actor) {
  return getMTTEntityType(actor) === MTT.ENTITY_TYPES.STORAGE
    ? getStorageFlagPath("sessions.entries")
    : getMerchantFlagPath("sessions.entries")
}

function getStoredSessionEntries(actor) {
  if (getMTTEntityType(actor) === MTT.ENTITY_TYPES.STORAGE) {
    return getStorageData(actor)?.sessions?.entries ?? []
  }

  return getMerchantData(actor)?.sessions?.entries ?? []
}

function sendSessionUpdateResponse({ requestId, recipientUserId, ok, updateData = null, error = "" }) {
  const response = {
    type: "sessionUpdateResponse",
    requestId,
    recipientUserId,
    ok
  }

  if (updateData) response.updateData = updateData
  if (error) response.error = error

  debugSessionSocket("response sent", response)
  game.socket.emit(SOCKET_NAME, response)
}

function buildSafeSessionUpdate(merchantActor, updateData, requestingUser) {
  const sessionEntriesPath = getSessionEntriesFlagPath(merchantActor)
  const requestedSessions = updateData?.[sessionEntriesPath]
  if (!Array.isArray(requestedSessions)) return null

  const existingSessions = getStoredSessionEntries(merchantActor).map((session) => normalizeSession(session))
  const requestedById = new Map(
    requestedSessions
      .map((session) => normalizeSession(session))
      .filter((session) => session.id)
      .map((session) => [session.id, session])
  )

  const mergedSessions = existingSessions.map((existingSession) => {
    const requestedSession = requestedById.get(existingSession.id)
    if (!requestedSession) return existingSession
    if (requestedSession.actorUuid !== existingSession.actorUuid) return existingSession
    return requestedSession
  })

  const existingIds = new Set(existingSessions.map((session) => session.id))
  for (const requestedSession of requestedById.values()) {
    if (existingIds.has(requestedSession.id)) continue
    mergedSessions.push(requestedSession)
  }

  if (!userCanUpdateMerchant(requestingUser, merchantActor)) {
    const existingById = new Map(existingSessions.map((session) => [session.id, session]))
    const modifiedSessions = Array.from(requestedById.values()).filter((requestedSession) => {
      const existingSession = existingById.get(requestedSession.id)
      return !existingSession || JSON.stringify(existingSession) !== JSON.stringify(requestedSession)
    })

    if (modifiedSessions.some((session) => !userCanModifySessionActor(requestingUser, session))) return null
  }

  return {
    [sessionEntriesPath]: mergedSessions
  }
}

function sendStorageTagUpdateResponse({ requestId, recipientUserId, ok, error = "", itemId = "", updatedTags = null }) {
  const response = {
    type: "storageTagUpdateResponse",
    requestId,
    recipientUserId,
    ok
  }

  if (error) response.error = error
  if (itemId) response.itemId = itemId
  if (updatedTags) response.updatedTags = updatedTags

  debugSessionSocket("storage tag response sent", response)
  game.socket.emit(SOCKET_NAME, response)
}

async function handleSessionUpdateRequest(message) {
  const requestId = String(message.requestId ?? "")
  const recipientUserId = String(message.userId ?? "")
  const processorUserId = String(message.processorUserId ?? "")
  const processorUserIds = Array.isArray(message.processorUserIds)
    ? message.processorUserIds.map((id) => String(id ?? "")).filter(Boolean)
    : []
  const isProcessorTarget =
    processorUserIds.length > 0
      ? processorUserIds.includes(game.user.id)
      : !processorUserId || processorUserId === game.user.id

  if (!isProcessorTarget) {
    debugSessionSocket("request ignored: not processor target", {
      requestId,
      currentUserId: game.user.id,
      currentUserName: game.user.name,
      processorUserId,
      processorUserIds
    })
    return
  }

  debugSessionSocket("request received", {
    requestId,
    recipientUserId,
    processorUserId,
    processorUserIds,
    currentUserId: game.user.id,
    currentUserName: game.user.name,
    currentUserCanProcess: true,
    actorUuid: message.actorUuid,
    sessionActorUuids: message.sessionActorUuids ?? []
  })

  try {
    const requestingUser = game.users.get(recipientUserId)
    const merchantActor = await fromUuid(message.actorUuid)

    if (!requestingUser || merchantActor?.documentName !== "Actor") {
      throw new Error(game.i18n.localize("mtt.notifications.sessionSocketRequestDenied"))
    }

    if (!userCanUpdateMerchant(game.user, merchantActor)) {
      debugSessionSocket("request denied: processor cannot update merchant", {
        requestId,
        processorUserId: game.user.id,
        actorUuid: message.actorUuid
      })
      throw new Error(game.i18n.localize("mtt.notifications.sessionSocketRequestDenied"))
    }

    if (!getMerchantPermissions(merchantActor, { user: requestingUser }).canInteractWithSession) {
      debugSessionSocket("request denied: requester cannot interact with merchant session", {
        requestId,
        requestingUserId: recipientUserId,
        actorUuid: message.actorUuid,
        sessionActorUuids: message.sessionActorUuids ?? []
      })
      throw new Error(game.i18n.localize("mtt.notifications.sessionSocketRequestDenied"))
    }

    const safeUpdateData = buildSafeSessionUpdate(merchantActor, message.updateData, requestingUser)
    if (!safeUpdateData) {
      debugSessionSocket("request denied: invalid or unauthorized session update", {
        requestId,
        requestingUserId: recipientUserId,
        actorUuid: message.actorUuid,
        sessionActorUuids: message.sessionActorUuids ?? []
      })
      throw new Error(game.i18n.localize("mtt.notifications.sessionSocketRequestDenied"))
    }

    await merchantActor.update(safeUpdateData)
    debugSessionSocket("merchant update succeeded", {
      requestId,
      processorUserId: game.user.id,
      actorUuid: merchantActor.uuid
    })

    sendSessionUpdateResponse({
      requestId,
      recipientUserId,
      ok: true,
      updateData: safeUpdateData
    })
  } catch (error) {
    debugSessionSocket("request failed", {
      requestId,
      processorUserId: game.user.id,
      error: error?.message ?? ""
    })
    sendSessionUpdateResponse({
      requestId,
      recipientUserId,
      ok: false,
      error: error?.message ?? game.i18n.localize("mtt.notifications.sessionSocketRequestDenied")
    })
  }
}

async function handleStorageTagUpdateRequest(message) {
  const requestId = String(message.requestId ?? "")
  const recipientUserId = String(message.userId ?? "")
  const processorUserIds = Array.isArray(message.processorUserIds)
    ? message.processorUserIds.map((id) => String(id ?? "")).filter(Boolean)
    : []
  const isProcessorTarget = processorUserIds.length > 0 ? processorUserIds.includes(game.user.id) : true

  if (!isProcessorTarget) return

  try {
    const requestingUser = game.users.get(recipientUserId)
    const storageActor = await fromUuid(message.actorUuid)

    if (!requestingUser || storageActor?.documentName !== "Actor") {
      throw new Error(game.i18n.localize("mtt.notifications.sessionSocketRequestDenied"))
    }
    if (getMTTEntityType(storageActor) !== MTT.ENTITY_TYPES.STORAGE) {
      throw new Error(game.i18n.localize("mtt.notifications.sessionSocketRequestDenied"))
    }
    if (!userCanUpdateMerchant(game.user, storageActor)) {
      throw new Error(game.i18n.localize("mtt.notifications.sessionSocketRequestDenied"))
    }

    const sessionId = String(message.sessionId ?? "").trim()
    const voterActorUuid = String(message.voterActorUuid ?? "").trim()
    const itemId = String(message.itemId ?? "").trim()
    const tagType = String(message.tagType ?? "").trim()
    const session = getStoredSessionEntries(storageActor)
      .map((entry) => normalizeSession(entry))
      .find((entry) => entry.id === sessionId && entry.actorUuid === voterActorUuid)

    if (!session || !canEditStorageTagsForSession(requestingUser, storageActor, session)) {
      throw new Error(game.i18n.localize("mtt.notifications.sessionSocketRequestDenied"))
    }

    const item = storageActor.items.get(itemId)
    const updatedTags = await toggleStorageItemTag(item, voterActorUuid, tagType)
    if (!updatedTags) throw new Error(game.i18n.localize("mtt.notifications.sessionSocketRequestDenied"))
    await applyStorageIgnoreAutoCategory(storageActor, item, {
      sessions: getStoredSessionEntries(storageActor).map((entry) => normalizeSession(entry)),
      activeSessionActorUuid: voterActorUuid
    })

    sendStorageTagUpdateResponse({ requestId, recipientUserId, ok: true, itemId, updatedTags })
  } catch (error) {
    debugSessionSocket("storage tag request failed", {
      requestId,
      processorUserId: game.user.id,
      error: error?.message ?? ""
    })
    sendStorageTagUpdateResponse({
      requestId,
      recipientUserId,
      ok: false,
      error: error?.message ?? game.i18n.localize("mtt.notifications.sessionSocketRequestDenied")
    })
  }
}

function handleSessionUpdateResponse(message) {
  const requestId = String(message.requestId ?? "")
  const pending = pendingRequests.get(requestId)
  if (!pending || message.recipientUserId !== game.user.id) {
    debugSessionSocket("response ignored", {
      requestId,
      hasPendingRequest: Boolean(pending),
      recipientUserId: message.recipientUserId ?? "",
      currentUserId: game.user.id
    })
    return
  }

  debugSessionSocket("response received", message)
  pendingRequests.delete(requestId)
  window.clearTimeout(pending.timeout)

  if (message.ok) {
    pending.resolve(message)
  } else {
    pending.reject(new Error(message.error ?? game.i18n.localize("mtt.notifications.sessionSocketRequestDenied")))
  }
}

function handleStorageTagUpdateResponse(message) {
  const requestId = String(message.requestId ?? "")
  const pending = pendingRequests.get(requestId)
  if (!pending || message.recipientUserId !== game.user.id) return

  pendingRequests.delete(requestId)
  window.clearTimeout(pending.timeout)

  if (message.ok) {
    pending.resolve(message)
  } else {
    pending.reject(new Error(message.error ?? game.i18n.localize("mtt.notifications.sessionSocketRequestDenied")))
  }
}

export function registerMerchantSessionSocket() {
  debugSessionSocket("listener registered", {
    channel: SOCKET_NAME,
    userId: game.user?.id ?? "",
    userName: game.user?.name ?? "",
    isGM: Boolean(game.user?.isGM)
  })

  game.socket.on(SOCKET_NAME, (message) => {
    if (!message || typeof message !== "object") return

    if (message.type === "sessionUpdateResponse") {
      handleSessionUpdateResponse(message)
      return
    }

    if (message.type === "storageTagUpdateResponse") {
      handleStorageTagUpdateResponse(message)
      return
    }

    if (message.type === "sessionUpdateRequest") {
      handleSessionUpdateRequest(message)
      return
    }

    if (message.type === "storageTagUpdateRequest") {
      handleStorageTagUpdateRequest(message)
    }
  })
}

export async function requestMerchantSessionUpdate(merchantActor, updateData) {
  if (!merchantActor?.uuid) throw new Error(game.i18n.localize("mtt.notifications.sessionSocketRequestDenied"))

  const processorUsers = getSessionUpdateProcessors(merchantActor)
  if (processorUsers.length === 0) {
    debugSessionSocket("request blocked: no active processor", {
      actorUuid: merchantActor.uuid,
      requestingUserId: game.user?.id ?? ""
    })
    throw new Error(game.i18n.localize("mtt.notifications.sessionSocketNoHandler"))
  }

  const requestId = foundry.utils.randomID()
  const processorUserIds = processorUsers.map((user) => user.id)
  const sessionEntriesPath = getSessionEntriesFlagPath(merchantActor)
  const sessionActorUuids = Array.from(
    new Set(
      (updateData?.[sessionEntriesPath] ?? []).map((session) => String(session.actorUuid ?? "").trim()).filter(Boolean)
    )
  )
  const payload = {
    type: "sessionUpdateRequest",
    requestId,
    userId: game.user.id,
    processorUserId: processorUserIds[0] ?? "",
    processorUserIds,
    actorUuid: merchantActor.uuid,
    sessionActorUuids,
    updateData
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      pendingRequests.delete(requestId)
      debugSessionSocket("request timeout", {
        requestId,
        processorUserIds,
        actorUuid: merchantActor.uuid,
        sessionActorUuids
      })
      reject(new Error(game.i18n.localize("mtt.notifications.sessionSocketNoResponse")))
    }, REQUEST_TIMEOUT)

    pendingRequests.set(requestId, { resolve, reject, timeout })
    debugSessionSocket("request sent", {
      ...payload,
      updateData: {
        sessionCount: updateData?.[sessionEntriesPath]?.length ?? 0
      }
    })
    game.socket.emit(SOCKET_NAME, payload)
  })
}

export async function requestStorageTagUpdate(storageActor, { itemId, sessionId, voterActorUuid, tagType } = {}) {
  if (!storageActor?.uuid) throw new Error(game.i18n.localize("mtt.notifications.sessionSocketRequestDenied"))

  const processorUsers = getSessionUpdateProcessors(storageActor)
  if (processorUsers.length === 0) {
    throw new Error(game.i18n.localize("mtt.notifications.sessionSocketNoHandler"))
  }

  const requestId = foundry.utils.randomID()
  const processorUserIds = processorUsers.map((user) => user.id)
  const payload = {
    type: "storageTagUpdateRequest",
    requestId,
    userId: game.user.id,
    processorUserIds,
    actorUuid: storageActor.uuid,
    itemId: String(itemId ?? "").trim(),
    sessionId: String(sessionId ?? "").trim(),
    voterActorUuid: String(voterActorUuid ?? "").trim(),
    tagType: String(tagType ?? "").trim()
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error(game.i18n.localize("mtt.notifications.sessionSocketNoResponse")))
    }, REQUEST_TIMEOUT)

    pendingRequests.set(requestId, { resolve, reject, timeout })
    game.socket.emit(SOCKET_NAME, payload)
  })
}
