import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBasket, Sparkles, ChevronLeft, Map, Minus, Plus, X,
  Leaf, Apple, Egg, Milk, Wheat, Flower2, Package, AlertCircle,
  CheckCircle2, ArrowRight, RotateCcw, Calendar
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@/hooks/useQuery';
import { useMutation } from '@/hooks/useMutation';
import { useOpenSheet } from '@/hooks/useOpenSheet';
import { getMarkets } from '@/api/catalog';
import { generateSmartBasket, validateSmartBasket } from '@/api/smartBasket';
import { getCartQuote, checkout } from '@/api/orders';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { Illustration } from '@/components/domain/Illustration';
import styles from './SmartBasket.module.css';

const CATEGORY_OPTIONS = [
  { id: 'vegetables', label: 'Vegetables', Icon: Leaf },
  { id: 'fruits', label: 'Fruits', Icon: Apple },
  { id: 'eggs', label: 'Eggs', Icon: Egg },
  { id: 'dairy', label: 'Dairy', Icon: Milk },
  { id: 'bakery', label: 'Bakery', Icon: Wheat },
  { id: 'herbs', label: 'Herbs', Icon: Flower2 },
  { id: 'meat', label: 'Meat & Fish', Icon: Package },
];

const PICKUP_DAYS = [
  { label: 'Wednesday', val: 'wed' },
  { label: 'Friday', val: 'fri' },
  { label: 'Saturday', val: 'sat' },
  { label: 'Sunday', val: 'sun' },
];

