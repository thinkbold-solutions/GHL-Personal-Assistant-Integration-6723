import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { useAssistant } from '../../contexts/AssistantContext';
import { useConfig } from '../../contexts/ConfigContext';
import * as FiIcons from 'react-icons/fi';

const { FiWifi, FiWifiOff, FiLoader, FiAlertTriangle } = FiIcons;

const Header = () => {
  const { connectionStatus, connectionError } = useAssistant();
  const { isConfigured } = useConfig();

  const getStatusIcon = () => {
    if (!isConfigured) return FiWifiOff;
    switch (connectionStatus) {
      case 'connected':
        return FiWifi;
      case 'processing':
        return FiLoader;
      default:
        return connectionError ? FiAlertTriangle : FiWifiOff;
    }
  };

  const getStatusText = () => {
    if (!isConfigured) return 'Not Configured';
    switch (connectionStatus) {
      case 'connected':
        return 'Connected to GHL';
      case 'processing':
        return 'Processing...';
      default:
        return connectionError ? 'Connection Error' : 'Disconnected';
    }
  };

  const getStatusColor = () => {
    if (!isConfigured) return 'text-red-400';
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-400';
      case 'processing':
        return 'text-yellow-400';
      default:
        return 'text-red-400';
    }
  };

  return (
    <motion.header
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white/5 backdrop-blur-md border-b border-white/10 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Personal Assistant</h2>
          <p className="text-gray-300 text-sm">Your intelligent GHL companion</p>
        </div>
        
        <div className="flex items-center gap-2">
          <motion.div
            animate={connectionStatus === 'processing' ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: connectionStatus === 'processing' ? Infinity : 0 }}
          >
            <SafeIcon 
              icon={getStatusIcon()} 
              className={`text-lg ${getStatusColor()}`} 
            />
          </motion.div>
          <div>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            {connectionError && (
              <div className="text-xs text-red-400 mt-1" title={connectionError}>
                {connectionError.length > 30 ? `${connectionError.substring(0, 30)}...` : connectionError}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;