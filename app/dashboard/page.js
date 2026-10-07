import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";
import { getAllRecipes, getAllMeals, DAYS, MEALS, CATEGORIES } from "../../lib/db";
import { PlannerProvider } from "../../context/PlannerContext.jsx";
import RecipeForm from "../../components/RecipeForm.jsx";
import RecipeList from "../../components/RecipeList.jsx";
import MealPlanner from "../../components/MealPlanner.jsx";
import MealDbSearch from "../../components/MealDbSearch.jsx";
import SignOutButton from "../../components/SignOutButton.jsx";

// OBJECTIVE: Implementing authentication with NextAuth.js
// OBJECTIVE: Securing API routes and data
//
// This Server Component checks the session first. If there's no session,
// the redirect happens before any data is read.
export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/signin");
  }

  // Read this user's data directly from the database, server-side.
  const recipes = getAllRecipes(session.user.id);
  const meals = getAllMeals(session.user.id);

  return (
    // OBJECTIVE: Managing global application state with the Context API
    <PlannerProvider initialRecipes={recipes} initialMeals={meals}>
      <div className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-500">Recipe Box</p>
              <h1 className="text-3xl font-bold">Weekly Meal Planner</h1>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span>
                Signed in as <strong>{session.user.name}</strong>
              </span>
              <SignOutButton />
            </div>
          </header>

          <h2 className="mb-2 text-lg font-semibold">This week</h2>
          <MealPlanner days={DAYS} meals={MEALS} />

          <h2 className="mb-2 mt-8 text-lg font-semibold">Find recipes on TheMealDB</h2>
          <MealDbSearch days={DAYS} meals={MEALS} />

          <h2 className="mb-2 mt-8 text-lg font-semibold">My recipes</h2>
          <RecipeForm categories={CATEGORIES} />
          <RecipeList categories={CATEGORIES} />

          <footer className="mt-6 text-xs leading-relaxed text-slate-500">
            Every add / edit / delete above calls a secured Route Handler under{" "}
            <code>app/api/</code>, which reads and writes a real SQLite database at{" "}
            <code>data/app.db</code>.
          </footer>
        </div>
      </div>
    </PlannerProvider>
  );
}
