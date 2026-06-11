import { MTT } from "../../config/constants.mjs"
import { getCurrencies } from "../../config/settings.mjs"
import { getMerchantData, updateMerchantData } from "../../documents/merchant-flags.mjs"
import {
  getCatalogProducts,
  findMergeableCatalogProduct,
  findMergeableCatalogItemBySourceUuid,
  getMerchantProductFlags,
  buildCatalogProductFromItem,
  addCatalogProduct,
  updateCatalogProduct,
} from "../../documents/merchant-products.mjs"
import {
  parseQuantityValue,
  isUnlimitedQuantity,
  FREE_PRICE_CURRENCY_KEY,
  isFreePriceService,
  formatPriceLabel,
  normalizeAutomaticCategoryValue,
  slugifyCategoryKey,
  getCategoryPaths,
  getCategoryLabelMap,
  localizeConfiguredValue,
  getConfiguredItemValue,
  getModuleSetting,
  getItemDescription,
  getItemPrice,
  getItemCurrency,
  resolveItemCurrencyKey,
  getReferenceSessionCurrency,
  htmlToPlainText,
  productHasSecretInfo,
  readItemReferencePrice,
  normalizeEffectiveDeliveryQuantityPerLot,
  formatProductNameWithLotQuantity,
} from "./merchant-utils.mjs"

export function adjustPriceValue(priceValue, sellPercent) {
  const numericPrice = Number(priceValue)
  if (!Number.isFinite(numericPrice) || numericPrice < 0) return 0

  return Number(((numericPrice * sellPercent) / 100).toFixed(2))
}

export function prepareTrade(actor) {
  const trade = getMerchantData(actor)?.trade
  return {
    buyPercent:
      Number.isFinite(Number(trade?.buyPercent)) && Number(trade?.buyPercent) >= 0
        ? Number(trade.buyPercent)
        : 50,
    sellPercent:
      Number.isFinite(Number(trade?.sellPercent)) && Number(trade?.sellPercent) >= 0
        ? Number(trade.sellPercent)
        : 100,
    serviceSellPercent:
      Number.isFinite(Number(trade?.serviceSellPercent)) && Number(trade?.serviceSellPercent) >= 0
        ? Number(trade.serviceSellPercent)
        : 100,
    negotiationFormula: trade?.negotiationFormula ?? "",
  }
}

export function prepareWalletCurrencies(actor) {
  const walletCurrencies = getMerchantData(actor)?.wallet?.currencies ?? {}

  return getCurrencies()
    .map((currency) => {
      const id = String(currency.id ?? "").trim()
      if (!id) return null

      const configuredAmount = Number(walletCurrencies[id] ?? 0)

      return {
        id,
        label: String(currency.abbreviation ?? "").trim() || String(currency.name ?? "").trim() || id,
        name: String(currency.name ?? "").trim(),
        amount: Number.isFinite(configuredAmount) && configuredAmount >= 0 ? configuredAmount : 0,
        rate: currency.rate,
        isDefault: Boolean(currency.isDefault),
      }
    })
    .filter(Boolean)
}

export function getReferenceCurrency() {
  return getReferenceSessionCurrency()
}

function buildSecretTooltip({ secretName = "", secretPrice = "", secretCurrency = "", secretDescription = "" } = {}) {
  const description = String(secretDescription ?? "").trim()
  const shortDescription = description.length > 180 ? `${description.slice(0, 177)}...` : description
  const priceLabel = [secretPrice, secretCurrency].map((value) => String(value ?? "").trim()).filter(Boolean).join(" ")
  const lines = []

  if (String(secretName ?? "").trim()) {
    lines.push(`${game.i18n.localize("mtt.secrets.tooltip.name")} ${String(secretName ?? "").trim()}`)
  }
  if (priceLabel) {
    lines.push(`${game.i18n.localize("mtt.secrets.tooltip.price")} ${priceLabel}`)
  }
  if (shortDescription) {
    lines.push(`${game.i18n.localize("mtt.secrets.tooltip.description")} ${shortDescription}`)
  }

  return lines.join("\n")
}

