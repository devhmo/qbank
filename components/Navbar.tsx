export default function Navbar() {
  return (
    <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-semibold text-white">
            Q
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            QBank
          </span>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#features" className="transition hover:text-primary-700">
            Features
          </a>
          <a href="#about" className="transition hover:text-primary-700">
            About
          </a>
          <button
            type="button"
            disabled
            title="Coming in a later stage"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white opacity-50 transition"
          >
            Sign in
          </button>
        </nav>
      </div>
    </header>
  );
}
