import { useEffect } from 'react';

/**
 * Sets the document title and restores or resets on unmount if specified
 * @param {string} title - Page title to set
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) {
      document.title = title;
    }
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

export default useDocumentTitle;
