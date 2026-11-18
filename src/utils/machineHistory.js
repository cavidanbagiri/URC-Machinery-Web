// src/utils/machineHistory.js
import toast from 'react-hot-toast';

export function errorText(err, fallback) {
  const detail = err?.response?.data?.detail;
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => item?.msg).filter(Boolean);
    if (messages.length) return messages.join(', ');
  }
  if (typeof detail === 'string' && detail.trim()) return detail;
  return err?.message || fallback;
}

export async function viewDocument(load, document) {
  // Open the tab before awaiting so the browser keeps the user gesture.
  const tab = window.open('', '_blank');
  if (!tab) {
    toast.error('Tarayıcı yeni sekmeyi engelledi');
    return;
  }

  try {
    const blob = await load();
    const url = URL.createObjectURL(
      new Blob([blob], { type: document.content_type || 'application/pdf' })
    );
    tab.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch {
    tab.close();
    toast.error('Evrak açılamadı');
  }
}

export async function downloadDocument(load, document) {
  try {
    const blob = await load();
    const url = URL.createObjectURL(
      new Blob([blob], { type: document.content_type || 'application/pdf' })
    );
    const link = window.document.createElement('a');
    link.href = url;
    link.download = document.file_name || 'evrak.pdf';
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch {
    toast.error('Evrak indirilemedi');
  }
}
