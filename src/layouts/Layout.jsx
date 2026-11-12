import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../pages/Navbar';

const NAVBAR_EXPANDED_KEY = 'navbar_expanded';

const readExpandedPreference = () => {
  try {
    return localStorage.getItem(NAVBAR_EXPANDED_KEY) === 'true';
  } catch {
    return false;
  }
};

const Layout = () => {
  const [isNavExpanded, setIsNavExpanded] = useState(readExpandedPreference);

  // Menünün açık/kapalı tercihini sayfa yenilense de korur.
  useEffect(() => {
    try {
      localStorage.setItem(NAVBAR_EXPANDED_KEY, String(isNavExpanded));
    } catch {
      // localStorage kullanılamıyorsa (gizli mod vb.) sessizce yok say.
    }
  }, [isNavExpanded]);

  return (
    <div className="flex min-h-screen">
      <Navbar
        expanded={isNavExpanded}
        onToggle={() => setIsNavExpanded((prev) => !prev)}
      />
      <main
        className={`flex-1 bg-gray-50 min-h-screen transition-[margin] duration-300 ease-in-out ${
          isNavExpanded ? 'ml-64' : 'ml-16'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;