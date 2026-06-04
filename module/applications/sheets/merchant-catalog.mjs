import { MTT } from "../../config/constants.mjs"
import { getCurrencies } from "../../config/settings.mjs"
import {
  parsePriceValue,
  parseQuantityValue,
  isUnlimitedQuantity,
  FREE_PRICE_CURRENCY_KEY,
  isFreePriceCurrency,
  isFreePriceService,
  formatPriceLabel,
  normalizeAutomaticCategoryValue,
  slugifyCategoryKey,
  getCategoryPaths,
  getCategoryLabelMap,
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
} from "./merchant-utils.mjs"

export function getSellPercent(actor) {
  const sellPercent = Number(actor.system.trade?.sellPercent)
  return Number.isFinite(sellPercent) && sellPercent >= 0 ? sellPercent : 100
}

export function getServiceSellPercent(actor) {
  const serviceSellPercent = Number(actor.system.trade?.serviceSellPercent)
  return Number.isFinite(serviceSellPercent) && serviceSellPercent >= 0 ? serviceSellPercent : 100
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
    serviceSellPercent:
      Number.isFinite(Number(actor.system.trade?.serviceSellPercent)) && Number(actor.system.trade.serviceSellPercent) >= 0
        ? Number(actor.system.trade.serviceSellPercent)
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
  return getReferenceSessionCurrency()
}

function buildSecretTooltip({ secretName = "", secretPrice = "", secretCurrency = "", secretDescription = "" } = {}) {
  const description = String(secretDescription ?? "").trim()
  const shortDescription = description.length > 180 ? `${description.slice(0, 177)}...` : description
  const priceLabel = [secretPrice, secretCurrency].map((value) => String(value ?? "").trim()).filter(Boolean).join(" ")

  return [
    `${game.i18n.localize("mtt.secrets.tooltip.name")} ${secretName || "-"}`,
    `${game.i18n.localize("mtt.secrets.tooltip.price")} ${priceLabel || "-"}`,
    `${game.i18n.localize("mtt.secrets.tooltip.description")} ${shortDescription || "-"}`,
  ].join("\n")
}

