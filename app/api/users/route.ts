import { NextResponse } from "next/server";
import { getAllUsers, getUserById } from "@/lib/firebase";
import { getCurrentUser } from "@/lib/firebase";

// GET: Récupérer tous les utilisateurs (classement)
export async function GET() {
  try {
    const users = await getAllUsers();
    const sortedUsers = users.sort((a, b) => b.totalPoints - a.totalPoints);

    return NextResponse.json({
      success: true,
      data: sortedUsers
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Erreur lors de la récupération des utilisateurs"
    }, { status: 500 });
  }
}
