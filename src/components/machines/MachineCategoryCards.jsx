// src/components/machines/MachineCategoryCards.jsx
import FlaticonIcon from '../ui/FlaticonIcon';


import forklift from '../../assets/icons/forklift3.png'


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

const WRAP_CLASS = 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4';

// Tip adına görə real şəkil (hazırda yalnız forklift üçün var).
const TYPE_IMAGES = { forklift };

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
              <CategoryCard className=""
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
  // Forklift üçün real şəkil; digər tiplər üçün tip ikonu göstərilir.
  const image = TYPE_IMAGES[normalizeTypeName(type_name)];

  return (
    <Element
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={onClick ? active : undefined}
      aria-label={`${type_name}: ${total} makine`}
      title={`${type_name} — ${total} makine`}
      className={`flex w-full min-w-0 items-center justify-center gap-2.5 rounded-xl px-2 py-2 text-left transition ${
        onClick
          ? 'cursor-pointer transition delay-10 duration-50 ease-in-out hover:-translate-y-1 hover:scale-101 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1'
          : ''
      } ${active ? 'ring-2 ring-gray-300 ring-offset-1 duration-400' : ''}`}
    >
      <span
        className={`flex h-28 w-28 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}
      >
        {image ? (
          <img src={image} alt="" className="h-20 w-28 object-contain" />
        ) : (
          <FlaticonIcon name={icon} size="2xl" />
        )}
      </span>

      <span style={{'fontFamily':'IBM Plex Sans'}}
        className="min-w-0 flex flex-col w-full  ">
        <span 
          className={`block text-6xl pl-4 font-thin leading-tight `}
        >
          {total}
        </span>
        <span
          className="block truncate text-[14px] pl-4 font-extrabold uppercase text-black"
          title={type_name}
        >
          {type_name}
        </span>
      </span>
    </Element>
  );
}

function SkeletonCards() {
  return (
    <div className={WRAP_CLASS}>
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="h-32 animate-pulse rounded-xl bg-gray-100 ring-1 ring-gray-200/60"
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



