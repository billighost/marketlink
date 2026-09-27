import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, 
  Sprout, 
  ShieldCheck, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  Award,
  HeartHandshake
} from 'lucide-react';
import Page from '@/components/layout/Page';
import StallsView from '@/components/catalogue/StallsView';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './Farmers.module.css';

/**
 * Public stalls & producers index page.
 * Enriched with grower standards, seasonal harvest guide, and producer CTA.
 */
export function Farmers() {
  useDocumentTitle('Producers & Stalls · MarketLink');

  const standards = [
    {
      icon: Sprout,
      title: 'Direct From Soil & Oven',
      desc: 'Zero wholesale middlemen or long-haul cargo holds. Everything sold at our stalls is harvested or prepared within 50 miles of the marketplace.'
    },
    {
      icon: ShieldCheck,
      title: 'Verified Producer Charter',
      desc: 'Every farmer, baker, and artisan is inspected annually for sustainable soil practices, ethical livestock welfare, and transparent ingredient sourcing.'
    },
    {
      icon: HeartHandshake,
      title: 'Fair Farmgate Pricing',
      desc: 'When you purchase through MarketLink, 93%+ of your spend goes directly to the family farm or artisan stallholder, sustaining rural vitality.'
    }
  ];

  const seasons = [
    {
      name: 'Spring',
      span: 'March – May',
      highlights: ['Wild Garlic & Ramps', 'Tender Asparagus', 'Spring Lamb & Goat Curd', 'Young Spinach & Radishes']
    },
    {
      name: 'Summer',
      span: 'June – August',
      highlights: ['Heritage Tomatoes', 'Sweet Corn & Courgettes', 'Soft Berries & Cherries', 'Artisan Raw Honey']
    },
    {
      name: 'Autumn',
      span: 'September – November',
      highlights: ['Squash & Pumpkin varieties', 'Crisp Orchard Apples & Pears', 'Wild Forest Mushrooms', 'Heritage Cider & Root Veg']
    },
    {
      name: 'Winter',
      span: 'December – February',
      highlights: ['Cavolo Nero & Winter Cabbages', 'Storage Potatoes & Parsnips', 'Aged Farmstead Cheeses', 'Woodfired Sourdough Batards']
    }
  ];

  return (
    <Page width="wide">
      <div className={styles.page}>
        {/* Hero Section */}
        <section className={styles.hero} aria-labelledby="farmers-hero-title">
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroBadge}>
            <Store size={14} />
            <span>Independent Stalls & Growers</span>
          </div>
          <h1 id="farmers-hero-title" className={styles.heroTitle}>
            Meet Your Neighborhood Growers & Makers
          </h1>
          <p className={styles.heroLead}>
            Browse independent stalls, discover weekly harvest availability, and pre-order directly from the individuals who nurture your food.
          </p>
          <div className={styles.heroPills}>
            <span className={styles.heroPill}>
              <Sprout size={13} />
              Organically Grown
            </span>
            <span className={styles.heroPill}>
              <Clock size={13} />
              Morning-Harvested
            </span>
            <span className={styles.heroPill}>
              <Award size={13} />
              Heritage Breeds
            </span>
            <span className={styles.heroPill}>
              <Sparkles size={13} />
              Zero Warehousing
            </span>
          </div>
        </section>

        {/* Live Stalls Catalogue Component */}
        <StallsView audience="guest" />

        {/* Seasonal Harvest Calendar */}
        <section className={styles.calendarSection} aria-labelledby="harvest-calendar-title">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionPre}>Seasonal Availability</div>
            <h2 id="harvest-calendar-title" className={styles.sectionTitle}>
              What’s in Season Throughout the Year
            </h2>
            <p className={styles.sectionSub}>
              Eating in rhythm with local micro-climates ensures peak nutritional value, deep flavour, and a smaller carbon footprint.
            </p>
          </div>

          <div className={styles.calendarGrid}>
            {seasons.map((season) => (
              <div key={season.name} className={styles.seasonCard}>
                <div className={styles.seasonBadge}>{season.span}</div>
                <h3 className={styles.seasonTitle}>{season.name}</h3>
                <ul className={styles.seasonProduceList}>
                  {season.highlights.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Quality Commitments */}
        <section className={styles.standardsSection} aria-labelledby="producer-charter-title">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionPre}>The MarketLink Difference</div>
            <h2 id="producer-charter-title" className={styles.sectionTitle}>
              Our Producer Charter
            </h2>
            <p className={styles.sectionSub}>
              Every stall on MarketLink complies with rigorous transparency standards so you always know who grew your meal.
            </p>
          </div>

          <div className={styles.standardsGrid}>
            {standards.map((std, i) => {
              const Icon = std.icon;
              return (
                <div key={i} className={styles.standardCard}>
                  <div className={styles.standardIconWrap}>
                    <Icon size={22} />
                  </div>
                  <h3 className={styles.standardTitle}>{std.title}</h3>
                  <p className={styles.standardDesc}>{std.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Join as Producer CTA */}
        <aside className={styles.producerBanner}>
          <div className={styles.producerText}>
            <h3>Are you a grower, baker, or smallholder?</h3>
            <p>List your stall on MarketLink to reach conscious local buyers, accept pre-orders, and streamline your market day.</p>
          </div>
          <Link to="/register?role=vendor" className={styles.producerAction}>
            <span>Open a Stall</span>
            <ArrowRight size={16} />
          </Link>
        </aside>
      </div>
    </Page>
  );
}

export default Farmers;
