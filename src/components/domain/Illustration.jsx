import React from 'react';
import styles from './Illustration.module.css';

/**
 * Hand-crafted line-and-tint SVG illustrations with market character.
 * Uses 1.5px ink-soft strokes, soft-tint fills, wood hairlines, and authentic details.
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
    styles[size] || styles.md,
    className,
  ].filter(Boolean).join(' ');

  const renderContent = () => {
    switch (name) {
      // 1. Wicker basket of tomatoes with overlapping fruit, green calyxes, and weave lines
      case 'basket-tomatoes':
        return (
          <>
            {/* Arched wicker handle */}
            <path d="M22 42 C22 18 58 18 58 42" className={styles.line} />
            <path d="M24 42 C24 21 56 21 56 42" className={styles.subtleLine} />
            {/* Overlapping heirloom tomatoes */}
            <circle cx="31" cy="40" r="9" className={styles.fillCarrot} />
            <circle cx="49" cy="39" r="8.5" className={styles.fillBeet} />
            <circle cx="40" cy="35" r="9.5" className={styles.fillCarrot} />
            {/* Tomato lobes & seed highlights */}
            <path d="M38 30 Q35 36 37 42" className={styles.subtleLine} />
            <path d="M42 30 Q45 36 43 42" className={styles.subtleLine} />
            {/* Calyx stars */}
            <path d="M40 26 L38 29 L35 27 L38 31 L36 34 L40 32 L44 34 L42 31 L45 27 L42 29 Z" className={styles.fillHerb} />
            <path d="M31 31 L29 33 L27 31 L29 34 L31 35 L33 34 L35 31 Z" className={styles.fillHerb} />
            <path d="M49 31 L47 33 L45 31 L47 34 L49 35 L51 34 L53 31 Z" className={styles.fillHerb} />
            {/* Basket weave bowl */}
            <path d="M16 43 L64 43 L58 70 C57 73 52 75 40 75 C28 75 23 73 22 70 L16 43 Z" className={styles.fillCanvas} />
            {/* Wicker horizontal weave ribs */}
            <path d="M17 50 Q40 52 63 50" className={styles.woodLine} />
            <path d="M19 58 Q40 60 61 58" className={styles.woodLine} />
            <path d="M21 66 Q40 68 59 66" className={styles.woodLine} />
            {/* Vertical weave stitches */}
            <line x1="28" y1="44" x2="27" y2="72" className={styles.subtleLine} />
            <line x1="36" y1="44" x2="35" y2="74" className={styles.subtleLine} />
            <line x1="44" y1="44" x2="45" y2="74" className={styles.subtleLine} />
            <line x1="52" y1="44" x2="53" y2="72" className={styles.subtleLine} />
          </>
        );

      // 2. Wooden crate of carrots with feathery tops sticking out
      case 'crate-carrots':
        return (
          <>
            {/* Feathery carrot tops */}
            <path d="M28 28 C24 16 18 12 14 10" className={styles.line} />
            <path d="M28 28 C26 14 30 8 32 6" className={styles.line} />
            <path d="M38 27 C36 15 40 10 42 7" className={styles.line} />
            <path d="M48 29 C50 16 56 12 60 9" className={styles.line} />
            <path d="M48 29 C46 18 48 11 50 8" className={styles.line} />
            {/* Leaflet bunches */}
            <circle cx="16" cy="11" r="3" className={styles.fillHerb} />
            <circle cx="32" cy="7" r="3.5" className={styles.fillHerb} />
            <circle cx="43" cy="8" r="3" className={styles.fillHerb} />
            <circle cx="58" cy="10" r="3.5" className={styles.fillHerb} />
            {/* Carrot shoulders peeking out */}
            <path d="M24 35 C24 30 33 30 33 35 Z" className={styles.fillCarrot} />
            <path d="M34 33 C34 28 44 28 44 33 Z" className={styles.fillCarrot} />
            <path d="M45 35 C45 30 54 30 54 35 Z" className={styles.fillCarrot} />
            {/* Wooden crate slats */}
            <rect x="12" y="34" width="56" height="36" rx="3" className={styles.fillCanvas} />
            <line x1="12" y1="46" x2="68" y2="46" className={styles.woodLine} />
            <line x1="12" y1="58" x2="68" y2="58" className={styles.woodLine} />
            {/* Slatted wood corner corner posts & grain */}
            <rect x="12" y="34" width="7" height="36" className={styles.fillCanvasMedium} />
            <rect x="61" y="34" width="7" height="36" className={styles.fillCanvasMedium} />
            {/* Handle cutout */}
            <rect x="33" y="39" width="14" height="4" rx="2" className={styles.fillWhite} />
          </>
        );

      // 3. Bunch of beetroots tied with twine
      case 'beet-bunch':
      case 'beet':
        return (
          <>
            {/* Beet stems and crinkled leaves */}
            <path d="M36 36 C32 20 22 16 18 12" className={styles.line} />
            <path d="M40 34 C40 18 40 10 40 6" className={styles.line} />
            <path d="M44 36 C48 20 58 16 62 12" className={styles.line} />
            <ellipse cx="18" cy="12" rx="7" ry="5" className={styles.fillHerb} />
            <ellipse cx="40" cy="7" rx="7" ry="5" className={styles.fillHerb} />
            <ellipse cx="62" cy="12" rx="7" ry="5" className={styles.fillHerb} />
            {/* Leaf ribs */}
            <path d="M22 14 L14 10" className={styles.subtleLine} />
            <path d="M40 11 L40 4" className={styles.subtleLine} />
            <path d="M58 14 L66 10" className={styles.subtleLine} />
            {/* Twine tie wrapping stems */}
            <ellipse cx="40" cy="35" rx="9" ry="2.5" className={styles.woodLine} />
            {/* Left beet bulb */}
            <path d="M22 52 C22 42 34 42 34 52 C34 59 28 66 26 70 C24 66 22 59 22 52 Z" className={styles.fillBeet} />
            {/* Right beet bulb */}
            <path d="M46 52 C46 42 58 42 58 52 C58 59 52 66 50 70 C48 66 46 59 46 52 Z" className={styles.fillBeet} />
            {/* Center front beet bulb */}
            <path d="M30 48 C30 38 50 38 50 48 C50 58 42 67 40 73 C38 67 30 58 30 48 Z" className={styles.fillBeet} />
            {/* Tap roots */}
            <path d="M26 70 Q24 74 25 76" className={styles.line} />
            <path d="M40 73 Q41 77 39 79" className={styles.line} />
            <path d="M50 70 Q52 74 51 76" className={styles.line} />
          </>
        );

      // 4. Leafy greens bunch (chard or kale) with veined leaves
      case 'leafy-greens':
      case 'leaves':
        return (
          <>
            {/* Ribbed stems */}
            <path d="M40 72 C40 50 38 32 30 18" className={styles.line} />
            <path d="M40 72 C40 48 40 28 40 10" className={styles.line} />
            <path d="M40 72 C40 50 42 32 50 18" className={styles.line} />
            {/* Broad crinkled chard/kale leaves */}
            <path d="M30 18 C18 14 14 26 22 36 C14 44 22 54 34 52 Z" className={styles.fillHerb} />
            <path d="M50 18 C62 14 66 26 58 36 C66 44 58 54 46 52 Z" className={styles.fillHerb} />
            <path d="M40 10 C32 6 34 2 40 2 C46 2 48 6 40 10 Z" className={styles.fillHerb} />
            {/* Secondary leaf veins */}
            <line x1="26" y1="28" x2="19" y2="24" className={styles.subtleLine} />
            <line x1="28" y1="38" x2="20" y2="38" className={styles.subtleLine} />
            <line x1="54" y1="28" x2="61" y2="24" className={styles.subtleLine} />
            <line x1="52" y1="38" x2="60" y2="38" className={styles.subtleLine} />
            {/* Twine ribbon tie */}
            <rect x="35" y="60" width="10" height="4" rx="2" className={styles.fillCanvasMedium} />
            <path d="M36 64 Q32 68 30 70" className={styles.woodLine} />
            <path d="M44 64 Q48 68 50 70" className={styles.woodLine} />
          </>
        );

      // 5. Sourdough loaf on a wooden cutting board with flour scoring slashes
      case 'sourdough-boule':
      case 'loaf':
        return (
          <>
            {/* Wooden board beneath */}
            <rect x="10" y="56" width="60" height="16" rx="4" className={styles.fillCanvasMedium} />
            <path d="M66 64 L74 64" className={styles.line} />
            <circle cx="71" cy="64" r="1.5" className={styles.fillWhite} />
            {/* Crusty sourdough boule */}
            <path d="M16 56 C16 32 26 22 40 22 C54 22 64 32 64 56 Z" className={styles.fillCanvas} />
            {/* Artisanal leaf-slash scoring marks */}
            <path d="M26 40 C34 32 46 32 54 40" className={styles.scoreLine} />
            <path d="M28 48 C36 40 44 40 52 48" className={styles.scoreLine} />
            <path d="M38 32 L42 26" className={styles.subtleLine} />
            <path d="M32 38 L28 34" className={styles.subtleLine} />
            <path d="M48 38 L52 34" className={styles.subtleLine} />
          </>
        );

      // 6. Honey jar with a wooden dipper and small label
      case 'honey-jar':
      case 'honey':
        return (
          <>
            {/* Dipper handle tilted behind */}
            <line x1="58" y1="12" x2="44" y2="32" className={styles.line} />
            <circle cx="56" cy="15" r="3" className={styles.fillCanvasMedium} />
            <circle cx="53" cy="19" r="3" className={styles.fillCanvasMedium} />
            <circle cx="50" cy="23" r="3" className={styles.fillCanvasMedium} />
            {/* Honey jar body */}
            <rect x="22" y="32" width="36" height="38" rx="6" className={styles.fillCarrot} />
            {/* Cloth wrapped lid with folded scalloped rim */}
            <path d="M20 25 L60 25 L58 33 L22 33 Z" className={styles.fillCanvas} />
            <path d="M18 33 Q25 37 32 33 Q40 37 48 33 Q55 37 62 33" className={styles.line} />
            {/* Twine cord bow */}
            <line x1="21" y1="33" x2="59" y2="33" className={styles.woodLine} />
            <circle cx="40" cy="33" r="2.5" className={styles.fillCanvasMedium} />
            {/* Paper label with comb silhouette */}
            <rect x="28" y="43" width="24" height="18" rx="2" className={styles.fillWhite} />
            <polygon points="40,47 45,50 45,56 40,59 35,56 35,50" className={styles.fillHerb} />
          </>
        );

      // 7. Egg carton with 6 eggs, lid open
      case 'egg-carton':
        return (
          <>
            {/* Open carton top lid tilted back */}
            <path d="M16 28 L64 28 L60 14 L20 14 Z" className={styles.fillCanvas} />
            <line x1="20" y1="21" x2="60" y2="21" className={styles.woodLine} />
            {/* Carton bottom tray */}
            <rect x="14" y="44" width="52" height="26" rx="4" className={styles.fillCanvasMedium} />
            <path d="M14 54 L66 54" className={styles.subtleLine} />
            {/* Six nestled brown & white eggs */}
            <ellipse cx="24" cy="42" rx="5" ry="7" className={styles.fillWhite} />
            <ellipse cx="40" cy="41" rx="5" ry="7" className={styles.fillCarrot} />
            <ellipse cx="56" cy="42" rx="5" ry="7" className={styles.fillWhite} />
            <ellipse cx="24" cy="48" rx="4.5" ry="6" className={styles.fillCarrot} />
            <ellipse cx="40" cy="47" rx="4.5" ry="6" className={styles.fillWhite} />
            <ellipse cx="56" cy="48" rx="4.5" ry="6" className={styles.fillCarrot} />
          </>
        );

      // 8. Brown paper bag of pears/apples, folded top rim
      case 'paper-bag-pears':
        return (
          <>
            {/* Two fruit peeking out with stem */}
            <circle cx="34" cy="30" r="8" className={styles.fillHerb} />
            <circle cx="47" cy="28" r="8.5" className={styles.fillCarrot} />
            <path d="M47 19 Q49 14 52 14" className={styles.line} />
            <ellipse cx="53" cy="15" rx="3" ry="1.5" className={styles.fillHerb} />
            {/* Paper bag body with fold-down cuff */}
            <path d="M20 34 L60 34 L56 72 C56 74 53 75 50 75 L30 75 C27 75 24 74 24 72 L20 34 Z" className={styles.fillCanvas} />
            {/* Bag folded collar */}
            <rect x="18" y="34" width="44" height="9" rx="2" className={styles.fillCanvasMedium} />
            {/* Crease lines */}
            <line x1="28" y1="43" x2="29" y2="74" className={styles.woodLine} />
            <line x1="52" y1="43" x2="51" y2="74" className={styles.woodLine} />
          </>
        );

      // 9. Radish bunch with crisp roots
      case 'radish-bunch':
        return (
          <>
            {/* Feathery leaves */}
            <path d="M40 38 C36 22 26 16 20 12" className={styles.line} />
            <path d="M40 38 C40 18 42 10 40 6" className={styles.line} />
            <path d="M40 38 C44 22 54 16 60 12" className={styles.line} />
            <ellipse cx="20" cy="12" rx="6" ry="4" className={styles.fillHerb} />
            <ellipse cx="40" cy="6" rx="6" ry="4" className={styles.fillHerb} />
            <ellipse cx="60" cy="12" rx="6" ry="4" className={styles.fillHerb} />
            {/* Radish bulbs */}
            <circle cx="30" cy="50" r="7" className={styles.fillBeet} />
            <circle cx="50" cy="50" r="7" className={styles.fillBeet} />
            <circle cx="40" cy="55" r="7.5" className={styles.fillBeet} />
            {/* White tips & delicate taproots */}
            <path d="M30 55 C30 57 32 58 30 62" className={styles.line} />
            <path d="M40 61 C40 63 39 65 40 70" className={styles.line} />
            <path d="M50 55 C50 57 48 58 50 62" className={styles.line} />
          </>
        );

      // 10. Empty crate with "Sold out" paper tag
      case 'empty-crate-soldout':
        return (
          <>
            {/* Wooden slatted crate back & sides */}
            <rect x="12" y="30" width="56" height="42" rx="4" className={styles.fillCanvas} />
            <line x1="12" y1="44" x2="68" y2="44" className={styles.woodLine} />
            <line x1="12" y1="58" x2="68" y2="58" className={styles.woodLine} />
            {/* Corner uprights */}
            <rect x="12" y="30" width="7" height="42" className={styles.fillCanvasMedium} />
            <rect x="61" y="30" width="7" height="42" className={styles.fillCanvasMedium} />
            {/* Handle cutout */}
            <rect x="33" y="35" width="14" height="4" rx="2" className={styles.fillWhite} />
            {/* Twine from slat to tag */}
            <path d="M46 44 Q50 38 52 32" className={styles.tagTwine} />
            {/* Hanging paper tag "Sold out" */}
            <g transform="rotate(8 52 30)">
              <rect x="38" y="24" width="28" height="16" rx="2" className={styles.tagFill} />
              <circle cx="41" cy="32" r="1.5" className={styles.line} />
              <text x="53" y="33" className={styles.tagText}>Sold out</text>
            </g>
          </>
        );

      // 11. Market stall with "Closed" sign
      case 'closed-stall':
        return (
          <>
            {/* Upright posts */}
            <line x1="16" y1="28" x2="16" y2="72" className={styles.line} />
            <line x1="64" y1="28" x2="64" y2="72" className={styles.line} />
            {/* Rolled awning */}
            <rect x="12" y="16" width="56" height="14" rx="3" className={styles.fillCanvas} />
            <path d="M12 30 Q19 34 26 30 Q33 34 40 30 Q47 34 54 30 Q61 34 68 30" className={styles.scallopLine} />
            {/* Counter table */}
            <rect x="12" y="50" width="56" height="22" rx="4" className={styles.fillWhite} />
            <line x1="12" y1="56" x2="68" y2="56" className={styles.line} />
            {/* Closed sign hanging on twine */}
            <path d="M30 46 L38 54" className={styles.tagTwine} />
            <path d="M50 46 L42 54" className={styles.tagTwine} />
            <rect x="26" y="54" width="28" height="14" rx="2" className={styles.tagFill} />
            <circle cx="40" cy="56" r="1" className={styles.line} />
            <text x="40" y="62" className={styles.tagText}>Closed</text>
          </>
        );

      // 12. Basket by a wooden barn / stall door
      case 'basket-door':
        return (
          <>
            {/* Wooden door background frame */}
            <rect x="26" y="10" width="46" height="64" rx="2" className={styles.fillCanvas} />
            <line x1="48" y1="10" x2="48" y2="74" className={styles.woodLine} />
            <line x1="26" y1="42" x2="72" y2="42" className={styles.woodLine} />
            {/* Door iron latch */}
            <rect x="29" y="38" width="8" height="3" rx="1" className={styles.line} />
            {/* Market basket sitting in foreground */}
            <path d="M10 46 C10 32 30 32 30 46" className={styles.line} />
            <circle cx="16" cy="44" r="5" className={styles.fillHerb} />
            <circle cx="24" cy="43" r="5.5" className={styles.fillCarrot} />
            <path d="M8 48 L32 48 L28 72 C28 73 24 74 20 74 C16 74 12 73 12 72 Z" className={styles.fillCanvasMedium} />
            <line x1="9" y1="56" x2="31" y2="56" className={styles.woodLine} />
            <line x1="11" y1="64" x2="29" y2="64" className={styles.woodLine} />
          </>
        );

      // Basic stall (for backward compatibility)
      case 'stall':
        return (
          <>
            <line x1="16" y1="36" x2="16" y2="72" className={styles.line} />
            <line x1="64" y1="36" x2="64" y2="72" className={styles.line} />
            <path d="M12 18 L68 18 L64 36 L16 36 Z" className={styles.fillCanvas} />
            <path d="M22 18 L28 18 L27 36 L21 36 Z" className={styles.fillBeet} />
            <path d="M34 18 L40 18 L39 36 L33 36 Z" className={styles.fillBeet} />
            <path d="M46 18 L52 18 L51 36 L45 36 Z" className={styles.fillBeet} />
            <path d="M58 18 L64 18 L63 36 L57 36 Z" className={styles.fillBeet} />
            <path d="M12 36 Q18 42 24 36 Q30 42 36 36 Q42 42 48 36 Q54 42 60 36 Q66 42 68 36" className={styles.scallopLine} />
            <rect x="12" y="52" width="56" height="20" rx="4" className={styles.fillWhite} />
            <line x1="12" y1="58" x2="68" y2="58" className={styles.line} />
            <circle cx="26" cy="48" r="4" className={styles.fillCarrot} />
            <circle cx="34" cy="47" r="5" className={styles.fillHerb} />
            <circle cx="43" cy="48" r="4" className={styles.fillBeet} />
            <rect x="49" y="44" width="14" height="8" rx="2" className={styles.fillCanvas} />
          </>
        );

      // Basic crate (for backward compatibility)
      case 'crate':
        return (
          <>
            <circle cx="28" cy="30" r="8" className={styles.fillHerb} />
            <circle cx="40" cy="28" r="9" className={styles.fillBeet} />
            <circle cx="52" cy="32" r="7" className={styles.fillCarrot} />
            <path d="M52 25 Q54 18 58 16" className={styles.line} />
            <path d="M52 25 Q48 17 46 16" className={styles.line} />
            <rect x="14" y="34" width="52" height="34" rx="4" className={styles.fillCanvas} />
            <line x1="14" y1="45" x2="66" y2="45" className={styles.line} />
            <line x1="14" y1="56" x2="66" y2="56" className={styles.line} />
            <rect x="14" y="34" width="6" height="34" className={styles.fillWhite} />
            <rect x="60" y="34" width="6" height="34" className={styles.fillWhite} />
            <rect x="34" y="38" width="12" height="4" rx="2" className={styles.fillWhite} />
          </>
        );

      // Basic carrot (for backward compatibility)
      case 'carrot':
        return (
          <>
            <path d="M40 26 Q35 14 26 12" className={styles.line} />
            <path d="M40 26 Q40 12 40 8" className={styles.line} />
            <path d="M40 26 Q46 14 54 12" className={styles.line} />
            <path d="M30 28 C30 25 50 25 50 28 C50 38 43 64 40 72 C37 64 30 38 30 28 Z" className={styles.fillCarrot} />
            <line x1="34" y1="36" x2="42" y2="36" className={styles.line} />
            <line x1="36" y1="46" x2="45" y2="46" className={styles.line} />
            <line x1="38" y1="56" x2="43" y2="56" className={styles.line} />
          </>
        );

      // Basic tomato (for backward compatibility)
      case 'tomato':
        return (
          <>
            <path d="M26 34 C16 42 16 62 32 66 C38 68 42 68 48 66 C64 62 64 42 54 34 C48 30 32 30 26 34 Z" className={styles.fillCarrot} />
            <path d="M33 34 C30 45 30 55 35 66" className={styles.subtleLine} />
            <path d="M47 34 C50 45 50 55 45 66" className={styles.subtleLine} />
            <path d="M40 32 L36 25 L40 28 L44 24 L42 30 L48 31 L42 34 L40 32 Z" className={styles.fillHerb} />
            <path d="M40 28 Q43 20 40 18" className={styles.line} />
          </>
        );

      // Default basket
      case 'basket':
      default:
        return (
          <>
            <path d="M26 44 C26 22 54 22 54 44" className={styles.line} />
            <circle cx="34" cy="38" r="7" className={styles.fillHerb} />
            <circle cx="46" cy="36" r="8" className={styles.fillCarrot} />
            <path d="M48 28 Q52 24 55 24" className={styles.line} />
            <path d="M18 42 L62 42 L56 68 C56 70 52 72 40 72 C28 72 24 70 24 68 L18 42 Z" className={styles.fillCanvas} />
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
