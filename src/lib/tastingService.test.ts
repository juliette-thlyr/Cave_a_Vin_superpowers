import { test, expect, vi } from 'vitest';
import { createTastingRecord, type TastingRepository } from './tastingService';
import type { NewTastingRecord, TastingRecord } from '../types';

function makeFakeRepo(): TastingRepository & { calls: { updateBottleStatus: any[] } } {
  const calls = { updateBottleStatus: [] as any[] };
  return {
    calls,
    insertTastingRecord: vi.fn(async (input: NewTastingRecord): Promise<TastingRecord> => ({
      id: 'tasting-1',
      userId: 'user-1',
      ...input,
    })),
    updateBottleStatus: vi.fn(async (bottleInstanceId: string, status) => {
      calls.updateBottleStatus.push({ bottleInstanceId, status });
    }),
  };
}

test('creating a tasting record flips the bottle status to consommee', async () => {
  const repo = makeFakeRepo();
  const input: NewTastingRecord = {
    bottleInstanceId: 'bottle-1',
    rating: 88,
    notes: 'Belle robe, tanins souples',
    tastedAt: '2026-09-17',
    companions: 'Amis',
    occasion: 'Anniversaire',
    photoUrl: null,
  };

  const record = await createTastingRecord(repo, input);

  expect(record.id).toBe('tasting-1');
  expect(repo.insertTastingRecord).toHaveBeenCalledWith(input);
  expect(repo.calls.updateBottleStatus).toEqual([{ bottleInstanceId: 'bottle-1', status: 'consommee' }]);
});
