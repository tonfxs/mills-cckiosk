// lib/lookup-utils.ts
export function splitIds(csv: string): string[] {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function norm(s?: string) {
  return (s ?? "").trim().toLowerCase();
}

export function digitsOnly(s?: string) {
  return (s ?? "").replace(/\D/g, "");
}

export function phoneLast4(s?: string) {
  const d = digitsOnly(s);
  return d.slice(-4);
}
