import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShoppingBag,
  Leaf,
  Heart,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Clock,
  Store,
  Sparkles,
  Quote,
  UserCircle,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import Page from '@/components/layout/Page';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import billalImg from '@/asset/billal.png';
import ayoImg from '@/asset/ayo.png';
import malikImg from '@/asset/malik.png';
import aliyahImg from '@/asset/Aliyah.jpeg';
import styles from './About.module.css';

const STATS = [
  { value: '40+', label: 'Independent Growers', subtext: 'Within 90 miles of our markets' },
  { value: '4', label: 'Historic Markets', subtext: 'Regional neighborhood markets' },
  { value: '100%', label: 'Direct to Producers', subtext: '0% platform take from stall sales' },
  { value: '14,000+', label: 'Harvest Pre-Orders', subtext: 'Fulfilled without food waste' },
];

const VALUES = [
  {
    numeral: '01',
    title: '100% Producer-Only Guarantee',
    highlight: 'No resellers, no wholesale markups.',
    description:
      'Every heirloom tomato, sourdough boule, and raw wildflower jar sold through MarketLink is harvested or crafted by the grower standing behind the stall. We audit every farm to confirm regional provenance.',
    icon: ShieldCheck,
  },
  {
    numeral: '02',
    title: 'Calm, Guaranteed Saturday Mornings',
    highlight: 'Sleep in knowing your favorites are set aside.',
    description:
      'No more arriving at 8:30 AM to find wooden crates already picked clean. Reserve during the week and your labeled brown paper tote waits under the canopy until you arrive.',
    icon: ShoppingBag,
  },
  {
    numeral: '03',
    title: 'Zero Food Waste by Design',
    highlight: 'Harvested to demand, never in excess.',
    description:
      'Conventional farming discards up to 30% of harvested produce that spoils in trucks or unsold crates. MarketLink growers receive pre-order manifests on Friday evening and harvest strictly to order at dawn.',
    icon: Leaf,
  },
  {
    numeral: '04',
    title: 'Dignified Economics for Family Farms',
    highlight: 'Farmers set their prices and keep 100% of proceeds.',
    description:
      'Big retail chains pay farmers as little as 14 cents on the retail food dollar. On MarketLink, growers keep their full listed price, paid to them in person at Saturday collection.',
    icon: Heart,
  },
];

const TIMELINE_STEPS = [
  {
    step: '01',
    badge: 'Field Inspection',
    time: 'Wednesday & Thursday',
    title: 'Growers publish available harvest',
    description:
      'Farmers inspect their fields and orchard rows, listing the exact crops reaching peak flavor for the weekend.',
    icon: Leaf,
  },
  {
    step: '02',
    badge: 'Pre-Order Window',
    time: 'Thursday – Friday 6:00 PM',
    title: 'Neighbors reserve their weekly baskets',
    description:
      'Customers browse neighborhood stalls and build a pre-order with no prepayment or subscription lock-in.',
    icon: ShoppingBag,
  },
  {
    step: '03',
    badge: 'Dawn Harvest',
    time: 'Saturday 5:00 AM',
    title: 'Harvested, packed, and labeled to order',
    description:
      'Produce is clipped at dawn while still cool, packed into personalized totes, and driven into town.',
    icon: Clock,
  },
  {
    step: '04',
    badge: 'Market Day',
    time: 'Saturday 8:00 AM – 2:00 PM',
    title: 'Pick up and pay at the stall',
    description:
      'Walk up to the canopy, greet your grower, check your harvest, and pay in person.',
    icon: MapPin,
  },
];

