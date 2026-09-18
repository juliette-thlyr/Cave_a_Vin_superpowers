import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { test, expect, vi } from 'vitest';
import { BottleDetailPage } from './BottleDetailPage';

const getBottle = vi.fn().mockResolvedValue({
  id: 'b1',
  status: 'en_cave',
  acquisitionMode: 'achat',
  acquisitionSource: 'Caviste',
  pricePaid: 25,
  acquisitionDate: '2026-01-01',
  wine: { name: 'Chateau X', producer: 'Domaine Y', appellation: 'Margaux', grapeVariety: 'Merlot', region: 'Bordeaux', foodPairing: 'Viande rouge' },
});

vi.mock('../repositories/bottleRepository', () => ({
  createSupabaseBottleRepository: () => ({ getBottle }),
}));
vi.mock('../supabaseClient', () => ({ supabase: {} }));

test('shows the wine and acquisition details, and a tasting action link', async () => {
  render(
    <MemoryRouter initialEntries={['/bottles/b1']}>
      <Routes>
        <Route path="/bottles/:id" element={<BottleDetailPage />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.getByText('Chateau X')).toBeInTheDocument());
  expect(screen.getByText(/Caviste/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /j'ai bu cette bouteille/i })).toHaveAttribute('href', '/bottles/b1/taste');
});
