export default function DashboardCards({ cards = [], loading = false }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-panel p-5 animate-pulse h-28" />
          ))
        : cards.map((card) => (
            <div key={card.label} className="glass-panel p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-caramel">{card.label}</p>
              <p className="mt-3 font-heading text-3xl text-cocoa">{card.value}</p>
            </div>
          ))}
    </div>
  );
}
