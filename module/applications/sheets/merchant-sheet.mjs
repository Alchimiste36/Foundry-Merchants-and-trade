import { MTT } from "../../config/constants.mjs";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class MerchantSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  #activeTab = "products";

  static DEFAULT_OPTIONS = {
    classes: [MTT.CSS.SHEET, MTT.CSS.MERCHANT_SHEET],
    position: {
      width: 920,
      height: 720,
    },
    form: {
      submitOnChange: true,
    },
    window: {
      title: "mtt.sheets.merchant",
      resizable: true,
    },
    actions: {
      createItem: MerchantSheet.#onCreateItem,
      editItem: MerchantSheet.#onEditItem,
      deleteItem: MerchantSheet.#onDeleteItem,
      toggleOpen: MerchantSheet.#onToggleOpen,
      toggleLock: MerchantSheet.#onToggleLock,
      toggleProductSecret: MerchantSheet.#onToggleProductSecret,
      toggleProductCategory: MerchantSheet.#onToggleProductCategory,
      selectTab: MerchantSheet.#onSelectTab,
    },
  };

  static PARTS = {
    body: {
      template: MTT.TEMPLATES.MERCHANT_SHEET,
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const isLocked = this.actor.system.sheet.isLocked;
    const canEditMerchant = this.isEditable && !isLocked;
    const canConfigureMerchant = this.isEditable;

    context.mtt = {
      css: MTT.CSS,
      activeTab: this.#activeTab,
      isLocked,
      isUnlocked: !isLocked,
      canEditMerchant,
      canConfigureMerchant,
      labels: {
        merchantSheet: "mtt.sheets.merchant",
        open: "mtt.merchant.status.open",
        closed: "mtt.merchant.status.closed",
        lock: "mtt.sheet.lock",
        unlock: "mtt.sheet.unlock",
        createItem: "mtt.actions.createItem",
      },
    };

    context.actor = this.actor;
    context.system = this.actor.system;
    context.items = this.#prepareItems();
    context.productCategories = this.#prepareProductCategories(context.items);

    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);

    this.element
      .querySelectorAll("[data-mtt-product-field]")
      .forEach((input) => input.addEventListener("change", (event) => this.#onProductFieldChange(event)));

    this.element
      .querySelectorAll("[data-mtt-product-id]")
      .forEach((row) => row.addEventListener("dragstart", (event) => this.#onProductDragStart(event)));

    this.element.querySelectorAll("[data-mtt-category-drop]").forEach((dropZone) => {
      dropZone.addEventListener("dragover", (event) => this.#onCategoryDragOver(event));
      dropZone.addEventListener("drop", (event) => this.#onCategoryDrop(event));
    });
  }

  _canDragDrop(selector) {
    return super._canDragDrop(selector);
  }

  async _onDropDocument(event, document) {
    if (this.actor.system.sheet.isLocked) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.sheetLocked"));
      return;
    }

    if (document.documentName !== "Item") {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.onlyItemsCanBeDropped"));
      return;
    }

    const itemData = document.toObject();
    delete itemData._id;

    this.#createProductFlags(itemData);

    await this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  #prepareItems() {
    return this.actor.items.map((item) => {
      const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};
      const quantity = product.quantity ?? MTT.PRODUCT_DEFAULTS.quantity;
      const displayName = product.displayName || item.name;

      return {
        id: item.id,
        uuid: item.uuid,
        name: item.name,
        displayName,
        hasCustomDisplayName: displayName !== item.name,
        type: item.type,
        img: item.img,
        quantity,
        hasQuantity: quantity !== null && quantity !== undefined,
        document: item,
        secretName: product.secretName ?? "",
        secretPrice: product.secretPrice ?? "",
        secretDescription: product.secretDescription ?? "",
        priceValue:
          Number.isFinite(Number(product.priceValue)) && Number(product.priceValue) >= 0
            ? Number(product.priceValue)
            : MTT.PRODUCT_DEFAULTS.priceValue,
        priceCurrency: product.priceCurrency?.trim() ?? MTT.PRODUCT_DEFAULTS.priceCurrency,
        category: (product.category ?? "").trim(),
        hasCategory: Boolean((product.category ?? "").trim()),
        hasPrice: Number.isFinite(Number(product.priceValue)) && Number(product.priceValue) > 0,
        priceLabel:
          Number.isFinite(Number(product.priceValue)) && Number(product.priceValue) > 0
            ? `${Number(product.priceValue)}${product.priceCurrency ? ` ${product.priceCurrency.trim()}` : ""}`
            : "",
        hasSecretInfos: Boolean(product.secretName || product.secretPrice || product.secretDescription),
        isSecretExpanded: product.isSecretExpanded ?? MTT.PRODUCT_DEFAULTS.isSecretExpanded,
      };
    });
  }
  #getItemFromEvent(target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    if (!itemId) return null;

    return this.actor.items.get(itemId) ?? null;
  }

  #prepareProductCategories(items) {
    const categories = new Map();

    items.forEach((item) => {
      const categoryValue = item.category || "";
      const name = categoryValue || game.i18n.localize("mtt.products.category.undefined");
      if (!categories.has(categoryValue)) {
        categories.set(categoryValue, {
          id: `category-${categoryValue || "uncategorized"}`,
          name,
          categoryValue,
          items: [],
          count: 0,
          isCollapsed: false,
        });
      }

      const group = categories.get(categoryValue);
      group.items.push(item);
      group.count += 1;
    });

    const collapsedCategories = this.actor.system.catalog?.collapsedCategories ?? {};

    const sortedCategories = Array.from(categories.values()).map((group) => ({
      ...group,
      isCollapsed: Boolean(collapsedCategories[group.categoryValue]),
    }));

    sortedCategories.sort((a, b) => {
      if (a.categoryValue === "" && b.categoryValue !== "") return -1;
      if (a.categoryValue !== "" && b.categoryValue === "") return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

    return sortedCategories;
  }

  static async #onToggleProductCategory(event, target) {
    event.preventDefault();

    if (!this.isEditable) return;

    const categoryValue = target.dataset.category ?? "";
    const collapsedCategories = foundry.utils.deepClone(this.actor.system.catalog.collapsedCategories ?? {});
    collapsedCategories[categoryValue] = !Boolean(collapsedCategories[categoryValue]);

    await this.actor.update({
      "system.catalog.collapsedCategories": collapsedCategories,
    });

    this.render();
  }

  #onProductDragStart(event) {
    const target = event.currentTarget;
    const itemId = target.dataset.mttProductId;
    if (!itemId || this.actor.system.sheet.isLocked) return;

    event.dataTransfer.setData("application/json", JSON.stringify({ type: "mtt.product", itemId }));
    event.dataTransfer.effectAllowed = "move";
  }

  #onCategoryDragOver(event) {
    if (this.actor.system.sheet.isLocked) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  async #onCategoryDrop(event) {
    const categoryValue = event.currentTarget.dataset.category ?? "";
    let payload = null;

    try {
      payload = JSON.parse(event.dataTransfer.getData("application/json"));
    } catch {
      return;
    }

    if (!payload || payload.type !== "mtt.product") return;
    if (this.actor.system.sheet.isLocked) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.sheetLocked"));
      return;
    }

    await this.#moveProductToCategory(payload.itemId, categoryValue);
    event.preventDefault();
  }

  async #moveProductToCategory(itemId, categoryValue) {
    const item = this.actor.items.get(itemId);
    if (!item) return;

    const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};
    await item.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, {
      ...product,
      category: categoryValue ?? "",
    });
    this.render();
  }

  #createProductFlags(itemData) {
    const productFlags = foundry.utils.deepClone(MTT.PRODUCT_DEFAULTS);

    productFlags.displayName = itemData.name ?? "";

    foundry.utils.setProperty(itemData, `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}`, productFlags);

    return itemData;
  }

  static async #onCreateItem(event, target) {
    event.preventDefault();

    if (!this.#canModifyMerchant()) return;

    const type = target.dataset.type || "loot";

    const itemData = this.#createProductFlags({
      name: game.i18n.localize("mtt.items.newItem"),
      type,
    });

    await this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  static async #onEditItem(event, target) {
    event.preventDefault();

    const item = this.#getItemFromEvent(target);

    item?.sheet?.render(true);
  }

  static async #onDeleteItem(event, target) {
    event.preventDefault();

    if (!this.#canModifyMerchant()) return;

    const item = this.#getItemFromEvent(target);
    if (!item) return;

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: game.i18n.localize("mtt.dialog.deleteItem.title"),
      },
      content: `<p>${game.i18n.localize("mtt.dialog.deleteItem.content")}</p>`,
      yes: {
        label: "mtt.actions.delete",
      },
      no: {
        label: "mtt.actions.cancel",
      },
    });

    if (!confirmed) return;

    await this.actor.deleteEmbeddedDocuments("Item", [item.id]);
  }

  static async #onToggleOpen(event) {
    event.preventDefault();

    if (!this.#canModifyMerchant()) return;

    await this.actor.update({
      "system.status.isOpen": !this.actor.system.status.isOpen,
    });
  }

  static async #onToggleLock(event) {
    event.preventDefault();

    if (!this.isEditable) return;

    await this.actor.update({
      "system.sheet.isLocked": !this.actor.system.sheet.isLocked,
    });
  }

  static async #onToggleProductSecret(event, target) {
    event.preventDefault();

    if (!this.isEditable) return;

    const item = this.#getItemFromEvent(target);
    if (!item) return;

    const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};
    const isSecretExpanded = Boolean(product.isSecretExpanded);

    await item.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, {
      ...product,
      isSecretExpanded: !isSecretExpanded,
    });

    this.render();
  }

  static #onSelectTab(event, target) {
    event.preventDefault();

    const tab = target.dataset.tab;
    if (!tab) return;

    if (tab === "configuration" && !this.isEditable) return;

    this.#activeTab = tab;
    this.render();
  }

  async #onProductFieldChange(event) {
    const target = event.currentTarget;

    if (!this.#canModifyMerchant()) return;

    const item = this.#getItemFromEvent(target);
    if (!item) return;

    const field = target.dataset.mttProductField;

    if (field === "displayName") {
      const displayName = target.value?.trim();

      const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};

      await item.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, {
        ...product,
        displayName: displayName || item.name,
      });

      return;
    }

    if (field === "quantity") {
      const quantity = Number(target.value);

      if (!Number.isFinite(quantity) || quantity < 0) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidQuantity"));
        target.value = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT)?.quantity ?? MTT.PRODUCT_DEFAULTS.quantity;
        return;
      }

      const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};

      await item.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, {
        ...product,
        quantity,
      });
    }
    if (field === "priceValue") {
      const rawValue = Number(target.value);

      if (!Number.isFinite(rawValue) || rawValue < 0) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidPrice"));
        target.value = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT)?.priceValue ?? MTT.PRODUCT_DEFAULTS.priceValue;
        return;
      }

      const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};

      await item.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, {
        ...product,
        priceValue: rawValue,
      });
      return;
    }
    if (field === "priceCurrency") {
      const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};

      await item.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, {
        ...product,
        priceCurrency: target.value?.trim() ?? "",
      });
      return;
    }
    if (field === "category") {
      const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};

      await item.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, {
        ...product,
        category: target.value?.trim() ?? "",
      });
      return;
    }
    if (["secretName", "secretPrice", "secretDescription"].includes(field)) {
      const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};

      await item.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, {
        ...product,
        [field]: target.value?.trim() ?? "",
      });
    }
  }

  #canModifyMerchant() {
    if (!this.isEditable) return false;

    if (this.actor.system.sheet.isLocked) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.sheetLocked"));
      return false;
    }

    return true;
  }
}
