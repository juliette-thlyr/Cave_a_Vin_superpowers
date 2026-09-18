import { test, expect } from 'vitest';
import { isDrinkSoon } from './cellarStatus';

test('is not drink-soon when the window end is years away', () => {
  const result = isDrinkSoon({ startYear: 2024, endYear: 2035 }, new Date(2026, 0, 1));
  expect(result).toBe(false);
});

test('is drink-soon when within one year of the window end', () => {
  const result = isDrinkSoon({ startYear: 2020, endYear: 2027 }, new Date(2026, 0, 1));
  expect(result).toBe(true);
});

test('is drink-soon when past the window end', () => {
  const result = isDrinkSoon({ startYear: 2018, endYear: 2024 }, new Date(2026, 0, 1));
  expect(result).toBe(true);
});

test('is not drink-soon when the window end is unknown', () => {
  const result = isDrinkSoon({ startYear: 2020, endYear: null }, new Date(2026, 0, 1));
  expect(result).toBe(false);
});
