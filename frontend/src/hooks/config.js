// Central persisted configuration for the dashboard: API endpoint, background, table
// column visibility, and dynamically added pages.
const STORAGE_KEY = 'dashboardConfig';
const CHANGE_EVENT = 'dashboard-config-changed';

export const DEFAULT_COLUMNS = {
  active: { id: true, status: true, user: true, name: true, partition: true, nodes: true, cpus: true, memory: true, timeleft: true },
  pending: { id: true, status: true, user: true, name: true, partition: true, nodes: true, cpus: true, memory: true, timeleft: true },
  completed: { id: true, status: true, user: true, name: true, partition: true, nodes: true, cpus: true, memory: true, elapsed: true, begin: true },
};

export const DEFAULT_CONFIG = {
  apiBaseUrl: 'http://localhost:8888',
  background: { type: 'none', color: '#f0f2f5', image: null },
  columns: DEFAULT_COLUMNS,
  customPages: [],
  customRoutes: [],
};

export const loadConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      background: { ...DEFAULT_CONFIG.background, ...(parsed.background || {}) },
      columns: {
        active: { ...DEFAULT_COLUMNS.active, ...(parsed.columns?.active || {}) },
        pending: { ...DEFAULT_COLUMNS.pending, ...(parsed.columns?.pending || {}) },
        completed: { ...DEFAULT_COLUMNS.completed, ...(parsed.columns?.completed || {}) },
      },
      customPages: Array.isArray(parsed.customPages) ? parsed.customPages : [],
      customRoutes: Array.isArray(parsed.customRoutes) ? parsed.customRoutes : [],
    };
  } catch (error) {
    console.error('Failed to load dashboard config, falling back to defaults:', error);
    return DEFAULT_CONFIG;
  }
};

export const saveConfig = (config) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: config }));
};

export const CONFIG_CHANGE_EVENT = CHANGE_EVENT;
