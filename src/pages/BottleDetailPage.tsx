import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { createSupabaseBottleRepository } from '../repositories/bottleRepository';
import type { BottleInstance, Wine } from '../types';

type BottleWithWine = BottleInstance & { wine: Wine };

export function BottleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [bottle, setBottle] = useState<BottleWithWine | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const repo = createSupabaseBottleRepository(supabase);
    repo
      .getBottle(id)
      .then(setBottle)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement'));
  }, [id]);

  if (error) return <p className="p-4 text-red-600 text-sm">{error}</p>;
  if (!bottle) return <p className="p-4">Chargement...</p>;

  return (
    <div className="max-w-lg mx-auto p-4 space-y-2">
      <h1 className="text-xl font-bold">{bottle.wine.name}</h1>
      <p>Producteur: {bottle.wine.producer}</p>
      <p>Appellation: {bottle.wine.appellation}</p>
      <p>Cepage: {bottle.wine.grapeVariety}</p>
      <p>Region: {bottle.wine.region}</p>
      <p>Accords suggeres: {bottle.wine.foodPairing}</p>
      <p>Acquise via: {bottle.acquisitionMode} - {bottle.acquisitionSource}</p>
      <p>Prix paye: {bottle.pricePaid}</p>
      <p>Date d'acquisition: {bottle.acquisitionDate}</p>
      <p>Statut: {bottle.status}</p>
      {bottle.status === 'en_cave' && (
        <Link to={`/bottles/${bottle.id}/taste`} className="inline-block bg-blue-600 text-white rounded p-2">
          J'ai bu cette bouteille
        </Link>
      )}
    </div>
  );
}
