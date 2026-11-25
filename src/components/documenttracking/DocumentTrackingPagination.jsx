// src/components/documenttracking/DocumentTrackingPagination.jsx
// Sayfalama görünümü ortak `ui/Pagination` bileşeninde; burada yalnızca
// doküman takibi slice'ının limit / offset değerleri bağlanır.
import { useDispatch, useSelector } from 'react-redux';

import Pagination from '../ui/Pagination';
import { setLimit, setOffset } from '../../stores/document_tracking_slice';

export default function DocumentTrackingPagination({ onNavigate }) {
  const dispatch = useDispatch();
  const { total, limit, offset, loading } = useSelector(
    (s) => s.documentTracking
  );

  return (
    <Pagination
      total={total}
      limit={limit}
      offset={offset}
      loading={loading}
      selectId="document-tracking-page-size"
      onPageChange={(page) => {
        onNavigate?.();
        dispatch(setOffset((page - 1) * limit));
      }}
      onLimitChange={(size) => {
        onNavigate?.();
        dispatch(setLimit(size));
      }}
    />
  );
}
