import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { test, expect, vi } from 'vitest';
import { CellarListPage } from './CellarListPage';

const listBottles = vi.fn().mockResolvedValue([
  { id: 'b1', status: 'en_cave', wine: { name: 'Chateau X', region: 'Bordeaux', grapeVariety: 'Merlot', vintage: 2018 } },
  { id: 'b2', status: 'en_cave', wine: { name: 'Domaine Y', region: 'Bourgogne', grapeVariety: 'Pinot Noir', vintage: 2020 } },
]);

vi.mock('../repositories/bottleRepository', () => ({
  createSupabaseBottleRepository: () => ({ listBottles }),
}));
vi.mock('../supabaseClient', () => ({ supabase: {} }));

test('filters the cellar list by region', async () => {
  render(
    <MemoryRouter>
      <CellarListPage />
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.getByText('Chateau X')).toBeInTheDocument());
  expect(screen.getByText('Domaine Y')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/region/i), { target: { value: 'Bordeaux' } });

  expect(screen.getByText('Chateau X')).toBeInTheDocument();
  expect(screen.queryByText('Domaine Y')).not.toBeInTheDocument();
});

test('shows an error message when loading the cellar fails', async () => {
  listBottles.mockRejectedValueOnce(new Error('Network down'));

  render(
    <MemoryRouter>
      <CellarListPage />
    </MemoryRouter>
  );

  expect(await screen.findByText('Network down')).toBeInTheDocument();
});
