import { CalendarDays } from "lucide-react";

type BrandMarkProps = {
  compact?: boolean;
  inverted?: boolean;
};

export function BrandMark({ compact = false, inverted = false }: BrandMarkProps) {
  return (
    <div className="brand-lockup">
      <span className="brand-symbol" aria-hidden="true">
        <CalendarDays size={21} strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="brand-copy">
          <span className={inverted ? "brand-name brand-name-inverted" : "brand-name"}>
            Leave Management
          </span>
          <span className={inverted ? "brand-kicker brand-kicker-inverted" : "brand-kicker"}>
            Employee Services
          </span>
        </span>
      )}
    </div>
  );
}
