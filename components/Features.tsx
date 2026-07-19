const features = [
  {
    title: "Organize by topic",
    description:
      "Group questions into banks and categories that mirror how you actually study.",
  },
  {
    title: "Practice with focus",
    description:
      "A clean, single-question view keeps your attention on the material, not the interface.",
  },
  {
    title: "Track your progress",
    description:
      "See where you're strong and where you need another pass, at a glance.",
  },
];

export default function Features() {
  return (
    <section id="features" className="border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Everything stays out of your way
        </h2>
        <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-400">
          QBank is intentionally simple. No clutter, no unnecessary steps —
          just your questions, ready when you are.
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title}>
              <div className="mb-4 h-1 w-10 rounded-full bg-primary-500" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
