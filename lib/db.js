import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

// OBJECTIVE: Working with database connections
const DATA_DIR = path.join(process.cwd(), "data");
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, "app.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// OBJECTIVE: Implementing CRUD operations
// Two tables. user_id is the id of the signed-in user (from NextAuth),
// so every user only sees their own recipes and meals.
db.exec(`
  CREATE TABLE IF NOT EXISTS recipes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT NOT NULL,
    title       TEXT NOT NULL,
    category    TEXT NOT NULL,
    ingredients TEXT NOT NULL DEFAULT '',
    mealdb_id   TEXT,          -- set when the recipe came from TheMealDB
    image       TEXT           -- photo URL (TheMealDB recipes only)
  );

  -- A meal = one recipe on one day, for breakfast, lunch or dinner.
  -- ON DELETE CASCADE: deleting a recipe also removes it from the planner.
  CREATE TABLE IF NOT EXISTS meals (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   TEXT NOT NULL,
    day       TEXT NOT NULL,
    meal      TEXT NOT NULL,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
  );
`);

// If data/app.db was created by an older version of this app, add the two
// TheMealDB columns to it (CREATE TABLE IF NOT EXISTS won't change an existing table).
const columns = db.prepare("PRAGMA table_info(recipes)").all().map((c) => c.name);
if (!columns.includes("mealdb_id")) db.exec("ALTER TABLE recipes ADD COLUMN mealdb_id TEXT");
if (!columns.includes("image")) db.exec("ALTER TABLE recipes ADD COLUMN image TEXT");

// Seed some starter data the first time the database is created.
// .immediate() locks the database while seeding, so it can't run twice at once.
db.transaction(() => {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM recipes").get();
  if (count === 0) {
    const addRecipe = db.prepare(
      "INSERT INTO recipes (user_id, title, category, ingredients) VALUES (?, ?, ?, ?)",
    );
    const addMeal = db.prepare("INSERT INTO meals (user_id, day, meal, recipe_id) VALUES (?, ?, ?, ?)");

    // Moo (user 1)
    const nasiLemak = addRecipe.run("1", "Nasi Lemak", "Breakfast", "Rice, coconut milk, sambal, anchovies, egg").lastInsertRowid;
    const kariAyam = addRecipe.run("1", "Kari Ayam", "Dinner", "Chicken, potatoes, curry powder, coconut milk").lastInsertRowid;
    addRecipe.run("1", "Mee Goreng Mamak", "Lunch", "Yellow noodles, tofu, egg, chilli paste");
    addMeal.run("1", "Monday", "breakfast", nasiLemak);
    addMeal.run("1", "Monday", "dinner", kariAyam);

    // Jeff (user 2)
    const oats = addRecipe.run("2", "Overnight Oats", "Breakfast", "Oats, milk, honey, banana").lastInsertRowid;
    addRecipe.run("2", "Vegetable Stir-fry", "Dinner", "Broccoli, carrot, cabbage, garlic");
    addMeal.run("2", "Tuesday", "breakfast", oats);
  }
}).immediate();

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const MEALS = ["breakfast", "lunch", "dinner"];
export const CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Dessert"];

function rowToRecipe(row) {
  return {
    id: String(row.id),
    title: row.title,
    category: row.category,
    ingredients: row.ingredients,
    mealdbId: row.mealdb_id,
    image: row.image,
  };
}

function rowToMeal(row) {
  return { id: String(row.id), day: row.day, meal: row.meal, recipeId: String(row.recipe_id) };
}

// ---------- Recipes ----------

// Read
export function getAllRecipes(userId) {
  const rows = db.prepare("SELECT * FROM recipes WHERE user_id = ? ORDER BY title").all(userId);
  return rows.map(rowToRecipe);
}

// Create (mealdbId and image are only sent for recipes added from TheMealDB)
export function createRecipe(userId, { title, category, ingredients, mealdbId = null, image = null }) {
  const info = db
    .prepare(
      "INSERT INTO recipes (user_id, title, category, ingredients, mealdb_id, image) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(userId, title, category, ingredients, mealdbId, image);
  const row = db.prepare("SELECT * FROM recipes WHERE id = ?").get(info.lastInsertRowid);
  return rowToRecipe(row);
}

// Update
export function updateRecipe(userId, id, { title, category, ingredients }) {
  const info = db
    .prepare("UPDATE recipes SET title = ?, category = ?, ingredients = ? WHERE id = ? AND user_id = ?")
    .run(title, category, ingredients, id, userId);
  if (info.changes === 0) return null; // not found, or not this user's recipe
  return rowToRecipe(db.prepare("SELECT * FROM recipes WHERE id = ?").get(id));
}

// Delete
export function deleteRecipe(userId, id) {
  const info = db.prepare("DELETE FROM recipes WHERE id = ? AND user_id = ?").run(id, userId);
  return info.changes > 0;
}

// ---------- Meals (the weekly planner) ----------

// Read
export function getAllMeals(userId) {
  const rows = db.prepare("SELECT * FROM meals WHERE user_id = ? ORDER BY id").all(userId);
  return rows.map(rowToMeal);
}

function userOwnsRecipe(userId, recipeId) {
  return Boolean(db.prepare("SELECT 1 FROM recipes WHERE id = ? AND user_id = ?").get(recipeId, userId));
}

// Create
export function createMeal(userId, { day, meal, recipeId }) {
  if (!userOwnsRecipe(userId, recipeId)) return null;
  const info = db
    .prepare("INSERT INTO meals (user_id, day, meal, recipe_id) VALUES (?, ?, ?, ?)")
    .run(userId, day, meal, recipeId);
  return rowToMeal(db.prepare("SELECT * FROM meals WHERE id = ?").get(info.lastInsertRowid));
}

// Update: swap the recipe for a planned meal
export function updateMeal(userId, id, { recipeId }) {
  if (!userOwnsRecipe(userId, recipeId)) return null;
  const info = db
    .prepare("UPDATE meals SET recipe_id = ? WHERE id = ? AND user_id = ?")
    .run(recipeId, id, userId);
  if (info.changes === 0) return null;
  return rowToMeal(db.prepare("SELECT * FROM meals WHERE id = ?").get(id));
}

// Delete
export function deleteMeal(userId, id) {
  const info = db.prepare("DELETE FROM meals WHERE id = ? AND user_id = ?").run(id, userId);
  return info.changes > 0;
}
