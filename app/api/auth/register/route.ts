import { NextResponse } from "next/server";
import { signUp } from "@/lib/firebase";

// POST: Inscription
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json({
        success: false,
        error: "Tous les champs sont requis (email, password, name)"
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: "Le mot de passe doit contenir au moins 6 caractères"
      }, { status: 400 });
    }

    const user = await signUp(email, password, name);

    return NextResponse.json({
      success: true,
      data: {
        id: user.uid,
        email: user.email,
        name
      }
    });
  } catch (error: any) {
    let errorMessage = "Erreur lors de l'inscription";
    
    if (error.message.includes("email-already-in-use")) {
      errorMessage = "Cet email est déjà utilisé";
    } else if (error.message.includes("weak-password")) {
      errorMessage = "Le mot de passe est trop faible";
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
