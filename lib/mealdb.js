// Third-party API: TheMealDB (https://www.themealdb.com/api.php)
// The free test key "1" is allowed for development and educational use.

const BASE = "https://www.themealdb.com/api/json/v1/1";

// Turn TheMealDB's format (strIngredient1..20 + strMeasure1..20) into
// something simpler for our UI.
function toRecipe(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();
    if (name) ingredients.push(measure ? `${measure} ${name}` : name);
  }
  return {
    id: meal.idMeal,
    title: meal.strMeal,
    category: meal.strCategory,
    area: meal.strArea,
    thumb: meal.strMealThumb,
    instructions: meal.strInstructions ?? "",
    ingredients, // e.g. ["500g Chicken Thighs", "3 tbs Soy Sauce"]
  };
}

// Search by name, e.g. "chicken". Returns full recipes (TheMealDB's search
// endpoint already includes ingredients and instructions).
export async function searchMeals(query) {
  const res = await fetch(`${BASE}/search.php?s=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`TheMealDB request failed (${res.status})`);
  const data = await res.json();
  return (data.meals ?? []).map(toRecipe);
}
