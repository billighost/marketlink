import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Clock, Info } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getFarmer, pickupSlots, homeMarket } from '@/data/placeholders';
import { formatPrice } from '@/utils/format';
import QuantityStepper from '@/components/ui/QuantityStepper';
import EmptyState from '@/components/ui/EmptyState';
import Illustration from '@/components/domain/Illustration';
import OrderConfirmed from '@/pages/buyer/OrderConfirmed';
import styles from './Cart.module.css';

/**
 * Customer Shopping Cart modal sheet.
 * Groups items by farmer stall, shows pickup slot options, and submits pre-orders.
 */
export function Cart({ inSheet = true, onClose }) {
  const { items, count, subtotal, setQuantity, remove, clear } = useCart();
  const navigate = useNavigate();

  const [selectedSlot, setSelectedSlot] = useState(pickupSlots[0]?.id || 'slot-1');
  const [orderNote, setOrderNote] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  // Group items by farmer stall
  const farmerGroups = useMemo(() => {
    const groups = {};
    items.forEach((cartItem) => {
      const { product, quantity } = cartItem;
      const farmer = getFarmer(product.farmerId);
      const farmerId = farmer?.id || 'unknown';

      if (!groups[farmerId]) {
        groups[farmerId] = {
          farmer,
          items: [],
          subtotal: 0,
        };
      }
      groups[farmerId].items.push(cartItem);
      groups[farmerId].subtotal += product.price * quantity;
    });
    return Object.values(groups);
  }, [items]);

  // Handle in-sheet pre-order submission
  const handlePlaceOrder = () => {
    const orderNumber = `ML-${Math.floor(1000 + Math.random() * 9000)}`;
    const slotObj = pickupSlots.find((s) => s.id === selectedSlot) || pickupSlots[0];
    const farmerNames = farmerGroups
      .map((g) => g.farmer?.stallName || 'Local Farmer')
      .join(' & ');

    setPlacedOrder({
      orderNumber,
      total: subtotal,
      pickupSlot: slotObj.label,
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
  if (count === 0) {
    return (
      <div className={styles.emptyContainer}>
        <EmptyState
          illustration="basket"
          title="Your basket is empty"
          text="Explore seasonal produce, artisan bakery, and farm goods from local stalls."
          actionLabel="Start shopping"
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
      {/* Pickup Slot Selection */}
      <section className={styles.pickupSection} aria-label="Pickup window">
        <div className={styles.sectionHeader}>
          <Clock size={16} className={styles.sectionIcon} aria-hidden="true" />
          <h3 className={styles.sectionTitle}>Pickup time on Saturday</h3>
        </div>
        <div className={styles.slotsGrid}>
          {pickupSlots.slice(0, 4).map((slot) => (
            <button
              key={slot.id}
              type="button"
              className={`${styles.slotButton} ${selectedSlot === slot.id ? styles.slotSelected : ''}`}
              onClick={() => setSelectedSlot(slot.id)}
              aria-pressed={selectedSlot === slot.id}
            >
              {slot.label}
            </button>
          ))}
        </div>
      </section>

      {/* Items Grouped by Farmer Stall */}
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
                  <h4 className={styles.stallName}>{farmer?.stallName || 'Local Farmer'}</h4>
                  <span className={styles.stallNumber}>{farmer?.stallNumber || 'Market Stall'}</span>
                </div>
                <span className={styles.stallSubtotal}>{formatPrice(groupSubtotal)}</span>
              </div>

              <div className={styles.itemsList}>
                {groupItems.map(({ product, quantity }) => (
                  <div key={product.id} className={styles.itemRow}>
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
                        max={99}
                        productName={product.name}
                        compact
                      />
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => remove(product.id)}
                        aria-label={`Remove ${product.name} from basket`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Note to Farmers */}
      <div className={styles.noteSection}>
        <label htmlFor="order-note" className={styles.noteLabel}>
          Note for farmers (optional)
        </label>
        <textarea
          id="order-note"
          className={styles.noteInput}
          rows={2}
          placeholder="E.g., Please pack ripe tomatoes on top, extra paper bag..."
          value={orderNote}
          onChange={(e) => setOrderNote(e.target.value)}
        />
      </div>

      {/* Order Payment Summary */}
      <section className={styles.summarySection} aria-label="Order summary">
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Subtotal</span>
          <span className={styles.summaryValue}>{formatPrice(subtotal)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Market fee</span>
          <span className={styles.freeBadge}>Free</span>
        </div>
        <div className={`${styles.summaryRow} ${styles.totalRow}`}>
          <span className={styles.totalLabel}>Total to pay</span>
          <span className={styles.totalValue}>{formatPrice(subtotal)}</span>
        </div>

        <div className={styles.payNotice}>
          <Info size={16} className={styles.noticeIcon} aria-hidden="true" />
          <span>You pay at each stall when picking up on Saturday. Cash or card accepted.</span>
        </div>
      </section>

      {/* Sticky Bottom Action */}
      <footer className={styles.stickyFooter}>
        <button
          type="button"
          className={styles.placeOrderButton}
          onClick={handlePlaceOrder}
        >
          <span>Place pre-order · {formatPrice(subtotal)}</span>
        </button>
      </footer>
    </div>
  );
}

export default Cart;
