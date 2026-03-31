import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const modeMap: Record<string, string> = {
  'weight-loss': 'Похудение',
  protein: 'Белок',
  kids: 'Детский',
  quick: 'Быстрый',
  random: 'Рандом'
};

export default function ResultPage() {
  const router = useRouter();
  const modeParam = typeof router.query.mode === 'string' ? router.query.mode : '';
  const modeLabel = modeMap[modeParam] ?? 'Неизвестный режим';

  return (
    <>
      <Head>
        <title>Результат режима</title>
      </Head>

      <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
        <section className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Выбран режим</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900">{modeLabel}</h1>

          <Link
            href="/"
            className="mt-10 inline-flex rounded-full border border-zinc-300 px-6 py-3 text-base font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
          >
            Назад
          </Link>
        </section>
      </main>
    </>
  );
}
