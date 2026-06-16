import { MTT } from "../../config/constants.mjs"
import { formatPriceLabel, productHasSecretInfo } from "./merchant-utils.mjs"
import { getMerchantData, updateMerchantData } from "../../documents/merchant-flags.mjs"
import { getCatalogProduct } from "../../documents/merchant-products.mjs"
import { canUserViewClientJournalEntries } from "../../documents/merchant-access.mjs"

const JOURNAL_STATUSES = ["validated", "refused"]
const JOURNAL_ENTRY_TYPES = ["product", "service", "item", "money"]
const JOURNAL_ENTRY_SIDES = ["buyer", "seller"]
const JOURNAL_SORT_KEYS = ["date", "buyer", "status", "total"]
const JOURNAL_EMPTY_LABEL = "-"

function normalizeJournalNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function normalizeJournalNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null

  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function normalizeJournalTransactionNumber(value, fallback = null) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return fallback

  return Math.floor(number)
}

function formatSignedPriceLabel(value, currency, sign) {
  const normalizedValue = Math.abs(normalizeJournalNumber(value, 0))
  const prefix = sign === "+" ? "+" : "-"

  return `${prefix}${formatPriceLabel(normalizedValue, currency)}`
}

function normalizeJournalTransactionEntry(entry = {}) {
  const defaults = MTT.JOURNAL_TRANSACTION_ENTRY_DEFAULTS
  const type = String(entry.type ?? defaults.type)
  const side = String(entry.side ?? defaults.side)

  return {
    id: String(entry.id ?? foundry.utils.randomID()).trim(),
    type: JOURNAL_ENTRY_TYPES.includes(type) ? type : defaults.type,
    side: JOURNAL_ENTRY_SIDES.includes(side) ? side : defaults.side,
    sourceId: String(entry.sourceId ?? defaults.sourceId),
    sourceUuid: String(entry.sourceUuid ?? defaults.sourceUuid),
    sourceActorUuid: String(entry.sourceActorUuid ?? defaults.sourceActorUuid),
    name: String(entry.name ?? defaults.name),
    img: String(entry.img ?? defaults.img),
    quantity: normalizeJournalNumber(entry.quantity, defaults.quantity),
    deliveryQuantityPerLot: normalizeJournalNullableNumber(entry.deliveryQuantityPerLot),
    unitPriceValue: normalizeJournalNumber(entry.unitPriceValue, defaults.unitPriceValue),
    totalPriceValue: normalizeJournalNumber(entry.totalPriceValue, defaults.totalPriceValue),
    priceCurrency: String(entry.priceCurrency ?? defaults.priceCurrency),
    referenceUnitPriceValue: normalizeJournalNullableNumber(entry.referenceUnitPriceValue),
    percentOfReference: normalizeJournalNullableNumber(entry.percentOfReference),
    isNegotiated: Boolean(entry.isNegotiated ?? defaults.isNegotiated),
    negotiationStatus: String(entry.negotiationStatus ?? defaults.negotiationStatus),
    isFreePrice: Boolean(entry.isFreePrice ?? defaults.isFreePrice),
    hadSecrets: Boolean(entry.hadSecrets ?? defaults.hadSecrets)
  }
}

function normalizeJournalMoneyAdjustment(adjustment = {}) {
  const defaults = MTT.JOURNAL_MONEY_ADJUSTMENT_DEFAULTS
  const side = String(adjustment.side ?? defaults.side)

  return {
    id: String(adjustment.id ?? foundry.utils.randomID()).trim(),
    side: JOURNAL_ENTRY_SIDES.includes(side) ? side : defaults.side,
    value: normalizeJournalNumber(adjustment.value, defaults.value),
    currency: String(adjustment.currency ?? defaults.currency),
    label: String(adjustment.label ?? defaults.label)
  }
}

function normalizeJournalEntryType(type) {
  const normalizedType = String(type ?? "")
  return JOURNAL_ENTRY_TYPES.includes(normalizedType) ? normalizedType : MTT.JOURNAL_TRANSACTION_ENTRY_DEFAULTS.type
}

function normalizeJournalEntrySide(side) {
  const normalizedSide = String(side ?? "")
  return JOURNAL_ENTRY_SIDES.includes(normalizedSide) ? normalizedSide : MTT.JOURNAL_TRANSACTION_ENTRY_DEFAULTS.side
}

function getJournalLineKey(line) {
  return [
    normalizeJournalEntrySide(line.side),
    normalizeJournalEntryType(line.type),
    String(line.sourceId ?? ""),
    String(line.sourceUuid ?? ""),
    String(line.name ?? "")
  ].join("|")
}

