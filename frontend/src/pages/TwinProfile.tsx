import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, Cpu, ArrowLeft, BrainCircuit, Heart, 
  Terminal, ShieldCheck, HelpCircle, Send, RefreshCw
} from 'lucide-react';
import api from '../utils/api';

export default function TwinProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [twin, setTwin] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ask Twin chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    const fetchTwin = async () => {
      try {
        const res = await api.get(`/twins/${id}`);
        setTwin(res.data);
        
        // Seed initial greeting message from the twin agent
        setChatMessages([
          {
            sender: 'twin',
            text: `System: Authorized connection established with digital twin. Hi, I am ${res.data.userId?.name}'s Digital Twin. Ask me about my skills, current project tasks, or decisions stored in my organizational memory.`
          }
        ]);
      } catch (err) {
        console.error('Failed to fetch twin profile', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTwin();
  }, [id]);

  const handleAskTwin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setChatInput('');
    setIsAsking(true);

    try {
      // Hit semantic search endpoint
      const res = await api.post('/decisions/search', { question: userMessage });
      setChatMessages(prev => [...prev, { sender: 'twin', text: res.data.answer }]);
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [
        ...prev, 
        { sender: 'twin', text: `Connection timeout: Failed to access organizational nodes. (Details: ${err.message})` }
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  if (isLoading || !twin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="h-8 w-8 text-neon-mint animate-spin" />
        <span className="font-mono text-xs text-gray-400">&gt; Synching Twin context...</span>
      </div>
    );
  }

  const user = twin.userId;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Back link */}
      <button
        onClick={() => navigate('/twins')}
        className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-neon-mint transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        &gt; Back to Twins Directory
      </button>

      {/* Twin Header Block */}
      <div className="p-8 bg-obsidian-surface border border-obsidian-border rounded-2xl relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-neon-cobalt/5 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-neon-cobalt/10 border border-neon-cobalt/40 flex items-center justify-center font-mono font-bold text-neon-cobalt text-2xl shadow-lg shadow-neon-cobalt/10">
              {user.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display font-bold text-2xl text-gray-100">{user.name}</h2>
                <span className="px-2 py-0.5 rounded border border-neon-mint/30 bg-neon-mint/5 text-neon-mint text-[9px] font-mono uppercase font-bold">
                  Twin Node: online
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-0.5">{user.role}</p>
              <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500 font-mono">
                <span>Experience: <span className="text-gray-300">{user.yearsExperience} Years</span></span>
                <span>•</span>
                <span>Contact: <span className="text-gray-300">{user.email}</span></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Active State</span>
            <span className="px-3 py-1 rounded-lg border border-neon-mint/30 bg-neon-mint/5 text-neon-mint text-xs font-mono font-bold">
              {user.availability}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Properties & Metadata */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* AI Bio Summary */}
          <div className="bg-obsidian-surface border border-obsidian-border rounded-xl p-6 space-y-4 shadow-xl">
            <h3 className="font-display font-bold text-sm text-gray-200 uppercase tracking-wider flex items-center gap-2 border-b border-obsidian-border pb-3">
              <Cpu className="h-4 w-4 text-neon-mint" />
              Twin Core Strategy Summary
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed font-sans italic">
              "{twin.summary || 'Summary pending compiler sync.'}"
            </p>
          </div>

          {/* Preferences and Relationships */}
          <div className="bg-obsidian-surface border border-obsidian-border rounded-xl p-6 space-y-4 shadow-xl">
            <h3 className="font-display font-bold text-sm text-gray-200 uppercase tracking-wider flex items-center gap-2 border-b border-obsidian-border pb-3">
              <Heart className="h-4 w-4 text-pink-400" />
              Twin Collaboration Preferences
            </h3>
            
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase">Coding & Tech Preferences</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {twin.preferences.map((p: string) => (
                    <span key={p} className="px-2 py-0.5 rounded bg-obsidian-card text-gray-300 text-[10px] font-mono border border-obsidian-border">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase">Teammate Connections</span>
                <div className="space-y-2 mt-2">
                  {twin.relationships?.slice(0, 3).map((rel: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-1.5 rounded bg-obsidian-deep/50 text-xs border border-obsidian-border/50">
                      <div className="h-5 w-5 rounded bg-neon-cobalt/10 text-neon-cobalt text-[9px] font-bold flex items-center justify-center font-mono">
                        {rel.userId?.name?.[0] || 'T'}
                      </div>
                      <span className="text-gray-300 font-semibold">{rel.userId?.name}</span>
                      <span className="text-[9px] text-gray-500 font-mono ml-auto uppercase">{rel.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Expertise breakdown */}
          <div className="bg-obsidian-surface border border-obsidian-border rounded-xl p-6 space-y-4 shadow-xl">
            <h3 className="font-display font-bold text-sm text-gray-200 uppercase tracking-wider flex items-center gap-2 border-b border-obsidian-border pb-3">
              <BrainCircuit className="h-4 w-4 text-purple-400" />
              Specialization Scores
            </h3>
            
            <div className="space-y-3">
              {twin.expertise.map((exp: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-300">{exp.area}</span>
                    <span className="text-neon-mint font-bold">{exp.score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-obsidian-card rounded-full overflow-hidden border border-obsidian-border">
                    <div 
                      className="h-full bg-gradient-to-r from-neon-mint to-neon-cobalt"
                      style={{ width: `${exp.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 2 Columns: Ask Digital Twin Chat Console */}
        <div className="lg:col-span-2 flex flex-col h-[520px] bg-obsidian-surface border border-obsidian-border rounded-xl shadow-xl overflow-hidden">
          
          {/* Console Header */}
          <div className="p-4 border-b border-obsidian-border flex items-center justify-between bg-obsidian-surface/60">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-neon-mint" />
              <span className="font-mono text-xs font-bold tracking-wider text-gray-200 uppercase">
                TwinOS Agent Chat Console
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-neon-mint animate-pulse-ring" />
              <span className="text-[10px] font-mono text-gray-400 uppercase">SECURE_LINK</span>
            </div>
          </div>

          {/* Messages Output */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs">
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`h-8 w-8 rounded flex items-center justify-center font-bold border shrink-0 ${
                  msg.sender === 'user' 
                    ? 'bg-neon-cobalt/10 border-neon-cobalt/40 text-neon-cobalt' 
                    : 'bg-neon-mint/10 border-neon-mint/40 text-neon-mint'
                }`}>
                  {msg.sender === 'user' ? 'OP' : 'AI'}
                </div>
                
                <div className={`p-3 rounded-lg border leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-obsidian-card/60 border-neon-cobalt/20 text-gray-200'
                    : 'bg-obsidian-deep/60 border-neon-mint/20 text-gray-300'
                }`}>
                  {msg.text.split('\n').map((para: string, pIdx: number) => (
                    <p key={pIdx} className={pIdx > 0 ? 'mt-2' : ''}>{para}</p>
                  ))}
                </div>
              </div>
            ))}

            {isAsking && (
              <div className="flex gap-3 max-w-[85%] animate-pulse">
                <div className="h-8 w-8 rounded flex items-center justify-center bg-neon-mint/10 border border-neon-mint/40 text-neon-mint font-bold shrink-0">
                  AI
                </div>
                <div className="p-3 rounded-lg border border-obsidian-border bg-obsidian-deep/30 text-gray-500">
                  Mining organizational decisions and relationships...
                </div>
              </div>
            )}
          </div>

          {/* Form Input */}
          <form 
            onSubmit={handleAskTwin} 
            className="p-4 border-t border-obsidian-border bg-obsidian-deep/50 flex gap-3"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask this Twin e.g. Why did we reject Redis? OR What are your skills?"
              className="flex-1 px-4 py-2.5 bg-obsidian-surface border border-obsidian-border rounded-lg text-xs text-gray-200 focus:outline-none focus:border-neon-mint transition-colors font-mono"
            />
            <button
              type="submit"
              disabled={isAsking || !chatInput.trim()}
              className="px-4 py-2.5 rounded-lg bg-neon-mint hover:bg-neon-mint/90 disabled:opacity-40 text-obsidian-deep font-bold transition-all duration-300 flex items-center justify-center shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
