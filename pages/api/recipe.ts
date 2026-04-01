import type { NextApiRequest, NextApiResponse } from 'next';
import { generateRecipe } from '@/lib/generateRecipe';

function fallbackApiRecipe(mode: string) {
  const labels: Record<string, string> = {
    'weight-loss': 'Легкий омлет со шпинатом',
    protein: 'Протеиновый тост с творогом',
    kids: 'Банановые мини-панкейки',
    quick: 'Йогурт-боул за 5 минут',
    random: 'Овсянка с орехами и ягодами'
  };

  return {
    title: labels[mode] ?? labels.random,
    calories: 360,
    protein: 24,
    fat: 14,
    carbs: 32,
    time: '8-10 минут',
    steps: [
      'Подготовь ингредиенты и разогрей посуду.',
      'Смешай основные ингредиенты до однородности.',
      'Готовь 5–7 минут на среднем огне.',
      'Подавай сразу, добавив топпинг по вкусу.'
    ]
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const mode = typeof req.query.mode === 'string' ? req.query.mode : '';

  if (!mode) {
    return res.status(400).json({ error: 'Query parameter "mode" is required' });
  }

  try {
    const recipe = await generateRecipe(mode);
    return res.status(200).json(recipe);
  } catch {
    return res.status(200).json(fallbackApiRecipe(mode));
  }
}
