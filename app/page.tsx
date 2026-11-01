"use client";

import { useEffect, useState } from "react";
import MatchCard from "@/components/MatchCard";
import { getTennisMatches } from "@/lib/odds-api";
import { getMatches, addMatch } from "@/lib/firebase";

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

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);

    try {
      // Essayer de récupérer depuis Firebase d'abord
      const firebaseMatches = await getMatches();
      
      if (firebaseMatches.length > 0) {
        setMatches(firebaseMatches);
      } else {
        // Si Firebase est vide, récupérer depuis l'API
        const apiMatches = await getTennisMatches();
        
        // Sauvegarder dans Firebase
        for (const match of apiMatches) {
          await addMatch({
            ...match,
            status: 'upcoming'
          });
        }
        
        setMatches(apiMatches);
      }
      
      setLastUpdated(new Date().toLocaleTimeString('fr-FR'));
    } catch (err) {
      setError("Erreur lors du chargement des matchs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    
    // Rafraîchir toutes les 5 minutes
    const interval = setInterval(() => {
      fetchMatches();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchMatches();
  };

  if (loading && matches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-xl font-bold text-ocre-600 mb-4">Chargement des matchs...</div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocre-500 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <div className="p-4 bg-red-100 text-red-600 rounded-md mb-4">{error}</div>
        <button
          onClick={handleRefresh}
          className="btn-primary px-4 py-2 text-sm"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-ocre-600">Matchs à venir</h1>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-gris-100 text-texte rounded-md text-sm hover:bg-gris-200 transition-colors"
        >
          Rafraîchir
        </button>
      </div>

      {lastUpdated && (
        <div className="text-sm text-texte-secondaire mb-4">
          Dernière mise à jour: {lastUpdated}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="text-center py-12 text-texte-secondaire">
          Aucun match trouvé
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onPronosticAdded={handleRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
