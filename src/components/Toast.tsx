import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { IconButton } from './ui/IconButton';

interface ToastProps {
  message: string;
  onClose: () => void;
}

/**
 * Bottom-right transient notification.
 *
 * Accessibility: the wrapper is a live region (`role="status"` +
 * `aria-live="polite"`), so screen readers announce the message when it mounts
 * instead of it appearing silently. `aria-atomic` makes the whole message be
 * read rather than just the changed fragment. The icon is decorative and is
 * removed from the accessibility tree; the close control gets a real label.
 */
export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-50 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-lift rounded-card p-4 flex items-center gap-3 animate-fade-in-up"
    >
      <AlertCircle
        aria-hidden="true"
        className="w-5 h-5 shrink-0 text-danger-500"
      />
      <p className="text-body font-bold text-stone-900 dark:text-stone-100">{message}</p>
      <IconButton
        aria-label="Dismiss notification"
        icon={<X className="w-4 h-4" />}
        variant="ghost"
        size="sm"
        onClick={onClose}
      />
    </div>
  );
};
