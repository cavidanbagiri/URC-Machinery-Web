import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../stores/user_slice';

import { RxDashboard } from "react-icons/rx";
import { BsTruck } from "react-icons/bs";
import { IoSettingsOutline } from "react-icons/io5";


import { IoIosLogOut } from "react-icons/io";
import { div } from 'framer-motion/client';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {

    const confirmLogout = window.confirm("Are you sure you want to logout?");

    if (confirmLogout) {
      dispatch(logout());
      dispatch(reset());
      navigate('/auth?mode=login');
    }
  };

  return (
    <nav className="fixed left-0 top-0 w-16 h-screen bg-gray-900 text-white flex flex-col z-50 rounded-tr-lg rounded-tb-xl">
      {/* Header */}
      <div className="flex flex-row items-center justify-center py-4 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-white ">URC</h2>
      </div>

      {/* Menu Items */}
      <ul className="flex-1 flex flex-col list-none p-0 m-0">
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

                <li className='flex w-full'>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      `group relative flex items-center justify-center py-4 text-white w-full no-underline hover:bg-gray-800 transition-colors ${isActive ? 'font-medium' : ''}`
                    }
                  >
                    <RxDashboard className='text-2xl' />

                    {/* Компонент Тултипа */}
                    <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none
                     scale-0 group-hover:scale-100 transition-all duration-150 origin-left
                     bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg
                     whitespace-nowrap border border-gray-700">
                      Dashboard
                    </span>
                  </NavLink>
                </li>

                <li className='flex w-full'>
                  <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                      `group relative flex items-center justify-center py-4 text-white w-full no-underline hover:bg-gray-800 transition-colors ${isActive ? 'font-medium' : ''}`
                    }
                  >
                    <IoSettingsOutline className='text-2xl' />

                    {/* Компонент Тултипа */}
                    <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none
                     scale-0 group-hover:scale-100 transition-all duration-150 origin-left
                     bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg
                     whitespace-nowrap border border-gray-700">
                      Settings
                    </span>
                  </NavLink>
                </li>

                <li className='flex w-full'>
                  <NavLink
                    to="/common_cars"
                    className={({ isActive }) =>
                      `group relative flex items-center justify-center py-4 text-white w-full no-underline hover:bg-gray-800 transition-colors ${isActive ? 'font-medium' : ''}`
                    }
                  >
                    <BsTruck className='text-2xl' />

                    {/* Компонент Тултипа */}
                    <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none
                     scale-0 group-hover:scale-100 transition-all duration-150 origin-left
                     bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg
                     whitespace-nowrap border border-gray-700">
                      Data Management
                    </span>
                  </NavLink>
                </li>

              </div>
            </div>

            <div className='flex flex-col items-center w-full'>
              <li className="mt-auto w-full mb-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center py-4 text-white hover:bg-gray-800 transition-colors border-none bg-transparent cursor-pointer text-base"
                >
                  <IoIosLogOut className='text-2xl' />
                </button>
              </li>
            </div>

          </div>

        )}
      </ul>
    </nav>
  );
};

export default Navbar;