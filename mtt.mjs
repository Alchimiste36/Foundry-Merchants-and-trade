import { MTT } from "./module/config/constants.mjs"
import { getCurrencies, registerSettings } from "./module/config/settings.mjs"
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
    if (options?.mttInlineEdit && options?.mttSkipCommercialModified) return
    if (!item.parent || !merchantFlags.isMTTMerchant(item.parent)) return
    if (!isMerchantProductItem(item)) return
    if (!hasRealCommercialItemChange(changes)) return

    const productFlags = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {}
    if (productFlags.isCommerciallyModified) return

    await item.update({
      [`flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}`]: {
        ...productFlags,
        isCommerciallyModified: true,
      },
    }, { mtt: true })
  })
}

function hasRealCommercialItemChange(changes) {
  if (!changes || typeof changes !== "object") return false
  if (hasChangedPath(changes, "name")) return true

  for (const path of getConfiguredCommercialItemPaths("itemPricePath")) {
    if (hasChangedPath(changes, path)) return true
  }

  for (const path of getConfiguredCommercialItemPaths("itemCurrencyPath")) {
    if (hasChangedPath(changes, path)) return true
  }

  return false
}

function getConfiguredCommercialItemPaths(key) {
  const paths = new Set()
  for (const currency of getCurrencies()) {
    const path = String(currency?.[key] ?? "").trim()
    if (path) paths.add(path)
  }
  return paths
}

function hasChangedPath(changes, path) {
  if (!path) return false
  if (Object.prototype.hasOwnProperty.call(changes, path)) return true
  return foundry.utils.hasProperty(changes, path)
}
