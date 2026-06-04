import { MTT } from "../../config/constants.mjs";
import { getCurrencies } from "../../config/settings.mjs";
import {
  normalizeCurrencyKey,
  normalizeCurrencyText,
  formatCurrencyLabel,
  formatPriceLabel,
  createCheckMessage,
  parseQuantityValue,
  isUnlimitedQuantity,
  isFreePriceService,
  normalizeFiniteQuantity,
  getConfiguredItemQuantity,
  getConfiguredItemMaxQuantity,
  normalizeMaxQuantity,
  normalizeItemQuantity,
  getAvailableStackSpace,
  getDeliveryStackingConfig,
  getMttSourceUuid,
  getDeliveredItemMergeMode,
  roundToSmallestCurrencyUnit,
  escapeHTML,
  getModuleSetting,
  hasSecretValue,
  productHasSecretInfo,
} from "./merchant-utils.mjs";
import {
  prepareMerchantCatalogItemData,
  getAutomaticItemCategory,
  getOrCreateAutomaticProductCategory,
  getItemAvailableQuantity,
  findMergeableMerchantItemBySourceUuid,
} from "./merchant-catalog.mjs";

// ─── Session normalization ────────────────────────────────────────────────────

export function normalizeSessionItem(item) {
  const quantity = Number(item.quantity);
  const unitPriceValue = Number(item.unitPriceValue);
  const availableQuantity = Number(item.availableQuantity);
  const hasLimitedQuantity =
    Boolean(item.hasLimitedQuantity) && Number.isFinite(availableQuantity) && availableQuantity >= 0;
  const normalizedQuantity = Number.isFinite(quantity) && quantity >= 0 ? quantity : 1;
  const normalizedUnitPrice = Number.isFinite(unitPriceValue) && unitPriceValue >= 0 ? unitPriceValue : 0;

  return {
    id: item.id || foundry.utils.randomID(),
    type: ["product", "service", "item"].includes(item.type) ? item.type : "product",
    sourceUuid: item.sourceUuid ?? "",
    sourceActorUuid: item.sourceActorUuid ?? "",
    sourceId: item.sourceId ?? "",
    name: item.name ?? "",
    img: item.img ?? "",
    quantity: normalizedQuantity,
    availableQuantity: hasLimitedQuantity ? availableQuantity : null,
    hasLimitedQuantity,
    unitPriceValue: normalizedUnitPrice,
    priceCurrency: String(item.priceCurrency ?? "").trim(),
    totalPriceValue: Number((normalizedQuantity * normalizedUnitPrice).toFixed(2)),
    sourceLabel: item.sourceLabel ?? "",
    proposedUnitPriceValue:
      item.proposedUnitPriceValue !== null &&
      item.proposedUnitPriceValue !== undefined &&
      Number.isFinite(Number(item.proposedUnitPriceValue))
        ? Number(item.proposedUnitPriceValue)
        : null,
    isFromActor: Boolean(item.isFromActor),
    isFreePrice: Boolean(item.isFreePrice),
    minimumPriceValue:
      item.minimumPriceValue !== null &&
      item.minimumPriceValue !== undefined &&
      Number.isFinite(Number(item.minimumPriceValue)) &&
      Number(item.minimumPriceValue) >= 0
        ? Number(item.minimumPriceValue)
        : null,
  };
}

export function normalizeNegotiationOffer(offer = {}) {
  const quantity = Number(offer.quantity);
  const unitPriceValue = Number(offer.unitPriceValue);
  const totalPriceValue = Number(offer.totalPriceValue);
  const percentOfReference = Number(offer.percentOfReference);

  return {
    id: offer.id || foundry.utils.randomID(),
    side: ["buyer", "merchant"].includes(offer.side) ? offer.side : "buyer",
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    unitPriceValue: Number.isFinite(unitPriceValue) && unitPriceValue >= 0 ? unitPriceValue : 0,
    totalPriceValue: Number.isFinite(totalPriceValue) && totalPriceValue >= 0 ? totalPriceValue : 0,
    percentOfReference: Number.isFinite(percentOfReference) && percentOfReference >= 0 ? percentOfReference : 100,
    status: ["draft", "submitted"].includes(offer.status) ? offer.status : "submitted",
    createdAt: offer.createdAt || new Date().toISOString(),
  };
}

export function normalizeSessionNegotiation(negotiation = {}) {
  const referenceUnitPriceValue = Number(negotiation.referenceUnitPriceValue);
  const proposedUnitPriceValue = Number(negotiation.proposedUnitPriceValue);
  const minimumPriceValue = Number(negotiation.minimumPriceValue);

  return {
    id: negotiation.id || foundry.utils.randomID(),
    side: ["buyer", "seller"].includes(negotiation.side) ? negotiation.side : "buyer",
    type: ["product", "service", "item"].includes(negotiation.type) ? negotiation.type : "product",
    sourceId: String(negotiation.sourceId ?? "").trim(),
    sourceUuid: String(negotiation.sourceUuid ?? "").trim(),
    sourceActorUuid: String(negotiation.sourceActorUuid ?? "").trim(),
    name: String(negotiation.name ?? "").trim(),
    img: negotiation.img ?? "",
    priceCurrency: String(negotiation.priceCurrency ?? "").trim(),
    referenceUnitPriceValue:
      Number.isFinite(referenceUnitPriceValue) && referenceUnitPriceValue >= 0 ? referenceUnitPriceValue : 0,
    proposedUnitPriceValue:
      Number.isFinite(proposedUnitPriceValue) && proposedUnitPriceValue >= 0 ? proposedUnitPriceValue : null,
    isFreePrice: Boolean(negotiation.isFreePrice),
    minimumPriceValue:
      negotiation.minimumPriceValue !== null &&
      negotiation.minimumPriceValue !== undefined &&
      Number.isFinite(minimumPriceValue) &&
      minimumPriceValue >= 0
        ? minimumPriceValue
        : null,
    status: ["active", "accepted", "refused"].includes(negotiation.status) ? negotiation.status : "active",
    currentTurn: ["buyer", "merchant"].includes(negotiation.currentTurn) ? negotiation.currentTurn : "merchant",
    offers: Array.isArray(negotiation.offers)
      ? negotiation.offers.map((offer) => normalizeNegotiationOffer(offer))
      : [],
    createdAt: negotiation.createdAt || new Date().toISOString(),
    updatedAt: negotiation.updatedAt || new Date().toISOString(),
  };
}

export function normalizeSession(session) {
  const normalizedStatus = ["active", "pending", "validated", "refused", "submitted"].includes(session.status)
    ? session.status
    : Boolean(session.isSubmitted)
      ? "submitted"
      : "active";

  return {
    id: session.id || foundry.utils.randomID(),
    status: normalizedStatus,
    isSubmitted: normalizedStatus === "submitted",
    label: session.label || game.i18n.localize("mtt.sessions.newLabel"),
    actorUuid: session.actorUuid ?? "",
    actorName: session.actorName ?? "",
    userId: session.userId ?? "",
    userName: session.userName ?? "",
    buyerItems: Array.isArray(session.buyerItems) ? session.buyerItems.map((item) => normalizeSessionItem(item)) : [],
    sellerItems: Array.isArray(session.sellerItems)
      ? session.sellerItems.map((item) => normalizeSessionItem(item))
      : [],
    negotiations: Array.isArray(session.negotiations)
      ? session.negotiations.map((negotiation) => normalizeSessionNegotiation(negotiation))
      : [],
    createdAt: session.createdAt || new Date().toISOString(),
    updatedAt: session.updatedAt || new Date().toISOString(),
  };
}

