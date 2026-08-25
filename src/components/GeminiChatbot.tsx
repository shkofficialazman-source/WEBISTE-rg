import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, X, Send, Sparkles, RefreshCw, MessageSquare, Flame, 
  ChevronDown, Minimize2, ExternalLink, HelpCircle, ShieldCheck,
  Volume2, VolumeX, Copy, Check, Gift, Trophy, Wrench, ArrowRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PitCrewRole, ChatMessage } from '../types';
import { PIT_CREW_MEMBERS, PIT_CREW_QUICK_PROMPTS } from '../data/pitCrewData';

interface GeminiChatbotProps {
  onNavigate?: (sectionId: string) => void;
  initialOpen?: boolean;
}

const STORAGE_KEY = 'redline_pit_crew_chat_messages_v2';
const SOUND_KEY = 'redline_pit_crew_sound_pref';

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({ 
  onNavigate,
  initialOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [activeRole, setActiveRole] = useState<PitCrewRole>('turbo');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'welcome-init',
        role: 'assistant',
        crewMember: 'turbo',
        content: PIT_CREW_MEMBERS.turbo.welcomeMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem(SOUND_KEY) !== 'false';
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist messages in storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom(false);
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, activeRole]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isLoading]);

  const playChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // ignore
    }
  };

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem(SOUND_KEY, String(nextVal));
  };

  const handleRoleChange = (role: PitCrewRole) => {
    if (role === activeRole) return;
    setActiveRole(role);

    const member = PIT_CREW_MEMBERS[role];
    const introMsg: ChatMessage = {
      id: `role-switch-${Date.now()}`,
      role: 'assistant',
      crewMember: role,
      content: member.welcomeMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, introMsg]);
    playChime();
  };

  const handleClearHistory = () => {
    const resetMsg: ChatMessage = {
      id: `reset-${Date.now()}`,
      role: 'assistant',
      crewMember: activeRole,
      content: PIT_CREW_MEMBERS[activeRole].welcomeMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([resetMsg]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const payloadMessages = updatedMessages.slice(-8).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

      const res = await fetch('/api/gemini/pit-crew-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: payloadMessages,
          crewMember: activeRole,
          userQuery: text,
        }),
      });

      const data = await res.json();

      if (data && data.success && data.message) {
        const botMsg: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'assistant',
          crewMember: activeRole,
          content: data.message.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
        playChime();
      } else {
        const fallbackMsg: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'assistant',
          crewMember: activeRole,
          content: data?.error || `🏎️ **Turbo here!** Pit stop check — You can explore our bouquets & custom cards or connect with our human crew on WhatsApp (+91 8431294886) for instant help! 🏁`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'assistant',
        crewMember: activeRole,
        content: `🏎️ **Radio Check:** Network hiccup! Please explore our catalog or reach our WhatsApp garage at **+91 8431294886**!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleActionClick = (target: string) => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(target);
    }
  };

  const currentCrew = PIT_CREW_MEMBERS[activeRole];

  return (
    <>
      {/* Floating Launcher Trigger Button */}
      {!isOpen && (
        <button
          id="ai-chatbot-launcher-btn"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-40 bg-zinc-950 hover:bg-black text-white p-3 sm:px-4 sm:py-3.5 rounded-full shadow-2xl border-2 border-red-600 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 group cursor-pointer max-w-[calc(100vw-1.5rem)]"
          title="Ask AI Pit Crew (Gemini 3.5)"
          aria-label="Open Ask AI Pit Crew"
        >
          <div className="relative">
            <span className="text-xl">🏎️</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-zinc-950 rounded-full animate-pulse" />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1 leading-none">
              <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
              Ask AI Pit Crew
            </span>
            <span className="text-xs font-bold text-white leading-tight">
              Turbo, Sparky & Gearbox
            </span>
          </div>
        </button>
      )}

      {/* Interactive Chat Window */}
      {isOpen && (
        <div
          id="ai-chatbot-window"
          className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 sm:w-[460px] max-w-[calc(100vw-1.5rem)] h-[620px] max-h-[90vh] bg-zinc-950 border-2 border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 mx-auto"
        >
          {/* Top Header with Crew Tabs */}
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border-b border-zinc-800 p-3 sm:p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-lg shadow-md border border-white/20 shrink-0">
                  {currentCrew.avatar.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-white font-sans tracking-tight truncate">
                      Ask AI Pit Crew
                    </h4>
                    <span className="text-[9px] font-mono font-bold bg-red-600/40 text-red-400 border border-red-500/40 px-1.5 py-0.2 rounded shrink-0 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
                      <span>Gemini 3.5</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                    <span className="text-zinc-300 font-semibold truncate">{currentCrew.name}</span>
                    <span className="text-zinc-500 truncate">• {currentCrew.badge}</span>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                  title={soundEnabled ? 'Mute audio' : 'Enable audio'}
                  aria-label="Toggle Sound"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                  title="Clear conversation history"
                  aria-label="Clear chat"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-red-600/80 rounded-lg transition cursor-pointer"
                  title="Close chat"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Crew Selector Tabs */}
            <div className="mt-2.5 grid grid-cols-3 gap-1 p-1 bg-black/60 rounded-xl border border-zinc-800">
              {(Object.keys(PIT_CREW_MEMBERS) as PitCrewRole[]).map((role) => {
                const member = PIT_CREW_MEMBERS[role];
                const isSelected = role === activeRole;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleChange(role)}
                    className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'bg-red-600 text-white font-bold shadow-md'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
                    }`}
                  >
                    <span className="text-xs">{member.avatar.slice(0, 2)}</span>
                    <span className="truncate">{member.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Message Thread */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 bg-zinc-950/90 text-xs sm:text-sm">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const crew = msg.crewMember ? PIT_CREW_MEMBERS[msg.crewMember] : currentCrew;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm shrink-0 mt-0.5 shadow-xs">
                      {crew.avatar.slice(0, 2)}
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed relative ${
                      isUser
                        ? 'bg-red-600 text-white rounded-br-xs font-sans font-medium shadow-md'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-xs'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between gap-2 mb-1 pb-1 border-b border-zinc-800/80 text-[10px] text-zinc-400">
                        <span className="font-bold text-red-400">{crew.name} ({crew.badge})</span>
                        <span className="font-mono text-[9px] text-zinc-500">{msg.timestamp}</span>
                      </div>
                    )}

                    <div className={isUser ? 'text-white' : 'text-zinc-200'}>
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose prose-invert prose-xs max-w-none space-y-1.5 [&_strong]:text-amber-300 [&_ul]:list-disc [&_ul]:pl-4 [&_a]:text-red-400 [&_a]:underline">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {!isUser && (
                      <div className="mt-1.5 pt-1.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500">
                        <span>Redline Garage Pit AI</span>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm shrink-0">
                  {currentCrew.avatar.slice(0, 2)}
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-bl-xs px-3.5 py-2.5 text-xs text-zinc-400 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="font-mono text-[11px] text-zinc-400">
                    {currentCrew.name} is checking telemetry...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Prompts */}
          <div className="px-3 py-1.5 bg-zinc-900/60 border-t border-zinc-800/80 overflow-x-auto flex gap-1.5 scrollbar-none no-scrollbar">
            {PIT_CREW_QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.id}
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setActiveRole(qp.crewRole);
                  handleSendMessage(qp.prompt);
                }}
                className="shrink-0 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-red-500/50 text-zinc-300 hover:text-white text-[11px] font-sans px-2.5 py-1 rounded-full transition cursor-pointer disabled:opacity-50"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Quick Navigation Action Chips */}
          <div className="px-3 py-1 bg-black/40 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400">
            <button
              type="button"
              onClick={() => handleActionClick('catalog')}
              className="hover:text-red-400 flex items-center gap-1 cursor-pointer"
            >
              <span>💐 Catalog</span>
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleActionClick('scanner')}
              className="hover:text-red-400 flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-red-500" />
              <span>AI Scanner</span>
            </button>
            <span>•</span>
            <a
              href="https://wa.me/8431294886?text=Hi%20Redline%20Garage!"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 flex items-center gap-1 text-emerald-400"
            >
              <span>WhatsApp Concierge</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask ${currentCrew.name} about Hot Wheels, gifts, cards...`}
              className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 font-sans"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white p-2 sm:px-3.5 sm:py-2 rounded-xl transition cursor-pointer shrink-0 font-bold text-xs flex items-center gap-1"
              title="Send Message"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
};
