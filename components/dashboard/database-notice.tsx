import { AlertTriangle } from "lucide-react";

export function DatabaseNotice() {
  return (
    <div className="database-notice" role="status">
      <AlertTriangle size={18} />
      <span>
        Live data is temporarily unavailable. Prepared demo data is shown so you can continue.
      </span>
    </div>
  );
}
