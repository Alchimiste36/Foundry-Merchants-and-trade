import { MTT } from "../../config/constants.mjs"
import { getCurrencies } from "../../config/settings.mjs"

export function parsePriceValue(value) {
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
    return parsePriceValue(value.value ?? null)
  }

  return null
}

export function parseQuantityValue(value) {
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
    return parseQuantityValue(value.value ?? null)
  }

  return null
}

export function normalizeCurrencyKey(priceCurrency) {
  const currency = String(priceCurrency ?? "").trim()
  return currency || "__none"
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

export function createCheckMessage(level, id, text, icon = "") {
  return { id, level, text, icon }
}

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
