import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xl rounded-2xl p-4 flex items-center gap-3 animate-fade-in-up">
      <AlertCircle className="w-5 h-5 text-rose-500" />
      <p className="text-sm font-bold text-stone-900 dark:text-stone-100">{message}</p>
      <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
