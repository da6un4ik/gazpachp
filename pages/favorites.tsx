import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function FavoritesPage() {
  const [favoriteRecipe, setFavoriteRecipe] = useState('');
  const [favoriteIngredients, setFavoriteIngredients] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const recipe = window.localStorage.getItem('favoriteRecipe') ?? '';
    const ingredientsRaw = window.localStorage.getItem('favoriteIngredients');

    setFavoriteRecipe(recipe);

    if (ingredientsRaw) {
      try {
        setFavoriteIngredients(JSON.parse(ingredientsRaw) as string[]);
      } catch {
        setFavoriteIngredients([]);
      }
    }
  }, []);

  return (
    <>
      <Head>
        <title>Favorites</title>
      </Head>

      <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
        <section className="w-full max-w-3xl rounded-[2rem] border border-zinc-100 bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:p-10">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">Favorites</h1>

          <div className="mt-8 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">Favorite recipe</p>
            <p className="mt-3 text-lg text-zinc-800">{favoriteRecipe || 'No favorite recipe yet'}</p>
          </div>

          <div className="mt-5 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">Favorite ingredients</p>
            {favoriteIngredients.length === 0 ? (
              <p className="mt-3 text-zinc-700">No favorite ingredients yet</p>
            ) : (
              <ul className="mt-3 space-y-2 text-zinc-700">
                {favoriteIngredients.map((item, idx) => (
                  <li key={`${item}-${idx}`}>• {item}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                if (typeof window === 'undefined') return;
                window.localStorage.removeItem('favoriteRecipe');
                setFavoriteRecipe('');
              }}
              className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
            >
              Clear recipe
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window === 'undefined') return;
                window.localStorage.removeItem('favoriteIngredients');
                setFavoriteIngredients([]);
              }}
              className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
            >
              Clear ingredients
            </button>
            <Link
              href="/"
              className="rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Back home
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
