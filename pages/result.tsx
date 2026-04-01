import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GeneratedRecipe } from '@/lib/generateRecipe';

const modeMap: Record<string, string> = {
  'weight-loss': 'Похудение',
  protein: 'Белок',
  kids: 'Детский',
  quick: 'Быстрый',
  random: 'Рандом'
};

const recipeCache = new Map<string, GeneratedRecipe>();

function fallbackClientRecipe(mode: string, nonce: number): GeneratedRecipe {
  const variants: Record<string, string[]> = {
    'weight-loss': ['Легкий омлет со шпинатом', 'Йогурт-боул с ягодами'],
    protein: ['Протеиновый тост с творогом', 'Яичный скрэмбл с индейкой'],
    kids: ['Банановые мини-панкейки', 'Сырники с йогуртом'],
    quick: ['Йогурт-боул за 5 минут', 'Тост с авокадо и яйцом'],
    random: ['Овсянка с орехами и ягодами', 'Омлет с овощами']
  };

  const pool = variants[mode] ?? variants.random;
  const title = pool[Math.abs(nonce) % pool.length];

  return {
    title,
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

function getRecipeImageByTitle(title: string) {
  const query = encodeURIComponent(`${title}, breakfast dish, food`);
  return `https://source.unsplash.com/1200x800/?${query}`;
}

export default function ResultPage() {
  const router = useRouter();
  const modeParam = typeof router.query.mode === 'string' ? router.query.mode : 'random';
  const modeLabel = modeMap[modeParam] ?? modeMap.random;

  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(() => Date.now());
  const [favoriteIngredients, setFavoriteIngredients] = useState<string[]>([]);
  const [favoriteRecipe, setFavoriteRecipe] = useState<string>('');

  const queryMode = useMemo(() => encodeURIComponent(modeParam), [modeParam]);
  const abortRef = useRef<AbortController | null>(null);
  const lastTitleRef = useRef<string>('');


  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const savedIngredients = window.localStorage.getItem('favoriteIngredients');
    const savedRecipe = window.localStorage.getItem('favoriteRecipe');

    if (savedIngredients) {
      try {
        setFavoriteIngredients(JSON.parse(savedIngredients) as string[]);
      } catch {
        setFavoriteIngredients([]);
      }
    }

    if (savedRecipe) {
      setFavoriteRecipe(savedRecipe);
    }
  }, []);

  const loadRecipe = useCallback(
    async (forceRefresh = false) => {
      const cacheKey = `${queryMode}:${nonce}`;
      const cachedRecipe = recipeCache.get(cacheKey);

      if (!forceRefresh && cachedRecipe) {
        setRecipe(cachedRecipe);
        setIsLoading(false);
        setError(null);
        return;
      }

      if (recipe) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(
          `/api/recipe?mode=${queryMode}&nonce=${nonce}&excludeTitle=${encodeURIComponent(lastTitleRef.current)}&favoriteRecipe=${encodeURIComponent(favoriteRecipe)}&favoriteIngredients=${encodeURIComponent(favoriteIngredients.join('|'))}`,
          {
            signal: controller.signal
          }
        );

        const payload = (await response.json()) as GeneratedRecipe;

        if (!response.ok) {
          const fallback = fallbackClientRecipe(modeParam, nonce);
          recipeCache.set(cacheKey, fallback);
          setRecipe(fallback);
          lastTitleRef.current = fallback.title;
          return;
        }

        const nextRecipe = payload;
        recipeCache.set(cacheKey, nextRecipe);
        setRecipe(nextRecipe);
        lastTitleRef.current = nextRecipe.title;
      } catch (loadError) {
        if ((loadError as Error).name === 'AbortError') {
          return;
        }

        const fallback = fallbackClientRecipe(modeParam, nonce);
        recipeCache.set(cacheKey, fallback);
        setRecipe(fallback);
        lastTitleRef.current = fallback.title;
        setError(null);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [favoriteIngredients, favoriteRecipe, modeParam, nonce, queryMode, recipe]
  );

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    void loadRecipe();

    return () => {
      abortRef.current?.abort();
    };
  }, [loadRecipe, router.isReady]);

  if (isLoading && !recipe) {
    return (
      <>
        <Head>
          <title>Результат режима</title>
        </Head>

        <main className="animate-fade-in flex min-h-screen flex-col items-center justify-center gap-5 bg-white px-6 py-12 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
          <p className="text-xl font-medium tracking-tight text-zinc-800">Готовим завтрак...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Результат режима</title>
      </Head>

      <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
        <section className="animate-fade-in relative w-full max-w-3xl rounded-[2rem] border border-zinc-100 bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:p-10">
          {isRefreshing && (
            <div className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-xs text-zinc-600">
              <span className="h-3 w-3 animate-spin rounded-full border border-zinc-300 border-t-zinc-700" />
              Обновляем...
            </div>
          )}

          <p className="text-center text-sm uppercase tracking-[0.2em] text-zinc-500">Режим: {modeLabel}</p>
          {(favoriteRecipe || favoriteIngredients.length > 0) && (
            <p className="mt-2 text-center text-xs text-zinc-500">
              Избранное: {favoriteRecipe || 'рецепт не выбран'}{favoriteIngredients.length > 0 ? ` · ингредиенты: ${favoriteIngredients.slice(0, 3).join(', ')}` : ''}
            </p>
          )}

          {!error && recipe && (
            <>
              <div className="mt-6 overflow-hidden rounded-3xl">
                <img
                  src={getRecipeImageByTitle(recipe.title)}
                  alt={`Фото блюда: ${recipe.title}`}
                  className="h-56 w-full object-cover sm:h-64"
                />
              </div>

              <h1 className="mt-4 text-center text-3xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-4xl">
                {recipe.title}
              </h1>
              <p className="mt-2 text-center text-sm text-zinc-500">КБЖУ указаны на 1 порцию</p>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <StatCard label="Ккал" value={recipe.calories.toString()} />
                <StatCard label="Белки" value={`${recipe.protein} г`} />
                <StatCard label="Жиры" value={`${recipe.fat} г`} />
                <StatCard label="Углеводы" value={`${recipe.carbs} г`} />
                <StatCard label="Время" value={recipe.time} className="col-span-1" />
                <StatCard label="Порция" value={recipe.servingSize} className="col-span-2 sm:col-span-2" />
              </div>

              <div className="mt-8 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">Ингредиенты</p>
                <ul className="mt-3 space-y-2 text-zinc-700">
                  {recipe.ingredients.map((item, idx) => (
                    <li key={`${item}-${idx}`} className="leading-relaxed">• {item}</li>
                  ))}
                </ul>
              </div>

              <ol className="mt-8 space-y-3">
                {recipe.steps.slice(0, 6).map((step, index) => (
                  <li
                    key={`${step}-${index}`}
                    className="rounded-2xl border border-zinc-100 bg-zinc-50/70 px-4 py-3 text-zinc-700 transition-colors duration-200 hover:bg-zinc-50"
                  >
                    <span className="mr-2 font-medium text-zinc-900">{index + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    const next = recipe.ingredients.slice(0, 6);
                    setFavoriteIngredients(next);
                    if (typeof window !== 'undefined') {
                      window.localStorage.setItem('favoriteIngredients', JSON.stringify(next));
                    }
                  }}
                  className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
                >
                  Ингредиенты в избранное
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFavoriteRecipe(recipe.title);
                    if (typeof window !== 'undefined') {
                      window.localStorage.setItem('favoriteRecipe', recipe.title);
                    }
                  }}
                  className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
                >
                  Рецепт в избранное
                </button>
              </div>

            </>
          )}

          {error && (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-center">
              <p className="text-base leading-relaxed text-red-700">{error}</p>
            </div>
          )}

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setNonce(Date.now());
              }}
              className="inline-flex w-full justify-center rounded-full bg-zinc-900 px-6 py-3 text-base font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-lg sm:w-auto"
            >
              Другой рецепт
            </button>
            <Link
              href="/"
              className="inline-flex w-full justify-center rounded-full border border-zinc-300 px-6 py-3 text-base font-medium text-zinc-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-400 hover:text-zinc-900 hover:shadow-sm sm:w-auto"
            >
              Назад
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
  className = ''
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 ${className}`}>
      <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-semibold leading-snug tracking-tight text-zinc-900">{value}</p>
    </div>
  );
}
