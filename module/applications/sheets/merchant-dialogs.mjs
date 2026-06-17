import { MTT } from "../../config/constants.mjs"
import { prepareCurrencyOptions } from "./merchant-utils.mjs"

// ─── Private helpers ──────────────────────────────────────────────────────────

function getDialogForm(button, dialog, event) {
  return button?.form ?? dialog?.element?.querySelector("form") ?? event.target?.closest?.("form") ?? null
}

function buildFilteredCurrencyOptions(selectedKey) {
  const rawOptions = prepareCurrencyOptions().filter((c) => !c.isFreePrice)
  const knownKeys = new Set(rawOptions.map((c) => c.key))
  const options = rawOptions.map((c) => ({ ...c, selected: c.key === selectedKey }))
  if (selectedKey && !knownKeys.has(selectedKey)) {
    options.push({ key: selectedKey, abbreviation: selectedKey, title: "", selected: true })
  }
  return options
}

export async function renderMttDialogContent({
  icon = "",
  title = "",
  message = "",
  details = "",
  variant = "default",
  entity = null,
  form = ""
} = {}) {
  return foundry.applications.handlebars.renderTemplate(MTT.TEMPLATES.MTT_DIALOG, {
    icon,
    title,
    message,
    details,
    variant,
    entity,
    form,
    hasHeader: Boolean(icon || title)
  })
}

export async function renderConfirmDialogContent({
  message = "",
  details = "",
  warning = "",
  variant = "default"
} = {}) {
  return foundry.applications.handlebars.renderTemplate(MTT.TEMPLATES.CONFIRM_DIALOG, {
    message,
    details,
    warning,
    variant
  })
}

export async function renderSessionPreparationDialog({
  name,
  priceLabel,
  availableQuantityLabel,
  availableQuantity,
  includeProposedPrice = false,
  hasFreePrice = false,
  referenceCurrencyLabel = ""
}) {
  return foundry.applications.handlebars.renderTemplate(MTT.TEMPLATES.SESSION_PREPARATION_DIALOG, {
    name,
    priceLabel,
    availableQuantityLabel,
    availableQuantity,
    hasQuantityMax: Number.isFinite(availableQuantity) && availableQuantity >= 0,
    includeProposedPrice,
    hasFreePrice,
    referenceCurrencyLabel
  })
}

export async function openSessionPreparationDialog({
  title,
  name,
  priceLabel,
  availableQuantity,
  availableQuantityLabel: providedAvailableQuantityLabel = "",
  includeProposedPrice = false,
  hasFreePrice = false,
  referenceCurrencyLabel = ""
}) {
  const availableQuantityLabel =
    providedAvailableQuantityLabel ||
    (Number.isFinite(availableQuantity) && availableQuantity >= 0
      ? String(availableQuantity)
      : game.i18n.localize("mtt.sessions.dialog.unlimitedQuantity"))
  const content = await renderSessionPreparationDialog({
    name,
    priceLabel,
    availableQuantityLabel,
    availableQuantity,
    includeProposedPrice,
    hasFreePrice,
    referenceCurrencyLabel
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
          callback: () => null
        },
        {
          action: "add",
          label: game.i18n.localize("mtt.sessions.actions.add"),
          default: true,
          callback: (event, button, dialog) => {
            const form = getDialogForm(button, dialog, event)
            if (!form) return null
            return Object.fromEntries(new FormData(form).entries())
          }
        }
      ]
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
      isFreePrice: true
    }
  }

  return {
    quantity: requestedQuantity,
    proposedPrice: result.proposedPrice ?? "",
    isFreePrice: false
  }
}

export async function openCatalogItemSecretsDialog({
  name,
  secretName = "",
  secretPrice = "",
  secretCurrency = "",
  secretDescription = ""
}) {
  const title = game.i18n.format("mtt.secrets.titleWithName", { name })

  const currencyOptions = buildFilteredCurrencyOptions(secretCurrency)

  const content = await foundry.applications.handlebars.renderTemplate(MTT.TEMPLATES.SECRET_INFO_DIALOG, {
    secretName,
    secretPrice,
    secretDescription,
    currencyOptions
  })

  try {
    return await foundry.applications.api.DialogV2.wait({
      window: { title },
      content,
      rejectClose: false,
      buttons: [
        {
          action: "cancel",
          label: game.i18n.localize("mtt.secrets.cancel"),
          callback: () => null
        },
        {
          action: "save",
          label: game.i18n.localize("mtt.secrets.save"),
          default: true,
          callback: (event, button, dialog) => {
            const form = getDialogForm(button, dialog, event)
            if (!form) return null
            const formData = new FormData(form)
            return {
              secretName: String(formData.get("secretName") ?? "").trim(),
              secretPrice: String(formData.get("secretPrice") ?? "").trim(),
              secretCurrency: String(formData.get("secretCurrency") ?? "").trim(),
              secretDescription: String(formData.get("secretDescription") ?? "").trim()
            }
          }
        }
      ]
    })
  } catch {
    return null
  }
}

export async function openClientRatesDialog({ clientName = "", rates = {} } = {}) {
  const title = game.i18n.format("mtt.clientRates.titleWithName", { name: clientName })
  const content = await foundry.applications.handlebars.renderTemplate(MTT.TEMPLATES.CLIENT_RATES_DIALOG, {
    productSellPercent: rates.productSellPercent ?? 100,
    serviceSellPercent: rates.serviceSellPercent ?? 100,
    itemBuyPercent: rates.itemBuyPercent ?? 50,
    note: rates.note ?? ""
  })

  try {
    return await foundry.applications.api.DialogV2.wait({
      window: { title },
      content,
      rejectClose: false,
      buttons: [
        {
          action: "cancel",
          label: game.i18n.localize("mtt.clientRates.cancel"),
          callback: () => null
        },
        {
          action: "save",
          label: game.i18n.localize("mtt.clientRates.save"),
          default: true,
          callback: (event, button, dialog) => {
            const form = getDialogForm(button, dialog, event)
            if (!form) return null

            const formData = new FormData(form)
            return {
              productSellPercent: formData.get("productSellPercent"),
              serviceSellPercent: formData.get("serviceSellPercent"),
              itemBuyPercent: formData.get("itemBuyPercent"),
              note: String(formData.get("note") ?? "").trim()
            }
          }
        }
      ]
    })
  } catch {
    return null
  }
}

