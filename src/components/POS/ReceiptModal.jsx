import React from 'react';
import { PrinterIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { usePOS } from '../../context/POSContext';

function ReceiptModal({ transaction, onClose }) {
  const { settings, settingsLoading } = usePOS();

  const handlePrint = () => {
    window.print();
  };

  const safeAmountPaid = transaction.amountPaid ?? transaction.finalAmount ?? 0;
  const safeChange = transaction.change ?? 0;
  const displayTime = transaction.time || transaction.createdAt || new Date();
  const displayId = transaction.id || transaction.receiptNumber || 'N/A';
  const displayCashier = transaction.cashier || transaction.cashierId?.name || 'N/A';

  if (settingsLoading || !settings) {
     return (
       <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center">
         <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
       </div>
     );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-start justify-center p-4 overflow-y-auto pt-28">
      {/* Consolidated Header Action Bar - Hidden When Printing */}
      <div className="fixed top-6 inset-x-0 flex justify-center items-center pointer-events-none print:hidden z-50">
        <div className="flex bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-2xl border border-white/20 gap-4 pointer-events-auto animate-in slide-in-from-top-4 duration-300 items-center">
          <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
              <CheckCircleIcon className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-gray-800 text-sm">Payment Successful</span>
          </div>
          
          <button 
            onClick={handlePrint} 
            className="flex items-center px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 text-xs"
          >
             <PrinterIcon className="w-4 h-4 mr-2" />
             PRINT BILL
          </button>
          
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
            title="Close"
          >
             <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* The Printable Receipt Ticket */}
      <div 
        id="printable-receipt" 
        className="bg-white w-full max-w-[320px] mx-auto p-6 shadow-2xl print:shadow-none print:m-0 print:p-0 print:max-w-full font-mono text-sm text-gray-800 animate-in fade-in slide-in-from-bottom-8 duration-300 relative"
      >
        {/* Receipt Header */}
        <div className="text-center mb-6 border-b-2 border-dashed border-gray-300 pb-6">
          <h2 className="text-2xl font-black mb-1 uppercase tracking-tight">{settings.storeName || 'SmartPOS'}</h2>
          <p className="text-xs text-gray-500 mb-2">{settings.storeAddress || '123 Retail Lane, Main City'}</p>
          <p className="text-xs text-gray-500 mb-4 text-center">Tel: {settings.storePhone || '+91 00000 00000'}</p>
          
          <div className="text-[10px] text-gray-500 flex justify-between uppercase">
            <span>{new Date(displayTime).toLocaleDateString()}</span>
            <span>{new Date(displayTime).toLocaleTimeString()}</span>
          </div>
          <p className="text-[10px] text-gray-500 text-left mt-1 uppercase">Receipt: {displayId}</p>
          <p className="text-[10px] text-gray-500 text-left uppercase">Cashier: {displayCashier}</p>
        </div>

        {/* Items List */}
        <table className="w-full mb-6">
           <thead>
             <tr className="border-b border-gray-200 text-left text-[11px] uppercase text-gray-500">
               <th className="pb-2 font-semibold">Q</th>
               <th className="pb-2 font-semibold">Item</th>
               <th className="pb-2 text-right font-semibold">Price</th>
               <th className="pb-2 text-right font-semibold">Total</th>
             </tr>
           </thead>
           <tbody>
             {(transaction.items || []).map((item, i) => (
               <tr key={i} className="align-top border-b border-dashed border-gray-100 last:border-0">
                  <td className="py-2 pr-2">{item.quantity}</td>
                  <td className="py-2 pr-2">
                     {item.name}
                     {(item.discount || 0) > 0 && <span className="block text-[10px] text-gray-400">-₹{(item.discount || 0).toFixed(2)} discount</span>}
                  </td>
                  <td className="py-2 pr-2 text-right text-gray-500">₹{(item.price || 0).toFixed(2)}</td>
                  <td className="py-2 text-right font-medium">₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
               </tr>
             ))}
           </tbody>
         </table>

        {/* Totals Section */}
        <div className="border-t-2 border-dashed border-gray-300 pt-4 mb-6 space-y-1">
           <div className="flex justify-between text-xs text-gray-600">
             <span>Subtotal</span>
             <span>₹{(transaction.subtotal ?? transaction.totalAmount ?? 0).toFixed(2)}</span>
           </div>
           
           {(transaction.discount || 0) > 0 && (
             <div className="flex justify-between text-xs text-gray-600">
               <span>Discount</span>
               <span>-₹{(transaction.discount || 0).toFixed(2)}</span>
             </div>
           )}

           <div className="flex justify-between text-xs text-gray-600">
             <span>Tax ({settings.taxRate}%)</span>
             <span>₹{(transaction.tax ?? transaction.taxAmount ?? 0).toFixed(2)}</span>
           </div>

           <div className="flex justify-between font-bold text-lg pt-2 mt-2 border-t border-gray-800">
             <span>Total</span>
             <span>₹{(transaction.total ?? transaction.finalAmount ?? 0).toFixed(2)}</span>
           </div>
        </div>

        {/* Payment Info */}
        <div className="text-xs text-gray-500 space-y-1 mb-4">
           <div className="flex justify-between pb-1 border-b border-gray-100">
             <span>Paid via {transaction.paymentMethod}</span>
             <span>₹{(safeAmountPaid).toFixed(2)}</span>
           </div>
           {safeChange > 0 && (
             <div className="flex justify-between font-semibold pt-1 border-t border-gray-100">
               <span>Change</span>
               <span>₹{(safeChange).toFixed(2)}</span>
             </div>
           )}
        </div>

        {/* Notes / Reason */}
        {transaction.reason && (
           <div className="mb-8 p-3 bg-gray-50 rounded-lg border-l-4 border-primary">
              <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">Notes</p>
              <p className="text-xs italic text-gray-600">"{transaction.reason}"</p>
           </div>
        )}

        {/* Footer */}
        <div className="text-center bg-gray-50 p-3 rounded text-xs text-gray-500 space-y-1 print:bg-transparent">
           <p className="font-bold uppercase text-gray-800">Thank You!</p>
           <p>{settings.receiptFooter || 'Please visit us again.'}</p>
            <div className="font-['Libre_Barcode_39'] text-5xl mt-2 select-none opacity-80">
              *{displayId.slice(-8)}*
            </div>
        </div>
        
        {/* Zigzag bottom edge effect using CSS gradients (hidden on print) */}
        <div className="absolute -bottom-4 left-0 right-0 h-4 bg-[length:16px_16px] bg-[linear-gradient(-45deg,transparent_75%,#fff_75%),linear-gradient(45deg,transparent_75%,#fff_75%)] drop-shadow-md print:hidden"></div>
      </div>
    </div>
  );
}

export default ReceiptModal;
