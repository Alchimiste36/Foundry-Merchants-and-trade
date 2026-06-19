import { MTT } from "../config/constants.mjs"
import { getStorageItemFlags, getStorageItemTags } from "./storage-flags.mjs"
import {
  getConfiguredItemValue,
  parseQuantityValue,
  readItemReferencePrice,
  getItemPrice,
  getItemCurrency,
  resolveItemCurrencyKey,
  getModuleSetting,
  buildItemPriceWriteData
} from "../applications/sheets/merchant-utils.mjs"

// ─── Identification ───────────────────────────────────────────────────────────

export function isMerchantProductItem(item) {
  return item?.getFlag?.(MTT.ID, MTT.FLAGS.PRODUCT)?.enabled === true
}

// ─── Helpers flags produit ────────────────────────────────────────────────────

export function getMerchantProductFlags(item) {
  return normalizeProductFlags(item?.getFlag?.(MTT.ID, MTT.FLAGS.PRODUCT) ?? {})
}

export function getMerchantProductSourceUuid(item) {
  return String(getMerchantProductFlags(item).sourceUuid ?? "").trim()
}

export function isMerchantProductCommerciallyModified(item) {
  return getMerchantProductFlags(item).isCommerciallyModified === true
}

export function merchantProductHasSecrets(itemOrProduct) {
  const data = itemOrProduct?.getFlag ? getMerchantProductFlags(itemOrProduct) : (itemOrProduct ?? {})
  return Boolean(
    String(data.secretName ?? "").trim() ||
    String(data.secretPrice ?? "").trim() ||
    String(data.secretCurrency ?? "").trim() ||
    String(data.secretDescription ?? "").trim()
  )
}

// ─── Normalisation des flags produit ─────────────────────────────────────────

export function normalizeProductFlags(flags = {}) {
  const ownershipLevel = Number(flags?.ownershipLevel ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)
  return {
    enabled: Boolean(flags?.enabled),
    sourceUuid: String(flags?.sourceUuid ?? "").trim(),
    isCommerciallyModified: Boolean(flags?.isCommerciallyModified),
    quantity: flags?.quantity ?? null,
    deliveryQuantityPerLot: flags?.deliveryQuantityPerLot ?? null,
    category: String(flags?.category ?? "").trim(),
    systemCategoryKey: String(flags?.systemCategoryKey ?? "").trim(),
    systemCategoryLabel: String(flags?.systemCategoryLabel ?? "").trim(),
    systemCategoryPath: String(flags?.systemCategoryPath ?? "").trim(),
    systemSubcategory: String(flags?.systemSubcategory ?? "").trim(),
    ownershipLevel: Number.isFinite(ownershipLevel) ? ownershipLevel : CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
    isHidden: Boolean(flags?.isHidden),
    requiresApproval: Boolean(flags?.requiresApproval),
    hasFreePrice: Boolean(flags?.hasFreePrice),
    minimumPriceValue:
      Number.isFinite(Number(flags?.minimumPriceValue)) && Number(flags?.minimumPriceValue) >= 0
        ? Number(flags.minimumPriceValue)
        : 0,
    secretName: String(flags?.secretName ?? "").trim(),
    secretPrice: String(flags?.secretPrice ?? "").trim(),
    secretCurrency: String(flags?.secretCurrency ?? "").trim(),
    secretDescription: String(flags?.secretDescription ?? "").trim(),
    isSecretExpanded: Boolean(flags?.isSecretExpanded)
  }
}

// ─── Construction du contexte produit depuis un Item embedded ─────────────────