const TEAM = [
  {
    name: 'Bello Bilal Olamiposi',
    role: 'Systems Architect & Software Engineer',
    image: billalImg,
    fallbackImage: '/images/team/billal.png',
    imagePosition: 'center 20%',
    bio: 'Self-taught systems architect and tech entrepreneur with a passion for civic platforms. Bilal began programming at 14 and has engineered digital products including DevDrill, Dezola Studio, and inDeck.',
  },
  {
    name: 'Ayomide Alao',
    role: 'Software Developer & Systems Engineer',
    image: ayoImg,
    fallbackImage: '/images/team/ayo.png',
    imagePosition: 'center 22%',
    bio: 'Self-taught software developer and systems engineer based in Ibadan. An alumnus of the ALX Software Engineering program, Ayomide specializes in web technologies and systems engineering at Aptech.',
  },
  {
    name: 'Okunola Abdulmaleek',
    role: 'Software Developer & Creative Technologist',
    image: malikImg,
    fallbackImage: '/images/team/malik.png',
    imagePosition: 'center 18%',
    bio: 'Creative technologist pursuing an ADSE at Aptech. Experienced in web development, databases, and digital products, Abdulmaleek is also building Mandrixx Music, a streaming platform.',
  },
  {
    name: 'Aliyah Adeleke',
    role: 'Software Developer & Team Leader',
    image: aliyahImg,
    fallbackImage: '/images/team/Aliyah.jpeg',
    imagePosition: 'center 12%',
    bio: 'Software developer and team leader skilled in React, React Native, and Node.js. Aliyah is passionate about engineering web and mobile solutions to real-life problems.',
  },
  {
    name: 'Olatoye Uthman',
    role: 'Product Specialist & Asset Generator',
    image: null,
    fallbackImage: null,
    imagePosition: 'center 20%',
    bio: 'Focused on product quality and visual identity, Uthman led product refining, asset generation, and creative production, making sure every interface detail and digital asset met a premium standard.',
  },
];

const FEATURED_MARKETS = [
  { name: 'Greenwich Village Farmers Market', schedule: 'Saturdays · 8AM to 2PM', location: 'Abingdon Square Park' },
  { name: 'Union Square Greenmarket', schedule: 'Wed, Fri, Sat · 8AM to 6PM', location: 'Union Square North & West' },
  { name: 'Brooklyn Grand Army Plaza', schedule: 'Saturdays · 8AM to 4PM', location: 'Prospect Park Entrance' },
  { name: 'Chelsea Farmers Market', schedule: 'Sundays · 9AM to 3PM', location: 'W 23rd St & 9th Ave' },
];

