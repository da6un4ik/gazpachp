import type { GeneratedRecipe } from '@/lib/generateRecipe';

export type RecipeRecord = GeneratedRecipe & { mode: string };

const DATASET: RecipeRecord[] = [
  {
    mode: 'protein',
    title: 'Cottage Cheese Protein Toast',
    calories: 360,
    protein: 24,
    fat: 14,
    carbs: 32,
    time: '10 min',
    servingSize: '1 serving (~300 g)',
    ingredients: ['Wholegrain bread — 60 g', 'Cottage cheese — 120 g', 'Egg — 1 pc (50 g)', 'Cherry tomatoes — 80 g'],
    steps: ['Toast the bread.', 'Mix cottage cheese with herbs.', 'Cook egg to preferred doneness.', 'Top toast with cottage cheese, egg, and tomatoes.']
  },
  {
    mode: 'protein',
    title: 'Turkey Egg Scramble Bowl',
    calories: 390,
    protein: 30,
    fat: 16,
    carbs: 28,
    time: '12 min',
    servingSize: '1 serving (~320 g)',
    ingredients: ['Eggs — 2 pcs (100 g)', 'Turkey breast slices — 90 g', 'Spinach — 70 g', 'Olive oil — 5 g'],
    steps: ['Heat oil in a pan.', 'Cook turkey for 2 minutes.', 'Add spinach and wilt.', 'Add beaten eggs and scramble until set.']
  },
  {
    mode: 'weight-loss',
    title: 'Spinach Veggie Omelette',
    calories: 310,
    protein: 22,
    fat: 15,
    carbs: 18,
    time: '11 min',
    servingSize: '1 serving (~280 g)',
    ingredients: ['Eggs — 2 pcs (100 g)', 'Spinach — 80 g', 'Bell pepper — 60 g', 'Low-fat cheese — 25 g'],
    steps: ['Whisk eggs.', 'Saute vegetables for 3 minutes.', 'Pour eggs and cook until almost set.', 'Fold with cheese and serve.']
  },
  {
    mode: 'quick',
    title: '5-Minute Yogurt Berry Bowl',
    calories: 340,
    protein: 18,
    fat: 11,
    carbs: 40,
    time: '5 min',
    servingSize: '1 serving (~280 g)',
    ingredients: ['Greek yogurt — 180 g', 'Mixed berries — 90 g', 'Granola — 35 g', 'Chia seeds — 8 g'],
    steps: ['Add yogurt to a bowl.', 'Top with berries and granola.', 'Sprinkle chia seeds.', 'Serve immediately.']
  },
  {
    mode: 'quick',
    title: 'Avocado Egg Toast',
    calories: 370,
    protein: 16,
    fat: 19,
    carbs: 33,
    time: '8 min',
    servingSize: '1 serving (~300 g)',
    ingredients: ['Wholegrain toast — 60 g', 'Avocado — 80 g', 'Egg — 1 pc (50 g)', 'Lemon juice — 5 g'],
    steps: ['Toast the bread.', 'Mash avocado with lemon.', 'Cook egg.', 'Assemble and season.']
  },
  {
    mode: 'kids',
    title: 'Banana Mini Pancakes',
    calories: 330,
    protein: 12,
    fat: 10,
    carbs: 47,
    time: '15 min',
    servingSize: '1 serving (~300 g)',
    ingredients: ['Banana — 100 g', 'Egg — 1 pc (50 g)', 'Oat flour — 45 g', 'Yogurt — 60 g'],
    steps: ['Mash banana and mix with egg.', 'Add oat flour to form batter.', 'Cook mini pancakes on nonstick pan.', 'Serve with yogurt.']
  },
  {
    mode: 'random',
    title: 'Nutty Oatmeal with Apple',
    calories: 400,
    protein: 15,
    fat: 14,
    carbs: 55,
    time: '10 min',
    servingSize: '1 serving (~330 g)',
    ingredients: ['Oats — 60 g', 'Milk — 180 ml', 'Apple — 90 g', 'Peanut butter — 15 g'],
    steps: ['Cook oats in milk.', 'Dice apple and add to oatmeal.', 'Stir in peanut butter.', 'Serve warm.']
  }
];

export function getRecipeFromDataset(params: {
  mode: string;
  nonce?: string;
  excludeTitle?: string;
  favoriteIngredients?: string[];
  favoriteRecipe?: string;
}): GeneratedRecipe {
  const { mode, nonce = '0', excludeTitle, favoriteIngredients = [], favoriteRecipe } = params;

  const candidates = DATASET.filter((r) => r.mode === mode || mode === 'random').filter((r) => r.title !== excludeTitle);
  const pool = candidates.length > 0 ? candidates : DATASET;

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