function formatNaira(cents) {
  return `₦${(cents / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

/** Step 1: Request form */
function BasketForm({ onSubmit, initialValues = {} }) {
  const [budget, setBudget] = useState(initialValues.budget || '');
  const [categories, setCategories] = useState(initialValues.categories || ['vegetables', 'fruits', 'eggs']);
  const [marketId, setMarketId] = useState(initialValues.marketId || '');
  const [pickupDay, setPickupDay] = useState(initialValues.pickupDay || 'sat');
  const [error, setError] = useState('');

  const { data: marketsData } = useQuery(['markets-for-basket'], ({ signal }) =>
    getMarkets({}, signal)
  );
  const markets = marketsData?.data || [];

  const toggleCategory = (id) => {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = parseFloat(budget);
    if (!budget || isNaN(num) || num < 100) {
      setError('Please enter a valid budget (minimum ₦100).');
      return;
    }
    if (categories.length === 0) {
      setError('Please select at least one category.');
      return;
    }
    setError('');
    onSubmit({ budget: num, categories, marketId: marketId || null, pickupDay });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {/* Budget input */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="basket-budget">
          What's your budget?
        </label>
        <div className={styles.budgetInput}>
          <span className={styles.budgetPrefix}>₦</span>
          <input
            id="basket-budget"
            type="number"
            className={styles.budgetField}
            placeholder="e.g. 10000"
            value={budget}
            onChange={(e) => { setBudget(e.target.value); setError(''); }}
            min="100"
            max="10000000"
            inputMode="numeric"
            autoComplete="off"
            aria-label="Budget in naira"
          />
        </div>
      </div>

      {/* Category selector */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>What do you need?</label>
        <div className={styles.categoryGrid} role="group" aria-label="Select product categories">
          {CATEGORY_OPTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`${styles.categoryChip} ${categories.includes(id) ? styles.categoryChipActive : ''}`}
              onClick={() => toggleCategory(id)}
              aria-pressed={categories.includes(id)}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Market selector (optional) */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="basket-market">
          Preferred market <span className={styles.optional}>(optional)</span>
        </label>
        <select
          id="basket-market"
          className={styles.select}
          value={marketId}
          onChange={(e) => setMarketId(e.target.value)}
        >
          <option value="">Any available market</option>
          {markets.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Pickup day */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Pickup day</label>
        <div className={styles.dayRow} role="radiogroup" aria-label="Pickup day">
          {PICKUP_DAYS.map(({ label, val }) => (
            <button
              key={val}
              type="button"
              className={`${styles.dayChip} ${pickupDay === val ? styles.dayChipActive : ''}`}
              onClick={() => setPickupDay(val)}
              aria-pressed={pickupDay === val}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className={styles.formError} role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" className={styles.submitBtn}>
        <Sparkles size={18} aria-hidden="true" />
        Build My Basket
      </Button>
    </form>
  );
}

/** Step 2: Basket results */
function BasketResults({ result, onBack, onModify, onViewMap, onReserve, isReserving }) {
  const [items, setItems] = useState(() =>
    result.items.map((item) => ({ ...item }))
  );
  const [validationIssues, setValidationIssues] = useState([]);
  const [isValidating, setIsValidating] = useState(false);

  const totalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const budgetCents = result.budgetCents;
  const remainingCents = budgetCents - totalCents;
  const budgetPercent = Math.min(100, Math.round((totalCents / budgetCents) * 100));

  const issueMap = new Map(validationIssues.map((i) => [i.productId, i]));

  const updateQty = (productId, delta) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const newQty = Math.max(0, Math.min(item.quantityAvailable, item.quantity + delta));
        return { ...item, quantity: newQty };
      }).filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const res = await validateSmartBasket(items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
      setValidationIssues(res.issues || []);
      if (res.valid && isValidating !== 'pre-checkout') {
        // proceed to reserve
        onReserve(items);
      }
    } catch (e) {
      // silently proceed — server will catch at checkout
    } finally {
      setIsValidating(false);
    }
  };

  // Validate stock periodically while viewing basket
  useEffect(() => {
    if (items.length === 0) return;
    const id = setInterval(async () => {
      try {
        const res = await validateSmartBasket(items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
        setValidationIssues(res.issues || []);
      } catch (_) { /* ignore */ }
    }, 60_000);
    return () => clearInterval(id);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className={styles.emptyBasket}>
        <EmptyState
          title="Basket is empty"
          text="All items were removed. Go back to build a new basket."
          actionLabel="Start over"
          onAction={onBack}
        />
      </div>
    );
  }

  return (
    <div className={styles.results}>
      {/* Budget progress bar */}
      <div className={styles.budgetBar}>
        <div className={styles.budgetBarHeader}>
          <span className={styles.budgetLabel}>
            Budget: {formatNaira(budgetCents)}
          </span>
          <span className={styles.budgetRemaining} style={{ color: remainingCents < 0 ? 'var(--color-danger)' : 'var(--color-herb)' }}>
            {remainingCents >= 0 ? `₦${(remainingCents / 100).toLocaleString()} remaining` : `₦${(Math.abs(remainingCents) / 100).toLocaleString()} over budget`}
          </span>
        </div>
        <div className={styles.budgetTrack} role="progressbar" aria-valuenow={budgetPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`${budgetPercent}% of budget used`}>
          <div
            className={styles.budgetFill}
            style={{
              width: `${budgetPercent}%`,
              backgroundColor: remainingCents < 0 ? 'var(--color-danger)' : budgetPercent > 90 ? 'var(--color-carrot)' : 'var(--color-herb)',
            }}
          />
        </div>
        <div className={styles.budgetStats}>
          <span>{result.farmerCount} farmer{result.farmerCount !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
          {result.marketCount > 0 && (
            <>
              <span>·</span>
              <span>{result.marketCount} market{result.marketCount !== 1 ? 's' : ''}</span>
            </>
          )}
        </div>
      </div>

      {/* Validation issues banner */}
      {validationIssues.length > 0 && (
        <div className={styles.issuesBanner} role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          <div>
            <strong>Stock changed:</strong>
            {validationIssues.map((issue) => (
              <p key={issue.productId} className={styles.issueText}>{issue.message}</p>
            ))}
          </div>
        </div>
      )}

      {/* Items list */}
      <ul className={styles.itemsList} aria-label="Basket items">
        {items.map((item) => {
          const issue = issueMap.get(item.productId);
          return (
            <li key={item.productId} className={`${styles.itemCard} ${issue ? styles.itemCardIssue : ''}`}>
              {/* Product art / icon */}
              <div className={styles.itemArt} aria-hidden="true">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className={styles.itemImg} />
                ) : (
                  <Illustration name={item.art || 'basket'} className={styles.itemIllustration} />
                )}
              </div>

              <div className={styles.itemBody}>
                <div className={styles.itemHeader}>
                  <div>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.itemFarmer}>{item.farmerName}</p>
                    {item.marketName && (
                      <p className={styles.itemMarket}>{item.marketName}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Remove ${item.name} from basket`}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>

                {issue && (
                  <p className={styles.itemIssue} role="alert">
                    <AlertCircle size={12} aria-hidden="true" />
                    {issue.message}
                  </p>
                )}

                <div className={styles.itemFooter}>
                  <div className={styles.itemPrice}>
                    <span className={styles.priceMain}>{formatNaira(item.priceCents * item.quantity)}</span>
                    <span className={styles.priceUnit}>{formatNaira(item.priceCents)} / {item.unit}</span>
                  </div>

                  {/* Availability badge */}
                  <span className={`${styles.availBadge} ${item.availability === 'low' ? styles.availLow : styles.availIn}`}>
                    {item.availability === 'low' ? `Low stock (${item.quantityAvailable})` : `In stock (${item.quantityAvailable})`}
                  </span>

                  {/* Quantity stepper */}
                  <div className={styles.stepper} role="group" aria-label={`Quantity for ${item.name}`}>
                    <button
                      type="button"
                      className={styles.stepperBtn}
                      onClick={() => updateQty(item.productId, -1)}
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      <Minus size={12} aria-hidden="true" />
                    </button>
                    <span className={styles.stepperQty} aria-live="polite">{item.quantity}</span>
                    <button
                      type="button"
                      className={styles.stepperBtn}
                      onClick={() => updateQty(item.productId, 1)}
                      disabled={item.quantity >= item.quantityAvailable}
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      <Plus size={12} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Total row */}
      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Total</span>
        <span className={styles.totalAmount}>{formatNaira(totalCents)}</span>
      </div>

      {/* Action buttons */}
      <div className={styles.actionRow}>
        <button type="button" className={styles.secondaryAction} onClick={onModify} aria-label="Modify basket criteria">
          <RotateCcw size={15} aria-hidden="true" />
          Modify
        </button>
        <button type="button" className={styles.secondaryAction} onClick={() => onViewMap(items)} aria-label="View basket items on map">
          <Map size={15} aria-hidden="true" />
          View on map
        </button>
        <Button
          type="button"
          variant="primary"
          className={styles.reserveBtn}
          onClick={() => onReserve(items)}
          disabled={isReserving || items.length === 0}
          aria-label="Reserve basket and proceed to checkout"
        >
          {isReserving ? 'Reserving…' : (
            <>Reserve <ArrowRight size={15} aria-hidden="true" /></>
          )}
        </Button>
      </div>
    </div>
  );
}

