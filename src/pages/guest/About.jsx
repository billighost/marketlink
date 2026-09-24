import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import WaveDivider from '@/components/layout/WaveDivider';
import Illustration from '@/components/domain/Illustration';
import { TEAM_MEMBERS } from '@/data/placeholders';
import styles from './About.module.css';

/**
 * About page sharing the MarketLink story, values, workflow timeline, and team.
 */
export function About() {
  useDocumentTitle('About · MarketLink');

  return (
    <div className={styles.page}>
      <div className="container">
        <PageHeader
          title="About MarketLink"
          subtitle="A quiet, sensible way to shop your local Saturday market."
          backTo={PATHS.HOME}
          backLabel="Home"
        />

        {/* ---------------- SECTION 1: OUR STORY ---------------- */}
        <section className={styles.storySection}>
          <div className={styles.storyContent}>
            <div className={styles.storyText}>
              <h2 className={styles.storyHeading}>Why we started</h2>
              <p className={styles.paragraph}>
                You drive twenty minutes on a Saturday morning, search for parking around the square,
                and walk up to the market stalls hoping for fresh Brandywines or sourdough, only to
                find the wooden crates already picked clean.
              </p>
              <p className={styles.paragraph}>
                Meanwhile, small growers and independent family bakers load their trucks at 5am
                in the dark, guessing how much to harvest without knowing what will sell or spoil
                in the afternoon heat.
              </p>
              <p className={styles.paragraph}>
                MarketLink was built to make Saturday mornings calm and certain. You pre-order
                during the week from the farmers you know, they harvest specifically for your order,
                and your brown paper bag is waiting safely under the awning when you arrive.
                No delivery vans, no markups. You pay the farmer directly in person when you collect.
              </p>
            </div>
            <div className={styles.storyVisual}>
              <div className={styles.storyImageFrame}>
                <img
                  src="/images/market-morning.jpg"
                  alt="Early morning at Elm Street Market Square with wooden crates of produce and fresh sourdough"
                  className={styles.storyImg}
                  loading="lazy"
                />
                <p className={styles.storyImageCaption}>
                  Early Saturday morning at Elm Street Market Square
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- SECTION 2: WHAT WE BELIEVE (NUMBERED LIST) ---------------- */}
        <section className={styles.beliefsSection}>
          <h2 className={styles.sectionHeading}>What we believe</h2>
          <ul className={styles.beliefsList} role="list">
            <li className={styles.beliefItem}>
              <span className={styles.beliefNumeral}>01</span>
              <div className={styles.beliefBody}>
                <h3 className={styles.beliefTitle}>Local first</h3>
                <p className={styles.beliefText}>
                  Food should travel miles, not continents. Every dollar spent on Elm Street
                  stays directly with the growers, beekeepers, and bakers who live in our community.
                </p>
              </div>
            </li>

            <li className={styles.beliefItem}>
              <span className={styles.beliefNumeral}>02</span>
              <div className={styles.beliefBody}>
                <h3 className={styles.beliefTitle}>Fair for Farmers</h3>
                <p className={styles.beliefText}>
                  Zero commission cuts, zero middle-tier warehouses, and zero hidden platform fees.
                  Farmers set their own prices, pack their own boxes, and keep 100% of their takings.
                </p>
              </div>
            </li>

            <li className={styles.beliefItem}>
              <span className={styles.beliefNumeral}>03</span>
              <div className={styles.beliefBody}>
                <h3 className={styles.beliefTitle}>Honest simplicity</h3>
                <p className={styles.beliefText}>
                  Built for real hands and busy market mornings. No apps to install, no algorithmic
                  feeds, and no complicated screens. Just a quiet weekly notice board.
                </p>
              </div>
            </li>
          </ul>
        </section>
      </div>

      {/* ---------------- SECTION 3: HOW IT WORKS (CANVAS BAND) ---------------- */}
      <WaveDivider shape="soft" />
      <section className={styles.timelineSection}>
        <div className="containerNarrow">
          <div className={styles.timelineHeader}>
            <h2 className={styles.sectionHeading}>How MarketLink works</h2>
            <p className={styles.sectionSubtitle}>
              Four straightforward steps from Friday harvest to Saturday market bag.
            </p>
          </div>

          <div className={styles.timeline}>
            {/* Step 1 */}
            <div className={styles.timelineItem}>
              <div className={styles.timelineBadge} aria-hidden="true">
                1
              </div>
              <div className={styles.timelineBody}>
                <h3 className={styles.timelineStepTitle}>Farmers publish stock</h3>
                <p className={styles.timelineStepText}>
                  Growers and bakers list what will be ripe at Saturday’s market before Friday evening.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className={styles.timelineItem}>
              <div className={styles.timelineBadge} aria-hidden="true">
                2
              </div>
              <div className={styles.timelineBody}>
                <h3 className={styles.timelineStepTitle}>Customers pre-order</h3>
                <p className={styles.timelineStepText}>
                  Neighbours browse their favourite stalls and reserve items ahead of time so their picks are held.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className={styles.timelineItem}>
              <div className={styles.timelineBadge} aria-hidden="true">
                3
              </div>
              <div className={styles.timelineBody}>
                <h3 className={styles.timelineStepTitle}>Farmers harvest to order</h3>
                <p className={styles.timelineStepText}>
                  Stalls pack your harvest early Saturday morning, labeled and waiting safely behind the counter.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className={styles.timelineItem}>
              <div className={styles.timelineBadge} aria-hidden="true">
                4
              </div>
              <div className={styles.timelineBody}>
                <h3 className={styles.timelineStepTitle}>Pick up and pay</h3>
                <p className={styles.timelineStepText}>
                  Collect your brown paper bag at the stall and pay the Farmer in person.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.timelineNote}>
            <p className={styles.timelineNoteText}>
              Pickup only. No delivery fees. Payment happens directly at the stall.
            </p>
          </div>
        </div>
      </section>
      <WaveDivider shape="gentle" flip />

      {/* ---------------- SECTION 4: THE TEAM ---------------- */}
      <div className="container">
        <section className={styles.teamSection}>
          <div className={styles.teamHeader}>
            <h2 className={styles.sectionHeading}>The team</h2>
            <p className={styles.sectionSubtitle}>
              Market organizers, growers, and community volunteers on Elm Street.
            </p>
          </div>

          {/* TODO: replace with real team details */}
          <div className={styles.teamGrid}>
            {TEAM_MEMBERS.map((member, index) => {
              const iconNames = ['crate', 'loaf', 'honey', 'basket'];
              const iconName = iconNames[index % iconNames.length];
              return (
                <div key={member.id} className={styles.teamMemberRow}>
                  <Illustration name={iconName} size="sm" className={styles.teamAccentIcon} />
                  <div className={styles.teamMemberInfo}>
                    <h3 className={styles.memberName}>{member.name}</h3>
                    <span className={styles.memberRole}>{member.role}</span>
                    <p className={styles.memberBio}>{member.bio}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ---------------- SECTION 5: CLOSING CTA ---------------- */}
        <section className={styles.aboutCta}>
          <h2 className={styles.ctaHeading}>Join us this Saturday</h2>
          <p className={styles.ctaSubtitle}>
            Sign up in two minutes. Your first pre-order can be ready for collection this weekend.
          </p>
          <Button
            as={Link}
            to={`${PATHS.REGISTER}?role=customer`}
            variant="primary"
            size="md"
          >
            Create your free account
          </Button>
        </section>
      </div>
    </div>
  );
}

export default About;
