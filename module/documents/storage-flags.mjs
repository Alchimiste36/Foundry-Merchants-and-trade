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
  merged.sheet.isLocked = merged.sheet.isLocked === true
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
