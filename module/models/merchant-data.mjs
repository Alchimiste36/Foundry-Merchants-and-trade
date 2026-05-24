const fields = foundry.data.fields;

export class MerchantData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
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
