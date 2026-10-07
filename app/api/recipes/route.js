import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../lib/auth";
import { getAllRecipes, createRecipe, CATEGORIES } from "../../../lib/db";

// OBJECTIVE: Securing API routes and data
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json(getAllRecipes(session.user.id));
}

// OBJECTIVE: Implementing CRUD operations — Create
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  if (!body?.title || !body.title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!CATEGORIES.includes(body.category)) {
    return NextResponse.json({ error: "Please choose a category" }, { status: 400 });
  }

  const recipe = createRecipe(session.user.id, {
    title: body.title.trim(),
    category: body.category,
    ingredients: (body.ingredients ?? "").trim(),
    // Only for recipes added from TheMealDB (see MealDbSearch.jsx):
    mealdbId: body.mealdbId ? String(body.mealdbId) : null,
    image: String(body.image ?? "").startsWith("https://www.themealdb.com/") ? body.image : null,
  });
  return NextResponse.json(recipe, { status: 201 });
}
