import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types/settings';

interface SettingsState {
  settings: AppSettings;
  updateAI: (partial: Partial<AppSettings['ai']>) => void;
  updateSecurity: (partial: Partial<AppSettings['security']>) => void;
  updateWorkspace: (partial: Partial<AppSettings['workspace']>) => void;
  updateGeneral: (partial: Partial<AppSettings['general']>) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateAI: (partial) =>
        set((s) => ({
          settings: { ...s.settings, ai: { ...s.settings.ai, ...partial } },
        })),
      updateSecurity: (partial) =>
        set((s) => ({
          settings: { ...s.settings, security: { ...s.settings.security, ...partial } },
        })),
      updateWorkspace: (partial) =>
        set((s) => ({
          settings: { ...s.settings, workspace: { ...s.settings.workspace, ...partial } },
        })),
      updateGeneral: (partial) =>
        set((s) => ({
          settings: { ...s.settings, general: { ...s.settings.general, ...partial } },
        })),
      reset: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    { name: 'ai-pc-agent-settings' }
  )
);
