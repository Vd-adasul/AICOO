import express from 'express';
import Decision from '../models/Decision.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { searchOrganizationalMemory } from '../utils/gemini.js';

const router = express.Router();

// @desc    Get all decisions
// @route   GET /api/decisions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const decisions = await Decision.find({})
      .populate('projectId', 'name')
      .populate('ownerId', 'name role');
    res.json(decisions);
  } catch (error) {
    console.error('Fetch decisions error:', error);
    res.status(500).json({ message: 'Server error fetching decisions' });
  }
});

// @desc    Get specific decision by ID
// @route   GET /api/decisions/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const decision = await Decision.findById(req.params.id)
      .populate('projectId', 'name')
      .populate('ownerId', 'name role');
    if (!decision) {
      return res.status(404).json({ message: 'Decision not found' });
    }
    res.json(decision);
  } catch (error) {
    console.error('Fetch decision error:', error);
    res.status(500).json({ message: 'Server error fetching decision details' });
  }
});

// @desc    Create a decision
// @route   POST /api/decisions
// @access  Private
router.post('/', protect, async (req, res) => {
  const { title, description, reason, projectId, ownerId, impact } = req.body;
  try {
    // Validate project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const decision = await Decision.create({
      title,
      description,
      reason,
      projectId,
      ownerId: ownerId || req.user._id, // default to author
      impact: impact || 'Medium'
    });

    const populatedDecision = await Decision.findById(decision._id)
      .populate('projectId', 'name')
      .populate('ownerId', 'name role');

    res.status(201).json(populatedDecision);
  } catch (error) {
    console.error('Create decision error:', error);
    res.status(500).json({ message: 'Server error saving decision' });
  }
});

// @desc    Update a decision
// @route   PUT /api/decisions/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const decision = await Decision.findById(req.params.id);
    if (!decision) {
      return res.status(404).json({ message: 'Decision not found' });
    }

    decision.title = req.body.title || decision.title;
    decision.description = req.body.description || decision.description;
    decision.reason = req.body.reason || decision.reason;
    decision.projectId = req.body.projectId || decision.projectId;
    decision.ownerId = req.body.ownerId || decision.ownerId;
    decision.impact = req.body.impact || decision.impact;

    const updatedDecision = await decision.save();
    
    const populatedDecision = await Decision.findById(updatedDecision._id)
      .populate('projectId', 'name')
      .populate('ownerId', 'name role');

    res.json(populatedDecision);
  } catch (error) {
    console.error('Update decision error:', error);
    res.status(500).json({ message: 'Server error updating decision' });
  }
});

// @desc    Delete a decision
// @route   DELETE /api/decisions/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const decision = await Decision.findById(req.params.id);
    if (!decision) {
      return res.status(404).json({ message: 'Decision not found' });
    }
    await Decision.findByIdAndDelete(decision._id);
    res.json({ message: 'Decision deleted successfully' });
  } catch (error) {
    console.error('Delete decision error:', error);
    res.status(500).json({ message: 'Server error deleting decision' });
  }
});

// @desc    Search organizational memory (Decisions/Reasoning) using Gemini AI
// @route   POST /api/decisions/search
// @access  Private
router.post('/search', protect, async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ message: 'Please provide a search question' });
  }

  try {
    // Gather system state context (all projects, decisions, and users)
    const decisions = await Decision.find({}).populate('projectId', 'name').populate('ownerId', 'name');
    const users = await User.find({}).select('name role bio availability');
    const projects = await Project.find({}).select('name description status');

    const systemStateContext = {
      decisions: decisions.map(d => ({
        title: d.title,
        description: d.description,
        reason: d.reason,
        owner: d.ownerId?.name || 'Unknown',
        project: d.projectId?.name || 'Unknown',
        impact: d.impact
      })),
      users: users.map(u => ({
        name: u.name,
        role: u.role,
        bio: u.bio,
        availability: u.availability
      })),
      projects: projects.map(p => ({
        name: p.name,
        description: p.description,
        status: p.status
      }))
    };

    let answer = '';
    if (process.env.GEMINI_API_KEY) {
      try {
        answer = await searchOrganizationalMemory(question, systemStateContext);
      } catch (err) {
        console.error('searchOrganizationalMemory failed, using fallback:', err.message);
      }
    }

    if (!answer || answer.startsWith('Error retrieving response')) {
      // Fallback simple search
      const query = question.toLowerCase();
      const match = decisions.find(d => 
        d.title.toLowerCase().includes(query) || 
        d.description.toLowerCase().includes(query) || 
        d.reason.toLowerCase().includes(query)
      );

      if (match) {
        answer = `Offline search result: Found decision "${match.title}" authored by ${match.ownerId?.name || 'unknown'} on project ${match.projectId?.name || 'unknown'}. Reason: "${match.reason}".`;
      } else {
        answer = `Offline search result: No matching decisions found containing "${question}" in our databases. (Check if GEMINI_API_KEY environment variable is configured correctly on Render).`;
      }
    }

    res.json({ answer });
  } catch (error) {
    console.error('Decision semantic search error:', error);
    res.status(500).json({ message: 'Server error processing semantic query', error: error.message });
  }
});

export default router;
