import type { LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";

type FoundationPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export function FoundationPlaceholder({
  eyebrow,
  title,
  description,
  icon: Icon,
}: FoundationPlaceholderProps) {
  return (
    <div className="dashboard-page placeholder-page">
      <div className="page-heading">
        <div>
          <p className="date-label">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      <section className="placeholder-panel">
        <span className="placeholder-icon" aria-hidden="true">
          <Icon size={27} />
        </span>
        <div>
          <span className="status-pill">
            <span className="status-dot" /> Foundation ready
          </span>
          <h2>This workspace is prepared</h2>
          <p>
            The route, permissions, responsive layout, and navigation are in place. Functional tools will be added in the appropriate approved phase.
          </p>
        </div>
        <div className="placeholder-check">
          <CheckCircle2 size={19} />
          <span>Access protection active</span>
        </div>
      </section>
    </div>
  );
}
