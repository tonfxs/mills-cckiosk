import { AlertTriangle, ClipboardList, Copy } from "lucide-react";

type Props = {
  stuckCount: number;
  missingCount: number;
  duplicateGroups: number;
  onJump?: (section: "stuck" | "missing" | "duplicates") => void;
};

function Card({
  title,
  value,
  subtitle,
  icon: Icon,
  onClick,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: any;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-gray-600">{title}</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">{value}</div>
          <div className="mt-2 text-sm text-gray-500">{subtitle}</div>
        </div>
        <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center">
          <Icon className="h-5 w-5 text-gray-700" />
        </div>
      </div>
    </button>
  );
}

export default function QualityCards({
  stuckCount,
  missingCount,
  duplicateGroups,
  onJump,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card
        title="Stuck / Aging"
        value={stuckCount}
        subtitle="Orders beyond SLA thresholds"
        icon={AlertTriangle}
        onClick={onJump ? () => onJump("stuck") : undefined}
      />
      <Card
        title="Missing Data"
        value={missingCount}
        subtitle="Rows with required fields missing"
        icon={ClipboardList}
        onClick={onJump ? () => onJump("missing") : undefined}
      />
      <Card
        title="Duplicate Alerts"
        value={duplicateGroups}
        subtitle="Duplicate groups detected"
        icon={Copy}
        onClick={onJump ? () => onJump("duplicates") : undefined}
      />
    </div>
  );
}
