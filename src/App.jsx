import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from './contexts/ConfigContext';
import { AssistantProvider } from './contexts/AssistantContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import History from './pages/History';
import './App.css';

function App() {
  return (
    <ConfigProvider>
      <AssistantProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/history" element={<History />} />
            </Routes>
          </Layout>
        </Router>
      </AssistantProvider>
    </ConfigProvider>
  );
}

export default App;