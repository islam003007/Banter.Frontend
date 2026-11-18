import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ConversationRail } from '../components/ConversationRail';
import { RailContext } from './RailContext';

type WorkspaceMode = 'inbox' | 'chat' | 'page';

function modeFor(pathname: string): WorkspaceMode {
  if (pathname.startsWith('/c/')) return 'chat';
  if (pathname === '/inbox') return 'inbox';
  return 'page';
}

export function WorkspaceLayout() {
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mode = modeFor(pathname);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const closeButton = document.querySelector<HTMLButtonElement>('.rail__close');
    const focusTimer = window.setTimeout(() => closeButton?.focus(), 40);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setDrawerOpen(false);
        return;
      }

      if (event.key !== 'Tab') return;
      const rail = document.getElementById('conversation-rail');
      if (!rail) return;
      const focusable = Array.from(
        rail.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!rail.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [drawerOpen]);

  const rail = useMemo(
    () => ({
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [drawerOpen],
  );

  return (
    <RailContext.Provider value={rail}>
      <div
        className={`workspace workspace--${mode} ${
          drawerOpen ? 'workspace--rail-open' : ''
        }`.trim()}
      >
        <a className="skip-link" href="#main-content">
          Skip to the conversation
        </a>
        <ConversationRail />
        {drawerOpen && (
          <button
            type="button"
            className="rail-scrim"
            aria-label="Close conversations"
            onClick={() => setDrawerOpen(false)}
          />
        )}
        <main className="workspace__main" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </RailContext.Provider>
  );
}
