import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, X, Send, Sparkles, RefreshCw, MessageSquare, Flame, 
  ChevronDown, Minimize2, ExternalLink, HelpCircle, ShieldCheck 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'model',
    text: "👋 **Hey Collector! I'm your Redline AI Pit Crew.**\n\nI can help you:\n- 🔍 Spot rare Hot Wheels ($TH, Treasure Hunts & RLC)\n- 🎁 Design custom blister cards & die-cast bouquets\n- 💳 Explain instant UPI payments & live shipping\n- 🏆 Answer loyalty rewards & referral discount questions\n\nWhat are you hunting for today?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

const SUGGESTED_PROMPTS = [
  'How do I spot a Super Treasure Hunt ($TH)?',
  'How do custom blister cards work?',
  'What are your best gifts / bouquets?',
  'How does UPI payment and WhatsApp verification work?',
  'How do I earn and redeem Loyalty Points?',
];

export const GeminiChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnreadNotification(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send conversation history to backend Gemini endpoint
      const payloadMessages = updatedMessages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      const data = await res.json();

      if (data.success && data.reply) {
        const botMsg: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const fallbackMsg: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          text: data.error || '⚠️ AI Pit Crew is momentarily refueling. Please try sending your question again in a second.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: '⚠️ Network connection hiccup. Please check your internet or retry your question.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <>
      {/* Floating Launcher Trigger Button */}
      {!isOpen && (
        <button
          id="ai-chatbot-launcher-btn"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-40 bg-zinc-950 hover:bg-black text-white p-3 sm:px-4 sm:py-3.5 rounded-full shadow-2xl border-2 border-red-600 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 group cursor-pointer max-w-[calc(100vw-1.5rem)]"
          title="Ask Redline AI Pit Crew"
        >
          <div className="relative">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
          </div>
          <span className="hidden sm:inline font-mono text-xs font-bold uppercase tracking-wider text-zinc-100">
            Ask AI Pit Crew
          </span>
        </button>
      )}

      {/* Interactive Chat Window */}
      {isOpen && (
        <div
          id="ai-chatbot-window"
          className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 sm:w-[410px] max-w-[calc(100vw-1.5rem)] h-[550px] max-h-[85vh] bg-zinc-950 border-2 border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 mx-auto"
        >
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-white font-sans tracking-tight">AI Pit Crew</h4>
                  <span className="text-[10px] font-mono font-bold bg-red-600/30 text-red-400 border border-red-500/40 px-1.5 py-0.2 rounded">
                    GEMINI
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Online & Ready</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                title="Clear conversation history"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                title="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/80">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                    <Flame className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-red-600 text-white rounded-br-xs font-sans font-medium shadow-md'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-xs'
                  }`}
                >
                  {msg.role === 'model' ? (
                    <div className="prose prose-invert prose-xs max-w-none space-y-1.5 [&_strong]:text-red-400 [&_ul]:list-disc [&_ul]:pl-4 [&_a]:text-red-400 [&_a]:underline">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                  <div
                    className={`text-[9px] font-mono mt-1 text-right ${
                      msg.role === 'user' ? 'text-red-200' : 'text-zinc-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0">
                  <Flame className="w-4 h-4 animate-bounce" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-bl-xs px-3.5 py-3 text-xs text-zinc-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse delay-100"></span>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse delay-200"></span>
                  <span className="font-mono text-[11px]">Consulting die-cast database...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-zinc-900/60 border-t border-zinc-800/80 overflow-x-auto flex gap-1.5 scrollbar-none">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="shrink-0 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white text-[11px] font-sans px-2.5 py-1 rounded-full transition cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about cars, bouquets, UPI, tracking..."
              className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 font-sans"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white p-2.5 rounded-xl transition cursor-pointer shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
