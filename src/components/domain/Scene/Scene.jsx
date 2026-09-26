import React, { useId } from 'react';
import { SCENES } from './scenes.jsx';
import styles from './Scene.module.css';

/**
 * Full-scene SVG illustration for buyer empty, closed and error states.
 *
 * Every scene is drawn on a 640x400 canvas with the horizon at y=252 and the
 * vanishing point at (400, 252), so all ten read as one world. Depth comes from
 * layer opacity and stroke width, never from gradients.
 *
 * @param {string}  name      key from SCENES, e.g. 'walk-to-market'
 * @param {'md'|'lg'} size    md = --scene-max-w, lg = --scene-max-w-lg
 * @param {string}  title     when given, the scene becomes role="img" with this label.
 *                            Omit inside EmptyState, where adjacent text carries the meaning.
 * @param {string}  className optional additional class names
 */
export function Scene({ name = 'walk-to-market', size = 'md', title, className = '', ...rest }) {
  const titleId = useId();
  const draw = SCENES[name] || SCENES['walk-to-market'];
  const labelled = Boolean(title);

  return (
    <svg
      viewBox="0 0 640 400"
      preserveAspectRatio="xMidYMid meet"
      className={`${styles.scene} ${styles[size] || styles.md} ${className}`}
      role={labelled ? 'img' : undefined}
      aria-hidden={labelled ? undefined : 'true'}
      aria-labelledby={labelled ? titleId : undefined}
      focusable="false"
      {...rest}
    >
      {labelled && <title id={titleId}>{title}</title>}
      {draw(styles)}
    </svg>
  );
}

export default Scene;
