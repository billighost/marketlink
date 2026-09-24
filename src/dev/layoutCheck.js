/**
 * Layout and responsiveness verification utility for MarketLink development.
 * Scans the active screen and returns a readable list of layout/touch issues:
 *  1. Horizontal overflow beyond the viewport
 *  2. Overlapping interactive or fixed/sticky elements
 *  3. Touch targets under 44x44px
 *  4. Clipped or squeezed text
 *  5. Uneven cards inside [data-check-even] containers
 *  6. Distorted media (svg, img, or [data-aspect] containers)
 */

function getSelector(el) {
  if (!el || el === document.body || el === document.documentElement) return el?.tagName?.toLowerCase() || 'unknown';
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const role = el.getAttribute('role') ? `[role="${el.getAttribute('role')}"]` : '';
  const aria = el.getAttribute('aria-label') ? `[aria-label="${el.getAttribute('aria-label').slice(0, 16)}…"]` : '';
  let cls = '';
  if (el.className && typeof el.className === 'string') {
    const mainClass = el.className.split(' ').filter(c => !c.startsWith('_') && c.length > 0)[0];
    if (mainClass) cls = `.${mainClass.split('__')[0] || mainClass}`;
  }
  const parent = el.parentElement ? `${el.parentElement.tagName.toLowerCase()} > ` : '';
  return `${parent}${tag}${id}${cls}${role || aria}`;
}

function isVisuallyHidden(el) {
  if (!el) return false;
  if (el.classList?.contains('visuallyHidden') || el.closest?.('.visuallyHidden')) return true;
  const style = window.getComputedStyle(el);
  if (style.clip === 'rect(0px, 0px, 0px, 0px)' || style.clipPath === 'inset(50%)') return true;
  return false;
}

