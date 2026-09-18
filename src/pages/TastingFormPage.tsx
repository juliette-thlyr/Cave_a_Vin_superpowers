import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { createSupabaseTastingRepository } from '../repositories/tastingRepository';
import { createTastingRecord } from '../lib/tastingService';

export function TastingFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rating, setRating] = useState('');
  const [notes, setNotes] = useState('');
  const [tastedAt, setTastedAt] = useState('');
  const [companions, setCompanions] = useState('');
  const [occasion, setOccasion] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    try {
      const repo = createSupabaseTastingRepository(supabase);
      await createTastingRecord(repo, {
        bottleInstanceId: id,
        rating: rating ? Number(rating) : null,
        notes: notes || null,
        tastedAt,
        companions: companions || null,
        occasion: occasion || null,
        photoUrl: null,
      });
      navigate(`/bottles/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-3">
      <h1 className="text-xl font-bold">Deguster cette bouteille</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          Note (sur 100)
          <input className="border rounded w-full p-2" value={rating} onChange={(e) => setRating(e.target.value)} />
        </label>
        <label className="block">
          Commentaire
          <textarea className="border rounded w-full p-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <label className="block">
          Date de degustation
          <input
            className="border rounded w-full p-2"
            type="date"
            value={tastedAt}
            onChange={(e) => setTastedAt(e.target.value)}
            required
          />
        </label>
        <label className="block">
          Compagnie
          <input className="border rounded w-full p-2" value={companions} onChange={(e) => setCompanions(e.target.value)} />
        </label>
        <label className="block">
          Occasion
          <input className="border rounded w-full p-2" value={occasion} onChange={(e) => setOccasion(e.target.value)} />
        </label>
        <button type="submit" className="bg-blue-600 text-white rounded p-2 w-full">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
