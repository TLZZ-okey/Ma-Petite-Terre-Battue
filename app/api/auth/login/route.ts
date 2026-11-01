import { NextResponse } from "next/server";
import { signIn } from "@/lib/firebase";

// POST: Connexion
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: "Tous les champs sont requis (email, password)"
      }, { status: 400 });
    }

    const user = await signIn(email, password);

    return NextResponse.json({
      success: true,
      data: {
        id: user.uid,
        email: user.email
      }
    });
  } catch (error: any) {
    let errorMessage = "Email ou mot de passe incorrect";
    
    if (error.message.includes("user-not-found")) {
      errorMessage = "Utilisateur non trouvé";
    } else if (error.message.includes("wrong-password")) {
      errorMessage = "Mot de passe incorrect";
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 401 });
  }
}
