import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePOS } from '../context/POSContext';
import { Bars3Icon, BellIcon, UserCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

function Navbar({ onMenuClick }) {
  const { currentUser, settings, products } = usePOS();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Logic for low stock notifications
  const lowStockAlerts = useMemo(() => {
    return products.filter(p => p.stock <= (p.lowStockThreshold ?? 10));
  }, [products]);

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-4 sm:px-6 shadow-sm z-50 transition-all">
      {/* Left items */}
      <div className="flex items-center">
        <button onClick={onMenuClick} className="md:hidden mr-4 text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition">
          <Bars3Icon className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">
          {settings?.storeName || 'Store'}
        </h1>
      </div>

      {/* Right items */}
      <div className="flex items-center space-x-4">
        {/* Clock */}
        <div className="hidden sm:block text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
        </div>
        
        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`relative p-2 rounded-full transition ${isNotifOpen ? 'bg-primary/5 text-primary' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          >
            <BellIcon className="h-6 w-6" />
            {lowStockAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">Notifications</h3>
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {lowStockAlerts.length} Alerts
                </span>
              </div>
              
              <div className="max-h-[350px] overflow-y-auto">
                {lowStockAlerts.length === 0 ? (
                  <div className="p-8 text-center bg-white">
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BellIcon className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">All clear! No alerts.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {lowStockAlerts.slice(0, 5).map(item => (
                      <div key={item._id} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-3">
                        <div className="shrink-0 mt-1">
                          <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800 leading-tight">{item.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Only <span className="text-red-600 font-bold">{item.stock} units</span> left in stock!
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{item.category}</p>
                        </div>
                      </div>
                    ))}
                    {lowStockAlerts.length > 5 && (
                      <Link 
                        to="/admin/products"
                        onClick={() => setIsNotifOpen(false)}
                        className="block p-3 text-center text-xs font-bold text-primary hover:bg-primary-hover/5 transition"
                      >
                        View all {lowStockAlerts.length} items
                      </Link>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-gray-50 border-t text-center">
                 <Link 
                   to="/admin/products" 
                   onClick={() => setIsNotifOpen(false)}
                   className="text-xs text-gray-500 hover:text-primary font-medium transition"
                 >
                   Manage Inventory
                 </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="flex items-center space-x-2 pl-4 border-l">
          <UserCircleIcon className="h-8 w-8 text-gray-400" />
          <div className="hidden md:block text-left">
            <p className="text-sm font-bold text-gray-800 leading-none">
              {currentUser?.name || 'Administrator'}
            </p>
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-semibold">
              {currentUser?.role || 'Admin Role'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
