import { create } from 'zustand';

import type { ImportSource } from '@/types';

interface AppState {
  /** Se está processando uma nota */
  isProcessing: boolean;
  /** Último erro ocorrido */
  lastError: string | null;
  /** URL escaneada aguardando extração via WebView */
  pendingUrl: string | null;
  /** Fonte da última importação */
  lastImportSource: ImportSource | null;

  setProcessing: (v: boolean) => void;
  setError: (e: string | null) => void;
  setPendingUrl: (url: string | null) => void;
  setLastImportSource: (source: ImportSource) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isProcessing: false,
  lastError: null,
  pendingUrl: null,
  lastImportSource: null,

  setProcessing: (isProcessing) => set({ isProcessing }),
  setError: (lastError) => set({ lastError }),
  setPendingUrl: (pendingUrl) => set({ pendingUrl }),
  setLastImportSource: (lastImportSource) => set({ lastImportSource }),
  reset: () =>
    set({
      isProcessing: false,
      lastError: null,
      pendingUrl: null,
    }),
}));