function buildProductContextFromItem(item) {
  const flags = normalizeProductFlags(item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT))
  const storageFlags = getStorageItemFlags(item)
  const rawStorageTags = getStorageItemTags(item)

  const priceRef = readItemReferencePrice(item)
  const priceValue = priceRef !== null ? priceRef.value : (getItemPrice(item) ?? 0)
  const priceCurrency = priceRef !== null ? priceRef.currency : (resolveItemCurrencyKey(getItemCurrency(item)) ?? "")

  return {
    id: item.id,
    sourceUuid: flags.sourceUuid,
    name: item.name ?? "",
    img: item.img ?? "",
    type: item.type ?? "",
    quantity: flags.quantity,
    deliveryQuantityPerLot: flags.deliveryQuantityPerLot,
    priceValue,
    priceCurrency,
    category: flags.category,
    systemCategoryKey: flags.systemCategoryKey,
    systemCategoryLabel: flags.systemCategoryLabel,
    systemCategoryPath: flags.systemCategoryPath,
    systemSubcategory: flags.systemSubcategory,
    ownershipLevel: flags.ownershipLevel,
    isHidden: flags.isHidden,
    requiresApproval: flags.requiresApproval,
    hasFreePrice: flags.hasFreePrice,
    minimumPriceValue: flags.minimumPriceValue,
    secretName: flags.secretName,
    secretPrice: flags.secretPrice,
    secretCurrency: flags.secretCurrency,
    secretDescription: flags.secretDescription,
    isCommerciallyModified: flags.isCommerciallyModified,
    isSecretExpanded: flags.isSecretExpanded,
    isBlocked: storageFlags.blocked,
    hasWarningGM: storageFlags.warningGM,
    rawStorageTags,
    itemData: item.toObject()
  }
}

// ─── Lecture ──────────────────────────────────────────────────────────────────

export function getCatalogProducts(actor) {
  if (!actor?.items) return []
  return Array.from(actor.items.values()).filter(isMerchantProductItem).map(buildProductContextFromItem)
}

export function getCatalogProduct(actor, productId) {
  const id = String(productId ?? "").trim()
  if (!id || !actor?.items) return null
  const item = actor.items.get(id)
  if (!item || !isMerchantProductItem(item)) return null
  return buildProductContextFromItem(item)
}

// ─── Construction depuis Item source ─────────────────────────────────────────

/**
 * Construit les données pour créer un Item embedded catalogue MTT depuis un Item source droppé.
 * Retourne { itemData, productFlags } prêt pour addCatalogProduct.
 *
 * @param {Item} sourceItem - L'Item Foundry source.
 * @param {object} [options={}]
 * @param {string} [options.categoryValue=""]
 * @param {object|null} [options.automaticCategory=null]
 * @param {string} [options.sourceUuid=""]
 * @returns {{ itemData: object, productFlags: object }}
 */
export function buildCatalogProductFromItem(sourceItem, options = {}) {
  const sourceUuid = String(options.sourceUuid ?? sourceItem?.uuid ?? "").trim()
  const categoryValue = String(options.categoryValue ?? "").trim()
  const automaticCategory = options.automaticCategory ?? null

  const rawItemData = sourceItem?.toObject ? sourceItem.toObject() : foundry.utils.deepClone(sourceItem ?? {})
  delete rawItemData._id
  delete rawItemData.uuid
  if (rawItemData.flags?.[MTT.ID]) delete rawItemData.flags[MTT.ID]

  const configuredQuantityRaw = getConfiguredItemValue(sourceItem, "itemQuantityPath")
  const parsedQuantity = parseQuantityValue(configuredQuantityRaw)

  const configuredDeliveryRaw = getConfiguredItemValue(sourceItem, "itemDeliveryQuantityPerLotPath")
  const parsedDelivery = parseQuantityValue(configuredDeliveryRaw)

  const subcategoryPath = String(getModuleSetting("itemSubcategoryPath") ?? "").trim()
  const rawSubcategory = subcategoryPath
    ? String(foundry.utils.getProperty(sourceItem, subcategoryPath) ?? "").trim()
    : ""

  return {
    itemData: rawItemData,
    productFlags: normalizeProductFlags({
      enabled: true,
      sourceUuid,
      isCommerciallyModified: false,
      quantity: parsedQuantity ?? null,
      deliveryQuantityPerLot: parsedDelivery !== null && parsedDelivery > 1 ? Math.floor(parsedDelivery) : null,
      category: categoryValue,
      systemCategoryKey: automaticCategory?.key ?? "",
      systemCategoryLabel: automaticCategory?.label ?? "",
      systemCategoryPath: automaticCategory?.path ?? "",
      systemSubcategory: rawSubcategory,
      ownershipLevel: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
      isHidden: false,
      requiresApproval: false,
      hasFreePrice: false,
      minimumPriceValue: 0
    })
  }
}

