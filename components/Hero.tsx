import { heroContent } from '@/lib/content';

export function Hero() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-24 sm:px-10 sm:py-32">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">{heroContent.eyebrow}</p>

      <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-6xl">
        {heroContent.title}
      </h1>

      <p className="max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl">{heroContent.description}</p>

      <div className="flex flex-wrap items-center gap-4 pt-4">
        <button className="rounded-full bg-zinc-900 px-7 py-3 text-base font-medium text-white transition hover:bg-zinc-800">
          {heroContent.ctaPrimary}
        </button>
        <button className="rounded-full border border-zinc-300 px-7 py-3 text-base font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900">
          {heroContent.ctaSecondary}
        </button>
      </div>
    </section>
  );
}
