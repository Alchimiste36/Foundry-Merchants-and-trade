import {
  isMTTMerchant,
  getMerchantData,
  buildDefaultMerchantData,
  setMerchantData,
  unsetMerchantData,
  updateMerchantData
} from "./shop-flags.mjs"
import {
  buildDefaultStorageData,
  buildInitialLocalStorageCategories,
  isMTTStorage,
  setStorageData,
  unsetStorageData
} from "./storage-flags.mjs"
import { isActorTypeAllowedForMerchant, isActorTypeAllowedForStorage } from "../config/actor-types.mjs"
import { MerchantSheet } from "../applications/sheets/merchant-sheet.mjs"
import { rehydrateMerchantItemsOnConversion } from "../applications/sheets/merchant-catalog.mjs"
import { MTT } from "../config/constants.mjs"

// Bypass ponctuel : IDs acteurs en attente d'un premier render à marquer comme bypassé
const _managerBypassActorIds = new Set()

// Bypass durable : instances d'applications dont les rerenders ne redirigent pas vers MTT.
// WeakSet = pas de fuite mémoire quand l'app est détruite.
const _managerBypassApps = new WeakSet()

const SHOP_WINDOW_LEFT = 620
const STORAGE_WINDOW_LEFT = 290

// ─── Actions de conversion ───────────────────────────────────────────────────

// MTT shop — conversion boutique / marchand commercial
export async function convertActorToMerchant(actor) {
  if (!actor) return
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("mtt.notifications.merchantConversion.gmOnly"))
    return
  }
  if (isMTTMerchant(actor)) {
    ui.notifications.info(game.i18n.localize("mtt.notifications.merchantConversion.alreadyMerchant"))
    return
  }
  if (isMTTStorage(actor)) {
    ui.notifications.warn(game.i18n.localize("mtt.notifications.storageConversion.alreadyStorage"))
    return
  }
  if (!isActorTypeAllowedForMerchant(actor)) {
    ui.notifications.warn(game.i18n.format("mtt.notifications.merchantConversion.typeNotAllowed", { type: actor.type }))
    return
  }

  const hasExistingProductItems =
    actor.items?.size > 0 &&
    Array.from(actor.items.values()).some((item) => item.getFlag?.(MTT.ID, MTT.FLAGS.PRODUCT) != null)

  await setMerchantData(
    actor,
    buildDefaultMerchantData(actor, {
      includeInitialGlobalCategories: !hasExistingProductItems
    })
  )
  await actor.setFlag(MTT.ID, MTT.FLAGS.TYPE, MTT.ENTITY_TYPES.MERCHANT)

  if (hasExistingProductItems) {
    await rehydrateMerchantItemsOnConversion(actor)
  }

  ui.notifications.info(game.i18n.format("mtt.notifications.merchantConversion.success", { name: actor.name }))
  openMerchantSheet(actor)
}

// MTT storage — conversion stockage
export async function convertActorToStorage(actor) {
  if (!actor) return
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("mtt.notifications.storageConversion.gmOnly"))
    return
  }
  if (isMTTStorage(actor)) {
    ui.notifications.info(game.i18n.localize("mtt.notifications.storageConversion.alreadyStorage"))
    return
  }
  if (isMTTMerchant(actor)) {
    ui.notifications.warn(game.i18n.localize("mtt.notifications.merchantConversion.alreadyMerchant"))
    return
  }
  if (!isActorTypeAllowedForStorage(actor)) {
    ui.notifications.warn(game.i18n.format("mtt.notifications.storageConversion.typeNotAllowed", { type: actor.type }))
    return
  }

  await setStorageData(actor, buildDefaultStorageData(actor))

  const initialStorageCategories = buildInitialLocalStorageCategories()
  const hasExistingCategories = getMerchantData(actor)?.catalog?.productCategories?.length > 0
  if (initialStorageCategories.length > 0 && !hasExistingCategories) {
    await updateMerchantData(actor, { catalog: { productCategories: initialStorageCategories } })
  }

  ui.notifications.info(game.i18n.format("mtt.notifications.storageConversion.success", { name: actor.name }))
}

export function openMerchantSheet(actor, options = {}) {
  if (!actor || !isMTTMerchant(actor)) return
  openMTTBaseSheet(actor, options)
}

