// src/pages/Settings.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import { Tab } from '@headlessui/react';

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

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Aktiv tab dəyişdikdə fetch et
  useEffect(() => {
    dispatch(fetchLookup(activeTab));
  }, [activeTab, dispatch]);

  // ---------- CREATE ----------
  const handleCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  // ---------- EDIT ----------
  const handleEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  // ---------- SUBMIT (create və ya update) ----------
  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        await dispatch(
          updateLookup({ key: activeTab, id: editingItem.id, payload })
        ).unwrap();
        toast.success('Uğurla yeniləndi');
      } else {
        await dispatch(
          createLookup({ key: activeTab, payload })
        ).unwrap();
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

  // ---------- DELETE ----------
  const handleDeleteClick = (item) => {
    setDeletingItem(item);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await dispatch(
        deleteLookup({ key: activeTab, id: deletingItem.id })
      ).unwrap();
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
    <div className="p-6">
      {/* Toast container */}
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tənzimləmələr</h1>
        <p className="mt-1 text-sm text-gray-500">
          Siyahıları idarə edin — yarat, redaktə et, sil
        </p>
      </div>

      {/* Tabs */}
      <Tab.Group
        selectedIndex={tabs.findIndex((t) => t.key === activeTab)}
        onChange={(idx) => dispatch(setActiveTab(tabs[idx].key))}
      >
        <Tab.List className="mb-6 flex flex-wrap gap-1 border-b border-gray-200">
          {tabs.map((tab) => (
            <Tab
              key={tab.key}
              className={({ selected }) =>
                classNames(
                  'rounded-t-lg px-4 py-2.5 text-sm font-medium outline-none transition',
                  selected
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                )
              }
            >
              {tab.label}
            </Tab>
          ))}
        </Tab.List>
      </Tab.Group>

      {/* Table */}
      <LookupTable
        items={currentItems}
        loading={loading}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {/* Create / Update Modal */}
      <LookupModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmit}
        title={
          editingItem
            ? `${currentConfig.label} — Redaktə et`
            : `${currentConfig.label} — Yeni əlavə et`
        }
        initialValue={editingItem?.name || ''}
        loading={submitting}
      />

      {/* Delete Confirm */}
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