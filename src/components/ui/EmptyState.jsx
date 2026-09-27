import React from 'react';
import {
  ShoppingBag,
  Store,
  Compass,
  PackageCheck,
  Heart,
  Bookmark,
  Star,
  Bell,
  Search,
  Sprout,
  Sparkles,
  ClipboardList,
  FolderOpen,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import styles from './EmptyState.module.css';

/**
 * Scene key to Lucide icon mapping.
 * Replaces heavy SVG art illustrations with clean, crisp, professional design system badges.
 */
const SCENE_ICON_MAP = {
  'empty-basket': ShoppingBag,
  basket: ShoppingBag,
  'basket-produce': ShoppingBag,
  'walk-to-market': Store,
  'stall-empty': Store,
  'market-closed': Store,
  'closed-stall': Store,
  crate: Store,
  'empty-crate-soldout': Store,
  stall: Store,
  'lost-path': Compass,
  'no-orders-yet': ClipboardList,
  orders: PackageCheck,
  favorites: Heart,
  saved: Bookmark,
  reviews: Star,
  notifications: Bell,
  search: Search,
  farmers: Sprout,
  insights: FolderOpen,
};

/**
 * EmptyState: A modern, clear, and descriptive empty state following the MarketLink design system.
 *
 * @param {string} [scene]         Scene key (e.g. 'empty-basket', 'market-closed', 'lost-path')
 * @param {string} [illustration]  Legacy illustration name; mapped to nearest icon
 * @param {React.ComponentType} [icon] Optional custom icon component override
 * @param {string} [title]         h3 heading, sentence case
 * @param {string} [text]          One or two lines of clear guidance
 * @param {string} [actionLabel]   Optional single action button label
 * @param {Function} [onAction]    Action button callback
 * @param {string} [actionTo]      Action button router destination
 * @param {'sm'|'md'|'lg'} [size]  Badge size
 * @param {string} [className]     Optional class
 */
export function EmptyState({
  scene,
  illustration,
  icon: CustomIcon,
  title,
  text,
  actionLabel,
  onAction,
  actionTo,
  size = 'md',
  className = '',
}) {
  const sceneKey = scene || illustration;
  const IconComponent = CustomIcon || SCENE_ICON_MAP[sceneKey] || Sparkles;

  const iconSize = size === 'sm' ? 22 : size === 'lg' ? 32 : 28;
  const badgeClass =
    size === 'sm'
      ? `${styles.iconBadge} ${styles.iconBadgeSm}`
      : size === 'lg'
      ? `${styles.iconBadge} ${styles.iconBadgeLg}`
      : styles.iconBadge;

  return (
    <div className={`${styles.empty} ${className}`} role="status">
      <div className={badgeClass} aria-hidden="true">
        <IconComponent size={iconSize} strokeWidth={1.85} className={styles.icon} />
      </div>
      {title && <h3 className={styles.title}>{title}</h3>}
      {text && <p className={styles.text}>{text}</p>}
      {actionLabel && (
        <div className={styles.action}>
          <Button variant="primary" size="md" onClick={onAction} to={actionTo}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export default EmptyState;
