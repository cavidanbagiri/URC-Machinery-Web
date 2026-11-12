// src/pages/PurchaseRequests.jsx
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { BsCartCheck } from 'react-icons/bs';
import { useSearchParams } from 'react-router-dom';

import { fetchLookupIfNeeded } from '../stores/lookup_slice';
import {
  SERVICE_TAB,
  SPARE_TAB,
  deleteServiceRequest,
  deleteSparePartDocument,
  deleteSparePartRequest,
  fetchPurchaseRequestTypes,
  fetchServiceRequests,
  fetchSparePartRequests,
  resetServiceFilters,
  resetSpareFilters,
  setActiveTab,
  setSpareFilters,
  updateSparePartItemArrival,
  updateSparePartStatus,
  uploadSparePartDocument,
} from '../stores/purchase_request_slice';
import { spareStatusLabel, validateSpareDocument } from '../utils/purchaseRequest';
import PurchaseRequestService from '../services/PurchaseRequestService';
import SparePartRequestTable from '../components/purchaserequest/SparePartRequestTable';
import ServiceRequestTable from '../components/purchaserequest/ServiceRequestTable';
import PurchaseRequestPagination from '../components/purchaserequest/PurchaseRequestPagination';
import SparePartFormModal from '../components/purchaserequest/SparePartFormModal';
import ServiceFormModal from '../components/purchaserequest/ServiceFormModal';
import SparePartDetailModal from '../components/purchaserequest/SparePartDetailModal';

const LOOKUPS_NEEDED = ['territory'];

