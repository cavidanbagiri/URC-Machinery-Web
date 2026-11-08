// src/pages/WarehouseStock.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  InboxArrowDownIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { BsBoxSeam } from 'react-icons/bs';
import { useSearchParams } from 'react-router-dom';

import { fetchLookupIfNeeded } from '../stores/lookup_slice';
import {
  MOVEMENTS_TAB,
  RECEIPTS_TAB,
  STOCK_TAB,
  deleteStockItem,
  fetchMovements,
  fetchPendingReceipts,
  fetchStock,
  fetchWarehouseSummary,
  resetMovementFilters,
  resetStockFilters,
  setActiveTab,
  setMovementFilter,
  setPendingSearch,
  setStockFilter,
  showItemMovements,
} from '../stores/warehouse_slice';
import { MOVEMENT_IN, MOVEMENT_OUT } from '../utils/warehouse';
import WarehouseSummaryCards from '../components/warehouse/WarehouseSummaryCards';
import StockTable from '../components/warehouse/StockTable';
import PendingReceiptTable from '../components/warehouse/PendingReceiptTable';
import MovementTable from '../components/warehouse/MovementTable';
import WarehousePagination from '../components/warehouse/WarehousePagination';
import StockFormModal from '../components/warehouse/StockFormModal';
import StockMoveModal from '../components/warehouse/StockMoveModal';
import ReceiptModal from '../components/warehouse/ReceiptModal';

const filterInputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

const TABS = [
  { key: STOCK_TAB, label: 'Stok Kartları' },
  { key: RECEIPTS_TAB, label: 'Gelen Talepler' },
  { key: MOVEMENTS_TAB, label: 'Hareketler' },
];

