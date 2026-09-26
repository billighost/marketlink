import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingBasket, Receipt, Bookmark, MessageSquare, ArrowRight, History, Store, Leaf } from 'lucide-react';
import { getSearchSuggestions, getSearchHistory, recordSearchHistory, getMarkets } from '@/api/catalog';
import { useHotkey } from '@/hooks/useHotkey';
import styles from './CommandPalette.module.css';

const GO_TO_ITEMS = [
  { id: 'goto-basket', title: 'Basket', path: '/buyer/basket', secondary: 'Review items & checkout', icon: ShoppingBasket },
  { id: 'goto-orders', title: 'Orders', path: '/buyer/orders', secondary: 'View order history', icon: Receipt },
  { id: 'goto-saved', title: 'Saved', path: '/buyer/saved', secondary: 'Produce, stalls & markets', icon: Bookmark },
  { id: 'goto-assistant', title: 'Ask MarketLink', path: '/buyer/assistant', secondary: 'AI market companion', icon: MessageSquare },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [historyItems, setHistoryItems] = useState([]);
  const [suggestions, setSuggestions] = useState({ products: [], farmers: [], categories: [] });
  const [allMarkets, setAllMarkets] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef(null);
  const openerRef = useRef(null);
  const dialogRef = useRef(null);
  const navigate = useNavigate();

  // Listen for open-command-palette event from TopBar or other components
  useEffect(() => {
    const handleOpen = () => {
      openerRef.current = document.activeElement;
      setIsOpen(true);
    };

    window.addEventListener('open-command-palette', handleOpen);
    return () => window.removeEventListener('open-command-palette', handleOpen);
  }, []);

  // Hotkey handlers
  useHotkey('mod+k', () => {
    openerRef.current = document.activeElement;
    setIsOpen((prev) => !prev);
  });

  useHotkey('/', () => {
    if (!isOpen) {
      openerRef.current = document.activeElement;
      setIsOpen(true);
    }
  });

  // Load markets for local market search matching
  useEffect(() => {
    let active = true;
    getMarkets()
      .then((res) => {
        if (!active) return;
        setAllMarkets(Array.isArray(res) ? res : res?.data || res?.items || []);
      })
      .catch(() => {
        // ignore
      });
    return () => {
      active = false;
    };
  }, []);

  // When opening, reset query, fetch recent history, set focus
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      getSearchHistory()
        .then((hist) => {
          setHistoryItems(Array.isArray(hist) ? hist : []);
        })
        .catch(() => {
          setHistoryItems([]);
        });

      // Focus input on next frame
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });

      // Trap background elements with aria-hidden
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.setAttribute('aria-hidden', 'true');
      }
    } else {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.removeAttribute('aria-hidden');
      }
      // Return focus to opener
      if (openerRef.current && typeof openerRef.current.focus === 'function') {
        openerRef.current.focus();
      }
    }
  }, [isOpen]);

  // Debounced query fetching
  useEffect(() => {
    const trimmed = query.trim();
    if (!isOpen || trimmed.length < 2) {
      setSuggestions({ products: [], farmers: [], categories: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await getSearchSuggestions(trimmed);
        if (data) {
          setSuggestions({
            products: data.products || [],
            farmers: data.farmers || [],
            categories: data.categories || [],
          });
        }
      } catch {
        setSuggestions({ products: [], farmers: [], categories: [] });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Filter markets matching query
  const matchingMarkets = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 2) return [];
    return allMarkets
      .filter((m) => m.name?.toLowerCase().includes(trimmed) || m.address?.toLowerCase().includes(trimmed))
      .slice(0, 3);
  }, [query, allMarkets]);

  // Grouped items
  const groups = useMemo(() => {
    const trimmed = query.trim();
    const resultGroups = [];

    if (!trimmed) {
      if (historyItems.length > 0) {
        resultGroups.push({
          title: 'Recent Searches',
          items: historyItems.map((item) => ({
            id: `hist-${item.id || item.term}`,
            title: item.term,
            path: `/buyer/products?search=${encodeURIComponent(item.term)}`,
            icon: History,
            term: item.term,
            isSearch: true,
          })),
        });
      }

      resultGroups.push({
        title: 'Go to',
        items: GO_TO_ITEMS,
      });

      return resultGroups;
    }

    if (suggestions.products.length > 0) {
      resultGroups.push({
        title: 'Produce',
        items: suggestions.products.map((p) => ({
          id: `prod-${p.id || p._id}`,
          title: p.name,
          path: `/buyer/products/${p.id || p._id}`,
          secondary: p.priceCents ? `£${(p.priceCents / 100).toFixed(2)}${p.unit ? ` / ${p.unit}` : ''}` : undefined,
          icon: Leaf,
          term: p.name,
        })),
      });
    }

    if (suggestions.farmers.length > 0) {
      resultGroups.push({
        title: 'Stalls',
        items: suggestions.farmers.map((f) => ({
          id: `stall-${f.id || f._id}`,
          title: f.stallName,
          path: `/buyer/stalls/${f.id || f._id}`,
          secondary: f.specialty || 'Stall',
          icon: Store,
          term: f.stallName,
        })),
      });
    }

    if (matchingMarkets.length > 0) {
      resultGroups.push({
        title: 'Markets',
        items: matchingMarkets.map((m) => ({
          id: `market-${m.id || m._id}`,
          title: m.name,
          path: `/buyer/markets/${m.id || m._id}`,
          secondary: m.address || 'Market',
          icon: Store,
          term: m.name,
        })),
      });
    }

    // Always include Go to shortcuts matching query or as navigation
    const matchingGoTo = GO_TO_ITEMS.filter((g) =>
      g.title.toLowerCase().includes(trimmed.toLowerCase())
    );
    if (matchingGoTo.length > 0) {
      resultGroups.push({
        title: 'Go to',
        items: matchingGoTo,
      });
    }

    return resultGroups;
  }, [query, historyItems, suggestions, matchingMarkets]);

  // Flattened items for keyboard indexing
  const flatItems = useMemo(() => {
    return groups.flatMap((g) => g.items);
  }, [groups]);

  // Keep active index within bounds
  useEffect(() => {
    if (activeIndex >= flatItems.length) {
      setActiveIndex(Math.max(0, flatItems.length - 1));
    }
  }, [flatItems.length, activeIndex]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSelectItem = useCallback((item) => {
    if (!item) return;

    if (item.term) {
      recordSearchHistory(item.term).catch(() => {});
    }

    handleClose();
    navigate(item.path);
  }, [navigate, handleClose]);

  // Keyboard navigation within combobox
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flatItems.length > 0) {
        setActiveIndex((prev) => (prev + 1) % flatItems.length);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flatItems.length > 0) {
        setActiveIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems.length > 0 && flatItems[activeIndex]) {
        handleSelectItem(flatItems[activeIndex]);
      } else if (query.trim()) {
        const term = query.trim();
        recordSearchHistory(term).catch(() => {});
        handleClose();
        navigate(`/buyer/products?search=${encodeURIComponent(term)}`);
      }
      return;
    }

    if (e.key === 'Tab') {
      // Focus trap within dialog
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  const activeItem = flatItems[activeIndex];
  const activeId = activeItem ? `palette-opt-${activeItem.id}` : undefined;

  let currentOptionIndex = 0;

  return (
    <div
      className={styles.backdrop}
      onClick={handleClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Search MarketLink"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.searchHeader}>
          <Search size={18} strokeWidth={2} className={styles.searchIcon} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={flatItems.length > 0}
            aria-controls="palette-list"
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck="false"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search produce, stalls, markets..."
            className={styles.input}
          />
        </div>

        <div className={styles.body}>
          {groups.length === 0 ? (
            <div className={styles.emptyResults}>
              {query.trim().length < 2 ? 'Type at least 2 characters to search…' : 'No results found'}
            </div>
          ) : (
            <ul id="palette-list" role="listbox" className={styles.list}>
              {groups.map((group) => (
                <li key={group.title} className={styles.group} role="presentation">
                  <div className={styles.groupHeading} aria-hidden="true">
                    {group.title}
                  </div>
                  <ul role="group" aria-label={group.title} className={styles.list}>
                    {group.items.map((item) => {
                      const itemIdx = currentOptionIndex++;
                      const isSelected = itemIdx === activeIndex;
                      const OptionIcon = item.icon || ArrowRight;

                      return (
                        <li
                          key={item.id}
                          id={`palette-opt-${item.id}`}
                          role="option"
                          aria-selected={isSelected}
                          className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
                          onMouseEnter={() => setActiveIndex(itemIdx)}
                          onClick={() => handleSelectItem(item)}
                        >
                          <div className={styles.optionMain}>
                            <OptionIcon size={16} strokeWidth={1.75} className={styles.optionIcon} aria-hidden="true" />
                            <span className={styles.optionTitle}>{item.title}</span>
                          </div>
                          {item.secondary && (
                            <span className={styles.optionSecondary}>{item.secondary}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className={styles.footer} aria-hidden="true">
          <span className={styles.keyHint}>
            <kbd className={styles.kbd}>↑</kbd>
            <kbd className={styles.kbd}>↓</kbd> move
          </span>
          <span className={styles.keyHint}>
            <kbd className={styles.kbd}>↵</kbd> open
          </span>
          <span className={styles.keyHint}>
            <kbd className={styles.kbd}>esc</kbd> close
          </span>
        </footer>
      </div>
    </div>
  );
}

export default CommandPalette;
