const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/catalog", label: "Catalog" },
  { href: "/admin/reports", label: "Reports" },
];

export default function AdminNav() {
  return (
    <div className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <nav className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 sm:px-6">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="flex-shrink-0 whitespace-nowrap border-b-2 border-transparent px-1 py-3 text-sm font-medium text-slate-600 transition hover:border-primary-300 hover:text-primary-700 dark:text-slate-400 dark:hover:text-primary-400"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
