export default function CreatorDashboardPage() {
  const menuItems = [
    "Opdrachten",
    "Mijn content",
    "Verdiensten",
    "Chat",
    "Profiel",
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl gap-6 px-6 py-10">
      <aside className="w-64 rounded-2xl border border-border bg-card/70 p-4 shadow-2xl shadow-black/20 backdrop-blur">
        <p className="text-xs uppercase tracking-wide text-muted">
          Creator Panel
        </p>
        <nav className="mt-5 space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={item}
              type="button"
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                index === 0
                  ? "bg-accent text-white"
                  : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <section className="flex-1 rounded-2xl border border-border bg-card/70 p-8 shadow-2xl shadow-black/20 backdrop-blur">
        <p className="text-sm text-muted">Opdrachten</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Jouw actieve creator werkruimte
        </h1>
        <p className="mt-3 text-sm text-muted">
          Dit is een eenvoudige dashboard shell voor opdrachten, content,
          verdiensten en profielbeheer.
        </p>
      </section>
    </main>
  );
}
