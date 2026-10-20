// src/utils/repair.js

export const REPAIR_STATUS_COLORS = {
  tamirde: 'blue',
  tamamlandi: 'green',
  iptal: 'slate',
};

export const REPAIR_STATUS_LABELS = {
  tamirde: 'Tamirde',
  tamamlandi: 'Tamamlandı',
  iptal: 'İptal edildi',
};

export function repairStatusBadge(status) {
  if (!status) return null;
  return {
    code: status.code || status,
    name: status.name || REPAIR_STATUS_LABELS[status.code || status] || status,
    color: status.color || REPAIR_STATUS_COLORS[status.code || status] || 'gray',
  };
}

export function formatDate(value) {
  if (!value) return '—';
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString('tr-TR');
    }
    return new Date(value).toLocaleDateString('tr-TR');
  } catch {
    return value;
  }
}

export function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function toNullableText(value) {
  if (value === '' || value === null || value === undefined) return null;
  return String(value).trim() || null;
}

export function durationLabel(days) {
  if (days === null || days === undefined) return '—';
  return `${days} gün`;
}

export function remainingLabel(item) {
  if (!item || item.status !== 'tamirde') return null;
  if (item.days_remaining === null || item.days_remaining === undefined) {
    return 'Tahmini tarih yok';
  }
  if (item.days_remaining < 0) {
    return `${Math.abs(item.days_remaining)} gün gecikti`;
  }
  if (item.days_remaining === 0) return 'Bugün bitmeli';
  return `${item.days_remaining} gün kaldı`;
}

export function machineLabel(machine) {
  if (!machine) return '';
  return (
    machine.identification_no ||
    machine.plate_no ||
    machine.vin_no ||
    `Makine #${machine.machine_id || machine.id}`
  );
}