/** Step 3: Checkout confirmation */
function BasketCheckout({ items, result, onBack, onSuccess }) {
  const navigate = useNavigate();
  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [slotSelections, setSlotSelections] = useState({});

  // Build groups for cart quote
  const groups = Object.values(
    items.reduce((acc, item) => {
      const fId = item.farmerId;
      if (!acc[fId]) {
        acc[fId] = { farmerId: fId, items: [] };
      }
      acc[fId].items.push({ productId: item.productId, quantity: item.quantity });
      return acc;
    }, {})
  );

  useEffect(() => {
    const abortCtrl = new AbortController();
    setQuoteLoading(true);
    getCartQuote(groups, abortCtrl.signal)
      .then((data) => {
        if (!abortCtrl.signal.aborted) {
          setQuoteData(data);
          setQuoteLoading(false);
        }
      })
      .catch((err) => {
        if (!abortCtrl.signal.aborted) {
          setQuoteError(err?.message || 'Failed to get quote. Please try again.');
          setQuoteLoading(false);
        }
      });
    return () => abortCtrl.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlaceOrder = async () => {
    if (!quoteData || isPlacing) return;
    setIsPlacing(true);

    // Build checkout payload — add slot selections to each group
    const checkoutGroups = (quoteData.groups || groups).map((g) => ({
      ...g,
      slotStart: slotSelections[g.farmerId] || g.slotStart || null,
    }));

    const idempotencyKey = `sb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    try {
      await checkout({ groups: checkoutGroups }, idempotencyKey);
      onSuccess();
    } catch (err) {
      setQuoteError(err?.message || 'Order failed. Please try again.');
      setIsPlacing(false);
    }
  };

  if (quoteLoading) {
    return (
      <div className={styles.checkoutLoading}>
        <Skeleton height="80px" borderRadius="var(--radius-md)" />
        <Skeleton height="80px" borderRadius="var(--radius-md)" />
        <Skeleton height="60px" borderRadius="var(--radius-md)" />
      </div>
    );
  }

  if (quoteError) {
    return (
      <div className={styles.quoteError}>
        <AlertCircle size={24} className={styles.quoteErrorIcon} aria-hidden="true" />
        <p>{quoteError}</p>
        <Button variant="secondary" onClick={onBack}>Back to basket</Button>
      </div>
    );
  }

  const totalCents = quoteData?.totalCents || items.reduce((s, i) => s + i.priceCents * i.quantity, 0);

  return (
    <div className={styles.checkout}>
      <h2 className={styles.checkoutTitle}>Review your order</h2>

      {(quoteData?.groups || groups).map((g) => {
        const farmerName = items.find((i) => i.farmerId === g.farmerId)?.farmerName || 'Farmer';
        const farmerSlots = items.find((i) => i.farmerId === g.farmerId)?.farmerPickupWindows || [];
        return (
          <div key={g.farmerId} className={styles.checkoutGroup}>
            <h3 className={styles.checkoutGroupTitle}>{farmerName}</h3>
            <ul className={styles.checkoutItems}>
              {(g.items || []).map((item) => {
                const fullItem = items.find((i) => i.productId === (item.productId || item.id));
                return (
                  <li key={item.productId || item.id} className={styles.checkoutItem}>
                    <span className={styles.checkoutItemName}>{fullItem?.name || 'Item'}</span>
                    <span className={styles.checkoutItemQty}>×{item.quantity}</span>
                    <span className={styles.checkoutItemPrice}>{formatNaira(item.lineTotalCents || item.priceCents * item.quantity)}</span>
                  </li>
                );
              })}
            </ul>
            {farmerSlots.length > 0 && (
              <div className={styles.slotSelect}>
                <label className={styles.slotLabel} htmlFor={`slot-${g.farmerId}`}>
                  <Calendar size={14} aria-hidden="true" /> Pickup window
                </label>
                <select
                  id={`slot-${g.farmerId}`}
                  className={styles.select}
                  value={slotSelections[g.farmerId] || ''}
                  onChange={(e) => setSlotSelections((prev) => ({ ...prev, [g.farmerId]: e.target.value }))}
                  aria-label={`Select pickup slot for ${farmerName}`}
                >
                  <option value="">Choose a pickup time</option>
                  {farmerSlots.map((slot, i) => (
                    <option key={i} value={slot.start || slot.label}>
                      {slot.label || `${slot.day} ${slot.start}–${slot.end}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );
      })}

      <div className={styles.checkoutTotal}>
        <span>Total</span>
        <span className={styles.checkoutTotalAmount}>{formatNaira(totalCents)}</span>
      </div>

      <Button
        type="button"
        variant="primary"
        size="lg"
        className={styles.confirmBtn}
        onClick={handlePlaceOrder}
        disabled={isPlacing}
        aria-label="Confirm and place order"
      >
        {isPlacing ? 'Placing order…' : <><CheckCircle2 size={18} aria-hidden="true" /> Confirm Order</>}
      </Button>
    </div>
  );
}

