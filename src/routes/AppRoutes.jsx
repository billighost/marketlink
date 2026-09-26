import React from 'react';
import { Routes, Route, Link, Navigate, useParams } from 'react-router-dom';
import { PATHS } from './paths';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import GuestLayout from '@/layouts/GuestLayout';
import VendorLayout from '@/layouts/VendorLayout';
import BuyerLayout from '@/layouts/BuyerLayout';
import AdminLayout from '@/layouts/AdminLayout';

// Guest Pages
import GuestHome from '@/pages/guest/Home';
import About from '@/pages/guest/About';
import Contact from '@/pages/guest/Contact';
import Login from '@/pages/guest/Login';
import Register from '@/pages/guest/Register';
import ForgotPassword from '@/pages/guest/ForgotPassword';
import ResetPassword from '@/pages/guest/ResetPassword';
import VerifyEmail from '@/pages/guest/VerifyEmail';
import Unauthorized from '@/pages/guest/Unauthorized';
import NotFound from '@/pages/guest/NotFound';
import Market from '@/pages/guest/Market';
import MarketDetail from '@/pages/guest/MarketDetail';
import Farmers from '@/pages/guest/Farmers';
import FarmerDetail from '@/pages/guest/FarmerDetail';
import Products from '@/pages/guest/Products';
import ProductDetail from '@/pages/guest/ProductDetail';

// Vendor Pages
import VendorOverview from '@/pages/vendor/Overview';
import VendorStock from '@/pages/vendor/Stock';
import VendorOrders from '@/pages/vendor/Orders';
import VendorInsights from '@/pages/vendor/Insights';
import VendorReviews from '@/pages/vendor/Reviews';
import VendorMyStall from '@/pages/vendor/MyStall';

// Admin Pages
import AdminOverview from '@/pages/admin/Overview';
import AdminPeople from '@/pages/admin/People';
import AdminMarkets from '@/pages/admin/Markets';
import AdminModeration from '@/pages/admin/Moderation';
import AdminReports from '@/pages/admin/Reports';
import AdminSettings from '@/pages/admin/Settings';

// Buyer Pages (Main Tabs / Destinations)
import BuyerHome from '@/pages/buyer/Home';
import BuyerProducts from '@/pages/buyer/Products';
import BuyerOrders from '@/pages/buyer/Orders';
import BuyerFavorites from '@/pages/buyer/Favorites';
import BuyerProfile from '@/pages/buyer/Profile';
import BuyerMarkets from '@/pages/buyer/Markets';
import BuyerFarmers from '@/pages/buyer/Farmers';
import BuyerReviews from '@/pages/buyer/Reviews';

// Buyer Detail / Flow Pages
import BuyerProductDetail from '@/pages/buyer/ProductDetail';
import BuyerFarmerDetail from '@/pages/buyer/FarmerDetail';
import BuyerMarketDetail from '@/pages/buyer/MarketDetail';
import BuyerCart from '@/pages/buyer/Cart';
import BuyerCheckout from '@/pages/buyer/Checkout';
import BuyerOrderConfirmed from '@/pages/buyer/OrderConfirmed';
import BuyerOrderDetail from '@/pages/buyer/OrderDetail';
import BuyerAssistant from '@/pages/buyer/Assistant';
import BuyerProfileDetails from '@/pages/buyer/ProfileDetails';
import BuyerSavedMarkets from '@/pages/buyer/SavedMarkets';
import BuyerProfileNotifications from '@/pages/buyer/ProfileNotifications';
import BuyerNotificationPrefs from '@/pages/buyer/NotificationPrefs';
import BuyerHelp from '@/pages/buyer/Help';
import BuyerNotFound from '@/pages/buyer/NotFound';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

/** Preserves :id when redirecting the old /buyer/farmers/:id URL to /buyer/stalls/:id. */
function RedirectFarmerToStall() {
  const { id } = useParams();
  return <Navigate to={`/buyer/stalls/${id}`} replace />;
}

/**
 * Temporary placeholder for authenticated areas accessed via preview buttons
 */
function PreviewPlaceholder({ roleName }) {
  return (
    <div style={{ padding: 'var(--space-12) var(--space-4)', display: 'flex', justifyContent: 'center' }}>
      <Card style={{ maxWidth: 'var(--container-form)', width: '100%', textAlign: 'center', padding: 'var(--space-8)' }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'var(--text-h2)', marginBottom: 'var(--space-2)' }}>
          {roleName} Area Preview
        </h1>
        <p style={{ color: 'var(--color-ink-soft)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-body)' }}>
          This is a placeholder for the authenticated {roleName} workspace. Signed-in pages are in development.
        </p>
        <Button as={Link} to={PATHS.LOGIN} variant="secondary" size="md">
          Back to sign in
        </Button>
      </Card>
    </div>
  );
}

