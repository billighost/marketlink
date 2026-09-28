import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Star, AlertTriangle } from 'lucide-react';
import Illustration from '@/components/domain/Illustration';
import { useCatalogueRoutes } from '@/components/catalogue/routes';
import styles from './FarmerCard.module.css';

function getStallInitials(name) {
  if (!name) return 'S';
  const words = name.trim().split(/\s+/).filter((w) => /^[a-zA-Z0-9]/.test(w));
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return (words[0]?.slice(0, 2) || 'S').toUpperCase();
}

function getStallIllustration(art, specialty = '', stallName = '') {
  if (art && art !== 'crate') {
    if (art === 'honey') return 'honey-jar';
    if (art === 'bread' || art === 'sourdough') return 'sourdough-boule';
    if (art === 'radish') return 'radish-bunch';
    return art;
  }
  const text = `${specialty} ${stallName}`.toLowerCase();
  if (text.includes('strawberr') || text.includes('berr')) return 'strawberries';
  if (text.includes('blueberr')) return 'blueberries';
  if (text.includes('apple') || text.includes('cider') || text.includes('orchard')) return 'apples';
  if (text.includes('pear')) return 'pears';
  if (text.includes('cheese') || text.includes('creamery') || text.includes('butter') || text.includes('dairy')) return 'cheese';
  if (text.includes('sourdough') || text.includes('bakery') || text.includes('bread')) return 'sourdough-boule';
  if (text.includes('pastr') || text.includes('croissant')) return 'croissant';
  if (text.includes('honey') || text.includes('apiary') || text.includes('bee')) return 'honey-jar';
  if (text.includes('jam') || text.includes('preserve')) return 'jam';
  if (text.includes('mushroom')) return 'mushrooms';
  if (text.includes('flower')) return 'flowers';
  if (text.includes('herb')) return 'herbs';
  if (text.includes('egg')) return 'egg-carton';
  if (text.includes('meat') || text.includes('sausage') || text.includes('butcher')) return 'sausages';
  if (text.includes('fish')) return 'fish';
  if (text.includes('carrot')) return 'crate-carrots';
  if (text.includes('tomato')) return 'basket-tomatoes';
  if (text.includes('vegetable') || text.includes('veg') || text.includes('farm')) return 'crate-carrots';
  return 'basket';
}

function getStallTags(specialty, stallName) {
  if (!specialty) return [];
  return specialty
    .split(/\s*(?:and|&|,|\/)\s*/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 24)
    .slice(0, 3);
}

