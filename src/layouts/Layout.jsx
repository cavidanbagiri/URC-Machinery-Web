import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../pages/Navbar';

// Navbar kalıcı bir yan panel değil: ikon şeridi (w-16) sabit kalır, butona
// basıldığında panel içeriğin ÜZERİNE modal gibi açılır. Bu yüzden açık/kapalı
// tercihi saklanmaz; sayfa her açılışta daraltılmış başlar.
const Layout = () => {
  const [isNavExpanded, setIsNavExpanded] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Navbar
        expanded={isNavExpanded}
        onToggle={() => setIsNavExpanded((prev) => !prev)}
        onClose={() => setIsNavExpanded(false)}
      />
      {/* İçerik her zaman daraltılmış şeride göre hizalanır; menü açılınca kaymaz. */}
      <main className="ml-16 min-h-screen flex-1 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;