import { MTT } from "./constants.mjs"

export const MTT_EXPORTABLE_CONFIG_SETTINGS = [
  "itemQuantityPath",
  "itemDeliveryQuantityPerLotPath",
  "deliveryItemQuantityPath",
  "deliveryItemMaxQuantityPath",
  "writeDeliveryDescriptionInfo",
  "itemDescriptionPath",
  "itemSecretDescriptionPath",
  "allowedProductTypes",
  "allowedServiceTypes",
  "itemCategoryPaths",
  "useItemTypeAsCategoryFallback",
  "categoryLabelMap",
  "defaultCustomCategories",
  "currencies",
  "itemSubcategoryPath",
  "itemCategoryI18nPrefix",
  "itemSubcategoryI18nPrefix",
  "allowedMerchantActorTypes",
]

export function buildModuleConfigurationExport() {
  const settings = {}
  for (const key of MTT_EXPORTABLE_CONFIG_SETTINGS) {
    try {
      settings[key] = game.settings.get(MTT.ID, key)
    } catch {
      // skip unregistered settings
    }
  }
  return {
    module: MTT.ID,
    type: "module-configuration",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    foundryVersion: game.version,
    moduleVersion: game.modules.get(MTT.ID)?.version ?? "",
    systemId: game.system.id,
    systemTitle: game.system.title,
    settings,
  }
}