/**
 * Main application router. Every destination is a real page.
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* ── Vendor (Producer) Routes ───────────────────────────── */}
      <Route
        path="/vendor"
        element={
          <ProtectedRoute allowedRoles={['farmer', 'vendor']}>
            <VendorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<VendorOverview />} />
        <Route path="stock" element={<VendorStock />} />
        <Route path="orders" element={<VendorOrders />} />
        <Route path="insights" element={<VendorInsights />} />
        <Route path="reviews" element={<VendorReviews />} />
        <Route path="settings" element={<VendorMyStall />} />
      </Route>

      {/* ── Admin Routes ──────────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="people" element={<AdminPeople />} />
        <Route path="markets" element={<AdminMarkets />} />
        <Route path="moderation" element={<AdminModeration />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* ── Customer (Buyer) Routes — every destination is a real page ──── */}
      <Route
        path="/buyer"
        element={
          <ProtectedRoute allowedRoles={['customer', 'buyer']}>
            <BuyerLayout />
          </ProtectedRoute>
        }
      >
        {/* Today */}
        <Route index element={<BuyerHome />} />

        {/* Browse produce */}
        <Route path="products"            element={<BuyerProducts />} />
        <Route path="products/:id"        element={<BuyerProductDetail />} />

        {/* Stalls — canonical. /buyer/farmers* redirects in. */}
        <Route path="stalls"              element={<BuyerFarmers />} />
        <Route path="stalls/:id"          element={<BuyerFarmerDetail />} />

        {/* Markets */}
        <Route path="markets"             element={<BuyerMarkets />} />
        <Route path="markets/:id"         element={<BuyerMarketDetail />} />

        {/* Basket and checkout — canonical. /buyer/cart redirects in. */}
        <Route path="basket"              element={<BuyerCart />} />
        <Route path="checkout"            element={<BuyerCheckout />} />

        {/* Orders */}
        <Route path="orders"              element={<BuyerOrders />} />
        <Route path="orders/:id"          element={<BuyerOrderDetail />} />
        <Route path="orders/:id/confirmed" element={<BuyerOrderConfirmed />} />

        {/* Saved — canonical. /buyer/favorites redirects in. */}
        <Route path="saved"               element={<BuyerFavorites />} />

        {/* Assistant, notifications, help */}
        <Route path="assistant"           element={<BuyerAssistant />} />
        <Route path="notifications"       element={<BuyerProfileNotifications />} />
        <Route path="help"                element={<BuyerHelp />} />

        {/* You */}
        <Route path="profile"             element={<BuyerProfile />} />
        <Route path="profile/details"     element={<BuyerProfileDetails />} />
        <Route path="profile/markets"     element={<BuyerSavedMarkets />} />
        <Route path="profile/notifications" element={<BuyerNotificationPrefs />} />
        <Route path="profile/reviews"     element={<BuyerReviews />} />

        {/* ── Redirects: every old URL still resolves ──────────────────── */}
        <Route path="farmers"             element={<Navigate to="/buyer/stalls" replace />} />
        <Route path="farmers/:id"         element={<RedirectFarmerToStall />} />
        <Route path="cart"                element={<Navigate to="/buyer/basket" replace />} />
        <Route path="favorites"           element={<Navigate to="/buyer/saved" replace />} />
        <Route path="reviews"             element={<Navigate to="/buyer/profile/reviews" replace />} />
        <Route path="profile/help"        element={<Navigate to="/buyer/help" replace />} />
        <Route path="order-confirmed"     element={<Navigate to="/buyer/orders" replace />} />

        {/* Buyer 404 */}
        <Route path="*"                   element={<BuyerNotFound />} />
      </Route>

      {/* ── Guest (Unauthenticated) Routes ─────────────────────── */}
      <Route element={<GuestLayout />}>
        <Route path={PATHS.HOME}            element={<GuestHome />} />
        <Route path={PATHS.MARKETS}         element={<Market />} />
        <Route path={PATHS.MARKET_DETAIL}    element={<MarketDetail />} />
        <Route path={PATHS.FARMERS}          element={<Farmers />} />
        <Route path={PATHS.FARMER_DETAIL}   element={<FarmerDetail />} />
        <Route path={PATHS.PRODUCTS}        element={<Products />} />
        <Route path={PATHS.PRODUCT_DETAIL}   element={<ProductDetail />} />
        <Route path={PATHS.ABOUT}           element={<About />} />
        <Route path={PATHS.CONTACT}         element={<Contact />} />
        <Route path={PATHS.LOGIN}           element={<Login />} />
        <Route path={PATHS.REGISTER}        element={<Register />} />
        <Route path={PATHS.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={PATHS.RESET_PASSWORD}  element={<ResetPassword />} />
        <Route path={PATHS.VERIFY_EMAIL}    element={<VerifyEmail />} />
        <Route path={PATHS.UNAUTHORIZED}    element={<Unauthorized />} />

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
