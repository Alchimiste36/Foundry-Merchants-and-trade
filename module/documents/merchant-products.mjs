import { MTT } from "../config/constants.mjs"
import {
  getMerchantData,
  getMerchantDataForUpdate,
  setMerchantData,
  updateMerchantData,
} from "./merchant-flags.mjs"
import {
  getConfiguredItemValue,
  parseQuantityValue,
  readItemReferencePrice,
  getItemPrice,
  getItemCurrency,
  resolveItemCurrencyKey,
  getModuleSetting,
} from "../applications/sheets/merchant-utils.mjs"

// ─── Lecture ──────────────────────────────────────────────────────────────────

export function getCatalogProducts(actor) {
  return getMerchantData(actor)?.catalog?.products ?? []
}

export function getCatalogProduct(actor, productId) {
  const id = String(productId ?? "").trim()
  if (!id) return null
  return getCatalogProducts(actor).find((p) => p.id === id) ?? null
}

// ─── Normalisation ────────────────────────────────────────────────────────────

export function normalizeCatalogProduct(product) {
  const ownershipLevel = Number(product.ownershipLevel ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)
  const rawItemData =
    product.itemData !== null && typeof product.itemData === "object" && !Array.isArray(product.itemData)
      ? product.itemData
      : {}
  return {
    id: String(product.id ?? foundry.utils.randomID()).trim() || foundry.utils.randomID(),
    sourceUuid: String(product.sourceUuid ?? "").trim(),
    itemData: rawItemData,
    name: String(product.name ?? rawItemData.name ?? "").trim(),
    img: String(product.img ?? rawItemData.img ?? "").trim(),
    type: String(product.type ?? rawItemData.type ?? "").trim(),
    quantity: product.quantity ?? null,
    deliveryQuantityPerLot: product.deliveryQuantityPerLot ?? null,
    priceValue:
      Number.isFinite(Number(product.priceValue)) && Number(product.priceValue) >= 0
        ? Number(product.priceValue)
        : 0,
    priceCurrency: String(product.priceCurrency ?? "").trim(),
    category: String(product.category ?? "").trim(),
    systemCategoryKey: String(product.systemCategoryKey ?? "").trim(),
    systemCategoryLabel: String(product.systemCategoryLabel ?? "").trim(),
    systemCategoryPath: String(product.systemCategoryPath ?? "").trim(),
    systemSubcategory: String(product.systemSubcategory ?? "").trim(),
    ownershipLevel: Number.isFinite(ownershipLevel) ? ownershipLevel : CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
    isHidden: Boolean(product.isHidden),
    requiresApproval: Boolean(product.requiresApproval),
    hasFreePrice: Boolean(product.hasFreePrice),
    minimumPriceValue:
      Number.isFinite(Number(product.minimumPriceValue)) && Number(product.minimumPriceValue) >= 0
        ? Number(product.minimumPriceValue)
        : 0,
    secretName: String(product.secretName ?? "").trim(),
    secretPrice: String(product.secretPrice ?? "").trim(),
    secretCurrency: String(product.secretCurrency ?? "").trim(),
    secretDescription: String(product.secretDescription ?? "").trim(),
    isCommerciallyModified: Boolean(product.isCommerciallyModified),
    isSecretExpanded: Boolean(product.isSecretExpanded),
  }
}

// ─── Construction depuis Item source ─────────────────────────────────────────

/**
 * Construit une entrée produit catalogue MTT depuis un Item source droppé.
 * Ne crée aucun Item embedded sur l'acteur gérant.
 *
 * @param {Item} sourceItem - L'Item Foundry source.
 * @param {object} [options={}]
 * @param {string} [options.categoryValue=""]
 * @param {object|null} [options.automaticCategory=null]
 * @param {string} [options.sourceUuid=""]
 * @returns {object} Entrée produit normalisée prête à être ajoutée au catalogue.
 */
