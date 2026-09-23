import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
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
          subtitle="A simple way to shop the farmers market."
          backTo={PATHS.HOME}
          backLabel="Home"
        />

        {/* ---------------- SECTION 1: OUR STORY ---------------- */}
        <section className={styles.storySection}>
          <div className={styles.storyContent}>
            <div className={styles.storyText}>
              <h2 className={styles.storyHeading}>Why we started</h2>
              <p className={styles.paragraph}>
                Early mornings, muddy boots, and the aroma of fresh sourdough. Farmers
                markets are the beating heart of local food, but shopping them can sometimes
                be a guessing game. You arrive at nine in the morning hoping for heirloom
                tomatoes, only to find the wooden crates already empty.
              </p>
              <p className={styles.paragraph}>
                Meanwhile, small growers and independent family bakers spend all week
                tending fields and warming ovens. They load up the truck on Saturday dawn,
                guessing how much to bring without knowing what will sell or spoil.
              </p>
              <p className={styles.paragraph}>
                MarketLink was built to bridge that gap with honesty and calm. A quiet,
                respectful way to pre-order what you need before market day, so farmers know
                exactly what to harvest and you never miss your favourite sourdough.
              </p>
            </div>
            <div className={styles.storyVisual} aria-hidden="true">
              <div className={styles.illustrationFrame}>
                <Illustration name="crate" size="lg" className={styles.storyIllustration} />
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- SECTION 2: WHAT WE BELIEVE ---------------- */}
        <section className={styles.valuesSection}>
          <h2 className={styles.sectionHeading}>What we believe</h2>
          <div className="grid3">
            <Card className={styles.valueCard}>
              <Illustration name="leaves" size="md" className={styles.valueIcon} />
              <h3 className={styles.valueTitle}>Local first</h3>
              <p className={styles.valueText}>
                Food should travel miles, not continents, directly sustaining the growers
                and bakers within our own neighbourhood.
              </p>
            </Card>

            <Card className={styles.valueCard}>
              <Illustration name="stall" size="md" className={styles.valueIcon} />
              <h3 className={styles.valueTitle}>Fair for Farmers</h3>
              <p className={styles.valueText}>
                No commission cuts, no corporate middlemen, and no complicated inventory
                systems that get in the way of honest work.
              </p>
            </Card>

            <Card className={styles.valueCard}>
              <Illustration name="basket" size="md" className={styles.valueIcon} />
              <h3 className={styles.valueTitle}>Simple for everyone</h3>
              <p className={styles.valueText}>
                Built for real hands. Accessible on any screen, straightforward for all
                ages, with zero tech headaches or confusing jargon.
              </p>
            </Card>
          </div>
        </section>
      </div>

      {/* ---------------- SECTION 3: HOW IT WORKS (CANVAS BAND) ---------------- */}
      <WaveDivider shape="soft" />
      <section className={styles.timelineSection}>
        <div className="containerNarrow">
          <div className={styles.timelineHeader}>
            <h2 className={styles.sectionHeading}>How MarketLink works</h2>
            <p className={styles.sectionSubtitle}>
              Four straightforward steps from harvest to market basket.
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
                  Growers and bakers list what will be fresh at this week’s Saturday market
                  before Friday evening.
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
                  Neighbours browse their favourite stalls and reserve items ahead of time
                  so their picks are guaranteed.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className={styles.timelineItem}>
              <div className={styles.timelineBadge} aria-hidden="true">
                3
              </div>
              <div className={styles.timelineBody}>
                <h3 className={styles.timelineStepTitle}>Farmers get the order ready</h3>
                <p className={styles.timelineStepText}>
                  Stalls pack your harvest early on market morning, labeled and waiting
                  safely behind the counter.
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
                  Collect your order at the market stall and pay the Farmer in person.
                </p>
              </div>
            </div>
          </div>

          {/* Calming note card */}
          <div className={styles.timelineNote}>
            <p className={styles.timelineNoteText}>
              Pickup only. No delivery. Payment happens in person.
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
              Market organizers, designers, and community supporters.
            </p>
          </div>

          {/* TODO: replace with real team details */}
          <div className="gridAuto">
            {TEAM_MEMBERS.map((member) => (
              <Card key={member.id} className={styles.teamCard}>
                <div className={styles.initialsAvatar} aria-hidden="true">
                  {member.initials}
                </div>
                <h3 className={styles.memberName}>{member.name}</h3>
                <p className={styles.memberRole}>{member.role}</p>
                <p className={styles.memberBio}>{member.bio}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ---------------- SECTION 5: CLOSING CTA ---------------- */}
        <section className={styles.aboutCta}>
          <h2 className={styles.ctaHeading}>Ready to see what is fresh?</h2>
          <p className={styles.ctaSubtitle}>
            Join your neighbours and start supporting local growers this Saturday.
          </p>
          <Button
            as={Link}
            to={PATHS.REGISTER}
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
