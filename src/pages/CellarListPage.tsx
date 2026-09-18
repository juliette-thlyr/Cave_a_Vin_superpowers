import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { createSupabaseBottleRepository } from '../repositories/bottleRepository';
import type { BottleInstance, Wine } from '../types';

type BottleWithWine = BottleInstance & { wine: Wine };

export function CellarListPage() {
  const [bottles, setBottles] = useState<BottleWithWine[]>([]);
  const [region, setRegion] = useState('');
  const [grapeVariety, setGrapeVariety] = useState('');
  const [vintage, setVintage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const repo = createSupabaseBottleRepository(supabase);
    repo
      .listBottles({ status: 'en_cave' })
      .then(setBottles)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement'));
  }, []);

  const filtered = bottles.filter((b) => {
    if (region && b.wine.region !== region) return false;
    if (grapeVariety && b.wine.grapeVariety !== grapeVariety) return false;
    if (vintage && String(b.wine.vintage) !== vintage) return false;
    return true;
  });

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">Ma cave</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-2">
        <label>
          Region
          <input className="border rounded p-1 ml-1" value={region} onChange={(e) => setRegion(e.target.value)} />
        </label>
        <label>
          Cepage
          <input className="border rounded p-1 ml-1" value={grapeVariety} onChange={(e) => setGrapeVariety(e.target.value)} />
        </label>
        <label>
          Millesime
          <input className="border rounded p-1 ml-1" value={vintage} onChange={(e) => setVintage(e.target.value)} />
        </label>
      </div>
      <ul className="space-y-1">
        {filtered.map((b) => (
          <li key={b.id}>
            <Link to={`/bottles/${b.id}`}>{b.wine.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
