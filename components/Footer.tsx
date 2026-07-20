export default function Footer() {
  return (
    <footer
      id="about"
      className="border-t border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left lg:px-8">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-600 text-xs font-semibold text-white">
            Q
          </span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            QBank
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          A calm, focused question bank for serious study. &copy;{" "}
          {new Date().getFullYear()} QBank.
        </p>
      </div>
    </footer>
  );
}
