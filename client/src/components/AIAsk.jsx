import React, { useState } from 'react';
import { askAI } from '../api/ai';

export default function AIAsk() {
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const token = localStorage.getItem('token'); // if you protect the route

  const onAsk = async (e) => {
    e?.preventDefault();
    if (!prompt.trim()) return;
  
    setLoading(true);
    try {
      const res = await askAI(prompt, token); // remove history if your backend doesn't need it
      setAnswer(res.answer || '');
      setHistory(h => [
        ...h,
        { role: 'user', content: prompt },
        { role: 'assistant', content: res.answer || '' }
      ]);
      setPrompt('');
    } catch (err) {
      console.error(err);
      setAnswer('Sorry, something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300">Neural Nexus</h1>
          </div>
          <div className="hidden md:flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-sm text-purple-200">AI Online</span>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Chat Header */}
          <div className="border-b border-white/10 p-4 bg-gradient-to-r from-purple-900/30 to-indigo-900/30">
            <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
            <p className="text-sm text-purple-200">Ask me anything and I'll help you</p>
          </div>

          {/* Conversation History */}
          <div className="h-96 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-slate-900/50 to-slate-800/30">
            {history.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-900/30 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Start a conversation</h3>
                <p className="text-purple-200">Ask a question to begin interacting with the AI</p>
              </div>
            ) : (
              history.map((item, index) => (
                <div key={index} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs md:max-w-md rounded-2xl p-4 ${item.role === 'user' ? 'bg-purple-600/20 border border-purple-500/30 rounded-br-none' : 'bg-slate-800/50 border border-slate-700/30 rounded-bl-none'}`}>
                    <div className="flex items-center mb-1">
                      <div className={`w-2 h-2 rounded-full mr-2 ${item.role === 'user' ? 'bg-purple-400' : 'bg-indigo-400'}`}></div>
                      <span className="text-xs font-medium text-slate-300">{item.role === 'user' ? 'You' : 'AI Assistant'}</span>
                    </div>

                    {/* Updated to render paragraphs properly */}
                    <div className="text-white text-sm">
                      {item.content.split('\n').map((line, idx) => (
                        <p key={idx} className="mb-2">{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-xs md:max-w-md rounded-2xl p-4 bg-slate-800/50 border border-slate-700/30 rounded-bl-none">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 rounded-full mr-2 bg-indigo-400"></div>
                    <span className="text-xs font-medium text-slate-300">AI Assistant</span>
                  </div>
                  <div className="flex space-x-1.5">
                    <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-white/10 p-4 bg-gradient-to-r from-slate-900/70 to-slate-800/70">
            <form onSubmit={onAsk} className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  className="w-full bg-slate-800/40 border border-slate-700/50 rounded-xl py-3 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="Ask anything…"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={loading}
                />
                <div className="absolute right-3 top-3.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <button
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                type="submit"
                disabled={loading || !prompt.trim()}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Thinking...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    Ask
                  </>
                )}
              </button>
            </form>
            <p className="text-xs text-slate-400 mt-3 text-center">Neural Nexus can make mistakes. Consider checking important information.</p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-slate-800/20 backdrop-blur-sm rounded-xl p-4 border border-white/5">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">Lightning Fast</h3>
            <p className="text-slate-400 text-sm">Get responses in milliseconds with our optimized AI</p>
          </div>
          
          <div className="bg-slate-800/20 backdrop-blur-sm rounded-xl p-4 border border-white/5">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">Always Learning</h3>
            <p className="text-slate-400 text-sm">Our AI continuously improves with each interaction</p>
          </div>
          
          <div className="bg-slate-800/20 backdrop-blur-sm rounded-xl p-4 border border-white/5">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">Secure & Private</h3>
            <p className="text-slate-400 text-sm">Your conversations are encrypted and never stored</p>
          </div>
        </div>
      </div>
    </div>
  );
}
