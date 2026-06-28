import express from 'express';
import AicooLog from '../models/AicooLog.js';
import ApprovalRequest from '../models/ApprovalRequest.js';
import User from '../models/User.js';
import Twin from '../models/Twin.js';
import Decision from '../models/Decision.js';
import Review from '../models/Review.js';
import Project from '../models/Project.js';
import { protect } from '../middleware/auth.js';
import { recommendReviewers, simulateA2ACoordination } from '../utils/gemini.js';

const router = express.Router();

// @desc    AICOO Routing - Route query or requirement to best twin
// @route   POST /api/aicoo/route
// @access  Private
router.post('/aicoo/route', protect, async (req, res) => {
  const { requirement } = req.body;

  if (!requirement) {
    return res.status(400).json({ message: 'Please provide a requirement string' });
  }

  try {
    const twins = await Twin.find({}).populate('userId', 'name role availability yearsExperience');
    
    let recommendations = [];
    if (process.env.GEMINI_API_KEY) {
      recommendations = await recommendReviewers(requirement, twins);
    } else {
      // Offline fallback: regex matching
      const reqLower = requirement.toLowerCase();
      const pool = twins.map(t => {
        let score = 50; // baseline
        const matchedSkills = t.skills.filter(s => reqLower.includes(s.toLowerCase()));
        score += matchedSkills.length * 15;
        if (t.userId.availability === 'Available') score += 10;
        else if (t.userId.availability === 'Focused') score -= 15;
        
        return {
          reviewerId: t.userId._id,
          name: t.userId.name,
          confidenceScore: Math.min(score, 98),
          reasoning: [
            `Matches ${matchedSkills.length} requested skills (${matchedSkills.join(', ') || 'none'})`,
            `Availability is currently ${t.userId.availability}`
          ]
        };
      });

      recommendations = pool.sort((a, b) => b.confidenceScore - a.confidenceScore).slice(0, 3);
    }

    // Log the routing event
    await AicooLog.create({
      type: 'Routing',
      senderId: req.user._id,
      message: `AICOO Twin Router routed requirement: "${requirement}". Ranked experts: ${recommendations.map(r => r.name).join(', ')}.`
    });

    res.json({ recommendations });
  } catch (error) {
    console.error('AICOO routing error:', error);
    res.status(500).json({ message: 'Server error during agent routing' });
  }
});

// @desc    Expertise Search - Search ranked experts
// @route   POST /api/expertise/search
// @access  Private
router.post('/expertise/search', protect, async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ message: 'Please provide a search question' });
  }

  try {
    const twins = await Twin.find({}).populate('userId', 'name role availability yearsExperience');
    let recommendations = [];

    if (process.env.GEMINI_API_KEY) {
      recommendations = await recommendReviewers(question, twins);
    } else {
      const queryLower = question.toLowerCase();
      const pool = twins.map(t => {
        let score = 50;
        const matchedSkills = t.skills.filter(s => queryLower.includes(s.toLowerCase()));
        score += matchedSkills.length * 15;
        if (t.userId.availability === 'Available') score += 10;
        return {
          reviewerId: t.userId._id,
          name: t.userId.name,
          confidenceScore: Math.min(score, 95),
          reasoning: [
            `Twin profile possesses matching technical keywords.`,
            `Registered availability status: ${t.userId.availability}.`
          ]
        };
      });
      recommendations = pool.sort((a, b) => b.confidenceScore - a.confidenceScore).slice(0, 3);
    }

    res.json({ recommendations });
  } catch (error) {
    console.error('Expertise search error:', error);
    res.status(500).json({ message: 'Server error searching expertise' });
  }
});

// @desc    Reviewer Recommendation
// @route   POST /api/reviewers/recommend
// @access  Private
router.post('/reviewers/recommend', protect, async (req, res) => {
  const { architectureDescription } = req.body;
  if (!architectureDescription) {
    return res.status(400).json({ message: 'Please provide architectureDescription' });
  }

  try {
    const twins = await Twin.find({}).populate('userId', 'name role availability yearsExperience');
    let recommendations = [];

    if (process.env.GEMINI_API_KEY) {
      recommendations = await recommendReviewers(architectureDescription, twins);
    } else {
      const descLower = architectureDescription.toLowerCase();
      const pool = twins.map(t => {
        let score = 45;
        const matchedSkills = t.skills.filter(s => descLower.includes(s.toLowerCase()));
        score += matchedSkills.length * 20;
        if (t.userId.availability === 'Available') score += 10;
        return {
          reviewerId: t.userId._id,
          name: t.userId.name,
          confidenceScore: Math.min(score, 97),
          reasoning: [
            `Identified architectural affinity on twin skills index.`,
            `Teammate is currently ${t.userId.availability} for review tasks.`
          ]
        };
      });
      recommendations = pool.sort((a, b) => b.confidenceScore - a.confidenceScore).slice(0, 3);
    }

    res.json({ recommendations });
  } catch (error) {
    console.error('Reviewer recommendation error:', error);
    res.status(500).json({ message: 'Server error recommending reviewers' });
  }
});

