"use client";
import { createContext, useContext, useState, useCallback } from "react";

// OBJECTIVE: Managing global application state with the Context API
//
// RecipeForm, RecipeList and MealPlanner all need the same recipes and
// meals. Context lets each of them reach in directly instead of passing
// props down through the dashboard page.
const PlannerContext = createContext(null);

async function errorFrom(res, fallback) {
  const body = await res.json().catch(() => ({}));
  return new Error(body.error || fallback);
}

export function PlannerProvider({ initialRecipes, initialMeals, children }) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [meals, setMeals] = useState(initialMeals);

  // ----- Recipes -----

  const addRecipe = useCallback(async (recipe) => {
    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipe),
    });
    if (!res.ok) throw await errorFrom(res, "Could not add recipe");
    const newRecipe = await res.json();
    setRecipes((prev) => [...prev, newRecipe]);
    return newRecipe;
  }, []);

  const editRecipe = useCallback(async (id, recipe) => {
    const res = await fetch(`/api/recipes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipe),
    });
    if (!res.ok) throw await errorFrom(res, "Could not update recipe");
    const updated = await res.json();
    setRecipes((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }, []);

  const removeRecipe = useCallback(async (id) => {
    const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      // The database also removed this recipe's meals (ON DELETE CASCADE).
      setMeals((prev) => prev.filter((m) => m.recipeId !== id));
    }
  }, []);

  // ----- Meals -----

  const addMeal = useCallback(async (day, meal, recipeId) => {
    const res = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, meal, recipeId }),
    });
    if (!res.ok) throw await errorFrom(res, "Could not add meal");
    const newMeal = await res.json();
    setMeals((prev) => [...prev, newMeal]);
  }, []);

  const editMeal = useCallback(async (id, recipeId) => {
    const res = await fetch(`/api/meals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId }),
    });
    if (!res.ok) throw await errorFrom(res, "Could not update meal");
    const updated = await res.json();
    setMeals((prev) => prev.map((m) => (m.id === id ? updated : m)));
  }, []);

  const removeMeal = useCallback(async (id) => {
    const res = await fetch(`/api/meals/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMeals((prev) => prev.filter((m) => m.id !== id));
    }
  }, []);

  // ----- TheMealDB -> planner -----
  // Put a TheMealDB recipe into one planner slot (e.g. Friday dinner):
  //   1. save it as one of my recipes, unless it's already saved   (POST /api/recipes)
  //   2. if the slot is empty, add it; if not, replace what's there (POST or PUT /api/meals)
  async function planFromMealDb(item, day, mealType) {
    let recipe = recipes.find((r) => r.mealdbId === item.id);
    if (!recipe) {
      recipe = await addRecipe({
        title: item.title,
        category: item.category === "Dessert" ? "Dessert" : mealType[0].toUpperCase() + mealType.slice(1),
        ingredients: item.ingredients.join(", "),
        mealdbId: item.id,
        image: item.thumb,
      });
    }
    const existing = meals.find((m) => m.day === day && m.meal === mealType);
    if (existing) {
      await editMeal(existing.id, recipe.id);
    } else {
      await addMeal(day, mealType, recipe.id);
    }
  }

  return (
    <PlannerContext.Provider
      value={{
        recipes,
        meals,
        addRecipe,
        editRecipe,
        removeRecipe,
        addMeal,
        editMeal,
        removeMeal,
        planFromMealDb,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) {
    throw new Error("usePlanner must be used inside a <PlannerProvider>");
  }
  return ctx;
}
