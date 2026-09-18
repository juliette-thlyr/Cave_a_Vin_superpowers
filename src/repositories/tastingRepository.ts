import type { SupabaseClient } from '@supabase/supabase-js';
import type { NewTastingRecord, TastingRecord, BottleStatus, BottleInstance, Wine } from '../types';
import type { TastingRepository } from '../lib/tastingService';
import { mapWineRow } from './wineRepository';

export interface TastingHistoryRepository extends TastingRepository {
  listTastingRecords(): Promise<Array<TastingRecord & { bottle: BottleInstance & { wine: Wine } }>>;
}

export function createSupabaseTastingRepository(client: SupabaseClient): TastingHistoryRepository {
  return {
    async insertTastingRecord(input: NewTastingRecord): Promise<TastingRecord> {
      const { data, error } = await client
        .from('tasting_records')
        .insert({
          bottle_instance_id: input.bottleInstanceId,
          rating: input.rating,
          notes: input.notes,
          tasted_at: input.tastedAt,
          companions: input.companions,
          occasion: input.occasion,
          photo_url: input.photoUrl,
        })
        .select()
        .single();
      if (error) throw error;
      return mapTastingRow(data);
    },

    async updateBottleStatus(bottleInstanceId: string, status: BottleStatus): Promise<void> {
      const { error } = await client.from('bottle_instances').update({ status }).eq('id', bottleInstanceId);
      if (error) throw error;
    },

    async listTastingRecords() {
      const { data, error } = await client
        .from('tasting_records')
        .select('*, bottle_instances(*, wines(*))');
      if (error) throw error;
      return data.map((row: any) => ({
        ...mapTastingRow(row),
        bottle: {
          id: row.bottle_instances.id,
          wineId: row.bottle_instances.wine_id,
          userId: row.bottle_instances.user_id,
          acquisitionMode: row.bottle_instances.acquisition_mode,
          acquisitionSource: row.bottle_instances.acquisition_source,
          pricePaid: row.bottle_instances.price_paid,
          acquisitionDate: row.bottle_instances.acquisition_date,
          status: row.bottle_instances.status,
          wine: mapWineRow(row.bottle_instances.wines),
        },
      }));
    },
  };
}

function mapTastingRow(row: any): TastingRecord {
  return {
    id: row.id,
    bottleInstanceId: row.bottle_instance_id,
    userId: row.user_id,
    rating: row.rating,
    notes: row.notes,
    tastedAt: row.tasted_at,
    companions: row.companions,
    occasion: row.occasion,
    photoUrl: row.photo_url,
  };
}
