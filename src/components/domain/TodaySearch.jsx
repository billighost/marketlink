import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Leaf,
  Store,
  MapPin,
  Tag,
  History,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import {
  getSearchSuggestions,
  getSearchHistory,
  recordSearchHistory,
  getMarkets,
} from '@/api/catalog';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatPrice } from '@/utils/format';
import styles from './TodaySearch.module.css';

const POPULAR_SEARCHES = [
  { label: 'Apples & Orchard', query: 'apple' },
  { label: 'Sourdough Bread', query: 'sourdough' },
  { label: 'Raw Honey', query: 'honey' },
  { label: 'Farm Fresh Eggs', query: 'egg' },
  { label: 'Wild Mushrooms', query: 'mushroom' },
  { label: 'Organic Veg', query: 'organic' },
];

export function TodaySearch({ placeholder = 'Search produce, stalls, markets' }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery, 180);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [marketsList, setMarketsList] = useState([]);
  const [suggestions, setSuggestions] = useState({ products: [], farmers: [], categories: [] });
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    let active = true;
    getMarkets()
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : res?.data || res?.items || [];
        setMarketsList(list);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const refreshHistory = useCallback(() => {
    getSearchHistory()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setHistoryItems(list);
      })
      .catch(() => {
        setHistoryItems([]);
      });
  }, []);

  const handleFocus = () => {
    setIsOpen(true);
    refreshHistory();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions({ products: [], farmers: [], categories: [] });
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    getSearchSuggestions(trimmed)
      .then((data) => {
        if (!active) return;
        setSuggestions({
          products: Array.isArray(data?.products) ? data.products : [],
          farmers: Array.isArray(data?.farmers) ? data.farmers : [],
          categories: Array.isArray(data?.categories) ? data.categories : [],
        });
      })
      .catch(() => {
        if (!active) return;
        setSuggestions({ products: [], farmers: [], categories: [] });
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  const matchingMarkets = useMemo(() => {
    const trimmed = debouncedQuery.trim().toLowerCase();
    if (trimmed.length < 2 || !marketsList.length) return [];
    return marketsList
      .filter((m) => {
        const name = (m.name || '').toLowerCase();
        const address = (m.address || '').toLowerCase();
        return name.includes(trimmed) || address.includes(trimmed);
      })
      .slice(0, 3);
  }, [debouncedQuery, marketsList]);

  const isQueryMode = debouncedQuery.trim().length >= 2;

  const flatItems = useMemo(() => {
    if (!isQueryMode) {
      return historyItems.slice(0, 5).map((item) => ({
        id: `hist-${item.id || item.term}`,
        title: item.term,
        type: 'history',
        icon: History,
        url: `/buyer/products?search=${encodeURIComponent(item.term)}`,
        term: item.term,
      }));
    }

    const items = [];

    suggestions.products.forEach((p) => {
      const prodId = p.id || p._id;
      items.push({
        id: `prod-${prodId}`,
        title: p.name,
        type: 'produce',
        secondary: p.priceCents
          ? `${formatPrice(p.priceCents)}${p.unit ? ` / ${p.unit}` : ''}`
          : undefined,
        icon: Leaf,
        url: `/buyer/products/${prodId}`,
        term: p.name,
      });
    });

    suggestions.farmers.forEach((f) => {
      const farmerId = f.id || f._id;
      items.push({
        id: `stall-${farmerId}`,
        title: f.stallName,
        type: 'stall',
        secondary: f.specialty || 'Stall',
        icon: Store,
        url: `/buyer/stalls/${farmerId}`,
        term: f.stallName,
      });
    });

    matchingMarkets.forEach((m) => {
      const marketId = m.id || m._id;
      items.push({
        id: `market-${marketId}`,
        title: m.name,
        type: 'market',
        secondary: m.address || 'Market',
        icon: MapPin,
        url: `/buyer/markets/${marketId}`,
        term: m.name,
      });
    });

    suggestions.categories.forEach((c) => {
      items.push({
        id: `cat-${c.slug || c.name}`,
        title: c.name,
        type: 'category',
        icon: Tag,
        url: `/buyer/products?category=${encodeURIComponent(c.slug || c.name)}`,
        term: c.name,
      });
    });

    const trimmed = searchQuery.trim();
    if (trimmed) {
      items.push({
        id: `see-all-${trimmed}`,
        title: `Search all products for "${trimmed}"`,
        type: 'all',
        icon: ArrowRight,
        url: `/buyer/products?search=${encodeURIComponent(trimmed)}`,
        term: trimmed,
      });
    }

    return items;
  }, [isQueryMode, historyItems, suggestions, matchingMarkets, searchQuery]);

  useEffect(() => {
    if (activeIndex >= flatItems.length) {
      setActiveIndex(Math.max(-1, flatItems.length - 1));
    }
  }, [flatItems.length, activeIndex]);

  const handleSelectItem = useCallback(
    (item) => {
      if (!item) return;
      if (item.term) {
        recordSearchHistory(item.term).catch(() => {});
      }
      setIsOpen(false);
      navigate(item.url);
    },
    [navigate]
  );

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setIsOpen(false);
      navigate('/buyer/products');
      return;
    }

    if (activeIndex >= 0 && flatItems[activeIndex]) {
      handleSelectItem(flatItems[activeIndex]);
      return;
    }

    const matchedStall = suggestions.farmers.find(
      (f) => f.stallName.toLowerCase() === trimmed.toLowerCase()
    );
    if (matchedStall) {
      recordSearchHistory(trimmed).catch(() => {});
      setIsOpen(false);
      navigate(`/buyer/stalls/${matchedStall.id || matchedStall._id}`);
      return;
    }

    const matchedMarket = marketsList.find(
      (m) => m.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (matchedMarket) {
      recordSearchHistory(trimmed).catch(() => {});
      setIsOpen(false);
      navigate(`/buyer/markets/${matchedMarket.id || matchedMarket._id}`);
      return;
    }

    recordSearchHistory(trimmed).catch(() => {});
    setIsOpen(false);
    navigate(`/buyer/products?search=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handlePickPopular = (query) => {
    setSearchQuery(query);
    recordSearchHistory(query).catch(() => {});
    setIsOpen(false);
    navigate(`/buyer/products?search=${encodeURIComponent(query)}`);
  };

  const hasResults =
    suggestions.products.length > 0 ||
    suggestions.farmers.length > 0 ||
    matchingMarkets.length > 0 ||
    suggestions.categories.length > 0;

  return (
    <div className={styles.searchContainer} ref={containerRef}>
      
      <form
        className={`${styles.searchForm} ${isOpen ? styles.searchFormActive : ''}`}
        onSubmit={handleSubmit}
        role="search"
      >
        <Search size={18} className={styles.searchIcon} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          className={styles.searchInput}
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setActiveIndex(-1);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          aria-label={placeholder}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
          autoComplete="off"
        />

        <div className={styles.rightControls}>
          {isLoading && (
            <Loader2 size={16} className={styles.spinner} aria-hidden="true" />
          )}

          {searchQuery && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </form>

      {isOpen && (
        <div className={styles.searchDropdown} role="listbox">
          
          {!isQueryMode && (
            <div className={styles.dropdownBody}>
              {historyItems.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <History size={13} className={styles.headerIcon} />
                    <span>Recent Searches</span>
                  </div>
                  <div className={styles.itemsList}>
                    {historyItems.slice(0, 5).map((item, idx) => {
                      const isSelected = activeIndex === idx;
                      return (
                        <button
                          key={item.id || item.term}
                          type="button"
                          className={`${styles.dropdownItem} ${isSelected ? styles.itemSelected : ''}`}
                          onClick={() => {
                            setSearchQuery(item.term);
                            handleSelectItem({
                              url: `/buyer/products?search=${encodeURIComponent(item.term)}`,
                              term: item.term,
                            });
                          }}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <div className={styles.itemMain}>
                            <div className={`${styles.itemIconWrap} ${styles.historyIconWrap}`}>
                              <History size={14} />
                            </div>
                            <span className={styles.itemTitle}>{item.term}</span>
                          </div>
                          <ArrowRight size={13} className={styles.itemArrow} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Sparkles size={13} className={styles.headerIcon} />
                  <span>Popular at the Market</span>
                </div>
                <div className={styles.popularChips}>
                  {POPULAR_SEARCHES.map((chip) => (
                    <button
                      key={chip.query}
                      type="button"
                      className={styles.popularChip}
                      onClick={() => handlePickPopular(chip.query)}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isQueryMode && (
            <div className={styles.dropdownBody}>
              
              {suggestions.products.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <Leaf size={13} className={styles.headerIcon} />
                    <span>Produce</span>
                  </div>
                  <div className={styles.itemsList}>
                    {suggestions.products.map((p) => {
                      const prodId = p.id || p._id;
                      const itemIndex = flatItems.findIndex((it) => it.id === `prod-${prodId}`);
                      const isSelected = activeIndex === itemIndex;
                      return (
                        <button
                          key={prodId}
                          type="button"
                          className={`${styles.dropdownItem} ${isSelected ? styles.itemSelected : ''}`}
                          onClick={() =>
                            handleSelectItem({
                              url: `/buyer/products/${prodId}`,
                              term: p.name,
                            })
                          }
                          role="option"
                          aria-selected={isSelected}
                        >
                          <div className={styles.itemMain}>
                            <div className={`${styles.itemIconWrap} ${styles.produceIconWrap}`}>
                              <Leaf size={14} />
                            </div>
                            <span className={styles.itemTitle}>{p.name}</span>
                          </div>
                          {p.priceCents ? (
                            <span className={styles.priceBadge}>
                              {formatPrice(p.priceCents)}
                              {p.unit ? <span className={styles.unitText}> / {p.unit}</span> : ''}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {suggestions.farmers.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <Store size={13} className={styles.headerIcon} />
                    <span>Stalls</span>
                  </div>
                  <div className={styles.itemsList}>
                    {suggestions.farmers.map((f) => {
                      const farmerId = f.id || f._id;
                      const itemIndex = flatItems.findIndex((it) => it.id === `stall-${farmerId}`);
                      const isSelected = activeIndex === itemIndex;
                      return (
                        <button
                          key={farmerId}
                          type="button"
                          className={`${styles.dropdownItem} ${isSelected ? styles.itemSelected : ''}`}
                          onClick={() =>
                            handleSelectItem({
                              url: `/buyer/stalls/${farmerId}`,
                              term: f.stallName,
                            })
                          }
                          role="option"
                          aria-selected={isSelected}
                        >
                          <div className={styles.itemMain}>
                            <div className={`${styles.itemIconWrap} ${styles.stallIconWrap}`}>
                              <Store size={14} />
                            </div>
                            <span className={styles.itemTitle}>{f.stallName}</span>
                          </div>
                          {f.specialty && (
                            <span className={styles.secondaryBadge}>{f.specialty}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {matchingMarkets.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <MapPin size={13} className={styles.headerIcon} />
                    <span>Markets</span>
                  </div>
                  <div className={styles.itemsList}>
                    {matchingMarkets.map((m) => {
                      const marketId = m.id || m._id;
                      const itemIndex = flatItems.findIndex((it) => it.id === `market-${marketId}`);
                      const isSelected = activeIndex === itemIndex;
                      return (
                        <button
                          key={marketId}
                          type="button"
                          className={`${styles.dropdownItem} ${isSelected ? styles.itemSelected : ''}`}
                          onClick={() =>
                            handleSelectItem({
                              url: `/buyer/markets/${marketId}`,
                              term: m.name,
                            })
                          }
                          role="option"
                          aria-selected={isSelected}
                        >
                          <div className={styles.itemMain}>
                            <div className={`${styles.itemIconWrap} ${styles.marketIconWrap}`}>
                              <MapPin size={14} />
                            </div>
                            <span className={styles.itemTitle}>{m.name}</span>
                          </div>
                          {m.address && (
                            <span className={styles.secondaryBadge}>{m.address}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {suggestions.categories.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <Tag size={13} className={styles.headerIcon} />
                    <span>Categories</span>
                  </div>
                  <div className={styles.itemsList}>
                    {suggestions.categories.map((c) => {
                      const catSlug = c.slug || c.name;
                      const itemIndex = flatItems.findIndex((it) => it.id === `cat-${catSlug}`);
                      const isSelected = activeIndex === itemIndex;
                      return (
                        <button
                          key={catSlug}
                          type="button"
                          className={`${styles.dropdownItem} ${isSelected ? styles.itemSelected : ''}`}
                          onClick={() =>
                            handleSelectItem({
                              url: `/buyer/products?category=${encodeURIComponent(catSlug)}`,
                              term: c.name,
                            })
                          }
                          role="option"
                          aria-selected={isSelected}
                        >
                          <div className={styles.itemMain}>
                            <div className={`${styles.itemIconWrap} ${styles.categoryIconWrap}`}>
                              <Tag size={14} />
                            </div>
                            <span className={styles.itemTitle}>{c.name}</span>
                          </div>
                          <span className={styles.secondaryBadge}>Category</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Loading indicator while fetching */}
              {isLoading && !hasResults && (
                <div className={styles.loadingRow}>
                  <Loader2 size={15} className={styles.spinner} />
                  <span>Searching market harvest…</span>
                </div>
              )}

              {!hasResults && !isLoading && (
                <div className={styles.noResultsBox}>
                  <p className={styles.noResultsText}>
                    No instant matches for <strong>"{searchQuery}"</strong>
                  </p>
                  <p className={styles.noResultsSub}>
                    Hit Enter to search the entire harvest catalog.
                  </p>
                </div>
              )}

              {searchQuery.trim() && (
                <div className={styles.dropdownFooter}>
                  {(() => {
                    const seeAllIndex = flatItems.findIndex((it) => it.type === 'all');
                    const isSelected = activeIndex === seeAllIndex;
                    return (
                      <button
                        type="button"
                        className={`${styles.seeAllBtn} ${isSelected ? styles.itemSelected : ''}`}
                        onClick={handleSubmit}
                      >
                        <div className={styles.seeAllMain}>
                          <Search size={15} className={styles.seeAllIcon} />
                          <span>
                            Search all for <strong>"{searchQuery.trim()}"</strong>
                          </span>
                        </div>
                        <ArrowRight size={15} className={styles.seeAllArrow} />
                      </button>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TodaySearch;
