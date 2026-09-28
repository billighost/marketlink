import React, { useState, useEffect, useRef } from 'react';
import {
  createFarmerProduct,
  updateFarmerProduct,
  deleteFarmerProduct,
  getFarmerProduct,
  uploadFarmerImage,
} from '@/api/farmer';
import { getCategories } from '@/api/catalog';
import { useVendor } from '@/layouts/VendorLayout';
import { parseDollarsToCents, formatCentsToDollarsInput } from '@/utils/format';
import Button from '@/components/ui/Button';
import Toggle from '@/components/ui/Toggle';
import ConfirmStep from '@/components/ui/ConfirmStep';
import Skeleton from '@/components/ui/Skeleton';
import Illustration from '@/components/domain/Illustration';
import {
  Upload,
  Trash2,
  Plus,
  Minus,
  Sprout,
  Tag,
  AlertCircle,
  ChevronDown,
  Check,
  RefreshCw,
  Palette,
  Image as ImageIcon,
  Sun,
  Leaf,
  Info,
} from 'lucide-react';
import styles from './StockForm.module.css';

const PRODUCT_UNITS = [
  { value: 'lb', label: 'lb (Pound)' },
  { value: 'bunch', label: 'bunch' },
  { value: 'loaf', label: 'loaf' },
  { value: 'jar', label: 'jar' },
  { value: 'dozen', label: 'dozen' },
  { value: 'each', label: 'each' },
  { value: 'pint', label: 'pint' },
  { value: 'bag', label: 'bag' },
];

const ART_KEYS = [
  'basket',
  'basket-tomatoes',
  'crate-carrots',
  'beet-bunch',
  'beet',
  'leafy-greens',
  'sourdough-boule',
  'loaf',
  'honey-jar',
  'honey',
  'egg-carton',
  'paper-bag-pears',
  'radish-bunch',
  'carrot',
  'tomato',
  'potatoes',
  'corn',
  'squash',
  'apples',
  'pears',
  'strawberries',
  'blueberries',
  'croissant',
  'cheese',
];

const ART_CATEGORIES = {
  All: ART_KEYS,
  Vegetables: [
    'basket',
    'crate-carrots',
    'beet-bunch',
    'beet',
    'leafy-greens',
    'radish-bunch',
    'carrot',
    'tomato',
    'potatoes',
    'corn',
    'squash',
  ],
  Fruits: ['apples', 'pears', 'strawberries', 'blueberries', 'paper-bag-pears'],
  'Bakery & Pantry': [
    'basket-tomatoes',
    'sourdough-boule',
    'loaf',
    'honey-jar',
    'honey',
    'egg-carton',
    'croissant',
    'cheese',
  ],
};

const SUGGESTED_NOTES = [
  { label: 'Picked Daily', text: 'Harvested fresh daily at dawn.' },
  { label: 'Hand-selected', text: 'Carefully sorted and hand-selected for quality.' },
  { label: 'Heritage Variety', text: 'Heirloom variety with authentic rustic flavor.' },
  { label: 'Pesticide-Free', text: 'Grown without synthetic pesticides or chemicals.' },
];

