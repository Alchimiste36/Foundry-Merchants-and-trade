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
        isFromActor: new fields.BooleanField({
          required: true,
          initial: false,
        }),
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

      status: new fields.SchemaField({
        isOpen: new fields.BooleanField({
          required: true,
          initial: true,
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
              choices: ["active", "pending", "validated", "refused"],
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
