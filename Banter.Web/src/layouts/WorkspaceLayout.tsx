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
    const focusTimer = window.setTimeout(() => {
      document.querySelector<HTMLButtonElement>('.rail__close')?.focus();
    }, 40);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setDrawerOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
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
