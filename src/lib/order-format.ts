export function formatOrderNumber(n: number): string {
  return String(n).padStart(7, "0");
}
