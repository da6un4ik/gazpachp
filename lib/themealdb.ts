import type { GeneratedRecipe } from '@/lib/generateRecipe';

type MealSummary = { idMeal: string; strMeal: string };
type MealDetail = {
  idMeal: string;
  strMeal: string;
  strInstructions: string;
  strCategory: string;
  strIngredient1?: string;
  strIngredient2?: string;
  strIngredient3?: string;
  strIngredient4?: string;
  strIngredient5?: string;
  strIngredient6?: string;
  strIngredient7?: string;
  strIngredient8?: string;
  strIngredient9?: string;
  strIngredient10?: string;
  strIngredient11?: string;
  strIngredient12?: string;
  strIngredient13?: string;
  strIngredient14?: string;
  strIngredient15?: string;
  strIngredient16?: string;
  strIngredient17?: string;
  strIngredient18?: string;
  strIngredient19?: string;
  strIngredient20?: string;
  strMeasure1?: string;
  strMeasure2?: string;
  strMeasure3?: string;
  strMeasure4?: string;
  strMeasure5?: string;
  strMeasure6?: string;
  strMeasure7?: string;
  strMeasure8?: string;
  strMeasure9?: string;
  strMeasure10?: string;
  strMeasure11?: string;
  strMeasure12?: string;
  strMeasure13?: string;
  strMeasure14?: string;
  strMeasure15?: string;
  strMeasure16?: string;
  strMeasure17?: string;
  strMeasure18?: string;
  strMeasure19?: string;
  strMeasure20?: string;
};

const THEMEALDB_API_KEY = process.env.THEMEALDB_API_KEY ?? '1';
const BASE = `https://www.themealdb.com/api/json/v1/${THEMEALDB_API_KEY}`;

function modeToIngredient(mode: string): string {
  if (mode === 'protein') return 'chicken';
  if (mode === 'quick') return 'egg';
  if (mode === 'kids') return 'banana';
  if (mode === 'weight-loss') return 'salad';
  return 'egg';
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Themealdb error: ${res.status}`);
  return (await res.json()) as T;
}

function normalizeSteps(text: string): string[] {
  return text
    .split(/\r?\n|\./)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function buildIngredients(meal: MealDetail): string[] {
  const result: string[] = [];

  for (let i = 1; i <= 20; i += 1) {
    const ingredient = meal[`strIngredient${i}` as keyof MealDetail] as string | undefined;
    const measure = meal[`strMeasure${i}` as keyof MealDetail] as string | undefined;

    if (ingredient && ingredient.trim()) {
      result.push(`${ingredient.trim()}${measure?.trim() ? ` — ${measure.trim()}` : ''}`);
    }
  }

  return result.slice(0, 20);
}


function sanitizeIngredient(input: string): string {
  const clean = input.toLowerCase().replace(/[^a-z\s]/g, ' ').trim();
  const primary = clean.split(/\s+/).filter(Boolean)[0] ?? 'egg';
  return primary;
}

function macroByMode(mode: string) {
  if (mode === 'protein') return { calories: 420, protein: 30, fat: 16, carbs: 38 };
  if (mode === 'weight-loss') return { calories: 330, protein: 24, fat: 12, carbs: 25 };
  if (mode === 'quick') return { calories: 360, protein: 18, fat: 14, carbs: 40 };
  if (mode === 'kids') return { calories: 390, protein: 14, fat: 13, carbs: 52 };
  return { calories: 380, protein: 20, fat: 14, carbs: 42 };
}

export async function getRecipeFromMealDb(params: {
  mode: string;
  nonce?: string;
  excludeTitle?: string;
  favoriteIngredients?: string[];
}): Promise<GeneratedRecipe | null> {
  const ingredient = params.favoriteIngredients?.[0]
    ? sanitizeIngredient(params.favoriteIngredients[0])
    : modeToIngredient(params.mode);

  const list = await getJson<{ meals: MealSummary[] | null }>(`${BASE}/filter.php?i=${encodeURIComponent(ingredient)}`);
  const meals = (list.meals ?? []).filter((m) => m.strMeal !== params.excludeTitle);

  if (meals.length === 0) {
    const randomRes = await getJson<{ meals: MealDetail[] | null }>(`${BASE}/random.php`);
    const randomMeal = randomRes.meals?.[0];
    if (!randomMeal) return null;

    const randomSteps = normalizeSteps(randomMeal.strInstructions ?? '');
    const randomIngredients = buildIngredients(randomMeal);
    if (randomSteps.length < 3 || randomIngredients.length < 3) return null;

    const macros = macroByMode(params.mode);
    return {
      title: randomMeal.strMeal,
      calories: macros.calories,
      protein: macros.protein,
      fat: macros.fat,
      carbs: macros.carbs,
      time: '15-20 min',
      servingSize: '1 serving',
      ingredients: randomIngredients,
      steps: randomSteps
    };
  }

  const idx = Math.abs(Number(params.nonce) || 0) % meals.length;
  const selected = meals[idx];

  const detailRes = await getJson<{ meals: MealDetail[] | null }>(`${BASE}/lookup.php?i=${selected.idMeal}`);
  const meal = detailRes.meals?.[0];

  if (!meal) {
    return null;
  }

  const steps = normalizeSteps(meal.strInstructions ?? '');
  const ingredients = buildIngredients(meal);

  if (steps.length < 3 || ingredients.length < 3) {
    return null;
  }

  const macros = macroByMode(params.mode);

  return {
    title: meal.strMeal,
    calories: macros.calories,
    protein: macros.protein,
    fat: macros.fat,
    carbs: macros.carbs,
    time: '15-20 min',
    servingSize: '1 serving',
    ingredients,
    steps
  };
}
