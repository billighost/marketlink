import React from 'react';
import { ChevronRight } from 'lucide-react';
import Toggle from '@/components/ui/Toggle';
import styles from './ListRow.module.css';

/**
 * Settings-style row with icon, label, optional value, and chevron or toggle.
 * Used in Profile and its sub-screens.
 */
export function ListRow({
  icon: Icon,
  label,
  value,
  onClick,
  to,
  toggle,
  onToggle,
  indicator,
  danger = false,
  className = '',
  ...rest
}) {
  const hasChevron = !toggle && (onClick || to);
  const Component = onClick || to ? 'button' : 'div';

  return (
    <Component
      type={Component === 'button' ? 'button' : undefined}
      className={`${styles.row} ${danger ? styles.danger : ''} ${className}`}
      onClick={onClick}
      {...rest}
    >
      {Icon && (
        <span className={styles.icon} aria-hidden="true">
          <Icon size={20} strokeWidth={1.5} />
        </span>
      )}
      <span className={styles.label}>{label}</span>
      {value && <span className={styles.value}>{value}</span>}
      {indicator && <span className={styles.indicator}>{indicator}</span>}
      {toggle !== undefined && (
        <Toggle
          checked={toggle}
          onChange={(v) => onToggle?.(v)}
          label={label}
        />
      )}
      {hasChevron && (
        <ChevronRight size={18} strokeWidth={1.5} className={styles.chevron} aria-hidden="true" />
      )}
    </Component>
  );
}

export default ListRow;
