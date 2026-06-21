import { MTT } from "../config/constants.mjs"
import { getMerchantData, updateMerchantData } from "./merchant-flags.mjs"

// MTT storage — helpers de flags propres au stockage

export const STORAGE_IGNORE_CATEGORY_ID = "mtt-storage-ignore"

export function getMTTEntityType(actor) {
  return String(actor?.getFlag?.(MTT.ID, MTT.FLAGS.TYPE) ?? "").trim()
}

export function getStorageFlagPath(path = "") {
  const suffix = String(path ?? "").trim()
  const base = `flags.${MTT.ID}.${MTT.FLAGS.STORAGE}`
  return suffix ? `${base}.${suffix}` : base
}

// ─── Catégories initiales stockage ───────────────────────────────────────────

function getConfiguredInitialStorageCategoryNames() {
  try {
    const raw = String(game.settings.get(MTT.ID, "defaultStorageCategories") ?? "")
    const seen = new Set()
    return raw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((name) => {
        const key = name.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
  } catch {
    return []
  }
}

export function buildInitialLocalStorageCategories() {
  return getConfiguredInitialStorageCategoryNames().map((name, index) => ({
    id: `category-${foundry.utils.randomID(6)}`,
    name,
    sort: index
  }))
}

// ─── Structure de données stockage ───────────────────────────────────────────

export function buildDefaultStorageData(actor = null) {
  return {
    enabled: true,
    storage: {
      name: actor?.name ?? "",
      img: actor?.img ?? "",
      description: ""
    },
    sheet: {
      isLocked: true
    },
    access: {
      actors: []
    },
    wallet: {
      currencies: {}
    },
    sessions: {
      entries: []
    },
    content: {
      categories: []
    },
    tradeWithMerchant: {
      responsibleActorUuids: []
    },
    journal: {
      entries: []
    }
  }
}

function normalizeStorageResponsibleActorUuids(actorUuids = []) {
  const source = Array.isArray(actorUuids) ? actorUuids : []
  const seen = new Set()

  return source
    .map((actorUuid) => String(actorUuid ?? "").trim())
    .filter(Boolean)
    .filter((actorUuid) => {
      if (seen.has(actorUuid)) return false
      seen.add(actorUuid)
      return true
    })
}

export function normalizeStorageData(data = {}, actor = null) {
  const defaults = buildDefaultStorageData(actor)
  const source = foundry.utils.deepClone(data ?? {})
  const merged = foundry.utils.mergeObject(defaults, source, {
    inplace: false,
    insertKeys: true,
    insertValues: true,
    overwrite: true
  })

  merged.enabled = merged.enabled === true
  merged.storage ??= {}
  if (!String(merged.storage.name ?? "").trim()) merged.storage.name = actor?.name ?? ""
  if (!String(merged.storage.img ?? "").trim()) merged.storage.img = actor?.img ?? ""
  merged.storage.description ??= ""
  merged.sheet ??= {}
  merged.sheet.isLocked = true
  merged.access ??= {}
  merged.access.actors ??= []
  merged.wallet ??= {}
  merged.wallet.currencies ??= {}
  merged.sessions ??= {}
  merged.sessions.entries ??= []
  merged.content ??= {}
  merged.content.categories ??= []
  merged.tradeWithMerchant ??= {}
  merged.tradeWithMerchant.responsibleActorUuids = normalizeStorageResponsibleActorUuids(
    merged.tradeWithMerchant.responsibleActorUuids
  )
  merged.journal ??= {}
  merged.journal.entries ??= []

  return merged
}

export function getStorageData(actor) {
  const raw = actor?.getFlag?.(MTT.ID, MTT.FLAGS.STORAGE)
  if (!raw) return null
  return normalizeStorageData(raw, actor)
}

export function isMTTStorage(actor) {
  return getMTTEntityType(actor) === MTT.ENTITY_TYPES.STORAGE && getStorageData(actor)?.enabled === true
}

export async function setStorageData(actor, data, options = {}) {
  if (!actor) return null
  const normalized = normalizeStorageData(data, actor)
  return actor.update(
    {
      [`flags.${MTT.ID}.${MTT.FLAGS.TYPE}`]: MTT.ENTITY_TYPES.STORAGE,
      [`flags.${MTT.ID}.${MTT.FLAGS.STORAGE}`]: normalized
    },
    options
  )
}

export async function updateStorageData(actor, changes = {}, options = {}) {
  if (!actor) return null
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
    console.error(`${MTT.NAME} | updateStorageData : changes doit être un objet, reçu :`, typeof changes, changes)
    return getStorageData(actor)
  }

  const current = foundry.utils.deepClone(getStorageData(actor) ?? buildDefaultStorageData(actor))
  const merged = foundry.utils.mergeObject(current, foundry.utils.deepClone(changes), {
    inplace: false,
    insertKeys: true,
    insertValues: true,
    overwrite: true
  })
  return setStorageData(actor, merged, options)
}

export async function unsetStorageData(actor) {
  if (!actor) return null
  await actor.unsetFlag(MTT.ID, MTT.FLAGS.STORAGE)
  if (getMTTEntityType(actor) === MTT.ENTITY_TYPES.STORAGE) {
    return actor.unsetFlag(MTT.ID, MTT.FLAGS.TYPE)
  }
  return actor
}

// MTT storage — responsables autorisés à marchander au nom du stockage

export function getStorageTradeWithMerchantData(actor) {
  const storageData = getStorageData(actor)
  return storageData?.tradeWithMerchant ?? { responsibleActorUuids: [] }
}

export function getStorageTradeResponsibleActorUuids(actor) {
  return getStorageTradeWithMerchantData(actor).responsibleActorUuids ?? []
}

export function getStorageAccessActorUuids(actor) {
  const storageData = getStorageData(actor)
  const actors = Array.isArray(storageData?.access?.actors) ? storageData.access.actors : []
  const seen = new Set()

  return actors
    .map((entry) => String(entry?.actorUuid ?? "").trim())
    .filter(Boolean)
    .filter((actorUuid) => {
      if (seen.has(actorUuid)) return false
      seen.add(actorUuid)
      return true
    })
}

export function isStorageTradeResponsibleActor(actor, actorUuid) {
  const normalizedActorUuid = String(actorUuid ?? "").trim()
  if (!normalizedActorUuid) return false
  return getStorageTradeResponsibleActorUuids(actor).includes(normalizedActorUuid)
}

export function canActorTradeWithMerchantAsStorage(storageActor, actorUuid) {
  const normalizedActorUuid = String(actorUuid ?? "").trim()
  if (!normalizedActorUuid) return false
  return getStorageTradeResponsibleActorUuids(storageActor).includes(normalizedActorUuid)
}

export async function setStorageTradeResponsibleActorUuids(actor, actorUuids = []) {
  return updateStorageData(actor, {
    tradeWithMerchant: {
      responsibleActorUuids: normalizeStorageResponsibleActorUuids(actorUuids)
    }
  })
}

// ─── Flags statuts stockage sur les Items ────────────────────────────────────

export function getStorageItemFlags(item) {
  const raw = item?.getFlag?.(MTT.ID, MTT.FLAGS.STORAGE) ?? {}
  return {
    warningGM: Boolean(raw.warningGM),
    blocked: Boolean(raw.blocked),
    ignoreOriginalCategory: String(raw.ignoreOriginalCategory ?? "").trim()
  }
}

export function isStorageItemBlocked(item) {
  return getStorageItemFlags(item).blocked
}

export function isStorageItemWarningGM(item) {
  return getStorageItemFlags(item).warningGM
}

export async function setStorageItemBlocked(item, blocked) {
  if (!item) return null
  return item.update({ [`flags.${MTT.ID}.${MTT.FLAGS.STORAGE}.blocked`]: Boolean(blocked) })
}

export async function setStorageItemWarningGM(item, warningGM) {
  if (!item) return null
  return item.update({ [`flags.${MTT.ID}.${MTT.FLAGS.STORAGE}.warningGM`]: Boolean(warningGM) })
}

// ─── Tags de vote rapides sur les Items ──────────────────────────────────────

const STORAGE_TAG_VALID_TYPES = new Set(["want", "ignore"])

function deleteStorageTagPath(source, path) {
  if (!source || typeof source !== "object" || !path) return

  const parts = String(path).split(".").filter(Boolean)
  if (!parts.length) return

  let target = source
  for (const part of parts.slice(0, -1)) {
    if (!target?.[part] || typeof target[part] !== "object") return
    target = target[part]
  }

  delete target[parts[parts.length - 1]]
}

export function getStorageItemTags(item) {
  const raw = item?.getFlag?.(MTT.ID, MTT.FLAGS.STORAGE)?.tags ?? {}
  return foundry.utils.getType(raw) === "Object" ? raw : {}
}

export function getStorageItemTagForActor(rawTags, actorUuid) {
  if (!rawTags || !actorUuid) return ""

  const tag = foundry.utils.getProperty(rawTags, actorUuid)
  return STORAGE_TAG_VALID_TYPES.has(tag) ? tag : ""
}

function isSameStorageSessionProduct(entry, product) {
  if (String(entry?.type ?? "") !== "product") return false

  const productId = String(product?.id ?? "").trim()
  const productSourceUuid = String(product?.sourceUuid ?? "").trim()
  const entrySourceId = String(entry?.sourceId ?? "").trim()
  const entrySourceUuid = String(entry?.sourceUuid ?? "").trim()

  if (productId && entrySourceId === productId) return true
  return Boolean(productSourceUuid && entrySourceUuid === productSourceUuid)
}

export function getStorageSessionClaimQuantityForItem(session, product) {
  const buyerItems = Array.isArray(session?.buyerItems) ? session.buyerItems : []
  return buyerItems.reduce((total, entry) => {
    if (!isSameStorageSessionProduct(entry, product)) return total

    const quantity = Number(entry?.quantity)
    return Number.isFinite(quantity) && quantity > 0 ? total + quantity : total
  }, 0)
}

export function buildStorageItemIntentState({
  rawTags = {},
  sessions = [],
  activeSession = null,
  activeSessionActorUuid = "",
  availableQuantity = 0,
  product = null
} = {}) {
  const actorVotes = []
  let wantedClaimQuantity = 0

  for (const session of sessions ?? []) {
    const actorUuid = String(session?.actorUuid ?? "").trim()
    if (!actorUuid) continue

    const tag = getStorageItemTagForActor(rawTags, actorUuid)
    const claimQuantity = product ? getStorageSessionClaimQuantityForItem(session, product) : 0
    if (tag === "want") wantedClaimQuantity += claimQuantity

    actorVotes.push({
      actorUuid,
      sessionId: String(session?.id ?? ""),
      tag,
      claimQuantity,
      wantsItem: tag === "want",
      ignoresItem: tag === "ignore",
      hasAnswered: tag === "want" || tag === "ignore"
    })
  }

  const wantCount = actorVotes.filter((vote) => vote.wantsItem).length
  const ignoreCount = actorVotes.filter((vote) => vote.ignoresItem).length
  const missingCount = actorVotes.filter((vote) => !vote.hasAnswered).length
  const totalVotingSlots = actorVotes.length
  const activeActorTag = getStorageItemTagForActor(rawTags, activeSessionActorUuid)
  const numericAvailableQuantity = Number(availableQuantity)
  const normalizedAvailableQuantity =
    Number.isFinite(numericAvailableQuantity) && numericAvailableQuantity > 0 ? numericAvailableQuantity : 0
  const hasWant = wantCount > 0
  const allAnswered = totalVotingSlots > 0 && missingCount === 0
  const claimBaseQuantity = Number((normalizedAvailableQuantity + wantedClaimQuantity).toFixed(2))
  const claimLimitPerWantActor = wantCount > 0 ? Math.floor(claimBaseQuantity / wantCount) : 0
  const activeSessionForClaim =
    activeSession ??
    (Array.isArray(sessions)
      ? sessions.find(
          (session) => String(session?.actorUuid ?? "").trim() === String(activeSessionActorUuid ?? "").trim()
        )
      : null)
  const activeActorCurrentClaimQuantity = product
    ? getStorageSessionClaimQuantityForItem(activeSessionForClaim, product)
    : 0
  const activeActorRemainingClaimQuantity = Math.max(
    0,
    Number((claimLimitPerWantActor - activeActorCurrentClaimQuantity).toFixed(2))
  )
  const canResolveWithoutConflict = hasWant && allAnswered && claimBaseQuantity >= wantCount
  const activeActorCanClaimMore =
    canResolveWithoutConflict && activeActorTag === "want" && activeActorRemainingClaimQuantity > 0

  return {
    actorVotes,
    wantCount,
    ignoreCount,
    missingCount,
    totalVotingSlots,
    hasWant,
    allAnswered,
    availableQuantity: normalizedAvailableQuantity,
    claimBaseQuantity,
    claimLimitPerWantActor,
    activeActorCurrentClaimQuantity,
    activeActorRemainingClaimQuantity,
    canResolveWithoutConflict,
    activeActorTag,
    activeActorCanClaimMore,
    activeActorCanClaimOne: activeActorCanClaimMore
  }
}

export function getStorageClaimQuantityBlockReasonKey(intentState, requestedQuantity = 0) {
  if (intentState?.activeActorTag === "ignore") return "mtt.storage.intent.block.activeActorIgnored"
  if (!intentState?.hasWant) return ""
  if (intentState.activeActorTag !== "want") return "mtt.storage.intent.block.activeActorMustWant"
  if (!intentState.allAnswered) return "mtt.storage.intent.block.missingVotes"
  if (!intentState.canResolveWithoutConflict) return "mtt.storage.intent.block.notEnoughQuantity"
  if (Number(requestedQuantity) > intentState.claimLimitPerWantActor) {
    return "mtt.storage.intent.block.claimLimitReached"
  }

  return ""
}

export function getStorageAddBlockReasonKey(intentState) {
  if (intentState?.activeActorTag === "ignore") return "mtt.storage.intent.block.activeActorIgnored"
  if (!intentState?.hasWant) return ""

  const quantityReason = getStorageClaimQuantityBlockReasonKey(
    intentState,
    Number(intentState.activeActorCurrentClaimQuantity ?? 0) + 1
  )
  if (quantityReason) return quantityReason

  return "mtt.storage.intent.block.generic"
}

export function buildStorageAddIntentBlockState(intentState, { canOverride = false } = {}) {
  const activeActorIgnored = intentState?.activeActorTag === "ignore"
  const activeActorCanStillClaimOne = intentState?.activeActorCanClaimMore === true
  const isStorageBlockedByIntent =
    activeActorIgnored || (intentState?.hasWant === true && activeActorCanStillClaimOne !== true)
  const storageAddBlockReasonKey = isStorageBlockedByIntent ? getStorageAddBlockReasonKey(intentState) : ""

  return {
    activeActorIgnored,
    activeActorCanStillClaimOne,
    isStorageBlockedByIntent,
    isStorageAddBlockedForCurrentUser: isStorageBlockedByIntent && canOverride !== true,
    storageAddBlockReasonKey
  }
}

export async function toggleStorageItemTag(item, actorUuid, tagType) {
  if (!item || !actorUuid || !STORAGE_TAG_VALID_TYPES.has(tagType)) return null
  const current = getStorageItemTags(item)
  const updated = foundry.utils.deepClone(current)
  const currentTag = foundry.utils.getProperty(updated, actorUuid)
  if (currentTag === tagType) {
    await item.unsetFlag(MTT.ID, `${MTT.FLAGS.STORAGE}.tags.${actorUuid}`)
    deleteStorageTagPath(updated, actorUuid)
    return updated
  }

  foundry.utils.setProperty(updated, actorUuid, tagType)
  await item.update({ [`flags.${MTT.ID}.${MTT.FLAGS.STORAGE}.tags`]: updated })
  return updated
}

function getStorageIgnoreCategoryName() {
  return game.i18n.localize("mtt.storage.categories.ignoreSell")
}

async function getOrCreateStorageIgnoreCategory(actor) {
  const merchantData = getMerchantData(actor)
  const categories = foundry.utils.deepClone(merchantData?.catalog?.productCategories ?? [])
  const existing = categories.find((category) => category?.id === STORAGE_IGNORE_CATEGORY_ID)
  if (existing) return STORAGE_IGNORE_CATEGORY_ID

  categories.push({
    id: STORAGE_IGNORE_CATEGORY_ID,
    name: getStorageIgnoreCategoryName()
  })
  await updateMerchantData(actor, { catalog: { productCategories: categories } }, { render: false })
  return STORAGE_IGNORE_CATEGORY_ID
}

function getStorageItemProductCategory(item) {
  return String(item?.getFlag?.(MTT.ID, MTT.FLAGS.PRODUCT)?.category ?? "").trim()
}

function getStorageIgnoreOriginalCategoryState(item) {
  const raw = item?.getFlag?.(MTT.ID, MTT.FLAGS.STORAGE) ?? {}
  return {
    hasOriginalCategory: Object.hasOwn(raw, "ignoreOriginalCategory"),
    originalCategory: String(raw.ignoreOriginalCategory ?? "").trim()
  }
}

function buildStorageIgnoreIntentState(item, sessions, activeSessionActorUuid = "") {
  return buildStorageItemIntentState({
    rawTags: getStorageItemTags(item),
    sessions,
    activeSessionActorUuid,
    product: {
      id: item?.id ?? "",
      sourceUuid: String(item?.getFlag?.(MTT.ID, MTT.FLAGS.PRODUCT)?.sourceUuid ?? "").trim()
    }
  })
}

function storageCategoryExists(actor, categoryId) {
  const normalizedId = String(categoryId ?? "").trim()
  if (!normalizedId) return true

  return Boolean(getMerchantData(actor)?.catalog?.productCategories?.some((category) => category?.id === normalizedId))
}

export async function applyStorageIgnoreAutoCategory(actor, item, { sessions = [], activeSessionActorUuid = "" } = {}) {
  if (!actor || !item) return null
  if (item.getFlag?.(MTT.ID, MTT.FLAGS.PRODUCT)?.enabled !== true) return null

  const intentState = buildStorageIgnoreIntentState(item, sessions, activeSessionActorUuid)
  const allActorsIgnoredStorageItem =
    intentState.totalVotingSlots > 0 && intentState.ignoreCount === intentState.totalVotingSlots
  const currentCategory = getStorageItemProductCategory(item)
  const { hasOriginalCategory, originalCategory } = getStorageIgnoreOriginalCategoryState(item)

  if (allActorsIgnoredStorageItem) {
    if (currentCategory === STORAGE_IGNORE_CATEGORY_ID) return intentState

    await getOrCreateStorageIgnoreCategory(actor)
    const updateData = {
      [`flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}.category`]: STORAGE_IGNORE_CATEGORY_ID
    }
    if (!hasOriginalCategory) {
      updateData[`flags.${MTT.ID}.${MTT.FLAGS.STORAGE}.ignoreOriginalCategory`] = currentCategory
    }
    await item.update(updateData, { mtt: true })
    return intentState
  }

  if (!hasOriginalCategory) return intentState

  const restoredCategory = storageCategoryExists(actor, originalCategory) ? originalCategory : ""

  await item.update(
    {
      [`flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}.category`]: restoredCategory
    },
    { mtt: true }
  )

  await item.unsetFlag(MTT.ID, `${MTT.FLAGS.STORAGE}.ignoreOriginalCategory`)

  return intentState
}
