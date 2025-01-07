import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  activeModal: string | null;
  isLoading: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>()(set => ({
  isSidebarOpen: true,
  activeModal: null,
  isLoading: false,
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: open => set({ isSidebarOpen: open }),
  openModal: modalId => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
  setLoading: loading => set({ isLoading: loading }),
}));
