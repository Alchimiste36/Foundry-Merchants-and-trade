import { MTT } from "../../config/constants.mjs"
import { getCurrencies } from "../../config/settings.mjs"
import {
  parsePriceValue,
  parseQuantityValue,
  formatPriceLabel,
  normalizeAutomaticCategoryValue,
  slugifyCategoryKey,
  getCategoryPaths,
  getCategoryLabelMap,
  getConfiguredItemValue,
  getItemDescription,
  getItemPrice,
  getItemCurrency,
  resolveItemCurrencyKey,
} from "./merchant-utils.mjs"

export function getSellPercent(actor) {
  const sellPercent = Number(actor.system.trade?.sellPercent)
  return Number.isFinite(sellPercent) && sellPercent >= 0 ? sellPercent : 100
}

export function adjustPriceValue(basePriceValue, sellPercent) {
  const priceValue = Number(basePriceValue)
  if (!Number.isFinite(priceValue) || priceValue < 0) return 0

  return Number(((priceValue * sellPercent) / 100).toFixed(2))
}

export function prepareTrade(actor) {
  return {
    buyPercent:
      Number.isFinite(Number(actor.system.trade?.buyPercent)) && Number(actor.system.trade.buyPercent) >= 0
        ? Number(actor.system.trade.buyPercent)
        : 50,
    sellPercent:
      Number.isFinite(Number(actor.system.trade?.sellPercent)) && Number(actor.system.trade.sellPercent) >= 0
        ? Number(actor.system.trade.sellPercent)
        : 100,
    negotiationFormula: actor.system.trade?.negotiationFormula ?? "",
  }
}

export function prepareWalletCurrencies(actor) {
  const walletCurrencies = actor.system.wallet?.currencies ?? {}

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
  const currencies = getCurrencies()
  if (!currencies.length) return null

  return (
    currencies.find((c) => Boolean(c.isDefault)) ??
    currencies.find((c) => Number(c.rate) === 1) ??
    currencies[0] ??
    null
  )
}

export function prepareItems(actor, sellPercent) {
  return actor.items.map((item) => {
    const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {}
    const quantity = product.quantity ?? MTT.PRODUCT_DEFAULTS.quantity
    const displayName = product.displayName || item.name
    const basePriceValue =
      Number.isFinite(Number(product.priceValue)) && Number(product.priceValue) >= 0
        ? Number(product.priceValue)
        : MTT.PRODUCT_DEFAULTS.priceValue
    const displayPriceValue = adjustPriceValue(basePriceValue, sellPercent)
    const priceCurrency = product.priceCurrency?.trim() ?? MTT.PRODUCT_DEFAULTS.priceCurrency

    return {
      id: item.id,
      uuid: item.uuid,
      name: item.name,
      displayName,
      hasCustomDisplayName: displayName !== item.name,
      type: item.type,
      img: item.img,
      quantity,
      hasQuantity: quantity !== null && quantity !== undefined,
      document: item,
      secretName: product.secretName ?? "",
      secretPrice: product.secretPrice ?? "",
      secretDescription: product.secretDescription ?? "",
      priceValue: basePriceValue,
      basePriceValue,
      displayPriceValue,
      priceCurrency,
      category: (product.category ?? "").trim(),
      hasCategory: Boolean((product.category ?? "").trim()),
      systemCategoryKey: product.systemCategoryKey ?? "",
      systemCategoryLabel: product.systemCategoryLabel ?? "",
      systemCategoryPath: product.systemCategoryPath ?? "",
      sourceUuid: product.sourceUuid ?? "",
      isCommerciallyModified: Boolean(product.isCommerciallyModified),
      hasSystemCategory: Boolean(product.systemCategoryKey || product.systemCategoryLabel),
      hasPrice: Number.isFinite(displayPriceValue) && displayPriceValue >= 0,
      isHidden: product.isHidden ?? MTT.PRODUCT_DEFAULTS.isHidden,
      requiresApproval: product.requiresApproval ?? MTT.PRODUCT_DEFAULTS.requiresApproval,
      priceLabel: formatPriceLabel(displayPriceValue, priceCurrency),
      displayPriceLabel: formatPriceLabel(displayPriceValue, priceCurrency),
      basePriceLabel: formatPriceLabel(basePriceValue, priceCurrency),
      hasSecretInfos: Boolean(product.secretName || product.secretPrice || product.secretDescription),
      isSecretExpanded: product.isSecretExpanded ?? MTT.PRODUCT_DEFAULTS.isSecretExpanded,
      hasFreePrice: product.hasFreePrice ?? MTT.PRODUCT_DEFAULTS.hasFreePrice,
      minimumPriceValue:
        Number.isFinite(Number(product.minimumPriceValue)) && Number(product.minimumPriceValue) >= 0
          ? Number(product.minimumPriceValue)
          : MTT.PRODUCT_DEFAULTS.minimumPriceValue,
    }
  })
}

