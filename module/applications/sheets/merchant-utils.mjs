import { MTT } from "../../config/constants.mjs"
import { getCurrencies } from "../../config/settings.mjs"

// ─── Parsing / quantités ─────────────────────────────────────────────────────

function parsePositiveNumberValue(value) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value
  }
  if (typeof value === "string") {
    const match = value.match(/-?\d+(?:[\.,]\d+)?/)
    if (!match) return null
    const parsed = Number(match[0].replace(",", "."))
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
  }
  if (typeof value === "object" && value !== null) {
    return parsePositiveNumberValue(value.value ?? null)
  }
  return null
}

export function parsePriceValue(value) {
  return parsePositiveNumberValue(value)
}

export function parseQuantityValue(value) {
  return parsePositiveNumberValue(value)
}

export function isUnlimitedQuantity(value) {
  return value === "" || value === null || value === undefined
}

export function normalizeFiniteQuantity(value) {
  if (isUnlimitedQuantity(value)) return null

  const quantity = Number(value)
  return Number.isFinite(quantity) && quantity >= 0 ? quantity : null
}

export function getConfiguredItemQuantity(itemOrData, quantityPath) {
  if (!quantityPath) return undefined
  return foundry.utils.getProperty(itemOrData, quantityPath)
}

export function getConfiguredItemMaxQuantity(itemOrData, maxQuantityPath) {
  if (!maxQuantityPath) return undefined
  return foundry.utils.getProperty(itemOrData, maxQuantityPath)
}

export function isUnlimitedMaxQuantity(value) {
  return value === "" || value === null || value === undefined
}

export function normalizeMaxQuantity(value) {
  if (isUnlimitedMaxQuantity(value)) return Infinity

  const quantity = Number(value)
  if (!Number.isFinite(quantity) || quantity < 1) return Infinity

  return Math.floor(quantity)
}

export function normalizeItemQuantity(value, fallback = 0) {
  const quantity = Number(value)
  if (!Number.isFinite(quantity)) return fallback

  return Math.max(0, Math.floor(quantity))
}

export function getAvailableStackSpace(currentQuantity, maxQuantity) {
  if (maxQuantity === Infinity) return Infinity

  return Math.max(0, maxQuantity - currentQuantity)
}

export function getDeliveryStackingConfig() {
  return {
    quantityPath:
      String(getModuleSetting("deliveryItemQuantityPath") ?? "").trim() ||
      String(getModuleSetting("itemQuantityPath") ?? "").trim(),
    maxQuantityPath: String(getModuleSetting("deliveryItemMaxQuantityPath") ?? "").trim(),
  }
}

// ─── Secrets / informations cachées ──────────────────────────────────────────

export function hasSecretValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== ""
}

export function productHasSecretInfo(productData = {}) {
  return Boolean(
    hasSecretValue(productData?.secretName) ||
      hasSecretValue(productData?.secretPrice) ||
      hasSecretValue(productData?.secretCurrency) ||
      hasSecretValue(productData?.secretDescription),
  )
}

// ─── Fusion de livraison ─────────────────────────────────────────────────────

export function getMttSourceUuid(itemOrData, productData = null) {
  const directSourceUuid = String(productData?.sourceUuid ?? "").trim()
  if (directSourceUuid) return directSourceUuid

  const productFlagPath = `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}`
  const product =
    (itemOrData ? foundry.utils.getProperty(itemOrData, productFlagPath) : null) ??
    itemOrData?.getFlag?.(MTT.ID, MTT.FLAGS.PRODUCT) ??
    {}

  return String(product.sourceUuid ?? "").trim()
}

function getMttProductFlags(itemOrData) {
  const productFlagPath = `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}`
  return (
    (itemOrData ? foundry.utils.getProperty(itemOrData, productFlagPath) : null) ??
    itemOrData?.getFlag?.(MTT.ID, MTT.FLAGS.PRODUCT) ??
    {}
  )
}

// Uses toLocaleLowerCase for locale-aware comparison of item names and category labels.
// normalizeCurrencyText (exported) uses toLowerCase for stable currency key matching.
function normalizeComparableText(value) {
  return String(value ?? "").trim().toLocaleLowerCase()
}

