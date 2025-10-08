/**
 * UI Store
 * 
 * Manages client-side UI state including theme, language, sidebar, and preferences
 * Persisted to localStorage for user preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================
// Types
// ============================================

export type Theme = 'light' | 'dark' | 'deloitte' | 'futuristic';
export type Language = 'en-US' | 'en-AU' | 'en-GB';

export interface UIState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // Language
  language: Language;
  setLanguage: (language: Language) => void;
  
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Mobile sidebar
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  
  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  
  // Notifications panel
  notificationsPanelOpen: boolean;
  setNotificationsPanelOpen: (open: boolean) => void;
  
  // AI Assistant panel
  aiAssistantOpen: boolean;
  setAiAssistantOpen: (open: boolean) => void;
  
  // Loading states
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  
  // Toast notifications (in-memory, not persisted)
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Modal states
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  
  // View preferences
  projectViewMode: 'grid' | 'list';
  setProjectViewMode: (mode: 'grid' | 'list') => void;
  
  kbViewMode: 'grid' | 'list';
  setKbViewMode: (mode: 'grid' | 'list') => void;
  
  // User preferences
  use24HourTime: boolean;
  setUse24HourTime: (use24Hour: boolean) => void;
  
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;
  
  // Reset all preferences
  resetPreferences: () => void;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  timestamp: number;
}

// ============================================
// Default State
// ============================================

const defaultState = {
  theme: 'dark' as Theme,
  language: 'en-US' as Language,
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  commandPaletteOpen: false,
  notificationsPanelOpen: false,
  aiAssistantOpen: false,
  globalLoading: false,
  toasts: [] as Toast[],
  activeModal: null,
  projectViewMode: 'grid' as 'grid' | 'list',
  kbViewMode: 'grid' as 'grid' | 'list',
  use24HourTime: false,
  compactMode: false,
};

// ============================================
// Store
// ============================================

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      ...defaultState,
      
      // Theme
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
          document.documentElement.classList.remove('light', 'dark', 'deloitte', 'futuristic');
          document.documentElement.classList.add(theme);
        }
      },
      
      // Language
      setLanguage: (language) => set({ language }),
      
      // Sidebar
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      // Mobile sidebar
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      
      // Command palette
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      
      // Notifications panel
      setNotificationsPanelOpen: (open) => set({ notificationsPanelOpen: open }),
      
      // AI Assistant
      setAiAssistantOpen: (open) => set({ aiAssistantOpen: open }),
      
      // Global loading
      setGlobalLoading: (loading) => set({ globalLoading: loading }),
      
      // Toasts
      addToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const duration = toast.duration || 5000;
        const newToast: Toast = {
          ...toast,
          id,
          timestamp: Date.now(),
          duration,
        };
        
        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));
        
        // Auto-remove after duration
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, duration);
        }
      },
      
      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
      },
      
      clearToasts: () => set({ toasts: [] }),
      
      // Modal
      setActiveModal: (modal) => set({ activeModal: modal }),
      
      // View preferences
      setProjectViewMode: (mode) => set({ projectViewMode: mode }),
      setKbViewMode: (mode) => set({ kbViewMode: mode }),
      
      // User preferences
      setUse24HourTime: (use24Hour) => set({ use24HourTime: use24Hour }),
      setCompactMode: (compact) => set({ compactMode: compact }),
      
      // Reset
      resetPreferences: () => set(defaultState),
    }),
    {
      name: 'bidops-ui-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist certain fields, not transient UI state
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
        projectViewMode: state.projectViewMode,
        kbViewMode: state.kbViewMode,
        use24HourTime: state.use24HourTime,
        compactMode: state.compactMode,
      }),
    }
  )
);

// ============================================
// Selectors
// ============================================

/**
 * Select theme
 */
export const useTheme = () => useUIStore((state) => state.theme);

/**
 * Select language
 */
export const useLanguage = () => useUIStore((state) => state.language);

/**
 * Select sidebar state
 */
export const useSidebar = () => useUIStore((state) => ({
  collapsed: state.sidebarCollapsed,
  toggle: state.toggleSidebar,
  setCollapsed: state.setSidebarCollapsed,
}));

/**
 * Select mobile sidebar state
 */
export const useMobileSidebar = () => useUIStore((state) => ({
  open: state.mobileSidebarOpen,
  setOpen: state.setMobileSidebarOpen,
}));

/**
 * Select toast state
 */
export const useToasts = () => useUIStore((state) => ({
  toasts: state.toasts,
  addToast: state.addToast,
  removeToast: state.removeToast,
  clearToasts: state.clearToasts,
}));

/**
 * Select global loading state
 */
export const useGlobalLoading = () => useUIStore((state) => ({
  loading: state.globalLoading,
  setLoading: state.setGlobalLoading,
}));

// ============================================
// Helpers
// ============================================

/**
 * Initialize theme on app mount
 */
export function initializeTheme(): void {
  const theme = useUIStore.getState().theme;
  
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.add(theme);
  }
}

/**
 * Show success toast
 */
export function showSuccessToast(title: string, message?: string): void {
  useUIStore.getState().addToast({
    type: 'success',
    title,
    message,
  });
}

/**
 * Show error toast
 */
export function showErrorToast(title: string, message?: string): void {
  useUIStore.getState().addToast({
    type: 'error',
    title,
    message,
    duration: 7000, // Errors stay longer
  });
}

/**
 * Show warning toast
 */
export function showWarningToast(title: string, message?: string): void {
  useUIStore.getState().addToast({
    type: 'warning',
    title,
    message,
  });
}

/**
 * Show info toast
 */
export function showInfoToast(title: string, message?: string): void {
  useUIStore.getState().addToast({
    type: 'info',
    title,
    message,
  });
}