// ─── Écriture ─────────────────────────────────────────────────────────────────

export async function addCatalogProduct(actor, { itemData, productFlags } = {}) {
  if (!itemData || !actor) return null

  const dataToCreate = foundry.utils.deepClone(itemData)
  const [createdItem] = (await actor.createEmbeddedDocuments("Item", [dataToCreate], { mtt: true })) ?? []
  if (!createdItem) return null

  const normalizedFlags = normalizeProductFlags({ ...(productFlags ?? {}), enabled: true })
  await createdItem.update(
    {
      [`flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}`]: normalizedFlags
    },
    { mtt: true }
  )

  return createdItem
}

// Champs stockés dans les flags MTT produit (pas dans item data directement)
const FLAG_FIELDS = new Set([
  "quantity",
  "deliveryQuantityPerLot",
  "category",
  "systemCategoryKey",
  "systemCategoryLabel",
  "systemCategoryPath",
  "systemSubcategory",
  "isHidden",
  "requiresApproval",
  "hasFreePrice",
  "minimumPriceValue",
  "secretName",
  "secretPrice",
  "secretCurrency",
  "secretDescription",
  "ownershipLevel",
  "isSecretExpanded",
  "isCommerciallyModified",
  "sourceUuid"
])

export async function updateCatalogProduct(actor, productId, changes, options = {}) {
  const id = String(productId ?? "").trim()
  if (!id || !actor?.items) return null
  const item = actor.items.get(id)
  if (!item || !isMerchantProductItem(item)) return null

  const itemChanges = {}
  const flagChanges = {}

  for (const [key, value] of Object.entries(changes)) {
    if (FLAG_FIELDS.has(key)) {
      flagChanges[key] = value
    } else if (key === "name" || key === "img") {
      itemChanges[key] = value
    }
    // "priceValue", "priceCurrency" gérés ci-dessous ; "itemData" ignoré (obsolète)
  }

  if ("priceValue" in changes || "priceCurrency" in changes) {
    const targetValue = "priceValue" in changes ? Number(changes.priceValue) : (getItemPrice(item) ?? 0)
    const targetCurrency =
      "priceCurrency" in changes
        ? String(changes.priceCurrency ?? "").trim()
        : (resolveItemCurrencyKey(getItemCurrency(item)) ?? "")
    const writeData = buildItemPriceWriteData(targetValue, targetCurrency)
    if (writeData.ok) {
      Object.assign(itemChanges, writeData.paths)
    }
  }

  const promises = []
  if (Object.keys(itemChanges).length > 0) {
    promises.push(item.update(itemChanges, { mtt: true, ...options }))
  }
  if (Object.keys(flagChanges).length > 0) {
    const existing = normalizeProductFlags(item.getFlag(MTT.ID, MTT.FLAGS.PRODUCT))
    promises.push(
      item.update(
        { [`flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}`]: normalizeProductFlags({ ...existing, ...flagChanges }) },
        { mtt: true, ...options }
      )
    )
  }

  await Promise.all(promises)
  return item
}

export async function removeCatalogProduct(actor, productId) {
  const id = String(productId ?? "").trim()
  if (!id || !actor?.items) return null
  const item = actor.items.get(id)
  if (!item || !isMerchantProductItem(item)) return null
  return actor.deleteEmbeddedDocuments("Item", [id])
}

