import Head from 'next/head';
import Link from 'next/link';

const modes = [
  { key: 'weight-loss', label: 'Похудение' },
  { key: 'protein', label: 'Белок' },
  { key: 'kids', label: 'Детский' },
  { key: 'quick', label: 'Быстрый' },
  { key: 'random', label: 'Рандом' }
];

const warmedModes = new Set<string>();

function warmRecipe(mode: string) {
  if (warmedModes.has(mode)) {
    return;
  }

  warmedModes.add(mode);
  void fetch(`/api/recipe?mode=${encodeURIComponent(mode)}`).catch(() => {
    warmedModes.delete(mode);
  });
}

export default function HomeIndexPage() {
  return (
    <>
      <Head>
        <title>Твой завтрак за 10 секунд</title>
        <meta
          name="description"
          content="Минималистичный выбор режима завтрака за 10 секунд"
        />
      </Head>

      <main className="flex min-h-screen items-center justify-center bg-white px-6 py-14 sm:px-8">
        <section className="animate-fade-in w-full max-w-6xl text-center">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-6xl">
            Твой завтрак за 10 секунд
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl">
            Без мук выбора.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {modes.map((mode, index) => (
              <Link
                key={mode.key}
                href={`/result?mode=${mode.key}`}
                prefetch
                onMouseEnter={() => warmRecipe(mode.key)}
                onFocus={() => warmRecipe(mode.key)}
                className="group animate-fade-in flex min-h-40 items-center justify-center rounded-3xl border border-zinc-200 bg-white px-6 py-7 text-lg font-medium text-zinc-800 shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-zinc-300 hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="transition-transform duration-300 group-hover:scale-105">{mode.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
