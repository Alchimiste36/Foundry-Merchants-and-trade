import { MTT } from "../config/constants.mjs"
import { getMTTEntityType } from "./mtt-flags.mjs"

const DEFAULT_SHOP_IMAGE = "icons/svg/hanging-sign.svg"
const DEFAULT_MANAGER_IMAGE = "icons/svg/mystery-man.svg"

/**
 * Construit le chemin Foundry complet vers les données de boutique MTT dans les flags de l'acteur.
 *
 * @param {string} [path=""] - Chemin relatif sous la racine du flag marchand.
 * @returns {string} Chemin de type "flags.mtt-merchants.merchant[.path]"
 *
 * @example
 * getMerchantFlagPath()              // "flags.mtt-merchants.merchant"
 * getMerchantFlagPath("shop.name")   // "flags.mtt-merchants.merchant.shop.name"
 */
export function getMerchantFlagPath(path = "") {
  const suffix = String(path ?? "").trim()
  const base = `flags.${MTT.ID}.${MTT.FLAGS.MERCHANT}`
  return suffix ? `${base}.${suffix}` : base
}

// ─── Catégories produit locales ───────────────────────────────────────────────

const GLOBAL_CATEGORY_MARKERS = [
  "isGlobal",
  "global",
  "globalId",
  "sourceType",
  "fromGlobal",
  "fromGlobalCategory",
  "isFromGlobalCategory",
  "protected",
  "locked",
  "isProtected",
  "canDelete",
  "readonly",
  "templateId",
  "settingId",
  "configId",
  "globalCategoryId"
]

export function createLocalMerchantCategory({ name = "", id = "", sort = null } = {}) {
  const category = {
    id: String(id ?? "").trim() || `category-${foundry.utils.randomID(6)}`,
    name: String(name ?? "").trim()
  }

  if (Number.isFinite(Number(sort))) category.sort = Number(sort)

  return category
}

function getConfiguredInitialProductCategoryNames() {
  try {
    const raw = String(game.settings.get(MTT.ID, "defaultCustomCategories") ?? "")
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
      .map((name) => name)
  } catch {
    return []
  }
}

function buildInitialLocalProductCategories() {
  return getConfiguredInitialProductCategoryNames().map((name, index) =>
    createLocalMerchantCategory({ name, sort: index })
  )
}

