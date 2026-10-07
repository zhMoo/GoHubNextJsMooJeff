# Recipe Box + Weekly Meal Planner (App Router)

Built the same way as Module 10's Notes app: NextAuth.js sign-in, a real
SQLite database, secured Route Handlers, and the Context API, with full
CRUD on two things: **recipes** and **planned meals**, plus recipe search
from the **TheMealDB** API that you can add straight into your planner.

## Module objectives

1. **Create a full stack application with Next.js**: UI, state,
   authentication and a database working together.
2. **Work with database connections**: a real SQLite database in `lib/db.js`.
3. **Implement CRUD operations**: Create, Read, Update and Delete, for both
   recipes and meals.

## Run it

```bash
npm install
cp .env.local.example .env.local
# replace the placeholder secret with: openssl rand -base64 32
npm run dev
```

On Windows, copy `.env.local.example` to a new file named `.env.local` instead of using `cp`.
(If you skip this step, `npm run dev` still works with a built-in development secret.)

Open `http://localhost:3000`. It redirects to `/signin`.

**Demo users** (each has their own recipes and planner):

| Username | Password |
| --- | --- |
| `Moo` | `password123` |
| `Jeff` | `password123` |

The database file (`data/app.db`) is created and seeded automatically the first
time the server starts. Delete it to start again with fresh demo data.
(If you have a `data/app.db` from an older version, it's upgraded automatically.)

## Files

```
lib/auth.js                    NextAuth options (2 demo users: Moo, Jeff)
lib/db.js                      SQLite connection, tables, seed data, all CRUD functions
lib/mealdb.js                  TheMealDB search (third-party API)
app/api/auth/[...nextauth]/    NextAuth route
app/api/recipes/route.js       GET, POST
app/api/recipes/[id]/route.js  PUT, DELETE
app/api/meals/route.js         GET, POST
app/api/meals/[id]/route.js    PUT, DELETE
app/api/mealdb/route.js        GET ?search=  (calls TheMealDB on the server)
context/PlannerContext.jsx     recipes + meals state, and the fetch() calls
app/dashboard/page.js          checks the session, reads the data, renders everything
app/signin/page.js             sign-in form
components/                    RecipeForm, RecipeList, MealPlanner, MealDbSearch, SignOutButton, ...
scripts/inspect-db.js          npm run db:inspect
```

## How each objective maps to the code

### 1. A full stack feature, end to end

Trace one click: choosing a different recipe for Monday's dinner in
`MealPlanner.jsx` calls `editMeal()` from `PlannerContext.jsx`, which
`fetch()`es `PUT /api/meals/[id]`. That route checks the session, then calls
`updateMeal()` in `lib/db.js`, which runs a real `UPDATE` query. The response
flows back and React re-renders with the change.

### 2. Database connections → `lib/db.js`

```js
const db = new Database(DB_PATH);
```

Two tables:

| Table | Columns |
| --- | --- |
| `recipes` | id, user_id, title, category, ingredients, mealdb_id, image |
| `meals` | id, user_id, day, meal (breakfast/lunch/dinner), recipe_id |

`user_id` is the signed-in user's id from NextAuth, so each user only sees their
own rows. `ON DELETE CASCADE` means deleting a recipe also removes it from the planner.

### 3. CRUD operations

| Operation | Recipes | Meals (planner) |
| --- | --- | --- |
| Create | `POST /api/recipes` → `createRecipe()` | `POST /api/meals` → `createMeal()` |
| Read | `GET /api/recipes` → `getAllRecipes()` | `GET /api/meals` → `getAllMeals()` |
| Update | `PUT /api/recipes/[id]` → `updateRecipe()` | `PUT /api/meals/[id]` → `updateMeal()` |
| Delete | `DELETE /api/recipes/[id]` → `deleteRecipe()` | `DELETE /api/meals/[id]` → `deleteMeal()` |

In the UI:

- **Recipes**:
  - Create: the "Add a recipe" form
  - Update: the **Edit** button, then **Save**
  - Delete: the **Delete** button
- **Meals**:
  - Create: pick a recipe in an empty "+ Add…" slot
  - Update: pick a different recipe in a filled slot
  - Delete: the **✕** button

### 4. Third-party API: TheMealDB

The "Find recipes on TheMealDB" section searches through our own route,
`GET /api/mealdb?search=…`, which calls TheMealDB on the server (`lib/mealdb.js`).
Each result can **Show recipe** (ingredients and instructions), and you can choose a
day and a meal and add it to the planner:

- **Empty slot** → **Add to planner**: saves the recipe to My recipes
  (`POST /api/recipes`, tagged *TheMealDB*), then adds it to the planner (`POST /api/meals`).
- **Slot already has a meal** → **Replace in planner**: swaps that meal's recipe
  (`PUT /api/meals/[id]`). The page says what will be replaced first.
- **Same recipe again** → it's reused, not saved twice (matched by `mealdb_id`).

All of this logic is in `planFromMealDb()` in `context/PlannerContext.jsx`. Once
saved, a TheMealDB recipe can be edited or deleted like any of your own recipes.

Every route checks the session first (`401` if not signed in), validates the
input (`400`), and returns `404` if the item doesn't exist or belongs to the other user.

## Suggested exploration

- Run `npm run db:inspect`, add a meal in the browser, and run it again to see the new row.
- Sign in as `Moo`, then as `Jeff`. Each user sees a different planner.
- Search TheMealDB for "chicken", add a result to Friday dinner, then add a different one
  to the same slot and watch it get replaced.
- Delete a recipe that's in the planner, then run `npm run db:inspect` to see its
  meals are gone too.
