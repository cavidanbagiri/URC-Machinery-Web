import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../stores/user_slice';

import { RxDashboard } from "react-icons/rx";
import { BsBoxSeam, BsCartCheck, BsBell, BsTools, BsWrench, BsChatDots } from "react-icons/bs";
import { IoSettingsOutline } from "react-icons/io5";
import { IoIosLogOut } from "react-icons/io";
import FlaticonIcon from '../components/ui/FlaticonIcon';
import { PiCraneTowerBold } from "react-icons/pi";
import { HiOutlineWrench } from "react-icons/hi2";
import { HiOutlineWrenchScrewdriver } from "react-icons/hi2";
import { GiCrane } from "react-icons/gi";
import { PiWrenchLight } from "react-icons/pi";


import logo from '../assets/main_logo.png'



function DataManagementIcon({ className }) {
  return <FlaticonIcon name="truck-side" className={className} />;
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: RxDashboard },
  { to: '/common_cars', label: 'Tum Makineler', icon: GiCrane },
  { to: '/repair', label: 'Arızalı Ekipman', icon: PiWrenchLight },
  { to: '/maintenance', label: 'Bakım', icon: HiOutlineWrenchScrewdriver },
  { to: '/forum', label: 'Forum', icon: BsChatDots },
  { to: '/warehouse_stock', label: 'Depo Stoku', icon: BsBoxSeam },
  { to: '/purchase_orders', label: 'Satın Alma Siparişleri', icon: BsCartCheck },
  { to: '/settings', label: 'Ayarlar', icon: IoSettingsOutline },
  { to: '/notifications', label: 'Bildirimler', icon: BsBell },
];

function NavItem({ item, onShowTooltip, onHideTooltip }) {
  const Icon = item.icon;

  return (
    <li className='flex w-full'>
      <NavLink
        to={item.to}
        aria-label={item.label}
        onMouseEnter={(event) => onShowTooltip(event, item.label)}
        onMouseLeave={onHideTooltip}
        onFocus={(event) => onShowTooltip(event, item.label)}
        onBlur={onHideTooltip}
        className={({ isActive }) =>
          `flex items-center justify-center py-4 text-white w-full no-underline hover:bg-gray-300 transition-colors ${isActive ? 'font-medium' : ''}`
        }
      >
        <Icon className='text-2xl text-black' />
      </NavLink>
    </li>
  );
}

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [tooltip, setTooltip] = useState(null);

  const handleLogout = () => {

    const confirmLogout = window.confirm("Çıkış yapmak istediğinizden emin misiniz?");

    if (confirmLogout) {
      dispatch(logout());
      dispatch(reset());
      navigate('/auth?mode=login');
    }
  };

  const showTooltip = (event, label) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      label,
      top: rect.top + rect.height / 2,
    });
  };

  const hideTooltip = () => setTooltip(null);

  return (
    <nav className="fixed  left-0 top-0 w-16 h-screen bg-white text-white flex flex-col z-50 rounded-tr-lg rounded-tb-xl shadow-sm">
      {/* Header */}
      <div className="flex flex-row items-center justify-center py-4 border-b border-gray-700">
        {/* <h2 className="text-2xl font-bold text-white ">UM</h2> */}
        <div className=' flex flex-row items-center justify-center'>
          <img className='text-center ml-6' src={logo} />
        </div>
      </div>

      {/* Menu Items */}
      <ul
        className="flex-1 flex flex-col list-none p-0 m-0 overflow-y-auto"
        onScroll={hideTooltip}
      >
        {!user ? (
          // Not logged in - show only Login
          <>
            <li>
              <NavLink
                to="/auth?mode=login"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-4 text-white no-underline hover:bg-gray-800 transition-colors ${isActive ? ' font-medium' : ''
                  }`
                }
              >
                <span className="text-xl">🔑</span>
                {/* Login */}
              </NavLink>
            </li>
          </>
        ) : (
          <div className='flex flex-col justify-between h-full mt-3'>

            <div className='flex flex-col items-center w-full'>
              <div className='flex flex-col w-full items-center '>
                {NAV_ITEMS.map((item) => (
                  <NavItem
                    key={item.to}
                    item={item}
                    onShowTooltip={showTooltip}
                    onHideTooltip={hideTooltip}
                  />
                ))}
              </div>
            </div>

            <div className='flex flex-col items-center w-full'>
              <li className="mt-auto w-full mb-4">
                <button
                  onClick={handleLogout}
                  aria-label="Çıkış Yap"
                  className="w-full flex items-center justify-center py-4 text-black hover:bg-gray-100 transition-colors border-none bg-transparent cursor-pointer text-base"
                >
                  <IoIosLogOut className='text-2xl' />
                </button>
              </li>
            </div>

          </div>

        )}
      </ul>

      {tooltip && (
        <span
          aria-hidden="true"
          className="pointer-events-none fixed z-[60] whitespace-nowrap rounded-md border border-gray-700 bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
          style={{
            top: tooltip.top,
            left: '4.1rem',
            transform: 'translateY(-50%)',
          }}
        >
          {tooltip.label}
        </span>
      )}
    </nav>
  );
};

export default Navbar;
