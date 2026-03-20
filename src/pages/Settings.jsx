import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { CheckCircleIcon, LockClosedIcon, BuildingStorefrontIcon, CurrencyRupeeIcon, ChatBubbleBottomCenterTextIcon, QrCodeIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  const { settings, updateSettings, currentUser, settingsLoading } = usePOS();
  const [formData, setFormData] = useState({ 
    storeName: '', 
    storeAddress: '', 
    storePhone: '', 
    taxRate: '', 
    receiptFooter: '', 
    upiId: '', 
    merchantName: '',
    receiptPrefix: '',
    returnPrefix: '',
    defaultLowStockThreshold: '',
    categories: []
  });
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Sync internal state when context settings change (e.g. after first load)
  useEffect(() => {
    if (settings) {
      setFormData({ ...settings });
    }
  }, [settings]);

  if (settingsLoading || !settings) {
     return (
       <div className="h-[70vh] flex flex-col items-center justify-center">
         <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4" />
         <p className="text-gray-500 font-medium">Loading System Configuration...</p>
       </div>
     );
  }

  if (currentUser?.role !== 'Super Admin') {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
           <LockClosedIcon className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-500 max-w-sm font-medium">
          Only users with <span className="text-red-600 font-bold uppercase tracking-widest text-xs">Super Admin</span> clearance can modify global store parameters.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const result = await updateSettings({
      ...formData,
      taxRate: parseFloat(formData.taxRate) || 0,
      defaultLowStockThreshold: parseInt(formData.defaultLowStockThreshold) || 10,
      categories: Array.isArray(formData.categories) ? formData.categories : formData.categories.split(',').map(c => c.trim()).filter(c => c)
    });
    
    setSaving(false);
    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Configuration</h1>
        <p className="text-gray-500 font-medium mt-1">Manage store branding, taxation, and receipt parameters.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION: BRANDING */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b bg-gray-50/50 flex items-center gap-3">
             <BuildingStorefrontIcon className="w-6 h-6 text-primary" />
             <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Store Branding</h3>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="col-span-full md:col-span-1">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Store Name</label>
              <input 
                type="text" 
                required
                value={formData.storeName}
                onChange={e => setFormData({...formData, storeName: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white outline-none transition-all font-semibold text-gray-800"
                placeholder="e.g. SmartPOS Hub"
              />
            </div>

            <div className="col-span-full">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Store Address</label>
              <textarea 
                rows="2"
                required
                value={formData.storeAddress}
                onChange={e => setFormData({...formData, storeAddress: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white outline-none transition-all font-semibold text-gray-800"
                placeholder="Street Address, City, State, ZIP"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Contact Phone</label>
              <input 
                type="text" 
                required
                value={formData.storePhone}
                onChange={e => setFormData({...formData, storePhone: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white outline-none transition-all font-semibold text-gray-800"
                placeholder="+91 00000 00000"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Primary Brand Color</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={formData.themeColor || '#4f46e5'}
                  onChange={e => setFormData({...formData, themeColor: e.target.value})}
                  className="w-12 h-12 rounded-xl border-2 border-gray-100 cursor-pointer p-1 bg-white"
                />
                <input 
                  type="text" 
                  value={formData.themeColor || '#4f46e5'}
                  onChange={e => setFormData({...formData, themeColor: e.target.value})}
                  className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white outline-none transition-all font-mono text-sm uppercase text-gray-800"
                  placeholder="#4F46E5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: FINANCIALS */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b bg-gray-50/50 flex items-center gap-3">
             <CurrencyRupeeIcon className="w-6 h-6 text-emerald-600" />
             <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Financial & Tax</h3>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Default Tax Rate (%)</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={formData.taxRate}
                  onChange={e => setFormData({...formData, taxRate: e.target.value})}
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-black text-gray-800"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: UPI PAYMENTS */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b bg-gray-50/50 flex items-center gap-3">
             <QrCodeIcon className="w-6 h-6 text-primary" />
             <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Digital Payments (UPI)</h3>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Merchant Name</label>
              <input 
                type="text" 
                value={formData.merchantName}
                onChange={e => setFormData({...formData, merchantName: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white outline-none transition-all font-semibold text-gray-800"
                placeholder="Business Name for QR"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">UPI ID (VPA)</label>
              <input 
                type="text" 
                value={formData.upiId}
                onChange={e => setFormData({...formData, upiId: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white outline-none transition-all font-semibold text-gray-800"
                placeholder="example@upi"
              />
              <p className="mt-2 text-[10px] text-gray-400 font-medium italic">* Dynamic QR codes will be generated for customers using this ID.</p>
            </div>
          </div>
        </div>

        {/* SECTION: TERMINAL LOGIC */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b bg-gray-50/50 flex items-center gap-3">
             <CurrencyRupeeIcon className="w-6 h-6 text-indigo-600" />
             <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Terminal & Inventory Logic</h3>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Sale Prefix</label>
              <input 
                type="text" 
                value={formData.receiptPrefix}
                onChange={e => setFormData({...formData, receiptPrefix: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white outline-none transition-all font-mono text-sm font-bold text-gray-800"
                placeholder="RCP-"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Return Prefix</label>
              <input 
                type="text" 
                value={formData.returnPrefix}
                onChange={e => setFormData({...formData, returnPrefix: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white outline-none transition-all font-mono text-sm font-bold text-gray-800"
                placeholder="RET-"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Global Low Stock Alert</label>
              <input 
                type="number" 
                value={formData.defaultLowStockThreshold}
                onChange={e => setFormData({...formData, defaultLowStockThreshold: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white outline-none transition-all font-black text-gray-800"
                placeholder="10"
              />
            </div>

            <div className="col-span-full">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Product Categories (Comma separated)</label>
              <textarea 
                rows="2"
                value={Array.isArray(formData.categories) ? formData.categories.join(', ') : formData.categories}
                onChange={e => setFormData({...formData, categories: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:bg-white outline-none transition-all font-semibold text-gray-800"
                placeholder="Groceries, Bakery, Dairy, Electronics..."
              />
              <p className="mt-2 text-[10px] text-gray-400 font-medium italic">* These categories will be available when adding new products and in the POS grid.</p>
            </div>
          </div>
        </div>

        {/* SECTION: RECEIPT CUSTOMIZATION */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b bg-gray-50/50 flex items-center gap-3">
             <ChatBubbleBottomCenterTextIcon className="w-6 h-6 text-amber-600" />
             <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Receipt Design</h3>
          </div>
          
          <div className="p-8">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Thank You Notice (Footer)</label>
            <textarea 
              rows="2"
              required
              value={formData.receiptFooter}
              onChange={e => setFormData({...formData, receiptFooter: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-amber-500 focus:bg-white outline-none transition-all font-semibold text-gray-800"
              placeholder="e.g. We value your business! See you soon."
            />
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex items-center gap-4">
          <button 
            type="submit"
            disabled={saving}
            className="px-10 py-4 bg-primary hover:bg-primary-hover text-white font-black rounded-2xl shadow-xl shadow-primary/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Synchronizing...' : 'Update Settings'}
          </button>
          
          {showSuccess && (
             <div className="flex items-center text-emerald-600 font-bold animate-in fade-in slide-in-from-left-4">
                <CheckCircleIcon className="w-6 h-6 mr-2" />
                Database updated successfully
             </div>
          )}
        </div>

      </form>
    </div>
  );
}
