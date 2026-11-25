// src/components/ui/RouteError.jsx
// Router seviyesindeki hata sayfası (`errorElement`). Bir route bileşeni render
// veya DOM'a yazma (commit) sırasında hata fırlatırsa React Router varsayılan
// olarak ham hata yığınını gösterir; bu bileşen onun yerine anlaşılır bir kart
// ve iki çıkış yolu (panele dön / sayfayı yenile) sunar.
//
// Teknik ayrıntı katlanmış `<details>` içinde tutulur: geliştirici mesajı
// kopyalayabilir, normal kullanıcı ise yalnızca Türkçe açıklamayı görür.
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

function errorDetail(error) {
  if (isRouteErrorResponse(error)) {
    const data = error.data ? ` — ${String(error.data)}` : '';
    return `${error.status} ${error.statusText}${data}`;
  }
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error ?? 'Bilinmeyen hata');
}

export default function RouteError() {
  const error = useRouteError();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-lg rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
          <ExclamationTriangleIcon className="h-5 w-5" />
        </span>

        <h1 className="mt-4 text-lg font-semibold text-slate-900">
          Beklenmeyen bir hata oluştu
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Sayfa yüklenirken bir sorun çıktı. Sayfayı yenilemek genellikle yeterli
          olur; hata sürerse panele dönüp tekrar deneyin.
        </p>

        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-blue-700"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" />
            Sayfayı yenile
          </button>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Panele dön
          </Link>
        </div>

        <details className="mt-6 text-left">
          <summary className="cursor-pointer text-[11px] font-medium text-slate-400 hover:text-slate-600">
            Teknik ayrıntı
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
            {errorDetail(error)}
          </pre>
        </details>
      </div>
    </div>
  );
}
