import React, { useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { PATHS } from '@/routes/paths';

const tabFor = (to) => (String(to).split('?')[0] === PATHS.REGISTER ? 'register' : 'login');

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Resolves once the destination page has rendered its tab switcher.
// This matters if your routes are lazy-loaded: we must not let the browser
// take the "after" snapshot while a loading spinner is still on screen.
const waitForTab = (tab, timeout = 1500) =>
  new Promise((resolve) => {
    const start = performance.now();
    const check = () => {
      const el = document.querySelector('[data-auth-tabs="true"]');
      if (el?.dataset.active === tab || performance.now() - start > timeout) {
        resolve();
      } else {
        setTimeout(check, 16);
      }
    };
    check();
  });

/**
 * Returns a navigate(to) function that slides between Sign In and Create Account.
 * Falls back to a normal navigation where View Transitions aren't supported.
 */
export function useAuthNavigate() {
  const navigate = useNavigate();

  return useCallback(
    (to) => {
      const canAnimate =
        typeof document !== 'undefined' &&
        typeof document.startViewTransition === 'function' &&
        !prefersReducedMotion();

      if (!canAnimate) {
        navigate(to);
        return;
      }

      const target = tabFor(to);
      const root = document.documentElement;

      // Going to Create Account slides left, going back to Sign In slides right.
      root.dataset.authNav = target === 'register' ? 'forward' : 'back';

      const transition = document.startViewTransition(async () => {
        flushSync(() => navigate(to));
        window.scrollTo(0, 0);
        await waitForTab(target);
      });

      transition.finished.finally(() => {
        delete root.dataset.authNav;
      });
    },
    [navigate]
  );
}

/**
 * Drop-in replacement for <Link> between the Login and Register pages.
 */
export function AuthSwitchLink({ to, onClick, children, ...rest }) {
  const goTo = useAuthNavigate();
  const { pathname } = useLocation();

  const handleClick = (e) => {
    onClick?.(e);
    if (e.defaultPrevented) return;

    // Let the browser handle ctrl/cmd-click, middle-click, new tab, etc.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    // Already on this page: nothing to slide.
    if (String(to).split('?')[0] === pathname) return;

    e.preventDefault();
    goTo(to);
  };

  return (
    <Link to={to} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}

export default AuthSwitchLink;
