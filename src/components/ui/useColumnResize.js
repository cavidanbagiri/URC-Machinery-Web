// src/components/ui/useColumnResize.js
// Tablo sütunlarını Excel'deki gibi fareyle genişletip daraltmayı sağlayan hook.
// Genişlikler piksel olarak tutulur ve tarayıcıda (localStorage) saklanır, böylece
// sayfa yenilenince sütunlar kullanıcının bıraktığı genişlikte açılır.
// Sadece görünümü etkiler: tabloya giden veri/filtre değişmez.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

//: Bir sütunun küçülebileceği en dar genişlik (başlık + tutamaç sığsın).
export const MIN_COLUMN_WIDTH = 56;

//: localStorage anahtarlarının ortak ön eki.
const STORAGE_PREFIX = 'urc:table-columns:';

//: Klavyeyle (ok tuşları) yapılan genişlik adımı.
export const KEY_STEP = 16;

function storageKeyOf(key) {
  return `${STORAGE_PREFIX}${key}`;
}

//: Kayıtlı genişlikleri okur; bozuk/eski kayıt tabloyu kilitlemesin diye süzülür.
function readStoredWidths(key) {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(storageKeyOf(key));
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, value]) =>
          typeof value === 'number' &&
          Number.isFinite(value) &&
          value >= MIN_COLUMN_WIDTH
      )
    );
  } catch {
    return {};
  }
}

/**
 * `defaultWidths` sütun id'si → başlangıç genişliği (px) eşlemesidir ve modül
 * seviyesinde sabit tanımlanmalıdır (her render'da yeni nesne olmasın).
 *
 * Dönen değerler:
 * - `widths`        : güncel genişlikler (px)
 * - `resizingId`    : o an sürüklenen sütun id'si (yoksa null)
 * - `startResize`   : `(id, pointerEvent)` — tutamaçta pointerdown ile çağrılır
 * - `nudgeColumn`   : `(id, delta)` — klavyeyle genişletme/daraltma
 * - `resetColumn`   : `(id)` — sütunu varsayılan genişliğe döndürür
 * - `resetAll`      : tüm sütunları varsayılana döndürür
 * - `totalWidth`    : `(ids)` — verilen sütunların toplam genişliği (px)
 * - `isCustomized`  : en az bir sütun varsayılandan farklı mı?
 */
export default function useColumnResize(storageKey, defaultWidths) {
  const [widths, setWidths] = useState(() => ({
    ...defaultWidths,
    ...readStoredWidths(storageKey),
  }));
  const [resizingId, setResizingId] = useState(null);
  const widthsRef = useRef(widths);

  useEffect(() => {
    widthsRef.current = widths;
  }, [widths]);

  //: Genişlikleri tarayıcıya yazar (her pikselde değil, sürükleme bitince).
  const persist = useCallback(
    (next) => {
      if (typeof window === 'undefined') return;

      try {
        window.localStorage.setItem(storageKeyOf(storageKey), JSON.stringify(next));
      } catch {
        // Depolama kapalıysa (gizli sekme / kota) sessizce devam et.
      }
    },
    [storageKey]
  );

  const startResize = useCallback(
    (id, event) => {
      // Sadece sol tuş / tek dokunuş.
      if (event.button !== undefined && event.button !== 0) return;

      // Sütun başlığındaki filtre menüsü açılmasın, metin seçilmesin.
      event.preventDefault();
      event.stopPropagation();

      const startX = event.clientX;
      const startWidth = widthsRef.current[id] ?? MIN_COLUMN_WIDTH;
      let latest = null;

      const handleMove = (moveEvent) => {
        const next = Math.max(
          MIN_COLUMN_WIDTH,
          Math.round(startWidth + (moveEvent.clientX - startX))
        );

        latest = next;
        setWidths((prev) => (prev[id] === next ? prev : { ...prev, [id]: next }));
      };

      const handleUp = () => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        window.removeEventListener('pointercancel', handleUp);
        document.body.classList.remove('cursor-col-resize', 'select-none');

        setResizingId(null);
        persist({ ...widthsRef.current, ...(latest === null ? {} : { [id]: latest }) });
      };

      setResizingId(id);
      document.body.classList.add('cursor-col-resize', 'select-none');
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointercancel', handleUp);
    },
    [persist]
  );

  const nudgeColumn = useCallback(
    (id, delta) => {
      const next = Math.max(
        MIN_COLUMN_WIDTH,
        Math.round((widthsRef.current[id] ?? MIN_COLUMN_WIDTH) + delta)
      );
      const merged = { ...widthsRef.current, [id]: next };

      widthsRef.current = merged;
      setWidths(merged);
      persist(merged);
    },
    [persist]
  );

  const resetColumn = useCallback(
    (id) => {
      const merged = { ...widthsRef.current, [id]: defaultWidths[id] };

      widthsRef.current = merged;
      setWidths(merged);
      persist(merged);
    },
    [defaultWidths, persist]
  );

  const resetAll = useCallback(() => {
    const merged = { ...defaultWidths };

    widthsRef.current = merged;
    setWidths(merged);
    persist(merged);
  }, [defaultWidths, persist]);

  const totalWidth = useCallback(
    (ids) =>
      ids.reduce(
        (sum, id) => sum + (widths[id] ?? defaultWidths[id] ?? MIN_COLUMN_WIDTH),
        0
      ),
    [widths, defaultWidths]
  );

  const isCustomized = useMemo(
    () =>
      Object.keys(defaultWidths).some(
        (id) => (widths[id] ?? defaultWidths[id]) !== defaultWidths[id]
      ),
    [widths, defaultWidths]
  );

  return {
    widths,
    resizingId,
    startResize,
    nudgeColumn,
    resetColumn,
    resetAll,
    totalWidth,
    isCustomized,
  };
}