export function prepareItems(actor, sellPercent, { includeHidden = false } = {}) {
  const products = getCatalogProducts(actor)

  const items = products.map((product) => {
    const quantity = product.quantity
    const effectiveDeliveryQuantityPerLot = normalizeEffectiveDeliveryQuantityPerLot(product.deliveryQuantityPerLot)
    const hasDeliveryQuantityPerLot = effectiveDeliveryQuantityPerLot > 1
    const displayName = formatProductNameWithLotQuantity(product.name, product.deliveryQuantityPerLot)
    const hasFreePrice = product.hasFreePrice

    const itemPriceValue = product.priceValue
    const priceCurrency = product.priceCurrency

    const displayPriceValue = hasFreePrice ? itemPriceValue : adjustPriceValue(itemPriceValue, sellPercent)
    const isHidden = product.isHidden
    const isVisible = !isHidden
    const ownershipLevel = product.ownershipLevel
    const isObserverOwnership = ownershipLevel === CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
    const isLimitedOwnership = !isObserverOwnership
    const ownershipClass = isObserverOwnership
      ? "mtt-merchant-product-ownership-observer"
      : "mtt-merchant-product-ownership-limited"
    const ownershipLabelKey = isObserverOwnership
      ? "mtt.products.ownership.observer"
      : "mtt.products.ownership.limited"
    const secretName = product.secretName
    const secretPrice = product.secretPrice
    const secretCurrency = product.secretCurrency
    const secretDescription = product.secretDescription
    const hasSecrets = productHasSecretInfo({ secretName, secretPrice, secretCurrency, secretDescription })

    return {
      id: product.id,
      name: product.name,
      displayName,
      type: product.type,
      img: product.img,
      quantity,
      deliveryQuantityPerLot: hasDeliveryQuantityPerLot ? effectiveDeliveryQuantityPerLot : "",
      effectiveDeliveryQuantityPerLot,
      hasQuantity: !isUnlimitedQuantity(quantity),
      itemData: product.itemData,
      sourceUuid: product.sourceUuid,
      secretName,
      secretPrice,
      secretCurrency,
      secretDescription,
      priceValue: itemPriceValue,
      itemPriceValue,
      displayPriceValue,
      priceCurrency,
      category: product.category,
      hasCategory: Boolean(product.category),
      systemCategoryKey: product.systemCategoryKey,
      systemCategoryLabel: product.systemCategoryLabel,
      systemCategoryPath: product.systemCategoryPath,
      systemSubcategory: product.systemSubcategory,
      hasSystemCategory: Boolean(product.systemCategoryKey || product.systemCategoryLabel),
      hasPrice: Number.isFinite(displayPriceValue) && displayPriceValue >= 0,
      isHidden,
      isVisible,
      ownershipLevel,
      isLimitedOwnership,
      isObserverOwnership,
      ownershipClass,
      ownershipLabelKey,
      requiresApproval: product.requiresApproval,
      priceLabel: formatPriceLabel(displayPriceValue, priceCurrency),
      displayPriceLabel: formatPriceLabel(displayPriceValue, priceCurrency),
      itemPriceLabel: formatPriceLabel(itemPriceValue, priceCurrency),
      hasSecrets,
      hasSecretInfos: hasSecrets,
      secretTooltip: hasSecrets ? buildSecretTooltip({ secretName, secretPrice, secretCurrency, secretDescription }) : "",
      isSecretExpanded: product.isSecretExpanded,
      hasFreePrice,
      minimumPriceValue: product.minimumPriceValue,
      selectedCurrencyKey: hasFreePrice ? FREE_PRICE_CURRENCY_KEY : priceCurrency,
    }
  }).filter((item) => includeHidden || item.isVisible)

  return assignSubcategoryIconClasses(items)
}

