import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../lib/auth";
import { getAllMeals, createMeal, DAYS, MEALS } from "../../../lib/db";

// OBJECTIVE: Implementing CRUD operations — Read
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json(getAllMeals(session.user.id));
}

// OBJECTIVE: Implementing CRUD operations — Create
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  if (!DAYS.includes(body?.day) || !MEALS.includes(body?.meal)) {
    return NextResponse.json({ error: "Invalid day or meal" }, { status: 400 });
  }

  const meal = createMeal(session.user.id, {
    day: body.day,
    meal: body.meal,
    recipeId: body.recipeId,
  });
  if (!meal) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 400 });
  }
  return NextResponse.json(meal, { status: 201 });
}
