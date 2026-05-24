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
    isSecretExpanded: false,
    isHidden: false,
    requiresApproval: false,
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
  },

  TEMPLATES: {
    MERCHANT_SHEET: "modules/mtt-merchants/templates/actors/merchant-sheet.hbs",
    MERCHANT_HEADER: "modules/mtt-merchants/templates/actors/parts/merchant-header.hbs",
    MERCHANT_SIDEBAR: "modules/mtt-merchants/templates/actors/parts/merchant-sidebar.hbs",
    MERCHANT_MAIN: "modules/mtt-merchants/templates/actors/parts/merchant-main.hbs",
    MERCHANT_NAVIGATION: "modules/mtt-merchants/templates/actors/parts/merchant-navigation.hbs",
    MERCHANT_PRODUCTS: "modules/mtt-merchants/templates/actors/parts/merchant-products.hbs",
    MERCHANT_SERVICES: "modules/mtt-merchants/templates/actors/parts/merchant-services.hbs",
  },

  CSS: {
    SHEET: "mtt-sheet",
    MERCHANT_SHEET: "mtt-merchant-sheet",
  },
};