function getStallTheme(art, specialty = '', stallName = '') {
  const text = `${art || ''} ${specialty || ''} ${stallName || ''}`.toLowerCase();
  if (text.includes('strawberr') || text.includes('berr') || text.includes('jam') || text.includes('sunridge')) {
    return {
      gradient: 'linear-gradient(150deg, #FFF1F2 0%, #FFE4E6 50%, #FECDD3 100%)',
      accent: '#BE123C',
      tagBg: '#FFE4E6',
      tagText: '#9F1239',
      border: 'rgba(244, 63, 94, 0.22)',
    };
  }
  if (text.includes('honey') || text.includes('apiary') || text.includes('hollow creek')) {
    return {
      gradient: 'linear-gradient(150deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)',
      accent: '#B45309',
      tagBg: '#FEF3C7',
      tagText: '#78350F',
      border: 'rgba(217, 119, 6, 0.22)',
    };
  }
  if (text.includes('cheese') || text.includes('dairy') || text.includes('creamery') || text.includes('maplecrest')) {
    return {
      gradient: 'linear-gradient(150deg, #FEFCE8 0%, #FEF9C3 50%, #FEF08A 100%)',
      accent: '#854D0E',
      tagBg: '#FEF9C3',
      tagText: '#713F12',
      border: 'rgba(202, 138, 4, 0.22)',
    };
  }
  if (text.includes('bread') || text.includes('bakery') || text.includes('sourdough') || text.includes('pastr') || text.includes('oak & mill')) {
    return {
      gradient: 'linear-gradient(150deg, #FAF5EE 0%, #F5E8D3 50%, #EDD8B6 100%)',
      accent: '#8A5A2B',
      tagBg: '#F5E8D3',
      tagText: '#633D18',
      border: 'rgba(182, 133, 85, 0.25)',
    };
  }
  if (text.includes('flower') || text.includes('cedarbrook')) {
    return {
      gradient: 'linear-gradient(150deg, #FAF5FF 0%, #F3E8FF 50%, #E9D5FF 100%)',
      accent: '#7E22CE',
      tagBg: '#F3E8FF',
      tagText: '#581C87',
      border: 'rgba(168, 85, 247, 0.22)',
    };
  }
  if (text.includes('apple') || text.includes('orchard') || text.includes('cider') || text.includes('clearwater')) {
    return {
      gradient: 'linear-gradient(150deg, #ECFDF5 0%, #D1FAE5 50%, #A7F3D0 100%)',
      accent: '#047857',
      tagBg: '#D1FAE5',
      tagText: '#064E3B',
      border: 'rgba(16, 185, 129, 0.22)',
    };
  }
  if (text.includes('mushroom') || text.includes('green hollow')) {
    return {
      gradient: 'linear-gradient(150deg, #F0FDF4 0%, #DCFCE7 50%, #BBF7D0 100%)',
      accent: '#15803D',
      tagBg: '#DCFCE7',
      tagText: '#14532D',
      border: 'rgba(34, 197, 94, 0.22)',
    };
  }
  if (text.includes('riverbend') || text.includes('herb') || text.includes('vegetable')) {
    return {
      gradient: 'linear-gradient(150deg, #F0FDF4 0%, #E2F7E4 50%, #C7EDCB 100%)',
      accent: '#166534',
      tagBg: '#E2F7E4',
      tagText: '#14532D',
      border: 'rgba(46, 125, 50, 0.22)',
    };
  }
  return {
    gradient: 'linear-gradient(150deg, #FAF7F0 0%, #F5EFE3 50%, #EADEC7 100%)',
    accent: '#B08655',
    tagBg: '#F5EFE3',
    tagText: '#4A3E31',
    border: 'rgba(176, 134, 85, 0.25)',
  };
}

