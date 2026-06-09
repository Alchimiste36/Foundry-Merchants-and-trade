const fields = foundry.data.fields;

export class MerchantData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const sessionItemSchema = () =>
      new fields.SchemaField({
        id: new fields.StringField({
          required: true,
          blank: false,
          initial: "",
        }),
        type: new fields.StringField({
          required: true,
          blank: false,
          initial: "product",
          choices: ["product", "service", "item"],
        }),
        sourceUuid: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        sourceActorUuid: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        sourceId: new fields.StringField({
          required: true,
          blank: false,
          initial: "",
        }),
        name: new fields.StringField({
          required: true,
          blank: false,
          initial: "",
        }),
        img: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        quantity: new fields.NumberField({
          required: true,
          initial: 1,
          min: 0,
        }),
        availableQuantity: new fields.NumberField({
          required: false,
          nullable: true,
          initial: null,
          min: 0,
        }),
        hasLimitedQuantity: new fields.BooleanField({
          required: true,
          initial: false,
        }),
        unitPriceValue: new fields.NumberField({
          required: true,
          initial: 0,
          min: 0,
        }),
        priceCurrency: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        totalPriceValue: new fields.NumberField({
          required: true,
          initial: 0,
          min: 0,
        }),
        sourceLabel: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        proposedUnitPriceValue: new fields.NumberField({
          required: false,
          nullable: true,
          initial: null,
          min: 0,
        }),
        isFreePrice: new fields.BooleanField({
          required: true,
          initial: false,
        }),
        minimumPriceValue: new fields.NumberField({
          required: false,
          nullable: true,
          initial: null,
          min: 0,
        }),
        isFromActor: new fields.BooleanField({
          required: true,
          initial: false,
        }),
      });

    const negotiationOfferSchema = () =>
      new fields.SchemaField({
        id: new fields.StringField({
          required: true,
          blank: false,
          initial: "",
        }),
        side: new fields.StringField({
          required: true,
          blank: false,
          initial: "buyer",
          choices: ["buyer", "merchant"],
        }),
        quantity: new fields.NumberField({
          required: true,
          initial: 1,
          min: 0,
        }),
        unitPriceValue: new fields.NumberField({
          required: true,
          initial: 0,
          min: 0,
        }),
        totalPriceValue: new fields.NumberField({
          required: true,
          initial: 0,
          min: 0,
        }),
        percentOfReference: new fields.NumberField({
          required: true,
          initial: 100,
          min: 0,
        }),
        status: new fields.StringField({
          required: true,
          blank: false,
          initial: "submitted",
          choices: ["draft", "submitted"],
        }),
        createdAt: new fields.StringField({
          required: true,
          blank: false,
          initial: "",
        }),
      });

    const sessionNegotiationSchema = () =>
      new fields.SchemaField({
        id: new fields.StringField({
          required: true,
          blank: false,
          initial: "",
        }),
        side: new fields.StringField({
          required: true,
          blank: false,
          initial: "buyer",
          choices: ["buyer", "seller"],
        }),
        type: new fields.StringField({
          required: true,
          blank: false,
          initial: "product",
          choices: ["product", "service", "item"],
        }),
        sourceId: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        sourceUuid: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        sourceActorUuid: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        name: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        img: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        priceCurrency: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        referenceUnitPriceValue: new fields.NumberField({
          required: true,
          initial: 0,
          min: 0,
        }),
        proposedUnitPriceValue: new fields.NumberField({
          required: false,
          nullable: true,
          initial: null,
          min: 0,
        }),
        isFreePrice: new fields.BooleanField({
          required: true,
          initial: false,
        }),
        minimumPriceValue: new fields.NumberField({
          required: false,
          nullable: true,
          initial: null,
          min: 0,
        }),
        status: new fields.StringField({
          required: true,
          blank: false,
          initial: "active",
          choices: ["active", "accepted", "refused"],
        }),
        currentTurn: new fields.StringField({
          required: true,
          blank: false,
          initial: "merchant",
          choices: ["buyer", "merchant"],
        }),
        offers: new fields.ArrayField(
          negotiationOfferSchema(),
          {
            required: true,
            initial: [],
          },
        ),
        createdAt: new fields.StringField({
          required: true,
          blank: false,
          initial: "",
        }),
        updatedAt: new fields.StringField({
          required: true,
          blank: false,
          initial: "",
        }),
      });

    const journalTransactionEntrySchema = () =>
      new fields.SchemaField({
        id: new fields.StringField({
          required: true,
          blank: false,
          initial: "",
        }),
        type: new fields.StringField({
          required: true,
          blank: false,
          initial: "product",
          choices: ["product", "service", "item", "money"],
        }),
        side: new fields.StringField({
          required: true,
          blank: false,
          initial: "buyer",
          choices: ["buyer", "seller"],
        }),
        sourceId: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        sourceUuid: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        sourceActorUuid: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        name: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        img: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        quantity: new fields.NumberField({
          required: true,
          initial: 1,
          min: 0,
        }),
        unitPriceValue: new fields.NumberField({
          required: true,
          initial: 0,
          min: 0,
        }),
        totalPriceValue: new fields.NumberField({
          required: true,
          initial: 0,
          min: 0,
        }),
        priceCurrency: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        referenceUnitPriceValue: new fields.NumberField({
          required: false,
          nullable: true,
          initial: null,
          min: 0,
        }),
        percentOfReference: new fields.NumberField({
          required: false,
          nullable: true,
          initial: null,
          min: 0,
        }),
        isNegotiated: new fields.BooleanField({
          required: true,
          initial: false,
        }),
        negotiationStatus: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        isFreePrice: new fields.BooleanField({
          required: true,
          initial: false,
        }),
        hadSecrets: new fields.BooleanField({
          required: true,
          initial: false,
        }),
      });

    const journalMoneyAdjustmentSchema = () =>
      new fields.SchemaField({
        id: new fields.StringField({
          required: true,
          blank: false,
          initial: "",
        }),
        side: new fields.StringField({
          required: true,
          blank: false,
          initial: "buyer",
          choices: ["buyer", "seller"],
        }),
        value: new fields.NumberField({
          required: true,
          initial: 0,
        }),
        currency: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        label: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
      });

    const journalTransactionSchema = () =>
      new fields.SchemaField({
        id: new fields.StringField({
          required: true,
          blank: false,
          initial: "",
        }),
        transactionNumber: new fields.NumberField({
          required: false,
          nullable: true,
          initial: null,
          min: 1,
        }),
        createdAt: new fields.StringField({
          required: true,
          blank: false,
          initial: "",
        }),
        status: new fields.StringField({
          required: true,
          blank: false,
          initial: "validated",
          choices: ["validated", "refused"],
        }),
        merchantActorUuid: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        merchantName: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        buyerActorUuid: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        buyerName: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        buyerImg: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        referenceCurrency: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        totalReferenceValue: new fields.NumberField({
          required: true,
          initial: 0,
        }),
        summaryLabel: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
        entries: new fields.ArrayField(
          journalTransactionEntrySchema(),
          {
            required: true,
            initial: [],
          },
        ),
        moneyAdjustments: new fields.ArrayField(
          journalMoneyAdjustmentSchema(),
          {
            required: true,
            initial: [],
          },
        ),
        secrets: new fields.ArrayField(
          new fields.ObjectField({
            required: false,
            blank: true,
            initial: {},
          }),
          {
            required: true,
            initial: [],
          },
        ),
      });

    return {
      merchant: new fields.SchemaField({
        description: new fields.HTMLField({
          required: false,
          blank: true,
          initial: "",
        }),
      }),

      manager: new fields.SchemaField({
        mode: new fields.StringField({
          required: true,
          blank: false,
          initial: "text",
          choices: ["text", "actor"],
        }),

        displayName: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),

        actorUuid: new fields.DocumentUUIDField({
          required: false,
          blank: true,
          nullable: true,
          initial: null,
        }),
      }),

      sheet: new fields.SchemaField({
        isLocked: new fields.BooleanField({
          required: true,
          initial: true,
        }),
      }),

      trade: new fields.SchemaField({
        buyPercent: new fields.NumberField({
          required: true,
          initial: 50,
          min: 0,
        }),
        sellPercent: new fields.NumberField({
          required: true,
          initial: 100,
          min: 0,
        }),
        serviceSellPercent: new fields.NumberField({
          required: true,
          initial: 100,
          min: 0,
        }),
        negotiationFormula: new fields.StringField({
          required: false,
          blank: true,
          initial: "",
        }),
      }),

      wallet: new fields.SchemaField({
        currencies: new fields.ObjectField({
          required: false,
          blank: true,
          initial: {},
        }),
      }),

      referenceState: new fields.ObjectField({
        required: false,
        nullable: true,
        initial: null,
      }),

      journal: new fields.SchemaField({
        nextTransactionNumber: new fields.NumberField({
          required: true,
          initial: 1,
          min: 1,
        }),
        transactions: new fields.ArrayField(
          journalTransactionSchema(),
          {
            required: true,
            initial: [],
          },
        ),
      }),

      access: new fields.SchemaField({
        clients: new fields.ArrayField(
          new fields.SchemaField({
            actorUuid: new fields.StringField({
              required: true,
              blank: false,
              initial: "",
            }),
            actorId: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            actorName: new fields.StringField({
              required: true,
              blank: false,
              initial: "",
            }),
            actorImg: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            actorType: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            userId: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            userName: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            isAuthorized: new fields.BooleanField({
              required: true,
              initial: false,
            }),
            isFromPlayerCharacter: new fields.BooleanField({
              required: true,
              initial: false,
            }),
            customRates: new fields.ObjectField({
              required: false,
              nullable: true,
              initial: null,
            }),
          }),
          {
            required: true,
            initial: [],
          },
        ),
      }),

      catalog: new fields.SchemaField({
        keepEmptyItems: new fields.BooleanField({
          required: true,
          initial: true,
        }),
        collapsedCategories: new fields.ObjectField({
          required: false,
          blank: true,
          initial: {},
        }),
        hiddenCategories: new fields.ObjectField({
          required: false,
          blank: true,
          initial: {},
        }),
        productCategories: new fields.ArrayField(
          new fields.SchemaField({
            id: new fields.StringField({
              required: true,
              blank: false,
              initial: "",
            }),
            name: new fields.StringField({
              required: true,
              blank: false,
              initial: "",
            }),
          }),
          {
            required: true,
            initial: [],
          },
        ),
      }),

      services: new fields.SchemaField({
        entries: new fields.ArrayField(
          new fields.SchemaField({
            id: new fields.StringField({
              required: true,
              blank: false,
              initial: "",
            }),
            name: new fields.StringField({
              required: true,
              blank: false,
              initial: "",
            }),
            description: new fields.HTMLField({
              required: false,
              blank: true,
              initial: "",
            }),
            secretName: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            secretPrice: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            secretCurrency: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            secretDescription: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            priceValue: new fields.NumberField({
              required: true,
              initial: 0,
              min: 0,
            }),
            priceCurrency: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            quantity: new fields.NumberField({
              required: false,
              nullable: true,
              initial: null,
              min: 0,
            }),
            isHidden: new fields.BooleanField({
              required: true,
              initial: false,
            }),
            requiresApproval: new fields.BooleanField({
              required: true,
              initial: false,
            }),
            hasFreePrice: new fields.BooleanField({
              required: true,
              initial: false,
            }),
            minimumPriceValue: new fields.NumberField({
              required: true,
              initial: 0,
              min: 0,
            }),
            sourceUuid: new fields.StringField({
              required: false,
              blank: true,
              nullable: true,
              initial: null,
            }),
            sourceName: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            sourceType: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            sourceImg: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            category: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            systemCategoryKey: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            systemCategoryLabel: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            systemCategoryPath: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            isCommerciallyModified: new fields.BooleanField({
              required: true,
              initial: false,
            }),
            isExpanded: new fields.BooleanField({
              required: true,
              initial: true,
            }),
          }),
          {
            required: true,
            initial: [],
          },
        ),
      }),

      sessions: new fields.SchemaField({
        entries: new fields.ArrayField(
          new fields.SchemaField({
            id: new fields.StringField({
              required: true,
              blank: false,
              initial: "",
            }),
            status: new fields.StringField({
              required: true,
              blank: false,
              initial: "active",
              choices: ["active", "pending", "submitted", "validated", "refused"],
            }),
            label: new fields.StringField({
              required: true,
              blank: false,
              initial: "",
            }),
            actorUuid: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            actorName: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            userId: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            userName: new fields.StringField({
              required: false,
              blank: true,
              initial: "",
            }),
            buyerItems: new fields.ArrayField(
              sessionItemSchema(),
              {
                required: true,
                initial: [],
              },
            ),
            sellerItems: new fields.ArrayField(
              sessionItemSchema(),
              {
                required: true,
                initial: [],
              },
            ),
            negotiations: new fields.ArrayField(
              sessionNegotiationSchema(),
              {
                required: true,
                initial: [],
              },
            ),
            createdAt: new fields.StringField({
              required: true,
              blank: false,
              initial: "",
            }),
            updatedAt: new fields.StringField({
              required: true,
              blank: false,
              initial: "",
            }),
          }),
          {
            required: true,
            initial: [],
          },
        ),
      }),
    };
  }

  /**
   * Placeholder method for CO2 system compatibility.
   * MTT merchants don't use CO2 actions, so this is a no-op.
   */
  updateAllActionsUuid() {
    // No-op: MTT merchants don't use CO2 action system
  }
}
