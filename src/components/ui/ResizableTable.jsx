// src/components/ui/ResizableTable.jsx
// Excel tarzı sütun genişliği verilen tablo iskeleti. `useColumnResize` hook'u
// ile birlikte kullanılır:
//
//   const resize = useColumnResize('machines:list', MACHINE_COLUMN_WIDTHS);
//   <ResizableTable resize={resize} columnIds={visibleColumnIds}>
//     <thead>
//       <tr>
//         <ResizableTh resize={resize} columnId="status" label="Durum">
//           Durum
//         </ResizableTh>
//       </tr>
//     </thead>
//     <tbody>…</tbody>
//   </ResizableTable>
//
// `table-fixed` sayesinde hücreler <colgroup>'daki genişliklere uyar; sütun
// daraltıldığında içerik komşu sütuna taşmaz (hücrelerde `overflow-hidden`).
// Tablo genişliği = görünür sütunların toplamı, `min-width: 100%` ile panel
// genişken tablo alanı doldurur; sütunlar toplamı panelden büyükse mevcut
// `overflow-x-auto` kabuğu yatay kaydırma verir.
import ColumnResizeHandle from './ColumnResizeHandle';
import { MIN_COLUMN_WIDTH } from './useColumnResize';

export default function ResizableTable({
  resize,
  columnIds,
  className = '',
  style,
  children,
}) {
  return (
    <table
      className={`table-fixed border-collapse ${className}`.trim()}
      style={{
        ...style,
        width: `${resize.totalWidth(columnIds)}px`,
        minWidth: '100%',
      }}
    >
      {/* Gizlenen sütunun <col>'u hiç çizilmez; kalan sütunlar kaymaz. */}
      <colgroup>
        {columnIds.map((id) => (
          <col
            key={id}
            style={{ width: `${resize.widths[id] ?? MIN_COLUMN_WIDTH}px` }}
          />
        ))}
      </colgroup>

      {children}
    </table>
  );
}

/**
 * Sağ kenarında sütun genişletme tutamacı olan `<th>`.
 * Kalan tüm prop'lar (className, colSpan, aria-sort…) doğrudan `<th>`'ye geçer.
 */
export function ResizableTh({
  resize,
  columnId,
  label,
  className = '',
  children,
  ...rest
}) {
  return (
    <th className={`relative ${className}`.trim()} {...rest}>
      {children}

      <ColumnResizeHandle
        label={label}
        active={resize.resizingId === columnId}
        onPointerDown={(event) => resize.startResize(columnId, event)}
        onNudge={(delta) => resize.nudgeColumn(columnId, delta)}
        onReset={() => resize.resetColumn(columnId)}
      />
    </th>
  );
}