export async function replaceCatalogProducts(actor, products) {
  if (!actor?.items) return

  const existingIds = Array.from(actor.items.values())
    .filter(isMerchantProductItem)
    .map((item) => item.id)

  if (existingIds.length > 0) {
    await actor.deleteEmbeddedDocuments("Item", existingIds)
  }

  for (const product of products ?? []) {
    const raw = product.itemData ?? {}
    if (!raw.type) continue

    const itemData = foundry.utils.deepClone(raw)
    delete itemData._id

    await addCatalogProduct(actor, {
      itemData,
      productFlags: {
        enabled: true,
        sourceUuid: product.sourceUuid ?? "",
        isCommerciallyModified: product.isCommerciallyModified ?? false,
        quantity: product.quantity ?? null,
        deliveryQuantityPerLot: product.deliveryQuantityPerLot ?? null,
        category: product.category ?? "",
        systemCategoryKey: product.systemCategoryKey ?? "",
        systemCategoryLabel: product.systemCategoryLabel ?? "",
        systemCategoryPath: product.systemCategoryPath ?? "",
        systemSubcategory: product.systemSubcategory ?? "",
        ownershipLevel: product.ownershipLevel ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
        isHidden: product.isHidden ?? false,
        requiresApproval: product.requiresApproval ?? false,
        hasFreePrice: product.hasFreePrice ?? false,
        minimumPriceValue: product.minimumPriceValue ?? 0,
        secretName: product.secretName ?? "",
        secretPrice: product.secretPrice ?? "",
        secretCurrency: product.secretCurrency ?? "",
        secretDescription: product.secretDescription ?? "",
        isSecretExpanded: product.isSecretExpanded ?? false
      }
    })
  }
}

// ─── Fusion ───────────────────────────────────────────────────────────────────

/**
 * Cherche un produit existant dans le catalogue par sourceUuid, fusionnable.
 * Un produit est non-fusionnable s'il est commercialement modifié ou possède des infos secrètes.
 *
 * @param {object[]} products - Tableau de contextes produit (retour de getCatalogProducts).
 * @param {string} sourceUuid
 * @returns {object|null}
 */
export function findMergeableCatalogProduct(products, sourceUuid) {
  const normalized = String(sourceUuid ?? "").trim()
  if (!normalized) return null
  return (
    products.find((p) => {
      if (String(p.sourceUuid ?? "").trim() !== normalized) return false
      if (p.isCommerciallyModified) return false
      if (p.secretName || p.secretPrice || p.secretCurrency || p.secretDescription) return false
      return true
    }) ?? null
  )
}

/**
 * Cherche le vrai Embedded Item fusionnable dans actor.items par sourceUuid.
 * Retourne l'Item Foundry réel (avec getFlag/setFlag/update) ou null.
 *
 * @param {Actor} actor
 * @param {string} sourceUuid
 * @returns {Item|null}
 */
export function findMergeableCatalogItemBySourceUuid(actor, sourceUuid) {
  const normalized = String(sourceUuid ?? "").trim()
  if (!normalized || !actor?.items) return null
  return (
    Array.from(actor.items.values()).find((item) => {
      if (!isMerchantProductItem(item)) return false
      const itemSourceUuid = getMerchantProductSourceUuid(item)
      if (!itemSourceUuid || itemSourceUuid !== normalized) return false
      if (isMerchantProductCommerciallyModified(item)) return false
      if (merchantProductHasSecrets(item)) return false
      return true
    }) ?? null
  )
}

// ─── Utilitaire de copie ──────────────────────────────────────────────────────

/**
 * Nettoie les données d'un Item avant de les passer à createEmbeddedDocuments pour une copie produit.
 * Supprime les champs Foundry internes et flags.exportSource (migré en _stats.exportSource en v13/v14)
 * pour éviter les warnings de migration de COItem et autres systèmes.
 * Les flags MTT (flags.mtt-merchants.*) sont conservés.
 */
export function sanitizeItemDataForMerchantProductCopy(data) {
  const copy = foundry.utils.deepClone(data ?? {})

  delete copy._id
  delete copy.uuid
  delete copy.folder
  delete copy.sort
  delete copy._stats

  // Foundry v13/v14 : flags.exportSource est obsolète/migré.
  if (copy.flags && Object.prototype.hasOwnProperty.call(copy.flags, "exportSource")) {
    delete copy.flags.exportSource
  }

  // Sécurité si une donnée aplatie existe.
  delete copy["flags.exportSource"]

  return copy
}
