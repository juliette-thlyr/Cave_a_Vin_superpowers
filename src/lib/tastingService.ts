import type { NewTastingRecord, TastingRecord, BottleStatus } from '../types';

export interface TastingRepository {
  insertTastingRecord(input: NewTastingRecord): Promise<TastingRecord>;
  updateBottleStatus(bottleInstanceId: string, status: BottleStatus): Promise<void>;
}

export async function createTastingRecord(
  repo: TastingRepository,
  input: NewTastingRecord
): Promise<TastingRecord> {
  const record = await repo.insertTastingRecord(input);
  await repo.updateBottleStatus(input.bottleInstanceId, 'consommee');
  return record;
}
