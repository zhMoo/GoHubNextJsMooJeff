"use client";
import { useState } from "react";
import Image from "next/image";
import { usePlanner } from "../context/PlannerContext.jsx";

export default function RecipeList({ categories }) {
  const { recipes, editRecipe, removeRecipe } = usePlanner();
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ title: "", category: "", ingredients: "" });
  const [error, setError] = useState("");

  if (recipes.length === 0) {
    return <p className="hint">No recipes yet — add one above.</p>;
  }

  function startEdit(recipe) {
    setEditingId(recipe.id);
    setDraft({ title: recipe.title, category: recipe.category, ingredients: recipe.ingredients });
    setError("");
  }

  async function saveEdit(id) {
    if (!draft.title.trim()) return;
    try {
      await editRecipe(id, draft);
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card divide-y divide-slate-100">
      {recipes.map((recipe) => (
        <div key={recipe.id} className="py-3 first:pt-0 last:pb-0">
          {editingId === recipe.id ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className="input flex-1"
                  aria-label="Title"
                  autoFocus
                />
                <select
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  className="input w-32"
                  aria-label="Category"
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <input
                value={draft.ingredients}
                onChange={(e) => setDraft({ ...draft, ingredients: e.target.value })}
                className="input"
                aria-label="Ingredients"
              />
              {error && <p className="error">{error}</p>}
              <div className="flex gap-2">
                <button className="btn" onClick={() => saveEdit(recipe.id)}>Save</button>
                <button className="btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              {recipe.image && (
                <Image
                  src={`${recipe.image}/preview`}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {recipe.title} <span className="tag">{recipe.category}</span>
                  {recipe.mealdbId && <span className="tag bg-amber-50 text-amber-700">TheMealDB</span>}
                </p>
                <p className="line-clamp-2 text-sm text-slate-500">{recipe.ingredients || "No ingredients listed"}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button className="btn-ghost" onClick={() => startEdit(recipe)}>Edit</button>
                <button className="btn-ghost" onClick={() => removeRecipe(recipe.id)}>Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
