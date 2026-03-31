import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GeneratedRecipe } from '@/lib/generateRecipe';

const modeMap: Record<string, string> = {
  'weight-loss': 'Похудение',
  protein: 'Белок',
  kids: 'Детский',
  quick: 'Быстрый',
  random: 'Рандом'
};

export default function ResultPage() {
  const router = useRouter();
  const modeParam = typeof router.query.mode === 'string' ? router.query.mode : 'random';
  const modeLabel = modeMap[modeParam] ?? modeMap.random;

  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryMode = useMemo(() => encodeURIComponent(modeParam), [modeParam]);

  const loadRecipe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/recipe?mode=${queryMode}`);
      const payload = (await response.json()) as GeneratedRecipe | { error?: string };

      if (!response.ok) {
        throw new Error(
          typeof (payload as { error?: string }).error === 'string'
            ? (payload as { error: string }).error
            : 'Не удалось получить рецепт.'
        );
      }

      setRecipe(payload as GeneratedRecipe);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Ошибка загрузки рецепта.');
      setRecipe(null);
    } finally {
      setIsLoading(false);
    }
  }, [queryMode]);

  useEffect(() => {
    void loadRecipe();
  }, [loadRecipe]);

  if (isLoading) {
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
        <section className="animate-fade-in w-full max-w-3xl rounded-[2rem] border border-zinc-100 bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:p-10">
          <p className="text-center text-sm uppercase tracking-[0.2em] text-zinc-500">Режим: {modeLabel}</p>

          {!error && recipe && (
            <>
              <div className="mt-6 overflow-hidden rounded-3xl">
                <img
                  src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80"
                  alt="Временное изображение блюда"
                  className="h-56 w-full object-cover sm:h-64"
                />
              </div>

              <h1 className="mt-4 text-center text-3xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-4xl">
                {recipe.title}
              </h1>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <StatCard label="Ккал" value={recipe.calories.toString()} />
                <StatCard label="Белки" value={`${recipe.protein} г`} />
                <StatCard label="Жиры" value={`${recipe.fat} г`} />
                <StatCard label="Углеводы" value={`${recipe.carbs} г`} />
                <StatCard label="Время" value={recipe.time} className="col-span-2 sm:col-span-1" />
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
                void loadRecipe();
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