function normalizeComparableNumber(value) {
  const number = parsePriceValue(value)
  return Number.isFinite(number) ? number : null
}

function getComparableSubtypePath(existingItem, deliveredItemData, productData) {
  const productPath = String(productData?.systemCategoryPath ?? "").trim()
  if (productPath && productPath !== "type") return productPath

  return (
    getCategoryPaths().find((path) => {
      const existingValue = foundry.utils.getProperty(existingItem, path)
      const deliveredValue = foundry.utils.getProperty(deliveredItemData, path)
      return normalizeComparableText(existingValue) || normalizeComparableText(deliveredValue)
    }) ?? ""
  )
}

function getComparableInitialPrice(itemOrData) {
  return normalizeComparableNumber(
    getConfiguredItemValue(itemOrData, "itemPriceValuePath") ?? getItemPrice(itemOrData),
  )
}

function getComparableCurrency(itemOrData) {
  const configuredCurrency = getConfiguredItemValue(itemOrData, "itemPriceCurrencyPath")
  const rawCurrency =
    typeof configuredCurrency === "string" && configuredCurrency.trim()
      ? configuredCurrency
      : getItemCurrency(itemOrData)
  const normalizedCurrency = normalizeComparableText(rawCurrency)
  if (!normalizedCurrency) return ""

  const currency = getCurrencies().find((entry) => {
    const candidates = [entry.id, entry.abbreviation, entry.name]
      .map((value) => normalizeComparableText(value))
      .filter(Boolean)
    return candidates.includes(normalizedCurrency)
  })

  return currency ? normalizeComparableText(currency.id ?? currency.abbreviation) : normalizedCurrency
}

export function canStrictMergeDeliveredItem(existingItem, deliveredItemData, productData = {}) {
  if (productHasSecretInfo(productData)) return false

  const sourceUuid = getMttSourceUuid(deliveredItemData, productData)
  const existingSourceUuid = getMttSourceUuid(existingItem)

  return Boolean(sourceUuid && existingSourceUuid && sourceUuid === existingSourceUuid)
}

export function canExtendedMergeDeliveredItem(existingItem, deliveredItemData, productData = {}) {
  if (productHasSecretInfo(productData)) return false

  const sourceUuid = getMttSourceUuid(deliveredItemData, productData)
  const existingSourceUuid = getMttSourceUuid(existingItem)
  if (sourceUuid && existingSourceUuid) return false

  if (normalizeComparableText(existingItem?.name) !== normalizeComparableText(deliveredItemData?.name)) return false
  if (normalizeComparableText(existingItem?.type) !== normalizeComparableText(deliveredItemData?.type)) return false

  const subtypePath = getComparableSubtypePath(existingItem, deliveredItemData, productData)
  const existingSubtype = subtypePath ? normalizeComparableText(foundry.utils.getProperty(existingItem, subtypePath)) : ""
  const deliveredSubtype = subtypePath
    ? normalizeComparableText(foundry.utils.getProperty(deliveredItemData, subtypePath))
    : ""
  if (existingSubtype !== deliveredSubtype) return false

  if (getComparableInitialPrice(existingItem) !== getComparableInitialPrice(deliveredItemData)) return false
  if (getComparableCurrency(existingItem) !== getComparableCurrency(deliveredItemData)) return false

  return true
}

export function getDeliveredItemMergeMode(existingItem, deliveredItemData, productData = {}) {
  const deliveredProduct = getMttProductFlags(deliveredItemData)
  const existingProduct = getMttProductFlags(existingItem)

  if (
    productHasSecretInfo(productData) ||
    productHasSecretInfo(deliveredProduct) ||
    productHasSecretInfo(existingProduct)
  ) return null

  if (canStrictMergeDeliveredItem(existingItem, deliveredItemData, productData)) return "strict"
  if (!getModuleSetting("allowExtendedItemMerge")) return null
  if (canExtendedMergeDeliveredItem(existingItem, deliveredItemData, productData)) return "extended"

  return null
}

// ─── Monnaies ────────────────────────────────────────────────────────────────

export function normalizeCurrencyKey(priceCurrency) {
  const currency = String(priceCurrency ?? "").trim()
  return currency || "__none"
}

export const FREE_PRICE_CURRENCY_KEY = "__freePrice"

