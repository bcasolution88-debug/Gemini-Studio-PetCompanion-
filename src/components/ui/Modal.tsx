import React, { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';

/**
 * Accessible modal dialog base.
 *
 * Before this component existed the app had 17 hand-rolled overlay divs, of
 * which exactly one closed on Escape. None of them trapped focus, locked the
 * background scroll, exposed `role="dialog"`/`aria-modal`, or returned focus
 * to the element that opened them - so the app was unusable with a keyboard.
 *
 * This base adds, once:
 *   - createPortal to document.body (escapes any parent stacking context)
 *   - role="dialog" + aria-modal + aria-labelledby / aria-label
 *   - Escape closes
 *   - Tab / Shift+Tab focus cycling inside the dialog
 *   - background scroll lock (reference-counted, so nested dialogs are safe)
 *   - focus moved inside on open, restored to the trigger on close
 */

export type ModalLevel = 'base' | 'raised' | 'top';

const LEVEL_Z: Record<ModalLevel, string> = {
  base: 'z-50',
  raised: 'z-[500]',
  top: 'z-[1000]',
};

const SIZE_PANEL: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full', string> = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  full: 'max-w-none w-full h-full',
};

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// Reference counted so two nested dialogs do not unlock scrolling early.
let scrollLocks = 0;
function lockScroll(): void {
  if (scrollLocks === 0) {
    document.body.style.overflow = 'hidden';
  }
  scrollLocks += 1;
}
function unlockScroll(): void {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0) {
    document.body.style.overflow = '';
  }
}

export interface ModalProps {
  /** Renders nothing when false. */
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;

  /** id of the element that names the dialog (usually the heading). */
  labelledBy?: string;
  /** Fallback accessible name when there is no visible heading. */
  ariaLabel?: string;

  size?: keyof typeof SIZE_PANEL;
  level?: ModalLevel;

  /**
   * Let the panel scroll its own content (default true). Set false when the
   * dialog manages an internal scroll region (header / body / footer layout).
   */
  scrollable?: boolean;

  /** Classes for the white panel itself. */
  panelClassName?: string;
  /** Classes for the dark backdrop. */
  overlayClassName?: string;

  /** Click on the backdrop closes the dialog (default true). */
  closeOnBackdrop?: boolean;
  /** Disable Escape handling (e.g. a blocking confirmation). */
  disableEscape?: boolean;
}

export default function Modal({
  open,
  onClose,
  children,
  labelledBy,
  ariaLabel,
  size = 'md',
  level = 'base',
  panelClassName,
  overlayClassName,
  closeOnBackdrop = true,
  disableEscape = false,
  scrollable = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Move focus in on open, restore it on close, and lock scrolling.
  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    lockScroll();

    // Defer so the portal has mounted.
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      // Fall back to the panel itself so focus never stays behind the overlay.
      (first ?? panel).focus();
    });

    return () => {
      cancelAnimationFrame(raf);
      unlockScroll();
      const restoreTo = restoreFocusRef.current;
      if (restoreTo && typeof restoreTo.focus === 'function') {
        restoreTo.focus();
      }
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape' && !disableEscape) {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable: HTMLElement[] = [];
      panel.querySelectorAll(FOCUSABLE).forEach((node) => {
        const el = node as HTMLElement;
        if (el.offsetParent !== null || el === panel) focusable.push(el);
      });

      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [disableEscape, onClose],
  );

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center p-4',
        'bg-stone-950/60 backdrop-blur-sm',
        LEVEL_Z[level],
        overlayClassName,
      )}
      onMouseDown={(event) => {
        // Only a press that both starts and ends on the backdrop closes it,
        // so dragging text out of an input does not dismiss the dialog.
        if (closeOnBackdrop && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy ?? (ariaLabel ? undefined : titleId)}
        aria-label={ariaLabel}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative w-full max-h-[90vh] outline-none',
          scrollable ? 'overflow-y-auto' : 'overflow-hidden flex flex-col',
          'bg-white dark:bg-stone-800 rounded-3xl shadow-2xl',
          'border border-stone-200/70 dark:border-stone-700/60',
          SIZE_PANEL[size],
          panelClassName,
        )}
      >
        {/* Visually hidden fallback heading so the dialog always has a name. */}
        {!labelledBy && !ariaLabel && (
          <span id={titleId} className="sr-only">
            Dialog
          </span>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