export function prepareServices(actor, sellPercent) {
  const entries = actor.system.services?.entries ?? []
  return entries.map((service) => {
    const basePriceValue =
      Number.isFinite(Number(service.priceValue)) && Number(service.priceValue) >= 0
        ? Number(service.priceValue)
        : MTT.SERVICE_DEFAULTS.priceValue
    const displayPriceValue = adjustPriceValue(basePriceValue, sellPercent)
    const priceCurrency = service.priceCurrency?.trim() ?? MTT.SERVICE_DEFAULTS.priceCurrency

    return {
      id: service.id,
      name: service.name,
      description: service.description || "",
      priceValue: basePriceValue,
      basePriceValue,
      displayPriceValue,
      priceCurrency,
      hasPrice: Number.isFinite(displayPriceValue) && displayPriceValue >= 0,
      priceLabel: formatPriceLabel(displayPriceValue, priceCurrency),
      displayPriceLabel: formatPriceLabel(displayPriceValue, priceCurrency),
      basePriceLabel: formatPriceLabel(basePriceValue, priceCurrency),
      quantity: service.quantity,
      hasQuantity: service.quantity !== null && service.quantity !== undefined,
      isHidden: service.isHidden ?? MTT.SERVICE_DEFAULTS.isHidden,
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
      hasFreePrice: service.hasFreePrice ?? MTT.SERVICE_DEFAULTS.hasFreePrice,
      minimumPriceValue:
        Number.isFinite(Number(service.minimumPriceValue)) && Number(service.minimumPriceValue) >= 0
          ? Number(service.minimumPriceValue)
          : MTT.SERVICE_DEFAULTS.minimumPriceValue,
    }
  })
}

