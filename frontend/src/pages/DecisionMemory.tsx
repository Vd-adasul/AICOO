import React, { useState, useEffect } from 'react';
import { BrainCircuit, Search, Terminal, HelpCircle, Send, RefreshCw } from 'lucide-react';
import api from '../utils/api';

export default function DecisionMemory() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  
  // Semantic search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchAnswer, setSearchAnswer] = useState<string | null>(null);

  const fetchDecisions = async () => {
    try {
      const res = await api.get('/decisions');
      setDecisions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setSearchAnswer(null);
      
      const res = await api.post('/decisions/search', { question: searchQuery });
      setSearchAnswer(res.data.answer);
    } catch (err: any) {
      console.error(err);
      setSearchAnswer(`Search execution timeout: Failed to access context records. (Details: ${err.message})`);
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoadingList) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="h-8 w-8 text-neon-mint animate-spin" />
        <span className="font-mono text-xs text-gray-400">&gt; Querying organizational decision registers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-neon-gold mb-2">
          <BrainCircuit className="h-4 w-4" />
          <span className="font-mono text-xs uppercase tracking-wider">Organizational Memory</span>
        </div>
        <h2 className="font-display font-bold text-3xl text-gray-100">
          Decision Memory Explorer
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Explore architectural and design decisions saved to the team memory bank. Ask semantic questions to retrieve justification.
        </p>
      </div>

      {/* Semantic Search Panel */}
      <div className="bg-obsidian-surface border border-obsidian-border rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-obsidian-border pb-3">
          <HelpCircle className="h-4.5 w-4.5 text-neon-mint" />
          <h3 className="font-display font-bold text-sm text-gray-200 uppercase tracking-wider">
            Ask Organizational Memory
          </h3>
        </div>

        <form onSubmit={handleSemanticSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Why did we reject Redis? OR What projects have used Kubernetes?"
              className="w-full pl-11 pr-4 py-3 bg-obsidian-deep border border-obsidian-border rounded-lg text-xs text-gray-200 focus:outline-none focus:border-neon-mint transition-colors font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-3 rounded-lg bg-neon-mint hover:bg-neon-mint/90 disabled:opacity-40 text-obsidian-deep font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center shrink-0 shadow-lg shadow-neon-mint/10"
          >
            {isSearching ? 'Mining Memory...' : 'Ask'}
            <Send className="h-3.5 w-3.5 ml-2" />
          </button>
        </form>

        {/* Answer Output Console */}
        {(searchAnswer || isSearching) && (
          <div className="border border-obsidian-border bg-obsidian-deep/50 rounded-xl overflow-hidden font-mono text-xs">
            <div className="p-3 border-b border-obsidian-border flex items-center gap-2 bg-[#04060b]">
              <Terminal className="h-3.5 w-3.5 text-neon-mint" />
              <span className="text-[10px] uppercase font-bold text-gray-400">Memory Output Stream</span>
            </div>
            
            <div className="p-5 leading-relaxed text-gray-300">
              {isSearching ? (
                <div className="flex items-center gap-2 text-gray-500 animate-pulse">
                  <span>&gt; Gathering files and decision nodes for analysis...</span>
                </div>
              ) : (
                <div className="whitespace-pre-line text-sm">
                  {searchAnswer}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Decisions Log Registry Table */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-lg text-gray-200 uppercase tracking-wider">
          Decision Log Registry
        </h3>
        
        <div className="bg-obsidian-surface border border-obsidian-border rounded-xl overflow-hidden shadow-2xl">
          {decisions.length === 0 ? (
            <div className="text-gray-500 text-xs font-mono py-12 text-center">&gt; No decisions archived.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-obsidian-border bg-[#0a0f1b] text-[10px] font-mono uppercase tracking-wider text-gray-400">
                  <th className="p-4 pl-6">Decision Title</th>
                  <th className="p-4">Context Workspace</th>
                  <th className="p-4">Maker / Owner</th>
                  <th className="p-4">Impact</th>
                  <th className="p-4 pr-6">Archived Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-border text-xs">
                {decisions.map((dec) => (
                  <tr key={dec._id} className="hover:bg-obsidian-card/25 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-gray-200">{dec.title}</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-1 max-w-lg leading-relaxed">{dec.reason}</div>
                    </td>
                    <td className="p-4 font-semibold text-gray-300 font-mono">{dec.projectId?.name}</td>
                    <td className="p-4">
                      <div className="font-medium text-gray-200">{dec.ownerId?.name}</div>
                      <div className="text-[10px] text-gray-400">{dec.ownerId?.role}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-mono uppercase font-bold ${
                        dec.impact === 'High' ? 'border-red-500/20 bg-red-500/5 text-red-400' :
                        dec.impact === 'Medium' ? 'border-neon-gold/20 bg-neon-gold/5 text-neon-gold' :
                        'border-neon-mint/20 bg-neon-mint/5 text-neon-mint'
                      }`}>
                        {dec.impact}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-gray-500 font-mono">
                      {new Date(dec.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
