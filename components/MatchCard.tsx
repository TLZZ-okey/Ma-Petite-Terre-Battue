"use client";

import { useState } from "react";
import { addPronostic } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds: number;
  awayOdds: number;
  startTime: Date;
  tournament: string;
  status: 'upcoming' | 'live' | 'finished';
}

interface MatchCardProps {
  match: Match;
  onPronosticAdded?: () => void;
}

export default function MatchCard({ match, onPronosticAdded }: MatchCardProps) {
  const { user } = useAuth();
  const [selectedWinner, setSelectedWinner] = useState<'home' | 'away' | null>(null);
  const [selectedSets, setSelectedSets] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user) {
      setError("Vous devez être connecté pour faire un pronostic");
      return;
    }

    if (!selectedWinner || !selectedSets) {
      setError("Veuillez sélectionner un vainqueur et un nombre de sets");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const points = selectedWinner === 'home' ? match.homeOdds : match.awayOdds;
      await addPronostic(
        user.uid,
        match.id,
        selectedWinner,
        selectedSets,
        points
      );
      setSuccess("Pronostic enregistré avec succès !");
      if (onPronosticAdded) onPronosticAdded();
      
      // Réinitialiser les sélections après 2 secondes
      setTimeout(() => {
        setSelectedWinner(null);
        setSelectedSets(null);
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError("Erreur lors de l'enregistrement du pronostic");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMatchFinished = match.status === 'finished';
  const isMatchUpcoming = match.status === 'upcoming';

  // Formater la date
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(date).toLocaleDateString('fr-FR', options);
  };

  return (
    <div className="card p-4 mb-4 fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-texte-secondaire">
              {match.tournament}
            </span>
            {isMatchFinished && (
              <span className="badge badge-gris">Terminé</span>
            )}
            {isMatchUpcoming && (
              <span className="badge badge-ocre">À venir</span>
            )}
          </div>
          
          <div className="text-lg font-semibold text-texte">
            {match.homeTeam} vs {match.awayTeam}
          </div>
          
          <div className="text-sm text-texte-secondaire">
            {formatDate(match.startTime)}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="font-semibold text-ocre-600">{match.homeOdds.toFixed(2)}</div>
            <div className="text-xs text-texte-secondaire">{match.homeTeam.split(' ')[0]}</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-vert-600">{match.awayOdds.toFixed(2)}</div>
            <div className="text-xs text-texte-secondaire">{match.awayTeam.split(' ')[0]}</div>
          </div>
        </div>
      </div>

      {!isMatchFinished && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-texte mb-1">
                Vainqueur
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedWinner('home')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedWinner === 'home'
                      ? 'bg-ocre-500 text-white'
                      : 'bg-gris-100 text-texte hover:bg-ocre-100'
                  }`}
                  disabled={isMatchFinished}
                >
                  {match.homeTeam}
                </button>
                <button
                  onClick={() => setSelectedWinner('away')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedWinner === 'away'
                      ? 'bg-vert-500 text-white'
                      : 'bg-gris-100 text-texte hover:bg-vert-100'
                  }`}
                  disabled={isMatchFinished}
                >
                  {match.awayTeam}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-texte mb-1">
                Nombre de sets
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSets(2)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedSets === 2
                      ? 'bg-ocre-500 text-white'
                      : 'bg-gris-100 text-texte hover:bg-ocre-100'
                  }`}
                  disabled={isMatchFinished}
                >
                  2 sets
                </button>
                <button
                  onClick={() => setSelectedSets(3)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedSets === 3
                      ? 'bg-ocre-500 text-white'
                      : 'bg-gris-100 text-texte hover:bg-ocre-100'
                  }`}
                  disabled={isMatchFinished}
                >
                  3 sets
                </button>
              </div>
            </div>
          </div>

          {user && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={!selectedWinner || !selectedSets || isSubmitting}
                className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Enregistrement...' : 'Valider le pronostic'}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-2 p-2 bg-red-100 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mt-2 p-2 bg-green-100 text-green-600 rounded-md text-sm">
              {success}
            </div>
          )}
        </div>
      )}

      {isMatchFinished && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center text-texte-secondaire">
          Match terminé
        </div>
      )}
    </div>
  );
}
