function dateParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error("Invalid ISO date");
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function calculateTenure(hireDateIso: string, asOfIso: string) {
  const hire = dateParts(hireDateIso);
  const asOf = dateParts(asOfIso);
  let totalMonths =
    (asOf.year - hire.year) * 12 + (asOf.month - hire.month);

  if (asOf.day < hire.day) {
    totalMonths -= 1;
  }

  if (totalMonths < 0) {
    throw new Error("Hire date cannot be in the future");
  }

  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
  };
}

export function formatTenure(hireDateIso: string, asOfIso: string) {
  const tenure = calculateTenure(hireDateIso, asOfIso);

  if (tenure.years === 0 && tenure.months === 0) {
    return "Less than 1 month";
  }

  const parts = [];
  if (tenure.years > 0) {
    parts.push(`${tenure.years} ${tenure.years === 1 ? "year" : "years"}`);
  }
  if (tenure.months > 0) {
    parts.push(`${tenure.months} ${tenure.months === 1 ? "month" : "months"}`);
  }

  return parts.join(", ");
}
