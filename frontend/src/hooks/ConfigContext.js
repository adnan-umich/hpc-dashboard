import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { loadConfig, saveConfig, CONFIG_CHANGE_EVENT, DEFAULT_CONFIG } from './config';

const ConfigContext = createContext({ config: DEFAULT_CONFIG, updateConfig: () => {} });

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(loadConfig);

  useEffect(() => {
    const onChange = () => setConfig(loadConfig());
    window.addEventListener(CONFIG_CHANGE_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(CONFIG_CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const updateConfig = useCallback((updater) => {
    setConfig((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      saveConfig(next);
      return next;
    });
  }, []);

  return (
    <ConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);
