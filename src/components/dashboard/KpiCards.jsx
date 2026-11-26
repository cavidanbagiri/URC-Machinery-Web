// src/components/dashboard/KpiCards.jsx
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowUpRight,
  Car,
  CheckCircle2,
  KeyRound,
  Layers,
  MapPin,
} from 'lucide-react';

/**
 * Dashboard'un tek satırlık makine özeti.
 *
 * Kartlar: Total Makine (filo + kiralık), URC Tüm Makine, Aktif,
 * Kiralık Toplam ve proje (şantiye) kartları. Tasarım bilinçli olarak siyah
 * beyaz: beyaz zemin, gri çerçeve/yazı, siyah sayı. Renkli arka plan yok.
 */

//: Proje kartı olarak gösterilecek şantiyeler — sıra kartların sırasıdır.
const PROJECT_TERRITORIES = ['SRU', 'DCU'];

const CARD_CLASS =
  'group relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-2xl bg-white p-5 text-left ring-1 ring-gray-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400';

const ICON_WRAP_CLASS =
  'flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-700 ring-1 ring-gray-200';

const LABEL_CLASS =
  'text-[11px] font-semibold tracking-wide text-gray-500';
const VALUE_CLASS =
  'mt-1 text-3xl font-bold leading-none tracking-tight text-gray-900';
const HINT_CLASS = 'mt-2 text-[11px] font-medium text-gray-500';

/** Şantiye adlarını karşılaştırmak için sadeleştirir ("SRU" == " sru "). */
const normalizeName = (name = '') => String(name).trim().toLowerCase();

function SkeletonCard() {
  return (
    <div className="min-h-[132px] animate-pulse rounded-2xl bg-gray-100 ring-1 ring-gray-200/60" />
  );
}

function KpiCard({ label, value, hint, icon: Icon, onClick }) {
  // `onClick` yoksa kart tıklanmaz: sayısı listeyle birebir eşleşmeyen
  // (filo + kiralık) kartlar kullanıcıyı yanlış listeye götürmesin.
  const isInteractive = typeof onClick === 'function';
  const Element = isInteractive ? 'button' : 'div';

  return (
    <Element
      {...(isInteractive ? { type: 'button', onClick } : {})}
      className={CARD_CLASS}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={ICON_WRAP_CLASS}>
          <Icon className="h-4 w-4" strokeWidth={2.2} />
        </div>
        {isInteractive && (
          <ArrowUpRight className="h-4 w-4 text-gray-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gray-500" />
        )}
      </div>

      <div>
        <p className={LABEL_CLASS}>{label}</p>
        <p className={VALUE_CLASS}>{value ?? 0}</p>
        {hint && <p className={HINT_CLASS}>{hint}</p>}
      </div>
    </Element>
  );
}

export default function KpiCards() {
  const navigate = useNavigate();
  const { total, byStatus, rentalTotal, byTerritory, loading } = useSelector(
    (s) => s.dashboard
  );

  // Altı kart: mobilde 2, tablette 3, geniş ekranda tek satır.
  const gridClass = 'grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6';

  const goToMachines = (statusId = null) => {
    navigate(statusId ? `/common_cars?status_id=${statusId}` : '/common_cars');
  };

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const activeStatus = byStatus.find((status) =>
    normalizeName(status.name).includes('aktif')
  );
  const activeCount = activeStatus?.count ?? 0;
  const activeShare =
    total > 0 ? Math.round((activeCount / total) * 100) : 0;

  // Total Makine = kendi filomuz (hurda hariç) + kiralık ekipman.
  const grandTotal = total + rentalTotal;

  return (
    <div style={{ fontFamily: 'Inter' }} className={gridClass}>
      <KpiCard
        label="Total Makine"
        value={grandTotal}
        hint={`${total} URC + ${rentalTotal} kiralık`}
        icon={Layers}
      />

      <KpiCard
        label="URC Tüm Makine"
        value={total}
        hint="Kendi filomuz (hurda hariç)"
        icon={Car}
        onClick={() => goToMachines()}
      />

      <KpiCard
        label="Aktif"
        value={activeCount}
        hint={`%${activeShare} · URC filosu`}
        icon={CheckCircle2}
        onClick={() =>
          activeStatus ? goToMachines(activeStatus.id) : goToMachines()
        }
      />

      <KpiCard
        label="Kiralık Toplam"
        value={rentalTotal}
        hint="Kiralık makine sözleşmeleri"
        icon={KeyRound}
        onClick={() => navigate('/rental_machines')}
      />

      {PROJECT_TERRITORIES.map((name) => {
        const territory = byTerritory.find(
          (item) => normalizeName(item.name) === normalizeName(name)
        );

        return (
          <KpiCard
            key={name}
            label={`Proje ${name}`}
            value={territory?.count ?? 0}
            hint={
              territory
                ? `${territory.fleet_count} URC + ${territory.rental_count} kiralık`
                : 'Kayıt yok'
            }
            icon={MapPin}
          />
        );
      })}
    </div>
  );
}
