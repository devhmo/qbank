export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Page not found
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
        </p>
        <a
          href="/"
          className="mt-6 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
