"use client";
import { useState } from "react";
import Image from "next/image";
import { usePlanner } from "../context/PlannerContext.jsx";

// Search TheMealDB, read a recipe, and add it to (or replace a meal in) the planner.
export default function MealDbSearch({ days, meals: mealTypes }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null); // null = haven't searched yet
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/mealdb?search=${encodeURIComponent(query.trim())}`);
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setResults(body);
    } else {
      setError(body.error || "Search failed");
      setResults(null);
    }
    setLoading(false);
  }

  return (
    <div className="card space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          placeholder="Search TheMealDB, e.g. chicken, curry, cake"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input flex-1"
          aria-label="Search TheMealDB"
        />
        <button type="submit" disabled={loading} className="btn">
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {results && results.length === 0 && <p className="hint">No recipes found for “{query}”.</p>}

      {results && results.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {results.map((item) => (
            <MealDbResult key={item.id} item={item} days={days} mealTypes={mealTypes} />
          ))}
        </ul>
      )}
    </div>
  );
}

function MealDbResult({ item, days, mealTypes }) {
  const { meals, recipes, planFromMealDb } = usePlanner();
  const [showRecipe, setShowRecipe] = useState(false);
  const [day, setDay] = useState(days[0]);
  const [mealType, setMealType] = useState(mealTypes[2]); // dinner
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  // What's already planned in the chosen slot? Then the button replaces it (Update).
  const current = meals.find((m) => m.day === day && m.meal === mealType);
  const currentTitle = current && recipes.find((r) => r.id === current.recipeId)?.title;
  const alreadyThere = current && recipes.find((r) => r.id === current.recipeId)?.mealdbId === item.id;

  async function handleAdd() {
    setSaving(true);
    setStatus("");
    try {
      await planFromMealDb(item, day, mealType);
      setStatus(`✓ ${current ? "Updated" : "Added to"} ${day} ${mealType}`);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="py-4 first:pt-0 last:pb-0" data-mealdb={item.title}>
      <div className="flex gap-4">
        {item.thumb && (
          <Image
            src={`${item.thumb}/preview`}
            alt=""
            width={96}
            height={96}
            className="h-24 w-24 shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-slate-500">
              {[item.category, item.area].filter(Boolean).join(" · ")}
            </p>
          </div>

          {/* Add / edit this recipe in the planner */}
          <div className="flex flex-wrap items-center gap-2">
            <select value={day} onChange={(e) => setDay(e.target.value)} className="input w-auto" aria-label="Day">
              {days.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="input w-auto capitalize"
              aria-label="Meal"
            >
              {mealTypes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <button onClick={handleAdd} disabled={saving || alreadyThere} className="btn">
              {saving ? "Saving…" : alreadyThere ? "Already planned" : current ? "Replace in planner" : "Add to planner"}
            </button>
            <button onClick={() => setShowRecipe(!showRecipe)} className="btn-ghost">
              {showRecipe ? "Hide recipe" : "Show recipe"}
            </button>
          </div>
          {current && !alreadyThere && (
            <p className="hint">
              {day} {mealType} currently has <strong>{currentTitle}</strong>. It will be replaced.
            </p>
          )}
          {status && <p className="text-sm text-emerald-700" role="status">{status}</p>}

          {showRecipe && (
            <div className="space-y-3 rounded-lg bg-slate-50 p-3 text-sm">
              <div>
                <p className="font-semibold">Ingredients</p>
                <ul className="mt-1 list-disc pl-5">
                  {item.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold">Instructions</p>
                <p className="mt-1 whitespace-pre-line text-slate-700">{item.instructions}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
