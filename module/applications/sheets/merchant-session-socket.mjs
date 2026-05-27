import { MTT } from "../../config/constants.mjs"
import { normalizeSession } from "./merchant-trade.mjs"

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
  isGM: Boolean(game.user?.isGM),
})

function userCanUpdateMerchant(user, merchantActor) {
  if (!user || !merchantActor) return false
  if (user.isGM) return true
  if (merchantActor.testUserPermission?.(user, "OWNER")) return true
  const level = merchantActor.getUserLevel(user) ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
  return level >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
}

function getSessionUpdateProcessors(merchantActor) {
  return game.users.filter((user) => user.active && userCanUpdateMerchant(user, merchantActor))
}

function sendSessionUpdateResponse({ requestId, recipientUserId, ok, updateData = null, error = "" }) {
  const response = {
    type: "sessionUpdateResponse",
    requestId,
    recipientUserId,
    ok,
  }

  if (updateData) response.updateData = updateData
  if (error) response.error = error

  debugSessionSocket("response sent", response)
  game.socket.emit(SOCKET_NAME, response)
}

function buildSafeSessionUpdate(merchantActor, updateData) {
  const requestedSessions = updateData?.["system.sessions.entries"]
  if (!Array.isArray(requestedSessions)) return null

  const existingSessions = (merchantActor.system.sessions?.entries ?? []).map((session) => normalizeSession(session))
  const requestedById = new Map(
    requestedSessions
      .map((session) => normalizeSession(session))
      .filter((session) => session.id)
      .map((session) => [session.id, session]),
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

  return {
    "system.sessions.entries": mergedSessions,
  }
}

async function handleSessionUpdateRequest(message) {
  const requestId = String(message.requestId ?? "")
  const recipientUserId = String(message.userId ?? "")
  const processorUserId = String(message.processorUserId ?? "")
  const processorUserIds = Array.isArray(message.processorUserIds)
    ? message.processorUserIds.map((id) => String(id ?? "")).filter(Boolean)
    : []
  const isProcessorTarget = processorUserIds.length > 0
    ? processorUserIds.includes(game.user.id)
    : !processorUserId || processorUserId === game.user.id

  if (!isProcessorTarget) {
    debugSessionSocket("request ignored: not processor target", {
      requestId,
      currentUserId: game.user.id,
      currentUserName: game.user.name,
      processorUserId,
      processorUserIds,
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
    sessionActorUuids: message.sessionActorUuids ?? [],
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
        actorUuid: message.actorUuid,
      })
      throw new Error(game.i18n.localize("mtt.notifications.sessionSocketRequestDenied"))
    }

    const safeUpdateData = buildSafeSessionUpdate(merchantActor, message.updateData)
    if (!safeUpdateData) {
      debugSessionSocket("request denied: invalid or unauthorized session update", {
        requestId,
        requestingUserId: recipientUserId,
        actorUuid: message.actorUuid,
        sessionActorUuids: message.sessionActorUuids ?? [],
      })
      throw new Error(game.i18n.localize("mtt.notifications.sessionSocketRequestDenied"))
    }

    await merchantActor.update(safeUpdateData)
    debugSessionSocket("merchant update succeeded", {
      requestId,
      processorUserId: game.user.id,
      actorUuid: merchantActor.uuid,
    })

    sendSessionUpdateResponse({
      requestId,
      recipientUserId,
      ok: true,
      updateData: safeUpdateData,
    })
  } catch (error) {
    debugSessionSocket("request failed", {
      requestId,
      processorUserId: game.user.id,
      error: error?.message ?? "",
    })
    sendSessionUpdateResponse({
      requestId,
      recipientUserId,
      ok: false,
      error: error?.message ?? game.i18n.localize("mtt.notifications.sessionSocketRequestDenied"),
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
      currentUserId: game.user.id,
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

export function registerMerchantSessionSocket() {
  debugSessionSocket("listener registered", {
    channel: SOCKET_NAME,
    userId: game.user?.id ?? "",
    userName: game.user?.name ?? "",
    isGM: Boolean(game.user?.isGM),
  })

  game.socket.on(SOCKET_NAME, (message) => {
    if (!message || typeof message !== "object") return

    if (message.type === "sessionUpdateResponse") {
      handleSessionUpdateResponse(message)
      return
    }

    if (message.type === "sessionUpdateRequest") {
      handleSessionUpdateRequest(message)
    }
  })
}

export async function requestMerchantSessionUpdate(merchantActor, updateData) {
  if (!merchantActor?.uuid) throw new Error(game.i18n.localize("mtt.notifications.sessionSocketRequestDenied"))

  const processorUsers = getSessionUpdateProcessors(merchantActor)
  if (processorUsers.length === 0) {
    debugSessionSocket("request blocked: no active processor", {
      actorUuid: merchantActor.uuid,
      requestingUserId: game.user?.id ?? "",
    })
    throw new Error(game.i18n.localize("mtt.notifications.sessionSocketNoHandler"))
  }

  const requestId = foundry.utils.randomID()
  const processorUserIds = processorUsers.map((user) => user.id)
  const sessionActorUuids = Array.from(
    new Set(
      (updateData?.["system.sessions.entries"] ?? [])
        .map((session) => String(session.actorUuid ?? "").trim())
        .filter(Boolean),
    ),
  )
  const payload = {
    type: "sessionUpdateRequest",
    requestId,
    userId: game.user.id,
    processorUserId: processorUserIds[0] ?? "",
    processorUserIds,
    actorUuid: merchantActor.uuid,
    sessionActorUuids,
    updateData,
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      pendingRequests.delete(requestId)
      debugSessionSocket("request timeout", {
        requestId,
        processorUserIds,
        actorUuid: merchantActor.uuid,
        sessionActorUuids,
      })
      reject(new Error(game.i18n.localize("mtt.notifications.sessionSocketNoResponse")))
    }, REQUEST_TIMEOUT)

    pendingRequests.set(requestId, { resolve, reject, timeout })
    debugSessionSocket("request sent", {
      ...payload,
      updateData: {
        sessionCount: updateData?.["system.sessions.entries"]?.length ?? 0,
      },
    })
    game.socket.emit(SOCKET_NAME, payload)
  })
}
