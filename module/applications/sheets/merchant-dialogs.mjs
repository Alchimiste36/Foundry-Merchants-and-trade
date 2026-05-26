import { MTT } from "../../config/constants.mjs"
import { escapeHTML } from "./merchant-utils.mjs"

export async function renderMttDialogContent({
  icon = "",
  title = "",
  message = "",
  details = "",
  variant = "default",
  entity = null,
  form = "",
} = {}) {
  return foundry.applications.handlebars.renderTemplate(MTT.TEMPLATES.MTT_DIALOG, {
    icon,
    title,
    message,
    details,
    variant,
    entity,
    form,
    hasHeader: Boolean(icon || title),
  })
}

export function renderSessionPreparationDialog({
  name,
  priceLabel,
  availableQuantityLabel,
  availableQuantity,
  includeProposedPrice = false,
  hasFreePrice = false,
  referenceCurrencyLabel = "",
}) {
  const quantityMax =
    Number.isFinite(availableQuantity) && availableQuantity >= 0 ? ` max="${availableQuantity}"` : ""

  const priceSummaryHtml = hasFreePrice
    ? `<p class="mtt-session-dialog-line">
        <i class="fas fa-scale-balanced"></i>
        <strong>${game.i18n.localize("mtt.price.freePrice")}</strong>
      </p>`
    : `<p class="mtt-session-dialog-line">
        <strong>${game.i18n.localize("mtt.products.price.adjusted")}</strong>
        <span>${escapeHTML(priceLabel)}</span>
      </p>`

  const currencySuffix = referenceCurrencyLabel ? ` (${escapeHTML(referenceCurrencyLabel)})` : ""
  const proposedPriceField = hasFreePrice
    ? `<label class="mtt-session-dialog-field">
        <span>${game.i18n.localize("mtt.price.proposedPrice")}${currencySuffix}</span>
        <input type="number" name="proposedPrice" min="0" step="0.01" value="" required />
      </label>`
    : includeProposedPrice
      ? `<label class="mtt-session-dialog-field">
          <span>${game.i18n.localize("mtt.sessions.dialog.proposedPrice")}</span>
          <input type="number" name="proposedPrice" min="0" step="0.01" placeholder="${escapeHTML(priceLabel)}" />
        </label>`
      : ""

  return `<form class="mtt-session-dialog-form">
    <section class="mtt-session-dialog-summary">
      <h3 class="mtt-session-dialog-title">${escapeHTML(name)}</h3>
      ${priceSummaryHtml}
      <p class="mtt-session-dialog-line">
        <strong>${game.i18n.localize("mtt.sessions.dialog.availableQuantity")}</strong>
        <span>${escapeHTML(availableQuantityLabel)}</span>
      </p>
    </section>
    <label class="mtt-session-dialog-field">
      <span>${game.i18n.localize("mtt.sessions.dialog.quantity")}</span>
      <input type="number" name="quantity" min="1" step="1" value="1"${quantityMax} />
    </label>
    ${proposedPriceField}
  </form>`
}

export async function openSessionPreparationDialog({
  title,
  name,
  priceLabel,
  availableQuantity,
  includeProposedPrice = false,
  hasFreePrice = false,
  referenceCurrencyLabel = "",
}) {
  const availableQuantityLabel =
    Number.isFinite(availableQuantity) && availableQuantity >= 0
      ? String(availableQuantity)
      : game.i18n.localize("mtt.sessions.dialog.unlimitedQuantity")
  const content = renderSessionPreparationDialog({
    name,
    priceLabel,
    availableQuantityLabel,
    availableQuantity,
    includeProposedPrice,
    hasFreePrice,
    referenceCurrencyLabel,
  })

  let result = null

  try {
    result = await foundry.applications.api.DialogV2.wait({
      window: { title },
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
            const form = button?.form ?? dialog?.element?.querySelector("form") ?? event.target?.closest?.("form")
            if (!form) return null
            return Object.fromEntries(new FormData(form).entries())
          },
        },
      ],
    })
  } catch {
    return
  }

  if (!result) return

  const requestedQuantity = Number(result.quantity)
  if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
    ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidSessionQuantity"))
    return
  }

  if (Number.isFinite(availableQuantity) && availableQuantity >= 0 && requestedQuantity > availableQuantity) {
    ui.notifications.warn(game.i18n.localize("mtt.notifications.notEnoughQuantity"))
    return
  }

  if (hasFreePrice) {
    const proposedPrice = Number(result.proposedPrice)
    if (!Number.isFinite(proposedPrice) || proposedPrice < 0) {
      ui.notifications.warn(game.i18n.localize("mtt.notifications.missingProposedPrice"))
      return
    }

    return {
      quantity: requestedQuantity,
      proposedPrice,
      isFreePrice: true,
    }
  }

  return {
    quantity: requestedQuantity,
    proposedPrice: result.proposedPrice ?? "",
    isFreePrice: false,
  }
}

