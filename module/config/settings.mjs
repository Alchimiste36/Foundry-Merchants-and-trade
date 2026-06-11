import { MTT } from "./constants.mjs";
import { MttConfigApp } from "../applications/mtt-config-app.mjs";
import { MttGlobalJournalApp } from "../applications/mtt-global-journal-app.mjs";

export function registerSettings() {
  game.settings.register(MTT.ID, "debug", {
    name: "mtt.settings.debug.name",
    hint: "mtt.settings.debug.hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register(MTT.ID, "itemQuantityPath", {
    name: "mtt.settings.itemQuantityPath.name",
    hint: "mtt.settings.itemQuantityPath.hint",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register(MTT.ID, "itemDeliveryQuantityPerLotPath", {
    name: "mtt.settings.itemDeliveryQuantityPerLotPath.name",
    hint: "mtt.settings.itemDeliveryQuantityPerLotPath.hint",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  // Actor delivery only: these paths distribute purchased Items into receiving actor stacks.
  // They must never limit or split the merchant's independent catalogue stock.
  game.settings.register(MTT.ID, "deliveryItemQuantityPath", {
    name: "mtt.settings.deliveryItemQuantityPath.name",
    hint: "mtt.settings.deliveryItemQuantityPath.hint",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register(MTT.ID, "deliveryItemMaxQuantityPath", {
    name: "mtt.settings.deliveryItemMaxQuantityPath.name",
    hint: "mtt.settings.deliveryItemMaxQuantityPath.hint",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register(MTT.ID, "allowExtendedItemMerge", {
    name: "mtt.settings.allowExtendedItemMerge.name",
    hint: "mtt.settings.allowExtendedItemMerge.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register(MTT.ID, "writeDeliveryDescriptionInfo", {
    name: "mtt.settings.writeDeliveryDescriptionInfo.name",
    hint: "mtt.settings.writeDeliveryDescriptionInfo.hint",
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register(MTT.ID, "itemDescriptionPath", {
    name: "mtt.settings.itemDescriptionPath.name",
    hint: "mtt.settings.itemDescriptionPath.hint",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register(MTT.ID, "itemSecretDescriptionPath", {
    name: "mtt.settings.itemSecretDescriptionPath.name",
    hint: "mtt.settings.itemSecretDescriptionPath.hint",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register(MTT.ID, "allowedProductTypes", {
    name: "mtt.settings.allowedProductTypes.name",
    hint: "mtt.settings.allowedProductTypes.hint",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register(MTT.ID, "allowedServiceTypes", {
    name: "mtt.settings.allowedServiceTypes.name",
    hint: "mtt.settings.allowedServiceTypes.hint",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register(MTT.ID, "itemCategoryPaths", {
    name: "mtt.settings.itemCategoryPaths.name",
    hint: "mtt.settings.itemCategoryPaths.hint",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register(MTT.ID, "useItemTypeAsCategoryFallback", {
    name: "mtt.settings.useItemTypeAsCategoryFallback.name",
    hint: "mtt.settings.useItemTypeAsCategoryFallback.hint",
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register(MTT.ID, "categoryLabelMap", {
    name: "mtt.settings.categoryLabelMap.name",
    hint: "mtt.settings.categoryLabelMap.hint",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register(MTT.ID, "defaultCustomCategories", {
    name: "mtt.settings.defaultCustomCategories.name",
    hint: "mtt.settings.defaultCustomCategories.hint",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register(MTT.ID, "itemSubcategoryPath", {
    name: "mtt.settings.itemSubcategoryPath.name",
    hint: "mtt.settings.itemSubcategoryPath.hint",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register(MTT.ID, "itemCategoryI18nPrefix", {
    name: "mtt.settings.itemCategoryI18nPrefix.name",
    hint: "mtt.settings.itemCategoryI18nPrefix.hint",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register(MTT.ID, "itemSubcategoryI18nPrefix", {
    name: "mtt.settings.itemSubcategoryI18nPrefix.name",
    hint: "mtt.settings.itemSubcategoryI18nPrefix.hint",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register(MTT.ID, "currencies", {
    name: "mtt.settings.currencies.name",
    hint: "mtt.settings.currencies.hint",
    scope: "world",
    config: false,
    type: String,
    default: "[]",
  });

  game.settings.register(MTT.ID, "allowedMerchantActorTypes", {
    name: "mtt.settings.allowedMerchantActorTypes.name",
    hint: "mtt.settings.allowedMerchantActorTypes.hint",
    scope: "world",
    config: false,
    type: String,
    default: "[]",
  });

  game.settings.registerMenu(MTT.ID, "openConfigWindow", {
    name: "mtt.settings.openConfigWindow.name",
    label: "mtt.settings.openConfigWindow.label",
    hint: "mtt.settings.openConfigWindow.hint",
    icon: "fas fa-shop",
    type: MttConfigApp,
    restricted: true,
  });

  game.settings.registerMenu(MTT.ID, "openGlobalJournalWindow", {
    name: "mtt.settings.openGlobalJournal.name",
    label: "mtt.settings.openGlobalJournal.label",
    hint: "mtt.settings.openGlobalJournal.hint",
    icon: "fas fa-book",
    type: MttGlobalJournalApp,
    restricted: true,
  });
}

export function getCurrencies() {
  try {
    return JSON.parse(game.settings.get(MTT.ID, "currencies") || "[]");
  } catch {
    return [];
  }
}

export function parseDefaultCustomCategories(value) {
  const seen = new Set();

  return String(value ?? "")
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => {
      const key = entry.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
