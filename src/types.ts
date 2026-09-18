export type AcquisitionMode = 'achat' | 'cadeau' | 'heritage' | 'gagnee' | 'autre';
export type BottleStatus = 'en_cave' | 'consommee';
export type InfoSource = 'manuelle' | 'recherche_assistee';

export interface Wine {
  id: string;
  userId: string;
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

export interface BottleInstance {
  id: string;
  wineId: string;
  userId: string;
  acquisitionMode: AcquisitionMode;
  acquisitionSource: string | null;
  pricePaid: number | null;
  acquisitionDate: string;
  status: BottleStatus;
}

export interface TastingRecord {
  id: string;
  bottleInstanceId: string;
  userId: string;
  rating: number | null;
  notes: string | null;
  tastedAt: string;
  companions: string | null;
  occasion: string | null;
  photoUrl: string | null;
}

export interface NewTastingRecord {
  bottleInstanceId: string;
  rating: number | null;
  notes: string | null;
  tastedAt: string;
  companions: string | null;
  occasion: string | null;
  photoUrl: string | null;
}
