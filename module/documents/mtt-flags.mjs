import { MTT } from "../config/constants.mjs"

// MTT base — helpers communs d'identification des entités MTT
// Ce fichier n'importe rien de shop-flags.mjs ni storage-flags.mjs et ne doit pas contenir de logique métier shop/storage.

export function getMTTEntityType(actor) {
  return String(actor?.getFlag?.(MTT.ID, MTT.FLAGS.TYPE) ?? "").trim()
}
