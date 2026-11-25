// src/components/purchaserequest/PurchaseRequestPagination.jsx
// Sayfalama görünümü ortak `ui/Pagination` bileşeninde; burada aktif sekmeye
// (yedek parça / servis) göre doğru limit / offset değerleri bağlanır.
import { useDispatch, useSelector } from 'react-redux';

import Pagination from '../ui/Pagination';
import {
  SERVICE_TAB,
  setServiceLimit,
  setServiceOffset,
  setSpareLimit,
  setSpareOffset,
} from '../../stores/purchase_request_slice';

export default function PurchaseRequestPagination({ scope }) {
  const dispatch = useDispatch();
  const isService = scope === SERVICE_TAB;
  const state = useSelector((s) =>
    isService ? s.purchaseRequest.serviceRequests : s.purchaseRequest.spareParts
  );
  const { total, limit, offset, loading } = state;

  const setOffset = isService ? setServiceOffset : setSpareOffset;
  const setLimit = isService ? setServiceLimit : setSpareLimit;

  return (
    <Pagination
      total={total}
      limit={limit}
      offset={offset}
      loading={loading}
      selectId={`purchase-request-page-size-${scope}`}
      onPageChange={(page) => dispatch(setOffset((page - 1) * limit))}
      onLimitChange={(size) => dispatch(setLimit(size))}
    />
  );
}
