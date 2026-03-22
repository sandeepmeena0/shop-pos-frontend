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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden" style={{maxHeight: 'min(95dvh, 600px)'}}>

        <div className="px-4 sm:px-5 py-3 flex justify-between items-center border-b bg-gray-50/50 shrink-0">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Checkout</p>
          <button 
            onClick={onClose} 
            disabled={processing} 
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg border border-gray-100 hover:border-red-100 transition-all active:scale-95 shadow-sm bg-white"
            title="Cancel Payment"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-5 py-3 overflow-y-auto flex-1">
          <div className="text-center mb-3">
            <p className="text-gray-400 text-[10px] font-medium mb-0.5 uppercase tracking-widest">Total Amount Due</p>
            <p className="text-3xl sm:text-4xl font-black text-primary tracking-tight">₹{parseFloat(totalAmount).toFixed(2)}</p>
          </div>

          <div className="mb-3">
            <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'Cash', icon: BanknotesIcon, label: 'Cash' },
                { key: 'Card', icon: CreditCardIcon, label: 'Card' },
                { key: 'UPI', icon: QrCodeIcon, label: 'UPI / QR' },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setPaymentMethod(key)}
                  className={`flex flex-col items-center justify-center py-2 rounded-xl border-2 transition-all ${paymentMethod === key
                      ? 'border-primary bg-primary/5 text-primary shadow-sm'
                      : 'border-gray-100 text-gray-500 hover:border-purple-200'
                    }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="font-semibold text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fixed-height payment options area - prevents modal from jumping */}
          <div className="min-h-[160px] flex flex-col justify-start">

            {paymentMethod === 'Cash' && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">Amount Tendered</p>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  placeholder={`Min ₹${totalAmount.toFixed(2)}`}
                  className="w-full text-center text-xl font-bold p-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none transition-colors"
                  autoFocus
                />
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {quickAmounts.map((amt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAmountPaid(amt.toString())}
                      className="py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors border border-gray-200 text-xs"
                    >
                      {idx === 0 ? 'Exact' : `₹${amt}`}
                    </button>
                  ))}
                </div>
                {parseFloat(amountPaid) > totalAmount && (
                  <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100 flex justify-between items-center">
                    <span className="text-green-800 font-semibold text-sm">Change:</span>
                    <span className="text-xl font-bold text-green-600">₹{(parseFloat(amountPaid) - totalAmount).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'Card' && (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                  <CreditCardIcon className="w-7 h-7 text-blue-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-800">Card Payment</p>
                  <p className="text-xs text-gray-400 mt-1">Swipe or tap card on terminal, then click Confirm Payment.</p>
                </div>
              </div>
            )}

            {paymentMethod === 'UPI' && (
              <div className="flex flex-col items-center">
                {settings.upiId ? (
                  <div className="bg-white p-2 rounded-2xl border-2 border-purple-100 shadow-sm flex flex-col items-center animate-in zoom-in duration-300">
                    <div className="bg-primary/5 p-1 rounded-xl mb-1">
                      <QRCodeSVG
                        value={`upi://pay?pa=${encodeURIComponent((settings.upiId || '').trim())}&pn=${encodeURIComponent(((settings.merchantName || settings.storeName) || '').trim())}&am=${parseFloat(totalAmount).toFixed(2)}&cu=INR&mode=02&mc=0000&tn=${encodeURIComponent('Payment to ' + (settings.storeName || 'SmartPOS'))}`}
                        size={110}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-purple-400 mb-0.5">Scan to Pay</p>
                    <p className="text-sm font-bold text-gray-800">₹{parseFloat(totalAmount).toFixed(2)}</p>
                    <p className="text-[8px] text-gray-400 font-mono">{settings.upiId}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center w-full">
                    <p className="text-amber-800 text-sm font-bold mb-1">UPI Not Configured</p>
                    <p className="text-amber-600 text-xs italic">Please set your UPI ID in Settings.</p>
                  </div>
                )}
                <button 
                  onClick={onClose}
                  className="mt-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 px-4 py-1.5 rounded-lg transition-all border border-gray-200 hover:border-red-100"
                >
                  Cancel & Close
                </button>
              </div>
            )}


          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t bg-gray-50/50 shrink-0">
          <button
            onClick={handlePay}
            disabled={processing}
            className="w-full py-3 bg-primary hover:bg-purple-800 disabled:opacity-60 text-white font-bold text-base rounded-xl shadow-lg transition-transform active:scale-[0.98]"
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
