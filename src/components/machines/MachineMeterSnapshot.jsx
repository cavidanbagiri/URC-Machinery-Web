// src/components/machines/MachineMeterSnapshot.jsx
import { formatDate, formatNumber } from '../../utils/maintenance';

/**
 * Newest KM / engine-hour reading of the selected machine.
 *
 * The values come from ``machine_meter_logs`` through the machine-option
 * endpoints, so the repair and tire forms show exactly the same snapshot as the
 * **Güncel KM ve Motor Saatleri** page.
 */
export default function MachineMeterSnapshot({ machine, className = '' }) {
  if (!machine) return null;

  const hasKm = machine.last_km !== null && machine.last_km !== undefined;
  const hasHours =
    machine.last_engine_hours !== null &&
    machine.last_engine_hours !== undefined;
  const hasReading = hasKm || hasHours;

  return (
    <div className={`mt-3 border-t border-blue-100 pt-2 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">
        Son KM / Motor Saati
      </p>

      {hasReading ? (
        <>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-700">
            <span>
              KM:{' '}
              <strong className="font-semibold text-gray-900">
                {formatNumber(machine.last_km)}
              </strong>
            </span>
            <span>
              Motor saati:{' '}
              <strong className="font-semibold text-gray-900">
                {formatNumber(machine.last_engine_hours)}
              </strong>
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-gray-500">
            {machine.last_log_date
              ? `Son kayıt: ${formatDate(machine.last_log_date)}`
              : 'Kayıt tarihi yok'}
          </p>
        </>
      ) : (
        <p className="mt-1 text-xs text-gray-500">
          Henüz KM / motor saati kaydı yok
        </p>
      )}
    </div>
  );
}
