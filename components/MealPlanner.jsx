"use client";
import { usePlanner } from "../context/PlannerContext.jsx";

// The weekly planner: one row per day, one column per meal.
//   Create - pick a recipe in an empty slot's "+ Add…" dropdown
//   Update - pick a different recipe in a filled slot's dropdown
//   Delete - the ✕ button
export default function MealPlanner({ days, meals: mealTypes }) {
  const { recipes, meals, addMeal, editMeal, removeMeal } = usePlanner();

  if (recipes.length === 0) {
    return <p className="hint">Add a recipe first, then plan it here.</p>;
  }

  const recipeOptions = recipes.map((r) => (
    <option key={r.id} value={r.id}>
      {r.title}
    </option>
  ));

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="p-3">Day</th>
            {mealTypes.map((m) => (
              <th key={m} className="p-3 capitalize">{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day} className="border-b border-slate-100 last:border-0">
              <td className="p-3 font-medium">{day}</td>
              {mealTypes.map((mealType) => {
                const planned = meals.find((m) => m.day === day && m.meal === mealType);
                return (
                  <td key={mealType} className="p-2">
                    {planned ? (
                      <div className="flex gap-1">
                        <select
                          value={planned.recipeId}
                          onChange={(e) => editMeal(planned.id, e.target.value)}
                          className="input bg-emerald-50"
                          aria-label={`${day} ${mealType}`}
                        >
                          {recipeOptions}
                        </select>
                        <button
                          className="btn-ghost px-2"
                          onClick={() => removeMeal(planned.id)}
                          aria-label={`Remove ${day} ${mealType}`}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <select
                        value=""
                        onChange={(e) => e.target.value && addMeal(day, mealType, e.target.value)}
                        className="input text-slate-400"
                        aria-label={`${day} ${mealType}`}
                      >
                        <option value="">+ Add…</option>
                        {recipeOptions}
                      </select>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