export function isFreePriceCurrency(value) {
  return String(value ?? "").trim() === FREE_PRICE_CURRENCY_KEY
}

export function isFreePriceService(serviceData) {
  return Boolean(serviceData?.hasFreePrice) || isFreePriceCurrency(serviceData?.priceCurrency)
}

export function normalizeCurrencyText(value) {
  return String(value ?? "").trim().toLowerCase()
}

export function resolveConfiguredCurrency(currencyText) {
  const currencies = getCurrencies()
  if (!currencies.length) return null

  const normalized = normalizeCurrencyText(currencyText)

  const match = normalized
    ? currencies.find((entry) => {
        const candidates = [entry.id, entry.abbreviation, entry.name]
          .map((v) => normalizeCurrencyText(v))
          .filter(Boolean)
        return candidates.includes(normalized)
      })
    : null

  return (
    match ??
    currencies.find((c) => Boolean(c.isDefault)) ??
    currencies.find((c) => Number(c.rate) === 1) ??
    currencies[0] ??
    null
  )
}

export function resolveItemCurrencyKey(currencyText) {
  const currency = resolveConfiguredCurrency(currencyText)
  if (!currency) return String(currencyText ?? "").trim()
  return String(currency.abbreviation ?? currency.id ?? "").trim()
}

export function getReferenceSessionCurrency() {
  const currencies = getCurrencies()
  return (
    currencies.find((currency) => Number(currency.rate) === 1) ??
    currencies.find((currency) => Boolean(currency.isDefault)) ??
    currencies[0] ??
    null
  )
}

export function convertPriceToReferenceCurrency(value, priceCurrency) {
  const currencies = getCurrencies()
  const referenceCurrency = getReferenceSessionCurrency()
  const rawValue = Number(value)
  const safeValue = Number.isFinite(rawValue) && rawValue >= 0 ? rawValue : 0

  if (!referenceCurrency) {
    return {
      value: Number(safeValue.toFixed(2)),
      currency: String(priceCurrency ?? "").trim(),
    }
  }

  const normalizedCurrency = normalizeCurrencyText(priceCurrency)
  const sourceCurrency = currencies.find((currency) => {
    const candidates = [currency.id, currency.abbreviation, currency.name]
      .map((entry) => normalizeCurrencyText(entry))
      .filter(Boolean)
    return candidates.includes(normalizedCurrency)
  })
  const sourceRate = Number(sourceCurrency?.rate)
  const safeRate = Number.isFinite(sourceRate) && sourceRate > 0 ? sourceRate : 1
  const convertedValue = safeValue * safeRate

  return {
    value: Number(convertedValue.toFixed(2)),
    currency: String(referenceCurrency.abbreviation ?? referenceCurrency.id ?? "").trim(),
  }
}

const MONEY_EPSILON = 1e-8

export function cleanMoneyNumber(value) {
  return Math.round(Number(value) * 1e8) / 1e8
}

export function getSmallestCurrencyRate(currencies) {
  let smallest = null
  for (const c of currencies) {
    const rate = Number(c.rate)
    if (!Number.isFinite(rate) || rate <= 0) continue
    if (smallest === null || rate < smallest) smallest = rate
  }
  return smallest
}

export function roundToSmallestCurrencyUnit(amountReference, currencies) {
  const smallestRate = getSmallestCurrencyRate(currencies)
  if (smallestRate === null) return cleanMoneyNumber(amountReference)
  const units = Number(amountReference) / smallestRate
  const floorUnits = Math.floor(units)
  const fraction = units - floorUnits
  const roundedUnits = fraction > 0.5 + MONEY_EPSILON ? floorUnits + 1 : floorUnits
  return cleanMoneyNumber(roundedUnits * smallestRate)
}

export function formatCurrencyLabel(priceCurrency) {
  const currency = String(priceCurrency ?? "").trim()
  return currency || game.i18n.localize("mtt.sessions.undefinedCurrency")
}

export function formatPriceLabel(priceValue, priceCurrency) {
  const normalizedPrice = Number(priceValue)
  if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) return ""

  const formattedPrice = Number.isInteger(normalizedPrice)
    ? String(normalizedPrice)
    : String(normalizedPrice.toFixed(2)).replace(/\.?0+$/, "")
  const currency = String(priceCurrency ?? "").trim()

  return `${formattedPrice} ${formatCurrencyLabel(currency)}`
}

