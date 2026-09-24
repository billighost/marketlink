import { useState, useCallback, useRef } from 'react';
import {
  products,
  farmers,
  recentlyBoughtProductIds,
  getProduct,
  getFarmer,
} from '@/data/placeholders';

// Module-level cache so navigating into sheets and back does not reload or reset feed
let cachedSections = null;

// Quotes and proverbs for punctuation dividers
export const FEED_PUNCTUATIONS = [
  { text: 'Picked at sunrise, on your table by dinner.', author: 'Riverbend Farm' },
  { text: 'Good bread takes 36 hours. There are no shortcuts.', author: 'Oak & Mill Bakery' },
  { text: 'Every jar tells the story of summer wildflowers.', author: 'Hollow Creek Apiary' },
  { text: 'Happy pasture hens lay the brightest yolks.', author: 'Willow Bend Poultry' },
  { text: 'Brought to market with love by your local farmers.', author: null },
];

/**
 * Build the 8 initial curated sections
 */
function buildCuratedSections() {
  const featuredProducts = products.filter((p) => p.tags?.includes('bestseller')).slice(0, 5);
  const recentlyBought = recentlyBoughtProductIds
    .map((id) => getProduct(id))
    .filter(Boolean);
  const topFarmers = farmers.filter((f) => f.isTopSeller);
  const orderSoon = products.filter((p) => p.stock === 'low');
  const newArrivals = products.filter((p) => p.tags?.includes('new'));
  const riverbendProducts = products.filter((p) => p.farmerId === 'f-riverbend');
  const seasonalProducts = products.filter((p) => p.tags?.includes('seasonal'));
  const bakeryProducts = products.filter((p) => p.category === 'Bakery');

  return [
    {
      id: 'sec-featured',
      title: 'Featured today',
      subtitle: 'Hand-picked highlights from this week\'s market stalls',
      type: 'products',
      cardVariant: 'feature',
      items: featuredProducts,
      seeAllPath: '/buyer/products?filter=featured',
      punctuation: FEED_PUNCTUATIONS[0],
    },
    {
      id: 'sec-recent',
      title: 'Recently bought',
      subtitle: 'Quick re-orders from your previous market visits',
      type: 'products',
      cardVariant: 'compact',
      items: recentlyBought,
      seeAllPath: '/buyer/orders',
    },
    {
      id: 'sec-farmers',
      title: 'Top-selling Farmers',
      subtitle: 'Beloved producers with queues before 8 am',
      type: 'farmers',
      cardVariant: 'row',
      items: topFarmers,
      seeAllPath: '/buyer/farmers',
      punctuation: FEED_PUNCTUATIONS[1],
    },
    {
      id: 'sec-lowstock',
      title: 'Order soon',
      subtitle: 'Only a few left before Saturday pre-orders close',
      type: 'products',
      cardVariant: 'compact',
      items: orderSoon,
      seeAllPath: '/buyer/products?stock=low',
    },
    {
      id: 'sec-new',
      title: 'New this week',
      subtitle: 'Fresh arrivals and first-time harvests',
      type: 'products',
      cardVariant: 'compact',
      items: newArrivals,
      seeAllPath: '/buyer/products?filter=new',
      punctuation: FEED_PUNCTUATIONS[2],
    },
    {
      id: 'sec-riverbend',
      title: 'From Riverbend Farm',
      subtitle: 'Heirloom tomatoes, rainbow carrots & tender greens',
      type: 'products',
      cardVariant: 'compact',
      items: riverbendProducts,
      seeAllPath: '/buyer/farmers/f-riverbend',
    },
    {
      id: 'sec-seasonal',
      title: 'In season right now',
      subtitle: 'Peak harvest flavour, picked at full ripeness',
      type: 'products',
      cardVariant: 'compact',
      items: seasonalProducts,
      seeAllPath: '/buyer/products?filter=seasonal',
      punctuation: FEED_PUNCTUATIONS[3],
    },
    {
      id: 'sec-bakery',
      title: 'Baked this morning',
      subtitle: 'Crusty sourdoughs, flaky croissants & rye loaves',
      type: 'products',
      cardVariant: 'compact',
      items: bakeryProducts,
      seeAllPath: '/buyer/products?category=Bakery',
      punctuation: FEED_PUNCTUATIONS[4],
    },
  ];
}