function assignSubcategoryIconClasses(products) {
  const iconClasses = ["fa-solid fa-label", "fa-light fa-label"]
  const i18nPrefix = String(game.settings.get(MTT.ID, "itemSubcategoryI18nPrefix") ?? "").trim()

  // Group products by main category to compute per-category icon assignment.
  const productsByCategory = new Map()
  for (const product of products) {
    const categoryKey = String(product.category ?? "").trim() || "default"
    if (!productsByCategory.has(categoryKey)) productsByCategory.set(categoryKey, [])
    productsByCategory.get(categoryKey).push(product)
  }

  // For each category: collect subcategories, sort them, assign icon by sorted position.
  // Icon depends on alphabetical rank, not drop order.
  for (const categoryProducts of productsByCategory.values()) {
    const seen = new Map() // normalized key → localized label
    for (const p of categoryProducts) {
      const raw = String(p.systemSubcategory ?? "").trim()
      if (raw) {
        const localized = localizeConfiguredValue(raw, i18nPrefix)
        seen.set(raw.toLocaleLowerCase(), localized)
      }
    }

    const sortedKeys = Array.from(seen.keys()).sort((a, b) =>
      seen.get(a).localeCompare(seen.get(b)),
    )
    const iconByKey = new Map(sortedKeys.map((k, i) => [k, iconClasses[i % iconClasses.length]]))

    for (const product of categoryProducts) {
      const raw = String(product.systemSubcategory ?? "").trim()
      const subcategoryLabel = raw ? localizeConfiguredValue(raw, i18nPrefix) : ""
      product.hasSubcategory = Boolean(raw)
      product.subcategoryLabel = subcategoryLabel
      product.subcategoryIconClass = raw
        ? (iconByKey.get(raw.toLocaleLowerCase()) ?? iconClasses[0])
        : ""
    }
  }

  // Sort the flat array by [subcategoryLabel, name].
  // prepareProductCategories pushes items in array order into category groups,
  // so this ensures intra-category subcategory ordering without cross-contamination.
  if (products.some((p) => p.hasSubcategory)) {
    products.sort((a, b) => {
      const subA = String(a.subcategoryLabel ?? "").toLocaleLowerCase()
      const subB = String(b.subcategoryLabel ?? "").toLocaleLowerCase()
      if (subA && subB && subA !== subB) return subA.localeCompare(subB)
      if (subA && !subB) return -1
      if (!subA && subB) return 1
      return String(a.name ?? "").localeCompare(String(b.name ?? ""))
    })
  }

  return products
}

export function prepareServices(actor, serviceSellPercent, { includeHidden = false } = {}) {
  const entries = getMerchantData(actor)?.catalog?.services ?? []
  return entries.map((service) => {
    const basePriceValue =
      Number.isFinite(Number(service.priceValue)) && Number(service.priceValue) >= 0
        ? Number(service.priceValue)
        : MTT.SERVICE_DEFAULTS.priceValue
    const hasFreePrice = isFreePriceService(service)
    const displayPriceValue = hasFreePrice ? basePriceValue : adjustPriceValue(basePriceValue, serviceSellPercent)
    const priceCurrency = service.priceCurrency?.trim() ?? MTT.SERVICE_DEFAULTS.priceCurrency
    const isHidden = Boolean(service.isHidden ?? MTT.SERVICE_DEFAULTS.isHidden)
    const isVisible = !isHidden
    const secretName = service.secretName ?? ""
    const secretPrice = service.secretPrice ?? ""
    const secretCurrency = service.secretCurrency ?? ""
    const secretDescription = service.secretDescription ?? ""
    const hasSecrets = productHasSecretInfo({ secretName, secretPrice, secretCurrency, secretDescription })

    return {
      id: service.id,
      name: service.name,
      description: service.description || "",
      descriptionText: htmlToPlainText(service.description || ""),
      secretName,
      secretPrice,
      secretCurrency,
      secretDescription,
      hasSecrets,
      secretTooltip: hasSecrets ? buildSecretTooltip({ secretName, secretPrice, secretCurrency, secretDescription }) : "",
      priceValue: basePriceValue,
      basePriceValue,
      displayPriceValue,
      priceCurrency,
      hasPrice: Number.isFinite(displayPriceValue) && displayPriceValue >= 0,
      priceLabel: formatPriceLabel(displayPriceValue, priceCurrency),
      displayPriceLabel: formatPriceLabel(displayPriceValue, priceCurrency),
      basePriceLabel: formatPriceLabel(basePriceValue, priceCurrency),
      quantity: service.quantity,
      hasQuantity: !isUnlimitedQuantity(service.quantity),
      isHidden,
      isVisible,
      requiresApproval: service.requiresApproval ?? MTT.SERVICE_DEFAULTS.requiresApproval,
      isExpanded: service.isExpanded ?? MTT.SERVICE_DEFAULTS.isExpanded,
      sourceUuid: service.sourceUuid ?? null,
      sourceName: service.sourceName ?? "",
      sourceType: service.sourceType ?? "",
      sourceImg: service.sourceImg ?? "",
      hasSource: Boolean(service.sourceUuid || service.sourceName || service.sourceType || service.sourceImg),
      category: service.category ?? "",
      systemCategoryKey: service.systemCategoryKey ?? "",
      systemCategoryLabel: service.systemCategoryLabel ?? "",
      systemCategoryPath: service.systemCategoryPath ?? "",
      isCommerciallyModified: Boolean(service.isCommerciallyModified),
      hasSystemCategory: Boolean(service.systemCategoryKey || service.systemCategoryLabel),
      hasFreePrice,
      minimumPriceValue:
        Number.isFinite(Number(service.minimumPriceValue)) && Number(service.minimumPriceValue) >= 0
          ? Number(service.minimumPriceValue)
          : MTT.SERVICE_DEFAULTS.minimumPriceValue,
      selectedCurrencyKey:
        hasFreePrice
          ? FREE_PRICE_CURRENCY_KEY
          : (service.priceCurrency?.trim() ?? MTT.SERVICE_DEFAULTS.priceCurrency),
    }
  }).filter((service) => includeHidden || service.isVisible)
}

