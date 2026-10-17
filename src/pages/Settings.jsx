// src/pages/Settings.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import { Tab } from '@headlessui/react';
import { Settings2, Plus } from 'lucide-react';

import {
  fetchLookup,
  createLookup,
  updateLookup,
  deleteLookup,
  setActiveTab,
} from '../stores/setting_slice';
import { LOOKUP_CONFIG } from '../services/SettingsService';

import LookupTable from '../components/settings/LookupTable';
import LookupModal from '../components/settings/LookupModal';
import ConfirmDialog from '../components/settings/ConfirmDialog';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Settings() {
  const dispatch = useDispatch();
  const { data, loading, activeTab } = useSelector((state) => state.setting);

  const tabs = Object.entries(LOOKUP_CONFIG).map(([key, cfg]) => ({
    key,
    label: cfg.label,
  }));

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchLookup(activeTab));
  }, [activeTab, dispatch]);

  const handleCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };
  const handleEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        await dispatch(updateLookup({ key: activeTab, id: editingItem.id, payload })).unwrap();
        toast.success('Uğurla yeniləndi');
      } else {
        await dispatch(createLookup({ key: activeTab, payload })).unwrap();
        toast.success('Uğurla yaradıldı');
      }
      setModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      toast.error(err || 'Xəta baş verdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (item) => {
    setDeletingItem(item);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await dispatch(deleteLookup({ key: activeTab, id: deletingItem.id })).unwrap();
      toast.success('Uğurla silindi');
      setConfirmOpen(false);
      setDeletingItem(null);
    } catch (err) {
      toast.error(err || 'Silinmə xətası');
    } finally {
      setDeleting(false);
    }
  };

  const currentConfig = LOOKUP_CONFIG[activeTab];
  const currentItems = data[activeTab] || [];

  return (
    <div className="space-y-6 p-6">
      <Toaster
        position="top-right"
        toastOptions={{
          className: '!rounded-xl !border !border-gray-200 !bg-white !text-sm !text-gray-800 !shadow-lg',
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      {/* Header — Dashboard ilə eyni */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Settings2 className="h-4 w-4" strokeWidth={2.2} />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Tənzimləmələr
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-gray-500">
            Siyahıları idarə edin — yarat, redaktə et, sil
          </p>
        </div>
      </div>

      {/* Card: Tabs + Table bir kart içində */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <Tab.Group
          selectedIndex={tabs.findIndex((t) => t.key === activeTab)}
          onChange={(idx) => dispatch(setActiveTab(tabs[idx].key))}
        >
          {/* Tab bar — pill style */}
          <div className="border-b border-gray-200 px-4 pt-4">
            <Tab.List className="flex flex-wrap gap-1 mb-4">
              {tabs.map((tab) => (
                <Tab
                  key={tab.key}
                  className={({ selected }) =>
                    classNames(
                      'relative rounded-lg px-3.5 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500',
                      selected
                        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )
                  }
                >
                  {tab.label}
                </Tab>
              ))}
            </Tab.List>
          </div>
        </Tab.Group>

        {/* Table komponenti artıq kart deyil — daxildə table */}
        <LookupTable
          items={currentItems}
          loading={loading}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          configLabel={currentConfig.label}
        />
      </div>

      <LookupModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmit}
        title={
          editingItem
            ? `${currentConfig.label} — Redaktə`
            : `${currentConfig.label} — Yeni əlavə et`
        }
        initialValue={editingItem?.name || ''}
        loading={submitting}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setDeletingItem(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Silməyə əminsiniz?"
        message={
          deletingItem
            ? `"${deletingItem.name}" elementini silmək istədiyinizə əminsiniz?`
            : ''
        }
        loading={deleting}
      />
    </div>
  );
}