// MTT base — ouverture de feuille commune aux types MTT basés sur merchant-*
function openMTTBaseSheet(actor, options = {}) {
  if (!actor) return
  // Ramener au premier plan si déjà ouverte
  try {
    for (const app of foundry.applications.instances.values()) {
      if (app instanceof MerchantSheet && app.document?.id === actor.id) {
        app.render(true)
        return
      }
    }
  } catch {
    // L'itération des applications peut échouer pendant certains cycles de rendu Foundry.
  }

  const position = { ...(options.position ?? {}) }
  if (position.left == null) {
    position.left = isMTTStorage(actor) ? STORAGE_WINDOW_LEFT : SHOP_WINDOW_LEFT
  }

  new MerchantSheet({ ...options, document: actor, position }).render(true)
}

export function openStorageSheet(actor, options = {}) {
  if (!actor || !isMTTStorage(actor)) return
  openMTTBaseSheet(actor, options)
}

export function openManagerActorSheet(actor) {
  if (!actor) return
  _managerBypassActorIds.add(actor.id)
  actor.sheet?.render(true)
  // Nettoyage de sécurité si le hook de rendu ne se déclenche jamais
  setTimeout(() => _managerBypassActorIds.delete(actor.id), 2000)
}

export async function removeMerchantFromActor(actor) {
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("mtt.notifications.merchantConversion.gmOnly"))
    return
  }
  if (!actor) return
  if (!isMTTMerchant(actor)) {
    ui.notifications.warn(game.i18n.localize("mtt.notifications.merchantConversion.noMerchant"))
    return
  }

  const confirmed = await foundry.applications.api.DialogV2.confirm({
    window: { title: game.i18n.localize("mtt.dialogs.removeMerchant.title") },
    content: `<p>${game.i18n.localize("mtt.dialogs.removeMerchant.content")}</p>`,
    rejectClose: false,
    yes: { label: game.i18n.localize("mtt.dialogs.removeMerchant.confirm") },
    no: { label: game.i18n.localize("mtt.dialogs.removeMerchant.cancel") }
  })
  if (!confirmed) return

  await unsetMerchantData(actor)
  if (actor.getFlag(MTT.ID, MTT.FLAGS.TYPE) === MTT.ENTITY_TYPES.MERCHANT) {
    await actor.unsetFlag(MTT.ID, MTT.FLAGS.TYPE)
  }
  ui.notifications.info(game.i18n.format("mtt.notifications.merchantRemoval.success", { name: actor.name }))
}

export async function removeStorageFromActor(actor) {
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("mtt.notifications.storageConversion.gmOnly"))
    return
  }
  if (!actor) return
  if (!isMTTStorage(actor)) {
    ui.notifications.warn(game.i18n.localize("mtt.notifications.storageConversion.noStorage"))
    return
  }

  const confirmed = await foundry.applications.api.DialogV2.confirm({
    window: { title: game.i18n.localize("mtt.dialogs.removeStorage.title") },
    content: `<p>${game.i18n.localize("mtt.dialogs.removeStorage.content")}</p>`,
    rejectClose: false,
    yes: { label: game.i18n.localize("mtt.dialogs.removeStorage.confirm") },
    no: { label: game.i18n.localize("mtt.dialogs.removeStorage.cancel") }
  })
  if (!confirmed) return

  await unsetStorageData(actor)
  ui.notifications.info(game.i18n.format("mtt.notifications.storageRemoval.success", { name: actor.name }))
}

// ─── Helpers de résolution d'acteur ──────────────────────────────────────────

/**
 * Pour les header controls : retourne l'acteur associé à une feuille.
 * Exclut les ItemSheets (document = Item) pour ne pas injecter de contrôles MTT sur les items.
 */
function getActorFromSheetApplication(app) {
  const doc = app?.document ?? app?.object ?? null
  if (doc?.documentName === "Item") return null
  const actor = app?.actor ?? null
  if (!actor || actor.documentName !== "Actor") return null
  return actor
}

/**
 * Pour la logique de redirection uniquement.
 * Ne remonte JAMAIS vers item.parent — retourne null si le document principal n'est pas un Actor.
 */
function getDirectActorForRedirect(app) {
  const doc = app?.document ?? app?.object ?? null
  if (!doc) return null
  if (doc.documentName !== "Actor") return null
  return doc
}

/**
 * Applications natives Foundry de configuration qui ne doivent jamais être redirigées.
 */