export function prepareProductCategories(actor, items, { includeHidden = false } = {}) {
  const merchantCatalog = getMerchantData(actor)?.catalog
  const definedCategories = merchantCatalog?.productCategories ?? []
  const categories = new Map()
  const hiddenCategories = merchantCatalog?.hiddenCategories ?? {}

  const shouldShowSystemCategory = items.length > 0 || definedCategories.length > 0
  if (shouldShowSystemCategory) {
    const isHidden = Boolean(hiddenCategories[""])
    categories.set("", {
      id: "category-uncategorized",
      name: game.i18n.localize("mtt.products.category.undefined"),
      categoryValue: "",
      items: [],
      count: 0,
      isCollapsed: false,
      isHidden,
      isVisible: !isHidden,
      isSystemCategory: true,
    })
  }

  definedCategories.forEach((category) => {
    if (!category?.id) return
    const isHidden = Boolean(hiddenCategories[category.id])
    categories.set(category.id, {
      id: category.id,
      name: category.name || category.id,
      categoryValue: category.id,
      items: [],
      count: 0,
      isCollapsed: false,
      isHidden,
      isVisible: !isHidden,
      isSystemCategory: false,
    })
  })

  items.forEach((item) => {
    const categoryValue = item.category && categories.has(item.category) ? item.category : ""
    const group = categories.get(categoryValue)
    if (!group) return
    group.items.push(item)
    group.count += 1
  })

  const collapsedCategories = merchantCatalog?.collapsedCategories ?? {}

  const sortedCategories = Array.from(categories.values())
    .filter((group) => includeHidden || group.isVisible)
    .map((group) => ({
      ...group,
      isCollapsed: Boolean(collapsedCategories[group.categoryValue]),
    }))

  sortedCategories.sort((a, b) => {
    if (a.isSystemCategory && !b.isSystemCategory) return -1
    if (!a.isSystemCategory && b.isSystemCategory) return 1
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  })

  return sortedCategories
}