function getLastNegotiationOffer(negotiation) {
  const offers = Array.isArray(negotiation?.offers) ? negotiation.offers : []
  return offers.length > 0 ? offers[offers.length - 1] : null
}

function catalogEntryHasSecrets(entry = {}) {
  return productHasSecretInfo(entry)
}

function getJournalLineHadSecrets(actor, item, side) {
  if (side !== "buyer") return false

  if (item.type === "product") {
    const product = getCatalogProduct(actor, item.sourceId) ?? {}
    return catalogEntryHasSecrets(product)
  }

  if (item.type === "service") {
    const service = getMerchantData(actor)?.catalog?.services?.find((entry) => entry.id === item.sourceId) ?? {}
    return catalogEntryHasSecrets(service)
  }

  return false
}

function buildJournalLineFromSessionItem(actor, item, side, negotiationsByLineKey) {
  const proposedUnitPriceValue = item.proposedUnitPriceValue
  const line = {
    id: foundry.utils.randomID(),
    type: normalizeJournalEntryType(item.type),
    side,
    sourceId: item.sourceId ?? "",
    sourceUuid: item.sourceUuid ?? "",
    sourceActorUuid: item.sourceActorUuid ?? "",
    name: item.name ?? "",
    img: item.img ?? "",
    quantity: normalizeJournalNumber(item.quantity, 1),
    deliveryQuantityPerLot: normalizeJournalNullableNumber(item.deliveryQuantityPerLot),
    unitPriceValue: normalizeJournalNumber(item.unitPriceValue, 0),
    totalPriceValue: normalizeJournalNumber(item.totalPriceValue, 0),
    priceCurrency: item.priceCurrency ?? "",
    referenceUnitPriceValue: normalizeJournalNullableNumber(item.referenceUnitPriceValue),
    percentOfReference: normalizeJournalNullableNumber(item.percentOfReference),
    isNegotiated: proposedUnitPriceValue !== null && proposedUnitPriceValue !== undefined,
    negotiationStatus: "",
    isFreePrice: Boolean(item.isFreePrice),
    hadSecrets: getJournalLineHadSecrets(actor, item, side)
  }

  const negotiation = negotiationsByLineKey.get(getJournalLineKey(line))
  if (negotiation) {
    line.isNegotiated = true
    line.negotiationStatus = String(negotiation.status ?? "")
    line.referenceUnitPriceValue = normalizeJournalNullableNumber(negotiation.referenceUnitPriceValue)
    const lastOffer = getLastNegotiationOffer(negotiation)
    line.percentOfReference = normalizeJournalNullableNumber(lastOffer?.percentOfReference)
  }

  return line
}

function buildJournalLineFromNegotiation(actor, negotiation, status) {
  const lastOffer = getLastNegotiationOffer(negotiation)
  const quantity = normalizeJournalNumber(lastOffer?.quantity, 1)
  const unitPriceValue = normalizeJournalNumber(lastOffer?.unitPriceValue ?? negotiation.proposedUnitPriceValue, 0)

  return {
    id: foundry.utils.randomID(),
    type: normalizeJournalEntryType(negotiation.type),
    side: normalizeJournalEntrySide(negotiation.side),
    sourceId: negotiation.sourceId ?? "",
    sourceUuid: negotiation.sourceUuid ?? "",
    sourceActorUuid: negotiation.sourceActorUuid ?? "",
    name: negotiation.name ?? "",
    img: negotiation.img ?? "",
    quantity,
    deliveryQuantityPerLot: normalizeJournalNullableNumber(negotiation.deliveryQuantityPerLot),
    unitPriceValue,
    totalPriceValue: normalizeJournalNumber(lastOffer?.totalPriceValue, Number((quantity * unitPriceValue).toFixed(2))),
    priceCurrency: negotiation.priceCurrency ?? "",
    referenceUnitPriceValue: normalizeJournalNullableNumber(negotiation.referenceUnitPriceValue),
    percentOfReference: normalizeJournalNullableNumber(lastOffer?.percentOfReference),
    isNegotiated: true,
    negotiationStatus:
      status === "refused" && negotiation.status === "active" ? "refused" : String(negotiation.status ?? ""),
    isFreePrice: Boolean(negotiation.isFreePrice),
    hadSecrets: getJournalLineHadSecrets(actor, negotiation, normalizeJournalEntrySide(negotiation.side))
  }
}

