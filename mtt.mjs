import { MTT } from "./module/config/constants.mjs";
import { registerSettings } from "./module/config/settings.mjs";
import * as models from "./module/models/_module.mjs";
import * as applications from "./module/applications/_module.mjs";

Hooks.once("init", async function () {
  console.info(`${MTT.NAME} | ${game.i18n.localize("mtt.log.initializing")}`);

  game.modules.get(MTT.ID).api = {
    MTT,
    models,
    applications,
  };

  await foundry.applications.handlebars.loadTemplates(Object.values(MTT.TEMPLATES));

  CONFIG.Actor.dataModels[MTT.ACTOR_TYPES.MERCHANT] = models.MerchantData;

  foundry.documents.collections.Actors.registerSheet(MTT.ID, applications.MerchantSheet, {
    types: [MTT.ACTOR_TYPES.MERCHANT],
    makeDefault: true,
    label: "mtt.sheets.merchant",
  });

  registerSettings();

  console.info(`${MTT.NAME} | ${game.i18n.localize("mtt.log.initialized")}`);
});

Hooks.once("ready", async function () {
  console.info(`${MTT.NAME} | ${game.i18n.localize("mtt.log.ready")}`);
});
