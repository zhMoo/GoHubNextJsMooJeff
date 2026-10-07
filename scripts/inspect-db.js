// A quick way to see exactly what's in the database — works even with
// the dev server fully stopped.
//
// Run it with: npm run db:inspect
const path = require("path");
const Database = require("better-sqlite3");

const db = new Database(path.join(__dirname, "..", "data", "app.db"));

console.log("recipes");
console.table(db.prepare("SELECT * FROM recipes ORDER BY id").all());

console.log("meals");
console.table(
  db
    .prepare(
      `SELECT meals.id, meals.user_id, meals.day, meals.meal, recipes.title AS recipe
       FROM meals JOIN recipes ON recipes.id = meals.recipe_id
       ORDER BY meals.user_id, meals.id`,
    )
    .all(),
);

db.close();
