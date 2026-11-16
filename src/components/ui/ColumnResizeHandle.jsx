// src/components/ui/ColumnResizeHandle.jsx
// Sütun başlığının sağ kenarındaki ince tutamaç. Excel'deki gibi:
// basılı tutup sürükleyince sütun genişler/daralır, çift tıklayınca varsayılan
// genişliğe döner. Klavyeyle de çalışır (odaklan → sol/sağ ok).
import { KEY_STEP } from './useColumnResize';

export default function ColumnResizeHandle({
  label,
  active = false,
  onPointerDown,
  onNudge,
  onReset,
}) {
  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      event.stopPropagation();
      onNudge?.(-KEY_STEP);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      event.stopPropagation();
      onNudge?.(KEY_STEP);
      return;
    }

    if (event.key === 'Enter' || event.key === 'Home') {
      event.preventDefault();
      event.stopPropagation();
      onReset?.();
    }
  };

  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label={
        label
          ? `${label} sütun genişliğini ayarla`
          : 'Sütun genişliğini ayarla'
      }
      title="Genişletmek için sürükle · Çift tıkla: varsayılan genişlik"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={handleKeyDown}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onReset?.();
      }}
      className={`absolute inset-y-0 right-0 z-10 w-2 cursor-col-resize touch-none border-r-2 outline-none transition focus-visible:bg-blue-100 ${
        active
          ? 'border-blue-500 bg-blue-100/80'
          : 'border-gray-300/80 hover:border-blue-500 hover:bg-blue-100/70'
      }`}
    />
  );
}
