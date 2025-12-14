// LocalStorage wrapper with fallback
const STORAGE_KEYS = {
  CONSOLES: 'ps_rental_consoles',
  MENU_ITEMS: 'ps_rental_menu',
  SETTINGS: 'ps_rental_settings',
  DAILY_LOGS: 'ps_rental_daily_logs',
  SYSTEM_LOGS: 'ps_rental_system_logs',
};

export const storage = {
  get(key, defaultValue = null) {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  },

  set(key, value) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  remove(key) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },

  clear() {
    if (typeof window === 'undefined') return;
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }
};

export default STORAGE_KEYS;