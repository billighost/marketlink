import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import Button from '@/components/ui/Button';
import WaveDivider from '@/components/layout/WaveDivider';
import Illustration from '@/components/domain/Illustration';
import styles from './Home.module.css';

/**
 * Price board market offerings for Elm Street Saturday market
 */
const PRICE_BOARD_ITEMS = [
  {
    id: 'item-1',
    stall: 'Stall 4',
    name: 'Heirloom tomatoes',
    farmer: 'Riverbend Farm',
    price: '$4.50',
    unit: 'lb',
    status: 'In stock',
    statusTone: 'herb',
  },
  {
    id: 'item-2',
    stall: 'Stall 2',
    name: 'Sourdough loaf',
    farmer: 'Oak & Mill Bakery',
    price: '$7.00',
    unit: 'loaf',
    status: 'In stock',
    statusTone: 'herb',
  },
  {
    id: 'item-3',
    stall: 'Stall 9',
    name: 'Wildflower honey',
    farmer: 'Hollow Creek Apiary',
    price: '$9.50',
    unit: 'jar',
    status: 'Low stock',
    statusTone: 'carrot',
  },
  {
    id: 'item-4',
    stall: 'Stall 4',
    name: 'Rainbow carrots',
    farmer: 'Riverbend Farm',
    price: '$4.50',
    unit: 'bunch',
    status: 'In stock',
    statusTone: 'herb',
  },
  {
    id: 'item-5',
    stall: 'Stall 11',
    name: 'Farm eggs',
    farmer: 'Willow Bend Poultry',
    price: '$6.00',
    unit: 'dozen',
    status: 'In stock',
    statusTone: 'herb',
  },
  {
    id: 'item-6',
    stall: 'Stall 9',
    name: 'Rhubarb',
    farmer: 'Hollow Creek Apiary',
    price: '$3.50',
    unit: 'bunch',
    status: 'Low stock',
    statusTone: 'carrot',
  },
];

/**
 * Home page: Hand-crafted farmers market pre-order showcase.
 */
