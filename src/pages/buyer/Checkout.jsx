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
    setQuantity,
    setSlot,
    remove,
    refreshQuote,
    resetIdempotencyKey,
  } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [errorState, setErrorState] = useState(null);

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

  // Pre-emptive issues detected from server quote
  const quoteIssues = useMemo(() => {
    const issues = [];
    for (const g of groups) {
      if (Array.isArray(g.issues)) {
        for (const issue of g.issues) {
          issues.push({ ...issue, farmerId: g.farmerId || g.farmer?.id, stallName: g.farmer?.stallName || 'Stall' });
        }
      }
      if (Array.isArray(g.lines)) {
        for (const line of g.lines) {
          if (Array.isArray(line.issues)) {
            for (const li of line.issues) {
              issues.push({ ...li, productId: line.productId, name: line.name, maxQuantity: line.quantityAvailable });
            }
          }
        }
      }
    }
    return issues;
  }, [groups]);

  const handlePlacePreOrder = async () => {
    if (!canSubmit) return;

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = createIdempotencyKey();
    }

    setSubmitting(true);
    setErrorState(null);

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
      const rawMsg = err.message || '';
      const details = Array.isArray(err.details) ? err.details : [];

      // 1. Stock changed while checking out
      const stockProblems = details.filter(
        (d) => d.code === 'NOT_ENOUGH_STOCK' || d.code === 'OUT_OF_STOCK' || d.code === 'STOCK_CONFLICT'
      );
      if (
        stockProblems.length > 0 ||
        err.code === 'STOCK_CONFLICT' ||
        err.code === 'NOT_ENOUGH_STOCK' ||
        rawMsg.toLowerCase().includes('stock') ||
        rawMsg.toLowerCase().includes('sold out')
      ) {
        setErrorState({
          type: 'stock',
          title: 'Stock changed while checking out',
          message:
            stockProblems.length > 0
              ? stockProblems.map((p) => p.message).join(' ')
              : 'Some produce quantities changed or sold out while you were completing your pre-order.',
          actionLabel: 'Update basket to available quantity & continue',
          onAction: async () => {
            if (stockProblems.length > 0) {
              for (const prob of stockProblems) {
                if (prob.productId) {
                  const maxQty = typeof prob.maxQuantity === 'number' ? prob.maxQuantity : 0;
                  if (maxQty <= 0) {
                    remove(prob.productId);
                  } else {
                    setQuantity(prob.productId, maxQty);
                  }
                }
              }
            } else {
              // Adjust any lines where requested > available
              for (const line of allLines) {
                if (typeof line.quantityAvailable === 'number' && line.quantity > line.quantityAvailable) {
                  if (line.quantityAvailable <= 0) {
                    remove(line.productId);
                  } else {
                    setQuantity(line.productId, line.quantityAvailable);
                  }
                }
              }
            }
            resetIdempotencyKey();
            idempotencyKeyRef.current = createIdempotencyKey();
            await refreshQuote();
            setErrorState(null);
            showToast({ message: 'Basket quantities updated to match current stall inventory.', type: 'info' });
          },
        });
        showToast({ message: 'Stock changed. Please review adjusted quantities.', type: 'danger' });
        return;
      }

      // 2. Invalid pickup time / cutoff passed
      const cutoffProblems = details.filter(
        (d) => d.code === 'CUTOFF_PASSED' || d.code === 'SLOT_CLOSED' || d.code === 'SLOT_FULL'
      );
      if (
        cutoffProblems.length > 0 ||
        err.code === 'PAST_CUTOFF' ||
        err.code === 'CUTOFF_PASSED' ||
        err.code === 'SLOT_FULL' ||
        rawMsg.toLowerCase().includes('cutoff')
      ) {
        setErrorState({
          type: 'cutoff',
          title: 'Pickup time unavailable or cutoff passed',
          message:
            cutoffProblems.length > 0
              ? cutoffProblems.map((p) => p.message).join(' ')
              : 'The preparation cutoff deadline has passed for one of your selected pickup slots.',
          actionLabel: 'Select next available pickup window',
          onAction: async () => {
            for (const g of groups) {
              const openSlot =
                g.pickupWindows?.find((w) => !w.disabled && !w.closed && w.isOpen !== false) ||
                g.slots?.find((s) => s.isOpen);
              if (openSlot) {
                setSlot(g.farmerId || g.farmer?.id, openSlot.id || openSlot.start);
              }
            }
            resetIdempotencyKey();
            idempotencyKeyRef.current = createIdempotencyKey();
            await refreshQuote();
            setErrorState(null);
            showToast({ message: 'Updated to next open pickup window.', type: 'info' });
          },
        });
        showToast({ message: 'Cutoff passed for selected time slot.', type: 'danger' });
        return;
      }

      // 3. Product removed or unlisted
      const unavailProblems = details.filter((d) => d.code === 'UNAVAILABLE');
      if (unavailProblems.length > 0 || err.code === 'UNAVAILABLE') {
        setErrorState({
          type: 'removed',
          title: 'Product unlisted by grower',
          message:
            unavailProblems.length > 0
              ? unavailProblems.map((p) => p.message).join(' ')
              : 'One or more items in your basket were removed or unlisted by the grower.',
          actionLabel: 'Remove unavailable items & continue',
          onAction: async () => {
            for (const prob of unavailProblems) {
              if (prob.productId) {
                remove(prob.productId);
              }
            }
            resetIdempotencyKey();
            idempotencyKeyRef.current = createIdempotencyKey();
            await refreshQuote();
            setErrorState(null);
            showToast({ message: 'Unavailable items removed from basket.', type: 'info' });
          },
        });
        showToast({ message: 'Some produce is no longer listed.', type: 'danger' });
        return;
      }

      // 4. Network failure
      if (err.code === 'NETWORK' || err.status === 0) {
        setErrorState({
          type: 'network',
          title: 'Connection error',
          message: 'Could not connect to MarketLink. Your basket is safe.',
          actionLabel: 'Retry pre-order',
          onAction: () => handlePlacePreOrder(),
        });
        showToast({ message: 'Could not reach MarketLink. Your basket is safe.', type: 'danger' });
        return;
      }

      // 5. Generic validation or server error
      const msg = rawMsg || 'Unable to reserve your items. Please review pickup times and basket items.';
      setErrorState({
        type: 'generic',
        title: 'Could not complete reservation',
        message: msg,
        actionLabel: null,
      });
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

      {errorState && (
        <div className={styles.errorAlert} role="alert">
          <h4 className={styles.alertTitle}>{errorState.title}</h4>
          <p className={styles.errorText}>{errorState.message}</p>
          <div className={styles.alertActions}>
            {errorState.actionLabel && errorState.onAction && (
              <button
                type="button"
                className={styles.recoveryBtn}
                onClick={errorState.onAction}
              >
                {errorState.actionLabel}
              </button>
            )}
            <Link to="/buyer/basket" className={styles.errorBackLink}>
              Return to basket
            </Link>
          </div>
        </div>
      )}

      {/* Pre-emptive warning if quote has blocking issues */}
      {!errorState && quoteIssues.length > 0 && (
        <div className={styles.errorAlert} role="alert">
          <h4 className={styles.alertTitle}>Please review your basket before reserving</h4>
          <p className={styles.errorText}>
            {quoteIssues.map((qi) => qi.message).join(' ')}
          </p>
          <div className={styles.alertActions}>
            <Link to="/buyer/basket" className={styles.recoveryBtn}>
              Fix in basket →
            </Link>
          </div>
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
