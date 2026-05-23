import { MTT } from "../../config/constants.mjs";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class MerchantSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  #activeTab = "products";

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: [MTT.CSS.SHEET, MTT.CSS.MERCHANT_SHEET],
      template: MTT.TEMPLATES.MERCHANT_SHEET,
      position: {
        width: 760,
        height: 640,
      },
      window: {
        title: "mtt.sheets.merchant",
      },
      actions: {
        createItem: MerchantSheet.#onCreateItem,
        editItem: MerchantSheet.#onEditItem,
        deleteItem: MerchantSheet.#onDeleteItem,
        toggleOpen: MerchantSheet.#onToggleOpen,
        toggleLock: MerchantSheet.#onToggleLock,
        selectTab: MerchantSheet.#onSelectTab,
      },
    });
  }

  static PARTS = {
    header: {
      template: MTT.TEMPLATES.MERCHANT_HEADER,
    },
    sidebar: {
      template: MTT.TEMPLATES.MERCHANT_SIDEBAR,
    },
    main: {
      template: MTT.TEMPLATES.MERCHANT_MAIN,
    },
    navigation: {
      template: MTT.TEMPLATES.MERCHANT_NAVIGATION,
    },
    products: {
      template: MTT.TEMPLATES.MERCHANT_PRODUCTS,
    },
    services: {
      template: MTT.TEMPLATES.MERCHANT_SERVICES,
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const isLocked = this.actor.system.sheet.isLocked;
    const canEditMerchant = this.isEditable && !isLocked;
    const canConfigureMerchant = this.isEditable;

    context.mtt = {
      css: MTT.CSS,
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
    context.mtt.activeTab = this.#activeTab;

    return context;
  }

  #prepareItems() {
    return this.actor.items.map((item) => {
      const quantity = foundry.utils.getProperty(item, "system.quantity");
      return {
        id: item.id,
        uuid: item.uuid,
        name: item.name,
        type: item.type,
        img: item.img,
        quantity: quantity ?? null,
        hasQuantity: quantity !== null && quantity !== undefined,
        document: item,
      };
    });
  }

  static async #onCreateItem(event, target) {
    event.preventDefault();

    if (!this.#canModifyMerchant()) return;

    const type = target.dataset.type || "loot";

    await this.actor.createEmbeddedDocuments("Item", [
      {
        name: game.i18n.localize("mtt.items.newItem"),
        type,
      },
    ]);
  }

  static async #onEditItem(event, target) {
    event.preventDefault();

    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.actor.items.get(itemId);

    item?.sheet?.render(true);
  }

  static async #onDeleteItem(event, target) {
    event.preventDefault();

    if (!this.#canModifyMerchant()) return;

    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.actor.items.get(itemId);

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

  static #onSelectTab(event, target) {
    event.preventDefault();

    const tab = target.dataset.tab;
    if (!tab) return;

    this.#setActiveTab(tab);
  }

  #setActiveTab(tab) {
    this.#activeTab = tab;
    this.render();
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
