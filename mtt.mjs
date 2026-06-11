import { MTT } from "./module/config/constants.mjs"
import { registerSettings } from "./module/config/settings.mjs"
import * as models from "./module/models/_module.mjs"
import * as applications from "./module/applications/_module.mjs"
import { registerMerchantSessionSocket } from "./module/applications/sheets/merchant-session-socket.mjs"
import * as merchantFlags from "./module/documents/merchant-flags.mjs"
import * as merchantConversion from "./module/documents/merchant-conversion.mjs"

Hooks.once("init", async function () {
  console.info(`${MTT.NAME} | ${game.i18n.localize("mtt.log.initializing")}`)

  game.modules.get(MTT.ID).api = {
    MTT,
    models,
    applications,
    merchantFlags,
    merchantConversion,
  }

  await foundry.applications.handlebars.loadTemplates(
    Object.values(MTT.TEMPLATES),
  )

  registerSettings()
  merchantConversion.registerActorSheetHeaderHooks()
  merchantConversion.registerMerchantSheetOpenHooks()
  merchantConversion.registerActorDirectoryHooks()

  console.info(`${MTT.NAME} | ${game.i18n.localize("mtt.log.initialized")}`)
})

Hooks.once("ready", async function () {
  registerMerchantSessionSocket()
  console.info(`${MTT.NAME} | ${game.i18n.localize("mtt.log.ready")}`)
})
