import { isMTTMerchant, buildDefaultMerchantData, setMerchantData, unsetMerchantData } from "./merchant-flags.mjs"
import { isActorTypeAllowedForMerchant } from "../config/actor-types.mjs"
import { MerchantSheet } from "../applications/sheets/merchant-sheet.mjs"

// Bypass runtime : IDs acteurs dont la prochaine ouverture ne doit pas être redirigée vers MTT
const _managerBypassIds = new Set()

// ─── Actions de conversion ───────────────────────────────────────────────────

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
  if (!isActorTypeAllowedForMerchant(actor)) {
    ui.notifications.warn(game.i18n.format("mtt.notifications.merchantConversion.typeNotAllowed", { type: actor.type }))
    return
  }

  await setMerchantData(actor, buildDefaultMerchantData(actor))
  ui.notifications.info(game.i18n.format("mtt.notifications.merchantConversion.success", { name: actor.name }))
  openMerchantSheet(actor)
}

export function openMerchantSheet(actor) {
  if (!actor || !isMTTMerchant(actor)) return
  // Ramener au premier plan si déjà ouverte
  try {
    for (const app of foundry.applications.instances.values()) {
      if (app instanceof MerchantSheet && app.document?.id === actor.id) {
        app.render(true)
        return
      }
    }
  } catch {}
  new MerchantSheet({ document: actor }).render(true)
}

export function openManagerActorSheet(actor) {
  if (!actor) return
  _managerBypassIds.add(actor.id)
  actor.sheet?.render(true)
  // Nettoyage de sécurité si le hook de rendu ne se déclenche jamais
  setTimeout(() => _managerBypassIds.delete(actor.id), 2000)
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
    no: { label: game.i18n.localize("mtt.dialogs.removeMerchant.cancel") },
  })
  if (!confirmed) return

  await unsetMerchantData(actor)
  ui.notifications.info(game.i18n.format("mtt.notifications.merchantRemoval.success", { name: actor.name }))
}

// ─── Header controls des fiches acteur ──────────────────────────────────────

function getActorFromSheetApplication(app) {
  // Utilise uniquement app.actor pour éviter de cibler des apps de configuration
  // (ex. DocumentOwnershipConfig) qui exposent l'acteur via app.document mais
  // ne sont pas des fiches acteur.
  const doc = app?.actor ?? null
  if (!doc) return null
  if (doc.documentName === "Actor") return doc
  return null
}

function buildMTTControlsV2(actor, isOnMerchantSheet) {
  const controls = []

  if (!isMTTMerchant(actor) && isActorTypeAllowedForMerchant(actor) && game.user.isGM) {
    controls.push({
      icon: "fa-solid fa-store",
      label: game.i18n.localize("mtt.actorDirectory.convertToMerchant"),
      action: "mtt-convert",
      onClick: () => convertActorToMerchant(actor),
    })
  }

  if (isMTTMerchant(actor)) {
    if (!isOnMerchantSheet) {
      // Sur la feuille système : accès direct à la boutique MTT
      controls.push({
        icon: "fa-solid fa-shop",
        label: game.i18n.localize("mtt.actorDirectory.openMerchant"),
        action: "mtt-open-merchant",
        onClick: () => openMerchantSheet(actor),
      })
    }
    if (isOnMerchantSheet) {
      // Sur la feuille MTT : accès à la feuille système du gérant
      controls.push({
        icon: "fa-solid fa-user",
        label: game.i18n.localize("mtt.actorDirectory.openManager"),
        action: "mtt-open-manager",
        onClick: () => openManagerActorSheet(actor),
      })
    }
    if (game.user.isGM) {
      controls.push({
        icon: "fa-solid fa-trash",
        label: game.i18n.localize("mtt.actorDirectory.removeMerchant"),
        action: "mtt-remove-merchant",
        onClick: () => removeMerchantFromActor(actor),
      })
    }
  }

  return controls
}

function buildMTTButtonsV1(actor, isOnMerchantSheet) {
  const buttons = []

  if (!isMTTMerchant(actor) && isActorTypeAllowedForMerchant(actor) && game.user.isGM) {
    buttons.push({
      label: game.i18n.localize("mtt.actorDirectory.convertToMerchant"),
      class: "mtt-convert",
      icon: "fas fa-store",
      onclick: () => convertActorToMerchant(actor),
    })
  }

  if (isMTTMerchant(actor)) {
    if (!isOnMerchantSheet) {
      buttons.push({
        label: game.i18n.localize("mtt.actorDirectory.openMerchant"),
        class: "mtt-open-merchant",
        icon: "fas fa-shop",
        onclick: () => openMerchantSheet(actor),
      })
    }
    if (isOnMerchantSheet) {
      buttons.push({
        label: game.i18n.localize("mtt.actorDirectory.openManager"),
        class: "mtt-open-manager",
        icon: "fas fa-user",
        onclick: () => openManagerActorSheet(actor),
      })
    }
    if (game.user.isGM) {
      buttons.push({
        label: game.i18n.localize("mtt.actorDirectory.removeMerchant"),
        class: "mtt-remove-merchant",
        icon: "fas fa-trash",
        onclick: () => removeMerchantFromActor(actor),
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

// ─── Redirection automatique vers la feuille boutique MTT ───────────────────

export function registerMerchantSheetOpenHooks() {
  // ApplicationV2 — hook générique pour toutes les fiches AppV2
  Hooks.on("renderApplicationV2", (app, _element, _context, _options) => {
    if (app instanceof MerchantSheet) return
    const actor = getActorFromSheetApplication(app)
    if (!actor || !isMTTMerchant(actor)) return
    if (_managerBypassIds.has(actor.id)) {
      _managerBypassIds.delete(actor.id)
      return
    }
    queueMicrotask(() => {
      app.close({ animate: false })
      openMerchantSheet(actor)
    })
  })

  // Application v1 — hook générique pour toutes les fiches acteur legacy
  Hooks.on("renderApplicationV1", (app, _html, _data) => {
    // Utilise app.actor uniquement (les vraies fiches acteur V1 l'exposent)
    const actor = app.actor ?? null
    if (!actor || actor.documentName !== "Actor") return
    if (!isMTTMerchant(actor)) return
    if (_managerBypassIds.has(actor.id)) {
      _managerBypassIds.delete(actor.id)
      return
    }
    queueMicrotask(() => {
      app.close()
      openMerchantSheet(actor)
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
        name: "mtt.actorDirectory.convertToMerchant",
        icon: '<i class="fas fa-shop"></i>',
        condition: (li) => {
          if (!game.user.isGM) return false
          const actor = getActorFromLi(li)
          return Boolean(actor && !isMTTMerchant(actor) && isActorTypeAllowedForMerchant(actor))
        },
        callback: (li) => {
          const actor = getActorFromLi(li)
          if (actor) convertActorToMerchant(actor)
        },
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
        },
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
        },
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
        },
      },
    )
  })
}
