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

import { fetchLookupIfNeeded } from '../stores/lookup_slice';
import {
  SERVICE_TAB,
  SPARE_TAB,
  deleteServiceRequest,
  deleteSparePartRequest,
  fetchPurchaseRequestTypes,
  fetchServiceRequests,
  fetchSparePartRequests,
  resetServiceFilters,
  resetSpareFilters,
  setActiveTab,
  updateSparePartStatus,
} from '../stores/purchase_request_slice';
import { nextSpareStatus } from '../utils/purchaseRequest';
import SparePartRequestTable from '../components/purchaserequest/SparePartRequestTable';
import ServiceRequestTable from '../components/purchaserequest/ServiceRequestTable';
import PurchaseRequestPagination from '../components/purchaserequest/PurchaseRequestPagination';
import SparePartFormModal from '../components/purchaserequest/SparePartFormModal';
import ServiceFormModal from '../components/purchaserequest/ServiceFormModal';
import SparePartDetailModal from '../components/purchaserequest/SparePartDetailModal';

const LOOKUPS_NEEDED = ['territory'];

export default function PurchaseRequests() {
  const dispatch = useDispatch();
  const { activeTab, spareParts, serviceRequests, rowBusy } = useSelector(
    (s) => s.purchaseRequest
  );

  const isSpare = activeTab === SPARE_TAB;
  const active = isSpare ? spareParts : serviceRequests;
  const { items, loading, error, filters, offset, limit } = active;

  const [spareFormOpen, setSpareFormOpen] = useState(false);
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

  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== '' && value !== null && value !== undefined
  ).length;
  const hasActiveFilters = activeFilterCount > 0;

  const handleResetFilters = () => {
    dispatch(isSpare ? resetSpareFilters() : resetServiceFilters());
  };

  const openCreate = () => {
    if (isSpare) setSpareFormOpen(true);
    else setServiceFormOpen(true);
  };

  const handleToggleStatus = async (item, status) => {
    const next = status || nextSpareStatus(item.status);
    try {
      await dispatch(
        updateSparePartStatus({ requestId: item.id, status: next })
      ).unwrap();
      toast.success(
        next === 'geldi'
          ? 'Talep "Geldi" olarak işaretlendi'
          : 'Talep "Bekleniyor" olarak işaretlendi'
      );
    } catch (err) {
      toast.error(String(err || 'Durum güncellenemedi'));
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
          onToggleStatus={handleToggleStatus}
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
        onClose={() => setSpareFormOpen(false)}
      />

      <ServiceFormModal
        open={serviceFormOpen}
        onClose={() => setServiceFormOpen(false)}
      />

      <SparePartDetailModal
        request={detailRequest}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}