export function Home() {
  useDocumentTitle('Home · MarketLink');

  return (
    <div className={styles.page}>
      {/* ---------------- SECTION 1: HERO ("The market table, seen from above") ---------------- */}
      <section className={styles.heroSection}>
        <div className={styles.heroStage}>
          {/* Centred protected reading column */}
          <div className={styles.readingColumn}>
            <p className={styles.marketOverline}>Elm Street Market · Saturdays, 8am to 1pm</p>
            <h1 className={styles.heroTitle}>
              Fresh from the farm,{' '}
              <span className={styles.readyUnderlineWrap}>
                ready
                <svg
                  className={styles.wavyUnderline}
                  viewBox="0 0 100 12"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M0,6 Q25,0 50,6 T100,6" />
                </svg>
              </span>{' '}
              when you arrive.
            </h1>
            <p className={styles.heroLead}>
              Pre-order from the Farmers you know. Collect at the stall. Pay when you pick up.
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
              <Button
                as="a"
                href="#price-board"
                variant="secondary"
                size="md"
              >
                See this Saturday's board
              </Button>
            </div>
            <p className={styles.heroFootnote}>
              Free for Customers. No delivery. Pay in person.
            </p>
          </div>

          {/* Decorative flat-lay scattered produce composition */}
          <div className={styles.produceCluster} aria-hidden="true">
            {/* 1. Basket of tomatoes (Hero item with tag) */}
            <div className={`${styles.produceItem} ${styles.itemTomatoes}`}>
              <Illustration name="basket-tomatoes" size="lg" />
              <div className={styles.tag}>
                <span className={styles.tagTwine} />
                <span className={styles.tagHole} />
                <span className={styles.tagName}>Heirloom tomatoes</span>
                <span className={styles.tagPrice}>$4.50 / lb</span>
              </div>
            </div>

            {/* 2. Crate of carrots (With tag) */}
            <div className={`${styles.produceItem} ${styles.itemCarrots}`}>
              <Illustration name="crate-carrots" size="lg" />
              <div className={styles.tag} style={{ '--tag-r': '-4deg' }}>
                <span className={styles.tagTwine} />
                <span className={styles.tagHole} />
                <span className={styles.tagName}>Rainbow carrots</span>
                <span className={styles.tagPrice}>$4.50 / bunch</span>
              </div>
            </div>

            {/* 3. Sourdough boule (No tag) */}
            <div className={`${styles.produceItem} ${styles.itemSourdough}`}>
              <Illustration name="sourdough-boule" size="lg" />
            </div>

            {/* 4. Farm eggs carton (Tablet & Desktop only, no tag) */}
            <div className={`${styles.produceItem} ${styles.itemEggs} ${styles.tabletDesktopItem}`}>
              <Illustration name="egg-carton" size="md" />
            </div>

            {/* 5. Beetroot bunch (Desktop only, no tag) */}
            <div className={`${styles.produceItem} ${styles.itemBeets} ${styles.desktopOnlyItem}`}>
              <Illustration name="beet-bunch" size="md" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- SECTION 2: HOW IT WORKS (Staggered editorial steps) ---------------- */}
      <section className={styles.howSection}>
        <div className="container">
          <div className={styles.sectionHeadingGroupCentered}>
            <h2 className={styles.sectionTitle}>How it works</h2>
            <p className={styles.sectionSubtitle}>Three simple steps from harvest to Saturday market bag.</p>
          </div>

          <div className={styles.stepsRow}>
            {/* Connecting wood dotted path */}
            <svg
              className={styles.dottedPathSvg}
              viewBox="0 0 600 80"
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M50,20 C180,60 320,10 550,50" />
            </svg>

            {/* Step 1 */}
            <div className={styles.stepBlock}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNumeral}>1</span>
                <Illustration name="basket" size="sm" />
              </div>
              <h3 className={styles.stepTitle}>Look at Saturday's board</h3>
              <p className={styles.stepCopy}>
                See which Farmers are coming to Elm Street and what was harvested this week.
              </p>
            </div>

            {/* Step 2 */}
            <div className={styles.stepBlock}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNumeral}>2</span>
                <Illustration name="paper-bag-pears" size="sm" />
              </div>
              <h3 className={styles.stepTitle}>Reserve before the cut-off</h3>
              <p className={styles.stepCopy}>
                Order your picks before Friday at 6pm. The Farmers harvest to order.
              </p>
            </div>

            {/* Step 3 */}
            <div className={styles.stepBlock}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNumeral}>3</span>
                <Illustration name="sourdough-boule" size="sm" />
              </div>
              <h3 className={styles.stepTitle}>Collect it at the stall</h3>
              <p className={styles.stepCopy}>
                Your harvest is boxed and waiting under the awning. Pay in person when you pick up.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- SECTION 3: PRICE BOARD (Chalkboard style double frame) ---------------- */}
      <WaveDivider shape="soft" />
      <section id="price-board" className={styles.boardSection}>
        <div className="containerNarrow">
          <div className={styles.boardHeader}>
            <h2 className={styles.sectionTitle}>This Saturday at Elm Street Market</h2>
            <p className={styles.boardTagline}>
              Elm Street Market Square · Saturdays, 8am to 1pm
            </p>
          </div>

          <div className={styles.chalkboardFrameOuter}>
            <div className={styles.chalkboardFrameInner}>
              <div className={styles.boardTopBar}>
                <span className={styles.boardBadge}>Today's Board</span>
                <span className={styles.cutoffNotice}>Order by Friday, 6pm</span>
              </div>

              <ul className={styles.boardList} role="list">
                {PRICE_BOARD_ITEMS.map((item) => (
                  <li key={item.id} className={styles.boardItem}>
                    <div className={styles.itemLeftCol}>
                      <span className={styles.stallBadge}>{item.stall}</span>
                      <span className={styles.itemProduceName}>{item.name}</span>
                      <span className={styles.itemFarmName}>({item.farmer})</span>
                    </div>
                    <span className={styles.dottedLeaderLine} aria-hidden="true" />
                    <div className={styles.itemRightCol}>
                      <span className={styles.itemPriceText}>
                        {item.price} <span className={styles.itemUnitText}>/ {item.unit}</span>
                      </span>
                      {item.statusTone === 'herb' ? (
                        <span className={styles.statusHerb}>In stock</span>
                      ) : (
                        <span className={styles.statusCarrot}>Low stock</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className={styles.boardFooterRow}>
                <p className={styles.boardFooterNote}>
                  Prices set directly by the growers. No platform markups.
                </p>
                <Link to={PATHS.LOGIN} className={styles.boardSignInLink}>
                  Sign in to pre-order
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <WaveDivider shape="gentle" flip />

      {/* ---------------- SECTION 4: MEET THE FARMERS (Magazine editorial spread) ---------------- */}
      <section className={styles.farmersSection}>
        <div className="container">
          <div className={styles.sectionHeadingGroup}>
            <h2 className={styles.sectionTitle}>Meet the people behind the food</h2>
            <p className={styles.sectionSubtitle}>
              Small farms and family bakers who set up on Elm Street every weekend.
            </p>
          </div>

          <div className={styles.editorialSpread}>
            {/* Featured Farmer Large Panel */}
            <div className={styles.featuredFarmerPanel}>
              <div className={styles.featuredFarmerImageCol}>
                <img
                  src="/images/riverbend-farm.jpg"
                  alt="Riverbend Farm stall at Elm Street Market with wooden crates of fresh vegetables"
                  className={styles.featuredFarmerImg}
                  data-aspect="16/10"
                  loading="lazy"
                />
              </div>
              <div className={styles.featuredFarmerInfoCol}>
                <span className={styles.farmerStallBadge}>Selling at Elm Street since 2016</span>
                <h3 className={styles.farmerNameLarge}>Riverbend Farm</h3>
                <p className={styles.farmerStory}>
                  Marta and Tomas tend twelve acres of alluvial soil along the riverbank.
                  Known for heirloom Brandywines, sweet Nantes carrots, and tender salad greens picked at dawn.
                </p>
                <p className={styles.farmerKnownFor}>
                  Known for: Heirloom tomatoes & baby carrots · Stall 4
                </p>
              </div>
            </div>

            {/* Two compact rows beneath */}
            <div className={styles.farmerCompactRows}>
              <div className={styles.compactFarmerRow}>
                <span className={styles.compactFarmerName}>Oak & Mill Bakery</span>
                <span className={styles.compactFarmerSpec}>Artisan sourdough & morning pastries</span>
                <span className={styles.dottedLeaderLine} aria-hidden="true" />
                <span className={styles.compactFarmerStall}>Saturdays · Stall 2</span>
              </div>

              <div className={styles.compactFarmerRow}>
                <span className={styles.compactFarmerName}>Hollow Creek Apiary</span>
                <span className={styles.compactFarmerSpec}>Raw wildflower honey, honeycomb & preserves</span>
                <span className={styles.dottedLeaderLine} aria-hidden="true" />
                <span className={styles.compactFarmerStall}>Saturdays · Stall 9</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- SECTION 5: FOR CUSTOMERS & FOR FARMERS (Asymmetric offset statements) ---------------- */}
      <section className={styles.audiencesSection}>
        <div className="container">
          <div className={styles.audienceLayout}>
            {/* Customer Statement (Left aligned) */}
            <div className={styles.audienceBlockCustomer}>
              <p className={styles.audienceStatement}>
                Shop your market with confidence. You know what's in stock before you walk out the door, and your weekend sourdough is held safely behind the counter.
              </p>
              <Link to={`${PATHS.REGISTER}?role=customer`} className={styles.audienceActionLink}>
                Create a Customer account →
              </Link>
            </div>

            {/* Farmer Statement (Right offset) */}
            <div className={styles.audienceBlockFarmer}>
              <p className={styles.audienceStatement}>
                Harvest with certainty. Know your orders before you hitch the trailer on Saturday morning, and build loyal regulars without paying commission.
              </p>
              <Link to={`${PATHS.REGISTER}?role=farmer`} className={styles.audienceActionLink}>
                Create a Farmer account →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- SECTION 6: CLOSING CALL TO ACTION ("See you Saturday.") ---------------- */}
      <section className={styles.closingSection}>
        <div className="container">
          <div className={styles.closingContent}>
            <div className={styles.closingTextCol}>
              <h2 className={styles.closingTitle}>See you Saturday.</h2>
              <p className={styles.closingSub}>
                Sign up now and your first pre-order can be ready by the weekend.
              </p>
            </div>
            <div className={styles.closingActionCol}>
              <Button
                as={Link}
                to={`${PATHS.REGISTER}?role=customer`}
                variant="primary"
                size="md"
              >
                Create your free account
              </Button>
              <p className={styles.closingSignInText}>
                Already have an account?{' '}
                <Link to={PATHS.LOGIN} className={styles.closingSignInLink}>
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
