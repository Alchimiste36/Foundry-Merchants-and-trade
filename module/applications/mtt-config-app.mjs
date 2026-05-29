import { MTT } from "../config/constants.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class MttConfigApp extends HandlebarsApplicationMixin(ApplicationV2) {
  #currencies = null;

  static DEFAULT_OPTIONS = {
    id: "mtt-config",
    classes: ["mtt-config-app"],
    window: {
      title: "mtt.config.title",
      resizable: false,
    },
    position: {
      width: 560,
      height: "auto",
    },
    actions: {
      save: MttConfigApp.#onSave,
      cancel: MttConfigApp.#onCancel,
      addCurrency: MttConfigApp.#onAddCurrency,
      deleteCurrency: MttConfigApp.#onDeleteCurrency,
    },
  };

  static PARTS = {
    body: {
      template: MTT.TEMPLATES.MTT_CONFIG,
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    if (this.#currencies === null) {
      try {
        this.#currencies = JSON.parse(game.settings.get(MTT.ID, "currencies") || "[]");
      } catch {
        this.#currencies = [];
      }
    }
    return {
      ...context,
      itemPriceValuePath: game.settings.get(MTT.ID, "itemPriceValuePath"),
      itemPriceCurrencyPath: game.settings.get(MTT.ID, "itemPriceCurrencyPath"),
      itemQuantityPath: game.settings.get(MTT.ID, "itemQuantityPath"),
      itemDescriptionPath: game.settings.get(MTT.ID, "itemDescriptionPath"),
      allowedProductTypes: game.settings.get(MTT.ID, "allowedProductTypes"),
      allowedServiceTypes: game.settings.get(MTT.ID, "allowedServiceTypes"),
      itemCategoryPaths: game.settings.get(MTT.ID, "itemCategoryPaths"),
      useItemTypeAsCategoryFallback: game.settings.get(MTT.ID, "useItemTypeAsCategoryFallback"),
      categoryLabelMap: game.settings.get(MTT.ID, "categoryLabelMap"),
      currencies: this.#currencies,
    };
  }

  static async #onSave(event, target) {
    const rows = this.element.querySelectorAll(".mtt-config-currency-row[data-currency-id]");
    const currencies = Array.from(rows)
      .map((row) => {
        const get = (field) => row.querySelector(`[data-mtt-currency-field="${field}"]`)?.value ?? "";
        return {
          id: row.dataset.currencyId,
          name: get("name"),
          abbreviation: get("abbreviation"),
          actorPath: get("actorPath"),
          rate: Number(get("rate")) || 1,
        };
      })
      .filter((c) => c.name.trim() !== "");
    const form = this.element.querySelector("form.mtt-config-form");
    const fd = new FormData(form);
    await game.settings.set(MTT.ID, "itemPriceValuePath", fd.get("itemPriceValuePath") ?? "");
    await game.settings.set(MTT.ID, "itemPriceCurrencyPath", fd.get("itemPriceCurrencyPath") ?? "");
    await game.settings.set(MTT.ID, "itemQuantityPath", fd.get("itemQuantityPath") ?? "");
    await game.settings.set(MTT.ID, "itemDescriptionPath", fd.get("itemDescriptionPath") ?? "");
    await game.settings.set(MTT.ID, "allowedProductTypes", fd.get("allowedProductTypes") ?? "");
    await game.settings.set(MTT.ID, "allowedServiceTypes", fd.get("allowedServiceTypes") ?? "");
    await game.settings.set(MTT.ID, "itemCategoryPaths", fd.get("itemCategoryPaths") ?? "");
    await game.settings.set(MTT.ID, "useItemTypeAsCategoryFallback", fd.get("useItemTypeAsCategoryFallback") === "on");
    await game.settings.set(MTT.ID, "categoryLabelMap", fd.get("categoryLabelMap") ?? "");
    await game.settings.set(MTT.ID, "currencies", JSON.stringify(currencies));
    this.close();
  }

  static async #onCancel(event, target) {
    this.close();
  }

  static async #onAddCurrency(event, target) {
    let currencies;
    try {
      currencies = JSON.parse(game.settings.get(MTT.ID, "currencies") || "[]");
    } catch {
      currencies = [];
    }
    currencies.push({
      id: foundry.utils.randomID(),
      name: "",
      abbreviation: "",
      actorPath: "",
      rate: 1,
    });
    await game.settings.set(MTT.ID, "currencies", JSON.stringify(currencies));
    this.#currencies = null;
    this.render();
  }

  static async #onDeleteCurrency(event, target) {
    const id = target.dataset.currencyId;
    let currencies;
    try {
      currencies = JSON.parse(game.settings.get(MTT.ID, "currencies") || "[]");
    } catch {
      currencies = [];
    }
    await game.settings.set(MTT.ID, "currencies", JSON.stringify(currencies.filter((c) => c.id !== id)));
    this.#currencies = null;
    this.render();
  }
}
