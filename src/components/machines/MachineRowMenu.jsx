// src/components/machines/MachineRowMenu.jsx
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  EllipsisVerticalIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export default function MachineRowMenu({
  machine,
  onUpdate,
  onDelete,
  onDetail,
  onChangeStatus,
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // Aç / bağ
  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 192; // w-48
      const menuHeight = 200; // təxmini

      // Ekranın aşağısına sığmırsa yuxarı aç
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < menuHeight;

      setPosition({
        top: openUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
        left: Math.max(8, rect.right - menuWidth),
      });
    }
    setOpen((v) => !v);
  };


useEffect(() => {
  if (!open) return;

  const handleClickOutside = (e) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(e.target) &&
      buttonRef.current &&
      !buttonRef.current.contains(e.target)
    ) {
      setOpen(false);
    }
  };

  const handleScroll = () => setOpen(false);
  const handleResize = () => setOpen(false);
  const handleEsc = (e) => e.key === 'Escape' && setOpen(false);

  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('scroll', handleScroll, true);  // ← DƏYİŞDİ
  window.addEventListener('resize', handleResize);
  document.addEventListener('keydown', handleEsc);

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('scroll', handleScroll, true);  // ← DƏYİŞDİ
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('keydown', handleEsc);
  };
}, [open]);

  const handleAction = (fn) => {
    setOpen(false);
    fn(machine);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
            style={{ top: position.top, left: position.left }}
          >
            <MenuItem
              icon={<PencilSquareIcon className="h-4 w-4" />}
              label="Güncelle"
              onClick={() => handleAction(onUpdate)}
              color="blue"
            />
            <MenuItem
              icon={<ArrowPathIcon className="h-4 w-4" />}
              label="Durum Değiştir"
              onClick={() => handleAction(onChangeStatus)}
              color="yellow"
            />
            <MenuItem
              icon={<EyeIcon className="h-4 w-4" />}
              label="Detaylar"
              onClick={() => handleAction(onDetail)}
              color="gray"
            />
            <div className="my-1 border-t border-gray-100" />
            <MenuItem
              icon={<TrashIcon className="h-4 w-4" />}
              label="Sil"
              onClick={() => handleAction(onDelete)}
              color="red"
            />
          </div>,
          document.body
        )}
    </>
  );
}

// =========================================================
// MENU ITEM
// =========================================================

function MenuItem({ icon, label, onClick, color = 'gray' }) {
  const colors = {
    blue: 'hover:bg-blue-50 hover:text-blue-700',
    yellow: 'hover:bg-yellow-50 hover:text-yellow-700',
    red: 'hover:bg-red-50 hover:text-red-700',
    gray: 'hover:bg-gray-100 hover:text-gray-900',
  };

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 cursor-pointer transition ${colors[color]}`}
    >
      {icon}
      {label}
    </button>
  );
}