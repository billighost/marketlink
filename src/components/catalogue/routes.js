/**
 * CATALOGUE_ROUTES — one import, one lookup.
 *
 * All link targets for the shared catalogue components come from here.
 * No inline audience ternaries scattered across 40 files — that is how
 * the two sides drift back apart within a month.
 *
 * Usage:
 *   import { CATALOGUE_ROUTES } from '@/components/catalogue/routes';
 *   const r = CATALOGUE_ROUTES[audience];
 *   <Link to={r.produce(product._id)}>…</Link>
 */
export const CATALOGUE_ROUTES = {
  guest: {
    produce:  (id) => `/products/${id}`,
    stall:    (id) => `/farmers/${id}`,
    market:   (id) => `/markets/${id}`,
    browse:   '/products',
    stalls:   '/farmers',
    markets:  '/markets',
  },
  buyer: {
    produce:  (id) => `/buyer/products/${id}`,
    stall:    (id) => `/buyer/stalls/${id}`,
    market:   (id) => `/buyer/markets/${id}`,
    browse:   '/buyer/products',
    stalls:   '/buyer/stalls',
    markets:  '/buyer/markets',
  },
};

export const useCatalogueRoutes = (audience) => CATALOGUE_ROUTES[audience] || CATALOGUE_ROUTES.guest;

