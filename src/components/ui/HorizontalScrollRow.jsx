import React, { useRef } from 'react';
import styles from './HorizontalScrollRow.module.css';

/**
 * HorizontalScrollRow
 * Fluid horizontal sideways scrolling for tabs and filter chips:
 * - Seamless mouse wheel horizontal translation
 * - Desktop click-and-drag scrolling
 * - Touch & momentum scrolling on mobile devices
 * - Hidden scrollbar and no arrow buttons for a clean, sleek appearance
 */
export function HorizontalScrollRow({
  children,
  className = '',
  contentClassName = '',
  role,
  ariaLabel,
}) {
  const scrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, scrollLeft: 0 });
  const hasDraggedRef = useRef(false);

  const handleWheel = (e) => {
    // Intercept vertical wheel if dominant to scroll horizontally
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      const el = scrollRef.current;
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll > 0) {
        el.scrollLeft += e.deltaY;
      }
    }
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startPosRef.current = {
      x: e.pageX,
      scrollLeft: el.scrollLeft,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    const dx = e.pageX - startPosRef.current.x;
    if (Math.abs(dx) > 4) {
      hasDraggedRef.current = true;
    }
    scrollRef.current.scrollLeft = startPosRef.current.scrollLeft - dx;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleClickCapture = (e) => {
    // If dragged more than 4px, prevent accidental chip button activation
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      hasDraggedRef.current = false;
    }
  };

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div
        ref={scrollRef}
        className={`${styles.scrollArea} ${contentClassName}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClickCapture={handleClickCapture}
        role={role}
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </div>
  );
}

export default HorizontalScrollRow;
