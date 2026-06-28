import { MTT } from "../config/constants.mjs"
import { isMTTMerchant, getMerchantData } from "../documents/shop-flags.mjs"
import { isMTTStorage, getStorageData } from "../documents/storage-flags.mjs"
import { canUserViewClientJournalEntries, getMerchantPermissions } from "../documents/merchant-permissions.mjs"
import { normalizeJournalEntry, prepareJournalEntryDisplay } from "./sheets/merchant-journal.mjs"

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

const GLOBAL_JOURNAL_SORT_KEYS = ["date", "merchant", "buyer", "status", "total", "paid", "received", "adjustment"]

function normalizeGlobalJournalSort(sort = {}) {
  const key = GLOBAL_JOURNAL_SORT_KEYS.includes(sort.key) ? sort.key : "date"
  const direction = sort.direction === "asc" ? "asc" : "desc"

  return { key, direction }
}

function compareGlobalJournalTransactions(a, b, sort) {
  const direction = sort.direction === "asc" ? 1 : -1

  if (sort.key === "merchant") {
    return (
      String(a.merchantName ?? "").localeCompare(String(b.merchantName ?? ""), undefined, { sensitivity: "base" }) *
      direction
    )
  }

  if (sort.key === "buyer") {
    return (
      String(a.buyerName ?? "").localeCompare(String(b.buyerName ?? ""), undefined, { sensitivity: "base" }) * direction
    )
  }

  if (sort.key === "status") {
    return String(a.status ?? "").localeCompare(String(b.status ?? ""), undefined, { sensitivity: "base" }) * direction
  }

  if (sort.key === "paid") return (Number(a.paidTotalValue ?? 0) - Number(b.paidTotalValue ?? 0)) * direction
  if (sort.key === "received") {
    return (Number(a.receivedTotalValue ?? 0) - Number(b.receivedTotalValue ?? 0)) * direction
  }
  if (sort.key === "adjustment") {
    return (Number(a.moneyAdjustmentValue ?? 0) - Number(b.moneyAdjustmentValue ?? 0)) * direction
  }
  if (sort.key === "total") {
    return (Number(a.totalReferenceValue ?? 0) - Number(b.totalReferenceValue ?? 0)) * direction
  }

  const dateA = Date.parse(a.createdAt ?? "") || 0
  const dateB = Date.parse(b.createdAt ?? "") || 0
  return (dateA - dateB) * direction
}

function getUniqueNamedOptions(entries, uuidKey, nameKey, selectedUuid) {
  const options = new Map()

  for (const entry of entries) {
    const uuid = String(entry?.[uuidKey] ?? "").trim()
    if (!uuid || options.has(uuid)) continue

    options.set(uuid, {
      uuid,
      name: String(entry?.[nameKey] ?? "").trim() || uuid,
      selected: uuid === selectedUuid
    })
  }

  return Array.from(options.values()).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
}

function getActorByUuid(actorUuid) {
  const normalizedUuid = String(actorUuid ?? "").trim()
  if (!normalizedUuid) return null

  return game.actors.find((actor) => actor.uuid === normalizedUuid) ?? null
}

function canUserViewGlobalJournalEntry(entry, user = game.user) {
  if (user?.isGM) return true

  const merchantActor = getActorByUuid(entry?.merchantActorUuid)
  if (!merchantActor) return false

  const permissions = getMerchantPermissions(merchantActor, { user })
  return canUserViewClientJournalEntries(getActorByUuid(entry?.buyerActorUuid), permissions, user)
}

// ─── Journal global storage ───────────────────────────────────────────────────

const GLOBAL_STORAGE_JOURNAL_SORT_KEYS = ["date", "storage", "buyer", "status", "recovered", "deposited", "adjustment"]

function normalizeGlobalStorageJournalSort(sort = {}) {
  const key = GLOBAL_STORAGE_JOURNAL_SORT_KEYS.includes(sort.key) ? sort.key : "date"
  const direction = sort.direction === "asc" ? "asc" : "desc"
  return { key, direction }
}

function compareGlobalStorageJournalTransactions(a, b, sort) {
  const direction = sort.direction === "asc" ? 1 : -1

  if (sort.key === "storage") {
    return (
      String(a.merchantName ?? "").localeCompare(String(b.merchantName ?? ""), undefined, { sensitivity: "base" }) *
      direction
    )
  }
  if (sort.key === "buyer") {
    return (
      String(a.buyerName ?? "").localeCompare(String(b.buyerName ?? ""), undefined, { sensitivity: "base" }) * direction
    )
  }
  if (sort.key === "status") {
    return String(a.status ?? "").localeCompare(String(b.status ?? ""), undefined, { sensitivity: "base" }) * direction
  }
  if (sort.key === "recovered") {
    return (Number(a.recoveredDifferentItemCount ?? 0) - Number(b.recoveredDifferentItemCount ?? 0)) * direction
  }
  if (sort.key === "deposited") {
    return (Number(a.depositedDifferentItemCount ?? 0) - Number(b.depositedDifferentItemCount ?? 0)) * direction
  }
  if (sort.key === "adjustment") {
    return (Number(a.moneyAdjustmentValue ?? 0) - Number(b.moneyAdjustmentValue ?? 0)) * direction
  }

  const dateA = Date.parse(a.createdAt ?? "") || 0
  const dateB = Date.parse(b.createdAt ?? "") || 0
  return (dateA - dateB) * direction
}