export function buildSessionData(client = null) {
  const now = new Date().toISOString();
  const actorName = client?.actorName ?? "";

  return {
    id: foundry.utils.randomID(),
    status: "active",
    isSubmitted: false,
    label: actorName
      ? game.i18n.format("mtt.sessions.sessionForActor", { name: actorName })
      : game.i18n.localize("mtt.sessions.newLabel"),
    actorUuid: client?.actorUuid ?? "",
    actorName,
    userId: client?.userId ?? "",
    userName: client?.userName ?? "",
    buyerItems: [],
    sellerItems: [],
    negotiations: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function getSessions(actor) {
  return foundry.utils.deepClone(actor.system.sessions?.entries ?? []);
}

// ─── Session item helpers ─────────────────────────────────────────────────────

export function recalculateSessionItemTotal(item) {
  const quantity = Number(item.quantity);
  const unitPriceValue = Number(item.unitPriceValue);

  item.totalPriceValue =
    Number.isFinite(quantity) && Number.isFinite(unitPriceValue) ? Number((quantity * unitPriceValue).toFixed(2)) : 0;
}

export function setSessionItemQuantity(item, quantity) {
  item.quantity = Number(Number(quantity).toFixed(2));
  recalculateSessionItemTotal(item);
}

export function getSessionItemsForSide(session, side) {
  return side === "seller" ? session.sellerItems : session.buyerItems;
}

export function removeSessionItemById(session, itemId, side = "") {
  const initialBuyerCount = session.buyerItems.length;
  const initialSellerCount = session.sellerItems.length;

  if (side === "buyer") {
    session.buyerItems = session.buyerItems.filter((item) => item.id !== itemId);
  } else if (side === "seller") {
    session.sellerItems = session.sellerItems.filter((item) => item.id !== itemId);
  } else {
    session.buyerItems = session.buyerItems.filter((item) => item.id !== itemId);
    session.sellerItems = session.sellerItems.filter((item) => item.id !== itemId);
  }

  return initialBuyerCount !== session.buyerItems.length || initialSellerCount !== session.sellerItems.length;
}

export function syncSessionItemAvailability(actor, item) {
  if (!item) return;

  if (item.type === "product") {
    const source = actor.items.get(item.sourceId);
    const product = source?.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};
    const availableQuantity = normalizeFiniteQuantity(product.quantity);
    const hasLimitedQuantity = !isUnlimitedQuantity(product.quantity) && availableQuantity !== null;

    item.availableQuantity = hasLimitedQuantity ? availableQuantity : null;
    item.hasLimitedQuantity = hasLimitedQuantity;
    return;
  }

  if (item.type === "service") {
    const service = actor.system.services?.entries?.find((entry) => entry.id === item.sourceId);
    const quantity = service?.quantity;
    const availableQuantity = Number(quantity);
    const hasLimitedQuantity =
      quantity !== null &&
      quantity !== undefined &&
      quantity !== "" &&
      Number.isFinite(availableQuantity) &&
      availableQuantity >= 0;

    item.availableQuantity = hasLimitedQuantity ? availableQuantity : null;
    item.hasLimitedQuantity = hasLimitedQuantity;
  }
}

export function canAcceptSessionQuantity(actor, item, quantity) {
  syncSessionItemAvailability(actor, item);

  const requestedQuantity = Number(quantity);
  if (!Number.isFinite(requestedQuantity) || requestedQuantity < 0) return false;
  if (!item.hasLimitedQuantity) return true;

  const availableQuantity = Number(item.availableQuantity);
  if (!Number.isFinite(availableQuantity) || availableQuantity < 0) return true;

  return requestedQuantity <= availableQuantity;
}

// ─── Session totals and adjustments ──────────────────────────────────────────

export function prepareSessionTotals(items) {
  const totals = new Map();

  items.forEach((item) => {
    const currency = normalizeCurrencyKey(item.priceCurrency);
    const totalPriceValue = Number(item.totalPriceValue);
    if (!Number.isFinite(totalPriceValue) || totalPriceValue < 0) return;

    totals.set(currency, (totals.get(currency) ?? 0) + totalPriceValue);
  });

  return Array.from(totals.entries()).map(([currency, totalPriceValue]) => {
    const roundedTotal = Number(totalPriceValue.toFixed(2));

    return {
      currency,
      currencyLabel: formatCurrencyLabel(currency === "__none" ? "" : currency),
      totalPriceValue: roundedTotal,
      totalPriceLabel: formatPriceLabel(roundedTotal, currency === "__none" ? "" : currency),
    };
  });
}

export function prepareMoneyAdjustments(buyerTotals, sellerTotals) {
  const totalsByCurrency = new Map();

  buyerTotals.forEach((total) => {
    totalsByCurrency.set(total.currency, {
      currency: total.currency,
      buyer: Number(total.totalPriceValue) || 0,
      seller: 0,
    });
  });

  sellerTotals.forEach((total) => {
    const existing = totalsByCurrency.get(total.currency) ?? {
      currency: total.currency,
      buyer: 0,
      seller: 0,
    };
    existing.seller = Number(total.totalPriceValue) || 0;
    totalsByCurrency.set(total.currency, existing);
  });

  return Array.from(totalsByCurrency.values())
    .map(({ currency, buyer, seller }) => {
      const difference = Number((buyer - seller).toFixed(2));
      if (difference === 0) return null;

      const side = difference > 0 ? "seller" : "buyer";
      const amount = Math.abs(difference);
      const displayCurrency = currency === "__none" ? "" : currency;

      return {
        id: `money-adjustment-${side}-${currency}`,
        side,
        currency,
        currencyLabel: formatCurrencyLabel(displayCurrency),
        amount,
        amountLabel: formatPriceLabel(amount, displayCurrency),
        label: game.i18n.localize("mtt.sessions.moneyAdjustment"),
        isMoneyAdjustment: true,
      };
    })
    .filter(Boolean);
}

export function getSessionStatusNotice(status) {
  if (status === "submitted") return game.i18n.localize("mtt.sessions.submittedNotice");
  if (status === "pending") return game.i18n.localize("mtt.sessions.pendingNotice");
  if (status === "validated") return game.i18n.localize("mtt.sessions.validatedNoTransfer");
  if (status === "refused") return game.i18n.localize("mtt.sessions.refusedNotice");
  return game.i18n.localize("mtt.sessions.activeNotice");
}

// ─── Session context preparation ─────────────────────────────────────────────

export function prepareSessionCheckContext(sessionCheckResult) {
  if (!sessionCheckResult?.checked) {
    return {
      checked: false,
      canProceed: false,
      infos: [],
      warnings: [],
      errors: [],
      hasInfos: false,
      hasWarnings: false,
      hasErrors: false,
    };
  }

  const infos = sessionCheckResult.infos ?? [];
  const warnings = sessionCheckResult.warnings ?? [];
  const errors = sessionCheckResult.errors ?? [];

  return {
    checked: true,
    canProceed: Boolean(sessionCheckResult.canProceed),
    infos,
    warnings,
    errors,
    hasInfos: infos.length > 0,
    hasWarnings: warnings.length > 0,
    hasErrors: errors.length > 0,
  };
}

export function prepareSessionClientContext(session, accessClients) {
  const actorUuid = String(session?.actorUuid ?? "").trim();
  if (!actorUuid) {
    return {
      hasClient: false,
      actorUuid: "",
      actorName: "",
      actorImg: "",
      userName: "",
      isAuthorized: false,
      isUnauthorized: false,
    };
  }

  const client =
    accessClients.find((entry) => entry.actorUuid === actorUuid) ??
    normalizeAccessClient({
      actorUuid,
      actorName: session.actorName ?? "",
      userId: session.userId ?? "",
      userName: session.userName ?? "",
      isAuthorized: false,
    });

  return {
    hasClient: true,
    actorUuid: client.actorUuid,
    actorName: client.actorName || session.actorName || game.i18n.localize("mtt.access.noClient"),
    actorImg: client.actorImg,
    userName: client.userName || session.userName || "",
    isAuthorized: Boolean(client.isAuthorized),
    isUnauthorized: !client.isAuthorized,
  };
}

function prepareNegotiationForDisplay(negotiation) {
  const offers = (negotiation.offers ?? []).map((offer) => ({
    ...offer,
    unitPriceLabel: formatPriceLabel(offer.unitPriceValue, negotiation.priceCurrency),
    totalPriceLabel: formatPriceLabel(offer.totalPriceValue, negotiation.priceCurrency),
    percentLabel: `${offer.percentOfReference} %`,
    isBuyerOffer: offer.side === "buyer",
    isMerchantOffer: offer.side === "merchant",
    sideClass:
      offer.side === "merchant" ? "mtt-merchant-negotiation-offer-merchant" : "mtt-merchant-negotiation-offer-buyer",
    sideLabel: game.i18n.localize(`mtt.sessions.negotiations.side.${offer.side}`),
  }));

  const lastOffer = offers.at(-1) ?? null;
  const quantity = Number(lastOffer?.quantity ?? 1);
  const unitPriceValue = Number(lastOffer?.unitPriceValue ?? negotiation.referenceUnitPriceValue ?? 0);
  const referenceUnitPriceValue = Number(negotiation.referenceUnitPriceValue);
  const minimumPriceValue = Number(negotiation.minimumPriceValue);
  const hasMinimumPrice =
    negotiation.minimumPriceValue !== null &&
    negotiation.minimumPriceValue !== undefined &&
    Number.isFinite(minimumPriceValue) &&
    minimumPriceValue >= 0;
  const draftQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
  const draftUnitPriceValue = Number.isFinite(unitPriceValue) && unitPriceValue >= 0 ? unitPriceValue : 0;
  const draftTotalPriceValue = Number((draftQuantity * draftUnitPriceValue).toFixed(2));
  const draftPercentOfReference =
    Number.isFinite(referenceUnitPriceValue) && referenceUnitPriceValue > 0
      ? Number(((draftUnitPriceValue / referenceUnitPriceValue) * 100).toFixed(2))
      : 100;

  return {
    ...negotiation,
    offers,
    hasOffers: offers.length > 0,
    lastOffer,
    referenceUnitPriceLabel: formatPriceLabel(referenceUnitPriceValue, negotiation.priceCurrency),
    hasMinimumPrice,
    minimumPriceLabel: hasMinimumPrice ? formatPriceLabel(minimumPriceValue, negotiation.priceCurrency) : "",
    hasDraft: negotiation.status === "active",
    draft: {
      quantity: draftQuantity,
      unitPriceValue: draftUnitPriceValue,
      totalPriceValue: draftTotalPriceValue,
      percentOfReference: draftPercentOfReference,
    },
    isBuyerTurn: negotiation.currentTurn === "buyer",
    isMerchantTurn: negotiation.currentTurn === "merchant",
    draftSideClass:
      negotiation.currentTurn === "buyer"
        ? "mtt-merchant-negotiation-offer-buyer"
        : "mtt-merchant-negotiation-offer-merchant",
    draftSideLabel: game.i18n.localize(`mtt.sessions.negotiations.side.${negotiation.currentTurn}`),
    isBuyerNegotiation: negotiation.side === "buyer",
    isSellerNegotiation: negotiation.side === "seller",
    isRefused: negotiation.status === "refused",
    isAccepted: negotiation.status === "accepted",
    isActive: negotiation.status === "active",
    canShowMerchantDecisionActions: negotiation.status === "active",
  };
}

export function prepareSessionContext(
  actor,
  { session, selectedClient, sessionCheckResult, accessClients, buyerActor },
) {
  const checkResult = prepareSessionCheckContext(sessionCheckResult);
  const buyerFortune = session ? prepareBuyerFortune(buyerActor) : [];

  if (!session) {
    return {
      id: "",
      label: "",
      status: "",
      statusLabel: "",
      buyerItems: [],
      sellerItems: [],
      buyerNegotiations: [],
      sellerNegotiations: [],
      refusedNegotiations: [],
      hasBuyerItems: false,
      hasSellerItems: false,
      hasBuyerNegotiations: false,
      hasSellerNegotiations: false,
      hasRefusedNegotiations: false,
      buyerTotalByCurrency: [],
      sellerTotalByCurrency: [],
      hasBuyerTotals: false,
      hasSellerTotals: false,
      hasSession: false,
      hasSelectedClient: Boolean(selectedClient?.actorUuid),
      canEdit: false,
      isSubmitted: false,
      statusNotice: "",
      isActive: false,
      isPending: false,
      isValidated: false,
      isRefused: false,
      hasAnyItems: false,
      isBalanced: false,
      moneyAdjustments: [],
      buyerMoneyAdjustments: [],
      sellerMoneyAdjustments: [],
      hasMoneyAdjustments: false,
      hasBuyerLines: false,
      hasSellerLines: false,
      buyerFortune,
      client: {
        hasClient: Boolean(selectedClient?.actorUuid),
        actorUuid: selectedClient?.actorUuid ?? "",
        actorName: selectedClient?.actorName ?? "",
        actorImg: selectedClient?.actorImg ?? "",
        userName: selectedClient?.userName ?? "",
        isAuthorized: Boolean(selectedClient?.isAuthorized),
        isUnauthorized: Boolean(selectedClient?.actorUuid && !selectedClient?.isAuthorized),
      },
      checkResult,
    };
  }

  const buyerItems = (session.buyerItems ?? []).map((item) => {
    syncSessionItemAvailability(actor, item);
    recalculateSessionItemTotal(item);

    const minimumPriceValue = Number(item.minimumPriceValue);
    const hasMinimumPrice = item.isFreePrice && Number.isFinite(minimumPriceValue) && minimumPriceValue > 0;

    return {
      ...item,
      sourceLabel: item.sourceLabel || game.i18n.localize(`mtt.sessions.item.${item.type}`),
      unitPriceLabel: formatPriceLabel(item.unitPriceValue, item.priceCurrency),
      totalPriceLabel: formatPriceLabel(item.totalPriceValue, item.priceCurrency),
      availableQuantityLabel: Number.isFinite(Number(item.availableQuantity)) ? String(item.availableQuantity) : "",
      isFreePrice: Boolean(item.isFreePrice),
      hasMinimumPrice,
      minimumPriceLabel: hasMinimumPrice ? formatPriceLabel(minimumPriceValue, item.priceCurrency) : "",
    };
  });

  const sellerItems = (session.sellerItems ?? []).map((item) => {
    recalculateSessionItemTotal(item);

    return {
      ...item,
      sourceLabel: item.sourceLabel || game.i18n.localize("mtt.sessions.item.object"),
      unitPriceLabel: formatPriceLabel(item.unitPriceValue, item.priceCurrency),
      totalPriceLabel: formatPriceLabel(item.totalPriceValue, item.priceCurrency),
      availableQuantityLabel: Number.isFinite(Number(item.availableQuantity)) ? String(item.availableQuantity) : "",
    };
  });

  const negotiations = Array.isArray(session.negotiations)
    ? session.negotiations.map((negotiation) => prepareNegotiationForDisplay(negotiation))
    : [];
  const buyerNegotiations = negotiations.filter(
    (negotiation) => negotiation.side === "buyer" && negotiation.status === "active",
  );
  const sellerNegotiations = negotiations.filter(
    (negotiation) => negotiation.side === "seller" && negotiation.status === "active",
  );
  const refusedNegotiations = negotiations.filter((negotiation) => negotiation.status === "refused");

  const buyerTotalByCurrency = prepareSessionTotals(buyerItems);
  const sellerTotalByCurrency = prepareSessionTotals(sellerItems);
  const moneyAdjustments = prepareMoneyAdjustments(buyerTotalByCurrency, sellerTotalByCurrency);
  const buyerMoneyAdjustments = moneyAdjustments.filter((adjustment) => adjustment.side === "buyer");
  const sellerMoneyAdjustments = moneyAdjustments.filter((adjustment) => adjustment.side === "seller");
  const status = session.status ?? "active";
  const hasAnyItems = buyerItems.length > 0 || sellerItems.length > 0;
  const client = prepareSessionClientContext(session, accessClients);
  const isSessionFinal = ["validated", "refused"].includes(status);

  return {
    id: session.id,
    label: session.label,
    status,
    statusLabel: game.i18n.localize(`mtt.sessions.status.${status}`),
    buyerItems,
    sellerItems,
    buyerNegotiations,
    sellerNegotiations,
    refusedNegotiations,
    hasBuyerItems: buyerItems.length > 0,
    hasSellerItems: sellerItems.length > 0,
    hasBuyerNegotiations: buyerNegotiations.length > 0,
    hasSellerNegotiations: sellerNegotiations.length > 0,
    hasRefusedNegotiations: refusedNegotiations.length > 0,
    buyerTotalByCurrency,
    sellerTotalByCurrency,
    hasBuyerTotals: buyerTotalByCurrency.length > 0,
    hasSellerTotals: sellerTotalByCurrency.length > 0,
    hasSession: true,
    canEdit: !isSessionFinal,
    isSubmitted: status === "submitted",
    isActive: status === "active",
    isPending: status === "pending",
    isValidated: status === "validated",
    isRefused: status === "refused",
    statusNotice: getSessionStatusNotice(status),
    hasAnyItems,
    moneyAdjustments,
    buyerMoneyAdjustments,
    sellerMoneyAdjustments,
    hasMoneyAdjustments: moneyAdjustments.length > 0,
    isBalanced: hasAnyItems && moneyAdjustments.length === 0,
    hasBuyerLines: buyerItems.length > 0 || buyerMoneyAdjustments.length > 0,
    hasSellerLines: sellerItems.length > 0 || sellerMoneyAdjustments.length > 0,
    buyerFortune,
    client,
    checkResult,
  };
}

// ─── Access / client helpers ──────────────────────────────────────────────────

export function normalizeAccessClient(client) {
  const customRates =
    client.customRates && typeof client.customRates === "object"
      ? {
          productSellPercent: normalizeClientRateValue(client.customRates.productSellPercent, 100),
          serviceSellPercent: normalizeClientRateValue(client.customRates.serviceSellPercent, 100),
          itemBuyPercent: normalizeClientRateValue(client.customRates.itemBuyPercent, 50),
          note: String(client.customRates.note ?? "").trim(),
        }
      : null;

  return {
    actorUuid: String(client.actorUuid ?? "").trim(),
    actorId: String(client.actorId ?? "").trim(),
    actorName: String(client.actorName ?? "").trim(),
    actorImg: String(client.actorImg ?? "").trim(),
    actorType: String(client.actorType ?? "").trim(),
    userId: String(client.userId ?? "").trim(),
    userName: String(client.userName ?? "").trim(),
    isAuthorized: Boolean(client.isAuthorized),
    isFromPlayerCharacter: Boolean(client.isFromPlayerCharacter),
    customRates,
  };
}

export function normalizeClientRateValue(value, fallback) {
  const number = Number(value);
  if (Number.isFinite(number) && number >= 0) return Number(number.toFixed(2));

  return fallback;
}

function getMerchantTradePercent(actor, key, fallback) {
  const value = Number(actor?.system?.trade?.[key]);
  if (Number.isFinite(value) && value >= 0) return value;

  return fallback;
}

export function getMerchantDefaultClientRates(actor) {
  return {
    productSellPercent: getMerchantTradePercent(actor, "sellPercent", 100),
    serviceSellPercent: getMerchantTradePercent(actor, "serviceSellPercent", 100),
    itemBuyPercent: getMerchantTradePercent(actor, "buyPercent", 50),
    note: "",
  };
}

export function normalizeClientCustomRates(customRates, defaults) {
  if (!customRates || typeof customRates !== "object") return null;

  return {
    productSellPercent: normalizeClientRateValue(customRates.productSellPercent, defaults.productSellPercent),
    serviceSellPercent: normalizeClientRateValue(customRates.serviceSellPercent, defaults.serviceSellPercent),
    itemBuyPercent: normalizeClientRateValue(customRates.itemBuyPercent, defaults.itemBuyPercent),
    note: String(customRates.note ?? "").trim(),
  };
}

export function getEffectiveClientRates(actor, actorUuid) {
  const defaults = getMerchantDefaultClientRates(actor);
  const client = getStoredAccessClients(actor).find((entry) => entry.actorUuid === String(actorUuid ?? "").trim());
  const customRates = normalizeClientCustomRates(client?.customRates, defaults);

  return {
    ...defaults,
    ...(customRates ?? {}),
    hasCustomRates: Boolean(customRates),
  };
}

export function formatClientCustomRatesTooltip(customRates) {
  if (!customRates) return "";

  const parts = [
    game.i18n.format("mtt.clientRates.tooltip.product", { value: customRates.productSellPercent }),
    game.i18n.format("mtt.clientRates.tooltip.service", { value: customRates.serviceSellPercent }),
    game.i18n.format("mtt.clientRates.tooltip.itemBuy", { value: customRates.itemBuyPercent }),
  ];
  if (customRates.note) parts.push(game.i18n.format("mtt.clientRates.tooltip.note", { note: customRates.note }));

  return parts.join(" - ");
}

export function buildAccessClientFromActor(
  actor,
  { user = null, isAuthorized = false, isFromPlayerCharacter = false } = {},
) {
  return normalizeAccessClient({
    actorUuid: actor.uuid ?? "",
    actorId: actor.id ?? "",
    actorName: actor.name ?? "",
    actorImg: actor.img ?? "",
    actorType: actor.type ?? "",
    userId: user?.id ?? "",
    userName: user?.name ?? "",
    isAuthorized,
    isFromPlayerCharacter,
  });
}

export function getStoredAccessClients(actor) {
  const clients = actor.system.access?.clients ?? [];
  const clientsByUuid = new Map();

  clients.forEach((client) => {
    const normalized = normalizeAccessClient(client);
    if (!normalized.actorUuid) return;
    clientsByUuid.set(normalized.actorUuid, normalized);
  });

  return Array.from(clientsByUuid.values());
}

export function getAccessSessionBadgeIcon(status) {
  if (status === "active") return "fa-hourglass-half";
  if (status === "pending") return "fa-triangle-exclamation";
  if (status === "validated") return "fa-check";
  if (status === "refused") return "fa-xmark";
  if (status === "submitted") return "fa-thumbs-up";
  return "";
}

export function getAccessSessionTooltipLabel(status) {
  if (status === "submitted") return game.i18n.localize("mtt.access.sessionSubmitted");
  if (status === "active") return game.i18n.localize("mtt.access.sessionActive");
  if (status === "pending") return game.i18n.localize("mtt.access.sessionPending");
  if (status === "validated") return game.i18n.localize("mtt.access.sessionValidated");
  if (status === "refused") return game.i18n.localize("mtt.access.sessionRefused");
  return game.i18n.localize("mtt.access.noSession");
}

export function formatAccessClientTooltip(client, { isEditable }) {
  const parts = [client.actorName, client.userName || client.sourceLabel, client.statusLabel].filter(Boolean);
  if (client.hasSession) parts.push(getAccessSessionTooltipLabel(client.sessionStatus));
  parts.push(
    game.i18n.localize(client.isAuthorized ? "mtt.access.leftClickOpenSession" : "mtt.access.leftClickAuthorize"),
  );
  if (isEditable) parts.push(game.i18n.localize("mtt.access.rightClickManage"));
  return parts.join(" - ");
}

export function getBestSessionForClient(actor, actorUuid) {
  const normalizedActorUuid = String(actorUuid ?? "").trim();
  if (!normalizedActorUuid) return null;

  const sessions = getSessions(actor)
    .filter((session) => session.actorUuid === normalizedActorUuid)
    .map((session) => normalizeSession(session));
  if (sessions.length === 0) return null;

  const statusOrder = ["active", "pending", "validated", "refused", "submitted"];
  sessions.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));
  return sessions[0];
}

