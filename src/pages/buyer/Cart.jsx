import React, { useState, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Trash2,
  Clock,
  Info,
  Calendar,
  MapPin,
  Store,
  Leaf,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { getFarmer, getProduct, pickupSlots, homeMarket, markets } from '@/data/placeholders';
import { formatPrice } from '@/utils/format';
import QuantityStepper from '@/components/ui/QuantityStepper';
import EmptyState from '@/components/ui/EmptyState';
import Illustration from '@/components/domain/Illustration';
import OrderConfirmed from '@/pages/buyer/OrderConfirmed';
import Button from '@/components/ui/Button';
import styles from './Cart.module.css';

const PICKUP_DATES = [
  { id: 'date-this-sat', label: 'This Saturday', dateText: 'Sep 28, 2026', badge: 'Next Market' },
  { id: 'date-next-sat', label: 'Next Saturday', dateText: 'Oct 05, 2026', badge: 'Following Week' },
];

export function Cart({ inSheet = true, onClose }) {
  const { items, count, subtotal, setQuantity, remove, restoreItem, clear } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Multi-step flow: 'cart' -> 'pickup' -> 'review'
  const [step, setStep] = useState('cart'); // 'cart' | 'pickup' | 'review'
  const [selectedDate, setSelectedDate] = useState(PICKUP_DATES[0].id);
  const [selectedSlot, setSelectedSlot] = useState(pickupSlots[0]?.id || 'slot-1');
  const [orderNote, setOrderNote] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);
  const [swipedProductId, setSwipedProductId] = useState(null);

  const touchStartXRef = useRef(0);

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e, productId) => {
    const currentX = e.touches[0].clientX;
    const diff = touchStartXRef.current - currentX;
    if (diff > 40) {
      setSwipedProductId(productId);
    } else if (diff < -20) {
      setSwipedProductId(null);
    }
  };

  const handleRemove = (productOrId, quantityOrName) => {
    const product = typeof productOrId === 'object' ? productOrId : getProduct(productOrId);
    const prodId = product?.id || productOrId;
    const prodName = product?.name || (typeof quantityOrName === 'string' ? quantityOrName : 'item');
    const quantity = typeof quantityOrName === 'number' ? quantityOrName : 1;

    remove(prodId);
    setSwipedProductId(null);
    showToast({
      message: `Removed ${prodName}`,
      action: 'Undo',
      duration: 4000,
      onAction: () => {
        restoreItem(prodId, quantity);
      },
    });
  };

  // Group items by farmer stall
  const farmerGroups = useMemo(() => {
    const groups = {};
    items.forEach((cartItem) => {
      const product = getProduct(cartItem.productId);
      if (!product) return;
      const quantity = cartItem.quantity;
      const farmer = getFarmer(product.farmerId);
      const farmerId = farmer?.id || 'unknown';

      if (!groups[farmerId]) {
        groups[farmerId] = {
          farmer,
          items: [],
          subtotal: 0,
        };
      }
      groups[farmerId].items.push({ product, quantity });
      groups[farmerId].subtotal += product.price * quantity;
    });
    return Object.values(groups);
  }, [items]);

  const selectedDateObj = PICKUP_DATES.find((d) => d.id === selectedDate) || PICKUP_DATES[0];
  const selectedSlotObj = pickupSlots.find((s) => s.id === selectedSlot) || pickupSlots[0];

  // Handle final pre-order submission
  const handleConfirmOrder = () => {
    const orderNumber = `ML-${Math.floor(1000 + Math.random() * 9000)}`;
    const farmerNames = farmerGroups
      .map((g) => g.farmer?.stallName || 'Local Farmer')
      .join(' & ');

    setPlacedOrder({
      orderNumber,
      total: subtotal,
      pickupSlot: `${selectedDateObj.label} (${selectedSlotObj.label})`,
      marketName: homeMarket.name,
      farmerNames,
    });

    clear();
  };

  // If order was just placed, show confirmation inside this sheet
  if (placedOrder) {
    return (
      <OrderConfirmed
        orderNumber={placedOrder.orderNumber}
        total={placedOrder.total}
        pickupSlot={placedOrder.pickupSlot}
        marketName={placedOrder.marketName}
        farmerNames={placedOrder.farmerNames}
        onClose={onClose}
        inSheet={inSheet}
      />
    );
  }

  // If cart is empty
  if (count === 0 && !placedOrder) {
    return (
      <div className={styles.emptyContainer}>
        <EmptyState
          illustration="basket"
          title="Your basket is empty"
          text="Explore fresh seasonal produce, sourdough breads, and farm goods from local stalls."
          actionLabel="Explore Market Harvests"
          onAction={() => {
            onClose?.();
            navigate('/buyer/products');
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ── Multi-Step Progress Tracker ─────────────────────────── */}
      <div className={styles.stepperWrap} role="navigation" aria-label="Pre-order steps">
        <div className={styles.stepItem} data-active={step === 'cart'} data-complete={step !== 'cart'}>
          <span className={styles.stepNum}>1</span>
          <span className={styles.stepTitle}>Basket</span>
        </div>
        <div className={styles.stepLine} data-complete={step !== 'cart'} />
        <div className={styles.stepItem} data-active={step === 'pickup'} data-complete={step === 'review'}>
          <span className={styles.stepNum}>2</span>
          <span className={styles.stepTitle}>Pickup & Time</span>
        </div>
        <div className={styles.stepLine} data-complete={step === 'review'} />
        <div className={styles.stepItem} data-active={step === 'review'} data-complete={false}>
          <span className={styles.stepNum}>3</span>
          <span className={styles.stepTitle}>Confirm Slip</span>
        </div>
      </div>

      {/* ── STEP 1: REVIEW CART ITEMS ───────────────────────────── */}
      {step === 'cart' && (
        <div className={styles.stepSection}>
          <div className={styles.stepHeader}>
            <div>
              <h2 className={styles.screenHeading}>Your Market Basket</h2>
              <p className={styles.screenSub}>
                {count} {count === 1 ? 'item' : 'items'} reserved across {farmerGroups.length}{' '}
                {farmerGroups.length === 1 ? 'farmer stall' : 'farmer stalls'}.
              </p>
            </div>
            <button
              type="button"
              className={styles.continueShopLink}
              onClick={() => {
                onClose?.();
                navigate('/buyer/products');
              }}
            >
              + Add more items
            </button>
          </div>

          {/* Grouped items by farmer stall */}
          <div className={styles.groupsList}>
            {farmerGroups.map((group) => {
              const { farmer, items: groupItems, subtotal: groupSubtotal } = group;
              return (
                <section
                  key={farmer?.id || 'unknown'}
                  className={styles.farmerGroup}
                  aria-label={`Items from ${farmer?.stallName || 'Farmer'}`}
                >
                  <div className={styles.stallHeader}>
                    <div className={styles.stallInfo}>
                      <Store size={16} className={styles.stallIcon} />
                      <div>
                        <h3 className={styles.stallName}>{farmer?.stallName || 'Local Farmer'}</h3>
                        <span className={styles.stallNumber}>{farmer?.stallNumber || 'Market Stall'}</span>
                      </div>
                    </div>
                    <span className={styles.stallSubtotal}>{formatPrice(groupSubtotal)}</span>
                  </div>

                  <div className={styles.itemsList}>
                    {groupItems.map(({ product, quantity }) => {
                      const isSwiped = swipedProductId === product.id;
                      const maxQty = product.quantityLeft || 99;
                      return (
                        <div key={product.id} className={styles.rowContainer}>
                          {isSwiped && (
                            <button
                              type="button"
                              className={styles.swipeAction}
                              onClick={() => handleRemove(product, quantity)}
                              aria-label={`Confirm remove ${product.name}`}
                            >
                              Remove
                            </button>
                          )}
                          <div
                            className={`${styles.itemRow} ${isSwiped ? styles.swiped : ''}`}
                            onTouchStart={handleTouchStart}
                            onTouchMove={(e) => handleTouchMove(e, product.id)}
                          >
                            <div className={styles.itemVisual}>
                              <Illustration name={product.art || 'basket'} size="sm" />
                            </div>

                            <div className={styles.itemDetails}>
                              <span className={styles.itemName}>{product.name}</span>
                              <span className={styles.itemPrice}>
                                {formatPrice(product.price)} / {product.unit}
                              </span>
                            </div>

                            <div className={styles.itemActions}>
                              <QuantityStepper
                                value={quantity}
                                onChange={(newQty) => setQuantity(product.id, newQty)}
                                min={0}
                                max={maxQty}
                                productName={product.name}
                                compact
                              />
                              <button
                                type="button"
                                className={styles.removeButton}
                                onClick={() => handleRemove(product, quantity)}
                                aria-label={`Remove ${product.name} from basket`}
                              >
                                <Trash2 size={16} aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Payment Notice Banner */}
          <div className={styles.paymentNoticeBox}>
            <div className={styles.payNoticeIconWrap}>
              <Info size={18} />
            </div>
            <div>
              <strong>Payment: Pay at Pickup</strong>
              <p>
                MarketLink does not process online payments. You pay each farmer directly in cash or by card at their stall on pickup day.
              </p>
            </div>
          </div>

          {/* Subtotal & Proceed to Pickup */}
          <div className={styles.cartFooterSummary}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Subtotal ({count} items)</span>
              <span className={styles.summaryValue}>{formatPrice(subtotal)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Market Pre-Order Fee</span>
              <span className={styles.freeBadge}>Free</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span className={styles.totalLabel}>Estimated Total at Pickup</span>
              <span className={styles.totalValue}>{formatPrice(subtotal)}</span>
            </div>

            <Button
              variant="primary"
              size="lg"
              className={styles.fullWidthButton}
              onClick={() => setStep('pickup')}
            >
              <span>Select Pickup Date & Time</span>
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: SELECT PICKUP DATE, SLOT & LOCATION ─────────── */}
      {step === 'pickup' && (
        <div className={styles.stepSection}>
          <div className={styles.stepHeader}>
            <button
              type="button"
              className={styles.backStepBtn}
              onClick={() => setStep('cart')}
              aria-label="Back to basket"
            >
              <ArrowLeft size={16} />
              <span>Back to basket</span>
            </button>
            <h2 className={styles.screenHeading}>Pickup Schedule & Location</h2>
            <p className={styles.screenSub}>
              Confirm when and where you will collect your fresh produce.
            </p>
          </div>

          {/* 1. Select Pickup Date */}
          <div className={styles.configBlock}>
            <label className={styles.blockLabel}>
              <Calendar size={16} className={styles.blockIcon} />
              Select Pickup Date
            </label>
            <div className={styles.dateOptionsGrid}>
              {PICKUP_DATES.map((dateItem) => (
                <button
                  key={dateItem.id}
                  type="button"
                  className={`${styles.dateOptionCard} ${
                    selectedDate === dateItem.id ? styles.dateOptionActive : ''
                  }`}
                  onClick={() => setSelectedDate(dateItem.id)}
                >
                  <span className={styles.dateBadge}>{dateItem.badge}</span>
                  <strong className={styles.dateLabel}>{dateItem.label}</strong>
                  <span className={styles.dateText}>{dateItem.dateText}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Select Pickup Time Slot */}
          <div className={styles.configBlock}>
            <label className={styles.blockLabel}>
              <Clock size={16} className={styles.blockIcon} />
              Select Pickup Time Window
            </label>
            <div className={styles.slotsGrid}>
              {pickupSlots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  className={`${styles.slotButton} ${
                    selectedSlot === slot.id ? styles.slotSelected : ''
                  }`}
                  onClick={() => setSelectedSlot(slot.id)}
                  aria-pressed={selectedSlot === slot.id}
                >
                  <Clock size={14} className={styles.slotClockIcon} />
                  <span>{slot.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Confirm Pickup Location */}
          <div className={styles.configBlock}>
            <label className={styles.blockLabel}>
              <MapPin size={16} className={styles.blockIcon} />
              Pickup Location & Attending Stalls
            </label>
            <div className={styles.locationConfirmCard}>
              <div className={styles.locationHeader}>
                <div>
                  <strong className={styles.locationName}>{homeMarket.name}</strong>
                  <p className={styles.locationAddress}>{homeMarket.address}</p>
                </div>
                <span className={styles.marketHoursBadge}>{homeMarket.hours}</span>
              </div>

              <div className={styles.stallsListSummary}>
                <span className={styles.stallsListTitle}>Collect your items from:</span>
                <div className={styles.stallsChips}>
                  {farmerGroups.map((g) => (
                    <span key={g.farmer?.id} className={styles.stallChip}>
                      <Store size={12} />
                      <strong>{g.farmer?.stallName}</strong> ({g.farmer?.stallNumber})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Optional Note for Farmers */}
          <div className={styles.configBlock}>
            <label htmlFor="order-note" className={styles.blockLabel}>
              Special Notes for Farmers (Optional)
            </label>
            <textarea
              id="order-note"
              className={styles.noteInput}
              rows={2}
              placeholder="E.g., Please pack ripe tomatoes carefully, bring paper bag..."
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className={styles.stepActionsRow}>
            <Button
              variant="primary"
              size="lg"
              className={styles.fullWidthButton}
              onClick={() => setStep('review')}
            >
              <span>Review Pre-Order</span>
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: REVIEW PRE-ORDER & CONFIRM ───────────────────── */}
      {step === 'review' && (
        <div className={styles.stepSection}>
          <div className={styles.stepHeader}>
            <button
              type="button"
              className={styles.backStepBtn}
              onClick={() => setStep('pickup')}
              aria-label="Back to pickup details"
            >
              <ArrowLeft size={16} />
              <span>Back to pickup options</span>
            </button>
            <h2 className={styles.screenHeading}>Review Pre-Order Slip</h2>
            <p className={styles.screenSub}>
              Confirm your pre-order details before sending your reserve request to the farmers.
            </p>
          </div>

          {/* Prominent Payment Notice Banner */}
          <div className={styles.payAtPickupBanner}>
            <div className={styles.payBadge}>PAYMENT METHOD</div>
            <h3 className={styles.payTitle}>Payment: Pay at Pickup</h3>
            <p className={styles.payDescription}>
              No online payment or card charges are made now. You pay directly to each farmer in cash or with card when collecting your harvest on Saturday.
            </p>
          </div>

          {/* Pickup Window & Market Box */}
          <div className={styles.reviewSummaryCard}>
            <div className={styles.reviewMetaRow}>
              <div className={styles.metaIconCol}>
                <Calendar size={18} />
              </div>
              <div className={styles.metaTextCol}>
                <span className={styles.metaLabel}>Pickup Date & Time</span>
                <strong className={styles.metaValue}>
                  {selectedDateObj.label} ({selectedDateObj.dateText}) · {selectedSlotObj.label}
                </strong>
              </div>
            </div>

            <div className={styles.reviewMetaRow}>
              <div className={styles.metaIconCol}>
                <MapPin size={18} />
              </div>
              <div className={styles.metaTextCol}>
                <span className={styles.metaLabel}>Pickup Location</span>
                <strong className={styles.metaValue}>{homeMarket.name}</strong>
                <span className={styles.metaSub}>{homeMarket.address}</span>
              </div>
            </div>

            <div className={styles.reviewMetaRow}>
              <div className={styles.metaIconCol}>
                <Clock size={18} />
              </div>
              <div className={styles.metaTextCol}>
                <span className={styles.metaLabel}>Modification / Cancellation Cutoff</span>
                <strong className={styles.metaValue}>Friday at 6:00 PM</strong>
                <span className={styles.metaSub}>Orders cannot be changed after cutoff so farmers can harvest.</span>
              </div>
            </div>
          </div>

          {/* Items Breakdown Accordion */}
          <div className={styles.reviewItemsBreakdown}>
            <span className={styles.breakdownTitle}>Items Summary ({count} items)</span>
            <div className={styles.breakdownList}>
              {farmerGroups.map((g) => (
                <div key={g.farmer?.id} className={styles.breakdownGroup}>
                  <div className={styles.breakdownGroupHeader}>
                    <strong>{g.farmer?.stallName}</strong>
                    <span>{g.farmer?.stallNumber}</span>
                  </div>
                  {g.items.map(({ product, quantity }) => (
                    <div key={product.id} className={styles.breakdownItemRow}>
                      <span className={styles.breakdownItemName}>
                        {product.name} <span className={styles.breakdownQty}>× {quantity}</span>
                      </span>
                      <span className={styles.breakdownItemPrice}>
                        {formatPrice(product.price * quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Total Payable Box */}
          <div className={styles.totalPayableBox}>
            <div className={styles.totalPayableRow}>
              <div>
                <span className={styles.totalPayableLabel}>Total Due at Pickup</span>
                <span className={styles.totalPayableSub}>Payable directly at the stalls</span>
              </div>
              <span className={styles.totalPayableAmount}>{formatPrice(subtotal)}</span>
            </div>
          </div>

          {/* Confirm Button */}
          <div className={styles.stepActionsRow}>
            <Button
              variant="primary"
              size="lg"
              className={styles.fullWidthButton}
              onClick={handleConfirmOrder}
            >
              <CheckCircle size={18} />
              <span>Confirm Pre-Order (Pay at Pickup)</span>
            </Button>
            <button
              type="button"
              className={styles.backToBasketBtn}
              onClick={() => setStep('cart')}
            >
              Modify items in basket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
