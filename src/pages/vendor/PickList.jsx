import React, { useState, useEffect, useCallback } from 'react';
import { getPickList } from '@/api/farmer';
import Skeleton from '@/components/ui/Skeleton';
import { Calendar, Package, Clock, CheckSquare } from 'lucide-react';
import styles from './PickList.module.css';

export function PickList({ defaultDate }) {
  const [selectedDate, setSelectedDate] = useState(
    defaultDate || new Date().toISOString().slice(0, 10)
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPickList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getPickList(selectedDate);
      setData(res?.data || null);
    } catch (err) {
      setError(err?.message || 'Could not load pick list.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadPickList();
  }, [loadPickList]);

  return (
    <div className={styles.container}>
      {/* Date Selector */}
      <div className={styles.dateRow}>
        <label htmlFor="pick-list-date" className={styles.dateLabel}>
          <Calendar size={16} aria-hidden="true" />
          <span>Fulfillment date:</span>
        </label>
        <input
          id="pick-list-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className={styles.dateInput}
        />
      </div>

      {loading ? (
        <div className={styles.loadingBox}>
          <Skeleton height="32px" width="50%" />
          <Skeleton height="80px" />
          <Skeleton height="120px" />
        </div>
      ) : error ? (
        <div className={styles.errorBox}>{error}</div>
      ) : !data || (data.products?.length === 0 && data.slots?.length === 0) ? (
        <div className={styles.emptyBox}>
          <CheckSquare size={24} className={styles.emptyIcon} aria-hidden="true" />
          <p>No active pickup orders scheduled for {selectedDate}.</p>
        </div>
      ) : (
        <>
          {/* Section 1: Aggregated Harvest Items */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Package size={16} aria-hidden="true" />
              <h3 className={styles.sectionTitle}>Total Items to Pack</h3>
            </div>
            <div className={styles.productsList}>
              {data.products?.map((item) => (
                <div key={item.productId || item.name} className={styles.productRow}>
                  <span className={styles.productName}>{item.name}</span>
                  <span className={styles.productQty}>
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Orders by Pickup Window */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Clock size={16} aria-hidden="true" />
              <h3 className={styles.sectionTitle}>Orders by Pickup Slot</h3>
            </div>

            <div className={styles.slotsList}>
              {data.slots?.map((slot, idx) => {
                const startTime = slot.start?.slice(11, 16) || '';
                const endTime = slot.end?.slice(11, 16) || '';
                const slotTitle = startTime && endTime ? `${startTime} – ${endTime}` : 'Scheduled Window';

                return (
                  <div key={idx} className={styles.slotCard}>
                    <div className={styles.slotHeader}>
                      <span className={styles.slotTime}>{slotTitle}</span>
                      <span className={styles.orderCount}>
                        {slot.orders?.length} {slot.orders?.length === 1 ? 'order' : 'orders'}
                      </span>
                    </div>

                    <div className={styles.ordersInSlot}>
                      {slot.orders?.map((ord) => (
                        <div key={ord.orderNumber} className={styles.orderItem}>
                          <div className={styles.orderItemHeader}>
                            <strong>{ord.orderNumber}</strong>
                            <span className={styles.custName}>{ord.customerName}</span>
                          </div>
                          <ul className={styles.orderItemsList}>
                            {ord.items?.map((it, i) => (
                              <li key={i}>
                                {it.quantity}x {it.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default PickList;
