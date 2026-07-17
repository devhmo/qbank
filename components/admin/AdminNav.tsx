const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/catalog", label: "Catalog" },
];

export default function AdminNav() {
  return (
    <div className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl gap-6 px-6">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="border-b-2 border-transparent px-1 py-3 text-sm font-medium text-slate-600 transition hover:border-primary-300 hover:text-primary-700"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
