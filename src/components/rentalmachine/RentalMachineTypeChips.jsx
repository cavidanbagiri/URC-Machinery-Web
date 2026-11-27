// src/components/rentalmachine/RentalMachineTypeChips.jsx
//
// **Kiralık Makineler** sekmesindeki makine tipi şeridi. Eski büyük
// "Makine Tipine Göre İstatistik" panelinin yerini alır: aynı `type_stats`
// sayaçlarını tek satırda, küçük ve okunaklı rozetler olarak gösterir.
//
// Bir tipe tıklamak listeyi `machine_type_id` filtresiyle daraltır; aynı tipe
// tekrar tıklamak filtreyi kaldırır. Sayaçlar tip filtresi hariç diğer
// filtreleri uygular (sunucu tarafında hesaplanır), bu yüzden seçili tip
// şeritten kaybolmaz.
export default function RentalMachineTypeChips({
  stats,
  activeTypeId,
  onSelectType,
}) {
  const rows = (Array.isArray(stats) ? stats : [])
    .map((entry) => ({ ...entry, total: Number(entry.total) || 0 }))
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.total - a.total || a.type_name.localeCompare(b.type_name, 'tr'));

  // Kayıt yoksa şerit hiç çizilmez: boş bir filtre satırı yer kaplamasın.
  if (rows.length === 0) return null;

  const totalAll = rows.reduce((sum, entry) => sum + entry.total, 0);
  const chipClass = (active) =>
    `rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
      active
        ? 'border-blue-600 bg-blue-600 text-white'
        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
    }`;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        Makine tipi
      </span>

      <button
        type="button"
        aria-pressed={!activeTypeId}
        onClick={() => onSelectType?.('')}
        className={chipClass(!activeTypeId)}
      >
        Tümü
        <span className="ml-1 tabular-nums opacity-70">{totalAll}</span>
      </button>

      {rows.map((entry) => {
        const clickable = entry.type_id !== null && entry.type_id !== undefined;
        const active =
          clickable && String(entry.type_id) === String(activeTypeId);

        return (
          <button
            key={entry.type_id ?? entry.type_name}
            type="button"
            disabled={!clickable}
            aria-pressed={clickable ? active : undefined}
            title={
              clickable
                ? active
                  ? `${entry.type_name} filtresini kaldır`
                  : `${entry.type_name} kiralamalarını listele`
                : 'Makine tipi atanmamış kayıtlar'
            }
            onClick={() => onSelectType?.(active ? '' : entry.type_id)}
            className={`${chipClass(active)} ${
              clickable ? '' : 'cursor-default opacity-70'
            }`}
          >
            <span className="inline-block max-w-[150px] truncate align-bottom">
              {entry.type_name}
            </span>
            <span className="ml-1 tabular-nums opacity-70">{entry.total}</span>
          </button>
        );
      })}
    </div>
  );
}
