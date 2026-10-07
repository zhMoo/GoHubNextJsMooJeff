import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";
import { updateRecipe, deleteRecipe, CATEGORIES } from "../../../../lib/db";

// OBJECTIVE: Implementing CRUD operations — Update
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params; // Route Handler params are a Promise in Next.js 15+
  const body = await request.json();
  if (!body?.title || !body.title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!CATEGORIES.includes(body.category)) {
    return NextResponse.json({ error: "Please choose a category" }, { status: 400 });
  }

  const updated = updateRecipe(session.user.id, id, {
    title: body.title.trim(),
    category: body.category,
    ingredients: (body.ingredients ?? "").trim(),
  });
  if (!updated) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
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
  const ok = deleteRecipe(session.user.id, id);
  if (!ok) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
