import type { NextApiRequest, NextApiResponse } from 'next';
import { getRecipeFromDataset } from '@/lib/recipeDataset';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const mode = typeof req.query.mode === 'string' ? req.query.mode : 'random';
  const nonce = typeof req.query.nonce === 'string' ? req.query.nonce : String(Date.now());
  const excludeTitle = typeof req.query.excludeTitle === 'string' ? req.query.excludeTitle : undefined;
  const favoriteRecipe = typeof req.query.favoriteRecipe === 'string' ? req.query.favoriteRecipe : undefined;
  const favoriteIngredients =
    typeof req.query.favoriteIngredients === 'string'
      ? req.query.favoriteIngredients.split('|').map((item) => item.trim()).filter(Boolean)
      : [];

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const recipe = getRecipeFromDataset({
    mode,
    nonce,
    excludeTitle,
    favoriteIngredients,
    favoriteRecipe
  });

  return res.status(200).json(recipe);
}
