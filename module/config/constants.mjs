export const MTT_ENTITY_TYPES = {
  MERCHANT: "merchant",
  STORAGE: "storage"
}

export const MTT = {
  ID: "mtt-merchants",
  NAME: "Merchants, Trades and Transactions",

  FLAGS: {
    TYPE: "type",
    PRODUCT: "product",
    MERCHANT: "merchant",
    STORAGE: "storage"
  },

  ENTITY_TYPES: MTT_ENTITY_TYPES,

  PRODUCT_DEFAULTS: {
    quantity: 1,
    deliveryQuantityPerLot: null,
    secretName: "",
    secretPrice: "",
    secretCurrency: "",
    secretDescription: "",
    priceCurrency: "",
    category: "",
    systemCategoryKey: "",
    systemCategoryLabel: "",
    systemCategoryPath: "",
    systemSubcategory: "",
    sourceUuid: "",
    ownershipLevel: 2,
    isSecretExpanded: false,
    isHidden: false,
    requiresApproval: false,
    hasFreePrice: false,
    minimumPriceValue: 0
  },

  SERVICE_DEFAULTS: {
    name: "",
    description: "",
    secretName: "",
    secretPrice: "",
    secretCurrency: "",
    secretDescription: "",
    priceValue: 0,
    priceCurrency: "",
    quantity: null,
    isHidden: false,
    requiresApproval: false,
    isExpanded: true,
    sourceUuid: null,
    sourceName: "",
    sourceType: "",
    sourceImg: "icons/svg/coins.svg",
    category: "",
    systemCategoryKey: "",
    systemCategoryLabel: "",
    systemCategoryPath: "",
    isCommerciallyModified: false,
    hasFreePrice: false,
    minimumPriceValue: 0
  },

  JOURNAL_DEFAULTS: {
    transactions: [],
    nextTransactionNumber: 1
  },

  JOURNAL_ENTRY_DEFAULTS: {
    transactionNumber: null,
    status: "validated",
    merchantActorUuid: "",
    merchantName: "",
    buyerActorUuid: "",
    buyerName: "",
    buyerImg: "",
    referenceCurrency: "",
    totalReferenceValue: 0,
    summaryLabel: "",
    entries: [],
    moneyAdjustments: [],
    secrets: []
  },

  JOURNAL_TRANSACTION_ENTRY_DEFAULTS: {
    type: "product",
    side: "buyer",
    sourceId: "",
    sourceUuid: "",
    sourceActorUuid: "",
    name: "",
    img: "",
    quantity: 1,
    deliveryQuantityPerLot: null,
    unitPriceValue: 0,
    totalPriceValue: 0,
    priceCurrency: "",
    referenceUnitPriceValue: null,
    percentOfReference: null,
    isNegotiated: false,
    negotiationStatus: "",
    isFreePrice: false,
    hadSecrets: false
  },

  JOURNAL_MONEY_ADJUSTMENT_DEFAULTS: {
    side: "buyer",
    value: 0,
    currency: "",
    label: ""
  },

  TEMPLATES: {
    MERCHANT_SHEET: "modules/mtt-merchants/templates/actors/merchant-sheet.hbs",
    MERCHANT_HEADER: "modules/mtt-merchants/templates/actors/parts/merchant-header.hbs",
    MERCHANT_MAIN: "modules/mtt-merchants/templates/actors/parts/merchant-main.hbs",
    MERCHANT_PRODUCTS: "modules/mtt-merchants/templates/actors/parts/merchant-products.hbs",
    MERCHANT_SERVICES: "modules/mtt-merchants/templates/actors/parts/merchant-services.hbs",
    MERCHANT_CONFIGURATION: "modules/mtt-merchants/templates/actors/parts/merchant-configuration.hbs",
    MERCHANT_JOURNAL: "modules/mtt-merchants/templates/actors/parts/merchant-journal.hbs",
    MERCHANT_SESSION: "modules/mtt-merchants/templates/actors/parts/merchant-session.hbs",
    MERCHANT_ACCESS_RAIL: "modules/mtt-merchants/templates/actors/parts/merchant-access-rail.hbs",
    MTT_CONFIG: "modules/mtt-merchants/templates/apps/mtt-config.hbs",
    MTT_GLOBAL_JOURNAL: "modules/mtt-merchants/templates/apps/mtt-global-journal.hbs",
    MTT_DIALOG: "modules/mtt-merchants/templates/apps/mtt-dialog.hbs",
    CONFIRM_DIALOG: "modules/mtt-merchants/templates/dialogs/confirm-dialog.hbs",
    SECRET_INFO_DIALOG: "modules/mtt-merchants/templates/dialogs/secret-info-dialog.hbs",
    CLIENT_RATES_DIALOG: "modules/mtt-merchants/templates/dialogs/client-rates-dialog.hbs",
    TRANSACTION_SUMMARY_DIALOG: "modules/mtt-merchants/templates/dialogs/transaction-summary-dialog.hbs",
    TRANSACTION_ERRORS_DIALOG: "modules/mtt-merchants/templates/dialogs/transaction-errors-dialog.hbs",
    SELLER_ITEM_DIALOG: "modules/mtt-merchants/templates/dialogs/seller-item-dialog.hbs",
    SESSION_PREPARATION_DIALOG: "modules/mtt-merchants/templates/dialogs/session-preparation-dialog.hbs"
  },

  CSS: {
    SHEET: "mtt-sheet",
    MERCHANT_SHEET: "mtt-merchant-sheet"
  }
}
