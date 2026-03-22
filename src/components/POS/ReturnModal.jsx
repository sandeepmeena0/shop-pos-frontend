import React, { useState } from 'react';
import { XMarkIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { transactionService } from '../../services/index.js';
import toast from 'react-hot-toast';

function ReturnModal({ transaction, onClose, onComplete }) {
  const [returnItems, setReturnItems] = useState(
    transaction.items.map(item => ({
      productId: (item.productId || item.id)?.toString(),
      name: item.name,
      originalQty: item.quantity,
      returnQty: 0,
      price: item.price
    }))
  );
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleQtyChange = (productId, val) => {
    setReturnItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const qty = Math.max(0, Math.min(val, item.originalQty));
        return { ...item, returnQty: qty };
      }
      return item;
    }));
  };

  const baseRefund = returnItems.reduce((sum, item) => sum + (item.price * item.returnQty), 0);
  const taxRefund = (baseRefund * (transaction.taxRate || 0)) / 100;
  const totalRefund = baseRefund + taxRefund;
  const hasItemsToReturn = returnItems.some(i => i.returnQty > 0);

  const handleProcessReturn = async () => {
    if (!hasItemsToReturn) {
      toast.error('Please select at least one item to return');
      return;
    }

    setProcessing(true);
    try {
      const itemsToReturn = returnItems
        .filter(i => i.returnQty > 0)
        .map(i => ({ productId: i.productId, quantity: i.returnQty }));

      await transactionService.processReturn(transaction._id, {
        items: itemsToReturn,
        reason: reason || 'Customer Return'
      });

      toast.success('Return processed successfully!');
      onComplete();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process return');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[95dvh] sm:max-h-[90vh] overflow-hidden animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 flex justify-between items-center border-b bg-gray-50/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ArrowUturnLeftIcon className="w-5 h-5 text-primary" />
              Process Return
            </h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">Original: {transaction.receiptNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="mb-4 bg-amber-50 border border-amber-100 p-3 sm:p-4 rounded-xl">
             <p className="text-sm text-amber-800 font-medium leading-relaxed">
               Select quantities for items being returned. Repaid amount will be deducted from sales records.
             </p>
          </div>

          <div className="space-y-3 sm:space-y-4 pr-1">
            {returnItems.map(item => (
              <div key={item.productId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors gap-3 sm:gap-0">
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                  <p className="text-xs text-gray-400">₹{item.price.toFixed(2)} · Purchased: {item.originalQty}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 sm:hidden uppercase font-bold tracking-widest">Return Qty</span>
                    <input 
                      type="number"
                      value={item.returnQty}
                      onChange={(e) => handleQtyChange(item.productId, parseInt(e.target.value) || 0)}
                      className="w-16 text-center border-2 border-gray-100 rounded-lg py-1 px-2 font-bold focus:border-primary outline-none"
                      min="0"
                      max={item.originalQty}
                    />
                  </div>
                  <div className="w-auto sm:w-20 text-right">
                    <p className="text-sm font-black text-primary sm:text-gray-900 border bg-primary/5 sm:bg-transparent sm:border-transparent px-2 py-1 rounded-md sm:p-0">₹{(item.price * item.returnQty).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 sm:mt-6 border-t pt-4">
            <label className="block text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Reason for Return</label>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Damaged product, changed mind..."
              className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-primary outline-none transition-colors"
              rows="2"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-gray-50 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-0 shrink-0">
        <div className="text-left w-full sm:max-w-[240px]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Items Subtotal</span>
            <span className="text-sm font-bold text-gray-700">₹{baseRefund.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Tax Refund ({transaction.taxRate || 0}%)</span>
            <span className="text-sm font-bold text-gray-700">₹{taxRefund.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
             <p className="text-xs text-gray-500 font-bold uppercase">Final Refund</p>
             <p className="text-2xl sm:text-3xl font-black text-red-600 leading-none">₹{totalRefund.toFixed(2)}</p>
          </div>
        </div>
          <button 
            onClick={handleProcessReturn}
            disabled={!hasItemsToReturn || processing}
            className="px-6 sm:px-8 py-3.5 sm:py-4 bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] w-full sm:w-auto"
          >
            {processing ? 'Processing...' : 'Issue Refund'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReturnModal;