function canUserViewGlobalStorageJournalEntry(entry, user = game.user) {
  if (user?.isGM) return true

  const storageActor = getActorByUuid(entry?.merchantActorUuid)
  if (!storageActor) return false

  const permissions = getMerchantPermissions(storageActor, { user })
  return canUserViewClientJournalEntries(getActorByUuid(entry?.buyerActorUuid), permissions, user)
}

export class MttGlobalStorageJournalApp extends HandlebarsApplicationMixin(ApplicationV2) {
  #filters = {
    storageUuid: "",
    buyerUuid: ""
  }

  #sort = {
    key: "date",
    direction: "desc"
  }

  static DEFAULT_OPTIONS = {
    id: "mtt-global-storage-journal",
    classes: ["mtt-global-journal-app"],
    window: {
      title: "mtt.globalStorageJournal.title",
      icon: "fas fa-warehouse",
      resizable: true
    },
    position: {
      width: 980,
      height: 720
    },
    actions: {
      sortGlobalStorageJournal: MttGlobalStorageJournalApp.#onSortGlobalStorageJournal,
      setGlobalStorageJournalFilter: MttGlobalStorageJournalApp.#onSetGlobalStorageJournalFilter,
      clearGlobalStorageJournalFilters: MttGlobalStorageJournalApp.#onClearGlobalStorageJournalFilters
    }
  }

  static PARTS = {
    body: {
      template: MTT.TEMPLATES.MTT_GLOBAL_STORAGE_JOURNAL
    }
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options)
    const filters = {
      storageUuid: String(this.#filters.storageUuid ?? ""),
      buyerUuid: String(this.#filters.buyerUuid ?? "")
    }
    const sort = normalizeGlobalStorageJournalSort(this.#sort)
    const storages = game.actors.filter((actor) => isMTTStorage(actor))
    const collectedEntries = storages.flatMap((storage) => {
      const storageData = getStorageData(storage)
      const storageName = storageData?.storage?.name || storage.name
      return (storageData?.journal?.entries ?? []).map((entry) =>
        normalizeJournalEntry({
          ...entry,
          merchantActorUuid: entry.merchantActorUuid || storage.uuid,
          merchantName: entry.merchantName || storageName
        })
      )
    })
    const visibleEntries = collectedEntries.filter((entry) =>
      canUserViewGlobalStorageJournalEntry(entry, game.user)
    )
    const filteredEntries = visibleEntries
      .filter((entry) => !filters.storageUuid || entry.merchantActorUuid === filters.storageUuid)
      .filter((entry) => !filters.buyerUuid || entry.buyerActorUuid === filters.buyerUuid)
      .map((entry) => prepareJournalEntryDisplay(entry))

    filteredEntries.sort((a, b) => compareGlobalStorageJournalTransactions(a, b, sort))

    return {
      ...context,
      transactions: filteredEntries,
      canSeeSecretIndicators: false,
      hasTransactions: filteredEntries.length > 0,
      hasCollectedEntries: visibleEntries.length > 0,
      storages: storages
        .filter((storage) => visibleEntries.some((entry) => entry.merchantActorUuid === storage.uuid))
        .map((storage) => ({
          uuid: storage.uuid,
          name: getStorageData(storage)?.storage?.name || storage.name,
          selected: storage.uuid === filters.storageUuid
        }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
      buyers: getUniqueNamedOptions(visibleEntries, "buyerActorUuid", "buyerName", filters.buyerUuid),
      filters,
      sort
    }
  }

  _onRender(context, options) {
    super._onRender(context, options)

    for (const select of this.element.querySelectorAll("select[data-action='setGlobalStorageJournalFilter']")) {
      select.addEventListener("change", (event) => {
        this.#setGlobalStorageJournalFilterFromTarget(event.currentTarget)
      })
    }
  }

  static async #onSortGlobalStorageJournal(event, target) {
    const key = target.dataset.sortKey
    if (!GLOBAL_STORAGE_JOURNAL_SORT_KEYS.includes(key)) return

    const current = normalizeGlobalStorageJournalSort(this.#sort)
    this.#sort = {
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }
    this.render()
  }

  static async #onSetGlobalStorageJournalFilter(event, target) {
    if (target.tagName === "SELECT" && event.type !== "change") return
    this.#setGlobalStorageJournalFilterFromTarget(target)
  }

  #setGlobalStorageJournalFilterFromTarget(target) {
    const key = target.dataset.filterKey
    if (!(key in this.#filters)) return

    this.#filters = {
      ...this.#filters,
      [key]: String(target.value ?? "")
    }
    this.render()
  }

  static async #onClearGlobalStorageJournalFilters() {
    this.#filters = {
      storageUuid: "",
      buyerUuid: ""
    }
    this.render()
  }
}

