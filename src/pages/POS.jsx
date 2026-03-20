import React, { useState } from "react";
import { usePOS } from "../context/POSContext";
import { ArrowRightOnRectangleIcon, ListBulletIcon, ShoppingBagIcon, ChartBarIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import POSCart from "../components/POS/POSCart";
import POSSearch from "../components/POS/POSSearch";
import POSProductGrid from "../components/POS/POSProductGrid";
import PaymentModal from "../components/POS/PaymentModal";
import ReceiptModal from "../components/POS/ReceiptModal";

function POS() {
  const { currentUser, logout, cart, settings } = usePOS();
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'cart' for mobile

  // Modals Local State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [checkoutTotal, setCheckoutTotal] = useState(0);

  const handleOpenCheckout = (total) => {
    setCheckoutTotal(total);
    setIsPaymentOpen(true);
  };

  const handlePaymentComplete = (transaction) => {
    setLastTransaction(transaction);
    setIsPaymentOpen(false);
    setIsReceiptOpen(true);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden font-sans">

      {/* --- TOP NAVBAR --- */}
      <div className="h-16 px-4 md:px-6 py-3 flex items-center justify-between border-b bg-white shadow-sm shrink-0 z-20">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <ComputerDesktopIcon className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              {settings?.storeName || 'SmartPOS'}
            </h1>
          </div>
          <POSSearch />
        </div>

        <div className="flex items-center space-x-2 md:space-x-4 ml-4">
          <Link
            to="/admin/transactions"
            className="flex items-center px-3 py-1.5 text-sm font-bold text-gray-600 hover:text-primary hover:bg-primary-hover/5 rounded-lg transition-all gap-2"
            title="Records & Returns"
          >
            <ChartBarIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Records</span>
          </Link>

          <div className="hidden sm:flex items-center space-x-3 pl-4 border-l">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-800 leading-tight">{currentUser?.name}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">{currentUser?.role}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* --- LEFT PANEL: CART (Desktop: Sidebar, Mobile: Toggleable) --- */}
        <div className={`
          ${activeTab === 'cart' ? 'flex' : 'hidden'} 
          md:flex w-full md:w-96 lg:w-[450px] border-r bg-white flex-col h-full shrink-0
        `}>
          <POSCart onCheckout={handleOpenCheckout} />
        </div>

        {/* --- RIGHT PANEL: PRODUCTS (Desktop: Main, Mobile: Toggleable) --- */}
        <div className={`
          ${activeTab === 'products' ? 'flex' : 'hidden'} 
          md:flex flex-1 flex-col bg-gray-50/50 overflow-hidden
        `}>
          <div className="flex-1 overflow-y-auto">
            <POSProductGrid />
          </div>
        </div>
      </div>

      {/* --- MOBILE NAVIGATION TABS --- */}
      <div className="md:hidden h-16 bg-white border-t flex items-center justify-around px-2 z-50">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeTab === 'products' ? 'text-primary' : 'text-gray-400'}`}
        >
          <ListBulletIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Catalog</span>
        </button>
        <button
          onClick={() => setActiveTab('cart')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative ${activeTab === 'cart' ? 'text-primary' : 'text-gray-400'}`}
        >
          <ShoppingBagIcon className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute top-2 right-1/3 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {cart.length}
            </span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-tighter">Shopping Cart</span>
        </button>
      </div>

      {/* --- Modals for Checkouts --- */}
      {isPaymentOpen && (
        <PaymentModal
          totalAmount={checkoutTotal}
          onClose={() => setIsPaymentOpen(false)}
          onComplete={handlePaymentComplete}
        />
      )}

      {isReceiptOpen && lastTransaction && (
        <ReceiptModal
          transaction={lastTransaction}
          onClose={() => {
            setIsReceiptOpen(false);
            setLastTransaction(null);
          }}
        />
      )}

    </div>
  );
}

export default POS;
