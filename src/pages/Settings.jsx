import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import { useConfig } from '../contexts/ConfigContext';
import { useAssistant } from '../contexts/AssistantContext';
import { ghlService } from '../services/ghlService';
import * as FiIcons from 'react-icons/fi';

const { 
  FiSave, FiTestTube, FiTrash2, FiEye, FiEyeOff, FiCheck, FiX, FiInfo, 
  FiShield, FiAlertTriangle, FiExternalLink, FiServer, FiCode, FiGlobe 
} = FiIcons;

const Settings = () => {
  const { config, updateConfig, clearConfig } = useConfig();
  const { testConnection, connectionError } = useAssistant();
  const [formData, setFormData] = useState(config);
  const [showTokens, setShowTokens] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    setFormData(config);
  }, [config]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.ghlToken) {
      errors.ghlToken = 'GHL Private Integration Token is required';
    } else if (!formData.ghlToken.startsWith('pit-')) {
      errors.ghlToken = 'Token should start with "pit-"';
    }
    
    if (!formData.openaiApiKey) {
      errors.openaiApiKey = 'OpenAI API key is required';
    } else if (!formData.openaiApiKey.startsWith('sk-')) {
      errors.openaiApiKey = 'Key should start with "sk-"';
    }
    
    return errors;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleSave = () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setTestResult({
        success: false,
        message: 'Please fix the validation errors'
      });
      return;
    }

    updateConfig(formData);
    setTestResult({
      success: true,
      message: 'Settings saved successfully!'
    });
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleTest = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setTestResult({
        success: false,
        message: 'Please fix the validation errors before testing'
      });
      return;
    }

    setIsTesting(true);
    updateConfig(formData);
    
    try {
      const success = await testConnection();
      setTestResult({
        success,
        message: success 
          ? 'MCP Connection successful! All scopes are accessible.' 
          : connectionError || 'MCP Connection failed!'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message
      });
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestResult(null), 8000);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all settings?')) {
      clearConfig();
      setFormData({
        ghlToken: '',
        locationId: '',
        openaiApiKey: '',
        voiceEnabled: true,
        autoConfirm: false,
        theme: 'dark'
      });
      setValidationErrors({});
    }
  };

  const requiredScopes = [
    'View Contacts',
    'Edit Contacts',
    'View Conversations',
    'Edit Conversations',
    'View Conversation Messages',
    'Edit Conversation Messages',
    'View Opportunities',
    'Edit Opportunities',
    'View Calendars',
    'View Payment Orders',
    'View Custom Fields',
    'View Payment Transactions',
    'View Forms',
    'View Locations',
    'View Calendar Events',
    'Edit Calendar Events',
    'Edit Calendars'
  ];

  const mcpEndpointInfo = ghlService.getMCPEndpointInfo();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto"
    >
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

        {/* Test Result */}
        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg border ${
              testResult.success
                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                : 'bg-red-500/20 text-red-300 border-red-500/30'
            }`}
          >
            <div className="flex items-start gap-2">
              <SafeIcon
                icon={testResult.success ? FiCheck : FiX}
                className="flex-shrink-0 mt-0.5"
              />
              <div className="flex-1">
                <p className="whitespace-pre-line">{testResult.message}</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* API Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">MCP API Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    GoHighLevel Private Integration Token (PIT)
                  </label>
                  <div className="relative">
                    <input
                      type={showTokens ? 'text' : 'password'}
                      value={formData.ghlToken}
                      onChange={(e) => handleInputChange('ghlToken', e.target.value)}
                      placeholder="pit-xxxxxxxxxx"
                      className={`w-full bg-white/10 border ${
                        validationErrors.ghlToken ? 'border-red-400' : 'border-white/20'
                      } rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTokens(!showTokens)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <SafeIcon icon={showTokens ? FiEyeOff : FiEye} />
                    </button>
                  </div>
                  {validationErrors.ghlToken && (
                    <p className="mt-1 text-xs text-red-400">{validationErrors.ghlToken}</p>
                  )}
                  
                  <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-300 flex items-center gap-1">
                      <SafeIcon icon={FiInfo} className="text-blue-400 flex-shrink-0" />
                      <span>Create this in GHL under <strong>Settings → Private Integrations</strong></span>
                    </p>
                    <button
                      onClick={() => window.open('https://app.gohighlevel.com/settings/integrations', '_blank')}
                      className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <SafeIcon icon={FiExternalLink} />
                      Open GHL Private Integrations
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.locationId}
                    onChange={(e) => handleInputChange('locationId', e.target.value)}
                    placeholder="110411007T"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                    <SafeIcon icon={FiInfo} className="text-blue-400" />
                    Required only if your PIT token has access to multiple locations
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    OpenAI API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showTokens ? 'text' : 'password'}
                      value={formData.openaiApiKey}
                      onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                      placeholder="sk-xxxxxxxxxx"
                      className={`w-full bg-white/10 border ${
                        validationErrors.openaiApiKey ? 'border-red-400' : 'border-white/20'
                      } rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTokens(!showTokens)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <SafeIcon icon={showTokens ? FiEyeOff : FiEye} />
                    </button>
                  </div>
                  {validationErrors.openaiApiKey && (
                    <p className="mt-1 text-xs text-red-400">{validationErrors.openaiApiKey}</p>
                  )}
                </div>
              </div>
            </div>

            {/* MCP Endpoint Information */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <SafeIcon icon={FiServer} className="text-green-400" />
                MCP Endpoint Information
              </h2>
              
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <SafeIcon icon={FiGlobe} className="text-blue-400" />
                      <span className="text-sm font-medium text-white">Endpoint URL</span>
                    </div>
                    <div className="bg-gray-800/50 p-2 rounded text-xs text-gray-300 font-mono">
                      {mcpEndpointInfo.url}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <SafeIcon icon={FiCode} className="text-purple-400" />
                      <span className="text-sm font-medium text-white">Protocol</span>
                    </div>
                    <div className="bg-gray-800/50 p-2 rounded text-xs text-gray-300">
                      {mcpEndpointInfo.protocol}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <SafeIcon icon={FiInfo} className="text-yellow-400" />
                      <span className="text-sm font-medium text-white">Available Tools</span>
                    </div>
                    <div className="bg-gray-800/50 p-2 rounded text-xs text-gray-300">
                      {mcpEndpointInfo.totalTools} tools across {mcpEndpointInfo.categories.length} categories
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <SafeIcon icon={FiShield} className="text-red-400" />
                      <span className="text-sm font-medium text-white">Required Headers</span>
                    </div>
                    <div className="bg-gray-800/50 p-2 rounded text-xs text-gray-300">
                      {mcpEndpointInfo.requiredHeaders.join(', ')}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-400">
                    <strong>Note:</strong> This application uses the official GHL MCP (Model Context Protocol) server 
                    with exact tool names matching the documentation. All requests use JSON-RPC 2.0 format.
                  </p>
                </div>
              </div>
            </div>

            {/* Assistant Settings */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Assistant Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Voice Input</label>
                    <p className="text-xs text-gray-400">Enable voice commands and responses</p>
                  </div>
                  <button
                    onClick={() => handleInputChange('voiceEnabled', !formData.voiceEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.voiceEnabled ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.voiceEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Auto Confirm Actions</label>
                    <p className="text-xs text-gray-400">Automatically execute commands without confirmation</p>
                  </div>
                  <button
                    onClick={() => handleInputChange('autoConfirm', !formData.autoConfirm)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.autoConfirm ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.autoConfirm ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Required Scopes */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <SafeIcon icon={FiShield} className="text-blue-400" />
              Required MCP Scopes
            </h2>
            
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <SafeIcon icon={FiAlertTriangle} className="text-yellow-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-yellow-300">Important</span>
                </div>
                <p className="text-xs text-yellow-200">
                  Your GHL Private Integration Token must have ALL these scopes enabled for full MCP functionality.
                </p>
              </div>

              <div className="space-y-2">
                {requiredScopes.map((scope) => (
                  <div key={scope} className="flex items-center gap-2 text-sm">
                    <SafeIcon icon={FiCheck} className="text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{scope}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <h4 className="text-sm font-medium text-white mb-2">MCP Setup Instructions:</h4>
                <div className="space-y-2 text-xs text-gray-400">
                  <div>1. Go to GHL Settings → Private Integrations</div>
                  <div>2. Create new Private Integration Token</div>
                  <div>3. Enable ALL the scopes listed above</div>
                  <div>4. Copy the generated token (starts with 'pit-')</div>
                  <div>5. Paste it in the token field above</div>
                  <div>6. Add Location ID if you have multiple locations</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <h4 className="text-sm font-medium text-white mb-2">Available MCP Tools:</h4>
                <div className="text-xs text-gray-400">
                  <div>• {mcpEndpointInfo.totalTools} total tools available</div>
                  <div>• Categories: {mcpEndpointInfo.categories.join(', ')}</div>
                  <div>• All tool names match official MCP documentation</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t border-white/20 mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
          >
            <SafeIcon icon={FiSave} />
            Save Settings
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleTest}
            disabled={isTesting || !formData.ghlToken}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
          >
            <SafeIcon icon={FiTestTube} />
            {isTesting ? 'Testing MCP...' : 'Test MCP Connection'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
          >
            <SafeIcon icon={FiTrash2} />
            Clear All
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;