export function renderSellerItemDialog({ availableQuantityLabel, availableQuantity, unitPriceValue, priceCurrency }) {
  const quantityMax =
    Number.isFinite(availableQuantity) && availableQuantity >= 0
      ? ` max="${escapeHTML(String(availableQuantity))}"`
      : ""

  return `<label class="mtt-dialog-field">
      <span class="mtt-dialog-field-label">${game.i18n.localize("mtt.dialog.sellerItemAvailableQuantity")}</span>
      <span class="mtt-dialog-field-value">${escapeHTML(availableQuantityLabel)}</span>
    </label>
    <label class="mtt-dialog-field">
      <span class="mtt-dialog-field-label">${game.i18n.localize("mtt.dialog.sellerItemQuantity")}</span>
      <input type="number" name="quantity" min="1" step="1" value="1"${quantityMax} />
    </label>
    <label class="mtt-dialog-field">
      <span class="mtt-dialog-field-label">${game.i18n.localize("mtt.dialog.sellerItemUnitValue")}</span>
      <input type="number" name="unitPriceValue" min="0" step="0.01" value="${escapeHTML(String(unitPriceValue))}" />
    </label>
    <label class="mtt-dialog-field">
      <span class="mtt-dialog-field-label">${game.i18n.localize("mtt.dialog.sellerItemCurrency")}</span>
      <input type="text" name="priceCurrency" value="${escapeHTML(priceCurrency)}" />
    </label>`
}

// ─── Preview dialog helpers ───────────────────────────────────────────────────

function renderPreviewItemList(items) {
  if (!items || items.length === 0) return ""
  return `<ul class="mtt-dialog-preview-list">${items
    .map(
      (item) => `<li class="mtt-dialog-preview-item${item.missing ? " mtt-dialog-preview-item-missing" : ""}">
      ${item.img ? `<img class="mtt-dialog-preview-img" src="${escapeHTML(item.img)}" alt="${escapeHTML(item.name)}" />` : ""}
      <span class="mtt-dialog-preview-name">${escapeHTML(item.name)}</span>
      <span class="mtt-dialog-preview-quantity">×${escapeHTML(String(item.quantity))}</span>
      <span class="mtt-dialog-preview-total">${escapeHTML(item.totalPriceLabel)}</span>
    </li>`,
    )
    .join("")}</ul>`
}

function renderPreviewDialogContent(preview) {
  const loc = (key) => escapeHTML(game.i18n.localize(key))

  let html = `<div class="mtt-dialog-preview-header">
    <p><strong>${loc("mtt.sessions.preview.client")}</strong> ${escapeHTML(preview.client?.actorName ?? "—")}</p>
    <p><strong>${loc("mtt.sessions.preview.merchant")}</strong> ${escapeHTML(preview.merchant?.name ?? "—")}</p>
  </div>`

  if (preview.buyerDeliveries.length > 0) {
    html += `<section class="mtt-dialog-preview-section">
      <h4 class="mtt-dialog-preview-section-title">${loc("mtt.sessions.preview.buyerReceives")}</h4>
      ${renderPreviewItemList(preview.buyerDeliveries)}
    </section>`
  }

  if (preview.services.length > 0) {
    html += `<section class="mtt-dialog-preview-section">
      <h4 class="mtt-dialog-preview-section-title">${loc("mtt.sessions.preview.services")}</h4>
      ${renderPreviewItemList(preview.services)}
    </section>`
  }

  if (preview.sellerDeliveries.length > 0) {
    html += `<section class="mtt-dialog-preview-section">
      <h4 class="mtt-dialog-preview-section-title">${loc("mtt.sessions.preview.merchantReceives")}</h4>
      ${renderPreviewItemList(preview.sellerDeliveries)}
    </section>`
  }

  const stockUpdates = [...(preview.merchantStockUpdates ?? []), ...(preview.clientItemUpdates ?? [])]
  if (stockUpdates.length > 0) {
    html += `<section class="mtt-dialog-preview-section">
      <h4 class="mtt-dialog-preview-section-title">${loc("mtt.sessions.preview.stockUpdates")}</h4>
      <ul class="mtt-dialog-preview-list">${stockUpdates
        .map(
          (u) => `<li class="mtt-dialog-preview-item">
          ${u.img ? `<img class="mtt-dialog-preview-img" src="${escapeHTML(u.img)}" alt="${escapeHTML(u.name)}" />` : ""}
          <span class="mtt-dialog-preview-name">${escapeHTML(u.name)}</span>
          <span class="mtt-dialog-preview-quantity">−${escapeHTML(String(u.quantityToReduce))}</span>
        </li>`,
        )
        .join("")}</ul>
    </section>`
  }

  if ((preview.moneyTransfers ?? []).length > 0) {
    html += `<section class="mtt-dialog-preview-section">
      <h4 class="mtt-dialog-preview-section-title">${loc("mtt.sessions.preview.moneyTransfers")}</h4>
      <ul class="mtt-dialog-preview-list">${preview.moneyTransfers
        .map(
          (t) => `<li class="mtt-dialog-preview-item${t.hasEnough ? "" : " mtt-dialog-preview-item-warning"}">
          <i class="fas fa-coins"></i>
          <span class="mtt-dialog-preview-name">${escapeHTML(t.amountLabel)}</span>
          <span class="mtt-dialog-preview-meta">${escapeHTML(t.payer)} → ${escapeHTML(t.receiver)}</span>
          ${!t.hasEnough ? `<i class="fas fa-triangle-exclamation mtt-dialog-preview-warning-icon"></i>` : ""}
        </li>`,
        )
        .join("")}</ul>
    </section>`
  }

  if ((preview.warnings ?? []).length > 0) {
    html += `<ul class="mtt-dialog-preview-list mtt-dialog-preview-warnings">${preview.warnings
      .map((w) => `<li class="mtt-dialog-preview-warning"><i class="fas fa-triangle-exclamation"></i> ${escapeHTML(w)}</li>`)
      .join("")}</ul>`
  }

  html += `<p class="mtt-dialog-preview-notice"><i class="fas fa-circle-info"></i> ${loc("mtt.sessions.preview.previewOnly")}</p>`
  return html
}

