import { MTT } from "../config/constants.mjs"

// MTT storage — helpers de flags propres au stockage

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
    sessions: {
      entries: []
    },
    content: {
      categories: []
    },
    journal: {
      entries: []
    }
  }
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
  merged.sessions ??= {}
  merged.sessions.entries ??= []
  merged.content ??= {}
  merged.content.categories ??= []
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

// ─── Flags statuts stockage sur les Items ────────────────────────────────────

export function getStorageItemFlags(item) {
  const raw = item?.getFlag?.(MTT.ID, MTT.FLAGS.STORAGE) ?? {}
  return {
    warningGM: Boolean(raw.warningGM),
    blocked: Boolean(raw.blocked)
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
  const current = getStorageItemFlags(item)
  return item.setFlag(MTT.ID, MTT.FLAGS.STORAGE, { ...current, blocked: Boolean(blocked) })
}

export async function setStorageItemWarningGM(item, warningGM) {
  if (!item) return null
  const current = getStorageItemFlags(item)
  return item.setFlag(MTT.ID, MTT.FLAGS.STORAGE, { ...current, warningGM: Boolean(warningGM) })
}