// @desc    AICOO Agent-to-Agent Coordination - Trigger simulated A2A negotiation log
// @route   POST /api/aicoo/coordinate
// @access  Private
router.post('/aicoo/coordinate', protect, async (req, res) => {
  const { receiverId, task } = req.body;

  if (!receiverId || !task) {
    return res.status(400).json({ message: 'Please provide receiverId and task' });
  }

  try {
    const senderUser = req.user;
    const receiverUser = await User.findById(receiverId);

    if (!receiverUser) {
      return res.status(404).json({ message: 'Receiver user not found' });
    }

    const senderTwin = await Twin.findOne({ userId: senderUser._id });
    const receiverTwin = await Twin.findOne({ userId: receiverId });

    let dialog = [];
    if (process.env.GEMINI_API_KEY) {
      dialog = await simulateA2ACoordination(senderUser, receiverUser, senderTwin, receiverTwin, task);
    } else {
      dialog = [
        {
          sender: `${senderUser.name} Twin`,
          text: `Pulse packet sent. Requesting assistance from ${receiverUser.name}'s Digital Twin regarding task: "${task}".`
        },
        {
          sender: `${receiverUser.name} Twin`,
          text: `Pulse packet received. Analyzing skills match and calendar workload. Technical fit is high, and my human is currently ${receiverUser.availability}.`
        },
        {
          sender: `${senderUser.name} Twin`,
          text: `Great, establishing shared workspace context sync. Preparing action item request.`
        },
        {
          sender: `${receiverUser.name} Twin`,
          text: `Understood. I have logged this request and prepared a pending approval for ${receiverUser.name}. Awaiting human signature.`
        }
      ];
    }

    const log = await AicooLog.create({
      type: 'A2A Negotiation',
      senderId: senderUser._id,
      receiverId: receiverId,
      message: `A2A Negotiation between ${senderUser.name} Twin and ${receiverUser.name} Twin completed for task: "${task}".`,
      details: { dialog, task }
    });

    res.status(201).json({ log, dialog });
  } catch (error) {
    console.error('AICOO coordination error:', error);
    res.status(500).json({ message: 'Server error during agent negotiation' });
  }
});

// @desc    AICOO Shared Context - Shared context exchange log
// @route   POST /api/aicoo/context
// @access  Private
router.post('/aicoo/context', protect, async (req, res) => {
  const { receiverId, projectName, message } = req.body;
  try {
    const log = await AicooLog.create({
      type: 'Context Sync',
      senderId: req.user._id,
      receiverId: receiverId,
      message: message || `${req.user.name} Twin synchronized context with receiver twin for project "${projectName}".`,
      details: { projectName }
    });
    res.status(201).json(log);
  } catch (error) {
    console.error('AICOO context sync error:', error);
    res.status(500).json({ message: 'Server error during context sync' });
  }
});

// @desc    Get all AICOO logs
// @route   GET /api/aicoo/logs
// @access  Private
router.get('/aicoo/logs', protect, async (req, res) => {
  try {
    const logs = await AicooLog.find({})
      .populate('senderId', 'name role')
      .populate('receiverId', 'name role')
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    console.error('Fetch Aicoo logs error:', error);
    res.status(500).json({ message: 'Server error fetching logs' });
  }
});

// @desc    Get all pending and resolved approval requests
// @route   GET /api/aicoo/approvals
// @access  Private
router.get('/aicoo/approvals', protect, async (req, res) => {
  try {
    const approvals = await ApprovalRequest.find({})
      .populate('requesterId', 'name role')
      .sort({ createdAt: -1 });
    res.json(approvals);
  } catch (error) {
    console.error('Fetch approvals error:', error);
    res.status(500).json({ message: 'Server error fetching approvals' });
  }
});

// @desc    Submit an approval action request (Human-in-the-loop)
// @route   POST /api/aicoo/approvals
// @access  Private
router.post('/aicoo/approvals', protect, async (req, res) => {
  const { type, details } = req.body;

  if (!type || !details) {
    return res.status(400).json({ message: 'Please provide type and details' });
  }

  try {
    const request = await ApprovalRequest.create({
      type,
      details,
      requesterId: req.user._id
    });
    res.status(201).json(request);
  } catch (error) {
    console.error('Create approval request error:', error);
    res.status(500).json({ message: 'Server error saving approval request' });
  }
});

// @desc    Approve/Reject pending request and execute action automatically
// @route   PUT /api/aicoo/approvals/:id
// @access  Private
router.put('/aicoo/approvals/:id', protect, async (req, res) => {
  const { status } = req.body;

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be Approved or Rejected' });
  }

  try {
    const request = await ApprovalRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Approval request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'This request has already been processed' });
    }

    request.status = status;
    await request.save();

    let executionResult = null;
    if (status === 'Approved') {
      if (request.type === 'Create Decision') {
        const { title, description, reason, projectId, ownerId, impact } = request.details;
        
        const decision = await Decision.create({
          title,
          description,
          reason,
          projectId,
          ownerId: ownerId || request.requesterId,
          impact: impact || 'Medium'
        });
        
        executionResult = { type: 'decision_created', data: decision };

        await AicooLog.create({
          type: 'Pulse Activity',
          senderId: request.requesterId,
          message: `Human approved "Create Decision" workflow. Decision "${title}" successfully stored in organizational memory.`
        });
      } else if (request.type === 'Assign Reviewer') {
        const { reviewerId, projectId, expertiseArea } = request.details;

        const review = await Review.create({
          reviewerId,
          projectId,
          expertiseArea,
          rating: 5
        });

        const project = await Project.findById(projectId);
        if (project && !project.members.includes(reviewerId)) {
          project.members.push(reviewerId);
          await project.save();
        }

        executionResult = { type: 'reviewer_assigned', data: review };

        await AicooLog.create({
          type: 'Pulse Activity',
          senderId: request.requesterId,
          receiverId: reviewerId,
          message: `Human approved "Assign Reviewer" workflow. Reviewer assigned to project.`
        });
      }
    }

    res.json({ request, executionResult });
  } catch (error) {
    console.error('Update approval request error:', error);
    res.status(500).json({ message: 'Server error processing approval' });
  }
});

export default router;
