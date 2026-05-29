import { MTT } from "../../config/constants.mjs";
import { getCurrencies } from "../../config/settings.mjs";
import {
  parsePriceValue,
  parseQuantityValue,
  normalizeCurrencyKey,
  formatCurrencyLabel,
  formatPriceLabel,
  escapeHTML,
  slugifyCategoryKey,
  formatAutomaticCategoryLabel,
  normalizeAutomaticCategoryValue,
  createCheckMessage,
  getItemDescription,
  getItemPrice,
  getItemCurrency,
  getModuleSetting,
  getConfiguredItemValue,
  getAllowedTypes,
  isItemTypeAllowed,
  getCategoryPaths,
  getCategoryLabelMap,
  prepareCurrencyOptions,
  htmlToPlainText,
  getMerchantSheetLockedState,
  getMerchantLimitedState,
} from "./merchant-utils.mjs";
import {
  renderMttDialogContent,
  openSessionPreparationDialog,
  openSellerItemDialog,
  openPreviewDialog,
  openPreviewErrorDialog,
  openSessionValidationDialog,
  openSessionExecutionErrorsDialog,
  openRefuseConfirmDialog,
} from "./merchant-dialogs.mjs";
import {
  getSellPercent,
  adjustPriceValue,
  prepareTrade,
  prepareWalletCurrencies,
  getReferenceCurrency,
  prepareItems,
  prepareServices,
  prepareProductCategories,
  getAutomaticItemCategory,
  getOrCreateAutomaticProductCategory,
  createProductFlags,
  addOrMergeProduct,
  moveProductToCategory,
  createServiceFromItem,
  getItemAvailableQuantity,
  prepareSellerItemDropData,
} from "./merchant-catalog.mjs";
import {
  normalizeSession,
  normalizeSessionItem,
  normalizeAccessClient,
  buildAccessClientFromActor,
  buildSessionData,
  getSessions,
  recalculateSessionItemTotal,
  setSessionItemQuantity,
  getSessionItemsForSide,
  removeSessionItemById,
  syncSessionItemAvailability,
  canAcceptSessionQuantity,
  prepareSessionTotals,
  prepareMoneyAdjustments,
  getSessionStatusNotice,
  prepareSessionCheckContext,
  prepareSessionContext,
  getStoredAccessClients,
  getAccessSessionBadgeIcon,
  getAccessSessionTooltipLabel,
  formatAccessClientTooltip,
  getBestSessionForClient,
  prepareAccessClients,
  getConfiguredCurrency,
  getMerchantWalletAmount,
  checkSessionTransaction,
  isMerchantSellerDropBlocked,
  buildExecutionPreview,
  buildSessionItemExecutionPlan,
  executeSessionItemTransfers,
  applyCurrencyTransferPlan,
  clearSessionAfterExecution,
} from "./merchant-trade.mjs";
import { requestMerchantSessionUpdate } from "./merchant-session-socket.mjs";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class MerchantSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  #activeTab = "products";
  #activeSessionId = null;
  #selectedClientActorUuid = "";
  #sessionCheckResult = null;
  #scrollPositions = {};

  static DEFAULT_OPTIONS = {
    classes: [MTT.CSS.SHEET, MTT.CSS.MERCHANT_SHEET, "mtt-merchant-window"],
    position: {
      width: 850,
      height: 600,
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
      toggleProductCategoryVisibility: MerchantSheet.#onToggleProductCategoryVisibility,
      createService: MerchantSheet.#onCreateService,
      deleteService: MerchantSheet.#onDeleteService,
      toggleServiceExpanded: MerchantSheet.#onToggleServiceExpanded,
      toggleCatalogItemVisibility: MerchantSheet.#onToggleCatalogItemVisibility,
      toggleServiceApproval: MerchantSheet.#onToggleServiceApproval,
      toggleOpen: MerchantSheet.#onToggleOpen,
      toggleLock: MerchantSheet.#onToggleLock,
      toggleProductSecret: MerchantSheet.#onToggleProductSecret,
      toggleProductCategory: MerchantSheet.#onToggleProductCategory,
      toggleProductFreePrice: MerchantSheet.#onToggleProductFreePrice,
      toggleServiceFreePrice: MerchantSheet.#onToggleServiceFreePrice,
      addProductToSession: MerchantSheet.#onAddProductToSession,
      addServiceToSession: MerchantSheet.#onAddServiceToSession,
      toggleClientAccess: MerchantSheet.#onToggleClientAccess,
      setSessionStatus: MerchantSheet.#onSetSessionStatus,
      checkSessionTransaction: MerchantSheet.#onCheckSessionTransaction,
      previewSessionExecution: MerchantSheet.#onPreviewSessionExecution,
      requestSessionDecision: MerchantSheet.#onRequestSessionDecision,
      submitSession: MerchantSheet.#onSubmitSession,
      unlockSubmittedSession: MerchantSheet.#onUnlockSubmittedSession,
      validateSessionTransaction: MerchantSheet.#onValidateSessionTransaction,
      refuseSessionTransaction: MerchantSheet.#onRefuseSessionTransaction,
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

    const isEditable = this.isEditable;
    const isLocked = getMerchantSheetLockedState(this.actor);
    const isUnlocked = !isLocked;
    const canEditMerchant = isEditable && isUnlocked;
    const isLimited = getMerchantLimitedState(this.actor);

    context.mtt = {
      css: MTT.CSS,
      activeTab: this.#activeTab,
      isEditable,
      isLocked,
      isUnlocked,
      canEditMerchant,
      isLimited,
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

    const sellPercent = this.#getSellPercent();
    context.items = prepareItems(this.actor, sellPercent, { includeHidden: isEditable });
    context.productCategories = prepareProductCategories(this.actor, context.items, { includeHidden: isEditable });
    context.services = prepareServices(this.actor, sellPercent, { includeHidden: isEditable });
    context.trade = prepareTrade(this.actor);
    context.wallet = this.actor.system.wallet ?? {};
    context.mtt.walletCurrencies = prepareWalletCurrencies(this.actor);
    context.mtt.headerCurrencies = context.mtt.walletCurrencies;
    context.mtt.hasHeaderCurrencies = context.mtt.headerCurrencies.length > 0;
    context.mtt.currencyOptions = prepareCurrencyOptions();
    context.mtt.access = this.#prepareAccessContext();
    context.mtt.session = this.#prepareSessionContext();

    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);

    this.element
      .querySelectorAll("[data-mtt-product-field]")
      .forEach((input) => input.addEventListener("change", (event) => this.#onProductFieldChange(event)));

    this.element.querySelectorAll("[data-mtt-merchant-field]").forEach((input) => {
      input.addEventListener("change", (event) => this.#onMerchantFieldChange(event));
      input.addEventListener("blur", (event) => this.#onMerchantFieldChange(event));
    });

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

    requestAnimationFrame(() => this.#restoreScrollPositions());
  }

  #saveScrollPositions() {
    this.#scrollPositions = {};

    const selectors = [".mtt-merchant-tab-content", ".mtt-merchant-session-sidebar"];

    for (const selector of selectors) {
      const element = this.element?.querySelector(selector);
      if (!element) continue;
      this.#scrollPositions[selector] = element.scrollTop;
    }
  }

  #restoreScrollPositions() {
    for (const [selector, scrollTop] of Object.entries(this.#scrollPositions ?? {})) {
      const element = this.element?.querySelector(selector);
      if (!element) continue;
      element.scrollTop = scrollTop;
    }
  }

  // ─── Access rail (DOM building, stays in sheet) ───────────────────────────

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
      if (client.canClickCard) {
        button.dataset.action = "toggleClientAccess";
      } else {
        button.classList.add("mtt-merchant-access-card-readonly");
      }
      button.dataset.clientActorUuid = client.actorUuid;
      button.dataset.clientUserId = client.userId;
      button.dataset.tooltip = client.tooltip;
      if (client.isSelected) button.classList.add("mtt-merchant-access-card-selected");

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

    if (accessContext.canSeeAccessDropZone) {
      const dropCard = document.createElement("div");
      dropCard.classList.add("mtt-merchant-access-drop-card");
      dropCard.dataset.mttClientDrop = "";
      dropCard.dataset.tooltip = game.i18n.localize("mtt.access.dropTooltip");

      const dropIcon = document.createElement("i");
      dropIcon.classList.add("fas", "fa-user-plus");
      dropCard.append(dropIcon);
      rail.append(dropCard);
    }

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

  // ─── Wrappers for imported dialog functions ───────────────────────────────

  async #renderMttDialogContent(options) {
    return renderMttDialogContent(options);
  }

  async #openSessionPreparationDialog(options) {
    return openSessionPreparationDialog(options);
  }

  async #openSellerItemDialog(options) {
    return openSellerItemDialog(options);
  }

  // ─── Wrappers for imported utility functions ──────────────────────────────

  #parsePriceValue(value) {
    return parsePriceValue(value);
  }
  #parseQuantityValue(value) {
    return parseQuantityValue(value);
  }
  #normalizeCurrencyKey(c) {
    return normalizeCurrencyKey(c);
  }
  #formatCurrencyLabel(c) {
    return formatCurrencyLabel(c);
  }
  #formatPriceLabel(v, c) {
    return formatPriceLabel(v, c);
  }
  #escapeHTML(v) {
    return escapeHTML(v);
  }
  #slugifyCategoryKey(v) {
    return slugifyCategoryKey(v);
  }
  #formatAutomaticCategoryLabel(v) {
    return formatAutomaticCategoryLabel(v);
  }
  #normalizeAutomaticCategoryValue(v) {
    return normalizeAutomaticCategoryValue(v);
  }
  #createCheckMessage(l, i, t, ic) {
    return createCheckMessage(l, i, t, ic);
  }
  #htmlToPlainText(v) {
    return htmlToPlainText(v);
  }
  #getItemDescription(item) {
    return getItemDescription(item);
  }
  #getItemPrice(item) {
    return getItemPrice(item);
  }
  #getItemCurrency(item) {
    return getItemCurrency(item);
  }
  #getModuleSetting(key) {
    return getModuleSetting(key);
  }
  #getConfiguredItemValue(item, key) {
    return getConfiguredItemValue(item, key);
  }
  #getAllowedTypes(key) {
    return getAllowedTypes(key);
  }
  #isItemTypeAllowed(item, key) {
    return isItemTypeAllowed(item, key);
  }
  #getCategoryPaths() {
    return getCategoryPaths();
  }
  #getCategoryLabelMap() {
    return getCategoryLabelMap();
  }

  // ─── Wrappers for imported catalog functions ──────────────────────────────

  #getSellPercent() {
    return getSellPercent(this.actor);
  }
  #adjustPriceValue(basePriceValue) {
    return adjustPriceValue(basePriceValue, this.#getSellPercent());
  }
  #getReferenceCurrency() {
    return getReferenceCurrency();
  }
  #getItemAvailableQuantity(item) {
    return getItemAvailableQuantity(item);
  }
  #getItemCurrencyHelper(item) {
    return getItemCurrency(item);
  }

  #getAutomaticItemCategory(item) {
    return getAutomaticItemCategory(item);
  }

  async #getOrCreateAutomaticProductCategory(automaticCategory) {
    return getOrCreateAutomaticProductCategory(this.actor, automaticCategory);
  }

  #createProductFlags(itemData) {
    return createProductFlags(itemData);
  }

  async #addOrMergeProduct(itemData, categoryValue, automaticCategory, sourceUuid = "") {
    return addOrMergeProduct(this.actor, itemData, categoryValue, automaticCategory, sourceUuid);
  }

  async #moveProductToCategory(itemId, categoryValue) {
    await moveProductToCategory(this.actor, itemId, categoryValue);
    this.render();
  }

  async #createServiceFromItem(item) {
    await createServiceFromItem(this.actor, item);
    this.render();
  }

  #prepareSellerItemDropData(item) {
    return prepareSellerItemDropData(this.actor, item);
  }

  // ─── Wrappers for imported trade functions ────────────────────────────────

  #normalizeSession(session) {
    return normalizeSession(session);
  }
  #normalizeSessionItem(item) {
    return normalizeSessionItem(item);
  }
  #normalizeAccessClient(client) {
    return normalizeAccessClient(client);
  }
  #buildAccessClientFromActor(actor, opts) {
    return buildAccessClientFromActor(actor, opts);
  }
  #buildSessionData(client) {
    return buildSessionData(client);
  }
  #getSessions() {
    return getSessions(this.actor);
  }
  #getStoredAccessClients() {
    return getStoredAccessClients(this.actor);
  }
  #recalculateSessionItemTotal(item) {
    return recalculateSessionItemTotal(item);
  }
  #setSessionItemQuantity(item, quantity) {
    return setSessionItemQuantity(item, quantity);
  }
  #getSessionItemsForSide(session, side) {
    return getSessionItemsForSide(session, side);
  }
  #removeSessionItemById(session, itemId, side) {
    return removeSessionItemById(session, itemId, side);
  }
  #syncSessionItemAvailability(item) {
    return syncSessionItemAvailability(this.actor, item);
  }
  #canAcceptSessionQuantity(item, quantity) {
    return canAcceptSessionQuantity(this.actor, item, quantity);
  }
  #getAccessSessionBadgeIcon(status) {
    return getAccessSessionBadgeIcon(status);
  }
  #getAccessSessionTooltipLabel(status) {
    return getAccessSessionTooltipLabel(status);
  }
  #getBestSessionForClient(actorUuid) {
    return getBestSessionForClient(this.actor, actorUuid);
  }
  #getConfiguredCurrency(currency) {
    return getConfiguredCurrency(currency);
  }
  #getMerchantWalletAmount(currency) {
    return getMerchantWalletAmount(this.actor, currency);
  }

  #prepareAccessClients() {
    return prepareAccessClients(this.actor, {
      selectedSession: this.#getSelectedSession(),
      selectedClientActorUuid: this.#selectedClientActorUuid,
      isEditable: this.isEditable,
    });
  }

  #prepareSessionContext() {
    const accessClients = this.#prepareAccessClients();
    return prepareSessionContext(this.actor, {
      session: this.#getActiveSession(),
      selectedClient: this.#getSelectedClient(),
      sessionCheckResult: this.#sessionCheckResult,
      sellPercent: this.#getSellPercent(),
      accessClients,
    });
  }

  async #checkSessionTransaction(session) {
    const preparedSession = this.#prepareSessionContext();
    return checkSessionTransaction(this.actor, session, preparedSession);
  }

  // ─── Session field change handler ─────────────────────────────────────────

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
          side === "seller"
            ? "mtt.notifications.invalidSellerItemQuantity"
            : "mtt.notifications.invalidSessionQuantity",
        ),
      );
      input.value = item.quantity;
      return;
    }

    if (!this.#canAcceptSessionQuantity(item, requested)) {
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

  // ─── Document drop handlers ───────────────────────────────────────────────

  _canDragDrop(selector) {
    return super._canDragDrop(selector);
  }

  async _onDropDocument(event, document) {
    if (!this.isEditable) return;

    if (document.documentName !== "Item") {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.onlyItemsCanBeDropped"));
      return;
    }

    if (!isItemTypeAllowed(document, "allowedProductTypes")) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.productTypeNotAllowed"));
      return;
    }

    this.#saveScrollPositions();

    const automaticCategory = getAutomaticItemCategory(document);
    const productCategoryValue = await getOrCreateAutomaticProductCategory(this.actor, automaticCategory);

    await addOrMergeProduct(this.actor, document, productCategoryValue, automaticCategory, document.uuid);
  }

  // ─── Item/service helpers ─────────────────────────────────────────────────

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

  // ─── Product drag/drop handlers ───────────────────────────────────────────

  #onProductDragStart(event) {
    const target = event.currentTarget;
    const itemId = target.dataset.mttProductId;
    if (!itemId || !this.isEditable) return;

    const item = this.actor.items.get(itemId);
    const sourceCategory = item ? (item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT)?.category ?? "") : "";

    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({ type: "mtt.product", itemId, actorUuid: this.actor.uuid, sourceCategory }),
    );
    event.dataTransfer.effectAllowed = "move";
  }

  #onCategoryDragOver(event) {
    if (!this.isEditable) return;
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

    if (payload.actorUuid && payload.actorUuid !== this.actor.uuid) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidProductDrop"));
      return;
    }

    if (!this.isEditable) return;

    event.preventDefault();
    event.stopPropagation();

    this.#saveScrollPositions();
    await this.#moveProductToCategory(payload.itemId, categoryValue);
  }

  // ─── Service drag/drop handlers ───────────────────────────────────────────

  #onServiceDragOver(event) {
    if (!this.isEditable) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  async #onServiceDrop(event) {
    if (!this.isEditable) return;

    event.preventDefault();
    event.stopPropagation();

    const dragData = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
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
        doc = game.items.get(dragData.id) ?? null;
      }
    } catch {
      // ignore
    }

    if (!doc || doc.documentName !== "Item") {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.onlyItemsCanCreateServices"));
      return;
    }

    if (!isItemTypeAllowed(doc, "allowedServiceTypes")) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.serviceTypeNotAllowed"));
      return;
    }

    this.#saveScrollPositions();
    await this.#createServiceFromItem(doc);
  }

  // ─── Session seller drag/drop ─────────────────────────────────────────────

  #onSessionSellerDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  async #onSessionSellerDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    try {
      const rawPayload = event.dataTransfer.getData("application/json");
      if (rawPayload) {
        const payload = JSON.parse(rawPayload);
        if (isMerchantSellerDropBlocked(payload, this.actor.uuid)) {
          ui.notifications.warn(game.i18n.localize("mtt.notifications.cannotGiveMerchantProduct"));
          return;
        }
      }
    } catch {
      // not a JSON payload, continue
    }

    if (!this.#requireSelectedSessionForItemAddition()) return;

    const item = await this.#getDroppedItemDocument(event);
    if (!item) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.onlyItemsCanBeSold"));
      return;
    }

    // Refuse items belonging to the merchant actor
    if (item.parent?.uuid === this.actor.uuid || item.parent?.id === this.actor.id) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.cannotGiveMerchantProduct"));
      return;
    }

    const session = this.#getSessionForAddingItem();
    if (!session) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.selectSessionBeforeAction"));
      return;
    }

    const sellerData = prepareSellerItemDropData(this.actor, item);
    const dialogData = await this.#openSellerItemDialog({
      ...sellerData,
      availableQuantity: sellerData.availableQuantity,
    });
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

  // ─── Client drag/drop and context menu ───────────────────────────────────

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

    await this.#upsertAccessClient(buildAccessClientFromActor(actor, { isAuthorized: true }));
    this.render();
  }

  async #onClientContextMenu(event, target) {
    event.preventDefault();
    event.stopPropagation();

    const permLevel = this.actor.getUserLevel?.(game.user) ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE;
    const canManage = game.user.isGM || permLevel >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
    if (!canManage) return;

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

  // ─── Dropped document helpers ─────────────────────────────────────────────

  async #getDroppedActorDocument(event) {
    const dragData = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
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

  async #getDroppedItemDocument(event) {
    const dragData = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
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

  // ─── Category CRUD ────────────────────────────────────────────────────────

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

  static async #onToggleProductCategory(event, target) {
    event.preventDefault();

    if (!this.isEditable) return;

    const categoryValue = target.dataset.category ?? "";
    const collapsedCategories = foundry.utils.deepClone(this.actor.system.catalog.collapsedCategories ?? {});
    collapsedCategories[categoryValue] = !Boolean(collapsedCategories[categoryValue]);

    this.#saveScrollPositions();
    await this.actor.update({
      "system.catalog.collapsedCategories": collapsedCategories,
    });

    this.render();
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

    this.#saveScrollPositions();
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
    const hiddenCategories = foundry.utils.deepClone(this.actor.system.catalog.hiddenCategories ?? {});
    delete collapsedCategories[categoryId];
    delete hiddenCategories[categoryId];

    this.#saveScrollPositions();
    await this.actor.update({
      "system.catalog.productCategories": updatedCategories,
      "system.catalog.collapsedCategories": collapsedCategories,
      "system.catalog.hiddenCategories": hiddenCategories,
    });

    this.render();
  }

  static async #onToggleProductCategoryVisibility(event, target) {
    event.preventDefault();

    if (!this.isEditable) return;

    const categoryValue = target.dataset.categoryId ?? "";
    const isSystemCategory = target.dataset.systemCategory === "true";
    const categories = this.actor.system.catalog?.productCategories ?? [];
    const categoryExists = isSystemCategory || categories.some((category) => category.id === categoryValue);
    if (!categoryExists) return;

    const hiddenCategories = foundry.utils.deepClone(this.actor.system.catalog?.hiddenCategories ?? {});
    hiddenCategories[categoryValue] = !Boolean(hiddenCategories[categoryValue]);

    this.#saveScrollPositions();
    await this.actor.update({
      "system.catalog.hiddenCategories": hiddenCategories,
    });

    this.render();
  }

  // ─── Access context ───────────────────────────────────────────────────────

  #userControlsActor(actorUuid) {
    if (game.user.isGM) return true;
    const normalizedUuid = String(actorUuid ?? "").trim();
    if (!normalizedUuid) return false;
    if (game.user.character?.uuid === normalizedUuid) return true;
    const actor = game.actors.find((a) => a.uuid === normalizedUuid);
    if (!actor) return false;
    return actor.testUserPermission(game.user, "OWNER");
  }

  #userCanViewSession(session) {
    if (!session) return false;
    if (this.isEditable) return true;
    return this.#userControlsActor(session.actorUuid);
  }

  #getPreferredPlayerSession(sessions) {
    const userCharacterUuid = game.user?.character?.uuid ?? "";

    if (userCharacterUuid) {
      const characterSession = sessions.find((session) => session.actorUuid === userCharacterUuid);
      if (characterSession && this.#userControlsActor(characterSession.actorUuid)) return characterSession;
    }

    return sessions.find((session) => this.#userControlsActor(session.actorUuid)) ?? null;
  }

  #prepareAccessContext() {
    const permLevel = this.actor.getUserLevel?.(game.user) ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE;
    const isGM = Boolean(game.user.isGM);
    const isOwner = isGM || permLevel >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
    const isObserver = !isOwner && permLevel >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER;
    const isLimited = !isOwner && !isObserver && permLevel >= CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED;
    const canManageAccessRail = isOwner;
    const canSeeAccessDropZone = canManageAccessRail;

    const rawClients = this.#prepareAccessClients();
    const clients = rawClients
      .map((client) => {
        const isOwnClientCard = this.#userControlsActor(client.actorUuid);
        const canSeeCard = canManageAccessRail || isObserver || (isLimited && isOwnClientCard);
        const canClickCard = canManageAccessRail || isOwnClientCard;
        return { ...client, isOwnClientCard, canSeeCard, canClickCard };
      })
      .filter((client) => client.canSeeCard);

    return {
      clients,
      hasClients: clients.length > 0,
      canManage: canManageAccessRail,
      canSeeAccessDropZone,
    };
  }

  #getAccessClientForSession(session) {
    const actorUuid = String(session?.actorUuid ?? "").trim();
    if (!actorUuid) return null;

    const client = this.#prepareAccessClients().find((entry) => entry.actorUuid === actorUuid);
    if (client) return client;

    return normalizeAccessClient({
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

  async #upsertAccessClient(client) {
    const normalizedClient = normalizeAccessClient(client);
    if (!normalizedClient.actorUuid) return null;

    const clients = getStoredAccessClients(this.actor);
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

  async #setClientAuthorization(client, isAuthorized, { removeOpenSessions = false } = {}) {
    const normalizedClient = normalizeAccessClient({
      ...client,
      isAuthorized,
    });
    if (!normalizedClient.actorUuid) return;

    const clients = getStoredAccessClients(this.actor);
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
      updateData["system.sessions.entries"] = this.#getSessions().filter(
        (session) => !removedSessionIds.has(session.id),
      );
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

    const clients = getStoredAccessClients(this.actor).filter((entry) => entry.actorUuid !== client.actorUuid);
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

  // ─── Session state management ─────────────────────────────────────────────

  #getOpenSessionsForClient(actorUuid) {
    const normalizedActorUuid = String(actorUuid ?? "").trim();
    if (!normalizedActorUuid) return [];

    return this.#getSessions().filter(
      (session) =>
        session.actorUuid === normalizedActorUuid && ["active", "pending", "submitted"].includes(session.status),
    );
  }

  #getSelectedSession() {
    if (!this.#activeSessionId) return null;

    const session = this.#getSessions().find((entry) => entry.id === this.#activeSessionId);
    if (!session) {
      this.#activeSessionId = null;
      return null;
    }

    if (!this.#userCanViewSession(session)) {
      this.#activeSessionId = null;
      this.#selectedClientActorUuid = "";
      return null;
    }

    return normalizeSession(session);
  }

  #getSelectedClient() {
    if (!this.#selectedClientActorUuid) return null;

    return this.#getAccessClientCandidate(this.#selectedClientActorUuid);
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
    return normalizeSession(session);
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
          (session) =>
            session.actorUuid === normalizedActorUuid && ["active", "pending", "submitted"].includes(session.status),
        );
      }) ?? null
    );
  }

  #isMerchantActor(actor) {
    return actor?.type === "merchant" || actor?.type === MTT.ACTOR_TYPES.MERCHANT;
  }

  #getActiveSession() {
    const sessions = this.#getSessions();

    if (this.#activeSessionId) {
      const selectedSession = sessions.find((s) => s.id === this.#activeSessionId);
      if (selectedSession && this.#userCanViewSession(selectedSession)) return normalizeSession(selectedSession);
      this.#activeSessionId = null;
      this.#selectedClientActorUuid = "";
    }

    if (this.#selectedClientActorUuid) {
      const selectedClientSession = sessions.find((session) => session.actorUuid === this.#selectedClientActorUuid);
      if (selectedClientSession && this.#userCanViewSession(selectedClientSession)) {
        return this.#selectSession(selectedClientSession.id);
      }

      if (!this.isEditable) this.#selectedClientActorUuid = "";
      if (this.isEditable) return null;
    }

    if (!this.isEditable) {
      const preferredSession = this.#getPreferredPlayerSession(sessions);
      if (preferredSession) {
        return this.#selectSession(preferredSession.id);
      }

      this.#activeSessionId = null;
      this.#selectedClientActorUuid = "";
      return null;
    }

    const activeSession = sessions.find((s) => s.status === "active");
    if (activeSession) {
      this.#activeSessionId = activeSession.id;
      this.#selectedClientActorUuid = activeSession.actorUuid ?? "";
      return normalizeSession(activeSession);
    }

    const firstSession = sessions[0];
    if (firstSession) {
      this.#activeSessionId = firstSession.id;
      this.#selectedClientActorUuid = firstSession.actorUuid ?? "";
      return normalizeSession(firstSession);
    }

    return null;
  }

  #getOrCreateActiveSession() {
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
    if (this.#getSessionForAddingItem()) return true;

    ui.notifications.warn(game.i18n.localize("mtt.notifications.selectClientBeforeAdding"));
    return false;
  }

  // ─── Session quantity helpers ─────────────────────────────────────────────

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

  // ─── Session item CRUD ────────────────────────────────────────────────────

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
    isFreePrice = false,
    minimumPriceValue = null,
  }) {
    const session = await this.#getOrCreateActiveSession();
    if (!session) return null;

    const normalizedQuantity = Number(quantity);
    const normalizedUnitPrice = Number(unitPriceValue);
    const normalizedCurrency = String(priceCurrency ?? "").trim();
    const normalizedAvailableQuantity = Number(availableQuantity);
    const hasLimitedStock =
      Boolean(hasLimitedQuantity) && Number.isFinite(normalizedAvailableQuantity) && normalizedAvailableQuantity >= 0;

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
      existingItem.availableQuantity = hasLimitedStock ? normalizedAvailableQuantity : null;
      existingItem.hasLimitedQuantity = hasLimitedStock;
      if (!this.#canAcceptSessionQuantity(existingItem, existingItem.quantity + normalizedQuantity)) return null;

      existingItem.quantity = Number((existingItem.quantity + normalizedQuantity).toFixed(2));
      recalculateSessionItemTotal(existingItem);
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
      availableQuantity: hasLimitedStock ? normalizedAvailableQuantity : null,
      hasLimitedQuantity: hasLimitedStock,
      unitPriceValue: normalizedUnitPrice,
      priceCurrency: normalizedCurrency,
      totalPriceValue: Number((normalizedQuantity * normalizedUnitPrice).toFixed(2)),
      sourceLabel,
      proposedUnitPriceValue:
        proposedUnitPriceValue !== "" && Number.isFinite(Number(proposedUnitPriceValue))
          ? Number(proposedUnitPriceValue)
          : null,
      isFreePrice: Boolean(isFreePrice),
      minimumPriceValue:
        minimumPriceValue !== null && Number.isFinite(Number(minimumPriceValue)) && Number(minimumPriceValue) >= 0
          ? Number(minimumPriceValue)
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
    const hasLimitedStock =
      Boolean(hasLimitedQuantity) && Number.isFinite(normalizedAvailableQuantity) && normalizedAvailableQuantity >= 0;

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
      existingItem.availableQuantity = hasLimitedStock ? normalizedAvailableQuantity : null;
      existingItem.hasLimitedQuantity = hasLimitedStock;
      if (!this.#canAcceptSessionQuantity(existingItem, existingItem.quantity + normalizedQuantity)) return null;

      existingItem.quantity = Number((existingItem.quantity + normalizedQuantity).toFixed(2));
      recalculateSessionItemTotal(existingItem);
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
      availableQuantity: hasLimitedStock ? normalizedAvailableQuantity : null,
      hasLimitedQuantity: hasLimitedStock,
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

  async #createSessionForClient(client) {
    if (!client?.actorUuid || !client.isAuthorized) {
      ui.notifications.warn(game.i18n.localize("mtt.access.notAuthorizedForTrade"));
      return null;
    }

    const existingSession = getBestSessionForClient(this.actor, client.actorUuid);
    if (existingSession) {
      this.#selectSession(existingSession.id);
      return existingSession;
    }

    const externalMerchant = this.#findExternalOpenSessionForClient(client.actorUuid);
    if (externalMerchant) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.clientAlreadyTrading"));
      return null;
    }

    const sessions = this.#getSessions().map((session) => normalizeSession(session));
    const session = buildSessionData(client);
    sessions.push(session);
    this.#activeSessionId = session.id;
    this.#selectedClientActorUuid = client.actorUuid;
    this.#sessionCheckResult = null;

    await this.#updateSessionEntries(sessions);

    return session;
  }

  async #saveSession(session) {
    this.#saveScrollPositions();
    this.#sessionCheckResult = null;

    const normalizedSession = normalizeSession(session);
    normalizedSession.updatedAt = new Date().toISOString();
    normalizedSession.buyerItems.forEach((item) => recalculateSessionItemTotal(item));
    normalizedSession.sellerItems.forEach((item) => recalculateSessionItemTotal(item));

    const sessions = this.#getSessions().map((entry) => normalizeSession(entry));
    const index = sessions.findIndex((entry) => entry.id === normalizedSession.id);

    if (index === -1) {
      sessions.push(normalizedSession);
    } else {
      sessions[index] = normalizedSession;
    }

    this.#activeSessionId = normalizedSession.id;
    this.#selectedClientActorUuid = normalizedSession.actorUuid ?? "";

    await this.#updateSessionEntries(sessions);
  }

  async #updateSessionEntries(sessions) {
    const updateData = {
      "system.sessions.entries": sessions,
    };

    const permissionLevel = this.actor.getUserLevel(game.user) ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE;
    const canUpdateDirectly =
      game.user?.isGM ||
      this.actor.testUserPermission?.(game.user, "OWNER") ||
      permissionLevel >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;

    if (canUpdateDirectly) {
      await this.actor.update(updateData);
      return;
    }

    const response = await requestMerchantSessionUpdate(this.actor, updateData);
    if (response?.updateData && this.actor.updateSource) this.actor.updateSource(response.updateData);
  }

  // ─── Misc helpers ─────────────────────────────────────────────────────────

  #canModifyMerchant() {
    if (!this.isEditable) return false;

    if (getMerchantSheetLockedState(this.actor)) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.sheetLocked"));
      return false;
    }

    return true;
  }

  // ─── Action handlers ──────────────────────────────────────────────────────

  static async #onCreateItem(event, target) {
    event.preventDefault();

    if (!this.#canModifyMerchant()) return;

    const type = target.dataset.type || "loot";

    const itemData = createProductFlags({
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
    const displayPriceValue = adjustPriceValue(basePriceValue, getSellPercent(this.actor));
    const priceCurrency = product.priceCurrency?.trim() ?? MTT.PRODUCT_DEFAULTS.priceCurrency;
    const quantity = product.quantity ?? MTT.PRODUCT_DEFAULTS.quantity;
    const availableQuantity = Number.isFinite(Number(quantity)) && Number(quantity) >= 0 ? Number(quantity) : null;
    const hasFreePrice = Boolean(product.hasFreePrice);
    const minimumPriceValue =
      Number.isFinite(Number(product.minimumPriceValue)) && Number(product.minimumPriceValue) >= 0
        ? Number(product.minimumPriceValue)
        : 0;

    const referenceCurrency = getReferenceCurrency();
    const referenceCurrencyLabel = referenceCurrency
      ? String(referenceCurrency.abbreviation ?? referenceCurrency.name ?? "").trim()
      : "";

    const sessionCurrency = hasFreePrice ? referenceCurrencyLabel || priceCurrency : priceCurrency;

    const dialogData = await openSessionPreparationDialog({
      title: game.i18n.localize("mtt.sessions.dialog.productTitle"),
      name: displayName,
      priceLabel: hasFreePrice
        ? game.i18n.localize("mtt.price.freePrice")
        : formatPriceLabel(displayPriceValue, priceCurrency),
      availableQuantity,
      includeProposedPrice: !hasFreePrice,
      hasFreePrice,
      referenceCurrencyLabel,
    });
    if (!dialogData) return;

    const unitPriceValue = hasFreePrice ? Number(dialogData.proposedPrice) : displayPriceValue;

    const requestedTotal =
      dialogData.quantity +
      this.#getSessionBuyerQuantity({
        type: "product",
        sourceId: item.id,
        unitPriceValue,
        priceCurrency: sessionCurrency,
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
      unitPriceValue,
      priceCurrency: sessionCurrency,
      sourceLabel: game.i18n.localize("mtt.sessions.item.product"),
      proposedUnitPriceValue: hasFreePrice ? unitPriceValue : (dialogData.proposedPrice ?? ""),
      isFreePrice: hasFreePrice,
      minimumPriceValue: hasFreePrice ? minimumPriceValue : null,
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

    if (!removeSessionItemById(session, itemId, side)) return;

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

    const item = getSessionItemsForSide(session, side).find((it) => it.id === itemId);
    if (!item) return;

    if (!this.#canAcceptSessionQuantity(item, item.quantity + 1)) {
      ui.notifications.warn(
        game.i18n.localize(
          side === "seller" ? "mtt.notifications.notEnoughSellerItemQuantity" : "mtt.notifications.notEnoughQuantity",
        ),
      );
      return;
    }

    setSessionItemQuantity(item, item.quantity + 1);
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

    const item = getSessionItemsForSide(session, side).find((it) => it.id === itemId);
    if (!item) return;

    const nextQuantity = Number(item.quantity) - 1;
    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
      removeSessionItemById(session, itemId, side);
      await this.#saveSession(session);
      this.render();
      return;
    }

    setSessionItemQuantity(item, nextQuantity);
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

    const actorUuid = target.dataset.clientActorUuid;
    const permLevel = this.actor.getUserLevel?.(game.user) ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE;
    const canManage = game.user.isGM || permLevel >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
    if (!canManage && !this.#userControlsActor(actorUuid)) return;

    const client = this.#getAccessClientCandidate(actorUuid);
    if (!client) return;

    if (!client.isAuthorized) {
      if (!this.isEditable) return;

      if (
        !getBestSessionForClient(this.actor, client.actorUuid) &&
        this.#findExternalOpenSessionForClient(client.actorUuid)
      ) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.clientAlreadyTrading"));
        return;
      }

      await this.#setClientAuthorization(client, true);
      const session = await this.#createSessionForClient({
        ...client,
        isAuthorized: true,
      });
      if (!session) return;

      this.render();
      return;
    }

    this.#selectedClientActorUuid = client.actorUuid;
    const session = getBestSessionForClient(this.actor, client.actorUuid);
    if (session) {
      this.#selectSession(session.id);
      this.render();
      return;
    }

    if (!this.isEditable) return;

    const repairedSession = await this.#createSessionForClient(client);
    if (!repairedSession) return;

    this.render();
  }

  static async #onSetSessionStatus(event, target) {
    event.preventDefault();

    const session = this.#getActiveSession();
    if (!session) return;

    const status = target.dataset.sessionStatus;
    if (!["active", "pending", "submitted", "validated", "refused"].includes(status)) return;

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

  static async #onPreviewSessionExecution(event) {
    event.preventDefault();

    const session = this.#getActiveSession();
    if (!session) return;

    const preview = await buildExecutionPreview(this.actor, session);

    this.#sessionCheckResult = {
      checked: true,
      canProceed: preview.canExecute,
      infos: [],
      warnings: preview.warnings.map((w, i) => ({
        id: `preview-warn-${i}`,
        level: "warning",
        text: w,
        icon: "fa-triangle-exclamation",
      })),
      errors: preview.errors.map((e, i) => ({
        id: `preview-err-${i}`,
        level: "error",
        text: e,
        icon: "fa-circle-xmark",
      })),
    };

    if (!preview.canExecute) {
      this.render();
      await openPreviewErrorDialog(preview);
      return;
    }

    this.render();
    await openPreviewDialog(preview);
  }

  static async #onRequestSessionDecision(event) {
    event.preventDefault();

    const session = this.#getActiveSession();
    if (!session) return;

    session.status = "pending";
    await this.#saveSession(session);
    this.render();
  }

  static async #onSubmitSession(event) {
    event.preventDefault();

    const session = this.#getActiveSession();
    if (!session) return;

    session.status = "submitted";
    session.isSubmitted = true;
    await this.#saveSession(session);
    this.render();
  }

  static async #onUnlockSubmittedSession(event) {
    event.preventDefault();

    const session = this.#getActiveSession();
    if (!session) return;

    session.status = "active";
    session.isSubmitted = false;
    await this.#saveSession(session);
    this.render();
  }

  static async #onValidateSessionTransaction(event) {
    event.preventDefault();

    if (!(game.user?.isGM ?? false)) return;

    const session = this.#getActiveSession();
    if (!session) return;

    const preview = await buildSessionItemExecutionPlan(this.actor, session);

    this.#sessionCheckResult = {
      checked: true,
      canProceed: preview.canExecute,
      infos: [],
      warnings: preview.warnings.map((w, i) => ({
        id: `preview-warn-${i}`,
        level: "warning",
        text: w,
        icon: "fa-triangle-exclamation",
      })),
      errors: preview.errors.map((e, i) => ({
        id: `preview-err-${i}`,
        level: "error",
        text: e,
        icon: "fa-circle-xmark",
      })),
    };

    if (!preview.canExecute) {
      this.render();
      await openSessionExecutionErrorsDialog(preview);
      return;
    }

    const confirmed = await openSessionValidationDialog(preview);
    if (!confirmed) return;

    try {
      const executionPlan = await buildSessionItemExecutionPlan(this.actor, session);
      if (!executionPlan.canExecute) {
        this.#sessionCheckResult = {
          checked: true,
          canProceed: false,
          infos: [],
          warnings: executionPlan.warnings.map((w, i) => ({
            id: `execution-warn-${i}`,
            level: "warning",
            text: w,
            icon: "fa-triangle-exclamation",
          })),
          errors: executionPlan.errors.map((e, i) => ({
            id: `execution-err-${i}`,
            level: "error",
            text: e,
            icon: "fa-circle-xmark",
          })),
        };
        await openSessionExecutionErrorsDialog(executionPlan);
        this.render();
        return;
      }

      await executeSessionItemTransfers(this.actor, executionPlan);
      if (executionPlan.currencyTransferPlan?.canExecute && !executionPlan.currencyTransferPlan?.noTransferNeeded) {
        await applyCurrencyTransferPlan(this.actor, executionPlan.clientActor, executionPlan.currencyTransferPlan);
      }
      clearSessionAfterExecution(session);
      await this.#saveSession(session);
      this.#sessionCheckResult = null;
      this.render();
    } catch (error) {
      const failurePreview = {
        ...preview,
        canExecute: false,
        errors: [
          ...(preview.errors ?? []),
          error?.message || game.i18n.localize("mtt.sessions.execution.executionErrorTitle"),
        ],
      };
      await openSessionExecutionErrorsDialog(failurePreview);
      this.render();
    }
  }

  static async #onRefuseSessionTransaction(event) {
    event.preventDefault();

    if (!(game.user?.isGM ?? false)) return;

    const session = this.#getActiveSession();
    if (!session) return;

    const confirmed = await openRefuseConfirmDialog();
    if (!confirmed) return;

    clearSessionAfterExecution(session);
    await this.#saveSession(session);
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

    const isLocked = getMerchantSheetLockedState(this.actor);

    if (!isLocked) {
      await this.#saveMerchantTextFieldsFromDom();
    }

    await this.actor.update({
      "system.sheet.isLocked": !isLocked,
    });
  }

  static async #onToggleProductSecret(event, target) {
    event.preventDefault();

    if (!this.isEditable) return;

    const item = this.#getItemFromEvent(target);
    if (!item) return;

    const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};
    const isSecretExpanded = Boolean(product.isSecretExpanded);

    this.#saveScrollPositions();
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

  // ─── Field change handlers ────────────────────────────────────────────────

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
        isCommerciallyModified: true,
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
        isCommerciallyModified: true,
      });
      return;
    }

    if (field === "priceCurrency") {
      const selectedValue = target.value?.trim() ?? "";
      const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};

      if (selectedValue === "__freePrice") {
        await item.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, {
          ...product,
          hasFreePrice: true,
          isCommerciallyModified: true,
        });
      } else {
        await item.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, {
          ...product,
          priceCurrency: selectedValue,
          hasFreePrice: false,
          isCommerciallyModified: true,
        });
      }
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

    if (field === "minimumPriceValue") {
      const rawValue = Number(target.value);

      if (!Number.isFinite(rawValue) || rawValue < 0) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidPrice"));
        target.value =
          item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT)?.minimumPriceValue ?? MTT.PRODUCT_DEFAULTS.minimumPriceValue;
        return;
      }

      const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};
      await item.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, {
        ...product,
        minimumPriceValue: rawValue,
        isCommerciallyModified: true,
      });
    }
  }

  async #onMerchantFieldChange(event) {
    const target = event.currentTarget;

    if (!this.#canModifyMerchant()) return;

    const updateData = this.#getMerchantFieldUpdateData(target);
    if (!updateData) return;

    await this.actor.update(updateData);
  }

  #getMerchantFieldUpdateData(target) {
    const field = target?.dataset?.mttMerchantField;
    if (!field) return null;

    if (field === "name") {
      const name = target.value?.trim() ?? "";
      if (!name || name === this.actor.name) return null;

      return { name };
    }

    if (field === "manager.displayName") {
      const displayName = target.value?.trim() ?? "";
      const currentDisplayName = this.actor.system.manager?.displayName ?? "";
      if (displayName === currentDisplayName) return null;

      return {
        "system.manager.mode": "text",
        "system.manager.displayName": displayName,
      };
    }

    return null;
  }

  async #saveMerchantTextFieldsFromDom() {
    if (!this.isEditable || getMerchantSheetLockedState(this.actor)) return;

    const updateData = {};

    this.element.querySelectorAll("[data-mtt-merchant-field]").forEach((input) => {
      const fieldUpdateData = this.#getMerchantFieldUpdateData(input);
      if (!fieldUpdateData) return;
      Object.assign(updateData, fieldUpdateData);
    });

    if (Object.keys(updateData).length > 0) {
      await this.actor.update(updateData);
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

  // ─── Free price toggle handlers ───────────────────────────────────────────

  static async #onToggleProductFreePrice(event, target) {
    event.preventDefault();

    if (!this.#canModifyMerchant()) return;

    const item = this.#getItemFromEvent(target);
    if (!item) return;

    const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};
    this.#saveScrollPositions();
    await item.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, {
      ...product,
      hasFreePrice: !product.hasFreePrice,
      isCommerciallyModified: true,
    });

    this.render();
  }

  static async #onToggleServiceFreePrice(event, target) {
    event.preventDefault();

    if (!this.#canModifyMerchant()) return;

    const serviceId = target.closest("[data-service-id]")?.dataset.serviceId;
    if (!serviceId) return;

    const entries = foundry.utils.deepClone(this.actor.system.services?.entries ?? []);
    const serviceIndex = entries.findIndex((s) => s.id === serviceId);
    if (serviceIndex === -1) return;

    entries[serviceIndex].hasFreePrice = !entries[serviceIndex].hasFreePrice;
    entries[serviceIndex].isCommerciallyModified = true;

    this.#saveScrollPositions();
    await this.actor.update({ "system.services.entries": entries });
    this.render();
  }

  // ─── Service CRUD ─────────────────────────────────────────────────────────

  static async #onCreateService(event, target) {
    event.preventDefault();

    if (!this.isEditable || getMerchantSheetLockedState(this.actor)) {
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
    const displayPriceValue = adjustPriceValue(basePriceValue, getSellPercent(this.actor));
    const priceCurrency = service.priceCurrency?.trim() ?? MTT.SERVICE_DEFAULTS.priceCurrency;
    const quantity = service.quantity;
    const availableQuantity = Number.isFinite(Number(quantity)) && Number(quantity) >= 0 ? Number(quantity) : null;
    const hasFreePrice = Boolean(service.hasFreePrice);
    const minimumPriceValue =
      Number.isFinite(Number(service.minimumPriceValue)) && Number(service.minimumPriceValue) >= 0
        ? Number(service.minimumPriceValue)
        : 0;

    const referenceCurrency = getReferenceCurrency();
    const referenceCurrencyLabel = referenceCurrency
      ? String(referenceCurrency.abbreviation ?? referenceCurrency.name ?? "").trim()
      : "";

    const sessionCurrency = hasFreePrice ? referenceCurrencyLabel || priceCurrency : priceCurrency;

    const dialogData = await openSessionPreparationDialog({
      title: game.i18n.localize("mtt.sessions.dialog.serviceTitle"),
      name: service.name,
      priceLabel: hasFreePrice
        ? game.i18n.localize("mtt.price.freePrice")
        : formatPriceLabel(displayPriceValue, priceCurrency),
      availableQuantity,
      hasFreePrice,
      referenceCurrencyLabel,
    });
    if (!dialogData) return;

    const unitPriceValue = hasFreePrice ? Number(dialogData.proposedPrice) : displayPriceValue;

    const requestedTotal =
      dialogData.quantity +
      this.#getSessionBuyerQuantity({
        type: "service",
        sourceId: service.id,
        unitPriceValue,
        priceCurrency: sessionCurrency,
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
      unitPriceValue,
      priceCurrency: sessionCurrency,
      sourceLabel: game.i18n.localize("mtt.sessions.item.service"),
      isFreePrice: hasFreePrice,
      minimumPriceValue: hasFreePrice ? minimumPriceValue : null,
    });
    if (!sessionItem) return;

    this.render();
  }

  static async #onDeleteService(event, target) {
    event.preventDefault();

    if (!this.isEditable || getMerchantSheetLockedState(this.actor)) {
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

    this.#saveScrollPositions();
    await this.actor.update({
      "system.services.entries": entries,
    });

    this.render();
  }

  static async #onToggleCatalogItemVisibility(event, target) {
    event.preventDefault();

    if (!this.isEditable) return;

    const catalogKind = target.dataset.catalogKind ?? "";
    if (catalogKind === "product") {
      const item = this.#getItemFromEvent(target);
      if (!item) return;

      const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};
      this.#saveScrollPositions();
      await item.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, {
        ...product,
        isHidden: !Boolean(product.isHidden),
      });

      this.render();
      return;
    }

    if (catalogKind !== "service") return;
    const serviceId = target.closest("[data-service-id]")?.dataset.serviceId;
    if (!serviceId) return;

    const entries = foundry.utils.deepClone(this.actor.system.services?.entries ?? []);
    const index = entries.findIndex((s) => s.id === serviceId);
    if (index === -1) return;

    entries[index].isHidden = !Boolean(entries[index].isHidden);

    this.#saveScrollPositions();
    await this.actor.update({
      "system.services.entries": entries,
    });

    this.render();
  }

  static async #onToggleServiceApproval(event, target) {
    event.preventDefault();

    if (!this.isEditable || getMerchantSheetLockedState(this.actor)) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.sheetLocked"));
      return;
    }

    const serviceId = target.closest("[data-service-id]")?.dataset.serviceId;
    if (!serviceId) return;

    const entries = foundry.utils.deepClone(this.actor.system.services?.entries ?? []);
    const index = entries.findIndex((s) => s.id === serviceId);
    if (index === -1) return;

    entries[index].requiresApproval = !Boolean(entries[index].requiresApproval);

    this.#saveScrollPositions();
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
        entries[serviceIndex].isCommerciallyModified = true;
      } else {
        target.value = entries[serviceIndex].name;
        return;
      }
    }

    if (field === "description") {
      entries[serviceIndex].description = this.#htmlToPlainText(target.value?.trim() ?? "");
      entries[serviceIndex].isCommerciallyModified = true;
    }

    if (field === "priceValue") {
      const priceValue = Number(target.value);

      if (!Number.isFinite(priceValue) || priceValue < 0) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidServicePrice"));
        target.value = entries[serviceIndex].priceValue ?? MTT.SERVICE_DEFAULTS.priceValue;
        return;
      }

      entries[serviceIndex].priceValue = priceValue;
      entries[serviceIndex].isCommerciallyModified = true;
    }

    if (field === "priceCurrency") {
      const selectedValue = target.value?.trim() ?? "";
      if (selectedValue === "__freePrice") {
        entries[serviceIndex].hasFreePrice = true;
        entries[serviceIndex].isCommerciallyModified = true;
      } else {
        entries[serviceIndex].priceCurrency = selectedValue;
        entries[serviceIndex].hasFreePrice = false;
        entries[serviceIndex].isCommerciallyModified = true;
      }
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

    if (field === "minimumPriceValue") {
      const value = Number(target.value);

      if (!Number.isFinite(value) || value < 0) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidPrice"));
        target.value = entries[serviceIndex].minimumPriceValue ?? MTT.SERVICE_DEFAULTS.minimumPriceValue;
        return;
      }

      entries[serviceIndex].minimumPriceValue = value;
      entries[serviceIndex].isCommerciallyModified = true;
    }

    await this.actor.update({
      "system.services.entries": entries,
    });
  }
}
