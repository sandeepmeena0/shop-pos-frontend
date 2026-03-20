import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePOS } from '../../context/POSContext';
import { 
  TrashIcon, 
  PlusIcon, 
  MinusIcon, 
  CreditCardIcon,
  PauseCircleIcon,
  ArrowUturnLeftIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import HeldOrdersModal from './HeldOrdersModal';
import ActionModal from './ActionModal';

function POSCart({ onCheckout }) {
  const { 
    cart, 
    updateCartItemQuantity, 
    removeFromCart, 
    clearCart,
    holdCurrentOrder,
    settings,
    settingsLoading,
    currentUser
  } = usePOS();

  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [isHoldConfirmOpen, setIsHoldConfirmOpen] = useState(false);

  // Calculations
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const totalDiscount = useMemo(() => cart.reduce((sum, item) => sum + (item.discount || 0), 0), [cart]);
  const taxable = subtotal - totalDiscount;
  const taxRate = settings?.taxRate || 0;
  const tax = (taxable * taxRate) / 100;
  const total = taxable + tax;

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    setIsHoldConfirmOpen(true);
  };

  const confirmHold = (reference) => {
    holdCurrentOrder(reference || undefined);
    setIsHoldConfirmOpen(false);
  };

  if (settingsLoading || !settings) {
     return (
       <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 p-8 text-center">
         <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
         <p className="text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">Syncing Tax Data...</p>
       </div>
     );
  }

  return (
    <div className="w-full h-full bg-white flex flex-col border-r shadow-xl z-10 relative">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b bg-gray-50">
          <div className="flex items-center space-x-2 text-gray-700 font-semibold">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {currentUser ? currentUser.name.charAt(0) : "W"}
            </span>
            <span>Current Order</span>
          </div>
          
          <div className="flex space-x-2">
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin') && (
              <Link to="/admin/dashboard" title="Admin Dashboard">
                <button className="p-2 text-gray-500 hover:text-primary hover:bg-primary-hover/5 rounded-lg transition">
                  <ArrowUturnLeftIcon className="w-5 h-5" />
                </button>
              </Link>
            )}
            <button onClick={() => setIsHeldModalOpen(true)} title="Held Orders" className="p-2 text-primary hover:bg-primary-hover/5 rounded-lg transition">
              <ClockIcon className="w-5 h-5" />
            </button>
            <button onClick={clearCart} title="Clear Cart" className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
      </div>
      
      {isHeldModalOpen && <HeldOrdersModal onClose={() => setIsHeldModalOpen(false)} />}

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
        {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 animate-in fade-in zoom-in">
              <div className="w-24 h-24 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-gray-100 shadow-inner">
                <CreditCardIcon className="w-10 h-10 text-gray-300 animate-float" />
              </div>
              <p className="text-lg font-semibold text-gray-500 uppercase tracking-widest text-[10px]">Your Cart is Empty</p>
            </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item._id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center hover:border-primary/20 transition-colors group animate-in slide-in-bottom">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 leading-tight">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-sm text-gray-500 font-medium">₹{item.price.toFixed(2)}</span>
                     <span className="text-xs text-gray-400 bg-gray-100 px-1.5 rounded">{item.serialNo || item.barcode}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <span className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                  <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-0.5">
                    <button 
                      onClick={() => updateCartItemQuantity(item._id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm hover:bg-gray-50 text-gray-600"
                    >
                      <MinusIcon className="w-3 h-3" />
                    </button>
                    <input 
                      type="number" 
                      value={item.quantity}
                      onChange={(e) => updateCartItemQuantity(item._id, parseInt(e.target.value) || 0)}
                      className="w-10 text-center text-sm font-semibold bg-transparent border-none focus:ring-0 p-0"
                      min="1"
                      max={item.stock}
                    />
                    <button 
                      onClick={() => updateCartItemQuantity(item._id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm hover:bg-gray-50 text-gray-600"
                    >
                      <PlusIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <button onClick={() => removeFromCart(item._id)} className="ml-2 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals & Quick Actions */}
      <div className="bg-white border-t p-4 pb-6 shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.05)]">
          <div className="space-y-2 text-sm text-gray-600 mb-4 px-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-500">
              <span>Discount</span>
              <span className="font-medium">-₹{totalDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({settings?.taxRate || 0}%)</span>
              <span className="font-medium">₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-end pt-2 border-t mt-2">
              <span className="text-base text-gray-800 font-semibold">Total Payable</span>
              <span className="text-3xl font-bold text-primary">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleHoldOrder}
              disabled={cart.length === 0}
              className="flex items-center justify-center py-3.5 px-4 bg-amber-100 text-amber-700 rounded-xl font-semibold hover:bg-amber-100/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PauseCircleIcon className="w-5 h-5 mr-2" />
              Hold Order
            </button>
            <button 
              onClick={() => onCheckout(total)}
              disabled={cart.length === 0}
              className="flex items-center justify-center py-3.5 px-4 bg-primary text-white rounded-xl font-semibold shadow-md hover:bg-primary-hover-hover transition-all active:scale-[0.98] focus:ring-4 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCardIcon className="w-5 h-5 mr-2" />
              Pay Now
            </button>
        </div>
      </div>
      {/* Confirmation Modals */}
      <ActionModal 
        isOpen={isHoldConfirmOpen}
        onClose={() => setIsHoldConfirmOpen(false)}
        onConfirm={confirmHold}
        title="Hold Current Order"
        message="Enter a reference name to save this order for later."
        confirmText="Hold Order"
        type="input"
        showInput={true}
        inputPlaceholder="e.g. Table 5 / Rahul"
      />
    </div>
  );
}

export default POSCart;
