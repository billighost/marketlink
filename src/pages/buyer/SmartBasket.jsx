import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShoppingBasket, Sparkles, ChevronLeft, Map, Minus, Plus, X,
  Leaf, Apple, Egg, Milk, Wheat, Flower2, Package, AlertCircle,
  CheckCircle2, ArrowRight, RotateCcw, Calendar, Search, RefreshCw,
  MapPin, Store, Navigation, Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@/hooks/useQuery';
import { useOpenSheet } from '@/hooks/useOpenSheet';
import { getMarkets, getProducts } from '@/api/catalog';
import { generateSmartBasket, validateSmartBasket, getReplacements } from '@/api/smartBasket';
import { getCartQuote, checkout } from '@/api/orders';
import { MapView } from '@/components/domain/MapView';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { Illustration } from '@/components/domain/Illustration';
import styles from './SmartBasket.module.css';

const CATEGORY_OPTIONS = [
  { id: 'vegetables', label: 'Vegetables', Icon: Leaf },
  { id: 'fruit', label: 'Fruits', Icon: Apple },
  { id: 'dairy-and-eggs', label: 'Eggs & Dairy', Icon: Egg },
  { id: 'bakery', label: 'Bakery', Icon: Wheat },
  { id: 'herbs-and-flowers', label: 'Herbs & Flowers', Icon: Flower2 },
  { id: 'meat-and-fish', label: 'Meat & Fish', Icon: Package },
];

const PICKUP_DAYS = [
  { label: 'Wednesday', val: 'wed' },
  { label: 'Friday', val: 'fri' },
  { label: 'Saturday', val: 'sat' },
  { label: 'Sunday', val: 'sun' },
];

const QUICK_PROMPTS = [
  {
    label: '₦10,000 for veggies, fruits & eggs on Saturday',
    budget: 10000,
    categories: ['vegetables', 'fruit', 'dairy-and-eggs'],
    day: 'sat',
  },
  {
    label: '₦5,000 fresh vegetables & herbs',
    budget: 5000,
    categories: ['vegetables', 'herbs-and-flowers'],
    day: 'sat',
  },
  {
    label: '₦8,000 weekend bakery & farm eggs',
    budget: 8000,
    categories: ['bakery', 'dairy-and-eggs'],
    day: 'sat',
  },
];

function formatNaira(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '₦0';
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}