export function FarmerCard({
  farmer,
  variant = 'row',
  className = '',
  audience = 'buyer',
}) {
  const routes = useCatalogueRoutes(audience);
  if (!farmer) return null;

  const stallId = farmer.id || farmer._id;

  if (variant === 'stall') {
    const initials = getStallInitials(farmer.stallName);
    const farmerSub = farmer.contactPerson || farmer.specialty || '';
    const hasLowStock = Boolean(farmer.lowStockCount && farmer.lowStockCount > 0);
    const illustrationName = getStallIllustration(farmer.art, farmer.specialty, farmer.stallName);
    const theme = getStallTheme(farmer.art, farmer.specialty, farmer.stallName);
    const tags = getStallTags(farmer.specialty, farmer.stallName);
    const isLimited = farmer.availabilityMode === 'limited' || farmer.availabilityStatus?.mode === 'limited' || (farmer.openToday && hasLowStock);
    const isClosed = farmer.availabilityMode === 'closed' || farmer.availabilityStatus?.mode === 'closed' || !farmer.openToday;

    return (
      <article
        className={`${styles.card} ${styles.stall} ${className}`}
        aria-label={`${farmer.stallName}, ${farmerSub}`}
      >
        <Link
          to={routes.stall(stallId)}
          className={styles.stretchedLink}
          tabIndex={0}
          aria-label={`View stall ${farmer.stallName}`}
        />

        <div
          className={styles.stallBanner}
          style={{ background: theme.gradient, borderColor: theme.border }}
        >
          
          <div className={styles.bannerBadges}>
            <div className={styles.badgeLeft}>
              {farmer.isTopSeller ? (
                <span className={styles.topSellerTag}>
                  <Sparkles size={11} className={styles.sparkleIcon} />
                  <span>Top Seller</span>
                </span>
              ) : farmer.isNew ? (
                <span className={styles.newTag}>
                  <Sparkles size={11} className={styles.sparkleIcon} />
                  <span>New</span>
                </span>
              ) : farmer.stallNumber ? (
                <span className={styles.stallNumberTag}>{farmer.stallNumber}</span>
              ) : null}
            </div>

            <div className={styles.badgeRight}>
              {isLimited ? (
                <span className={styles.limitedBadge} title={farmer.availabilityNote || 'Limited availability'}>
                  <span className={styles.amberDot} /> Limited
                </span>
              ) : isClosed ? (
                <span className={styles.closedBadge}>
                  <span className={styles.redDot} /> Closed today
                </span>
              ) : (
                <span className={styles.openBadge}>
                  <span className={styles.pulseDot} /> Open today
                </span>
              )}
            </div>
          </div>

          {farmer.imageUrl ? (
            <div className={styles.bannerCover}>
              <img
                src={farmer.imageUrl}
                alt={farmer.stallName}
                className={styles.bannerCoverImg}
              />
            </div>
          ) : (
            <div className={styles.illustrationWrapper}>
              <Illustration name={illustrationName} size="md" className={styles.bannerIllustration} />
            </div>
          )}

          <div className={styles.stallAvatar} aria-hidden="true">
            {farmer.imageUrl ? (
              <img
                src={farmer.imageUrl}
                alt={farmer.stallName}
                className={styles.stallAvatarImg}
              />
            ) : (
              <span className={styles.stallInitials}>{initials}</span>
            )}
          </div>
        </div>

        <div className={styles.stallContent}>
          <div className={styles.stallTitleGroup}>
            <h3 className={styles.stallHeading} title={farmer.stallName}>
              {farmer.stallName}
            </h3>
            {farmer.contactPerson && (
              <p className={styles.producerName}>Grower: {farmer.contactPerson}</p>
            )}
          </div>

          {farmer.specialty && (
            <p className={styles.stallSub}>{farmer.specialty}</p>
          )}

          {tags.length > 0 && (
            <div className={styles.tagRow}>
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className={styles.produceTag}
                  style={{ backgroundColor: theme.tagBg, color: theme.tagText }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className={styles.stallFooter}>
            <div className={styles.footerLeft}>
              {hasLowStock ? (
                <span className={styles.lowStockText}>
                  <AlertTriangle size={12} className={styles.lowStockIcon} aria-hidden="true" />
                  <span>{farmer.lowStockCount} {farmer.lowStockCount === 1 ? 'item low' : 'items low'}</span>
                </span>
              ) : farmer.rating ? (
                <span className={styles.ratingInfo}>
                  <Star size={12} className={styles.starIconSolid} />
                  <span className={styles.ratingNum}>{farmer.rating}</span>
                  <span className={styles.reviewNum}>({farmer.reviewCount || 16})</span>
                </span>
              ) : farmer.since ? (
                <span className={styles.sinceText}>Est. {farmer.since}</span>
              ) : (
                <span className={styles.localPill}>Local Farm</span>
              )}
            </div>

            <div className={styles.viewStallAction}>
              <span>Visit stall</span>
              <ArrowRight size={13} className={styles.actionArrow} />
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`${styles.card} ${styles[variant] || styles.row} ${className}`}
      aria-label={`${farmer.stallName}, ${farmer.specialty}`}
    >
      <Link
        to={routes.stall(stallId)}
        className={styles.stretchedLink}
        tabIndex={0}
        aria-label={`View stall ${farmer.stallName}`}
      />

      <div className={styles.imageTile} data-aspect="4/3">
        {farmer.imageUrl ? (
          <img
            src={farmer.imageUrl}
            alt={farmer.stallName}
            className={styles.bannerCoverImg}
          />
        ) : (
          <div className={styles.illustrationWrapper}>
            <Illustration
              name={farmer.art || 'crate-carrots'}
              size="md"
            />
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h3 className={styles.stallName}>{farmer.stallName}</h3>
            {farmer.isTopSeller && (
              <span className={styles.topSellerBadge}>Top Seller</span>
            )}
          </div>
          <p className={styles.specialty}>{farmer.specialty}</p>
        </div>

        <div className={styles.meta}>
          <div className={styles.ratingBadge}>
            <Star size={11} className={styles.starIcon} fill="currentColor" aria-hidden="true" />
            <span className={styles.ratingValue}>{farmer.rating}</span>
            <span className={styles.reviewCount}>({farmer.reviewCount})</span>
          </div>
          <span className={styles.metaDot} aria-hidden="true">·</span>
          <span className={styles.stallNumber}>{farmer.stallNumber}</span>
        </div>
      </div>
    </article>
  );
}

export default FarmerCard;
