import type { PublicationStatus } from "@/types/domain";
import { publicationLabels } from "@/config/catalog";
export function StatusBadge({ status }: { status: PublicationStatus }) {
  return (
    <span className={`badge status-${status}`}>
      <i />
      {publicationLabels[status]}
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="subtitle">{description}</p>
      </div>
      {action}
    </div>
  );
}
export function DemoNote() {
  return (
    <div className="demo-note">
      <span className="live-dot" />
      <strong>Ambiente demonstrativo</strong>
      <span>
        Dados fictícios para explorar o Studio. Nenhuma operação real é
        realizada.
      </span>
    </div>
  );
}
