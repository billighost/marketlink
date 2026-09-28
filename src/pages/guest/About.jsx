import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShoppingBag, Leaf, Heart, CheckCircle2, MapPin } from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import billalImg from '@/asset/billal.png';
import ayoImg from '@/asset/ayo.png';
import malikImg from '@/asset/malik.png';
import aliyahImg from '@/asset/Aliyah.jpeg';
import styles from './About.module.css';

const STATS = [
  { value: '40+', label: 'Independent growers', subtext: 'Within 90 miles of our markets' },
  { value: '4', label: 'Historic markets', subtext: 'Regional neighborhood markets' },
  { value: '100%', label: 'Direct to producers', subtext: '0% platform take from stall sales' },
  { value: '14,000+', label: 'Harvest pre-orders', subtext: 'Fulfilled without food waste' },
];

const VALUES = [
  {
    title: '100% producer-only guarantee',
    highlight: 'No resellers, no wholesale markups.',
    description:
      'Every heirloom tomato, sourdough boule, and raw wildflower jar sold through MarketLink is harvested or crafted by the grower standing behind the stall. We audit every farm to confirm regional provenance.',
    icon: ShieldCheck,
  },
  {
    title: 'Calm, guaranteed Saturday mornings',
    highlight: 'Sleep in knowing your favorites are set aside.',
    description:
      'No more arriving at 8:30 AM to find the crates picked clean. Reserve during the week and your labeled brown paper tote waits under the canopy until you arrive.',
    icon: ShoppingBag,
  },
  {
    title: 'Zero food waste by design',
    highlight: 'Harvested to demand, never in excess.',
    description:
      'Conventional farming discards up to 30% of harvested produce that spoils in trucks or unsold crates. MarketLink growers receive pre-order manifests on Friday evening and harvest strictly to order at dawn.',
    icon: Leaf,
  },
  {
    title: 'Dignified economics for family farms',
    highlight: 'Farmers set their prices and keep 100% of proceeds.',
    description:
      'Big retail chains pay farmers as little as 14 cents on the retail food dollar. On MarketLink, growers keep their full listed price, paid to them in person at Saturday collection.',
    icon: Heart,
  },
];

const TIMELINE_STEPS = [
  {
    time: 'Wednesday and Thursday',
    title: 'Growers publish available harvest',
    description:
      'Farmers inspect their fields and orchard rows, listing the exact crops reaching peak flavor for the weekend.',
  },
  {
    time: 'Thursday through Friday, 6:00 PM',
    title: 'Neighbors reserve their weekly baskets',
    description:
      'Customers browse neighborhood stalls and build a pre-order with no prepayment or subscription lock-in.',
  },
  {
    time: 'Saturday, 5:00 AM',
    title: 'Harvested, packed, and labeled to order',
    description:
      'Produce is clipped at dawn while still cool, packed into personalized totes, and driven into town.',
  },
  {
    time: 'Saturday, 8:00 AM to 2:00 PM',
    title: 'Pick up and pay at the stall',
    description:
      'Walk up to the canopy, greet your grower, check your harvest, and pay in person.',
  },
];

const TEAM = [
  {
    name: 'Bello Bilal Olamiposi',
    role: 'Systems Architect & Software Engineer',
    image: billalImg,
    fallbackImage: '/images/team/billal.png',
    bio: 'Self-taught systems architect and tech entrepreneur with a passion for civic platforms. Bilal began programming at 14 and has engineered digital products including DevDrill, Dezola Studio, and inDeck.',
  },
  {
    name: 'Ayomide Alao',
    role: 'Software Developer & Systems Engineer',
    image: ayoImg,
    fallbackImage: '/images/team/ayo.png',
    bio: 'Self-taught software developer and systems engineer based in Ibadan. An alumnus of the ALX Software Engineering program, Ayomide specializes in web technologies and systems engineering at Aptech.',
  },
  {
    name: 'Okunola Abdulmaleek',
    role: 'Software Developer & Creative Technologist',
    image: malikImg,
    fallbackImage: '/images/team/malik.png',
    bio: 'Creative technologist pursuing an ADSE at Aptech. Experienced in web development, databases, and digital products, Abdulmaleek is also building Mandrixx Music, a streaming platform.',
  },
  {
    name: 'Aliyah Adeleke',
    role: 'Software Developer & Team Leader',
    image: aliyahImg,
    fallbackImage: '/images/team/Aliyah.jpeg',
    bio: 'Software developer and team leader skilled in React, React Native, and Node.js. Aliyah is passionate about engineering web and mobile solutions to real-life problems.',
  },
  {
    name: 'Olatoye Uthman',
    role: 'Product Specialist & Asset Generator',
    image: null,
    fallbackImage: null,
    bio: 'Focused on product quality and visual identity, Uthman led product refining, asset generation, and creative production, making sure every interface detail and digital asset met a premium standard.',
  },
];