function renderPreviewErrorContent(preview) {
  let html = `<p class="mtt-dialog-message">${escapeHTML(game.i18n.localize("mtt.sessions.preview.cannotExecute"))}</p>`

  if ((preview.errors ?? []).length > 0) {
    html += `<ul class="mtt-dialog-preview-list mtt-dialog-preview-errors">${preview.errors
      .map((e) => `<li class="mtt-dialog-preview-error"><i class="fas fa-circle-xmark"></i> ${escapeHTML(e)}</li>`)
      .join("")}</ul>`
  }

  return html
}

export async function openPreviewDialog(preview) {
  const form = renderPreviewDialogContent(preview)
  const content = await renderMttDialogContent({
    icon: "fa-clipboard-list",
    title: game.i18n.localize("mtt.sessions.preview.title"),
    variant: "default",
    form,
  })

  try {
    await foundry.applications.api.DialogV2.wait({
      window: { title: game.i18n.localize("mtt.sessions.preview.title") },
      content,
      rejectClose: false,
      buttons: [
        {
          action: "close",
          label: game.i18n.localize("mtt.sessions.preview.close"),
          default: true,
          callback: () => null,
        },
      ],
    })
  } catch {
    // ignore
  }
}

export async function openPreviewErrorDialog(preview) {
  const form = renderPreviewErrorContent(preview)
  const content = await renderMttDialogContent({
    icon: "fa-triangle-exclamation",
    title: game.i18n.localize("mtt.sessions.preview.errorTitle"),
    variant: "danger",
    form,
  })

  try {
    await foundry.applications.api.DialogV2.wait({
      window: { title: game.i18n.localize("mtt.sessions.preview.errorTitle") },
      content,
      rejectClose: false,
      buttons: [
        {
          action: "close",
          label: game.i18n.localize("mtt.sessions.preview.close"),
          default: true,
          callback: () => null,
        },
      ],
    })
  } catch {
    // ignore
  }
}

export async function openValidateConfirmDialog(preview) {
  const form = renderPreviewDialogContent(preview)
  const content = await renderMttDialogContent({
    icon: "fa-circle-check",
    title: game.i18n.localize("mtt.sessions.confirm.validateTitle"),
    variant: "default",
    form,
  })

  let result = null
  try {
    result = await foundry.applications.api.DialogV2.wait({
      window: { title: game.i18n.localize("mtt.sessions.confirm.validateTitle") },
      content,
      rejectClose: false,
      buttons: [
        {
          action: "cancel",
          label: game.i18n.localize("mtt.sessions.confirm.cancel"),
          callback: () => false,
        },
        {
          action: "confirm",
          label: game.i18n.localize("mtt.sessions.confirm.validateConfirm"),
          default: true,
          callback: () => true,
        },
      ],
    })
  } catch {
    return false
  }

  return Boolean(result)
}

