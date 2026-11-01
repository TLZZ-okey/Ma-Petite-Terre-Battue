import { NextResponse } from "next/server";
import { getMatches, addMatch } from "@/lib/firebase";
import { getTennisMatches } from "@/lib/odds-api";

// GET: Récupérer tous les matchs
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get('refresh') === 'true';

  try {
    let matches = [];

    if (refresh) {
      const apiMatches = await getTennisMatches();
      for (const match of apiMatches) {
        await addMatch({
          ...match,
          status: 'upcoming'
        });
      }
      matches = apiMatches;
    } else {
      matches = await getMatches();
      if (matches.length === 0) {
        const apiMatches = await getTennisMatches();
        matches = apiMatches;
      }
    }

    return NextResponse.json({
      success: true,
      data: matches
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Erreur lors de la récupération des matchs"
    }, { status: 500 });
  }
}

// POST: Ajouter un match manuellement
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { match } = body;

    if (!match) {
      return NextResponse.json({
        success: false,
        error: "Le match est requis"
      }, { status: 400 });
    }

    await addMatch(match);

    return NextResponse.json({
      success: true,
      data: match
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Erreur lors de l'ajout du match"
    }, { status: 500 });
  }
}