// 12+ Endless feed templates
const ENDLESS_TEMPLATES = [
  {
    title: 'Pasture-raised dairy & eggs',
    subtitle: 'Golden butter, whole milk and farm eggs',
    type: 'products',
    category: 'Dairy and eggs',
  },
  {
    title: 'From Hollow Creek Apiary',
    subtitle: 'Pure comb, raw honey and infusions',
    type: 'products',
    farmerId: 'f-hollowcreek',
  },
  {
    title: 'Fresh catch & cured meats',
    subtitle: 'Day-boat fish and maple breakfast sausage',
    type: 'products',
    category: 'Meat and fish',
  },
  {
    title: 'Berries & orchard fruit',
    subtitle: 'Earliglow strawberries and crisp heritage apples',
    type: 'products',
    category: 'Fruit',
  },
  {
    title: 'Garden blossoms & living herbs',
    subtitle: 'Seasonal bouquets and windowsill pots',
    type: 'products',
    category: 'Herbs and flowers',
  },
  {
    title: 'From Clearwater Orchards',
    subtitle: 'Honeycrisp apples, Bartlett pears and cider',
    type: 'products',
    farmerId: 'f-clearwater',
  },
  {
    title: 'Sunridge Berry Farm',
    subtitle: 'Slope-grown strawberries and blueberries',
    type: 'products',
    farmerId: 'f-sunridge',
  },
  {
    title: 'Forest & field mushrooms',
    subtitle: 'Blue oysters and shaggy lion\'s mane',
    type: 'products',
    farmerId: 'f-greenhollow',
  },
  {
    title: 'Pantry jams & preserves',
    subtitle: 'Small-batch strawberry jam and fig butter',
    type: 'products',
    farmerId: 'f-thornberry',
  },
  {
    title: 'Artisan cheeses',
    subtitle: 'Jersey cow cheddar and morning ricotta',
    type: 'products',
    farmerId: 'f-maplecrest',
  },
  {
    title: 'Heirloom squash & root vegetables',
    subtitle: 'Yukon golds, butternut squash and beets',
    type: 'products',
    category: 'Vegetables',
  },
  {
    title: 'Weekend breakfast favourites',
    subtitle: 'Croissants, farm eggs and maple links',
    type: 'products',
    productIds: ['p-08', 'p-12', 'p-31', 'p-10'],
  },
];

/**
 * Custom hook to manage the curated and endless Home feed.
 */
export function useFeed() {
  const [sections, setSections] = useState(() => {
    if (cachedSections) return cachedSections;
    const initial = buildCuratedSections();
    cachedSections = initial;
    return initial;
  });

  const [loading, setLoading] = useState(false);
  const templateIndexRef = useRef(0);
  const hasMore = templateIndexRef.current < ENDLESS_TEMPLATES.length * 3; // allow multiple cycles

  const loadMore = useCallback(() => {
    if (loading) return;

    setLoading(true);

    setTimeout(() => {
      const template = ENDLESS_TEMPLATES[templateIndexRef.current % ENDLESS_TEMPLATES.length];
      templateIndexRef.current += 1;

      let sectionItems = [];
      if (template.category) {
        sectionItems = products.filter((p) => p.category === template.category);
      } else if (template.farmerId) {
        sectionItems = products.filter((p) => p.farmerId === template.farmerId);
      } else if (template.productIds) {
        sectionItems = template.productIds.map((id) => getProduct(id)).filter(Boolean);
      } else {
        sectionItems = products.slice(0, 6);
      }

      if (sectionItems.length > 0) {
        const newSection = {
          id: `endless-${Date.now()}-${templateIndexRef.current}`,
          title: template.title,
          subtitle: template.subtitle,
          type: template.type,
          cardVariant: 'compact',
          items: sectionItems,
          seeAllPath: `/buyer/products?filter=${encodeURIComponent(template.title)}`,
          punctuation: templateIndexRef.current % 3 === 0
            ? FEED_PUNCTUATIONS[templateIndexRef.current % FEED_PUNCTUATIONS.length]
            : null,
        };

        setSections((prev) => {
          const updated = [...prev, newSection];
          cachedSections = updated;
          return updated;
        });
      }

      setLoading(false);
    }, 350);
  }, [loading]);

  return { sections, loadMore, loading, hasMore };
}

export default useFeed;