function normalizeLocalMerchantCategory(category) {
  const normalized =
    category && typeof category === "object"
      ? foundry.utils.deepClone(category)
      : { name: String(category ?? "").trim() }

  for (const marker of GLOBAL_CATEGORY_MARKERS) {
    delete normalized[marker]
  }
  if (normalized.source === "global") delete normalized.source

  const localCategory = createLocalMerchantCategory({
    ...normalized,
    id: normalized.id,
    name: normalized.name || normalized.id
  })

  return {
    ...normalized,
    ...localCategory
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construit la structure de données par défaut d'une boutique MTT pour un acteur support.
 * Ne persiste rien — retourne uniquement l'objet en mémoire.
 *
 * @param {Actor|null} [actor=null] - L'acteur système support de la boutique.
 * @param {object} [options={}]
 * @param {boolean} [options.includeInitialGlobalCategories=false] - Copie les CPG en catégories locales ordinaires.
 * @returns {object} Structure complète avec toutes les valeurs initiales.
 */
export function buildDefaultMerchantData(actor = null, { includeInitialGlobalCategories = false } = {}) {
  return {
    enabled: true,
    version: 1,
    sheet: {
      isLocked: true
    },
    shop: {
      name: game.i18n?.localize("mtt.defaults.shopName") ?? "",
      img: DEFAULT_SHOP_IMAGE,
      description: ""
    },
    manager: {
      mode: "actor",
      actorUuid: actor?.uuid ?? null,
      displayName: actor?.name ?? "",
      img: actor?.img ?? DEFAULT_MANAGER_IMAGE
    },
    trade: {
      buyPercent: 50,
      sellPercent: 100,
      serviceSellPercent: 100,
      negotiationFormula: ""
    },
    wallet: {
      currencies: {}
    },
    referenceState: null,
    journal: {
      nextTransactionNumber: 1,
      transactions: []
    },
    access: {
      clients: []
    },
    catalog: {
      keepEmptyItems: true,
      collapsedCategories: {},
      hiddenCategories: {},
      productCategories: includeInitialGlobalCategories ? buildInitialLocalProductCategories() : [],
      products: [],
      services: []
    },
    sessions: {
      entries: []
    }
  }
}

/**
 * Fusionne des données existantes avec la structure par défaut pour garantir l'absence de champs manquants.
 * Les données existantes écrasent les valeurs par défaut (pas l'inverse).
 * N'écrit pas dans l'acteur.
 *
 * @param {object} [data={}] - Données brutes issues des flags (peuvent être null/undefined).
 * @param {Actor|null} [actor=null] - L'acteur support, utilisé pour les valeurs par défaut contextuelles.
 * @returns {object} Données normalisées complètes.
 */
export function normalizeMerchantData(data = {}, actor = null) {
  const defaults = buildDefaultMerchantData(actor)
  const source = foundry.utils.deepClone(data ?? {})
  const merged = foundry.utils.mergeObject(defaults, source, {
    inplace: false,
    insertKeys: true,
    insertValues: true,
    overwrite: true
  })

  merged.enabled = merged.enabled === true
  merged.sheet ??= {}
  merged.shop ??= {}
  if (!String(merged.shop.name ?? "").trim()) {
    merged.shop.name = game.i18n?.localize("mtt.defaults.shopName") ?? ""
  }
  if (!String(merged.shop.img ?? "").trim()) {
    merged.shop.img = DEFAULT_SHOP_IMAGE
  }
  merged.manager ??= {}
  if (!String(merged.manager.displayName ?? "").trim()) {
    merged.manager.displayName = actor?.name ?? ""
  }
  if (!String(merged.manager.img ?? "").trim()) {
    merged.manager.img = actor?.img ?? DEFAULT_MANAGER_IMAGE
  }
  merged.trade ??= {}
  merged.wallet ??= {}
  merged.wallet.currencies ??= {}
  merged.referenceState ??= null
  merged.catalog ??= {}
  merged.catalog.products ??= []
  merged.catalog.services ??= []
  merged.catalog.productCategories ??= []
  merged.catalog.productCategories = merged.catalog.productCategories
    .map(normalizeLocalMerchantCategory)
    .filter((category) => category.id && category.name)
  merged.catalog.collapsedCategories ??= {}
  merged.catalog.hiddenCategories ??= {}
  merged.sessions ??= { entries: [] }
  merged.sessions.entries ??= []
  merged.journal ??= { nextTransactionNumber: 1, transactions: [] }
  merged.journal.transactions ??= []
  merged.access ??= { clients: [] }
  merged.access.clients ??= []

  return merged
}

/**
 * Lit les données de boutique MTT depuis les flags de l'acteur.
 * Retourne null si aucun flag n'existe (ne crée pas silencieusement de boutique).
 *
 * @param {Actor|null} actor - L'acteur support.
 * @returns {object|null} Données normalisées, ou null si aucune boutique n'est attachée.
 */
export function getMerchantData(actor) {
  const raw = actor?.getFlag?.(MTT.ID, MTT.FLAGS.MERCHANT)
  if (!raw) return null
  return normalizeMerchantData(raw, actor)
}

/**
 * Retourne une copie modifiable des données de boutique, prête pour une mise à jour.
 * Si aucun flag n'existe, retourne la structure par défaut (utile pour la conversion initiale).
 *
 * @param {Actor|null} actor - L'acteur support.
 * @returns {object} Deep clone des données normalisées, ou données par défaut si aucun flag.
 */
export function getMerchantDataForUpdate(actor) {
  return foundry.utils.deepClone(getMerchantData(actor) ?? buildDefaultMerchantData(actor))
}

/**
 * Détermine si un acteur porte une boutique MTT active.
 * Critère : `flags.mtt-merchants.merchant.enabled === true`.
 * Ne teste pas `actor.type`.
 *
 * @param {Actor|null} actor - L'acteur à tester.
 * @returns {boolean}
 */
export function isMTTMerchant(actor) {
  return getMTTEntityType(actor) === MTT.ENTITY_TYPES.MERCHANT && getMerchantData(actor)?.enabled === true
}

/**
 * Remplace entièrement le bloc de données de boutique MTT dans les flags de l'acteur.
 * Normalise les données avant l'écriture.
 * N'écrit jamais dans actor.system.
 *
 * @param {Actor} actor - L'acteur support.
 * @param {object} data - Données complètes de boutique à persister.
 * @returns {Promise<Actor|null>}
 */
export async function setMerchantData(actor, data, options = {}) {
  if (!actor) return null
  const normalized = normalizeMerchantData(data, actor)
  return actor.update({ [`flags.${MTT.ID}.${MTT.FLAGS.MERCHANT}`]: normalized }, options)
}

/**
 * Applique une mise à jour partielle aux données de boutique MTT.
 * L'objet `changes` est relatif à la racine du bloc marchand (ex. : { shop: { name: "..." } }).
 * N'accepte pas de chemins bruts de flags — passer un objet partiel structuré.
 *
 * @param {Actor} actor - L'acteur support.
 * @param {object} [changes={}] - Modifications partielles à fusionner.
 * @returns {Promise<Actor|null>}
 */
export async function updateMerchantData(actor, changes = {}, options = {}) {
  if (!actor) return null
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
    console.error(`${MTT.NAME} | updateMerchantData : changes doit être un objet, reçu :`, typeof changes, changes)
    return getMerchantData(actor)
  }
  const current = getMerchantDataForUpdate(actor)
  const merged = foundry.utils.mergeObject(current, foundry.utils.deepClone(changes), {
    inplace: false,
    insertKeys: true,
    insertValues: true,
    overwrite: true
  })
  return setMerchantData(actor, merged, options)
}

/**
 * Supprime le bloc de boutique MTT des flags de l'acteur.
 * Ne supprime ni l'acteur, ni ses Items, ni actor.system.
 *
 * @param {Actor} actor - L'acteur support.
 * @returns {Promise<Actor|null>}
 */
export async function unsetMerchantData(actor) {
  if (!actor) return null
  return actor.unsetFlag(MTT.ID, MTT.FLAGS.MERCHANT)
}