function isFoundryConfigApplication(app) {
  const name = app?.constructor?.name ?? ""
  return ["DocumentOwnershipConfig", "DocumentSheetConfig", "DocumentDirectoryConfig"].includes(name)
}

function canConvertToAnyMTTType(actor) {
  return isActorTypeAllowedForMerchant(actor) || isActorTypeAllowedForStorage(actor)
}

// MTT base — conversion commune vers les types MTT
export async function openMTTConversionDialog(actor) {
  if (!actor || !game.user.isGM) return
  if (isMTTMerchant(actor) || isMTTStorage(actor)) return

  const buttons = []
  if (isActorTypeAllowedForMerchant(actor)) {
    buttons.push({
      action: MTT.ENTITY_TYPES.MERCHANT,
      icon: "fa-solid fa-store",
      label: game.i18n.localize("mtt.actorDirectory.convertToMerchant"),
      callback: () => MTT.ENTITY_TYPES.MERCHANT
    })
  }
  if (isActorTypeAllowedForStorage(actor)) {
    buttons.push({
      action: MTT.ENTITY_TYPES.STORAGE,
      icon: "fa-solid fa-box-archive",
      label: game.i18n.localize("mtt.actorDirectory.convertToStorage"),
      callback: () => MTT.ENTITY_TYPES.STORAGE
    })
  }

  if (buttons.length === 0) {
    ui.notifications.warn(game.i18n.format("mtt.notifications.mttConversion.noTypeAllowed", { type: actor.type }))
    return
  }

  buttons.push({
    action: "cancel",
    label: game.i18n.localize("mtt.dialog.cancel"),
    callback: () => null
  })

  const choice = await foundry.applications.api.DialogV2.wait({
    window: { title: game.i18n.localize("mtt.dialogs.mttConversion.title") },
    content: `<p>${game.i18n.format("mtt.dialogs.mttConversion.content", { name: actor.name })}</p>`,
    rejectClose: false,
    buttons
  })

  if (choice === MTT.ENTITY_TYPES.MERCHANT) return convertActorToMerchant(actor)
  if (choice === MTT.ENTITY_TYPES.STORAGE) return convertActorToStorage(actor)
}

function buildMTTControlsV2(actor, isOnMerchantSheet) {
  const controls = []

  if (!isMTTMerchant(actor) && !isMTTStorage(actor) && canConvertToAnyMTTType(actor) && game.user.isGM) {
    controls.push({
      icon: "fa-solid fa-shuffle",
      label: game.i18n.localize("mtt.actorDirectory.convertMTT"),
      action: "mtt-convert",
      onClick: () => openMTTConversionDialog(actor)
    })
  }

  if (isMTTMerchant(actor)) {
    if (!isOnMerchantSheet) {
      // Sur la feuille système : accès direct à la boutique MTT
      controls.push({
        icon: "fa-solid fa-shop",
        label: game.i18n.localize("mtt.actorDirectory.openMerchant"),
        action: "mtt-open-merchant",
        onClick: () => openMerchantSheet(actor)
      })
    }
    if (isOnMerchantSheet) {
      // Sur la feuille MTT : accès à la feuille système du gérant
      controls.push({
        icon: "fa-solid fa-user",
        label: game.i18n.localize("mtt.actorDirectory.openManager"),
        action: "mtt-open-manager",
        onClick: () => openManagerActorSheet(actor)
      })
    }
    if (game.user.isGM) {
      controls.push({
        icon: "fa-solid fa-trash",
        label: game.i18n.localize("mtt.actorDirectory.removeMerchant"),
        action: "mtt-remove-merchant",
        onClick: () => removeMerchantFromActor(actor)
      })
    }
  }

  if (isMTTStorage(actor)) {
    if (!isOnMerchantSheet) {
      controls.push({
        icon: "fa-solid fa-box-archive",
        label: game.i18n.localize("mtt.actorDirectory.openStorage"),
        action: "mtt-open-storage",
        onClick: () => openStorageSheet(actor)
      })
    }
    if (isOnMerchantSheet) {
      // MTT storage — ouvrir temporairement la feuille système sans changer l'ouverture par défaut
      controls.push({
        icon: "fa-solid fa-user",
        label: game.i18n.localize("mtt.actorDirectory.openActorSheet"),
        action: "mtt-open-actor-sheet",
        onClick: () => openManagerActorSheet(actor)
      })
    }
    if (game.user.isGM) {
      controls.push({
        icon: "fa-solid fa-trash",
        label: game.i18n.localize("mtt.actorDirectory.removeStorage"),
        action: "mtt-remove-storage",
        onClick: () => removeStorageFromActor(actor)
      })
    }
  }

  return controls
}

