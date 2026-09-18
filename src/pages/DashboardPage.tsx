import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { createSupabaseBottleRepository } from '../repositories/bottleRepository';
import { isDrinkSoon } from '../lib/cellarStatus';
import type { BottleInstance, Wine } from '../types';

type BottleWithWine = BottleInstance & { wine: Wine };

export function DashboardPage({ today = new Date() }: { today?: Date }) {
  const [bottles, setBottles] = useState<BottleWithWine[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const repo = createSupabaseBottleRepository(supabase);
    repo
      .listBottles({ status: 'en_cave' })
      .then(setBottles)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement'));
  }, []);

  const totalValue = bottles.reduce((sum, b) => sum + (b.pricePaid ?? 0), 0);
  const drinkSoon = bottles.filter((b) =>
    isDrinkSoon({ startYear: b.wine.drinkingWindowStartYear, endYear: b.wine.drinkingWindowEndYear }, today)
  );

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">CaveAVin</h1>
      <Link to="/add-bottle" className="inline-block bg-blue-600 text-white rounded p-2">
        Ajouter une bouteille
      </Link>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <p>{bottles.length} bouteilles en cave, valeur estimee {totalValue} EUR</p>
      <div>
        <h2 className="font-semibold">A boire bientot</h2>
        {drinkSoon.length === 0 && <p className="text-sm text-gray-500">Aucune bouteille pour le moment</p>}
        <ul>
          {drinkSoon.map((b) => (
            <li key={b.id}>
              <Link to={`/bottles/${b.id}`}>{b.wine.name}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
