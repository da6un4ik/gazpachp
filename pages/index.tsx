import Head from 'next/head';
import Link from 'next/link';

const modes = [
  { key: 'weight-loss', label: 'Похудение' },
  { key: 'protein', label: 'Белок' },
  { key: 'kids', label: 'Детский' },
  { key: 'quick', label: 'Быстрый' },
  { key: 'random', label: 'Рандом' }
];

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

      <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
        <section className="w-full max-w-5xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-6xl">
            Твой завтрак за 10 секунд
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-600 sm:text-xl">
            Без мук выбора.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {modes.map((mode) => (
              <Link
                key={mode.key}
                href={`/result?mode=${mode.key}`}
                className="group flex min-h-36 items-center justify-center rounded-3xl border border-zinc-200 bg-white px-5 py-6 text-lg font-medium text-zinc-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                <span className="transition group-hover:scale-105">{mode.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
