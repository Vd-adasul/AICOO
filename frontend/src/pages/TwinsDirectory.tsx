import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Cpu, ArrowRight, BrainCircuit, RefreshCw } from 'lucide-react';
import api from '../utils/api';

export default function TwinsDirectory() {
  const navigate = useNavigate();
  const [twins, setTwins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTwins = async () => {
      try {
        const res = await api.get('/twins');
        setTwins(res.data);
      } catch (err) {
        console.error('Failed to fetch twins', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTwins();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="h-8 w-8 text-neon-mint animate-spin" />
        <span className="font-mono text-xs text-gray-400">&gt; Indexing Digital Twin registry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-neon-mint mb-2">
          <Users className="h-4 w-4" />
          <span className="font-mono text-xs uppercase tracking-wider">AICOO Directory</span>
        </div>
        <h2 className="font-display font-bold text-3xl text-gray-100">
          Organizational Digital Twins
        </h2>
        <p className="text-sm text-gray-400 mt-1 max-w-xl">
          Browse personal COO agent twins, check availability metrics, specialized skills, and retrieve knowledge directly.
        </p>
      </div>

      {/* Grid List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {twins.map((twin) => {
          const user = twin.userId;
          if (!user) return null;

          // Color coded availability
          let availColor = 'bg-neon-mint/10 border-neon-mint/30 text-neon-mint';
          if (user.availability === 'Focused') availColor = 'bg-neon-cobalt/10 border-neon-cobalt/30 text-neon-cobalt';
          if (user.availability === 'In Meeting') availColor = 'bg-neon-gold/10 border-neon-gold/30 text-neon-gold';
          if (user.availability === 'Out of Office') availColor = 'bg-red-500/10 border-red-500/30 text-red-400';

          return (
            <div
              key={twin._id}
              className="bg-obsidian-surface border border-obsidian-border rounded-xl p-6 flex flex-col justify-between hover:border-neon-mint/40 hover:-translate-y-1 transition-all duration-300 shadow-xl"
            >
              {/* Header Info */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-obsidian-card border border-obsidian-border flex items-center justify-center font-mono font-bold text-neon-mint text-sm">
                      {user.name[0]}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-100 group-hover:text-neon-mint transition-colors">
                        {user.name}
                      </h3>
                      <p className="text-xs text-gray-400">{user.role}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono font-semibold ${availColor}`}>
                    {user.availability}
                  </span>
                </div>

                {/* Score bar */}
                <div className="space-y-1 bg-obsidian-deep/40 p-3 rounded-lg border border-obsidian-border/50">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-500">EXPERTISE INDEX</span>
                    <span className="text-neon-mint font-bold">{twin.expertiseScore}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-obsidian-card rounded-full overflow-hidden border border-obsidian-border/50">
                    <div 
                      className="h-full bg-gradient-to-r from-neon-mint to-neon-cobalt"
                      style={{ width: `${twin.expertiseScore}%` }}
                    />
                  </div>
                </div>

                {/* Skills tags */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">Specializations</span>
                  <div className="flex flex-wrap gap-1.5">
                    {twin.skills.slice(0, 4).map((skill: string) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded bg-obsidian-card text-gray-300 text-[10px] font-mono border border-obsidian-border"
                      >
                        {skill}
                      </span>
                    ))}
                    {twin.skills.length > 4 && (
                      <span className="px-1.5 py-0.5 rounded bg-obsidian-card text-gray-500 text-[9px] font-mono">
                        +{twin.skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Summary snippet */}
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {twin.summary || 'Summary profile pending initialization.'}
                </p>
              </div>

              {/* View Profile Action */}
              <button
                onClick={() => navigate(`/twins/${twin._id}`)}
                className="mt-6 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-obsidian-card hover:bg-neon-mint/10 border border-obsidian-border hover:border-neon-mint text-xs font-mono font-bold uppercase tracking-wider text-gray-300 hover:text-neon-mint transition-all duration-300"
              >
                Inspect Twin
                <ArrowRight className="h-3 w-3" />
              </button>

            </div>
          );
        })}
      </div>

    </div>
  );
}
