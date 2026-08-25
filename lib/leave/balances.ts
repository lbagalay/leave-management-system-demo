export function calculateAdjustmentDays(
  entitlement: number,
  used: number,
  available: number,
) {
  return available - entitlement + used;
}
