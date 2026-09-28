import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShoppingBasket,
  Search,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  Calendar,
  Clock,
  Store,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  X,
  ChevronDown,
  Tag,
  SlidersHorizontal,
  Star,
  Coins,
  DollarSign,
  Sprout,
} from 'lucide-react';
import {
  generateSmartBasket,
  getSmartBasketOptions,
  searchBasketProducts,
  validateSmartBasket,
  recalculateSmartBasket,
} from '@/api/smartBasket';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice, formatNaira } from '@/utils/format';
import Illustration from '@/components/domain/Illustration';
import styles from './SmartBasketExperience.module.css';

const DEFAULT_PRESET_PROMPT = 'I have $50. I need vegetables, fruits and eggs for Saturday.';

const PLACEHOLDER_PROMPTS = [
  'I have $50. I need vegetables, fruits and eggs for Saturday.',
  'Fresh salad greens, sweet tomatoes and raw honey under $30',
  'Weekend family basket with bakery, eggs and cheese for $65',
  'Seasonal berry mix and fresh artisan milk for Sunday pickup',
  'Weekly vegan pantry essentials within $40',
];

export function SmartBasketExperience({
  initialParams,
  onClose,
  embedded = false,
}) {
  const navigate = useNavigate();
  const { add } = useCart();
  const { showToast } = useToast();
  const controlsRef = useRef(null);
  const searchInputRef = useRef(null);

  const [options, setOptions] = useState({
    markets: [],
    categories: [],
    operatingDays: [],
    presetPrompts: [],
  });
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [prompt, setPrompt] = useState(initialParams?.prompt || DEFAULT_PRESET_PROMPT);
  const [budget, setBudget] = useState(initialParams?.budget || 50);
  const [selectedMarketId, setSelectedMarketId] = useState(initialParams?.marketId || '');
  const [selectedDay, setSelectedDay] = useState(initialParams?.day || 'sat');
  const [selectedPickupDate, setSelectedPickupDate] = useState(initialParams?.pickupDate || '');
  const [selectedPickupTime, setSelectedPickupTime] = useState(initialParams?.pickupTime || '');

  const [basket, setBasket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModifying, setIsModifying] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const [replaceTarget, setReplaceTarget] = useState(null);
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [reserving, setReserving] = useState(false);

  const [placeholderText, setPlaceholderText] = useState('');
  useEffect(() => {
    let promptIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timer = null;

    const tick = () => {
      const fullText = PLACEHOLDER_PROMPTS[promptIdx];

      if (!isDeleting) {
        charIdx++;
        setPlaceholderText(fullText.slice(0, charIdx));

        if (charIdx >= fullText.length) {
          isDeleting = true;
          timer = setTimeout(tick, 2600);
          return;
        }
        timer = setTimeout(tick, 40);
      } else {
        charIdx--;
        setPlaceholderText(fullText.slice(0, charIdx));

        if (charIdx <= 0) {
          isDeleting = false;
          promptIdx = (promptIdx + 1) % PLACEHOLDER_PROMPTS.length;
          timer = setTimeout(tick, 400);
          return;
        }
        timer = setTimeout(tick, 20);
      }
    };

    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (initialParams) {
      if (initialParams.prompt !== undefined) setPrompt(initialParams.prompt);
      if (initialParams.budget !== undefined) setBudget(Number(initialParams.budget));
      if (initialParams.marketId !== undefined) setSelectedMarketId(initialParams.marketId);
      if (initialParams.day !== undefined) setSelectedDay(initialParams.day);
      if (initialParams.pickupDate !== undefined) setSelectedPickupDate(initialParams.pickupDate);
      if (initialParams.pickupTime !== undefined) setSelectedPickupTime(initialParams.pickupTime);
    }
  }, [initialParams]);

  useEffect(() => {
    let mounted = true;
    async function loadOptions() {
      try {
        setLoadingOptions(true);
        const data = await getSmartBasketOptions();
        if (mounted && data) {
          setOptions(data);
          if (!selectedDay && data.operatingDays?.length > 0) {
            const satDay = data.operatingDays.find((d) => d.dayCode === 'sat');
            setSelectedDay(satDay ? 'sat' : data.operatingDays[0].dayCode);
            setSelectedPickupDate(satDay ? satDay.date : data.operatingDays[0].date);
          }
        }
      } catch (err) {
        console.error('Failed to load Smart Basket options', err);
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    }
    loadOptions();
    return () => {
      mounted = false;
    };
  }, []);

  const handleGenerate = useCallback(
    async (overridePayload = null) => {
      setLoading(true);
      setError(null);
      try {
        const payload = overridePayload || {
          prompt: prompt.trim() || undefined,
          budget: budget ? Number(budget) : undefined,
          marketId: selectedMarketId || undefined,
          day: selectedDay || undefined,
          pickupDate: selectedPickupDate || undefined,
          pickupTime: selectedPickupTime || undefined,
        };

        const res = await generateSmartBasket(payload);
        if (res) {
          setBasket(res);
          if (res.budget) setBudget(res.budget);
          if (res.day) setSelectedDay(res.day);
          if (res.marketId) setSelectedMarketId(res.marketId);
          if (res.pickupTime) setSelectedPickupTime(res.pickupTime);
        }
      } catch (err) {
        console.error('Error generating Smart Basket:', err);
        setError(err.message || 'Unable to generate basket suggestions right now. Please try adjusting your request.');
      } finally {
        setLoading(false);
      }
    },
    [prompt, budget, selectedMarketId, selectedDay, selectedPickupDate, selectedPickupTime]
  );

  useEffect(() => {
    handleGenerate({
      prompt: initialParams?.prompt || DEFAULT_PRESET_PROMPT,
      budget: initialParams?.budget ? Number(initialParams.budget) : 50,
      marketId: initialParams?.marketId || undefined,
      day: initialParams?.day || 'sat',
      pickupDate: initialParams?.pickupDate || undefined,
    });
  }, []);

  const items = basket?.items || [];
  const currentTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  }, [items]);

  const currentBudget = Number(budget) || 50;
  const currentBudgetCents = currentBudget < 1000 ? Math.round(currentBudget * 100) : Math.round(currentBudget);
  const currentRemaining = Math.max(0, currentBudgetCents - currentTotal);
  const spentPercent = currentBudgetCents > 0 ? Math.min(100, Math.round((currentTotal / currentBudgetCents) * 100)) : 0;
  const isOverBudget = currentTotal > currentBudgetCents;

  const handleIncreaseQty = (productId) => {
    setBasket((prev) => {
      if (!prev) return prev;
      const updated = prev.items.map((it) => {
        if (it.productId === productId) {
          const max = it.quantityAvailable || 99;
          const nextQty = Math.min(max, it.quantity + 1);
          return {
            ...it,
            quantity: nextQty,
            lineTotalCents: it.priceCents * nextQty,
          };
        }
        return it;
      });
      const newTotal = updated.reduce((s, it) => s + it.lineTotalCents, 0);
      return {
        ...prev,
        items: updated,
        totalCents: newTotal,
        remainingBudgetCents: Math.max(0, currentBudgetCents - newTotal),
      };
    });
  };

  const handleDecreaseQty = (productId) => {
    setBasket((prev) => {
      if (!prev) return prev;
      const target = prev.items.find((it) => it.productId === productId);
      if (!target) return prev;

      let updated;
      if (target.quantity <= 1) {
        updated = prev.items.filter((it) => it.productId !== productId);
      } else {
        const nextQty = target.quantity - 1;
        updated = prev.items.map((it) =>
          it.productId === productId
            ? { ...it, quantity: nextQty, lineTotalCents: it.priceCents * nextQty }
            : it
        );
      }

      const newTotal = updated.reduce((s, it) => s + it.lineTotalCents, 0);
      return {
        ...prev,
        items: updated,
        totalCents: newTotal,
        remainingBudgetCents: Math.max(0, currentBudgetCents - newTotal),
      };
    });
  };

  const handleRemoveItem = (productId) => {
    setBasket((prev) => {
      if (!prev) return prev;
      const target = prev.items.find((it) => it.productId === productId);
      const updated = prev.items.filter((it) => it.productId !== productId);
      const newTotal = updated.reduce((s, it) => s + it.lineTotalCents, 0);
      if (target) {
        showToast(`Removed ${target.name} from basket`);
      }
      return {
        ...prev,
        items: updated,
        totalCents: newTotal,
        remainingBudgetCents: Math.max(0, currentBudgetCents - newTotal),
      };
    });
  };

  const handleReplaceItem = (oldProductId, newProd) => {
    setBasket((prev) => {
      if (!prev) return prev;
      const targetOld = prev.items.find((it) => it.productId === oldProductId);
      if (!targetOld) return prev;

      const replacementItem = {
        productId: newProd.productId,
        name: newProd.name,
        priceCents: newProd.priceCents,
        unit: newProd.unit,
        quantity: 1,
        lineTotalCents: newProd.priceCents * 1,
        quantityAvailable: newProd.quantityAvailable,
        availability: newProd.availability,
        categorySlug: newProd.categorySlug,
        art: newProd.art || null,
        imageUrl: newProd.imageUrl || null,
        farmerId: newProd.farmerId || targetOld.farmerId,
        farmerName: newProd.farmerName || targetOld.farmerName,
        farmerLocation: targetOld.farmerLocation,
        farmerRatingAvg: newProd.farmerRatingAvg || targetOld.farmerRatingAvg,
        farmerPickupWindows: targetOld.farmerPickupWindows,
        marketId: targetOld.marketId,
        marketName: targetOld.marketName,
        alternatives: (targetOld.alternatives || []).filter((a) => a.productId !== newProd.productId),
      };

      const updated = prev.items.map((it) => (it.productId === oldProductId ? replacementItem : it));
      const newTotal = updated.reduce((s, it) => s + it.lineTotalCents, 0);

      return {
        ...prev,
        items: updated,
        totalCents: newTotal,
        remainingBudgetCents: Math.max(0, currentBudgetCents - newTotal),
      };
    });
    setReplaceTarget(null);
    showToast(`Replaced with ${newProd.name}`);
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    clearTimeout(searchTimeoutRef.current);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchBasketProducts({
          q: val,
          marketId: selectedMarketId || undefined,
          day: selectedDay || undefined,
        });
        setSearchResults(results || []);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setSearching(false);
      }
    }, 280);
  };

  const handleAddSearchedProduct = (prod) => {
    setBasket((prev) => {
      if (!prev) return prev;
      const exists = prev.items.find((it) => it.productId === prod.productId);
      let updated;
      if (exists) {
        updated = prev.items.map((it) =>
          it.productId === prod.productId
            ? { ...it, quantity: it.quantity + 1, lineTotalCents: it.priceCents * (it.quantity + 1) }
            : it
        );
      } else {
        const newItem = {
          productId: prod.productId,
          name: prod.name,
          priceCents: prod.priceCents,
          unit: prod.unit,
          quantity: 1,
          lineTotalCents: prod.priceCents,
          quantityAvailable: prod.quantityAvailable,
          availability: prod.availability,
          categorySlug: prod.categorySlug,
          art: prod.art,
          imageUrl: prod.imageUrl,
          farmerId: prod.farmerId,
          farmerName: prod.farmerName,
          farmerRatingAvg: prod.farmerRatingAvg,
          farmerLocation: prod.farmerLocation,
          farmerPickupWindows: [],
          alternatives: [],
        };
        updated = [...prev.items, newItem];
      }
      const newTotal = updated.reduce((s, it) => s + it.lineTotalCents, 0);
      return {
        ...prev,
        items: updated,
        totalCents: newTotal,
        remainingBudgetCents: Math.max(0, currentBudgetCents - newTotal),
      };
    });
    setSearchQuery('');
    setSearchResults([]);
    showToast(`Added ${prod.name} to basket`);
  };

  const handleToggleModify = () => {
    const nextState = !isModifying;
    setIsModifying(nextState);
    if (nextState && controlsRef.current) {
      controlsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (!basket?.items || basket.items.length === 0) return;

    const timer = setTimeout(async () => {
      try {
        const recalcData = await recalculateSmartBasket({
          items: basket.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          budget: currentBudgetCents,
          marketId: selectedMarketId || undefined,
        });

        if (recalcData) {
          setBasket((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              totalCents: recalcData.totalCents,
              remainingBudgetCents: recalcData.remainingBudgetCents,
              isOverBudget: recalcData.isOverBudget,
            };
          });
        }
      } catch (e) {
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [basket?.items, currentBudget, selectedMarketId]);

  const handleReserveBasket = async () => {
    if (items.length === 0) {
      showToast('Your basket is empty. Please add items to reserve.');
      return;
    }

    setReserving(true);
    try {
      const validationPayload = items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
      }));

      const valRes = await validateSmartBasket(validationPayload);
      if (valRes && !valRes.valid && valRes.issues?.length > 0) {
        const blockingIssue = valRes.issues.find(
          (i) => i.issue === 'OUT_OF_STOCK' || i.issue === 'UNAVAILABLE' || i.issue === 'NOT_ENOUGH_STOCK'
        );
        showToast(blockingIssue?.message || 'Some items have limited stock. Please review your basket.');
        setReserving(false);
        return;
      }

      for (const it of items) {
        add(
          it.productId,
          {
            farmerId: it.farmerId,
            quantity: it.quantity,
            isSmartBasket: true,
            source: 'smart_basket',
          },
          it.quantity
        );
      }

      showToast(`Reserved ${items.length} farm items for pickup!`);

      if (onClose) onClose();
      navigate('/buyer/basket');
    } catch (err) {
      console.error('Reserve error:', err);
      showToast(err.message || 'Unable to reserve basket. Please try again.');
    } finally {
      setReserving(false);
    }
  };

  return (
    <div className={`${styles.container} ${embedded ? styles.embedded : ''}`}>
      
      <section className={styles.hero} aria-labelledby="smart-basket-heading">
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.heroTopBar}>
            <div className={styles.heroBadge}>
              <ShoppingBasket size={14} className={styles.sparkleIcon} />
              <span>Smart Basket Builder</span>
            </div>

            {onClose && (
              <button
                type="button"
                className={styles.heroCloseBtn}
                onClick={onClose}
                aria-label="Close Smart Basket"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <h2 id="smart-basket-heading" className={styles.heroTitle}>
            <span>Curate Your Farm-Fresh Basket</span>
          </h2>

          <p className={styles.heroSub}>
            Tell us your budget and harvest preferences. We match live inventory from attending farmers so you can reserve your weekly harvest in one step.
          </p>

          <form
            className={styles.promptForm}
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
          >
            <div className={styles.promptBar}>
              <div className={styles.promptInputGroup}>
                <Search size={20} className={styles.promptIcon} />
                <input
                  type="text"
                  className={styles.promptInput}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={placeholderText || 'e.g. "I have $50. I need vegetables, fruits and eggs for Saturday."'}
                  aria-label="Describe what you want to buy and your budget"
                />
              </div>
              <button
                type="submit"
                className={styles.generateBtn}
                disabled={loading}
                aria-label="Generate Smart Basket suggestions"
              >
                {loading ? <RefreshCw size={18} className={styles.spin} /> : <ShoppingBasket size={18} />}
                <span>{loading ? 'Curating...' : 'Generate Basket'}</span>
              </button>
            </div>

            <div className={styles.promptChips} aria-label="Suggested Smart Basket prompts">
              <span className={styles.chipsLabel}>Try:</span>
              {(options.presetPrompts?.length > 0
                ? options.presetPrompts
                : [
                    'I have $50. I need vegetables, fruits and eggs for Saturday.',
                    'Fresh salad greens & sweet tomatoes under $25',
                    'Weekend family basket with bakery, eggs and cheese for $60',
                    'Seasonal fruit and raw honey for Sunday within $35',
                  ]
              ).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.promptChip}
                  onClick={() => {
                    setPrompt(preset);
                    handleGenerate({ prompt: preset });
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </form>
        </div>
      </section>

      <section
        ref={controlsRef}
        className={`${styles.controlsPanel} ${isModifying ? styles.controlsHighlighted : ''}`}
        aria-label="Basket configuration controls"
      >
        
        <div className={styles.controlsPanelHeader} aria-hidden="true">
          <SlidersHorizontal size={13} />
          <span>Customise Your Basket</span>
        </div>

        <div className={`${styles.controlGroup} ${styles.controlGroupFull}`}>
          <div className={styles.controlLabelRow}>
            <label className={styles.controlLabel} htmlFor="smart-basket-budget">
              <Coins size={14} className={styles.budgetLabelIcon} />
              <span>Budget</span>
            </label>
            <span className={styles.budgetTierPill} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {budget < 35 ? (
                <>
                  <Sprout size={11} aria-hidden="true" />
                  <span>Quick Pick</span>
                </>
              ) : budget < 65 ? (
                <>
                  <ShoppingBasket size={11} aria-hidden="true" />
                  <span>Balanced</span>
                </>
              ) : budget < 100 ? (
                <>
                  <Store size={11} aria-hidden="true" />
                  <span>Family</span>
                </>
              ) : (
                <>
                  <Sparkles size={11} aria-hidden="true" />
                  <span>Feast</span>
                </>
              )}
            </span>
          </div>

          <div className={styles.budgetStepperWrapper}>
            <button
              type="button"
              className={styles.stepperMiniBtn}
              onClick={() => {
                const next = Math.max(10, (Number(budget) || 50) - 5);
                setBudget(next);
                handleGenerate({ budget: next });
              }}
              aria-label="Decrease budget by $5"
              title="Decrease budget by $5"
              disabled={budget <= 10}
            >
              <Minus size={13} />
            </button>

            <div className={styles.budgetInputWrapper}>
              <DollarSign size={16} className={styles.budgetCurrencyPrefix} />
              <input
                id="smart-basket-budget"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className={styles.controlInput}
                value={budget}
                min="10"
                max="1000"
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  const num = raw === '' ? '' : Math.min(1000, parseInt(raw, 10));
                  setBudget(num === '' ? '' : num);
                }}
                onFocus={(e) => e.target.select()}
                onBlur={() => {
                  const clamped = Math.max(10, Number(budget) || 10);
                  setBudget(clamped);
                  handleGenerate({ budget: clamped });
                }}
                aria-label="Target budget in dollars"
              />
            </div>

            <button
              type="button"
              className={styles.stepperMiniBtn}
              onClick={() => {
                const next = Math.min(1000, (Number(budget) || 50) + 5);
                setBudget(next);
                handleGenerate({ budget: next });
              }}
              aria-label="Increase budget by $5"
              title="Increase budget by $5"
              disabled={budget >= 1000}
            >
              <Plus size={13} />
            </button>
          </div>

          <div className={styles.budgetQuickPills} role="group" aria-label="Quick budget presets">
            {[25, 40, 50, 75, 100].map((amt) => (
              <button
                key={amt}
                type="button"
                className={`${styles.budgetQuickBtn} ${budget === amt ? styles.budgetQuickActive : ''}`}
                onClick={() => {
                  setBudget(amt);
                  handleGenerate({ budget: amt });
                }}
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel} htmlFor="smart-basket-market">
            <Store size={14} />
            <span>Market</span>
          </label>
          <div className={styles.selectWrapper}>
            <Store size={15} className={styles.selectIcon} aria-hidden="true" />
            <select
              id="smart-basket-market"
              className={styles.controlSelect}
              value={selectedMarketId}
              onChange={(e) => {
                const mId = e.target.value;
                setSelectedMarketId(mId);
                handleGenerate({ marketId: mId || undefined });
              }}
            >
              <option value="">All Local Markets</option>
              {options.markets?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.city || 'Local'})
                </option>
              ))}
            </select>
            <ChevronDown size={16} className={styles.selectChevron} />
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel} htmlFor="smart-basket-day">
            <Calendar size={14} />
            <span>Pickup Day</span>
          </label>
          <div className={styles.selectWrapper}>
            <Calendar size={15} className={styles.selectIcon} aria-hidden="true" />
            <select
              id="smart-basket-day"
              className={styles.controlSelect}
              value={selectedDay}
              onChange={(e) => {
                const day = e.target.value;
                setSelectedDay(day);
                handleGenerate({ day: day || undefined });
              }}
            >
              <option value="sat">Saturday</option>
              <option value="sun">Sunday</option>
              <option value="wed">Wednesday</option>
              {options.operatingDays?.map((od) => (
                <option key={od.date} value={od.dayCode}>
                  {od.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className={styles.selectChevron} />
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel} htmlFor="smart-basket-time">
            <Clock size={14} />
            <span>Pickup Time</span>
          </label>
          <div className={styles.selectWrapper}>
            <Clock size={15} className={styles.selectIcon} aria-hidden="true" />
            <select
              id="smart-basket-time"
              className={styles.controlSelect}
              value={selectedPickupTime}
              onChange={(e) => setSelectedPickupTime(e.target.value)}
            >
              {basket?.pickupWindows?.length > 0 ? (
                basket.pickupWindows.map((pw, i) => (
                  <option key={i} value={pw.label}>
                    {pw.label}
                  </option>
                ))
              ) : (
                <>
                  <option value="8:00 AM – 10:00 AM">8:00 AM – 10:00 AM (Morning)</option>
                  <option value="10:00 AM – 12:00 PM">10:00 AM – 12:00 PM (Midday)</option>
                  <option value="12:00 PM – 2:00 PM">12:00 PM – 2:00 PM (Afternoon)</option>
                </>
              )}
            </select>
            <ChevronDown size={16} className={styles.selectChevron} />
          </div>
        </div>
      </section>

      <section className={styles.budgetCard} aria-label="Dynamic budget status">
        <div className={styles.budgetCardHeader}>
          <div className={styles.budgetValues}>
            <div className={styles.budgetValueItem}>
              <span className={styles.budgetLabel}>Budget</span>
              <span className={styles.budgetValue}>{formatPrice(currentBudgetCents)}</span>
            </div>

            <div className={styles.budgetValueDivider} />

            <div className={styles.budgetValueItem}>
              <span className={styles.budgetLabel}>Basket Total</span>
              <span className={`${styles.budgetValue} ${styles.budgetSpent}`}>
                {formatPrice(currentTotal)}
              </span>
            </div>

            <div className={styles.budgetValueDivider} />

            <div className={styles.budgetValueItem}>
              <span className={styles.budgetLabel}>Remaining</span>
              <div className={styles.remainingBadgeRow}>
                <span
                  className={`${styles.budgetValue} ${styles.budgetRemaining} ${
                    isOverBudget ? styles.over : currentRemaining === 0 ? styles.exact : ''
                  }`}
                >
                  {isOverBudget ? `- ${formatPrice(currentTotal - currentBudgetCents)}` : formatPrice(currentRemaining)}
                </span>
                <span
                  className={`${styles.budgetStatusPill} ${
                    isOverBudget
                      ? styles.statusOver
                      : currentRemaining === 0
                      ? styles.statusExact
                      : styles.statusGood
                  }`}
                >
                  {isOverBudget ? 'Over Budget' : currentRemaining === 0 ? 'Exact Match' : 'Within Budget'}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.budgetMetaBadges}>
            <div className={`${styles.metaBadge} ${styles.metaBadgePrimary}`}>
              <CheckCircle2 size={13} />
              <span>Real Live Inventory</span>
            </div>
            <div className={styles.metaBadge}>
              <ShoppingBasket size={13} />
              <span>{items.length} Items</span>
            </div>
            {basket?.farmerCount > 0 && (
              <div className={styles.metaBadge}>
                <Store size={13} />
                <span>{basket.farmerCount} Farmers</span>
              </div>
            )}
            {selectedDay && (
              <div className={styles.metaBadge}>
                <Calendar size={13} />
                <span>{selectedDay.toUpperCase()} Pickup</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.progressBarContainer}>
          <div
            className={styles.progressBarTrack}
            role="progressbar"
            aria-valuenow={spentPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Budget consumption percentage"
          >
            <div
              className={`${styles.progressBarFill} ${
                spentPercent >= 100 ? styles.overLimit : spentPercent > 85 ? styles.nearLimit : ''
              }`}
              style={{ width: `${Math.min(100, spentPercent)}%` }}
            />
          </div>
          <div className={styles.progressLabelRow}>
            <span>{spentPercent}% of budget allocated</span>
            <span>
              {isOverBudget
                ? `Exceeds budget by ${formatPrice(currentTotal - currentBudgetCents)}`
                : `${formatPrice(currentRemaining)} left to spend`}
            </span>
          </div>
        </div>
      </section>

      <section className={styles.basketSection} aria-label="Suggested produce basket">
        <div className={styles.sectionHeader}>
          <div>
            <h3 className={styles.sectionTitle}>
              <span>Suggested Basket</span>
            </h3>
            <span className={styles.sectionSub}>
              Curated from active farmers with live stock matching your criteria.
            </span>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={`${styles.modifyToggleBtn} ${isModifying ? styles.active : ''}`}
              onClick={handleToggleModify}
              aria-label="Toggle basket modification options"
            >
              <SlidersHorizontal size={14} />
              <span>{isModifying ? 'Done Modifying' : 'Modify Basket'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.errorAlert} role="alert">
            <AlertTriangle size={18} />
            <div>
              <strong>Unable to assemble suggestions</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className={styles.loadingState}>
            <RefreshCw size={28} className={styles.spin} />
            <p>Curating produce directly from local farm stalls...</p>
          </div>
        )}

        {items.length === 0 && !loading && !error && (
          <div className={styles.emptyState}>
            <ShoppingBasket size={48} className={styles.emptyIcon} />
            <h4>No products matched your exact request</h4>
            <p>Try broadening your query, increasing budget, or selecting another market day.</p>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => {
                setSelectedMarketId('');
                setSelectedDay('sat');
                handleGenerate({ prompt: DEFAULT_PRESET_PROMPT, budget: 10000 });
              }}
            >
              Reset to Recommended Basket
            </button>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className={styles.itemsList}>
            {items.map((item) => (
              <article key={item.productId} className={styles.itemCard}>
                
                <div className={styles.itemCardMain}>
                  <div
                    className={styles.itemArtThumb}
                    onClick={() => setDetailsTarget(item)}
                    title="View product details"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setDetailsTarget(item);
                    }}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} />
                    ) : (
                      <Illustration name={item.art || 'basket-tomatoes'} size="sm" />
                    )}
                  </div>

                  <div className={styles.itemInfo}>
                    <div className={styles.itemNameRow}>
                      <button
                        type="button"
                        className={styles.itemName}
                        onClick={() => setDetailsTarget(item)}
                      >
                        {item.name}
                      </button>
                      {item.categorySlug && (
                        <span className={styles.itemCategoryTag}>
                          {item.categorySlug.replace(/-/g, ' ')}
                        </span>
                      )}
                    </div>

                    <div className={styles.itemFarmerRow}>
                      <Store size={13} className={styles.farmerIcon} />
                      <Link
                        to={`/buyer/stalls/${item.farmerId}`}
                        className={styles.farmerLink}
                        title="View farmer stall"
                      >
                        {item.farmerName}
                      </Link>
                      {item.farmerRatingAvg > 0 && (
                        <span className={styles.farmerRating}>
                          <Star size={11} fill="var(--color-wood)" color="var(--color-wood)" aria-hidden="true" />
                          <span>{item.farmerRatingAvg.toFixed(1)}</span>
                        </span>
                      )}
                    </div>

                    <div className={styles.itemAvailabilityRow}>
                      <span
                        className={`${styles.stockBadge} ${
                          item.quantityAvailable <= 5 ? styles.stockLow : styles.stockGood
                        }`}
                      >
                        Available: {item.quantityAvailable} {item.unit || 'units'}
                      </span>
                      <span className={styles.pricePerUnit}>
                        {formatPrice(item.priceCents)} / {item.unit || 'unit'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.itemControls}>
                  <div className={styles.stepper} aria-label={`Quantity stepper for ${item.name}`}>
                    <button
                      type="button"
                      className={styles.stepperBtn}
                      onClick={() => handleDecreaseQty(item.productId)}
                      aria-label={`Decrease quantity of ${item.name}`}
                      title={item.quantity <= 1 ? 'Remove item' : 'Decrease quantity'}
                    >
                      {item.quantity <= 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                    </button>
                    <span className={styles.stepperCount}>{item.quantity}</span>
                    <button
                      type="button"
                      className={styles.stepperBtn}
                      onClick={() => handleIncreaseQty(item.productId)}
                      disabled={item.quantity >= item.quantityAvailable}
                      aria-label={`Increase quantity of ${item.name}`}
                      title="Increase quantity"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div className={styles.lineTotalBlock}>
                    <div className={styles.lineTotalAmount}>
                      {formatPrice(item.priceCents * item.quantity)}
                    </div>
                  </div>

                  <div className={styles.itemActions}>
                    
                    <button
                      type="button"
                      className={`${styles.actionIconBtn} ${styles.replaceBtn}`}
                      onClick={() => setReplaceTarget(item)}
                      title="Replace with an alternative product from the market"
                      aria-label={`Replace ${item.name}`}
                    >
                      <RefreshCw size={14} />
                      <span className={styles.btnLabelDesktop}>Replace</span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.actionIconBtn} ${styles.removeBtn}`}
                      onClick={() => handleRemoveItem(item.productId)}
                      title="Remove item from basket"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className={styles.searchAddSection}>
          <div className={styles.searchAddHeader}>
            <Search size={15} />
            <span>Search & Add Another Product from Live Inventory</span>
          </div>

          <div className={styles.searchBar}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products to add (e.g. sourdough, honey, spinach, apples, eggs)..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Search products to add to basket"
            />
            {searching && <RefreshCw size={16} className={styles.spin} />}
          </div>

          {searchResults.length > 0 && (
            <div className={styles.searchResultsTrack}>
              {searchResults.map((prod) => (
                <div key={prod.productId} className={styles.searchResultCard}>
                  <div className={styles.searchResultInfo}>
                    <div className={styles.searchResultName} title={prod.name}>
                      {prod.name}
                    </div>
                    <div className={styles.searchResultPrice}>
                      {formatNaira(prod.priceCents)} / {prod.unit}
                    </div>
                    <div className={styles.searchResultFarmer}>
                      {prod.farmerName} • Stock: {prod.quantityAvailable}
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => handleAddSearchedProduct(prod)}
                    aria-label={`Add ${prod.name} to basket`}
                  >
                    <Plus size={13} />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className={styles.footerBar} aria-label="Basket reservation actions">
        <div className={styles.footerSummary}>
          <span className={styles.footerTotalLabel}>Total Basket Cost</span>
          <div className={styles.footerAmountRow}>
            <span className={styles.footerTotalAmount}>{formatNaira(currentTotal)}</span>
            <span
              className={`${styles.footerRemainingTag} ${
                isOverBudget ? styles.tagOver : styles.tagGood
              }`}
            >
              {isOverBudget
                ? `Exceeds budget by ${formatNaira(currentTotal - currentBudget)}`
                : `${formatNaira(currentRemaining)} remaining`}
            </span>
          </div>
        </div>

        <div className={styles.footerBtnGroup}>
          <button
            type="button"
            className={styles.modifyBasketBtn}
            onClick={handleToggleModify}
          >
            <SlidersHorizontal size={16} />
            <span>{isModifying ? 'Finish Modifying' : 'Modify Basket'}</span>
          </button>

          <button
            type="button"
            className={styles.reserveBasketBtn}
            onClick={handleReserveBasket}
            disabled={reserving || items.length === 0}
            aria-label="Reserve Basket for pickup"
          >
            {reserving ? (
              <RefreshCw size={18} className={styles.spin} />
            ) : (
              <ShoppingBasket size={18} />
            )}
            <span>{reserving ? 'Reserving Basket...' : 'Reserve Basket'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </footer>

      {replaceTarget && (
        <div className={styles.modalBackdrop} onClick={() => setReplaceTarget(null)}>
          <div
            className={styles.modalBox}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="replace-modal-title"
          >
            <div className={styles.modalHeader}>
              <h4 id="replace-modal-title" className={styles.modalTitle}>
                Replace "{replaceTarget.name}"
              </h4>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setReplaceTarget(null)}
                aria-label="Close replace dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalNote}>
                Select an alternative product from verified local farmers with active stock:
              </p>

              {replaceTarget.alternatives?.length > 0 ? (
                <div className={styles.altList}>
                  {replaceTarget.alternatives.map((alt) => (
                    <div key={alt.productId} className={styles.altItem}>
                      <div className={styles.altMeta}>
                        <div className={styles.altName}>{alt.name}</div>
                        <div className={styles.altPrice}>
                          {formatNaira(alt.priceCents)} / {alt.unit} • {alt.farmerName}
                        </div>
                        <div className={styles.altStock}>
                          Available: {alt.quantityAvailable} {alt.unit}
                        </div>
                      </div>

                      <button
                        type="button"
                        className={styles.swapBtn}
                        onClick={() => handleReplaceItem(replaceTarget.productId, alt)}
                      >
                        <RefreshCw size={13} />
                        <span>Swap</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noAlternatives}>
                  <p>
                    No immediate substitutes found in this exact category. You can use the live search bar below the basket to add any product directly!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {detailsTarget && (
        <div className={styles.modalBackdrop} onClick={() => setDetailsTarget(null)}>
          <div
            className={styles.modalBox}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="details-modal-title"
          >
            <div className={styles.modalHeader}>
              <h4 id="details-modal-title" className={styles.modalTitle}>
                {detailsTarget.name}
              </h4>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setDetailsTarget(null)}
                aria-label="Close product details"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailsTopRow}>
                <div className={styles.detailsThumb}>
                  {detailsTarget.imageUrl ? (
                    <img src={detailsTarget.imageUrl} alt={detailsTarget.name} />
                  ) : (
                    <Illustration name={detailsTarget.art || 'basket-tomatoes'} size="md" />
                  )}
                </div>

                <div className={styles.detailsMeta}>
                  <div className={styles.detailsPrice}>
                    {formatNaira(detailsTarget.priceCents)}
                    <span className={styles.detailsUnit}> / {detailsTarget.unit}</span>
                  </div>

                  <div className={styles.detailsFarmer}>
                    <Store size={14} />
                    <span>{detailsTarget.farmerName}</span>
                  </div>

                  {detailsTarget.farmerLocation && (
                    <div className={styles.detailsLocation}>
                      <MapPin size={13} />
                      <span>
                        {typeof detailsTarget.farmerLocation === 'string'
                          ? detailsTarget.farmerLocation
                          : 'Local Farm'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className={styles.detailsDesc}>
                {detailsTarget.description ||
                  'Freshly harvested, organic farm produce supplied directly by local farmers with live inventory tracking.'}
              </p>

              <div className={styles.detailsSpecs}>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Category:</span>
                  <span className={styles.specValue}>
                    {(detailsTarget.categorySlug || 'Fresh Produce').replace(/-/g, ' ')}
                  </span>
                </div>

                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Live Stock:</span>
                  <span className={styles.specValue}>
                    {detailsTarget.quantityAvailable} {detailsTarget.unit} available
                  </span>
                </div>

                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Pickup Window:</span>
                  <span className={styles.specValue}>
                    {selectedPickupTime || 'Standard Morning Market Window'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartBasketExperience;
