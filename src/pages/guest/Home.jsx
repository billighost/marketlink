import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Check } from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatusDot from '@/components/ui/StatusDot';
import WaveDivider from '@/components/layout/WaveDivider';
import Illustration from '@/components/domain/Illustration';
import FarmerCard from '@/components/domain/FarmerCard';
import { PRICE_BOARD_ITEMS, FEATURED_FARMERS } from '@/data/placeholders';
import styles from './Home.module.css';

/**
 * Home landing page for MarketLink.
 * Clean, warm, and inviting farmers market pre-order showcase.
 */
export function Home() {
  useDocumentTitle('Home · MarketLink');

  return (
    <div className={styles.page}>
      {/* ---------------- SECTION 1: HERO ---------------- */}
      <section className={styles.heroSection}>
        <div className={`container ${styles.heroContainer}`}>
          {/* Hero Left: Copy & Actions */}
          <div className={styles.heroCopy}>
            <p className={styles.overline}>Elm Street Market · Saturdays</p>
            <h1 className={styles.heroTitle}>
              Fresh from the farm,{' '}
              <span className={styles.underlinedWord}>
                ready
                <svg
                  className={styles.wavyUnderline}
                  viewBox="0 0 100 12"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M0,6 Q25,0 50,6 T100,6" />
                </svg>
              </span>{' '}
              when you arrive.
            </h1>
            <p className={styles.heroLead}>
              Pre-order from the farmers you know and pick it up at the market.
              No delivery, no fuss. You pay when you collect.
            </p>
            <div className={styles.heroActions}>
              <Button
                as={Link}
                to={`${PATHS.REGISTER}?role=customer`}
                variant="primary"
                size="md"
              >
                Create your free account
              </Button>
              <a href="#how-it-works" className={styles.seeHowLink}>
                See how it works
              </a>
            </div>
            <p className={styles.heroFootnote}>
              Free for Customers. Pay in person at pickup.
            </p>
          </div>

          {/* Hero Right: Stall illustration panel */}
          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.visualPanel}>
              <Illustration name="stall" size="lg" className={styles.mainStall} />
              <Illustration name="carrot" size="sm" className={styles.floatCarrot} />
              <Illustration name="leaves" size="sm" className={styles.floatLeaves} />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- SECTION 2: HOW IT WORKS ---------------- */}
      <section id="how-it-works" className={styles.howItWorksSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>How it works</h2>
            <p className={styles.sectionSubtitle}>Three simple steps, no account juggling.</p>
          </div>

          <div className="grid3">
            {/* Step 1 */}
            <Card padding="none" className={styles.stepCard}>
              <div className={styles.stepCardTop}>
                <Illustration name="basket" size="md" />
                <span className={styles.stepNumber}>1</span>
              </div>
              <div className={styles.stepCardBody}>
                <h3 className={styles.stepTitle}>Browse the market</h3>
                <p className={styles.stepText}>
                  See which Farmers are at your market this week and what they have.
                </p>
              </div>
            </Card>

            {/* Step 2 */}
            <Card padding="none" className={styles.stepCard}>
              <div className={styles.stepCardTop}>
                <Illustration name="tomato" size="md" />
                <span className={styles.stepNumber}>2</span>
              </div>
              <div className={styles.stepCardBody}>
                <h3 className={styles.stepTitle}>Pre-order what you want</h3>
                <p className={styles.stepText}>
                  Pick your items and a pickup time. Change your mind before the cut-off.
                </p>
              </div>
            </Card>

            {/* Step 3 */}
            <Card padding="none" className={styles.stepCard}>
              <div className={styles.stepCardTop}>
                <Illustration name="loaf" size="md" />
                <span className={styles.stepNumber}>3</span>
              </div>
              <div className={styles.stepCardBody}>
                <h3 className={styles.stepTitle}>Pick up and pay</h3>
                <p className={styles.stepText}>
                  Collect your order at the stall and pay the Farmer in person.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ---------------- SECTION 3: THE PRICE BOARD (CANVAS BAND) ---------------- */}
      <WaveDivider shape="soft" />
      <section className={styles.priceBoardSection}>
        <div className="containerNarrow">
          <div className={styles.boardHeader}>
            <h2 className={styles.sectionTitle}>This Saturday at Elm Street Market</h2>
            <div className={styles.marketMeta}>
              <MapPin size={16} strokeWidth={1.5} aria-hidden="true" />
              <span>Elm Street · 8am to 1pm · Order by Friday 6pm</span>
            </div>
          </div>

          {/* Chalkboard / Cafe Menu list */}
          <div className={styles.menuBoard}>
            <ul className={styles.menuList} role="list">
              {PRICE_BOARD_ITEMS.map((item) => (
                <li key={item.id} className={styles.menuItem}>
                  <div className={styles.itemLeft}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemFarmer}>{item.farmer}</span>
                  </div>
                  <span className={styles.dottedLeader} aria-hidden="true" />
                  <div className={styles.itemRight}>
                    <span className={styles.itemPrice}>
                      {item.price} <span className={styles.unit}>/ {item.unit}</span>
                    </span>
                    <StatusDot label={item.status} tone={item.statusTone} />
                  </div>
                </li>
              ))}
            </ul>

            <div className={styles.boardFooter}>
              <Link to={PATHS.LOGIN} className={styles.boardSignInLink}>
                Sign in to pre-order
              </Link>
            </div>
          </div>
        </div>
      </section>
      <WaveDivider shape="gentle" flip />

      {/* ---------------- SECTION 4: MEET THE FARMERS ---------------- */}
      <section className={styles.farmersSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Meet the people behind the food</h2>
            <p className={styles.sectionSubtitle}>
              Small farms and family bakers from around the market.
            </p>
          </div>

          <div className="grid3">
            {FEATURED_FARMERS.map((farmer) => (
              <FarmerCard key={farmer.id} farmer={farmer} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- SECTION 5: FOR CUSTOMERS AND FARMERS ---------------- */}
      <section className={styles.splitSection}>
        <div className="container">
          <div className={styles.splitGrid}>
            {/* Customer column */}
            <div className={styles.splitCol}>
              <h2 className={styles.splitTitle}>For Customers</h2>
              <ul className={styles.checkList} role="list">
                <li className={styles.checkItem}>
                  <Check size={18} strokeWidth={1.5} className={styles.checkIcon} aria-hidden="true" />
                  <span>Know what is in stock before you go</span>
                </li>
                <li className={styles.checkItem}>
                  <Check size={18} strokeWidth={1.5} className={styles.checkIcon} aria-hidden="true" />
                  <span>Reserve your favourites so they are never sold out</span>
                </li>
                <li className={styles.checkItem}>
                  <Check size={18} strokeWidth={1.5} className={styles.checkIcon} aria-hidden="true" />
                  <span>Save the farmers you love</span>
                </li>
              </ul>
              <Link to={`${PATHS.REGISTER}?role=customer`} className={styles.splitLink}>
                Create a Customer account
              </Link>
            </div>

            {/* Hairline desktop divider */}
            <div className={styles.splitDivider} aria-hidden="true" />

            {/* Farmer column */}
            <div className={styles.splitCol}>
              <h2 className={styles.splitTitle}>For Farmers</h2>
              <ul className={styles.checkList} role="list">
                <li className={styles.checkItem}>
                  <Check size={18} strokeWidth={1.5} className={styles.checkIcon} aria-hidden="true" />
                  <span>Publish your weekly stock in minutes</span>
                </li>
                <li className={styles.checkItem}>
                  <Check size={18} strokeWidth={1.5} className={styles.checkIcon} aria-hidden="true" />
                  <span>See pre-orders before market day</span>
                </li>
                <li className={styles.checkItem}>
                  <Check size={18} strokeWidth={1.5} className={styles.checkIcon} aria-hidden="true" />
                  <span>Reply to reviews and build regulars</span>
                </li>
              </ul>
              <Link to={`${PATHS.REGISTER}?role=farmer`} className={styles.splitLink}>
                Create a Farmer account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- SECTION 6: QUIET QUOTE ---------------- */}
      <section className={styles.quoteSection}>
        <div className="containerNarrow">
          <figure className={styles.quoteFigure}>
            <blockquote className={styles.blockquote}>
              “I used to guess how much to bring. Now I know before I load the truck.”
            </blockquote>
            <figcaption className={styles.quoteAuthor}>
              Marta, Riverbend Farm
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ---------------- SECTION 7: CLOSING CALL TO ACTION ---------------- */}
      <section className={styles.ctaSection}>
        <div className="containerNarrow">
          <div className={styles.ctaInner}>
            <h2 className={styles.ctaTitle}>Your market is waiting</h2>
            <p className={styles.ctaSubtitle}>Join for free and see what is fresh this week.</p>
            <div className={styles.ctaActions}>
              <Button
                as={Link}
                to={PATHS.REGISTER}
                variant="primary"
                size="md"
              >
                Create your free account
              </Button>
              <Link to={PATHS.LOGIN} className={styles.ctaSignInLink}>
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
