import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { PATHS } from './paths';
import GuestLayout from '@/layouts/GuestLayout';
import Home from '@/pages/guest/Home';
import About from '@/pages/guest/About';
import Contact from '@/pages/guest/Contact';
import Login from '@/pages/guest/Login';
import Register from '@/pages/guest/Register';
import ForgotPassword from '@/pages/guest/ForgotPassword';
import Unauthorized from '@/pages/guest/Unauthorized';
import NotFound from '@/pages/guest/NotFound';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

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
 * Main application router
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Guest (Unauthenticated) Routes */}
      <Route element={<GuestLayout />}>
        <Route path={PATHS.HOME} element={<Home />} />
        <Route path={PATHS.ABOUT} element={<About />} />
        <Route path={PATHS.CONTACT} element={<Contact />} />
        <Route path={PATHS.LOGIN} element={<Login />} />
        <Route path={PATHS.REGISTER} element={<Register />} />
        <Route path={PATHS.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={PATHS.UNAUTHORIZED} element={<Unauthorized />} />

        {/* Temporary Preview Routes for Role Switcher */}
        <Route path={PATHS.BUYER} element={<PreviewPlaceholder roleName="Customer" />} />
        <Route path={PATHS.VENDOR} element={<PreviewPlaceholder roleName="Farmer" />} />
        <Route path={PATHS.ADMIN} element={<PreviewPlaceholder roleName="Admin" />} />

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
