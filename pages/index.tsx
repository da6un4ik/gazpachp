import Head from 'next/head';
import Link from 'next/link';

const modes = [
  { key: 'weight-loss', label: 'Похудение' },
  { key: 'protein', label: 'Протеиновый' },
  { key: 'kids', label: 'Детский' }
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
        <title>Your breakfast in 10 seconds</title>
        <meta
          name="description"
          content="Minimal breakfast mode picker in 10 seconds"
        />
      </Head>

      <main className="flex min-h-screen items-center justify-center bg-white px-6 py-14 sm:px-8">
        <section className="animate-fade-in w-full max-w-6xl text-center">
          <div className="mb-8 flex justify-center">
            <div
              aria-label="Duck logo"
              className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 shadow-[0_6px_20px_rgba(15,23,42,0.08)]"
            >
              <svg
                viewBox="0 0 64 64"
                role="img"
                aria-hidden="true"
                className="h-12 w-12 text-zinc-800"
                fill="currentColor"
              >
                <path d="M20 16c0-5 4-9 9-9 4 0 8 3 9 7 6 1 11 6 12 12 6 0 10 4 10 9 0 6-5 10-12 10H22C11 45 4 38 4 29c0-7 4-12 10-14 2-6 7-10 14-10 1 0 2 0 3 .2A11 11 0 0 0 20 16Zm8 8a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm28 7c0 1.5-1.5 3-4 3h-8v-6h8c2.5 0 4 1.5 4 3Z" />
              </svg>
            </div>
          </div>
          <div className="mb-6 flex justify-end">
            <Link href="/favorites" className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900">
              Favorite
            </Link>
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-6xl">
            Your breakfast in 10 seconds
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl">
            No decision fatigue.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
