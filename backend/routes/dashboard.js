import express from 'express';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Decision from '../models/Decision.js';
import Twin from '../models/Twin.js';
import ApprovalRequest from '../models/ApprovalRequest.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get dashboard metrics count overview
// @route   GET /api/dashboard/overview
// @access  Private
router.get('/overview', protect, async (req, res) => {
  try {
    const userCount = await User.countDocuments({});
    const projectCount = await Project.countDocuments({});
    const decisionCount = await Decision.countDocuments({});
    
    // Count pending approvals
    const pendingApprovalsCount = await ApprovalRequest.countDocuments({ status: 'Pending' });

    // Extract counts of unique skills across all twins
    const twins = await Twin.find({});
    const uniqueSkills = new Set();
    twins.forEach(t => {
      t.skills.forEach(s => uniqueSkills.add(s));
    });

    res.json({
      users: userCount,
      projects: projectCount,
      decisions: decisionCount,
      pendingApprovals: pendingApprovalsCount,
      uniqueSkills: uniqueSkills.size
    });
  } catch (error) {
    console.error('Fetch dashboard overview error:', error);
    res.status(500).json({ message: 'Server error generating overview data' });
  }
});

// @desc    Get top rated metrics and recent decisions
// @route   GET /api/dashboard/metrics
// @access  Private
router.get('/metrics', protect, async (req, res) => {
  try {
    // 1. Get top experts by twin expertiseScore
    const topExperts = await Twin.find({})
      .populate('userId', 'name role availability')
      .sort({ expertiseScore: -1 })
      .limit(4);

    // 2. Get recent decisions
    const recentDecisions = await Decision.find({})
      .populate('projectId', 'name')
      .populate('ownerId', 'name')
      .sort({ createdAt: -1 })
      .limit(4);

    // 3. Get most active projects (by member count)
    const activeProjects = await Project.find({})
      .populate('members', 'name')
      .sort({ members: -1 }) // Sort projects by members array length in memory or count
      .limit(3);

    res.json({
      topExperts,
      recentDecisions,
      activeProjects
    });
  } catch (error) {
    console.error('Fetch dashboard metrics error:', error);
    res.status(500).json({ message: 'Server error generating metric rankings' });
  }
});

export default router;
