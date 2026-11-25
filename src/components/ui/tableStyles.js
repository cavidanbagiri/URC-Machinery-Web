// src/components/ui/tableStyles.js
// Tabloların ortak görsel dili. İlk olarak Periyodik Bakım sayfasında
// (MaintenanceTable / MaintenanceArchiveTable) kullanıldı; diğer sayfalardaki
// tablolar da bu sabitleri import ederek aynı görünüme kavuşabilir.
//
// Renk skalası `slate`: sayfadaki `gray` tonlarıyla neredeyse aynı okunur ama
// daha soğuk/pürüzsüz bir yüzey verir; durum renkleri (badge / progress bar)
// ayrı tutulur, böylece tablo sakin kalır.

//: Tablo kartı — yumuşak köşe, ince çerçeve ve derinlik veren gölge.
export const TABLE_CARD =
  'overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_14px_36px_-20px_rgba(15,23,42,0.20)]';

//: Kartın üst şeridi (kayıt sayısı + sütun sıfırlama gibi araçlar).
export const TABLE_TOOLBAR =
  'flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2';

//: Tablo başlığı: küçük, harf aralıklı, sakin renk.
export const TABLE_HEAD =
  'bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500';

//: Başlık hücresi (`<th>`); hizalama çağıran tarafından eklenir.
export const TABLE_HEAD_CELL = 'px-4 py-3 font-semibold';

//: Gövde tipografisi.
export const TABLE_BODY = 'text-[12px] text-slate-700';

//: Satır: hover'da yumuşak vurgu; `group` içindeki aksiyonlar için kullanılır.
export const TABLE_ROW = 'group transition-colors hover:bg-slate-50/70';

//: Standart hücre boşluğu (sütun genişliği sabit olduğu için nowrap).
export const TABLE_CELL = 'whitespace-nowrap px-4 py-3';

//: Birincil metin (makine kimliği gibi).
export const TABLE_PRIMARY = 'text-[13px] font-semibold text-slate-900';

//: İkincil metin (plaka, model, sayaç tarihi).
export const TABLE_MUTED = 'text-[11px] text-slate-500';

//: Üçüncül metin (ipucu, tarih altı bilgi).
export const TABLE_TERTIARY = 'text-[11px] text-slate-400';

//: Sayısal hücrelerde rakamların hizalanması.
export const TABLE_NUM = 'tabular-nums';
