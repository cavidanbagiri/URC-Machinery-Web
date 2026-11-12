// src/components/purchaserequest/SparePartDetailModal.jsx
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  DocumentPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import RepairModal, { SecondaryButton } from '../repair/RepairModal';
import { formatDate, machineLabel } from '../../utils/repair';
import {
  formatFileSize,
  formatQuantity,
  spareArrivalBadgeClass,
  spareArrivalLabel,
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

function DocumentChips({
  request,
  busy,
  onUploadDocument,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
}) {
  const documents = request.documents || [];
  const uploading = busy?.requestId === request.id && busy?.action === 'upload';
  const inputId = `spare-part-document-${request.id}`;

  return (
    <div>
      <h3 className="mb-2 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        PDF Evrak
      </h3>

      <div className="flex flex-wrap items-center gap-1.5">
        {documents.map((document) => {
          const deleting =
            busy?.requestId === request.id &&
            busy?.action === 'delete' &&
            busy?.documentId === document.id;

          return (
            <span
              key={document.id}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-blue-100 bg-blue-50 py-0.5 pl-2 pr-1 text-[11px] text-blue-800"
            >
              <button
                type="button"
                onClick={() => onViewDocument?.(request, document)}
                title={`${document.file_name} · ${formatFileSize(
                  document.file_size
                )} · Görüntüle`}
                className="max-w-[14rem] truncate hover:underline"
              >
                {document.file_name}
              </button>

              <button
                type="button"
                onClick={() => onDownloadDocument?.(request, document)}
                title="Evrakı indir"
                aria-label={`${document.file_name} indir`}
                className="rounded p-0.5 hover:bg-blue-100"
              >
                <ArrowDownTrayIcon className="h-3 w-3" />
              </button>

              <button
                type="button"
                onClick={() => onDeleteDocument?.(request, document)}
                disabled={deleting}
                title="Evrakı sil"
                aria-label={`${document.file_name} sil`}
                className="rounded p-0.5 text-red-600 hover:bg-red-100 disabled:opacity-40"
              >
                {deleting ? (
                  <ArrowPathIcon className="h-3 w-3 animate-spin" />
                ) : (
                  <XMarkIcon className="h-3 w-3" />
                )}
              </button>
            </span>
          );
        })}

        <label
          htmlFor={inputId}
          className={`inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[11px] font-medium text-gray-600 transition hover:border-blue-400 hover:text-blue-700 ${
            uploading ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          {uploading ? (
            <ArrowPathIcon className="h-3 w-3 animate-spin" />
          ) : (
            <DocumentPlusIcon className="h-3.5 w-3.5" />
          )}
          {uploading ? 'Yükleniyor...' : 'Evrak ekle'}
        </label>
        <input
          id={inputId}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) onUploadDocument?.(request, file);
          }}
        />
      </div>

      {documents.length === 0 && (
        <p className="mt-1 text-[11px] text-gray-400">
          Bu talebe henüz PDF eklenmemiş. Sadece PDF · en fazla 10 MB.
        </p>
      )}
    </div>
  );
}

export default function SparePartDetailModal({
  request,
  documentBusy,
  onUploadDocument,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
  onClose,
}) {
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
            <Info
              label="Gelen Kalem"
              value={`${request.arrived_count ?? 0}/${request.item_count} geldi`}
            />
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
                    <th className="px-3 py-2 text-right font-medium">Geliş</th>
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
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${spareArrivalBadgeClass(
                            item.is_arrived
                          )}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {spareArrivalLabel(item.is_arrived)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DocumentChips
            request={request}
            busy={documentBusy}
            onUploadDocument={onUploadDocument}
            onViewDocument={onViewDocument}
            onDownloadDocument={onDownloadDocument}
            onDeleteDocument={onDeleteDocument}
          />
        </div>
      )}
    </RepairModal>
  );
}
