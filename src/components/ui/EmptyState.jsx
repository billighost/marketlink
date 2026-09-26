import React from 'react';
import Scene from '@/components/domain/Scene/Scene';
import Button from '@/components/ui/Button';
import styles from './EmptyState.module.css';

/**
 * Buyer empty state: a full scene illustration, a short title, one line of guidance,
 * and at most one action.
 *
 * The scene is decorative — the title and text carry the meaning — so it renders
 * aria-hidden and the heading is what a screen reader announces.
 *
 * @param {string} scene         key from SCENES, e.g. 'empty-basket'
 * @param {string} illustration  DEPRECATED. Legacy Illustration name; mapped to a scene.
 * @param {string} title         h3, sentence case, states the fact plainly
 * @param {string} text          one line of guidance, max ~90 characters
 * @param {string} actionLabel   optional single action
 */
export function EmptyState({
  scene,
  illustration,
  title,
  text,
  actionLabel,
  onAction,
  actionTo,
  size = 'md',
  className = '',
}) {
  const sceneName = scene || LEGACY_SCENE_MAP[illustration] || 'walk-to-market';

  return (
    <div className={`${styles.empty} ${className}`}>
      <Scene name={sceneName} size={size} className={styles.scene} />
      {title && <h3 className={styles.title}>{title}</h3>}
      {text && <p className={styles.text}>{text}</p>}
      {actionLabel && (
        <Button variant="primary" size="md" onClick={onAction} to={actionTo}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/** Old Illustration names that pages still pass, mapped to their nearest scene. */
const LEGACY_SCENE_MAP = {
  basket: 'empty-basket',
  'basket-tomatoes': 'walk-to-market',
  'empty-crate-soldout': 'stall-empty',
  'closed-stall': 'market-closed',
  'basket-door': 'walk-to-market',
  crate: 'stall-empty',
  stall: 'market-closed',
};

export default EmptyState;
