// src/components/purchaserequest/SparePartDetailModal.jsx
import RepairModal, { SecondaryButton } from '../repair/RepairModal';
import { formatDate, machineLabel } from '../../utils/repair';
import {
  formatQuantity,
  spareStatusBadgeClass,
  spareStatusLabel,
} from '../../utils/purchaseRequest';

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-900">{value || '—'}</p>
    </div>
  );
}

export default function SparePartDetailModal({ request, onClose }) {
  return (
    <RepairModal
      open={Boolean(request)}
      onClose={onClose}
      title={request?.title || 'Talep Detayı'}
      subtitle={request ? `STF/HTF No: ${request.stf_htf_no}` : undefined}
      maxWidth="max-w-4xl"
      footer={
        <SecondaryButton onClick={onClose}>Kapat</SecondaryButton>
      }
    >
      {request && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Info label="Bölge" value={request.territory_name} />
            <Info label="Talep Türü" value={request.request_type_name} />
            <Info label="Talep Tarihi" value={formatDate(request.request_date)} />
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Durum
              </p>
              <span
                className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${spareStatusBadgeClass(
                  request.status
                )}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {spareStatusLabel(request.status)}
              </span>
            </div>
            <Info label="Oluşturan" value={request.created_by_name} />
            <Info
              label="Makine Sayısı"
              value={`${(request.machine_ids || []).length} adet`}
            />
            <Info label="Parça Kalemi" value={`${request.item_count} kalem`} />
          </div>

          <div>
            <h3 className="mb-2 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Parça Listesi
            </h3>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-[11px] uppercase text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">ID No</th>
                    <th className="px-3 py-2 text-left font-medium">Garaj No</th>
                    <th className="px-3 py-2 text-left font-medium">Parça No</th>
                    <th className="px-3 py-2 text-left font-medium">Açıklama (TR)</th>
                    <th className="px-3 py-2 text-left font-medium">Açıklama (RU)</th>
                    <th className="px-3 py-2 text-right font-medium">Miktar</th>
                    <th className="px-3 py-2 text-left font-medium">Tedarik</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800">
                  {(request.items || []).map((item) => (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="whitespace-nowrap px-3 py-2 text-[12px] font-medium">
                        {machineLabel(item) || '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[12px] text-gray-600">
                        {item.garage_request_no || '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[12px] text-gray-600">
                        {item.part_number || '—'}
                      </td>
                      <td className="px-3 py-2 text-[12px] text-gray-700">
                        {item.description_tr || '—'}
                      </td>
                      <td className="px-3 py-2 text-[12px] text-gray-700">
                        {item.description_ru || '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right text-[12px]">
                        {formatQuantity(item.quantity)} {item.unit}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[12px] text-gray-600">
                        {formatDate(item.supply_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </RepairModal>
  );
}