function prepareJournalNegotiations(actor, session, status) {
  const negotiations = Array.isArray(session?.negotiations) ? session.negotiations : []
  const acceptedByLineKey = new Map()
  const extraLines = []

  for (const negotiation of negotiations) {
    const negotiationStatus = String(negotiation.status ?? "")

    if (negotiationStatus === "accepted") {
      const line = buildJournalLineFromNegotiation(actor, negotiation, status)
      acceptedByLineKey.set(getJournalLineKey(line), negotiation)
      continue
    }

    if (negotiationStatus === "refused" || (status === "refused" && negotiationStatus === "active")) {
      extraLines.push(buildJournalLineFromNegotiation(actor, negotiation, status))
    }
  }

  return { acceptedByLineKey, extraLines }
}

function prepareJournalMoneyAdjustments(entries) {
  const totalsByCurrency = new Map()

  for (const entry of entries) {
    const currency = String(entry.priceCurrency ?? "")
    const current = totalsByCurrency.get(currency) ?? { buyer: 0, seller: 0 }
    current[entry.side] += normalizeJournalNumber(entry.totalPriceValue, 0)
    totalsByCurrency.set(currency, current)
  }

  return Array.from(totalsByCurrency.entries())
    .map(([currency, totals]) => {
      const difference = Number((totals.buyer - totals.seller).toFixed(2))
      if (difference === 0) return null

      return {
        id: foundry.utils.randomID(),
        side: difference > 0 ? "seller" : "buyer",
        value: Math.abs(difference),
        currency,
        label: "Ajustement monétaire"
      }
    })
    .filter(Boolean)
}

function isExecutableJournalLine(line, transactionStatus = "validated") {
  if (transactionStatus !== "validated") return false

  const negotiationStatus = String(line?.negotiationStatus ?? "")
  if (["refused", "rejected"].includes(negotiationStatus)) return false

  const lineStatus = String(line?.status ?? "")
  if (["refused", "rejected"].includes(lineStatus)) return false

  return true
}

function getJournalBuyerImg(session) {
  const buyerUuid = String(session?.actorUuid ?? "").trim()
  if (!buyerUuid) return ""

  const actor = game.actors.find((candidate) => candidate.uuid === buyerUuid)
  return actor?.img ?? ""
}

function getJournalReferenceCurrency(entries) {
  const entry = entries.find((line) => String(line.priceCurrency ?? "").trim())
  return String(entry?.priceCurrency ?? "")
}

export function buildMerchantJournalEntryFromSession(actor, session, options = {}) {
  const status = options.status === "refused" ? "refused" : "validated"
  const buyerName = String(session?.actorName ?? session?.label ?? "")
  const { acceptedByLineKey, extraLines } = prepareJournalNegotiations(actor, session, status)
  const buyerItems = Array.isArray(session?.buyerItems) ? session.buyerItems : []
  const sellerItems = Array.isArray(session?.sellerItems) ? session.sellerItems : []
  const entries = [
    ...buyerItems.map((item) => buildJournalLineFromSessionItem(actor, item, "buyer", acceptedByLineKey)),
    ...sellerItems.map((item) => buildJournalLineFromSessionItem(actor, item, "seller", acceptedByLineKey)),
    ...extraLines
  ]
  const executableEntries = entries.filter((entry) => isExecutableJournalLine(entry, status))
  const buyerTotal = executableEntries
    .filter((entry) => entry.side === "buyer")
    .reduce((total, entry) => total + normalizeJournalNumber(entry.totalPriceValue, 0), 0)
  const sellerTotal = executableEntries
    .filter((entry) => entry.side === "seller")
    .reduce((total, entry) => total + normalizeJournalNumber(entry.totalPriceValue, 0), 0)
  const totalReferenceValue = Number((buyerTotal - sellerTotal).toFixed(2))
  const referenceCurrency = getJournalReferenceCurrency(executableEntries) || getJournalReferenceCurrency(entries)

  return normalizeJournalEntry({
    id: foundry.utils.randomID(),
    createdAt: new Date().toISOString(),
    status,
    merchantActorUuid: actor?.uuid ?? "",
    merchantName: getMerchantData(actor)?.shop?.name || actor?.name || "",
    buyerActorUuid: session?.actorUuid ?? "",
    buyerName,
    buyerImg: session?.actorImg ?? getJournalBuyerImg(session),
    referenceCurrency,
    totalReferenceValue,
    summaryLabel:
      status === "refused"
        ? `${buyerName} - transaction refusée`
        : `${buyerName} - ${totalReferenceValue}${referenceCurrency ? ` ${referenceCurrency}` : ""}`,
    entries,
    moneyAdjustments: options.moneyAdjustments ?? prepareJournalMoneyAdjustments(executableEntries),
    secrets: [],
    transactionNumber: options.transactionNumber
  })
}

