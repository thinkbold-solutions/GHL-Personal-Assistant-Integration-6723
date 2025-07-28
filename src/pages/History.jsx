import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import { useAssistant } from '../contexts/AssistantContext';
import * as FiIcons from 'react-icons/fi';

const { FiClock, FiUser, FiCpu, FiTrash2, FiCheck, FiX, FiInfo } = FiIcons;

const History = () => {
  const { messages, clearMessages } = useAssistant();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return FiCheck;
      case 'error':
        return FiX;
      case 'info':
        return FiInfo;
      default:
        return FiClock;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Conversation History</h1>
          {messages.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearMessages}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              <SafeIcon icon={FiTrash2} />
              Clear History
            </motion.button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <SafeIcon icon={FiClock} className="text-4xl mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Conversation History</h3>
              <p>Start chatting with your assistant to see history here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 border border-white/10 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' ? 'bg-blue-500' : 'bg-purple-500'
                    }`}>
                      <SafeIcon 
                        icon={message.type === 'user' ? FiUser : FiCpu} 
                        className="text-white text-sm" 
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-white capitalize">
                          {message.type === 'user' ? 'You' : 'Assistant'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {format(new Date(message.timestamp), 'MMM dd, yyyy HH:mm')}
                        </span>
                        {message.status && (
                          <div className="flex items-center gap-1">
                            <SafeIcon 
                              icon={getStatusIcon(message.status)} 
                              className={`text-xs ${getStatusColor(message.status)}`} 
                            />
                            <span className={`text-xs ${getStatusColor(message.status)}`}>
                              {message.status}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-gray-300 whitespace-pre-wrap">{message.content}</p>
                      
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="text-xs font-medium mb-2 text-gray-400">Actions Performed:</div>
                          <div className="space-y-1">
                            {message.toolCalls.map((toolCall, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs">
                                <SafeIcon 
                                  icon={toolCall.success ? FiCheck : FiX} 
                                  className={toolCall.success ? 'text-green-400' : 'text-red-400'} 
                                />
                                <span className="text-gray-400">{toolCall.name}</span>
                                {toolCall.error && (
                                  <span className="text-red-400">- {toolCall.error}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default History;