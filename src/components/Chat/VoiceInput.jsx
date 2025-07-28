import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const VoiceInput = () => {
  const [audioData, setAudioData] = useState(new Array(20).fill(0));

  useEffect(() => {
    // Simulate audio visualization
    const interval = setInterval(() => {
      setAudioData(prev => 
        prev.map(() => Math.random() * 100)
      );
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 80 }}
      exit={{ opacity: 0, height: 0 }}
      className="px-6 py-4 border-t border-white/10"
    >
      <div className="flex items-center justify-center gap-1">
        <span className="text-sm text-gray-300 mr-4">Listening...</span>
        {audioData.map((height, index) => (
          <motion.div
            key={index}
            className="w-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full"
            animate={{ height: `${Math.max(height * 0.4, 8)}px` }}
            transition={{ duration: 0.1 }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default VoiceInput;