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
      selectTab: MerchantSheet.#onSelectTab,
      updateProductField: MerchantSheet.#onUpdateProductField,
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

    return context;
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

      return {
        id: item.id,
        uuid: item.uuid,
        name: item.name,
        type: item.type,
        img: item.img,
        quantity,
        hasQuantity: quantity !== null && quantity !== undefined,
        document: item,
      };
    });
  }

  #getItemFromEvent(target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    if (!itemId) return null;

    return this.actor.items.get(itemId) ?? null;
  }

  static async #onUpdateProductField(event, target) {
    event.preventDefault();

    if (!this.#canModifyMerchant()) return;

    const item = this.#getItemFromEvent(target);
    if (!item) return;

    const field = target.dataset.field;
    const value = target.value;

    if (field === "name") {
      await item.update({
        name: value?.trim() || item.name,
      });
      return;
    }

    if (field === "quantity") {
      const quantity = Number(value);

      if (!Number.isFinite(quantity) || quantity < 0) {
        ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidQuantity"));
        return;
      }

      const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};

      await item.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, {
        ...product,
        quantity,
      });
    }
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

    if (tab === "configuration" && !this.isEditable) return;

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
