import React, { useState } from 'react';
import Chatbot from '../components/Chatbot';
import { ChatMessage } from '@/types/chat';

/**
 * ChatbotPage - Example Page Demonstrating the Chatbot Component
 * 
 * This page shows:
 * 1. How to use the Chatbot component
 * 2. How to track messages
 * 3. How to debug issues
 * 4. Production-ready setup
 * 
 * Copy this to your routes to add a dedicated chat page.
 */
export const ChatbotPage: React.FC = () => {
  // ─── State for tracking messages (optional) ───────────────────────────────

  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [messageCount, setMessageCount] = useState(0);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleMessageSent = (message: ChatMessage) => {
    // Track message
    setAllMessages((prev) => [...prev, message]);
    setMessageCount((prev) => prev + 1);

    // Log (useful for debugging)
    console.log(
      `✅ Message #${messageCount + 1} from ${message.role}: ${message.text.substring(0, 50)}...`
    );

    // Optional: Send to analytics
    // analytics.track('chat_message_sent', {
    //   role: message.role,
    //   length: message.text.length,
    //   timestamp: message.timestamp,
    // });
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-4">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🤖 AI Learning Assistant
          </h1>
          <p className="text-gray-600 mt-2">
            Ask for help with algorithms, data structures, and coding problems
          </p>
        </div>

        {/* Main Chatbot Container */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Chatbot Component */}
          <div style={{ height: '600px' }}>
            <Chatbot
              title="DSA Learning Bot"
              placeholder="Ask me anything about algorithms and data structures..."
              onMessageSent={handleMessageSent}
              debug={true}  // Enable debug logging - set to false for production
            />
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Messages Counter */}
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <p className="text-sm text-gray-600">Total Messages</p>
            <p className="text-2xl font-bold text-blue-600">{messageCount}</p>
          </div>

          {/* API Status */}
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <p className="text-sm text-gray-600">API Endpoint</p>
            <p className="text-sm font-mono text-gray-900 break-all">
              {import.meta.env.VITE_API_URL || 'http://localhost:3005/api'}/chat
            </p>
          </div>

          {/* Debug Info */}
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <p className="text-sm text-gray-600">Environment</p>
            <p className="text-sm font-mono text-gray-900">
              {import.meta.env.MODE === 'development' ? '🟢 Development' : '🔵 Production'}
            </p>
          </div>
        </div>

        {/* Debug Console */}
        {import.meta.env.MODE === 'development' && (
          <div className="mt-6 bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs border border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold">📋 Debug Console</p>
              <p className="text-gray-500">Messages: {allMessages.length}</p>
            </div>

            {allMessages.length === 0 ? (
              <p className="text-gray-500">No messages yet - start chatting to see debug info</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allMessages.slice(-5).map((msg, idx) => (
                  <div key={idx} className="text-xs">
                    <span className={msg.role === 'user' ? 'text-blue-400' : 'text-green-400'}>
                      [{msg.role.toUpperCase()}]
                    </span>
                    {' '}
                    <span className="text-gray-400">{msg.timestamp.toLocaleTimeString()}</span>
                    {' '}
                    <span className="text-gray-300">{msg.text.substring(0, 60)}{msg.text.length > 60 ? '...' : ''}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-gray-500 mt-2 text-xs">Showing last 5 messages (scroll in debug console to see more)</p>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Tips:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Press Enter to send a message (or click the Send button)</li>
            <li>✓ Open DevTools (F12) → Console to see detailed debug logs</li>
            <li>✓ Make sure backend is running: <code className="bg-white px-2 py-1 rounded">npm run dev</code></li>
            <li>✓ Check that <code className="bg-white px-2 py-1 rounded">VITE_API_URL</code> is set in .env</li>
          </ul>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            📚{' '}
            <a href="#" className="text-blue-600 hover:underline">
              View Documentation
            </a>
            {' '} | {' '}
            <a href="#" className="text-blue-600 hover:underline">
              Debugging Guide
            </a>
            {' '} | {' '}
            <a href="#" className="text-blue-600 hover:underline">
              Report Issue
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;

