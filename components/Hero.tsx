export default function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-16 px-6 pb-24 pt-20 md:grid-cols-2 md:pt-28">
      <div>
        <p className="mb-4 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
          Built for focused study
        </p>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 md:text-5xl dark:text-slate-100">
          A calm place to build and practice your question banks.
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-slate-600 dark:text-slate-400">
          QBank keeps your questions organized and your study sessions
          distraction-free, so you can spend your time learning instead of
          managing spreadsheets.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <a
            href="/signup"
            className="rounded-lg bg-primary-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            Get started
          </a>
          <a
            href="#about"
            className="text-sm font-medium text-slate-600 transition hover:text-primary-700 dark:text-slate-400 dark:hover:text-primary-400"
          >
            Learn more &rarr;
          </a>
        </div>
      </div>

      <div className="relative mx-auto h-72 w-full max-w-sm md:h-80">
        <div className="absolute inset-x-6 top-8 h-full rounded-2xl border border-slate-200 bg-primary-50/60 dark:border-slate-700" />
        <div className="absolute inset-x-3 top-4 h-full rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800" />
        <div className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-600 dark:text-primary-400">
              Question 12 of 40
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              Which structure is responsible for regulating a cell&rsquo;s
              response to osmotic pressure?
            </p>
          </div>
          <div className="space-y-2">
            {["Cell membrane", "Golgi apparatus", "Contractile vacuole"].map(
              (option) => (
                <div
                  key={option}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400"
                >
                  {option}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
