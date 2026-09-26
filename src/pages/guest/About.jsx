import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Leaf,
  Store,
  Clock,
  Heart,
  Users,
  Award,
  CheckCircle2,
  Calendar,
  Sparkles,
  MapPin,
  ChevronRight,
  Quote,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import siteContent from '@/content/siteContent';
import styles from './About.module.css';
const STATS = [
  { value: '40+', label: 'Independent Growers', subtext: 'Within 90 miles of our markets' },
  { value: '4', label: 'Historic Markets', subtext: 'Regional neighborhood markets' },
  { value: '100%', label: 'Direct Producer Takings', subtext: '0% platform take from stall sales' },
  { value: '14,000+', label: 'Harvest Pre-Orders', subtext: 'Fulfilled without food waste' },
];
const VALUES = [
  {
    numeral: '01',
    title: '100% Producer-Only Guarantee',
    highlight: 'No resellers, no wholesale markups.',
    description:
      'Every heirloom tomato, sourdough boule, and raw wildflower jar sold through MarketLink is harvested or crafted by the very grower standing behind the stall. We audit every farm to ensure authentic regional provenance.',
    icon: ShieldCheck,
  },
  {
    numeral: '02',
    title: 'Calm, Guaranteed Saturday Mornings',
    highlight: 'Sleep in knowing your favorites are set aside.',
    description:
      'No more arriving at 8:30 AM to find wooden crates already picked clean. Reserve your picks during the week; your labeled brown paper tote will be waiting safely under the canopy until you arrive.',
    icon: ShoppingBag,
  },
  {
    numeral: '03',
    title: 'Zero Food Waste by Design',
    highlight: 'Harvested specifically to demand, never in excess.',
    description:
      'Conventional farming discards up to 30% of harvested produce that spoils in trucks or unsold crates. MarketLink growers receive pre-order manifests on Friday evening and harvest strictly to order at dawn.',
    icon: Leaf,
  },
  {
    numeral: '04',
    title: 'Dignified Economics for Family Farms',
    highlight: 'Farmers set their prices and keep 100% of proceeds.',
    description:
      'Big retail chains pay farmers as little as 14 cents on the retail food dollar. On MarketLink, growers pocket 100% of their listed price, paid directly to them in person at Saturday collection.',
    icon: Heart,
  },
];
const TIMELINE_STEPS = [
  {
    step: '1',
    time: 'Wednesday & Thursday',
    title: 'Growers Publish Available Harvest',
    description:
      'Farmers inspect their fields and orchard rows, listing the exact crops reaching peak flavor for the upcoming weekend.',
    badge: 'Field Inspection',
  },
  {
    step: '2',
    time: 'Thursday through Friday 6:00 PM',
    title: 'Neighbours Reserve Their Weekly Baskets',
    description:
      'Customers browse their neighborhood stalls, building a customized pre-order without prepayment or subscription lock-ins.',
    badge: 'Pre-Order Window',
  },
  {
    step: '3',
    time: 'Saturday 5:00 AM Dawn',
    title: 'Harvested, Packed & Labeled to Order',
    description:
      'Produce is clipped at dawn while still cool with morning dew, packed into personalized totes, and loaded for the drive into town.',
    badge: 'Dawn Harvest',
  },
  {
    step: '4',
    time: 'Saturday 8:00 AM – 2:00 PM',
    title: 'Pick Up & Pay Directly at the Stall',
    description:
      'Walk up to the stall canopy, greet your grower, inspect your fresh harvest, and settle payment directly in person.',
    badge: 'Market Day',
  },
];
const TEAM = [
  {
    name: 'Adeleke Aliyah',
    role: 'Co-Founder & Organic Soil Cultivator',
    farm: 'Riverbend Farm (Hudson Valley, NY)',
    image: '../asset/Aliyah.jpeg',
    bio: 'Fourth-generation grower managing 45 certified organic acres along the Hudson. Elena co-founded MarketLink to protect family farms from predatory distributor margins.',
  },
  {
    name: 'billal',
    role: 'Regional Market Operations Director',
    farm: 'Greenwich Village Farmers Alliance',
    image: '/images/farmer-marcus.jpg',
    bio: 'Former agricultural economist and fifteen-year market manager dedicated to revitalizing historic urban square markets across Lower Manhattan.',
  },
  {
    name: 'ayomide',
    role: 'Heritage Grains Specialist & Artisan Baker',
    farm: 'Oak & Mill Bakery (Kingston, NY)',
    image: '/images/hero-carrots.jpg',
    bio: 'Priya champions stone-milled New York wheat varieties, baking naturally fermented sourdough boules in wood-fired stone deck ovens.',
  },
  {
    name: 'malik',
    role: 'Food Access & Community Partnerships',
    farm: 'Orchard & Grove Collective',
    image: '/images/farmer-david.jpg',
    bio: 'David directs our partnerships with SNAP/EBT and FMNP programs, ensuring that fresh farm produce is accessible to every community household.',
  },
];
const FEATURED_MARKETS = [
  { name: 'Greenwich Village Farmers Market', schedule: 'Saturdays · 8AM–2PM', location: 'Abingdon Square Park' },
  { name: 'Union Square Greenmarket', schedule: 'Wed, Fri, Sat · 8AM–6PM', location: 'Union Square North & West' },
  { name: 'Brooklyn Grand Army Plaza', schedule: 'Saturdays · 8AM–4PM', location: 'Prospect Park Entrance' },
  { name: 'Chelsea Farmers Market', schedule: 'Sundays · 9AM–3PM', location: 'W 23rd St & 9th Ave' },
];
export function About() {
  useDocumentTitle('About MarketLink — Connecting Soil to Table');
  return (
    <div className={styles.page}>
      {}
      <section className={styles.heroSection}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.badgeRow}>
              <span className={styles.heroBadge}>
                <Leaf size={13} className={styles.badgeIcon} />
                Our Story & Heritage
              </span>
              <span className={styles.heroBadgeAlt}>
                Est. 2018 · Hudson Valley & New York
              </span>
            </div>
            <h1 className={styles.heroTitle}>
              Rooted in the Soil. <br />
              <span className={styles.titleAccent}>Dedicated to the Neighborhood Table.</span>
            </h1>
            <p className={styles.heroLead}>
              MarketLink was founded with a straightforward conviction: Saturday morning market trips
              should be calm, food should travel miles rather than continents, and family farmers should
              always receive fair value for honest labor.
            </p>
            <div className={styles.heroActionRow}>
              <Link to={PATHS.MARKETS} className={styles.heroPrimaryBtn}>
                <Store size={17} />
                <span>Explore Our 8 Markets</span>
              </Link>
              <Link to={PATHS.PRODUCTS} className={styles.heroSecondaryBtn}>
                <span>Browse Seasonal Harvest</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
      {}
      <section className={styles.statsSection}>
        <div className="container">
          <div className={styles.statsGrid}>
            {STATS.map((stat, idx) => (
              <div key={idx} className={styles.statCard}>
                <span className={styles.statValue}>{stat.value}</span>
                <strong className={styles.statLabel}>{stat.label}</strong>
                <span className={styles.statSubtext}>{stat.subtext}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      {}
      <section className={styles.storySection}>
        <div className="container">
          <div className={styles.storyLayout}>
            {}
            <div className={styles.storyTextCol}>
              <span className={styles.sectionKicker}>The Origin</span>
              <h2 className={styles.sectionHeading}>
                Why Saturday mornings needed a quieter, better way
              </h2>
              <p className={styles.storyParagraph}>
                You set your alarm on Saturday morning, navigate weekend traffic, hunt for parking
                around Abingdon Square, and walk eagerly toward the green-and-white canopies—only to discover
                that the heirloom Brandywines and country sourdough loaves were picked clean twenty minutes earlier.
              </p>
              <p className={styles.storyParagraph}>
                Meanwhile, eighty miles north in Dutchess and Columbia counties, independent growers and
                small-batch bakers load their delivery flatbeds at 4:30 AM in the pitch dark. They guess
                how many crates will sell and how much tender produce will wilt under the hot summer sun.
              </p>
              <p className={styles.storyParagraph}>
                <strong>MarketLink was created to solve both sides of that equation.</strong> By enabling
                thoughtful pre-orders throughout the week, farmers harvest only what neighbours have
                reserved, and your brown paper tote is safely set aside under the tent canopy waiting for your arrival.
              </p>
              <div className={styles.storyHighlightBox}>
                <Quote size={24} className={styles.quoteIcon} />
                <p className={styles.quoteText}>
                  “The deepest connection to your food is looking the grower in the eye across a crate
                  of fresh radishes. We built technology not to replace that handshake, but to make sure
                  it happens every weekend without stress.”
                </p>
                <span className={styles.quoteAuthor}>— Elena Vance, Co-Founder & 4th Generation Grower</span>
              </div>
            </div>
            {}
            <div className={styles.storyVisualCol}>
              <div className={styles.imageStack}>
                <div className={styles.ambientGlow} aria-hidden="true" />
                <div className={styles.mainImageWrap}>
                  <img
                    src="/images/market-morning.jpg"
                    alt="Bustling morning at the farmers market with wooden crates full of fresh produce"
                    className={styles.storyMainImg}
                  />
                  <div className={styles.imageShine} aria-hidden="true" />
                  <div className={styles.imageOverlayPill}>
                    <MapPin size={13} className={styles.pillPinIcon} />
                    <span>Abingdon Square Farmers Market, 8:00 AM</span>
                  </div>
                  <div className={styles.experienceTag}>
                    <Sparkles size={11} className={styles.tagSparkle} />
                    <span>Saturday Harvest</span>
                  </div>
                </div>
                <div className={styles.secondaryImageWrap}>
                  <img
                    src="/images/riverbend-farm.jpg"
                    alt="Riverbend Farm fields in Hudson Valley"
                    className={styles.storySecondaryImg}
                  />
                  <div className={styles.imageShine} aria-hidden="true" />
                  <div className={styles.secondaryBadge}>
                    <span className={styles.pulseDot} aria-hidden="true" />
                    <span>100% Certified Organic Soil</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {}
      <section className={styles.valuesSection}>
        <div className="container">
          <div className={styles.valuesHeader}>
            <span className={styles.sectionKickerCenter}>Our Principles</span>
            <h2 className={styles.sectionHeadingCenter}>What we stand for every Saturday</h2>
            <p className={styles.sectionLeadCenter}>
              We are deliberately not a nationwide delivery warehouse or venture-backed grocery app.
              We are a community-operated utility preserving regional agriculture.
            </p>
          </div>
          <div className={styles.valuesGrid}>
            {VALUES.map((val) => {
              const IconComp = val.icon;
              return (
                <div key={val.numeral} className={styles.valueCard}>
                  <div className={styles.valueCardTop}>
                    <span className={styles.valueNumeral}>{val.numeral}</span>
                    <div className={styles.valueIconWrap}>
                      <IconComp size={20} />
                    </div>
                  </div>
                  <h3 className={styles.valueTitle}>{val.title}</h3>
                  <span className={styles.valueHighlight}>{val.highlight}</span>
                  <p className={styles.valueDesc}>{val.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {}
      <section className={styles.timelineSection}>
        <div className="container">
          <div className={styles.timelineHeader}>
            <span className={styles.sectionKickerCenterLight}>The Weekly Rhythm</span>
            <h2 className={styles.sectionHeadingCenterLight}>How MarketLink connects soil to table</h2>
            <p className={styles.sectionLeadCenterLight}>
              Four straightforward steps from midweek field checks to your Saturday morning paper tote.
            </p>
          </div>
          <div className={styles.timelineGrid}>
            {TIMELINE_STEPS.map((item, idx) => (
              <div key={idx} className={styles.timelineCard}>
                <div className={styles.timelineCardHead}>
                  <div className={styles.stepBadge}>{item.step}</div>
                  <span className={styles.timelineCategoryPill}>{item.badge}</span>
                </div>
                <span className={styles.timelineTime}>{item.time}</span>
                <h3 className={styles.timelineTitle}>{item.title}</h3>
                <p className={styles.timelineText}>{item.description}</p>
              </div>
            ))}
          </div>
          <div className={styles.timelineNotice}>
            <div className={styles.noticeIconWrap}>
              <CheckCircle2 size={18} />
            </div>
            <p className={styles.noticeText}>
              <strong>Direct in-person pickup only:</strong> No cardboard shipping boxes, no third-party delivery couriers,
              and no online payment surcharges. You pay the grower directly at collection.
            </p>
          </div>
        </div>
      </section>
      {}
      <section className={styles.teamSection}>
        <div className="container">
          <div className={styles.teamHeader}>
            <span className={styles.sectionKicker}>Community Stewards</span>
            <h2 className={styles.sectionHeading}>The people behind the stalls and screens</h2>
            <p className={styles.teamLead}>
              Market organizers, multi-generation family growers, and volunteers united around regional food dignity.
            </p>
          </div>
          <div className={styles.teamGrid}>
            {siteContent.team.map((member, idx) => (
              <div key={idx} className={styles.teamCard}>
                <div className={styles.teamImgWrap}>
                  {member.image ? (
                    <img src={member.image} alt={member.name} className={styles.teamImg} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--color-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-beet)', fontFamily: 'var(--font-head)', fontSize: 'var(--text-h3)' }}>
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className={styles.teamCardBody}>
                  <h3 className={styles.memberName}>{member.name}</h3>
                  <span className={styles.memberRole}>{member.role}</span>
                  <p className={styles.memberBio}>{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {}
      <section className={styles.marketsPreviewSection}>
        <div className="container">
          <div className={styles.marketsCard}>
            <div className={styles.marketsText}>
              <span className={styles.sectionKicker}>Neighborhood Network</span>
              <h2 className={styles.marketsHeading}>Operating at 8 historic square markets</h2>
              <p className={styles.marketsParagraph}>
                From the cobbled streets of the West Village to the grand tree-lined arc of Prospect Park,
                our partner markets bring fresh Hudson Valley and regional harvests directly to neighborhood centers.
              </p>
              <div className={styles.marketsList}>
                {FEATURED_MARKETS.map((m, idx) => (
                  <div key={idx} className={styles.marketPillItem}>
                    <MapPin size={14} className={styles.marketPillIcon} />
                    <div>
                      <strong>{m.name}</strong>
                      <span>{m.schedule} · {m.location}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link to={PATHS.MARKETS} className={styles.viewMarketsBtn}>
                <span>View Full Market Directory & Schedule</span>
                <ChevronRight size={16} />
              </Link>
            </div>
            <div className={styles.marketsVisual}>
              <img
                src="/images/market-greenwich.jpg"
                alt="Greenwich Village Farmers Market sunny morning scene"
                className={styles.marketsImg}
              />
              <div className={styles.marketsImgTag}>
                <span>📍 Greenwich Village · Abingdon Square</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaCard}>
            <div className={styles.ctaBadgeRow}>
              <span className={styles.ctaBadge}>
                <Sparkles size={13} />
                Saturday Morning Tradition
              </span>
            </div>
            <h2 className={styles.ctaTitle}>
              Experience your neighborhood market <br />
              with certainty and ease this weekend.
            </h2>
            <p className={styles.ctaSubtitle}>
              Create your free account in under two minutes. No subscription fees, no locked contracts—just
              fresh harvest held safely for you under the canopy.
            </p>
            <div className={styles.ctaButtonGroup}>
              <Link
                to={`${PATHS.REGISTER}?role=customer`}
                className={styles.ctaPrimaryBtn}
              >
                <span>Create Your Free Account</span>
                <ArrowRight size={17} />
              </Link>
              <Link to={PATHS.CONTACT} className={styles.ctaSecondaryBtn}>
                <span>Contact Market Coordinators</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
export default About;
