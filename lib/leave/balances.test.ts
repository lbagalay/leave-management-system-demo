import { describe, expect, it } from "vitest";

import { calculateAdjustmentDays } from "./balances";

describe("manual balance adjustment", () => {
  it("derives adjustment days from desired availability", () => {
    expect(calculateAdjustmentDays(10, 3, 9)).toBe(2);
  });

  it("supports availability above entitlement", () => {
    expect(calculateAdjustmentDays(10, 0, 12)).toBe(2);
  });
});
