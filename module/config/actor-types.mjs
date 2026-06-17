import { MTT } from "./constants.mjs"

const LEGACY_MTT_ACTOR_TYPES = new Set(["merchant", "mtt-merchants.merchant"])

function isLegacyMTTActorType(type) {
  return LEGACY_MTT_ACTOR_TYPES.has(String(type ?? "").trim())
}

function normalizeActorTypeList(types) {
  return Array.from(
    new Set(
      types
        .filter((type) => typeof type === "string")
        .map((type) => type.trim())
        .filter((type) => type && !isLegacyMTTActorType(type))
    )
  )
}

export function getAvailableActorTypes() {
  try {
    const systemTypes = game.system?.documentTypes?.Actor
    let typeKeys = []
    if (Array.isArray(systemTypes)) {
      typeKeys = systemTypes.filter((t) => typeof t === "string" && t.trim())
    } else if (systemTypes && typeof systemTypes === "object") {
      typeKeys = Object.keys(systemTypes).filter((t) => t.trim())
    }
    if (typeKeys.length === 0) {
      typeKeys = Object.keys(CONFIG.Actor.dataModels ?? {}).filter((t) => t.trim())
    }
    typeKeys = normalizeActorTypeList(typeKeys)
    return typeKeys.map((value) => {
      const labelKey = CONFIG.Actor.typeLabels?.[value]
      const label = labelKey ? game.i18n.localize(labelKey) || value : value
      return { value, label }
    })
  } catch {
    return []
  }
}

export function normalizeAllowedMerchantActorTypes(types) {
  try {
    const arr = Array.isArray(types) ? types : JSON.parse(String(types ?? "[]"))
    return normalizeActorTypeList(arr)
  } catch {
    return []
  }
}

export function getAllowedMerchantActorTypes() {
  try {
    return normalizeAllowedMerchantActorTypes(game.settings.get(MTT.ID, "allowedMerchantActorTypes"))
  } catch {
    return []
  }
}

export async function setAllowedMerchantActorTypes(types) {
  const normalized = normalizeAllowedMerchantActorTypes(types)
  return game.settings.set(MTT.ID, "allowedMerchantActorTypes", JSON.stringify(normalized))
}

export function isActorTypeAllowedForMerchant(actorOrType) {
  const rawType = typeof actorOrType === "string" ? actorOrType : actorOrType?.type
  const type = typeof rawType === "string" ? rawType.trim() : ""
  if (!type) return false
  if (isLegacyMTTActorType(type)) return false
  return getAllowedMerchantActorTypes().includes(type)
}
