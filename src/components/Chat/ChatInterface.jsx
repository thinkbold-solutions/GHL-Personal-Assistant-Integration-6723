import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { useAssistant } from '../../contexts/AssistantContext';
import { useConfig } from '../../contexts/ConfigContext';
import { speechService } from '../../services/speechService';
import { debugService } from '../../services/debugService';
import VoiceInput from './VoiceInput';
import MessageBubble from './MessageBubble';
import CommandSuggestions from './CommandSuggestions';
import * as FiIcons from 'react-icons/fi';

const { FiSend, FiMic, FiMicOff, FiBug } = FiIcons;

const ChatInterface = () => {
  const { messages, isProcessing, processCommand, isListening, setIsListening, connectionStatus } = useAssistant();
  const { config } = useConfig();
  const [inputText, setInputText] = useState('');
  const [transcript, setTranscript] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim() || transcript.trim();
    if (!text || isProcessing) return;

    debugService.log('Sending command', { text });
    setInputText('');
    setTranscript('');
    await processCommand(text);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceStart = () => {
    if (!config.voiceEnabled) return;
    
    setIsListening(true);
    speechService.startListening(
      (finalTranscript, interimTranscript) => {
        setTranscript(finalTranscript || interimTranscript);
      },
      () => {
        setIsListening(false);
        if (transcript.trim()) {
          processCommand(transcript.trim());
          setTranscript('');
        }
      },
      (error) => {
        debugService.error('Speech recognition error:', error);
        setIsListening(false);
      }
    );
  };

  const handleVoiceStop = () => {
    setIsListening(false);
    speechService.stopListening();
  };

  const handleSuggestionClick = (suggestion) => {
    setInputText(suggestion);
    inputRef.current?.focus();
  };

  const toggleDebug = () => {
    if (!showDebug) {
      debugService.enableDebugMode();
    } else {
      debugService.disableDebugMode();
    }
    setShowDebug(!showDebug);
  };

  return (
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
      {/* Debug Mode Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleDebug}
          className={`p-2 rounded-full ${showDebug ? 'bg-yellow-500' : 'bg-gray-600'}`}
          title={showDebug ? 'Disable Debug Mode' : 'Enable Debug Mode'}
        >
          <SafeIcon icon={FiBug} className="text-white text-sm" />
        </motion.button>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-400 mt-20"
            >
              <h3 className="text-xl font-semibold mb-2">Welcome to your GHL Assistant</h3>
              <p className="mb-6">Start by typing a command or using voice input</p>
              
              {connectionStatus === 'disconnected' ? (
                <div className="bg-red-500/20 text-red-300 border border-red-500/30 p-4 rounded-lg mb-6 max-w-md mx-auto">
                  <p className="font-medium mb-2">Connection Issue Detected</p>
                  <p className="text-sm">Please check your GHL token and OpenAI API key in Settings.</p>
                </div>
              ) : null}
              
              <CommandSuggestions onSuggestionClick={handleSuggestionClick} />
            </motion.div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
        </AnimatePresence>
        
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-gray-400 mt-4"
          >
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
            <span>Processing your request...</span>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Visualization */}
      {isListening && <VoiceInput />}

      {/* Input Area */}
      <div className="p-6 border-t border-white/10">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputText || transcript}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? "Listening..." : "Type your command here..."}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={isProcessing || isListening}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={(!inputText.trim() && !transcript.trim()) || isProcessing}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors"
            >
              <SafeIcon icon={FiSend} className="text-lg" />
            </motion.button>
            
            {config.voiceEnabled && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isListening ? handleVoiceStop : handleVoiceStart}
                className={`p-3 rounded-lg transition-colors ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                <SafeIcon icon={isListening ? FiMicOff : FiMic} className="text-lg" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;