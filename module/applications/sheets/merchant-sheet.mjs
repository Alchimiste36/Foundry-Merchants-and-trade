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
      createProductCategory: MerchantSheet.#onCreateProductCategory,
      editItem: MerchantSheet.#onEditItem,
      deleteItem: MerchantSheet.#onDeleteItem,
      deleteProductCategory: MerchantSheet.#onDeleteProductCategory,
      createService: MerchantSheet.#onCreateService,
      deleteService: MerchantSheet.#onDeleteService,
      toggleServiceExpanded: MerchantSheet.#onToggleServiceExpanded,
      toggleServiceHidden: MerchantSheet.#onToggleServiceHidden,
      toggleServiceApproval: MerchantSheet.#onToggleServiceApproval,
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

    if (this.#activeTab === "sessions") this.#activeTab = "products";

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
    context.services = this.#prepareServices();

    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);

    this.element
      .querySelectorAll("[data-mtt-product-field]")
      .forEach((input) => input.addEventListener("change", (event) => this.#onProductFieldChange(event)));

    this.element
      .querySelectorAll("[data-mtt-category-name]")
      .forEach((input) => input.addEventListener("change", (event) => this.#onCategoryNameChange(event)));

    this.element
      .querySelectorAll("[data-mtt-product-id]")
      .forEach((row) => row.addEventListener("dragstart", (event) => this.#onProductDragStart(event)));

    this.element.querySelectorAll("[data-mtt-category-drop]").forEach((dropZone) => {
      dropZone.addEventListener("dragover", (event) => this.#onCategoryDragOver(event));
      dropZone.addEventListener("drop", (event) => this.#onCategoryDrop(event));
    });

    this.element
      .querySelectorAll("[data-mtt-service-field]")
      .forEach((input) => input.addEventListener("change", (event) => this.#onServiceFieldChange(event)));

    this.element.querySelectorAll("[data-mtt-service-drop]").forEach((dropZone) => {
      if (dropZone.dataset.mttDropBound) return;
      dropZone.dataset.mttDropBound = "1";
      dropZone.addEventListener("dragover", (event) => this.#onServiceDragOver(event));
      dropZone.addEventListener("drop", (event) => this.#onServiceDrop(event));
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

    if (!this.#isItemTypeAllowed(document, "allowedProductTypes")) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.productTypeNotAllowed"));
      return;
    }

    const categoryDrop = event.target?.closest?.("[data-mtt-category-drop]");
    const categoryValue = categoryDrop?.dataset?.category ?? "";

    const itemData = document.toObject();
    delete itemData._id;

    await this.#addOrMergeProduct(itemData, categoryValue);
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
    const definedCategories = this.actor.system.catalog?.productCategories ?? [];
    const categories = new Map();

    const shouldShowSystemCategory = items.length > 0 || definedCategories.length > 0;
    if (shouldShowSystemCategory) {
      categories.set("", {
        id: "category-uncategorized",
        name: game.i18n.localize("mtt.products.category.undefined"),
        categoryValue: "",
        items: [],
        count: 0,
        isCollapsed: false,
        isSystemCategory: true,
      });
    }

    definedCategories.forEach((category) => {
      if (!category?.id) return;
      categories.set(category.id, {
        id: category.id,
        name: category.name || category.id,
        categoryValue: category.id,
        items: [],
        count: 0,
        isCollapsed: false,
        isSystemCategory: false,
      });
    });

    items.forEach((item) => {
      const categoryValue = item.category && categories.has(item.category) ? item.category : "";
      const group = categories.get(categoryValue);
      if (!group) return;
      group.items.push(item);
      group.count += 1;
    });

    const collapsedCategories = this.actor.system.catalog?.collapsedCategories ?? {};

    const sortedCategories = Array.from(categories.values()).map((group) => ({
      ...group,
      isCollapsed: Boolean(collapsedCategories[group.categoryValue]),
    }));

    sortedCategories.sort((a, b) => {
      if (a.isSystemCategory && !b.isSystemCategory) return -1;
      if (!a.isSystemCategory && b.isSystemCategory) return 1;
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

    event.preventDefault();
    event.stopPropagation();

    await this.#moveProductToCategory(payload.itemId, categoryValue);
    return;
  }

  #onServiceDragOver(event) {
    if (this.actor.system.sheet.isLocked) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  async #onServiceDrop(event) {
    if (this.actor.system.sheet.isLocked) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.sheetLocked"));
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const dragData = TextEditor.getDragEventData(event);
    if (!dragData) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.onlyItemsCanCreateServices"));
      return;
    }

    let doc = null;
    try {
      if (dragData.uuid) {
        doc = await fromUuid(dragData.uuid);
      } else if (dragData.pack && dragData.id) {
        const pack = game.packs.get(dragData.pack);
        if (pack) doc = await pack.getDocument(dragData.id);
      } else if (dragData.type === "Item" && dragData.id) {
        // fallback: try to find item by id in game items
        doc = game.items.get(dragData.id) ?? null;
      }
    } catch (err) {
      // ignore
    }

    if (!doc || doc.documentName !== "Item") {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.onlyItemsCanCreateServices"));
      return;
    }

    if (!this.#isItemTypeAllowed(doc, "allowedServiceTypes")) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.serviceTypeNotAllowed"));
      return;
    }

    await this.#createServiceFromItem(doc);
  }

  async #createServiceFromItem(item) {
    const entries = foundry.utils.deepClone(this.actor.system.services?.entries ?? []);

    const newId = foundry.utils.randomID();

    let description = this.#getConfiguredItemValue(item, "itemDescriptionPath");
    if (description === null || description === undefined || description === "") {
      description = this.#getItemDescription(item) ?? "";
    }
    if (typeof description === "object" && description?.value) {
      description = description.value;
    }
    description = description ? String(description) : "";

    let priceValue = this.#parsePriceValue(this.#getConfiguredItemValue(item, "itemPriceValuePath"));
    if (priceValue === null) {
      priceValue = this.#getItemPrice(item) ?? 0;
    }

    let priceCurrency = this.#getConfiguredItemValue(item, "itemPriceCurrencyPath");
    if (typeof priceCurrency !== "string") {
      priceCurrency = "";
    }
    priceCurrency = priceCurrency.trim();

    const newService = {
      id: newId,
      ...foundry.utils.deepClone(MTT.SERVICE_DEFAULTS),
      name: item.name ?? "",
      description,
      priceValue,
      priceCurrency,
      quantity: null,
      isHidden: false,
      requiresApproval: false,
      isExpanded: true,
      sourceUuid: item.uuid ?? null,
      sourceName: item.name ?? "",
      sourceType: item.type ?? "",
      sourceImg: item.img ?? "",
    };

    entries.push(newService);

    await this.actor.update({
      "system.services.entries": entries,
    });

    this.render();
  }

  #getItemDescription(item) {
    try {
      const candidates = [
        foundry.utils.getProperty(item, "system.description"),
        foundry.utils.getProperty(item, "system.description.value"),
        foundry.utils.getProperty(item, "system.details.description"),
      ];

      for (const c of candidates) {
        if (!c) continue;
        if (typeof c === "string") return c;
        if (c?.value) return c.value;
      }
    } catch (err) {
      // ignore
    }

    return "";
  }

  #getItemPrice(item) {
    try {
      const candidates = [
        foundry.utils.getProperty(item, "system.price"),
        foundry.utils.getProperty(item, "system.cost"),
        foundry.utils.getProperty(item, "system.value"),
      ];

      for (const c of candidates) {
        if (c === undefined || c === null) continue;
        if (typeof c === "number" && Number.isFinite(c)) return c;
        if (typeof c === "string") {
          const m = c.match(/-?\d+(?:[\.,]\d+)?/);
          if (m) return Number(m[0].replace(",", "."));
        }
        if (typeof c === "object" && c?.value) {
          const v = c.value;
          if (typeof v === "number" && Number.isFinite(v)) return v;
          if (typeof v === "string") {
            const m = v.match(/-?\d+(?:[\.,]\d+)?/);
            if (m) return Number(m[0].replace(",", "."));
          }
        }
      }
    } catch (err) {
      // ignore
    }

    return 0;
  }

  async #addOrMergeProduct(itemData, categoryValue = "") {
    const productData = foundry.utils.deepClone(itemData);
    productData.flags = productData.flags ?? {};

    const productFlags = foundry.utils.deepClone(MTT.PRODUCT_DEFAULTS);
    productFlags.displayName = productData.name ?? "";
    productFlags.category = categoryValue ?? "";

    productData.flags[MTT.ID] = {
      ...(productData.flags[MTT.ID] ?? {}),
      [MTT.FLAGS.PRODUCT]: productFlags,
    };

    const sourceConfiguredPrice = this.#getConfiguredItemValue(productData, "itemPriceValuePath");
    const sourcePriceValue = this.#parsePriceValue(sourceConfiguredPrice) ?? MTT.PRODUCT_DEFAULTS.priceValue;

    const sourceConfiguredCurrency = this.#getConfiguredItemValue(productData, "itemPriceCurrencyPath");
    const sourcePriceCurrency = typeof sourceConfiguredCurrency === "string"
      ? sourceConfiguredCurrency.trim()
      : MTT.PRODUCT_DEFAULTS.priceCurrency;

    const existingProduct = this.actor.items.find((item) => {
      if (item.type !== productData.type) return false;
      if (item.name !== productData.name) return false;

      const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};

      const existingCategory = (product.category ?? "").trim();
      if (existingCategory !== (categoryValue ?? "").trim()) return false;

      const existingDisplayName = (product.displayName ?? "").trim();
      if (existingDisplayName && existingDisplayName !== item.name.trim()) return false;

      const existingPriceValue = Number.isFinite(Number(product.priceValue))
        ? Number(product.priceValue)
        : MTT.PRODUCT_DEFAULTS.priceValue;
      if (existingPriceValue !== sourcePriceValue) return false;

      const existingPriceCurrency = (product.priceCurrency ?? "").trim();
      if (existingPriceCurrency !== sourcePriceCurrency) return false;

      if ((product.secretName ?? "").trim()) return false;
      if ((product.secretPrice ?? "").trim()) return false;
      if ((product.secretDescription ?? "").trim()) return false;

      return true;
    });

    if (existingProduct) {
      const product = existingProduct.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};
      const currentQuantity = Number.isFinite(Number(product.quantity))
        ? Number(product.quantity)
        : MTT.PRODUCT_DEFAULTS.quantity;

      await existingProduct.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, {
        ...product,
        quantity: currentQuantity + 1,
      });

      ui.notifications.info(game.i18n.localize("mtt.notifications.productQuantityIncreased"));
      return;
    }

    this.#createProductFlags(productData);
    foundry.utils.setProperty(
      productData,
      `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}.category`,
      categoryValue ?? ""
    );

    await this.actor.createEmbeddedDocuments("Item", [productData]);
  }

  async #onCategoryNameChange(event) {
    if (!this.#canModifyMerchant()) return;

    const target = event.currentTarget;
    const categoryId = target.dataset.categoryId;
    const categoryName = target.value?.trim();

    if (!categoryId) return;

    const categories = foundry.utils.deepClone(this.actor.system.catalog?.productCategories ?? []);
    const index = categories.findIndex((category) => category.id === categoryId);
    if (index === -1) return;

    if (!categoryName) {
      target.value = categories[index].name;
      return;
    }

    categories[index] = {
      ...categories[index],
      name: categoryName,
    };

    await this.actor.update({
      "system.catalog.productCategories": categories,
    });
  }

  static async #onCreateProductCategory(event, target) {
    event.preventDefault();

    if (!this.#canModifyMerchant()) return;

    const categories = foundry.utils.deepClone(this.actor.system.catalog?.productCategories ?? []);
    const categoryId = `category-${foundry.utils.randomID(6)}`;
    categories.push({
      id: categoryId,
      name: game.i18n.localize("mtt.products.category.new"),
    });

    await this.actor.update({
      "system.catalog.productCategories": categories,
    });

    this.render();
  }

  static async #onDeleteProductCategory(event, target) {
    event.preventDefault();

    if (!this.#canModifyMerchant()) return;

    const categoryId = target.dataset.categoryId;
    if (!categoryId) return;

    const categories = foundry.utils.deepClone(this.actor.system.catalog?.productCategories ?? []);
    const category = categories.find((item) => item.id === categoryId);
    if (!category) return;

    const itemsInCategory = this.actor.items.filter((item) => {
      const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};
      return (product.category ?? "") === categoryId;
    });

    if (itemsInCategory.length > 0) {
      ui.notifications.warn(game.i18n.localize("mtt.products.category.notEmpty"));
      return;
    }

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: game.i18n.localize("mtt.products.category.deleteTitle"),
      },
      content: `<p>${game.i18n.localize("mtt.products.category.deleteContent")}</p>`,
      yes: {
        label: game.i18n.localize("mtt.actions.delete"),
      },
      no: {
        label: game.i18n.localize("mtt.actions.cancel"),
      },
    });

    if (!confirmed) return;

    const updatedCategories = categories.filter((item) => item.id !== categoryId);
    const collapsedCategories = foundry.utils.deepClone(this.actor.system.catalog.collapsedCategories ?? {});
    delete collapsedCategories[categoryId];

    await this.actor.update({
      "system.catalog.productCategories": updatedCategories,
      "system.catalog.collapsedCategories": collapsedCategories,
    });

    this.render();
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

    const configuredPrice = this.#getConfiguredItemValue(itemData, "itemPriceValuePath");
    const parsedPrice = this.#parsePriceValue(configuredPrice);
    if (parsedPrice !== null) {
      productFlags.priceValue = parsedPrice;
    }

    const configuredCurrency = this.#getConfiguredItemValue(itemData, "itemPriceCurrencyPath");
    if (typeof configuredCurrency === "string") {
      productFlags.priceCurrency = configuredCurrency.trim();
    }

    const configuredQuantity = this.#getConfiguredItemValue(itemData, "itemQuantityPath");
    const parsedQuantity = this.#parseQuantityValue(configuredQuantity);
    if (parsedQuantity !== null) {
      productFlags.quantity = parsedQuantity;
    }

    foundry.utils.setProperty(itemData, `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}`, productFlags);

    return itemData;
  }

  #getModuleSetting(key) {
    return game.settings.get(MTT.ID, key) ?? "";
  }

  #getConfiguredItemValue(item, settingKey) {
    const path = String(this.#getModuleSetting(settingKey) ?? "").trim();
    if (!path) return null;

    return foundry.utils.getProperty(item, path);
  }

  #getAllowedTypes(settingKey) {
    const raw = String(this.#getModuleSetting(settingKey) ?? "").trim();
    if (!raw) return null;

    return raw
      .split(",")
      .map((itemType) => itemType.trim().toLowerCase())
      .filter(Boolean);
  }

  #isItemTypeAllowed(item, settingKey) {
    const allowedTypes = this.#getAllowedTypes(settingKey);
    if (!allowedTypes) return true;

    const itemType = String(item.type ?? "").toLowerCase();
    return allowedTypes.includes(itemType);
  }

  #parsePriceValue(value) {
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      return value;
    }

    if (typeof value === "string") {
      const match = value.match(/-?\d+(?:[\.,]\d+)?/);
      if (!match) return null;
      const parsed = Number(match[0].replace(",", "."));
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    }

    if (typeof value === "object" && value !== null) {
      return this.#parsePriceValue(value.value ?? null);
    }

    return null;
  }

  #parseQuantityValue(value) {
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      return value;
    }

    if (typeof value === "string") {
      const match = value.match(/-?\d+(?:[\.,]\d+)?/);
      if (!match) return null;
      const parsed = Number(match[0].replace(",", "."));
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    }

    if (typeof value === "object" && value !== null) {
      return this.#parseQuantityValue(value.value ?? null);
    }

    return null;
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
    if (!tab || tab === "sessions") return;

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

  #prepareServices() {
    const entries = this.actor.system.services?.entries ?? [];
    return entries.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description || "",
      priceValue:
        Number.isFinite(Number(service.priceValue)) && Number(service.priceValue) >= 0
          ? Number(service.priceValue)
          : MTT.SERVICE_DEFAULTS.priceValue,
      priceCurrency: service.priceCurrency?.trim() ?? MTT.SERVICE_DEFAULTS.priceCurrency,
      quantity: service.quantity,
      hasQuantity: service.quantity !== null && service.quantity !== undefined,
      isHidden: service.isHidden ?? MTT.SERVICE_DEFAULTS.isHidden,
      requiresApproval: service.requiresApproval ?? MTT.SERVICE_DEFAULTS.requiresApproval,
      isExpanded: service.isExpanded ?? MTT.SERVICE_DEFAULTS.isExpanded,
      sourceUuid: service.sourceUuid ?? null,
      sourceName: service.sourceName ?? "",
      sourceType: service.sourceType ?? "",
      sourceImg: service.sourceImg ?? "",
      hasSource: Boolean(service.sourceUuid || service.sourceName || service.sourceType || service.sourceImg),
    }));
  }

  static async #onCreateService(event, target) {
    event.preventDefault();

    if (!this.isEditable || this.actor.system.sheet.isLocked) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.sheetLocked"));
      return;
    }

    const entries = foundry.utils.deepClone(this.actor.system.services?.entries ?? []);

    const newId = foundry.utils.randomID();
    const newService = {
      id: newId,
      ...foundry.utils.deepClone(MTT.SERVICE_DEFAULTS),
      name: game.i18n.localize("mtt.services.new"),
    };

    entries.push(newService);

    await this.actor.update({
      "system.services.entries": entries,
    });
  }

  static async #onDeleteService(event, target) {
    event.preventDefault();

    if (!this.isEditable || this.actor.system.sheet.isLocked) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.sheetLocked"));
      return;
    }

    const serviceId = target.closest("[data-service-id]")?.dataset.serviceId;
    if (!serviceId) return;

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: game.i18n.localize("mtt.services.deleteTitle"),
      },
      content: `<p>${game.i18n.localize("mtt.services.deleteContent")}</p>`,
      yes: {
        label: game.i18n.localize("mtt.actions.delete"),
      },
      no: {
        label: game.i18n.localize("mtt.actions.cancel"),
      },
    });

    if (!confirmed) return;

    const entries = foundry.utils.deepClone(this.actor.system.services?.entries ?? []);
    const index = entries.findIndex((s) => s.id === serviceId);

    if (index !== -1) {
      entries.splice(index, 1);
      await this.actor.update({
        "system.services.entries": entries,
      });
    }
  }

  static async #onToggleServiceExpanded(event, target) {
    event.preventDefault();

    if (!this.isEditable) return;

    const serviceId = target.closest("[data-service-id]")?.dataset.serviceId;
    if (!serviceId) return;

    const entries = foundry.utils.deepClone(this.actor.system.services?.entries ?? []);
    const index = entries.findIndex((s) => s.id === serviceId);
    if (index === -1) return;

    entries[index].isExpanded = !Boolean(entries[index].isExpanded);

    await this.actor.update({
      "system.services.entries": entries,
    });

    this.render();
  }

  static async #onToggleServiceHidden(event, target) {
    event.preventDefault();

    if (!this.isEditable || this.actor.system.sheet.isLocked) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.sheetLocked"));
      return;
    }

    const serviceId = target.closest("[data-service-id]")?.dataset.serviceId;
    if (!serviceId) return;

    const entries = foundry.utils.deepClone(this.actor.system.services?.entries ?? []);
    const index = entries.findIndex((s) => s.id === serviceId);
    if (index === -1) return;

    entries[index].isHidden = !Boolean(entries[index].isHidden);

    await this.actor.update({
      "system.services.entries": entries,
    });

    this.render();
  }

  static async #onToggleServiceApproval(event, target) {
    event.preventDefault();

    if (!this.isEditable || this.actor.system.sheet.isLocked) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.sheetLocked"));
      return;
    }

    const serviceId = target.closest("[data-service-id]")?.dataset.serviceId;
    if (!serviceId) return;

    const entries = foundry.utils.deepClone(this.actor.system.services?.entries ?? []);
    const index = entries.findIndex((s) => s.id === serviceId);
    if (index === -1) return;

    entries[index].requiresApproval = !Boolean(entries[index].requiresApproval);

    await this.actor.update({
      "system.services.entries": entries,
    });

    this.render();
  }

  async #onServiceFieldChange(event) {
    const target = event.currentTarget;

    if (!this.#canModifyMerchant()) return;

    const serviceId = target.closest("[data-service-id]")?.dataset.serviceId;
    if (!serviceId) return;

    const entries = foundry.utils.deepClone(this.actor.system.services?.entries ?? []);
    const serviceIndex = entries.findIndex((s) => s.id === serviceId);

    if (serviceIndex === -1) return;

    const field = target.dataset.mttServiceField;

    if (field === "name") {
      const name = target.value?.trim();
      if (name) {
        entries[serviceIndex].name = name;
      } else {
        target.value = entries[serviceIndex].name;
        return;
      }
    }

    if (field === "description") {
      entries[serviceIndex].description = target.value?.trim() ?? "";
    }

    if (field === "priceValue") {
      const priceValue = Number(target.value);

      if (!Number.isFinite(priceValue) || priceValue < 0) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidServicePrice"));
        target.value = entries[serviceIndex].priceValue ?? MTT.SERVICE_DEFAULTS.priceValue;
        return;
      }

      entries[serviceIndex].priceValue = priceValue;
    }

    if (field === "priceCurrency") {
      entries[serviceIndex].priceCurrency = target.value?.trim() ?? "";
    }

    if (field === "quantity") {
      const quantity = target.value?.trim();

      if (quantity === "") {
        entries[serviceIndex].quantity = null;
      } else {
        const quantityNum = Number(quantity);

        if (!Number.isFinite(quantityNum) || quantityNum < 0) {
          ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidServiceQuantity"));
          target.value = entries[serviceIndex].quantity ?? "";
          return;
        }

        entries[serviceIndex].quantity = quantityNum;
      }
    }

    await this.actor.update({
      "system.services.entries": entries,
    });
  }
}
