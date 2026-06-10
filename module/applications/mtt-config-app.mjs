import { MTT } from "../config/constants.mjs";
import { MTT_EXPORTABLE_CONFIG_SETTINGS, buildModuleConfigurationExport } from "../config/config-export.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class MttConfigApp extends HandlebarsApplicationMixin(ApplicationV2) {
  #currencies = null;

  static DEFAULT_OPTIONS = {
    id: "mtt-config",
    classes: ["mtt-config-app"],
    window: {
      title: "mtt.config.title",
      resizable: true,
    },
    position: {
      width: 900,
      height: "auto",
    },
    actions: {
      save: MttConfigApp.#onSave,
      cancel: MttConfigApp.#onCancel,
      addCurrency: MttConfigApp.#onAddCurrency,
      deleteCurrency: MttConfigApp.#onDeleteCurrency,
      exportConfiguration: MttConfigApp.#onExportConfiguration,
      importConfiguration: MttConfigApp.#onImportConfiguration,
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
      itemQuantityPath: game.settings.get(MTT.ID, "itemQuantityPath"),
      itemDeliveryQuantityPerLotPath: game.settings.get(MTT.ID, "itemDeliveryQuantityPerLotPath"),
      deliveryItemQuantityPath: game.settings.get(MTT.ID, "deliveryItemQuantityPath"),
      deliveryItemMaxQuantityPath: game.settings.get(MTT.ID, "deliveryItemMaxQuantityPath"),
      writeDeliveryDescriptionInfo: game.settings.get(MTT.ID, "writeDeliveryDescriptionInfo"),
      itemDescriptionPath: game.settings.get(MTT.ID, "itemDescriptionPath"),
      itemSecretDescriptionPath: game.settings.get(MTT.ID, "itemSecretDescriptionPath"),
      allowedProductTypes: game.settings.get(MTT.ID, "allowedProductTypes"),
      allowedServiceTypes: game.settings.get(MTT.ID, "allowedServiceTypes"),
      itemCategoryPaths: game.settings.get(MTT.ID, "itemCategoryPaths"),
      useItemTypeAsCategoryFallback: game.settings.get(MTT.ID, "useItemTypeAsCategoryFallback"),
      categoryLabelMap: game.settings.get(MTT.ID, "categoryLabelMap"),
      defaultCustomCategories: game.settings.get(MTT.ID, "defaultCustomCategories"),
      itemSubcategoryPath: game.settings.get(MTT.ID, "itemSubcategoryPath"),
      itemCategoryI18nPrefix: game.settings.get(MTT.ID, "itemCategoryI18nPrefix"),
      itemSubcategoryI18nPrefix: game.settings.get(MTT.ID, "itemSubcategoryI18nPrefix"),
      currencies: this.#currencies,
    };
  }

  static async #onSave(event, target) {
    let existingCurrencies;
    try {
      existingCurrencies = JSON.parse(game.settings.get(MTT.ID, "currencies") || "[]");
    } catch {
      existingCurrencies = [];
    }
    const existingById = new Map(existingCurrencies.map((c) => [c.id, c]));

    const rows = this.element.querySelectorAll(".mtt-config-currency-row[data-currency-id]");
    const currencies = Array.from(rows)
      .map((row) => {
        const get = (field) => row.querySelector(`[data-mtt-currency-field="${field}"]`)?.value ?? "";
        const id = row.dataset.currencyId;
        const existing = existingById.get(id) ?? {};
        return {
          id,
          name: get("name"),
          abbreviation: get("abbreviation"),
          actorPath: get("actorPath"),
          itemPricePath: get("itemPricePath"),
          itemCurrencyPath: get("itemCurrencyPath"),
          itemCurrencyValues: get("itemCurrencyValues"),
          rate: Number(get("rate")) || 1,
          isDefault: existing.isDefault ?? false,
        };
      })
      .filter((c) => c.name.trim() !== "");
    const form = this.element.querySelector("form.mtt-config-form");
    const fd = new FormData(form);
    await game.settings.set(MTT.ID, "itemQuantityPath", fd.get("itemQuantityPath") ?? "");
    await game.settings.set(MTT.ID, "itemDeliveryQuantityPerLotPath", fd.get("itemDeliveryQuantityPerLotPath") ?? "");
    await game.settings.set(MTT.ID, "deliveryItemQuantityPath", fd.get("deliveryItemQuantityPath") ?? "");
    await game.settings.set(MTT.ID, "deliveryItemMaxQuantityPath", fd.get("deliveryItemMaxQuantityPath") ?? "");
    await game.settings.set(MTT.ID, "writeDeliveryDescriptionInfo", fd.get("writeDeliveryDescriptionInfo") === "on");
    await game.settings.set(MTT.ID, "itemDescriptionPath", fd.get("itemDescriptionPath") ?? "");
    await game.settings.set(MTT.ID, "itemSecretDescriptionPath", fd.get("itemSecretDescriptionPath") ?? "");
    await game.settings.set(MTT.ID, "allowedProductTypes", fd.get("allowedProductTypes") ?? "");
    await game.settings.set(MTT.ID, "allowedServiceTypes", fd.get("allowedServiceTypes") ?? "");
    await game.settings.set(MTT.ID, "itemCategoryPaths", fd.get("itemCategoryPaths") ?? "");
    await game.settings.set(MTT.ID, "useItemTypeAsCategoryFallback", fd.get("useItemTypeAsCategoryFallback") === "on");
    await game.settings.set(MTT.ID, "categoryLabelMap", fd.get("categoryLabelMap") ?? "");
    await game.settings.set(MTT.ID, "defaultCustomCategories", fd.get("defaultCustomCategories") ?? "");
    await game.settings.set(MTT.ID, "itemSubcategoryPath", fd.get("itemSubcategoryPath") ?? "");
    await game.settings.set(MTT.ID, "itemCategoryI18nPrefix", fd.get("itemCategoryI18nPrefix") ?? "");
    await game.settings.set(MTT.ID, "itemSubcategoryI18nPrefix", fd.get("itemSubcategoryI18nPrefix") ?? "");
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
      itemPricePath: "",
      itemCurrencyPath: "",
      itemCurrencyValues: "",
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

  static async #onExportConfiguration(event, target) {
    const data = buildModuleConfigurationExport();
    const json = JSON.stringify(data, null, 2);
    const date = new Date().toISOString().slice(0, 10);
    const filename = `mtt-config-${game.system.id}-${date}.json`;
    foundry.utils.saveDataToFile(json, "application/json", filename);
    ui.notifications.info(game.i18n.localize("mtt.config.importExport.exportSuccess"));
  }

  static async #onImportConfiguration(event, target) {
    const self = this;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;

      let data;
      try {
        data = JSON.parse(await file.text());
      } catch {
        ui.notifications.error(game.i18n.localize("mtt.config.importExport.invalidFile"));
        return;
      }

      if (data.module !== MTT.ID || data.type !== "module-configuration") {
        ui.notifications.error(game.i18n.localize("mtt.config.importExport.invalidFile"));
        return;
      }

      if (!Number.isFinite(Number(data.schemaVersion)) || Number(data.schemaVersion) > 1) {
        ui.notifications.error(game.i18n.localize("mtt.config.importExport.unsupportedVersion"));
        return;
      }

      if (!data.settings || typeof data.settings !== "object") {
        ui.notifications.error(game.i18n.localize("mtt.config.importExport.invalidFile"));
        return;
      }

      const systemMismatch = data.systemId && data.systemId !== game.system.id;
      const exportedAt = data.exportedAt ? new Date(data.exportedAt).toLocaleString() : "?";
      const settingsCount = Object.keys(data.settings).length;

      let content = `<p>${game.i18n.localize("mtt.config.importExport.importConfirmContent")}</p><ul>`;
      if (data.systemTitle || data.systemId) {
        content += `<li>${game.i18n.localize("mtt.config.importExport.infoSystem")} ${data.systemTitle || data.systemId}</li>`;
      }
      if (data.moduleVersion) {
        content += `<li>${game.i18n.localize("mtt.config.importExport.infoModuleVersion")} ${data.moduleVersion}</li>`;
      }
      content += `<li>${game.i18n.localize("mtt.config.importExport.infoExportedAt")} ${exportedAt}</li>`;
      content += `<li>${game.i18n.localize("mtt.config.importExport.infoSettingsCount")} ${settingsCount}</li>`;
      content += `</ul>`;
      if (systemMismatch) {
        content += `<p class="notification warning">${game.i18n.format("mtt.config.importExport.systemMismatch", { systemId: data.systemId, currentSystem: game.system.id })}</p>`;
      }

      const confirmed = await foundry.applications.api.DialogV2.confirm({
        window: { title: game.i18n.localize("mtt.config.importExport.importConfirmTitle") },
        content,
        rejectClose: false,
        yes: { label: game.i18n.localize("mtt.config.importExport.importConfirm") },
        no: { label: game.i18n.localize("mtt.config.importExport.cancel") },
      });

      if (!confirmed) return;

      for (const key of MTT_EXPORTABLE_CONFIG_SETTINGS) {
        if (!Object.prototype.hasOwnProperty.call(data.settings, key)) continue;
        try {
          await game.settings.set(MTT.ID, key, data.settings[key]);
        } catch {
          // ignore invalid values for individual settings
        }
      }

      ui.notifications.info(game.i18n.localize("mtt.config.importExport.importSuccess"));
      self.#currencies = null;
      self.render();
    });
    input.click();
  }
}