export function prepareAccessClients(actor, { selectedSession, selectedClientActorUuid, isEditable }) {
  const clientsByUuid = new Map();

  getStoredAccessClients(actor).forEach((client) => {
    if (!client.actorUuid) return;
    clientsByUuid.set(client.actorUuid, client);
  });

  game.users.forEach((user) => {
    const userActor = user.character;
    if (!userActor?.uuid) return;

    const existing = clientsByUuid.get(userActor.uuid);
    const playerClient = buildAccessClientFromActor(userActor, {
      user,
      isAuthorized: existing?.isAuthorized ?? false,
      isFromPlayerCharacter: true,
    });

    clientsByUuid.set(userActor.uuid, {
      ...playerClient,
      ...existing,
      actorName: userActor.name ?? existing?.actorName ?? "",
      actorImg: userActor.img ?? existing?.actorImg ?? "",
      actorType: userActor.type ?? existing?.actorType ?? "",
      userId: user.id ?? existing?.userId ?? "",
      userName: user.name ?? existing?.userName ?? "",
      isFromPlayerCharacter: true,
    });
  });

  return Array.from(clientsByUuid.values())
    .map((client) => {
      const session = getBestSessionForClient(actor, client.actorUuid);
      const sessionStatus = session?.status ?? "";
      const hasCustomRates = Boolean(client.customRates);
      const preparedClient = {
        ...client,
        hasCustomRates,
        canShowCustomRates: Boolean(isEditable && hasCustomRates),
        customRatesTooltip: isEditable ? formatClientCustomRatesTooltip(client.customRates) : "",
        statusLabel: game.i18n.localize(client.isAuthorized ? "mtt.access.authorized" : "mtt.access.unauthorized"),
        sourceLabel: game.i18n.localize(
          client.isFromPlayerCharacter ? "mtt.access.playerCharacter" : "mtt.access.manualActor",
        ),
        hasSession: Boolean(session),
        sessionId: session?.id ?? "",
        sessionStatus,
        sessionLabel: session
          ? game.i18n.localize(`mtt.sessions.status.${sessionStatus}`)
          : game.i18n.localize("mtt.access.noSession"),
        sessionBadgeIcon: getAccessSessionBadgeIcon(sessionStatus),
        isSelected: Boolean(
          (session && selectedSession?.id === session.id) ||
          (!session && selectedClientActorUuid && client.actorUuid === selectedClientActorUuid),
        ),
      };
      preparedClient.tooltip = formatAccessClientTooltip(preparedClient, { isEditable });
      return preparedClient;
    })
    .sort((a, b) => a.actorName.localeCompare(b.actorName, undefined, { sensitivity: "base" }));
}

