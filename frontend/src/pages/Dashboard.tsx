import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, FolderKanban, BrainCircuit, ShieldAlert, Cpu, ArrowRight,
  TrendingUp, Check, X, CheckCircle, RefreshCw
} from 'lucide-react';
import api from '../utils/api';
import NetworkGraph from '../components/NetworkGraph';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [approvals, setApprovals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [graphUserTwinId, setGraphUserTwinId] = useState<string>('');

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const userStr = localStorage.getItem('twinos_user');
      if (!userStr) {
        navigate('/login');
        return;
      }
      const user = JSON.parse(userStr);
      setCurrentUser(user);

      // 1. Fetch Stats & Metrics
      const [statsRes, metricsRes, approvalsRes, meRes] = await Promise.all([
        api.get('/dashboard/overview'),
        api.get('/dashboard/metrics'),
        api.get('/aicoo/approvals'),
        api.get('/auth/me')
      ]);

      setStats(statsRes.data);
      setMetrics(metricsRes.data);
      setApprovals(approvalsRes.data.filter((a: any) => a.status === 'Pending').slice(0, 3)); // show top 3 pending

      // 2. Load Graph for Current User
      if (meRes.data.twin) {
        setGraphUserTwinId(meRes.data.twin._id);
        const graphRes = await api.get(`/twins/${meRes.data.twin._id}/graph`);
        setGraphData(graphRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  const handleProcessApproval = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await api.put(`/aicoo/approvals/${id}`, { status });
      // Refresh dashboard
      fetchDashboardData();
    } catch (err) {
      console.error('Approval processing failed', err);
    }
  };

  if (isLoading || !stats || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="h-8 w-8 text-neon-mint animate-spin" />
        <span className="font-mono text-xs text-gray-400">&gt; Loading TwinOS metrics data...</span>
      </div>
    );
  }

  const statCards = [
    { title: 'Digital Twins', count: stats.users, icon: Users, color: 'text-neon-mint border-neon-mint/20 hover:border-neon-mint/40 shadow-neon-mint/5' },
    { title: 'Active Workspaces', count: stats.projects, icon: FolderKanban, color: 'text-neon-cobalt border-neon-cobalt/20 hover:border-neon-cobalt/40 shadow-neon-cobalt/5' },
    { title: 'Decision Memory', count: stats.decisions, icon: BrainCircuit, color: 'text-neon-gold border-neon-gold/20 hover:border-neon-gold/40 shadow-neon-gold/5' },
    { title: 'Pending Approvals', count: stats.pendingApprovals, icon: ShieldAlert, color: 'text-purple-400 border-purple-400/20 hover:border-purple-400/40 shadow-purple-400/5' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-gradient-to-r from-obsidian-surface to-obsidian-deep border border-obsidian-border rounded-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-neon-mint/5 to-transparent pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Cpu className="h-4 w-4 text-neon-mint" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-neon-mint">Digital Twin Network Online</span>
          </div>
          <h2 className="font-display font-bold text-3xl text-gray-100">
            Welcome back, Operator {currentUser?.name}
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xl">
            You are currently administering the digital twin network. 10 personal COO agents are active, accumulating context and negotiating tasks.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex gap-3">
          <button
            onClick={() => navigate('/expertise')}
            className="px-4 py-2 bg-obsidian-card hover:bg-obsidian-card/80 border border-obsidian-border rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-gray-300 transition-colors"
          >
            Expertise Query
          </button>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-neon-mint hover:bg-neon-mint/90 text-obsidian-deep font-bold rounded-lg text-xs uppercase tracking-wider transition-colors shadow-lg shadow-neon-mint/10"
          >
            Enter Workspace
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className={`p-6 bg-obsidian-surface border rounded-xl flex items-center justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg ${stat.color}`}
            >
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                  {stat.title}
                </span>
                <h3 className="text-3xl font-display font-bold text-gray-100 mt-1">
                  {stat.count}
                </h3>
              </div>
              <div className="p-3 bg-obsidian-card rounded-lg border border-obsidian-border">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Layout Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Network Visualizer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-neon-mint" />
              My Digital Twin Network Graph
            </h3>
            <span 
              onClick={() => navigate(`/twins/${graphUserTwinId}`)}
              className="text-xs text-neon-cobalt hover:underline cursor-pointer font-mono"
            >
              Inspect Profile &gt;
            </span>
          </div>

          <NetworkGraph 
            nodes={graphData.nodes} 
            links={graphData.links} 
            onNodeClick={(node) => {
              console.log('Selected Node:', node);
              if (node.type === 'person') {
                navigate(`/twins/${node.id}`);
              } else if (node.type === 'project') {
                navigate(`/projects`);
              } else if (node.type === 'decision') {
                navigate(`/decisions`);
              }
            }}
          />
        </div>

        {/* Right Column: Pending Approvals (Human-in-the-loop) */}
        <div className="space-y-6">
          <h3 className="font-display font-bold text-lg text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 text-neon-gold" />
            Human Approval Layer
          </h3>

          <div className="bg-obsidian-surface border border-obsidian-border rounded-xl p-5 space-y-4 shadow-xl">
            <div className="border-b border-obsidian-border pb-3">
              <h4 className="text-xs font-mono text-gray-400 uppercase tracking-widest">
                Pending Actions ({approvals.length})
              </h4>
              <p className="text-[10px] text-gray-500 mt-0.5">
                No twin recommendations execute without human approval signatures.
              </p>
            </div>

            {approvals.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center border border-dashed border-obsidian-border rounded-lg bg-obsidian-deep/20 text-center">
                <CheckCircle className="h-8 w-8 text-neon-mint mb-2 opacity-60" />
                <span className="text-xs font-mono text-gray-500">&gt; Approval queues cleared.</span>
              </div>
            ) : (
              <div className="space-y-3.5">
                {approvals.map((req) => (
                  <div key={req._id} className="p-4 rounded-lg border border-obsidian-border bg-obsidian-card/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-neon-gold/20 bg-neon-gold/5 text-neon-gold font-bold">
                        {req.type}
                      </span>
                      <span className="text-[9px] text-gray-500 font-mono">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="text-gray-300 font-medium">
                        {req.type === 'Create Decision' ? `Store decision "${req.details.title}"` : `Assign reviewer for "${req.details.projectName}"`}
                      </p>
                      <p className="text-[10px] text-gray-400 italic font-sans leading-normal">
                        {req.type === 'Create Decision' ? req.details.reason : req.details.architectureDescription}
                      </p>
                      {req.type === 'Assign Reviewer' && (
                        <div className="mt-1.5 p-1.5 rounded bg-obsidian-deep border border-obsidian-border text-[9px]">
                          <span className="text-neon-mint font-mono font-bold">RECOMENDED:</span>{' '}
                          {req.details.candidates?.[0]?.name} ({req.details.candidates?.[0]?.confidenceScore}% fit)
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-obsidian-border/50 text-[10px]">
                      <button
                        onClick={() => handleProcessApproval(req._id, 'Approved')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-neon-mint/10 hover:bg-neon-mint text-neon-mint hover:text-obsidian-deep border border-neon-mint/30 hover:border-transparent font-bold transition-all duration-300"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleProcessApproval(req._id, 'Rejected')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-red-950/20 hover:bg-red-900 text-red-400 hover:text-white border border-red-950 hover:border-transparent font-bold transition-all duration-300"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Metrics Row: Recent Decisions & Active Projects */}
      <div className="grid md:grid-cols-2 gap-8 pt-4">
        
        {/* Recent Decisions Author Memory */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-lg text-gray-200 uppercase tracking-wider">
            Recent Decisions Added
          </h3>
          <div className="bg-obsidian-surface border border-obsidian-border rounded-xl p-5 shadow-xl space-y-4">
            {metrics.recentDecisions.length === 0 ? (
              <div className="text-gray-500 text-xs font-mono py-6 text-center">&gt; No decisions recorded.</div>
            ) : (
              <div className="divide-y divide-obsidian-border">
                {metrics.recentDecisions.map((dec: any) => (
                  <div key={dec._id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between group">
                    <div className="min-w-0 pr-4">
                      <h4 className="text-sm font-semibold text-gray-200 group-hover:text-neon-mint transition-colors">
                        {dec.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 truncate mt-1">
                        Reason: {dec.reason}
                      </p>
                      <div className="flex gap-2.5 mt-2 text-[9px] font-mono text-gray-500">
                        <span>Workspace: <span className="text-gray-300">{dec.projectId?.name || 'Global'}</span></span>
                        <span>•</span>
                        <span>Author: <span className="text-gray-300">{dec.ownerId?.name}</span></span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-mono uppercase font-bold shrink-0 ${
                      dec.impact === 'High' ? 'border-red-500/20 bg-red-500/5 text-red-400' :
                      dec.impact === 'Medium' ? 'border-neon-gold/20 bg-neon-gold/5 text-neon-gold' :
                      'border-neon-mint/20 bg-neon-mint/5 text-neon-mint'
                    }`}>
                      {dec.impact}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Most Active Projects */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-lg text-gray-200 uppercase tracking-wider">
            Most Active Workspaces
          </h3>
          <div className="bg-obsidian-surface border border-obsidian-border rounded-xl p-5 shadow-xl space-y-4">
            {metrics.activeProjects.length === 0 ? (
              <div className="text-gray-500 text-xs font-mono py-6 text-center">&gt; No active projects.</div>
            ) : (
              <div className="space-y-4">
                {metrics.activeProjects.map((p: any) => (
                  <div key={p._id} className="p-4 rounded-lg border border-obsidian-border bg-obsidian-card/30 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-200">{p.name}</h4>
                      <p className="text-[11px] text-gray-400 mt-1 max-w-sm line-clamp-1">{p.description}</p>
                      <div className="flex items-center gap-1.5 mt-2.5">
                        <div className="flex -space-x-2">
                          {p.members.slice(0, 3).map((m: any, idx: number) => (
                            <div key={idx} className="h-5.5 w-5.5 rounded-full border border-obsidian-surface bg-neon-cobalt/15 text-neon-cobalt text-[9px] font-bold flex items-center justify-center font-mono">
                              {m.name[0]}
                            </div>
                          ))}
                        </div>
                        {p.members.length > 3 && (
                          <span className="text-[9px] font-mono text-gray-500">
                            + {p.members.length - 3} others
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="px-2 py-1 rounded bg-obsidian-card text-neon-cobalt text-xs font-mono border border-obsidian-border">
                      {p.members.length} Members
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
