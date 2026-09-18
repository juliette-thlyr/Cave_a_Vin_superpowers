import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { test, expect, vi } from 'vitest';
import { AddBottlePage } from './AddBottlePage';

const createWine = vi.fn().mockResolvedValue({ id: 'wine-1' });
const createBottleInstances = vi.fn().mockResolvedValue([{ id: 'b1' }]);

vi.mock('../repositories/wineRepository', () => ({
  createSupabaseWineRepository: () => ({ createWine }),
}));
vi.mock('../repositories/bottleRepository', () => ({
  createSupabaseBottleRepository: () => ({ createBottleInstances }),
}));
vi.mock('../supabaseClient', () => ({ supabase: {} }));

test('submitting the form creates a wine and the requested number of bottles', async () => {
  render(
    <MemoryRouter>
      <AddBottlePage />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText(/nom du vin/i), { target: { value: 'Chateau X' } });
  fireEvent.change(screen.getByLabelText(/mode d'acquisition/i), { target: { value: 'achat' } });
  fireEvent.change(screen.getByLabelText(/date d'acquisition/i), { target: { value: '2026-09-17' } });
  fireEvent.change(screen.getByLabelText(/quantite/i), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: /ajouter/i }));

  await waitFor(() => expect(createWine).toHaveBeenCalled());
  expect(createBottleInstances).toHaveBeenCalledWith(
    expect.objectContaining({ wineId: 'wine-1' }),
    2
  );
});
