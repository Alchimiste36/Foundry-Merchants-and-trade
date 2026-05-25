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
    secretDescription: "",
    priceValue: 0,
    priceCurrency: "",
    category: "",
    systemCategoryKey: "",
    systemCategoryLabel: "",
    systemCategoryPath: "",
    isSecretExpanded: false,
    isHidden: false,
    requiresApproval: false,
    hasFreePrice: false,
    minimumPriceValue: 0,
  },

  SERVICE_DEFAULTS: {
    name: "",
    description: "",
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
    hasFreePrice: false,
    minimumPriceValue: 0,
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
    MERCHANT_SESSION:
      "modules/mtt-merchants/templates/actors/parts/merchant-session.hbs",
    MTT_CONFIG: "modules/mtt-merchants/templates/apps/mtt-config.hbs",
    MTT_DIALOG: "modules/mtt-merchants/templates/apps/mtt-dialog.hbs",
  },

  CSS: {
    SHEET: "mtt-sheet",
    MERCHANT_SHEET: "mtt-merchant-sheet",
  },
};
