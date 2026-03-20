import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChartPieIcon,
  ArchiveBoxIcon,
  ComputerDesktopIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { usePOS } from '../context/POSContext';

const navItem = `flex items-center px-4 py-3 rounded-xl transition-all text-sm font-medium`;
const activeClass = 'bg-primary/5 text-primary font-semibold shadow-sm';
const inactiveClass = 'text-gray-500 hover:bg-gray-50 hover:text-gray-900';

function Sidebar({ isOpen, onClose }) {
  const { currentUser, logout, settings } = usePOS();
  const isAdminPlus = currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin';

  const linkClass = ({ isActive }) => `${navItem} ${isActive ? 'bg-primary/10 text-primary font-semibold shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`;

  return (
    <>
      {/* Sidebar panel */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30
        w-64 bg-white border-r shadow-sm flex flex-col h-full
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b flex-shrink-0">
          <div className="flex items-center">
            <ComputerDesktopIcon className="h-7 w-7 text-primary mr-2.5" />
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                {settings?.storeName || 'SmartPOS'}
            </span>
          </div>
          {/* Close button for mobile */}
          <button 
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
          {isAdminPlus && (
            <NavLink to="/admin/dashboard" className={linkClass} onClick={onClose}>
              <ChartPieIcon className="w-5 h-5 mr-3 flex-shrink-0" /> Dashboard
            </NavLink>
          )}

          <NavLink to="/admin/products" className={linkClass} onClick={onClose}>
            <ArchiveBoxIcon className="w-5 h-5 mr-3 flex-shrink-0" /> Inventory
          </NavLink>

          <NavLink to="/admin/transactions" className={linkClass} onClick={onClose}>
            <CreditCardIcon className="w-5 h-5 mr-3 flex-shrink-0" /> Transactions
          </NavLink>

          {isAdminPlus && (
            <>
              <NavLink to="/admin/users" className={linkClass} onClick={onClose}>
                <UserGroupIcon className="w-5 h-5 mr-3 flex-shrink-0" /> Users
              </NavLink>

              <NavLink to="/admin/settings" className={linkClass} onClick={onClose}>
                <Cog6ToothIcon className="w-5 h-5 mr-3 flex-shrink-0" /> Settings
              </NavLink>
            </>
          )}

          <div className="pt-4 mt-4 border-t">
            <NavLink
              to="/pos"
              onClick={onClose}
              className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-primary bg-primary/10 hover:bg-primary-hover/20 border border-primary/20 transition-all font-bold"
            >
              <ComputerDesktopIcon className="w-5 h-5 mr-3 flex-shrink-0" /> Open POS Terminal
            </NavLink>
          </div>
        </nav>

        {/* User & Logout Footer */}
        <div className="p-3 border-t flex-shrink-0">
          {currentUser && (
            <div className="flex items-center px-3 py-2.5 mb-2 rounded-xl bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm mr-2.5 flex-shrink-0">
                {currentUser.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => { logout(); onClose?.(); }}
            className="flex items-center w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