/**
 * Smart Basket page — 3-step full-screen flow.
 * Step 1: Request form → Step 2: Basket results → Step 3: Checkout confirm
 */
export function SmartBasket() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openSheet } = useOpenSheet();

  // Pre-fill from assistant or location.state
  const prefill = location.state?.smartBasket || {};

  const [step, setStep] = useState(prefill.budget ? 2 : 1);
  const [formValues, setFormValues] = useState({
    budget: prefill.budget || '',
    categories: prefill.categories || ['vegetables', 'fruits', 'eggs'],
    marketId: prefill.marketId || '',
    pickupDay: prefill.pickupDay || 'sat',
  });
  const [result, setResult] = useState(null);
  const [items, setItems] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [isReserving, setIsReserving] = useState(false);
  const abortRef = useRef(null);

  // If pre-filled with budget, auto-generate on mount
  useEffect(() => {
    if (prefill.budget && prefill.categories?.length) {
      handleGenerate({ budget: prefill.budget, categories: prefill.categories, marketId: prefill.marketId || null, pickupDay: prefill.pickupDay || 'sat' });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = useCallback(async (values) => {
    setFormValues(values);
    setIsGenerating(true);
    setGenerateError(null);
    setStep(2);

    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const data = await generateSmartBasket(
        {
          budget: values.budget,
          categories: values.categories,
          marketId: values.marketId || undefined,
        },
        ctrl.signal
      );
      setResult(data);
      setIsGenerating(false);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setGenerateError(err?.message || 'Failed to build basket. Please try again.');
      setIsGenerating(false);
    }
  }, []);

  const handleViewOnMap = (basketItems) => {
    const farmerIds = [...new Set(basketItems.map((i) => i.farmerId))];
    const marketIds = [...new Set(basketItems.map((i) => i.marketId).filter(Boolean))];
    navigate('/buyer/markets', { state: { highlightFarmerIds: farmerIds, highlightMarketIds: marketIds } });
  };

  const handleReserve = (basketItems) => {
    setItems(basketItems);
    setStep(3);
  };

  const handleOrderSuccess = () => {
    navigate('/buyer/order-confirmed', { state: { fromBasket: true } });
  };

  const stepTitles = { 1: 'Smart Basket', 2: 'Your Basket', 3: 'Confirm Order' };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => {
            if (step === 1) navigate(-1);
            else setStep((s) => s - 1);
          }}
          aria-label={step === 1 ? 'Close' : 'Back'}
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <div className={styles.headerCenter}>
          <ShoppingBasket size={18} className={styles.headerIcon} aria-hidden="true" />
          <h1 className={styles.headerTitle}>{stepTitles[step]}</h1>
        </div>
        {/* Step indicator */}
        <div className={styles.stepIndicator} aria-label={`Step ${step} of 3`}>
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={`${styles.stepDot} ${s === step ? styles.stepDotActive : ''} ${s < step ? styles.stepDotDone : ''}`}
              aria-hidden="true"
            />
          ))}
        </div>
      </header>

      {/* Body */}
      <div className={styles.body}>
        {/* Step 1 */}
        {step === 1 && (
          <div className={styles.stepWrap}>
            <div className={styles.intro}>
              <div className={styles.introIllustration} aria-hidden="true">
                <Illustration name="basket" className={styles.introArt} />
              </div>
              <h2 className={styles.introTitle}>Tell us what you need</h2>
              <p className={styles.introText}>
                Set your budget, choose categories, and we'll build a basket from real local farmers.
              </p>
            </div>
            <BasketForm onSubmit={handleGenerate} initialValues={formValues} />
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className={styles.stepWrap}>
            {isGenerating && (
              <div className={styles.generating} aria-live="polite" aria-label="Building your basket">
                <div className={styles.generatingSpinner} aria-hidden="true" />
                <p className={styles.generatingText}>Finding the best products for your basket…</p>
                <div className={styles.skeletonGroup}>
                  <Skeleton height="100px" borderRadius="var(--radius-md)" />
                  <Skeleton height="100px" borderRadius="var(--radius-md)" />
                  <Skeleton height="100px" borderRadius="var(--radius-md)" />
                </div>
              </div>
            )}

            {!isGenerating && generateError && (
              <div className={styles.generateError}>
                <AlertCircle size={24} aria-hidden="true" className={styles.errorIcon} />
                <p className={styles.errorText}>{generateError}</p>
                <Button variant="secondary" onClick={() => { setGenerateError(null); setStep(1); }}>
                  Try again
                </Button>
              </div>
            )}

            {!isGenerating && !generateError && result && (
              <>
                {result.items.length === 0 ? (
                  <EmptyState
                    title="No products found"
                    text={result.message || 'No products are currently available matching your selection. Try different categories or a different market.'}
                    actionLabel="Try different categories"
                    onAction={() => setStep(1)}
                  />
                ) : (
                  <BasketResults
                    result={result}
                    onBack={() => setStep(1)}
                    onModify={() => setStep(1)}
                    onViewMap={handleViewOnMap}
                    onReserve={handleReserve}
                    isReserving={isReserving}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className={styles.stepWrap}>
            <BasketCheckout
              items={items}
              result={result}
              onBack={() => setStep(2)}
              onSuccess={handleOrderSuccess}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default SmartBasket;