export function buildCatalogProductFromItem(sourceItem, options = {}) {
  const sourceUuid = String(options.sourceUuid ?? sourceItem?.uuid ?? "").trim()
  const categoryValue = String(options.categoryValue ?? "").trim()
  const automaticCategory = options.automaticCategory ?? null

  const rawItemData = sourceItem?.toObject ? sourceItem.toObject() : foundry.utils.deepClone(sourceItem ?? {})
  delete rawItemData._id
  delete rawItemData.uuid
  // Retirer les anciens flags commerciaux MTT pour ne pas polluer itemData
  if (rawItemData.flags?.[MTT.ID]) delete rawItemData.flags[MTT.ID]

  const universalPrice = readItemReferencePrice(sourceItem)
  let priceValue, priceCurrency

  if (universalPrice !== null) {
    priceValue = universalPrice.value
    priceCurrency = universalPrice.currency
  } else {
    priceValue = getItemPrice(sourceItem) ?? 0
    priceCurrency = resolveItemCurrencyKey(getItemCurrency(sourceItem)) ?? ""
  }

  const configuredQuantityRaw = getConfiguredItemValue(sourceItem, "itemQuantityPath")
  const parsedQuantity = parseQuantityValue(configuredQuantityRaw)

  const configuredDeliveryRaw = getConfiguredItemValue(sourceItem, "itemDeliveryQuantityPerLotPath")
  const parsedDelivery = parseQuantityValue(configuredDeliveryRaw)

  const subcategoryPath = String(getModuleSetting("itemSubcategoryPath") ?? "").trim()
  const rawSubcategory = subcategoryPath
    ? String(foundry.utils.getProperty(sourceItem, subcategoryPath) ?? "").trim()
    : ""

  return normalizeCatalogProduct({
    id: foundry.utils.randomID(),
    sourceUuid,
    itemData: rawItemData,
    name: sourceItem?.name ?? "",
    img: sourceItem?.img ?? "",
    type: sourceItem?.type ?? "",
    quantity: parsedQuantity ?? null,
    deliveryQuantityPerLot: parsedDelivery !== null && parsedDelivery > 1 ? Math.floor(parsedDelivery) : null,
    priceValue,
    priceCurrency,
    category: categoryValue,
    systemCategoryKey: automaticCategory?.key ?? "",
    systemCategoryLabel: automaticCategory?.label ?? "",
    systemCategoryPath: automaticCategory?.path ?? "",
    systemSubcategory: rawSubcategory,
    ownershipLevel: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
    isHidden: false,
    requiresApproval: false,
    hasFreePrice: false,
    minimumPriceValue: 0,
    isCommerciallyModified: false,
  })
}

// ─── Écriture ─────────────────────────────────────────────────────────────────

export async function addCatalogProduct(actor, product) {
  const merchant = getMerchantDataForUpdate(actor)
  merchant.catalog ??= {}
  merchant.catalog.products ??= []
  merchant.catalog.products.push(normalizeCatalogProduct(product))
  return setMerchantData(actor, merchant)
}

export async function updateCatalogProduct(actor, productId, changes) {
  const merchant = getMerchantDataForUpdate(actor)
  const products = merchant?.catalog?.products ?? []
  const index = products.findIndex((p) => p.id === productId)
  if (index === -1) return null

  products[index] = normalizeCatalogProduct({ ...products[index], ...changes })
  merchant.catalog.products = products
  return setMerchantData(actor, merchant)
}

export async function removeCatalogProduct(actor, productId) {
  const merchant = getMerchantDataForUpdate(actor)
  const products = merchant?.catalog?.products ?? []
  merchant.catalog.products = products.filter((p) => p.id !== productId)
  return setMerchantData(actor, merchant)
}

export async function replaceCatalogProducts(actor, products) {
  return updateMerchantData(actor, { catalog: { products: products.map(normalizeCatalogProduct) } })
}

// ─── Fusion ───────────────────────────────────────────────────────────────────

/**
 * Cherche un produit existant dans le catalogue par sourceUuid.
 * Utilisé pour fusionner le stock lors d'un re-drop du même Item.
 *
 * @param {object[]} products - Tableau de produits du catalogue.
 * @param {string} sourceUuid
 * @returns {object|null}
 */
export function findMergeableCatalogProduct(products, sourceUuid) {
  const normalized = String(sourceUuid ?? "").trim()
  if (!normalized) return null
  return products.find((p) => String(p.sourceUuid ?? "").trim() === normalized) ?? null
}