function isVisible(el) {
  if (!el || !(el instanceof HTMLElement || el instanceof SVGElement)) return false;
  if (isVisuallyHidden(el)) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export function layoutCheck() {
  const issues = [];
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;

  // 1. Horizontal overflow
  if (document.documentElement.scrollWidth > vw + 1) {
    issues.push({
      type: 'OVERFLOW',
      selector: 'document.documentElement',
      message: `Document scrollWidth (${document.documentElement.scrollWidth}px) exceeds clientWidth (${vw}px)`,
    });
  }

  const allElements = document.querySelectorAll('*');
  for (const el of allElements) {
    if (!isVisible(el)) continue;
    // Skip SVG child shapes (path, circle, etc.) as their coordinates belong to SVG viewBox
    if (el.ownerSVGElement) continue;

    // Check if element has an ancestor with horizontal scrolling
    let scrollAncestor = false;
    let curr = el.parentElement;
    while (curr && curr !== document.body && curr !== document.documentElement) {
      const s = window.getComputedStyle(curr);
      if (s.overflowX === 'auto' || s.overflowX === 'scroll') {
        scrollAncestor = true;
        break;
      }
      curr = curr.parentElement;
    }

    if (!scrollAncestor) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      // Skip fixed elements whose position is designed for full width / right 0
      if (style.position !== 'fixed' && rect.right > vw + 1.5) {
        issues.push({
          type: 'OVERFLOW',
          selector: getSelector(el),
          message: `Right edge (${Math.round(rect.right)}px) overflows viewport width (${vw}px)`,
        });
      }
    }
  }

  // 2. Overlapping interactive or fixed/sticky elements
  const interactiveSelector = 'a, button, input, select, textarea, summary, [role="button"], [role="switch"], [role="tab"]';
  const interactiveEls = Array.from(document.querySelectorAll(interactiveSelector)).filter(isVisible);
  const fixedStickyEls = Array.from(document.querySelectorAll('*')).filter(el => {
    if (!isVisible(el)) return false;
    const pos = window.getComputedStyle(el).position;
    return pos === 'fixed' || pos === 'sticky';
  });

  const overlapPool = Array.from(new Set([...interactiveEls, ...fixedStickyEls]));

  for (let i = 0; i < overlapPool.length; i++) {
    for (let j = i + 1; j < overlapPool.length; j++) {
      const el1 = overlapPool[i];
      const el2 = overlapPool[j];

      // Skip if one contains the other
      if (el1.contains(el2) || el2.contains(el1)) continue;

      // Skip elements that explicitly pass pointer events through
      if (window.getComputedStyle(el1).pointerEvents === 'none' || window.getComputedStyle(el2).pointerEvents === 'none') continue;

      const r1 = el1.getBoundingClientRect();
      const r2 = el2.getBoundingClientRect();

      // Intersection calculation
      const xOverlap = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
      const yOverlap = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);

      if (xOverlap > 4 && yOverlap > 4) {
        issues.push({
          type: 'OVERLAP',
          selector: `${getSelector(el1)} <-> ${getSelector(el2)}`,
          message: `Overlap box: ${Math.round(xOverlap)}px x ${Math.round(yOverlap)}px`,
        });
      }
    }
  }

  // 3. Small touch targets (< 44x44px)
  for (const el of interactiveEls) {
    // Ignore inline links inside paragraphs
    if (el.tagName === 'A' && el.closest('p')) {
      const display = window.getComputedStyle(el).display;
      if (display === 'inline' || display === 'inline-block') continue;
    }
    // Ignore hidden inputs
    if (el.tagName === 'INPUT' && (el.getAttribute('type') === 'hidden' || isVisuallyHidden(el))) continue;

    const rect = el.getBoundingClientRect();
    // Allow slight subpixel rounding (43.5px)
    if (rect.width < 43.5 || rect.height < 43.5) {
      issues.push({
        type: 'SMALL-TARGET',
        selector: getSelector(el),
        message: `Target size is ${Math.round(rect.width)}x${Math.round(rect.height)}px (minimum 44x44px)`,
      });
    }
  }

  // 4. Clipped or squeezed text
  for (const el of allElements) {
    if (!isVisible(el)) continue;
    if (el.ownerSVGElement) continue;

    // Only elements with text child nodes
    const hasText = Array.from(el.childNodes).some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);
    if (!hasText) continue;

    const style = window.getComputedStyle(el);
    const hasEllipsis = style.textOverflow === 'ellipsis' || style.webkitLineClamp !== 'none' || style.overflow === 'hidden';

    if (el.scrollWidth > el.clientWidth + 1.5 && !hasEllipsis) {
      issues.push({
        type: 'CLIPPED',
        selector: getSelector(el),
        message: `Text clipped: scrollWidth (${el.scrollWidth}px) > clientWidth (${el.clientWidth}px)`,
      });
    }

    // Text wrapping to 1 character per line: element width under ~3ch with text length above 6
    const text = el.innerText?.trim() || '';
    if (text.length > 6 && el.clientWidth < 26 && !style.writingMode?.includes('vertical')) {
      issues.push({
        type: 'SQUEEZED',
        selector: getSelector(el),
        message: `Squeezed text: width ${Math.round(el.clientWidth)}px with text length ${text.length}`,
      });
    }
  }

  // 5. Uneven cards in a row
  const evenContainers = document.querySelectorAll('[data-check-even]');
  for (const container of evenContainers) {
    const cards = Array.from(container.children).filter(isVisible);
    if (cards.length > 1) {
      const heights = cards.map(c => Math.round(c.getBoundingClientRect().height));
      const minH = Math.min(...heights);
      const maxH = Math.max(...heights);
      if (maxH - minH > 2) {
        issues.push({
          type: 'OUT-OF-SHAPE',
          selector: getSelector(container),
          message: `Uneven card heights in row: range ${minH}px to ${maxH}px (difference ${maxH - minH}px)`,
        });
      }
    }
  }

  // 6. Distorted media
  const mediaElements = document.querySelectorAll('svg, img, [data-aspect]');
  for (const media of mediaElements) {
    if (!isVisible(media)) continue;
    // Skip child shapes inside SVG
    if (media.ownerSVGElement) continue;

    const rect = media.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;

    // Check if SVG deliberately specifies preserveAspectRatio="none" (e.g. WaveDivider)
    if (media.tagName.toLowerCase() === 'svg' && media.getAttribute('preserveAspectRatio')?.includes('none')) {
      continue;
    }

    const declaredAspectAttr = media.getAttribute('data-aspect');
    let targetRatio = null;

    if (declaredAspectAttr) {
      if (declaredAspectAttr.includes('/')) {
        const [w, h] = declaredAspectAttr.split('/').map(Number);
        if (w && h) targetRatio = w / h;
      } else {
        targetRatio = parseFloat(declaredAspectAttr);
      }
    } else if (media.tagName === 'IMG' && media.naturalWidth && media.naturalHeight) {
      targetRatio = media.naturalWidth / media.naturalHeight;
    } else if (media.tagName.toLowerCase() === 'svg' && media.viewBox?.baseVal) {
      const vb = media.viewBox.baseVal;
      if (vb.width > 0 && vb.height > 0) {
        targetRatio = vb.width / vb.height;
      }
    }

    if (targetRatio && targetRatio > 0) {
      const actualRatio = rect.width / rect.height;
      const diffPercent = Math.abs(actualRatio - targetRatio) / targetRatio;
      if (diffPercent > 0.02) {
        issues.push({
          type: 'DISTORTED-MEDIA',
          selector: getSelector(media),
          message: `Aspect ratio mismatch: rendered ${(actualRatio).toFixed(2)}, declared ${(targetRatio).toFixed(2)} (${Math.round(diffPercent * 100)}% diff)`,
        });
      }
    }
  }

  return issues;
}

if (typeof window !== 'undefined') {
  window.layoutCheck = layoutCheck;
}

export default layoutCheck;
