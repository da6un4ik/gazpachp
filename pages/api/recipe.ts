import type { NextApiRequest, NextApiResponse } from 'next';
import { generateRecipe } from '@/lib/generateRecipe';

function fallbackApiRecipe(mode: string, nonce: string) {
  const recipes: Record<string, Array<{ title: string; imageHint: string }>> = {
    'weight-loss': [
      { title: 'Легкий омлет со шпинатом', imageHint: 'omelet' },
      { title: 'Йогурт-боул с ягодами', imageHint: 'yogurt bowl' }
    ],
    protein: [
      { title: 'Протеиновый тост с творогом', imageHint: 'toast' },
      { title: 'Яичный скрэмбл с индейкой', imageHint: 'scrambled eggs' }
    ],
    kids: [
      { title: 'Банановые мини-панкейки', imageHint: 'pancakes' },
      { title: 'Сырники с йогуртом', imageHint: 'syrniki' }
    ],
    quick: [
      { title: 'Йогурт-боул за 5 минут', imageHint: 'yogurt bowl' },
      { title: 'Тост с авокадо и яйцом', imageHint: 'avocado toast' }
    ],
    random: [
      { title: 'Овсянка с орехами и ягодами', imageHint: 'oatmeal' },
      { title: 'Омлет с овощами', imageHint: 'omelet' }
    ]
  };

  const pool = recipes[mode] ?? recipes.random;
  const idx = Math.abs(Number(nonce) || 0) % pool.length;
  const selected = pool[idx];

  return {
    title: selected.title,
    calories: 360,
    protein: 24,
    fat: 14,
    carbs: 32,
    time: '8-10 минут',
    servingSize: '1 порция (~300 г)',
    ingredients: ['Яйца — 2 шт (100 г)', 'Творог — 80 г', 'Хлеб цельнозерновой — 60 г', 'Овощи — 80 г'],
    steps: [
      'Подготовь ингредиенты и разогрей посуду.',
      'Смешай основные ингредиенты до однородности.',
      'Готовь 5–7 минут на среднем огне.',
      'Подавай сразу, добавив топпинг по вкусу.'
    ]
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mode = typeof req.query.mode === 'string' ? req.query.mode : 'random';
  const nonce = typeof req.query.nonce === 'string' ? req.query.nonce : String(Date.now());
  const excludeTitle = typeof req.query.excludeTitle === 'string' ? req.query.excludeTitle : undefined;
  const favoriteRecipe = typeof req.query.favoriteRecipe === 'string' ? req.query.favoriteRecipe : undefined;
  const favoriteIngredients = typeof req.query.favoriteIngredients === 'string'
    ? req.query.favoriteIngredients.split('|').map((item) => item.trim()).filter(Boolean)
    : [];

  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const recipe = await generateRecipe(mode, { nonce, excludeTitle, favoriteIngredients, favoriteRecipe });
    return res.status(200).json(recipe);
  } catch {
    return res.status(200).json(fallbackApiRecipe(mode, nonce));
  }
}
