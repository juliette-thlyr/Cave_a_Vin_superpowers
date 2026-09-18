import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { createSupabaseWineRepository } from '../repositories/wineRepository';
import { createSupabaseBottleRepository } from '../repositories/bottleRepository';
import type { AcquisitionMode } from '../types';

export function AddBottlePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [producer, setProducer] = useState('');
  const [vintage, setVintage] = useState('');
  const [appellation, setAppellation] = useState('');
  const [grapeVariety, setGrapeVariety] = useState('');
  const [region, setRegion] = useState('');
  const [drinkingWindowStartYear, setDrinkingWindowStartYear] = useState('');
  const [drinkingWindowEndYear, setDrinkingWindowEndYear] = useState('');
  const [foodPairing, setFoodPairing] = useState('');
  const [acquisitionMode, setAcquisitionMode] = useState<AcquisitionMode>('achat');
  const [acquisitionSource, setAcquisitionSource] = useState('');
  const [pricePaid, setPricePaid] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function searchUrl() {
    const query = encodeURIComponent(`${name} ${producer} ${vintage} cepage accords mets-vin`);
    return `https://www.google.com/search?q=${query}`;
  }

  async function uploadPhotoIfAny(): Promise<string | null> {
    if (!photoFile) return null;
    const path = `${crypto.randomUUID()}-${photoFile.name}`;
    const { error: uploadError } = await supabase.storage.from('photos').upload(path, photoFile);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const wineRepo = createSupabaseWineRepository(supabase);
      const bottleRepo = createSupabaseBottleRepository(supabase);
      const photoUrl = await uploadPhotoIfAny();

      const wine = await wineRepo.createWine({
        name,
        producer: producer || null,
        vintage: vintage ? Number(vintage) : null,
        appellation: appellation || null,
        grapeVariety: grapeVariety || null,
        region: region || null,
        drinkingWindowStartYear: drinkingWindowStartYear ? Number(drinkingWindowStartYear) : null,
        drinkingWindowEndYear: drinkingWindowEndYear ? Number(drinkingWindowEndYear) : null,
        foodPairing: foodPairing || null,
        infoSource: 'manuelle',
        photoUrl,
      });

      await bottleRepo.createBottleInstances(
        {
          wineId: wine.id,
          acquisitionMode,
          acquisitionSource: acquisitionSource || null,
          pricePaid: pricePaid ? Number(pricePaid) : null,
          acquisitionDate,
        },
        Number(quantity)
      );

      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout");
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-3">
      <h1 className="text-xl font-bold">Ajouter une bouteille</h1>
      {name && (
        <a className="text-blue-600 underline text-sm" href={searchUrl()} target="_blank" rel="noreferrer">
          Rechercher sur internet
        </a>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          Nom du vin
          <input className="border rounded w-full p-2" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block">
          Producteur
          <input className="border rounded w-full p-2" value={producer} onChange={(e) => setProducer(e.target.value)} />
        </label>
        <label className="block">
          Millesime
          <input className="border rounded w-full p-2" value={vintage} onChange={(e) => setVintage(e.target.value)} />
        </label>
        <label className="block">
          Appellation
          <input className="border rounded w-full p-2" value={appellation} onChange={(e) => setAppellation(e.target.value)} />
        </label>
        <label className="block">
          Cepage
          <input className="border rounded w-full p-2" value={grapeVariety} onChange={(e) => setGrapeVariety(e.target.value)} />
        </label>
        <label className="block">
          Region
          <input className="border rounded w-full p-2" value={region} onChange={(e) => setRegion(e.target.value)} />
        </label>
        <label className="block">
          Fenetre de degustation - debut (annee)
          <input className="border rounded w-full p-2" value={drinkingWindowStartYear} onChange={(e) => setDrinkingWindowStartYear(e.target.value)} />
        </label>
        <label className="block">
          Fenetre de degustation - fin (annee)
          <input className="border rounded w-full p-2" value={drinkingWindowEndYear} onChange={(e) => setDrinkingWindowEndYear(e.target.value)} />
        </label>
        <label className="block">
          Accords mets-vin suggeres
          <input className="border rounded w-full p-2" value={foodPairing} onChange={(e) => setFoodPairing(e.target.value)} />
        </label>
        <label className="block">
          Photo de la bouteille/etiquette (facultatif)
          <input
            className="border rounded w-full p-2"
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <label className="block">
          Mode d'acquisition
          <select
            className="border rounded w-full p-2"
            value={acquisitionMode}
            onChange={(e) => setAcquisitionMode(e.target.value as AcquisitionMode)}
          >
            <option value="achat">Achat</option>
            <option value="cadeau">Cadeau</option>
            <option value="heritage">Heritage</option>
            <option value="gagnee">Gagnee</option>
            <option value="autre">Autre</option>
          </select>
        </label>
        <label className="block">
          Lieu / source d'achat
          <input className="border rounded w-full p-2" value={acquisitionSource} onChange={(e) => setAcquisitionSource(e.target.value)} />
        </label>
        <label className="block">
          Prix paye
          <input className="border rounded w-full p-2" value={pricePaid} onChange={(e) => setPricePaid(e.target.value)} />
        </label>
        <label className="block">
          Date d'acquisition
          <input
            className="border rounded w-full p-2"
            type="date"
            value={acquisitionDate}
            onChange={(e) => setAcquisitionDate(e.target.value)}
            required
          />
        </label>
        <label className="block">
          Quantite
          <input
            className="border rounded w-full p-2"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>
        <button type="submit" className="bg-blue-600 text-white rounded p-2 w-full">
          Ajouter
        </button>
      </form>
    </div>
  );
}
