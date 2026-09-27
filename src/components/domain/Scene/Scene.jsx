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
  AlertCircle,
} from 'lucide-react';
import styles from './Scene.module.css';

const ICON_MAP = {
  'empty-basket': ShoppingBag,
  basket: ShoppingBag,
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
  'offline-field': AlertCircle,
};

/**
 * Scene component replacement: renders a sleek, professional icon badge
 * adhering to the design system, replacing legacy raw SVG art scenes.
 */
export function Scene({ name = 'walk-to-market', size = 'md', title, className = '', ...rest }) {
  const IconComponent = ICON_MAP[name] || Sparkles;
  const isLg = size === 'lg';

  return (
    <div
      className={`${styles.sceneWrap} ${isLg ? styles.lg : styles.md} ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : 'true'}
      {...rest}
    >
      <div className={styles.iconCircle}>
        <IconComponent size={isLg ? 36 : 28} strokeWidth={1.85} className={styles.icon} />
      </div>
    </div>
  );
}

export default Scene;
