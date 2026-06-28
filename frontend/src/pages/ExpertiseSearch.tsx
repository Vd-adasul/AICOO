import React, { useState } from 'react';
import { Search, BrainCircuit, Cpu, Terminal, ArrowRight, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function ExpertiseSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setIsSearching(true);
      setHasSearched(true);
      const res = await api.post('/expertise/search', { question: query });
      setResults(res.data.recommendations || []);
    } catch (err) {
      console.error('Failed to search expertise', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-neon-cobalt mb-2">
          <Search className="h-4 w-4" />
          <span className="font-mono text-xs uppercase tracking-wider">Agent Discovery</span>
        </div>
        <h2 className="font-display font-bold text-3xl text-gray-100">
          Expertise Discovery Engine
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Input your technical query or role description. The Digital Twin Network will evaluate skills indexes, past reviews, and availability to locate matching experts.
        </p>
      </div>

      {/* Query box */}
      <div className="bg-obsidian-surface border border-obsidian-border rounded-xl p-6 shadow-xl space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Who knows Kubernetes? OR Who should build our PyTorch MLOps framework?"
            className="flex-1 px-4 py-3.5 bg-obsidian-deep border border-obsidian-border rounded-lg text-xs text-gray-200 focus:outline-none focus:border-neon-cobalt transition-colors font-mono"
          />
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="px-6 py-3.5 rounded-lg bg-neon-cobalt hover:bg-neon-cobalt/95 disabled:opacity-40 text-obsidian-deep font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center shrink-0"
          >
            {isSearching ? 'Routing Query...' : 'Discover Experts'}
          </button>
        </form>

        {isSearching && (
          <div className="border border-dashed border-obsidian-border p-8 rounded-lg text-center animate-pulse">
            <Cpu className="h-8 w-8 text-neon-cobalt mx-auto mb-2 animate-spin" />
            <span className="font-mono text-xs text-gray-500">&gt; Querying digital twin skill catalogs...</span>
          </div>
        )}

        {/* Query Output Results */}
        {hasSearched && !isSearching && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest">
              Top Match Candidates ({results.length})
            </h3>
            
            {results.length === 0 ? (
              <div className="p-8 border border-dashed border-obsidian-border rounded-lg bg-obsidian-deep/20 text-center text-gray-500 font-mono text-xs">
                &gt; No candidates found matching your skill requirements. Try widening details.
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((rec, index) => (
                  <div
                    key={rec.reviewerId}
                    className="p-5 bg-obsidian-card/40 border border-obsidian-border rounded-xl flex flex-col md:flex-row md:items-start justify-between gap-6 hover:border-neon-cobalt/40 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded bg-neon-cobalt/10 border border-neon-cobalt/30 text-neon-cobalt text-xs font-mono font-bold flex items-center justify-center">
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-200">{rec.name}</h4>
                          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mt-0.5">Specialist Twin</p>
                        </div>
                      </div>

                      {/* Reasoning list */}
                      <div className="space-y-1.5 pl-1">
                        {rec.reasoning?.map((reason: string, rIdx: number) => (
                          <div key={rIdx} className="text-xs text-gray-400 flex items-start gap-2">
                            <span className="text-neon-cobalt font-mono">&gt;</span>
                            <span className="leading-relaxed">{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Score badge & actions */}
                    <div className="flex md:flex-col items-end gap-3 justify-between md:justify-start shrink-0">
                      <div className="text-right">
                        <span className="text-[9px] font-mono text-gray-500 block uppercase">Confidence fit</span>
                        <span className="text-xl font-display font-bold text-neon-mint">{rec.confidenceScore}%</span>
                      </div>
                      
                      <button
                        onClick={() => navigate(`/twins/${rec.reviewerId}`)}
                        className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-neon-cobalt hover:underline"
                      >
                        Inspect Twin profile
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
