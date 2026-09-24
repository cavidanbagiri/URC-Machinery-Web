import { Outlet } from 'react-router-dom';
import Navbar from '../pages/Navbar';

const Layout = () => {
  return (
    <div className="flex min-h-screen">
      <Navbar />
      <main className="flex-1 ml-16 bg-gray-50 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;