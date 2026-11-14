// src/components/ui/useColumnVisibility.js
// Tablo sütunlarının görünürlüğünü yöneten küçük bir hook.
// Başlangıçta tüm sütunlar açıktır (varsayılan durum), kullanıcı istediğini gizler.
// Gizleme yalnızca arayüzü etkiler; tabloya giden veri/filtre değişmez.
import { useCallback, useState } from 'react';

export default function useColumnVisibility(columnIds) {
  //: Gizlenen sütunların id'leri. Boş dizi = hepsi görünür.
  const [hiddenIds, setHiddenIds] = useState([]);

  const isVisible = useCallback(
    (id) => !hiddenIds.includes(id),
    [hiddenIds]
  );

  const toggle = useCallback((id) => {
    setHiddenIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  }, []);

  const showAll = useCallback(() => setHiddenIds([]), []);

  const hideAll = useCallback(() => setHiddenIds([...columnIds]), [columnIds]);

  const visibleCount = columnIds.filter(
    (id) => !hiddenIds.includes(id)
  ).length;
  const totalCount = columnIds.length;
  const allVisible = visibleCount === totalCount;
  const allHidden = totalCount > 0 && visibleCount === 0;

  return {
    isVisible,
    toggle,
    showAll,
    hideAll,
    visibleCount,
    totalCount,
    allVisible,
    allHidden,
  };
}