// ─── Check logic ──────────────────────────────────────────────────────────────

export function getConfiguredCurrency(currency) {
  const normalizedCurrency = normalizeCurrencyText(currency);
  if (!normalizedCurrency) return null;

  return (
    getCurrencies().find((entry) => {
      const candidates = [entry.id, entry.abbreviation, entry.name]
        .map((v) => normalizeCurrencyText(v))
        .filter(Boolean);

      return candidates.includes(normalizedCurrency);
    }) ?? null
  );
}

export function getMerchantWalletAmount(actor, currency) {
  const configuredCurrency = getConfiguredCurrency(currency);
  const walletKey = String(configuredCurrency?.id ?? currency ?? "").trim();
  if (!walletKey) return 0;

  const amount = Number(actor.system.wallet?.currencies?.[walletKey] ?? 0);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

export function getActorCurrencyAmount(actor, currency) {
  if (!currency?.actorPath) return null;
  try {
    const raw = foundry.utils.getProperty(actor, currency.actorPath);
    const amount = Number(raw);
    return Number.isFinite(amount) ? Math.max(0, amount) : null;
  } catch {
    return null;
  }
}

export function prepareBuyerFortune(actor) {
  if (!actor) return [];

  return getCurrencies()
    .map((currency) => {
      const abbreviation = String(currency.abbreviation ?? currency.name ?? currency.id ?? "").trim();
      if (!abbreviation) return null;

      return {
        value: getActorCurrencyAmount(actor, currency) ?? 0,
        abbreviation,
      };
    })
    .filter(Boolean);
}

export function buildCurrencyTransferPlan(merchantActor, clientActor, moneyAdjustments, currencies) {
  const result = {
    canExecute: false,
    errors: [],
    warnings: [],
    noTransferNeeded: false,
    payer: null,
    netDebtReference: 0,
    payerRemovals: [],
    receiverAdditions: [],
    changeRemovals: [],
    changeAdditions: [],
    hasChange: false,
  };

  if (!currencies.length) {
    result.errors.push(game.i18n.localize("mtt.sessions.errors.currencyConfigurationMissing"));
    return result;
  }

  const referenceCurrency =
    currencies.find((c) => Boolean(c.isDefault)) ??
    currencies.find((c) => Number(c.rate) === 1) ??
    currencies[0] ??
    null;

  if (!referenceCurrency) {
    result.errors.push(game.i18n.localize("mtt.sessions.errors.referenceCurrencyMissing"));
    return result;
  }

  let netDebtReference = 0;
  for (const adjustment of moneyAdjustments) {
    if (adjustment.currency === "__none") {
      result.warnings.push(game.i18n.localize("mtt.sessions.check.undefinedCurrency"));
      continue;
    }
    const adjustmentCurrencyObj = currencies.find((c) => {
      const candidates = [c.id, c.abbreviation, c.name].map((v) => normalizeCurrencyText(v)).filter(Boolean);
      return candidates.includes(normalizeCurrencyText(adjustment.currency));
    });
    if (!adjustmentCurrencyObj) {
      result.warnings.push(
        game.i18n.format("mtt.sessions.check.unknownCurrency", { currency: formatCurrencyLabel(adjustment.currency) }),
      );
      continue;
    }
    const rate = Number(adjustmentCurrencyObj.rate);
    const debtInRef = adjustment.amount * (Number.isFinite(rate) && rate > 0 ? rate : 1);
    if (adjustment.side === "seller") {
      netDebtReference += debtInRef;
    } else {
      netDebtReference -= debtInRef;
    }
  }

  const absDebt = Math.abs(netDebtReference);
  const roundedAbsDebt = roundToSmallestCurrencyUnit(absDebt, currencies);
  netDebtReference = netDebtReference < 0 ? -roundedAbsDebt : roundedAbsDebt;

  if (Math.abs(netDebtReference) < 0.0001) {
    result.noTransferNeeded = true;
    result.canExecute = true;
    return result;
  }

  const payerIsClient = netDebtReference > 0;
  result.payer = payerIsClient ? "client" : "merchant";
  result.netDebtReference = Math.abs(netDebtReference);

  const payerActor = payerIsClient ? clientActor : merchantActor;
  const receiverActor = payerIsClient ? merchantActor : clientActor;

  const currenciesSortedDesc = [...currencies].sort((a, b) => Number(b.rate) - Number(a.rate));

  const payerAmounts = {};
  for (const currency of currenciesSortedDesc) {
    const currId = String(currency.id ?? "").trim();
    if (!currId) continue;
    if (payerIsClient) {
      const amount = getActorCurrencyAmount(clientActor, currency);
      if (amount === null && currency.actorPath) {
        result.errors.push(
          game.i18n.format("mtt.sessions.errors.currencyPathUnreadable", {
            currency: formatCurrencyLabel(String(currency.abbreviation ?? currency.id ?? "").trim()),
            actor: payerActor.name,
          }),
        );
      }
      payerAmounts[currId] = amount ?? 0;
    } else {
      payerAmounts[currId] = getMerchantWalletAmount(merchantActor, currId);
    }
  }

  if (result.errors.length > 0) return result;

  const payerRemovals = [];
  let remaining = result.netDebtReference;

  for (const currency of currenciesSortedDesc) {
    if (remaining < 0.0001) break;
    const currId = String(currency.id ?? "").trim();
    if (!currId) continue;
    const rate = Number(currency.rate);
    if (!Number.isFinite(rate) || rate <= 0) continue;
    const available = payerAmounts[currId] ?? 0;
    if (available <= 0) continue;
    const use = Math.min(available, Math.floor(remaining / rate + 0.0001));
    if (use > 0) {
      payerRemovals.push({ currency, amount: use });
      remaining = Math.round((remaining - use * rate) * 10000) / 10000;
    }
  }

  if (remaining > 0.0001) {
    const currenciesSortedAsc = [...currenciesSortedDesc].reverse();
    let covered = false;

    for (const currency of currenciesSortedAsc) {
      const currId = String(currency.id ?? "").trim();
      if (!currId) continue;
      const rate = Number(currency.rate);
      if (!Number.isFinite(rate) || rate < remaining - 0.0001) continue;
      const available = payerAmounts[currId] ?? 0;
      const alreadyUsed = payerRemovals.find((r) => r.currency.id === currId)?.amount ?? 0;
      if (available - alreadyUsed < 1) continue;

      const existing = payerRemovals.find((r) => r.currency.id === currId);
      if (existing) {
        existing.amount += 1;
      } else {
        payerRemovals.push({ currency, amount: 1 });
      }

      const overpaid = Math.round((rate - remaining) * 10000) / 10000;
      remaining = 0;

      if (overpaid > 0.0001) {
        result.hasChange = true;
        const changeRemovals = [];
        let changeRemaining = overpaid;

        const receiverAmounts = {};
        for (const c of currenciesSortedDesc) {
          const cId = String(c.id ?? "").trim();
          if (!cId) continue;
          if (payerIsClient) {
            receiverAmounts[cId] = getMerchantWalletAmount(merchantActor, cId);
          } else {
            receiverAmounts[cId] = getActorCurrencyAmount(receiverActor, c) ?? 0;
          }
        }

        for (const c of currenciesSortedDesc) {
          if (changeRemaining < 0.0001) break;
          const cId = String(c.id ?? "").trim();
          if (!cId) continue;
          const r = Number(c.rate);
          if (!Number.isFinite(r) || r <= 0) continue;
          const avail = receiverAmounts[cId] ?? 0;
          if (avail <= 0) continue;
          const use2 = Math.min(avail, Math.floor(changeRemaining / r + 0.0001));
          if (use2 > 0) {
            changeRemovals.push({ currency: c, amount: use2 });
            changeRemaining = Math.round((changeRemaining - use2 * r) * 10000) / 10000;
          }
        }

        if (changeRemaining > 0.0001) {
          result.errors.push(
            game.i18n.format("mtt.sessions.errors.receiverCannotMakeChange", { actor: receiverActor.name }),
          );
          return result;
        }

        result.changeRemovals = changeRemovals;
        result.changeAdditions = changeRemovals.map((r) => ({ ...r }));
      }

      covered = true;
      break;
    }

    if (!covered) {
      result.errors.push(game.i18n.format("mtt.sessions.errors.payerInsufficientFunds", { actor: payerActor.name }));
      return result;
    }
  }

  result.payerRemovals = payerRemovals;
  result.receiverAdditions = payerRemovals.map((r) => ({ ...r }));
  result.canExecute = result.errors.length === 0;
  return result;
}

export async function applyCurrencyTransferPlan(merchantActor, clientActor, plan) {
  if (!plan?.canExecute || plan.noTransferNeeded) return;

  const payerIsClient = plan.payer === "client";
  const currencies = getCurrencies();
  const currencyById = new Map(currencies.map((c) => [String(c.id ?? "").trim(), c]));

  const clientDeltas = new Map();
  const merchantDeltas = new Map();

  function applyDelta(isClient, currencyId, delta) {
    const map = isClient ? clientDeltas : merchantDeltas;
    map.set(currencyId, (map.get(currencyId) ?? 0) + delta);
  }

  for (const { currency, amount } of plan.payerRemovals) {
    const currId = String(currency.id ?? "").trim();
    if (currId) applyDelta(payerIsClient, currId, -amount);
  }
  for (const { currency, amount } of plan.receiverAdditions) {
    const currId = String(currency.id ?? "").trim();
    if (currId) applyDelta(!payerIsClient, currId, +amount);
  }
  if (plan.hasChange) {
    for (const { currency, amount } of plan.changeRemovals) {
      const currId = String(currency.id ?? "").trim();
      if (currId) applyDelta(!payerIsClient, currId, -amount);
    }
    for (const { currency, amount } of plan.changeAdditions) {
      const currId = String(currency.id ?? "").trim();
      if (currId) applyDelta(payerIsClient, currId, +amount);
    }
  }

  const clientUpdate = {};
  for (const [currId, delta] of clientDeltas) {
    if (delta === 0) continue;
    const currency = currencyById.get(currId);
    if (!currency?.actorPath) continue;
    const current = Number(foundry.utils.getProperty(clientActor, currency.actorPath) ?? 0);
    const newAmount = Math.max(0, Number(((Number.isFinite(current) ? current : 0) + delta).toFixed(2)));
    foundry.utils.setProperty(clientUpdate, currency.actorPath, newAmount);
  }

  const merchantUpdate = {};
  for (const [currId, delta] of merchantDeltas) {
    if (delta === 0) continue;
    const current = getMerchantWalletAmount(merchantActor, currId);
    merchantUpdate[`system.wallet.currencies.${currId}`] = Math.max(0, Number((current + delta).toFixed(2)));
  }

  if (Object.keys(clientUpdate).length > 0) await clientActor.update(clientUpdate);
  if (Object.keys(merchantUpdate).length > 0) await merchantActor.update(merchantUpdate);
}

export function getProductCheckAvailableQuantity(actor, item) {
  const source = actor.items.get(item.sourceId);
  const product = source?.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};
  if (isUnlimitedQuantity(product.quantity)) return null;

  const productQuantity = normalizeFiniteQuantity(product.quantity);
  if (productQuantity !== null) return productQuantity;

  const sessionQuantity = Number(item.availableQuantity);
  return Number.isFinite(sessionQuantity) && sessionQuantity >= 0 ? sessionQuantity : null;
}

