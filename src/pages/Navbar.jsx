import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../stores/user_slice';

import { RxDashboard, RxColorWheel } from "react-icons/rx";
import { BsBoxSeam, BsCartCheck, BsBell, BsChatDots } from "react-icons/bs";
import { IoSettingsOutline } from "react-icons/io5";
import { IoIosLogIn, IoIosLogOut } from "react-icons/io";
import { PiWrenchLight } from "react-icons/pi";
import {
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
  HiOutlineClipboardDocumentList,
  HiOutlineWrenchScrewdriver,
} from "react-icons/hi2";
import { GiCrane } from "react-icons/gi";

import logo from '../assets/main_logo.png'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: RxDashboard },
  { to: '/common_cars', label: 'Tum Makineler', icon: GiCrane },
  { to: '/repair', label: 'Arızalı Ekipman', icon: PiWrenchLight },
  { to: '/daily_faults', label: 'Günlük Arıza', icon: HiOutlineClipboardDocumentList },
  { to: '/tires', label: 'Lastik Takibi', icon: RxColorWheel },
  { to: '/maintenance', label: 'Bakım', icon: HiOutlineWrenchScrewdriver },
  { to: '/purchase_requests', label: 'Yedek Parça / Hizmet', icon: BsCartCheck },
  { to: '/warehouse_stock', label: 'Depo Stoku', icon: BsBoxSeam },
  { to: '/settings', label: 'Ayarlar', icon: IoSettingsOutline },
  { to: '/forum', label: 'Forum', icon: BsChatDots },
  { to: '/notifications', label: 'Bildirimler', icon: BsBell },
];

const LOGIN_ITEM = { to: '/auth?mode=login', label: 'Giriş Yap', icon: IoIosLogIn };

function NavItem({ item, expanded, onShowTooltip, onHideTooltip }) {
  const Icon = item.icon;

  // Menü açıkken etiket metin olarak görünür; kapalıyken hover/focus ile tooltip gösterilir.
  const tooltipHandlers = expanded
    ? {}
    : {
        onMouseEnter: (event) => onShowTooltip(event, item.label),
        onMouseLeave: onHideTooltip,
        onFocus: (event) => onShowTooltip(event, item.label),
        onBlur: onHideTooltip,
      };

  return (
    <li className='w-full'>
      <NavLink
        to={item.to}
        aria-label={item.label}
        {...tooltipHandlers}
        className={({ isActive }) =>
          `flex w-full items-center gap-3 rounded-lg py-3 text-sm no-underline transition-colors ${
            expanded ? 'px-3' : 'justify-center px-0'
          } ${
            isActive
              ? 'bg-red-50 font-medium text-red-700'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`
        }
      >
        <Icon className='shrink-0 text-2xl' />
        {expanded && <span className='truncate'>{item.label}</span>}
      </NavLink>
    </li>
  );
}

const Navbar = ({ expanded = false, onToggle = () => {} }) => {
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
    if (expanded) return;

    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      label,
      top: rect.top + rect.height / 2,
    });
  };

  const hideTooltip = () => setTooltip(null);

  // Kapalı menüde "hover/focus" ile tooltip, açık menüde metin etiketi kullanılır.
  const tooltipHandlers = (label) =>
    expanded
      ? {}
      : {
          onMouseEnter: (event) => showTooltip(event, label),
          onMouseLeave: hideTooltip,
          onFocus: (event) => showTooltip(event, label),
          onBlur: hideTooltip,
        };

  const handleToggle = () => {
    hideTooltip();
    onToggle();
  };

  return (
    <nav
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col bg-white shadow-sm transition-[width] duration-300 ease-in-out ${
        expanded ? 'w-64' : 'w-16'
      }`}
    >
      {/* Header / Logo */}
      <div
        className={`flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 ${
          expanded ? 'px-4' : 'justify-center px-2'
        }`}
      >
        <img
          src={logo}
          alt="URC Machinery"
          className={`shrink-0 object-cover object-left ${expanded ? 'h-9 w-9' : 'h-8 w-8'}`}
        />
        {expanded && (
          <span className="truncate text-sm font-semibold tracking-wide text-gray-800">
            URC Machinery
          </span>
        )}
      </div>

      {/* Menüyü aç / kapa */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={expanded ? 'Menüyü daralt' : 'Menüyü genişlet'}
        aria-expanded={expanded}
        className="absolute -right-3 cursor-pointer top-20 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-red-200 hover:text-red-600"
      >
        {expanded ? (
          <HiOutlineChevronDoubleLeft className="h-3.5 w-3.5" />
        ) : (
          <HiOutlineChevronDoubleRight className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Menu Items */}
      <ul
        className="m-0 flex-1 list-none space-y-0.5 overflow-y-auto p-2"
        onScroll={hideTooltip}
      >
        {!user ? (
          // Not logged in - show only Login
          <NavItem
            item={LOGIN_ITEM}
            expanded={expanded}
            onShowTooltip={showTooltip}
            onHideTooltip={hideTooltip}
          />
        ) : (
          NAV_ITEMS.map((item) => (
            <NavItem
              key={item.to}
              item={item}
              expanded={expanded}
              onShowTooltip={showTooltip}
              onHideTooltip={hideTooltip}
            />
          ))
        )}
      </ul>

      {/* Çıkış */}
      {user && (
        <div className="shrink-0 border-t border-gray-200 p-2">
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Çıkış Yap"
            {...tooltipHandlers('Çıkış Yap')}
            className={`flex w-full items-center gap-3 rounded-lg py-3 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 ${
              expanded ? 'px-3' : 'justify-center px-0'
            }`}
          >
            <IoIosLogOut className="shrink-0 text-2xl" />
            {expanded && <span className="truncate">Çıkış Yap</span>}
          </button>
        </div>
      )}

      {/* Tooltip - yalnızca menü kapalıyken */}
      {tooltip && !expanded && (
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
