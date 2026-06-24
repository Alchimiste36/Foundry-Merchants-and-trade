import { MTT } from "../config/constants.mjs"

// MTT base — helpers communs d'identification des entités MTT

export function getMTTEntityType(actor) {
  return String(actor?.getFlag?.(MTT.ID, MTT.FLAGS.TYPE) ?? "").trim()
}