export function getServiceCheckAvailableQuantity(actor, item) {
  const service = actor.system.services?.entries?.find((entry) => entry.id === item.sourceId);
  if (isUnlimitedQuantity(service?.quantity)) return null;

  const serviceQuantity = normalizeFiniteQuantity(service?.quantity);
  if (serviceQuantity !== null) return serviceQuantity;

  const sessionQuantity = Number(item.availableQuantity);
  return Number.isFinite(sessionQuantity) && sessionQuantity >= 0 ? sessionQuantity : null;
}

export function checkLimitedSessionQuantity({ item, availableQuantity, result, messageId, messageKey, icon }) {
  if (availableQuantity === null || availableQuantity === undefined || availableQuantity === "") return;

  const requestedQuantity = Number(item.quantity);
  const normalizedAvailableQuantity = Number(availableQuantity);

  if (!Number.isFinite(requestedQuantity) || !Number.isFinite(normalizedAvailableQuantity)) return;
  if (requestedQuantity <= normalizedAvailableQuantity) return;

  result.errors.push(createCheckMessage("error", messageId, game.i18n.format(messageKey, { name: item.name }), icon));
}

export function checkSessionStatus(session, result) {
  if (session.status === "validated") {
    result.warnings.push(
      createCheckMessage(
        "warning",
        "already-validated",
        game.i18n.localize("mtt.sessions.check.alreadyValidated"),
        "fa-triangle-exclamation",
      ),
    );
  }

  if (session.status === "refused") {
    result.warnings.push(
      createCheckMessage(
        "warning",
        "already-refused",
        game.i18n.localize("mtt.sessions.check.alreadyRefused"),
        "fa-ban",
      ),
    );
  }
}

export function checkSessionBuyerItems(actor, session, result) {
  const buyerItems = session.buyerItems ?? [];
  if (buyerItems.length === 0) return;

  const errorCount = result.errors.length;

  buyerItems.forEach((item) => {
    if (item.type === "product") {
      const availableQuantity = getProductCheckAvailableQuantity(actor, item);
      checkLimitedSessionQuantity({
        item,
        availableQuantity,
        result,
        messageId: `product-stock-${item.id}`,
        messageKey: "mtt.sessions.check.productStockInsufficient",
        icon: "fa-box-open",
      });
    }

    if (item.type === "service") {
      const availableQuantity = getServiceCheckAvailableQuantity(actor, item);
      checkLimitedSessionQuantity({
        item,
        availableQuantity,
        result,
        messageId: `service-stock-${item.id}`,
        messageKey: "mtt.sessions.check.serviceQuantityInsufficient",
        icon: "fa-bell-concierge",
      });
    }
  });

  if (result.errors.length === errorCount) {
    result.infos.push(
      createCheckMessage("info", "stock-ok", game.i18n.localize("mtt.sessions.check.stockOk"), "fa-circle-check"),
    );
  }
}

export async function checkSessionSellerItems(actor, session, result) {
  const sellerItems = session.sellerItems ?? [];
  if (sellerItems.length === 0) return;

  const errorCount = result.errors.length;
  const warningCount = result.warnings.length;

  for (const item of sellerItems) {
    const sourceUuid = String(item.sourceUuid ?? "").trim();
    let source = null;

    if (sourceUuid) {
      try {
        source = await fromUuid(sourceUuid);
      } catch {
        source = null;
      }
    }

    if (!source || source.documentName !== "Item") {
      result.warnings.push(
        createCheckMessage(
          "warning",
          `seller-source-${item.id}`,
          game.i18n.format("mtt.sessions.check.sellerSourceMissing", { name: item.name }),
          "fa-link-slash",
        ),
      );
      continue;
    }

    const availableQuantity = getItemAvailableQuantity(source);
    checkLimitedSessionQuantity({
      item,
      availableQuantity,
      result,
      messageId: `seller-stock-${item.id}`,
      messageKey: "mtt.sessions.check.sellerQuantityInsufficient",
      icon: "fa-box-open",
    });
  }

  if (result.errors.length === errorCount && result.warnings.length === warningCount) {
    result.infos.push(
      createCheckMessage(
        "info",
        "seller-items-ok",
        game.i18n.localize("mtt.sessions.check.sellerItemsOk"),
        "fa-circle-check",
      ),
    );
  }
}

export function checkSessionMoneyAdjustments(actor, moneyAdjustments, result) {
  moneyAdjustments.forEach((adjustment) => {
    const currencyLabel = formatCurrencyLabel(adjustment.currency === "__none" ? "" : adjustment.currency);

    if (adjustment.currency === "__none") {
      result.warnings.push(
        createCheckMessage(
          "warning",
          `money-undefined-${adjustment.side}`,
          game.i18n.localize("mtt.sessions.check.undefinedCurrency"),
          "fa-coins",
        ),
      );
      return;
    }

    if (adjustment.side === "seller") {
      result.infos.push(
        createCheckMessage(
          "info",
          `player-must-pay-${adjustment.currency}`,
          game.i18n.format("mtt.sessions.check.playerMustPay", { amount: adjustment.amount, currency: currencyLabel }),
          "fa-coins",
        ),
      );
      return;
    }

    result.infos.push(
      createCheckMessage(
        "info",
        `merchant-must-return-${adjustment.currency}`,
        game.i18n.format("mtt.sessions.check.merchantMustReturn", {
          amount: adjustment.amount,
          currency: currencyLabel,
        }),
        "fa-coins",
      ),
    );

    const merchantAmount = getMerchantWalletAmount(actor, adjustment.currency);
    if (merchantAmount < adjustment.amount) {
      result.errors.push(
        createCheckMessage(
          "error",
          `merchant-currency-${adjustment.currency}`,
          game.i18n.format("mtt.sessions.check.merchantCurrencyInsufficient", { currency: currencyLabel }),
          "fa-coins",
        ),
      );
      return;
    }

    result.infos.push(
      createCheckMessage(
        "info",
        `merchant-change-ok-${adjustment.currency}`,
        game.i18n.localize("mtt.sessions.check.merchantChangeOk"),
        "fa-circle-check",
      ),
    );
  });
}

export function checkSessionCurrencies(actor, preparedSession, result) {
  const seen = new Set();
  const currencyKeys = [
    ...(preparedSession.buyerTotalByCurrency ?? []).map((total) => total.currency),
    ...(preparedSession.sellerTotalByCurrency ?? []).map((total) => total.currency),
    ...(preparedSession.moneyAdjustments ?? []).map((adjustment) => adjustment.currency),
  ];

  currencyKeys.forEach((currency) => {
    const currencyKey = normalizeCurrencyKey(currency === "__none" ? "" : currency);
    if (seen.has(currencyKey)) return;
    seen.add(currencyKey);

    if (currencyKey === "__none") {
      result.warnings.push(
        createCheckMessage(
          "warning",
          "currency-undefined",
          game.i18n.localize("mtt.sessions.check.undefinedCurrency"),
          "fa-coins",
        ),
      );
      return;
    }

    if (getConfiguredCurrency(currencyKey)) return;

    result.warnings.push(
      createCheckMessage(
        "warning",
        `currency-unknown-${currencyKey}`,
        game.i18n.format("mtt.sessions.check.unknownCurrency", { currency: formatCurrencyLabel(currencyKey) }),
        "fa-coins",
      ),
    );
  });
}

export async function checkSessionTransaction(actor, session, preparedSession) {
  const result = {
    checked: true,
    canProceed: false,
    infos: [],
    warnings: [],
    errors: [],
  };

  if (!session) {
    result.canProceed = false;
    return result;
  }

  checkSessionStatus(session, result);
  checkSessionBuyerItems(actor, session, result);
  await checkSessionSellerItems(actor, session, result);
  checkSessionMoneyAdjustments(actor, preparedSession.moneyAdjustments ?? [], result);
  checkSessionCurrencies(actor, preparedSession, result);

  result.canProceed = result.errors.length === 0;
  return result;
}

// ─── Seller drop protection ───────────────────────────────────────────────────

export function isMerchantSellerDropBlocked(payload, actorUuid) {
  if (!payload || typeof payload !== "object") return false;
  if (payload.type === "mtt.product" || payload.type === "mtt.service") return true;
  if (payload.actorUuid && String(payload.actorUuid) === String(actorUuid)) return true;
  return false;
}

// ─── Execution preview ────────────────────────────────────────────────────────

