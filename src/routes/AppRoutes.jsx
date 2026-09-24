import React from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { PATHS } from './paths';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import GuestLayout from '@/layouts/GuestLayout';
import VendorLayout from '@/layouts/VendorLayout';
import BuyerLayout from '@/layouts/BuyerLayout';

// Guest Pages
import GuestHome from '@/pages/guest/Home';
import About from '@/pages/guest/About';
import Contact from '@/pages/guest/Contact';
import Login from '@/pages/guest/Login';
import Register from '@/pages/guest/Register';
import ForgotPassword from '@/pages/guest/ForgotPassword';
import Unauthorized from '@/pages/guest/Unauthorized';
import NotFound from '@/pages/guest/NotFound';

// Vendor Pages
import Overview from '@/pages/vendor/Overview';

// Buyer Pages (Main Tabs / Destinations)
import BuyerHome from '@/pages/buyer/Home';
import BuyerProducts from '@/pages/buyer/Products';
import BuyerOrders from '@/pages/buyer/Orders';
import BuyerFavorites from '@/pages/buyer/Favorites';
import BuyerProfile from '@/pages/buyer/Profile';
import BuyerMarkets from '@/pages/buyer/Markets';
import BuyerFarmers from '@/pages/buyer/Farmers';

// Buyer Sheet Views (Modal details & sub-screens)
import BuyerProductDetail from '@/pages/buyer/ProductDetail';
import BuyerFarmerDetail from '@/pages/buyer/FarmerDetail';
import BuyerMarketDetail from '@/pages/buyer/MarketDetail';
import BuyerCart from '@/pages/buyer/Cart';
import BuyerOrderConfirmed from '@/pages/buyer/OrderConfirmed';
import BuyerOrderDetail from '@/pages/buyer/OrderDetail';
import BuyerAssistant from '@/pages/buyer/Assistant';
import BuyerProfileDetails from '@/pages/buyer/ProfileDetails';
import BuyerSavedMarkets from '@/pages/buyer/SavedMarkets';
import BuyerProfileNotifications from '@/pages/buyer/ProfileNotifications';
import BuyerHelp from '@/pages/buyer/Help';

// Sheet wrapper component
import SheetRoute from '@/components/layout/SheetRoute';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

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
 * Main application router using the background location pattern for modal bottom sheets.
 */
