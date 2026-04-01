import type { NextApiRequest, NextApiResponse } from 'next';
import { generateRecipe } from '@/lib/generateRecipe';

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

  const tried = new Set<string>();
  let currentExclude = excludeTitle;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const recipe = await generateRecipe(mode, {
        nonce: `${nonce}-${attempt}`,
        excludeTitle: currentExclude,
        favoriteIngredients,
        favoriteRecipe
      });

      if (!tried.has(recipe.title)) {
        return res.status(200).json(recipe);
      }

      tried.add(recipe.title);
      currentExclude = recipe.title;
    } catch {
      // retry generation with a new nonce
    }
  }

  return res.status(500).json({ error: 'Could not generate a new recipe. Try again.' });
}
