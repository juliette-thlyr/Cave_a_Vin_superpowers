import { test, expect, vi } from 'vitest';
import { createSupabaseTastingRepository } from './tastingRepository';
import type { NewTastingRecord } from '../types';

test('insertTastingRecord maps input to a snake_case row and back', async () => {
  const row = {
    id: 'tasting-1',
    bottle_instance_id: 'bottle-1',
    user_id: 'user-1',
    rating: 90,
    notes: 'Tres reussi',
    tasted_at: '2026-09-17',
    companions: 'Famille',
    occasion: 'Diner',
    photo_url: null,
  };
  const client = {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: row, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  };
  const repo = createSupabaseTastingRepository(client as any);

  const input: NewTastingRecord = {
    bottleInstanceId: 'bottle-1',
    rating: 90,
    notes: 'Tres reussi',
    tastedAt: '2026-09-17',
    companions: 'Famille',
    occasion: 'Diner',
    photoUrl: null,
  };

  const record = await repo.insertTastingRecord(input);

  expect(record.id).toBe('tasting-1');
  expect(record.bottleInstanceId).toBe('bottle-1');
});

test('updateBottleStatus updates the bottle_instances row', async () => {
  const eq = vi.fn().mockResolvedValue({ error: null });
  const client = { from: vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue({ eq }) }) };
  const repo = createSupabaseTastingRepository(client as any);

  await repo.updateBottleStatus('bottle-1', 'consommee');

  expect(client.from).toHaveBeenCalledWith('bottle_instances');
  expect(eq).toHaveBeenCalledWith('id', 'bottle-1');
});
