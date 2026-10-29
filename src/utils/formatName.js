// Names are stored lowercase in PostgreSQL (see auth_repository.register), so the
// UI Title-Cases them with Turkish casing rules ("ilyas" -> "İlyas").

const TR_LOCALE = 'tr-TR';

/**
 * Title-Case a name value. Values that were typed with their own capitalisation
 * (e.g. "IT Sorumlusu", "Bakım Şefi") are returned untouched.
 */
export function formatPersonName(value) {
  if (!value) return '';

  const trimmed = String(value).trim();
  if (trimmed !== trimmed.toLocaleLowerCase(TR_LOCALE)) {
    return trimmed;
  }

  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toLocaleUpperCase(TR_LOCALE) + word.slice(1))
    .join(' ');
}

export function buildFullName(firstname, lastname) {
  return [formatPersonName(firstname), formatPersonName(lastname)]
    .filter(Boolean)
    .join(' ');
}

export function buildInitials(firstname, lastname) {
  const first = String(firstname || '').trim().charAt(0);
  const last = String(lastname || '').trim().charAt(0);
  return `${first}${last}`.toLocaleUpperCase(TR_LOCALE);
}