// ─── HTML / texte ────────────────────────────────────────────────────────────

export function escapeHTML(value) {
  const text = String(value ?? "")
  return foundry.utils.escapeHTML
    ? foundry.utils.escapeHTML(text)
    : text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
}

export function htmlToPlainText(value) {
  const html = String(value ?? "")
  if (!html) return ""

  const withLineBreaks = html
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/\s*p\s*>/gi, "\n")
    .replace(/<\s*\/\s*div\s*>/gi, "\n")
    .replace(/<\s*\/\s*li\s*>/gi, "\n")

  if (typeof document !== "undefined") {
    const container = document.createElement("div")
    container.innerHTML = withLineBreaks
    return container.textContent.replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").trim()
  }

  return withLineBreaks
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

// ─── Droits / état feuille ───────────────────────────────────────────────────

export function getMerchantSheetLockedState(actor) {
  return Boolean(foundry.utils.getProperty(actor, "system.sheet.isLocked"))
}

export function getMerchantLimitedState(actor, user = game.user) {
  if (!actor || !user?.id || user.isGM) return false

  const permissionLevel = actor.getUserLevel?.(user) ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
  return permissionLevel === CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED
}

// ─── Catégories ──────────────────────────────────────────────────────────────

export function slugifyCategoryKey(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function formatAutomaticCategoryLabel(value) {
  const label = String(value ?? "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")

  if (!label) return ""

  return label.charAt(0).toLocaleUpperCase() + label.slice(1)
}

export function normalizeAutomaticCategoryValue(value) {
  if (value === null || value === undefined) return null
  if (typeof value === "object") return null

  const raw = String(value).trim()
  if (!raw) return null

  const key = slugifyCategoryKey(raw)
  if (!key) return null

  return {
    key,
    label: formatAutomaticCategoryLabel(raw),
    raw,
  }
}

export function localizeConfiguredValue(rawValue, prefix = "") {
  const value = String(rawValue ?? "").trim()
  const i18nPrefix = String(prefix ?? "").trim()

  if (!value) return ""

  if (i18nPrefix) {
    const key = `${i18nPrefix}${value}`
    const localized = game.i18n.localize(key)
    if (localized && localized !== key) return localized
  }

  const localizedRaw = game.i18n.localize(value)
  if (localizedRaw && localizedRaw !== value) return localizedRaw

  return value
}

export function createCheckMessage(level, id, text, icon = "") {
  return { id, level, text, icon }
}

// ─── Lecture d'items ─────────────────────────────────────────────────────────

export function getItemDescription(item) {
  try {
    const candidates = [
      foundry.utils.getProperty(item, "system.description"),
      foundry.utils.getProperty(item, "system.description.value"),
      foundry.utils.getProperty(item, "system.details.description"),
    ]

    for (const c of candidates) {
      if (!c) continue
      if (typeof c === "string") return c
      if (c?.value) return c.value
    }
  } catch {
    // ignore
  }

  return ""
}

export function getItemPrice(item) {
  try {
    const candidates = [
      foundry.utils.getProperty(item, "system.price"),
      foundry.utils.getProperty(item, "system.cost"),
      foundry.utils.getProperty(item, "system.value"),
    ]

    for (const c of candidates) {
      if (c === undefined || c === null) continue
      if (typeof c === "number" && Number.isFinite(c)) return c
      if (typeof c === "string") {
        const m = c.match(/-?\d+(?:[\.,]\d+)?/)
        if (m) return Number(m[0].replace(",", "."))
      }
      if (typeof c === "object" && c?.value) {
        const v = c.value
        if (typeof v === "number" && Number.isFinite(v)) return v
        if (typeof v === "string") {
          const m = v.match(/-?\d+(?:[\.,]\d+)?/)
          if (m) return Number(m[0].replace(",", "."))
        }
      }
    }
  } catch {
    // ignore
  }

  return 0
}

export function getItemCurrency(item) {
  const candidates = [
    foundry.utils.getProperty(item, "system.price.currency"),
    foundry.utils.getProperty(item, "system.cost.currency"),
    foundry.utils.getProperty(item, "system.value.currency"),
    foundry.utils.getProperty(item, "system.price.denomination"),
    foundry.utils.getProperty(item, "system.currency"),
  ]

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim()
  }

  return ""
}