export function getMerchantJournalTransactions(actor) {
  const transactions = getMerchantData(actor)?.journal?.transactions
  return Array.isArray(transactions) ? transactions : []
}

export function normalizeJournalEntry(entry = {}) {
  const defaults = MTT.JOURNAL_ENTRY_DEFAULTS
  const status = String(entry.status ?? defaults.status)

  return {
    id: String(entry.id ?? foundry.utils.randomID()).trim(),
    transactionNumber: normalizeJournalTransactionNumber(entry.transactionNumber),
    createdAt: String(entry.createdAt ?? new Date().toISOString()),
    status: JOURNAL_STATUSES.includes(status) ? status : defaults.status,
    merchantActorUuid: String(entry.merchantActorUuid ?? defaults.merchantActorUuid),
    merchantName: String(entry.merchantName ?? defaults.merchantName),
    buyerActorUuid: String(entry.buyerActorUuid ?? defaults.buyerActorUuid),
    buyerName: String(entry.buyerName ?? defaults.buyerName),
    buyerImg: String(entry.buyerImg ?? defaults.buyerImg),
    referenceCurrency: String(entry.referenceCurrency ?? defaults.referenceCurrency),
    totalReferenceValue: normalizeJournalNumber(entry.totalReferenceValue, defaults.totalReferenceValue),
    summaryLabel: String(entry.summaryLabel ?? defaults.summaryLabel),
    entries: Array.isArray(entry.entries) ? entry.entries.map((line) => normalizeJournalTransactionEntry(line)) : [],
    moneyAdjustments: Array.isArray(entry.moneyAdjustments)
      ? entry.moneyAdjustments.map((adjustment) => normalizeJournalMoneyAdjustment(adjustment))
      : [],
    secrets: Array.isArray(entry.secrets) ? entry.secrets : []
  }
}

export async function appendMerchantJournalEntry(actor, entry) {
  if (!actor) return null

  const transactions = foundry.utils.deepClone(getMerchantJournalTransactions(actor))
  const nextTransactionNumber = normalizeJournalTransactionNumber(
    getMerchantData(actor)?.journal?.nextTransactionNumber,
    1
  )
  const entryTransactionNumber = normalizeJournalTransactionNumber(entry?.transactionNumber)
  const transactionNumber = entryTransactionNumber ?? nextTransactionNumber
  const nextValue = entryTransactionNumber
    ? Math.max(nextTransactionNumber, entryTransactionNumber + 1)
    : transactionNumber + 1
  const normalizedEntry = normalizeJournalEntry({
    merchantActorUuid: actor.uuid,
    merchantName: getMerchantData(actor)?.shop?.name || actor?.name || "",
    ...entry,
    transactionNumber
  })

  transactions.unshift(normalizedEntry)

  await updateMerchantData(actor, {
    journal: {
      transactions,
      nextTransactionNumber: nextValue
    }
  })

  return normalizedEntry
}

function getJournalBuyerActor(entry) {
  const buyerUuid = String(entry?.buyerActorUuid ?? "").trim()
  if (!buyerUuid) return null

  return game.actors.find((candidate) => candidate.uuid === buyerUuid) ?? null
}

export function prepareMerchantJournalContext(actor, options = {}) {
  const user = options.user ?? game.user
  const sort = normalizeJournalSort(options.sort)
  const permissions = options.permissions ?? {}
  const transactions = getMerchantJournalTransactions(actor)
    .map((entry) => normalizeJournalEntry(entry))
    .filter((entry) => canUserViewClientJournalEntries(getJournalBuyerActor(entry), permissions, user))
    .map((entry) => prepareJournalEntryDisplay(entry))

  transactions.sort((a, b) => compareJournalTransactions(a, b, sort))

  const canSeeAll = Boolean(user?.isGM)

  return {
    canSeeAll,
    canSeeSecretIndicators: canSeeAll,
    hasTransactions: transactions.length > 0,
    transactions,
    sort
  }
}

function normalizeJournalSort(sort = {}) {
  const key = JOURNAL_SORT_KEYS.includes(sort.key) ? sort.key : "date"
  const direction = sort.direction === "asc" ? "asc" : "desc"

  return { key, direction }
}

function compareJournalTransactions(a, b, sort) {
  const direction = sort.direction === "asc" ? 1 : -1

  if (sort.key === "buyer") {
    return (
      String(a.buyerName ?? "").localeCompare(String(b.buyerName ?? ""), undefined, { sensitivity: "base" }) * direction
    )
  }

  if (sort.key === "status") {
    return String(a.status ?? "").localeCompare(String(b.status ?? ""), undefined, { sensitivity: "base" }) * direction
  }

  if (sort.key === "total") {
    return (
      (normalizeJournalNumber(a.totalReferenceValue, 0) - normalizeJournalNumber(b.totalReferenceValue, 0)) * direction
    )
  }

  const dateA = Date.parse(a.createdAt ?? "") || 0
  const dateB = Date.parse(b.createdAt ?? "") || 0
  return (dateA - dateB) * direction
}

