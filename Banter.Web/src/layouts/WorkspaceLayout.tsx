import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ConversationDrawer } from '../components/ConversationDrawer';
import { WorkspaceHeader } from '../components/WorkspaceHeader';
import { WorkspaceUiContext, type DrawerFocus } from './WorkspaceUiContext';

type WorkspaceMode = 'inbox' | 'chat' | 'page';

function modeFor(pathname: string): WorkspaceMode {
  if (pathname.startsWith('/c/')) return 'chat';
  if (pathname === '/inbox') return 'inbox';
  return 'page';
}

export function WorkspaceLayout() {
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState<{ open: boolean; focus: DrawerFocus }>({
    open: false,
    focus: 'search',
  });
  const mode = modeFor(pathname);

  const closeDrawer = useCallback(() => {
    setDrawer((current) => ({ ...current, open: false }));
  }, []);

  const openDrawer = useCallback((focus: DrawerFocus = 'close') => {
    setDrawer({ open: true, focus });
  }, []);

  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        !event.altKey &&
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === 'k'
      ) {
        event.preventDefault();
        openDrawer('search');
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [openDrawer]);

  const value = useMemo(
    () => ({
      drawerOpen: drawer.open,
      openDrawer,
      closeDrawer,
    }),
    [drawer.open, openDrawer, closeDrawer],
  );

  return (
    <WorkspaceUiContext.Provider value={value}>
      <div className={`workspace workspace--${mode}`.trim()}>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <WorkspaceHeader />
        <main className="workspace__main" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        {drawer.open && <ConversationDrawer focus={drawer.focus} onClose={closeDrawer} />}
      </div>
    </WorkspaceUiContext.Provider>
  );
}
