import { MTT } from "../../config/constants.mjs"
import { escapeHTML, buildCurrencySelectOptions } from "./merchant-utils.mjs"

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
  const quantityMax = Number.isFinite(availableQuantity) && availableQuantity >= 0 ? ` max="${availableQuantity}"` : ""

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
          <input type="number" name="proposedPrice" min="0.01" step="0.01" value="" required />
        </label>`
    : includeProposedPrice
      ? `<label class="mtt-session-dialog-field">
            <span>${game.i18n.localize("mtt.sessions.dialog.proposedPrice")}</span>
            <input type="number" name="proposedPrice" min="0" step="1" placeholder="${escapeHTML(priceLabel)}" />
          </label>`
      : ""

  const quantitySummaryHtml = `<p class="mtt-session-dialog-line">
        <strong>${game.i18n.localize("mtt.sessions.dialog.availableQuantity")}</strong>
        <span>${escapeHTML(availableQuantityLabel)}</span>
      </p>`

  return `<form class="mtt-session-dialog-form">
    <section class="mtt-session-dialog-summary">
      <h3 class="mtt-session-dialog-title">${escapeHTML(name)}</h3>
      ${priceSummaryHtml}
      ${quantitySummaryHtml}
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
    if (!Number.isFinite(proposedPrice) || proposedPrice <= 0) {
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

export async function openCatalogItemSecretsDialog({
  name,
  secretName = "",
  secretPrice = "",
  secretCurrency = "",
  secretDescription = "",
}) {
  const title = game.i18n.format("mtt.secrets.titleWithName", { name })
  const content = `<form class="mtt-secret-info-dialog">
    <label class="mtt-secret-info-field">
      <span>${game.i18n.localize("mtt.secrets.name")}</span>
      <input type="text" name="secretName" value="${escapeHTML(secretName)}" />
    </label>
    <div class="mtt-secret-info-field">
      <span>${game.i18n.localize("mtt.secrets.price")}</span>
      <div class="mtt-secret-info-price-row">
        <input type="text" name="secretPrice" value="${escapeHTML(secretPrice)}" />
        <select name="secretCurrency" aria-label="${escapeHTML(game.i18n.localize("mtt.secrets.currency"))}">
          ${buildCurrencySelectOptions(secretCurrency)}
        </select>
      </div>
    </div>
    <label class="mtt-secret-info-field">
      <span>${game.i18n.localize("mtt.secrets.description")}</span>
      <textarea name="secretDescription">${escapeHTML(secretDescription)}</textarea>
    </label>
  </form>`

  try {
    return await foundry.applications.api.DialogV2.wait({
      window: { title },
      content,
      rejectClose: false,
      buttons: [
        {
          action: "cancel",
          label: game.i18n.localize("mtt.secrets.cancel"),
          callback: () => null,
        },
        {
          action: "save",
          label: game.i18n.localize("mtt.secrets.save"),
          default: true,
          callback: (event, button, dialog) => {
            const form = button?.form ?? dialog?.element?.querySelector("form") ?? event.target?.closest?.("form")
            if (!form) return null
            const formData = new FormData(form)
            return {
              secretName: String(formData.get("secretName") ?? "").trim(),
              secretPrice: String(formData.get("secretPrice") ?? "").trim(),
              secretCurrency: String(formData.get("secretCurrency") ?? "").trim(),
              secretDescription: String(formData.get("secretDescription") ?? "").trim(),
            }
          },
        },
      ],
    })
  } catch {
    return null
  }
}

export async function openClientRatesDialog({ clientName = "", rates = {} } = {}) {
  const title = game.i18n.format("mtt.clientRates.titleWithName", { name: clientName })
  const content = `<form class="mtt-client-rates-dialog">
    <div class="mtt-client-rates-grid">
      <label class="mtt-client-rates-field">
        <span>${game.i18n.localize("mtt.clientRates.productSellPercent")}</span>
        <input type="number" name="productSellPercent" min="0" step="1" value="${escapeHTML(String(rates.productSellPercent ?? 100))}" />
      </label>
      <label class="mtt-client-rates-field">
        <span>${game.i18n.localize("mtt.clientRates.serviceSellPercent")}</span>
        <input type="number" name="serviceSellPercent" min="0" step="1" value="${escapeHTML(String(rates.serviceSellPercent ?? 100))}" />
      </label>
      <label class="mtt-client-rates-field">
        <span>${game.i18n.localize("mtt.clientRates.itemBuyPercent")}</span>
        <input type="number" name="itemBuyPercent" min="0" step="1" value="${escapeHTML(String(rates.itemBuyPercent ?? 50))}" />
      </label>
    </div>
    <label class="mtt-client-rates-field mtt-client-rates-note">
      <span>${game.i18n.localize("mtt.clientRates.note")}</span>
      <textarea name="note">${escapeHTML(rates.note ?? "")}</textarea>
    </label>
  </form>`

  try {
    return await foundry.applications.api.DialogV2.wait({
      window: { title },
      content,
      rejectClose: false,
      buttons: [
        {
          action: "cancel",
          label: game.i18n.localize("mtt.clientRates.cancel"),
          callback: () => null,
        },
        {
          action: "save",
          label: game.i18n.localize("mtt.clientRates.save"),
          default: true,
          callback: (event, button, dialog) => {
            const form = button?.form ?? dialog?.element?.querySelector("form") ?? event.target?.closest?.("form")
            if (!form) return null

            const formData = new FormData(form)
            return {
              productSellPercent: formData.get("productSellPercent"),
              serviceSellPercent: formData.get("serviceSellPercent"),
              itemBuyPercent: formData.get("itemBuyPercent"),
              note: String(formData.get("note") ?? "").trim(),
            }
          },
        },
      ],
    })
  } catch {
    return null
  }
}

export function renderSellerItemDialog({ availableQuantityLabel, availableQuantity, unitPriceValue, priceCurrency }) {
  const quantityMax =
    Number.isFinite(availableQuantity) && availableQuantity >= 0
      ? ` max="${escapeHTML(String(availableQuantity))}"`
      : ""

  const priceFieldsHtml = `<label class="mtt-dialog-field">
        <span class="mtt-dialog-field-label">${game.i18n.localize("mtt.dialog.sellerItemUnitValue")}</span>
        <input type="number" name="unitPriceValue" min="0" step="1" value="${escapeHTML(String(unitPriceValue))}" />
      </label>
      <label class="mtt-dialog-field">
        <span class="mtt-dialog-field-label">${game.i18n.localize("mtt.dialog.sellerItemCurrency")}</span>
        <select name="priceCurrency">${buildCurrencySelectOptions(priceCurrency)}</select>
      </label>`

  const quantitySummaryHtml = `<label class="mtt-dialog-field">
      <span class="mtt-dialog-field-label">${game.i18n.localize("mtt.dialog.sellerItemAvailableQuantity")}</span>
      <span class="mtt-dialog-field-value">${escapeHTML(availableQuantityLabel)}</span>
    </label>`

  return `${quantitySummaryHtml}
    <label class="mtt-dialog-field">
      <span class="mtt-dialog-field-label">${game.i18n.localize("mtt.dialog.sellerItemQuantity")}</span>
      <input type="number" name="quantity" min="1" step="1" value="1"${quantityMax} />
    </label>
    ${priceFieldsHtml}`
}

// ─── Preview dialog helpers ───────────────────────────────────────────────────

function getPreviewItemTypeLabel(item) {
  if (item.type === "service") return game.i18n.localize("mtt.services.title")
  return game.i18n.localize("mtt.products.title")
}

function renderPreviewItemTable(items) {
  const loc = (key) => escapeHTML(game.i18n.localize(key))

  if (!items || items.length === 0) {
    return `<p class="mtt-dialog-preview-empty">${loc("mtt.dialog.transaction.empty")}</p>`
  }

  return `<div class="mtt-dialog-preview-table-wrap">
    <table class="mtt-dialog-preview-table">
      <thead>
        <tr>
          <th class="mtt-dialog-preview-col-img">${loc("mtt.dialog.transaction.columns.image")}</th>
          <th>${loc("mtt.dialog.transaction.columns.type")}</th>
          <th>${loc("mtt.dialog.transaction.columns.quantity")}</th>
          <th>${loc("mtt.dialog.transaction.columns.name")}</th>
          <th>${loc("mtt.dialog.transaction.columns.unitPrice")}</th>
          <th>${loc("mtt.dialog.transaction.columns.total")}</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (item) => `<tr class="${item.missing ? "mtt-dialog-preview-row-missing" : ""}">
              <td class="mtt-dialog-preview-col-img">${
                item.img
                  ? `<img class="mtt-dialog-preview-img" src="${escapeHTML(item.img)}" alt="${escapeHTML(item.name)}" />`
                  : ""
              }</td>
              <td>${escapeHTML(getPreviewItemTypeLabel(item))}</td>
              <td class="mtt-dialog-preview-number">${escapeHTML(String(item.quantity ?? ""))}</td>
              <td class="mtt-dialog-preview-name">${escapeHTML(item.name ?? "")}</td>
              <td class="mtt-dialog-preview-price">${escapeHTML(item.unitPriceLabel ?? "")}</td>
              <td class="mtt-dialog-preview-price">${escapeHTML(item.totalPriceLabel ?? "")}</td>
            </tr>`,
          )
          .join("")}
      </tbody>
    </table>
  </div>`
}

function renderPreviewItemSection(titleKey, items) {
  return `<section class="mtt-dialog-preview-section">
    <h4 class="mtt-dialog-preview-section-title">${escapeHTML(game.i18n.localize(titleKey))}</h4>
    ${renderPreviewItemTable(items)}
  </section>`
}

function getMoneyTransferGroups(transfers) {
  const groups = []
  for (const transfer of transfers ?? []) {
    const payer = transfer.payer ?? ""
    const receiver = transfer.receiver ?? ""
    const key = `${payer}\u0000${receiver}`
    let group = groups.find((g) => g.key === key)
    if (!group) {
      group = { key, payer, receiver, amounts: [], hasWarning: false }
      groups.push(group)
    }
    if (transfer.amountLabel) group.amounts.push(transfer.amountLabel)
    if (!transfer.hasEnough) group.hasWarning = true
  }
  return groups
}

function renderMoneyTransfers(preview) {
  const groups = getMoneyTransferGroups(preview.moneyTransfers)

  let html = `<section class="mtt-dialog-preview-section">
    <h4 class="mtt-dialog-preview-section-title">${escapeHTML(game.i18n.localize("mtt.dialog.transaction.moneyTransfer"))}</h4>`

  if (groups.length === 0) {
    html += `<p class="mtt-dialog-preview-empty">${escapeHTML(game.i18n.localize("mtt.dialog.transaction.noMoneyTransfer"))}</p>`
  } else {
    html += `<div class="mtt-dialog-preview-money">`
    for (const group of groups) {
      const sentence = game.i18n.format("mtt.dialog.transaction.moneyTransferSentence", {
        payer: group.payer,
        amount: group.amounts.join(", "),
        receiver: group.receiver,
      })
      html += `<p class="mtt-dialog-preview-money-line${group.hasWarning ? " mtt-dialog-preview-money-warning" : ""}">
        <i class="fas fa-coins"></i>
        <span>${escapeHTML(sentence)}</span>
        ${group.hasWarning ? `<i class="fas fa-triangle-exclamation mtt-dialog-preview-warning-icon"></i>` : ""}
      </p>`
    }
    html += `</div>`
  }

  html += `</section>`
  return html
}

function renderPreviewDialogContent(preview, { isPreviewOnly = true } = {}) {
  const loc = (key) => escapeHTML(game.i18n.localize(key))

  let html = `<div class="mtt-dialog-preview-header">
    <p><strong>${loc("mtt.sessions.preview.client")}</strong> ${escapeHTML(preview.client?.actorName ?? "-")}</p>
    <p><strong>${loc("mtt.sessions.preview.merchant")}</strong> ${escapeHTML(preview.merchant?.name ?? "-")}</p>
  </div>`

  const buyerReceives = [
    ...(preview.buyerDeliveries ?? []),
    ...(preview.services ?? []).map((item) => ({ ...item, type: "service" })),
  ]

  html += renderPreviewItemSection("mtt.dialog.transaction.buyerReceives", buyerReceives)
  html += renderPreviewItemSection("mtt.dialog.transaction.buyerGives", preview.sellerDeliveries ?? [])
  html += renderMoneyTransfers(preview)

  if ((preview.warnings ?? []).length > 0) {
    html += `<ul class="mtt-dialog-preview-list mtt-dialog-preview-warnings">${preview.warnings
      .map((w) => `<li class="mtt-dialog-preview-warning"><i class="fas fa-triangle-exclamation"></i> ${escapeHTML(w)}</li>`)
      .join("")}</ul>`
  }

  if (isPreviewOnly) {
    html += `<p class="mtt-dialog-preview-notice"><i class="fas fa-circle-info"></i> ${loc("mtt.dialog.transaction.previewOnly")}</p>`
  }
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

export async function openSessionValidationDialog(preview) {
  const form = renderPreviewDialogContent(preview, { isPreviewOnly: false })
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
