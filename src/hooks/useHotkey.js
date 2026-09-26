import { useEffect } from 'react';

/**
 * Global keyboard shortcut hook.
 * Ignores presses while the user is typing in a field (input, textarea, select, contentEditable).
 *
 * @param {string} combo 'mod+k' or '/' — 'mod' is Cmd on macOS, Ctrl elsewhere
 * @param {Function} handler Callback when shortcut is activated
 * @param {boolean} [enabled=true]
 */
export function useHotkey(combo, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      // 1. Guard against typing inside input, textarea, select, or contentEditable elements
      const target = event.target;
      if (target) {
        const tagName = target.tagName ? target.tagName.toUpperCase() : '';
        const isEditable =
          target.isContentEditable ||
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT';

        if (isEditable) {
          return;
        }
      }

      // 2. Parse combo
      const normalizedCombo = combo.toLowerCase().trim();
      const isModK = normalizedCombo === 'mod+k' || normalizedCombo === 'cmd+k' || normalizedCombo === 'ctrl+k';
      const isSlash = normalizedCombo === '/';

      if (isModK) {
        const isMod = event.metaKey || event.ctrlKey;
        if (isMod && event.key && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          handler(event);
        }
      } else if (isSlash) {
        if (!event.metaKey && !event.ctrlKey && !event.altKey && event.key === '/') {
          event.preventDefault();
          handler(event);
        }
      } else if (normalizedCombo === 'escape' || normalizedCombo === 'esc') {
        if (event.key === 'Escape') {
          event.preventDefault();
          handler(event);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [combo, handler, enabled]);
}

export default useHotkey;
