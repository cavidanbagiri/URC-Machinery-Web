// src/pages/Stock.jsx
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import StockSummaryCards from '../components/stock/StockSummaryCards';
import StockItemsTable from '../components/stock/StockItemsTable';
import StockIssuesTable from '../components/stock/StockIssuesTable';
import StockPagination from '../components/stock/StockPagination';
import StockItemFormModal from '../components/stock/StockItemFormModal';
import StockIssueModal from '../components/stock/StockIssueModal';
import {
  ITEMS_TAB,
  ISSUES_TAB,
  deleteStockIssue,
  deleteStockItem,
  fetchStockIssues,
  fetchStockItems,
  fetchStockSummary,
  resetIssueFilters,
  resetItemFilters,
  setActiveTab,
  setIssueFilter,
  setIssueLimit,
  setIssueOffset,
  setItemLimit,
  setItemOffset,
  setItemSearch,
} from '../stores/stock_slice';

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

function TabButton({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition ${
        active
          ? 'text-blue-700'
          : 'text-gray-500 hover:text-gray-800'
      }`}
    >
      {label}
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
          active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {count}
      </span>
      {active && (
        <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-blue-600" />
      )}
    </button>
  );
}

export default function Stock() {
  const dispatch = useDispatch();
  const {
    activeTab,
    items,
    issues,
    summary,
    rowBusy,
  } = useSelector((state) => state.stock);

  const [itemModal, setItemModal] = useState({ open: false, item: null });
  const [issueModal, setIssueModal] = useState({ open: false, item: null });
  const [itemSearchDraft, setItemSearchDraft] = useState(
    items.filters.search || ''
  );
  const [issueSearchDraft, setIssueSearchDraft] = useState(
    issues.filters.search || ''
  );

  const refreshAll = useCallback(() => {
    dispatch(fetchStockSummary());
    dispatch(fetchStockItems());
    dispatch(fetchStockIssues());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchStockSummary());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchStockItems());
  }, [
    dispatch,
    items.limit,
    items.offset,
    items.filters.search,
  ]);

  useEffect(() => {
    dispatch(fetchStockIssues());
  }, [
    dispatch,
    issues.limit,
    issues.offset,
    issues.filters.search,
    issues.filters.date_from,
    issues.filters.date_to,
  ]);

  // Yazarken her tuşta istek atmayalım.
  useEffect(() => {
    if (itemSearchDraft === items.filters.search) return undefined;
    const timer = setTimeout(
      () => dispatch(setItemSearch(itemSearchDraft)),
      350
    );
    return () => clearTimeout(timer);
  }, [itemSearchDraft, items.filters.search, dispatch]);

  useEffect(() => {
    if (issueSearchDraft === issues.filters.search) return undefined;
    const timer = setTimeout(
      () =>
        dispatch(setIssueFilter({ key: 'search', value: issueSearchDraft })),
      350
    );
    return () => clearTimeout(timer);
  }, [issueSearchDraft, issues.filters.search, dispatch]);

  const refreshing =
    items.loading || issues.loading || summary.loading;

  const openNewItem = () => setItemModal({ open: true, item: null });
  const openEditItem = (item) => setItemModal({ open: true, item });
  const openIssue = (item) =>
    setIssueModal({ open: true, item: item || null });

  const handleDeleteItem = async (item) => {
    const confirmed = window.confirm(
      `"${item.name}" malzeme kartını silmek istediğinize emin misiniz?\n\n` +
        'Karta bağlı sahaya çıkış kayıtları da silinecek.'
    );
    if (!confirmed) return;

    try {
      await dispatch(deleteStockItem(item.id)).unwrap();
      toast.success('Malzeme silindi');
      refreshAll();
    } catch (err) {
      toast.error(String(err || 'Malzeme silinemedi'));
    }
  };

  const handleDeleteIssue = async (issue) => {
    const confirmed = window.confirm(
      `"${issue.item_name}" için ${issue.quantity} ${issue.unit} çıkış kaydı silinsin mi?\n\n` +
        'Miktar stoğa geri eklenecek.'
    );
    if (!confirmed) return;

    try {
      const result = await dispatch(deleteStockIssue(issue.id)).unwrap();
      toast.success(
        `Kayıt silindi; stoğa ${result.quantity} ${issue.unit} geri eklendi`
      );
      refreshAll();
    } catch (err) {
      toast.error(String(err || 'Kayıt silinemedi'));
    }
  };

  const resetItemSearch = () => {
    setItemSearchDraft('');
    dispatch(resetItemFilters());
  };

  const clearIssueSearch = () => {
    setIssueSearchDraft('');
    dispatch(setIssueFilter({ key: 'search', value: '' }));
  };

  const clearIssueFilters = () => {
    setIssueSearchDraft('');
    dispatch(resetIssueFilters());
  };

  const itemFilterCount = items.filters.search ? 1 : 0;
  const issueFilterCount = [
    issues.filters.search,
    issues.filters.date_from,
    issues.filters.date_to,
  ].filter(Boolean).length;

  return (
    <div className="mx-auto px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Stok</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sahada kullanılan malzemelerin basit stok takibi; kart açın, sahaya
            çıkış işleyin, kalan miktarı görün.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshAll}
            disabled={refreshing}
            title="Yenile"
            aria-label="Stok verilerini yenile"
            className="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            type="button"
            onClick={openNewItem}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            Yeni Malzeme
          </button>
        </div>
      </div>

      <div className="mt-5">
        <StockSummaryCards summary={summary.data} loading={summary.loading} />
      </div>

      <div className="mt-5 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-3">
          <div className="flex items-center gap-1">
            <TabButton
              active={activeTab === ITEMS_TAB}
              label="Stok"
              count={items.total}
              onClick={() => dispatch(setActiveTab(ITEMS_TAB))}
            />
            <TabButton
              active={activeTab === ISSUES_TAB}
              label="Sahaya Çıkanlar"
              count={issues.total}
              onClick={() => dispatch(setActiveTab(ISSUES_TAB))}
            />
          </div>

          {activeTab === ISSUES_TAB && (
            <button
              type="button"
              onClick={() => openIssue(null)}
              className="mb-1 inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
            >
              <PlusIcon className="h-4 w-4" />
              Sahaya Çıkış
            </button>
          )}
        </div>

        {activeTab === ITEMS_TAB && (
          <div className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full max-w-md">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={itemSearchDraft}
                  onChange={(event) => setItemSearchDraft(event.target.value)}
                  placeholder="Malzeme adı ara..."
                  className={`${inputClass} pl-9 pr-9`}
                />
                {itemSearchDraft && (
                  <button
                    type="button"
                    onClick={resetItemSearch}
                    title="Aramayı temizle"
                    aria-label="Aramayı temizle"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="text-xs text-gray-500">
                {items.total} kart
                {itemFilterCount > 0 ? ' (filtreli)' : ''}
              </div>
            </div>

            <StockItemsTable
              items={items.items}
              loading={items.loading}
              hasActiveFilters={itemFilterCount > 0}
              onResetFilters={resetItemSearch}
              onIssue={openIssue}
              onEdit={openEditItem}
              onDelete={handleDeleteItem}
              rowBusy={rowBusy}
            />

            {items.error && (
              <p className="mt-3 text-sm text-rose-600">{items.error}</p>
            )}

            <StockPagination
              id="stock-items"
              total={items.total}
              limit={items.limit}
              offset={items.offset}
              loading={items.loading}
              onOffsetChange={(value) => dispatch(setItemOffset(value))}
              onLimitChange={(value) => dispatch(setItemLimit(value))}
            />
          </div>
        )}


        {activeTab === ISSUES_TAB && (
          <div className="p-4">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-2">
                <div className="relative w-full max-w-xs">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={issueSearchDraft}
                    onChange={(event) => setIssueSearchDraft(event.target.value)}
                    placeholder="Malzeme / makine / kişi ara..."
                    className={`${inputClass} pl-9 pr-9`}
                  />
                  {issueSearchDraft && (
                    <button
                      type="button"
                      onClick={clearIssueSearch}
                      title="Aramayı temizle"
                      aria-label="Aramayı temizle"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <label
                    className="mb-1 block text-[11px] font-medium text-gray-500"
                    htmlFor="stock-issue-date-from"
                  >
                    Başlangıç
                  </label>
                  <input
                    id="stock-issue-date-from"
                    type="date"
                    value={issues.filters.date_from}
                    onChange={(event) =>
                      dispatch(
                        setIssueFilter({
                          key: 'date_from',
                          value: event.target.value,
                        })
                      )
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-[11px] font-medium text-gray-500"
                    htmlFor="stock-issue-date-to"
                  >
                    Bitiş
                  </label>
                  <input
                    id="stock-issue-date-to"
                    type="date"
                    value={issues.filters.date_to}
                    onChange={(event) =>
                      dispatch(
                        setIssueFilter({
                          key: 'date_to',
                          value: event.target.value,
                        })
                      )
                    }
                    className={inputClass}
                  />
                </div>

                {issueFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearIssueFilters}
                    className="mb-2 text-sm font-medium text-blue-600 hover:underline"
                  >
                    Filtreleri temizle
                  </button>
                )}
              </div>

              <div className="text-xs text-gray-500">
                {issues.total} kayıt
                {issueFilterCount > 0 ? ' (filtreli)' : ''}
              </div>
            </div>

            <StockIssuesTable
              issues={issues.items}
              loading={issues.loading}
              hasActiveFilters={issueFilterCount > 0}
              onResetFilters={clearIssueFilters}
              onDelete={handleDeleteIssue}
              rowBusy={rowBusy}
            />

            {issues.error && (
              <p className="mt-3 text-sm text-rose-600">{issues.error}</p>
            )}

            <StockPagination
              id="stock-issues"
              total={issues.total}
              limit={issues.limit}
              offset={issues.offset}
              loading={issues.loading}
              onOffsetChange={(value) => dispatch(setIssueOffset(value))}
              onLimitChange={(value) => dispatch(setIssueLimit(value))}
            />
          </div>
        )}
      </div>

      <StockItemFormModal
        open={itemModal.open}
        item={itemModal.item}
        onClose={() => setItemModal({ open: false, item: null })}
        onSaved={refreshAll}
      />

      <StockIssueModal
        open={issueModal.open}
        item={issueModal.item}
        onClose={() => setIssueModal({ open: false, item: null })}
        onSaved={refreshAll}
      />
    </div>
  );
}