export async function buildExecutionPreview(actor, session) {
  const preview = {
    canExecute: false,
    errors: [],
    warnings: [],
    client: null,
    merchant: { id: actor.id, name: actor.name, img: actor.img },
    buyerDeliveries: [],
    actorDeliverySimulations: [],
    sellerDeliveries: [],
    merchantStockUpdates: [],
    clientItemUpdates: [],
    moneyTransfers: [],
    services: [],
  };

  if (!session) {
    preview.errors.push(game.i18n.localize("mtt.sessions.preview.emptySession"));
    return preview;
  }

  const buyerItems = session.buyerItems ?? [];
  const sellerItems = session.sellerItems ?? [];

  if (buyerItems.length === 0 && sellerItems.length === 0) {
    preview.errors.push(game.i18n.localize("mtt.sessions.preview.emptySession"));
    return preview;
  }

  const actorUuid = String(session.actorUuid ?? "").trim();
  if (!actorUuid) {
    preview.errors.push(game.i18n.localize("mtt.sessions.preview.clientMissing"));
    return preview;
  }

  let clientActor = null;
  try {
    clientActor = await fromUuid(actorUuid);
  } catch {
    // ignore
  }

  if (!clientActor || clientActor.documentName !== "Actor") {
    preview.errors.push(game.i18n.localize("mtt.sessions.preview.clientMissing"));
    return preview;
  }

  const storedClients = getStoredAccessClients(actor);
  const accessClient = storedClients.find((c) => c.actorUuid === actorUuid);
  if (!accessClient?.isAuthorized) {
    preview.errors.push(game.i18n.localize("mtt.sessions.preview.clientNotAuthorized"));
  }

  preview.client = {
    actorUuid,
    actorName: clientActor.name,
    actorImg: clientActor.img,
  };

  // Check buyer items (merchant → client)
  for (const item of buyerItems) {
    const totalPriceValue = Number((item.unitPriceValue * item.quantity).toFixed(2));
    const totalPriceLabel = formatPriceLabel(item.totalPriceValue ?? totalPriceValue, item.priceCurrency);
    const unitPriceLabel = formatPriceLabel(item.unitPriceValue, item.priceCurrency);

    if (item.type === "product") {
      const merchantItem = actor.items.get(item.sourceId);
      if (!merchantItem) {
        preview.errors.push(game.i18n.format("mtt.sessions.preview.merchantProductMissing", { name: item.name }));
        preview.buyerDeliveries.push({
          type: "product",
          id: item.id,
          name: item.name,
          img: item.img,
          quantity: item.quantity,
          unitPriceLabel,
          totalPriceLabel,
          sourceLabel: item.sourceLabel,
          missing: true,
        });
        continue;
      }

      const available = getProductCheckAvailableQuantity(actor, item);
      if (Number.isFinite(available) && available >= 0 && available < item.quantity) {
        preview.errors.push(game.i18n.format("mtt.sessions.preview.merchantStockInsufficient", { name: item.name }));
      }

      const product = merchantItem.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};
      const deliveryProductData = { ...product, id: merchantItem.id };
      const deliveredItemData = buildVisibleProductItemData(merchantItem, product, item.quantity);
      const deliverySimulation = simulatePurchasedItemDeliveryToActor(
        clientActor,
        deliveryProductData,
        deliveredItemData,
        item.quantity,
      );
      preview.actorDeliverySimulations.push(deliverySimulation);
      for (const error of deliverySimulation.errors) {
        if (!preview.errors.includes(error)) preview.errors.push(error);
      }
      for (const warning of deliverySimulation.warnings) {
        if (!preview.warnings.includes(warning)) preview.warnings.push(warning);
      }

      preview.buyerDeliveries.push({
        type: "product",
        id: item.id,
        name: item.name,
        img: item.img,
        quantity: item.quantity,
        unitPriceLabel,
        totalPriceLabel,
        sourceLabel: item.sourceLabel,
        missing: false,
        deliverySimulation,
      });
      if (Number.isFinite(available) && available >= 0) {
        preview.merchantStockUpdates.push({
          name: item.name,
          img: item.img,
          quantityToReduce: item.quantity,
          availableQuantity: available,
        });
      }
    } else if (item.type === "service") {
      const available = getServiceCheckAvailableQuantity(actor, item);
      if (Number.isFinite(available) && available >= 0 && available < item.quantity) {
        preview.errors.push(game.i18n.format("mtt.sessions.preview.merchantStockInsufficient", { name: item.name }));
      }

      preview.services.push({
        id: item.id,
        name: item.name,
        img: item.img,
        quantity: item.quantity,
        unitPriceLabel,
        totalPriceLabel,
        sourceLabel: item.sourceLabel,
      });
    }
  }

  // Check seller items (client → merchant)
  for (const item of sellerItems) {
    const totalPriceValue = Number((item.unitPriceValue * item.quantity).toFixed(2));
    const totalPriceLabel = formatPriceLabel(item.totalPriceValue ?? totalPriceValue, item.priceCurrency);
    const unitPriceLabel = formatPriceLabel(item.unitPriceValue, item.priceCurrency);
    const sourceUuid = String(item.sourceUuid ?? "").trim();

    if (!sourceUuid) {
      preview.sellerDeliveries.push({
        id: item.id,
        name: item.name,
        img: item.img,
        quantity: item.quantity,
        unitPriceLabel,
        totalPriceLabel,
        sourceLabel: item.sourceLabel,
        missing: false,
      });
      continue;
    }

    let sourceItem = null;
    try {
      sourceItem = await fromUuid(sourceUuid);
    } catch {
      // ignore
    }

    if (!sourceItem || sourceItem.documentName !== "Item") {
      preview.errors.push(game.i18n.format("mtt.sessions.preview.sellerItemMissing", { name: item.name }));
      preview.sellerDeliveries.push({
        id: item.id,
        name: item.name,
        img: item.img,
        quantity: item.quantity,
        unitPriceLabel,
        totalPriceLabel,
        sourceLabel: item.sourceLabel,
        missing: true,
      });
      continue;
    }

    const available = getItemAvailableQuantity(sourceItem);
    if (Number.isFinite(available) && available >= 0 && available < item.quantity) {
      preview.errors.push(game.i18n.format("mtt.sessions.preview.sellerQuantityInsufficient", { name: item.name }));
    }

    preview.sellerDeliveries.push({
      id: item.id,
      name: item.name,
      img: item.img,
      quantity: item.quantity,
      unitPriceLabel,
      totalPriceLabel,
      sourceLabel: item.sourceLabel,
      missing: false,
    });
    preview.clientItemUpdates.push({
      name: item.name,
      img: item.img,
      quantityToReduce: item.quantity,
      availableQuantity: available,
    });
  }

  // Check money adjustments
  const buyerTotals = prepareSessionTotals(
    buyerItems.map((item) => {
      const copy = { ...item };
      recalculateSessionItemTotal(copy);
      return copy;
    }),
  );
  const sellerTotals = prepareSessionTotals(
    sellerItems.map((item) => {
      const copy = { ...item };
      recalculateSessionItemTotal(copy);
      return copy;
    }),
  );
  const adjustments = prepareMoneyAdjustments(buyerTotals, sellerTotals);

  const currencies = getCurrencies();
  const currencyTransferPlan =
    clientActor && currencies.length > 0
      ? buildCurrencyTransferPlan(actor, clientActor, adjustments, currencies)
      : null;

  preview.currencyTransferPlan = currencyTransferPlan ?? null;
  preview.moneyTransfers = [];

  if (currencyTransferPlan) {
    for (const err of currencyTransferPlan.errors ?? []) {
      if (!preview.errors.includes(err)) preview.errors.push(err);
    }
    for (const warn of currencyTransferPlan.warnings ?? []) {
      if (!preview.warnings.includes(warn)) preview.warnings.push(warn);
    }

    if (!currencyTransferPlan.noTransferNeeded) {
      const payerName = currencyTransferPlan.payer === "client" ? (preview.client?.actorName ?? "") : actor.name;
      const receiverName = currencyTransferPlan.payer === "client" ? actor.name : (preview.client?.actorName ?? "");

      for (const { currency, amount } of currencyTransferPlan.payerRemovals) {
        const abbr = String(currency.abbreviation ?? currency.id ?? "").trim();
        preview.moneyTransfers.push({
          currencyLabel: abbr,
          amountLabel: formatPriceLabel(amount, abbr),
          payer: payerName,
          receiver: receiverName,
          hasEnough: true,
          unknownCurrency: false,
          isChange: false,
        });
      }

      for (const { currency, amount } of currencyTransferPlan.changeRemovals ?? []) {
        const abbr = String(currency.abbreviation ?? currency.id ?? "").trim();
        preview.moneyTransfers.push({
          currencyLabel: abbr,
          amountLabel: formatPriceLabel(amount, abbr),
          payer: receiverName,
          receiver: payerName,
          hasEnough: true,
          unknownCurrency: false,
          isChange: true,
        });
      }
    }
  } else if (adjustments.length > 0) {
    for (const adjustment of adjustments) {
      const adjustmentCurrency = adjustment.currency === "__none" ? "" : adjustment.currency;
      preview.moneyTransfers.push({
        currencyLabel: formatCurrencyLabel(adjustmentCurrency),
        amountLabel: adjustment.amountLabel,
        payer: adjustment.side === "seller" ? (preview.client?.actorName ?? "") : actor.name,
        receiver: adjustment.side === "seller" ? actor.name : (preview.client?.actorName ?? ""),
        hasEnough: false,
        unknownCurrency: true,
        isChange: false,
      });
    }
  }

  preview.canExecute = preview.errors.length === 0;
  return preview;
}

// ─── Real item execution ─────────────────────────────────────────────────────

function getQuantityPathForItem(item) {
  const configuredPath = String(game.settings.get(MTT.ID, "itemQuantityPath") ?? "").trim();
  if (configuredPath && parseQuantityValue(foundry.utils.getProperty(item, configuredPath)) !== null)
    return configuredPath;

  const candidates = ["system.quantity.value", "system.qty", "system.stack.quantity", "system.quantity"];

  return candidates.find((path) => parseQuantityValue(foundry.utils.getProperty(item, path)) !== null) ?? "";
}

function setItemDataQuantity(itemData, quantity, sourceItem = null) {
  const configuredPath = String(game.settings.get(MTT.ID, "itemQuantityPath") ?? "").trim();
  const candidatePaths = [
    configuredPath,
    "system.quantity.value",
    "system.qty",
    "system.stack.quantity",
    "system.quantity",
  ].filter(Boolean);

  const targetPath =
    candidatePaths.find(
      (path) => parseQuantityValue(foundry.utils.getProperty(sourceItem ?? itemData, path)) !== null,
    ) ??
    candidatePaths[0] ??
    "";

  if (!targetPath) return;
  foundry.utils.setProperty(itemData, targetPath, quantity);
}

function catalogEntryHasSecretData(entry = {}) {
  return productHasSecretInfo(entry);
}

function formatDeliveryTransactionNumber(transactionNumber) {
  const number = Number(transactionNumber);
  if (!Number.isFinite(number) || number <= 0) return "";

  return String(Math.floor(number));
}

function buildDeliveredItemOriginHtml(productData = {}) {
  const merchantName = String(productData.merchantName ?? "").trim();
  if (!merchantName) return "";

  const transactionNumber = formatDeliveryTransactionNumber(productData.transactionNumber);
  const originText = transactionNumber
    ? game.i18n.format("mtt.delivery.originWithTransaction", {
        merchantName,
        transactionNumber,
      })
    : game.i18n.format("mtt.delivery.origin", { merchantName });

  return `<p class="mtt-delivery-origin">${escapeHTML(originText)}</p>`;
}

function buildDeliveredItemSecretHtml(productData = {}) {
  if (!catalogEntryHasSecretData(productData)) return "";

  const lines = [];
  if (hasSecretValue(productData.secretName)) {
    lines.push(
      game.i18n.format("mtt.delivery.secretName", {
        value: String(productData.secretName ?? "").trim(),
      }),
    );
  }

  if (hasSecretValue(productData.secretPrice) || hasSecretValue(productData.secretCurrency)) {
    const formattedPrice = hasSecretValue(productData.secretPrice)
      ? formatPriceLabel(productData.secretPrice, productData.secretCurrency)
      : "";
    const priceLabel =
      formattedPrice ||
      [productData.secretPrice, productData.secretCurrency]
        .map((part) => String(part ?? "").trim())
        .filter(Boolean)
        .join(" ");
    if (priceLabel) {
      lines.push(game.i18n.format("mtt.delivery.secretPrice", { value: priceLabel }));
    }
  }

  if (hasSecretValue(productData.secretDescription)) {
    lines.push(
      game.i18n.format("mtt.delivery.secretDescription", {
        value: String(productData.secretDescription ?? "").trim(),
      }),
    );
  }

  if (lines.length === 0) return "";

  const paragraphs = lines
    .map((line) => `<p>${escapeHTML(line).replace(/\r?\n/g, "<br>")}</p>`)
    .join("");

  return `<section class="secret"><h4>${escapeHTML(game.i18n.localize("mtt.delivery.secretTitle"))}</h4>${paragraphs}</section>`;
}

