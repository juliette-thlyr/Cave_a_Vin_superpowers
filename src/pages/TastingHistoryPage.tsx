import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { createSupabaseTastingRepository } from '../repositories/tastingRepository';
import type { TastingRecord, BottleInstance, Wine } from '../types';

type TastingWithBottle = TastingRecord & { bottle: BottleInstance & { wine: Wine } };

export function TastingHistoryPage() {
  const [records, setRecords] = useState<TastingWithBottle[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const repo = createSupabaseTastingRepository(supabase);
    repo
      .listTastingRecords()
      .then(setRecords)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement'));
  }, []);

  const sorted = [...records].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-xl font-bold mb-3">Historique des degustations</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <ul className="space-y-1">
        {sorted.map((r) => (
          <li key={r.id}>
            {r.bottle.wine.name} - {r.rating ?? 'non note'}
          </li>
        ))}
      </ul>
    </div>
  );
}
