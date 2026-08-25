import { describe, expect, it } from "vitest";

import { calculateTenure, formatTenure } from "./tenure";

describe("employee tenure", () => {
  it("calculates completed years and months", () => {
    expect(calculateTenure("2024-01-10", "2026-08-25")).toEqual({
      years: 2,
      months: 7,
    });
  });

  it("does not count an incomplete month", () => {
    expect(calculateTenure("2026-01-31", "2026-02-28")).toEqual({
      years: 0,
      months: 0,
    });
  });

  it("formats singular and sub-month tenure", () => {
    expect(formatTenure("2025-08-25", "2026-08-25")).toBe("1 year");
    expect(formatTenure("2026-08-20", "2026-08-25")).toBe(
      "Less than 1 month",
    );
  });
});
