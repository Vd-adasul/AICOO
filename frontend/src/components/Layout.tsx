import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FolderKanban, BrainCircuit, Search, 
  UserCheck, FileAudio, ShieldAlert, LogOut, Terminal, Cpu, RefreshCw
} from 'lucide-react';
import api from '../utils/api';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [aicooLogs, setAicooLogs] = useState<any[]>([]);
  const [isPollingLogs, setIsPollingLogs] = useState(false);

  // Fetch current user on mount
  useEffect(() => {
    const userStr = localStorage.getItem('twinos_user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch AICOO logs
  const fetchLogs = async () => {
    try {
      setIsPollingLogs(true);
      const res = await api.get('/aicoo/logs');
      setAicooLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch AICOO logs', err);
    } finally {
      setIsPollingLogs(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 15000); // poll every 15s
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('twinos_token');
    localStorage.removeItem('twinos_user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Digital Twins', path: '/twins', icon: Users },
    { name: 'Workspaces', path: '/projects', icon: FolderKanban },
    { name: 'Decision Memory', path: '/decisions', icon: BrainCircuit },
    { name: 'Expertise Search', path: '/expertise', icon: Search },
    { name: 'Reviewer Recommender', path: '/reviewers', icon: UserCheck },
    { name: 'Meeting Intel', path: '/meetings', icon: FileAudio },
    { name: 'System Seeder', path: '/seed', icon: ShieldAlert },
  ];

  if (!currentUser) return null;

  return (
    <div className="flex h-screen bg-obsidian-deep overflow-hidden font-sans">
      
      {/* Sidebar Nav */}
      <aside className="w-64 bg-obsidian-surface border-r border-obsidian-border flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Header */}
          <div className="p-6 border-b border-obsidian-border flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-neon-mint to-neon-cobalt flex items-center justify-center shadow-lg shadow-neon-mint/20">
              <Cpu className="h-5 w-5 text-obsidian-deep" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-tight tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-300">
                TwinOS
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-widest text-neon-mint">
                AICOO Pulse Network
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-300 font-medium group ${
                    isActive 
                      ? 'bg-gradient-to-r from-neon-mint/10 to-transparent text-neon-mint border-l-2 border-neon-mint pl-3' 
                      : 'text-gray-400 hover:text-gray-200 hover:bg-obsidian-card/40'
                  }`}
                >
                  <Icon className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-neon-mint' : 'text-gray-400 group-hover:text-gray-300'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-obsidian-border space-y-3">
          <div className="flex items-center gap-3 p-2 bg-obsidian-card/30 rounded-lg border border-obsidian-border/50">
            <div className="h-8 w-8 rounded-full bg-neon-mint/10 border border-neon-mint/30 flex items-center justify-center font-mono text-neon-mint text-xs font-bold">
              {currentUser.name[0]}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-gray-200 truncate">{currentUser.name}</h4>
              <p className="text-[10px] text-gray-400 truncate">{currentUser.role}</p>
            </div>
            <div className="ml-auto flex items-center h-2 w-2 rounded-full bg-neon-mint animate-pulse-ring" title="Twin Online" />
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-obsidian-card hover:bg-red-950/20 text-gray-400 hover:text-red-400 border border-obsidian-border hover:border-red-900/30 text-xs transition-all duration-300 font-semibold"
          >
            <LogOut className="h-3 w-3" />
            Deauthorize Session
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background Grid Accent */}
        <div className="absolute inset-0 grid-bg pointer-events-none opacity-50 z-0" />
        
        {/* Header */}
        <header className="h-16 border-b border-obsidian-border flex items-center justify-between px-8 bg-obsidian-deep/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">
              Location: <span className="text-gray-200">{location.pathname === '/' ? '/dashboard' : location.pathname}</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Toggle Terminal Button */}
            <button
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-300 ${
                isTerminalOpen 
                  ? 'bg-neon-cobalt/10 border-neon-cobalt/40 text-neon-cobalt' 
                  : 'bg-obsidian-card border-obsidian-border text-gray-400 hover:text-gray-200'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>AICOO Pulse Log</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 z-10 relative">
          {children}
        </main>
      </div>

      {/* Collapsible AICOO Terminal Panel */}
      {isTerminalOpen && (
        <aside className="w-80 bg-[#04060b] border-l border-obsidian-border flex flex-col shrink-0 z-20">
          {/* Terminal Header */}
          <div className="p-4 border-b border-obsidian-border flex items-center justify-between bg-obsidian-surface/60">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-neon-mint" />
              <span className="font-mono text-xs font-bold tracking-wider text-gray-200 uppercase">
                AICOO Pulse Stream
              </span>
            </div>
            <button 
              onClick={fetchLogs} 
              disabled={isPollingLogs}
              className="text-gray-400 hover:text-neon-mint transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${isPollingLogs ? 'animate-spin text-neon-mint' : ''}`} />
            </button>
          </div>

          {/* Terminal Logs List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-[11px] leading-relaxed">
            {aicooLogs.length === 0 ? (
              <div className="text-gray-600 text-center py-8">
                &gt; No pulse traffic detected. Initialize coordinate tasks to stimulate agent activity.
              </div>
            ) : (
              aicooLogs.map((log) => {
                let badgeColor = 'text-neon-cobalt border-neon-cobalt/30';
                if (log.type === 'Routing') badgeColor = 'text-purple-400 border-purple-400/30';
                if (log.type === 'Pulse Activity') badgeColor = 'text-neon-mint border-neon-mint/30';
                if (log.type === 'Context Sync') badgeColor = 'text-teal-400 border-teal-400/30';

                return (
                  <div key={log._id} className="p-2.5 rounded border border-obsidian-border bg-obsidian-deep/40 hover:bg-obsidian-deep/80 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase border font-semibold ${badgeColor}`}>
                        {log.type}
                      </span>
                      <span className="text-gray-600 text-[9px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-300 leading-normal">{log.message}</p>
                    
                    {/* Render dialogue preview if present */}
                    {log.details?.dialog && (
                      <div className="mt-2 pl-2 border-l border-neon-cobalt/30 text-gray-500 space-y-1">
                        {log.details.dialog.slice(0, 2).map((d: any, idx: number) => (
                          <div key={idx} className="truncate">
                            <span className="text-neon-cobalt font-semibold">{d.sender.split(' ')[0]}:</span> {d.text}
                          </div>
                        ))}
                        {log.details.dialog.length > 2 && (
                          <div className="text-[10px] text-gray-600 italic">
                            + {log.details.dialog.length - 2} more exchanges...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Terminal Footer */}
          <div className="p-3 border-t border-obsidian-border bg-obsidian-deep text-gray-600 text-[10px] font-mono flex items-center justify-between">
            <span>PING: <span className="text-neon-mint">12ms</span></span>
            <span>OS_STATUS: <span className="text-neon-mint">ACTIVE</span></span>
          </div>
        </aside>
      )}
    </div>
  );
}
