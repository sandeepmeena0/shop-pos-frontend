import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { transactionService } from '../../services/index.js';
import toast from 'react-hot-toast';
import { XMarkIcon, BanknotesIcon, CreditCardIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';

function PaymentModal({ totalAmount, onClose, onComplete }) {
  const { cart, currentUser, settings, settingsLoading, clearCart, fetchProducts } = usePOS();
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [processing, setProcessing] = useState(false);

  if (settingsLoading || !settings) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4" />
          <p className="text-gray-500 font-medium animate-pulse">Synchronizing Settings...</p>
        </div>
      </div>
    );
  }

  const quickAmounts = [
    totalAmount,
    Math.ceil(totalAmount / 100) * 100,
    Math.ceil(totalAmount / 500) * 500,
    Math.ceil(totalAmount / 1000) * 1000,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= totalAmount);

  const handlePay = async () => {
    const paid = parseFloat(amountPaid) || totalAmount;
    if (paid < totalAmount && paymentMethod === 'Cash') {
      toast.error('Amount paid cannot be less than the total amount!');
      return;
    }

    setProcessing(true);
    try {
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const totalDiscount = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
      const taxAmount = ((subtotal - totalDiscount) * (settings.taxRate || 0)) / 100;

      const payload = {
        items: cart.map(item => ({
          productId: item._id,
          quantity: item.quantity,
        })),
        discount: totalDiscount,
        taxAmount: taxAmount,
        taxRate: settings.taxRate || 0,
        paymentMethod,
      };

      const { data: transaction } = await transactionService.create(payload);

      // Build receipt-compatible object for ReceiptModal
      const receipt = {
        id: transaction.receiptNumber,
        time: transaction.createdAt,
        items: cart.map(item => ({ ...item, id: item._id })),
        subtotal,
        discount: totalDiscount,
        tax: taxAmount,
        total: transaction.finalAmount,
        paymentMethod,
        amountPaid: paid,
        change: Math.max(0, paid - transaction.finalAmount),
        cashier: currentUser?.name || 'System',
      };

      clearCart();
      await fetchProducts(); // Refresh stock levels
      toast.success('Transaction completed!');
      onComplete(receipt);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        <div className="px-6 py-4 flex justify-between items-center border-b bg-gray-50/50 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">Complete Transaction</h2>
          <button 
            onClick={onClose} 
            disabled={processing} 
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl border border-gray-100 hover:border-red-100 transition-all active:scale-95 shadow-sm bg-white"
            title="Cancel Payment"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-8">
            <p className="text-gray-500 text-sm font-medium mb-1">Total Amount Due</p>
            <p className="text-5xl font-black text-primary tracking-tight">₹{parseFloat(totalAmount).toFixed(2)}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Payment Method</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'Cash', icon: BanknotesIcon, label: 'Cash' },
                { key: 'Card', icon: CreditCardIcon, label: 'Card' },
                { key: 'UPI', icon: QrCodeIcon, label: 'UPI / QR' },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setPaymentMethod(key)}
                  className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${paymentMethod === key
                      ? 'border-primary bg-primary/5 text-primary shadow-sm scale-[1.02]'
                      : 'border-gray-100 text-gray-500 hover:border-purple-200'
                    }`}
                >
                  <Icon className="w-8 h-8 mb-2" />
                  <span className="font-semibold text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'Cash' && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Amount Tendered</h3>
              <input
                type="number"
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                placeholder={`Minimum ₹${totalAmount.toFixed(2)}`}
                className="w-full text-center text-2xl font-bold p-4 border-2 border-gray-200 rounded-xl focus:border-primary outline-none transition-colors"
                autoFocus
              />
              <div className="grid grid-cols-4 gap-2 mt-3">
                {quickAmounts.map((amt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAmountPaid(amt.toString())}
                    className="py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors border border-gray-200 text-sm"
                  >
                    {idx === 0 ? 'Exact' : `₹${amt}`}
                  </button>
                ))}
              </div>
              {parseFloat(amountPaid) > totalAmount && (
                <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100 flex justify-between items-center">
                  <span className="text-green-800 font-semibold">Change to Return:</span>
                  <span className="text-2xl font-bold text-green-600">₹{(parseFloat(amountPaid) - totalAmount).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'UPI' && (
            <div className="mb-4 flex flex-col items-center">
              {settings.upiId ? (
                <div className="bg-white p-3 rounded-2xl border-2 border-purple-100 shadow-sm flex flex-col items-center animate-in zoom-in duration-300">
                  <div className="bg-primary/5 p-2 rounded-xl mb-2">
                    <QRCodeSVG
                      value={`upi://pay?pa=${encodeURIComponent((settings.upiId || '').trim())}&pn=${encodeURIComponent(((settings.merchantName || settings.storeName) || '').trim())}&am=${parseFloat(totalAmount).toFixed(2)}&cu=INR&mode=02&mc=0000&tn=${encodeURIComponent('Payment to ' + (settings.storeName || 'SmartPOS'))}`}
                      size={150}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-purple-400 mb-0.5">Scan to Pay</p>
                  <p className="text-sm font-bold text-gray-800 tracking-tight">₹{parseFloat(totalAmount).toFixed(2)}</p>
                  <p className="text-[8px] text-gray-400 mt-1 font-mono">{settings.upiId}</p>
                </div>
              ) : (
                <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 text-center">
                  <p className="text-amber-800 text-sm font-bold mb-1">UPI Not Configured</p>
                  <p className="text-amber-600 text-xs italic">Please set your UPI ID in Superadmin Settings to enable dynamic QR codes.</p>
                </div>
              )}
              
              <button 
                onClick={onClose}
                className="mt-4 text-[11px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-1.5 rounded-lg transition-all border border-transparent hover:border-red-100"
              >
                Cancel & Close
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={handlePay}
            disabled={processing}
            className="w-full py-4 bg-primary hover:bg-purple-800 disabled:opacity-60 text-white font-bold text-lg rounded-xl shadow-lg transition-transform active:scale-[0.98]"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
