import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Lock, Mail, Terminal, ArrowRight } from 'lucide-react';
import api from '../utils/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // List of seeded synthetic users for quick demo login
  const demoUsers = [
    { name: 'Vidhyadhar', email: 'vidhyadhar@twinos.com', role: 'Senior ML Engineer' },
    { name: 'Sarika', email: 'sarika@twinos.com', role: 'Lead Architect' },
    { name: 'Anjeet', email: 'anjeet@twinos.com', role: 'DevOps Lead' },
    { name: 'Priya', email: 'priya@twinos.com', role: 'Frontend Architect' },
    { name: 'Akash', email: 'akash@twinos.com', role: 'Data Scientist' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide credentials');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const res = await api.post('/auth/login', { email, password });
      
      // Save auth details
      localStorage.setItem('twinos_token', res.data.token);
      localStorage.setItem('twinos_user', JSON.stringify({
        _id: res.data._id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role
      }));

      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Authorization failed. Check details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    try {
      setIsLoading(true);
      setError('');
      const res = await api.post('/auth/login', { email: demoEmail, password: 'twinos123' });
      
      localStorage.setItem('twinos_token', res.data.token);
      localStorage.setItem('twinos_user', JSON.stringify({
        _id: res.data._id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role
      }));

      navigate('/');
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Connection error';
      setError(`Quick login failed: ${errMsg}. (Check if VITE_API_URL is configured on Vercel)`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-deep flex items-center justify-center p-6 relative font-sans">
      {/* Visual cyber scanner lines and grids */}
      <div className="absolute inset-0 grid-bg opacity-30 z-0" />
      
      {/* Decorative scanner line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-neon-mint/30 scanner-line z-0" />

      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-obsidian-surface border border-obsidian-border rounded-2xl overflow-hidden shadow-2xl relative z-10">
        
        {/* Left Side: Login Form */}
        <div className="p-10 flex flex-col justify-center border-r border-obsidian-border">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-neon-mint to-neon-cobalt flex items-center justify-center">
              <Cpu className="h-5 w-5 text-obsidian-deep" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl leading-none text-gray-100">TwinOS</h2>
              <span className="text-[10px] font-mono tracking-widest text-neon-mint uppercase">AICOO Digital Twin Network</span>
            </div>
          </div>

          <h3 className="font-display font-bold text-2xl mb-2 text-gray-200">Deauthorize Session Key</h3>
          <p className="text-xs text-gray-400 mb-6 font-mono">&gt; Enter token key credentials to authorize workspace access.</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/20 border border-red-900/30 text-xs text-red-400 font-mono">
              ERROR: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1.5">
                Session Identity (Email)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@twinos.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-obsidian-deep border border-obsidian-border rounded-lg text-sm text-gray-200 focus:outline-none focus:border-neon-mint transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1.5">
                Access Token Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-obsidian-deep border border-obsidian-border rounded-lg text-sm text-gray-200 focus:outline-none focus:border-neon-mint transition-colors font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-neon-mint hover:bg-neon-mint/90 text-obsidian-deep font-bold rounded-lg text-sm transition-all duration-300 shadow-lg shadow-neon-mint/20 mt-6"
            >
              {isLoading ? 'Decrypting Security Token...' : 'Authorize Workspace'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Right Side: Quick Demo Access (Judges Pick Panel) */}
        <div className="p-10 bg-obsidian-deep/50 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="h-4 w-4 text-neon-cobalt" />
            <h4 className="font-mono text-xs font-bold tracking-wider text-gray-300 uppercase">
              Quick Hackathon Access
            </h4>
          </div>
          <p className="text-xs text-gray-400 mb-6 leading-relaxed">
            Choose a pre-seeded synthetic team identity to log in immediately. Each has customized Digital Twin specs and coordination relationships.
          </p>

          <div className="space-y-2.5">
            {demoUsers.map((user) => (
              <button
                key={user.email}
                onClick={() => handleQuickLogin(user.email)}
                disabled={isLoading}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-obsidian-border bg-obsidian-surface hover:bg-obsidian-card hover:border-neon-cobalt/40 text-left transition-all duration-300 group"
              >
                <div>
                  <h5 className="text-xs font-bold text-gray-200 group-hover:text-neon-cobalt transition-colors">
                    {user.name}
                  </h5>
                  <p className="text-[10px] text-gray-400">{user.role}</p>
                </div>
                <span className="text-[10px] font-mono text-neon-mint group-hover:translate-x-1 transition-transform">
                  Access &gt;
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 text-[10px] font-mono text-gray-500 border-t border-obsidian-border pt-4 text-center">
            Default passcode for all users: <span className="text-neon-mint">twinos123</span>
          </div>
        </div>

      </div>
    </div>
  );
}
