// src/pages/PurchaseRequests.jsx
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
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
  setServiceFilter,
  setSpareFilter,
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

const filterInputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export default function PurchaseRequests() {
  const dispatch = useDispatch();
  const { activeTab, spareParts, serviceRequests, rowBusy } = useSelector(
    (s) => s.purchaseRequest
  );
  const territories = useSelector((s) => s.lookup.data.territory || []);
  const requestTypes = useSelector((s) => s.purchaseRequest.requestTypes.items);

  const isSpare = activeTab === SPARE_TAB;
  const active = isSpare ? spareParts : serviceRequests;
  const { items, loading, error, filters, offset, limit } = active;

  const [filtersOpen, setFiltersOpen] = useState(false);
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

  const setFilter = (key, value) => {
    dispatch(
      isSpare ? setSpareFilter({ key, value }) : setServiceFilter({ key, value })
    );
  };

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

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(event) => setFilter('search', event.target.value)}
              placeholder={
                isSpare
                  ? 'Talep başlığı, STF/HTF no veya makine ara...'
                  : 'Servis form no, firma veya makine ara...'
              }
              className={`${filterInputClass} pl-9`}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((value) => !value)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                filtersOpen || hasActiveFilters
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              Filtreler
              {hasActiveFilters && (
                <span className="rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

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
                Temizle
              </button>
            )}
          </div>
        </div>

        {filtersOpen && (
          <div className="grid grid-cols-1 gap-3 border-t border-gray-100 bg-gray-50/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {isSpare && (
              <>
                <div>
                  <label
                    htmlFor="purchase-request-status"
                    className="mb-1 block text-xs font-medium text-gray-600"
                  >
                    Durum
                  </label>
                  <select
                    id="purchase-request-status"
                    value={filters.status}
                    onChange={(event) => setFilter('status', event.target.value)}
                    className={filterInputClass}
                  >
                    <option value="">Tümü</option>
                    <option value="bekleniyor">Bekleniyor</option>
                    <option value="geldi">Geldi</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="purchase-request-territory"
                    className="mb-1 block text-xs font-medium text-gray-600"
                  >
                    Bölge
                  </label>
                  <select
                    id="purchase-request-territory"
                    value={filters.territory_id}
                    onChange={(event) =>
                      setFilter('territory_id', event.target.value)
                    }
                    className={filterInputClass}
                  >
                    <option value="">Tümü</option>
                    {territories.map((territory) => (
                      <option key={territory.id} value={territory.id}>
                        {territory.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="purchase-request-type"
                    className="mb-1 block text-xs font-medium text-gray-600"
                  >
                    Talep Türü
                  </label>
                  <select
                    id="purchase-request-type"
                    value={filters.request_type_id}
                    onChange={(event) =>
                      setFilter('request_type_id', event.target.value)
                    }
                    className={filterInputClass}
                  >
                    <option value="">Tümü</option>
                    {requestTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="purchase-request-date-from"
                className="mb-1 block text-xs font-medium text-gray-600"
              >
                Başlangıç Tarihi
              </label>
              <input
                id="purchase-request-date-from"
                type="date"
                value={filters.date_from}
                onChange={(event) => setFilter('date_from', event.target.value)}
                className={filterInputClass}
              />
            </div>

            <div>
              <label
                htmlFor="purchase-request-date-to"
                className="mb-1 block text-xs font-medium text-gray-600"
              >
                Bitiş Tarihi
              </label>
              <input
                id="purchase-request-date-to"
                type="date"
                value={filters.date_to}
                onChange={(event) => setFilter('date_to', event.target.value)}
                className={filterInputClass}
              />
            </div>
          </div>
        )}
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
