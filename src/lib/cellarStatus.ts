export interface DrinkingWindow {
  startYear: number | null;
  endYear: number | null;
}

export function isDrinkSoon(window: DrinkingWindow, today: Date = new Date()): boolean {
  if (window.endYear == null) return false;
  return today.getFullYear() >= window.endYear - 1;
}