function addDeliveredItemDescriptionBlock(itemData, productData = {}) {
  if (!getModuleSetting("writeDeliveryDescriptionInfo")) return;

  const visiblePath = String(getModuleSetting("itemDescriptionPath") ?? "").trim();
  if (!visiblePath) return;

  const secretPath = String(getModuleSetting("itemSecretDescriptionPath") ?? "").trim();

  const originHtml = buildDeliveredItemOriginHtml(productData);
  const secretHtml = buildDeliveredItemSecretHtml(productData);
  if (!originHtml && !secretHtml) return;

  const originalVisible = String(foundry.utils.getProperty(itemData, visiblePath) ?? "");

  if (!secretPath || secretPath === visiblePath) {
    // Cas C (secret vide) : origin seulement dans le champ visible
    // Cas A (même chemin) : origin + bloc secret + original dans le même champ
    const parts = secretPath === visiblePath
      ? [originHtml, secretHtml, originalVisible]
      : [originHtml, originalVisible];
    foundry.utils.setProperty(itemData, visiblePath, parts.filter(Boolean).join("\n"));
  } else {
    // Cas B : chemins distincts
    foundry.utils.setProperty(
      itemData,
      visiblePath,
      [originHtml, originalVisible].filter(Boolean).join("\n"),
    );
    if (secretHtml) {
      const originalSecret = String(foundry.utils.getProperty(itemData, secretPath) ?? "");
      foundry.utils.setProperty(
        itemData,
        secretPath,
        [secretHtml, originalSecret].filter(Boolean).join("\n"),
      );
    }
  }
}

function buildVisibleProductItemData(sourceItem, product, quantity) {
  const itemData = sourceItem.toObject();
  delete itemData._id;
  delete itemData.uuid;

  if (product.displayName) itemData.name = product.displayName;
  if (product.img) itemData.img = product.img;

  if (itemData.flags?.[MTT.ID]) delete itemData.flags[MTT.ID];
  foundry.utils.setProperty(itemData, `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}`, {
    sourceUuid: getMttSourceUuid(sourceItem, product),
    isCommerciallyModified: Boolean(product.isCommerciallyModified) || productHasSecretInfo(product),
  });
  setItemDataQuantity(itemData, quantity, sourceItem);

  return itemData;
}

function getDeliveryQuantityPath(itemData, config) {
  return config.quantityPath || getQuantityPathForItem(itemData);
}

function createDeliveryResult({ actor = null, productData = {}, quantityToDeliver = 0 } = {}) {
  const requestedQuantity = Number(quantityToDeliver);

  return {
    ok: false,
    actor,
    productId: productData.id ?? "",
    sourceUuid: getMttSourceUuid(null, productData),
    requestedQuantity: Number.isFinite(requestedQuantity) ? requestedQuantity : 0,
    deliveredQuantity: 0,
    updated: [],
    created: [],
    warnings: [],
    errors: [],
  };
}

export function simulatePurchasedItemDeliveryToActor(actor, productData, deliveredItemData, quantityToDeliver) {
  const result = createDeliveryResult({ actor, productData, quantityToDeliver });
  const requestedQuantity = Number(quantityToDeliver);

  if (!actor) {
    result.errors.push(game.i18n.localize("mtt.sessions.errors.deliveryActorMissing"));
    return result;
  }

  if (!deliveredItemData || typeof deliveredItemData !== "object") {
    result.errors.push(game.i18n.localize("mtt.sessions.errors.deliveryItemDataMissing"));
    return result;
  }

  if (!Number.isFinite(requestedQuantity) || !Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
    result.errors.push(game.i18n.localize("mtt.sessions.errors.deliveryQuantityInvalid"));
    return result;
  }

  const config = getDeliveryStackingConfig();
  const quantityPath = getDeliveryQuantityPath(deliveredItemData, config);
  if (!quantityPath) {
    result.errors.push(game.i18n.localize("mtt.sessions.errors.deliveryQuantityPathMissing"));
    return result;
  }

  let remaining = normalizeItemQuantity(requestedQuantity, 0);

  const compatibleItems = actor.items
    .map((item) => ({
      item,
      mergeMode: getDeliveredItemMergeMode(item, deliveredItemData, productData),
    }))
    .filter(({ mergeMode }) => Boolean(mergeMode));

  for (const { item, mergeMode } of compatibleItems) {
    if (remaining <= 0) break;

    const currentQuantity = normalizeItemQuantity(getConfiguredItemQuantity(item, quantityPath), 0);
    const maxQuantity = normalizeMaxQuantity(getConfiguredItemMaxQuantity(item, config.maxQuantityPath));
    const availableSpace = getAvailableStackSpace(currentQuantity, maxQuantity);
    if (availableSpace <= 0) continue;

    const quantityToAdd = maxQuantity === Infinity ? remaining : Math.min(remaining, availableSpace);
    const quantity = currentQuantity + quantityToAdd;
    if (quantityToAdd <= 0) continue;

    result.updated.push({
      item,
      itemId: item.id ?? "",
      name: item.name ?? deliveredItemData.name ?? "",
      beforeQuantity: currentQuantity,
      addedQuantity: quantityToAdd,
      afterQuantity: quantity,
      mergeMode,
    });
    remaining -= quantityToAdd;
  }

  const maxQuantity = normalizeMaxQuantity(
    getConfiguredItemMaxQuantity(deliveredItemData, config.maxQuantityPath),
  );

  while (remaining > 0) {
    const quantity = maxQuantity === Infinity ? remaining : Math.min(remaining, maxQuantity);
    if (quantity <= 0) break;

    result.created.push({
      name: deliveredItemData.name ?? "",
      quantity,
      mergeMode: "none",
    });
    remaining -= quantity;
  }

  result.ok = remaining === 0;
  result.deliveredQuantity = result.ok ? requestedQuantity : requestedQuantity - remaining;
  if (!result.ok) result.errors.push(game.i18n.localize("mtt.sessions.errors.deliveryIncomplete"));

  return result;
}

export async function deliverPurchasedItemToActor(actor, productData, deliveredItemData, quantityToDeliver) {
  const simulation = simulatePurchasedItemDeliveryToActor(actor, productData, deliveredItemData, quantityToDeliver);
  if (!simulation.ok) return simulation;

  const config = getDeliveryStackingConfig();
  const quantityPath = getDeliveryQuantityPath(deliveredItemData, config);
  const result = {
    ...simulation,
    deliveredQuantity: 0,
    updated: [],
    created: [],
  };

  try {
    for (const stack of simulation.updated) {
      const updateData = { [quantityPath]: stack.afterQuantity };
      const productFlagPath = `flags.${MTT.ID}.${MTT.FLAGS.PRODUCT}`;
      const deliveredProductFlags = foundry.utils.getProperty(deliveredItemData, productFlagPath) ?? {};
      const existingProductFlags = stack.item.getFlag?.(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};
      updateData[productFlagPath] = {
        ...deliveredProductFlags,
        ...existingProductFlags,
        sourceUuid:
          getMttSourceUuid(stack.item) ||
          getMttSourceUuid(deliveredItemData, productData),
        isCommerciallyModified: false,
      };
      await stack.item.update(updateData);
      result.updated.push(stack);
      result.deliveredQuantity += stack.addedQuantity;
    }

    for (const stack of simulation.created) {
      const itemData = foundry.utils.deepClone(deliveredItemData);
      foundry.utils.setProperty(itemData, quantityPath, stack.quantity);
      addDeliveredItemDescriptionBlock(itemData, productData);
      const documents = await actor.createEmbeddedDocuments("Item", [itemData]);
      const item = documents[0];
      if (!item) throw new Error(game.i18n.localize("mtt.sessions.errors.deliveryCreationFailed"));

      result.created.push({
        item,
        itemId: item.id ?? "",
        name: item.name ?? stack.name,
        quantity: stack.quantity,
        mergeMode: "none",
      });
      result.deliveredQuantity += stack.quantity;
    }
  } catch (error) {
    result.ok = false;
    result.errors.push(error?.message || game.i18n.localize("mtt.sessions.errors.deliveryFailed"));
  }

  return result;
}

function buildMerchantReceivedItemData(sourceItem, quantity, options = {}) {
  const itemData = prepareMerchantCatalogItemData(sourceItem, {
    sourceUuid: sourceItem.uuid ?? "",
    automaticCategory: options.automaticCategory ?? null,
    categoryValue: options.categoryValue ?? "",
    quantity,
  });
  setItemDataQuantity(itemData, quantity, sourceItem);

  return itemData;
}

function getSourceActorUuid(item) {
  return item?.parent?.documentName === "Actor" ? item.parent.uuid : "";
}

async function getClientActor(session, errors) {
  const actorUuid = String(session?.actorUuid ?? "").trim();
  if (!actorUuid) {
    errors.push(game.i18n.localize("mtt.sessions.errors.clientMissing"));
    return null;
  }

  try {
    const actor = await fromUuid(actorUuid);
    if (actor?.documentName === "Actor") return actor;
  } catch {
    // ignore
  }

  errors.push(game.i18n.localize("mtt.sessions.errors.clientMissing"));
  return null;
}

