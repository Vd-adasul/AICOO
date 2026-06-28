import express from 'express';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Decision from '../models/Decision.js';
import Meeting from '../models/Meeting.js';
import Document from '../models/Document.js';
import Task from '../models/Task.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({}).populate('members', 'name role email availability');
    res.json(projects);
  } catch (error) {
    console.error('Fetch projects error:', error);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
});

// @desc    Get specific project
// @route   GET /api/projects/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('members', 'name role email availability');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Fetch associated resources
    const decisions = await Decision.find({ projectId: project._id }).populate('ownerId', 'name role');
    const meetings = await Meeting.find({ projectId: project._id });
    const documents = await Document.find({ projectId: project._id });
    const tasks = await Task.find({ projectId: project._id }).populate('ownerId', 'name role');

    res.json({
      project,
      decisions,
      meetings,
      documents,
      tasks
    });
  } catch (error) {
    console.error('Fetch project details error:', error);
    res.status(500).json({ message: 'Server error fetching project details' });
  }
});

// @desc    Create a project
// @route   POST /api/projects
// @access  Private
router.post('/', protect, async (req, res) => {
  const { name, description, members, skills, status } = req.body;
  try {
    const project = await Project.create({
      name,
      description,
      members: members || [req.user._id], // creator joins by default if empty
      skills: skills || [],
      status: status || 'Active'
    });
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error creating project' });
  }
});

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.name = req.body.name || project.name;
    project.description = req.body.description || project.description;
    project.members = req.body.members || project.members;
    project.skills = req.body.skills || project.skills;
    project.status = req.body.status || project.status;

    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error updating project' });
  }
});

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private
router.post('/:id/members', protect, async (req, res) => {
  const { userId } = req.body;
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already member
    if (project.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    project.members.push(userId);
    await project.save();

    const populatedProject = await Project.findById(project._id).populate('members', 'name role email availability');
    res.json(populatedProject);
  } catch (error) {
    console.error('Add project member error:', error);
    res.status(500).json({ message: 'Server error adding project member' });
  }
});

// @desc    Get compiled context (meetings, decisions, documents, tasks) for AI consumption
// @route   GET /api/projects/:id/context
// @access  Private
router.get('/:id/context', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('members', 'name role');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const decisions = await Decision.find({ projectId: project._id }).populate('ownerId', 'name');
    const meetings = await Meeting.find({ projectId: project._id });
    const documents = await Document.find({ projectId: project._id });
    const tasks = await Task.find({ projectId: project._id }).populate('ownerId', 'name');

    // Compile into clean text blocks for LLM context aggregation
    const compiledContext = {
      projectDetails: {
        name: project.name,
        description: project.description,
        status: project.status,
        members: project.members.map(m => `${m.name} (${m.role})`).join(', '),
      },
      decisions: decisions.map(d => ({
        title: d.title,
        description: d.description,
        reason: d.reason,
        owner: d.ownerId?.name || 'Unknown',
        impact: d.impact,
        date: d.createdAt
      })),
      meetings: meetings.map(m => ({
        title: m.title,
        summary: m.summary,
        risks: m.risks,
        actionItems: m.actionItems.map(a => a.task)
      })),
      documents: documents.map(doc => ({
        fileName: doc.fileName,
        summary: doc.summary,
        skills: doc.extractedSkills
      })),
      tasks: tasks.map(t => ({
        title: t.title,
        status: t.status,
        owner: t.ownerId?.name || 'Unassigned'
      }))
    };

    res.json(compiledContext);
  } catch (error) {
    console.error('Project context fetch error:', error);
    res.status(500).json({ message: 'Server error compiling project context' });
  }
});

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Delete project metadata but keep decisions/meetings (or wipe them depending on preference. 
    // We clean them up to avoid orphaned references in MongoDB)
    await Decision.deleteMany({ projectId: project._id });
    await Meeting.deleteMany({ projectId: project._id });
    await Document.deleteMany({ projectId: project._id });
    await Task.deleteMany({ projectId: project._id });
    await Project.findByIdAndDelete(project._id);

    res.json({ message: 'Project and all associated resources deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error deleting project' });
  }
});

export default router;
