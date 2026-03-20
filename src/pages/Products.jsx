import React, { useState, useMemo, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { productService, inventoryService } from '../services/index.js';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

function Products() {
  const { currentUser, products, fetchProducts, productsLoading, settings } = usePOS();
  const CATEGORIES = settings?.categories || ['General'];
  const isAdmin = ['Admin', 'Super Admin'].includes(currentUser?.role);

  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '', price: '', category: 'General', stock: '0',
    lowStockThreshold: '10', barcode: '',
  });
  const [restockData, setRestockData] = useState({ quantity: '', reason: '' });

  useEffect(() => {
    if (isAdmin) {
      fetchProducts({ showAll: showInactive });
    }
  }, [showInactive, isAdmin, fetchProducts]);

  const filteredProducts = useMemo(() =>
    products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm)) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [products, searchTerm]);

  const handleOpenModal = (product = null) => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price,
        category: product.category,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold ?? 10,
        barcode: product.barcode,
      });
      setSelectedProduct(product);
      setIsEditing(true);
    } else {
      setFormData({ name: '', price: '', category: 'General', stock: '0', lowStockThreshold: '10', barcode: '' });
      setSelectedProduct(null);
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleOpenRestock = (product) => {
    setSelectedProduct(product);
    setRestockData({ quantity: '', reason: '' });
    setIsRestockOpen(true);
  };

  const handleViewHistory = async (product) => {
    setSelectedProduct(product);
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const { data } = await inventoryService.getHistory(product._id);
      setHistoryData(data);
    } catch (err) {
      toast.error('Failed to load stock history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
      barcode: formData.barcode || String(Date.now()),
    };
    try {
      if (isEditing) {
        await productService.update(selectedProduct._id, payload);
        toast.success('Product updated successfully');
      } else {
        await productService.create(payload);
        toast.success('Product added successfully');
      }
      await fetchProducts({ showAll: showInactive });
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!restockData.quantity || parseInt(restockData.quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    setSaving(true);
    try {
      await inventoryService.restock({
        productId: selectedProduct._id,
        quantity: parseInt(restockData.quantity),
        reason: restockData.reason || 'Routine Restock',
      });
      toast.success(`✅ Added ${restockData.quantity} units to ${selectedProduct.name}`);
      await fetchProducts({ showAll: showInactive });
      setIsRestockOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Restock failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await productService.update(product._id, { active: !product.active });
      toast.success(product.active ? 'Product deactivated' : 'Product activated');
      await fetchProducts({ showAll: showInactive });
    } catch {
      toast.error('Failed to update product status');
    }
  };

  const onRefresh = () => fetchProducts({ showAll: showInactive });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500 mt-1">{products.length} products · {products.filter(p => p.stock <= p.lowStockThreshold).length} low stock</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition">
              <input 
                type="checkbox" 
                checked={showInactive} 
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              Show All (Inc. Inactive)
            </label>
          )}
          <button onClick={onRefresh} className="p-2 text-gray-500 hover:text-primary hover:bg-primary-hover/5 rounded-lg transition" title="Refresh">
            <ArrowPathIcon className={`w-5 h-5 ${productsLoading ? 'animate-spin' : ''}`} />
          </button>
          {isAdmin && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow-sm transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-1.5" /> Add Product
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-sm">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              placeholder="Search by name, barcode, category..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs tracking-wider uppercase">
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-5 py-3 font-semibold">Barcode</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold text-right">Price</th>
                <th className="px-5 py-3 font-semibold text-center">Stock</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productsLoading ? (
                <tr><td colSpan="6" className="px-5 py-10 text-center text-gray-400">Loading products...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan="6" className="px-5 py-12 text-center text-gray-400">
                  <p className="font-medium">No products found</p>
                  <p className="text-sm mt-1">{isAdmin ? 'Click "Add Product" to create one.' : 'Ask an admin to add products.'}</p>
                </td></tr>
              ) : filteredProducts.map(p => (
                <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    {!p.active && <span className="text-xs text-gray-400">(Inactive)</span>}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{p.barcode || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">{p.category}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-gray-900">₹{p.price.toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-center">
                    <button 
                      onClick={() => handleViewHistory(p)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 font-semibold rounded-lg text-sm hover:scale-105 transition-transform ${
                      p.stock === 0 ? 'bg-red-100 text-red-700' :
                      p.stock <= p.lowStockThreshold ? 'bg-amber-100 text-amber-700' :
                      'bg-green-50 text-green-700'
                    }`} title="View History">
                      {p.stock <= p.lowStockThreshold && p.stock > 0 && <ExclamationTriangleIcon className="w-3.5 h-3.5" />}
                      {p.stock} units
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenRestock(p)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-md transition"
                        title="Restock"
                      >
                        + Stock
                      </button>
                      {isAdmin && (
                        <>
                          <button onClick={() => handleOpenModal(p)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition">
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleToggleActive(p)} className={`p-1.5 rounded transition text-xs font-semibold px-2 ${p.active ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                            {p.active ? 'Disable' : 'Enable'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name*</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm" placeholder="e.g. Basmati Rice 5kg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)*</label>
                  <input type="number" required min="0" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock*</label>
                  <input type="number" required min="0" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category*</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary outline-none text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert</label>
                  <input type="number" min="0" value={formData.lowStockThreshold} onChange={e => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                <input type="text" value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm font-mono" placeholder="Auto-generated if blank" />
              </div>
              <div className="flex gap-3 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-medium rounded-lg text-sm transition">
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {isRestockOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Restock Product</h2>
                <p className="text-sm text-gray-500">{selectedProduct.name} · <span className="font-semibold text-gray-700">{selectedProduct.stock} units in stock</span></p>
              </div>
              <button onClick={() => setIsRestockOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleRestock} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Units to Add*</label>
                <input type="number" required min="1" value={restockData.quantity} onChange={e => setRestockData({ ...restockData, quantity: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm text-center text-2xl font-bold" placeholder="0" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <input type="text" value={restockData.reason} onChange={e => setRestockData({ ...restockData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="e.g. New delivery received" />
              </div>
              <div className="flex gap-3 pt-2 border-t">
                <button type="button" onClick={() => setIsRestockOpen(false)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition">
                  {saving ? 'Adding...' : '+ Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock History Modal */}
      {isHistoryOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Stock Ledger</h2>
                <p className="text-xs text-gray-500">{selectedProduct.name} · Evolution of stock</p>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                 <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {historyLoading ? (
                <div className="py-12 text-center text-gray-400">Loading history...</div>
              ) : historyData.length === 0 ? (
                <div className="py-12 text-center text-gray-400">No operations recorded yet.</div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-100 before:to-transparent">
                   {historyData.map((item, idx) => (
                     <div key={idx} className="relative flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                           {/* Marker */}
                           <div className={`w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${
                             item.type === 'RESTOCK' || item.type === 'RETURN' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-600'
                           }`}>
                              {item.type === 'RESTOCK' || item.type === 'RETURN' ? '+' : '-'}
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                 <span className="text-sm font-black text-gray-900">{item.type}</span>
                                 <span className="text-[10px] text-gray-400 uppercase font-black">{new Date(item.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-[11px] text-gray-500">by {item.workerId?.name || 'System'}</p>
                              {item.reason && <p className="text-xs italic text-gray-400 mt-1">"{item.reason}"</p>}
                           </div>
                        </div>
                        <div className={`text-sm font-black ${
                           item.type === 'RESTOCK' || item.type === 'RETURN' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                           {item.quantity > 0 ? '+' : ''}{item.quantity}
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </div>
            
            <div className="p-6 bg-gray-50 border-t text-center">
               <button onClick={() => setIsHistoryOpen(false)} className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors text-sm shadow-sm">
                  Close Ledger
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