export async function buildSessionItemExecutionPlan(actor, session, options = {}) {
  const preview = await buildExecutionPreview(actor, session);
  const errors = [...(preview.errors ?? [])];
  const clientActor = await getClientActor(session, errors);
  const operations = {
    productTransfers: [],
    serviceTransfers: [],
    sellerTransfers: [],
  };
  const deliveryPlans = [];
  const reservedMerchantQuantities = new Map();
  const reservedServiceQuantities = new Map();

  if (!session || ((session.buyerItems ?? []).length === 0 && (session.sellerItems ?? []).length === 0)) {
    if (!errors.includes(game.i18n.localize("mtt.sessions.errors.emptySession"))) {
      errors.push(game.i18n.localize("mtt.sessions.errors.emptySession"));
    }
  }

  const accessClient = getStoredAccessClients(actor).find((client) => client.actorUuid === session?.actorUuid);
  if (!accessClient?.isAuthorized) {
    errors.push(game.i18n.localize("mtt.sessions.errors.clientNotAuthorized"));
  }

  if (preview.currencyTransferPlan && !preview.currencyTransferPlan.canExecute) {
    for (const err of preview.currencyTransferPlan.errors ?? []) {
      if (!errors.includes(err)) errors.push(err);
    }
  }

  if ((session?.negotiations ?? []).some((negotiation) => negotiation.status === "active")) {
    errors.push(game.i18n.localize("mtt.sessions.errors.activeNegotiation"));
  }

  for (const item of session?.buyerItems ?? []) {
    if (item.type !== "product") continue;

    const merchantItem = actor.items.get(item.sourceId);
    if (!merchantItem) {
      errors.push(game.i18n.format("mtt.sessions.errors.merchantProductMissing", { name: item.name }));
      continue;
    }

    const product = merchantItem.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};
    const availableQuantity = normalizeFiniteQuantity(product.quantity);
    const hasLimitedQuantity = !isUnlimitedQuantity(product.quantity);
    const requestedQuantity = Number(item.quantity);
    const reservedQuantity = reservedMerchantQuantities.get(merchantItem.id) ?? 0;
    const totalRequestedQuantity = reservedQuantity + requestedQuantity;

    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      errors.push(game.i18n.format("mtt.sessions.errors.merchantStockInsufficient", { name: item.name }));
      continue;
    }

    if (hasLimitedQuantity && (availableQuantity === null || availableQuantity < totalRequestedQuantity)) {
      errors.push(game.i18n.format("mtt.sessions.errors.merchantStockInsufficient", { name: item.name }));
      continue;
    }

    reservedMerchantQuantities.set(merchantItem.id, totalRequestedQuantity);

    const deliveryProductData = {
      ...product,
      id: merchantItem.id,
      merchantName: actor?.name ?? "",
      transactionNumber: options.transactionNumber,
    };
    const deliveredItemData = buildVisibleProductItemData(merchantItem, product, requestedQuantity);
    const deliveryPlan = simulatePurchasedItemDeliveryToActor(
      clientActor,
      deliveryProductData,
      deliveredItemData,
      requestedQuantity,
    );
    deliveryPlans.push(deliveryPlan);
    if (!deliveryPlan.ok) {
      errors.push(...deliveryPlan.errors);
      continue;
    }

    operations.productTransfers.push({
      sessionItem: item,
      merchantItem,
      product,
      deliveryProductData,
      deliveredItemData,
      deliveryPlan,
      quantity: requestedQuantity,
      nextQuantity: hasLimitedQuantity ? Number((availableQuantity - totalRequestedQuantity).toFixed(2)) : null,
      hasLimitedQuantity,
    });
  }

  for (const item of session?.buyerItems ?? []) {
    if (item.type !== "service") continue;

    const service = actor.system.services?.entries?.find((entry) => entry.id === item.sourceId);
    if (!service) {
      errors.push(game.i18n.format("mtt.sessions.errors.merchantServiceMissing", { name: item.name }));
      continue;
    }

    const availableQuantity = normalizeFiniteQuantity(service.quantity);
    const hasLimitedQuantity = !isUnlimitedQuantity(service.quantity);
    const requestedQuantity = Number(item.quantity);
    const unitPriceValue = Number(item.unitPriceValue);
    const reservedQuantity = reservedServiceQuantities.get(service.id) ?? 0;
    const totalRequestedQuantity = reservedQuantity + requestedQuantity;

    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      errors.push(game.i18n.format("mtt.sessions.errors.serviceQuantityInsufficient", { name: item.name }));
      continue;
    }

    if (isFreePriceService(service) && (!item.isFreePrice || !Number.isFinite(unitPriceValue) || unitPriceValue <= 0)) {
      errors.push(game.i18n.format("mtt.sessions.errors.serviceFreePriceInvalid", { name: item.name }));
      continue;
    }

    if (hasLimitedQuantity && (availableQuantity === null || availableQuantity < totalRequestedQuantity)) {
      errors.push(game.i18n.format("mtt.sessions.errors.serviceQuantityInsufficient", { name: item.name }));
      continue;
    }

    reservedServiceQuantities.set(service.id, totalRequestedQuantity);
    operations.serviceTransfers.push({
      sessionItem: item,
      service,
      quantity: requestedQuantity,
      stockBefore: hasLimitedQuantity ? Number((availableQuantity - reservedQuantity).toFixed(2)) : null,
      stockAfter: hasLimitedQuantity ? Number((availableQuantity - totalRequestedQuantity).toFixed(2)) : null,
      hasLimitedQuantity,
    });
  }

  for (const item of session?.sellerItems ?? []) {
    const sourceUuid = String(item.sourceUuid ?? "").trim();
    let sourceItem = null;

    if (sourceUuid) {
      try {
        sourceItem = await fromUuid(sourceUuid);
      } catch {
        sourceItem = null;
      }
    }

    if (!sourceItem || sourceItem.documentName !== "Item") {
      errors.push(game.i18n.format("mtt.sessions.errors.sellerItemMissing", { name: item.name }));
      continue;
    }

    if (clientActor && getSourceActorUuid(sourceItem) !== clientActor.uuid) {
      errors.push(game.i18n.format("mtt.sessions.errors.sellerItemMissing", { name: item.name }));
      continue;
    }

    const availableQuantity = getItemAvailableQuantity(sourceItem);
    const requestedQuantity = Number(item.quantity);

    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      errors.push(game.i18n.format("mtt.sessions.errors.sellerQuantityInsufficient", { name: item.name }));
      continue;
    }

    if (Number.isFinite(availableQuantity) && availableQuantity >= 0 && availableQuantity < requestedQuantity) {
      errors.push(game.i18n.format("mtt.sessions.errors.sellerQuantityInsufficient", { name: item.name }));
      continue;
    }

    const quantityPath = getQuantityPathForItem(sourceItem);
    if (!quantityPath) {
      errors.push(game.i18n.format("mtt.sessions.errors.sellerQuantityInsufficient", { name: item.name }));
      continue;
    }

    operations.sellerTransfers.push({
      sessionItem: item,
      sourceItem,
      quantityPath,
      quantity: requestedQuantity,
      nextQuantity: Number((availableQuantity - requestedQuantity).toFixed(2)),
    });
  }

  return {
    ...preview,
    canExecute: errors.length === 0,
    errors: Array.from(new Set(errors)),
    clientActor,
    deliveryPlans,
    operations,
  };
}

export async function executeSessionItemTransfers(actor, plan) {
  const clientActor = plan.clientActor;
  if (!clientActor) throw new Error(game.i18n.localize("mtt.sessions.errors.clientMissing"));

  const deliveries = [];
  const executionResult = {
    ok: false,
    deliveries,
    delivered: deliveries,
    merchantStockUpdates: [],
    services: [],
    warnings: [],
    errors: [],
  };

  const deliveryPreflightPlans = plan.operations.productTransfers.map((transfer) =>
    simulatePurchasedItemDeliveryToActor(
      clientActor,
      transfer.deliveryProductData,
      transfer.deliveredItemData,
      transfer.quantity,
    ),
  );
  const deliveryPreflightErrors = deliveryPreflightPlans.flatMap((deliveryPlan) => deliveryPlan.errors);
  if (deliveryPreflightErrors.length > 0) {
    executionResult.errors.push(...deliveryPreflightErrors);
    throw new Error(deliveryPreflightErrors.join(" "));
  }

  for (const transfer of plan.operations.productTransfers) {
    const delivery = await deliverPurchasedItemToActor(
      clientActor,
      transfer.deliveryProductData,
      transfer.deliveredItemData,
      transfer.quantity,
    );
    if (!delivery.ok) throw new Error(delivery.errors.join(" "));
    if (delivery.deliveredQuantity !== transfer.quantity) {
      throw new Error(game.i18n.localize("mtt.sessions.errors.deliveryQuantityMismatch"));
    }

    executionResult.deliveries.push(delivery);

    if (transfer.hasLimitedQuantity) {
      await transfer.merchantItem.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, {
        ...transfer.product,
        quantity: transfer.nextQuantity,
      });
    }

    executionResult.merchantStockUpdates.push({
      itemId: transfer.merchantItem.id,
      name: transfer.merchantItem.name,
      purchasedQuantity: transfer.quantity,
      remainingQuantity: transfer.nextQuantity,
      hasLimitedQuantity: transfer.hasLimitedQuantity,
    });
  }

  if (plan.operations.serviceTransfers.length > 0) {
    const services = foundry.utils.deepClone(actor.system.services?.entries ?? []);

    for (const transfer of plan.operations.serviceTransfers) {
      const service = services.find((entry) => entry.id === transfer.service.id);
      if (!service) {
        throw new Error(game.i18n.format("mtt.sessions.errors.merchantServiceMissing", { name: transfer.sessionItem.name }));
      }

      if (transfer.hasLimitedQuantity) service.quantity = transfer.stockAfter;

      // TODO MTT services secrets:
      // Add an owner-only / GM-only secret description block for services.
      // This block must later be copied into the merchant transaction journal.
      executionResult.services.push({
        serviceId: service.id,
        name: transfer.sessionItem.name,
        quantity: transfer.quantity,
        unitPriceValue: transfer.sessionItem.unitPriceValue,
        proposedUnitPriceValue: transfer.sessionItem.proposedUnitPriceValue,
        acceptedUnitPriceValue: transfer.sessionItem.unitPriceValue,
        totalPriceValue: transfer.sessionItem.totalPriceValue,
        currency: transfer.sessionItem.priceCurrency,
        isFreePrice: Boolean(transfer.sessionItem.isFreePrice),
        stockBefore: transfer.stockBefore,
        stockAfter: transfer.stockAfter,
        buyer: clientActor.uuid,
        merchant: actor.uuid,
        status: "validated",
      });
    }

    await actor.update({
      "system.services.entries": services,
    });
  }

  for (const transfer of plan.operations.sellerTransfers) {
    const automaticCategory = getAutomaticItemCategory(transfer.sourceItem);
    const categoryValue = await getOrCreateAutomaticProductCategory(actor, automaticCategory);
    const sourceUuid = String(transfer.sourceItem.uuid ?? "").trim();
    const existingMerchantItem = findMergeableMerchantItemBySourceUuid(actor, sourceUuid);

    if (existingMerchantItem) {
      const product = existingMerchantItem.getFlag(MTT.ID, MTT.FLAGS.PRODUCT) ?? {};
      const currentQuantity = Number.isFinite(Number(product.quantity))
        ? Number(product.quantity)
        : MTT.PRODUCT_DEFAULTS.quantity;
      await existingMerchantItem.setFlag(MTT.ID, MTT.FLAGS.PRODUCT, {
        ...product,
        quantity: Number((currentQuantity + transfer.quantity).toFixed(2)),
      });
    } else {
      const itemData = buildMerchantReceivedItemData(transfer.sourceItem, transfer.quantity, {
        automaticCategory,
        categoryValue,
      });
      // Seller transfer: this creates merchant catalogue stock, not a purchased Item on the client actor.
      await actor.createEmbeddedDocuments("Item", [itemData]);
    }

    await transfer.sourceItem.update({
      [transfer.quantityPath]: transfer.nextQuantity,
    });
  }

  executionResult.ok = true;
  return executionResult;
}

export function clearSessionAfterExecution(session) {
  session.buyerItems = [];
  session.sellerItems = [];
  session.negotiations = [];
  session.status = "active";
  session.isSubmitted = false;
  session.updatedAt = new Date().toISOString();
  return session;
}
