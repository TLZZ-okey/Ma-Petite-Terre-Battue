import { NextResponse } from "next/server";
import { signOutUser } from "@/lib/firebase";

// POST: Déconnexion
export async function POST() {
  try {
    await signOutUser();

    return NextResponse.json({
      success: true,
      message: "Déconnexion réussie"
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Erreur lors de la déconnexion"
    }, { status: 500 });
  }
}
