/**
 * Custom Actor class for MTT merchants.
 * This class bypasses system-specific actor logic (like CO2's data preparation)
 * to keep merchants completely independent from the active game system.
 */
export class MerchantActor extends Actor {
  /**
   * Override prepareData to skip system-specific preparation.
   * MTT merchants only use their own TypeDataModel preparation.
   */
  prepareData() {
    // Skip the system's prepareData entirely
    // Only run Foundry's core Actor preparation
    this._prepareDerivedData();
  }

  /**
   * Override prepareEmbeddedDocuments to only handle items, not system-specific logic.
   */
  prepareEmbeddedDocuments() {
    this.items.forEach((item) => item.prepareData());
  }

  /**
   * Stub getRollData - MTT merchants don't use system roll mechanics yet.
   */
  getRollData() {
    const data = {};
    return data;
  }
}
