import { MTT } from "./module/config/constants.mjs"
import { registerSettings } from "./module/config/settings.mjs"
import * as applications from "./module/applications/_module.mjs"
import { registerMerchantSessionSocket } from "./module/applications/sheets/merchant-session-socket.mjs"
import * as merchantFlags from "./module/documents/merchant-flags.mjs"
import * as merchantConversion from "./module/documents/merchant-conversion.mjs"
import * as merchantAccess from "./module/documents/merchant-access.mjs"
import { isMerchantProductItem } from "./module/documents/merchant-products.mjs"

Hooks.once("init", async function () {
  console.info(`${MTT.NAME} | ${game.i18n.localize("mtt.log.initializing")}`)

  game.modules.get(MTT.ID).api = {
    MTT,
    applications,
    merchantFlags,
    merchantConversion,
    merchantAccess,
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
  registerMerchantProductHooks()
  console.info(`${MTT.NAME} | ${game.i18n.localize("mtt.log.ready")}`)
})

function registerMerchantProductHooks() {
  // Détecte les modifications directes sur un Item produit (via sa sheet) et marque isCommerciallyModified.
  // Les mises à jour internes MTT passent avec { mtt: true } pour éviter ce marquage.
  Hooks.on("updateItem", async function (item, changes, options, _userId) {
    if (options?.mtt) return
    if (!item.parent || !merchantFlags.isMTTMerchant(item.parent)) return
    if (!isMerchantProductItem(item)) return

    // Les mises à jour de flags seuls (setFlag) ne doivent pas marquer comme modifié
    const changesKeys = Object.keys(changes)
    if (changesKeys.length === 1 && changesKeys[0] === "flags") return

    const productFlags = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {}
    if (productFlags.isCommerciallyModified) return

    await item.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, { ...productFlags, isCommerciallyModified: true })
  })
}
