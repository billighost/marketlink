import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Sparkles, 
  ShieldCheck, 
  Leaf, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  PackageCheck,
  Store
} from 'lucide-react';
import Page from '@/components/layout/Page';
import BrowseView from '@/components/catalogue/BrowseView';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './Products.module.css';

/**
 * Public produce browsing page wrapper.
 * Enriched with guest hero, pre-ordering guidance, freshness tips, and registration CTA.
 */
export function Products() {
  useDocumentTitle('Fresh Produce & Pantry · MarketLink');

  const tips = [
    {
      category: 'Leafy Greens & Herbs',
      title: 'Maintain Crisp Snap',
      desc: 'Wrap loosely in a slightly damp tea towel and store in your refrigerator crisper drawer. Keeps tender greens crisp for 8–10 days.'
    },
    {
      category: 'Heritage Tomatoes',
      title: 'Never Chill on the Vine',
      desc: 'Refrigeration breaks down delicate aromatic esters and causes mealy texture. Store stem-side down at ambient room temperature.'
    },
    {
      category: 'Woodfired Sourdough',
      title: 'Store Cut-Faced Down',
      desc: 'Place the open cut face directly against a wooden board or wrap in breathable linen. Never store artisan bread in plastic bags.'
    },
    {
      category: 'Farmstead Raw Honey',
      title: 'Natural Crystallization',
      desc: 'Raw honey naturally thickens over time—a hallmark of purity. Gently place the jar into a warm water bowl to restore smooth clarity.'
    }
  ];

  return (
    <Page width="wide">
      <div className={styles.page}>
        {/* Guest Hero Section */}
        <section className={styles.hero} aria-labelledby="products-hero-title">
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroBadge}>
            <ShoppingBag size={14} />
            <span>Farmgate Produce & Pantry</span>
          </div>
          <h1 id="products-hero-title" className={styles.heroTitle}>
            Farm-Fresh Produce Straight from the Field
          </h1>
          <p className={styles.heroLead}>
            Crisp seasonal greens, tree-ripened heritage fruit, small-batch dairy, and stoneground sourdough. Browse what local growers are harvesting for this weekend’s market.
          </p>
          <div className={styles.heroPills}>
            <span className={styles.heroPill}>
              <Sparkles size={13} />
              Morning-Harvested
            </span>
            <span className={styles.heroPill}>
              <ShieldCheck size={13} />
              Zero Synthetic Pesticides
            </span>
            <span className={styles.heroPill}>
              <CheckCircle2 size={13} />
              100% Farm-Traceable
            </span>
            <span className={styles.heroPill}>
              <Leaf size={13} />
              Heirloom Cultivars
            </span>
          </div>
        </section>

        {/* How Pre-Ordering Works */}
        <section className={styles.howSection} aria-label="How Farm Pre-Ordering Works">
          <div className={styles.howHeader}>
            <h2 className={styles.howTitle}>
              <Clock size={18} />
              How MarketLink Pre-Ordering Works
            </h2>
            <span className={styles.howSubtitle}>Skip long morning queues & secure seasonal delicacies</span>
          </div>
          <div className={styles.howGrid}>
            <div className={styles.howCard}>
              <div className={styles.howStepNum}>1</div>
              <div className={styles.howCardContent}>
                <h4>Browse Real-Time Harvests</h4>
                <p>Producers list weekly items straight from the fields and kitchens with live stock counts.</p>
              </div>
            </div>
            <div className={styles.howCard}>
              <div className={styles.howStepNum}>2</div>
              <div className={styles.howCardContent}>
                <h4>Reserve Without Paying Upfront</h4>
                <p>Lock in fragile items like heritage berries and wild mushrooms before cut-off.</p>
              </div>
            </div>
            <div className={styles.howCard}>
              <div className={styles.howStepNum}>3</div>
              <div className={styles.howCardContent}>
                <h4>Collect at the Stall</h4>
                <p>Walk straight to your stall on market day with your collection code—your box is waiting.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Produce Browsing Catalogue */}
        <BrowseView audience="guest" />

        {/* Produce Storage & Handling Tips */}
        <section className={styles.tipsSection} aria-labelledby="produce-wisdom-title">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionPre}>Grower Wisdom</div>
            <h2 id="produce-wisdom-title" className={styles.sectionTitle}>
              Peak Freshness & Kitchen Storage
            </h2>
            <p className={styles.sectionSub}>
              Directly harvested food behaves differently than cold-storage supermarket produce. Here is how our growers recommend storing your basket.
            </p>
          </div>

          <div className={styles.tipsGrid}>
            {tips.map((tip, idx) => (
              <div key={idx} className={styles.tipCard}>
                <span className={styles.tipBadge}>{tip.category}</span>
                <h3 className={styles.tipTitle}>{tip.title}</h3>
                <p className={styles.tipDesc}>{tip.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Register CTA Banner */}
        <aside className={styles.registerBanner}>
          <div className={styles.registerContent}>
            <h3>Ready to secure your weekend food?</h3>
            <p>
              Sign up for a free MarketLink account to pre-order directly from farmers, build personalized market routes, and receive harvest alerts.
            </p>
          </div>
          <Link to="/register?role=buyer" className={styles.registerAction}>
            <span>Create Free Account</span>
            <ArrowRight size={16} />
          </Link>
        </aside>
      </div>
    </Page>
  );
}

export default Products;