/** Step 1: Request form */
function BasketForm({ onSubmit, initialValues = {} }) {
  const [prompt, setPrompt] = useState(initialValues.prompt || '');
  const [budget, setBudget] = useState(initialValues.budget || '');
  const [categories, setCategories] = useState(initialValues.categories || ['vegetables', 'fruit', 'dairy-and-eggs']);
  const [marketId, setMarketId] = useState(initialValues.marketId || '');
  const [pickupDay, setPickupDay] = useState(initialValues.pickupDay || 'sat');
  const [error, setError] = useState('');

  const { data: marketsData } = useQuery(['markets-for-basket'], ({ signal }) =>
    getMarkets({}, signal)
  );
  const markets = marketsData?.data || [];

  const handleApplyQuickPrompt = (qp) => {
    setPrompt(qp.label);
    setBudget(qp.budget);
    setCategories(qp.categories);
    setPickupDay(qp.day);
    setError('');
  };

  const handlePromptChange = (val) => {
    setPrompt(val);
    setError('');
    // Dynamically extract budget if present
    const budgetMatch = val.match(/[₦#]?\s*(\d{1,3}(?:,\d{3})+|\d{3,7})/);
    if (budgetMatch) {
      const parsed = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) setBudget(parsed);
    }
    // Dynamically detect categories
    const found = [];
    const lower = val.toLowerCase();
    if (/vegetable|veggie|greens|spinach|tomato|carrot|kale/.test(lower)) found.push('vegetables');
    if (/fruit|banana|apple|berries|strawberry|pineapple/.test(lower)) found.push('fruit');
    if (/egg|dairy|milk|cheese/.test(lower)) found.push('dairy-and-eggs');
    if (/bread|bakery|loaf|pastry/.test(lower)) found.push('bakery');
    if (/herb|flower|lavender|basil/.test(lower)) found.push('herbs-and-flowers');
    if (/meat|fish|chicken|beef|sausage/.test(lower)) found.push('meat-and-fish');
    if (found.length > 0) setCategories(found);
  };

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
    onSubmit({
      prompt: prompt.trim() || undefined,
      budget: num,
      categories,
      marketId: marketId || null,
      pickupDay,
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {/* Natural language description */}
      <div className={styles.promptSection}>
        <label className={styles.fieldLabel} htmlFor="basket-prompt">
          Describe what you need <span className={styles.optional}>(or customize below)</span>
        </label>
        <textarea
          id="basket-prompt"
          className={styles.promptTextarea}
          placeholder="e.g. I have ₦10,000. I need vegetables, fruits and eggs for Saturday."
          value={prompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          aria-label="Describe what you want to buy and your budget"
        />
        <div className={styles.promptPillsWrap} role="group" aria-label="Example requests">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              className={styles.promptPill}
              onClick={() => handleApplyQuickPrompt(qp)}
            >
              <Sparkles size={11} aria-hidden="true" />
              <span>{qp.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.promptDivider}>or set specific preferences</div>

      {/* Budget input */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="basket-budget">
          Your budget
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
            step="100"
            inputMode="numeric"
            autoComplete="off"
            aria-label="Budget in naira"
          />
        </div>
      </div>

      {/* Category selector */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>What categories do you need?</label>
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
        Build Smart Basket
      </Button>
    </form>
  );
}

/** Modal to replace an item with alternative in-stock products */
function ReplacementModal({ product, marketId, onClose, onSelectReplacement }) {
  const [replacements, setReplacements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getReplacements(product.productId, { marketId })
      .then((data) => {
        if (active) setReplacements(data || []);
      })
      .catch(() => {
        if (active) setReplacements([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [product.productId, marketId]);

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Replace {product.name}</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close replacement modal">
            <X size={16} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-soft)', margin: '0 0 var(--space-2)' }}>
            Choose an in-stock harvest from local farmers in this category:
          </p>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Skeleton height="56px" borderRadius="var(--radius-md)" />
              <Skeleton height="56px" borderRadius="var(--radius-md)" />
              <Skeleton height="56px" borderRadius="var(--radius-md)" />
            </div>
          ) : replacements.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-ink-soft)', padding: '24px 0' }}>
              No alternative products currently available.
            </p>
          ) : (
            replacements.map((rep) => (
              <div
                key={rep.productId || rep.id}
                className={styles.replacementCard}
                onClick={() => onSelectReplacement(product, rep)}
              >
                <div className={styles.replacementInfo}>
                  <strong className={styles.replacementName}>{rep.name}</strong>
                  <span className={styles.replacementFarmer}>{rep.farmerName}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={styles.replacementPrice}>
                    {formatNaira(rep.priceNaira || rep.priceCents)}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-herb)' }}>In stock ({rep.quantityAvailable})</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/** Step 2: Basket results + Live Map connection */
function BasketResults({
  result,
  onBack,
  onModify,
  onPlanVisit,
  onReserve,
  isReserving,
}) {
  const { openSheet } = useOpenSheet();
  const [items, setItems] = useState(() =>
    result.items.map((item) => ({ ...item }))
  );
  const [budgetNaira, setBudgetNaira] = useState(result.budgetNaira || result.budget || 10000);
  const [validationIssues, setValidationIssues] = useState([]);
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'map'
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [replacingProduct, setReplacingProduct] = useState(null);

  // Recalculate dynamic totals in Naira
  const totalNaira = items.reduce((sum, i) => sum + (i.priceNaira || i.priceCents) * i.quantity, 0);
  const remainingNaira = Math.max(0, budgetNaira - totalNaira);
  const budgetPercent = Math.min(100, Math.round((totalNaira / budgetNaira) * 100));

  const issueMap = new Map(validationIssues.map((i) => [i.productId, i]));

  const updateQty = (productId, delta) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const newQty = Math.max(0, Math.min(item.quantityAvailable, item.quantity + delta));
          return { ...item, quantity: newQty };
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleSwapReplacement = (oldItem, newItem) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId === oldItem.productId) {
          return {
            ...oldItem,
            productId: newItem.productId || newItem.id,
            name: newItem.name,
            priceCents: newItem.priceCents,
            priceNaira: newItem.priceNaira || newItem.priceCents,
            quantity: 1,
            quantityAvailable: newItem.quantityAvailable,
            farmerId: newItem.farmerId,
            farmerName: newItem.farmerName,
            art: newItem.art,
            imageUrl: newItem.imageUrl,
          };
        }
        return i;
      })
    );
    setReplacingProduct(null);
  };

  // Build Leaflet markers from basket items
  const mapMarkers = useMemo(() => {
    const markers = [];
    const seenFarmers = new Set();
    const seenMarkets = new Set();

    items.forEach((item) => {
      // Market marker
      if (item.marketId && item.marketLocation?.lat && !seenMarkets.has(item.marketId)) {
        seenMarkets.add(item.marketId);
        markers.push({
          id: `m-${item.marketId}`,
          lat: item.marketLocation.lat,
          lng: item.marketLocation.lng,
          label: item.marketName || 'Market',
          subtitle: item.marketAddress || 'Pickup Market',
          markerType: 'market',
          highlight: selectedItemId === item.productId,
        });
      }

      // Farmer marker
      if (item.farmerId && !seenFarmers.has(item.farmerId)) {
        seenFarmers.add(item.farmerId);
        const loc = item.farmerLocation || item.marketLocation;
        if (loc?.lat && loc?.lng) {
          markers.push({
            id: item.farmerId,
            lat: loc.lat,
            lng: loc.lng,
            label: item.farmerName,
            subtitle: `${item.name} · ${formatNaira(item.priceNaira || item.priceCents)}`,
            markerType: 'farmer',
            highlight: selectedItemId === item.productId,
          });
        }
      }
    });

    return markers;
  }, [items, selectedItemId]);

  // Group items by market -> farmer for the hierarchical tree
  const marketHierarchy = useMemo(() => {
    const mgMap = new Map();
    items.forEach((item) => {
      const mId = item.marketId || 'general';
      if (!mgMap.has(mId)) {
        mgMap.set(mId, {
          marketId: mId,
          marketName: item.marketName || 'Local Farmers Market',
          marketAddress: item.marketAddress,
          farmers: new Map(),
        });
      }
      const mg = mgMap.get(mId);
      const fId = item.farmerId;
      if (!mg.farmers.has(fId)) {
        mg.farmers.set(fId, {
          farmerId: fId,
          farmerName: item.farmerName,
          items: [],
        });
      }
      mg.farmers.get(fId).items.push(item);
    });

    return [...mgMap.values()].map((mg) => ({
      ...mg,
      farmers: [...mg.farmers.values()],
    }));
  }, [items]);

  // Auto-validate stock every 45s
  useEffect(() => {
    if (items.length === 0) return;
    const id = setInterval(async () => {
      try {
        const res = await validateSmartBasket(
          items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
        );
        setValidationIssues(res.issues || []);
      } catch (_) {}
    }, 45_000);
    return () => clearInterval(id);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className={styles.emptyBasket}>
        <EmptyState
          title="Basket is empty"
          text="All items were removed. Build a new basket with your preferred budget."
          actionLabel="Build new basket"
          onAction={onBack}
        />
      </div>
    );
  }

  const selectedFarmerId = items.find((i) => i.productId === selectedItemId)?.farmerId;

  return (
    <div className={styles.results}>
      {/* View Toggle Bar */}
      <div className={styles.viewToggleRow}>
        <button
          type="button"
          className={`${styles.toggleTabBtn} ${activeTab === 'items' ? styles.toggleTabBtnActive : ''}`}
          onClick={() => setActiveTab('items')}
          aria-pressed={activeTab === 'items'}
        >
          <ShoppingBasket size={15} aria-hidden="true" />
          <span>Basket Items ({items.length})</span>
        </button>
        <button
          type="button"
          className={`${styles.toggleTabBtn} ${activeTab === 'map' ? styles.toggleTabBtnActive : ''}`}
          onClick={() => setActiveTab('map')}
          aria-pressed={activeTab === 'map'}
        >
          <Map size={15} aria-hidden="true" />
          <span>Live Market Map</span>
        </button>
      </div>

      {/* Budget Progress Bar */}
      <div className={styles.budgetBar}>
        <div className={styles.budgetBarHeader}>
          <span className={styles.budgetLabel}>
            Budget: {formatNaira(budgetNaira)}
          </span>
          <span
            className={styles.budgetRemaining}
            style={{ color: remainingNaira < 0 ? 'var(--color-danger)' : 'var(--color-herb)' }}
          >
            {remainingNaira >= 0
              ? `${formatNaira(remainingNaira)} remaining`
              : `${formatNaira(Math.abs(remainingNaira))} over budget`}
          </span>
        </div>

        <div
          className={styles.budgetTrack}
          role="progressbar"
          aria-valuenow={budgetPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={styles.budgetFill}
            style={{
              width: `${budgetPercent}%`,
              backgroundColor:
                remainingNaira < 0
                  ? 'var(--color-danger)'
                  : budgetPercent > 90
                  ? 'var(--color-carrot)'
                  : 'var(--color-herb)',
            }}
          />
        </div>

        <div className={styles.budgetStatsRow}>
          <span>
            {result.farmerCount || new Set(items.map((i) => i.farmerId)).size} farmers · {items.length} items
          </span>
          <div className={styles.budgetAdjustGroup}>
            <button
              type="button"
              className={styles.adjustBudgetBtn}
              onClick={() => setBudgetNaira((b) => Math.max(1000, b - 1000))}
              aria-label="Decrease budget by ₦1,000"
            >
              -₦1,000
            </button>
            <button
              type="button"
              className={styles.adjustBudgetBtn}
              onClick={() => setBudgetNaira((b) => b + 1000)}
              aria-label="Increase budget by ₦1,000"
            >
              +₦1,000
            </button>
          </div>
        </div>
      </div>

      {/* Validation issues banner */}
      {validationIssues.length > 0 && (
        <div className={styles.issuesBanner} role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <div>
            <strong>Inventory update:</strong>
            {validationIssues.map((issue) => (
              <p key={issue.productId} className={styles.issueText}>
                {issue.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: Items List */}
      {activeTab === 'items' && (
        <>
          <ul className={styles.itemsList} aria-label="Basket items">
            {items.map((item) => {
              const issue = issueMap.get(item.productId);
              const isSelected = selectedItemId === item.productId;
              const itemTotal = (item.priceNaira || item.priceCents) * item.quantity;

              return (
                <li
                  key={item.productId}
                  className={`${styles.itemCard} ${isSelected ? styles.itemCardSelected : ''} ${issue ? styles.itemCardIssue : ''}`}
                  onClick={() => setSelectedItemId(item.productId)}
                >
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
                        <h3
                          className={styles.itemName}
                          onClick={(e) => {
                            e.stopPropagation();
                            openSheet(`/buyer/products/${item.productId}`);
                          }}
                        >
                          {item.name}
                        </h3>
                        <p
                          className={styles.itemFarmer}
                          onClick={(e) => {
                            e.stopPropagation();
                            openSheet(`/buyer/farmers/${item.farmerId}`);
                          }}
                        >
                          {item.farmerName}
                        </p>
                        {item.marketName && (
                          <p className={styles.itemMarket}>📍 {item.marketName}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.productId);
                        }}
                        aria-label={`Remove ${item.name} from basket`}
                      >
                        <X size={15} aria-hidden="true" />
                      </button>
                    </div>

                    <div className={styles.itemFooter}>
                      <div className={styles.itemPrice}>
                        <span className={styles.priceMain}>{formatNaira(itemTotal)}</span>
                        <span className={styles.priceUnit}>
                          {formatNaira(item.priceNaira || item.priceCents)} / {item.unit}
                        </span>
                      </div>

                      <div className={styles.itemControls}>
                        {/* Replace Button */}
                        <button
                          type="button"
                          className={styles.replaceBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplacingProduct(item);
                          }}
                          aria-label={`Replace ${item.name}`}
                        >
                          <RefreshCw size={11} aria-hidden="true" />
                          <span>Replace</span>
                        </button>

                        {/* Availability badge */}
                        <span
                          className={`${styles.availBadge} ${item.availability === 'low' ? styles.availLow : styles.availIn}`}
                        >
                          {item.quantityAvailable} available
                        </span>

                        {/* Quantity Stepper */}
                        <div className={styles.stepper} role="group" aria-label={`Quantity for ${item.name}`}>
                          <button
                            type="button"
                            className={styles.stepperBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQty(item.productId, -1);
                            }}
                            aria-label={`Decrease ${item.name} quantity`}
                          >
                            <Minus size={11} aria-hidden="true" />
                          </button>
                          <span className={styles.stepperQty}>{item.quantity}</span>
                          <button
                            type="button"
                            className={styles.stepperBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQty(item.productId, 1);
                            }}
                            disabled={item.quantity >= item.quantityAvailable}
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            <Plus size={11} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Add product button */}
          <button
            type="button"
            className={styles.addProductBtn}
            onClick={() => openSheet('/buyer/products')}
            aria-label="Add more products from the catalog"
          >
            <Plus size={16} aria-hidden="true" />
            <span>Add more farm products</span>
          </button>
        </>
      )}

      {/* TAB 2: Live Market Map & Stalls Hierarchy */}
      {activeTab === 'map' && (
        <div className={styles.mapViewSection}>
          <MapView
            markers={mapMarkers}
            selectedId={selectedFarmerId}
            height="320px"
            interactive={true}
            showDirectionsLink={true}
            onSelect={(m) => {
              if (m.markerType === 'farmer') {
                const matched = items.find((i) => i.farmerId === m.id);
                if (matched) setSelectedItemId(matched.productId);
              }
            }}
          />

          {/* Hierarchical Map Tree */}
          <div className={styles.mapTreeCard}>
            <h4 className={styles.mapTreeTitle}>
              <Navigation size={14} aria-hidden="true" />
              <span>Basket Stall Pickup Route</span>
            </h4>

            {marketHierarchy.map((mg) => (
              <div key={mg.marketId} className={styles.marketBranch}>
                <div className={styles.marketBranchTitle}>📍 {mg.marketName}</div>

                {mg.farmers.map((farmer) => (
                  <div key={farmer.farmerId} className={styles.farmerBranch}>
                    <div
                      className={styles.farmerBranchTitle}
                      onClick={() => {
                        const firstItem = farmer.items[0];
                        if (firstItem) setSelectedItemId(firstItem.productId);
                      }}
                    >
                      🌱 {farmer.farmerName} ({farmer.items.length} item{farmer.items.length !== 1 ? 's' : ''})
                    </div>

                    {farmer.items.map((i) => (
                      <div
                        key={i.productId}
                        className={styles.itemBranchItem}
                        onClick={() => setSelectedItemId(i.productId)}
                        style={{
                          fontWeight: selectedItemId === i.productId ? '600' : '400',
                          color: selectedItemId === i.productId ? 'var(--color-beet)' : undefined,
                        }}
                      >
                        <span>• {i.name} (×{i.quantity})</span>
                        <span>{formatNaira((i.priceNaira || i.priceCents) * i.quantity)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total row */}
      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Total Basket</span>
        <span className={styles.totalAmount}>{formatNaira(totalNaira)}</span>
      </div>

      {/* Action buttons */}
      <div className={styles.actionRow}>
        <button
          type="button"
          className={styles.secondaryAction}
          onClick={onModify}
          aria-label="Modify basket criteria"
        >
          <RotateCcw size={15} aria-hidden="true" />
          <span>Criteria</span>
        </button>

        <button
          type="button"
          className={styles.secondaryAction}
          onClick={() => onPlanVisit(items)}
          aria-label="Plan your visit and pickup stops"
        >
          <Calendar size={15} aria-hidden="true" />
          <span>Visit Planner</span>
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
            <>
              <span>Reserve Basket</span>
              <ArrowRight size={15} aria-hidden="true" />
            </>
          )}
        </Button>
      </div>

      {/* Replacement Modal */}
      {replacingProduct && (
        <ReplacementModal
          product={replacingProduct}
          marketId={replacingProduct.marketId}
          onClose={() => setReplacingProduct(null)}
          onSelectReplacement={handleSwapReplacement}
        />
      )}
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

  const groups = useMemo(() => {
    return Object.values(
      items.reduce((acc, item) => {
        const fId = item.farmerId;
        if (!acc[fId]) {
          acc[fId] = { farmerId: fId, items: [] };
        }
        acc[fId].items.push({ productId: item.productId, quantity: item.quantity });
        return acc;
      }, {})
    );
  }, [items]);

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
  }, [groups]);

  const handlePlaceOrder = async () => {
    if (!quoteData || isPlacing) return;
    setIsPlacing(true);

    const checkoutGroups = (quoteData.groups || groups).map((g) => ({
      ...g,
      slotStart: slotSelections[g.farmerId] || g.slotStart || new Date().toISOString(),
    }));

    const idempotencyKey = `sb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    try {
      await checkout({ groups: checkoutGroups }, idempotencyKey);
      onSuccess();
    } catch (err) {
      setQuoteError(err?.message || 'Order reservation failed. Please try again.');
      setIsPlacing(false);
    }
  };

  if (quoteLoading) {
    return (
      <div className={styles.generating}>
        <div className={styles.generatingSpinner} aria-hidden="true" />
        <p className={styles.generatingText}>Verifying inventory and securing harvest slots…</p>
        <div className={styles.skeletonGroup}>
          <Skeleton height="70px" borderRadius="var(--radius-md)" />
          <Skeleton height="70px" borderRadius="var(--radius-md)" />
        </div>
      </div>
    );
  }

  if (quoteError) {
    return (
      <div className={styles.generateError}>
        <AlertCircle size={28} className={styles.errorIcon} aria-hidden="true" />
        <p className={styles.errorText}>{quoteError}</p>
        <Button variant="secondary" onClick={onBack}>Back to basket</Button>
      </div>
    );
  }

  const totalNaira = items.reduce((s, i) => s + (i.priceNaira || i.priceCents) * i.quantity, 0);

  return (
    <div className={styles.checkout}>
      <h2 className={styles.checkoutTitle}>Review & Reserve Pre-Order</h2>

      {(quoteData?.groups || groups).map((g) => {
        const farmerName = items.find((i) => i.farmerId === g.farmerId)?.farmerName || 'Farmer';
        const farmerSlots = items.find((i) => i.farmerId === g.farmerId)?.farmerPickupWindows || [];

        return (
          <div key={g.farmerId} className={styles.checkoutGroup}>
            <h3 className={styles.checkoutGroupTitle}>🌱 {farmerName}</h3>
            <ul className={styles.checkoutItems}>
              {(g.items || []).map((item) => {
                const fullItem = items.find((i) => i.productId === (item.productId || item.id));
                const itemNaira = fullItem?.priceNaira || item.priceCents;
                return (
                  <li key={item.productId || item.id} className={styles.checkoutItem}>
                    <span className={styles.checkoutItemName}>{fullItem?.name || 'Item'}</span>
                    <span className={styles.checkoutItemQty}>×{item.quantity}</span>
                    <span className={styles.checkoutItemPrice}>{formatNaira(itemNaira * item.quantity)}</span>
                  </li>
                );
              })}
            </ul>

            {farmerSlots.length > 0 && (
              <div className={styles.slotSelect}>
                <label className={styles.slotLabel} htmlFor={`slot-${g.farmerId}`}>
                  <Calendar size={14} aria-hidden="true" />
                  <span>Pickup window at stall</span>
                </label>
                <select
                  id={`slot-${g.farmerId}`}
                  className={styles.select}
                  value={slotSelections[g.farmerId] || ''}
                  onChange={(e) =>
                    setSlotSelections((prev) => ({ ...prev, [g.farmerId]: e.target.value }))
                  }
                  aria-label={`Select pickup slot for ${farmerName}`}
                >
                  <option value="">Select Saturday pickup time</option>
                  {farmerSlots.map((slot, i) => (
                    <option key={i} value={slot.start || slot.label || '09:00 AM'}>
                      {slot.label || `${slot.day || 'Saturday'} 8:00 AM – 1:00 PM`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );
      })}

      <div className={styles.checkoutTotal}>
        <span>Total Reservation</span>
        <span className={styles.checkoutTotalAmount}>{formatNaira(totalNaira)}</span>
      </div>

      <Button
        type="button"
        variant="primary"
        size="lg"
        className={styles.confirmBtn}
        onClick={handlePlaceOrder}
        disabled={isPlacing}
        aria-label="Confirm pre-order reservation"
      >
        {isPlacing ? (
          'Placing pre-order…'
        ) : (
          <>
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>Confirm Pre-Order</span>
          </>
        )}
      </Button>
    </div>
  );
}

/**
 * Smart Basket flagship page — 3-step wizard with connected Live Map.
 */
export function SmartBasket() {
  const navigate = useNavigate();
  const location = useLocation();

  const prefill = location.state?.smartBasket || {};

  const [step, setStep] = useState(prefill.budget ? 2 : 1);
  const [formValues, setFormValues] = useState({
    prompt: prefill.prompt || '',
    budget: prefill.budget || '',
    categories: prefill.categories || ['vegetables', 'fruit', 'dairy-and-eggs'],
    marketId: prefill.marketId || '',
    pickupDay: prefill.pickupDay || 'sat',
  });
  const [result, setResult] = useState(null);
  const [items, setItems] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [isReserving, setIsReserving] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    if (prefill.budget && prefill.categories?.length) {
      handleGenerate({
        prompt: prefill.prompt,
        budget: prefill.budget,
        categories: prefill.categories,
        marketId: prefill.marketId || null,
        pickupDay: prefill.pickupDay || 'sat',
      });
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
          prompt: values.prompt || undefined,
          budget: values.budget,
          categories: values.categories,
          marketId: values.marketId || undefined,
        },
        ctrl.signal
      );
      setResult(data);
      setItems(data.items || []);
      setIsGenerating(false);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setGenerateError(err?.message || 'Failed to build basket. Please try again.');
      setIsGenerating(false);
    }
  }, []);

  const handlePlanVisit = (basketItems) => {
    navigate('/buyer/visit-planner', { state: { items: basketItems } });
  };

  const handleReserve = (basketItems) => {
    setItems(basketItems);
    setStep(3);
  };

  const handleOrderSuccess = () => {
    navigate('/buyer/order-confirmed', { state: { fromBasket: true } });
  };

  const stepTitles = { 1: 'Smart Basket', 2: 'Your Smart Basket', 3: 'Reserve Order' };

  return (
    <div className={styles.page}>
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

      <div className={styles.body}>
        {step === 1 && (
          <div className={styles.stepWrap}>
            <div className={styles.intro}>
              <div className={styles.introIllustration} aria-hidden="true">
                <Illustration name="basket" className={styles.introArt} />
              </div>
              <h2 className={styles.introTitle}>Tell us what you need</h2>
              <p className={styles.introText}>
                Set your budget, pick what you need, and MarketLink will assemble a fresh basket from real local farmers.
              </p>
            </div>
            <BasketForm onSubmit={handleGenerate} initialValues={formValues} />
          </div>
        )}

        {step === 2 && (
          <div className={styles.stepWrap}>
            {isGenerating && (
              <div className={styles.generating} aria-live="polite" aria-label="Building your basket">
                <div className={styles.generatingSpinner} aria-hidden="true" />
                <p className={styles.generatingText}>Finding the best harvest from local farmers…</p>
                <div className={styles.skeletonGroup}>
                  <Skeleton height="90px" borderRadius="var(--radius-lg)" />
                  <Skeleton height="90px" borderRadius="var(--radius-lg)" />
                  <Skeleton height="90px" borderRadius="var(--radius-lg)" />
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
                    text={result.message || 'No products are currently available matching your selection. Try different categories or another market.'}
                    actionLabel="Try different categories"
                    onAction={() => setStep(1)}
                  />
                ) : (
                  <BasketResults
                    result={result}
                    onBack={() => setStep(1)}
                    onModify={() => setStep(1)}
                    onPlanVisit={handlePlanVisit}
                    onReserve={handleReserve}
                    isReserving={isReserving}
                  />
                )}
              </>
            )}
          </div>
        )}

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
