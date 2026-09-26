<<<<<<< HEAD
﻿import React, { useState, useEffect, useMemo } from 'react';import { Link, useParams, useNavigate } from 'react-router-dom';import {  ArrowLeft,  MapPin,  Calendar,  Store,  ShieldCheck,  Star,  Bookmark,  Share2,  Clock,  ChevronRight,  Sparkles,} from 'lucide-react';import { getFarmerDetail, getFarmerProducts, getFarmerReviews } from '@/api/catalog';import { formatPrice, formatDate } from '@/utils/format';import { PATHS } from '@/routes/paths';import useDocumentTitle from '@/hooks/useDocumentTitle';import MapView from '@/components/domain/MapView';import styles from './FarmerDetail.module.css';export function FarmerDetail() {  const { id } = useParams();  const navigate = useNavigate();  const [farmer, setFarmer] = useState(null);  const [products, setProducts] = useState([]);  const [reviews, setReviews] = useState([]);  const [loading, setLoading] = useState(true);  const [error, setError] = useState(null);  const [activeTab, setActiveTab] = useState('crops');  const [saved, setSaved] = useState(false);  useDocumentTitle(farmer ? `${farmer.stallName || farmer.name} ΓÇö MarketLink` : 'Farmer Stall Details ΓÇö MarketLink');  useEffect(() => {    let active = true;    setLoading(true);    setError(null);    Promise.all([      getFarmerDetail(id).catch((err) => {        throw err;      }),      getFarmerProducts(id).catch(() => []),      getFarmerReviews(id).catch(() => []),    ])      .then(([f, p, r]) => {        if (!active) return;        setFarmer(f);        setProducts(Array.isArray(p) ? p : p?.items || p?.data || []);        setReviews(Array.isArray(r) ? r : r?.items || r?.data || []);      })      .catch((err) => {        if (active) setError(err.message || 'Farmer not found');      })      .finally(() => {        if (active) setLoading(false);      });    return () => {      active = false;    };  }, [id]);  if (loading) {    return (      <div className={styles.page}>        <div className="container" style={{ padding: '60px 20px' }}>          <div style={{ height: 40, width: '40%', background: '#ede8df', borderRadius: 8, marginBottom: 20 }} />          <div style={{ height: 240, background: '#ede8df', borderRadius: 16, marginBottom: 30 }} />          <div style={{ height: 350, background: '#ede8df', borderRadius: 16 }} />        </div>      </div>    );  }  if (error || !farmer) {    return (      <div className={styles.page}>        <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>          <h1 style={{ fontFamily: 'Georgia, serif', color: '#4a1521' }}>Farmer Not Found</h1>          <p style={{ color: '#4a433b', margin: '16px 0 24px' }}>            {error || 'This grower profile could not be loaded or is no longer listed.'}          </p>          <Link            to={PATHS.FARMERS}            style={{              display: 'inline-flex',              padding: '10px 24px',              backgroundColor: '#541722',              color: '#ffffff',              borderRadius: 8,              textDecoration: 'none',              fontWeight: 600,            }}          >            Browse all farmers          </Link>        </div>      </div>    );  }  const farmTitle = farmer.stallName || farmer.name || 'Local Farm';  const growerName = farmer.name || 'Local Producer';  const markets = Array.isArray(farmer.markets) ? farmer.markets : [];  const mapMarkers = [];  if (farmer?.location?.lat && farmer?.location?.lng) {    mapMarkers.push({      id: farmer.id || farmer._id,      lat: farmer.location.lat,      lng: farmer.location.lng,      title: farmTitle,      subtitle: farmer.address || 'Stall location',    });  }  markets.forEach((m) => {    if (m.coordinates?.lat && m.coordinates?.lng) {      mapMarkers.push({        id: m.id || m._id,        lat: m.coordinates.lat,        lng: m.coordinates.lng,        title: m.name,        subtitle: m.address,      });    }  });  return (    <div className={styles.page}>      {}      <div className={styles.breadcrumbBar}>        <div className="container">          <div className={styles.breadcrumbs}>            <Link to={PATHS.FARMERS} className={styles.backBtn}>              <ArrowLeft size={15} />              <span>All Farmers</span>            </Link>            <span className={styles.sep}>ΓÇ║</span>            <span className={styles.crumbCurrent}>{farmTitle}</span>          </div>        </div>      </div>      {}      <div className={styles.heroBannerWrap}>        <img          src={farmer.coverImage || '/images/riverbend-farm.jpg'}          alt={farmTitle}          className={styles.heroCoverImg}        />        <div className={styles.heroCoverOverlay} />        <div className="container" style={{ position: 'relative', height: '100%' }}>          <div className={styles.heroActionsTop}>            <button              type="button"              onClick={() => setSaved(!saved)}              className={`${styles.heroActionBtn} ${saved ? styles.heroActionBtnActive : ''}`}              aria-label="Save farm stall"            >              <Bookmark size={16} fill={saved ? '#6A1B29' : 'none'} />              <span>{saved ? 'Saved' : 'Save Stall'}</span>            </button>            <button              type="button"              className={styles.heroActionBtn}              onClick={() => {                if (navigator?.clipboard) navigator.clipboard.writeText(window.location.href);              }}              aria-label="Share farm"            >              <Share2 size={16} />            </button>          </div>        </div>      </div>      {}      <div className="container">        <div className={styles.profileHeaderCard}>          <div className={styles.profileHeaderInner}>            <div className={styles.profileAvatarWrap}>              <img                src={farmer.avatar || '/images/farmer-elena.jpg'}                alt={growerName}                className={styles.profileAvatarImg}              />            </div>            <div className={styles.profileInfoArea}>              <div className={styles.profileBadgesRow}>                <span className={styles.profileBadge}>                  <ShieldCheck size={12} />                  100% Producer Only                </span>                {farmer.stallNumber && (                  <span className={styles.profileBadge}>Stall {farmer.stallNumber}</span>                )}              </div>              <h1 className={styles.farmTitle}>{farmTitle}</h1>              <p className={styles.farmerSubtitle}>                Cultivated by <strong>{growerName}</strong>              </p>              <div className={styles.profileMetaRow}>                <div className={styles.metaItem}>                  <MapPin size={14} className={styles.metaIcon} />                  <span>{farmer.bio || 'Local Region'}</span>                </div>                <div className={styles.metaItem}>                  <Star size={14} fill="#E07A2C" color="#E07A2C" />                  <strong>4.9</strong>                  <span>(Community Rated)</span>                </div>              </div>            </div>          </div>        </div>      </div>      {}      <div className={styles.tabsNavWrap}>        <div className="container">          <nav className={styles.tabsNav} role="tablist">            <button              type="button"              role="tab"              aria-selected={activeTab === 'crops'}              onClick={() => setActiveTab('crops')}              className={`${styles.tabBtn} ${activeTab === 'crops' ? styles.tabBtnActive : ''}`}            >              Available Harvest ({products.length})            </button>            <button              type="button"              role="tab"              aria-selected={activeTab === 'story'}              onClick={() => setActiveTab('story')}              className={`${styles.tabBtn} ${activeTab === 'story' ? styles.tabBtnActive : ''}`}            >              Story & Practices            </button>            <button              type="button"              role="tab"              aria-selected={activeTab === 'markets'}              onClick={() => setActiveTab('markets')}              className={`${styles.tabBtn} ${activeTab === 'markets' ? styles.tabBtnActive : ''}`}            >              Where to Find ({markets.length})            </button>            <button              type="button"              role="tab"              aria-selected={activeTab === 'reviews'}              onClick={() => setActiveTab('reviews')}              className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.tabBtnActive : ''}`}            >              Reviews ({reviews.length})            </button>          </nav>        </div>      </div>      {}      <div className="container" style={{ paddingBottom: '70px' }}>        {}        {activeTab === 'crops' && (          <section className={styles.tabSection}>            <div className={styles.tabSectionHeader}>              <div>                <h2 className={styles.sectionTitle}>Fresh Harvest & Prepared Goods</h2>                <p className={styles.sectionSubtitle}>                  Harvested at dawn and packed fresh for your Saturday pickup.                </p>              </div>            </div>            <div className={styles.cropsGrid}>              {products.length > 0 ? (                products.map((product) => (                  <div key={product.id || product._id} className={styles.cropCard}>                    <div className={styles.cropCardBody}>                      <span className={styles.cropCategory}>                        {typeof product.category === 'object' ? (product.category?.name || 'Produce') : (product.category || 'Produce')}                      </span>                      <h3 className={styles.cropName}>{product.name}</h3>                      <p className={styles.cropPrice}>                        {formatPrice(product.priceCents || product.price)} <span>/ {product.unit}</span>                      </p>                      <Link to={`/products/${product.id || product._id}`} className={styles.reserveBtn}>                        View Details                      </Link>                    </div>                  </div>                ))              ) : (                <p style={{ color: '#6e655c', padding: '24px 0' }}>                  No items listed by this grower at this time.                </p>              )}            </div>          </section>        )}        {}        {activeTab === 'story' && (          <section className={styles.tabSection}>            <article className={styles.storyCard}>              <h2 className={styles.sectionTitle}>About {farmTitle}</h2>              <p className={styles.storyParagraph}>                {farmer.story ||                  farmer.bio ||                  `${farmTitle} is an independent regional farm committed to responsible agriculture and providing high quality harvests directly to local farmers markets.`}              </p>              <div className={styles.practicesGrid}>                <div className={styles.practiceCard}>                  <div className={styles.practiceHeader}>                    <Sparkles size={16} className={styles.checkIcon} />                    <h4>Zero Middlemen</h4>                  </div>                  <p>100% producer-direct. Every dollar directly supports independent agricultural stewardship.</p>                </div>                <div className={styles.practiceCard}>                  <div className={styles.practiceHeader}>                    <Sparkles size={16} className={styles.checkIcon} />                    <h4>Peak Harvest Timing</h4>                  </div>                  <p>Crops are harvested fresh immediately before weekend market pickups for superior flavor.</p>                </div>              </div>            </article>          </section>        )}        {}        {activeTab === 'markets' && (          <section className={styles.tabSection}>            <h2 className={styles.sectionTitle}>Where to Find {farmTitle}</h2>            <div className={styles.schedulesList}>              {markets.length > 0 ? (                markets.map((m) => (                  <div key={m.id || m._id} className={styles.scheduleCard}>                    <div className={styles.scheduleCardLeft}>                      <div className={styles.scheduleIconWrap}>                        <Store size={22} />                      </div>                      <div>                        <h3 className={styles.scheduleMarketName}>{m.name}</h3>                        <p className={styles.scheduleMarketLoc}>                          <MapPin size={13} /> {m.address}                        </p>                        <div className={styles.scheduleMetaRow}>                          <span className={styles.scheduleDay}>                            <Calendar size={13} /> {Array.isArray(m.days) ? m.days.join(', ') : m.day || 'Saturday'} ({m.hours || '8:00 AM ΓÇô 1:00 PM'})                          </span>                        </div>                      </div>                    </div>                    <Link to={`/markets/${m.id || m._id}`} className={styles.viewMarketBtn}>                      <span>Market Info</span>                      <ChevronRight size={15} />                    </Link>                  </div>                ))              ) : (                <p style={{ color: '#6e655c', padding: '16px 0' }}>No market locations listed currently.</p>              )}            </div>            {mapMarkers.length > 0 && (              <div style={{ marginTop: '24px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ebdcd5' }}>                <MapView                  markers={mapMarkers}                  height="220px"                  zoom={13}                  interactive={true}                  showDirectionsLink={true}                  ariaLabel={`Map of markets attended by ${farmTitle}`}                />              </div>            )}          </section>        )}        {}        {activeTab === 'reviews' && (          <section className={styles.tabSection}>            <div className={styles.reviewsList}>              {reviews.length > 0 ? (                reviews.map((r, idx) => (                  <div key={r.id || idx} className={styles.reviewCard}>                    <div className={styles.reviewHeader}>                      <div className={styles.reviewAvatar}>                        {(r.author || r.customerName || 'C').charAt(0)}                      </div>                      <div>                        <strong className={styles.reviewAuthor}>{r.author || r.customerName || 'Verified Customer'}</strong>                        <div className={styles.reviewStars}>                          {[1, 2, 3, 4, 5].map((i) => (                            <Star                              key={i}                              size={12}                              fill={i <= (r.rating || 5) ? '#E07A2C' : 'none'}                              color="#E07A2C"                            />                          ))}                        </div>                      </div>                      <span className={styles.reviewDate}>{formatDate(r.createdAt || new Date())}</span>                    </div>                    <p className={styles.reviewComment}>{r.comment || r.text || 'Great fresh produce!'}</p>                  </div>                ))              ) : (                <p style={{ color: '#6e655c', padding: '24px 0' }}>No customer reviews recorded yet.</p>              )}            </div>          </section>        )}      </div>    </div>  );}export default FarmerDetail;
=======
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Store,
  ShieldCheck,
  Star,
  Bookmark,
  Share2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { getFarmerDetail, getFarmerProducts, getFarmerReviews } from '@/api/catalog';
import { formatPrice, formatDate } from '@/utils/format';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import MapView from '@/components/domain/MapView';
import Illustration from '@/components/domain/Illustration';
import styles from './FarmerDetail.module.css';

function getFarmerImages(f) {
  const stall = (f?.stallName || f?.name || '').toLowerCase();
  if (stall.includes('willow') || stall.includes('poultry')) {
    return {
      avatar: '/images/farmer-marcus.jpg',
      cover: '/images/hero-market-crates.jpg',
    };
  }
  if (stall.includes('oak') || stall.includes('mill') || stall.includes('bakery')) {
    return {
      avatar: '/images/farmer-elena.jpg',
      cover: '/images/hero-market-crates.jpg',
    };
  }
  if (stall.includes('cedarbrook') || stall.includes('flower')) {
    return {
      avatar: '/images/farmer-sarah.jpg',
      cover: '/images/market-wildflower.jpg',
    };
  }
  if (stall.includes('riverbend')) {
    return {
      avatar: '/images/farmer-david.jpg',
      cover: '/images/riverbend-farm.jpg',
    };
  }
  if (stall.includes('maplecrest') || stall.includes('creamery')) {
    return {
      avatar: '/images/farmer-priya.jpg',
      cover: '/images/market-morning.jpg',
    };
  }
  if (stall.includes('hollow') || stall.includes('mushroom')) {
    return {
      avatar: '/images/farmer-marcus.jpg',
      cover: '/images/market-riverside.jpg',
    };
  }
  return {
    avatar: f?.avatar || f?.imageUrl || '/images/farmer-david.jpg',
    cover: f?.coverImage || '/images/riverbend-farm.jpg',
  };
}

function getProductVisual(product) {
  if (product?.imageUrl) return { type: 'img', src: product.imageUrl };
  if (product?.image) return { type: 'img', src: product.image };
  const name = (product?.name || '').toLowerCase();
  if (name.includes('tomato')) return { type: 'img', src: '/images/product-tomatoes.jpg' };
  if (name.includes('sourdough') || name.includes('bread') || name.includes('loaf')) {
    return { type: 'img', src: '/images/product-sourdough.jpg' };
  }
  if (name.includes('lettuce') || name.includes('green') || name.includes('kale') || name.includes('chard')) {
    return { type: 'img', src: '/images/product-lettuce.jpg' };
  }
  if (name.includes('strawberr') || name.includes('berry')) {
    return { type: 'img', src: '/images/product-strawberries.jpg' };
  }
  if (name.includes('honey')) return { type: 'img', src: '/images/product-honey.jpg' };
  if (name.includes('bouquet') || name.includes('flower')) return { type: 'illustration', name: 'flowers' };
  if (name.includes('corn')) return { type: 'illustration', name: 'corn' };
  if (name.includes('mushroom') || name.includes('lion') || name.includes('oyster')) {
    return { type: 'illustration', name: 'mushrooms' };
  }
  if (name.includes('ricotta') || name.includes('cheese') || name.includes('dairy')) {
    return { type: 'illustration', name: 'cheese-wedge' };
  }
  if (name.includes('egg') || name.includes('poultry')) return { type: 'illustration', name: 'egg-carton' };
  if (name.includes('carrot')) return { type: 'illustration', name: 'crate-carrots' };
  if (name.includes('beet')) return { type: 'illustration', name: 'beet-bunch' };
  if (product?.art) return { type: 'illustration', name: product.art };
  return { type: 'illustration', name: 'basket' };
}

export function FarmerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [farmer, setFarmer] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('crops');
  const [saved, setSaved] = useState(false);

  useDocumentTitle(farmer ? `${farmer.stallName || farmer.name} — MarketLink` : 'Farmer Stall Details — MarketLink');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      getFarmerDetail(id).catch((err) => {
        throw err;
      }),
      getFarmerProducts(id).catch(() => []),
      getFarmerReviews(id).catch(() => []),
    ])
      .then(([f, p, r]) => {
        if (!active) return;
        setFarmer(f);
        setProducts(Array.isArray(p) ? p : p?.items || p?.data || []);
        setReviews(Array.isArray(r) ? r : r?.items || r?.data || []);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Farmer not found');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="container" style={{ padding: '60px 20px' }}>
          <div style={{ height: 40, width: '40%', background: '#ede8df', borderRadius: 8, marginBottom: 20 }} />
          <div style={{ height: 240, background: '#ede8df', borderRadius: 16, marginBottom: 30 }} />
          <div style={{ height: 350, background: '#ede8df', borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  if (error || !farmer) {
    return (
      <div className={styles.page}>
        <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', color: '#4a1521' }}>Farmer Not Found</h1>
          <p style={{ color: '#4a433b', margin: '16px 0 24px' }}>
            {error || 'This grower profile could not be loaded or is no longer listed.'}
          </p>
          <Link
            to={PATHS.FARMERS}
            style={{
              display: 'inline-flex',
              padding: '10px 24px',
              backgroundColor: '#541722',
              color: '#ffffff',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Browse all farmers
          </Link>
        </div>
      </div>
    );
  }

  const farmTitle = farmer.stallName || farmer.name || 'Local Farm';
  const growerName = farmer.name || 'Local Producer';
  const markets = Array.isArray(farmer.markets) ? farmer.markets : [];
  const farmerVisual = getFarmerImages(farmer);

  const mapMarkers = [];
  if (farmer?.location?.lat && farmer?.location?.lng) {
    mapMarkers.push({
      id: farmer.id || farmer._id,
      lat: farmer.location.lat,
      lng: farmer.location.lng,
      title: farmTitle,
      subtitle: farmer.address || 'Stall location',
    });
  }
  markets.forEach((m) => {
    const lat = m.location?.lat != null ? m.location.lat : m.coordinates?.lat != null ? m.coordinates.lat : null;
    const lng = m.location?.lng != null ? m.location.lng : m.coordinates?.lng != null ? m.coordinates.lng : null;
    if (lat && lng) {
      mapMarkers.push({
        id: m.id || m._id,
        lat,
        lng,
        title: m.name,
        subtitle: m.address || 'Market location',
      });
    }
  });

  return (
    <div className={styles.page}>
      {/* ─── BREADCRUMBS ─────────────────────────────────────────── */}
      <div className={styles.breadcrumbBar}>
        <div className="container">
          <div className={styles.breadcrumbs}>
            <Link to={PATHS.FARMERS} className={styles.backBtn}>
              <ArrowLeft size={15} />
              <span>All Farmers</span>
            </Link>
            <span className={styles.sep}>›</span>
            <span className={styles.crumbCurrent}>{farmTitle}</span>
          </div>
        </div>
      </div>

      {/* ─── HERO COVER BANNER ───────────────────────────────────── */}
      <div className={styles.heroBannerWrap}>
        <img
          src={farmer.coverImage || farmerVisual.cover}
          alt={farmTitle}
          className={styles.heroCoverImg}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/riverbend-farm.jpg';
          }}
        />
        <div className={styles.heroCoverOverlay} />

        <div className="container" style={{ position: 'relative', height: '100%' }}>
          <div className={styles.heroActionsTop}>
            <button
              type="button"
              onClick={() => setSaved(!saved)}
              className={`${styles.heroActionBtn} ${saved ? styles.heroActionBtnActive : ''}`}
              aria-label="Save farm stall"
            >
              <Bookmark size={16} fill={saved ? '#6A1B29' : 'none'} />
              <span>{saved ? 'Saved' : 'Save Stall'}</span>
            </button>
            <button
              type="button"
              className={styles.heroActionBtn}
              onClick={() => {
                if (navigator?.clipboard) navigator.clipboard.writeText(window.location.href);
              }}
              aria-label="Share farm"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── FARMER PROFILE HEADER CARD ─────────────────────────── */}
      <div className="container">
        <div className={styles.profileHeaderCard}>
          <div className={styles.profileHeaderInner}>
            <div className={styles.profileAvatarWrap}>
              <img
                src={farmer.avatar || farmerVisual.avatar}
                alt={growerName}
                className={styles.profileAvatarImg}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/farmer-david.jpg';
                }}
              />
            </div>

            <div className={styles.profileInfoArea}>
              <div className={styles.profileBadgesRow}>
                <span className={styles.profileBadge}>
                  <ShieldCheck size={12} />
                  100% Producer Only
                </span>
                {farmer.stallNumber && (
                  <span className={styles.profileBadge}>Stall {farmer.stallNumber}</span>
                )}
                {farmer.isTopSeller && (
                  <span className={styles.profileBadge} style={{ backgroundColor: '#eaefe2', color: '#5c7048' }}>
                    Top Seller
                  </span>
                )}
              </div>

              <h1 className={styles.farmTitle}>{farmTitle}</h1>
              <p className={styles.farmerSubtitle}>
                Cultivated by <strong>{growerName}</strong>
              </p>

              <div className={styles.profileMetaRow}>
                <div className={styles.metaItem}>
                  <MapPin size={14} className={styles.metaIcon} />
                  <span>{farmer.specialty || farmer.bio || 'Local Region'}</span>
                </div>
                <div className={styles.metaItem}>
                  <Star size={14} fill="#E07A2C" color="#E07A2C" />
                  <strong>{farmer.ratingAvg ? Number(farmer.ratingAvg).toFixed(1) : '5.0'}</strong>
                  <span>({farmer.ratingCount ? `${farmer.ratingCount} reviews` : 'Community Rated'})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TAB NAVIGATION ─────────────────────────────────────── */}
      <div className={styles.tabsNavWrap}>
        <div className="container">
          <nav className={styles.tabsNav} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'crops'}
              onClick={() => setActiveTab('crops')}
              className={`${styles.tabBtn} ${activeTab === 'crops' ? styles.tabBtnActive : ''}`}
            >
              Available Harvest ({products.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'story'}
              onClick={() => setActiveTab('story')}
              className={`${styles.tabBtn} ${activeTab === 'story' ? styles.tabBtnActive : ''}`}
            >
              Story & Practices
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'markets'}
              onClick={() => setActiveTab('markets')}
              className={`${styles.tabBtn} ${activeTab === 'markets' ? styles.tabBtnActive : ''}`}
            >
              Where to Find ({markets.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'reviews'}
              onClick={() => setActiveTab('reviews')}
              className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.tabBtnActive : ''}`}
            >
              Reviews ({reviews.length})
            </button>
          </nav>
        </div>
      </div>

      {/* ─── TAB CONTENT PANES ───────────────────────────────────── */}
      <div className="container" style={{ paddingBottom: '70px' }}>
        {/* 1. CROPS / PRODUCTS TAB */}
        {activeTab === 'crops' && (
          <section className={styles.tabSection}>
            <div className={styles.tabSectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Fresh Harvest & Prepared Goods</h2>
                <p className={styles.sectionSubtitle}>
                  Harvested at dawn and packed fresh for your Saturday pickup.
                </p>
              </div>
            </div>

            <div className={styles.productsGrid}>
              {products.length > 0 ? (
                products.map((product) => {
                  const visual = getProductVisual(product);
                  const price = formatPrice(product.priceCents || (product.price ? product.price * 100 : 0));
                  return (
                    <div key={product.id || product._id} className={styles.productCard}>
                      <div className={styles.productImgWrap}>
                        {visual.type === 'img' ? (
                          <img
                            src={visual.src}
                            alt={product.name}
                            className={styles.productImg}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-canvas)' }}>
                            <Illustration name={visual.name} size="md" />
                          </div>
                        )}
                        <div style={{ width: '100%', height: '100%', display: 'none', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-canvas)' }}>
                          <Illustration name="basket" size="md" />
                        </div>
                        <span className={styles.productBadge}>
                          {product.availability === 'low' ? 'Low Stock' : 'Fresh Harvest'}
                        </span>
                      </div>

                      <div className={styles.productBody}>
                        <span className={styles.productCat}>
                          {typeof product.category === 'object' ? (product.category?.name || 'Produce') : (product.category || 'Produce')}
                        </span>
                        <h3 className={styles.productName}>
                          <Link to={`/products/${product.id || product._id}`} className={styles.productLink}>
                            {product.name}
                          </Link>
                        </h3>
                        <p className={styles.productDesc}>{product.description || 'Harvested fresh for Saturday market pickup.'}</p>
                        <div className={styles.productPriceRow}>
                          <div className={styles.priceWrap}>
                            <span className={styles.priceNum}>{price}</span>
                            <span className={styles.priceUnit}>/ {product.unit || 'item'}</span>
                          </div>
                          <span className={styles.stockNotice}>
                            {product.availability === 'low' ? 'Few left' : 'In stock'}
                          </span>
                        </div>
                        <Link to={`/products/${product.id || product._id}`} className={styles.reserveBtn}>
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#6e655c', padding: '24px 0' }}>
                  No items listed by this grower at this time.
                </p>
              )}
            </div>
          </section>
        )}

        {/* 2. STORY & PHILOSOPHY TAB */}
        {activeTab === 'story' && (
          <section className={styles.tabSection}>
            <article className={styles.storyCard}>
              <h2 className={styles.sectionTitle}>About {farmTitle}</h2>
              <p className={styles.storyParagraph}>
                {farmer.story ||
                  farmer.bio ||
                  `${farmTitle} is an independent regional farm committed to responsible agriculture and providing high quality harvests directly to local farmers markets.`}
              </p>

              <div className={styles.practicesGrid}>
                <div className={styles.practiceCard}>
                  <div className={styles.practiceHeader}>
                    <Sparkles size={16} className={styles.checkIcon} />
                    <h4>Zero Middlemen</h4>
                  </div>
                  <p>100% producer-direct. Every dollar directly supports independent agricultural stewardship.</p>
                </div>
                <div className={styles.practiceCard}>
                  <div className={styles.practiceHeader}>
                    <Sparkles size={16} className={styles.checkIcon} />
                    <h4>Peak Harvest Timing</h4>
                  </div>
                  <p>Crops are harvested fresh immediately before weekend market pickups for superior flavor.</p>
                </div>
              </div>
            </article>
          </section>
        )}

        {/* 3. MARKET SCHEDULE TAB */}
        {activeTab === 'markets' && (
          <section className={styles.tabSection}>
            <h2 className={styles.sectionTitle}>Where to Find {farmTitle}</h2>
            <div className={styles.schedulesList}>
              {markets.length > 0 ? (
                markets.map((m) => (
                  <div key={m.id || m._id} className={styles.scheduleCard}>
                    <div className={styles.scheduleCardHeader}>
                      <Store size={18} className={styles.storeIcon} />
                      <div>
                        <h3 className={styles.marketName}>{m.name}</h3>
                        <p className={styles.marketAddress}>{m.address || 'Market Location'}</p>
                      </div>
                    </div>
                    <div className={styles.scheduleHoursRow}>
                      <Calendar size={14} />
                      <span>{m.day || m.schedule || 'Saturdays · 8:00 AM – 1:00 PM'}</span>
                    </div>
                    <Link to={`/markets/${m.id || m._id}`} className={styles.marketLinkBtn}>
                      <span>View Market Stalls</span>
                    </Link>
                  </div>
                ))
              ) : (
                <p style={{ color: '#6e655c', padding: '24px 0' }}>
                  No market schedules currently published for this grower.
                </p>
              )}
            </div>

            {mapMarkers.length > 0 && (
              <div style={{ marginTop: '28px', height: '280px', borderRadius: '12px', overflow: 'hidden' }}>
                <MapView
                  markers={mapMarkers}
                  height="280px"
                  zoom={13}
                  interactive={true}
                  ariaLabel={`Locations for ${farmTitle}`}
                />
              </div>
            )}
          </section>
        )}

        {/* 4. REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <section className={styles.tabSection}>
            <div className={styles.reviewsHeaderRow}>
              <div>
                <h2 className={styles.sectionTitle}>Customer Reviews</h2>
                <p className={styles.sectionSubtitle}>Verified community feedback from weekend market shoppers.</p>
              </div>
            </div>

            <div className={styles.reviewsList}>
              {reviews.length > 0 ? (
                reviews.map((r, i) => (
                  <div key={r.id || i} className={styles.reviewCard}>
                    <div className={styles.reviewTopRow}>
                      <div className={styles.reviewerNameRow}>
                        <strong>{r.userName || r.author || 'Market Shopper'}</strong>
                        <span className={styles.reviewDate}>{r.createdAt ? formatDate(r.createdAt) : 'Recent market pickup'}</span>
                      </div>
                      <div className={styles.ratingStars}>
                        {[...Array(5)].map((_, idx) => (
                          <Star
                            key={idx}
                            size={13}
                            fill={idx < (r.rating || 5) ? '#E07A2C' : 'none'}
                            color={idx < (r.rating || 5) ? '#E07A2C' : '#dcd1c8'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className={styles.reviewText}>{r.comment || r.text || 'Wonderfully fresh produce, friendly stall service, and great quality!'}</p>
                  </div>
                ))
              ) : (
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#6e655c' }}>
                  <p>No customer reviews yet. Be the first to leave a review after your market pickup!</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default FarmerDetail;
>>>>>>> bc73418815cde522512fe21a2af884eee3163165
