// src/components/machines/MachineCategoryCards.jsx
import FlaticonIcon from '../ui/FlaticonIcon';

const TYPE_ICONS = {
  forklift: 'forklift',
  jenerator: 'bolt',
  kompresor: 'wind',
  'binek arac': 'car-side',
  manlift: 'ski-lift',
  tir: 'truck-container',
  otobus: 'bus',
  minibus: 'bus-alt',
  'backhoe-loader': 'digging',
  excavator: 'excavator',
  'su tankeri': 'tank-water',
  traktor: 'tractor',
  'mini loader': 'truck-box',
  'hi-up': 'elevator',
  'mobil vinc': 'truck-tow',
  vidanjor: 'waste-pollution',
  kamyonet: 'truck-pickup',
};

const TONES = [
  {
    card: 'border-blue-100 bg-blue-50/50 hover:border-blue-300',
    icon: 'bg-blue-100 text-blue-700',
    value: 'text-blue-700',
  },
  {
    card: 'border-emerald-100 bg-emerald-50/50 hover:border-emerald-300',
    icon: 'bg-emerald-100 text-emerald-700',
    value: 'text-emerald-700',
  },
  {
    card: 'border-amber-100 bg-amber-50/50 hover:border-amber-300',
    icon: 'bg-amber-100 text-amber-700',
    value: 'text-amber-700',
  },
  {
    card: 'border-violet-100 bg-violet-50/50 hover:border-violet-300',
    icon: 'bg-violet-100 text-violet-700',
    value: 'text-violet-700',
  },
  {
    card: 'border-rose-100 bg-rose-50/50 hover:border-rose-300',
    icon: 'bg-rose-100 text-rose-700',
    value: 'text-rose-700',
  },
  {
    card: 'border-cyan-100 bg-cyan-50/50 hover:border-cyan-300',
    icon: 'bg-cyan-100 text-cyan-700',
    value: 'text-cyan-700',
  },
  {
    card: 'border-orange-100 bg-orange-50/50 hover:border-orange-300',
    icon: 'bg-orange-100 text-orange-700',
    value: 'text-orange-700',
  },
  {
    card: 'border-indigo-100 bg-indigo-50/50 hover:border-indigo-300',
    icon: 'bg-indigo-100 text-indigo-700',
    value: 'text-indigo-700',
  },
];

const WRAP_CLASS = 'flex flex-wrap gap-1.5';

const normalizeTypeName = (name) =>
  String(name ?? '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c');

const getTypeIcon = (name) => TYPE_ICONS[normalizeTypeName(name)] || 'package';

export default function MachineCategoryCards({
  pivot,
  loading = false,
  error = null,
  activeTypeId = '',
  onSelectType,
  onRefresh,
}) {
  const rows = Array.isArray(pivot?.rows) ? pivot.rows : [];

  const categories = rows
    .filter((row) => Number(row.total) > 0)
    .sort((a, b) => Number(b.total) - Number(a.total))
    .map((row, index) => ({
      type_id: row.type_id,
      type_name: String(row.type_name ?? '').trim() || 'Bilinmeyen tip',
      total: Number(row.total) || 0,
      icon: getTypeIcon(row.type_name),
      tone: TONES[Math.abs(Number(row.type_id) || index) % TONES.length],
    }));

  const hasData = categories.length > 0;

  return (
    <section className="overflow-hidden">
      <div id="machine-category-panel" className="py-4">
        {loading && !hasData ? (
          <SkeletonCards />
        ) : error && !hasData ? (
          <ErrorState error={error} onRetry={onRefresh} />
        ) : !hasData ? (
          <EmptyState />
        ) : (
          <div className={WRAP_CLASS}>
            {categories.map((category) => (
              <CategoryCard
                key={category.type_id ?? category.type_name}
                category={category}
                active={
                  String(activeTypeId ?? '') === String(category.type_id)
                }
                onClick={
                  onSelectType
                    ? () => onSelectType(category.type_id)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CategoryCard({ category, active, onClick }) {
  const { icon, tone, type_name, total } = category;
  const Element = onClick ? 'button' : 'div';

  return (
    <Element
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={onClick ? active : undefined}
      aria-label={`${type_name}: ${total} makine`}
      title={`${type_name} — ${total} makine`}
      className={`flex min-w-0 flex-[1_1_128px] max-w-[130px] items-center gap-2.5 rounded-xl border px-2 py-2 text-left transition ${tone.card} ${
        onClick
          ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1'
          : ''
      } ${active ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}
      >
        <FlaticonIcon name={icon} size="md" />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[10px] font-medium uppercase text-gray-500"
          title={type_name}
        >
          {type_name}
        </span>
        <span
          className={`block text-lg font-semibold leading-tight ${tone.value}`}
        >
          {total}
        </span>
      </span>
    </Element>
  );
}

function SkeletonCards() {
  return (
    <div className={WRAP_CLASS}>
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="h-[52px] flex-[1_1_128px] max-w-[170px] animate-pulse rounded-xl bg-gray-100 ring-1 ring-gray-200/60"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <FlaticonIcon name="package" size="lg" />
      </span>
      <p className="mt-2 text-sm font-medium text-gray-600">
        Henüz makine kategorisi yok
      </p>
      <p className="mt-0.5 text-xs text-gray-400">
        Makine eklediğinizde kategoriler burada görünecek
      </p>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/60 px-4 py-8 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
        <FlaticonIcon name="triangle-warning" size="lg" />
      </span>
      <p className="mt-2 text-sm font-medium text-red-700">
        Kategori verileri yüklenemedi
      </p>
      {error && (
        <p className="mt-1 max-w-xl text-xs text-red-600">{String(error)}</p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
        >
          <FlaticonIcon name="refresh" size="sm" />
          Tekrar dene
        </button>
      )}
    </div>
  );
}



