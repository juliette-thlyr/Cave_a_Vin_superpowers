import { test, expect, vi } from 'vitest';
import { createSupabaseWineRepository, type NewWineInput } from './wineRepository';

function makeFakeClient(row: any) {
  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: row, error: null }),
        }),
      }),
    }),
  };
}

test('createWine maps input to a snake_case row and back to a Wine', async () => {
  const row = {
    id: 'wine-1',
    user_id: 'user-1',
    name: 'Chateau X',
    producer: 'Domaine Y',
    vintage: 2018,
    appellation: 'Margaux',
    grape_variety: 'Cabernet Sauvignon',
    region: 'Bordeaux',
    drinking_window_start_year: 2024,
    drinking_window_end_year: 2032,
    food_pairing: 'Viande rouge',
    info_source: 'manuelle',
    photo_url: null,
  };
  const client = makeFakeClient(row);
  const repo = createSupabaseWineRepository(client as any);

  const input: NewWineInput = {
    name: 'Chateau X',
    producer: 'Domaine Y',
    vintage: 2018,
    appellation: 'Margaux',
    grapeVariety: 'Cabernet Sauvignon',
    region: 'Bordeaux',
    drinkingWindowStartYear: 2024,
    drinkingWindowEndYear: 2032,
    foodPairing: 'Viande rouge',
    infoSource: 'manuelle',
    photoUrl: null,
  };

  const wine = await repo.createWine(input);

  expect(client.from).toHaveBeenCalledWith('wines');
  expect(wine).toEqual({
    id: 'wine-1',
    userId: 'user-1',
    name: 'Chateau X',
    producer: 'Domaine Y',
    vintage: 2018,
    appellation: 'Margaux',
    grapeVariety: 'Cabernet Sauvignon',
    region: 'Bordeaux',
    drinkingWindowStartYear: 2024,
    drinkingWindowEndYear: 2032,
    foodPairing: 'Viande rouge',
    infoSource: 'manuelle',
    photoUrl: null,
  });
});