function buildMTTButtonsV1(actor, isOnMerchantSheet) {
  const buttons = []

  if (!isMTTMerchant(actor) && !isMTTStorage(actor) && canConvertToAnyMTTType(actor) && game.user.isGM) {
    buttons.push({
      label: game.i18n.localize("mtt.actorDirectory.convertMTT"),
      class: "mtt-convert",
      icon: "fas fa-shuffle",
      onclick: () => openMTTConversionDialog(actor)
    })
  }

  if (isMTTMerchant(actor)) {
    if (!isOnMerchantSheet) {
      buttons.push({
        label: game.i18n.localize("mtt.actorDirectory.openMerchant"),
        class: "mtt-open-merchant",
        icon: "fas fa-shop",
        onclick: () => openMerchantSheet(actor)
      })
    }
    if (isOnMerchantSheet) {
      buttons.push({
        label: game.i18n.localize("mtt.actorDirectory.openManager"),
        class: "mtt-open-manager",
        icon: "fas fa-user",
        onclick: () => openManagerActorSheet(actor)
      })
    }
    if (game.user.isGM) {
      buttons.push({
        label: game.i18n.localize("mtt.actorDirectory.removeMerchant"),
        class: "mtt-remove-merchant",
        icon: "fas fa-trash",
        onclick: () => removeMerchantFromActor(actor)
      })
    }
  }

  if (isMTTStorage(actor)) {
    if (!isOnMerchantSheet) {
      buttons.push({
        label: game.i18n.localize("mtt.actorDirectory.openStorage"),
        class: "mtt-open-storage",
        icon: "fas fa-box-archive",
        onclick: () => openStorageSheet(actor)
      })
    }
    if (isOnMerchantSheet) {
      // MTT storage — ouvrir temporairement la feuille système sans changer l'ouverture par défaut
      buttons.push({
        label: game.i18n.localize("mtt.actorDirectory.openActorSheet"),
        class: "mtt-open-actor-sheet",
        icon: "fas fa-user",
        onclick: () => openManagerActorSheet(actor)
      })
    }
    if (game.user.isGM) {
      buttons.push({
        label: game.i18n.localize("mtt.actorDirectory.removeStorage"),
        class: "mtt-remove-storage",
        icon: "fas fa-trash",
        onclick: () => removeStorageFromActor(actor)
      })
    }
  }

  return buttons
}

export function registerActorSheetHeaderHooks() {
  // Hook ApplicationV2 — contrôles d'en-tête (three-dot menu)
  Hooks.on("getHeaderControlsApplicationV2", (app, controls) => {
    const actor = getActorFromSheetApplication(app)
    if (!actor) return
    const isOnMerchantSheet = app instanceof MerchantSheet
    controls.push(...buildMTTControlsV2(actor, isOnMerchantSheet))
  })

  // Hook Application v1 — fallback fiches acteur legacy
  Hooks.on("getApplicationV1HeaderButtons", (app, buttons) => {
    const actor = getActorFromSheetApplication(app)
    if (!actor) return
    const isOnMerchantSheet = app instanceof MerchantSheet
    buttons.push(...buildMTTButtonsV1(actor, isOnMerchantSheet))
  })
}

// ─── Redirection automatique vers la feuille MTT commune ────────────────────

