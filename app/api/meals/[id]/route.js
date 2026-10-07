import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";
import { updateMeal, deleteMeal } from "../../../../lib/db";

// OBJECTIVE: Implementing CRUD operations — Update (swap the recipe for this meal)
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  if (!body?.recipeId) {
    return NextResponse.json({ error: "recipeId is required" }, { status: 400 });
  }

  const updated = updateMeal(session.user.id, id, { recipeId: body.recipeId });
  if (!updated) {
    return NextResponse.json({ error: "Meal or recipe not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

// OBJECTIVE: Implementing CRUD operations — Delete
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const ok = deleteMeal(session.user.id, id);
  if (!ok) {
    return NextResponse.json({ error: "Meal not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