export function prepareJournalEntryDisplay(entry) {
  const normalized = normalizeJournalEntry(entry)
  const createdAt = new Date(normalized.createdAt)
  const createdAtLabel = Number.isNaN(createdAt.getTime()) ? "" : createdAt.toLocaleString()
  const createdAtShortLabel = Number.isNaN(createdAt.getTime())
    ? ""
    : createdAt.toLocaleString(undefined, {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      })
  const entries = normalized.entries.map((line) => prepareJournalLineDisplay(line))
  const executableEntries = entries.filter((line) => isExecutableJournalLine(line, normalized.status))
  const paidTotal = executableEntries
    .filter((line) => line.side === "buyer")
    .reduce((total, line) => total + normalizeJournalNumber(line.totalPriceValue, 0), 0)
  const receivedTotal = executableEntries
    .filter((line) => line.side === "seller")
    .reduce((total, line) => total + normalizeJournalNumber(line.totalPriceValue, 0), 0)
  const moneyAdjustment = normalized.moneyAdjustments.reduce((total, adjustment) => {
    const value = normalizeJournalNumber(adjustment.value, 0)
    return total + (adjustment.side === "buyer" ? value : -value)
  }, 0)
  const fallbackAdjustment = -normalizeJournalNumber(normalized.totalReferenceValue, 0)
  const moneyAdjustmentValue = normalized.moneyAdjustments.length > 0 ? moneyAdjustment : fallbackAdjustment
  const moneyAdjustmentSign = moneyAdjustmentValue >= 0 ? "+" : "-"

  return {
    ...normalized,
    transactionNumberLabel: normalized.transactionNumber ? String(normalized.transactionNumber) : JOURNAL_EMPTY_LABEL,
    statusLabelKey: `mtt.journal.status.${normalized.status}`,
    statusClass:
      normalized.status === "refused" ? "mtt-merchant-journal-status-refused" : "mtt-merchant-journal-status-validated",
    createdAtLabel,
    createdAtShortLabel,
    paidTotalValue: paidTotal,
    totalReferenceLabel: formatPriceLabel(normalized.totalReferenceValue, normalized.referenceCurrency),
    receivedTotalValue: receivedTotal,
    moneyAdjustmentValue,
    paidTotalLabel: formatSignedPriceLabel(paidTotal, normalized.referenceCurrency, "-"),
    receivedTotalLabel: formatSignedPriceLabel(receivedTotal, normalized.referenceCurrency, "+"),
    moneyAdjustmentLabel: formatSignedPriceLabel(
      moneyAdjustmentValue,
      normalized.referenceCurrency,
      moneyAdjustmentSign
    ),
    hasEntries: entries.length > 0,
    entries
  }
}

function prepareJournalLineDisplay(line) {
  const normalized = normalizeJournalTransactionEntry(line)
  const sign = normalized.side === "seller" ? "+" : "-"
  const negotiationStatus = String(normalized.negotiationStatus ?? "")
  const hasNegotiationIcon = Boolean(normalized.isNegotiated) && ["accepted", "refused"].includes(negotiationStatus)

  return {
    ...normalized,
    typeIcon:
      {
        product: "fas fa-box",
        service: "fas fa-handshake",
        item: "fas fa-box-open",
        money: "fas fa-coins"
      }[normalized.type] ?? "fas fa-box-open",
    typeLabel: game.i18n.localize(`mtt.journal.type.${normalized.type}`),
    sideLabel: game.i18n.localize(`mtt.journal.side.${normalized.side}`),
    unitPriceLabel: formatPriceLabel(normalized.unitPriceValue, normalized.priceCurrency),
    totalPriceLabel: formatPriceLabel(normalized.totalPriceValue, normalized.priceCurrency),
    signedUnitPriceLabel: formatSignedPriceLabel(normalized.unitPriceValue, normalized.priceCurrency, sign),
    signedTotalPriceLabel: formatSignedPriceLabel(normalized.totalPriceValue, normalized.priceCurrency, sign),
    hasNegotiationIcon,
    negotiationIcon: negotiationStatus === "accepted" ? "fas fa-check" : "fas fa-times",
    negotiationTooltipKey: `mtt.journal.negotiation.${negotiationStatus}`,
    canShowSecretIndicator: Boolean(normalized.hadSecrets)
  }
}
