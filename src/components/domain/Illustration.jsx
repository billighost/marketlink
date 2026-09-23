import React from 'react';
import styles from './Illustration.module.css';

/**
 * Hand-crafted line-and-tint SVG illustrations.
 * Zero remote images, zero emojis.
 * @param {'stall' | 'crate' | 'carrot' | 'beet' | 'leaves' | 'loaf' | 'honey' | 'tomato' | 'basket'} name
 * @param {'sm' | 'md' | 'lg'} size
 */
export function Illustration({
  name = 'basket',
  size = 'md',
  className = '',
  'aria-hidden': ariaHidden = true,
  ...rest
}) {
  const rootClasses = [
    styles.illustration,
    styles[size],
    className,
  ].filter(Boolean).join(' ');

  const renderContent = () => {
    switch (name) {
      case 'stall':
        return (
          <>
            {/* Market stall awning poles */}
            <line x1="16" y1="36" x2="16" y2="72" className={styles.line} />
            <line x1="64" y1="36" x2="64" y2="72" className={styles.line} />
            {/* Awning stripes */}
            <path d="M12 18 L68 18 L64 36 L16 36 Z" className={styles.fillCanvas} />
            <path d="M22 18 L28 18 L27 36 L21 36 Z" className={styles.fillBeet} />
            <path d="M34 18 L40 18 L39 36 L33 36 Z" className={styles.fillBeet} />
            <path d="M46 18 L52 18 L51 36 L45 36 Z" className={styles.fillBeet} />
            <path d="M58 18 L64 18 L63 36 L57 36 Z" className={styles.fillBeet} />
            {/* Scalloped edge */}
            <path
              d="M12 36 Q18 42 24 36 Q30 42 36 36 Q42 42 48 36 Q54 42 60 36 Q66 42 68 36"
              className={styles.scallopLine}
            />
            {/* Counter table */}
            <rect x="12" y="52" width="56" height="20" rx="4" className={styles.fillWhite} />
            <line x1="12" y1="58" x2="68" y2="58" className={styles.line} />
            {/* Produce on counter */}
            <circle cx="26" cy="48" r="4" className={styles.fillCarrot} />
            <circle cx="34" cy="47" r="5" className={styles.fillHerb} />
            <circle cx="43" cy="48" r="4" className={styles.fillBeet} />
            <rect x="49" y="44" width="14" height="8" rx="2" className={styles.fillCanvas} />
          </>
        );

      case 'crate':
        return (
          <>
            {/* Crate back produce */}
            <circle cx="28" cy="30" r="8" className={styles.fillHerb} />
            <circle cx="40" cy="28" r="9" className={styles.fillBeet} />
            <circle cx="52" cy="32" r="7" className={styles.fillCarrot} />
            {/* Carrot greens */}
            <path d="M52 25 Q54 18 58 16" className={styles.line} />
            <path d="M52 25 Q48 17 46 16" className={styles.line} />
            {/* Wooden crate body */}
            <rect x="14" y="34" width="52" height="34" rx="4" className={styles.fillCanvas} />
            <line x1="14" y1="45" x2="66" y2="45" className={styles.line} />
            <line x1="14" y1="56" x2="66" y2="56" className={styles.line} />
            {/* Corner braces and handle slot */}
            <rect x="14" y="34" width="6" height="34" className={styles.fillWhite} />
            <rect x="60" y="34" width="6" height="34" className={styles.fillWhite} />
            <rect x="34" y="38" width="12" height="4" rx="2" className={styles.fillWhite} />
          </>
        );

      case 'carrot':
        return (
          <>
            {/* Greens */}
            <path d="M40 26 Q35 14 26 12" className={styles.line} />
            <path d="M40 26 Q40 12 40 8" className={styles.line} />
            <path d="M40 26 Q46 14 54 12" className={styles.line} />
            <path d="M33 19 Q28 17 25 21" className={styles.line} />
            <path d="M47 19 Q52 17 55 21" className={styles.line} />
            {/* Carrot root body */}
            <path
              d="M30 28 C30 25 50 25 50 28 C50 38 43 64 40 72 C37 64 30 38 30 28 Z"
              className={styles.fillCarrot}
            />
            {/* Ridges */}
            <line x1="34" y1="36" x2="42" y2="36" className={styles.line} />
            <line x1="36" y1="46" x2="45" y2="46" className={styles.line} />
            <line x1="38" y1="56" x2="43" y2="56" className={styles.line} />
          </>
        );

      case 'beet':
        return (
          <>
            {/* Leaves and stems */}
            <path d="M40 34 C36 22 28 18 24 16" className={styles.line} />
            <path d="M40 34 C41 20 46 14 52 12" className={styles.line} />
            <path d="M40 34 C43 24 55 22 58 20" className={styles.line} />
            <ellipse cx="24" cy="16" rx="5" ry="4" className={styles.fillHerb} />
            <ellipse cx="52" cy="13" rx="5" ry="4" className={styles.fillHerb} />
            {/* Bulb root body */}
            <path
              d="M24 44 C24 32 56 32 56 44 C56 55 43 65 40 72 C37 65 24 55 24 44 Z"
              className={styles.fillBeet}
            />
            {/* Root lines */}
            <path d="M40 72 Q42 76 41 78" className={styles.line} />
            <line x1="30" y1="46" x2="38" y2="48" className={styles.line} />
            <line x1="43" y1="52" x2="50" y2="50" className={styles.line} />
          </>
        );

      case 'leaves':
        return (
          <>
            {/* Central stem */}
            <path d="M40 70 C40 50 40 30 40 18" className={styles.line} />
            {/* Leaf 1 (top) */}
            <path d="M40 18 C34 12 36 6 40 6 C44 6 46 12 40 18 Z" className={styles.fillHerb} />
            {/* Leaf 2 (left) */}
            <path d="M40 32 C30 28 20 30 18 36 C24 42 34 38 40 32 Z" className={styles.fillHerb} />
            {/* Leaf 3 (right) */}
            <path d="M40 42 C50 38 60 40 62 46 C56 52 46 48 40 42 Z" className={styles.fillHerb} />
            {/* Leaf 4 (left lower) */}
            <path d="M40 52 C32 48 24 52 22 58 C28 62 36 58 40 52 Z" className={styles.fillHerb} />
            {/* Tie ribbon */}
            <ellipse cx="40" cy="66" rx="4" ry="2" className={styles.fillCarrot} />
          </>
        );

      case 'loaf':
        return (
          <>
            {/* Sourdough round boule */}
            <path
              d="M16 52 C16 34 26 24 40 24 C54 24 64 34 64 52 C64 60 56 62 40 62 C24 62 16 60 16 52 Z"
              className={styles.fillCanvas}
            />
            {/* Base line */}
            <line x1="18" y1="55" x2="62" y2="55" className={styles.line} />
            {/* Flour crust scoring */}
            <path d="M26 38 C34 32 46 32 54 38" className={styles.scoreLine} />
            <path d="M28 46 C35 40 45 40 52 46" className={styles.scoreLine} />
            <circle cx="32" cy="30" r="1" className={styles.fillBeet} />
            <circle cx="48" cy="30" r="1" className={styles.fillBeet} />
          </>
        );

      case 'honey':
        return (
          <>
            {/* Honey jar body */}
            <rect x="22" y="34" width="36" height="34" rx="6" className={styles.fillCarrot} />
            {/* Cloth lid & neck */}
            <path d="M20 28 L60 28 L58 36 L22 36 Z" className={styles.fillCanvas} />
            <path d="M18 36 Q25 40 32 36 Q40 40 48 36 Q55 40 62 36" className={styles.line} />
            <line x1="20" y1="36" x2="60" y2="36" className={styles.line} />
            {/* Tied string bow */}
            <ellipse cx="40" cy="36" rx="3" ry="2" className={styles.fillWhite} />
            {/* Label */}
            <rect x="28" y="44" width="24" height="16" rx="2" className={styles.fillWhite} />
            {/* Comb symbol */}
            <polygon points="40,48 44,50 44,55 40,57 36,55 36,50" className={styles.fillHerb} />
          </>
        );

      case 'tomato':
        return (
          <>
            {/* Plump heirloom tomato body */}
            <path
              d="M26 34 C16 42 16 62 32 66 C38 68 42 68 48 66 C64 62 64 42 54 34 C48 30 32 30 26 34 Z"
              className={styles.fillCarrot}
            />
            {/* Lobes */}
            <path d="M33 34 C30 45 30 55 35 66" className={styles.subtleLine} />
            <path d="M47 34 C50 45 50 55 45 66" className={styles.subtleLine} />
            {/* Star stem calyx */}
            <path d="M40 32 L36 25 L40 28 L44 24 L42 30 L48 31 L42 34 L40 32 Z" className={styles.fillHerb} />
            <path d="M40 28 Q43 20 40 18" className={styles.line} />
          </>
        );

      case 'basket':
      default:
        return (
          <>
            {/* Handle */}
            <path d="M26 44 C26 22 54 22 54 44" className={styles.line} />
            {/* Produce inside */}
            <circle cx="34" cy="38" r="7" className={styles.fillHerb} />
            <circle cx="46" cy="36" r="8" className={styles.fillCarrot} />
            <path d="M48 28 Q52 24 55 24" className={styles.line} />
            {/* Basket weave bowl */}
            <path
              d="M18 42 L62 42 L56 68 C56 70 52 72 40 72 C28 72 24 70 24 68 L18 42 Z"
              className={styles.fillCanvas}
            />
            {/* Weave lines */}
            <line x1="20" y1="50" x2="60" y2="50" className={styles.line} />
            <line x1="22" y1="58" x2="58" y2="58" className={styles.line} />
            <line x1="32" y1="42" x2="30" y2="70" className={styles.line} />
            <line x1="48" y1="42" x2="50" y2="70" className={styles.line} />
          </>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 80 80"
      className={rootClasses}
      aria-hidden={ariaHidden}
      focusable="false"
      {...rest}
    >
      {renderContent()}
    </svg>
  );
}

export default Illustration;
