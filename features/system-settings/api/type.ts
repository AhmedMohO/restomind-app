/** Platform-wide switches, as returned by GET /admin/settings. */
export interface SystemSettings {
  /** Whether a newly onboarded merchant is given a free trial at all. */
  freeTrialEnabled: boolean
  /**
   * Length of a NEW trial. Changing it never moves a trial already granted —
   * those are stored as an absolute end date, so nobody's clock jumps.
   */
  trialDurationDays: number
  /**
   * The master early-bird switch. It gates both intake and pricing: turned
   * off, no newcomer claims a seat and every existing early bird renews at the
   * standard price. The month already paid for is untouched.
   */
  earlyBirdEnabled: boolean
  earlyBirdCap: number
  /**
   * Applied to every plan and every billing interval. 33.3333 reproduces the
   * original per-tier early-bird prices exactly; 33.33 does not — it lands the
   * Scale yearly price 1 EGP high.
   */
  earlyBirdDiscountPercent: number
  /** Seats held, however they were granted — automatically or by an admin. */
  earlyBirdClaimed: number
  earlyBirdSeatsLeft: number
}

/** Every field optional: flipping one switch sends only that switch. */
export type SystemSettingsUpdate = Partial<
  Pick<
    SystemSettings,
    | "freeTrialEnabled"
    | "trialDurationDays"
    | "earlyBirdEnabled"
    | "earlyBirdCap"
    | "earlyBirdDiscountPercent"
  >
>