export function About() {
  useDocumentTitle('About MarketLink — Connecting Soil to Table');

  return (
    <Page width="wide" className={styles.page}>
      {/* ── 1. SIGNATURE GUEST HERO BANNER ────────────────────── */}
      <section className={styles.hero} aria-labelledby="about-hero-title">
        <div className={styles.heroGlow} aria-hidden="true" />
        
        <div className={styles.heroBadge}>
          <Leaf size={14} aria-hidden="true" />
          <span>Our Story & Heritage</span>
        </div>

        <h1 id="about-hero-title" className={styles.heroTitle}>
          Rooted in the Soil. <br />
          <span className={styles.heroTitleAccent}>Dedicated to the Neighborhood Table.</span>
        </h1>

        <p className={styles.heroLead}>
          MarketLink was founded with a straightforward conviction: Saturday morning market trips should be calm, food should travel miles rather than continents, and family farmers should always receive fair value for honest labor.
        </p>

        <div className={styles.heroPills}>
          <span className={styles.heroPill}>
            <Sparkles size={13} aria-hidden="true" />
            Est. 2018 · Regional Network
          </span>
          <span className={styles.heroPill}>
            <ShieldCheck size={13} aria-hidden="true" />
            100% Producer-Only Guarantee
          </span>
          <span className={styles.heroPill}>
            <Heart size={13} aria-hidden="true" />
            Zero Platform Cuts from Stalls
          </span>
        </div>

        <div className={styles.heroActions}>
          <Link to={PATHS.MARKETS} className={styles.heroPrimaryBtn}>
            <Store size={16} aria-hidden="true" />
            <span>Explore Our 4 Markets</span>
          </Link>
          <Link to={PATHS.PRODUCTS} className={styles.heroSecondaryBtn}>
            <span>Browse Seasonal Harvest</span>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* ── 2. KEY METRICS STRIP ─────────────────────────────── */}
      <section className={styles.statsSection} aria-label="Key platform metrics">
        <div className={styles.statsGrid}>
          {STATS.map((stat, idx) => (
            <div key={idx} className={styles.statCard}>
              <span className={styles.statValue}>{stat.value}</span>
              <h3 className={styles.statLabel}>{stat.label}</h3>
              <p className={styles.statSubtext}>{stat.subtext}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. THE ORIGIN (WHY WE STARTED) ────────────────────── */}
      <section className={styles.storySection} aria-labelledby="origin-heading">
        <div className={styles.storyLayout}>
          <div className={styles.storyTextCol}>
            <div className={styles.sectionKicker}>
              <Leaf size={14} aria-hidden="true" />
              <span>The Origin</span>
            </div>
            <h2 id="origin-heading" className={styles.sectionTitle}>
              Why Saturday mornings needed a quieter, better way
            </h2>

            <p className={styles.storyParagraph}>
              You set your alarm early on Saturday, fight traffic, hunt for scarce parking around Abingdon Square, and walk eagerly toward the green canopies—only to discover that the heirloom Brandywines and country sourdough boules were claimed twenty minutes before you arrived.
            </p>

            <p className={styles.storyParagraph}>
              Meanwhile, thirty feet away, a grower who woke up at 3:30 AM to load wooden crates is wondering whether twenty extra pounds of sweet spinach will find buyers before 2:00 PM, or end up composted after five months of daily labor.
            </p>

            <p className={styles.storyParagraph}>
              MarketLink was engineered to bridge that exact divide. By enabling neighbors to reserve weekly harvests from independent stalls between Wednesday and Friday, farmers harvest strictly to known demand, and customers can stroll up leisurely at 11:30 AM with their favorites guaranteed.
            </p>

            <div className={styles.quoteCard}>
              <Quote size={28} className={styles.quoteIcon} aria-hidden="true" />
              <blockquote className={styles.quoteText}>
                “A farmers market shouldn’t be an anxiety sprint at 8:00 AM. It should be a relaxed Saturday ritual where community, growers, and honest food connect.”
              </blockquote>
            </div>
          </div>

          <div className={styles.storyVisualCol}>
            <div className={styles.storyImgCard}>
              <img
                src="/images/hero-market-crates.jpg"
                alt="Fresh market produce crates ready for Saturday morning pickup"
                className={styles.storyImg}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/market-morning.jpg';
                }}
              />
              <div className={styles.storyImgBadge}>
                <MapPin size={13} aria-hidden="true" />
                <span>Regional Produce Stalls · Direct Farmgate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. CORE VALUES ────────────────────────────────────── */}
      <section className={styles.valuesSection} aria-labelledby="values-heading">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionKicker}>
            <ShieldCheck size={14} aria-hidden="true" />
            <span>Foundational Principles</span>
          </div>
          <h2 id="values-heading" className={styles.sectionTitle}>
            What Drives Every Decision We Make
          </h2>
          <p className={styles.sectionLead}>
            From soil audits to dawn harvest manifests, our platform is built on four non-negotiable commitments to growers and shoppers.
          </p>
        </div>

        <div className={styles.valuesGrid}>
          {VALUES.map((val, idx) => {
            const Icon = val.icon;
            return (
              <div key={idx} className={styles.valueCard}>
                <div className={styles.valueCardHead}>
                  <div className={styles.valueIconWrap}>
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <span className={styles.valueNumeral}>{val.numeral}</span>
                </div>
                <h3 className={styles.valueTitle}>{val.title}</h3>
                <span className={styles.valueHighlight}>{val.highlight}</span>
                <p className={styles.valueDesc}>{val.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 5. THE SATURDAY CYCLE (HOW IT WORKS) ──────────────── */}
      <section className={styles.timelineSection} aria-labelledby="timeline-heading">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionKicker}>
            <Clock size={14} aria-hidden="true" />
            <span>The Weekly Rhythm</span>
          </div>
          <h2 id="timeline-heading" className={styles.sectionTitle}>
            How MarketLink Connects Soil to Table
          </h2>
          <p className={styles.sectionLead}>
            Four straightforward steps from midweek field checks to your Saturday morning paper tote.
          </p>
        </div>

        <div className={styles.timelineGrid}>
          {TIMELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className={styles.timelineCard}>
                <div className={styles.timelineCardHead}>
                  <div className={styles.stepBadge}>Step {step.step}</div>
                  <span className={styles.timelineCategoryPill}>{step.badge}</span>
                </div>
                <div className={styles.timelineTimeRow}>
                  <Icon size={14} className={styles.timelineTimeIcon} aria-hidden="true" />
                  <span className={styles.timelineTime}>{step.time}</span>
                </div>
                <h3 className={styles.timelineTitle}>{step.title}</h3>
                <p className={styles.timelineDesc}>{step.description}</p>
              </div>
            );
          })}
        </div>

        <div className={styles.timelineNotice}>
          <div className={styles.noticeIconWrap}>
            <CheckCircle2 size={20} aria-hidden="true" />
          </div>
          <p className={styles.noticeText}>
            <strong>Direct in-person pickup only:</strong> No cardboard shipping waste, no third-party delivery couriers, and no payment surcharges. You pay the grower directly upon collection.
          </p>
        </div>
      </section>

      {/* ── 6. COMMUNITY STEWARDS & TEAM ───────────────────────── */}
      <section className={styles.teamSection} aria-labelledby="team-heading">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionKicker}>
            <Sparkles size={14} aria-hidden="true" />
            <span>Community Stewards</span>
          </div>
          <h2 id="team-heading" className={styles.sectionTitle}>
            The People Behind the Stalls and Screens
          </h2>
          <p className={styles.sectionLead}>
            Market organizers, software engineers, and food advocates united around regional food dignity and technology that serves people.
          </p>
        </div>

        <div className={styles.teamGrid}>
          {TEAM.map((member, idx) => {
            const initials = member.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('');

            return (
              <div key={idx} className={styles.teamCard}>
                <div className={styles.teamImgWrap}>
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className={styles.teamImg}
                      style={{ objectPosition: member.imagePosition || 'center 20%' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        if (member.fallbackImage && !e.target.src.includes(member.fallbackImage)) {
                          e.target.src = member.fallbackImage;
                        } else {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex';
                          }
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className={styles.teamFallbackAvatar}
                    style={{ display: member.image ? 'none' : 'flex' }}
                  >
                    <UserCircle size={48} className={styles.fallbackIcon} aria-hidden="true" />
                    <span className={styles.fallbackInitials}>{initials}</span>
                  </div>
                </div>

                <div className={styles.teamCardBody}>
                  <h3 className={styles.memberName}>{member.name}</h3>
                  <span className={styles.memberRole}>{member.role}</span>
                  <p className={styles.memberBio}>{member.bio}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 7. FEATURED MARKETS ─────────────────────────────────── */}
      <section className={styles.marketsPreviewSection} aria-labelledby="markets-heading">
        <div className={styles.marketsCard}>
          <div className={styles.marketsText}>
            <div className={styles.sectionKicker}>
              <MapPin size={14} aria-hidden="true" />
              <span>Neighborhood Network</span>
            </div>
            <h2 id="markets-heading" className={styles.marketsHeading}>
              Operating at 4 Historic Regional Markets
            </h2>
            <p className={styles.marketsParagraph}>
              From the cobbled paths of the West Village to the grand tree-lined arc of Prospect Park, our partner markets bring fresh regional harvests directly to neighborhood centers.
            </p>

            <div className={styles.marketsList}>
              {FEATURED_MARKETS.map((m, idx) => (
                <div key={idx} className={styles.marketPillItem}>
                  <div className={styles.marketPillIconWrap}>
                    <MapPin size={14} aria-hidden="true" />
                  </div>
                  <div className={styles.marketPillContent}>
                    <strong className={styles.marketPillName}>{m.name}</strong>
                    <span className={styles.marketPillMeta}>{m.schedule} · {m.location}</span>
                  </div>
                </div>
              ))}
            </div>

            <Link to={PATHS.MARKETS} className={styles.viewMarketsBtn}>
              <span>View Full Market Directory & Schedule</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.marketsVisual}>
            <img
              src="/images/market-greenwich.jpg"
              alt="Greenwich Village Farmers Market sunny morning stalls"
              className={styles.marketsImg}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/market-morning.jpg';
              }}
            />
            <div className={styles.marketsImgTag}>
              <MapPin size={12} aria-hidden="true" />
              <span>Greenwich Village · Abingdon Square</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. COMMUNITY INVITATION CTA ───────────────────────── */}
      <section className={styles.ctaSection} aria-labelledby="cta-heading">
        <div className={styles.ctaCard}>
          <div className={styles.ctaBadge}>
            <Sparkles size={14} aria-hidden="true" />
            <span>Saturday Morning Tradition</span>
          </div>

          <h2 id="cta-heading" className={styles.ctaTitle}>
            Experience your neighborhood market <br className={styles.ctaBreak} />
            with certainty and ease this weekend.
          </h2>

          <p className={styles.ctaSubtitle}>
            Create your free account in under two minutes. No subscription fees, no locked contracts—just fresh harvest held safely for you under the canopy.
          </p>

          <div className={styles.ctaButtonGroup}>
            <Link
              to={`${PATHS.REGISTER}?role=customer`}
              className={styles.ctaPrimaryBtn}
            >
              <span>Create Your Free Account</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link to={PATHS.CONTACT} className={styles.ctaSecondaryBtn}>
              <span>Contact Market Coordinators</span>
            </Link>
          </div>
        </div>
      </section>
    </Page>
  );
}

export default About;