// ─── Settings / lecture de chemins ───────────────────────────────────────────

export function getModuleSetting(key) {
  return game.settings.get(MTT.ID, key) ?? ""
}

export function getConfiguredItemValue(item, settingKey) {
  const path = String(getModuleSetting(settingKey) ?? "").trim()
  if (!path) return null

  return foundry.utils.getProperty(item, path)
}

export function getAllowedTypes(settingKey) {
  const raw = String(getModuleSetting(settingKey) ?? "").trim()
  if (!raw) return null

  return raw
    .split(",")
    .map((itemType) => itemType.trim().toLowerCase())
    .filter(Boolean)
}

export function isItemTypeAllowed(item, settingKey) {
  const allowedTypes = getAllowedTypes(settingKey)
  if (!allowedTypes) return true

  const itemType = String(item.type ?? "").toLowerCase()
  return allowedTypes.includes(itemType)
}

export function getCategoryPaths() {
  return String(getModuleSetting("itemCategoryPaths"))
    .split(/[\n,]/)
    .map((path) => path.trim())
    .filter(Boolean)
}

export function getCategoryLabelMap() {
  const rawMap = getModuleSetting("categoryLabelMap") ?? ""
  const map = new Map()

  String(rawMap)
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const separatorIndex = line.indexOf("=")
      if (separatorIndex === -1) return

      const key = slugifyCategoryKey(line.slice(0, separatorIndex))
      const label = line.slice(separatorIndex + 1).trim()
      if (!key || !label) return

      map.set(key, label)
    })

  return map
}

// ─── Universal currency reading (Étape B) ────────────────────────────────────