export default function PurchaseRequests() {
  const dispatch = useDispatch();
  const { activeTab, spareParts, serviceRequests, rowBusy, documentBusy } =
    useSelector((s) => s.purchaseRequest);

  const isSpare = activeTab === SPARE_TAB;
  const active = isSpare ? spareParts : serviceRequests;
  const { items, loading, error, filters, offset, limit } = active;

  const [spareFormOpen, setSpareFormOpen] = useState(false);
  // The request being edited; ``null`` opens the empty create form.
  const [spareFormRequest, setSpareFormRequest] = useState(null);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);

  const detailRequest =
    spareParts.items.find((request) => request.id === detailId) || null;

  useEffect(() => {
    LOOKUPS_NEEDED.forEach((key) => dispatch(fetchLookupIfNeeded(key)));
    dispatch(fetchPurchaseRequestTypes());
  }, [dispatch]);

  // Tab, filter and pagination changes share one debounced fetch so switching
  // tabs never fires two requests for the same list.
  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(isSpare ? fetchSparePartRequests() : fetchServiceRequests());
    }, 350);
    return () => clearTimeout(timeout);
  }, [dispatch, isSpare, filters, offset, limit]);

  // Both tab badges show their totals at the same time, so the tab that is not
  // active still needs its first page — once per visit.
  const inactiveFetched = useRef(false);
  useEffect(() => {
    if (inactiveFetched.current) return;
    inactiveFetched.current = true;
    dispatch(isSpare ? fetchServiceRequests() : fetchSparePartRequests());
  }, [dispatch, isSpare]);

  // Dashboard kartından gelen derin bağlantı:
  // /purchase_requests?status=firma_bekleniyor → yedek parça sekmesi + durum filtresi
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status');
    if (!status) return;

    dispatch(setActiveTab(SPARE_TAB));
    dispatch(resetSpareFilters());
    dispatch(setSpareFilters({ status }));
  }, [dispatch, searchParams]);

  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== '' && value !== null && value !== undefined
  ).length;
  const hasActiveFilters = activeFilterCount > 0;

  const handleResetFilters = () => {
    dispatch(isSpare ? resetSpareFilters() : resetServiceFilters());
  };

  const openCreate = () => {
    if (isSpare) {
      setSpareFormRequest(null);
      setSpareFormOpen(true);
    } else {
      setServiceFormOpen(true);
    }
  };

  const openSpareEdit = (request) => {
    setSpareFormRequest(request);
    setSpareFormOpen(true);
  };

  const closeSpareForm = () => {
    setSpareFormOpen(false);
    setSpareFormRequest(null);
  };

  const handleChangeStatus = async (item, status) => {
    if (!status || status === item.status) return;
    try {
      await dispatch(
        updateSparePartStatus({ requestId: item.id, status })
      ).unwrap();
      toast.success(`Talep "${spareStatusLabel(status)}" olarak güncellendi`);
    } catch (err) {
      toast.error(String(err || 'Durum güncellenemedi'));
    }
  };

  const handleToggleArrival = async (request, partRow, isArrived) => {
    try {
      await dispatch(
        updateSparePartItemArrival({
          requestId: request.id,
          itemId: partRow.id,
          isArrived,
        })
      ).unwrap();
      toast.success(
        `${partRow.part_number || 'Kalem'} "${
          isArrived ? 'Geldi' : 'Gelmedi'
        }" olarak işaretlendi`
      );
    } catch (err) {
      toast.error(String(err || 'Kalem durumu güncellenemedi'));
    }
  };

  const handleDelete = async (item) => {
    const label = isSpare ? 'yedek parça talebini' : 'servis/hizmet talebini';
    const confirmed = window.confirm(
      `"${item.title}" ${label} silmek istediğinize emin misiniz?`
    );
    if (!confirmed) return;

    try {
      await dispatch(
        isSpare ? deleteSparePartRequest(item.id) : deleteServiceRequest(item.id)
      ).unwrap();
      if (item.id === detailId) setDetailId(null);
      toast.success('Talep silindi');
    } catch (err) {
      toast.error(String(err || 'Talep silinemedi'));
    }
  };

  const fetchDocumentUrl = async (request, document) => {
    const blob = await PurchaseRequestService.fetchSparePartDocument(
      request.id,
      document.id
    );
    return URL.createObjectURL(
      new Blob([blob], { type: document.content_type || 'application/pdf' })
    );
  };

  const handleUploadDocument = async (request, file) => {
    const validationError = validateSpareDocument(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      await dispatch(
        uploadSparePartDocument({ requestId: request.id, file })
      ).unwrap();
      toast.success('Evrak eklendi');
    } catch (err) {
      toast.error(String(err || 'Evrak yüklenemedi'));
    }
  };

  const handleViewDocument = async (request, document) => {
    // Open the tab before awaiting so the browser keeps the user gesture.
    const tab = window.open('', '_blank');
    if (!tab) {
      toast.error('Tarayıcı yeni sekmeyi engelledi');
      return;
    }

    try {
      const url = await fetchDocumentUrl(request, document);
      tab.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      tab.close();
      toast.error('Evrak açılamadı');
    }
  };

  const handleDownloadDocument = async (request, document) => {
    try {
      const url = await fetchDocumentUrl(request, document);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.file_name || 'evrak.pdf';
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('Evrak indirilemedi');
    }
  };

  const handleDeleteDocument = async (request, document) => {
    const confirmed = window.confirm(
      `"${document.file_name}" evrakını silmek istiyor musunuz?`
    );
    if (!confirmed) return;

    try {
      await dispatch(
        deleteSparePartDocument({
          requestId: request.id,
          documentId: document.id,
        })
      ).unwrap();
      toast.success('Evrak silindi');
    } catch (err) {
      toast.error(String(err || 'Evrak silinemedi'));
    }
  };

  return (
    <div className="space-y-5 p-6">
      <Toaster position="top-right" />

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div style={{ fontFamily: 'Inter' }} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <BsCartCheck className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Yedek Parça ve Hizmet Talepleri
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-gray-500">
            Yedek parça taleplerini ve firmalardan alınacak servis/hizmet
            taleplerini tek ekrandan yönetin.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" />
          {isSpare ? 'Yeni Yedek Parça Talebi' : 'Yeni Servis Talebi'}
        </button>
      </div>

      <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
        {[
          {
            key: SPARE_TAB,
            label: 'Yedek Parça Talepleri',
            count: spareParts.total,
          },
          {
            key: SERVICE_TAB,
            label: 'Servis / Hizmet Talepleri',
            count: serviceRequests.total,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => dispatch(setActiveTab(tab.key))}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                activeTab === tab.key
                  ? 'bg-white/25 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-[11px] text-gray-400">
          Filtrelemek için sütun başlığına tıklayın
        </p>

        <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                dispatch(isSpare ? fetchSparePartRequests() : fetchServiceRequests())
              }
              disabled={loading}
              title="Listeyi yenile"
              aria-label="Listeyi yenile"
              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowPathIcon
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Filtreleri temizle ({activeFilterCount})
              </button>
            )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {isSpare ? (
        <SparePartRequestTable
          items={items}
          loading={loading}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
          onOpenDetail={(request) => setDetailId(request.id)}
          onEdit={openSpareEdit}
          onChangeStatus={handleChangeStatus}
          onToggleArrival={handleToggleArrival}
          onDelete={handleDelete}
          rowBusy={rowBusy}
        />
      ) : (
        <ServiceRequestTable
          items={items}
          loading={loading}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
          onDelete={handleDelete}
          rowBusy={rowBusy}
        />
      )}

      <PurchaseRequestPagination scope={activeTab} />

      <SparePartFormModal
        open={spareFormOpen}
        onClose={closeSpareForm}
        request={spareFormRequest}
      />

      <ServiceFormModal
        open={serviceFormOpen}
        onClose={() => setServiceFormOpen(false)}
      />

      <SparePartDetailModal
        request={detailRequest}
        documentBusy={documentBusy}
        onUploadDocument={handleUploadDocument}
        onViewDocument={handleViewDocument}
        onDownloadDocument={handleDownloadDocument}
        onDeleteDocument={handleDeleteDocument}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}