export function registerMerchantSheetOpenHooks() {
  // MTT base — nettoyage du bypass durable quand une feuille système se ferme,
  // afin que la prochaine ouverture de l'acteur redirige correctement vers la feuille MTT
  Hooks.on("closeApplicationV2", (app) => {
    _managerBypassApps.delete(app)
  })
  Hooks.on("closeApplication", (app) => {
    _managerBypassApps.delete(app)
  })

  // ApplicationV2 — hook générique pour toutes les fiches AppV2
  Hooks.on("renderApplicationV2", (app, _element, _context, _options) => {
    if (app instanceof MerchantSheet) return
    if (isFoundryConfigApplication(app)) return

    // Bypass durable : feuille gérant ouverte explicitement — ses rerenders restent intacts
    if (_managerBypassApps.has(app)) return

    // Ne rediriger que si le document principal est directement un Actor (pas un Item embedded)
    const actor = getDirectActorForRedirect(app)
    if (!actor || (!isMTTMerchant(actor) && !isMTTStorage(actor))) return

    // Bypass ponctuel au premier render → mémoriser l'instance pour tous ses rerenders futurs
    if (_managerBypassActorIds.has(actor.id)) {
      _managerBypassActorIds.delete(actor.id)
      _managerBypassApps.add(app)
      return
    }

    queueMicrotask(() => {
      app.close({ animate: false })
      if (isMTTStorage(actor)) openStorageSheet(actor)
      else openMerchantSheet(actor)
    })
  })

  // Application v1 — hook générique pour toutes les fiches acteur legacy
  Hooks.on("renderApplicationV1", (app, _html, _data) => {
    if (isFoundryConfigApplication(app)) return

    // Bypass durable
    if (_managerBypassApps.has(app)) return

    // Ne remonte jamais vers item.parent pour décider une redirection
    const actor = getDirectActorForRedirect(app)
    if (!actor || (!isMTTMerchant(actor) && !isMTTStorage(actor))) return

    if (_managerBypassActorIds.has(actor.id)) {
      _managerBypassActorIds.delete(actor.id)
      _managerBypassApps.add(app)
      return
    }

    queueMicrotask(() => {
      app.close()
      if (isMTTStorage(actor)) openStorageSheet(actor)
      else openMerchantSheet(actor)
    })
  })
}

// ─── Actor Directory context menu (bonus, non critique) ─────────────────────

function getActorFromLi(li) {
  const el = li instanceof HTMLElement ? li : li[0]
  const id = el?.dataset?.documentId
  return id ? game.actors.get(id) : null
}

export function registerActorDirectoryHooks() {
  Hooks.on("getActorDirectoryEntryContext", (_html, options) => {
    options.push(
      {
        name: "mtt.actorDirectory.convertMTT",
        icon: '<i class="fas fa-shuffle"></i>',
        condition: (li) => {
          if (!game.user.isGM) return false
          const actor = getActorFromLi(li)
          return Boolean(actor && !isMTTMerchant(actor) && !isMTTStorage(actor) && canConvertToAnyMTTType(actor))
        },
        callback: (li) => {
          const actor = getActorFromLi(li)
          if (actor) openMTTConversionDialog(actor)
        }
      },
      {
        name: "mtt.actorDirectory.openStorage",
        icon: '<i class="fas fa-box-archive"></i>',
        condition: (li) => {
          const actor = getActorFromLi(li)
          return Boolean(actor && isMTTStorage(actor))
        },
        callback: (li) => {
          const actor = getActorFromLi(li)
          if (actor) openStorageSheet(actor)
        }
      },
      {
        name: "mtt.actorDirectory.removeStorage",
        icon: '<i class="fas fa-trash"></i>',
        condition: (li) => {
          if (!game.user.isGM) return false
          const actor = getActorFromLi(li)
          return Boolean(actor && isMTTStorage(actor))
        },
        callback: (li) => {
          const actor = getActorFromLi(li)
          if (actor) removeStorageFromActor(actor)
        }
      },
      {
        name: "mtt.actorDirectory.openMerchant",
        icon: '<i class="fas fa-store"></i>',
        condition: (li) => {
          const actor = getActorFromLi(li)
          return Boolean(actor && isMTTMerchant(actor))
        },
        callback: (li) => {
          const actor = getActorFromLi(li)
          if (actor) openMerchantSheet(actor)
        }
      },
      {
        name: "mtt.actorDirectory.openManager",
        icon: '<i class="fas fa-user"></i>',
        condition: (li) => {
          if (!game.user.isGM) return false
          const actor = getActorFromLi(li)
          return Boolean(actor && isMTTMerchant(actor))
        },
        callback: (li) => {
          const actor = getActorFromLi(li)
          if (actor) openManagerActorSheet(actor)
        }
      },
      {
        name: "mtt.actorDirectory.removeMerchant",
        icon: '<i class="fas fa-trash"></i>',
        condition: (li) => {
          if (!game.user.isGM) return false
          const actor = getActorFromLi(li)
          return Boolean(actor && isMTTMerchant(actor))
        },
        callback: (li) => {
          const actor = getActorFromLi(li)
          if (actor) removeMerchantFromActor(actor)
        }
      }
    )
  })
}
