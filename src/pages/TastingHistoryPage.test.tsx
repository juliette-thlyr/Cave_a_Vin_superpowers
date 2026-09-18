import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { test, expect, vi } from 'vitest';
import { TastingHistoryPage } from './TastingHistoryPage';

const listTastingRecords = vi.fn().mockResolvedValue([
  { id: 't1', rating: 80, bottle: { wine: { name: 'Chateau X' } } },
  { id: 't2', rating: 95, bottle: { wine: { name: 'Domaine Y' } } },
]);

vi.mock('../repositories/tastingRepository', () => ({
  createSupabaseTastingRepository: () => ({ listTastingRecords }),
}));
vi.mock('../supabaseClient', () => ({ supabase: {} }));

test('lists tastings sorted by rating descending', async () => {
  render(
    <MemoryRouter>
      <TastingHistoryPage />
    </MemoryRouter>
  );

  const items = await screen.findAllByRole('listitem');
  expect(items[0]).toHaveTextContent('Domaine Y');
  expect(items[1]).toHaveTextContent('Chateau X');
});