export function getAutomaticItemCategory(item) {
  const paths = getCategoryPaths()
  const labelMap = getCategoryLabelMap()
  const i18nPrefix = String(game.settings.get(MTT.ID, "itemCategoryI18nPrefix") ?? "").trim()

  const resolveLabel = (normalized) => {
    if (labelMap.has(normalized.key)) return labelMap.get(normalized.key)
    const localized = localizeConfiguredValue(normalized.raw, i18nPrefix)
    return localized !== normalized.raw ? localized : normalized.label
  }

  for (const path of paths) {
    const normalized = normalizeAutomaticCategoryValue(foundry.utils.getProperty(item, path))
    if (!normalized) continue

    return {
      ...normalized,
      label: resolveLabel(normalized),
      path,
    }
  }

  if (game.settings.get(MTT.ID, "useItemTypeAsCategoryFallback")) {
    const normalized = normalizeAutomaticCategoryValue(item.type)
    if (normalized) {
      return {
        ...normalized,
        label: resolveLabel(normalized),
        path: "type",
      }
    }
  }

  return null
}

export async function getOrCreateAutomaticProductCategory(actor, automaticCategory) {
  if (!automaticCategory?.key) return ""

  const categories = foundry.utils.deepClone(getMerchantData(actor)?.catalog?.productCategories ?? [])
  const matchingCategory = categories.find((category) => {
    if (!category?.id) return false
    if (category.id === automaticCategory.key || category.id === `auto-${automaticCategory.key}`) return true
    const categoryNameKey = slugifyCategoryKey(category.name)
    return (
      categoryNameKey === automaticCategory.key ||
      categoryNameKey === slugifyCategoryKey(automaticCategory.label)
    )
  })

  if (matchingCategory) return matchingCategory.id

  const categoryId = `auto-${automaticCategory.key}`
  categories.push({
    id: categoryId,
    name: automaticCategory.label || automaticCategory.raw,
  })

  await updateMerchantData(actor, { catalog: { productCategories: categories } })

  return categoryId
}

export function resolveDroppedItemSourceUuid(event, document) {
  const productFlag = document?.getFlag?.(MTT.ID, MTT.FLAGS.PRODUCT)
  const flagSourceUuid = String(productFlag?.sourceUuid ?? "").trim()
  if (flagSourceUuid) return flagSourceUuid

  let dropUuid = ""
  try {
    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event)
    dropUuid = String(data?.uuid ?? "").trim()
  } catch {
    dropUuid = ""
  }

  if (dropUuid) return dropUuid

  return String(document?.uuid ?? "").trim()
}

export function findMergeableMerchantItemBySourceUuid(actor, sourceUuid) {
  return findMergeableCatalogItemBySourceUuid(actor, sourceUuid)
}

export async function addOrMergeProduct(actor, sourceItem, categoryValue = "", automaticCategory = null, sourceUuid = "") {
  const normalizedSourceUuid = String(sourceUuid ?? sourceItem?.uuid ?? "").trim()
  const existingItem = findMergeableCatalogItemBySourceUuid(actor, normalizedSourceUuid)

  if (existingItem) {
    const existingFlags = getMerchantProductFlags(existingItem)
    const currentQuantity = isUnlimitedQuantity(existingFlags.quantity)
      ? 1
      : (Number.isFinite(Number(existingFlags.quantity)) ? Number(existingFlags.quantity) : 1)

    await updateCatalogProduct(actor, existingItem.id, {
      quantity: Number((currentQuantity + 1).toFixed(2)),
    })

    return existingItem
  }

  const product = buildCatalogProductFromItem(sourceItem, {
    categoryValue,
    automaticCategory,
    sourceUuid: normalizedSourceUuid,
  })

  return addCatalogProduct(actor, product)
}

export async function moveProductToCategory(actor, productId, categoryValue) {
  await updateCatalogProduct(actor, productId, { category: categoryValue ?? "" })
}

// TODO étape 9 : supprimer quand l'exécution des transactions sera adaptée au catalogue flags.
// Utilisé uniquement dans buildMerchantReceivedItemData (merchant-trade.mjs) pour la vente PJ→marchand.
export function prepareMerchantCatalogItemData(sourceItem, options = {}) {
  const rawItemData = sourceItem?.toObject ? sourceItem.toObject() : foundry.utils.deepClone(sourceItem ?? {})
  delete rawItemData._id
  delete rawItemData.uuid
  if (rawItemData.flags?.[MTT.ID]) delete rawItemData.flags[MTT.ID]
  return rawItemData
}

