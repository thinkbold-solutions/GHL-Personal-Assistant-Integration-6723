import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiCpu, FiCheck, FiX, FiInfo, FiAlertTriangle, FiChevronDown, FiChevronUp, FiCopy, FiExternalLink } = FiIcons;

const MessageBubble = ({ message }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const isUser = message.type === 'user';

  const getStatusIcon = () => {
    switch (message.status) {
      case 'success': return FiCheck;
      case 'error': return FiX;
      case 'info': return FiInfo;
      default: return null;
    }
  };

  const getStatusColor = () => {
    switch (message.status) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'info': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatContent = (content) => {
    // Enhanced formatting for business data
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // Headers
      if (line.startsWith('## ')) {
        return (
          <h3 key={index} className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-white">
            {line.replace('## ', '')}
          </h3>
        );
      }
      
      // Subheaders
      if (line.startsWith('### ')) {
        return (
          <h4 key={index} className="text-md font-medium mb-1 mt-3 first:mt-0 text-gray-200">
            {line.replace('### ', '')}
          </h4>
        );
      }
      
      // Lists
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={index} className="flex items-start gap-2 mb-1">
            <span className="text-blue-400 mt-1">•</span>
            <span>{line.replace(/^[•-] /, '')}</span>
          </div>
        );
      }
      
      // Bold text
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index} className="mb-1">
            {parts.map((part, i) => 
              i % 2 === 1 ? <strong key={i} className="text-white">{part}</strong> : part
            )}
          </p>
        );
      }
      
      // Metrics and data (lines with emojis and numbers) - Fixed regex with 'u' flag
      if (/[📊💰📈📉🎯⚡]/u.test(line)) {
        return (
          <div key={index} className="bg-white/10 rounded-lg p-3 mb-2 border border-white/20">
            <span className="text-sm font-medium">{line}</span>
          </div>
        );
      }
      
      // Regular text
      if (line.trim()) {
        return <p key={index} className="mb-1">{line}</p>;
      }
      
      return null;
    }).filter(Boolean);
  };

  const getToolCallSummary = () => {
    if (!message.toolCalls || message.toolCalls.length === 0) return null;
    
    const successful = message.toolCalls.filter(tc => tc.success).length;
    const failed = message.toolCalls.filter(tc => !tc.success).length;
    
    return { successful, failed, total: message.toolCalls.length };
  };

  const summary = getToolCallSummary();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 mb-6 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-500' : 'bg-purple-500'
      }`}>
        <SafeIcon icon={isUser ? FiUser : FiCpu} className="text-white text-sm" />
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block p-4 rounded-2xl ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-white/10 text-gray-100 border border-white/20'
        }`}>
          {/* Message Content */}
          <div className="prose prose-sm max-w-none">
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="space-y-2">
                {formatContent(message.content)}
              </div>
            )}
          </div>

          {/* Tool Call Summary */}
          {summary && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <SafeIcon icon={FiInfo} className="text-blue-400" />
                <span className="text-sm font-medium">Actions Executed:</span>
                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                  {summary.successful} successful
                </span>
                {summary.failed > 0 && (
                  <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                    {summary.failed} failed
                  </span>
                )}
              </div>
              
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
                <SafeIcon icon={showDetails ? FiChevronUp : FiChevronDown} />
              </button>
              
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-2"
                >
                  {message.toolCalls.map((toolCall, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs bg-white/5 p-2 rounded">
                      <SafeIcon 
                        icon={toolCall.success ? FiCheck : FiX} 
                        className={`flex-shrink-0 mt-0.5 ${toolCall.success ? 'text-green-400' : 'text-red-400'}`} 
                      />
                      <div className="flex-1">
                        <div className="font-medium">{toolCall.name}</div>
                        {toolCall.error && (
                          <div className="text-red-400 mt-1">{toolCall.error}</div>
                        )}
                        {toolCall.result && typeof toolCall.result === 'object' && (
                          <div className="text-gray-400 mt-1">
                            {JSON.stringify(toolCall.result).substring(0, 100)}...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Message Metadata */}
        <div className={`flex items-center gap-3 mt-2 text-xs text-gray-400 ${
          isUser ? 'justify-end' : ''
        }`}>
          <span>{format(new Date(message.timestamp), 'MMM dd, HH:mm')}</span>
          
          {message.status && (
            <div className="flex items-center gap-1">
              <SafeIcon icon={getStatusIcon()} className={getStatusColor()} />
              <span className={getStatusColor()}>{message.status}</span>
            </div>
          )}
          
          {!isUser && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-white transition-colors"
              title="Copy message"
            >
              <SafeIcon icon={FiCopy} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;