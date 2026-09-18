import { test, expect, vi } from 'vitest';
import { createSupabaseBottleRepository, type NewBottleInstanceInput } from './bottleRepository';

function makeFakeClientForInsert(rows: any[]) {
  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: rows, error: null }),
      }),
    }),
  };
}

test('createBottleInstances inserts one row per requested quantity', async () => {
  const rows = [
    { id: 'b1', wine_id: 'wine-1', user_id: 'user-1', acquisition_mode: 'achat', acquisition_source: 'Caviste', price_paid: 25, acquisition_date: '2026-09-17', status: 'en_cave' },
    { id: 'b2', wine_id: 'wine-1', user_id: 'user-1', acquisition_mode: 'achat', acquisition_source: 'Caviste', price_paid: 25, acquisition_date: '2026-09-17', status: 'en_cave' },
  ];
  const client = makeFakeClientForInsert(rows);
  const repo = createSupabaseBottleRepository(client as any);

  const input: NewBottleInstanceInput = {
    wineId: 'wine-1',
    acquisitionMode: 'achat',
    acquisitionSource: 'Caviste',
    pricePaid: 25,
    acquisitionDate: '2026-09-17',
  };

  const bottles = await repo.createBottleInstances(input, 2);

  expect(client.from).toHaveBeenCalledWith('bottle_instances');
  expect(bottles).toHaveLength(2);
  expect(bottles[0]).toEqual({
    id: 'b1',
    wineId: 'wine-1',
    userId: 'user-1',
    acquisitionMode: 'achat',
    acquisitionSource: 'Caviste',
    pricePaid: 25,
    acquisitionDate: '2026-09-17',
    status: 'en_cave',
  });
});
