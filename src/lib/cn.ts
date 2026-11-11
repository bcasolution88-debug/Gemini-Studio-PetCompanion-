/**
 * Minimal class-name joiner.
 *
 * Deliberately tiny (no clsx/tailwind-merge dependency): the design-system
 * primitives only ever concatenate conditional class strings.
 */
export type ClassValue = string | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
