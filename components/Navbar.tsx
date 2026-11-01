"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutUser } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <nav className="navbar fixed top-0 left-0 right-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-xl font-bold text-ocre-600">Tennis Prono</div>
          <div>Chargement...</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-ocre-600">
          Tennis Prono
        </Link>

        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              pathname === "/"
                ? "bg-ocre-100 text-ocre-600"
                : "text-texte hover:bg-gris-100"
            }`}
          >
            Matchs
          </Link>

          {user && (
            <>
              <Link
                href="/pronostics"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === "/pronostics"
                    ? "bg-ocre-100 text-ocre-600"
                    : "text-texte hover:bg-gris-100"
                }`}
              >
                Mes Pronostics
              </Link>

              <Link
                href="/leaderboard"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === "/leaderboard"
                    ? "bg-ocre-100 text-ocre-600"
                    : "text-texte hover:bg-gris-100"
                }`}
              >
                Classement
              </Link>

              <button
                onClick={handleSignOut}
                className="px-3 py-2 bg-ocre-500 text-white rounded-md text-sm font-medium hover:bg-ocre-600 transition-colors"
              >
                Déconnexion
              </button>
            </>
          )}

          {!user && (
            <>
              <Link
                href="/auth/login"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === "/auth/login"
                    ? "bg-ocre-100 text-ocre-600"
                    : "text-texte hover:bg-gris-100"
                }`}
              >
                Connexion
              </Link>
              <Link
                href="/auth/register"
                className="px-3 py-2 bg-ocre-500 text-white rounded-md text-sm font-medium hover:bg-ocre-600 transition-colors"
              >
                Inscription
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
