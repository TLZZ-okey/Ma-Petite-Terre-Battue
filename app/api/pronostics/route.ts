import { NextResponse } from "next/server";
import { getPronosticsByUser, addPronostic } from "@/lib/firebase";
import { getCurrentUser } from "@/lib/firebase";

// GET: Récupérer les pronostics de l'utilisateur connecté
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "Non autorisé"
      }, { status: 401 });
    }

    const pronostics = await getPronosticsByUser(user.uid);

    return NextResponse.json({
      success: true,
      data: pronostics
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Erreur lors de la récupération des pronostics"
    }, { status: 500 });
  }
}

// POST: Ajouter un pronostic
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "Non autorisé"
      }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, winner, sets, points } = body;

    if (!matchId || !winner || !sets || points === undefined) {
      return NextResponse.json({
        success: false,
        error: "Tous les champs sont requis (matchId, winner, sets, points)"
      }, { status: 400 });
    }

    await addPronostic(user.uid, matchId, winner, sets, points);

    return NextResponse.json({
      success: true,
      message: "Pronostic ajouté avec succès"
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Erreur lors de l'ajout du pronostic"
    }, { status: 500 });
  }
}
