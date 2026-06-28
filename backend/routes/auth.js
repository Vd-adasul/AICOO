import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Twin from '../models/Twin.js';
import { protect } from '../middleware/auth.js';
import { generateTwinSummary } from '../utils/gemini.js';

const router = express.Router();

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user & twin
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, role, bio, availability, yearsExperience, skills, expertise, preferences } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password, // hashed automatically by Mongoose pre-save hook
      role,
      bio,
      availability: availability || 'Available',
      yearsExperience: yearsExperience || 0,
    });

    if (user) {
      // Create associated twin
      const twinDetails = {
        userId: user._id,
        skills: skills || [],
        expertise: expertise || [],
        preferences: preferences || [],
        expertiseScore: expertise && expertise.length > 0 
          ? Math.round(expertise.reduce((acc, curr) => acc + curr.score, 0) / expertise.length)
          : 50,
      };

      // Optional: Generate AI summary
      let aiSummary = `Digital Twin of ${user.name}, specializing in ${user.role}.`;
      if (process.env.GEMINI_API_KEY) {
        try {
          aiSummary = await generateTwinSummary(user, twinDetails);
        } catch (err) {
          console.error('Failed to generate twin summary during registration:', err);
        }
      }
      
      const twin = await Twin.create({
        ...twinDetails,
        summary: aiSummary
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        twin,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Find associated twin
      const twin = await Twin.findOne({ userId: user._id });
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        twin,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const twin = await Twin.findOne({ userId: req.user._id });
    res.json({
      user: req.user,
      twin,
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

export default router;