export function parseCurrencyAliases(value) {
  return String(value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function matchesCurrencyAlias(actual, aliases) {
  const normalizedActual = String(actual ?? "").trim().toLocaleLowerCase()
  return aliases.some((alias) => alias.toLocaleLowerCase() === normalizedActual)
}

export function readItemCurrencyAmount(item, currency) {
  const itemPricePath = String(currency.itemPricePath ?? "").trim()
  if (!itemPricePath) return 0

  const amount = Number(foundry.utils.getProperty(item, itemPricePath))
  if (!Number.isFinite(amount) || amount <= 0) return 0

  const itemCurrencyPath = String(currency.itemCurrencyPath ?? "").trim()
  if (itemCurrencyPath) {
    const actualCurrency = foundry.utils.getProperty(item, itemCurrencyPath)
    const aliases = parseCurrencyAliases(currency.itemCurrencyValues)
    if (!matchesCurrencyAlias(actualCurrency, aliases)) return 0
  }

  return amount
}

export function readItemCurrencyAmounts(item, currencies) {
  return currencies.map((currency) => ({
    currencyId: currency.id,
    abbreviation: currency.abbreviation,
    rate: Number(currency.rate) || 1,
    amount: readItemCurrencyAmount(item, currency),
  }))
}

export function convertCurrencyAmountsToReference(amounts, referenceCurrency) {
  if (!referenceCurrency) return 0
  const referenceRate = Number(referenceCurrency.rate)
  const safeReferenceRate = Number.isFinite(referenceRate) && referenceRate > 0 ? referenceRate : 1

  let total = 0
  for (const entry of amounts) {
    const safeRate = Number.isFinite(entry.rate) && entry.rate > 0 ? entry.rate : 1
    total += entry.amount * safeRate
  }

  return Number((total / safeReferenceRate).toFixed(2))
}

export function readItemReferencePrice(item) {
  const currencies = getCurrencies()
  const referenceCurrency = getReferenceSessionCurrency()
  const currenciesWithPaths = currencies.filter((c) => String(c.itemPricePath ?? "").trim())

  if (currenciesWithPaths.length === 0 || !referenceCurrency) return null

  const amounts = readItemCurrencyAmounts(item, currencies)
  if (!amounts.some((a) => a.amount > 0)) return null

  const refValue = convertCurrencyAmountsToReference(amounts, referenceCurrency)

  return {
    value: refValue,
    currency: String(referenceCurrency.abbreviation ?? referenceCurrency.id ?? "").trim(),
  }
}

export function readItemLegacyPriceData(item) {
  const configuredPrice = getConfiguredItemValue(item, "itemPriceValuePath")
  const rawPrice = parsePriceValue(configuredPrice) ?? getItemPrice(item)
  const value = rawPrice !== null ? rawPrice : 0

  const configuredCurrency = getConfiguredItemValue(item, "itemPriceCurrencyPath")
  const rawCurrency =
    typeof configuredCurrency === "string" && configuredCurrency.trim()
      ? configuredCurrency.trim()
      : getItemCurrency(item)
  const currency = resolveItemCurrencyKey(rawCurrency)

  return { value, currency }
}

export function buildItemPriceWriteData(value, currency) {
  const currencies = getCurrencies()
  const currenciesWithPaths = currencies.filter((c) => String(c.itemPricePath ?? "").trim())

  if (currenciesWithPaths.length === 0) {
    const pricePath = String(getModuleSetting("itemPriceValuePath") ?? "").trim()
    const currencyPath = String(getModuleSetting("itemPriceCurrencyPath") ?? "").trim()
    if (!pricePath) return { ok: false, paths: {} }
    const paths = { [pricePath]: value }
    if (currencyPath && currency) paths[currencyPath] = currency
    return { ok: true, paths }
  }

  const targetCurrency = resolveConfiguredCurrency(currency)
  const targetPath = String(targetCurrency?.itemPricePath ?? "").trim()
  if (!targetCurrency || !targetPath) return { ok: false, paths: {} }

  const paths = {}
  for (const c of currenciesWithPaths) {
    const path = String(c.itemPricePath ?? "").trim()
    if (path && c !== targetCurrency) paths[path] = 0
  }
  paths[targetPath] = value

  const currencyIdPath = String(targetCurrency.itemCurrencyPath ?? "").trim()
  if (currencyIdPath) {
    const aliases = parseCurrencyAliases(targetCurrency.itemCurrencyValues)
    const writeValue = aliases[0] ?? String(targetCurrency.abbreviation ?? "").trim()
    if (writeValue) paths[currencyIdPath] = writeValue
  }

  return { ok: true, paths }
}

// ─── Options de monnaies ─────────────────────────────────────────────────────

export function prepareCurrencyOptions() {
  const currencies = getCurrencies()
  const options = currencies
    .map((c) => {
      const abbr = String(c.abbreviation ?? "").trim()
      const fallbackAbbr = String(c.abbr ?? c.code ?? "").trim()
      const name = String(c.name ?? "").trim()
      const id = String(c.id ?? "").trim()
      const key = abbr || id
      const label = name || abbr || id
      if (!key) return null
      return {
        key,
        value: key,
        abbreviation: abbr || fallbackAbbr || key || label,
        label,
        isFreePrice: false,
      }
    })
    .filter(Boolean)
  options.push({
    key: FREE_PRICE_CURRENCY_KEY,
    value: FREE_PRICE_CURRENCY_KEY,
    abbreviation: "",
    label: game.i18n.localize("mtt.price.freePrice"),
    isFreePrice: true,
  })
  return options
}

export function buildCurrencySelectOptions(selectedKey) {
  const currencies = getCurrencies()
  const options = []
  const usedKeys = new Set()

  for (const c of currencies) {
    const abbr = String(c.abbreviation ?? "").trim()
    const fallbackAbbr = String(c.abbr ?? c.code ?? "").trim()
    const name = String(c.name ?? "").trim()
    const id = String(c.id ?? "").trim()
    const key = abbr || id
    const label = name || abbr || id
    const abbreviation = abbr || fallbackAbbr || key || label
    if (!key) continue
    usedKeys.add(key)
    options.push({ key, label, abbreviation })
  }

  if (selectedKey && !usedKeys.has(selectedKey)) {
    options.push({ key: selectedKey, label: selectedKey, abbreviation: selectedKey })
  }

  return options
    .map(({ key, label, abbreviation }) => {
      const sel = key === selectedKey ? " selected" : ""
      const title = label && label !== abbreviation ? ` title="${escapeHTML(label)}"` : ""
      return `<option value="${escapeHTML(key)}"${title}${sel}>${escapeHTML(abbreviation)}</option>`
    })
    .join("")
}
