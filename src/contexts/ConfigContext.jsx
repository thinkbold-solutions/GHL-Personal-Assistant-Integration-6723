import React, { createContext, useContext, useState, useEffect } from 'react';

const ConfigContext = createContext();

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({
    ghlToken: '',
    locationId: '',
    openaiApiKey: '',
    voiceEnabled: true,
    autoConfirm: false,
    theme: 'dark'
  });

  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Load config from localStorage
    const savedConfig = localStorage.getItem('ghl-assistant-config');
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      setConfig(parsedConfig);
      setIsConfigured(Boolean(parsedConfig.ghlToken && parsedConfig.openaiApiKey));
    }
  }, []);

  const updateConfig = (newConfig) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    localStorage.setItem('ghl-assistant-config', JSON.stringify(updatedConfig));
    setIsConfigured(Boolean(updatedConfig.ghlToken && updatedConfig.openaiApiKey));
  };

  const clearConfig = () => {
    setConfig({
      ghlToken: '',
      locationId: '',
      openaiApiKey: '',
      voiceEnabled: true,
      autoConfirm: false,
      theme: 'dark'
    });
    localStorage.removeItem('ghl-assistant-config');
    setIsConfigured(false);
  };

  return (
    <ConfigContext.Provider value={{
      config,
      updateConfig,
      clearConfig,
      isConfigured
    }}>
      {children}
    </ConfigContext.Provider>
  );
};