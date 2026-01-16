type Props = { status: string };

function norm(s: string) {
  return (s || "").trim().toLowerCase();
}

function statusClass(status: string) {
  const s = norm(status);

  // Green
  if (s === "order collected" || s === "item received") {
    return "bg-green-50 text-green-700 border-green-200";
  }

  // Blue
  if (s === "endorsed to wh") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  // Gray
  if (s === "proceed to window") {
    return "bg-gray-100 text-gray-700 border-gray-200";
  }

  // Red
  if (s === "pending verification" || s === "pending pickup") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  // Default
  return "bg-gray-100 text-gray-700 border-gray-200";
}

export default function StatusPill({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium whitespace-nowrap ${statusClass(
        status
      )}`}
    >
      {status || "—"}
    </span>
  );
}
