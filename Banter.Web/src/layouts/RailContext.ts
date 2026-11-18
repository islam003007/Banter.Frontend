import { createContext, useContext } from 'react';

interface RailContextValue {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const RailContext = createContext<RailContextValue | null>(null);

export function useRail(): RailContextValue {
  const context = useContext(RailContext);
  if (!context) throw new Error('useRail must be used inside WorkspaceLayout');
  return context;
}
