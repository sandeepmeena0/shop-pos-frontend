import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { transactionService } from '../services/index.js';
import {
  ArrowUturnLeftIcon, MagnifyingGlassIcon, CalendarIcon, EyeIcon, XMarkIcon, FunnelIcon
} from '@heroicons/react/24/outline';
import ReceiptModal from '../components/POS/ReceiptModal';
import ReturnModal from '../components/POS/ReturnModal';
import toast from 'react-hot-toast';
import { usePOS } from '../context/POSContext';

const getStatusBadge = (method, type) => {
  if (type === 'RETURN') return 'bg-red-100 text-red-700';
  const map = {
    Cash: 'bg-green-100 text-green-700',
    Card: 'bg-blue-100 text-blue-700',
    UPI: 'bg-primary/10 text-primary',
  };
  return map[method] || 'bg-gray-100 text-gray-700';
};

export default function Transactions() {
  const location = useLocation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [returningTxn, setReturningTxn] = useState(null);
  const [foundTxn, setFoundTxn] = useState(null); 
  const [filterDate, setFilterDate] = useState(location.state?.filterDate || '');
  const [filterType, setFilterType] = useState(location.state?.filterType || '');
  const [searchReceipt, setSearchReceipt] = useState('');
  const [searching, setSearching] = useState(false);

  const { fetchProducts } = usePOS();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await transactionService.getAll();
      setTransactions(data);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const performLookup = async () => {
    if (!searchReceipt.trim()) return;
    setSearching(true);
    setFoundTxn(null);
    try {
      const { data } = await transactionService.lookup(searchReceipt.trim());
      setFoundTxn(data);
      setSearchReceipt('');
      toast.success('Receipt found!');
    } catch (err) {
      toast.error('Receipt not found or invalid');
    } finally {
      setSearching(false);
    }
  };
   
  const normalizeForReceipt = (txn) => ({
    id: txn.receiptNumber,
    type: txn.type,
    time: txn.createdAt,
    items: txn.items.map(i => ({ ...i, id: i.productId })),
    subtotal: txn.totalAmount,
    discount: txn.discount,
    tax: txn.taxAmount || 0,
    total: txn.finalAmount,
    paymentMethod: txn.paymentMethod,
    cashier: txn.cashierId?.name || 'N/A',
    amountPaid: Math.abs(txn.finalAmount),
    change: 0,
    reason: txn.reason
  });

  useEffect(() => {
    load();
  }, []);

  const filtered = transactions.filter(txn => {
    if (filterDate && new Date(txn.createdAt).toLocaleDateString() !== new Date(filterDate).toLocaleDateString()) return false;
    if (filterType === 'SALE' && txn.type === 'RETURN') return false;
    if (filterType === 'RETURN' && txn.type !== 'RETURN') return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-gray-500 mt-1">{filtered.length} records {filterDate ? 'for selected date' : 'total'}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Receipt Lookup */}
          <form 
            onSubmit={(e) => { e.preventDefault(); performLookup(); }}
            className="flex items-center bg-white px-3 py-1.5 rounded-lg border shadow-sm focus-within:ring-2 focus-within:ring-primary transition-all"
          >
            <MagnifyingGlassIcon className={`w-4 h-4 ${searching ? 'text-primary animate-pulse' : 'text-gray-400'}`} />
            <input 
              type="text" 
              placeholder="Find Receipt #..." 
              value={searchReceipt}
              onChange={e => setSearchReceipt(e.target.value)}
              className="border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none w-32 md:w-48 ml-2" 
            />
            {searchReceipt && (
              <button 
                type="button" 
                onClick={performLookup}
                disabled={searching}
                className="text-xs font-bold text-primary hover:text-indigo-800 ml-1"
              >
                {searching ? '...' : 'FIND'}
              </button>
            )}
          </form>

          {/* Type Filter */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
            <FunnelIcon className="w-4 h-4 text-gray-400" />
            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)} 
              className="border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none bg-transparent appearance-none cursor-pointer pr-4"
            >
              <option value="">All Types</option>
              <option value="SALE">Sales Only</option>
              <option value="RETURN">Refunds Only</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none" />
            {filterDate && (
              <button onClick={() => setFilterDate('')} className="text-xs text-primary hover:underline">Clear</button>
            )}
          </div>
        </div>
      </div>

      {/* Found Receipt Highlight */}
      {foundTxn && (
        <div className="mb-8 p-6 bg-primary/5 border-2 border-primary/10 rounded-2xl shadow-sm animate-in slide-in-from-top-4 duration-300 relative">
          <button 
            onClick={() => setFoundTxn(null)} 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <MagnifyingGlassIcon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Found Record</p>
                <h3 className="text-xl font-black text-gray-900 font-mono">{foundTxn.receiptNumber}</h3>
                <p className="text-sm text-gray-500 font-medium">Sold by {foundTxn.cashierId?.name || 'N/A'} on {new Date(foundTxn.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right mr-4">
                <p className="text-xs font-bold text-gray-400 uppercase">Amount</p>
                <p className="text-2xl font-black text-primary">₹{foundTxn.finalAmount.toFixed(2)}</p>
              </div>
              <button 
                onClick={() => setSelectedTxn(normalizeForReceipt(foundTxn))}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              >
                View Details
              </button>
              {foundTxn.type !== 'RETURN' && (
                <button 
                   onClick={() => setReturningTxn(foundTxn)}
                   className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center gap-2"
                >
                  <ArrowUturnLeftIcon className="w-4 h-4" />
                  Process Return
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs tracking-wider uppercase">
                <th className="px-5 py-3 font-semibold">Receipt #</th>
                <th className="px-5 py-3 font-semibold">Date & Time</th>
                <th className="px-5 py-3 font-semibold">Cashier</th>
                <th className="px-5 py-3 font-semibold">Items</th>
                <th className="px-5 py-3 font-semibold text-center">Type</th>
                <th className="px-5 py-3 font-semibold text-right">Amount</th>
                <th className="px-5 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="7" className="px-5 py-10 text-center text-gray-400">Loading transactions...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="px-5 py-12 text-center text-gray-400">No transactions found</td></tr>
              ) : filtered.map(txn => (
                <tr key={txn._id} className={`hover:bg-gray-50 transition-colors ${txn.type === 'RETURN' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-5 py-3.5 font-mono text-sm text-primary font-medium whitespace-nowrap">
                    {txn.receiptNumber}
                    {txn.type === 'RETURN' && <div className="text-[9px] text-red-500 font-bold uppercase mt-1">Refund</div>}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    <div className="font-medium text-gray-900">{new Date(txn.createdAt).toLocaleDateString('en-IN')}</div>
                    <div className="text-xs text-gray-400">{new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 font-medium">{txn.cashierId?.name || 'N/A'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-0.5 text-xs text-gray-700">
                      {txn.items.slice(0, 2).map((item, i) => (
                        <span key={i} className="truncate max-w-[150px]">{item.quantity}× {item.name}</span>
                      ))}
                      {txn.items.length > 2 && <span className="text-gray-400 italic">+{txn.items.length - 2} more</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(txn.paymentMethod, txn.type)}`}>
                      {txn.type || 'SALE'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className={`font-bold ${txn.type === 'RETURN' ? 'text-red-600' : 'text-gray-900'}`}>
                      {txn.type === 'RETURN' ? '-' : ''}₹{Math.abs(txn.finalAmount).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setSelectedTxn(normalizeForReceipt(txn))}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-hover/5 rounded transition" title="View Receipt">
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      {txn.type !== 'RETURN' && (
                        <button onClick={() => setReturningTxn(txn)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition" title="Process Return">
                          <ArrowUturnLeftIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTxn && <ReceiptModal transaction={selectedTxn} onClose={() => setSelectedTxn(null)} />}
      
      {returningTxn && (
        <ReturnModal 
          transaction={returningTxn} 
          onClose={() => setReturningTxn(null)} 
          onComplete={() => {
            setReturningTxn(null);
            load(); // Refresh table
            fetchProducts(); // Sync inventory stock immediately
          }} 
        />
      )}
    </div>
  );
}
