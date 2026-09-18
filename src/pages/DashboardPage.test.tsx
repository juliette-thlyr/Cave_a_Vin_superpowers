import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { test, expect, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';

const listBottles = vi.fn().mockResolvedValue([
  {
    id: 'b1',
    status: 'en_cave',
    pricePaid: 20,
    wine: { name: 'Chateau X', drinkingWindowStartYear: 2020, drinkingWindowEndYear: 2026 },
  },
  {
    id: 'b2',
    status: 'en_cave',
    pricePaid: 15,
    wine: { name: 'Chateau Y', drinkingWindowStartYear: 2024, drinkingWindowEndYear: 2040 },
  },
]);

vi.mock('../repositories/bottleRepository', () => ({
  createSupabaseBottleRepository: () => ({ listBottles }),
}));
vi.mock('../supabaseClient', () => ({ supabase: {} }));

test('shows bottle count, total value, and drink-soon bottles', async () => {
  render(
    <MemoryRouter>
      <DashboardPage today={new Date(2026, 0, 1)} />
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.getByText(/2 bouteilles/i)).toBeInTheDocument());
  expect(screen.getByText(/35/)).toBeInTheDocument();
  expect(screen.getByText('Chateau X')).toBeInTheDocument();
  expect(screen.queryByText('Chateau Y')).not.toBeInTheDocument();
});

test('shows an error message when loading bottles fails', async () => {
  listBottles.mockRejectedValueOnce(new Error('Network down'));

  render(
    <MemoryRouter>
      <DashboardPage today={new Date(2026, 0, 1)} />
    </MemoryRouter>
  );

  expect(await screen.findByText('Network down')).toBeInTheDocument();
});
