"use client";

import { useEffect, useState } from "react";
import { getPronosticsByUser, getMatchById } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface Pronostic {
  id: string;
  userId: string;
  matchId: string;
  winner: 'home' | 'away';
  sets: number;
  points: number;
  isCorrect: boolean;
  timestamp: Date;
}

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds: number;
  awayOdds: number;
  startTime: Date;
  tournament: string;
  status: 'upcoming' | 'live' | 'finished';
  winner?: string;
  sets?: number;
}

interface PronosticWithMatch extends Pronostic {
  match: Match | null;
}

export default function PronosticList() {
  const { user } = useAuth();
  const [pronostics, setPronostics] = useState<PronosticWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchPronostics = async () => {
      try {
        const pronosticsData = await getPronosticsByUser(user.uid);
        
        // Récupérer les matchs correspondants
        const pronosticsWithMatches: PronosticWithMatch[] = [];
        for (const pronostic of pronosticsData) {
          const match = await getMatchById(pronostic.matchId);
          pronosticsWithMatches.push({
            ...pronostic,
            match
          });
        }
        
        // Trier par timestamp (plus récent en premier)
        pronosticsWithMatches.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setPronostics(pronosticsWithMatches);
      } catch (err) {
        setError("Erreur lors du chargement des pronostics");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPronostics();
  }, [user]);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(date).toLocaleDateString('fr-FR', options);
  };

  const getResultText = (pronostic: PronosticWithMatch) => {
    if (!pronostic.match) return "Match introuvable";
    
    if (pronostic.match.status !== 'finished') {
      return "En attente";
    }
    
    if (pronostic.isCorrect) {
      return `✅ Gagné ! +${(pronostic.points * 2).toFixed(2)} pts`;
    }
    
    if (pronostic.winner === pronostic.match.winner) {
      return `✅ Vainqueur correct ! +${pronostic.points.toFixed(2)} pts`;
    }
    
    return "❌ Perdu";
  };

  const getResultClass = (pronostic: PronosticWithMatch) => {
    if (!pronostic.match) return "";
    
    if (pronostic.match.status !== 'finished') {
      return "bg-gray-100 text-gray-600";
    }
    
    if (pronostic.isCorrect) {
      return "bg-green-100 text-green-600";
    }
    
    if (pronostic.winner === pronostic.match.winner) {
      return "bg-ocre-100 text-ocre-600";
    }
    
    return "bg-red-100 text-red-600";
  };

  if (!user) {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-bold text-ocre-600 mb-4">Mes Pronostics</h2>
        <div className="text-center py-8 text-texte-secondaire">
          Connectez-vous pour voir vos pronostics
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-bold text-ocre-600 mb-4">Mes Pronostics</h2>
        <div className="text-center py-8">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-bold text-ocre-600 mb-4">Mes Pronostics</h2>
        <div className="p-4 bg-red-100 text-red-600 rounded-md">{error}</div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-ocre-600 mb-4">Mes Pronostics</h2>
      
      {pronostics.length === 0 ? (
        <div className="text-center py-8 text-texte-secondaire">
          Aucun pronostic trouvé
        </div>
      ) : (
        <div className="space-y-4">
          {pronostics.map((pronostic) => (
            <div
              key={pronostic.id}
              className={`p-4 rounded-lg border ${getResultClass(pronostic)}`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-texte">
                    {pronostic.match ? (
                      <>
                        {pronostic.match.homeTeam} vs {pronostic.match.awayTeam}
                      </>
                    ) : (
                      <span className="text-texte-secondaire">Match introuvable</span>
                    )}
                  </div>
                  
                  {pronostic.match && (
                    <div className="text-sm text-texte-secondaire">
                      {pronostic.match.tournament} - {formatDate(pronostic.match.startTime)}
                    </div>
                  )}

                  <div className="text-sm mt-2">
                    <span className="font-medium">Votre pronostic:</span> {pronostic.winner === 'home' ? pronostic.match?.homeTeam : pronostic.match?.awayTeam} en {pronostic.sets} sets
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-bold ${getResultClass(pronostic).includes('green') ? 'text-green-600' : getResultClass(pronostic).includes('ocre') ? 'text-ocre-600' : 'text-red-600'}`}>
                    {getResultText(pronostic)}
                  </div>
                  <div className="text-sm text-texte-secondaire mt-1">
                    Côte: {pronostic.points.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
