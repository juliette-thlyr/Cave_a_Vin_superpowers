import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { test, expect, vi } from 'vitest';
import { TastingFormPage } from './TastingFormPage';

const insertTastingRecord = vi.fn().mockResolvedValue({ id: 't1' });
const updateBottleStatus = vi.fn().mockResolvedValue(undefined);

vi.mock('../repositories/tastingRepository', () => ({
  createSupabaseTastingRepository: () => ({ insertTastingRecord, updateBottleStatus }),
}));
vi.mock('../supabaseClient', () => ({ supabase: {} }));

test('submitting the tasting form records the tasting and flips bottle status', async () => {
  render(
    <MemoryRouter initialEntries={['/bottles/b1/taste']}>
      <Routes>
        <Route path="/bottles/:id/taste" element={<TastingFormPage />} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText(/note/i), { target: { value: '90' } });
  fireEvent.change(screen.getByLabelText(/date de degustation/i), { target: { value: '2026-09-17' } });
  fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

  await waitFor(() => expect(insertTastingRecord).toHaveBeenCalledWith(expect.objectContaining({ bottleInstanceId: 'b1', rating: 90 })));
  expect(updateBottleStatus).toHaveBeenCalledWith('b1', 'consommee');
});
