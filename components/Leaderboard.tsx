"use client";

import { useEffect, useState } from "react";
import { getAllUsers } from "@/lib/firebase";

interface UserData {
  id: string;
  email: string;
  name: string;
  totalPoints: number;
  correctPronostics: number;
  totalPronostics: number;
}

export default function Leaderboard() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await getAllUsers();
        // Trier par totalPoints (descendant)
        const sortedUsers = usersData.sort((a, b) => b.totalPoints - a.totalPoints);
        setUsers(sortedUsers);
      } catch (err) {
        setError("Erreur lors du chargement du classement");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const calculateSuccessRate = (user: UserData) => {
    if (user.totalPronostics === 0) return 0;
    return (user.correctPronostics / user.totalPronostics) * 100;
  };

  if (loading) {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-bold text-ocre-600 mb-4">Classement</h2>
        <div className="text-center py-8">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-bold text-ocre-600 mb-4">Classement</h2>
        <div className="p-4 bg-red-100 text-red-600 rounded-md">{error}</div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-ocre-600 mb-4">Classement</h2>
      
      {users.length === 0 ? (
        <div className="text-center py-8 text-texte-secondaire">
          Aucun utilisateur trouvé
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="leaderboard w-full">
            <thead>
              <tr>
                <th className="text-left">Rang</th>
                <th className="text-left">Joueur</th>
                <th className="text-right">Points</th>
                <th className="text-right">Pronostics corrects</th>
                <th className="text-right">Taux de réussite</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-3">
                    <span className="font-bold text-ocre-600">{index + 1}</span>
                  </td>
                  <td className="py-3">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-texte-secondaire">{user.email}</div>
                  </td>
                  <td className="py-3 text-right font-semibold text-vert-600">
                    {user.totalPoints.toFixed(2)}
                  </td>
                  <td className="py-3 text-right">
                    {user.correctPronostics} / {user.totalPronostics}
                  </td>
                  <td className="py-3 text-right">
                    <span className={`badge ${
                      calculateSuccessRate(user) >= 70 ? 'badge-vert' :
                      calculateSuccessRate(user) >= 50 ? 'badge-ocre' : 'badge-gris'
                    }`}>
                      {calculateSuccessRate(user).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
