import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useConfig } from './ConfigContext';
import { ghlService } from '../services/ghlService';
import { aiService } from '../services/aiService';
import { debugService } from '../services/debugService';
import { v4 as uuidv4 } from 'uuid';

const AssistantContext = createContext();

export const useAssistant = () => {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
};

export const AssistantProvider = ({ children }) => {
  const { config } = useConfig();
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionError, setConnectionError] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    totalCommands: 0,
    successfulCommands: 0,
    averageResponseTime: 0,
    lastCommandTime: null
  });

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('ghl-assistant-messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch (error) {
        debugService.error('Failed to load saved messages', error);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ghl-assistant-messages', JSON.stringify(messages));
    }
  }, [messages]);

  const addMessage = useCallback((message) => {
    const newMessage = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...message
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const updatePerformanceMetrics = useCallback((startTime, success) => {
    const responseTime = Date.now() - startTime;
    
    setPerformanceMetrics(prev => {
      const newTotal = prev.totalCommands + 1;
      const newSuccessful = prev.successfulCommands + (success ? 1 : 0);
      const newAverageResponseTime = ((prev.averageResponseTime * prev.totalCommands) + responseTime) / newTotal;
      
      return {
        totalCommands: newTotal,
        successfulCommands: newSuccessful,
        averageResponseTime: newAverageResponseTime,
        lastCommandTime: responseTime
      };
    });
  }, []);

  const processCommand = useCallback(async (command) => {
    if (!config.ghlToken || !config.openaiApiKey) {
      addMessage({
        type: 'assistant',
        content: 'Please configure your API keys in Settings first.',
        status: 'error'
      });
      return;
    }

    setIsProcessing(true);
    const startTime = Date.now();

    // Add user message
    addMessage({
      type: 'user',
      content: command
    });

    try {
      setConnectionStatus('processing');
      debugService.log('Processing enhanced command', { command, timestamp: new Date().toISOString() });

      // Process command with enhanced AI
      const aiResponse = await aiService.processCommand(command, config);
      debugService.log('Enhanced AI Response', aiResponse);

      if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
        // Execute GHL tool calls with enhanced error handling
        const results = await Promise.allSettled(
          aiResponse.toolCalls.map(async (toolCall) => {
            try {
              debugService.log('Executing enhanced tool call', {
                name: toolCall.name,
                parameters: toolCall.parameters,
                scopes: toolCall.requiredScopes
              });

              const result = await ghlService.executeAction(toolCall, config);
              
              return {
                ...toolCall,
                result,
                success: true,
                executionTime: Date.now() - startTime
              };
            } catch (error) {
              debugService.error(`Error executing ${toolCall.name}`, error);
              return {
                ...toolCall,
                error: error.message,
                success: false,
                executionTime: Date.now() - startTime
              };
            }
          })
        );

        // Process results
        const processedResults = results.map(result => 
          result.status === 'fulfilled' ? result.value : {
            ...result.reason,
            success: false,
            error: result.reason.error || 'Unknown error'
          }
        );

        // Generate enhanced final response
        const finalResponse = await aiService.generateResponse(command, processedResults, config);

        // Add assistant message with enhanced data
        addMessage({
          type: 'assistant',
          content: finalResponse,
          toolCalls: processedResults,
          status: processedResults.some(r => r.success) ? 'success' : 'error',
          metrics: {
            totalActions: processedResults.length,
            successfulActions: processedResults.filter(r => r.success).length,
            executionTime: Date.now() - startTime
          }
        });

        // Update performance metrics
        updatePerformanceMetrics(startTime, processedResults.some(r => r.success));

      } else {
        // No tool calls, just response
        addMessage({
          type: 'assistant',
          content: aiResponse.content || 'I understand your request, but I need more specific information to help you.',
          status: 'info'
        });
        
        updatePerformanceMetrics(startTime, true);
      }

      setConnectionStatus('connected');
      setConnectionError(null);

    } catch (error) {
      debugService.error('Enhanced command processing error', error);
      
      let errorMessage = 'I encountered an error processing your request.';
      
      if (error.message.includes('authentication') || error.message.includes('token')) {
        errorMessage = 'Authentication failed. Please check your GHL token in Settings.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }

      addMessage({
        type: 'assistant',
        content: errorMessage,
        status: 'error',
        error: error.message
      });

      setConnectionStatus('disconnected');
      setConnectionError(error.message);
      updatePerformanceMetrics(startTime, false);

    } finally {
      setIsProcessing(false);
    }
  }, [config, addMessage, updatePerformanceMetrics]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem('ghl-assistant-messages');
    aiService.clearHistory();
    debugService.log('Messages and conversation history cleared');
  }, []);

  const testConnection = useCallback(async () => {
    if (!config.ghlToken) {
      setConnectionStatus('disconnected');
      setConnectionError('No GHL token provided');
      return false;
    }

    try {
      setConnectionStatus('processing');
      setConnectionError(null);
      
      debugService.log('Testing enhanced connection', {
        tokenPreview: config.ghlToken.substring(0, 8) + '...',
        hasLocationId: Boolean(config.locationId)
      });

      await ghlService.testConnection(config);
      
      setConnectionStatus('connected');
      setConnectionError(null);
      
      debugService.log('Enhanced connection test successful');
      return true;

    } catch (error) {
      debugService.error('Enhanced connection test failed', error);
      setConnectionStatus('disconnected');
      setConnectionError(error.message);
      return false;
    }
  }, [config]);

  const exportConversation = useCallback(() => {
    const exportData = {
      messages,
      performanceMetrics,
      exportDate: new Date().toISOString(),
      config: {
        hasGhlToken: Boolean(config.ghlToken),
        hasOpenaiKey: Boolean(config.openaiApiKey),
        locationId: config.locationId
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghl-assistant-conversation-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages, performanceMetrics, config]);

  const value = {
    // State
    messages,
    isProcessing,
    isListening,
    setIsListening,
    connectionStatus,
    connectionError,
    performanceMetrics,
    
    // Actions
    processCommand,
    clearMessages,
    testConnection,
    addMessage,
    exportConversation,
    
    // Enhanced features
    getConversationSummary: () => ({
      totalMessages: messages.length,
      userMessages: messages.filter(m => m.type === 'user').length,
      assistantMessages: messages.filter(m => m.type === 'assistant').length,
      successfulCommands: messages.filter(m => m.status === 'success').length,
      failedCommands: messages.filter(m => m.status === 'error').length
    })
  };

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
};