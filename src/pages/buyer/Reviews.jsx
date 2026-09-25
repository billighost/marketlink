import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Star,
  MessageSquare,
  CheckCircle,
  Clock,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  Store,
  Leaf,
  Plus,
  X,
  ShoppingBag,
  ThumbsUp,
  ShieldCheck,
} from 'lucide-react';
import { reviews as initialReviews, orders, products, farmers } from '@/data/placeholders';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Stars from '@/components/ui/Stars';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Chip from '@/components/ui/Chip';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import styles from './Reviews.module.css';

export function Reviews() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'pending' | 'mine'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'farmers' | 'products'
  const [searchQuery, setSearchQuery] = useState('');
  const [allReviews, setAllReviews] = useState(initialReviews);

  // Review Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetItem, setTargetItem] = useState(null); // { type: 'farmer'|'product', id, name, sub }
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  // Completed orders available for reviewing
  const completedOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'Completed');
  }, []);

  // Customer's own submitted reviews
  const myReviews = useMemo(() => {
    return allReviews.filter((r) => r.author === 'George A.' || r.isMine);
  }, [allReviews]);

  // Overall rating calculations
  const stats = useMemo(() => {
    const total = allReviews.length;
    if (total === 0) return { avg: 5.0, total: 0, dist: { 5: 100, 4: 0, 3: 0, 2: 0, 1: 0 } };

    const sum = allReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    const avg = (sum / total).toFixed(1);

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      counts[star] = (counts[star] || 0) + 1;
    });

    const dist = {
      5: Math.round((counts[5] / total) * 100),
      4: Math.round((counts[4] / total) * 100),
      3: Math.round((counts[3] / total) * 100),
      2: Math.round((counts[2] / total) * 100),
      1: Math.round((counts[1] / total) * 100),
    };

    return { avg, total, dist };
  }, [allReviews]);

  // Filtered reviews for browse tab
  const filteredReviews = useMemo(() => {
    return allReviews.filter((rev) => {
      if (filterType === 'farmers' && !rev.farmerId) return false;
      if (filterType === 'products' && !rev.productId) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesAuthor = rev.author?.toLowerCase().includes(q);
        const matchesText = rev.text?.toLowerCase().includes(q);
        const farmerObj = rev.farmerId ? farmers.find((f) => f.id === rev.farmerId) : null;
        const prodObj = rev.productId ? products.find((p) => p.id === rev.productId) : null;
        const matchesFarmer = farmerObj?.stallName?.toLowerCase().includes(q);
        const matchesProd = prodObj?.name?.toLowerCase().includes(q);

        if (!matchesAuthor && !matchesText && !matchesFarmer && !matchesProd) return false;
      }
      return true;
    });
  }, [allReviews, filterType, searchQuery]);

  const handleOpenReviewModal = (item) => {
    setTargetItem(item);
    setRating(5);
    setComment('');
    setSelectedTags([]);
    setIsModalOpen(true);
  };

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      showToast({ message: 'Please write a brief comment with your review' });
      return;
    }

    const newRev = {
      id: `rev-${Date.now()}`,
      farmerId: targetItem.type === 'farmer' ? targetItem.id : targetItem.farmerId,
      productId: targetItem.type === 'product' ? targetItem.id : null,
      author: user?.name || 'George A.',
      rating,
      date: new Date().toISOString().split('T')[0],
      text: comment.trim(),
      tags: selectedTags,
      isMine: true,
    };

    setAllReviews((prev) => [newRev, ...prev]);
    setIsModalOpen(false);
    showToast({ message: 'Thank you! Your verified customer review was published.' });
  };

  const reviewHighlights = [
    'Super fresh',
    'Exceptional flavour',
    'Friendly stall',
    'Great value',
    'Perfect ripeness',
    'Will order again',
  ];

  return (
    <div className={styles.page}>
      {/* ── Page Header ────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <div className={styles.kickerRow}>
              <span className={styles.kicker}>
                <ShieldCheck size={14} className={styles.kickerIcon} />
                Verified Market Community
              </span>
            </div>
            <h1 className={styles.title}>Customer Reviews & Ratings</h1>
            <p className={styles.subtitle}>
              Read candid feedback from market neighbours and share your experience from completed Saturday pickups.
            </p>
          </div>
        </div>

        {/* Top Destination Tabs */}
        <div className={styles.controlsRow}>
          <SegmentedControl
            name="reviews-tab"
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: 'browse', label: `Community (${allReviews.length})` },
              { value: 'pending', label: `Completed Pickups (${completedOrders.length})` },
              { value: 'mine', label: `My Reviews (${myReviews.length})` },
            ]}
          />
        </div>
      </header>

      {/* ── Rating Distribution & Summary Card ──────────────────── */}
      <section className={styles.statsCard} aria-label="Rating breakdown">
        <div className={styles.statsOverall}>
          <span className={styles.overallScore}>{stats.avg}</span>
          <div className={styles.overallStars}>
            <Stars rating={Number(stats.avg)} />
            <span className={styles.overallCount}>{stats.total} verified ratings</span>
          </div>
        </div>

        <div className={styles.distributionWrap}>
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className={styles.distRow}>
              <span className={styles.distStarLabel}>{star} ★</span>
              <div className={styles.distTrack}>
                <div
                  className={styles.distFill}
                  style={{ width: `${stats.dist[star]}%` }}
                />
              </div>
              <span className={styles.distPercent}>{stats.dist[star]}%</span>
            </div>
          ))}
        </div>

        <div className={styles.statsTrust}>
          <div className={styles.trustBadge}>
            <ShieldCheck size={18} className={styles.trustIcon} />
            <div>
              <strong>100% Pickup-Verified</strong>
              <p>Only customers who pre-ordered and picked up at market can leave reviews.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TAB 1: BROWSE COMMUNITY REVIEWS ──────────────────────── */}
      {activeTab === 'browse' && (
        <div className={styles.tabContent}>
          {/* Filter Bar */}
          <div className={styles.filterBar}>
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Search reviews by produce, farm, or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search reviews"
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearSearch}
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className={styles.chipsWrap}>
              <Chip
                selected={filterType === 'all'}
                onClick={() => setFilterType('all')}
              >
                All Feedback
              </Chip>
              <Chip
                selected={filterType === 'farmers'}
                onClick={() => setFilterType('farmers')}
              >
                Farmer Stalls
              </Chip>
              <Chip
                selected={filterType === 'products'}
                onClick={() => setFilterType('products')}
              >
                Fresh Produce & Breads
              </Chip>
            </div>
          </div>

          {/* Reviews Stream */}
          {filteredReviews.length > 0 ? (
            <div className={styles.reviewsList}>
              {filteredReviews.map((rev) => {
                const farmer = rev.farmerId ? farmers.find((f) => f.id === rev.farmerId) : null;
                const product = rev.productId ? products.find((p) => p.id === rev.productId) : null;

                return (
                  <article key={rev.id} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                      <div className={styles.authorGroup}>
                        <div className={styles.authorAvatar}>
                          {rev.author ? rev.author[0] : 'C'}
                        </div>
                        <div>
                          <div className={styles.authorNameRow}>
                            <strong className={styles.authorName}>{rev.author}</strong>
                            {rev.isMine && (
                              <span className={styles.youBadge}>You</span>
                            )}
                            <span className={styles.verifiedTag}>Verified Pickup</span>
                          </div>
                          <span className={styles.reviewDate}>{rev.date}</span>
                        </div>
                      </div>

                      <Stars rating={rev.rating} />
                    </div>

                    {/* Linked Entity Pill */}
                    {(farmer || product) && (
                      <div className={styles.entityRow}>
                        {farmer && (
                          <Link
                            to={`/buyer/farmers/${farmer.id}`}
                            className={styles.entityPill}
                            title="Visit farmer stall"
                          >
                            <Store size={13} />
                            <span>{farmer.stallName}</span>
                            <span className={styles.entitySub}>{farmer.stallNumber}</span>
                          </Link>
                        )}
                        {product && (
                          <Link
                            to={`/buyer/products/${product.id}`}
                            className={styles.entityPill}
                            title="View harvest details"
                          >
                            <Leaf size={13} />
                            <span>{product.name}</span>
                          </Link>
                        )}
                      </div>
                    )}

                    <p className={styles.reviewBody}>"{rev.text}"</p>

                    {rev.tags && rev.tags.length > 0 && (
                      <div className={styles.reviewTags}>
                        {rev.tags.map((tag) => (
                          <span key={tag} className={styles.reviewTag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              illustration="basket"
              title="No reviews match your filters"
              text="Try clearing your search term or selecting a different category."
              actionLabel="View all reviews"
              onAction={() => {
                setSearchQuery('');
                setFilterType('all');
              }}
            />
          )}
        </div>
      )}

      {/* ── TAB 2: COMPLETED ORDERS / WRITE A REVIEW ──────────────── */}
      {activeTab === 'pending' && (
        <div className={styles.tabContent}>
          <div className={styles.infoBanner}>
            <Sparkles size={18} className={styles.bannerIcon} />
            <p>
              Leave feedback for the local growers from your recent market pickups.
              Your reviews help other neighbours find the best seasonal produce.
            </p>
          </div>

          {completedOrders.length > 0 ? (
            <div className={styles.ordersList}>
              {completedOrders.map((order) => (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderTop}>
                    <div>
                      <span className={styles.orderNumber}>{order.number}</span>
                      <span className={styles.orderDate}>Pickup: {order.pickupSlot}</span>
                    </div>
                    <span className={styles.orderStatusBadge}>Completed</span>
                  </div>

                  {/* Items eligible for review */}
                  <div className={styles.orderItems}>
                    {order.farmerGroups?.map((group) => {
                      const farmer = farmers.find((f) => f.id === group.farmerId);
                      return (
                        <div key={group.farmerId} className={styles.orderGroup}>
                          <div className={styles.groupInfo}>
                            <Store size={15} className={styles.stallIcon} />
                            <div>
                              <strong>{group.stallName}</strong>
                              <span className={styles.stallSub}>{group.stallNumber}</span>
                            </div>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              handleOpenReviewModal({
                                type: 'farmer',
                                id: group.farmerId,
                                name: group.stallName,
                                sub: group.stallNumber,
                              })
                            }
                          >
                            Review Stall
                          </Button>
                        </div>
                      );
                    })}

                    <div className={styles.orderProductsList}>
                      {order.items?.map((item) => (
                        <div key={item.productId} className={styles.orderProductRow}>
                          <div className={styles.orderProductLeft}>
                            <Leaf size={14} className={styles.leafIcon} />
                            <span className={styles.orderProductName}>{item.name}</span>
                            <span className={styles.orderProductQty}>× {item.quantity}</span>
                          </div>
                          <button
                            type="button"
                            className={styles.writeProductBtn}
                            onClick={() =>
                              handleOpenReviewModal({
                                type: 'product',
                                id: item.productId,
                                farmerId: item.farmerId,
                                name: item.name,
                                sub: item.unit,
                              })
                            }
                          >
                            <Plus size={13} />
                            <span>Review Item</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              illustration="basket-tomatoes"
              title="No completed pickups yet"
              text="After picking up your pre-order at Saturday market, you'll be able to review the fresh items and farmer stalls here."
              actionLabel="Browse Saturday Harvests"
              onAction={() => navigate('/buyer/products')}
            />
          )}
        </div>
      )}

      {/* ── TAB 3: MY REVIEWS ────────────────────────────────────── */}
      {activeTab === 'mine' && (
        <div className={styles.tabContent}>
          {myReviews.length > 0 ? (
            <div className={styles.reviewsList}>
              {myReviews.map((rev) => {
                const farmer = rev.farmerId ? farmers.find((f) => f.id === rev.farmerId) : null;
                const product = rev.productId ? products.find((p) => p.id === rev.productId) : null;

                return (
                  <article key={rev.id} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                      <div className={styles.authorGroup}>
                        <div className={styles.authorAvatar}>GA</div>
                        <div>
                          <div className={styles.authorNameRow}>
                            <strong className={styles.authorName}>{rev.author}</strong>
                            <span className={styles.youBadge}>You</span>
                            <span className={styles.verifiedTag}>Verified Pickup</span>
                          </div>
                          <span className={styles.reviewDate}>{rev.date}</span>
                        </div>
                      </div>
                      <Stars rating={rev.rating} />
                    </div>

                    {(farmer || product) && (
                      <div className={styles.entityRow}>
                        {farmer && (
                          <div className={styles.entityPill}>
                            <Store size={13} />
                            <span>{farmer.stallName}</span>
                          </div>
                        )}
                        {product && (
                          <div className={styles.entityPill}>
                            <Leaf size={13} />
                            <span>{product.name}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <p className={styles.reviewBody}>"{rev.text}"</p>

                    {rev.tags && rev.tags.length > 0 && (
                      <div className={styles.reviewTags}>
                        {rev.tags.map((tag) => (
                          <span key={tag} className={styles.reviewTag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              illustration="basket"
              title="You haven't written any reviews yet"
              text="Check the 'Completed Pickups' tab to share your ratings for recent Saturday produce and artisan stalls."
              actionLabel="View Completed Orders"
              onAction={() => setActiveTab('pending')}
            />
          )}
        </div>
      )}

      {/* ── INTERACTIVE REVIEW MODAL ──────────────────────────────── */}
      {isModalOpen && targetItem && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
          <div className={styles.modalSheet}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalKicker}>Verified Review</span>
                <h2 id="review-modal-title" className={styles.modalTitle}>
                  Review {targetItem.name}
                </h2>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsModalOpen(false)}
                aria-label="Close review dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className={styles.modalForm}>
              {/* Star Rating Selector */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Your Rating</label>
                <div className={styles.starRatingControl}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={styles.starBtn}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      aria-label={`${star} star`}
                    >
                      <Star
                        size={28}
                        className={
                          (hoverRating || rating) >= star
                            ? styles.starSelected
                            : styles.starEmpty
                        }
                      />
                    </button>
                  ))}
                  <span className={styles.ratingDescriptor}>
                    {(hoverRating || rating) === 5 && 'Outstanding quality'}
                    {(hoverRating || rating) === 4 && 'Very fresh & tasty'}
                    {(hoverRating || rating) === 3 && 'Average / Good'}
                    {(hoverRating || rating) === 2 && 'Fair / Below expectation'}
                    {(hoverRating || rating) === 1 && 'Poor'}
                  </span>
                </div>
              </div>

              {/* Tag Highlights */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>What stood out? (Optional)</label>
                <div className={styles.tagChips}>
                  {reviewHighlights.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`${styles.tagChipBtn} ${
                        selectedTags.includes(tag) ? styles.tagChipActive : ''
                      }`}
                      onClick={() => handleToggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div className={styles.formGroup}>
                <label htmlFor="review-comment" className={styles.formLabel}>
                  Written Review
                </label>
                <textarea
                  id="review-comment"
                  className={styles.commentInput}
                  rows={4}
                  placeholder="Share details on freshness, flavour, how you prepared it, or your stall interaction..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </div>

              {/* Submit Buttons */}
              <div className={styles.modalActions}>
                <Button variant="primary" size="lg" type="submit" className={styles.submitBtn}>
                  Submit Verified Review
                </Button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reviews;
