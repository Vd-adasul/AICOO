import express from 'express';
import Twin from '../models/Twin.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Decision from '../models/Decision.js';
import { protect } from '../middleware/auth.js';
import { generateTwinSummary } from '../utils/gemini.js';

const router = express.Router();

// @desc    Get all twins
// @route   GET /api/twins
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const twins = await Twin.find({}).populate('userId', '-password');
    res.json(twins);
  } catch (error) {
    console.error('Fetch twins error:', error);
    res.status(500).json({ message: 'Server error fetching twins' });
  }
});

// @desc    Get specific twin by ID (or userId)
// @route   GET /api/twins/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    let twin = await Twin.findById(req.params.id).populate('userId', '-password').populate('relationships.userId', '-password');
    
    // Fallback: search by userId
    if (!twin) {
      twin = await Twin.findOne({ userId: req.params.id }).populate('userId', '-password').populate('relationships.userId', '-password');
    }
    
    if (!twin) {
      return res.status(404).json({ message: 'Twin not found' });
    }
    res.json(twin);
  } catch (error) {
    console.error('Fetch twin error:', error);
    res.status(500).json({ message: 'Server error fetching twin details' });
  }
});

// @desc    Create a twin profile manually
// @route   POST /api/twins
// @access  Private
router.post('/', protect, async (req, res) => {
  const { userId, skills, expertise, preferences } = req.body;
  try {
    const twinExists = await Twin.findOne({ userId });
    if (twinExists) {
      return res.status(400).json({ message: 'Twin profile already exists for this user' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const expertiseScore = expertise && expertise.length > 0
      ? Math.round(expertise.reduce((acc, curr) => acc + curr.score, 0) / expertise.length)
      : 50;

    let aiSummary = `Digital Twin of ${user.name}, specializing in ${user.role}.`;
    if (process.env.GEMINI_API_KEY) {
      try {
        aiSummary = await generateTwinSummary(user, { skills, expertise, preferences });
      } catch (err) {
        console.error('Failed to generate summary:', err);
      }
    }

    const twin = await Twin.create({
      userId,
      skills: skills || [],
      expertise: expertise || [],
      preferences: preferences || [],
      expertiseScore,
      summary: aiSummary
    });

    res.status(201).json(twin);
  } catch (error) {
    console.error('Create twin error:', error);
    res.status(500).json({ message: 'Server error creating twin profile' });
  }
});

// @desc    Update a twin profile
// @route   PUT /api/twins/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let twin = await Twin.findById(req.params.id);
    if (!twin) {
      twin = await Twin.findOne({ userId: req.params.id });
    }

    if (!twin) {
      return res.status(404).json({ message: 'Twin not found' });
    }

    twin.skills = req.body.skills || twin.skills;
    twin.expertise = req.body.expertise || twin.expertise;
    twin.preferences = req.body.preferences || twin.preferences;
    twin.relationships = req.body.relationships || twin.relationships;

    if (req.body.expertise && req.body.expertise.length > 0) {
      twin.expertiseScore = Math.round(
        req.body.expertise.reduce((acc, curr) => acc + curr.score, 0) / req.body.expertise.length
      );
    }

    // Regenerate AI summary if skills or preferences changed
    if (req.body.skills || req.body.preferences || req.body.regenerateSummary) {
      const user = await User.findById(twin.userId);
      if (user && process.env.GEMINI_API_KEY) {
        try {
          twin.summary = await generateTwinSummary(user, twin);
        } catch (err) {
          console.error('Failed to regenerate summary during update:', err);
        }
      }
    }

    const updatedTwin = await twin.save();
    res.json(updatedTwin);
  } catch (error) {
    console.error('Update twin error:', error);
    res.status(500).json({ message: 'Server error updating twin profile' });
  }
});

// @desc    Get connection graph for a specific twin (Person -> Skills, Projects, Teammates, Decisions)
// @route   GET /api/twins/:id/graph
// @access  Private
router.get('/:id/graph', protect, async (req, res) => {
  try {
    let twin = await Twin.findById(req.params.id).populate('relationships.userId', 'name role');
    if (!twin) {
      twin = await Twin.findOne({ userId: req.params.id }).populate('relationships.userId', 'name role');
    }

    if (!twin) {
      return res.status(404).json({ message: 'Twin not found' });
    }

    const user = await User.findById(twin.userId).select('name role');
    
    // Find all projects user belongs to
    const projects = await Project.find({ members: twin.userId }).select('name status');
    
    // Find decisions owned by user
    const decisions = await Decision.find({ ownerId: twin.userId }).select('title projectId');

    // Compile node-link graph data structure
    const nodes = [];
    const links = [];

    // Core Person node
    nodes.push({ id: user._id.toString(), label: user.name, type: 'person', role: user.role });

    // Skill nodes & connections
    twin.skills.forEach(skill => {
      nodes.push({ id: `skill-${skill}`, label: skill, type: 'skill' });
      links.push({ source: user._id.toString(), target: `skill-${skill}`, relation: 'possesses' });
    });

    // Project nodes & connections
    projects.forEach(project => {
      nodes.push({ id: project._id.toString(), label: project.name, type: 'project', status: project.status });
      links.push({ source: user._id.toString(), target: project._id.toString(), relation: 'member_of' });
      
      // Connect project to the skills required
      twin.skills.forEach(skill => {
        // If skill nodes exist, connect skills relevant to project
        // Simulating matching project-skill relation
        links.push({ source: project._id.toString(), target: `skill-${skill}`, relation: 'requires' });
      });
    });

    // Decision nodes & connections
    decisions.forEach(decision => {
      nodes.push({ id: decision._id.toString(), label: decision.title, type: 'decision' });
      links.push({ source: user._id.toString(), target: decision._id.toString(), relation: 'authored' });
      
      if (decision.projectId) {
        links.push({ source: decision._id.toString(), target: decision.projectId.toString(), relation: 'impacts' });
      }
    });

    // Teammates / Relationships nodes & connections
    if (twin.relationships && twin.relationships.length > 0) {
      twin.relationships.forEach(rel => {
        if (rel.userId) {
          nodes.push({
            id: rel.userId._id.toString(),
            label: rel.userId.name,
            type: 'person',
            role: rel.userId.role
          });
          links.push({
            source: user._id.toString(),
            target: rel.userId._id.toString(),
            relation: rel.type || 'Teammate'
          });
        }
      });
    }

    res.json({ nodes, links });
  } catch (error) {
    console.error('Twin graph creation error:', error);
    res.status(500).json({ message: 'Server error generating graph data' });
  }
});

// @desc    Get expertise score breakdown for a specific twin
// @route   GET /api/twins/:id/expertise
// @access  Private
router.get('/:id/expertise', protect, async (req, res) => {
  try {
    let twin = await Twin.findById(req.params.id);
    if (!twin) {
      twin = await Twin.findOne({ userId: req.params.id });
    }

    if (!twin) {
      return res.status(404).json({ message: 'Twin not found' });
    }

    const projectsCount = await Project.countDocuments({ members: twin.userId });
    const decisionsCount = await Decision.countDocuments({ ownerId: twin.userId });
    
    // Send detailed breakdown
    res.json({
      overallScore: twin.expertiseScore,
      skillsCount: twin.skills.length,
      projectsInvolvement: projectsCount,
      authoredDecisions: decisionsCount,
      expertiseBreakdown: twin.expertise
    });
  } catch (error) {
    console.error('Expertise breakdown error:', error);
    res.status(500).json({ message: 'Server error generating expertise breakdown' });
  }
});

export default router;
