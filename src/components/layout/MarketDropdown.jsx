import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Store, ChevronDown, Check, MapPin, ArrowRight, Search, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getMarkets } from '@/api/catalog';
import { useQuery } from '@/hooks/useQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatMarketSchedule } from '@/utils/format';
import styles from './MarketDropdown.module.css';

/**
 * Navbar Market Selector Dropdown
 * Allows Customers and Guests to easily switch active market with zero redirect to login.
 * Includes a throttled search bar for fast filtering without redundant network requests,
 * and reactively updates active state without reloading the browser page.
 */
export function MarketDropdown({ variant = 'buyer', align = 'auto', className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [switchingMarketId, setSwitchingMarketId] = useState(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const { user, selectedMarketId, switchMarket, isAuthenticated } = useAuth();

  const isRight = align === 'right' || (align === 'auto' && variant === 'guest');

  // Throttled / debounced search value (250ms) to avoid jumpiness or spamming
  const debouncedSearch = useDebouncedValue(searchQuery, 250);

  const { data: marketsData, loading: marketsLoading } = useQuery(['markets'], ({ signal }) =>
    getMarkets({}, signal)
  );
  const markets = marketsData?.data || [];

  const currentMarket =
    user?.homeMarket ||
    (selectedMarketId ? markets.find((m) => m.id === selectedMarketId) : null) ||
    markets[0] || { name: 'Farmers Market', address: '' };

  // Filter markets using debounced search query (client-side for zero extra network requests)
  const filteredMarkets = useMemo(() => {
    if (!debouncedSearch.trim()) return markets;
    const q = debouncedSearch.trim().toLowerCase();
    return markets.filter((m) => {
      const name = m.name?.toLowerCase() || '';
      const addr = m.address?.toLowerCase() || '';
      const days = Array.isArray(m.days)
        ? m.days.join(' ').toLowerCase()
        : (m.day?.toLowerCase() || '');
      return name.includes(q) || addr.includes(q) || days.includes(q);
    });
  }, [markets, debouncedSearch]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectMarket = async (marketId) => {
    if (marketId === currentMarket?.id || marketId === selectedMarketId) {
      setIsOpen(false);
      return;
    }

    setSwitchingMarketId(marketId);
    try {
      await switchMarket(marketId);
    } finally {
      setSwitchingMarketId(null);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const allMarketsLink = isAuthenticated ? '/buyer/markets' : '/markets';

  return (
    <div ref={dropdownRef} className={`${styles.dropdownWrapper} ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`${styles.triggerBtn} ${isOpen ? styles.triggerBtnOpen : ''} ${styles[variant] || ''}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Market: ${currentMarket.name}. Click to change market.`}
      >
        <div className={styles.iconBox} aria-hidden="true">
          <Store size={16} />
        </div>
        <div className={styles.textWrap}>
          <span className={styles.subLabel}>Picking up from</span>
          <span className={styles.marketName}>
            {currentMarket.name}
            <ChevronDown
              size={13}
              className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
              aria-hidden="true"
            />
          </span>
        </div>
      </button>

      {isOpen && (
        <div
          className={`${styles.dropdownMenu} ${isRight ? styles.dropdownMenuRight : ''}`}
          role="listbox"
          aria-label="Select a farmers market"
        >
          {/* Menu Header */}
          <div className={styles.menuHeader}>
            <div className={styles.headerTitleRow}>
              <span className={styles.menuHeaderTitle}>Choose Your Market</span>
              <span className={styles.marketCountTag}>
                {filteredMarkets.length} of {markets.length}
              </span>
            </div>
            <span className={styles.menuHeaderSub}>Pre-order pickup location</span>
          </div>

          {/* Throttled Search Bar */}
          <div className={styles.searchBarContainer}>
            <div className={styles.searchInner}>
              <Search size={14} className={styles.searchIcon} aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder="Search markets or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search markets by name or location"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={styles.clearSearchBtn}
                  aria-label="Clear market search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Markets List */}
          <div className={styles.marketList}>
            {marketsLoading && (
              <div className={styles.listLoadingState}>
                <Loader2 size={18} className={styles.spin} />
                <span>Loading markets...</span>
              </div>
            )}

            {!marketsLoading && filteredMarkets.length > 0 && (
              filteredMarkets.map((m) => {
                const isSelected = m.id === selectedMarketId || m.id === currentMarket.id;
                const isSwitching = switchingMarketId === m.id;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMarket(m.id)}
                    className={`${styles.marketOption} ${isSelected ? styles.marketOptionSelected : ''}`}
                    role="option"
                    aria-selected={isSelected}
                    disabled={isSwitching}
                  >
                    <div className={styles.optionContent}>
                      <div className={styles.optionTitleRow}>
                        <span className={styles.optionName}>{m.name}</span>
                        {isSwitching && (
                          <Loader2 size={13} className={styles.spin} aria-hidden="true" />
                        )}
                        {!isSwitching && isSelected && (
                          <span className={styles.selectedBadge}>
                            <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                      <span className={styles.optionSchedule}>
                        {formatMarketSchedule(m)}
                      </span>
                      {m.address && (
                        <span className={styles.optionAddress}>
                          <MapPin size={11} className={styles.pinIcon} aria-hidden="true" />
                          <span>{m.address}</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}

            {!marketsLoading && filteredMarkets.length === 0 && (
              <div className={styles.emptyResults}>
                <Store size={22} className={styles.emptyIcon} aria-hidden="true" />
                <span className={styles.emptyTitle}>No matching markets</span>
                <span className={styles.emptySub}>
                  No markets found for &ldquo;{debouncedSearch}&rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={styles.resetSearchBtn}
                >
                  View all markets
                </button>
              </div>
            )}
          </div>

          {/* Menu Footer */}
          <div className={styles.menuFooter}>
            <Link
              to={allMarketsLink}
              onClick={() => setIsOpen(false)}
              className={styles.viewAllLink}
            >
              <span>Explore all markets on map</span>
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketDropdown;
