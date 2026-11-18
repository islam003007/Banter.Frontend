import { createContext, useContext } from 'react';

export type DrawerFocus = 'search' | 'close';

interface WorkspaceUiValue {
  drawerOpen: boolean;
  openDrawer: (focus?: DrawerFocus) => void;
  closeDrawer: () => void;
}

export const WorkspaceUiContext = createContext<WorkspaceUiValue | null>(null);

export function useWorkspaceUi(): WorkspaceUiValue {
  const context = useContext(WorkspaceUiContext);
  if (!context) throw new Error('useWorkspaceUi must be used inside WorkspaceLayout');
  return context;
}
