import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUsers, FiMessageSquare, FiTrendingUp, FiCalendar, FiCreditCard, FiFileText, FiSettings, FiTag } = FiIcons;

const CommandSuggestions = ({ onSuggestionClick }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = {
    all: {
      icon: FiSettings,
      label: 'All Commands',
      color: 'text-blue-400'
    },
    contacts: {
      icon: FiUsers,
      label: 'Contacts',
      color: 'text-green-400'
    },
    conversations: {
      icon: FiMessageSquare,
      label: 'Messaging',
      color: 'text-purple-400'
    },
    opportunities: {
      icon: FiTrendingUp,
      label: 'Sales',
      color: 'text-orange-400'
    },
    calendar: {
      icon: FiCalendar,
      label: 'Calendar',
      color: 'text-red-400'
    },
    payments: {
      icon: FiCreditCard,
      label: 'Payments',
      color: 'text-yellow-400'
    },
    business: {
      icon: FiFileText,
      label: 'Business',
      color: 'text-indigo-400'
    }
  };

  const suggestions = {
    contacts: [
      // Advanced Contact Management
      "Find all VIP contacts added this week",
      "Search for contacts with email domain @gmail.com",
      "Show me contacts without phone numbers",
      "Get all contacts tagged as 'Hot Lead' with their last activity",
      "Find contacts who haven't been contacted in 30 days",
      "Create a new contact for Sarah Johnson with email sarah@example.com",
      "Update contact information and add 'Customer' tag",
      "Add a note to contact about meeting discussion",
      "Show contacts with highest engagement scores",
      "Find contacts in specific geographic area",
      "Get contacts with upcoming birthdays this month",
      "Show contacts by lead source and conversion rate"
    ],
    conversations: [
      // Advanced Messaging & Communication
      "Show all unread messages from the last 24 hours",
      "Get conversation history with high-value prospects",
      "Send follow-up SMS to all leads from yesterday",
      "Find conversations with negative sentiment",
      "Show message response rates by channel",
      "Get all conversations requiring immediate attention",
      "Send personalized email to recent form submissions",
      "Find conversations with missed opportunities",
      "Show WhatsApp conversations with active engagement",
      "Get email open rates for recent campaigns",
      "Find conversations that need manager escalation",
      "Show automated message performance metrics"
    ],
    opportunities: [
      // Advanced Sales & Pipeline Management
      "Show opportunities in proposal stage over $10,000",
      "Get pipeline velocity for this quarter",
      "Find stalled opportunities that need attention",
      "Show won opportunities and their closing factors",
      "Get opportunities by sales rep performance",
      "Find opportunities with upcoming decision dates",
      "Show pipeline forecast for next 30 days",
      "Get average deal size by lead source",
      "Find opportunities missing key information",
      "Show conversion rates by pipeline stage",
      "Get opportunities requiring immediate follow-up",
      "Show lost opportunities and reasons why"
    ],
    calendar: [
      // Advanced Calendar & Scheduling
      "Show today's appointments with contact details",
      "Find available time slots for this week",
      "Get calendar utilization rates",
      "Show upcoming appointments with high-value clients",
      "Find appointments that might need rescheduling",
      "Get no-show rates by appointment type",
      "Show calendar conflicts and double bookings",
      "Find optimal times for client meetings",
      "Get appointment conversion rates",
      "Show calendar performance by team member",
      "Find appointments without proper preparation",
      "Get booking trends by time of day"
    ],
    payments: [
      // Advanced Payment & Financial Management
      "Show recent transactions over $1,000",
      "Get payment collection rates by client",
      "Find overdue invoices requiring follow-up",
      "Show revenue trends for the last 90 days",
      "Get payment method preferences by client",
      "Find failed payments that need attention",
      "Show average payment time by client type",
      "Get subscription renewal rates",
      "Find clients with payment issues",
      "Show profit margins by service type",
      "Get cash flow projections",
      "Find opportunities to increase payment frequency"
    ],
    business: [
      // Advanced Business Intelligence & Analytics
      "Show business performance dashboard",
      "Get key performance indicators for this month",
      "Find bottlenecks in our sales process",
      "Show team productivity metrics",
      "Get client satisfaction scores",
      "Find areas for business improvement",
      "Show competitive analysis data",
      "Get market penetration metrics",
      "Find seasonal business trends",
      "Show customer lifetime value analysis",
      "Get business growth opportunities",
      "Find operational efficiency improvements"
    ]
  };

  const filteredSuggestions = selectedCategory === 'all' 
    ? Object.values(suggestions).flat()
    : suggestions[selectedCategory] || [];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {Object.entries(categories).map(([key, category]) => (
          <motion.button
            key={key}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
              selectedCategory === key
                ? 'bg-white/20 border-white/40 text-white'
                : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
            }`}
          >
            <SafeIcon icon={category.icon} className={`text-sm ${category.color}`} />
            <span className="text-sm font-medium">{category.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Suggestions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSuggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSuggestionClick(suggestion)}
            className="command-suggestion text-left text-sm p-4 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-start gap-3">
              <SafeIcon 
                icon={categories[selectedCategory]?.icon || FiSettings} 
                className={`text-lg flex-shrink-0 mt-0.5 ${categories[selectedCategory]?.color || 'text-blue-400'}`} 
              />
              <span className="leading-relaxed">{suggestion}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Help Text */}
      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm">
          💡 <strong>Pro Tip:</strong> You can also type natural language commands like "Show me my top performing leads" or "What's my revenue this month?"
        </p>
      </div>
    </div>
  );
};

export default CommandSuggestions;