import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ChatInterface from '../components/Chat/ChatInterface';
import { useConfig } from '../contexts/ConfigContext';
import { useAssistant } from '../contexts/AssistantContext';
import { useNavigate } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSettings, FiAlertCircle, FiActivity, FiClock, FiCheckCircle, FiXCircle, FiTrendingUp } = FiIcons;

const Dashboard = () => {
  const { isConfigured } = useConfig();
  const { testConnection, performanceMetrics, getConversationSummary } = useAssistant();
  const navigate = useNavigate();
  const [showMetrics, setShowMetrics] = useState(false);

  useEffect(() => {
    if (isConfigured) {
      testConnection();
    }
  }, [isConfigured, testConnection]);

  const conversationSummary = getConversationSummary();

  if (!isConfigured) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-full"
      >
        <div className="text-center bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 max-w-md">
          <SafeIcon icon={FiAlertCircle} className="text-4xl text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Setup Required</h2>
          <p className="text-gray-300 mb-6">
            Configure your GHL Private Integration Token and OpenAI API key to start using your business assistant.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/settings')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto"
          >
            <SafeIcon icon={FiSettings} />
            Configure Assistant
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col"
    >
      {/* Performance Metrics Toggle */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Business Assistant Dashboard</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowMetrics(!showMetrics)}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm"
        >
          <SafeIcon icon={FiActivity} />
          {showMetrics ? 'Hide' : 'Show'} Metrics
        </motion.button>
      </div>

      {/* Metrics Panel */}
      {showMetrics && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <SafeIcon icon={FiTrendingUp} className="text-blue-400" />
              <span className="text-sm font-medium text-gray-300">Total Commands</span>
            </div>
            <div className="text-2xl font-bold text-white">{performanceMetrics.totalCommands}</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <SafeIcon icon={FiCheckCircle} className="text-green-400" />
              <span className="text-sm font-medium text-gray-300">Success Rate</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {performanceMetrics.totalCommands > 0 
                ? Math.round((performanceMetrics.successfulCommands / performanceMetrics.totalCommands) * 100)
                : 0}%
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <SafeIcon icon={FiClock} className="text-yellow-400" />
              <span className="text-sm font-medium text-gray-300">Avg Response</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {performanceMetrics.averageResponseTime > 0 
                ? `${(performanceMetrics.averageResponseTime / 1000).toFixed(1)}s`
                : '0s'}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <SafeIcon icon={FiActivity} className="text-purple-400" />
              <span className="text-sm font-medium text-gray-300">Conversations</span>
            </div>
            <div className="text-2xl font-bold text-white">{conversationSummary.totalMessages}</div>
          </div>
        </motion.div>
      )}

      {/* Chat Interface */}
      <div className="flex-1">
        <ChatInterface />
      </div>
    </motion.div>
  );
};

export default Dashboard;