// ─── Journal global shop ──────────────────────────────────────────────────────

export class MttGlobalJournalApp extends HandlebarsApplicationMixin(ApplicationV2) {
  #filters = {
    merchantUuid: "",
    buyerUuid: ""
  }

  #sort = {
    key: "date",
    direction: "desc"
  }

  static DEFAULT_OPTIONS = {
    id: "mtt-global-journal",
    classes: ["mtt-global-journal-app"],
    window: {
      title: "mtt.globalJournal.title",
      icon: "fas fa-book",
      resizable: true
    },
    position: {
      width: 980,
      height: 720
    },
    actions: {
      sortGlobalJournal: MttGlobalJournalApp.#onSortGlobalJournal,
      setGlobalJournalFilter: MttGlobalJournalApp.#onSetGlobalJournalFilter,
      clearGlobalJournalFilters: MttGlobalJournalApp.#onClearGlobalJournalFilters
    }
  }

  static PARTS = {
    body: {
      template: MTT.TEMPLATES.MTT_GLOBAL_JOURNAL
    }
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options)
    const filters = {
      merchantUuid: String(this.#filters.merchantUuid ?? ""),
      buyerUuid: String(this.#filters.buyerUuid ?? "")
    }
    const sort = normalizeGlobalJournalSort(this.#sort)
    const merchants = game.actors.filter((actor) => isMTTMerchant(actor))
    const collectedTransactions = merchants.flatMap((merchant) => {
      const shopName = getMerchantData(merchant)?.shop?.name || merchant.name
      return (getMerchantData(merchant)?.journal?.transactions ?? []).map((entry) =>
        normalizeJournalEntry({
          ...entry,
          merchantActorUuid: entry.merchantActorUuid || merchant.uuid,
          merchantName: entry.merchantName || shopName
        })
      )
    })
    const visibleTransactions = collectedTransactions.filter((entry) => canUserViewGlobalJournalEntry(entry, game.user))
    const filteredTransactions = visibleTransactions
      .filter((entry) => !filters.merchantUuid || entry.merchantActorUuid === filters.merchantUuid)
      .filter((entry) => !filters.buyerUuid || entry.buyerActorUuid === filters.buyerUuid)
      .map((entry) => ({
        ...prepareJournalEntryDisplay(entry),
        merchantFilterUuid: entry.merchantActorUuid
      }))

    filteredTransactions.sort((a, b) => compareGlobalJournalTransactions(a, b, sort))

    return {
      ...context,
      transactions: filteredTransactions,
      canSeeSecretIndicators: Boolean(game.user?.isGM),
      hasTransactions: filteredTransactions.length > 0,
      hasCollectedTransactions: visibleTransactions.length > 0,
      merchants: merchants
        .filter((merchant) => visibleTransactions.some((entry) => entry.merchantActorUuid === merchant.uuid))
        .map((merchant) => ({
          uuid: merchant.uuid,
          name: getMerchantData(merchant)?.shop?.name || merchant.name,
          selected: merchant.uuid === filters.merchantUuid
        }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
      buyers: getUniqueNamedOptions(visibleTransactions, "buyerActorUuid", "buyerName", filters.buyerUuid),
      filters,
      sort
    }
  }

  _onRender(context, options) {
    super._onRender(context, options)

    for (const select of this.element.querySelectorAll("select[data-action='setGlobalJournalFilter']")) {
      select.addEventListener("change", (event) => {
        this.#setGlobalJournalFilterFromTarget(event.currentTarget)
      })
    }
  }

  static async #onSortGlobalJournal(event, target) {
    const key = target.dataset.sortKey
    if (!GLOBAL_JOURNAL_SORT_KEYS.includes(key)) return

    const current = normalizeGlobalJournalSort(this.#sort)
    this.#sort = {
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }
    this.render()
  }

  static async #onSetGlobalJournalFilter(event, target) {
    if (target.tagName === "SELECT" && event.type !== "change") return

    this.#setGlobalJournalFilterFromTarget(target)
  }

  #setGlobalJournalFilterFromTarget(target) {
    const key = target.dataset.filterKey
    if (!(key in this.#filters)) return

    this.#filters = {
      ...this.#filters,
      [key]: String(target.value ?? "")
    }
    this.render()
  }

  static async #onClearGlobalJournalFilters() {
    this.#filters = {
      merchantUuid: "",
      buyerUuid: ""
    }
    this.render()
  }
}
