import { MTT } from "./module/config/constants.mjs"
import { parseDefaultCustomCategories, registerSettings } from "./module/config/settings.mjs"
import * as models from "./module/models/_module.mjs"
import * as applications from "./module/applications/_module.mjs"
import { registerMerchantSessionSocket } from "./module/applications/sheets/merchant-session-socket.mjs"

function buildDefaultCustomProductCategories() {
  return parseDefaultCustomCategories(game.settings.get(MTT.ID, "defaultCustomCategories")).map((name) => ({
    id: `category-${foundry.utils.randomID(6)}`,
    name,
  }))
}

function applyDefaultCustomCategoriesToNewMerchant(actor) {
  if (actor.type !== MTT.ACTOR_TYPES.MERCHANT) return

  const defaultCategories = buildDefaultCustomProductCategories()
  if (defaultCategories.length === 0) return

  const existingCategories = foundry.utils.deepClone(
    foundry.utils.getProperty(actor, "system.catalog.productCategories") ?? [],
  )
  const existingNames = new Set(
    existingCategories.map((category) => String(category?.name ?? "").trim().toLocaleLowerCase()).filter(Boolean),
  )
  const categoriesToAdd = defaultCategories.filter((category) => {
    const key = category.name.toLocaleLowerCase()
    if (existingNames.has(key)) return false
    existingNames.add(key)
    return true
  })
  if (categoriesToAdd.length === 0) return

  actor.updateSource({
    "system.catalog.productCategories": [...existingCategories, ...categoriesToAdd],
  })
}

Hooks.once("init", async function () {
  console.info(`${MTT.NAME} | ${game.i18n.localize("mtt.log.initializing")}`)

  game.modules.get(MTT.ID).api = {
    MTT,
    models,
    applications,
  }

  await foundry.applications.handlebars.loadTemplates(
    Object.values(MTT.TEMPLATES),
  )

  CONFIG.Actor.dataModels[MTT.ACTOR_TYPES.MERCHANT] = models.MerchantData
  CONFIG.Actor.typeLabels[MTT.ACTOR_TYPES.MERCHANT] = "mtt.actorTypes.merchant"

  foundry.documents.collections.Actors.registerSheet(
    MTT.ID,
    applications.MerchantSheet,
    {
      types: [MTT.ACTOR_TYPES.MERCHANT],
      makeDefault: true,
      label: "mtt.sheets.merchant",
    },
  )

  registerSettings()

  console.info(`${MTT.NAME} | ${game.i18n.localize("mtt.log.initialized")}`)
})

Hooks.once("ready", async function () {
  registerMerchantSessionSocket()
  console.info(`${MTT.NAME} | ${game.i18n.localize("mtt.log.ready")}`)
})

Hooks.on("preCreateActor", function (actor, data, options, userId) {
  if (userId !== game.user.id) return
  applyDefaultCustomCategoriesToNewMerchant(actor)
})
