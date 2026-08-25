import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  Trash2, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  ArrowRight,
  Flame,
  MessageSquare,
  Volume2,
  VolumeX,
  Compass,
  ShoppingBag,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, PitCrewRole } from '../types';
import { PIT_CREW_MEMBERS, PIT_CREW_QUICK_PROMPTS } from '../data/pitCrewData';

interface AskAiPitCrewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (sectionId: string) => void;
  initialRole?: PitCrewRole;
}

const STORAGE_KEY = 'redline_pit_crew_chat_history_v1';
const SOUND_KEY = 'redline_pit_crew_sound_pref';

export const AskAiPitCrewModal: React.FC<AskAiPitCrewModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  initialRole = 'turbo',
}) => {
  const [activeRole, setActiveRole] = useState<PitCrewRole>(initialRole);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'init-1',
        role: 'assistant',
        crewMember: 'turbo',
        content: PIT_CREW_MEMBERS.turbo.welcomeMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem(SOUND_KEY) !== 'false';
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initial role when opened with specific parameter
  useEffect(() => {
    if (initialRole && PIT_CREW_MEMBERS[initialRole]) {
      setActiveRole(initialRole);
    }
  }, [initialRole]);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore storage quota
    }
  }, [messages]);

  // Auto scroll to bottom
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
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

  // Play audio chime if enabled
  const playPitChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // ignore web audio limitations
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

    // If no recent message from this crew member, introduce them
    const member = PIT_CREW_MEMBERS[role];
    const introMsg: ChatMessage = {
      id: `role-switch-${Date.now()}`,
      role: 'assistant',
      crewMember: role,
      content: member.welcomeMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, introMsg]);
    playPitChime();
  };

  const handleClearChat = () => {
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

  const handleSendMessage = async (queryToSend?: string) => {
    const rawText = (queryToSend !== undefined ? queryToSend : inputQuery).trim();
    if (!rawText || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: rawText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputQuery('');
    setIsLoading(true);

    try {
      const payloadMessages = nextMessages.slice(-8).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

      const res = await fetch('/api/gemini/pit-crew-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          crewMember: activeRole,
          userQuery: rawText,
        }),
      });

      const data = await res.json();

      if (data && data.success && data.message) {
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          crewMember: activeRole,
          content: data.message.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        playPitChime();
      } else {
        const fallbackMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          crewMember: activeRole,
          content: data.error || `🏎️ **Turbo here!** Pit stop check — I received your message. You can explore our bouquets & custom cards or connect with our human crew on WhatsApp (+91 8431294886) for instant help!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch (err: any) {
      const networkFallback: ChatMessage = {
        id: `net-err-${Date.now()}`,
        role: 'assistant',
        crewMember: activeRole,
        content: `🏎️ **Radio Check:** Looks like a momentary network dip! \n\nFeel free to explore our **Bouquets, Frames, and Custom Cards** or message us directly on WhatsApp at **+91 8431294886**!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, networkFallback]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  };

  const handleActionNavigation = (actionType: string) => {
    onClose();
    if (actionType === 'catalog' || actionType === 'bouquets' || actionType === 'frames' || actionType === 'custom-cards' || actionType === 'scale-models') {
      onNavigate(actionType);
    } else if (actionType === 'scanner') {
      onNavigate('scanner');
    } else if (actionType === 'builder') {
      onNavigate('custom-builder');
    } else if (actionType === 'whatsapp') {
      window.open('https://wa.me/8431294886?text=Hi%20Redline%20Garage!%20I%20have%20a%20question%20from%20Ask%20AI%20Pit%20Crew', '_blank');
    }
  };

  if (!isOpen) return null;

  const currentCrew = PIT_CREW_MEMBERS[activeRole];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* Container Drawer / Modal */}
      <div 
        className={`w-full bg-white flex flex-col shadow-2xl border border-zinc-300 rounded-t-2xl sm:rounded-2xl transition-all duration-300 overflow-hidden ${
          isExpanded 
            ? 'h-full sm:h-[90vh] sm:max-w-4xl' 
            : 'h-[88vh] sm:h-[650px] sm:max-w-xl'
        }`}
      >
        {/* Top Pit Header */}
        <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-red-950 text-white p-3.5 sm:p-4 border-b border-red-800/40 relative">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-xl shadow-md border border-white/20 shrink-0">
                {currentCrew.avatar}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm sm:text-base text-white tracking-wide truncate">
                    Ask AI Pit Crew
                  </h3>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-red-600 text-white font-bold tracking-wider flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                    <span>Gemini 3.5</span>
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 truncate">
                  {currentCrew.name} — {currentCrew.title}
                </p>
              </div>
            </div>

            {/* Control Icons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleSound}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                title={soundEnabled ? 'Mute sound' : 'Enable sound'}
                aria-label="Toggle Sound"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
              </button>

              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                title="Reset conversation"
                aria-label="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:inline-flex p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                title={isExpanded ? 'Collapse' : 'Expand window'}
                aria-label="Toggle full window"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-red-600/80 transition"
                title="Close"
                aria-label="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Pit Crew Persona Switcher Tabs */}
          <div className="mt-3 grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10">
            {(Object.keys(PIT_CREW_MEMBERS) as PitCrewRole[]).map((role) => {
              const member = PIT_CREW_MEMBERS[role];
              const isSelected = role === activeRole;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleChange(role)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-md font-bold'
                      : 'text-zinc-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-sm">{member.avatar.slice(0, 2)}</span>
                  <span className="truncate">{member.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Crew Role Sub-banner */}
        <div className="bg-zinc-100 px-4 py-1.5 border-b border-zinc-200 flex items-center justify-between text-[11px] text-zinc-600">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-zinc-900">{currentCrew.name}'s Specialty:</span>
            <span className="truncate">{currentCrew.specialty}</span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-emerald-700 font-semibold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const crewInfo = msg.crewMember ? PIT_CREW_MEMBERS[msg.crewMember] : currentCrew;

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-sm shadow-xs shrink-0 border border-zinc-300 mt-1">
                    {crewInfo.avatar.slice(0, 2)}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-xs relative group ${
                    isUser
                      ? 'bg-red-600 text-white rounded-br-xs'
                      : 'bg-white text-zinc-800 border border-zinc-200/90 rounded-bl-xs'
                  }`}
                >
                  {/* Speaker Label for Assistant */}
                  {!isUser && (
                    <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-zinc-100 text-[11px]">
                      <span className="font-bold text-red-600 flex items-center gap-1">
                        {crewInfo.name} ({crewInfo.badge})
                      </span>
                      <span className="text-[10px] text-zinc-400">{msg.timestamp}</span>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className={isUser ? 'text-white' : 'text-zinc-800 space-y-2'}>
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-xs sm:prose-sm max-w-none text-zinc-800 font-sans">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Copy Button for Assistant */}
                  {!isUser && (
                    <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="text-[10px]">Redline Garage Pit AI</span>
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="flex items-center gap-1 text-zinc-500 hover:text-zinc-800 transition"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
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

                {/* User Avatar */}
                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0 mt-1">
                    YOU
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Typing Indicator */}
          {isLoading && (
            <div className="flex gap-2.5 justify-start animate-fadeIn">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-sm shadow-xs shrink-0 border border-zinc-300 mt-1">
                {currentCrew.avatar.slice(0, 2)}
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl rounded-bl-xs p-3 shadow-xs flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-zinc-500 font-medium">
                  {currentCrew.name} is inspecting the garage...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggested Prompts Carousel */}
        <div className="px-3 pt-2 pb-1.5 bg-white border-t border-zinc-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-zinc-700 flex items-center gap-1">
              <Flame className="w-3 h-3 text-red-600" />
              Suggested Pit Checks:
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar">
            {PIT_CREW_QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.id}
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setActiveRole(qp.crewRole);
                  handleSendMessage(qp.prompt);
                }}
                className="text-[11px] font-medium bg-zinc-100 hover:bg-red-50 hover:text-red-700 hover:border-red-300 border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-full whitespace-nowrap transition shrink-0 cursor-pointer disabled:opacity-50"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Shortcut Jump Links */}
        <div className="px-3 py-1.5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-[11px] text-zinc-600 overflow-x-auto gap-2">
          <button
            type="button"
            onClick={() => handleActionNavigation('bouquets')}
            className="hover:text-red-600 flex items-center gap-1 font-semibold cursor-pointer shrink-0"
          >
            <ShoppingBag className="w-3 h-3 text-red-600" />
            <span>Bouquets</span>
          </button>
          <span className="text-zinc-300">•</span>
          <button
            type="button"
            onClick={() => handleActionNavigation('builder')}
            className="hover:text-red-600 flex items-center gap-1 font-semibold cursor-pointer shrink-0"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Custom Card Builder</span>
          </button>
          <span className="text-zinc-300">•</span>
          <button
            type="button"
            onClick={() => handleActionNavigation('scanner')}
            className="hover:text-red-600 flex items-center gap-1 font-semibold cursor-pointer shrink-0"
          >
            <Compass className="w-3 h-3 text-blue-600" />
            <span>AI Value Scanner</span>
          </button>
          <span className="text-zinc-300">•</span>
          <button
            type="button"
            onClick={() => handleActionNavigation('whatsapp')}
            className="hover:text-emerald-600 flex items-center gap-1 font-semibold text-emerald-700 cursor-pointer shrink-0"
          >
            <ExternalLink className="w-3 h-3" />
            <span>WhatsApp</span>
          </button>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Ask ${currentCrew.name} about Hot Wheels, bouquets, cards, values...`}
              disabled={isLoading}
              className="w-full bg-zinc-100 focus:bg-white text-zinc-900 placeholder:text-zinc-400 text-xs sm:text-sm px-3.5 py-2.5 pr-10 rounded-xl border border-zinc-300 focus:border-red-600 focus:outline-hidden transition"
            />
          </div>

          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="bg-red-600 hover:bg-red-700 text-white p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
