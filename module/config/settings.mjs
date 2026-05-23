import { MTT } from "./constants.mjs";

export function registerSettings() {
  game.settings.register(MTT.ID, "debug", {
    name: "mtt.settings.debug.name",
    hint: "mtt.settings.debug.hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
  });
}
