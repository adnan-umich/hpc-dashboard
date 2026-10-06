// Resolves the API base URL from persisted configuration so plain (non-hook) modules
// can build request URLs without needing React context.
import { loadConfig } from './config';

export const getApiBaseUrl = () => (loadConfig().apiBaseUrl || 'http://localhost:8888').replace(/\/+$/, '');

export const apiUrl = (path, base) => `${base ? base.replace(/\/+$/, '') : getApiBaseUrl()}${path}`;
