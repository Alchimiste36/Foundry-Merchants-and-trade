/**
 * Helpers centralisés de droits et d'accès pour les boutiques MTT.
 *
 * Deux niveaux d'accès distincts :
 *   Niveau 1 — Foundry ownership de l'acteur support (actor.ownership)
 *   Niveau 2 — Droits métier MTT dans les flags (merchant.access.clients)
 *
 * Ce fichier gère le Niveau 1 (Foundry ownership) et les permissions configurables qui en découlent.
 * Les droits métier d'autorisation commerciale (clients autorisés, sessions) restent dans les flags.
 */

import { MTT } from "../config/constants.mjs"

export const MERCHANT_CONFIGURABLE_PERMISSIONS = [
  "canViewConfigTab",
  "canViewApprovalStatus",
  "canViewPrices",
  "canOpenProduct",
  "canInteractWithSession",
  "canAddActorToMerchantRail",
  "canViewOtherActorsInRail",
  "canViewObserverActorSessions",
  "canValidateOrRefuseSessions",
  "canViewObserverActorJournalEntries"
]

export const MERCHANT_PERMISSION_DEFINITIONS = {
  canViewConfigTab: {
    label: "mtt.permissions.merchant.canViewConfigTab.label",
    hint: "mtt.permissions.merchant.canViewConfigTab.hint"
  },
  canViewApprovalStatus: {
    label: "mtt.permissions.merchant.canViewApprovalStatus.label",
    hint: "mtt.permissions.merchant.canViewApprovalStatus.hint"
  },
  canViewPrices: {
    label: "mtt.permissions.merchant.canViewPrices.label",
    hint: "mtt.permissions.merchant.canViewPrices.hint"
  },
  canOpenProduct: {
    label: "mtt.permissions.merchant.canOpenProduct.label",
    hint: "mtt.permissions.merchant.canOpenProduct.hint"
  },
  canInteractWithSession: {
    label: "mtt.permissions.merchant.canInteractWithSession.label",
    hint: "mtt.permissions.merchant.canInteractWithSession.hint"
  },
  canAddActorToMerchantRail: {
    label: "mtt.permissions.merchant.canAddActorToMerchantRail.label",
    hint: "mtt.permissions.merchant.canAddActorToMerchantRail.hint"
  },
  canViewOtherActorsInRail: {
    label: "mtt.permissions.merchant.canViewOtherActorsInRail.label",
    hint: "mtt.permissions.merchant.canViewOtherActorsInRail.hint"
  },
  canViewObserverActorSessions: {
    label: "mtt.permissions.merchant.canViewObserverActorSessions.label",
    hint: "mtt.permissions.merchant.canViewObserverActorSessions.hint"
  },
  canValidateOrRefuseSessions: {
    label: "mtt.permissions.merchant.canValidateOrRefuseSessions.label",
    hint: "mtt.permissions.merchant.canValidateOrRefuseSessions.hint"
  },
  canViewObserverActorJournalEntries: {
    label: "mtt.permissions.merchant.canViewObserverActorJournalEntries.label",
    hint: "mtt.permissions.merchant.canViewObserverActorJournalEntries.hint"
  }
}

export const MERCHANT_DEFAULT_PERMISSION_PROFILES = {
  limited: {
    canViewConfigTab: false,
    canViewApprovalStatus: false,
    canViewPrices: false,
    canOpenProduct: false,
    canInteractWithSession: false,
    canAddActorToMerchantRail: false,
    canViewOtherActorsInRail: false,
    canViewObserverActorSessions: false,
    canValidateOrRefuseSessions: false,
    canViewObserverActorJournalEntries: false
  },
  observer: {
    canViewConfigTab: false,
    canViewApprovalStatus: true,
    canViewPrices: true,
    canOpenProduct: true,
    canInteractWithSession: true,
    canAddActorToMerchantRail: false,
    canViewOtherActorsInRail: false,
    canViewObserverActorSessions: true,
    canValidateOrRefuseSessions: false,
    canViewObserverActorJournalEntries: true
  },
  owner: Object.fromEntries(MERCHANT_CONFIGURABLE_PERMISSIONS.map((permission) => [permission, true]))
}

export const MERCHANT_PERMISSION_PROFILE_KEYS = Object.freeze(["limited", "observer", "owner"])

function buildAllMerchantPermissions(value = true) {
  return Object.fromEntries(MERCHANT_CONFIGURABLE_PERMISSIONS.map((permission) => [permission, Boolean(value)]))
}

function normalizeMerchantPermissionProfile(profile, defaultProfile) {
  const source = profile && typeof profile === "object" && !Array.isArray(profile) ? profile : {}
  const normalized = {}

  for (const permission of MERCHANT_CONFIGURABLE_PERMISSIONS) {
    normalized[permission] = Object.prototype.hasOwnProperty.call(source, permission)
      ? Boolean(source[permission])
      : Boolean(defaultProfile[permission])
  }

  return normalized
}

