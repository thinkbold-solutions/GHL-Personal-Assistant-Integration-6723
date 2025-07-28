import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiHome, FiSettings, FiClock, FiMessageSquare, FiCpu } = FiIcons;

const Sidebar = () => {
  const navItems = [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    { path: '/history', icon: FiClock, label: 'History' },
    { path: '/settings', icon: FiSettings, label: 'Settings' }
  ];

  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className="w-64 bg-white/10 backdrop-blur-md border-r border-white/20 h-screen"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <SafeIcon icon={FiCpu} className="text-2xl text-blue-400" />
          <h1 className="text-xl font-bold text-white">GHL Assistant</h1>
        </div>
        
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <SafeIcon icon={item.icon} className="text-lg" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </motion.div>
  );
};

export default Sidebar;