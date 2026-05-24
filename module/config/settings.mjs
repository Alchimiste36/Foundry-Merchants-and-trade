import { MTT } from "./constants.mjs";

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
}
