import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/format';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import EmptyState from '@/components/ui/EmptyState';
import StallGroup from '@/components/domain/StallGroup';
import Button from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './Cart.module.css';

/**
 * Basket page (/buyer/basket) — grouped by stall.
 * The entry point to the reservation loop.
 */
export function Cart() {
  useDocumentTitle('Basket · MarketLink');
  const navigate = useNavigate();

  const {
    items,
    count,
    quote,
    loadingQuote,
    setQuantity,
    setSlot,
    remove,
  } = useCart();

  const hasItems = items.length > 0;
  const groups = quote?.groups || [];
  const stallsCount = groups.length || (hasItems ? 1 : 0);
  const totalCents = quote?.totalCents ?? 0;
  const canProceed = Boolean(quote?.canCheckout) && hasItems && !loadingQuote;

  if (!hasItems) {
    return (
      <Page width="detail" className={styles.emptyPage}>
        <PageTitle
          title="Basket"
          backTo="/buyer/products"
          backLabel="Keep browsing"
        />
        <div className={styles.emptyWrap}>
          <EmptyState
            scene="empty-basket"
            title="Your basket is empty"
            text="Add produce from a stall and reserve it for market day."
            actionLabel="Browse produce"
            actionTo="/buyer/products"
          />
        </div>
      </Page>
    );
  }

  const stallContext = `${count} ${count === 1 ? 'item' : 'items'} from ${stallsCount} ${
    stallsCount === 1 ? 'stall' : 'stalls'
  }`;

  const collectionText =
    stallsCount === 1
      ? 'One stall, one collection.'
      : `${stallsCount} stalls, ${stallsCount} collections.`;

  return (
    <Page width="detail" className={styles.page}>
      <PageTitle
        title="Basket"
        context={stallContext}
        backTo="/buyer/products"
        backLabel="Keep browsing"
      />

      <div className={styles.layout}>
        {/* Main column: Stall groups */}
        <div className={styles.groupsCol}>
          {groups.map((group) => {
            const farmerId = group.farmerId || group.farmer?.id;
            const currentItem = items.find((i) => (i.farmerId || i.productId) === farmerId);
            const selectedWindowId =
              group.selectedSlot?.start || currentItem?.slotStart;

            return (
              <StallGroup
                key={farmerId}
                group={group}
                selectedWindowId={selectedWindowId}
                onSelectWindow={(windowId) => setSlot(farmerId, windowId)}
                onChangeQty={(productId, qty) => setQuantity(productId, qty)}
                onRemove={(productId) => remove(productId)}
                isStale={loadingQuote}
              />
            );
          })}
        </div>

        {/* Desktop Sticky Summary Card (>= 1024px) */}
        <aside className={styles.summaryCol}>
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryHeading}>Reservation summary</h3>

            <div className={styles.summaryStalls}>
              {groups.map((g) => (
                <div key={g.farmerId || g.farmer?.id} className={styles.summaryStallRow}>
                  <span className={styles.summaryStallName}>
                    {g.farmer?.stallName || 'Stall'}
                  </span>
                  <span
                    className={styles.summaryStallSubtotal}
                    data-stale={loadingQuote}
                  >
                    {formatPrice(g.subtotalCents || 0)}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.summaryTotalSection}>
              <div className={styles.summaryTotalRow}>
                <div className={styles.summaryTotalLabelCol}>
                  <span className={styles.summaryTotalLabel}>Pay at the stall</span>
                  <span className={styles.summaryTotalContext}>{collectionText}</span>
                </div>
                <span
                  className={styles.summaryTotalAmount}
                  data-stale={loadingQuote}
                >
                  {formatPrice(totalCents)}
                </span>
              </div>
            </div>

            {/* The ONE beet element on desktop Basket */}
            <Button
              variant="primary"
              size="lg"
              className={styles.desktopActionBtn}
              onClick={() => navigate('/buyer/checkout')}
              disabled={!canProceed}
            >
              Review pickup
            </Button>
          </div>
        </aside>
      </div>

      {/* Mobile Sticky Footer (< 1024px) */}
      <div className={styles.stickyFooter} role="region" aria-label="Basket checkout bar">
        <div className={styles.footerInner}>
          <div className={styles.footerTotalCol}>
            <span
              className={styles.footerAmount}
              data-stale={loadingQuote}
            >
              {formatPrice(totalCents)}
            </span>
            <span className={styles.footerNote}>· pay at the stall</span>
          </div>

          {/* The ONE beet element on mobile Basket */}
          <Button
            variant="primary"
            size="md"
            className={styles.mobileActionBtn}
            onClick={() => navigate('/buyer/checkout')}
            disabled={!canProceed}
          >
            Review pickup
          </Button>
        </div>
      </div>
    </Page>
  );
}

export default Cart;