export function prepareProductCategories(actor, items) {
  const definedCategories = actor.system.catalog?.productCategories ?? []
  const categories = new Map()

  const shouldShowSystemCategory = items.length > 0 || definedCategories.length > 0
  if (shouldShowSystemCategory) {
    categories.set("", {
      id: "category-uncategorized",
      name: game.i18n.localize("mtt.products.category.undefined"),
      categoryValue: "",
      items: [],
      count: 0,
      isCollapsed: false,
      isSystemCategory: true,
    })
  }

  definedCategories.forEach((category) => {
    if (!category?.id) return
    categories.set(category.id, {
      id: category.id,
      name: category.name || category.id,
      categoryValue: category.id,
      items: [],
      count: 0,
      isCollapsed: false,
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

  const collapsedCategories = actor.system.catalog?.collapsedCategories ?? {}

  const sortedCategories = Array.from(categories.values()).map((group) => ({
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

  for (const path of paths) {
    const normalized = normalizeAutomaticCategoryValue(foundry.utils.getProperty(item, path))
    if (!normalized) continue

    return {
      ...normalized,
      label: labelMap.get(normalized.key) ?? normalized.label,
      path,
    }
  }

  if (game.settings.get(MTT.ID, "useItemTypeAsCategoryFallback")) {
    const normalized = normalizeAutomaticCategoryValue(item.type)
    if (normalized) {
      return {
        ...normalized,
        label: labelMap.get(normalized.key) ?? normalized.label,
        path: "type",
      }
    }
  }

  return null
}

export async function getOrCreateAutomaticProductCategory(actor, automaticCategory) {
  if (!automaticCategory?.key) return ""

  const categories = foundry.utils.deepClone(actor.system.catalog?.productCategories ?? [])
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

  await actor.update({
    "system.catalog.productCategories": categories,
  })

  return categoryId
}

export function createProductFlags(itemData, options = {}) {
  const productFlags = foundry.utils.deepClone(MTT.PRODUCT_DEFAULTS)

  productFlags.displayName = itemData.name ?? ""
  productFlags.sourceUuid = String(options.sourceUuid ?? productFlags.sourceUuid ?? "").trim()
  productFlags.isCommerciallyModified = false

  const configuredPrice = getConfiguredItemValue(itemData, "itemPriceValuePath")
  const parsedPrice = parsePriceValue(configuredPrice) ?? getItemPrice(itemData)
  if (parsedPrice !== null) {
    productFlags.priceValue = parsedPrice
  }

  const configuredCurrency = getConfiguredItemValue(itemData, "itemPriceCurrencyPath")
  const rawCurrency = typeof configuredCurrency === "string" ? configuredCurrency.trim() : getItemCurrency(itemData)
  productFlags.priceCurrency = resolveItemCurrencyKey(rawCurrency)

  const configuredQuantity = getConfiguredItemValue(itemData, "itemQuantityPath")
  const parsedQuantity = parseQuantityValue(configuredQuantity)
  if (parsedQuantity !== null) {
    productFlags.quantity = parsedQuantity
  }

  foundry.utils.setProperty(itemData, `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}`, productFlags)

  return itemData
}

export function prepareMerchantCatalogItemData(sourceItem, options = {}) {
  const sourceUuid = String(options.sourceUuid ?? sourceItem?.uuid ?? "").trim()
  const automaticCategory = options.automaticCategory ?? null
  const productData = sourceItem?.toObject
    ? sourceItem.toObject()
    : foundry.utils.deepClone(sourceItem ?? {})

  delete productData._id
  delete productData.uuid
  productData.flags = productData.flags ?? {}
  if (productData.flags[MTT.ID]) delete productData.flags[MTT.ID]

  createProductFlags(productData, { sourceUuid })
  foundry.utils.setProperty(productData, `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}.category`, options.categoryValue ?? "")
  foundry.utils.setProperty(
    productData,
    `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}.systemCategoryKey`,
    automaticCategory?.key ?? "",
  )
  foundry.utils.setProperty(
    productData,
    `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}.systemCategoryLabel`,
    automaticCategory?.label ?? "",
  )
  foundry.utils.setProperty(
    productData,
    `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}.systemCategoryPath`,
    automaticCategory?.path ?? "",
  )
  foundry.utils.setProperty(productData, `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}.sourceUuid`, sourceUuid)
  foundry.utils.setProperty(productData, `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}.isCommerciallyModified`, false)

  if (Number.isFinite(Number(options.quantity)) && Number(options.quantity) >= 0) {
    foundry.utils.setProperty(productData, `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}.quantity`, Number(options.quantity))
  }

  return productData
}

export function findMergeableMerchantItemBySourceUuid(actor, sourceUuid) {
  const normalizedSourceUuid = String(sourceUuid ?? "").trim()
  if (!normalizedSourceUuid) return null

  return (
    actor.items.find((item) => {
      const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {}
      if (product.isCommerciallyModified === true) return false
      return String(product.sourceUuid ?? "").trim() === normalizedSourceUuid
    }) ?? null
  )
}

export async function addOrMergeProduct(actor, sourceItem, categoryValue = "", automaticCategory = null, sourceUuid = "") {
  const normalizedSourceUuid = String(sourceUuid ?? sourceItem?.uuid ?? "").trim()
  const existingProduct = findMergeableMerchantItemBySourceUuid(actor, normalizedSourceUuid)

  if (existingProduct) {
    const product = existingProduct.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {}
    const currentQuantity = Number.isFinite(Number(product.quantity))
      ? Number(product.quantity)
      : MTT.PRODUCT_DEFAULTS.quantity

    await existingProduct.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, {
      ...product,
      quantity: currentQuantity + 1,
    })

    return
  }

  const productData = prepareMerchantCatalogItemData(sourceItem, {
    categoryValue,
    automaticCategory,
    sourceUuid: normalizedSourceUuid,
  })
  await actor.createEmbeddedDocuments("Item", [productData])
}

export async function moveProductToCategory(actor, itemId, categoryValue) {
  const item = actor.items.get(itemId)
  if (!item) return

  const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {}
  await item.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, {
    ...product,
    category: categoryValue ?? "",
  })
}

export async function createServiceFromItem(actor, item) {
  const entries = foundry.utils.deepClone(actor.system.services?.entries ?? [])

  const newId = foundry.utils.randomID()

  let description = getConfiguredItemValue(item, "itemDescriptionPath")
  if (description === null || description === undefined || description === "") {
    description = getItemDescription(item) ?? ""
  }
  if (typeof description === "object" && description?.value) {
    description = description.value
  }
  description = description ? String(description) : ""

  let priceValue = parsePriceValue(getConfiguredItemValue(item, "itemPriceValuePath"))
  if (priceValue === null) {
    priceValue = getItemPrice(item) ?? 0
  }

  const rawServiceCurrency = getConfiguredItemValue(item, "itemPriceCurrencyPath")
  const priceCurrency = resolveItemCurrencyKey(
    typeof rawServiceCurrency === "string" ? rawServiceCurrency.trim() : getItemCurrency(item),
  )

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
    sourceImg: item.img ?? "",
    category: automaticCategory?.key ?? "",
    systemCategoryKey: automaticCategory?.key ?? "",
    systemCategoryLabel: automaticCategory?.label ?? "",
    systemCategoryPath: automaticCategory?.path ?? "",
  }

  entries.push(newService)

  await actor.update({
    "system.services.entries": entries,
  })
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

export function prepareSellerItemDropData(actor, item) {
  const availableQuantity = getItemAvailableQuantity(item)
  const basePriceValue =
    parsePriceValue(getConfiguredItemValue(item, "itemPriceValuePath")) ?? getItemPrice(item) ?? 0
  const buyPercent =
    Number.isFinite(Number(actor.system.trade?.buyPercent)) && Number(actor.system.trade.buyPercent) >= 0
      ? Number(actor.system.trade.buyPercent)
      : 50
  const unitPriceValue = Number(((basePriceValue * buyPercent) / 100).toFixed(2))
  const configuredCurrency = getConfiguredItemValue(item, "itemPriceCurrencyPath")
  const priceCurrency = resolveItemCurrencyKey(
    typeof configuredCurrency === "string" ? configuredCurrency.trim() : getItemCurrency(item),
  )
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
