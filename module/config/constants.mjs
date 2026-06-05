export const MTT = {
  ID: "mtt-merchants",
  NAME: "Merchants, Trades and Transactions",

  ACTOR_TYPES: {
    MERCHANT: "mtt-merchants.merchant",
  },

  FLAGS: {
    PRODUCT: "product",
  },

  PRODUCT_DEFAULTS: {
    displayName: "",
    quantity: 1,
    secretName: "",
    secretPrice: "",
    secretCurrency: "",
    secretDescription: "",
    priceValue: 0,
    priceCurrency: "",
    category: "",
    systemCategoryKey: "",
    systemCategoryLabel: "",
    systemCategoryPath: "",
    systemSubcategory: "",
    sourceUuid: "",
    isCommerciallyModified: false,
    ownershipLevel: 2,
    isSecretExpanded: false,
    isHidden: false,
    requiresApproval: false,
    hasFreePrice: false,
    minimumPriceValue: 0,
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
    sourceImg: "",
    category: "",
    systemCategoryKey: "",
    systemCategoryLabel: "",
    systemCategoryPath: "",
    isCommerciallyModified: false,
    hasFreePrice: false,
    minimumPriceValue: 0,
  },

  JOURNAL_DEFAULTS: {
    transactions: [],
    nextTransactionNumber: 1,
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
    secrets: [],
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
    unitPriceValue: 0,
    totalPriceValue: 0,
    priceCurrency: "",
    referenceUnitPriceValue: null,
    percentOfReference: null,
    isNegotiated: false,
    negotiationStatus: "",
    isFreePrice: false,
    hadSecrets: false,
  },

  JOURNAL_MONEY_ADJUSTMENT_DEFAULTS: {
    side: "buyer",
    value: 0,
    currency: "",
    label: "",
  },

  TEMPLATES: {
    MERCHANT_SHEET: "modules/mtt-merchants/templates/actors/merchant-sheet.hbs",
    MERCHANT_HEADER:
      "modules/mtt-merchants/templates/actors/parts/merchant-header.hbs",
    MERCHANT_MAIN:
      "modules/mtt-merchants/templates/actors/parts/merchant-main.hbs",
    MERCHANT_PRODUCTS:
      "modules/mtt-merchants/templates/actors/parts/merchant-products.hbs",
    MERCHANT_SERVICES:
      "modules/mtt-merchants/templates/actors/parts/merchant-services.hbs",
    MERCHANT_CONFIGURATION:
      "modules/mtt-merchants/templates/actors/parts/merchant-configuration.hbs",
    MERCHANT_JOURNAL:
      "modules/mtt-merchants/templates/actors/parts/merchant-journal.hbs",
    MERCHANT_SESSION:
      "modules/mtt-merchants/templates/actors/parts/merchant-session.hbs",
    MTT_CONFIG: "modules/mtt-merchants/templates/apps/mtt-config.hbs",
    MTT_GLOBAL_JOURNAL:
      "modules/mtt-merchants/templates/apps/mtt-global-journal.hbs",
    MTT_DIALOG: "modules/mtt-merchants/templates/apps/mtt-dialog.hbs",
  },

  CSS: {
    SHEET: "mtt-sheet",
    MERCHANT_SHEET: "mtt-merchant-sheet",
  },
};