export async function openSessionValidationDialog(preview) {
  const warning = `<p class="mtt-dialog-preview-notice"><i class="fas fa-circle-info"></i> ${escapeHTML(game.i18n.localize("mtt.sessions.execution.itemsOnlyWarning"))}</p>`
  const form = `${renderPreviewDialogContent(preview)}${warning}`
  const content = await renderMttDialogContent({
    icon: "fa-circle-check",
    title: game.i18n.localize("mtt.sessions.execution.validateTitle"),
    variant: "default",
    form,
  })

  let result = null
  try {
    result = await foundry.applications.api.DialogV2.wait({
      window: { title: game.i18n.localize("mtt.sessions.execution.validateTitle") },
      content,
      rejectClose: false,
      buttons: [
        {
          action: "cancel",
          label: game.i18n.localize("mtt.sessions.execution.validateCancel"),
          callback: () => false,
        },
        {
          action: "confirm",
          label: game.i18n.localize("mtt.sessions.execution.validateConfirm"),
          default: true,
          callback: () => true,
        },
      ],
    })
  } catch {
    return false
  }

  return Boolean(result)
}

export async function openSessionExecutionErrorsDialog(preview) {
  const form = renderPreviewErrorContent(preview)
  const content = await renderMttDialogContent({
    icon: "fa-triangle-exclamation",
    title: game.i18n.localize("mtt.sessions.execution.executionErrorTitle"),
    variant: "danger",
    form,
  })

  try {
    await foundry.applications.api.DialogV2.wait({
      window: { title: game.i18n.localize("mtt.sessions.execution.executionErrorTitle") },
      content,
      rejectClose: false,
      buttons: [
        {
          action: "close",
          label: game.i18n.localize("mtt.sessions.preview.close"),
          default: true,
          callback: () => null,
        },
      ],
    })
  } catch {
    // ignore
  }
}

export async function openRefuseConfirmDialog() {
  const content = await renderMttDialogContent({
    icon: "fa-circle-xmark",
    title: game.i18n.localize("mtt.sessions.confirm.refuseTitle"),
    message: game.i18n.localize("mtt.sessions.confirm.refuseContent"),
    details: game.i18n.localize("mtt.dialog.noTransactionNoJournal"),
    variant: "warning",
  })

  let result = null
  try {
    result = await foundry.applications.api.DialogV2.wait({
      window: { title: game.i18n.localize("mtt.sessions.confirm.refuseTitle") },
      content,
      rejectClose: false,
      buttons: [
        {
          action: "cancel",
          label: game.i18n.localize("mtt.sessions.confirm.cancel"),
          callback: () => false,
        },
        {
          action: "confirm",
          label: game.i18n.localize("mtt.sessions.confirm.refuseConfirm"),
          default: true,
          callback: () => true,
        },
      ],
    })
  } catch {
    return false
  }

  return Boolean(result)
}

export async function openSellerItemDialog({ name, img, sourceActorName, availableQuantity, unitPriceValue, priceCurrency }) {
  const availableQuantityLabel =
    Number.isFinite(availableQuantity) && availableQuantity >= 0
      ? String(availableQuantity)
      : game.i18n.localize("mtt.sessions.dialog.unlimitedQuantity")

  const form = renderSellerItemDialog({
    availableQuantity,
    availableQuantityLabel,
    unitPriceValue,
    priceCurrency,
  })

  const content = await renderMttDialogContent({
    icon: "fa-handshake-angle",
    title: game.i18n.localize("mtt.dialog.sellerItemTitle"),
    variant: "default",
    entity: {
      name,
      img,
      meta: sourceActorName ? `${game.i18n.localize("mtt.sessions.sourceActor")} : ${sourceActorName}` : "",
    },
    form,
  })

  let result = null

  try {
    result = await foundry.applications.api.DialogV2.wait({
      window: { title: game.i18n.localize("mtt.dialog.sellerItemTitle") },
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
            const form = button?.form ?? dialog?.element?.querySelector("form") ?? event.target?.closest?.("form")
            if (!form) return null
            return Object.fromEntries(new FormData(form).entries())
          },
        },
      ],
    })
  } catch {
    return null
  }

  if (!result) return null

  const quantity = Number(result.quantity)
  if (!Number.isFinite(quantity) || quantity <= 0) {
    ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidSellerItemQuantity"))
    return null
  }

  if (Number.isFinite(availableQuantity) && availableQuantity >= 0 && quantity > availableQuantity) {
    ui.notifications.warn(game.i18n.localize("mtt.notifications.notEnoughSellerItemQuantity"))
    return null
  }

  const priceValue = Number(result.unitPriceValue)
  if (!Number.isFinite(priceValue) || priceValue < 0) {
    ui.notifications.warn(game.i18n.localize("mtt.notifications.invalidSellerItemPrice"))
    return null
  }

  return {
    quantity,
    unitPriceValue: priceValue,
    priceCurrency: result.priceCurrency?.trim() ?? "",
  }
}
