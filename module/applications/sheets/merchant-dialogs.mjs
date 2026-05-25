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
  return renderTemplate(MTT.TEMPLATES.MTT_DIALOG, {
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
