export default function AdminPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <p className="mb-2 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary-700">
        Admin
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Admin Panel
      </h1>
      <p className="mt-2 max-w-xl text-slate-600">
        You&rsquo;re signed in with an admin role. Question, tag, and user
        management tools will be built out here in a later stage.
      </p>
    </main>
  );
}
