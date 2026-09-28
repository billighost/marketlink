import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info, X } from 'lucide-react';
import styles from './ContextHelp.module.css';

/**
 * ContextHelp renders an unobtrusive `?` or `ⓘ` micro-indicator.
 * When clicked or tapped, it expands a clean popover explaining that specific feature.
 * Automatically dismisses on outside click or Escape key.
 */
export function ContextHelp({
  title,
  content,
  icon = 'help', // 'help' | 'info'
  placement = 'bottom', // 'top' | 'bottom' | 'left' | 'right'
  className = '',
  size = 'sm', // 'xs' | 'sm' | 'md'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const IconComp = icon === 'info' ? Info : HelpCircle;
  const iconSize = size === 'xs' ? 13 : size === 'md' ? 17 : 15;

  return (
    <div ref={containerRef} className={`${styles.wrapper} ${className}`}>
      <button
        type="button"
        className={`${styles.triggerBtn} ${styles[size]} ${isOpen ? styles.triggerActive : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={title ? `Help info: ${title}` : 'Help information'}
        aria-expanded={isOpen}
      >
        <IconComp size={iconSize} strokeWidth={2} />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className={`${styles.popoverCard} ${styles[`placement_${placement}`]}`}
        >
          <div className={styles.popoverHeader}>
            {title && <h4 className={styles.popoverTitle}>{title}</h4>}
            <button
              type="button"
              className={styles.popoverCloseBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Dismiss help note"
            >
              <X size={13} strokeWidth={2.2} />
            </button>
          </div>
          <p className={styles.popoverText}>{content}</p>
        </div>
      )}
    </div>
  );
}

export default ContextHelp;
