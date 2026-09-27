import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import AuthCard from '@/components/guest/AuthCard';
import authStyles from '@/components/guest/AuthCard.module.css';
import styles from './NotFound.module.css';

export function NotFound() {
  useDocumentTitle('Page Not Found — MarketLink');
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`${PATHS.PRODUCTS}?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <AuthCard
      title="That page is not on the map."
      lead="The link may be old, or the page may have moved."
      footer={
        <div className={styles.footerLinks}>
          <Link to={PATHS.MARKETS} className={authStyles.link}>
            Browse markets
          </Link>
          <span aria-hidden="true" className={styles.sep}>·</span>
          <Link to={PATHS.PRODUCTS} className={authStyles.link}>
            Browse produce
          </Link>
          <span aria-hidden="true" className={styles.sep}>·</span>
          <Link to={PATHS.FARMERS} className={authStyles.link}>
            Find stalls
          </Link>
        </div>
      }
    >
      <div className={styles.bodyWrap}>
        {/* Search bar */}
        <form onSubmit={handleSearch} role="search" className={styles.searchForm}>
          <div className={authStyles.inputWrap}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search produce or stalls…"
              aria-label="Search produce or stalls"
              className={authStyles.input}
            />
          </div>
          <button type="submit" aria-label="Search" className={styles.searchBtn}>
            <Search size={16} aria-hidden="true" />
          </button>
        </form>

        {/* The ONE beet element on the page */}
        <Link to={PATHS.HOME} className={styles.submitBtn}>
          Back to Elm Street
        </Link>
      </div>
    </AuthCard>
  );
}

export default NotFound;
