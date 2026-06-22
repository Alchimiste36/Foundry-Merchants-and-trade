import { MTT } from "./constants.mjs"
import { normalizeAllowedMerchantActorTypes, normalizeAllowedStorageActorTypes } from "./actor-types.mjs"
import { normalizeMerchantPermissionProfiles } from "../documents/merchant-access.mjs"

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
  "allowedStorageActorTypes",
  "merchantPermissionProfiles"
]

export function buildModuleConfigurationExport() {
  const settings = {}
  for (const key of MTT_EXPORTABLE_CONFIG_SETTINGS) {
    try {
      const value = game.settings.get(MTT.ID, key)
      settings[key] =
        key === "allowedMerchantActorTypes"
          ? JSON.stringify(normalizeAllowedMerchantActorTypes(value))
          : key === "allowedStorageActorTypes"
            ? JSON.stringify(normalizeAllowedStorageActorTypes(value))
          : key === "merchantPermissionProfiles"
            ? JSON.stringify(normalizeMerchantPermissionProfiles(value))
            : value
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
    settings
  }
}
