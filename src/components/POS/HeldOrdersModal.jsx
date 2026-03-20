import React from 'react';
import { usePOS } from '../../context/POSContext';
import { ClockIcon, PlayCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function HeldOrdersModal({ onClose }) {
  const { holdOrders, restoreHoldOrder } = usePOS();

  const handleResume = (id) => {
    restoreHoldOrder(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
           <h2 className="text-lg font-bold text-gray-800 flex items-center">
             <ClockIcon className="w-5 h-5 mr-2 text-primary" />
             Held Orders
           </h2>
           <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
             <XMarkIcon className="w-6 h-6" />
           </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
           {holdOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-400 py-12">
                 <ClockIcon className="w-12 h-12 mb-3 text-gray-300" />
                 <p className="text-lg font-medium">No held orders</p>
                 <p className="text-sm">Held orders will appear here to be resumed later.</p>
              </div>
           ) : (
             <div className="space-y-3">
               {holdOrders.map(order => (
                 <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-indigo-300 transition-colors">
                    <div>
                       <h3 className="font-bold text-gray-900">{order.reference}</h3>
                       <p className="text-sm text-gray-500 mt-1">
                          {new Date(order.time).toLocaleTimeString()} • {order.items.length} items
                       </p>
                    </div>
                    <button 
                      onClick={() => handleResume(order.id)}
                      className="px-4 py-2 bg-primary/5 text-primary hover:bg-primary-hover hover:text-white font-medium rounded-lg transition-colors flex items-center"
                    >
                       <PlayCircleIcon className="w-5 h-5 mr-2" />
                       Resume
                    </button>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