export function normalizeMerchantPermissionProfiles(value) {
  let source = value
  if (typeof value === "string") {
    try {
      source = JSON.parse(value || "{}")
    } catch {
      source = {}
    }
  }

  const profiles = source && typeof source === "object" && !Array.isArray(source) ? source : {}
  const normalized = {}

  for (const profileKey of MERCHANT_PERMISSION_PROFILE_KEYS) {
    normalized[profileKey] = normalizeMerchantPermissionProfile(
      profiles[profileKey],
      MERCHANT_DEFAULT_PERMISSION_PROFILES[profileKey]
    )
  }

  return normalized
}

function getMerchantPermissionProfileKey(actor, user) {
  const accessContext = getMerchantAccessContext(actor, user)
  if (accessContext.isOwnerLike) return "owner"
  if (accessContext.isObserver) return "observer"
  return "limited"
}

export function getMerchantPermissions(actor, { user = game.user, profiles = null } = {}) {
  if (user?.isGM) return buildAllMerchantPermissions(true)

  const normalizedProfiles = normalizeMerchantPermissionProfiles(
    profiles ?? game.settings?.get?.(MTT.ID, "merchantPermissionProfiles")
  )
  const profileKey = getMerchantPermissionProfileKey(actor, user)

  return normalizeMerchantPermissionProfile(
    normalizedProfiles[profileKey],
    MERCHANT_DEFAULT_PERMISSION_PROFILES[profileKey]
  )
}

export function getUserActorAccessLevel(actor, user = game.user) {
  if (!actor || !user) return "none"
  if (user.isGM) return "owner"

  const level = actor.getUserLevel?.(user) ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
  if (level >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) return "owner"
  if (level >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER) return "observer"
  if (level >= CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED) return "limited"
  return "none"
}

function userOwnsActorByCharacter(actor, user = game.user) {
  return Boolean(actor?.uuid && user?.character?.uuid === actor.uuid)
}

export function canUserViewClientActor(actor, permissions = {}, user = game.user) {
  if (user?.isGM) return true
  if (!actor) return false
  if (userOwnsActorByCharacter(actor, user)) return true

  const accessLevel = getUserActorAccessLevel(actor, user)
  if (accessLevel === "owner") return true

  return Boolean(permissions.canViewOtherActorsInRail)
}

export function canUserViewClientSession(actor, permissions = {}, user = game.user) {
  if (user?.isGM) return true
  if (!actor) return false
  if (userOwnsActorByCharacter(actor, user)) return true

  const accessLevel = getUserActorAccessLevel(actor, user)
  if (accessLevel === "owner") return true
  if (accessLevel === "observer") return Boolean(permissions.canViewObserverActorSessions)
  return false
}

export function canUserViewClientJournalEntries(actor, permissions = {}, user = game.user) {
  if (user?.isGM) return true
  if (!actor) return false
  if (userOwnsActorByCharacter(actor, user)) return true

  const accessLevel = getUserActorAccessLevel(actor, user)
  if (accessLevel === "owner") return true
  if (accessLevel === "observer") return Boolean(permissions.canViewObserverActorJournalEntries)
  return false
}

/**
 * Vérifie si un utilisateur a un accès de gestion (propriétaire ou MJ) sur la boutique.
 * Critère : GM ou niveau Foundry OWNER sur l'acteur support.
 *
 * @param {Actor|null} actor - L'acteur support de la boutique.
 * @param {User} [user=game.user] - L'utilisateur à tester.
 * @returns {boolean}
 */
export function canUserManageMerchant(actor, user = game.user) {
  if (!actor || !user) return false
  if (user.isGM) return true
  const level = actor.getUserLevel?.(user) ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
  return level >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
}

/**
 * Retourne le contexte complet de permissions MTT pour un utilisateur.
 * Utilisé pour construire context.mtt.permissions dans MerchantSheet._prepareContext().
 *
 * @param {Actor|null} actor - L'acteur support de la boutique.
 * @param {User} [user=game.user] - L'utilisateur courant.
 * @returns {{
 *   isGM: boolean,
 *   isOwnerLike: boolean,
 *   isObserver: boolean,
 *   isLimited: boolean,
 *   canManageMerchant: boolean,
 *   canEditCatalog: boolean,
 *   canEditServices: boolean,
 *   canManageClients: boolean,
 *   canViewAllSessions: boolean,
 *   canViewJournal: boolean,
 *   canViewSecrets: boolean
 * }}
 */
export function getMerchantAccessContext(actor, user = game.user) {
  const isGM = Boolean(user?.isGM)
  const permLevel = isGM
    ? CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
    : (actor?.getUserLevel?.(user) ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE)

  const isOwnerLike = isGM || permLevel >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
  const isObserver = !isOwnerLike && permLevel >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
  const isLimited = !isOwnerLike && !isObserver && permLevel >= CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED

  return {
    isGM,
    isOwnerLike,
    isObserver,
    isLimited,
    canManageMerchant: isOwnerLike,
    canEditCatalog: isOwnerLike,
    canEditServices: isOwnerLike,
    canManageClients: isOwnerLike,
    canViewAllSessions: isOwnerLike,
    canViewJournal: true,
    canViewSecrets: isOwnerLike
  }
}
