import type { SupabaseClient } from '@supabase/supabase-js';
import type { Wine, InfoSource } from '../types';

export interface NewWineInput {
  name: string;
  producer: string | null;
  vintage: number | null;
  appellation: string | null;
  grapeVariety: string | null;
  region: string | null;
  drinkingWindowStartYear: number | null;
  drinkingWindowEndYear: number | null;
  foodPairing: string | null;
  infoSource: InfoSource;
  photoUrl: string | null;
}

export interface WineRepository {
  createWine(input: NewWineInput): Promise<Wine>;
}

export function createSupabaseWineRepository(client: SupabaseClient): WineRepository {
  return {
    async createWine(input: NewWineInput): Promise<Wine> {
      const { data, error } = await client
        .from('wines')
        .insert({
          name: input.name,
          producer: input.producer,
          vintage: input.vintage,
          appellation: input.appellation,
          grape_variety: input.grapeVariety,
          region: input.region,
          drinking_window_start_year: input.drinkingWindowStartYear,
          drinking_window_end_year: input.drinkingWindowEndYear,
          food_pairing: input.foodPairing,
          info_source: input.infoSource,
          photo_url: input.photoUrl,
        })
        .select()
        .single();
      if (error) throw error;
      return mapWineRow(data);
    },
  };
}

export function mapWineRow(row: any): Wine {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    producer: row.producer,
    vintage: row.vintage,
    appellation: row.appellation,
    grapeVariety: row.grape_variety,
    region: row.region,
    drinkingWindowStartYear: row.drinking_window_start_year,
    drinkingWindowEndYear: row.drinking_window_end_year,
    foodPairing: row.food_pairing,
    infoSource: row.info_source,
    photoUrl: row.photo_url,
  };
}