export function prepareItems(actor, sellPercent, { includeHidden = false } = {}) {
  return actor.items.map((item) => {
    const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {}
    const quantity = product.quantity
    const displayName = product.displayName || item.name
    const hasFreePrice = product.hasFreePrice ?? MTT.PRODUCT_DEFAULTS.hasFreePrice
    const isCommerciallyModified = Boolean(product.isCommerciallyModified)

    let basePriceValue, priceCurrency

    if (hasFreePrice || isCommerciallyModified) {
      basePriceValue =
        Number.isFinite(Number(product.priceValue)) && Number(product.priceValue) >= 0
          ? Number(product.priceValue)
          : MTT.PRODUCT_DEFAULTS.priceValue
      priceCurrency = product.priceCurrency?.trim() ?? MTT.PRODUCT_DEFAULTS.priceCurrency
    } else {
      const universalPrice = readItemReferencePrice(item)
      if (universalPrice !== null) {
        basePriceValue = universalPrice.value
        priceCurrency = universalPrice.currency
      } else {
        basePriceValue =
          Number.isFinite(Number(product.priceValue)) && Number(product.priceValue) >= 0
            ? Number(product.priceValue)
            : MTT.PRODUCT_DEFAULTS.priceValue
        priceCurrency = product.priceCurrency?.trim() ?? MTT.PRODUCT_DEFAULTS.priceCurrency
      }
    }

    const displayPriceValue = hasFreePrice ? basePriceValue : adjustPriceValue(basePriceValue, sellPercent)
    const isHidden = Boolean(product.isHidden ?? MTT.PRODUCT_DEFAULTS.isHidden)
    const isVisible = !isHidden
    const configuredOwnershipLevel = Number(
      product.ownershipLevel ?? product.visibilityLevel ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
    )
    const ownershipLevel = Number.isFinite(configuredOwnershipLevel)
      ? configuredOwnershipLevel
      : CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
    const isObserverOwnership = ownershipLevel === CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
    const isLimitedOwnership = !isObserverOwnership
    const ownershipClass = isObserverOwnership
      ? "mtt-merchant-product-ownership-observer"
      : "mtt-merchant-product-ownership-limited"
    const ownershipLabelKey = isObserverOwnership
      ? "mtt.products.ownership.observer"
      : "mtt.products.ownership.limited"
    const secretName = product.secretName ?? ""
    const secretPrice = product.secretPrice ?? ""
    const secretCurrency = product.secretCurrency ?? ""
    const secretDescription = product.secretDescription ?? ""
    const hasSecrets = productHasSecretInfo({ secretName, secretPrice, secretCurrency, secretDescription })

    return {
      id: item.id,
      uuid: item.uuid,
      name: item.name,
      displayName,
      hasCustomDisplayName: displayName !== item.name,
      type: item.type,
      img: item.img,
      quantity,
      hasQuantity: !isUnlimitedQuantity(quantity),
      document: item,
      secretName,
      secretPrice,
      secretCurrency,
      secretDescription,
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
      isHidden,
      isVisible,
      ownershipLevel,
      isLimitedOwnership,
      isObserverOwnership,
      ownershipClass,
      ownershipLabelKey,
      requiresApproval: product.requiresApproval ?? MTT.PRODUCT_DEFAULTS.requiresApproval,
      priceLabel: formatPriceLabel(displayPriceValue, priceCurrency),
      displayPriceLabel: formatPriceLabel(displayPriceValue, priceCurrency),
      basePriceLabel: formatPriceLabel(basePriceValue, priceCurrency),
      hasSecrets,
      hasSecretInfos: hasSecrets,
      secretTooltip: hasSecrets ? buildSecretTooltip({ secretName, secretPrice, secretCurrency, secretDescription }) : "",
      isSecretExpanded: product.isSecretExpanded ?? MTT.PRODUCT_DEFAULTS.isSecretExpanded,
      hasFreePrice: product.hasFreePrice ?? MTT.PRODUCT_DEFAULTS.hasFreePrice,
      minimumPriceValue:
        Number.isFinite(Number(product.minimumPriceValue)) && Number(product.minimumPriceValue) >= 0
          ? Number(product.minimumPriceValue)
          : MTT.PRODUCT_DEFAULTS.minimumPriceValue,
      selectedCurrencyKey:
        (product.hasFreePrice ?? MTT.PRODUCT_DEFAULTS.hasFreePrice)
          ? FREE_PRICE_CURRENCY_KEY
          : (product.priceCurrency?.trim() ?? MTT.PRODUCT_DEFAULTS.priceCurrency),
    }
  }).filter((item) => includeHidden || item.isVisible)
}

export function prepareServices(actor, serviceSellPercent, { includeHidden = false } = {}) {
  const entries = actor.system.services?.entries ?? []
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
  const definedCategories = actor.system.catalog?.productCategories ?? []
  const categories = new Map()
  const hiddenCategories = actor.system.catalog?.hiddenCategories ?? {}

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

  const collapsedCategories = actor.system.catalog?.collapsedCategories ?? {}

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
  productFlags.ownershipLevel = CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER

  const universalPrice = readItemReferencePrice(itemData)
  if (universalPrice !== null) {
    productFlags.priceValue = universalPrice.value
    productFlags.priceCurrency = universalPrice.currency
  } else {
    const configuredPrice = getConfiguredItemValue(itemData, "itemPriceValuePath")
    const parsedPrice = parsePriceValue(configuredPrice) ?? getItemPrice(itemData)
    if (parsedPrice !== null) {
      productFlags.priceValue = parsedPrice
    }
    const configuredCurrency = getConfiguredItemValue(itemData, "itemPriceCurrencyPath")
    const rawCurrency = typeof configuredCurrency === "string" ? configuredCurrency.trim() : getItemCurrency(itemData)
    productFlags.priceCurrency = resolveItemCurrencyKey(rawCurrency)
  }

  const configuredQuantity = getConfiguredItemValue(itemData, "itemQuantityPath")
  const parsedQuantity = parseQuantityValue(configuredQuantity)
  if (parsedQuantity !== null) {
    productFlags.quantity = parsedQuantity
  }

  foundry.utils.setProperty(itemData, `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}`, productFlags)

  return itemData
}

