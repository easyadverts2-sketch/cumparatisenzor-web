export function formatOrderNumber(n: number): string {
  const raw = String(n);
  // New format: ddmmyyyynnn (11 digits). Keep legacy 7-digit formatting for historical orders.
  if (/^\d{11}$/.test(raw)) return raw;
  return raw.padStart(7, "0");
}