export async function createServiceFromItem(actor, item) {
  const entries = foundry.utils.deepClone(getMerchantData(actor)?.catalog?.services ?? [])

  const newId = foundry.utils.randomID()

  let description = getConfiguredItemValue(item, "itemDescriptionPath")
  if (description === null || description === undefined || description === "") {
    description = getItemDescription(item) ?? ""
  }
  if (typeof description === "object" && description?.value) {
    description = description.value
  }
  description = description ? htmlToPlainText(description) : ""

  const universalServicePrice = readItemReferencePrice(item)
  let priceValue, priceCurrency

  if (universalServicePrice !== null) {
    priceValue = universalServicePrice.value
    priceCurrency = universalServicePrice.currency
  } else {
    priceValue = getItemPrice(item) ?? 0
    priceCurrency = resolveItemCurrencyKey(getItemCurrency(item))
  }

  const automaticCategory = getAutomaticItemCategory(item)

  const newService = {
    id: newId,
    ...foundry.utils.deepClone(MTT.SERVICE_DEFAULTS),
    name: item.name ?? "",
    description,
    priceValue,
    priceCurrency,
    quantity: null,
    isHidden: false,
    requiresApproval: false,
    isExpanded: true,
    sourceUuid: item.uuid ?? null,
    sourceName: item.name ?? "",
    sourceType: item.type ?? "",
    sourceImg: item.img || MTT.SERVICE_DEFAULTS.sourceImg,
    category: automaticCategory?.key ?? "",
    systemCategoryKey: automaticCategory?.key ?? "",
    systemCategoryLabel: automaticCategory?.label ?? "",
    systemCategoryPath: automaticCategory?.path ?? "",
  }

  entries.push(newService)

  await updateMerchantData(actor, { catalog: { services: entries } })
}

export function getItemAvailableQuantity(item) {
  const configuredQuantity = parseQuantityValue(getConfiguredItemValue(item, "itemQuantityPath"))
  if (configuredQuantity !== null) return configuredQuantity

  const candidates = [
    foundry.utils.getProperty(item, "system.quantity"),
    foundry.utils.getProperty(item, "system.quantity.value"),
    foundry.utils.getProperty(item, "system.qty"),
    foundry.utils.getProperty(item, "system.stack.quantity"),
  ]

  for (const candidate of candidates) {
    const quantity = parseQuantityValue(candidate)
    if (quantity !== null) return quantity
  }

  return null
}

export function prepareSellerItemDropData(actor, item, { buyPercent = null } = {}) {
  const availableQuantity = getItemAvailableQuantity(item)
  const universalSellerPrice = readItemReferencePrice(item)
  let basePriceValue, priceCurrency

  if (universalSellerPrice !== null) {
    basePriceValue = universalSellerPrice.value
    priceCurrency = universalSellerPrice.currency
  } else {
    basePriceValue = getItemPrice(item) ?? 0
    priceCurrency = resolveItemCurrencyKey(getItemCurrency(item))
  }

  const merchantBuyPercent = getMerchantData(actor)?.trade?.buyPercent
  const effectiveBuyPercent =
    Number.isFinite(Number(buyPercent)) && Number(buyPercent) >= 0
      ? Number(buyPercent)
      : Number.isFinite(Number(merchantBuyPercent)) && Number(merchantBuyPercent) >= 0
      ? Number(merchantBuyPercent)
      : 50
  const unitPriceValue = Number(((basePriceValue * effectiveBuyPercent) / 100).toFixed(2))
  const sourceActor = item.parent?.documentName === "Actor" ? item.parent : null

  return {
    type: "item",
    sourceUuid: item.uuid ?? "",
    sourceActorUuid: sourceActor?.uuid ?? "",
    sourceId: item.id ?? "",
    name: item.name ?? "",
    img: item.img ?? "",
    quantity: 1,
    availableQuantity,
    hasLimitedQuantity: Number.isFinite(availableQuantity) && availableQuantity >= 0,
    unitPriceValue,
    priceCurrency,
    sourceLabel: game.i18n.localize("mtt.sessions.item.object"),
    isFromActor: Boolean(sourceActor),
    sourceActorName: sourceActor?.name ?? "",
  }
}
