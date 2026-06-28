import React, { useState } from 'react';
import { ShieldAlert, Terminal, RefreshCw, CheckCircle, Database } from 'lucide-react';
import api from '../utils/api';

export default function AdminSeed() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const triggerSeeding = async () => {
    try {
      setIsSeeding(true);
      setSuccess(false);
      setLogMessages([
        'Initializing database administration interface...',
        'Sending WIPE commands to Atlas MongoDB clusters...',
      ]);

      const res = await api.post('/admin/seed');

      setLogMessages(prev => [
        ...prev,
        'Wipe completed successfully. Collections: users, twins, projects, decisions, meetings, reviews, tasks, aicoologs cleaned.',
        'Injecting 10 synthetic User entries with pre-signed JWT hashing parameters...',
        'Constructing Digital Twin expert catalogs for 10 entities...',
        'Spawning 4 workspaces: Atlas, ICU Prediction, TwinOS, Titan...',
        'Seeding historical decision matrices & parsed meeting transcripts...',
        'Generating baseline AICOO agent coordination logs (A2A)...',
        `SUCCESS: ${res.data.message}`
      ]);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setLogMessages(prev => [
        ...prev,
        `FATAL: Seeding pipeline crashed. Details: ${err.response?.data?.message || err.message}`,
        'Verify MongoDB atlas network connection and cluster availability.'
      ]);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-red-500 mb-2">
          <ShieldAlert className="h-4 w-4" />
          <span className="font-mono text-xs uppercase tracking-wider">System Administration</span>
        </div>
        <h2 className="font-display font-bold text-3xl text-gray-100">
          Database Seeder Console
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Perform a factory reset on the workspace registry. This clears all records and imports the 10 mock employee profiles, workspaces, and coordination history required for the hackathon demo flow.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Warning Panel */}
        <div className="md:col-span-1 bg-obsidian-surface border border-red-950/40 rounded-xl p-6 shadow-xl space-y-4 h-fit">
          <div className="flex items-center gap-2.5 text-red-400">
            <Database className="h-5 w-5" />
            <h3 className="font-display font-bold text-base uppercase tracking-wider">
              Danger Zone
            </h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed font-sans">
            Wiping the database will remove all uploaded meeting notes, document text, and custom digital twin modifications. Verify credentials before proceeding.
          </p>

          <button
            onClick={triggerSeeding}
            disabled={isSeeding}
            className="w-full py-3 bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg border border-red-950 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-red-600/10"
          >
            {isSeeding ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Executing Seed...
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                Wipe & Re-Seed Database
              </>
            )}
          </button>
        </div>

        {/* Terminal logs */}
        <div className="md:col-span-2 flex flex-col h-[400px] bg-[#04060b] border border-obsidian-border rounded-xl shadow-2xl overflow-hidden font-mono text-xs">
          <div className="p-4 border-b border-obsidian-border flex items-center justify-between bg-obsidian-surface/60">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-red-500" />
              <span className="text-xs font-bold tracking-wider text-gray-200 uppercase">
                Database Seed Logger
              </span>
            </div>
            {success && (
              <span className="text-[10px] text-neon-mint font-bold uppercase border border-neon-mint/30 px-1.5 py-0.5 rounded bg-neon-mint/5">
                STATUS: SYNCED
              </span>
            )}
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-2 leading-relaxed text-gray-400">
            {logMessages.length === 0 ? (
              <div className="text-gray-600 text-center py-20">
                &gt; Seeder idle. Click "Wipe & Re-Seed Database" to trigger data import operations.
              </div>
            ) : (
              logMessages.map((msg, idx) => {
                let colorClass = 'text-gray-400';
                if (msg.startsWith('SUCCESS:')) colorClass = 'text-neon-mint font-bold';
                if (msg.startsWith('FATAL:')) colorClass = 'text-red-400 font-bold';
                return (
                  <div key={idx} className={`${colorClass} flex items-start gap-2`}>
                    <span className="text-red-500 font-bold shrink-0">&gt;&gt;</span>
                    <span>{msg}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
