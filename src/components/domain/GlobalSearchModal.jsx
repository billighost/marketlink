import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Store, Leaf, Users, Star, ArrowRight, Clock, MapPin } from 'lucide-react';
import { products, farmers, markets } from '@/data/placeholders';
import { formatPrice } from '@/utils/format';
import Stars from '@/components/ui/Stars';
import styles from './GlobalSearchModal.module.css';

const POPULAR_SEARCHES = [
  'Heirloom tomatoes',
  'Sourdough boule',
  'Raw meadow honey',
  'Riverbend Farm',
  'Oak & Mill Bakery',
  'Elm Street Market',
];

export function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'products' | 'farmers' | 'markets'
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.classList.add('noScroll');
    } else {
      document.body.classList.remove('noScroll');
    }
    return () => document.body.classList.remove('noScroll');
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Unified multi-type search results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    let list = [];

    // 1. Search Products
    if (activeFilter === 'all' || activeFilter === 'products') {
      products.forEach((p) => {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCat = p.category?.toLowerCase().includes(q);
        const matchesDesc = p.description?.toLowerCase().includes(q);
        if (matchesName || matchesCat || matchesDesc) {
          const farmer = farmers.find((f) => f.id === p.farmerId);
          list.push({
            type: 'PRODUCT',
            id: p.id,
            title: p.name,
            subtitle: farmer?.stallName || p.category,
            detail: `${formatPrice(p.price)} / ${p.unit}`,
            tag: p.category,
            path: `/buyer/products/${p.id}`,
            rating: p.rating || 4.9,
          });
        }
      });
    }

    // 2. Search Farmers
    if (activeFilter === 'all' || activeFilter === 'farmers') {
      farmers.forEach((f) => {
        const matchesName = f.stallName.toLowerCase().includes(q);
        const matchesSpec = f.specialty?.toLowerCase().includes(q);
        const matchesStory = f.story?.toLowerCase().includes(q);
        if (matchesName || matchesSpec || matchesStory) {
          list.push({
            type: 'FARMER',
            id: f.id,
            title: f.stallName,
            subtitle: f.specialty,
            detail: f.stallNumber,
            tag: 'Grower & Producer',
            path: `/buyer/farmers/${f.id}`,
            rating: f.rating || 4.9,
          });
        }
      });
    }

    // 3. Search Markets
    if (activeFilter === 'all' || activeFilter === 'markets') {
      markets.forEach((m) => {
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesAddr = m.address.toLowerCase().includes(q);
        if (matchesName || matchesAddr) {
          list.push({
            type: 'MARKET',
            id: m.id,
            title: m.name,
            subtitle: m.address,
            detail: `${m.days?.join(', ')} · ${m.hours}`,
            tag: 'Market Location',
            path: `/buyer/markets/${m.id}`,
            distance: m.distance,
          });
        }
      });
    }

    return list;
  }, [query, activeFilter]);

  if (!isOpen) return null;

  const handleSelectResult = (path) => {
    onClose();
    navigate(path);
  };

  const handleQuickSearch = (term) => {
    setQuery(term);
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Global marketplace search">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div className={styles.searchHeader}>
          <Search size={20} className={styles.searchIcon} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            className={styles.input}
            placeholder="Search produce, bakers, growers, or markets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Global search query"
          />
          {query && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => setQuery('')}
              aria-label="Clear search query"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close search"
          >
            Esc
          </button>
        </div>

        {/* Filter Pills */}
        <div className={styles.filterRow} role="tablist" aria-label="Filter results by type">
          <button
            type="button"
            className={`${styles.filterChip} ${activeFilter === 'all' ? styles.filterChipActive : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Results {query && `(${results.length})`}
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${activeFilter === 'products' ? styles.filterChipActive : ''}`}
            onClick={() => setActiveFilter('products')}
          >
            Products
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${activeFilter === 'farmers' ? styles.filterChipActive : ''}`}
            onClick={() => setActiveFilter('farmers')}
          >
            Farmers
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${activeFilter === 'markets' ? styles.filterChipActive : ''}`}
            onClick={() => setActiveFilter('markets')}
          >
            Markets
          </button>
        </div>

        {/* Results Area */}
        <div className={styles.resultsArea}>
          {query.trim() ? (
            results.length > 0 ? (
              <div className={styles.resultsList}>
                {results.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    className={styles.resultItem}
                    onClick={() => handleSelectResult(item.path)}
                  >
                    <div className={styles.itemIconWrap} data-type={item.type}>
                      {item.type === 'PRODUCT' && <Leaf size={18} />}
                      {item.type === 'FARMER' && <Users size={18} />}
                      {item.type === 'MARKET' && <Store size={18} />}
                    </div>

                    <div className={styles.itemMain}>
                      <div className={styles.itemTopRow}>
                        <span className={styles.itemTitle}>{item.title}</span>
                        <span className={`${styles.typeBadge} ${styles[`typeBadge_${item.type}`]}`}>
                          {item.type}
                        </span>
                      </div>
                      <div className={styles.itemSubRow}>
                        <span className={styles.itemSubtitle}>{item.subtitle}</span>
                        <span className={styles.dot}>·</span>
                        <span className={styles.itemDetail}>{item.detail}</span>
                      </div>
                    </div>

                    <ArrowRight size={16} className={styles.arrowIcon} aria-hidden="true" />
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.noResults}>
                <Search size={32} className={styles.noResultsIcon} />
                <p className={styles.noResultsTitle}>No results for "{query}"</p>
                <p className={styles.noResultsSub}>
                  Try searching for fresh sourdough, heirloom tomatoes, honey, or nearby Saturday markets.
                </p>
              </div>
            )
          ) : (
            <div className={styles.suggestionsBox}>
              <span className={styles.suggestionsTitle}>Popular Searches</span>
              <div className={styles.suggestionChips}>
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    className={styles.suggestionChip}
                    onClick={() => handleQuickSearch(term)}
                  >
                    <Search size={12} className={styles.suggestionIcon} />
                    <span>{term}</span>
                  </button>
                ))}
              </div>

              <div className={styles.hintNotice}>
                <Store size={15} />
                <span>MarketLink Global Search checks all 36 weekly harvests, 12 regional growers, and 4 local markets.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GlobalSearchModal;