const FEATURED_MARKETS = [
  { name: 'Greenwich Village Farmers Market', schedule: 'Saturdays, 8AM to 2PM', location: 'Abingdon Square Park' },
  { name: 'Union Square Greenmarket', schedule: 'Wed, Fri, Sat, 8AM to 6PM', location: 'Union Square North & West' },
  { name: 'Brooklyn Grand Army Plaza', schedule: 'Saturdays, 8AM to 4PM', location: 'Prospect Park Entrance' },
  { name: 'Chelsea Farmers Market', schedule: 'Sundays, 9AM to 3PM', location: 'W 23rd St & 9th Ave' },
];

const initials = (name) =>
  name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

export function About() {
  useDocumentTitle('About MarketLink: Connecting Soil to Table');

  return (
    <div className={styles.page}>
      {/* Hero + stats */}
      <header className={styles.hero}>
        <div className={styles.wrap}>
          <div className={styles.heroGrid}>
            <h1 className={styles.heroTitle}>
              Rooted in the soil, dedicated to the neighborhood table.
            </h1>
            <div className={styles.heroSide}>
              <p className={styles.lead}>
                MarketLink was founded on a simple conviction: Saturday market trips should be calm,
                food should travel miles rather than continents, and family farmers should always
                receive fair value for honest labor.
              </p>
              <div className={styles.actions}>
                <Link to={PATHS.MARKETS} className={`${styles.btn} ${styles.btnPrimary}`}>
                  Explore our markets
                </Link>
                <Link to={PATHS.PRODUCTS} className={`${styles.btn} ${styles.btnSecondary}`}>
                  Browse seasonal harvest
                </Link>
              </div>
            </div>
          </div>

          <dl className={styles.stats}>
            {STATS.map((stat) => (
              <div key={stat.label} className={styles.stat}>
                <dt className={styles.statLabel}>{stat.label}</dt>
                <dd className={styles.statValue}>{stat.value}</dd>
                <dd className={styles.statSubtext}>{stat.subtext}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* Story */}
      <section className={styles.section} aria-labelledby="about-story">
        <div className={styles.wrap}>
          <div className={styles.storyGrid}>
            <div className={styles.prose}>
              <h2 id="about-story">Why Saturday mornings needed a quieter, better way</h2>
              <p>
                You set your alarm, fight weekend traffic, hunt for parking around Abingdon Square,
                and walk toward the green-and-white canopies, only to find the heirloom Brandywines and
                country sourdough picked clean twenty minutes earlier.
              </p>
              <p>
                Meanwhile, eighty miles north in Dutchess and Columbia counties, independent growers
                and small-batch bakers load their flatbeds at 4:30 AM in the dark. They guess how many
                crates will sell and how much tender produce will wilt in the summer sun.
              </p>
              <p>
                <strong>MarketLink was created to solve both sides of that equation.</strong> With
                pre-orders throughout the week, farmers harvest only what neighbors have reserved, and
                your brown paper tote is set aside under the canopy waiting for you.
              </p>

              <figure className={styles.quote}>
                <blockquote>
                  <p className={styles.quoteText}>
                    “The deepest connection to your food is looking the grower in the eye across a
                    crate of fresh radishes. We built technology not to replace that handshake, but to
                    make sure it happens every weekend without stress.”
                  </p>
                </blockquote>
                <figcaption className={styles.quoteCite}>
                  Elena Vance, co-founder and fourth-generation grower
                </figcaption>
              </figure>
            </div>

            <div className={styles.visuals}>
              <figure className={styles.photo}>
                <img
                  src="/images/market-morning.jpg"
                  alt="Morning at the farmers market with wooden crates full of fresh produce"
                  className={styles.photoImg}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption className={styles.photoCap}>
                  <MapPin size={14} className={styles.capIcon} aria-hidden="true" />
                  <span>Abingdon Square Farmers Market, 8:00 AM</span>
                </figcaption>
              </figure>
              <figure className={`${styles.photo} ${styles.photoWide}`}>
                <img
                  src="/images/riverbend-farm.jpg"
                  alt="Riverbend Farm fields in the Hudson Valley"
                  className={styles.photoImg}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption className={styles.photoCap}>
                  <MapPin size={14} className={styles.capIcon} aria-hidden="true" />
                  <span>Riverbend Farm, Hudson Valley. 100% certified organic soil.</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className={`${styles.section} ${styles.sectionMuted}`} aria-labelledby="about-values">
        <div className={styles.wrap}>
          <div className={styles.head}>
            <h2 id="about-values">What we stand for every Saturday</h2>
            <p>
              We are not a nationwide delivery warehouse or a venture-backed grocery app. We are a
              community-run utility that keeps regional agriculture alive.
            </p>
          </div>

          <ul className={styles.valueList} role="list">
            {VALUES.map(({ title, highlight, description, icon: Icon }) => (
              <li key={title} className={styles.value}>
                <span className={styles.valueIcon} aria-hidden="true">
                  <Icon size={20} />
                </span>
                <h3>{title}</h3>
                <p className={styles.valueLead}>{highlight}</p>
                <p className={styles.valueDesc}>{description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.section} aria-labelledby="about-how">
        <div className={styles.wrap}>
          <div className={styles.head}>
            <h2 id="about-how">How MarketLink connects soil to table</h2>
            <p>Four steps from midweek field checks to your Saturday paper tote.</p>
          </div>

          <ol className={styles.steps} role="list">
            {TIMELINE_STEPS.map((item, idx) => (
              <li key={item.title} className={styles.step}>
                <span className={styles.stepNum}>{idx + 1}</span>
                <span className={styles.stepTime}>{item.time}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </li>
            ))}
          </ol>

          <p className={styles.note}>
            <CheckCircle2 size={20} className={styles.noteIcon} aria-hidden="true" />
            <span>
              <strong>In-person pickup only.</strong> No shipping boxes, no third-party couriers, and no
              online payment surcharges. You pay the grower directly at collection.
            </span>
          </p>
        </div>
      </section>

      {/* Team */}
      <section className={`${styles.section} ${styles.sectionMuted}`} aria-labelledby="about-team">
        <div className={styles.wrap}>
          <div className={styles.head}>
            <h2 id="about-team">The team behind the screens</h2>
            <p>
              The developers and designers who build MarketLink, working alongside market organizers
              and family growers.
            </p>
          </div>

          <ul className={styles.teamGrid} role="list">
            {TEAM.map((member) => (
              <li key={member.name} className={styles.teamCard}>
                <div className={styles.teamPhoto}>
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className={styles.teamImg}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.target.onerror = null;
                        if (member.fallbackImage && !e.target.src.includes(member.fallbackImage)) {
                          e.target.src = member.fallbackImage;
                        }
                      }}
                    />
                  ) : (
                    <div className={styles.teamPlaceholder} aria-hidden="true">
                      {initials(member.name)}
                    </div>
                  )}
                </div>
                <div className={styles.teamBody}>
                  <h3>{member.name}</h3>
                  <p className={styles.memberRole}>{member.role}</p>
                  <p className={styles.memberBio}>{member.bio}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Markets */}
      <section className={styles.section} aria-labelledby="about-markets">
        <div className={styles.wrap}>
          <div className={styles.marketsGrid}>
            <div>
              <h2 id="about-markets">Historic square markets across the city</h2>
              <p className={styles.marketsIntro}>
                From the cobbled streets of the West Village to the tree-lined arc of Prospect Park,
                our partner markets bring Hudson Valley harvests straight to neighborhood centers.
              </p>

              <ul className={styles.marketList} role="list">
                {FEATURED_MARKETS.map((m) => (
                  <li key={m.name} className={styles.marketItem}>
                    <span className={styles.marketName}>{m.name}</span>
                    <span className={styles.marketMeta}>{m.schedule}</span>
                    <span className={styles.marketMeta}>{m.location}</span>
                  </li>
                ))}
              </ul>

              <Link to={PATHS.MARKETS} className={`${styles.btn} ${styles.btnSecondary}`}>
                View all markets and schedules
              </Link>
            </div>

            <figure className={styles.photo}>
              <img
                src="/images/market-greenwich.jpg"
                alt="Greenwich Village Farmers Market on a sunny morning"
                className={`${styles.photoImg} ${styles.marketsImg}`}
                loading="lazy"
                decoding="async"
              />
              <figcaption className={styles.photoCap}>
                <MapPin size={14} className={styles.capIcon} aria-hidden="true" />
                <span>Greenwich Village, Abingdon Square</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection} aria-labelledby="about-cta">
        <div className={styles.wrap}>
          <div className={styles.cta}>
            <div className={styles.ctaText}>
              <h2 id="about-cta">Shop your neighborhood market with certainty this weekend</h2>
              <p>
                Create a free account in under two minutes. No subscription fees, no contracts, just
                fresh harvest held for you under the canopy.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Link to={`${PATHS.REGISTER}?role=customer`} className={`${styles.btn} ${styles.ctaPrimary}`}>
                Create your free account
              </Link>
              <Link to={PATHS.CONTACT} className={`${styles.btn} ${styles.ctaSecondary}`}>
                Contact market coordinators
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;