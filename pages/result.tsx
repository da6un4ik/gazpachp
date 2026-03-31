import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

type Recipe = {
  dish: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  time: string;
  steps: string[];
};

const recipesByMode: Record<string, Recipe[]> = {
  'weight-loss': [
    {
      dish: 'Йогурт-боул с ягодами и чиа',
      calories: 280,
      protein: 19,
      fat: 9,
      carbs: 30,
      time: '8 минут',
      steps: [
        'Выложи греческий йогурт в глубокую миску.',
        'Добавь ягоды и 1 чайную ложку семян чиа.',
        'Посыпь орехами и щепоткой корицы.',
        'Перемешай верхний слой и сразу подавай.'
      ]
    }
  ],
  protein: [
    {
      dish: 'Омлет с индейкой и шпинатом',
      calories: 360,
      protein: 32,
      fat: 20,
      carbs: 11,
      time: '10 минут',
      steps: [
        'Взбей 3 яйца с щепоткой соли.',
        'Обжарь ломтики индейки 1–2 минуты.',
        'Добавь шпинат и яйца, готовь на среднем огне.',
        'Сложи омлет пополам и подавай.'
      ]
    }
  ],
  kids: [
    {
      dish: 'Банановые мини-панкейки',
      calories: 330,
      protein: 12,
      fat: 10,
      carbs: 47,
      time: '12 минут',
      steps: [
        'Разомни банан вилкой.',
        'Добавь яйцо и 3 столовые ложки овсяной муки.',
        'Выпекай маленькие панкейки по 1 минуте с каждой стороны.',
        'Подавай с йогуртом или мягкими ягодами.'
      ]
    }
  ],
  quick: [
    {
      dish: 'Тост с авокадо и яйцом',
      calories: 340,
      protein: 14,
      fat: 18,
      carbs: 29,
      time: '7 минут',
      steps: [
        'Поджарь цельнозерновой хлеб в тостере.',
        'Разомни авокадо с солью и лимоном.',
        'Свари яйцо вкрутую или пашот.',
        'Собери тост и добавь перец по вкусу.'
      ]
    }
  ],
  random: [
    {
      dish: 'Овсянка с яблоком и арахисовой пастой',
      calories: 390,
      protein: 15,
      fat: 14,
      carbs: 52,
      time: '9 минут',
      steps: [
        'Свари овсяные хлопья на воде или молоке.',
        'Нарежь яблоко тонкими кубиками.',
        'Добавь ложку арахисовой пасты и яблоко в готовую кашу.',
        'Сверху посыпь корицей и перемешай.'
      ]
    }
  ]
};

const modeMap: Record<string, string> = {
  'weight-loss': 'Похудение',
  protein: 'Белок',
  kids: 'Детский',
  quick: 'Быстрый',
  random: 'Рандом'
};

function pickRecipe(mode: string, recipeSeed: number) {
  const pool = recipesByMode[mode] ?? recipesByMode.random;
  const index = Math.abs(recipeSeed) % pool.length;
  return pool[index];
}

export default function ResultPage() {
  const router = useRouter();
  const modeParam = typeof router.query.mode === 'string' ? router.query.mode : 'random';
  const label = modeMap[modeParam] ?? modeMap.random;
  const recipeSeed = Number(router.query.r ?? 0);
  const recipe = pickRecipe(modeParam, Number.isNaN(recipeSeed) ? 0 : recipeSeed);

  return (
    <>
      <Head>
        <title>Результат режима</title>
      </Head>

      <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
        <section className="w-full max-w-3xl rounded-[2rem] border border-zinc-100 bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:p-10">
          <p className="text-center text-sm uppercase tracking-[0.2em] text-zinc-500">Режим: {label}</p>
          <h1 className="mt-3 text-center text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            {recipe.dish}
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
                key={step}
                className="rounded-2xl border border-zinc-100 bg-zinc-50/70 px-4 py-3 text-zinc-700"
              >
                <span className="mr-2 font-medium text-zinc-900">{index + 1}.</span>
                {step}
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={`/result?mode=${modeParam}&r=${(Number.isNaN(recipeSeed) ? 0 : recipeSeed) + 1}`}
              className="inline-flex w-full justify-center rounded-full bg-zinc-900 px-6 py-3 text-base font-medium text-white transition hover:bg-zinc-800 sm:w-auto"
            >
              Другой рецепт
            </Link>
            <Link
              href="/"
              className="inline-flex w-full justify-center rounded-full border border-zinc-300 px-6 py-3 text-base font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 sm:w-auto"
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
      <p className="mt-2 text-lg font-semibold tracking-tight text-zinc-900">{value}</p>
    </div>
  );
}
