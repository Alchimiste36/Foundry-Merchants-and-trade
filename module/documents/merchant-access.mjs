/**
 * Helpers centralisés de droits et d'accès pour les boutiques MTT.
 *
 * Deux niveaux d'accès distincts :
 *   Niveau 1 — Foundry ownership de l'acteur support (actor.ownership)
 *   Niveau 2 — Droits métier MTT dans les flags (merchant.access.clients)
 *
 * Ce fichier gère uniquement le Niveau 1 (Foundry ownership).
 * Les droits métier (clients autorisés, sessions) restent dans les flags.
 */

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
    canViewSecrets: isOwnerLike,
  }
}
