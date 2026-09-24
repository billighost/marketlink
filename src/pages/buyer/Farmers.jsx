import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { farmers, categories } from '@/data/placeholders';
import FarmerCard from '@/components/domain/FarmerCard';
import Chip from '@/components/ui/Chip';
import EmptyState from '@/components/ui/EmptyState';
import styles from './Farmers.module.css';

/**
 * Customer Farmers directory page.
 * Displays all local producers with search and category filters.
 */
export function Farmers() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredFarmers = useMemo(() => {
    return farmers.filter((farmer) => {
      // Search text
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = farmer.stallName.toLowerCase().includes(q);
        const matchesSpecialty = farmer.specialty.toLowerCase().includes(q);
        const matchesStory = farmer.story.toLowerCase().includes(q);
        if (!matchesName && !matchesSpecialty && !matchesStory) return false;
      }

      // Category match
      if (selectedCategory !== 'All') {
        const qCat = selectedCategory.toLowerCase();
        const matchesSpecialty = farmer.specialty.toLowerCase().includes(qCat);
        if (!matchesSpecialty) return false;
      }

      return true;
    });
  }, [search, selectedCategory]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Farmers & Producers</h1>

        {/* Search Bar */}
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search farm stalls, bakers, beekeepers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search farmers and producers"
          />
          {search && (
            <button
              type="button"
              className={styles.clearSearch}
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className={styles.categoryScroll} role="tablist" aria-label="Farmer categories">
          <Chip
            selected={selectedCategory === 'All'}
            onClick={() => setSelectedCategory('All')}
          >
            All
          </Chip>
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              selected={selectedCategory === cat.name}
              onClick={() => setSelectedCategory(cat.name)}
            >
              {cat.name}
            </Chip>
          ))}
        </div>

        <span className={styles.countText}>
          Showing {filteredFarmers.length} {filteredFarmers.length === 1 ? 'farmer' : 'farmers'}
        </span>
      </header>

      {/* Farmers List */}
      {filteredFarmers.length > 0 ? (
        <div className={styles.list}>
          {filteredFarmers.map((farmer) => (
            <FarmerCard key={farmer.id} farmer={farmer} variant="list" />
          ))}
        </div>
      ) : (
        <EmptyState
          illustration="closed-stall"
          title="No farmers match your search"
          text="Try searching for a different stall name or clear your category filter."
          actionLabel="View all farmers"
          onAction={() => {
            setSearch('');
            setSelectedCategory('All');
          }}
        />
      )}
    </div>
  );
}

export default Farmers;
