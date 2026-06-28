import express from 'express';
import Meeting from '../models/Meeting.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Decision from '../models/Decision.js';
import Task from '../models/Task.js';
import { protect } from '../middleware/auth.js';
import { parseMeetingNotes } from '../utils/gemini.js';

const router = express.Router();

// @desc    Get all meetings
// @route   GET /api/meetings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const meetings = await Meeting.find({})
      .populate('projectId', 'name')
      .populate('participants', 'name role')
      .populate('actionItems.ownerId', 'name role');
    res.json(meetings);
  } catch (error) {
    console.error('Fetch meetings error:', error);
    res.status(500).json({ message: 'Server error fetching meetings' });
  }
});

// @desc    Get specific meeting
// @route   GET /api/meetings/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('projectId', 'name')
      .populate('participants', 'name role')
      .populate('actionItems.ownerId', 'name role');
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    res.json(meeting);
  } catch (error) {
    console.error('Fetch meeting details error:', error);
    res.status(500).json({ message: 'Server error fetching meeting details' });
  }
});

// @desc    Save manual meeting summary
// @route   POST /api/meetings
// @access  Private
router.post('/', protect, async (req, res) => {
  const { projectId, title, summary, actionItems, risks, participants } = req.body;
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const meeting = await Meeting.create({
      projectId,
      title,
      summary,
      actionItems: actionItems || [],
      risks: risks || [],
      participants: participants || []
    });

    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('projectId', 'name')
      .populate('participants', 'name role')
      .populate('actionItems.ownerId', 'name role');

    res.status(201).json(populatedMeeting);
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ message: 'Server error saving meeting record' });
  }
});

// @desc    Upload & Parse meeting notes via Gemini AI
// @route   POST /api/meetings/upload
// @access  Private
router.post('/upload', protect, async (req, res) => {
  const { projectId, title, notesText } = req.body;

  if (!projectId || !title || !notesText) {
    return res.status(400).json({ message: 'Please provide projectId, title, and notesText' });
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get all team members for reference in parsing owners
    const teamMembers = await User.find({});

    let parsedData = {
      summary: 'Fallback: Notes text uploaded, but AI extraction was offline.',
      decisions: [],
      actionItems: [],
      risks: []
    };

    if (process.env.GEMINI_API_KEY) {
      try {
        parsedData = await parseMeetingNotes(notesText, teamMembers);
      } catch (err) {
        console.error('Gemini notes parsing failed:', err);
      }
    } else {
      // Mock simple parsing for demo if API key isn't provided
      if (notesText.toLowerCase().includes('reject')) {
        parsedData.decisions.push({
          title: 'Rejected technology candidate',
          description: 'Identified a conflict in technical requirements.',
          reason: 'Memory and baseline overhead issues.',
          impact: 'High'
        });
      }
      parsedData.summary = `Mock parsed summary: Discussed project status and sprint roadmap for project ${project.name}.`;
    }

    // Map action items from parsed owners
    const actionItemsFormatted = parsedData.actionItems.map(item => {
      let ownerId = null;
      // If ownerId is valid MongoDB ID and exists, use it
      if (item.ownerId && item.ownerId.length === 24) {
        ownerId = item.ownerId;
      }
      return {
        task: item.task,
        ownerId: ownerId || req.user._id // default fallback to requester
      };
    });

    // Create Meeting
    const meeting = await Meeting.create({
      projectId,
      title,
      summary: parsedData.summary,
      actionItems: actionItemsFormatted,
      risks: parsedData.risks || [],
      participants: project.members // Default to all project members
    });

    // Automatically store extracted decisions into Decision schema
    const createdDecisions = [];
    if (parsedData.decisions && parsedData.decisions.length > 0) {
      for (const dec of parsedData.decisions) {
        const d = await Decision.create({
          title: dec.title,
          description: dec.description,
          reason: dec.reason,
          projectId: projectId,
          ownerId: req.user._id, // parsed decisions owned by the uploader
          impact: dec.impact || 'Medium'
        });
        createdDecisions.push(d);
      }
    }

    // Automatically create tasks
    const createdTasks = [];
    for (const item of actionItemsFormatted) {
      const t = await Task.create({
        title: item.task,
        description: `Action item extracted from meeting: ${meeting.title}`,
        ownerId: item.ownerId,
        projectId: projectId,
        status: 'Pending',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week deadline
      });
      createdTasks.push(t);
    }

    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('projectId', 'name')
      .populate('participants', 'name role')
      .populate('actionItems.ownerId', 'name role');

    res.status(201).json({
      meeting: populatedMeeting,
      decisions: createdDecisions,
      tasks: createdTasks
    });

  } catch (error) {
    console.error('Meeting parse error:', error);
    res.status(500).json({ message: 'Server error parsing meeting notes', error: error.message });
  }
});

export default router;
