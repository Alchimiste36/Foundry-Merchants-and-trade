import { MTT } from "../../config/constants.mjs";
import { getCurrencies } from "../../config/settings.mjs";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class MerchantSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  #activeTab = "products";
  #activeSessionId = null;
  #selectedClientActorUuid = "";
  #sessionCheckResult = null;

  static DEFAULT_OPTIONS = {
    classes: [MTT.CSS.SHEET, MTT.CSS.MERCHANT_SHEET, "mtt-merchant-window"],
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
      addProductToSession: MerchantSheet.#onAddProductToSession,
      addServiceToSession: MerchantSheet.#onAddServiceToSession,
      toggleClientAccess: MerchantSheet.#onToggleClientAccess,
      setSessionStatus: MerchantSheet.#onSetSessionStatus,
      checkSessionTransaction: MerchantSheet.#onCheckSessionTransaction,
      increaseSessionItemQuantity: MerchantSheet.#onIncreaseSessionItemQuantity,
      decreaseSessionItemQuantity: MerchantSheet.#onDecreaseSessionItemQuantity,
      removeSessionItem: MerchantSheet.#onRemoveSessionItem,
      clearSessionDraft: MerchantSheet.#onClearSessionDraft,
      editMerchantImage: MerchantSheet.#onEditMerchantImage,
      rollNegotiation: MerchantSheet.#onRollNegotiation,
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
    context.trade = this.#prepareTrade();
    context.wallet = this.actor.system.wallet ?? {};
    context.mtt.walletCurrencies = this.#prepareWalletCurrencies();
    context.mtt.headerCurrencies = context.mtt.walletCurrencies;
    context.mtt.hasHeaderCurrencies = context.mtt.headerCurrencies.length > 0;
    context.mtt.access = this.#prepareAccessContext();
    context.mtt.session = this.#prepareSessionContext();

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

    this.element
      .querySelectorAll("[data-mtt-merchant-config-field]")
      .forEach((input) => input.addEventListener("change", (event) => this.#onMerchantConfigFieldChange(event)));

    this.element
      .querySelectorAll("[data-mtt-wallet-currency]")
      .forEach((input) => input.addEventListener("change", (event) => this.#onWalletCurrencyChange(event)));

    this.element
      .querySelectorAll("[data-mtt-session-field]")
      .forEach((input) => input.addEventListener("change", (event) => this.#onSessionFieldChange(event)));

    this.element.querySelectorAll("[data-mtt-session-seller-drop]").forEach((dropZone) => {
      if (dropZone.dataset.mttSellerDropBound) return;
      dropZone.dataset.mttSellerDropBound = "1";
      dropZone.addEventListener("dragover", (event) => this.#onSessionSellerDragOver(event));
      dropZone.addEventListener("drop", (event) => this.#onSessionSellerDrop(event));
    });

    this.element.querySelectorAll("[data-mtt-client-drop]").forEach((dropZone) => {
      if (dropZone.dataset.mttClientDropBound) return;
      dropZone.dataset.mttClientDropBound = "1";
      dropZone.addEventListener("dragover", (event) => this.#onClientDragOver(event));
      dropZone.addEventListener("drop", (event) => this.#onClientDrop(event));
    });

    this.#renderAccessRail(context);
  }

  #renderAccessRail(context) {
    const applicationElement = this.#getApplicationElement();
    if (!applicationElement) return;

    this.#closeAccessContextMenu();
    applicationElement.querySelectorAll(".mtt-merchant-access-rail").forEach((rail) => rail.remove());
    this.element.querySelectorAll(".mtt-merchant-access-rail").forEach((rail) => rail.remove());

    const accessContext = context?.mtt?.access ?? this.#prepareAccessContext();
    const rail = this.#buildAccessRail(accessContext);
    applicationElement.append(rail);
    this.#activateAccessRail(rail);
  }

  #getApplicationElement() {
    const applicationElement = this.element.closest?.(".mtt-merchant-window");
    if (!applicationElement?.classList?.contains("mtt-merchant-sheet")) return null;
    if (!applicationElement.contains(this.element) && applicationElement !== this.element) return null;

    return applicationElement;
  }

  #buildAccessRail(accessContext) {
    const rail = document.createElement("aside");
    rail.classList.add("mtt-merchant-access-rail");
    rail.setAttribute("aria-label", game.i18n.localize("mtt.access.title"));

    (accessContext.clients ?? []).forEach((client) => {
      const button = document.createElement("button");
      button.classList.add("mtt-merchant-access-card");
      button.classList.add(
        client.isAuthorized ? "mtt-merchant-access-card-authorized" : "mtt-merchant-access-card-unauthorized",
      );
      button.type = "button";
      button.dataset.action = "toggleClientAccess";
      button.dataset.clientActorUuid = client.actorUuid;
      button.dataset.clientUserId = client.userId;
      button.dataset.tooltip = client.tooltip;
      if (client.isSelected) button.classList.add("mtt-merchant-access-card-selected");
      if (!accessContext.canManage) button.disabled = true;

      const image = document.createElement("img");
      image.classList.add("mtt-merchant-access-card-image");
      image.src = client.actorImg;
      image.alt = client.actorName;
      button.append(image);

      if (client.hasSession) {
        const badge = document.createElement("i");
        badge.classList.add(
          "fas",
          client.sessionBadgeIcon,
          "mtt-merchant-access-session-badge",
          `mtt-merchant-access-session-${client.sessionStatus}`,
        );
        button.append(badge);
      }

      rail.append(button);
    });

    const dropCard = document.createElement("div");
    dropCard.classList.add("mtt-merchant-access-drop-card");
    dropCard.dataset.mttClientDrop = "";
    dropCard.dataset.tooltip = game.i18n.localize("mtt.access.dropTooltip");

    const dropIcon = document.createElement("i");
    dropIcon.classList.add("fas", "fa-user-plus");
    dropCard.append(dropIcon);
    rail.append(dropCard);

    return rail;
  }

  #activateAccessRail(rail) {
    rail.querySelectorAll('[data-action="toggleClientAccess"]').forEach((button) => {
      button.addEventListener("click", (event) => MerchantSheet.#onToggleClientAccess.call(this, event, button));
      button.addEventListener("contextmenu", (event) => this.#onClientContextMenu(event, button));
    });

    rail.querySelectorAll("[data-mtt-client-drop]").forEach((dropZone) => {
      dropZone.addEventListener("dragover", (event) => this.#onClientDragOver(event));
      dropZone.addEventListener("drop", (event) => this.#onClientDrop(event));
    });
  }

  async #renderMttDialogContent({
    icon = "",
    title = "",
    message = "",
    details = "",
    variant = "default",
    entity = null,
    form = "",
  } = {}) {
    return renderTemplate(MTT.TEMPLATES.MTT_DIALOG, {
      icon,
      title,
      message,
      details,
      variant,
      entity,
      form,
      hasHeader: Boolean(icon || title),
    });
  }

  async #onSessionFieldChange(event) {
    const input = event.currentTarget;
    const field = input.dataset.mttSessionField;
    const session = this.#getActiveSession();
    if (!session) return;

    if (field === "label") {
      const label = input.value?.trim() ?? "";
      if (!label) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.emptySessionLabel"));
        input.value = session.label;
        return;
      }

      session.label = label;
      await this.#saveSession(session);
      this.render();
      return;
    }

    if (field !== "quantity") return;

    const raw = input.value;
    const itemId = input.dataset.sessionItemId ?? input.closest("[data-session-item-id]")?.dataset.sessionItemId;
    if (!itemId) return;

    const side = input.dataset.sessionSide ?? input.closest("[data-session-side]")?.dataset.sessionSide ?? "buyer";
    const items = this.#getSessionItemsForSide(session, side);
    const item = items.find((it) => it.id === itemId);
    if (!item) return;

    const requested = Number(raw);
    if (!Number.isFinite(requested) || requested < 0) {
      ui.notifications.warn(
        game.i18n.localize(
          side === "seller" ? "mtt.notifications.invalidSellerItemQuantity" : "mtt.notifications.invalidSessionQuantity",
        ),
      );
      input.value = item.quantity;
      return;
    }

    if (!this.#canUseSessionQuantity(item, requested)) {
      ui.notifications.warn(
        game.i18n.localize(
          side === "seller" ? "mtt.notifications.notEnoughSellerItemQuantity" : "mtt.notifications.notEnoughQuantity",
        ),
      );
      input.value = item.quantity;
      return;
    }

    if (requested === 0) {
      this.#removeSessionItemById(session, itemId, side);
      await this.#saveSession(session);
      this.render();
      return;
    }

    this.#setSessionItemQuantity(item, requested);
    await this.#saveSession(session);
    this.render();
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
    const automaticCategory = this.#getAutomaticItemCategory(document);
    const productCategoryValue = categoryDrop
      ? categoryValue
      : await this.#getOrCreateAutomaticProductCategory(automaticCategory);

    const itemData = document.toObject();
    delete itemData._id;

    await this.#addOrMergeProduct(itemData, productCategoryValue, automaticCategory);
  }

  #prepareItems() {
    return this.actor.items.map((item) => {
      const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};
      const quantity = product.quantity ?? MTT.PRODUCT_DEFAULTS.quantity;
      const displayName = product.displayName || item.name;
      const basePriceValue =
        Number.isFinite(Number(product.priceValue)) && Number(product.priceValue) >= 0
          ? Number(product.priceValue)
          : MTT.PRODUCT_DEFAULTS.priceValue;
      const displayPriceValue = this.#adjustPriceValue(basePriceValue);
      const priceCurrency = product.priceCurrency?.trim() ?? MTT.PRODUCT_DEFAULTS.priceCurrency;

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
        priceValue: basePriceValue,
        basePriceValue,
        displayPriceValue,
        priceCurrency,
        category: (product.category ?? "").trim(),
        hasCategory: Boolean((product.category ?? "").trim()),
        systemCategoryKey: product.systemCategoryKey ?? "",
        systemCategoryLabel: product.systemCategoryLabel ?? "",
        systemCategoryPath: product.systemCategoryPath ?? "",
        hasSystemCategory: Boolean(product.systemCategoryKey || product.systemCategoryLabel),
        hasPrice: Number.isFinite(displayPriceValue) && displayPriceValue >= 0,
        isHidden: product.isHidden ?? MTT.PRODUCT_DEFAULTS.isHidden,
        requiresApproval: product.requiresApproval ?? MTT.PRODUCT_DEFAULTS.requiresApproval,
        priceLabel: this.#formatPriceLabel(displayPriceValue, priceCurrency),
        displayPriceLabel: this.#formatPriceLabel(displayPriceValue, priceCurrency),
        basePriceLabel: this.#formatPriceLabel(basePriceValue, priceCurrency),
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

  #getServiceFromEvent(target) {
    const serviceId = target.closest("[data-service-id]")?.dataset.serviceId;
    if (!serviceId) return null;

    return this.actor.system.services?.entries?.find((service) => service.id === serviceId) ?? null;
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

  #onSessionSellerDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  async #onSessionSellerDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.#requireSelectedSessionForItemAddition()) return;

    const item = await this.#getDroppedItemDocument(event);
    if (!item) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.onlyItemsCanBeSold"));
      return;
    }

    const sellerData = this.#prepareSellerItemDropData(item);
    const dialogData = await this.#openSellerItemDialog(sellerData);
    if (!dialogData) return;

    const requestedTotal =
      dialogData.quantity +
      this.#getSessionSellerQuantity({
        sourceUuid: sellerData.sourceUuid,
        sourceId: sellerData.sourceId,
        unitPriceValue: dialogData.unitPriceValue,
        priceCurrency: dialogData.priceCurrency,
      });

    if (
      Number.isFinite(sellerData.availableQuantity) &&
      sellerData.availableQuantity >= 0 &&
      requestedTotal > sellerData.availableQuantity
    ) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.notEnoughSellerItemQuantity"));
      return;
    }

    const sessionItem = await this.#addSessionSellerItem({
      ...sellerData,
      quantity: dialogData.quantity,
      unitPriceValue: dialogData.unitPriceValue,
      priceCurrency: dialogData.priceCurrency,
    });
    if (!sessionItem) return;

    this.render();
  }

  #onClientDragOver(event) {
    if (!this.isEditable) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  async #onClientDrop(event) {
    if (!this.isEditable) return;

    event.preventDefault();
    event.stopPropagation();

    const actor = await this.#getDroppedActorDocument(event);
    if (!actor) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.onlyActorsCanBeClients"));
      return;
    }

    await this.#upsertAccessClient(this.#buildAccessClientFromActor(actor, { isAuthorized: true }));
    this.render();
  }

  async #onClientContextMenu(event, target) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.isEditable) return;

    const client = this.#getAccessClientCandidate(target.dataset.clientActorUuid);
    if (!client) return;

    this.#openClientContextMenu(event, client);
  }

  #openClientContextMenu(event, client) {
    const applicationElement = this.#getApplicationElement();
    if (!applicationElement) return;

    this.#closeAccessContextMenu();

    const menu = document.createElement("nav");
    menu.classList.add("mtt-merchant-access-context-menu");
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;
    menu.setAttribute("aria-label", game.i18n.localize("mtt.access.contextTitle"));

    const removeAuthorization = document.createElement("button");
    removeAuthorization.type = "button";
    removeAuthorization.classList.add("mtt-merchant-access-context-menu-button");
    const removeAuthorizationIcon = document.createElement("i");
    removeAuthorizationIcon.classList.add("fas", "fa-user-slash");
    const removeAuthorizationLabel = document.createElement("span");
    removeAuthorizationLabel.textContent = game.i18n.localize("mtt.access.removeAuthorization");
    removeAuthorization.append(removeAuthorizationIcon, removeAuthorizationLabel);
    removeAuthorization.addEventListener("click", async () => {
      this.#closeAccessContextMenu();
      await this.#removeClientAuthorization(client);
    });

    const removeActor = document.createElement("button");
    removeActor.type = "button";
    removeActor.classList.add("mtt-merchant-access-context-menu-button");
    const removeActorIcon = document.createElement("i");
    removeActorIcon.classList.add("fas", "fa-trash");
    const removeActorLabel = document.createElement("span");
    removeActorLabel.textContent = game.i18n.localize("mtt.access.removeActor");
    removeActor.append(removeActorIcon, removeActorLabel);
    removeActor.addEventListener("click", async () => {
      this.#closeAccessContextMenu();
      await this.#removeAccessClient(client);
    });

    menu.append(removeAuthorization, removeActor);
    applicationElement.append(menu);

    window.setTimeout(() => {
      const closeMenu = (closeEvent) => {
        if (!menu.contains(closeEvent.target)) this.#closeAccessContextMenu();
        document.removeEventListener("click", closeMenu, true);
      };
      document.addEventListener("click", closeMenu, true);
    }, 0);
  }

  #closeAccessContextMenu() {
    const applicationElement = this.#getApplicationElement();
    applicationElement?.querySelectorAll(".mtt-merchant-access-context-menu").forEach((menu) => menu.remove());
  }

  async #getDroppedActorDocument(event) {
    const dragData = TextEditor.getDragEventData(event);
    if (!dragData) return null;

    try {
      if (dragData.uuid) {
        const document = await fromUuid(dragData.uuid);
        return document?.documentName === "Actor" ? document : null;
      }

      if (dragData.pack && dragData.id) {
        const pack = game.packs.get(dragData.pack);
        const document = pack ? await pack.getDocument(dragData.id) : null;
        return document?.documentName === "Actor" ? document : null;
      }

      if (dragData.type === "Actor" && dragData.id) {
        const document = game.actors.get(dragData.id) ?? null;
        return document?.documentName === "Actor" ? document : null;
      }
    } catch {
      return null;
    }

    return null;
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

    const automaticCategory = this.#getAutomaticItemCategory(item);

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
      category: automaticCategory?.key ?? "",
      systemCategoryKey: automaticCategory?.key ?? "",
      systemCategoryLabel: automaticCategory?.label ?? "",
      systemCategoryPath: automaticCategory?.path ?? "",
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

  async #getDroppedItemDocument(event) {
    const dragData = TextEditor.getDragEventData(event);
    if (!dragData) return null;

    try {
      if (dragData.uuid) {
        const document = await fromUuid(dragData.uuid);
        return document?.documentName === "Item" ? document : null;
      }

      if (dragData.pack && dragData.id) {
        const pack = game.packs.get(dragData.pack);
        const document = pack ? await pack.getDocument(dragData.id) : null;
        return document?.documentName === "Item" ? document : null;
      }

      if (dragData.type === "Item" && dragData.id) {
        const document = game.items.get(dragData.id) ?? null;
        return document?.documentName === "Item" ? document : null;
      }
    } catch {
      return null;
    }

    return null;
  }

  #prepareSellerItemDropData(item) {
    const availableQuantity = this.#getItemAvailableQuantity(item);
    const basePriceValue = this.#parsePriceValue(this.#getConfiguredItemValue(item, "itemPriceValuePath")) ?? this.#getItemPrice(item) ?? 0;
    const buyPercent =
      Number.isFinite(Number(this.actor.system.trade?.buyPercent)) && Number(this.actor.system.trade.buyPercent) >= 0
        ? Number(this.actor.system.trade.buyPercent)
        : 50;
    // Seller-side draft lines use the merchant buy percent as the initial proposed value only.
    const unitPriceValue = Number(((basePriceValue * buyPercent) / 100).toFixed(2));
    const configuredCurrency = this.#getConfiguredItemValue(item, "itemPriceCurrencyPath");
    const priceCurrency = typeof configuredCurrency === "string" ? configuredCurrency.trim() : this.#getItemCurrency(item);
    const sourceActor = item.parent?.documentName === "Actor" ? item.parent : null;

    return {
      type: "item",
      sourceUuid: item.uuid ?? "",
      sourceActorUuid: sourceActor?.uuid ?? "",
      sourceId: item.id ?? "",
      name: item.name ?? "",
      img: item.img ?? "",
      quantity: 1,
      availableQuantity,
      hasLimitedQuantity: Number.isFinite(availableQuantity) && availableQuantity >= 0,
      unitPriceValue,
      priceCurrency,
      sourceLabel: game.i18n.localize("mtt.sessions.item.object"),
      isFromActor: Boolean(sourceActor),
      sourceActorName: sourceActor?.name ?? "",
    };
  }

  #getItemAvailableQuantity(item) {
    const configuredQuantity = this.#parseQuantityValue(this.#getConfiguredItemValue(item, "itemQuantityPath"));
    if (configuredQuantity !== null) return configuredQuantity;

    const candidates = [
      foundry.utils.getProperty(item, "system.quantity"),
      foundry.utils.getProperty(item, "system.quantity.value"),
      foundry.utils.getProperty(item, "system.qty"),
      foundry.utils.getProperty(item, "system.stack.quantity"),
    ];

    for (const candidate of candidates) {
      const quantity = this.#parseQuantityValue(candidate);
      if (quantity !== null) return quantity;
    }

    return null;
  }

  #getItemCurrency(item) {
    const candidates = [
      foundry.utils.getProperty(item, "system.price.currency"),
      foundry.utils.getProperty(item, "system.cost.currency"),
      foundry.utils.getProperty(item, "system.value.currency"),
      foundry.utils.getProperty(item, "system.price.denomination"),
      foundry.utils.getProperty(item, "system.currency"),
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    }

    return "";
  }

  #getAutomaticItemCategory(item) {
    const paths = this.#getCategoryPaths();
    const labelMap = this.#getCategoryLabelMap();

    for (const path of paths) {
      const normalized = this.#normalizeAutomaticCategoryValue(foundry.utils.getProperty(item, path));
      if (!normalized) continue;

      return {
        ...normalized,
        label: labelMap.get(normalized.key) ?? normalized.label,
        path,
      };
    }

    if (game.settings.get(MTT.ID, "useItemTypeAsCategoryFallback")) {
      const normalized = this.#normalizeAutomaticCategoryValue(item.type);
      if (normalized) {
        return {
          ...normalized,
          label: labelMap.get(normalized.key) ?? normalized.label,
          path: "type",
        };
      }
    }

    return null;
  }

  #getCategoryPaths() {
    const rawPaths = game.settings.get(MTT.ID, "itemCategoryPaths") ?? "";
    return String(rawPaths)
      .split(/[\n,]/)
      .map((path) => path.trim())
      .filter(Boolean);
  }

  #getCategoryLabelMap() {
    const rawMap = game.settings.get(MTT.ID, "categoryLabelMap") ?? "";
    const map = new Map();

    String(rawMap)
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        const separatorIndex = line.indexOf("=");
        if (separatorIndex === -1) return;

        const key = this.#slugifyCategoryKey(line.slice(0, separatorIndex));
        const label = line.slice(separatorIndex + 1).trim();
        if (!key || !label) return;

        map.set(key, label);
      });

    return map;
  }

  #normalizeAutomaticCategoryValue(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === "object") return null;

    const raw = String(value).trim();
    if (!raw) return null;

    const key = this.#slugifyCategoryKey(raw);
    if (!key) return null;

    return {
      key,
      label: this.#formatAutomaticCategoryLabel(raw),
      raw,
    };
  }

  #slugifyCategoryKey(value) {
    return String(value ?? "")
      .trim()
      .toLocaleLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  #formatAutomaticCategoryLabel(value) {
    const label = String(value ?? "")
      .trim()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");

    if (!label) return "";

    return label.charAt(0).toLocaleUpperCase() + label.slice(1);
  }

  async #getOrCreateAutomaticProductCategory(automaticCategory) {
    if (!automaticCategory?.key) return "";

    const categories = foundry.utils.deepClone(this.actor.system.catalog?.productCategories ?? []);
    const matchingCategory = categories.find((category) => {
      if (!category?.id) return false;
      if (category.id === automaticCategory.key || category.id === `auto-${automaticCategory.key}`) return true;
      const categoryNameKey = this.#slugifyCategoryKey(category.name);
      return (
        categoryNameKey === automaticCategory.key ||
        categoryNameKey === this.#slugifyCategoryKey(automaticCategory.label)
      );
    });

    if (matchingCategory) return matchingCategory.id;

    const categoryId = `auto-${automaticCategory.key}`;
    categories.push({
      id: categoryId,
      name: automaticCategory.label || automaticCategory.raw,
    });

    await this.actor.update({
      "system.catalog.productCategories": categories,
    });

    return categoryId;
  }

  async #addOrMergeProduct(itemData, categoryValue = "", automaticCategory = null) {
    const productData = foundry.utils.deepClone(itemData);
    productData.flags = productData.flags ?? {};

    const productFlags = foundry.utils.deepClone(MTT.PRODUCT_DEFAULTS);
    productFlags.displayName = productData.name ?? "";
    productFlags.category = categoryValue ?? "";
    productFlags.systemCategoryKey = automaticCategory?.key ?? "";
    productFlags.systemCategoryLabel = automaticCategory?.label ?? "";
    productFlags.systemCategoryPath = automaticCategory?.path ?? "";

    productData.flags[MTT.ID] = {
      ...(productData.flags[MTT.ID] ?? {}),
      [MTT.FLAGS.PRODUCT]: productFlags,
    };

    const sourceConfiguredPrice = this.#getConfiguredItemValue(productData, "itemPriceValuePath");
    const sourcePriceValue = this.#parsePriceValue(sourceConfiguredPrice) ?? MTT.PRODUCT_DEFAULTS.priceValue;

    const sourceConfiguredCurrency = this.#getConfiguredItemValue(productData, "itemPriceCurrencyPath");
    const sourcePriceCurrency =
      typeof sourceConfiguredCurrency === "string"
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

      return;
    }

    this.#createProductFlags(productData);
    foundry.utils.setProperty(productData, `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}.category`, categoryValue ?? "");
    foundry.utils.setProperty(
      productData,
      `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}.systemCategoryKey`,
      automaticCategory?.key ?? "",
    );
    foundry.utils.setProperty(
      productData,
      `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}.systemCategoryLabel`,
      automaticCategory?.label ?? "",
    );
    foundry.utils.setProperty(
      productData,
      `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}.systemCategoryPath`,
      automaticCategory?.path ?? "",
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

  #prepareTrade() {
    return {
      buyPercent:
        Number.isFinite(Number(this.actor.system.trade?.buyPercent)) && Number(this.actor.system.trade.buyPercent) >= 0
          ? Number(this.actor.system.trade.buyPercent)
          : 50,
      sellPercent:
        Number.isFinite(Number(this.actor.system.trade?.sellPercent)) &&
        Number(this.actor.system.trade.sellPercent) >= 0
          ? Number(this.actor.system.trade.sellPercent)
          : 100,
      negotiationFormula: this.actor.system.trade?.negotiationFormula ?? "",
    };
  }

  #getSellPercent() {
    const sellPercent = Number(this.actor.system.trade?.sellPercent);
    return Number.isFinite(sellPercent) && sellPercent >= 0 ? sellPercent : 100;
  }

  #adjustPriceValue(basePriceValue) {
    const priceValue = Number(basePriceValue);
    if (!Number.isFinite(priceValue) || priceValue < 0) return 0;

    return Number(((priceValue * this.#getSellPercent()) / 100).toFixed(2));
  }

  #formatPriceLabel(priceValue, priceCurrency) {
    const normalizedPrice = Number(priceValue);
    if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) return "";

    const formattedPrice = Number.isInteger(normalizedPrice)
      ? String(normalizedPrice)
      : String(normalizedPrice.toFixed(2)).replace(/\.?0+$/, "");
    const currency = String(priceCurrency ?? "").trim();

    return `${formattedPrice} ${this.#formatCurrencyLabel(currency)}`;
  }

  #normalizeCurrencyKey(priceCurrency) {
    const currency = String(priceCurrency ?? "").trim();
    return currency || "__none";
  }

  #formatCurrencyLabel(priceCurrency) {
    const currency = String(priceCurrency ?? "").trim();
    return currency || game.i18n.localize("mtt.sessions.undefinedCurrency");
  }

  #escapeHTML(value) {
    const text = String(value ?? "");
    return foundry.utils.escapeHTML
      ? foundry.utils.escapeHTML(text)
      : text
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;");
  }

  #renderSessionPreparationDialog({
    name,
    priceLabel,
    availableQuantityLabel,
    availableQuantity,
    includeProposedPrice = false,
  }) {
    const quantityMax =
      Number.isFinite(availableQuantity) && availableQuantity >= 0 ? ` max="${availableQuantity}"` : "";
    const proposedPriceField = includeProposedPrice
      ? `<label class="mtt-session-dialog-field">
          <span>${game.i18n.localize("mtt.sessions.dialog.proposedPrice")}</span>
          <input type="number" name="proposedPrice" min="0" step="0.01" placeholder="${this.#escapeHTML(priceLabel)}" />
        </label>`
      : "";

    return `<form class="mtt-session-dialog-form">
      <section class="mtt-session-dialog-summary">
        <h3 class="mtt-session-dialog-title">${this.#escapeHTML(name)}</h3>
        <p class="mtt-session-dialog-line">
          <strong>${game.i18n.localize("mtt.products.price.adjusted")}</strong>
          <span>${this.#escapeHTML(priceLabel)}</span>
        </p>
        <p class="mtt-session-dialog-line">
          <strong>${game.i18n.localize("mtt.sessions.dialog.availableQuantity")}</strong>
          <span>${this.#escapeHTML(availableQuantityLabel)}</span>
        </p>
      </section>
      <label class="mtt-session-dialog-field">
        <span>${game.i18n.localize("mtt.sessions.dialog.quantity")}</span>
        <input type="number" name="quantity" min="1" step="1" value="1"${quantityMax} />
      </label>
      ${proposedPriceField}
    </form>`;
  }

  async #openSessionPreparationDialog({ title, name, priceLabel, availableQuantity, includeProposedPrice = false }) {
    const availableQuantityLabel =
      Number.isFinite(availableQuantity) && availableQuantity >= 0
        ? String(availableQuantity)
        : game.i18n.localize("mtt.sessions.dialog.unlimitedQuantity");
    const content = this.#renderSessionPreparationDialog({
      name,
      priceLabel,
      availableQuantityLabel,
      availableQuantity,
      includeProposedPrice,
    });

    let result = null;

    try {
      result = await foundry.applications.api.DialogV2.wait({
        window: {
          title,
        },
        content,
        rejectClose: false,
        buttons: [
          {
            action: "cancel",
            label: game.i18n.localize("mtt.sessions.actions.cancel"),
            callback: () => null,
          },
          {
            action: "add",
            label: game.i18n.localize("mtt.sessions.actions.add"),
            default: true,
            callback: (event, button, dialog) => {
              const form = button?.form ?? dialog?.element?.querySelector("form") ?? event.target?.closest?.("form");
              if (!form) return null;

              return Object.fromEntries(new FormData(form).entries());
            },
          },
        ],
      });
    } catch {
      return;
    }

    if (!result) return;

    const requestedQuantity = Number(result.quantity);
    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidSessionQuantity"));
      return;
    }

    if (Number.isFinite(availableQuantity) && availableQuantity >= 0 && requestedQuantity > availableQuantity) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.notEnoughQuantity"));
      return;
    }

    return {
      quantity: requestedQuantity,
      proposedPrice: result.proposedPrice ?? "",
    };
  }

  #renderSellerItemDialog({ availableQuantityLabel, availableQuantity, unitPriceValue, priceCurrency }) {
    const quantityMax =
      Number.isFinite(availableQuantity) && availableQuantity >= 0 ? ` max="${this.#escapeHTML(String(availableQuantity))}"` : "";

    return `<label class="mtt-dialog-field">
        <span class="mtt-dialog-field-label">${game.i18n.localize("mtt.dialog.sellerItemAvailableQuantity")}</span>
        <span class="mtt-dialog-field-value">${this.#escapeHTML(availableQuantityLabel)}</span>
      </label>
      <label class="mtt-dialog-field">
        <span class="mtt-dialog-field-label">${game.i18n.localize("mtt.dialog.sellerItemQuantity")}</span>
        <input type="number" name="quantity" min="1" step="1" value="1"${quantityMax} />
      </label>
      <label class="mtt-dialog-field">
        <span class="mtt-dialog-field-label">${game.i18n.localize("mtt.dialog.sellerItemUnitValue")}</span>
        <input type="number" name="unitPriceValue" min="0" step="0.01" value="${this.#escapeHTML(String(unitPriceValue))}" />
      </label>
      <label class="mtt-dialog-field">
        <span class="mtt-dialog-field-label">${game.i18n.localize("mtt.dialog.sellerItemCurrency")}</span>
        <input type="text" name="priceCurrency" value="${this.#escapeHTML(priceCurrency)}" />
      </label>`;
  }

  async #openSellerItemDialog({ name, img, sourceActorName, availableQuantity, unitPriceValue, priceCurrency }) {
    const availableQuantityLabel =
      Number.isFinite(availableQuantity) && availableQuantity >= 0
        ? String(availableQuantity)
        : game.i18n.localize("mtt.sessions.dialog.unlimitedQuantity");
    const form = this.#renderSellerItemDialog({
      availableQuantity,
      availableQuantityLabel,
      unitPriceValue,
      priceCurrency,
    });
    const content = await this.#renderMttDialogContent({
      icon: "fa-handshake-angle",
      title: game.i18n.localize("mtt.dialog.sellerItemTitle"),
      variant: "default",
      entity: {
        name,
        img,
        meta: sourceActorName ? `${game.i18n.localize("mtt.sessions.sourceActor")} : ${sourceActorName}` : "",
      },
      form,
    });

    let result = null;

    try {
      result = await foundry.applications.api.DialogV2.wait({
        window: {
          title: game.i18n.localize("mtt.dialog.sellerItemTitle"),
        },
        content,
        rejectClose: false,
        buttons: [
          {
            action: "cancel",
            label: game.i18n.localize("mtt.dialog.cancel"),
            callback: () => null,
          },
          {
            action: "add",
            label: game.i18n.localize("mtt.dialog.sellerItemAdd"),
            default: true,
            callback: (event, button, dialog) => {
              const form = button?.form ?? dialog?.element?.querySelector("form") ?? event.target?.closest?.("form");
              if (!form) return null;

              return Object.fromEntries(new FormData(form).entries());
            },
          },
        ],
      });
    } catch {
      return null;
    }

    if (!result) return null;

    const quantity = Number(result.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidSellerItemQuantity"));
      return null;
    }

    if (Number.isFinite(availableQuantity) && availableQuantity >= 0 && quantity > availableQuantity) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.notEnoughSellerItemQuantity"));
      return null;
    }

    const priceValue = Number(result.unitPriceValue);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidSellerItemPrice"));
      return null;
    }

    return {
      quantity,
      unitPriceValue: priceValue,
      priceCurrency: result.priceCurrency?.trim() ?? "",
    };
  }

  #prepareWalletCurrencies() {
    const walletCurrencies = this.actor.system.wallet?.currencies ?? {};

    return getCurrencies()
      .map((currency) => {
        const id = String(currency.id ?? "").trim();
        if (!id) return null;

        const configuredAmount = Number(walletCurrencies[id] ?? 0);

        return {
          id,
          label: String(currency.abbreviation ?? "").trim() || String(currency.name ?? "").trim() || id,
          name: String(currency.name ?? "").trim(),
          amount: Number.isFinite(configuredAmount) && configuredAmount >= 0 ? configuredAmount : 0,
          rate: currency.rate,
          isDefault: Boolean(currency.isDefault),
        };
      })
      .filter(Boolean);
  }

  #prepareAccessContext() {
    const clients = this.#prepareAccessClients();

    return {
      clients,
      hasClients: clients.length > 0,
      canManage: this.isEditable,
    };
  }

  #prepareAccessClients() {
    const clientsByUuid = new Map();
    const selectedSession = this.#getSelectedSession();
    const selectedClientActorUuid = this.#selectedClientActorUuid;

    this.#getStoredAccessClients().forEach((client) => {
      if (!client.actorUuid) return;
      clientsByUuid.set(client.actorUuid, client);
    });

    game.users.forEach((user) => {
      const actor = user.character;
      if (!actor?.uuid) return;

      const existing = clientsByUuid.get(actor.uuid);
      const playerClient = this.#buildAccessClientFromActor(actor, {
        user,
        isAuthorized: existing?.isAuthorized ?? false,
        isFromPlayerCharacter: true,
      });

      clientsByUuid.set(actor.uuid, {
        ...playerClient,
        ...existing,
        actorName: actor.name ?? existing?.actorName ?? "",
        actorImg: actor.img ?? existing?.actorImg ?? "",
        actorType: actor.type ?? existing?.actorType ?? "",
        userId: user.id ?? existing?.userId ?? "",
        userName: user.name ?? existing?.userName ?? "",
        isFromPlayerCharacter: true,
      });
    });

    return Array.from(clientsByUuid.values())
      .map((client) => {
        const session = this.#getBestSessionForClient(client.actorUuid);
        const sessionStatus = session?.status ?? "";
        const preparedClient = {
          ...client,
          statusLabel: game.i18n.localize(client.isAuthorized ? "mtt.access.authorized" : "mtt.access.unauthorized"),
          sourceLabel: game.i18n.localize(
            client.isFromPlayerCharacter ? "mtt.access.playerCharacter" : "mtt.access.manualActor",
          ),
          hasSession: Boolean(session),
          sessionId: session?.id ?? "",
          sessionStatus,
          sessionLabel: session ? game.i18n.localize(`mtt.sessions.status.${sessionStatus}`) : game.i18n.localize("mtt.access.noSession"),
          sessionBadgeIcon: this.#getAccessSessionBadgeIcon(sessionStatus),
          isSelected: Boolean(
            (session && selectedSession?.id === session.id) ||
              (!session && selectedClientActorUuid && client.actorUuid === selectedClientActorUuid),
          ),
        };
        preparedClient.tooltip = this.#formatAccessClientTooltip(preparedClient);
        return preparedClient;
      })
      .sort((a, b) => a.actorName.localeCompare(b.actorName, undefined, { sensitivity: "base" }));
  }

  #formatAccessClientTooltip(client) {
    const parts = [client.actorName, client.userName || client.sourceLabel, client.statusLabel].filter(Boolean);
    if (client.hasSession) parts.push(this.#getAccessSessionTooltipLabel(client.sessionStatus));
    parts.push(game.i18n.localize(client.isAuthorized ? "mtt.access.leftClickOpenSession" : "mtt.access.leftClickAuthorize"));
    if (this.isEditable) parts.push(game.i18n.localize("mtt.access.rightClickManage"));
    return parts.join(" - ");
  }

  #getAccessSessionBadgeIcon(status) {
    if (status === "active") return "fa-hourglass-half";
    if (status === "pending") return "fa-triangle-exclamation";
    if (status === "validated") return "fa-check";
    if (status === "refused") return "fa-xmark";
    return "";
  }

  #getAccessSessionTooltipLabel(status) {
    if (status === "active") return game.i18n.localize("mtt.access.sessionActive");
    if (status === "pending") return game.i18n.localize("mtt.access.sessionPending");
    if (status === "validated") return game.i18n.localize("mtt.access.sessionValidated");
    if (status === "refused") return game.i18n.localize("mtt.access.sessionRefused");
    return game.i18n.localize("mtt.access.noSession");
  }

  #getStoredAccessClients() {
    const clients = this.actor.system.access?.clients ?? [];
    const clientsByUuid = new Map();

    clients.forEach((client) => {
      const normalizedClient = this.#normalizeAccessClient(client);
      if (!normalizedClient.actorUuid) return;
      clientsByUuid.set(normalizedClient.actorUuid, normalizedClient);
    });

    return Array.from(clientsByUuid.values());
  }

  #normalizeAccessClient(client) {
    return {
      actorUuid: String(client.actorUuid ?? "").trim(),
      actorId: String(client.actorId ?? "").trim(),
      actorName: String(client.actorName ?? "").trim(),
      actorImg: String(client.actorImg ?? "").trim(),
      actorType: String(client.actorType ?? "").trim(),
      userId: String(client.userId ?? "").trim(),
      userName: String(client.userName ?? "").trim(),
      isAuthorized: Boolean(client.isAuthorized),
      isFromPlayerCharacter: Boolean(client.isFromPlayerCharacter),
    };
  }

  #buildAccessClientFromActor(actor, { user = null, isAuthorized = false, isFromPlayerCharacter = false } = {}) {
    return this.#normalizeAccessClient({
      actorUuid: actor.uuid ?? "",
      actorId: actor.id ?? "",
      actorName: actor.name ?? "",
      actorImg: actor.img ?? "",
      actorType: actor.type ?? "",
      userId: user?.id ?? "",
      userName: user?.name ?? "",
      isAuthorized,
      isFromPlayerCharacter,
    });
  }

  async #upsertAccessClient(client) {
    const normalizedClient = this.#normalizeAccessClient(client);
    if (!normalizedClient.actorUuid) return null;

    const clients = this.#getStoredAccessClients();
    const index = clients.findIndex((entry) => entry.actorUuid === normalizedClient.actorUuid);

    if (index === -1) {
      clients.push(normalizedClient);
    } else {
      clients[index] = {
        ...clients[index],
        ...normalizedClient,
        isFromPlayerCharacter: clients[index].isFromPlayerCharacter || normalizedClient.isFromPlayerCharacter,
      };
    }

    await this.actor.update({
      "system.access.clients": clients,
    });

    return normalizedClient;
  }

  #getAccessClientForSession(session) {
    const actorUuid = String(session?.actorUuid ?? "").trim();
    if (!actorUuid) return null;

    const client = this.#prepareAccessClients().find((entry) => entry.actorUuid === actorUuid);
    if (client) return client;

    return this.#normalizeAccessClient({
      actorUuid,
      actorName: session.actorName ?? "",
      userId: session.userId ?? "",
      userName: session.userName ?? "",
      isAuthorized: false,
    });
  }

  #getAccessClientCandidate(actorUuid) {
    const normalizedActorUuid = String(actorUuid ?? "").trim();
    if (!normalizedActorUuid) return null;

    return this.#prepareAccessClients().find((client) => client.actorUuid === normalizedActorUuid) ?? null;
  }

  #getOpenSessionsForClient(actorUuid) {
    const normalizedActorUuid = String(actorUuid ?? "").trim();
    if (!normalizedActorUuid) return [];

    return this.#getSessions().filter(
      (session) => session.actorUuid === normalizedActorUuid && ["active", "pending"].includes(session.status),
    );
  }

  #getSelectedSession() {
    if (!this.#activeSessionId) return null;

    const session = this.#getSessions().find((entry) => entry.id === this.#activeSessionId);
    return session ? this.#normalizeSession(session) : null;
  }

  #getSelectedClient() {
    if (!this.#selectedClientActorUuid) return null;

    return this.#getAccessClientCandidate(this.#selectedClientActorUuid);
  }

  #getBestSessionForClient(actorUuid) {
    const normalizedActorUuid = String(actorUuid ?? "").trim();
    if (!normalizedActorUuid) return null;

    const sessions = this.#getSessions()
      .filter((session) => session.actorUuid === normalizedActorUuid)
      .map((session) => this.#normalizeSession(session));
    if (sessions.length === 0) return null;

    const statusOrder = ["active", "pending", "validated", "refused"];
    sessions.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));
    return sessions[0];
  }

  #selectSession(sessionId) {
    const session = this.#getSessions().find((entry) => entry.id === sessionId);
    if (!session) {
      this.#activeSessionId = null;
      return null;
    }

    this.#activeSessionId = session.id;
    this.#selectedClientActorUuid = session.actorUuid ?? "";
    this.#sessionCheckResult = null;
    return this.#normalizeSession(session);
  }

  #selectClient(client) {
    this.#selectedClientActorUuid = client?.actorUuid ?? "";
    this.#activeSessionId = null;
    this.#sessionCheckResult = null;
  }

  #findExternalOpenSessionForClient(actorUuid) {
    const normalizedActorUuid = String(actorUuid ?? "").trim();
    if (!normalizedActorUuid) return null;

    return (
      game.actors.find((actor) => {
        if (actor.id === this.actor.id) return false;
        if (!this.#isMerchantActor(actor)) return false;

        return (actor.system.sessions?.entries ?? []).some(
          (session) => session.actorUuid === normalizedActorUuid && ["active", "pending"].includes(session.status),
        );
      }) ?? null
    );
  }

  #isMerchantActor(actor) {
    return actor?.type === "merchant" || actor?.type === MTT.ACTOR_TYPES.MERCHANT;
  }

  async #setClientAuthorization(client, isAuthorized, { removeOpenSessions = false } = {}) {
    const normalizedClient = this.#normalizeAccessClient({
      ...client,
      isAuthorized,
    });
    if (!normalizedClient.actorUuid) return;

    const clients = this.#getStoredAccessClients();
    const clientIndex = clients.findIndex((entry) => entry.actorUuid === normalizedClient.actorUuid);

    if (clientIndex === -1) {
      clients.push(normalizedClient);
    } else {
      clients[clientIndex] = {
        ...clients[clientIndex],
        ...normalizedClient,
      };
    }

    const updateData = {
      "system.access.clients": clients,
    };

    if (removeOpenSessions) {
      const removedSessionIds = new Set(
        this.#getSessions()
          .filter((session) => session.actorUuid === normalizedClient.actorUuid)
          .map((session) => session.id),
      );
      updateData["system.sessions.entries"] = this.#getSessions().filter((session) => !removedSessionIds.has(session.id));
      if (removedSessionIds.has(this.#activeSessionId)) this.#activeSessionId = null;
      if (this.#selectedClientActorUuid === normalizedClient.actorUuid) this.#selectedClientActorUuid = "";
      this.#sessionCheckResult = null;
    }

    await this.actor.update(updateData);
  }

  async #removeClientAuthorization(client) {
    const openSessions = this.#getSessions().filter((session) => session.actorUuid === client.actorUuid);
    let removeOpenSessions = false;

    if (openSessions.length > 0) {
      const content = await this.#renderMttDialogContent({
        icon: "fa-user-slash",
        title: game.i18n.localize("mtt.dialog.removeAuthorizationTitle"),
        message: game.i18n.localize("mtt.dialog.removeAuthorizationMessage"),
        details: game.i18n.localize("mtt.dialog.noTransactionNoJournal"),
        variant: "warning",
        entity: {
          name: client.actorName,
          img: client.actorImg,
          meta: client.userName || client.sourceLabel || "",
        },
      });
      const confirmed = await foundry.applications.api.DialogV2.confirm({
        window: {
          title: game.i18n.localize("mtt.dialog.removeAuthorizationTitle"),
        },
        content,
        yes: {
          label: game.i18n.localize("mtt.dialog.removeAuthorizationConfirm"),
        },
        no: {
          label: game.i18n.localize("mtt.dialog.cancel"),
        },
      });

      if (!confirmed) return false;
      removeOpenSessions = true;
    }

    await this.#setClientAuthorization(client, false, { removeOpenSessions });
    this.render();
    return true;
  }

  async #removeAccessClient(client) {
    const openSessions = this.#getSessions().filter((session) => session.actorUuid === client.actorUuid);
    const content = await this.#renderMttDialogContent({
      icon: "fa-trash",
      title: game.i18n.localize("mtt.dialog.removeActorTitle"),
      message: game.i18n.localize("mtt.dialog.removeActorMessage"),
      details: openSessions.length > 0 ? game.i18n.localize("mtt.dialog.noTransactionNoJournal") : "",
      variant: "danger",
      entity: {
        name: client.actorName,
        img: client.actorImg,
        meta: client.userName || client.sourceLabel || "",
      },
    });
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: game.i18n.localize("mtt.dialog.removeActorTitle"),
      },
      content,
      yes: {
        label: game.i18n.localize("mtt.dialog.removeActorConfirm"),
      },
      no: {
        label: game.i18n.localize("mtt.dialog.cancel"),
      },
    });

    if (!confirmed) return false;

    const clients = this.#getStoredAccessClients().filter((entry) => entry.actorUuid !== client.actorUuid);
    const removedSessionIds = new Set(openSessions.map((session) => session.id));
    const sessions = this.#getSessions().filter((session) => !removedSessionIds.has(session.id));
    if (removedSessionIds.has(this.#activeSessionId)) this.#activeSessionId = null;
    if (this.#selectedClientActorUuid === client.actorUuid) this.#selectedClientActorUuid = "";
    this.#sessionCheckResult = null;

    await this.actor.update({
      "system.access.clients": clients,
      "system.sessions.entries": sessions,
    });

    this.render();
    return true;
  }

  #prepareSessionContext() {
    const session = this.#getActiveSession();
    if (!session) {
      const selectedClient = this.#getSelectedClient();
      return {
        id: "",
        label: "",
        status: "",
        statusLabel: "",
        buyerItems: [],
        sellerItems: [],
        hasBuyerItems: false,
        hasSellerItems: false,
        buyerTotalByCurrency: [],
        sellerTotalByCurrency: [],
        hasBuyerTotals: false,
        hasSellerTotals: false,
        hasSession: false,
        hasSelectedClient: Boolean(selectedClient?.actorUuid),
        canEdit: false,
        statusNotice: "",
        isActive: false,
        isPending: false,
        isValidated: false,
        isRefused: false,
        hasAnyItems: false,
        isBalanced: false,
        moneyAdjustments: [],
        buyerMoneyAdjustments: [],
        sellerMoneyAdjustments: [],
        hasMoneyAdjustments: false,
        hasBuyerLines: false,
        hasSellerLines: false,
        client: {
          hasClient: Boolean(selectedClient?.actorUuid),
          actorUuid: selectedClient?.actorUuid ?? "",
          actorName: selectedClient?.actorName ?? "",
          actorImg: selectedClient?.actorImg ?? "",
          userName: selectedClient?.userName ?? "",
          isAuthorized: Boolean(selectedClient?.isAuthorized),
          isUnauthorized: Boolean(selectedClient?.actorUuid && !selectedClient?.isAuthorized),
        },
        checkResult: this.#prepareSessionCheckContext(),
      };
    }

    const buyerItems = (session.buyerItems ?? []).map((item) => {
      this.#syncSessionItemAvailability(item);
      this.#recalculateSessionItemTotal(item);

      return {
        ...item,
        sourceLabel: item.sourceLabel || game.i18n.localize(`mtt.sessions.item.${item.type}`),
        unitPriceLabel: this.#formatPriceLabel(item.unitPriceValue, item.priceCurrency),
        totalPriceLabel: this.#formatPriceLabel(item.totalPriceValue, item.priceCurrency),
        availableQuantityLabel: Number.isFinite(Number(item.availableQuantity)) ? String(item.availableQuantity) : "",
      };
    });
    const sellerItems = (session.sellerItems ?? []).map((item) => {
      this.#recalculateSessionItemTotal(item);

      return {
        ...item,
        sourceLabel: item.sourceLabel || game.i18n.localize("mtt.sessions.item.object"),
        unitPriceLabel: this.#formatPriceLabel(item.unitPriceValue, item.priceCurrency),
        totalPriceLabel: this.#formatPriceLabel(item.totalPriceValue, item.priceCurrency),
        availableQuantityLabel: Number.isFinite(Number(item.availableQuantity)) ? String(item.availableQuantity) : "",
      };
    });
    const buyerTotalByCurrency = this.#prepareSessionTotals(buyerItems);
    const sellerTotalByCurrency = this.#prepareSessionTotals(sellerItems);
    const moneyAdjustments = this.#prepareMoneyAdjustments(buyerTotalByCurrency, sellerTotalByCurrency);
    const buyerMoneyAdjustments = moneyAdjustments.filter((adjustment) => adjustment.side === "buyer");
    const sellerMoneyAdjustments = moneyAdjustments.filter((adjustment) => adjustment.side === "seller");
    const status = session.status ?? "active";
    const hasAnyItems = buyerItems.length > 0 || sellerItems.length > 0;
    const client = this.#prepareSessionClientContext(session);

    return {
      id: session.id,
      label: session.label,
      status,
      statusLabel: game.i18n.localize(`mtt.sessions.status.${status}`),
      buyerItems,
      sellerItems,
      hasBuyerItems: buyerItems.length > 0,
      hasSellerItems: sellerItems.length > 0,
      buyerTotalByCurrency,
      sellerTotalByCurrency,
      hasBuyerTotals: buyerTotalByCurrency.length > 0,
      hasSellerTotals: sellerTotalByCurrency.length > 0,
      hasSession: true,
      canEdit: !["validated", "refused"].includes(status),
      isActive: status === "active",
      isPending: status === "pending",
      isValidated: status === "validated",
      isRefused: status === "refused",
      statusNotice: this.#getSessionStatusNotice(status),
      hasAnyItems,
      moneyAdjustments,
      buyerMoneyAdjustments,
      sellerMoneyAdjustments,
      hasMoneyAdjustments: moneyAdjustments.length > 0,
      isBalanced: hasAnyItems && moneyAdjustments.length === 0,
      hasBuyerLines: buyerItems.length > 0 || buyerMoneyAdjustments.length > 0,
      hasSellerLines: sellerItems.length > 0 || sellerMoneyAdjustments.length > 0,
      client,
      checkResult: this.#prepareSessionCheckContext(),
    };
  }

  #prepareSessionClientContext(session) {
    const client = this.#getAccessClientForSession(session);
    if (!client?.actorUuid) {
      return {
        hasClient: false,
        actorUuid: "",
        actorName: "",
        actorImg: "",
        userName: "",
        isAuthorized: false,
        isUnauthorized: false,
      };
    }

    return {
      hasClient: true,
      actorUuid: client.actorUuid,
      actorName: client.actorName || session.actorName || game.i18n.localize("mtt.access.noClient"),
      actorImg: client.actorImg,
      userName: client.userName || session.userName || "",
      isAuthorized: Boolean(client.isAuthorized),
      isUnauthorized: !client.isAuthorized,
    };
  }

  #prepareSessionCheckContext() {
    if (!this.#sessionCheckResult?.checked) {
      return {
        checked: false,
        canProceed: false,
        infos: [],
        warnings: [],
        errors: [],
        hasInfos: false,
        hasWarnings: false,
        hasErrors: false,
      };
    }

    const infos = this.#sessionCheckResult.infos ?? [];
    const warnings = this.#sessionCheckResult.warnings ?? [];
    const errors = this.#sessionCheckResult.errors ?? [];

    return {
      checked: true,
      canProceed: Boolean(this.#sessionCheckResult.canProceed),
      infos,
      warnings,
      errors,
      hasInfos: infos.length > 0,
      hasWarnings: warnings.length > 0,
      hasErrors: errors.length > 0,
    };
  }

  #prepareSessionTotals(items) {
    const totals = new Map();

    items.forEach((item) => {
      const currency = this.#normalizeCurrencyKey(item.priceCurrency);
      const totalPriceValue = Number(item.totalPriceValue);
      if (!Number.isFinite(totalPriceValue) || totalPriceValue < 0) return;

      totals.set(currency, (totals.get(currency) ?? 0) + totalPriceValue);
    });

    return Array.from(totals.entries()).map(([currency, totalPriceValue]) => {
      const roundedTotal = Number(totalPriceValue.toFixed(2));

      return {
        currency,
        currencyLabel: this.#formatCurrencyLabel(currency === "__none" ? "" : currency),
        totalPriceValue: roundedTotal,
        totalPriceLabel: this.#formatPriceLabel(roundedTotal, currency === "__none" ? "" : currency),
      };
    });
  }

  #prepareMoneyAdjustments(buyerTotals, sellerTotals) {
    const totalsByCurrency = new Map();

    buyerTotals.forEach((total) => {
      totalsByCurrency.set(total.currency, {
        currency: total.currency,
        buyer: Number(total.totalPriceValue) || 0,
        seller: 0,
      });
    });

    sellerTotals.forEach((total) => {
      const existing = totalsByCurrency.get(total.currency) ?? {
        currency: total.currency,
        buyer: 0,
        seller: 0,
      };
      existing.seller = Number(total.totalPriceValue) || 0;
      totalsByCurrency.set(total.currency, existing);
    });

    return Array.from(totalsByCurrency.values())
      .map(({ currency, buyer, seller }) => {
        const difference = Number((buyer - seller).toFixed(2));
        if (difference === 0) return null;

        const side = difference > 0 ? "seller" : "buyer";
        const amount = Math.abs(difference);
        const displayCurrency = currency === "__none" ? "" : currency;

        return {
          id: `money-adjustment-${side}-${currency}`,
          side,
          currency,
          currencyLabel: this.#formatCurrencyLabel(displayCurrency),
          amount,
          amountLabel: this.#formatPriceLabel(amount, displayCurrency),
          label: game.i18n.localize("mtt.sessions.moneyAdjustment"),
          isMoneyAdjustment: true,
        };
      })
      .filter(Boolean);
  }

  #getSessionStatusNotice(status) {
    if (status === "pending") return game.i18n.localize("mtt.sessions.pendingNotice");
    if (status === "validated") return game.i18n.localize("mtt.sessions.validatedNoTransfer");
    if (status === "refused") return game.i18n.localize("mtt.sessions.refusedNotice");
    return game.i18n.localize("mtt.sessions.activeNotice");
  }

  async #checkSessionTransaction(session) {
    const preparedSession = this.#prepareSessionContext();
    const result = {
      checked: true,
      canProceed: false,
      infos: [],
      warnings: [],
      errors: [],
    };

    if (!session) {
      result.canProceed = false;
      return result;
    }

    this.#checkSessionStatus(session, result);
    this.#checkSessionBuyerItems(session, result);
    await this.#checkSessionSellerItems(session, result);
    this.#checkSessionMoneyAdjustments(preparedSession.moneyAdjustments ?? [], result);
    this.#checkSessionCurrencies(preparedSession, result);

    result.canProceed = result.errors.length === 0;
    return result;
  }

  #checkSessionStatus(session, result) {
    if (session.status === "validated") {
      result.warnings.push(
        this.#createCheckMessage(
          "warning",
          "already-validated",
          game.i18n.localize("mtt.sessions.check.alreadyValidated"),
          "fa-triangle-exclamation",
        ),
      );
    }

    if (session.status === "refused") {
      result.warnings.push(
        this.#createCheckMessage(
          "warning",
          "already-refused",
          game.i18n.localize("mtt.sessions.check.alreadyRefused"),
          "fa-ban",
        ),
      );
    }
  }

  #checkSessionBuyerItems(session, result) {
    const buyerItems = session.buyerItems ?? [];
    if (buyerItems.length === 0) return;

    const errorCount = result.errors.length;

    buyerItems.forEach((item) => {
      if (item.type === "product") {
        const availableQuantity = this.#getProductCheckAvailableQuantity(item);
        this.#checkLimitedSessionQuantity({
          item,
          availableQuantity,
          result,
          messageId: `product-stock-${item.id}`,
          messageKey: "mtt.sessions.check.productStockInsufficient",
          icon: "fa-box-open",
        });
      }

      if (item.type === "service") {
        const availableQuantity = this.#getServiceCheckAvailableQuantity(item);
        this.#checkLimitedSessionQuantity({
          item,
          availableQuantity,
          result,
          messageId: `service-stock-${item.id}`,
          messageKey: "mtt.sessions.check.serviceQuantityInsufficient",
          icon: "fa-bell-concierge",
        });
      }
    });

    if (result.errors.length === errorCount) {
      result.infos.push(
        this.#createCheckMessage(
          "info",
          "stock-ok",
          game.i18n.localize("mtt.sessions.check.stockOk"),
          "fa-circle-check",
        ),
      );
    }
  }

  async #checkSessionSellerItems(session, result) {
    const sellerItems = session.sellerItems ?? [];
    if (sellerItems.length === 0) return;

    const errorCount = result.errors.length;
    const warningCount = result.warnings.length;

    for (const item of sellerItems) {
      const sourceUuid = String(item.sourceUuid ?? "").trim();
      let source = null;

      if (sourceUuid) {
        try {
          source = await fromUuid(sourceUuid);
        } catch {
          source = null;
        }
      }

      if (!source || source.documentName !== "Item") {
        result.warnings.push(
          this.#createCheckMessage(
            "warning",
            `seller-source-${item.id}`,
            game.i18n.format("mtt.sessions.check.sellerSourceMissing", { name: item.name }),
            "fa-link-slash",
          ),
        );
        continue;
      }

      const availableQuantity = this.#getItemAvailableQuantity(source);
      this.#checkLimitedSessionQuantity({
        item,
        availableQuantity,
        result,
        messageId: `seller-stock-${item.id}`,
        messageKey: "mtt.sessions.check.sellerQuantityInsufficient",
        icon: "fa-box-open",
      });
    }

    if (result.errors.length === errorCount && result.warnings.length === warningCount) {
      result.infos.push(
        this.#createCheckMessage(
          "info",
          "seller-items-ok",
          game.i18n.localize("mtt.sessions.check.sellerItemsOk"),
          "fa-circle-check",
        ),
      );
    }
  }

  #checkSessionMoneyAdjustments(moneyAdjustments, result) {
    moneyAdjustments.forEach((adjustment) => {
      const currencyLabel = this.#formatCurrencyLabel(adjustment.currency === "__none" ? "" : adjustment.currency);

      if (adjustment.currency === "__none") {
        result.warnings.push(
          this.#createCheckMessage(
            "warning",
            `money-undefined-${adjustment.side}`,
            game.i18n.localize("mtt.sessions.check.undefinedCurrency"),
            "fa-coins",
          ),
        );
        return;
      }

      if (adjustment.side === "seller") {
        result.infos.push(
          this.#createCheckMessage(
            "info",
            `player-must-pay-${adjustment.currency}`,
            game.i18n.format("mtt.sessions.check.playerMustPay", {
              amount: adjustment.amount,
              currency: currencyLabel,
            }),
            "fa-coins",
          ),
        );
        return;
      }

      result.infos.push(
        this.#createCheckMessage(
          "info",
          `merchant-must-return-${adjustment.currency}`,
          game.i18n.format("mtt.sessions.check.merchantMustReturn", {
            amount: adjustment.amount,
            currency: currencyLabel,
          }),
          "fa-coins",
        ),
      );

      const merchantAmount = this.#getMerchantWalletAmount(adjustment.currency);
      if (merchantAmount < adjustment.amount) {
        result.errors.push(
          this.#createCheckMessage(
            "error",
            `merchant-currency-${adjustment.currency}`,
            game.i18n.format("mtt.sessions.check.merchantCurrencyInsufficient", {
              currency: currencyLabel,
            }),
            "fa-coins",
          ),
        );
        return;
      }

      result.infos.push(
        this.#createCheckMessage(
          "info",
          `merchant-change-ok-${adjustment.currency}`,
          game.i18n.localize("mtt.sessions.check.merchantChangeOk"),
          "fa-circle-check",
        ),
      );
    });
  }

  #checkSessionCurrencies(preparedSession, result) {
    const seen = new Set();
    const currencyKeys = [
      ...(preparedSession.buyerTotalByCurrency ?? []).map((total) => total.currency),
      ...(preparedSession.sellerTotalByCurrency ?? []).map((total) => total.currency),
      ...(preparedSession.moneyAdjustments ?? []).map((adjustment) => adjustment.currency),
    ];

    currencyKeys.forEach((currency) => {
      const currencyKey = this.#normalizeCurrencyKey(currency === "__none" ? "" : currency);
      if (seen.has(currencyKey)) return;
      seen.add(currencyKey);

      if (currencyKey === "__none") {
        result.warnings.push(
          this.#createCheckMessage(
            "warning",
            "currency-undefined",
            game.i18n.localize("mtt.sessions.check.undefinedCurrency"),
            "fa-coins",
          ),
        );
        return;
      }

      if (this.#getConfiguredCurrency(currencyKey)) return;

      result.warnings.push(
        this.#createCheckMessage(
          "warning",
          `currency-unknown-${currencyKey}`,
          game.i18n.format("mtt.sessions.check.unknownCurrency", {
            currency: this.#formatCurrencyLabel(currencyKey),
          }),
          "fa-coins",
        ),
      );
    });
  }

  #checkLimitedSessionQuantity({ item, availableQuantity, result, messageId, messageKey, icon }) {
    if (!item.hasLimitedQuantity) return;

    const requestedQuantity = Number(item.quantity);
    const normalizedAvailableQuantity = Number(availableQuantity);

    if (!Number.isFinite(requestedQuantity) || !Number.isFinite(normalizedAvailableQuantity)) return;
    if (requestedQuantity <= normalizedAvailableQuantity) return;

    result.errors.push(
      this.#createCheckMessage(
        "error",
        messageId,
        game.i18n.format(messageKey, { name: item.name }),
        icon,
      ),
    );
  }

  #getProductCheckAvailableQuantity(item) {
    const source = this.actor.items.get(item.sourceId);
    const product = source?.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};
    const productQuantity = Number(product.quantity);
    if (Number.isFinite(productQuantity) && productQuantity >= 0) return productQuantity;

    const sessionQuantity = Number(item.availableQuantity);
    return Number.isFinite(sessionQuantity) && sessionQuantity >= 0 ? sessionQuantity : null;
  }

  #getServiceCheckAvailableQuantity(item) {
    const service = this.actor.system.services?.entries?.find((entry) => entry.id === item.sourceId);
    const serviceQuantity = Number(service?.quantity);
    if (Number.isFinite(serviceQuantity) && serviceQuantity >= 0) return serviceQuantity;

    const sessionQuantity = Number(item.availableQuantity);
    return Number.isFinite(sessionQuantity) && sessionQuantity >= 0 ? sessionQuantity : null;
  }

  #getConfiguredCurrency(currency) {
    const normalizedCurrency = String(currency ?? "").trim().toLowerCase();
    if (!normalizedCurrency) return null;

    return (
      getCurrencies().find((entry) => {
        const candidates = [entry.id, entry.abbreviation, entry.name]
          .map((value) => String(value ?? "").trim().toLowerCase())
          .filter(Boolean);

        return candidates.includes(normalizedCurrency);
      }) ?? null
    );
  }

  #getMerchantWalletAmount(currency) {
    const configuredCurrency = this.#getConfiguredCurrency(currency);
    const walletKey = String(configuredCurrency?.id ?? currency ?? "").trim();
    if (!walletKey) return 0;

    const amount = Number(this.actor.system.wallet?.currencies?.[walletKey] ?? 0);
    return Number.isFinite(amount) && amount >= 0 ? amount : 0;
  }

  #createCheckMessage(level, id, text, icon = "") {
    return {
      id,
      level,
      text,
      icon,
    };
  }

  async #addSessionBuyerItem({
    type,
    sourceId,
    name,
    img,
    quantity,
    availableQuantity = null,
    hasLimitedQuantity = false,
    unitPriceValue,
    priceCurrency,
    sourceLabel,
    proposedUnitPriceValue = "",
  }) {
    const session = await this.#getOrCreateActiveSession();
    if (!session) return null;

    const normalizedQuantity = Number(quantity);
    const normalizedUnitPrice = Number(unitPriceValue);
    const normalizedCurrency = String(priceCurrency ?? "").trim();
    const normalizedAvailableQuantity = Number(availableQuantity);
    const isLimitedQuantity =
      Boolean(hasLimitedQuantity) &&
      Number.isFinite(normalizedAvailableQuantity) &&
      normalizedAvailableQuantity >= 0;

    if (
      !Number.isFinite(normalizedQuantity) ||
      normalizedQuantity <= 0 ||
      !Number.isFinite(normalizedUnitPrice) ||
      normalizedUnitPrice < 0
    ) {
      return null;
    }

    const existingItem = session.buyerItems.find(
      (item) =>
        item.type === type &&
        item.sourceId === sourceId &&
        item.unitPriceValue === normalizedUnitPrice &&
        item.priceCurrency === normalizedCurrency,
    );

    if (existingItem) {
      existingItem.availableQuantity = isLimitedQuantity ? normalizedAvailableQuantity : null;
      existingItem.hasLimitedQuantity = isLimitedQuantity;
      if (!this.#canUseSessionQuantity(existingItem, existingItem.quantity + normalizedQuantity)) return null;

      existingItem.quantity = Number((existingItem.quantity + normalizedQuantity).toFixed(2));
      this.#recalculateSessionItemTotal(existingItem);
      await this.#saveSession(session);
      return existingItem;
    }

    const sessionItem = {
      id: foundry.utils.randomID(),
      type,
      sourceId,
      name,
      img: img ?? "",
      quantity: normalizedQuantity,
      availableQuantity: isLimitedQuantity ? normalizedAvailableQuantity : null,
      hasLimitedQuantity: isLimitedQuantity,
      unitPriceValue: normalizedUnitPrice,
      priceCurrency: normalizedCurrency,
      totalPriceValue: Number((normalizedQuantity * normalizedUnitPrice).toFixed(2)),
      sourceLabel,
      proposedUnitPriceValue:
        proposedUnitPriceValue !== "" && Number.isFinite(Number(proposedUnitPriceValue))
          ? Number(proposedUnitPriceValue)
          : null,
    };

    session.buyerItems.push(sessionItem);
    await this.#saveSession(session);
    return sessionItem;
  }

  async #addSessionSellerItem({
    type,
    sourceUuid,
    sourceActorUuid,
    sourceId,
    name,
    img,
    quantity,
    availableQuantity = null,
    hasLimitedQuantity = false,
    unitPriceValue,
    priceCurrency,
    sourceLabel,
    isFromActor = false,
  }) {
    const session = await this.#getOrCreateActiveSession();
    if (!session) return null;

    const normalizedQuantity = Number(quantity);
    const normalizedUnitPrice = Number(unitPriceValue);
    const normalizedCurrency = String(priceCurrency ?? "").trim();
    const normalizedSourceUuid = String(sourceUuid ?? "").trim();
    const normalizedAvailableQuantity = Number(availableQuantity);
    const isLimitedQuantity =
      Boolean(hasLimitedQuantity) &&
      Number.isFinite(normalizedAvailableQuantity) &&
      normalizedAvailableQuantity >= 0;

    if (
      !Number.isFinite(normalizedQuantity) ||
      normalizedQuantity <= 0 ||
      !Number.isFinite(normalizedUnitPrice) ||
      normalizedUnitPrice < 0
    ) {
      return null;
    }

    const existingItem = session.sellerItems.find(
      (item) =>
        (normalizedSourceUuid ? item.sourceUuid === normalizedSourceUuid : item.sourceId === sourceId) &&
        item.unitPriceValue === normalizedUnitPrice &&
        item.priceCurrency === normalizedCurrency,
    );

    if (existingItem) {
      existingItem.availableQuantity = isLimitedQuantity ? normalizedAvailableQuantity : null;
      existingItem.hasLimitedQuantity = isLimitedQuantity;
      if (!this.#canUseSessionQuantity(existingItem, existingItem.quantity + normalizedQuantity)) return null;

      existingItem.quantity = Number((existingItem.quantity + normalizedQuantity).toFixed(2));
      this.#recalculateSessionItemTotal(existingItem);
      await this.#saveSession(session);
      return existingItem;
    }

    const sessionItem = {
      id: foundry.utils.randomID(),
      type,
      sourceUuid: normalizedSourceUuid,
      sourceActorUuid: sourceActorUuid ?? "",
      sourceId,
      name,
      img: img ?? "",
      quantity: normalizedQuantity,
      availableQuantity: isLimitedQuantity ? normalizedAvailableQuantity : null,
      hasLimitedQuantity: isLimitedQuantity,
      unitPriceValue: normalizedUnitPrice,
      priceCurrency: normalizedCurrency,
      totalPriceValue: Number((normalizedQuantity * normalizedUnitPrice).toFixed(2)),
      sourceLabel,
      proposedUnitPriceValue: null,
      isFromActor: Boolean(isFromActor),
    };

    session.sellerItems.push(sessionItem);
    await this.#saveSession(session);
    return sessionItem;
  }

  #getSessionBuyerQuantity({ type, sourceId, unitPriceValue, priceCurrency }) {
    const session = this.#getSelectedSession();
    if (!session) return 0;

    const normalizedCurrency = String(priceCurrency ?? "").trim();

    return session.buyerItems.reduce((total, item) => {
      if (item.type !== type) return total;
      if (item.sourceId !== sourceId) return total;
      if (item.unitPriceValue !== unitPriceValue) return total;
      if (item.priceCurrency !== normalizedCurrency) return total;

      return total + item.quantity;
    }, 0);
  }

  #getSessionSellerQuantity({ sourceUuid, sourceId, unitPriceValue, priceCurrency }) {
    const session = this.#getSelectedSession();
    if (!session) return 0;

    const normalizedCurrency = String(priceCurrency ?? "").trim();
    const normalizedSourceUuid = String(sourceUuid ?? "").trim();
    const normalizedSourceId = String(sourceId ?? "").trim();

    return session.sellerItems.reduce((total, item) => {
      if (normalizedSourceUuid && item.sourceUuid !== normalizedSourceUuid) return total;
      if (!normalizedSourceUuid && item.sourceId !== normalizedSourceId) return total;
      if (item.unitPriceValue !== unitPriceValue) return total;
      if (item.priceCurrency !== normalizedCurrency) return total;

      return total + item.quantity;
    }, 0);
  }

  #syncSessionItemAvailability(item) {
    if (!item) return;

    if (item.type === "product") {
      const source = this.actor.items.get(item.sourceId);
      const product = source?.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};
      const availableQuantity = Number(product.quantity ?? MTT.PRODUCT_DEFAULTS.quantity);
      const hasLimitedQuantity = Number.isFinite(availableQuantity) && availableQuantity >= 0;

      item.availableQuantity = hasLimitedQuantity ? availableQuantity : null;
      item.hasLimitedQuantity = hasLimitedQuantity;
      return;
    }

    if (item.type === "service") {
      const service = this.actor.system.services?.entries?.find((entry) => entry.id === item.sourceId);
      const quantity = service?.quantity;
      const availableQuantity = Number(quantity);
      const hasLimitedQuantity =
        quantity !== null &&
        quantity !== undefined &&
        quantity !== "" &&
        Number.isFinite(availableQuantity) &&
        availableQuantity >= 0;

      item.availableQuantity = hasLimitedQuantity ? availableQuantity : null;
      item.hasLimitedQuantity = hasLimitedQuantity;
    }
  }

  #canUseSessionQuantity(item, quantity) {
    this.#syncSessionItemAvailability(item);

    const requestedQuantity = Number(quantity);
    if (!Number.isFinite(requestedQuantity) || requestedQuantity < 0) return false;
    if (!item.hasLimitedQuantity) return true;

    const availableQuantity = Number(item.availableQuantity);
    if (!Number.isFinite(availableQuantity) || availableQuantity < 0) return true;

    return requestedQuantity <= availableQuantity;
  }

  #setSessionItemQuantity(item, quantity) {
    item.quantity = Number(Number(quantity).toFixed(2));
    this.#recalculateSessionItemTotal(item);
  }

  #recalculateSessionItemTotal(item) {
    const quantity = Number(item.quantity);
    const unitPriceValue = Number(item.unitPriceValue);

    item.totalPriceValue =
      Number.isFinite(quantity) && Number.isFinite(unitPriceValue) ? Number((quantity * unitPriceValue).toFixed(2)) : 0;
  }

  #getSessionItemsForSide(session, side) {
    return side === "seller" ? session.sellerItems : session.buyerItems;
  }

  #removeSessionItemById(session, itemId, side = "") {
    const initialBuyerCount = session.buyerItems.length;
    const initialSellerCount = session.sellerItems.length;

    if (side === "buyer") {
      session.buyerItems = session.buyerItems.filter((item) => item.id !== itemId);
    } else if (side === "seller") {
      session.sellerItems = session.sellerItems.filter((item) => item.id !== itemId);
    } else {
      session.buyerItems = session.buyerItems.filter((item) => item.id !== itemId);
      session.sellerItems = session.sellerItems.filter((item) => item.id !== itemId);
    }

    return (
      initialBuyerCount !== session.buyerItems.length ||
      initialSellerCount !== session.sellerItems.length
    );
  }

  #getSessions() {
    return foundry.utils.deepClone(this.actor.system.sessions?.entries ?? []);
  }

  #getActiveSession() {
    const sessions = this.#getSessions();
    if (this.#activeSessionId) {
      const selectedSession = sessions.find((session) => session.id === this.#activeSessionId);
      if (selectedSession) return this.#normalizeSession(selectedSession);
    }

    if (this.#selectedClientActorUuid) return null;

    const activeSession = sessions.find((session) => session.status === "active");
    if (activeSession) {
      this.#activeSessionId = activeSession.id;
      this.#selectedClientActorUuid = activeSession.actorUuid ?? "";
      return this.#normalizeSession(activeSession);
    }

    const firstSession = sessions[0];
    if (firstSession) {
      this.#activeSessionId = firstSession.id;
      this.#selectedClientActorUuid = firstSession.actorUuid ?? "";
      return this.#normalizeSession(firstSession);
    }

    return null;
  }

  async #getOrCreateActiveSession() {
    return this.#getSessionForAddingItem();
  }

  #getSessionForAddingItem() {
    const selectedSession = this.#getSelectedSession();
    if (selectedSession) {
      const client = this.#getAccessClientForSession(selectedSession);
      if (selectedSession.actorUuid && !client?.isAuthorized) {
        ui.notifications.warn(game.i18n.localize("mtt.access.notAuthorizedForTrade"));
        return null;
      }

      return selectedSession;
    }

    if (this.#selectedClientActorUuid) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.selectClientBeforeAdding"));
      return null;
    }

    ui.notifications.warn(game.i18n.localize("mtt.notifications.selectClientBeforeAdding"));
    return null;
  }

  #requireSelectedSessionForItemAddition() {
    if (this.#getSelectedSession()) return true;

    ui.notifications.warn(
      game.i18n.localize("mtt.notifications.selectClientBeforeAdding"),
    );
    return false;
  }

  #normalizeSession(session) {
    return {
      id: session.id || foundry.utils.randomID(),
      status: ["active", "pending", "validated", "refused"].includes(session.status) ? session.status : "active",
      label: session.label || game.i18n.localize("mtt.sessions.newLabel"),
      actorUuid: session.actorUuid ?? "",
      actorName: session.actorName ?? "",
      userId: session.userId ?? "",
      userName: session.userName ?? "",
      buyerItems: Array.isArray(session.buyerItems) ? session.buyerItems.map((item) => this.#normalizeSessionItem(item)) : [],
      sellerItems: Array.isArray(session.sellerItems) ? session.sellerItems.map((item) => this.#normalizeSessionItem(item)) : [],
      createdAt: session.createdAt || new Date().toISOString(),
      updatedAt: session.updatedAt || new Date().toISOString(),
    };
  }

  #normalizeSessionItem(item) {
    const quantity = Number(item.quantity);
    const unitPriceValue = Number(item.unitPriceValue);
    const availableQuantity = Number(item.availableQuantity);
    const hasLimitedQuantity =
      Boolean(item.hasLimitedQuantity) && Number.isFinite(availableQuantity) && availableQuantity >= 0;
    const normalizedQuantity = Number.isFinite(quantity) && quantity >= 0 ? quantity : 1;
    const normalizedUnitPrice = Number.isFinite(unitPriceValue) && unitPriceValue >= 0 ? unitPriceValue : 0;

    return {
      id: item.id || foundry.utils.randomID(),
      type: ["product", "service", "item"].includes(item.type) ? item.type : "product",
      sourceUuid: item.sourceUuid ?? "",
      sourceActorUuid: item.sourceActorUuid ?? "",
      sourceId: item.sourceId ?? "",
      name: item.name ?? "",
      img: item.img ?? "",
      quantity: normalizedQuantity,
      availableQuantity: hasLimitedQuantity ? availableQuantity : null,
      hasLimitedQuantity,
      unitPriceValue: normalizedUnitPrice,
      priceCurrency: String(item.priceCurrency ?? "").trim(),
      totalPriceValue: Number((normalizedQuantity * normalizedUnitPrice).toFixed(2)),
      sourceLabel: item.sourceLabel ?? "",
      proposedUnitPriceValue: Number.isFinite(Number(item.proposedUnitPriceValue))
        ? Number(item.proposedUnitPriceValue)
        : null,
      isFromActor: Boolean(item.isFromActor),
    };
  }

  #buildSessionData(client = null) {
    const now = new Date().toISOString();
    const actorName = client?.actorName ?? "";

    return {
      id: foundry.utils.randomID(),
      status: "active",
      label: actorName
        ? game.i18n.format("mtt.sessions.sessionForActor", { name: actorName })
        : game.i18n.localize("mtt.sessions.newLabel"),
      actorUuid: client?.actorUuid ?? "",
      actorName,
      userId: client?.userId ?? "",
      userName: client?.userName ?? "",
      buyerItems: [],
      sellerItems: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  async #createSessionForClient(client) {
    if (!client?.actorUuid || !client.isAuthorized) {
      ui.notifications.warn(game.i18n.localize("mtt.access.notAuthorizedForTrade"));
      return null;
    }

    const existingSession = this.#getBestSessionForClient(client.actorUuid);
    if (existingSession) {
      this.#selectSession(existingSession.id);
      return existingSession;
    }

    const externalMerchant = this.#findExternalOpenSessionForClient(client.actorUuid);
    if (externalMerchant) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.clientAlreadyTrading"));
      return null;
    }

    const sessions = this.#getSessions().map((session) => this.#normalizeSession(session));
    const session = this.#buildSessionData(client);
    sessions.push(session);
    this.#activeSessionId = session.id;
    this.#selectedClientActorUuid = client.actorUuid;
    this.#sessionCheckResult = null;

    await this.actor.update({
      "system.sessions.entries": sessions,
    });

    return session;
  }

  async #saveSession(session) {
    this.#sessionCheckResult = null;

    const normalizedSession = this.#normalizeSession(session);
    normalizedSession.updatedAt = new Date().toISOString();
    normalizedSession.buyerItems.forEach((item) => this.#recalculateSessionItemTotal(item));
    normalizedSession.sellerItems.forEach((item) => this.#recalculateSessionItemTotal(item));

    const sessions = this.#getSessions().map((entry) => this.#normalizeSession(entry));
    const index = sessions.findIndex((entry) => entry.id === normalizedSession.id);

    if (index === -1) {
      sessions.push(normalizedSession);
    } else {
      sessions[index] = normalizedSession;
    }

    this.#activeSessionId = normalizedSession.id;
    this.#selectedClientActorUuid = normalizedSession.actorUuid ?? "";

    await this.actor.update({
      "system.sessions.entries": sessions,
    });
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

  static async #onAddProductToSession(event, target) {
    event.preventDefault();

    const item = this.#getItemFromEvent(target);
    if (!item) return;

    const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};
    if (product.isHidden) return;
    if (!this.#requireSelectedSessionForItemAddition()) return;

    const displayName = product.displayName || item.name;
    const basePriceValue =
      Number.isFinite(Number(product.priceValue)) && Number(product.priceValue) >= 0
        ? Number(product.priceValue)
        : MTT.PRODUCT_DEFAULTS.priceValue;
    const displayPriceValue = this.#adjustPriceValue(basePriceValue);
    const priceCurrency = product.priceCurrency?.trim() ?? MTT.PRODUCT_DEFAULTS.priceCurrency;
    const quantity = product.quantity ?? MTT.PRODUCT_DEFAULTS.quantity;
    const availableQuantity = Number.isFinite(Number(quantity)) && Number(quantity) >= 0 ? Number(quantity) : null;

    const dialogData = await this.#openSessionPreparationDialog({
      title: game.i18n.localize("mtt.sessions.dialog.productTitle"),
      name: displayName,
      priceLabel: this.#formatPriceLabel(displayPriceValue, priceCurrency),
      availableQuantity,
      includeProposedPrice: true,
    });
    if (!dialogData) return;

    const requestedTotal =
      dialogData.quantity +
      this.#getSessionBuyerQuantity({
        type: "product",
        sourceId: item.id,
        unitPriceValue: displayPriceValue,
        priceCurrency,
      });

    if (Number.isFinite(availableQuantity) && availableQuantity >= 0 && requestedTotal > availableQuantity) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.notEnoughQuantity"));
      return;
    }

    const sessionItem = await this.#addSessionBuyerItem({
      type: "product",
      sourceId: item.id,
      name: displayName,
      img: item.img,
      quantity: dialogData.quantity,
      availableQuantity,
      hasLimitedQuantity: Number.isFinite(availableQuantity) && availableQuantity >= 0,
      unitPriceValue: displayPriceValue,
      priceCurrency,
      sourceLabel: game.i18n.localize("mtt.sessions.item.product"),
      proposedUnitPriceValue: dialogData.proposedPrice ?? "",
    });
    if (!sessionItem) return;

    this.render();
  }

  static async #onRemoveSessionItem(event, target) {
    event.preventDefault();

    const session = this.#getActiveSession();
    if (!session) return;

    const itemId = target.closest("[data-session-item-id]")?.dataset.sessionItemId;
    if (!itemId) return;
    const side = target.closest("[data-session-side]")?.dataset.sessionSide ?? "buyer";

    if (!this.#removeSessionItemById(session, itemId, side)) return;

    await this.#saveSession(session);
    this.render();
  }

  static async #onIncreaseSessionItemQuantity(event, target) {
    event.preventDefault();
    const session = this.#getActiveSession();
    if (!session) return;

    const itemId = target.closest("[data-session-item-id]")?.dataset.sessionItemId;
    if (!itemId) return;
    const side = target.closest("[data-session-side]")?.dataset.sessionSide ?? "buyer";

    const item = this.#getSessionItemsForSide(session, side).find((it) => it.id === itemId);
    if (!item) return;

    if (!this.#canUseSessionQuantity(item, item.quantity + 1)) {
      ui.notifications.warn(
        game.i18n.localize(
          side === "seller" ? "mtt.notifications.notEnoughSellerItemQuantity" : "mtt.notifications.notEnoughQuantity",
        ),
      );
      return;
    }

    this.#setSessionItemQuantity(item, item.quantity + 1);
    await this.#saveSession(session);
    this.render();
  }

  static async #onDecreaseSessionItemQuantity(event, target) {
    event.preventDefault();
    const session = this.#getActiveSession();
    if (!session) return;

    const itemId = target.closest("[data-session-item-id]")?.dataset.sessionItemId;
    if (!itemId) return;
    const side = target.closest("[data-session-side]")?.dataset.sessionSide ?? "buyer";

    const item = this.#getSessionItemsForSide(session, side).find((it) => it.id === itemId);
    if (!item) return;

    const nextQuantity = Number(item.quantity) - 1;
    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
      this.#removeSessionItemById(session, itemId, side);
      await this.#saveSession(session);
      this.render();
      return;
    }

    this.#setSessionItemQuantity(item, nextQuantity);
    await this.#saveSession(session);
    this.render();
  }

  static async #onClearSessionDraft(event) {
    event.preventDefault();

    const session = this.#getActiveSession();
    if (!session) return;

    const hasItems = session.buyerItems.length > 0 || session.sellerItems.length > 0;
    if (!hasItems) return;

    const content = await this.#renderMttDialogContent({
      icon: "fa-rotate-left",
      title: game.i18n.localize("mtt.dialog.clearSessionTitle"),
      message: game.i18n.localize("mtt.dialog.clearSessionMessage"),
      details: game.i18n.localize("mtt.dialog.noTransactionNoJournal"),
      variant: "warning",
    });
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: game.i18n.localize("mtt.dialog.clearSessionTitle"),
      },
      content,
      yes: {
        label: game.i18n.localize("mtt.dialog.clearSessionConfirm"),
      },
      no: {
        label: game.i18n.localize("mtt.dialog.cancel"),
      },
    });

    if (!confirmed) return;

    session.buyerItems = [];
    session.sellerItems = [];
    session.status = "active";
    await this.#saveSession(session);

    this.render();
  }

  static async #onToggleClientAccess(event, target) {
    event.preventDefault();

    if (!this.isEditable) return;

    const actorUuid = target.dataset.clientActorUuid;
    const client = this.#getAccessClientCandidate(actorUuid);
    if (!client) return;

    if (!client.isAuthorized) {
      if (!this.#getBestSessionForClient(client.actorUuid) && this.#findExternalOpenSessionForClient(client.actorUuid)) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.clientAlreadyTrading"));
        return;
      }

      await this.#setClientAuthorization(client, true);
      const session = await this.#createSessionForClient(
        {
          ...client,
          isAuthorized: true,
        },
      );
      if (!session) return;

      this.render();
      return;
    }

    this.#selectedClientActorUuid = client.actorUuid;
    const session = this.#getBestSessionForClient(client.actorUuid);
    if (session) {
      this.#selectSession(session.id);
      this.render();
      return;
    }

    const repairedSession = await this.#createSessionForClient(client);
    if (!repairedSession) return;

    this.render();
  }

  static async #onSetSessionStatus(event, target) {
    event.preventDefault();

    const session = this.#getActiveSession();
    if (!session) return;

    const status = target.dataset.sessionStatus;
    if (!["active", "pending", "validated", "refused"].includes(status)) return;

    session.status = status;
    await this.#saveSession(session);

    this.render();
  }

  static async #onCheckSessionTransaction(event) {
    event.preventDefault();

    const session = this.#getActiveSession();
    if (!session) return;

    this.#sessionCheckResult = await this.#checkSessionTransaction(session);

    if (!this.#sessionCheckResult.canProceed) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.sessionCheckFailed"));
    }
    this.render();
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

  static async #onEditMerchantImage(event) {
    event.preventDefault();

    if (!this.#canModifyMerchant()) return;

    const picker = new FilePicker({
      type: "image",
      current: this.actor.img,
      callback: async (path) => {
        if (!path) return;
        await this.actor.update({ img: path });
      },
    });

    picker.browse();
  }

  static async #onRollNegotiation(event) {
    event.preventDefault();

    const formula = String(this.actor.system.trade?.negotiationFormula ?? "").trim();

    if (!formula) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.emptyNegotiationFormula"));
      return;
    }

    const rollFormula = formula.replace(/^\/roll\s+/i, "").trim();

    if (!rollFormula || rollFormula.startsWith("/")) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidNegotiationFormula"));
      return;
    }

    try {
      const roll = await new Roll(rollFormula).evaluate();
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: game.i18n.localize("mtt.configuration.negotiationFormula"),
      });
    } catch {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidNegotiationFormula"));
    }
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

  async #onMerchantConfigFieldChange(event) {
    const target = event.currentTarget;

    if (!this.#canModifyMerchant()) return;

    const field = target.dataset.mttMerchantConfigField;
    if (!field) return;

    if (["trade.buyPercent", "trade.sellPercent"].includes(field)) {
      const value = Number(target.value);

      if (!Number.isFinite(value) || value < 0) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidTradePercent"));
        target.value = foundry.utils.getProperty(this.actor.system, field) ?? 0;
        return;
      }

      await this.actor.update({
        [`system.${field}`]: value,
      });
      return;
    }

    await this.actor.update({
      [`system.${field}`]: target.value?.trim() ?? "",
    });
  }

  async #onWalletCurrencyChange(event) {
    const target = event.currentTarget;

    if (!this.#canModifyMerchant()) return;

    const currencyId = target.dataset.mttWalletCurrency;
    if (!currencyId) return;

    const amount = Number(target.value);

    if (!Number.isFinite(amount) || amount < 0) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidWalletAmount"));
      target.value = this.actor.system.wallet?.currencies?.[currencyId] ?? 0;
      return;
    }

    const currencies = foundry.utils.deepClone(this.actor.system.wallet?.currencies ?? {});
    currencies[currencyId] = amount;

    await this.actor.update({
      "system.wallet.currencies": currencies,
    });
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
    return entries.map((service) => {
      const basePriceValue =
        Number.isFinite(Number(service.priceValue)) && Number(service.priceValue) >= 0
          ? Number(service.priceValue)
          : MTT.SERVICE_DEFAULTS.priceValue;
      const displayPriceValue = this.#adjustPriceValue(basePriceValue);
      const priceCurrency = service.priceCurrency?.trim() ?? MTT.SERVICE_DEFAULTS.priceCurrency;

      return {
        id: service.id,
        name: service.name,
        description: service.description || "",
        priceValue: basePriceValue,
        basePriceValue,
        displayPriceValue,
        priceCurrency,
        hasPrice: Number.isFinite(displayPriceValue) && displayPriceValue >= 0,
        priceLabel: this.#formatPriceLabel(displayPriceValue, priceCurrency),
        displayPriceLabel: this.#formatPriceLabel(displayPriceValue, priceCurrency),
        basePriceLabel: this.#formatPriceLabel(basePriceValue, priceCurrency),
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
        category: service.category ?? "",
        systemCategoryKey: service.systemCategoryKey ?? "",
        systemCategoryLabel: service.systemCategoryLabel ?? "",
        systemCategoryPath: service.systemCategoryPath ?? "",
        hasSystemCategory: Boolean(service.systemCategoryKey || service.systemCategoryLabel),
      };
    });
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

  static async #onAddServiceToSession(event, target) {
    event.preventDefault();

    const service = this.#getServiceFromEvent(target);
    if (!service || service.isHidden) return;
    if (!this.#requireSelectedSessionForItemAddition()) return;

    const basePriceValue =
      Number.isFinite(Number(service.priceValue)) && Number(service.priceValue) >= 0
        ? Number(service.priceValue)
        : MTT.SERVICE_DEFAULTS.priceValue;
    const displayPriceValue = this.#adjustPriceValue(basePriceValue);
    const priceCurrency = service.priceCurrency?.trim() ?? MTT.SERVICE_DEFAULTS.priceCurrency;
    const quantity = service.quantity;
    const availableQuantity = Number.isFinite(Number(quantity)) && Number(quantity) >= 0 ? Number(quantity) : null;

    const dialogData = await this.#openSessionPreparationDialog({
      title: game.i18n.localize("mtt.sessions.dialog.serviceTitle"),
      name: service.name,
      priceLabel: this.#formatPriceLabel(displayPriceValue, priceCurrency),
      availableQuantity,
    });
    if (!dialogData) return;

    const requestedTotal =
      dialogData.quantity +
      this.#getSessionBuyerQuantity({
        type: "service",
        sourceId: service.id,
        unitPriceValue: displayPriceValue,
        priceCurrency,
      });

    if (Number.isFinite(availableQuantity) && availableQuantity >= 0 && requestedTotal > availableQuantity) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.notEnoughQuantity"));
      return;
    }

    const sessionItem = await this.#addSessionBuyerItem({
      type: "service",
      sourceId: service.id,
      name: service.name,
      img: service.sourceImg,
      quantity: dialogData.quantity,
      availableQuantity,
      hasLimitedQuantity: Number.isFinite(availableQuantity) && availableQuantity >= 0,
      unitPriceValue: displayPriceValue,
      priceCurrency,
      sourceLabel: game.i18n.localize("mtt.sessions.item.service"),
    });
    if (!sessionItem) return;

    this.render();
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
