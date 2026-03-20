import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

const ActionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'warning', // 'warning', 'success', 'question', 'input'
  inputValue = '',
  inputPlaceholder = '',
  showInput = false
}) => {
  const [value, setValue] = useState(inputValue);

  if (!isOpen) return null;

  const icons = {
    warning: <ExclamationTriangleIcon className="w-12 h-12 text-amber-500" />,
    success: <CheckCircleIcon className="w-12 h-12 text-primary" />,
    question: <QuestionMarkCircleIcon className="w-12 h-12 text-blue-500" />,
    danger: <XMarkIcon className="w-12 h-12 text-red-500" />,
    input: <CheckCircleIcon className="w-12 h-12 text-primary" />
  };

  const colors = {
    warning: 'bg-amber-50',
    success: 'bg-primary/5',
    question: 'bg-blue-50',
    danger: 'bg-red-50',
    input: 'bg-primary/5'
  };

  const buttonColors = {
    warning: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200',
    success: 'bg-primary hover:bg-primary-hover shadow-primary/20',
    question: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
    danger: 'bg-red-600 hover:bg-red-700 shadow-red-200',
    input: 'bg-primary hover:bg-primary-hover shadow-primary/20'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 flex flex-col items-center text-center">
          <div className={`p-4 rounded-2xl mb-6 ${colors[type] || 'bg-gray-50'}`}>
            {icons[type] || icons.question}
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">{message}</p>

          {showInput && (
            <input 
              type="text"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl mb-6 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-center"
              onKeyDown={(e) => e.key === 'Enter' && onConfirm(value)}
            />
          )}

          <div className="flex flex-col w-full gap-3">
            <button 
              onClick={() => onConfirm(showInput ? value : true)}
              className={`w-full py-4 ${buttonColors[type] || buttonColors.success} text-white font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98] outline-none`}
            >
              {confirmText}
            </button>
            <button 
              onClick={onClose}
              className="w-full py-3 text-gray-400 font-semibold hover:text-gray-600 transition-colors"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionModal;
