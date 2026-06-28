import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, Plus, Users, BrainCircuit, FileText, 
  FileAudio, CheckSquare, Upload, ArrowRight, ShieldAlert, RefreshCw
} from 'lucide-react';
import api from '../utils/api';

export default function ProjectWorkspace() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjId, setSelectedProjId] = useState<string>('');
  const [projectDetail, setProjectDetail] = useState<any>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Forms states
  const [usersList, setUsersList] = useState<any[]>([]);
  const [newMemberId, setNewMemberId] = useState('');
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [isCreatingProj, setIsCreatingProj] = useState(false);

  // Upload meeting / doc states
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingNotesText, setMeetingNotesText] = useState('');
  const [isParsingMeeting, setIsParsingMeeting] = useState(false);

  const [docName, setDocName] = useState('');
  const [docText, setDocText] = useState('');
  const [isParsingDoc, setIsParsingDoc] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
      if (res.data.length > 0 && !selectedProjId) {
        setSelectedProjId(res.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchProjectDetails = async (id: string) => {
    try {
      setIsLoadingDetail(true);
      const res = await api.get(`/projects/${id}`);
      setProjectDetail(res.data);
    } catch (err) {
      console.error('Failed to fetch project details', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsersList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedProjId) {
      fetchProjectDetails(selectedProjId);
    }
  }, [selectedProjId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName || !newProjDesc) return;
    try {
      setIsCreatingProj(true);
      const res = await api.post('/projects', { name: newProjName, description: newProjDesc });
      setProjects(prev => [...prev, res.data]);
      setSelectedProjId(res.data._id);
      setNewProjName('');
      setNewProjDesc('');
    } catch (err) {
      console.error('Failed to create project', err);
    } finally {
      setIsCreatingProj(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberId || !selectedProjId) return;
    try {
      await api.post(`/projects/${selectedProjId}/members`, { userId: newMemberId });
      setNewMemberId('');
      fetchProjectDetails(selectedProjId);
    } catch (err) {
      console.error('Failed to add member', err);
    }
  };

  const handleUploadMeetingNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle || !meetingNotesText || !selectedProjId) return;
    try {
      setIsParsingMeeting(true);
      await api.post('/meetings/upload', {
        projectId: selectedProjId,
        title: meetingTitle,
        notesText: meetingNotesText
      });
      setMeetingTitle('');
      setMeetingNotesText('');
      fetchProjectDetails(selectedProjId);
    } catch (err) {
      console.error('Failed to parse meeting notes', err);
    } finally {
      setIsParsingMeeting(false);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !docText || !selectedProjId) return;
    try {
      setIsParsingDoc(true);
      await api.post('/documents/upload', {
        projectId: selectedProjId,
        fileName: docName,
        docText: docText
      });
      setDocName('');
      setDocText('');
      fetchProjectDetails(selectedProjId);
    } catch (err) {
      console.error('Failed to parse document text', err);
    } finally {
      setIsParsingDoc(false);
    }
  };

  if (isLoadingList) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="h-8 w-8 text-neon-mint animate-spin" />
        <span className="font-mono text-xs text-gray-400">&gt; Indexing project workspace directories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-neon-mint mb-2">
            <FolderKanban className="h-4 w-4" />
            <span className="font-mono text-xs uppercase tracking-wider">Workspace Networks</span>
          </div>
          <h2 className="font-display font-bold text-3xl text-gray-100">
            Project Workspace Console
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Access documents, meeting intel, decisions, and action items pooled across Digital Twins.
          </p>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-3 shrink-0">
          <label className="text-xs font-mono text-gray-500 uppercase">Current Workspace:</label>
          <select
            value={selectedProjId}
            onChange={(e) => setSelectedProjId(e.target.value)}
            className="px-3 py-2 bg-obsidian-surface border border-obsidian-border rounded-lg text-xs font-mono text-gray-200 focus:outline-none focus:border-neon-mint transition-colors"
          >
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Dashboard Frame */}
      <div className="grid lg:grid-cols-4 gap-8">
        
        {/* Left Column: Projects List & Add project */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Workspaces list */}
          <div className="bg-obsidian-surface border border-obsidian-border rounded-xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest border-b border-obsidian-border pb-2.5">
              Available Workspaces ({projects.length})
            </h3>
            <div className="space-y-1.5">
              {projects.map((p) => {
                const isSelected = p._id === selectedProjId;
                return (
                  <button
                    key={p._id}
                    onClick={() => setSelectedProjId(p._id)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all duration-300 font-semibold truncate ${
                      isSelected
                        ? 'bg-gradient-to-r from-neon-cobalt/15 to-transparent border-neon-cobalt text-neon-cobalt pl-3.5'
                        : 'border-transparent text-gray-400 hover:bg-obsidian-card/40 hover:text-gray-200'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Create new project */}
          <div className="bg-obsidian-surface border border-obsidian-border rounded-xl p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-mono text-gray-400 uppercase tracking-widest">
              Create New Workspace
            </h4>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Project Name..."
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full px-3 py-2 bg-obsidian-deep border border-obsidian-border rounded text-xs text-gray-200 focus:outline-none focus:border-neon-mint font-mono"
                />
              </div>
              <div>
                <textarea
                  placeholder="Description..."
                  rows={2}
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-obsidian-deep border border-obsidian-border rounded text-xs text-gray-200 focus:outline-none focus:border-neon-mint font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isCreatingProj || !newProjName.trim()}
                className="w-full py-2 bg-obsidian-card hover:bg-neon-mint/10 border border-obsidian-border hover:border-neon-mint text-xs font-mono font-bold uppercase tracking-wider text-gray-300 hover:text-neon-mint transition-all duration-300 flex items-center justify-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Initialize Project
              </button>
            </form>
          </div>

        </div>

        {/* Right 3 Columns: Active Workspace Content */}
        <div className="lg:col-span-3 space-y-8">
          {isLoadingDetail || !projectDetail ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="h-6 w-6 text-neon-mint animate-spin" />
              <span className="font-mono text-xs text-gray-500">Querying workspace database...</span>
            </div>
          ) : (
            <>
              {/* Project Meta Info */}
              <div className="bg-obsidian-surface border border-obsidian-border rounded-xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-gray-100">{projectDetail.project.name}</h3>
                    <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">{projectDetail.project.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-3">
                      {projectDetail.project.skills.map((skill: string) => (
                        <span key={skill} className="px-2 py-0.5 rounded bg-obsidian-deep text-neon-mint text-[9px] font-mono border border-neon-mint/20">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-neon-cobalt/10 border border-neon-cobalt/30 text-neon-cobalt text-xs font-mono font-bold uppercase select-none">
                    {projectDetail.project.status}
                  </span>
                </div>

                {/* Add member inline */}
                <div className="mt-6 pt-5 border-t border-obsidian-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-mono text-gray-400">Team Members ({projectDetail.project.members.length}):</span>
                    <div className="flex -space-x-1.5 pl-2">
                      {projectDetail.project.members.map((member: any) => (
                        <div 
                          key={member._id} 
                          title={`${member.name} - ${member.role} (${member.availability})`}
                          className="h-6 w-6 rounded-full border border-obsidian-surface bg-neon-cobalt/10 text-neon-cobalt text-[9.5px] font-bold flex items-center justify-center font-mono cursor-help"
                        >
                          {member.name[0]}
                        </div>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleAddMember} className="flex gap-2 shrink-0">
                    <select
                      value={newMemberId}
                      onChange={(e) => setNewMemberId(e.target.value)}
                      className="px-3 py-1.5 bg-obsidian-deep border border-obsidian-border rounded text-xs font-mono text-gray-200 focus:outline-none"
                    >
                      <option value="">Add Teammate...</option>
                      {usersList
                        .filter(u => !projectDetail.project.members.some((m: any) => m._id === u._id))
                        .map(u => (
                          <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                        ))
                      }
                    </select>
                    <button
                      type="submit"
                      disabled={!newMemberId}
                      className="px-3 py-1.5 bg-neon-cobalt hover:bg-neon-cobalt/90 disabled:opacity-40 text-obsidian-deep text-xs font-mono font-bold uppercase rounded transition-colors"
                    >
                      Add
                    </button>
                  </form>
                </div>
              </div>

              {/* Grid: 2 Column details */}
              <div className="grid md:grid-cols-2 gap-8">
                
                {/* Left Side: Decisions & Tasks */}
                <div className="space-y-8">
                  {/* Decisions */}
                  <div className="space-y-4">
                    <h3 className="font-display font-bold text-sm text-gray-200 uppercase tracking-wider flex items-center gap-2">
                      <BrainCircuit className="h-4 w-4 text-neon-gold" />
                      Authored Decisions
                    </h3>
                    <div className="bg-obsidian-surface border border-obsidian-border rounded-xl p-5 space-y-4 shadow-xl">
                      {projectDetail.decisions.length === 0 ? (
                        <div className="text-gray-500 text-xs font-mono py-4 text-center">&gt; No decisions recorded.</div>
                      ) : (
                        <div className="divide-y divide-obsidian-border">
                          {projectDetail.decisions.map((dec: any) => (
                            <div key={dec._id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-gray-200">{dec.title}</h4>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono border ${
                                  dec.impact === 'High' ? 'border-red-500/20 text-red-400 bg-red-500/5' : 'border-neon-mint/20 text-neon-mint bg-neon-mint/5'
                                }`}>
                                  {dec.impact}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400 font-mono leading-relaxed">{dec.reason}</p>
                              <div className="text-[9px] text-gray-500 font-mono flex gap-2">
                                <span>Author: {dec.ownerId?.name}</span>
                                <span>•</span>
                                <span>{new Date(dec.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-4">
                    <h3 className="font-display font-bold text-sm text-gray-200 uppercase tracking-wider flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-neon-cobalt" />
                      Project Action Items
                    </h3>
                    <div className="bg-obsidian-surface border border-obsidian-border rounded-xl p-5 space-y-3 shadow-xl">
                      {projectDetail.tasks.length === 0 ? (
                        <div className="text-gray-500 text-xs font-mono py-4 text-center">&gt; No active tasks.</div>
                      ) : (
                        <div className="space-y-2">
                          {projectDetail.tasks.map((task: any) => (
                            <div key={task._id} className="p-3 rounded bg-obsidian-card/40 border border-obsidian-border flex items-center justify-between text-xs">
                              <div>
                                <h4 className="font-bold text-gray-200">{task.title}</h4>
                                <div className="flex gap-2.5 mt-1.5 text-[9px] font-mono text-gray-500">
                                  <span>Owner: {task.ownerId?.name || 'Unassigned'}</span>
                                  {task.deadline && (
                                    <>
                                      <span>•</span>
                                      <span>Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold border ${
                                task.status === 'Completed' ? 'border-neon-mint/20 text-neon-mint bg-neon-mint/5' :
                                task.status === 'In Progress' ? 'border-neon-cobalt/20 text-neon-cobalt bg-neon-cobalt/5' :
                                'border-gray-500/20 text-gray-500'
                              }`}>
                                {task.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Meeting Intel Upload & Documents */}
                <div className="space-y-8">
                  {/* Past parsed meetings & paste notes */}
                  <div className="space-y-4">
                    <h3 className="font-display font-bold text-sm text-gray-200 uppercase tracking-wider flex items-center gap-2">
                      <FileAudio className="h-4 w-4 text-neon-mint" />
                      Meeting Notes Intelligence
                    </h3>
                    
                    <div className="bg-obsidian-surface border border-obsidian-border rounded-xl p-5 space-y-4 shadow-xl">
                      
                      {/* Meetings list */}
                      {projectDetail.meetings.length > 0 && (
                        <div className="space-y-2 border-b border-obsidian-border pb-4">
                          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">Processed Meetings</span>
                          {projectDetail.meetings.map((meet: any) => (
                            <div key={meet._id} className="p-2.5 rounded bg-obsidian-deep/50 border border-obsidian-border/50 text-xs">
                              <h4 className="font-bold text-gray-200">{meet.title}</h4>
                              <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{meet.summary}</p>
                              {meet.risks?.length > 0 && (
                                <div className="mt-2 text-[9px] text-red-400 font-mono truncate">
                                  RISK ALERT: {meet.risks[0]}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Notes paste form */}
                      <form onSubmit={handleUploadMeetingNotes} className="space-y-3 pt-2">
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                          Paste Meeting Transcript (AI Parse)
                        </span>
                        <div>
                          <input
                            type="text"
                            placeholder="Meeting title (e.g. Cache Architecture Sync)"
                            value={meetingTitle}
                            onChange={(e) => setMeetingTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-obsidian-deep border border-obsidian-border rounded text-xs text-gray-200 focus:outline-none focus:border-neon-mint font-mono"
                          />
                        </div>
                        <div>
                          <textarea
                            placeholder="Paste raw transcript, decisions discussed, or team discussion logs here..."
                            rows={3}
                            value={meetingNotesText}
                            onChange={(e) => setMeetingNotesText(e.target.value)}
                            className="w-full px-3 py-2 bg-obsidian-deep border border-obsidian-border rounded text-[10px] text-gray-200 focus:outline-none focus:border-neon-mint font-mono leading-relaxed"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isParsingMeeting || !meetingTitle.trim() || !meetingNotesText.trim()}
                          className="w-full py-2 bg-neon-mint hover:bg-neon-mint/90 disabled:opacity-40 text-obsidian-deep font-bold rounded text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                        >
                          {isParsingMeeting ? 'Gemini Extracting Intelligence...' : 'Upload & Mine Notes'}
                          <Upload className="h-3.5 w-3.5" />
                        </button>
                      </form>

                    </div>
                  </div>

                  {/* Documents context paste */}
                  <div className="space-y-4">
                    <h3 className="font-display font-bold text-sm text-gray-200 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-400" />
                      Document context library
                    </h3>
                    
                    <div className="bg-obsidian-surface border border-obsidian-border rounded-xl p-5 space-y-4 shadow-xl">
                      
                      {/* Documents list */}
                      {projectDetail.documents.length > 0 && (
                        <div className="space-y-2 border-b border-obsidian-border pb-4">
                          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">Indexed Context</span>
                          <div className="space-y-1.5">
                            {projectDetail.documents.map((doc: any) => (
                              <div key={doc._id} className="p-2 bg-obsidian-deep/50 rounded border border-obsidian-border/50 text-[11px] flex justify-between items-center">
                                <span className="font-mono text-gray-300 truncate max-w-[200px]">{doc.fileName}</span>
                                <div className="flex gap-1.5 font-mono text-[9px] text-neon-mint">
                                  {doc.extractedSkills?.slice(0, 2).map((s: string) => (
                                    <span key={s} className="px-1 border border-neon-mint/30 rounded bg-neon-mint/5">{s}</span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Doc upload form */}
                      <form onSubmit={handleUploadDoc} className="space-y-3 pt-2">
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                          Index Text Document (AI Skill Extraction)
                        </span>
                        <div>
                          <input
                            type="text"
                            placeholder="File name (e.g. api_requirements.txt)"
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                            className="w-full px-3 py-2 bg-obsidian-deep border border-obsidian-border rounded text-xs text-gray-200 focus:outline-none focus:border-neon-mint font-mono"
                          />
                        </div>
                        <div>
                          <textarea
                            placeholder="Paste text contents of the document (API requirements, designs, guidelines) here..."
                            rows={3}
                            value={docText}
                            onChange={(e) => setDocText(e.target.value)}
                            className="w-full px-3 py-2 bg-obsidian-deep border border-obsidian-border rounded text-[10px] text-gray-200 focus:outline-none focus:border-neon-mint font-mono leading-relaxed"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isParsingDoc || !docName.trim() || !docText.trim()}
                          className="w-full py-2 bg-obsidian-card hover:bg-purple-950/20 border border-obsidian-border hover:border-purple-800 text-xs font-mono font-bold uppercase tracking-wider text-gray-300 hover:text-purple-400 transition-all duration-300 flex items-center justify-center gap-1.5"
                        >
                          {isParsingDoc ? 'Gemini Extracting Skills...' : 'Index Document Text'}
                          <Upload className="h-3.5 w-3.5" />
                        </button>
                      </form>

                    </div>
                  </div>

                </div>

              </div>
            </>
          )}
        </div>

      </div>

    </div>
  );
}
