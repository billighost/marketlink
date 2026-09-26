import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { createIdempotencyKey } from '@/api/client';
import { formatPrice } from '@/utils/format';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import OrderSummary from '@/components/domain/OrderSummary';
import Button from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './Checkout.module.css';

/**
 * Review pickup and place the pre-order (/buyer/checkout).
 * One page, three blocks, one button.
 * Strictly adheres to scope rule: cash in person at the stall. No gateways, no card fields.
 */
export function Checkout() {
  useDocumentTitle('Review pickup · MarketLink');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const {
    items,
    quote,
    loadingQuote,
    performCheckout,
  } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Idempotency key held in a ref: generated once per attempt and stable across re-renders
  const idempotencyKeyRef = useRef(null);

  // Redirect to basket if empty on arrival
  useEffect(() => {
    if (items.length === 0) {
      navigate('/buyer/basket', { replace: true });
    }
  }, [items.length, navigate]);

  const groups = quote?.groups || [];
  const totalCents = quote?.totalCents ?? 0;
  const canSubmit = Boolean(quote?.canCheckout) && !loadingQuote && !submitting;

  // Flatten lines for summary block
  const allLines = useMemo(() => {
    const list = [];
    for (const g of groups) {
      if (Array.isArray(g.lines)) {
        list.push(...g.lines);
      }
    }
    return list;
  }, [groups]);

  const handlePlacePreOrder = async () => {
    if (!canSubmit) return;

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = createIdempotencyKey();
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await performCheckout('', idempotencyKeyRef.current);
      const orders = res?.orders || res?.data?.orders || [];
      const primaryOrder = orders[0];
      const orderId = primaryOrder?.id || primaryOrder?._id;

      if (orderId) {
        navigate(`/buyer/orders/${orderId}/confirmed`, { replace: true });
      } else {
        navigate('/buyer/orders', { replace: true });
      }
    } catch (err) {
      let msg = 'Unable to reserve your items. Please try again.';
      const rawMsg = err.message || '';

      if (err.status === 422 || err.code === 'VALIDATION_ERROR') {
        msg = rawMsg || 'Please review your selected pickup times and quantities.';
      } else if (
        err.code === 'STOCK_CONFLICT' ||
        rawMsg.toLowerCase().includes('stock') ||
        rawMsg.toLowerCase().includes('sold out')
      ) {
        msg = 'Some items sold out while you were reserving.';
      } else if (err.code === 'PAST_CUTOFF' || rawMsg.toLowerCase().includes('cutoff')) {
        msg = 'The cutoff for one of your stalls has passed.';
      } else if (err.code === 'NETWORK' || err.status === 0) {
        msg = 'Could not reach MarketLink. Your basket is safe.';
      }

      setErrorMessage(msg);
      showToast({ message: msg, type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  // Format user details string
  const userName = user?.name || 'Customer';
  const userEmail = user?.email || '';
  const userPhone = user?.phone || '';
  const userDetailsLine = [userName, userEmail, userPhone].filter(Boolean).join(' · ');

  return (
    <Page width="detail" className={styles.page}>
      <PageTitle
        title="Review pickup"
        context="Confirm when you will collect from each stall."
        backTo="/buyer/basket"
        backLabel="Back to basket"
      />

      {errorMessage && (
        <div className={styles.errorAlert} role="alert">
          <p className={styles.errorText}>{errorMessage}</p>
          <Link to="/buyer/basket" className={styles.errorBackLink}>
            Return to basket
          </Link>
        </div>
      )}

      <div className={styles.layout}>
        {/* Main Column */}
        <div className={styles.mainCol}>
          {/* Block 1 · Collection */}
          <section className={styles.block} aria-labelledby="heading-collection">
            <h2 id="heading-collection" className={styles.blockHeading}>
              1 · Collection
            </h2>

            <div className={styles.stallsList}>
              {groups.map((group) => {
                const farmer = group.farmer || {};
                const farmerId = group.farmerId || farmer.id;
                const stallName = farmer.stallName || farmer.name || 'Local Stall';
                const marketName = farmer.marketName || 'Market';

                // Slot label
                const selectedSlot = group.selectedSlot;
                const slotMatch = group.pickupWindows?.find(
                  (w) => w.id === selectedSlot?.start || w.startsAt === selectedSlot?.start
                );
                const windowLabel = slotMatch?.label || 'Pickup time selected';

                return (
                  <div key={farmerId} className={styles.stallCard}>
                    <div className={styles.stallTopRow}>
                      <span className={styles.stallName}>
                        {stallName} · {marketName}
                      </span>
                      <Link
                        to={`/buyer/basket#stall-${farmerId}`}
                        className={styles.changeLink}
                        aria-label={`Change pickup time for ${stallName}`}
                      >
                        Change
                      </Link>
                    </div>

                    <div className={styles.slotRow}>
                      <span className={styles.slotLabel}>{windowLabel}</span>
                    </div>

                    {group.cutoffLabel && (
                      <p className={styles.cutoffLine}>{group.cutoffLabel}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Block 2 · Your details */}
          <section className={styles.block} aria-labelledby="heading-details">
            <h2 id="heading-details" className={styles.blockHeading}>
              2 · Your details
            </h2>

            <div className={styles.detailsCard}>
              <p className={styles.detailsText}>{userDetailsLine}</p>
              <Link to="/buyer/profile/details" className={styles.profileLink}>
                Edit in your profile →
              </Link>
            </div>
          </section>

          {/* Block 3 · What you will pay at the stall */}
          <section className={styles.block} aria-labelledby="heading-summary">
            <h2 id="heading-summary" className={styles.blockHeading}>
              3 · What you will pay at the stall
            </h2>

            <OrderSummary
              items={allLines}
              totalCents={totalCents}
              showNotice={true}
              isStale={loadingQuote}
            />
          </section>
        </div>

        {/* Desktop Sticky Sidebar (>= 1024px) */}
        <aside className={styles.sidebarCol}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarTotalRow}>
              <span className={styles.sidebarTotalLabel}>Pay at the stall</span>
              <span className={styles.sidebarTotalAmount}>
                {formatPrice(totalCents)}
              </span>
            </div>
            <p className={styles.sidebarNotice}>
              Cash, in person, when you collect.
            </p>

            {/* The ONE beet element on Checkout */}
            <Button
              variant="primary"
              size="lg"
              className={styles.desktopSubmitBtn}
              onClick={handlePlacePreOrder}
              disabled={!canSubmit}
            >
              {submitting ? 'Reserving…' : 'Place pre-order'}
            </Button>
          </div>
        </aside>
      </div>

      {/* Mobile Sticky Footer (< 1024px) */}
      <div className={styles.stickyFooter} role="region" aria-label="Checkout action bar">
        <div className={styles.footerInner}>
          <div className={styles.footerTotalCol}>
            <span className={styles.footerAmount}>{formatPrice(totalCents)}</span>
            <span className={styles.footerNote}>· pay at the stall</span>
          </div>

          {/* The ONE beet element on Mobile Checkout */}
          <Button
            variant="primary"
            size="md"
            className={styles.mobileSubmitBtn}
            onClick={handlePlacePreOrder}
            disabled={!canSubmit}
          >
            {submitting ? 'Reserving…' : 'Place pre-order'}
          </Button>
        </div>
      </div>
    </Page>
  );
}

export default Checkout;