export function AppRoutes() {
  const location = useLocation();
  const background = location.state && location.state.background;

  return (
    <>
      {/* ── Base Routes Block (remains mounted under modal sheets) ──────── */}
      <Routes location={background || location}>
        {/* ── Vendor (Producer) Routes ───────────────────────────── */}
        <Route path="/vendor" element={<VendorLayout />}>
          <Route index element={<Overview />} />
          <Route path="stock"          element={<PreviewPlaceholder roleName="Stock & Inventory" />} />
          <Route path="stock-template" element={<PreviewPlaceholder roleName="Weekly Stock Template" />} />
          <Route path="orders"         element={<PreviewPlaceholder roleName="Incoming Pre-Orders" />} />
          <Route path="insights"       element={<PreviewPlaceholder roleName="Sales Insights" />} />
          <Route path="reviews"        element={<PreviewPlaceholder roleName="Customer Reviews" />} />
          <Route path="settings"       element={<PreviewPlaceholder roleName="Stall & Market Settings" />} />
        </Route>

        {/* ── Customer (Buyer) Routes ────────────────────────────── */}
        <Route
          path="/buyer"
          element={
            <ProtectedRoute allowedRoles={['customer', 'buyer']}>
              <BuyerLayout />
            </ProtectedRoute>
          }
        >
          {/* Main page tabs */}
          <Route index element={<BuyerHome />} />
          <Route path="products" element={<BuyerProducts />} />
          <Route path="orders" element={<BuyerOrders />} />
          <Route path="favorites" element={<BuyerFavorites />} />
          <Route path="profile" element={<BuyerProfile />} />
          <Route path="markets" element={<BuyerMarkets />} />
          <Route path="farmers" element={<BuyerFarmers />} />

          {/* Full-page fallbacks if opened directly without a background location */}
          <Route path="products/:id" element={<BuyerProductDetail inSheet={false} />} />
          <Route path="farmers/:id" element={<BuyerFarmerDetail inSheet={false} />} />
          <Route path="markets/:id" element={<BuyerMarketDetail inSheet={false} />} />
          <Route path="cart" element={<BuyerCart inSheet={false} />} />
          <Route path="order-confirmed" element={<BuyerOrderConfirmed inSheet={false} />} />
          <Route path="orders/:id" element={<BuyerOrderDetail inSheet={false} />} />
          <Route path="assistant" element={<BuyerAssistant inSheet={false} />} />
          <Route path="profile/details" element={<BuyerProfileDetails inSheet={false} />} />
          <Route path="profile/markets" element={<BuyerSavedMarkets inSheet={false} />} />
          <Route path="profile/notifications" element={<BuyerProfileNotifications inSheet={false} />} />
          <Route path="profile/help" element={<BuyerHelp inSheet={false} />} />
        </Route>

        {/* ── Guest (Unauthenticated) Routes ─────────────────────── */}
        <Route element={<GuestLayout />}>
          <Route path={PATHS.HOME}            element={<GuestHome />} />
          <Route path={PATHS.ABOUT}           element={<About />} />
          <Route path={PATHS.CONTACT}         element={<Contact />} />
          <Route path={PATHS.LOGIN}           element={<Login />} />
          <Route path={PATHS.REGISTER}        element={<Register />} />
          <Route path={PATHS.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path={PATHS.UNAUTHORIZED}    element={<Unauthorized />} />

          {/* Temporary Admin Preview */}
          <Route path={PATHS.ADMIN} element={<PreviewPlaceholder roleName="Admin" />} />

          {/* 404 Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>

      {/* ── Sheet Overlays Block (rendered above background location) ──── */}
      {background && (
        <Routes>
          <Route
            path="/buyer/products/:id"
            element={
              <SheetRoute size="tall">
                <BuyerProductDetail />
              </SheetRoute>
            }
          />
          <Route
            path="/buyer/farmers/:id"
            element={
              <SheetRoute size="tall">
                <BuyerFarmerDetail />
              </SheetRoute>
            }
          />
          <Route
            path="/buyer/markets/:id"
            element={
              <SheetRoute size="tall">
                <BuyerMarketDetail />
              </SheetRoute>
            }
          />
          <Route
            path="/buyer/cart"
            element={
              <SheetRoute size="tall">
                <BuyerCart />
              </SheetRoute>
            }
          />
          <Route
            path="/buyer/order-confirmed"
            element={
              <SheetRoute size="peek">
                <BuyerOrderConfirmed />
              </SheetRoute>
            }
          />
          <Route
            path="/buyer/orders/:id"
            element={
              <SheetRoute size="tall">
                <BuyerOrderDetail />
              </SheetRoute>
            }
          />
          <Route
            path="/buyer/assistant"
            element={
              <SheetRoute size="full">
                <BuyerAssistant />
              </SheetRoute>
            }
          />
          <Route
            path="/buyer/profile/details"
            element={
              <SheetRoute size="tall" title="Personal details">
                <BuyerProfileDetails />
              </SheetRoute>
            }
          />
          <Route
            path="/buyer/profile/markets"
            element={
              <SheetRoute size="tall" title="Saved markets">
                <BuyerSavedMarkets />
              </SheetRoute>
            }
          />
          <Route
            path="/buyer/profile/notifications"
            element={
              <SheetRoute size="tall" title="Notification preferences">
                <BuyerProfileNotifications />
              </SheetRoute>
            }
          />
          <Route
            path="/buyer/profile/help"
            element={
              <SheetRoute size="tall" title="Help & FAQ">
                <BuyerHelp />
              </SheetRoute>
            }
          />
        </Routes>
      )}
    </>
  );
}

export default AppRoutes;
