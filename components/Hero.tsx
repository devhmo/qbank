export default function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-16 md:grid-cols-2 md:gap-16 md:pb-24 md:pt-20 lg:px-8 lg:pt-28">
      <div className="text-center md:text-left">
        <p className="mb-4 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
          Built for focused study
        </p>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl dark:text-slate-100">
          A calm place to build and practice your question banks.
        </h1>
        <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-slate-600 md:mx-0 dark:text-slate-400">
          QBank keeps your questions organized and your study sessions
          distraction-free, so you can spend your time learning instead of
          managing spreadsheets.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center md:justify-start">
          <a
            href="/signup"
            className="w-full rounded-lg bg-primary-600 px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-primary-700 sm:w-auto"
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
        <div className="absolute inset-x-6 top-8 h-full rounded-2xl border border-slate-200 bg-primary-50/60 dark:border-slate-700 dark:bg-primary-900/10" />
        <div className="absolute inset-x-3 top-4 h-full rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800" />
        <div className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-primary-600 dark:text-primary-400">
                Question 12 of 40
              </p>
              <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div className="h-full w-[30%] rounded-full bg-primary-500" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
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
