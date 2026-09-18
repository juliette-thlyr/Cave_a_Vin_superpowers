import type { SupabaseClient } from '@supabase/supabase-js';
import type { BottleInstance, AcquisitionMode, BottleStatus, Wine } from '../types';
import { mapWineRow } from './wineRepository';

export interface NewBottleInstanceInput {
  wineId: string;
  acquisitionMode: AcquisitionMode;
  acquisitionSource: string | null;
  pricePaid: number | null;
  acquisitionDate: string;
}

export interface BottleFilter {
  status?: BottleStatus;
}

export interface BottleRepository {
  createBottleInstances(input: NewBottleInstanceInput, quantity: number): Promise<BottleInstance[]>;
  listBottles(filter?: BottleFilter): Promise<Array<BottleInstance & { wine: Wine }>>;
  getBottle(id: string): Promise<BottleInstance & { wine: Wine }>;
}

export function createSupabaseBottleRepository(client: SupabaseClient): BottleRepository {
  return {
    async createBottleInstances(input, quantity) {
      const rowsToInsert = Array.from({ length: quantity }, () => ({
        wine_id: input.wineId,
        acquisition_mode: input.acquisitionMode,
        acquisition_source: input.acquisitionSource,
        price_paid: input.pricePaid,
        acquisition_date: input.acquisitionDate,
      }));
      const { data, error } = await client.from('bottle_instances').insert(rowsToInsert).select();
      if (error) throw error;
      return data.map(mapBottleRow);
    },

    async listBottles(filter) {
      let query = client.from('bottle_instances').select('*, wines(*)');
      if (filter?.status) query = query.eq('status', filter.status);
      const { data, error } = await query;
      if (error) throw error;
      return data.map((row: any) => ({ ...mapBottleRow(row), wine: mapWineRow(row.wines) }));
    },

    async getBottle(id) {
      const { data, error } = await client.from('bottle_instances').select('*, wines(*)').eq('id', id).single();
      if (error) throw error;
      return { ...mapBottleRow(data), wine: mapWineRow(data.wines) };
    },
  };
}

function mapBottleRow(row: any): BottleInstance {
  return {
    id: row.id,
    wineId: row.wine_id,
    userId: row.user_id,
    acquisitionMode: row.acquisition_mode,
    acquisitionSource: row.acquisition_source,
    pricePaid: row.price_paid,
    acquisitionDate: row.acquisition_date,
    status: row.status,
  };
}