export async function updateMerchantProductCommercialData(item, changes = {}) {
  const product = item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {}
  const updatedProduct = {
    ...product,
    isCommerciallyModified: true,
  }
  const updateData = {}

  if (Object.hasOwn(changes, "displayName")) {
    const displayName = String(changes.displayName ?? "").trim() || item.name
    updatedProduct.displayName = displayName
    updateData.name = displayName
  }

  if (Object.hasOwn(changes, "priceValue")) {
    updatedProduct.priceValue = changes.priceValue

    const pricePath = String(getModuleSetting("itemPriceValuePath") ?? "").trim()
    if (pricePath) updateData[pricePath] = changes.priceValue
  }

  if (Object.hasOwn(changes, "priceCurrency")) {
    const priceCurrency = String(changes.priceCurrency ?? "").trim()

    if (isFreePriceCurrency(priceCurrency)) {
      updatedProduct.hasFreePrice = true
    } else {
      updatedProduct.priceCurrency = priceCurrency
      updatedProduct.hasFreePrice = false

      const currencyPath = String(getModuleSetting("itemPriceCurrencyPath") ?? "").trim()
      if (currencyPath) updateData[currencyPath] = priceCurrency
    }
  }

  updateData[`flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}`] = updatedProduct
  await item.update(updateData)
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
    if (isUnlimitedQuantity(product.quantity)) return

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
  productData.ownership = {
    default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
  }
  // Catalogue drop: this creates merchant commercial stock, not a purchased Item on a client actor.
  const [createdItem] = await actor.createEmbeddedDocuments("Item", [productData])

  if (createdItem) {
    await createdItem.update({
      ownership: {
        default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
      },
    })
  }
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
  description = description ? htmlToPlainText(description) : ""

  const universalServicePrice = readItemReferencePrice(item)
  let priceValue, priceCurrency

  if (universalServicePrice !== null) {
    priceValue = universalServicePrice.value
    priceCurrency = universalServicePrice.currency
  } else {
    priceValue = parsePriceValue(getConfiguredItemValue(item, "itemPriceValuePath"))
    if (priceValue === null) {
      priceValue = getItemPrice(item) ?? 0
    }
    const rawServiceCurrency = getConfiguredItemValue(item, "itemPriceCurrencyPath")
    priceCurrency = resolveItemCurrencyKey(
      typeof rawServiceCurrency === "string" ? rawServiceCurrency.trim() : getItemCurrency(item),
    )
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

export function prepareSellerItemDropData(actor, item, { buyPercent = null } = {}) {
  const availableQuantity = getItemAvailableQuantity(item)
  const universalSellerPrice = readItemReferencePrice(item)
  let basePriceValue, priceCurrency

  if (universalSellerPrice !== null) {
    basePriceValue = universalSellerPrice.value
    priceCurrency = universalSellerPrice.currency
  } else {
    basePriceValue = parsePriceValue(getConfiguredItemValue(item, "itemPriceValuePath")) ?? getItemPrice(item) ?? 0
    const configuredCurrency = getConfiguredItemValue(item, "itemPriceCurrencyPath")
    priceCurrency = resolveItemCurrencyKey(
      typeof configuredCurrency === "string" ? configuredCurrency.trim() : getItemCurrency(item),
    )
  }

  const effectiveBuyPercent =
    Number.isFinite(Number(buyPercent)) && Number(buyPercent) >= 0
      ? Number(buyPercent)
      : Number.isFinite(Number(actor.system.trade?.buyPercent)) && Number(actor.system.trade.buyPercent) >= 0
      ? Number(actor.system.trade.buyPercent)
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
