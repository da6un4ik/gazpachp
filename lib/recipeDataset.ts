import fs from 'node:fs';
import path from 'node:path';
import type { GeneratedRecipe } from '@/lib/generateRecipe';

export type RecipeRecord = GeneratedRecipe & { mode: string };

let cachedDataset: RecipeRecord[] | null = null;

const FALLBACK_DATASET: RecipeRecord[] = [
  {
    mode: 'protein',
    title: 'Cottage Cheese Protein Toast',
    description: 'Savory toast with creamy cottage cheese and egg for a filling start.',
    calories: 360,
    protein: 24,
    fat: 14,
    carbs: 32,
    time: '10 min',
    servingSize: '1 serving (~300 g)',
    ingredients: ['Wholegrain bread — 60 g', 'Cottage cheese — 120 g', 'Egg — 1 pc (50 g)', 'Cherry tomatoes — 80 g'],
    steps: ['Toast the bread.', 'Mix cottage cheese with herbs.', 'Cook egg to preferred doneness.', 'Top toast with cottage cheese, egg, and tomatoes.'],
    whyFitsGoal: 'High protein and balanced fats support satiety and muscle recovery.',
    variations: ['Swap bread for rye crispbread.', 'Add sliced avocado for extra healthy fats.']
  }
];

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function toNumber(value: string | undefined): number {
  const parsed = Number((value ?? '').replace(',', '.').match(/-?\d+(\.\d+)?/)?.[0]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function splitList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .replace(/[\[\]']/g, '')
    .split(/\|\||,|;/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function pickMode(title: string): string {
  const t = title.toLowerCase();

  if (t.includes('protein') || t.includes('egg') || t.includes('turkey')) return 'protein';
  if (t.includes('quick') || t.includes('5-minute') || t.includes('toast')) return 'quick';
  if (t.includes('kid') || t.includes('pancake')) return 'kids';
  if (t.includes('light') || t.includes('low') || t.includes('veggie')) return 'weight-loss';
  return 'random';
}

function normalizeRow(headers: string[], row: string[]): RecipeRecord | null {
  const map = Object.fromEntries(headers.map((h, i) => [h.toLowerCase().trim(), row[i] ?? '']));

  const title =
    map.name ||
    map.title ||
    map.recipename ||
    map.recipe_name ||
    map.recipe ||
    '';

  if (!title) {
    return null;
  }

  const ingredients =
    splitList(map.ingredients) ||
    splitList(map.recipeingredientparts) ||
    splitList(map.cleaned_ingredients);

  const steps =
    splitList(map.instructions) ||
    splitList(map.recipeinstructions) ||
    splitList(map.directions);

  if (ingredients.length < 3 || steps.length < 3) {
    return null;
  }

  return {
    mode: pickMode(title),
    title,
    description: map.description || map.summary || 'Simple homemade breakfast with balanced taste and texture.',
    calories: toNumber(map.calories || map.calories_kcal || map.kcal) || 350,
    protein: toNumber(map.protein || map.protein_g) || 20,
    fat: toNumber(map.fat || map.fat_g) || 12,
    carbs: toNumber(map.carbs || map.carbohydrate || map.carbs_g) || 30,
    time: map.time || map.total_time || '15 min',
    servingSize: map.servings || map.servingsize || '1 serving (~300 g)',
    ingredients,
    steps: steps.slice(0, 6),
    whyFitsGoal:
      map.whyfitsgoal ||
      map.goal_reason ||
      'Recipe matches the selected goal with practical ingredients and balanced macros.',
    variations: splitList(map.variations).slice(0, 2).length > 0
      ? splitList(map.variations).slice(0, 2)
      : ['Use seasonal vegetables for flavor changes.', 'Adjust spices to taste without changing macros much.']
  };
}

function loadDataset(): RecipeRecord[] {
  if (cachedDataset) {
    return cachedDataset;
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'recipes.csv');
    if (!fs.existsSync(filePath)) {
      cachedDataset = FALLBACK_DATASET;
      return cachedDataset;
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw.split(/\r?\n/).filter(Boolean);

    if (lines.length < 2) {
      cachedDataset = FALLBACK_DATASET;
      return cachedDataset;
    }

    const headers = parseCsvLine(lines[0]);
    const parsed = lines
      .slice(1)
      .map((line) => normalizeRow(headers, parseCsvLine(line)))
      .filter((row): row is RecipeRecord => Boolean(row));

    cachedDataset = parsed.length > 0 ? parsed : FALLBACK_DATASET;
    return cachedDataset;
  } catch {
    cachedDataset = FALLBACK_DATASET;
    return cachedDataset;
  }
}

export function getRecipeFromDataset(params: {
  mode: string;
  nonce?: string;
  excludeTitle?: string;
  favoriteIngredients?: string[];
  favoriteRecipe?: string;
}): GeneratedRecipe {
  const { mode, nonce = '0', excludeTitle, favoriteIngredients = [], favoriteRecipe } = params;
  const dataset = loadDataset();

  const byMode = dataset.filter((r) => (mode === 'random' ? true : r.mode === mode));
  const candidates = byMode.filter((r) => r.title !== excludeTitle);

  const pool =
    candidates.length > 1
      ? candidates
      : dataset.filter((r) => r.title !== excludeTitle).length > 0
        ? dataset.filter((r) => r.title !== excludeTitle)
        : dataset;

  const scored = pool
    .map((recipe) => {
      const ingredientHits = favoriteIngredients.reduce((acc, fav) => {
        const hit = recipe.ingredients.some((ing) => ing.toLowerCase().includes(fav.toLowerCase()));
        return acc + (hit ? 1 : 0);
      }, 0);
      const recipeBoost = favoriteRecipe && recipe.title.toLowerCase().includes(favoriteRecipe.toLowerCase()) ? 2 : 0;

      return { recipe, score: ingredientHits + recipeBoost };
    })
    .sort((a, b) => b.score - a.score);

  const bestScore = scored[0]?.score ?? 0;
  const top = scored.filter((x) => x.score === bestScore).map((x) => x.recipe);
  const idx = Math.abs(Number(nonce) || 0) % top.length;

  const selected = top[idx] ?? pool[Math.abs(Number(nonce) || 0) % pool.length];
  const { mode: _mode, ...rest } = selected;
  return rest;
}
