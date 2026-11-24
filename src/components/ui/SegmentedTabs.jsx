// src/components/ui/SegmentedTabs.jsx
// Sayfa içi sekme grubu ("Mevcut" / "Arşiv"). Mazot defterindeki
// (FuelLogs.jsx) sekme görünümünün ortak hâli: aynı kenarlık, aynı aktif
// renk, aynı sayaç rozeti. Sayfa değiştirmeyen, yalnızca listeyi bölen
// sekmeler için kullanılır (URL'e yazılmaz).
export default function SegmentedTabs({ tabs, value, onChange, ariaLabel }) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm"
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
              active
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {tab.label}
            {tab.count !== undefined && tab.count !== null && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
