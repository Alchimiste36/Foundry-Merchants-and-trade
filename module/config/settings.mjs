import { MTT } from "./constants.mjs";
import { MttConfigApp } from "../applications/mtt-config-app.mjs";

export function registerSettings() {
  game.settings.register(MTT.ID, "debug", {
    name: "mtt.settings.debug.name",
    hint: "mtt.settings.debug.hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register(MTT.ID, "itemPriceValuePath", {
    name: "mtt.settings.itemPriceValuePath.name",
    hint: "mtt.settings.itemPriceValuePath.hint",
    scope: "world",
    config: true,
    type: String,
    default: "",
  });

  game.settings.register(MTT.ID, "itemPriceCurrencyPath", {
    name: "mtt.settings.itemPriceCurrencyPath.name",
    hint: "mtt.settings.itemPriceCurrencyPath.hint",
    scope: "world",
    config: true,
    type: String,
    default: "",
  });

  game.settings.register(MTT.ID, "itemQuantityPath", {
    name: "mtt.settings.itemQuantityPath.name",
    hint: "mtt.settings.itemQuantityPath.hint",
    scope: "world",
    config: true,
    type: String,
    default: "",
  });

  game.settings.register(MTT.ID, "itemDescriptionPath", {
    name: "mtt.settings.itemDescriptionPath.name",
    hint: "mtt.settings.itemDescriptionPath.hint",
    scope: "world",
    config: true,
    type: String,
    default: "",
  });

  game.settings.register(MTT.ID, "allowedProductTypes", {
    name: "mtt.settings.allowedProductTypes.name",
    hint: "mtt.settings.allowedProductTypes.hint",
    scope: "world",
    config: true,
    type: String,
    default: "",
  });

  game.settings.register(MTT.ID, "allowedServiceTypes", {
    name: "mtt.settings.allowedServiceTypes.name",
    hint: "mtt.settings.allowedServiceTypes.hint",
    scope: "world",
    config: true,
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

  game.settings.register(MTT.ID, "actorCurrencyPath", {
    name: "mtt.settings.actorCurrencyPath.name",
    hint: "mtt.settings.actorCurrencyPath.hint",
    scope: "world",
    config: true,
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

  game.settings.registerMenu(MTT.ID, "openConfigWindow", {
    name: "mtt.settings.openConfigWindow.name",
    label: "mtt.settings.openConfigWindow.label",
    hint: "mtt.settings.openConfigWindow.hint",
    icon: "fas fa-shop",
    type: MttConfigApp,
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

export function setCurrencies(currencies) {
  return game.settings.set(MTT.ID, "currencies", JSON.stringify(currencies));
}
