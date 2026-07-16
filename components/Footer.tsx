export default function Footer() {
  return (
    <footer id="about" className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-500">
        <p>
          QBank is currently in early development. This page will grow into a
          full study platform in upcoming stages.
        </p>
        <p className="mt-2">&copy; {new Date().getFullYear()} QBank.</p>
      </div>
    </footer>
  );
}