export function StockForm({ productId, onClose, onSaved, onDeleted }) {
  const { refreshCounts } = useVendor();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(Boolean(productId));
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [unit, setUnit] = useState('bunch');
  const [quantity, setQuantity] = useState(10);
  const [lowStockThreshold, setLowStockThreshold] = useState(3);
  const [description, setDescription] = useState('');
  const [seasonalTag, setSeasonalTag] = useState(false);
  const [organicTag, setOrganicTag] = useState(false);
  const [art, setArt] = useState('basket');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePublicId, setImagePublicId] = useState(null);

  const [visualTab, setVisualTab] = useState('illustration');
  const [illusFilter, setIllusFilter] = useState('All');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [templateEnabled, setTemplateEnabled] = useState(false);
  const [templateDefaultQty, setTemplateDefaultQty] = useState(10);

  const [viewStep, setViewStep] = useState('form');
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const catList = await getCategories();
        if (isMounted) setCategories(catList || []);
      } catch {
      }

      if (productId) {
        try {
          const res = await getFarmerProduct(productId);
          const p = res?.data;
          if (p && isMounted) {
            setName(p.name || '');
            setCategoryId(p.categoryId || '');
            setPriceInput(formatCentsToDollarsInput(p.priceCents));
            setUnit(p.unit || 'bunch');
            setQuantity(p.quantity ?? 10);
            setLowStockThreshold(p.lowStockThreshold ?? 3);
            setDescription(p.description || '');
            setSeasonalTag(Boolean(p.tags?.includes('seasonal')));
            setOrganicTag(Boolean(p.tags?.includes('organic')));
            setArt(p.art || 'basket');
            if (p.imageUrl) {
              setImageUrl(p.imageUrl);
              setImagePublicId(p.imagePublicId || null);
              setVisualTab('photo');
            }
            if (p.weeklyTemplate) {
              setTemplateEnabled(Boolean(p.weeklyTemplate.enabled));
              setTemplateDefaultQty(p.weeklyTemplate.defaultQuantity ?? 10);
            }
          }
        } catch (err) {
          if (isMounted) setGeneralError(err?.message || 'Failed to load product.');
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const handleProcessImageFile = async (file) => {
    if (!file) return;

    if (file.size > 1048576) {
      setFieldErrors((prev) => ({
        ...prev,
        imageUrl: 'Photo exceeds 1 MB limit. Please select a smaller photo.',
      }));
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setFieldErrors((prev) => ({
        ...prev,
        imageUrl: 'Only JPEG, PNG, and WebP images are supported.',
      }));
      return;
    }

    setUploading(true);
    setFieldErrors((prev) => ({ ...prev, imageUrl: '' }));
    try {
      const res = await uploadFarmerImage(file, 'product');
      setImageUrl(res?.data?.imageUrl || res?.data?.url || '');
      setImagePublicId(res?.data?.publicId || null);
      setIsDirty(true);
      setVisualTab('photo');
    } catch (err) {
      setFieldErrors((prev) => ({
        ...prev,
        imageUrl: err?.message || 'Failed to upload photo.',
      }));
    } finally {
      setUploading(false);
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleProcessImageFile(file);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImagePublicId(null);
    setIsDirty(true);
  };

  const validate = () => {
    const errors = {};
    if (!name.trim() || name.trim().length < 2 || name.trim().length > 80) {
      errors.name = 'Name must be between 2 and 80 characters.';
    }
    if (!categoryId) {
      errors.categoryId = 'Please select a product category.';
    }
    const cents = parseDollarsToCents(priceInput);
    if (cents === null || cents <= 0) {
      errors.price = 'Enter a valid price in dollars (e.g. 4.50).';
    }
    if (quantity < 0 || quantity > 10000) {
      errors.quantity = 'Quantity must be between 0 and 10,000.';
    }
    if (lowStockThreshold < 0 || lowStockThreshold > 1000) {
      errors.lowStockThreshold = 'Low stock level must be between 0 and 1,000.';
    }
    if (description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setGeneralError('');

    const tags = [];
    if (seasonalTag) tags.push('seasonal');
    if (organicTag) tags.push('organic');

    const priceCents = parseDollarsToCents(priceInput);

    const payload = {
      name: name.trim(),
      categoryId,
      priceCents,
      unit,
      quantity: Number(quantity),
      quantityAvailable: Number(quantity),
      lowStockThreshold: Number(lowStockThreshold),
      description: description.trim(),
      tags,
      art: art || 'basket',
      imageUrl: imageUrl || null,
      imagePublicId: imagePublicId || null,
      weekly: {
        enabled: templateEnabled,
        defaultQty: Number(templateDefaultQty),
      },
      weeklyTemplate: {
        enabled: templateEnabled,
        defaultQuantity: Number(templateDefaultQty),
      },
    };

    try {
      let savedProduct;
      if (productId) {
        const res = await updateFarmerProduct(productId, payload);
        savedProduct = res?.data;
      } else {
        const res = await createFarmerProduct(payload);
        savedProduct = res?.data;
      }
      refreshCounts();
      if (onSaved) onSaved(savedProduct);
      if (onClose) onClose();
    } catch (err) {
      if (err?.details && Array.isArray(err.details)) {
        const errors = {};
        err.details.forEach((d) => {
          if (d.field) errors[d.field] = d.message;
        });
        setFieldErrors(errors);
      }
      setGeneralError(err?.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await deleteFarmerProduct(productId);
      refreshCounts();
      if (onDeleted) onDeleted(productId);
      if (onClose) onClose();
    } catch (err) {
      setGeneralError(err?.message || 'Could not delete product.');
      setViewStep('form');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestClose = () => {
    if (isDirty) {
      setViewStep('confirm-discard');
    } else if (onClose) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingBox}>
        <Skeleton height="80px" borderRadius="12px" />
        <Skeleton height="44px" borderRadius="8px" />
        <Skeleton height="44px" borderRadius="8px" />
        <Skeleton height="80px" borderRadius="8px" />
        <Skeleton height="120px" borderRadius="8px" />
      </div>
    );
  }

  if (viewStep === 'confirm-discard') {
    return (
      <ConfirmStep
        title="Discard unsaved changes?"
        message="You have unsaved edits in this product. If you leave now, your changes will be lost."
        confirmLabel="Discard changes"
        confirmVariant="danger"
        cancelLabel="Keep editing"
        onConfirm={onClose}
        onCancel={() => setViewStep('form')}
      />
    );
  }

  if (viewStep === 'confirm-delete') {
    return (
      <ConfirmStep
        title="Delete product"
        message="Are you sure you want to remove this product? If the product has past orders, it will be safely archived instead of deleted."
        confirmLabel="Delete product"
        confirmVariant="danger"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setViewStep('form')}
        isLoading={submitting}
        error={generalError}
      />
    );
  }

  const selectedCategoryObj = categories.find((c) => c.id === categoryId);
  const currentArtKeys = ART_CATEGORIES[illusFilter] || ART_KEYS;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {generalError && (
        <div className={styles.generalError} role="alert">
          <AlertCircle size={18} />
          <span>{generalError}</span>
        </div>
      )}

      <div className={styles.previewCard}>
        <div className={styles.previewHeader}>
          <span className={styles.previewBadge}>Live Marketplace Preview</span>
        </div>
        <div className={styles.previewBody}>
          <div className={styles.previewMedia}>
            {imageUrl ? (
              <img src={imageUrl} alt={name || 'Produce'} className={styles.previewImg} />
            ) : (
              <div className={styles.previewIllustrationWrap}>
                <Illustration name={art || 'basket'} size="md" />
              </div>
            )}
          </div>
          <div className={styles.previewDetails}>
            <span className={styles.previewCategory}>
              {selectedCategoryObj?.name || 'Produce Item'}
            </span>
            <h4 className={styles.previewName}>{name.trim() || 'Produce Name'}</h4>
            <div className={styles.previewPriceRow}>
              <span className={styles.previewPrice}>${priceInput ? priceInput : '0.00'}</span>
              <span className={styles.previewUnit}>/ {unit}</span>
            </div>
            <div className={styles.previewBadges}>
              {seasonalTag && <span className={styles.seasonalPill}>Seasonal</span>}
              {organicTag && <span className={styles.organicPill}>Organic</span>}
              <span className={styles.stockPill}>
                {quantity > 0 ? `${quantity} in stock` : 'Out of stock'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.labelRow}>
          <label htmlFor="produce-name" className={styles.label}>
            Produce Name <span className={styles.requiredMark}>*</span>
          </label>
          <span className={styles.charCount}>{name.length}/80</span>
        </div>
        <div
          className={`${styles.inputWrapper} ${fieldErrors.name ? styles.inputWrapperError : ''}`}
        >
          <Sprout size={18} className={styles.inputIcon} aria-hidden="true" />
          <input
            id="produce-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setIsDirty(true);
              if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: '' }));
            }}
            placeholder="e.g. Rainbow Heirloom Carrots"
            maxLength={80}
            disabled={submitting}
            className={styles.textInput}
          />
        </div>
        {fieldErrors.name ? (
          <div className={styles.errorText} role="alert">
            <AlertCircle size={14} />
            <span>{fieldErrors.name}</span>
          </div>
        ) : (
          <span className={styles.hintText}>
            What customers will see listed on your market stall.
          </span>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="produce-category" className={styles.label}>
          Category <span className={styles.requiredMark}>*</span>
        </label>
        <div
          className={`${styles.selectWrapper} ${fieldErrors.categoryId ? styles.inputWrapperError : ''}`}
        >
          <Tag size={18} className={styles.inputIcon} aria-hidden="true" />
          <select
            id="produce-category"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setIsDirty(true);
              if (fieldErrors.categoryId) setFieldErrors((p) => ({ ...p, categoryId: '' }));
            }}
            className={styles.selectControl}
            disabled={submitting}
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown size={18} className={styles.selectChevron} aria-hidden="true" />
        </div>
        {fieldErrors.categoryId && (
          <div className={styles.errorText} role="alert">
            <AlertCircle size={14} />
            <span>{fieldErrors.categoryId}</span>
          </div>
        )}
      </div>

      <div className={styles.twoCol}>
        
        <div className={styles.fieldGroup}>
          <label htmlFor="produce-price" className={styles.label}>
            Price <span className={styles.requiredMark}>*</span>
          </label>
          <div
            className={`${styles.inputWrapper} ${fieldErrors.price ? styles.inputWrapperError : ''}`}
          >
            <span className={styles.currencyPrefixBadge}>$ USD</span>
            <input
              id="produce-price"
              type="text"
              inputMode="decimal"
              value={priceInput}
              onChange={(e) => {
                setPriceInput(e.target.value);
                setIsDirty(true);
                if (fieldErrors.price) setFieldErrors((p) => ({ ...p, price: '' }));
              }}
              placeholder="4.50"
              disabled={submitting}
              className={styles.textInput}
            />
          </div>
          {fieldErrors.price ? (
            <div className={styles.errorText} role="alert">
              <AlertCircle size={14} />
              <span>{fieldErrors.price}</span>
            </div>
          ) : (
            <span className={styles.hintText}>Per unit, in dollars.</span>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="produce-unit" className={styles.label}>
            Unit <span className={styles.requiredMark}>*</span>
          </label>
          <div className={styles.selectWrapper}>
            <select
              id="produce-unit"
              value={unit}
              onChange={(e) => {
                setUnit(e.target.value);
                setIsDirty(true);
              }}
              className={styles.selectControl}
              disabled={submitting}
            >
              {PRODUCT_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className={styles.selectChevron} aria-hidden="true" />
          </div>
          <span className={styles.hintText}>Packaging or measurement</span>
        </div>
      </div>

      <div className={styles.twoCol}>
        
        <div className={styles.stepperCard}>
          <div className={styles.stepperCardHeader}>
            <label htmlFor="produce-quantity" className={styles.label}>
              Quantity available
            </label>
            <span className={styles.unitSubtle}>{unit}s</span>
          </div>
          <div className={styles.stepperControls}>
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => {
                setQuantity((q) => Math.max(0, q - 1));
                setIsDirty(true);
              }}
              disabled={quantity <= 0 || submitting}
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <input
              id="produce-quantity"
              type="number"
              min={0}
              max={10000}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value || '0', 10);
                setQuantity(Math.max(0, Math.min(10000, isNaN(val) ? 0 : val)));
                setIsDirty(true);
                if (fieldErrors.quantity) setFieldErrors((p) => ({ ...p, quantity: '' }));
              }}
              disabled={submitting}
              className={styles.stepperInput}
            />
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => {
                setQuantity((q) => Math.min(10000, q + 1));
                setIsDirty(true);
              }}
              disabled={quantity >= 10000 || submitting}
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className={styles.quickAddRow}>
            <span className={styles.quickAddLabel}>Quick add:</span>
            {[5, 10, 25].map((amt) => (
              <button
                key={amt}
                type="button"
                className={styles.quickAddBtn}
                onClick={() => {
                  setQuantity((q) => Math.min(10000, q + amt));
                  setIsDirty(true);
                }}
                disabled={submitting}
              >
                +{amt}
              </button>
            ))}
          </div>
          {fieldErrors.quantity && (
            <div className={styles.errorText} role="alert">
              <AlertCircle size={14} />
              <span>{fieldErrors.quantity}</span>
            </div>
          )}
        </div>

        <div className={styles.stepperCard}>
          <div className={styles.stepperCardHeader}>
            <label htmlFor="produce-low-stock" className={styles.label}>
              Low-stock level
            </label>
            <span className={styles.badgeWarnDot}>Warning</span>
          </div>
          <div className={styles.stepperControls}>
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => {
                setLowStockThreshold((t) => Math.max(0, t - 1));
                setIsDirty(true);
              }}
              disabled={lowStockThreshold <= 0 || submitting}
              aria-label="Decrease low stock threshold"
            >
              <Minus size={16} />
            </button>
            <input
              id="produce-low-stock"
              type="number"
              min={0}
              max={1000}
              value={lowStockThreshold}
              onChange={(e) => {
                const val = parseInt(e.target.value || '0', 10);
                setLowStockThreshold(Math.max(0, Math.min(1000, isNaN(val) ? 0 : val)));
                setIsDirty(true);
                if (fieldErrors.lowStockThreshold) {
                  setFieldErrors((p) => ({ ...p, lowStockThreshold: '' }));
                }
              }}
              disabled={submitting}
              className={styles.stepperInput}
            />
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => {
                setLowStockThreshold((t) => Math.min(1000, t + 1));
                setIsDirty(true);
              }}
              disabled={lowStockThreshold >= 1000 || submitting}
              aria-label="Increase low stock threshold"
            >
              <Plus size={16} />
            </button>
          </div>
          <span className={styles.hintText}>We warn Customers below this.</span>
          {fieldErrors.lowStockThreshold && (
            <div className={styles.errorText} role="alert">
              <AlertCircle size={14} />
              <span>{fieldErrors.lowStockThreshold}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.labelRow}>
          <label htmlFor="product-description" className={styles.label}>
            Description
          </label>
          <span className={styles.charCount}>{description.length} / 500</span>
        </div>
        <textarea
          id="product-description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setIsDirty(true);
            if (fieldErrors.description) setFieldErrors((p) => ({ ...p, description: '' }));
          }}
          maxLength={500}
          rows={3}
          placeholder="Tasting notes, harvest date, preparation ideas..."
          disabled={submitting}
          className={`${styles.textareaControl} ${fieldErrors.description ? styles.inputWrapperError : ''}`}
        />
        {fieldErrors.description && (
          <div className={styles.errorText} role="alert">
            <AlertCircle size={14} />
            <span>{fieldErrors.description}</span>
          </div>
        )}
        <div className={styles.suggestionRow}>
          <span className={styles.suggestionLabel}>Quick notes:</span>
          {SUGGESTED_NOTES.map((note) => (
            <button
              key={note.label}
              type="button"
              className={styles.suggestionChip}
              onClick={() => {
                setDescription((prev) => {
                  if (prev.includes(note.text)) return prev;
                  return prev ? `${prev} ${note.text}` : note.text;
                });
                setIsDirty(true);
              }}
              disabled={submitting}
            >
              {note.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Tags & Attributes</label>
        <div className={styles.badgesGrid}>
          <button
            type="button"
            className={`${styles.badgeCard} ${seasonalTag ? styles.badgeCardActive : ''}`}
            onClick={() => {
              setSeasonalTag(!seasonalTag);
              setIsDirty(true);
            }}
            disabled={submitting}
          >
            <div className={styles.badgeCardIconWrap}>
              <Sun size={18} className={seasonalTag ? styles.badgeIconActive : styles.badgeIcon} />
            </div>
            <div className={styles.badgeCardText}>
              <span className={styles.badgeCardTitle}>Seasonal</span>
              <span className={styles.badgeCardDesc}>Limited seasonal harvest window</span>
            </div>
            {seasonalTag && <Check size={18} className={styles.badgeCheck} />}
          </button>

          <button
            type="button"
            className={`${styles.badgeCard} ${organicTag ? styles.badgeCardActive : ''}`}
            onClick={() => {
              setOrganicTag(!organicTag);
              setIsDirty(true);
            }}
            disabled={submitting}
          >
            <div className={styles.badgeCardIconWrap}>
              <Leaf size={18} className={organicTag ? styles.badgeIconActive : styles.badgeIcon} />
            </div>
            <div className={styles.badgeCardText}>
              <span className={styles.badgeCardTitle}>Organic</span>
              <span className={styles.badgeCardDesc}>Naturally grown without synthetics</span>
            </div>
            {organicTag && <Check size={18} className={styles.badgeCheck} />}
          </button>
        </div>
      </div>

      <div className={styles.visualSection}>
        <div className={styles.visualSectionHeader}>
          <div>
            <span className={styles.label}>Picture</span>
            <p className={styles.hintText}>Upload a photo you own or pick a market illustration.</p>
          </div>
          <div className={styles.tabSwitcher}>
            <button
              type="button"
              className={`${styles.tabBtn} ${visualTab === 'illustration' ? styles.tabBtnActive : ''}`}
              onClick={() => setVisualTab('illustration')}
            >
              <Palette size={14} />
              <span>Illustration</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${visualTab === 'photo' ? styles.tabBtnActive : ''}`}
              onClick={() => setVisualTab('photo')}
            >
              <ImageIcon size={14} />
              <span>Photo</span>
            </button>
          </div>
        </div>

        {visualTab === 'illustration' ? (
          <div className={styles.illustrationPickerWrap}>
            <div className={styles.illusFilterRow}>
              {['All', 'Vegetables', 'Fruits', 'Bakery & Pantry'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.illusFilterBtn} ${illusFilter === cat ? styles.illusFilterBtnActive : ''}`}
                  onClick={() => setIllusFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className={styles.illustrationGrid}>
              {currentArtKeys.map((key) => {
                const isSelected = !imageUrl && art === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.artTile} ${isSelected ? styles.artTileActive : ''}`}
                    onClick={() => {
                      setArt(key);
                      if (imageUrl) {
                        setImageUrl('');
                        setImagePublicId(null);
                      }
                      setIsDirty(true);
                    }}
                    title={key}
                    aria-label={`Select illustration ${key}`}
                  >
                    <Illustration name={key} size="sm" />
                    {isSelected && (
                      <div className={styles.artCheckmark}>
                        <Check size={11} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={styles.photoUploadWrap}>
            {imageUrl ? (
              <div className={styles.imagePreviewCard}>
                <img src={imageUrl} alt="Uploaded produce" className={styles.uploadedImg} />
                <div className={styles.imageOverlayActions}>
                  <button
                    type="button"
                    className={styles.overlayActionBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || submitting}
                  >
                    <Upload size={14} />
                    <span>Replace</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.overlayActionBtn} ${styles.overlayActionDanger}`}
                    onClick={handleRemoveImage}
                    disabled={uploading || submitting}
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`${styles.dropzone} ${isDraggingFile ? styles.dropzoneActive : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleProcessImageFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={styles.dropzoneIconWrap}>
                  <Upload size={22} />
                </div>
                <span className={styles.dropzoneTitle}>
                  {uploading ? 'Uploading your photo...' : 'Click to upload or drag & drop'}
                </span>
                <span className={styles.dropzoneSubtitle}>JPEG, PNG, or WebP (≤ 1 MB)</span>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageFileChange}
              style={{ display: 'none' }}
            />
            {fieldErrors.imageUrl && (
              <div className={styles.errorText} role="alert">
                <AlertCircle size={14} />
                <span>{fieldErrors.imageUrl}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.templateCard}>
        <div className={styles.templateHeaderRow}>
          <div className={styles.templateIconWrap}>
            <RefreshCw size={18} />
          </div>
          <div className={styles.templateText}>
            <span className={styles.templateTitle}>Weekly template</span>
            <span className={styles.templateSubtitle}>
              Reset to this amount each week automatically.
            </span>
          </div>
          <Toggle
            checked={templateEnabled}
            onChange={(checked) => {
              setTemplateEnabled(checked);
              setIsDirty(true);
            }}
            disabled={submitting}
            label="Enable weekly template"
          />
        </div>

        {templateEnabled && (
          <div className={styles.templateBodyRow}>
            <div className={styles.stepperCardHeader}>
              <label htmlFor="template-qty" className={styles.label}>
                Default weekly quantity
              </label>
              <span className={styles.unitSubtle}>{unit}s</span>
            </div>
            <div className={styles.stepperControls}>
              <button
                type="button"
                className={styles.stepperBtn}
                onClick={() => {
                  setTemplateDefaultQty((q) => Math.max(0, q - 1));
                  setIsDirty(true);
                }}
                disabled={templateDefaultQty <= 0 || submitting}
              >
                <Minus size={16} />
              </button>
              <input
                id="template-qty"
                type="number"
                min={0}
                max={10000}
                value={templateDefaultQty}
                onChange={(e) => {
                  const val = parseInt(e.target.value || '0', 10);
                  setTemplateDefaultQty(Math.max(0, Math.min(10000, isNaN(val) ? 0 : val)));
                  setIsDirty(true);
                }}
                disabled={submitting}
                className={styles.stepperInput}
              />
              <button
                type="button"
                className={styles.stepperBtn}
                onClick={() => {
                  setTemplateDefaultQty((q) => Math.min(10000, q + 1));
                  setIsDirty(true);
                }}
                disabled={templateDefaultQty >= 10000 || submitting}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.stickyFooterBar}>
        <div className={styles.footerLeft}>
          {productId && (
            <button
              type="button"
              onClick={() => setViewStep('confirm-delete')}
              className={styles.deleteBtn}
              disabled={submitting}
            >
              <Trash2 size={16} aria-hidden="true" />
              <span>Delete product</span>
            </button>
          )}
        </div>
        <div className={styles.footerRight}>
          <button
            type="button"
            onClick={handleRequestClose}
            className={styles.cancelBtn}
            disabled={submitting}
          >
            Cancel
          </button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={submitting || uploading}
            loading={submitting}
            className={styles.submitBtn}
          >
            <Check size={18} aria-hidden="true" />
            <span>{productId ? 'Save changes' : 'Add product'}</span>
          </Button>
        </div>
      </div>
    </form>
  );
}

export default StockForm;