export default function WarehouseStock() {
  const dispatch = useDispatch();
  const {
    activeTab,
    stock,
    pending,
    movements,
    summary,
    rowBusy,
    mutationError,
  } = useSelector((s) => s.warehouse);
  const territories = useSelector((s) => s.lookup.data.territory || []);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [stockForm, setStockForm] = useState({ open: false, item: null });
  const [move, setMove] = useState({
    open: false,
    item: null,
    direction: MOVEMENT_IN,
  });
  const [receiptRows, setReceiptRows] = useState(null);
  const [selected, setSelected] = useState([]);
  const [receiptBusyId, setReceiptBusyId] = useState(null);

  const isStock = activeTab === STOCK_TAB;
  const isReceipts = activeTab === RECEIPTS_TAB;

  const activeList = isStock ? stock : isReceipts ? pending : movements;
  const { items, loading, error } = activeList;

  // ---------- INITIAL LOAD ----------

  useEffect(() => {
    dispatch(fetchLookupIfNeeded('territory'));
    dispatch(fetchWarehouseSummary());
  }, [dispatch]);

  // Dashboard kartından gelen derin bağlantı:
  // /warehouse_stock?low_stock=1 → stok sekmesi + kritik stok filtresi
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!searchParams.get('low_stock')) return;

    dispatch(setActiveTab(STOCK_TAB));
    dispatch(resetStockFilters());
    dispatch(setStockFilter({ key: 'low_stock', value: true }));
  }, [dispatch, searchParams]);

  // One debounced fetch per list; a filter bar only exists for its own tab,
  // so a change here never fires a request for another list.
  useEffect(() => {
    const timeout = setTimeout(() => dispatch(fetchStock()), 350);
    return () => clearTimeout(timeout);
  }, [dispatch, stock.filters, stock.offset, stock.limit]);

  useEffect(() => {
    const timeout = setTimeout(() => dispatch(fetchPendingReceipts()), 350);
    return () => clearTimeout(timeout);
  }, [dispatch, pending.filters, pending.offset]);

  useEffect(() => {
    const timeout = setTimeout(() => dispatch(fetchMovements()), 350);
    return () => clearTimeout(timeout);
  }, [dispatch, movements.filters, movements.offset, movements.limit]);

  const refreshAll = () => {
    dispatch(fetchWarehouseSummary());
    dispatch(fetchStock());
    dispatch(fetchPendingReceipts());
    dispatch(fetchMovements());
  };

  // ---------- HANDLERS ----------

  const stockFilterCount = Object.values(stock.filters).filter(
    (value) => value !== '' && value !== false && value !== null
  ).length;
  const movementFilterCount = Object.values(movements.filters).filter(
    (value) => value !== '' && value !== null && value !== undefined
  ).length;
  const hasActiveFilters = isStock
    ? stockFilterCount > 0
    : isReceipts
      ? Boolean(pending.filters.search)
      : movementFilterCount > 0;

  const handleResetFilters = () => {
    if (isStock) {
      dispatch(resetStockFilters());
    } else if (isReceipts) {
      setSelected([]);
      dispatch(setPendingSearch(''));
    } else {
      dispatch(resetMovementFilters());
    }
  };

  const openCreate = () => setStockForm({ open: true, item: null });
  const openEdit = (item) => setStockForm({ open: true, item });

  const handleEntry = (item) =>
    setMove({ open: true, item, direction: MOVEMENT_IN });
  const handleIssue = (item) =>
    setMove({ open: true, item, direction: MOVEMENT_OUT });

  const handleShowMovements = (item) => dispatch(showItemMovements(item.id));

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `"${item.name}" stok kartını silmek istediğinize emin misiniz?`
    );
    if (!confirmed) return;

    try {
      await dispatch(deleteStockItem(item.id)).unwrap();
      toast.success('Stok kartı silindi');
      dispatch(fetchWarehouseSummary());
    } catch (err) {
      toast.error(String(err || 'Stok kartı silinemedi'));
    }
  };

  const toggleSelect = (requestItemId) => {
    setSelected((prev) =>
      prev.includes(requestItemId)
        ? prev.filter((id) => id !== requestItemId)
        : [...prev, requestItemId]
    );
  };

  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.length === pending.items.length
        ? []
        : pending.items.map((item) => item.request_item_id)
    );
  };

  const openReceipt = (rows) => {
    if (!rows.length) {
      toast.error('Depoya alınacak kalem seçin');
      return;
    }
    setReceiptRows(rows);
  };

  const handleReceiveOne = (item) => {
    setReceiptBusyId(item.request_item_id);
    setReceiptRows([item]);
  };

  const handleReceiveSelected = () =>
    openReceipt(
      pending.items.filter((item) =>
        selected.includes(item.request_item_id)
      )
    );

  const handleReceiptSaved = () => {
    setSelected([]);
    setReceiptBusyId(null);
    refreshAll();
  };

  const handleCloseReceipt = () => {
    setReceiptRows(null);
    setReceiptBusyId(null);
  };

  return (
    <div className="space-y-5 p-6">
      <Toaster position="top-right" />

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div
            style={{ fontFamily: 'Inter' }}
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <BsBoxSeam className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Ambar / Depo Stoku
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-gray-500">
            Satın almadaki "Geldi" kalemlerini depoya alın, stoğu yönetin ve
            makineye çıkış yapın.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          {isStock && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              Yeni Stok Kartı
            </button>
          )}

          {isReceipts && (
            <button
              type="button"
              onClick={handleReceiveSelected}
              disabled={selected.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <InboxArrowDownIcon className="h-4 w-4" />
              Seçilenleri Depoya Al
              {selected.length > 0 && (
                <span className="rounded-full bg-white/25 px-1.5 text-[11px] font-semibold">
                  {selected.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      <WarehouseSummaryCards
        summary={summary.data}
        loading={summary.loading}
        onOpenReceipts={() => dispatch(setActiveTab(RECEIPTS_TAB))}
      />

      <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
        {TABS.map((tab) => {
          const count =
            tab.key === STOCK_TAB
              ? stock.total
              : tab.key === RECEIPTS_TAB
                ? pending.total
                : movements.total;

          return (
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
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={
                isStock
                  ? stock.filters.search
                  : isReceipts
                    ? pending.filters.search
                    : movements.filters.search
              }
              onChange={(event) => {
                if (isStock) {
                  dispatch(
                    setStockFilter({ key: 'search', value: event.target.value })
                  );
                } else if (isReceipts) {
                  dispatch(setPendingSearch(event.target.value));
                } else {
                  dispatch(
                    setMovementFilter({
                      key: 'search',
                      value: event.target.value,
                    })
                  );
                }
              }}
              placeholder={
                isStock
                  ? 'Malzeme adı, parça no veya raf ara...'
                  : isReceipts
                    ? 'Talep, parça no veya makine ara...'
                    : 'Malzeme, belge no veya makine ara...'
              }
              className={`${filterInputClass} pl-9`}
            />
          </div>

          <div className="flex items-center gap-2">
            {!isReceipts && (
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
                {(isStock ? stockFilterCount : movementFilterCount) > 0 && (
                  <span className="rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold text-white">
                    {isStock ? stockFilterCount : movementFilterCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={refreshAll}
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

        {filtersOpen && isStock && (
          <div className="grid grid-cols-1 gap-3 border-t border-gray-100 bg-gray-50/60 p-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="warehouse-territory"
                className="mb-1 block text-xs font-medium text-gray-600"
              >
                Bölge
              </label>
              <select
                id="warehouse-territory"
                value={stock.filters.territory_id}
                onChange={(event) =>
                  dispatch(
                    setStockFilter({
                      key: 'territory_id',
                      value: event.target.value,
                    })
                  )
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

            <div className="flex items-end">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={stock.filters.low_stock}
                  onChange={(event) =>
                    dispatch(
                      setStockFilter({
                        key: 'low_stock',
                        value: event.target.checked,
                      })
                    )
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Yalnızca kritik stok
              </label>
            </div>
          </div>
        )}

        {filtersOpen && !isStock && !isReceipts && (
          <div className="grid grid-cols-1 gap-3 border-t border-gray-100 bg-gray-50/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="warehouse-movement-type"
                className="mb-1 block text-xs font-medium text-gray-600"
              >
                Hareket Tipi
              </label>
              <select
                id="warehouse-movement-type"
                value={movements.filters.movement_type}
                onChange={(event) =>
                  dispatch(
                    setMovementFilter({
                      key: 'movement_type',
                      value: event.target.value,
                    })
                  )
                }
                className={filterInputClass}
              >
                <option value="">Tümü</option>
                <option value="giris">Giriş</option>
                <option value="cikis">Çıkış</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="warehouse-date-from"
                className="mb-1 block text-xs font-medium text-gray-600"
              >
                Başlangıç Tarihi
              </label>
              <input
                id="warehouse-date-from"
                type="date"
                value={movements.filters.date_from}
                onChange={(event) =>
                  dispatch(
                    setMovementFilter({
                      key: 'date_from',
                      value: event.target.value,
                    })
                  )
                }
                className={filterInputClass}
              />
            </div>

            <div>
              <label
                htmlFor="warehouse-date-to"
                className="mb-1 block text-xs font-medium text-gray-600"
              >
                Bitiş Tarihi
              </label>
              <input
                id="warehouse-date-to"
                type="date"
                value={movements.filters.date_to}
                onChange={(event) =>
                  dispatch(
                    setMovementFilter({
                      key: 'date_to',
                      value: event.target.value,
                    })
                  )
                }
                className={filterInputClass}
              />
            </div>

            {movements.filters.item_id && (
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() =>
                    dispatch(
                      setMovementFilter({ key: 'item_id', value: '' })
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
                >
                  Yalnızca seçili stok kartı
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {(error || mutationError) && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error || mutationError}</p>
        </div>
      )}

      {isStock && (
        <StockTable
          items={items}
          loading={loading}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
          onEntry={handleEntry}
          onIssue={handleIssue}
          onEdit={openEdit}
          onDelete={handleDelete}
          onShowMovements={handleShowMovements}
          rowBusy={rowBusy}
        />
      )}

      {isReceipts && (
        <PendingReceiptTable
          items={items}
          loading={loading}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
          selectedIds={selected}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleSelectAll}
          onReceive={handleReceiveOne}
          busyId={receiptBusyId}
        />
      )}

      {!isStock && !isReceipts && (
        <MovementTable
          items={items}
          loading={loading}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
        />
      )}

      <WarehousePagination scope={activeTab} />

      <StockFormModal
        open={stockForm.open}
        item={stockForm.item}
        onClose={() => setStockForm({ open: false, item: null })}
        onSaved={refreshAll}
      />

      <StockMoveModal
        open={move.open}
        item={move.item}
        direction={move.direction}
        onClose={() =>
          setMove({ open: false, item: null, direction: MOVEMENT_IN })
        }
        onSaved={refreshAll}
      />

      <ReceiptModal
        open={Boolean(receiptRows)}
        rows={receiptRows || []}
        onClose={handleCloseReceipt}
        onSaved={handleReceiptSaved}
      />
    </div>
  );
}

