import React from 'react';
import { cn } from '../../lib/cn';

/**
 * Icon-only button with an enforced accessible name and a real touch target.
 *
 * The audit found 252 icon-sized controls (`w-4 h-4` / `w-5 h-5`) with only
 * 2 `aria-label`s in the whole codebase. `aria-label` is therefore a REQUIRED
 * prop: TypeScript will not compile an unlabeled icon button.
 *
 * The visual glyph stays small while the hit area is padded to at least
 * 36x36 CSS px (WCAG 2.2 SC 2.5.8 asks for 24x24; platform HIGs ask for 44).
 */

export type IconButtonVariant = 'ghost' | 'subtle' | 'solid' | 'danger' | 'outline';
export type IconButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<IconButtonVariant, string> = {
  ghost:
    'text-stone-500 hover:text-stone-800 hover:bg-stone-100 ' +
    'dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-700/60',
  subtle:
    'bg-stone-100 text-stone-700 hover:bg-stone-200 ' +
    'dark:bg-stone-700/60 dark:text-stone-200 dark:hover:bg-stone-700',
  solid:
    'bg-brand-500 text-white hover:bg-brand-600 shadow-sm',
  danger:
    'bg-danger-600 text-white hover:bg-danger-700 shadow-sm',
  outline:
    'border border-stone-200 text-stone-700 hover:bg-stone-50 ' +
    'dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-700/60',
};

/** Size is the HIT AREA, not the glyph. */
const SIZES: Record<IconButtonSize, string> = {
  sm: 'h-9 w-9',   // 36px
  md: 'h-10 w-10', // 40px
  lg: 'h-11 w-11', // 44px
};

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Required: the accessible name read by screen readers. */
  'aria-label': string;
  /** Visible icon. Should be purely decorative (rendered aria-hidden). */
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Extra class for the glyph wrapper (e.g. to size the SVG). */
  iconClassName?: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      'aria-label': ariaLabel,
      icon,
      variant = 'ghost',
      size = 'md',
      className,
      iconClassName,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={ariaLabel}
        title={rest.title ?? ariaLabel}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-xl',
          'transition-colors cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          VARIANTS[variant],
          SIZES[size],
          className,
        )}
        {...rest}
      >
        <span aria-hidden="true" className={cn('inline-flex', iconClassName)}>
          {icon}
        </span>
      </button>
    );
  },
);

export default IconButton;
