import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ErrorBoundary from '../ui/ErrorBoundary';

const ProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  // Sayfa içinde oluşan bir render/DOM hatası yalnızca içerik alanını düşürür;
  // Navbar ve yönlendirme çalışmaya devam eder ("Tekrar dene" ile sayfa
  // yeniden mount edilir).
  return (
    <ErrorBoundary title="Sayfa görüntülenemedi">{children}</ErrorBoundary>
  );
};

export default ProtectedRoute;