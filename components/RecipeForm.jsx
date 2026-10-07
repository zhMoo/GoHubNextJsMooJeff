"use client";
import { useState } from "react";
import { usePlanner } from "../context/PlannerContext.jsx";

export default function RecipeForm({ categories }) {
  const { addRecipe } = usePlanner();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [ingredients, setIngredients] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await addRecipe({ title, category, ingredients });
      setTitle("");
      setIngredients("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <h2 className="font-semibold">Add a recipe</h2>
      <div className="flex gap-2">
        <input
          placeholder="Recipe name, e.g. Roti Canai"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input flex-1"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input w-32">
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <input
        placeholder="Ingredients, e.g. flour, egg, ghee"
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
        className="input"
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={submitting} className="btn">
        {submitting ? "Adding…" : "Add recipe"}
      </button>
    </form>
  );
}
