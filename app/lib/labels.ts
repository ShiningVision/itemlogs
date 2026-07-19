// lib/labels.ts
export function resolveLabel(override: string | null | undefined, fallback: string): string {
  const trimmed = override?.trim();
  return trimmed ? trimmed : fallback;
}