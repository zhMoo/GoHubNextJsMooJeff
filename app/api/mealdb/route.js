import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../lib/auth";
import { searchMeals } from "../../../lib/mealdb";

// Third-party API: GET /api/mealdb?search=chicken
// The browser calls this route, and this route calls TheMealDB on the server.
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.get("search")?.trim();
  if (!search) {
    return NextResponse.json({ error: "Search text is required" }, { status: 400 });
  }

  try {
    return NextResponse.json(await searchMeals(search));
  } catch {
    return NextResponse.json({ error: "Could not reach TheMealDB" }, { status: 502 });
  }
}
