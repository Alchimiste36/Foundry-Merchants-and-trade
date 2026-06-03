import { MTT } from "../config/constants.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class MttGlobalJournalApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "mtt-global-journal",
    classes: ["mtt-global-journal-app"],
    window: {
      title: "mtt.globalJournal.title",
      resizable: true,
    },
    position: {
      width: 520,
      height: "auto",
    },
  };

  static PARTS = {
    body: {
      template: MTT.TEMPLATES.MTT_GLOBAL_JOURNAL,
    },
  };
}
