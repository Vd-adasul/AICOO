import React, { useState, useEffect } from 'react';
import { UserCheck, ShieldAlert, Cpu, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../utils/api';

export default function ReviewerRecommend() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjId, setSelectedProjId] = useState('');
  const [description, setDescription] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        setProjects(res.data);
        if (res.data.length > 0) {
          setSelectedProjId(res.data[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProjects();
  }, []);

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !selectedProjId) return;

    try {
      setIsSearching(true);
      setHasSearched(true);
      setSuccessMsg('');
      const res = await api.post('/reviewers/recommend', {
        projectId: selectedProjId,
        architectureDescription: description
      });
      setResults(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleProposeReviewer = async (reviewer: any) => {
    try {
      setSubmittingId(reviewer.reviewerId);
      setSuccessMsg('');
      
      const project = projects.find(p => p._id === selectedProjId);

      // Create approval request on backend
      await api.post('/aicoo/approvals', {
        type: 'Assign Reviewer',
        details: {
          reviewerId: reviewer.reviewerId,
          projectId: selectedProjId,
          projectName: project?.name || 'Workspace',
          architectureDescription: description,
          candidates: [reviewer]
        }
      });

      // Simulate A2A coordination logging
      await api.post('/aicoo/coordinate', {
        receiverId: reviewer.reviewerId,
        task: `Review architecture design: "${description.slice(0, 50)}..."`
      });

      setSuccessMsg(`Workflow Initiated: Proposing assignment for ${reviewer.name}. Approval dispatch logged in AICOO terminal sidebar.`);
      // Clear results list
      setResults([]);
      setDescription('');
    } catch (err: any) {
      console.error(err);
      setSuccessMsg(`Assignment proposal failed. (Details: ${err.message})`);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-purple-400 mb-2">
          <UserCheck className="h-4 w-4" />
          <span className="font-mono text-xs uppercase tracking-wider">Human Loop Workflow</span>
        </div>
        <h2 className="font-display font-bold text-3xl text-gray-100">
          Reviewer Recommendation Engine
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Draft specifications for code architecture reviews. The network will suggest candidate reviewers, requiring human approval before assignment.
        </p>
      </div>

      {/* Main Grid split */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Form Column */}
        <div className="lg:col-span-1 bg-obsidian-surface border border-obsidian-border rounded-xl p-5 shadow-xl space-y-4 h-fit">
          <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest border-b border-obsidian-border pb-3">
            Review Request Specifications
          </h3>

          <form onSubmit={handleRecommend} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                Select Project Workspace
              </label>
              <select
                value={selectedProjId}
                onChange={(e) => setSelectedProjId(e.target.value)}
                className="w-full px-3 py-2 bg-obsidian-deep border border-obsidian-border rounded text-xs font-mono text-gray-200 focus:outline-none focus:border-neon-mint"
              >
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                Architecture Description
              </label>
              <textarea
                placeholder="Describe the architectural design, tools used, and specifications that need review (e.g. Kubernetes ingress controller mapping, PyTorch modeling updates...)"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2.5 bg-obsidian-deep border border-obsidian-border rounded text-xs text-gray-200 focus:outline-none focus:border-neon-mint font-mono leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isSearching || !description.trim() || !selectedProjId}
              className="w-full py-2.5 bg-neon-mint hover:bg-neon-mint/90 disabled:opacity-40 text-obsidian-deep font-bold text-xs uppercase tracking-wider rounded transition-all duration-300 flex items-center justify-center gap-1.5 shadow-lg shadow-neon-mint/10"
            >
              {isSearching ? 'Evaluating Candidates...' : 'Find Reviewers'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest pt-1.5">
            Recommendation Output
          </h3>

          {successMsg && (
            <div className="p-4 rounded-lg bg-neon-mint/10 border border-neon-mint/30 text-xs text-neon-mint font-mono flex items-start gap-2">
              <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {isSearching && (
            <div className="border border-dashed border-obsidian-border p-12 rounded-lg text-center animate-pulse">
              <Cpu className="h-8 w-8 text-neon-mint mx-auto mb-2 animate-spin" />
              <span className="font-mono text-xs text-gray-500">&gt; Coordinating with digital twins to verify availability logs...</span>
            </div>
          )}

          {!isSearching && !hasSearched && (
            <div className="py-20 flex flex-col items-center justify-center border border-dashed border-obsidian-border rounded-xl bg-obsidian-deep/20 text-center">
              <UserCheck className="h-10 w-10 text-gray-500 mb-2 opacity-50" />
              <span className="text-xs font-mono text-gray-500">&gt; Awaiting request specs to evaluate reviewer fits.</span>
            </div>
          )}

          {hasSearched && !isSearching && results.length === 0 && !successMsg && (
            <div className="py-16 flex flex-col items-center justify-center border border-dashed border-obsidian-border rounded-xl bg-obsidian-deep/20 text-center">
              <ShieldAlert className="h-8 w-8 text-neon-gold mb-2 opacity-60" />
              <span className="text-xs font-mono text-gray-500">&gt; No reviewers found matching description. Verify project member skills.</span>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((rec) => (
                <div
                  key={rec.reviewerId}
                  className="p-5 bg-obsidian-surface border border-obsidian-border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-purple-500/40 transition-colors shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-neon-cobalt/15 text-neon-cobalt text-xs font-mono font-bold flex items-center justify-center">
                        {rec.name[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-200">{rec.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-mono text-gray-500 uppercase">Recommended Candidate</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-neon-mint" />
                          <span className="text-[10px] font-display font-bold text-neon-mint">{rec.confidenceScore}% fit index</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pl-1.5">
                      {rec.reasoning?.map((reason: string, idx: number) => (
                        <div key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                          <span className="text-neon-cobalt font-mono">&gt;</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleProposeReviewer(rec)}
                    disabled={submittingId !== null}
                    className="py-2 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shrink-0 shadow-lg shadow-purple-600/10"
                  >
                    {submittingId === rec.reviewerId ? 'Proposing...' : 'Propose Assignment'}
                  </button>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
