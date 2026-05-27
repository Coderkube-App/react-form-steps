import { DraftData } from '../types';

const PREFIX = 'form-steps-draft';

export const browserStoragePersistence = {
  save: (formKey: string, data: DraftData, type: 'localStorage' | 'sessionStorage') => {
    try {
      if (typeof window === 'undefined') return;
      const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
      if (!storage) return;
      storage.setItem(`${PREFIX}:${formKey}`, JSON.stringify(data));
    } catch (e) {
      console.warn('Browser storage save failed:', e);
    }
  },

  load: (formKey: string, type: 'localStorage' | 'sessionStorage', ttl?: number): DraftData | null => {
    try {
      if (typeof window === 'undefined') return null;
      const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
      if (!storage) return null;
      const raw = storage.getItem(`${PREFIX}:${formKey}`);
      if (!raw) return null;

      const data: DraftData = JSON.parse(raw);
      
      // Check TTL
      if (ttl) {
        const now = Date.now();
        const expired = now - data.savedAt > ttl * 1000;
        if (expired) {
          try {
            storage.removeItem(`${PREFIX}:${formKey}`);
          } catch (rmError) {
            // Ignore remove failure
          }
          return null;
        }
      }

      return data;
    } catch (e) {
      console.warn('Browser storage load failed:', e);
      return null;
    }
  },

  clear: (formKey: string, type: 'localStorage' | 'sessionStorage') => {
    try {
      if (typeof window === 'undefined') return;
      const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
      if (!storage) return;
      storage.removeItem(`${PREFIX}:${formKey}`);
    } catch (e) {
      console.warn('Browser storage clear failed:', e);
    }
  }
};