// ─── Preview dialog helpers ───────────────────────────────────────────────────

function getPreviewItemTypeLabel(item) {
  if (item.type === "service") return game.i18n.localize("mtt.services.title")
  return game.i18n.localize("mtt.products.title")
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

async function renderPreviewDialogContent(preview, { isPreviewOnly = true } = {}) {
  const buyerReceives = [
    ...(preview.buyerDeliveries ?? []),
    ...(preview.services ?? []).map((item) => ({ ...item, type: "service" }))
  ].map((item) => ({ ...item, typeLabel: getPreviewItemTypeLabel(item) }))

  const buyerGives = (preview.sellerDeliveries ?? []).map((item) => ({
    ...item,
    typeLabel: getPreviewItemTypeLabel(item)
  }))

  const moneyTransferGroups = getMoneyTransferGroups(preview.moneyTransfers).map((group) => ({
    ...group,
    sentence: game.i18n.format("mtt.dialog.transaction.moneyTransferSentence", {
      payer: group.payer,
      amount: group.amounts.join(", "),
      receiver: group.receiver
    })
  }))

  return foundry.applications.handlebars.renderTemplate(MTT.TEMPLATES.TRANSACTION_SUMMARY_DIALOG, {
    clientName: preview.client?.actorName ?? "-",
    merchantName: preview.merchant?.name ?? "-",
    buyerReceives,
    buyerGives,
    moneyTransferGroups,
    warnings: preview.warnings ?? [],
    isPreviewOnly
  })
}

async function renderPreviewErrorContent(preview) {
  return foundry.applications.handlebars.renderTemplate(MTT.TEMPLATES.TRANSACTION_ERRORS_DIALOG, {
    errors: preview.errors ?? []
  })
}

export async function openPreviewDialog(preview) {
  const form = await renderPreviewDialogContent(preview)
  const content = await renderMttDialogContent({
    icon: "fa-clipboard-list",
    title: game.i18n.localize("mtt.sessions.preview.title"),
    variant: "default",
    form
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
          callback: () => null
        }
      ]
    })
  } catch {
    // ignore
  }
}

export async function openPreviewErrorDialog(preview) {
  const form = await renderPreviewErrorContent(preview)
  const content = await renderMttDialogContent({
    icon: "fa-triangle-exclamation",
    title: game.i18n.localize("mtt.sessions.preview.errorTitle"),
    variant: "danger",
    form
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
          callback: () => null
        }
      ]
    })
  } catch {
    // ignore
  }
}

export async function openSessionValidationDialog(preview) {
  const form = await renderPreviewDialogContent(preview, { isPreviewOnly: false })
  const content = await renderMttDialogContent({
    icon: "fa-circle-check",
    title: game.i18n.localize("mtt.sessions.execution.validateTitle"),
    variant: "default",
    form
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
          callback: () => false
        },
        {
          action: "confirm",
          label: game.i18n.localize("mtt.sessions.execution.validateConfirm"),
          default: true,
          callback: () => true
        }
      ]
    })
  } catch {
    return false
  }

  return Boolean(result)
}

export async function openSessionExecutionErrorsDialog(preview) {
  const form = await renderPreviewErrorContent(preview)
  const content = await renderMttDialogContent({
    icon: "fa-triangle-exclamation",
    title: game.i18n.localize("mtt.sessions.execution.executionErrorTitle"),
    variant: "danger",
    form
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
          callback: () => null
        }
      ]
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
    variant: "warning"
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
          callback: () => false
        },
        {
          action: "confirm",
          label: game.i18n.localize("mtt.sessions.confirm.refuseConfirm"),
          default: true,
          callback: () => true
        }
      ]
    })
  } catch {
    return false
  }

  return Boolean(result)
}

export async function openSellerItemDialog({
  name,
  img,
  sourceActorName,
  availableQuantity,
  unitPriceValue,
  priceCurrency
}) {
  const availableQuantityLabel =
    Number.isFinite(availableQuantity) && availableQuantity >= 0
      ? String(availableQuantity)
      : game.i18n.localize("mtt.sessions.dialog.unlimitedQuantity")

  const currencyOptions = buildFilteredCurrencyOptions(priceCurrency)

  const content = await foundry.applications.handlebars.renderTemplate(MTT.TEMPLATES.SELLER_ITEM_DIALOG, {
    name,
    img: img || "",
    sourceActorMeta: sourceActorName ? `${game.i18n.localize("mtt.sessions.sourceActor")} : ${sourceActorName}` : "",
    availableQuantityLabel,
    availableQuantity,
    hasQuantityMax: Number.isFinite(availableQuantity) && availableQuantity >= 0,
    unitPriceValue,
    currencyOptions
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
          callback: () => null
        },
        {
          action: "add",
          label: game.i18n.localize("mtt.dialog.sellerItemAdd"),
          default: true,
          callback: (event, button, dialog) => {
            const form = getDialogForm(button, dialog, event)
            if (!form) return null
            return Object.fromEntries(new FormData(form).entries())
          }
        }
      ]
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
    priceCurrency: result.priceCurrency?.trim() ?? ""
  }
}
