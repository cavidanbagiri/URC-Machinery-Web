// src/components/ui/ErrorBoundary.jsx
// React hata sınırı: alt ağaç render/commit sırasında hata fırlatırsa tüm
// uygulamanın boş ekrana düşmesini engeller.
//
// Neden gerekli: React, güncellemeyi DOM'a yazarken `insertBefore(yeni, çapa)`
// çağırır ve çapa düğümünün hâlâ aynı ebeveynin çocuğu olmasını bekler. Tarayıcı
// çevirisi (Google Translate) veya çeviri/erişilebilirlik eklentileri React'in
// yönettiği metin düğümlerini `<font>` gibi sarmalayıcılarla değiştirebiliyor;
// sonraki güncellemede React `NotFoundError: Failed to execute 'insertBefore'
// ...` alır ve sınır yoksa ağacın tamamını söker. Bu sınır hatayı yakalar,
// kullanıcıya anlaşılır bir kart gösterir ve "Tekrar dene" ile alt ağacı temiz
// bir DOM ile yeniden mount eder.
import { Component } from 'react';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const PRIMARY_BUTTON =
  'inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-blue-700';
const SECONDARY_BUTTON =
  'inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleRetry = this.handleRetry.bind(this);
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Teknik ayrıntı kullanıcıya gösterilmez; konsolda kalır (destek için).
    console.error('[ErrorBoundary] yakalanan hata:', error, info?.componentStack);
  }

  handleRetry() {
    this.props.onReset?.();
    // Alt ağaç hata anında söküldüğü için state sıfırlanınca sıfırdan mount olur.
    this.setState({ error: null });
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
          <ExclamationTriangleIcon className="h-5 w-5" />
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-900">
          {this.props.title || 'Bu bölüm görüntülenemedi'}
        </p>
        <p className="mt-1 text-[12px] text-slate-500">
          {this.props.hint ||
            'Sayfa yeniden çizilirken beklenmeyen bir durum oluştu. Tekrar deneyin; sorun sürerse sayfayı yenileyin.'}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <button type="button" onClick={this.handleRetry} className={PRIMARY_BUTTON}>
            <ArrowPathIcon className="h-3.5 w-3.5" />
            Tekrar dene
          </button>
          <button
            type="button"
            onClick={this.handleReload}
            className={SECONDARY_BUTTON}
          >
            Sayfayı yenile
          </button>
        </div>
      </div>
    );
  }
}
